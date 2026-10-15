#!/usr/bin/env node
// Settlement from published finishing positions instead of screenshots.
//
//   node scripts/settle.mjs --course goodwood
//       → full finishing order for every race, every runner
//
//   node scripts/settle.mjs --course goodwood --picks data/picks/goodwood-day5.json
//       → each-way P&L for our card, settled at card odds
//
//   ... --json out.json
//       → the same ledger as a file, at full precision. Anything that computes a
//         published figure off this settlement reads that file; it does not re-sum
//         the per-penny lines above, which disagree with the total by a rounding
//         step (0.1pp on Future Champions Friday, which is how this was found).
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
    /* A published result is usually only the first few home, so the ORDER and
       the RAN COUNT are two different numbers and the place band needs the
       second one. `ran` on the payload states it; the API serves a position for
       every runner so the fallback is exact there. Before this the only way to
       make a hand-built fixture come out with the right band was to pad the
       order with invented finishers at invented positions, which is precisely
       the fabricated data this engine refuses everywhere else. */
    ranCount: Number.isFinite(Number(race.ran)) ? Number(race.ran) : ran.length,
    order: ran,
    /* How deep the result was actually published, as a contiguous run from 1st.
       This is what decides whether a pick missing from the result is a confirmed
       loser or genuinely unsettled — see the call site. */
    publishedDepth: publishedDepth(ran),
    nonRunners,
  };
}

/** Longest run of positions 1..k present in the published order. */
function publishedDepth(order) {
  const seen = new Set(order.map((r) => Number(r.position)));
  let k = 0;
  while (seen.has(k + 1)) k += 1;
  return k;
}

/** Settle one each-way single. Returns the cash returned (stake included). */
function settleEachWay({ position, odds, ewFrac, places, stake }) {
  /* NON-RUNNER FIRST. These two guards used to sit the other way round, and a
     pick taken at SP that did not run returned the 'no card price' note instead
     of voiding — so its stake was booked as a loss. A void is a property of the
     RACE, not of the price: the stake comes back whatever it was taken at.
     Caught 17 Oct 2026 settling Future Champions, where it hit Mister Mojito
     and National Honour — both SP, both withdrawn — for £1.00 each. */
  if (position === null) return { win: 0, place: 0, note: 'non-runner — stake returned', voided: true };
  /* No price we can settle on. If the horse finished outside the places the
     return is zero whichever price it was taken at, so say nothing; only a pick
     that actually got paid needs a price we do not have. An SP pick resolves
     from the result upstream, and results publish an SP only for the first few
     home — so this is reached by an SP pick that placed in a race whose result
     stops short of it, which is the £-unresolved case, not a loss. */
  if (odds === null) {
    if (position > places) return { win: 0, place: 0 };
    return { win: 0, place: 0, unresolved: true,
             note: 'PLACED but no price to settle on — read the SP and record it' };
  }
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
  /* --json <path> writes the ledger to a FILE rather than stdout, so the human
     settlement and the machine one cannot interleave. */
  const jsonOut = arg('json');

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
  /* Picks absent from the result but provably outside the places. Not a problem,
     worth printing: it is the difference between "we do not know" and "it lost". */
  const shallow = [];
  let unresolvedStake = 0;
  /* A pick that PLACED but whose fraction was never recorded returns £0.00 here,
     which reads exactly like a loser. Keep it out of that reading: count the
     stake that cannot be settled, say so under the total, and exit non-zero. */
  const unpriced = [];
  let unpricedStake = 0;
  /* --json emits the per-pick ledger at full precision. Added because a second
     script that re-summed the PRINTED figures disagreed with this one by 0.1pp
     on the same day: each per-pick line is rounded to the penny, and rounding
     fifteen of them and adding is not the same as adding and rounding once.
     Same shape as the share-check lesson in §10 — a consumer should read this
     file's output, not reimplement its arithmetic.

     AND THE FIRST FIX FOR THAT WAS BACKWARDS, which is worth recording because
     the wrong version looked more rigorous. The ledger first carried full
     float precision and the meeting read £18.42; the archive and the printed
     lines read £18.43. "Full precision" is not the truer number here — a
     bookmaker settles EACH BET and pays it to the penny, so the real return is
     the sum of penny-rounded returns, not the rounded sum of exact ones. The
     place part of a 7/4 shot at 1/4 is £0.71875 and what lands in the account
     is £0.72. So returns are rounded per pick, at the point of settlement,
     before anything adds them up. */
  const ledger = [];

  console.log(`\nSettlement — ${card.event ?? races[0].course} · ${card.date ?? ukDate()}\n`);

  for (const race of card.races ?? []) {
    const result = races.find((r) => r.off === race.off);
    if (!result) {
      console.log(`${race.off}  \x1b[33mno result found — skipped\x1b[0m`);
      unresolved.push(race.off);
      continue;
    }
    /* Places are derived from what ACTUALLY RAN, always. `places` on a card is
       what the race was PRICED at — that is what nr-check.mjs has always meant
       by the field, and what a card author writes down. This file used to read
       the same field as a settlement OVERRIDE, so the two scripts disagreed
       about one key: a nursery priced at 3 places that ran six horses settled
       at the priced 3 instead of the band's 2, and rule 16's "place band moved"
       line never fired, because the override had made them agree. Caught
       17 Oct 2026 settling Future Champions Saturday.

       An advertised special above the ladder (the Cambridgeshire's seven) is an
       `offer`, with its own `minRunners` threshold, and only settles if the
       threshold still holds on what ran. That is the same shape nr-check tests,
       so there is now one reading of the card across both scripts. */
    const base = placeTerms(result.ranCount, result);
    const offer = race.offer ?? null;
    const offerHolds = offer && Number.isFinite(Number(offer.places))
      && (offer.minRunners === undefined || result.ranCount >= Number(offer.minRunners));
    const places = offerHolds ? Number(offer.places) : base.places;
    /* No ?? 5 here on purpose — see settleEachWay. A card that did not record
       the fraction must say so, not quietly assume the better of the two. */
    const ewFrac = race.ewFrac === undefined ? NaN : fracDivisor(race.ewFrac) ?? Number(race.ewFrac);
    const baseTerms = base;
    const pricedPlaces = race.places ?? race.declaredPlaces ?? null;

    console.log(`${race.off}  ${result.name} — ${result.ranCount} ran, ${places} places`);
    if (!baseTerms.fracStable) {
      console.log(`      \x1b[33m⚠ fraction moves in this band\x1b[0m — base ${baseTerms.frac}, `
        + `settling at 1/${ewFrac}. ${baseTerms.src}`);
    }
    if (offer) {
      console.log(offerHolds
        ? `      \x1b[32m✓\x1b[0m settling on the advertised offer — ${offer.places} places`
          + (offer.minRunners === undefined ? ' (no runner threshold recorded)' : ` (needs ${offer.minRunners}+, ${result.ranCount} ran)`)
        : `      \x1b[31m✗ OFFER LOST\x1b[0m — ${offer.places} places needed ${offer.minRunners}+ runners, `
          + `${result.ranCount} ran. Settling on the base ${base.places}.`);
    }
    if (pricedPlaces !== null && pricedPlaces !== places) {
      console.log(
        `      \x1b[33m⚠ place band moved: priced at ${pricedPlaces} places, settled at ${places}\x1b[0m`
      );
    }

    for (const pick of race.picks ?? []) {
      const runner = result.order.find((r) => sameHorse(r.horse, pick.horse));
      const nr = result.nonRunners.find((r) => sameHorse(r.horse, pick.horse));
      /* A pick taken at SP settles at the starting price, and the result payload
         carries it — so resolve it here rather than printing "settle by hand".
         The by-hand step is where a settlement drifts from the page: Future
         Champions was first settled off a scratch file with the SPs typed back
         in, which is unauditable even when it happens to be right. Results
         publish an SP only for the first few home, so an unplaced SP pick still
         resolves to nothing — which is the correct return either way. */
      const spResolved = parseOdds(pick.odds) === null && /^sp$/i.test(String(pick.odds ?? ''))
        && runner?.sp ? parseOdds(runner.sp) : null;
      const odds = parseOdds(pick.odds) ?? spResolved;
      const position = runner ? Number(runner.position) : nr ? null : Infinity;

      const s = settleEachWay({ position, odds, ewFrac, places, stake });
      const bet = stake * 2;
      /* To the penny, per bet — see the note on `ledger` above. */
      const back = Math.round((s.voided ? bet : s.win + s.place) * 100) / 100;
      staked += bet;
      returned += back;

      /* A pick absent from the published result is a CONFIRMED LOSER when the
         result was published at least as deep as the race pays — it cannot have
         been in the places or it would be listed. It is only unsettled when the
         result stops SHORT of the place count, which is the Cambridgeshire case
         (Sky Bet paid seven, the result gave four, three picks unsettleable).
         Future Champions Saturday is the other side of the same test: the
         Cesarewitch paid four and the result gave four, so Beylerbeyi and
         Premiere Ligne are losers and not a £2.00 hole. Booking them as
         unresolved understates what the archive actually knows. */
      if (!runner && !nr) {
        if (result.publishedDepth >= places) shallow.push(`${race.off} ${pick.horse}`);
        else { unresolved.push(`${race.off} ${pick.horse}`); unresolvedStake += bet; }
      }
      if (s.unresolved) {
        unpriced.push(`${race.off} ${pick.horse} (pos ${runner?.position})`);
        unpricedStake += stake;
      }

      const outsideConfirmed = !runner && !nr && result.publishedDepth >= places;
      const posTxt = s.voided ? 'NR' : runner ? `${runner.position}` : outsideConfirmed ? `>${places}` : '?';
      const tag = s.win > 0 ? '\x1b[32mWON\x1b[0m'
        : s.place > 0 ? '\x1b[36mplaced\x1b[0m'
        : s.voided ? 'void'
        : s.unresolved ? '\x1b[33mUNRESOLVED\x1b[0m'
        : (!runner && !nr && !outsideConfirmed) ? '\x1b[33mUNRESOLVED\x1b[0m'
        : 'unplaced';
      /* Card files have used both keys; read either rather than printing blanks. */
      const slot = pick.type ?? pick.slot ?? '';
      const oddsTxt = spResolved !== null ? `SP=${runner.sp}` : String(pick.odds ?? 'SP');
      ledger.push({
        off: race.off, race: result.name, ran: result.ranCount, places,
        slot: String(slot), horse: pick.horse, odds: pick.odds ?? null,
        sp: runner?.sp ?? null, position: runner ? Number(runner.position) : null,
        outcome: s.win > 0 ? 'won' : s.place > 0 ? 'placed' : s.voided ? 'void'
          : (s.unresolved || (!runner && !nr && !outsideConfirmed)) ? 'unresolved'
          : 'unplaced',
        staked: bet, returned: back,
      });
      console.log(
        `      ${String(slot).padEnd(5)} ${pick.horse.padEnd(22)} ${oddsTxt.padStart(7)}` +
          `  pos ${posTxt.padStart(3)}  ${tag.padEnd(18)} returned ${money(back)}` +
          (s.note ? `  (${s.note})` : '')
      );
    }
    console.log('');
  }

  const net = returned - staked;
  if (jsonOut) {
    await fs.writeFile(jsonOut, JSON.stringify({
      event: card.event ?? races[0].course, date: card.date ?? ukDate(),
      staked, returned, net, picks: ledger,
    }, null, 1) + '\n');
    console.log(`Ledger written to ${jsonOut}\n`);
  }
  console.log(`Staked ${money(staked)} · returned ${money(returned)} · net ${money(net)}` +
    (staked ? ` · ROI ${(net / staked >= 0 ? '+' : '−')}${Math.abs((net / staked) * 100).toFixed(1)}%` : ''));
  if (shallow.length) {
    console.log(`\n${shallow.length} pick(s) not in the published result but CONFIRMED outside the places `
      + `(the result runs at least as deep as the race pays), so settled as losers: ${shallow.join(', ')}`);
  }
  if (unresolved.length) {
    console.log(`\n\x1b[33mUnresolved — not in the result, and the result does not run as deep as the race pays.\x1b[0m\n`
      + `  ${money(unresolvedStake)} of the stake above is booked at zero and is NOT a loss.\n`
      + `  Ask for the finishing order to the offer's place count: ${unresolved.join(', ')}`);
    process.exitCode = 1;
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
