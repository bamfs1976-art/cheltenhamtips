/* Cheltenham November 2026, Day 1 (Fri 13 Nov) — what the external columns
 * actually say, and what the consensus count on the source grid gets wrong.
 *
 * SOURCE. One tipster-consensus grid supplied by the user, covering six races.
 * Eight rows: William Hill, Steve Mullington, Raceolly, HRN "Biggest Priced"
 * (two panels), Racing Post Spotlight, Billy Grimshaw and @RoadCheltenham.
 * Nothing here is a racecard: no field sizes, no going stick, no odds beyond
 * the one the grid prints. The gate (CLAUDE.md §3b / rule 13) is untouched by
 * this file and Day 1 stays NO BET.
 *
 * WHY IT EXISTS. The grid prints a NAP badge reading "Ga Law 2/8" — two of
 * eight sources. §6 says count OPINIONS, not appearances, and on that count
 * the number is one:
 *
 *   - WH and Mullington posted nothing. §6 (9 Oct): an absence is n/a, not 0%.
 *     The denominator is six rows, not eight.
 *   - "Big Price" and "Big Naps" are HRN aggregator panels. §6 (10 Sep):
 *     panels are not sources, they are other columns' selections collected.
 *     Count them as ZERO.
 *   - Ga Law's two appearances are Raceolly's tip and the Big Naps row that
 *     harvests it — the Marvelman shape. One desk, two rows.
 *
 * So four desks hold an opinion, and the crossover count across the whole day
 * is zero. Run it:  node scripts/analysis/cheltenham-nov-day1-consensus.mjs
 */

/* Six declared races, off-times and names as the grid prints them. */
const RACES = [
  { time: '13:10', name: "Conditional Jockeys\u2019 Hcp Hurdle" },
  { time: '13:45', name: "Novices\u2019 Chase" },
  { time: '14:20', name: 'Shloer Chase' },
  { time: '14:55', name: "Veterans\u2019 Hcp Chase" },
  { time: '15:30', name: 'Hyde Novices’ Hurdle' },
  { time: '16:00', name: "Novices\u2019 Hcp Hurdle" }
];

/* kind: 'desk'  — a column that forms its own view, counts as one opinion
 *       'panel' — an aggregator row, zero opinions (§6, 10 Sep)
 *       'absent'— posted nothing on this card, n/a not 0% (§6, 9 Oct)
 * Selections are SETS: a desk may name more than one horse in a race, and two
 * desks agree when their sets intersect at all (§6, 16 Oct). */
const ROWS = [
  { code: 'WH',   name: 'William Hill',        kind: 'absent', picks: {} },
  { code: 'SM',   name: 'Steve Mullington',    kind: 'absent', picks: {} },
  { code: 'RO',   name: 'Raceolly',            kind: 'desk',   picks: {
      '13:10': ['Snatch A Glance'], '13:45': ['Bill Joyce'], '14:55': ['Ga Law'],
      '15:30': ['Red Acres Georgie'], '16:00': ['Shallow Bowles'] } },
  { code: 'BIG',  name: 'HRN Biggest Price',   kind: 'panel',  picks: {
      '13:10': ['Double Oban'] } },
  { code: 'BIG',  name: 'HRN Biggest Naps',    kind: 'panel',  picks: {
      '13:10': ['Chutzpal', 'Outmaster'], '14:20': ['Mighty Bandit'],
      '14:55': ['Ga Law'], '15:30': ['Dallas Star'] } },
  { code: 'SPOT', name: 'Racing Post Spotlight', kind: 'desk', picks: {
      '13:10': ['High Fibre'], '13:45': ["King\u2019s Bucks"], '14:20': ['Gidleigh Park'],
      '14:55': ['Thunder Rock'], '15:30': ['Ferocimo'], '16:00': ['Crooked Path'] } },
  { code: 'BG',   name: 'Billy Grimshaw',      kind: 'desk',   picks: {
      '13:45': ['Kingston Narcissus'], '14:55': ['Triple Trade'],
      '15:30': ['Hitintheheadlines'] } },
  { code: 'RC',   name: '@RoadCheltenham',     kind: 'desk',   picks: {
      '13:45': ['Folie Golith'], '15:30': ['Moneygarrow'] } }
];

const desks = ROWS.filter(r => r.kind === 'desk');
const panels = ROWS.filter(r => r.kind === 'panel');
const absent = ROWS.filter(r => r.kind === 'absent');
const times = RACES.map(r => r.time);
const tipCount = (r) => Object.values(r.picks).reduce((n, s) => n + s.length, 0);

/* --- crossovers, on opinions only ---------------------------------------- */
const crossovers = [];
for (const { time, name } of RACES) {
  const holders = new Map();                       // horse -> [desk codes]
  for (const d of desks) for (const h of d.picks[time] || []) {
    holders.set(h, (holders.get(h) || []).concat(d.code));
  }
  for (const [horse, who] of holders) {
    if (who.length > 1) crossovers.push({ time, name, horse, who });
  }
}

/* --- the divergence matrix (§6: test the PAIR, not the house column) ------ */
const pairs = [];
for (let i = 0; i < desks.length; i++) for (let j = i + 1; j < desks.length; j++) {
  const a = desks[i], b = desks[j];
  const shared = times.filter(t => (a.picks[t] || []).length && (b.picks[t] || []).length);
  const agree = shared.filter(t => (a.picks[t] || []).some(h => (b.picks[t] || []).includes(h)));
  pairs.push({ a: a.code, b: b.code, shared: shared.length, diverge: shared.length - agree.length });
}

/* --- the grid's own NAP badge, re-counted -------------------------------- */
const gaLawRows = ROWS.filter(r => (r.picks['14:55'] || []).includes('Ga Law'));
const gaLawOpinions = gaLawRows.filter(r => r.kind === 'desk').length;

/* Printed only when run directly: this module is imported by the card
   renderer, which must not re-emit the whole report. */
if (import.meta.url === `file://${process.argv[1]}`) {
  const w = (s, n) => String(s).padEnd(n);
  console.log('Cheltenham November 2026 · Day 1 · Fri 13 Nov · 6 races\n');
  console.log(`Rows on the grid      ${ROWS.length}`);
  console.log(`  posted nothing      ${absent.length}  (${absent.map(r => r.name).join(', ')}) — n/a, not 0%`);
  console.log(`  aggregator panels   ${panels.length}  (${panels.map(r => r.name).join(', ')}) — ZERO opinions`);
  console.log(`  desks with a view   ${desks.length}`);
  console.log(`Opinions on the card  ${desks.reduce((n, d) => n + tipCount(d), 0)} across ${desks.length} desks\n`);

  console.log('Tips per desk');
  for (const d of desks) console.log(`  ${w(d.code, 6)}${w(d.name, 24)}${tipCount(d)} tip(s) in ${Object.keys(d.picks).length} race(s)`);

  console.log('\nPairwise divergence (shared races where the two named different horses)');
  let shTot = 0, dvTot = 0;
  for (const p of pairs) {
    shTot += p.shared; dvTot += p.diverge;
    console.log(`  ${w(p.a + '–' + p.b, 14)}${p.diverge}/${p.shared}` +
      (p.shared === 0 ? '  (no shared race — untestable)' : p.diverge === p.shared ? '  fully divergent' : ''));
  }
  const clean = pairs.filter(p => p.shared > 0 && p.diverge === p.shared).length;
  const tested = pairs.filter(p => p.shared > 0).length;
  console.log(`  TOTAL         ${dvTot}/${shTot} comparisons diverge · ${clean}/${tested} tested pairings fully divergent`);

  console.log(`\nCrossovers (2+ desks on one horse): ${crossovers.length}`);
  for (const c of crossovers) console.log(`  ${c.time} ${c.horse} — ${c.who.join(' + ')}`);
  if (!crossovers.length) {
    const live = RACES.filter(r => desks.filter(d => (d.picks[r.time] || []).length).length > 1).length;
    console.log(`  none yet, at ${desks.length} columns — and ${live} of ${RACES.length} races had 2+ desks in them,`);
    console.log('  so the absence is not just thin coverage. Every one of those races is a disagreement.');
  }

  console.log(`\nThe grid's NAP badge: Ga Law "2/8"`);
  console.log(`  rows holding Ga Law      ${gaLawRows.length}  (${gaLawRows.map(r => r.name).join(', ')})`);
  console.log(`  OPINIONS holding Ga Law  ${gaLawOpinions}  — the other row is a panel harvesting it`);
  console.log(`  so the badge counts rows, not opinions. It is a 1x, not a 2x.`);

}

export { RACES, ROWS, desks, panels, absent, pairs, crossovers };
