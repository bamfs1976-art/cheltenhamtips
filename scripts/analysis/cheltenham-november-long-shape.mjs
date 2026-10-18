#!/usr/bin/env node
/* Cheltenham November 2026 — the LONG slot, forecast the one way §9 allows.
 *
 * §9 records that forecasting FIELD SIZE off an entry list is worthless (the
 * St Leger predicted the slot would open in six races of eight; declarations
 * cut it to one). What has held twice running — Future Champions and Champions
 * Day — is forecasting the SHAPE: which races are handicaps, which is knowable
 * from the published programme months out. This makes that mechanical, reading
 * the bands from scripts/lib/place-terms.mjs rather than restating them.
 *
 *   node scripts/analysis/cheltenham-november-long-shape.mjs
 */
import { placeTerms } from '../lib/place-terms.mjs';

/* The published feature races only. The supporting cards are NOT published
   this far out, and that limit is the point of section 3 below. */
const PROGRAMME = [
  { day: 'Fri 13 Nov', name: "Supreme Trial Novices' Hurdle (Listed)" },
  { day: 'Sat 14 Nov', name: 'Paddy Power Gold Cup Handicap Chase (Grade 3)' },
  { day: 'Sat 14 Nov', name: 'November Novices’ Chase (Grade 2)' },
  { day: 'Sat 14 Nov', name: 'Paddy Power Handicap Hurdle (Grade 3)' },
  { day: 'Sun 15 Nov', name: 'Unibet Greatwood Handicap Hurdle (Grade 3)' },
];

/** Smallest field at which this race would clear the LONG's place test,
 *  or null if no field size ever clears it. The test is §4's: 5+ places, or
 *  4+ in a field of 16 or more. */
function minRunnersForLong(race) {
  for (let n = 1; n <= 60; n++) {
    const { places } = placeTerms(n, race);
    if (places >= 5 || (places >= 4 && n >= 16)) return n;
  }
  return null;
}

console.log('\n' + '='.repeat(72));
console.log('1 · THE SLOT IS HANDICAP-ONLY, AND THAT IS A PROPERTY OF THE BANDS');
console.log('='.repeat(72));
const probe = { race_name: 'Novices Hurdle (Grade 2)' };
const best = Math.max(...Array.from({ length: 60 }, (_, i) => placeTerms(i + 1, probe).places));
console.log(`  Scanning 1..60 runners through place-terms.mjs:

    a NON-handicap pays at most ${best} places at ANY field size
    the LONG's place test needs 5+, or 4+ at 16+

  So a non-handicap can never open the slot, whatever turns up. This is not a
  judgement about this meeting; it is arithmetic in the model, and it is why
  the shape forecast works when a size forecast does not.
`);

console.log('='.repeat(72));
console.log('2 · THE PUBLISHED FEATURE RACES, AND WHAT EACH WOULD NEED');
console.log('='.repeat(72));
console.log(`  ${'day'.padEnd(11)} ${'race'.padEnd(46)} ${'type'.padEnd(12)} needs`);
const candidates = [];
for (const r of PROGRAMME) {
  const race = { race_name: r.name };
  const min = minRunnersForLong(race);
  const hcap = /handicap/i.test(r.name);
  if (min) candidates.push(r);
  console.log(`  ${r.day.padEnd(11)} ${r.name.slice(0, 46).padEnd(46)} `
    + `${(hcap ? 'handicap' : 'non-handicap').padEnd(12)} `
    + (min ? `${min}+ runners` : 'SHUT at any field size'));
}
console.log(`
  ${candidates.length} of ${PROGRAMME.length} published features can open the slot, and all ${candidates.length} are handicaps:
${candidates.map((c) => `    ${c.day}  ${c.name}`).join('\n')}

  Each needs SIXTEEN runners. Nothing on this page knows whether they will get
  them, and §9 is explicit that an entry list cannot tell you either.
`);

console.log('='.repeat(72));
console.log('3 · THE LIMIT THIS FORECAST HAS AND THE LAST TWO DID NOT');
console.log('='.repeat(72));
console.log(`  Future Champions and Champions Day were forecast off the WHOLE declared
  programme — every race on the card, so "the slot opens in exactly one race"
  was a complete statement. Here only ${PROGRAMME.length} FEATURE races are published; the
  supporting cards are not.

  A supporting handicap of sixteen would open the slot and this page would not
  have seen it coming. So the honest forecast is bounded in one direction only:

    ✓  Of the published features, ${candidates.length} can open the slot and ${PROGRAMME.length - candidates.length} cannot.
    ✗  "The slot opens in at most ${candidates.length} races" is NOT supported — the rest of the
       card is unknown, and Cheltenham cards carry several handicaps a day.

  Say both. The two forecasts that held were complete; this one is partial, and
  calling it the same kind of claim would be the §6 error about absences
  committed on a programme instead of a tip list.
`);
