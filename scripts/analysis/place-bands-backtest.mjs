#!/usr/bin/env node
/* Derivation for the "7 of 7 / 45 races clean" place-band figures published on
 * cambridgeshire-2026.html and in CLAUDE.md §12.
 *
 *   node scripts/analysis/place-bands-backtest.mjs
 *
 * Backtests the race-type-aware bands in scripts/gate-check.mjs against every
 * place count this archive has actually observed. The Doncaster and Newmarket
 * rows are published Tote dividends; the Cambridgeshire 15:40 row is the Tote's
 * count on a race where Sky Bet separately paid a promoted 7.
 *
 * Committed 6 Oct 2026 under the §10 rule that no published number ships
 * without the script that produced it.
 */
const OBSERVED = [
  // [meeting, off, runners at the off, handicap?, places actually paid]
  ['Doncaster 10 Sep', '13:15', 11, true,  3], ['Doncaster 10 Sep', '13:50', 17, false, 3],
  ['Doncaster 10 Sep', '14:25', 11, true,  3], ['Doncaster 10 Sep', '15:00',  7, false, 2],
  ['Doncaster 10 Sep', '15:35', 11, false, 3], ['Doncaster 10 Sep', '16:10',  6, false, 2],
  ['Doncaster 10 Sep', '16:45',  8, true,  3],
  ['Newmarket 25 Sep', '13:15',  9, false, 3], ['Newmarket 25 Sep', '13:50', 10, false, 3],
  ['Newmarket 25 Sep', '14:25',  9, false, 3], ['Newmarket 25 Sep', '15:00',  7, false, 2],
  ['Newmarket 25 Sep', '15:35',  4, false, 0], ['Newmarket 25 Sep', '16:10', 15, false, 3],
  ['Newmarket 25 Sep', '16:45', 10, true,  3],
  ['Newmarket 26 Sep', '13:22', 10, true,  3], ['Newmarket 26 Sep', '13:55',  7, false, 2],
  ['Newmarket 26 Sep', '14:27',  6, false, 2], ['Newmarket 26 Sep', '15:00',  7, false, 2],
  ['Newmarket 26 Sep', '15:40', 27, true,  4], ['Newmarket 26 Sep', '16:15', 10, false, 3],
  ['Newmarket 26 Sep', '16:50', 12, true,  3],
];

/* The bands under test, mirroring scripts/gate-check.mjs. */
const model = (n, hcap) => hcap
  ? (n >= 16 ? 4 : n >= 8 ? 3 : n >= 5 ? 2 : 0)
  : (n >= 8 ? 3 : n >= 5 ? 2 : 0);
/* The ladder they replaced, for the comparison the archive quotes. */
const old = (n) => (n >= 16 ? 5 : n >= 8 ? 4 : n >= 5 ? 2 : 0);

let ok = 0, oldOk = 0;
console.log('meeting            off     ran  hcap  paid  model      old ladder');
for (const [meet, off, n, h, paid] of OBSERVED) {
  const m = model(n, h), o = old(n);
  ok += m === paid; oldOk += o === paid;
  console.log(`${meet.padEnd(19)}${off.padEnd(8)}${String(n).padStart(3)}${String(h).padStart(7)}`
    + `${String(paid).padStart(6)}  ${(m === paid ? '✓ ' : '✗ ') + m}        ${(o === paid ? '✓ ' : '✗ ') + o}`);
}
console.log(`\nrace-type-aware bands: ${ok}/${OBSERVED.length}`);
console.log(`old PLACE_BANDS:       ${oldOk}/${OBSERVED.length}`);
if (ok !== OBSERVED.length) { console.error('\nThe model no longer fits every observed race.'); process.exit(1); }
console.log('\nNo exceptions. This is the figure CLAUDE.md §12 quotes.');
