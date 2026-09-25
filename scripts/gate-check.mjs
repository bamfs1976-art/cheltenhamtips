#!/usr/bin/env node
// Pre-flight gate (CLAUDE.md Step 3b), run against declared fields from the API
// instead of transcribed screenshots.
//
//   node scripts/gate-check.mjs --course goodwood
//   node scripts/gate-check.mjs --course york --day tomorrow --json
//
// Exits 1 if any race fails the gate, so it can guard a build.

import fs from 'node:fs/promises';
import { racecards, archive, ukDate, raceOff, raceDistanceF, raceClass, raceType, raceGoing, raceFieldSize, raceStatus } from './lib/racing-api.mjs';

// Sky Bet's STANDARD each-way ladder, race-type aware.
//
// PROVENANCE DIFFERS PER BAND — read this before trusting a row.
//
// The 16+ HANDICAP band is the only one confirmed against a real bookmaker
// offer, which is what §12 has asked for since Haydock Day 1 and finally got
// on 25 Sep 2026. Sky Bet's Cambridgeshire market (28 runners, Class 2
// handicap) read "Each Way: 1/5 Odds, 7 Places" above a banner reading "We are
// paying 7 places instead of 4 on all each way bets if there are 16 runners or
// more". The 7 is the promotion; the 4 it names is Sky Bet's own standard term.
// So the base at 16+ is FOUR, and the 5 this table carried from the start was
// wrong — in the dangerous direction, exactly as every inference since Haydock
// had said, and NOT ONE of the 38 archived races ever paid five.
//
// Every other band still rests on the Tote-dividend model (St Leger + the
// Cambridgeshire Friday, 38 races, no exceptions) and NOT on an offer. That
// model predicted 4 at 16+ and the offer confirmed it, which is real evidence
// for the model — but one offer confirms one band, so the rest stay estimates.
// Keep reading the terms off the actual market and re-checking at the off
// (rule 16).
//
// ENHANCED OFFERS SIT ABOVE THIS TABLE and are deliberately not modelled: the
// same Cambridgeshire paid 7. This is a floor, never the answer.
const PLACE_BANDS = {
  handicap: [
    { min: 16, places: 4, frac: '1/5', src: 'Sky Bet offer 25 Sep 2026' },
    { min: 8, places: 3, frac: '1/5', src: 'Tote model, 38 races' },
    { min: 5, places: 2, frac: '1/4', src: 'Tote model, 38 races' },
    { min: 1, places: 0, frac: '—', src: 'win only' },
  ],
  // Five places at 16+ is a HANDICAP term. A big-field stakes or sales race
  // read as LONG-open under the old single ladder while standard terms pay
  // three — §12 called this the single most likely place for the gate to wave
  // through a bet it should refuse. Doncaster's 13:50 is the worked example: a
  // 17-runner conditions sales race paid THREE, and the card held the slot back
  // by hand because the ladder would not.
  other: [
    { min: 8, places: 3, frac: '1/5', src: 'Tote model, 38 races' },
    { min: 5, places: 2, frac: '1/4', src: 'Tote model, 38 races' },
    { min: 1, places: 0, frac: '—', src: 'win only' },
  ],
};

// Runner counts at which the place count changes. A race sitting just above one
// of these can lose a place to withdrawals after it has been priced — which is
// exactly what happened to the Goodwood Day 5 17:20, and again to the St Leger
// Day 1 15:00. The boundaries differ by race type because the bands do.
const BOUNDARIES = { handicap: [16, 8, 5], other: [8, 5] };
const AT_RISK_MARGIN = 2;

// Nurseries are handicaps. "Hcap"/"H'cap" are how the API and the Racing Post
// abbreviate it; the long form appears in sponsored race names.
function isHandicap(race) {
  return /handicap|\bh'?cap\b|nursery/i.test(
    `${race.race_name ?? ''} ${race.race_type ?? ''} ${race.pattern ?? ''}`,
  );
}

function bandsFor(race) {
  return isHandicap(race) ? PLACE_BANDS.handicap : PLACE_BANDS.other;
}

function placeTerms(runners, race = {}) {
  const bands = bandsFor(race);
  const band = bands.find((b) => runners >= b.min) ?? bands.at(-1);
  return { places: band.places, frac: band.frac, src: band.src };
}

function boundaryRisk(runners, race = {}) {
  const list = isHandicap(race) ? BOUNDARIES.handicap : BOUNDARIES.other;
  const b = list.find((x) => runners >= x && runners <= x + AT_RISK_MARGIN);
  if (!b) return null;
  const below = placeTerms(b - 1, race);
  return { boundary: b, margin: runners - b, dropsTo: below.places };
}

function isFlat(race) {
  const t = String(raceType(race) ?? '').toLowerCase();
  if (t) return t.includes('flat');
  // Fall back on the distance/name if the API omits type.
  return !/hurdle|chase|nh flat|bumper/i.test(race.race_name ?? '');
}

function checkRace(race) {
  const runners = Array.isArray(race.runners) ? race.runners : [];
  // field_size is authoritative on the free plan; fall back to the array length.
  const n = raceFieldSize(race);
  const flat = isFlat(race);
  const terms = placeTerms(n, race);
  const risk = boundaryRisk(n, race);

  const missingDraw = flat
    ? runners.filter((r) => r.draw === undefined || r.draw === null || r.draw === '').map((r) => r.horse)
    : [];

  // A runner that is not listed at all has no draw either. Counting only the
  // listed-but-drawless ones let a race with field_size N and an EMPTY runners
  // array pass the gate clean — which is exactly the shape of a fixture built
  // from WebSearch, the fallback §12 tells you to use when the API is blocked
  // (it gives field sizes and never gives draws). Found 24 Sep 2026 building
  // the Cambridgeshire card: seven Newmarket races passed on web-sourced field
  // sizes with not one draw behind them.
  const unlisted = n > 0 ? Math.max(0, n - runners.length) : 0;

  const failures = [];
  if (n === 0) failures.push('no declared runners');
  if (n > 0 && runners.length !== n) {
    failures.push(`field_size ${n} does not match ${runners.length} listed runner(s)`);
  }
  if (flat && missingDraw.length + unlisted > 0) {
    failures.push(`${missingDraw.length + unlisted} runner(s) without a draw`);
  }

  return {
    raceId: race.race_id,
    off: raceOff(race) ?? '??:??',
    course: race.course,
    name: race.race_name,
    cls: raceClass(race),
    dist: raceDistanceF(race) ? `${raceDistanceF(race)}f` : '—',
    going: raceGoing(race) ?? '—',
    status: raceStatus(race),
    code: flat ? 'flat' : 'jumps',
    runners: n,
    places: terms.places,
    ewFrac: terms.frac,
    termsSource: terms.src,
    handicap: isHandicap(race),
    boundaryRisk: risk,
    missingDraw,
    // The LONG slot needs 5+ places, or 4+ in a field of 16 or more.
    longSlotOpen: terms.places >= 5 || (terms.places >= 4 && n >= 16),
    pass: failures.length === 0,
    failures,
  };
}

function fmt(r) {
  const head = `${r.off}  ${r.course} — ${r.name}`;
  const placeTxt = r.places === 0 ? 'win only' : `EW ${r.ewFrac}, at least ${r.places} places`;
  const meta = `      ${r.dist} · ${r.cls ?? 'class ?'} · ${r.code} · going ${r.going} · ${r.runners} runners · ${placeTxt}`;
  const lines = [r.pass ? `\x1b[32m✓\x1b[0m ${head}` : `\x1b[31m✗\x1b[0m ${head}`, meta];

  if (!r.pass) {
    lines.push(`      \x1b[31mNO BET — ${r.failures.join('; ')}\x1b[0m`);
  }
  // Heritage handicaps often carry a one-off offer well above the standard
  // ladder — the Stewards' Cup paid 7. The ladder is a floor, not the answer.
  if (r.runners >= 20) {
    lines.push(
      `      \x1b[36mℹ big field (${r.runners})\x1b[0m — check for a big-race place special; ` +
        `this class of handicap is often 6-8 places, above the standard ladder.`
    );
  }
  if (r.boundaryRisk) {
    const dropTxt =
      r.boundaryRisk.dropsTo === 0 ? 'win only' : `${r.boundaryRisk.dropsTo} places`;
    lines.push(
      `      \x1b[33m⚠ place band at risk\x1b[0m — ${r.boundaryRisk.margin} runner(s) above the ` +
        `${r.boundaryRisk.boundary}-runner boundary; ${r.boundaryRisk.margin + 1} withdrawal(s) ` +
        `drops this to ${dropTxt}. Treat any LONG as provisional and re-check at the off.`
    );
  }
  // §12: read the LONG line only on a race that PASSED the gate. A failed race
  // has no confirmed field, so the place test would be arithmetic on a field
  // that does not exist yet — which is exactly the entry-stage forecast the
  // St Leger got wrong. Nothing can be staked on a NO BET race, so printing it
  // costs nothing directly; it just invites the reader to believe a number.
  lines.push(
    !r.pass
      ? `      LONG slot: \x1b[90mnot assessed\x1b[0m — race failed the gate, no confirmed field to test`
      : r.longSlotOpen
        ? `      LONG slot: \x1b[32mopen\x1b[0m (needs 8/1+ and a concrete signal)`
        : `      LONG slot: \x1b[90mclosed\x1b[0m — ${r.places} places, run two picks only`
  );
  return lines.join('\n');
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (name, fallback) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
  };
  const course = arg('course');
  const day = arg('day', 'today');
  const asJson = argv.includes('--json');
  const fixture = arg('fixture');

  // --fixture replays an archived payload instead of calling the API.
  const payload = fixture
    ? JSON.parse(await fs.readFile(fixture, 'utf8'))
    : await racecards({ day });
  const all = payload.racecards ?? payload.data ?? [];
  const races = course
    ? all.filter((r) => String(r.course ?? '').toLowerCase().includes(course.toLowerCase()))
    : all;

  const stamp = day === 'tomorrow' ? `${ukDate()}+1` : ukDate();
  if (!fixture) {
    await archive(`racecards-${stamp}${course ? '-' + course.toLowerCase() : ''}`, payload);
  }

  const checked = races.map(checkRace).sort((a, b) => String(a.off).localeCompare(String(b.off)));

  if (asJson) {
    console.log(JSON.stringify(checked, null, 2));
  } else if (!checked.length) {
    console.log(`No races found${course ? ` for "${course}"` : ''} on ${day}.`);
  } else {
    console.log(`\nPre-flight gate — ${checked[0].course ?? course} · ${day} (${stamp})\n`);
    checked.forEach((r) => console.log(fmt(r) + '\n'));
    const failed = checked.filter((r) => !r.pass);
    const atRisk = checked.filter((r) => r.boundaryRisk);
    const twoPick = checked.filter((r) => r.pass && !r.longSlotOpen);
    console.log(
      `${checked.length} races · ${checked.length - failed.length} pass · ` +
        `${failed.length} NO BET · ${twoPick.length} run two picks only · ${atRisk.length} near a place boundary`
    );
  }

  process.exitCode = checked.some((r) => !r.pass) ? 1 : 0;
}

main().catch((err) => {
  console.error(`\n${err.message}\n`);
  process.exitCode = 2;
});
