#!/usr/bin/env node
/* Champions Day 2026 — how much does the settled figure depend on the two things
 * we could NOT verify?
 *
 * The results for this card came from web search, not a pasted Racing Post card
 * (§12's primary route was unavailable). Two inputs are therefore assumptions:
 *
 *   1. `ran` in the six races where no withdrawal was found — recorded as the
 *      declared field. Only the Balmoral's count (20, after Crown Of Oaks came
 *      out and reserve Tribal Chief came in) is corroborated.
 *   2. The Balmoral's each-way FRACTION. §12's mazetick review found a promotion
 *      always costs the fraction, and settle.mjs prints "fraction moves in this
 *      band — READ THE OFFER" on exactly this race. Nobody read the offer.
 *
 * An assumption that cannot change the answer is not a risk; one that can is.
 * This separates them instead of leaving both unstated.
 *
 *   node scripts/analysis/champions-day-band-sensitivity.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE = JSON.parse(fs.readFileSync('scripts/analysis/champions-day-results.json', 'utf8'));
const PICKS = 'data/picks/champions-day.json';

function settle(mutate) {
  const doc = JSON.parse(JSON.stringify(BASE));
  mutate(doc);
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cdsens-')), 'r.json');
  fs.writeFileSync(f, JSON.stringify(doc));
  const out = path.join(path.dirname(f), 'l.json');
  execFileSync('node', ['scripts/settle.mjs', '--fixture', f, '--picks', PICKS, '--json', out],
    { stdio: 'ignore' });
  const led = JSON.parse(fs.readFileSync(out, 'utf8'));
  const picks = led.picks ?? led.ledger ?? led;
  const rows = Array.isArray(picks) ? picks : Object.values(picks).flat();
  return rows.reduce((a, p) => a + Math.round((p.returned ?? p.back ?? 0) * 100) / 100, 0);
}

const base = settle(() => {});
console.log(`\nBaseline as published: returned £${base.toFixed(2)} on £15.00\n`);

console.log('1 · RAN COUNT — the six races where no withdrawal was found');
console.log('   Each is dropped one runner at a time, as far as the place band can fall.\n');
const sensitive = [];
for (const r of BASE.results) {
  if (r.off_time === '16:35') continue;              // the one count that is corroborated
  const floor = Math.max(4, r.ran - 6);
  const vals = [];
  let breaksAt = null;
  for (let n = r.ran; n >= floor; n--) {
    const got = settle((d) => { d.results.find((x) => x.off_time === r.off_time).ran = n; });
    vals.push(`${n}:£${got.toFixed(2)}`);
    if (breaksAt === null && Math.abs(got - base) > 0.005) breaksAt = { n, got };
  }
  if (breaksAt) sensitive.push({ off: r.off_time, declared: r.field_size, ...breaksAt });
  console.log(`   ${r.off_time}  declared ${r.field_size}  ${vals.join('  ')}`);
}
console.log(`
   ${BASE.results.length - 1 - sensitive.length} of ${BASE.results.length - 1} are INVARIANT — no value of ran moves the total by a penny,
   because every pick in them either won, finished second, or sits below the
   published depth in a race paying three or fewer.`);
if (sensitive.length) {
  console.log(`\n   NOT invariant, and this entry was written claiming they all were:`);
  for (const s of sensitive) {
    console.log(`     ${s.off} — declared ${s.declared}; at ${s.n} ran the total falls to £${s.got.toFixed(2)} `
      + `(−£${(base - s.got).toFixed(2)}), because the field drops below five and the race goes WIN ONLY.`);
  }
  console.log(`   That needs ${sensitive.map((s) => s.declared - s.n).join('/')} withdrawal(s) from a race reported pre-race as
   standing its ground, so it is unlikely — but "unlikely" is not "cannot", and the
   claim of invariance was written before this script ran and was wrong. §10: read
   the figure off the derivation rather than typing it beside the prose.`);
}
console.log('');

console.log('2 · THE BALMORAL FRACTION — the other assumption, and the bigger one');
const picksDoc = JSON.parse(fs.readFileSync(PICKS, 'utf8'));
const bal = picksDoc.races.find((r) => r.off === '16:35');
const atFrac = (frac) => {
  const tmp = JSON.parse(JSON.stringify(picksDoc));
  tmp.races.find((r) => r.off === '16:35').ewFrac = frac;
  const pf = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cdfrac-')), 'p.json');
  fs.writeFileSync(pf, JSON.stringify(tmp));
  const out = path.join(path.dirname(pf), 'l.json');
  execFileSync('node', ['scripts/settle.mjs', '--fixture', 'scripts/analysis/champions-day-results.json',
    '--picks', pf, '--json', out], { stdio: 'ignore' });
  const led = JSON.parse(fs.readFileSync(out, 'utf8'));
  const rows = Array.isArray(led.picks ?? led) ? (led.picks ?? led) : Object.values(led).flat();
  return rows.reduce((a, p) => a + Math.round((p.returned ?? p.back ?? 0) * 100) / 100, 0);
};
const a = atFrac('1/4'), b = atFrac('1/5');
console.log(`   recorded 1/4 (band base): £${a.toFixed(2)}   ·   promoted to 1/5: £${b.toFixed(2)}`);
console.log(`   difference £${Math.abs(a - b).toFixed(2)} — ${((Math.abs(a - b) / 15) * 100).toFixed(1)} points of ROI, all of it on Ebt's Guard.`);
console.log(`
   §12 (mazetick, 54 promotions): a promotion ALWAYS costs the fraction — 48
   gained a place and were cut, 6 were already cut, ZERO kept 1/4. So if Sky Bet
   promoted the Balmoral above four places, the fraction was 1/5 and the LONG's
   return is ${(Math.abs(a - b) / 0.01 / 100).toFixed(2)} lower than published. Nobody read the offer; §11's
   checklist asks for it and the at-the-off pass never ran.
   THIS is the number to confirm, and the ran counts are not.
   Current pick file records ewFrac ${JSON.stringify(bal.ewFrac)} and places ${bal.places}.
`);
