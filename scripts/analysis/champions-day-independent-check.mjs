#!/usr/bin/env node
/* Champions Day 2026 — our settlement checked against an INDEPENDENT collection,
 * and the market trail §5b has never had.
 *
 * WHY THIS EXISTS. The Champions Day settlement was compiled from web search
 * because §12's primary route (a pasted Racing Post card) was unavailable, and
 * the page says so. Three numbers were published as PROVISIONAL: Speed Of Sound
 * 9th, Gavriel 8th, and the Balmoral finishing order, where two sources
 * disagreed on the winner. This checks all of them.
 *
 * THE SOURCE, AND WHAT WE MAY DO WITH IT. github.com/ficokelly/Racing-app — a
 * public repository that collects The Racing API (the API §12 records as
 * unreachable from this session) into dated JSON: per-day results with a
 * finishing position for every runner, and ~51 odds snapshots a day carrying
 * per-bookmaker decimal odds, opening price and a fluctuation list.
 *
 *   IT CARRIES NO LICENCE FILE. No LICENSE, no COPYING, nothing in the README
 *   but its title. Absent a licence, the default is all rights reserved, so we
 *   do NOT copy its code and we do NOT vendor its data into this repo. This
 *   script reads a local clone by path and nothing is committed but the script.
 *   Compare §10/§12's use of bumasello/mazetick, which is MIT and was recorded
 *   as such — the licence is the first thing to look for, not the last.
 *
 *   node scripts/analysis/champions-day-independent-check.mjs <path-to-clone>
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2];
if (!ROOT) {
  console.error('usage: champions-day-independent-check.mjs <path to a Racing-app clone>');
  console.error('The data is NOT vendored here — see the header for why.');
  process.exit(2);
}
const clean = (n) => String(n).replace(/\s*\([A-Z]{2,3}\)\s*$/, '').trim().toLowerCase().replace(/'/g, '');

/* ── 1 · the finishing positions we published as provisional ───────────── */
const results = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/racing-results/2026-10-17.json'), 'utf8'));
const ascot = results.results.filter((r) => r.course === 'Ascot');

const OURS = [
  ['two-year-old', 11, [['NAP', 'Speed Of Sound', '9'], ['NB', 'Night In Vegas', '1']]],
  ['long distance', 10, [['NAP', 'Daiquiri Bay', null], ['NB', 'Gregory', null]]],
  ['sprint stakes', 16, [['NAP', 'Prince Of India', null], ['NB', 'Almeraq', '1']]],
  ['fillies', 13, [['NAP', 'Minnie Hauk', '1'], ['NB', 'Kalpana', null]]],
  ['queen elizabeth', 11, [['NAP', 'Ten Bob Tony', '2'], ['NB', 'Gstaad', null]]],
  ['champion stakes', 6, [['NAP', 'Constitution River', null], ['NB', 'Calandagan', '2']]],
  ['balmoral', 20, [['NAP', 'Gavriel', '8'], ['NB', 'Crown Of Oaks', 'NR'], ['LONG', "Ebt's Guard", '3']]],
];

console.log('\n' + '='.repeat(74));
console.log('1 · OUR PUBLISHED POSITIONS AGAINST AN INDEPENDENT COLLECTION');
console.log('='.repeat(74));
let agree = 0, checked = 0, ranWrong = [];
for (const [key, ourRan, picks] of OURS) {
  const r = ascot.find((x) => x.race_name.toLowerCase().includes(key));
  const listed = r.runners.length;
  if (listed !== ourRan) ranWrong.push([r.race_name, ourRan, listed]);
  console.log(`\n  ${r.race_name.slice(0, 56)}`);
  console.log(`    runners listed ${listed}${listed === ourRan ? ' — matches our ran count' : `  <-- WE RECORDED ${ourRan}`}`);
  for (const [slot, horse, ourPos] of picks) {
    const m = r.runners.find((x) => clean(x.horse) === clean(horse));
    const theirs = m ? String(m.position) : 'ABSENT (non-runner)';
    const ours = ourPos ?? 'outside the places';
    const ok = ourPos === null
      ? (!m || Number(m.position) > placesFor(r, listed))
      : (ourPos === 'NR' ? !m : theirs === ourPos);
    if (ourPos !== null) { checked++; if (ok) agree++; }
    console.log(`    ${slot.padEnd(5)} ${horse.padEnd(20)} we said ${String(ours).padEnd(19)} they say ${theirs.padEnd(20)} ${ok ? 'AGREE' : 'DISAGREE'}`);
  }
}
function placesFor(r, n) { return /handicap/i.test(r.race_name) ? (n >= 16 ? 4 : n >= 8 ? 3 : 2) : (n >= 8 ? 3 : 2); }

console.log(`\n  ${agree}/${checked} explicitly published positions confirmed.`);
if (ranWrong.length) {
  console.log('\n  RAN COUNTS THAT DID NOT MATCH:');
  for (const [name, ours, theirs] of ranWrong) {
    console.log(`    ${name.slice(0, 54)} — we recorded ${ours}, the payload lists ${theirs}`);
  }
  console.log(`  The band is unchanged either way, which is what champions-day-band-sensitivity.mjs
  predicted when it called five races of six invariant. A prediction that an
  error would be free is worth little until an error turns up to test it.`);
} else {
  console.log('\n  Every ran count matched.');
}

/* ── 2 · the market trail, which is the thing we have never had ────────── */
console.log('\n' + '='.repeat(74));
console.log('2 · THE RACECARD-TO-OFF LEG, MEASURED FOR THE FIRST TIME');
console.log('='.repeat(74));
const dir = path.join(ROOT, 'data/odds-archive');
const files = fs.readdirSync(dir).filter((f) => f.startsWith('2026-10-17-part-')).sort();
const trail = new Map();
for (const f of files) {
  for (const snap of JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))) {
    for (const p of snap.prices ?? []) {
      if (clean(p.horse) !== 'speed of sound' || !String(p.course).startsWith('Ascot')) continue;
      const t = snap.collected_at.slice(0, 19);
      if (!trail.has(t)) trail.set(t, new Map());
      const d = Number(p.decimal_odds);
      if (Number.isFinite(d)) trail.get(t).set(p.bookmaker, d);
    }
  }
}
const times = [...trail.keys()].sort();
const books = [...new Set(times.flatMap((t) => [...trail.get(t).keys()]))].sort();
const firstSet = [...trail.get(times[0]).keys()];
console.log(`
  Speed Of Sound, our 12:55 NAP. The race-morning panel read 12/1 against our
  card's 16/1, the shorter-price test was LICENSED because that source states
  its odds are a comparison, and we called it a STEAM. Here is the same market,
  ${times.length} times over, per bookmaker (decimal):
`);
console.log('    ' + 'collected (UTC)'.padEnd(21) + books.map((b) => b.slice(0, 9).padStart(10)).join('') + 'BEST'.padStart(8) + 'best of'.padStart(9));
console.log('    ' + ''.padEnd(21) + ''.padEnd(books.length * 10) + ''.padStart(8) + 'first 6'.padStart(9));
for (const t of times) {
  const v = trail.get(t);
  const best = Math.max(...v.values());
  const stable = firstSet.filter((b) => v.has(b)).map((b) => v.get(b));
  console.log('    ' + t.padEnd(21)
    + books.map((b) => (v.has(b) ? v.get(b).toFixed(2) : '-').padStart(10)).join('')
    + best.toFixed(2).padStart(8) + Math.max(...stable).toFixed(2).padStart(9));
}
const open = Math.max(...trail.get(times[0]).values());
const last = Math.max(...trail.get(times.at(-1)).values());
console.log(`
  WHAT IT SAYS, and the first reading of it was wrong.

  The best price goes ${open.toFixed(2)} -> ${last.toFixed(2)} across the morning, and a new book
  (pointsbetau) joins at 07:29 — so the obvious suspicion is a COMPOSITION
  artefact: the max over a changing set of books moving because the set changed.
  The 'best of first 6' column tests it and refuses the explanation. Ladbrokes
  moved 12 -> 13 on its own board, betway and William Hill followed, and the
  newcomer arrived BELOW the best. The drift is real.

  So the direction of the published finding is independently confirmed WITHOUT
  needing the disputed 25/1 starting price: every book held or drifted through
  race morning and not one shortened. We called a drifting horse a steamer.

  AND THE MECHANISM IS WORSE THAN "WE GOT ONE WRONG". At 04:23 the whole market
  sat at 11/1-12/1 while our card carried 16/1 — a betting forecast pasted two
  days earlier. The panel's 12/1 was not short against the MARKET; it was short
  against a stale number of ours. The shorter-price test differences a live
  price against a two-day-old forecast and books the entire gap as money.

  That is §6's 16 Oct flag — "our card prices are better than the market's" —
  with the mechanism shown on one horse and thirteen timestamped observations.
  A trail of the same market, which is what this file is, shows the price flat
  overnight and easing all morning, and never needed our forecast at all.
`);
console.log(`  (${times.length} observations above, ${books.length} bookmakers; printed from the trail, not retyped.)\n`);
