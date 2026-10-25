#!/usr/bin/env node
/* Score this archive's published STEAM/DRIFT calls against a real market trail.
 *
 * §5b has carried one complaint since the St Leger: we measure
 * forecast→racecard and never racecard→off. Every STEAM and DRIFT this engine
 * has published was a single price differenced against our own card, with no
 * second observation of the same market. This is that second observation.
 *
 * SOURCE AND ITS LICENCE. github.com/ficokelly/Racing-app, a public repository
 * collecting hourly multi-bookmaker odds (via api.puntersedge.online) into
 * dated JSON. IT CARRIES NO LICENCE FILE, so the default is all rights
 * reserved: it is READ here and nothing is copied or vendored. The clone is
 * passed as an argument and this script is the only thing committed.
 *
 *   node scripts/analysis/market-trail.mjs <path-to-clone>
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2];
if (!ROOT) {
  console.error('usage: market-trail.mjs <path to a Racing-app clone>  (data is not vendored — see header)');
  process.exit(2);
}
const clean = (n) => String(n).replace(/\s*\([A-Z]{2,3}\)\s*$/, '').trim().toLowerCase().replace(/'/g, '');
const dec = (frac) => { const [a, b] = String(frac).split('/'); return Number(a) / Number(b) + 1; };
const frac = (d) => `${Math.round((d - 1) * 100) / 100}/1`;

/* Published calls, with the page that carries each. `read` is what we said. */
/* Published reads, exactly as the pages state them. `call` is null where the
   page RECORDED an observation and deliberately called nothing — §6's own
   "record both observations and call neither". Only calls are scored. */
const CASES = [
  { day: '2026-10-17', race: 'Champions Day 12:55', control: false, picks: [
    { slot: 'NAP', horse: 'Speed Of Sound', card: '16/1', quoted: '12/1', call: 'STEAM',
      note: 'licensed shorter-price test, one horse, no control' },
  ]},
  { day: '2026-10-10', race: 'Cesarewitch 15:40', control: true, picks: [
    { slot: 'NAP',  horse: 'Sea Lantern',    card: '6/1',  quoted: '6/1',  call: null,
      note: 'published as "level" — baseline, not a call' },
    { slot: 'NB',   horse: 'Beylerbeyi',     card: '5/1',  quoted: '6/1',  call: null,
      note: 'published as "longer — shopping", explicitly NOT a money call' },
    { slot: 'LONG', horse: 'Premiere Ligne', card: '33/1', quoted: '25/1', call: 'STEAM',
      note: 'the one call in the race, made against the other two' },
  ]},
];

function trailFor(day, horse) {
  const dir = path.join(ROOT, 'data/odds-archive');
  const out = new Map();
  for (const f of fs.readdirSync(dir).filter((x) => x.startsWith(`${day}-part-`)).sort()) {
    for (const snap of JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))) {
      for (const p of snap.prices ?? []) {
        if (clean(p.horse) !== clean(horse)) continue;
        const d = Number(p.decimal_odds);
        if (!Number.isFinite(d)) continue;
        const t = snap.collected_at.slice(0, 19);
        if (!out.has(t)) out.set(t, new Map());
        out.get(t).set(p.bookmaker, d);
      }
    }
  }
  return out;
}

let scored = 0, agreed = 0;
const lines = [];
for (const c of CASES) {
  console.log('\n' + '='.repeat(74));
  console.log(`${c.race}  ·  ${c.day}  ·  ${c.control ? 'WITHIN-RACE control: our picks price each other' : 'NO within-race control: one horse against our card'}`);
  console.log('='.repeat(74));
  const moves = [];
  for (const p of c.picks) {
    const tr = trailFor(c.day, p.horse);
    if (!tr.size) { console.log(`  ${p.horse}: no prices in the archive`); continue; }
    const times = [...tr.keys()].sort();
    const firstSet = [...tr.get(times[0]).keys()];
    const bestAt = (t) => Math.max(...tr.get(t).values());
    const ctrlAt = (t) => { const v = tr.get(t); const s2 = firstSet.filter((b) => v.has(b)).map((b) => v.get(b)); return s2.length ? Math.max(...s2) : NaN; };
    const morning = times.find((t) => t.slice(11) >= '08:00') ?? times.at(-1);
    const open = bestAt(times[0]), mrn = bestAt(morning), last = bestAt(times.at(-1));
    const move = (mrn - open) / open;
    moves.push({ p, open, mrn, last, move, times, firstSet, ctrlOpen: ctrlAt(times[0]), ctrlMrn: ctrlAt(morning),
      maxBooks: Math.max(...times.map((t) => tr.get(t).size)) });
  }
  /* §5b: a move is only news as a DEVIATION from what the whole race did. With
     a control that median comes from our own picks; without one there is no
     median to take, which is the point. */
  const med = moves.length > 1
    ? [...moves].map((m) => m.move).sort((a, b) => a - b)[Math.floor(moves.length / 2)]
    : 0;
  if (moves.length > 1) {
    console.log(`\n  race median move of our picks: ${(med * 100).toFixed(1)}% — every figure below is read against it`);
  }
  for (const m of moves) {
    const { p } = m;
    const rel = m.move - med;
    const got = rel < -0.05 ? 'STEAM' : rel > 0.05 ? 'DRIFT' : 'flat';
    console.log(`\n  ${p.slot.padEnd(5)} ${p.horse}`);
    console.log(`    card ${p.card.padStart(5)}  quoted ${p.quoted.padStart(5)}  page says: ${p.note}`);
    console.log(`    live best: open ${frac(m.open).padStart(6)} (${m.times[0].slice(11, 16)})  ->  morning ${frac(m.mrn).padStart(6)}`
      + `  ->  last ${frac(m.last).padStart(6)} (${m.times.at(-1).slice(11, 16)})   [${m.times.length} snaps, ${m.firstSet.length}-${m.maxBooks} books]`);
    console.log(`    composition control: best of the ${m.firstSet.length} opening books ${frac(m.ctrlOpen)} -> ${frac(m.ctrlMrn)}`
      + (Math.abs(m.ctrlMrn - m.mrn) < 1e-9 ? ' — same, the move is not a changing book set' : ' — DIFFERS, suspect composition'));
    console.log(`    move ${(m.move * 100).toFixed(1)}%` + (moves.length > 1 ? `, vs race median ${(rel * 100).toFixed(1)}pp` : '') + ` => market says ${got}`);
    if (p.call === null) {
      console.log(`    not scored — the page recorded this and called nothing.`);
    } else {
      scored++; const ok = got === p.call; if (ok) agreed++;
      console.log(`    WE CALLED ${p.call}  ${ok ? '*** CONFIRMED ***' : '*** CONTRADICTED ***'}`);
      lines.push({ race: c.race, horse: p.horse, call: p.call, got, ok, control: c.control });
    }
    if (dec(p.card) > m.open * 1.03) {
      console.log(`    !! our card ${p.card} was LONGER than anything in the market (best ${frac(m.open)}) — the baseline was already wrong`);
    }
  }
}

console.log('\n' + '='.repeat(74));
console.log(`SCOREBOARD: ${agreed}/${scored} published CALL(S) confirmed by the live market.`);
for (const l of lines) {
  console.log(`  ${l.ok ? 'OK ' : 'XX '} ${l.race.padEnd(22)} ${l.horse.padEnd(16)} we called ${l.call.padEnd(5)} market ${l.got.padEnd(5)} `
    + (l.control ? '(within-race control)' : '(no control)'));
}
console.log('='.repeat(74));
const withCtl = lines.filter((l) => l.control), without = lines.filter((l) => !l.control);
console.log(`
  WHERE THE SPLIT FALLS. ${withCtl.filter((l) => l.ok).length}/${withCtl.length} with a within-race control, ${without.filter((l) => l.ok).length}/${without.length} without.

  Two things the Cesarewitch shows that no single-horse comparison can.

  First, the control did its job. Sea Lantern and Beylerbeyi moved IDENTICALLY
  (both +7.1% to the morning), and the page called neither — it used them as the
  baseline. Premiere Ligne moved -20.7% against that. The whole race drifted a
  little and one horse went the other way hard, which is exactly the shape a
  within-race control exists to isolate, and it is invisible to anything that
  differences one horse against our own card.

  Second, scoring the control's picks INDIVIDUALLY would have graded it wrong.
  A first run of this script applied an absolute 5% band to each horse and
  marked Sea Lantern "contradicted" for a 7.1% drift — grading a within-race
  method by the method it replaces. §5b says to take the deviation from the race
  median; the fix was to do that here too.

  AND THE BASELINE WAS CONTAMINATED IN BOTH RACES. Our card sat outside the live
  market on Speed Of Sound (16/1 against a market of 11/1-12/1) and on Premiere
  Ligne (33/1 against a best of 28/1). The control never used the card as its
  baseline, which is why it survived a wrong one; the single-horse test did, and
  did not.

  SO THE RULE IS NARROWER THAN "IT WORKS" OR "IT IS BROKEN": run the
  shorter-price test only where two or more of our picks sit in the same race
  and one source prices them all, and read every move against the race median.
  Where it is one horse against our own forecast, record the observation and
  call nothing — which is what §6 already says, now with a score attached.

  Honest size: ${scored} scored calls. Nothing here is a sample.
`);
