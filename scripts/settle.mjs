#!/usr/bin/env node
// Settlement from published finishing positions instead of screenshots.
//
//   node scripts/settle.mjs --course goodwood
//       → full finishing order for every race, every runner
//
//   node scripts/settle.mjs --course goodwood --picks data/picks/goodwood-day5.json
//       → each-way P&L for our card, settled at card odds
//
// Why this exists: results pages routinely publish only the first three home,
// while our races often pay four, five or seven places. Goodwood Day 5 left five
// finishing positions unconfirmed and £6.60 of potential returns unsettled. The
// API returns a position for every runner, so that gap closes.
//
// The free plan only serves *today's* results. Every payload is archived to
// data/racing-api/ so the history accumulates from here on.

import fs from 'node:fs/promises';
import { placeTerms, fracDivisor } from './lib/place-terms.mjs';
import { resultsToday, archive, sameHorse, ukDate, raceOff, raceDistanceF, raceGoing } from './lib/racing-api.mjs';

const STAKE_DEFAULT = 0.5; // 50p each-way per engine single

/** "11/2" | "evens" | "2/5" | "3.5" → decimal odds-to-one (fractional value). */
export function parseOdds(v) {
  if (v === undefined || v === null || v === '') return null;
  const s = String(v).trim().toLowerCase();
  if (s === 'evens' || s === 'evs' || s === 'even') return 1;
  if (s === 'sp') return null;
  const frac = s.match(/^(\d+(?:\.\d+)?)\s*[/-]\s*(\d+(?:\.\d+)?)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const dec = Number(s);
  return Number.isFinite(dec) ? dec : null;
}

function money(n) {
  return (n < 0 ? '−£' : '£') + Math.abs(n).toFixed(2);
}

/* The ladder that used to live here was the OLD one — 5 at 16+, 4 at 8+ —
   which the St Leger dividends disproved on 10 Sep and gate-check.mjs stopped
   using on 25 Sep. This file kept it for eleven days while computing money.
   It now imports the same model everything else uses. */
function placesForRunners(n, race = {}) {
  return placeTerms(n, race).places;
}

function normaliseRace(race) {
  const runners = (race.runners ?? []).map((r) => ({
    horse: r.horse,
    horseId: r.horse_id,
    position: r.position,
    draw: r.draw,
    sp: r.sp ?? null,
    jockey: r.jockey,
    trainer: r.trainer,
  }));
  // Non-runners come back with a non-numeric position (NR / VOI / withdrawn).
  const ran = runners.filter((r) => Number.isFinite(Number(r.position)));
  const nonRunners = runners.filter((r) => !Number.isFinite(Number(r.position)));
  ran.sort((a, b) => Number(a.position) - Number(b.position));
  return {
    raceId: race.race_id,
    off: raceOff(race) ?? '??:??',
    course: race.course,
    name: race.race_name,
    /* isHandicap() reads race_name / race_type / pattern, so carry them through
       under their API names as well. Renaming race_name to `name` alone made
       every handicap settle on the NON-handicap bands — a 16+ handicap read 3
       places instead of 4, silently, in the direction that pays out less. */
    race_name: race.race_name,
    race_type: race.race_type,
    pattern: race.pattern,
    going: raceGoing(race),
    dist: raceDistanceF(race) ? `${raceDistanceF(race)}f` : null,
    ranCount: ran.length,
    order: ran,
    nonRunners,
  };
}

/** Settle one each-way single. Returns the cash returned (stake included). */
function settleEachWay({ position, odds, ewFrac, places, stake }) {
  if (odds === null) return { win: 0, place: 0, note: 'no card price — settle at SP by hand' };
  if (position === null) return { win: 0, place: 0, note: 'non-runner — stake returned', voided: true };
  /* A missing fraction used to default silently to 1/5. On a race that settled
     at 1/4 that understates EVERY place return by 20%, with nothing on screen
     to say so — and mazetick's 324-race study says the fraction is exactly what
     a promotion moves. So an unplaced runner settles fine without one, and a
     PLACED one refuses. */
  if (position <= places && !Number.isFinite(ewFrac)) {
    return { win: 0, place: 0, unresolved: true,
             note: 'PLACED but no each-way fraction recorded — read it off the offer and set ewFrac' };
  }
  const win = position === 1 ? stake * (odds + 1) : 0;
  const place = position <= places ? stake * (odds / ewFrac + 1) : 0;
  return { win, place };
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (n, d) => {
    const i = argv.indexOf(`--${n}`);
    return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
  };
  const course = arg('course');
  const picksFile = arg('picks');
  const fixture = arg('fixture');
  const stake = Number(arg('stake', STAKE_DEFAULT));

  // --fixture replays a previously archived payload instead of calling the API.
  // The free plan serves today only, so this is how a past day gets re-settled.
  const payload = fixture
    ? JSON.parse(await fs.readFile(fixture, 'utf8'))
    : await resultsToday();
  const all = payload.results ?? payload.data ?? [];
  if (!fixture) {
    await archive(`results-${ukDate()}${course ? '-' + course.toLowerCase() : ''}`, payload);
  }

  const races = (course
    ? all.filter((r) => String(r.course ?? '').toLowerCase().includes(course.toLowerCase()))
    : all
  )
    .map(normaliseRace)
    .sort((a, b) => String(a.off).localeCompare(String(b.off)));

  if (!races.length) {
    console.log(`No results found${course ? ` for "${course}"` : ''} today.`);
    return;
  }

  if (!picksFile) {
    // Plain finishing-order dump — the thing that removes the screenshot step.
    console.log(`\nFull finishing order — ${races[0].course} · ${ukDate()}\n`);
    for (const r of races) {
      console.log(`${r.off}  ${r.name}  (${r.dist ?? '—'}, going ${r.going ?? '—'}, ${r.ranCount} ran, ${placesForRunners(r.ranCount, r)} places)`);
      for (const run of r.order) {
        const drawTxt = run.draw !== undefined && run.draw !== '' ? ` [draw ${run.draw}]` : '';
        console.log(`   ${String(run.position).padStart(3)}  ${run.horse}${drawTxt}  ${run.sp ?? ''}`);
      }
      if (r.nonRunners.length) {
        console.log(`   NR: ${r.nonRunners.map((n) => n.horse).join(', ')}`);
      }
      console.log('');
    }
    return;
  }

  // ── Settle our card ──────────────────────────────────────────
  const card = JSON.parse(await fs.readFile(picksFile, 'utf8'));
  let staked = 0;
  let returned = 0;
  const unresolved = [];
  /* A pick that PLACED but whose fraction was never recorded returns £0.00 here,
     which reads exactly like a loser. Keep it out of that reading: count the
     stake that cannot be settled, say so under the total, and exit non-zero. */
  const unpriced = [];
  let unpricedStake = 0;

  console.log(`\nSettlement — ${card.event ?? races[0].course} · ${card.date ?? ukDate()}\n`);

  for (const race of card.races ?? []) {
    const result = races.find((r) => r.off === race.off);
    if (!result) {
      console.log(`${race.off}  \x1b[33mno result found — skipped\x1b[0m`);
      unresolved.push(race.off);
      continue;
    }
    // Places are derived from what actually ran, not from what was declared.
    const places = race.places ?? placesForRunners(result.ranCount, result);
    /* No ?? 5 here on purpose — see settleEachWay. A card that did not record
       the fraction must say so, not quietly assume the better of the two. */
    const ewFrac = race.ewFrac === undefined ? NaN : fracDivisor(race.ewFrac) ?? Number(race.ewFrac);
    const baseTerms = placeTerms(result.ranCount, result);
    const declaredPlaces = race.declaredPlaces ?? null;

    console.log(`${race.off}  ${result.name} — ${result.ranCount} ran, ${places} places`);
    if (!baseTerms.fracStable) {
      console.log(`      \x1b[33m⚠ fraction moves in this band\x1b[0m — base ${baseTerms.frac}, `
        + `settling at 1/${ewFrac}. ${baseTerms.src}`);
    }
    if (declaredPlaces !== null && declaredPlaces !== places) {
      console.log(
        `      \x1b[33m⚠ place band moved: priced at ${declaredPlaces} places, settled at ${places}\x1b[0m`
      );
    }

    for (const pick of race.picks ?? []) {
      const runner = result.order.find((r) => sameHorse(r.horse, pick.horse));
      const nr = result.nonRunners.find((r) => sameHorse(r.horse, pick.horse));
      const odds = parseOdds(pick.odds);
      const position = runner ? Number(runner.position) : nr ? null : Infinity;

      const s = settleEachWay({ position, odds, ewFrac, places, stake });
      const bet = stake * 2;
      const back = s.voided ? bet : s.win + s.place;
      staked += bet;
      returned += back;

      if (!runner && !nr) {
        unresolved.push(`${race.off} ${pick.horse}`);
      }
      if (s.unresolved) {
        unpriced.push(`${race.off} ${pick.horse} (pos ${runner?.position})`);
        unpricedStake += stake;
      }

      const posTxt = s.voided ? 'NR' : runner ? `${runner.position}` : '?';
      const tag = s.win > 0 ? '\x1b[32mWON\x1b[0m'
        : s.place > 0 ? '\x1b[36mplaced\x1b[0m'
        : s.voided ? 'void'
        : s.unresolved ? '\x1b[33mUNRESOLVED\x1b[0m' : 'unplaced';
      console.log(
        `      ${String(pick.type ?? '').padEnd(5)} ${pick.horse.padEnd(22)} ${String(pick.odds ?? 'SP').padStart(6)}` +
          `  pos ${posTxt.padStart(3)}  ${tag.padEnd(18)} returned ${money(back)}` +
          (s.note ? `  (${s.note})` : '')
      );
    }
    console.log('');
  }

  const net = returned - staked;
  console.log(`Staked ${money(staked)} · returned ${money(returned)} · net ${money(net)}` +
    (staked ? ` · ROI ${(net / staked >= 0 ? '+' : '−')}${Math.abs((net / staked) * 100).toFixed(1)}%` : ''));
  if (unresolved.length) {
    console.log(`\n\x1b[33mUnresolved (not found in the result — check the name):\x1b[0m ${unresolved.join(', ')}`);
  }
  if (unpriced.length) {
    console.log(
      `\n\x1b[33m${unpriced.length} place part(s) PLACED but could not be settled\x1b[0m — ` +
        `${money(unpricedStake)} of the stake above is booked at zero and is not a loss. ` +
        `Read the each-way fraction off the offer and set ewFrac on the race:\n  ${unpriced.join('\n  ')}`
    );
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(`\n${err.message}\n`);
  process.exitCode = 2;
});
