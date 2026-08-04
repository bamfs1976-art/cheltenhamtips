#!/usr/bin/env node
// Pre-flight gate (CLAUDE.md Step 3b), run against declared fields from the API
// instead of transcribed screenshots.
//
//   node scripts/gate-check.mjs --course goodwood
//   node scripts/gate-check.mjs --course york --day tomorrow --json
//
// Exits 1 if any race fails the gate, so it can guard a build.

import fs from 'node:fs/promises';
import { racecards, archive, ukDate } from './lib/racing-api.mjs';

// Sky Bet's observed enhanced each-way ladder. These are the terms the engine
// prices against; they are an offer, not a rule, so the card must still state
// what actually applied at the off (CLAUDE.md rule 16).
const PLACE_BANDS = [
  { min: 16, places: 5, frac: '1/5' },
  { min: 8, places: 4, frac: '1/5' },
  { min: 5, places: 2, frac: '1/4' },
  { min: 1, places: 0, frac: '—' },
];

// Runner counts at which the place count changes. A race sitting just above one
// of these can lose a place to withdrawals after it has been priced — which is
// exactly what happened to the Goodwood Day 5 17:20.
const BOUNDARIES = [16, 8, 5];
const AT_RISK_MARGIN = 2;

function placeTerms(runners) {
  const band = PLACE_BANDS.find((b) => runners >= b.min) ?? PLACE_BANDS.at(-1);
  return { places: band.places, frac: band.frac };
}

function boundaryRisk(runners) {
  const b = BOUNDARIES.find((x) => runners >= x && runners <= x + AT_RISK_MARGIN);
  if (!b) return null;
  const below = placeTerms(b - 1);
  return { boundary: b, margin: runners - b, dropsTo: below.places };
}

function isFlat(race) {
  const t = String(race.type ?? '').toLowerCase();
  if (t) return t.includes('flat');
  // Fall back on the distance/name if the API omits type.
  return !/hurdle|chase|nh flat|bumper/i.test(race.race_name ?? '');
}

function checkRace(race) {
  const runners = Array.isArray(race.runners) ? race.runners : [];
  const n = runners.length;
  const flat = isFlat(race);
  const terms = placeTerms(n);
  const risk = boundaryRisk(n);

  const missingDraw = flat
    ? runners.filter((r) => r.draw === undefined || r.draw === null || r.draw === '').map((r) => r.horse)
    : [];

  const failures = [];
  if (n === 0) failures.push('no declared runners');
  if (flat && missingDraw.length) {
    failures.push(`${missingDraw.length} runner(s) without a draw`);
  }

  return {
    raceId: race.race_id,
    off: race.off ?? race.off_dt ?? '??:??',
    course: race.course,
    name: race.race_name,
    cls: race.class,
    dist: race.dist_f ? `${race.dist_f}f` : (race.distance ?? '—'),
    going: race.going ?? '—',
    code: flat ? 'flat' : 'jumps',
    runners: n,
    places: terms.places,
    ewFrac: terms.frac,
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
  lines.push(
    r.longSlotOpen
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
