#!/usr/bin/env node
/* Re-run the place-band and LONG arithmetic at the off, against withdrawals.
 *
 *   node scripts/nr-check.mjs --card <priced-card.json> --nr "15:40 Pathein, 16:15 La Pittura"
 *   node scripts/nr-check.mjs --card <priced-card.json> --nr-file <nrs.json>
 *
 * WHY. Rule 16 says re-check the place terms at the off because withdrawals can
 * drop a race below its band after it has been priced. The archive says that is
 * not theoretical:
 *
 *   Goodwood Day 5  — 18 runners paying 5 became 15 paying 4. The LONG ran
 *                     under a condition that no longer held.
 *   St Leger Day 1  — the 15:00 lost two, dropped from 3 places to 2, and
 *                     Consent finished THIRD for nothing.
 *   Cambridgeshire  — La Pittura withdrawn from the 16:15, Rule 4 of 20p in
 *                     the pound, and a pick in that race.
 *
 * Each time the warning was available before the off and checked by hand. This
 * is that check, mechanically, so it cannot be skipped on a busy afternoon.
 *
 * The idea of watching withdrawals as a live feed is borrowed from
 * Pluckier/racing's NonRunnerNotifications; the arithmetic is ours.
 *
 * Card shape (the same file settle.mjs takes):
 *   { "event": "...", "date": "...", "races": [
 *       { "off": "15:40", "race_name": "... Handicap", "declared": 28,
 *         "places": 7, "ewFrac": "1/5",
 *         "offer": { "places": 7, "frac": "1/5", "minRunners": 16 },
 *         "picks": [ { "slot": "LONG", "horse": "Alcarath", "odds": "20/1" } ] } ] }
 *
 * Exits 1 if any race changed band, any pick was withdrawn, or any LONG lost
 * its qualification — i.e. if anything needs a human before the off.
 */
import fs from 'node:fs/promises';
import { placeTerms, boundaryRisk } from './lib/place-terms.mjs';

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const cardFile = arg('--card');
if (!cardFile) { console.error('usage: --card <file.json> [--nr "15:40 Horse, 16:15 Horse"] [--nr-file f.json]'); process.exit(2); }

const card = JSON.parse(await fs.readFile(cardFile, 'utf8'));
/* "15:40 Pathein, 16:15 La Pittura" → { "15:40": ["Pathein"], … } */
const nrs = {};
const addNr = (off, horse) => { (nrs[off] ??= []).push(horse.trim()); };
if (arg('--nr')) for (const part of arg('--nr').split(',')) {
  const m = part.trim().match(/^(\d{1,2}:\d{2})\s+(.+)$/);
  if (!m) { console.error(`cannot parse non-runner "${part.trim()}" — expected "HH:MM Horse Name"`); process.exit(2); }
  addNr(m[1], m[2]);
}
if (arg('--nr-file')) {
  const f = JSON.parse(await fs.readFile(arg('--nr-file'), 'utf8'));
  for (const [off, list] of Object.entries(f)) for (const h of list) addNr(off, h);
}

const norm = (s) => String(s).toLowerCase().replace(/[^a-z]/g, '');
let problems = 0;
console.log(`\nNon-runner re-check — ${card.event ?? ''} ${card.date ?? ''}`);
console.log(`${Object.values(nrs).flat().length} withdrawal(s) supplied across ${Object.keys(nrs).length} race(s)\n`);

for (const race of card.races ?? []) {
  const out = nrs[race.off] ?? [];
  const declared = race.declared ?? race.field_size ?? null;
  if (declared === null) { console.log(`${race.off}  \x1b[33mno declared field on the card — cannot re-check\x1b[0m`); problems++; continue; }
  const running = declared - out.length;
  const before = placeTerms(declared, race);
  const after = placeTerms(running, race);
  const pricedPlaces = race.places ?? before.places;

  const head = `${race.off}  ${declared} declared${out.length ? ` − ${out.length} NR → ${running}` : ''}`;
  const lines = [];

  /* 1. Did the BASE band move? */
  if (before.places !== after.places) {
    lines.push(`\x1b[31m✗ BASE BAND MOVED\x1b[0m — ${before.places} places at ${declared} runners, ${after.places} at ${running}`);
    problems++;
  }
  /* 2. The card may have been priced on an OFFER above the base. An enhanced
        offer is conditional on a RUNNER COUNT ("7 places instead of 4 if there
        are 16 runners or more"), so the question is not "is the offer above the
        base" — it always is, and warning on that fires on every promoted race
        forever. The question is whether the field fell through the offer's own
        threshold. Record it as `offer: { places, frac, minRunners }`. */
  const offer = typeof race.offer === 'object' ? race.offer : null;
  if (offer) {
    if (offer.minRunners === undefined) {
      lines.push(`\x1b[33m⚠\x1b[0m priced on an offer of ${offer.places} places with no threshold recorded — `
        + `check the offer's runner condition by hand, and put minRunners on the card next time`);
    } else if (running < offer.minRunners) {
      lines.push(`\x1b[31m✗ OFFER LOST\x1b[0m — ${offer.places} places needed ${offer.minRunners}+ runners, `
        + `${running} are left. Terms fall back to the base ${after.places} at ${after.frac}.`);
      problems++;
    } else {
      lines.push(`\x1b[32m✓\x1b[0m offer of ${offer.places} places holds (needs ${offer.minRunners}+, ${running} running)`);
    }
  } else if (race.offer === true) {
    lines.push(`\x1b[33m⚠\x1b[0m card says "offer" but records no places/threshold — cannot re-check it`);
  }

  /* 3. Still near an edge? */
  const risk = boundaryRisk(running, race);
  if (risk) lines.push(`\x1b[33m⚠\x1b[0m ${risk.margin} above the ${risk.boundary}-runner boundary — `
    + `${risk.margin + 1} more withdrawal(s) drops this to ${risk.dropsTo} places`);
  /* 4. The fraction, where the evidence says it moves. */
  if (!after.fracStable) lines.push(`\x1b[33m⚠\x1b[0m fraction moves in this band (base ${after.frac}) — read it off the offer, do not assume`);

  for (const pick of race.picks ?? []) {
    const gone = out.find((h) => norm(h) === norm(pick.horse));
    if (gone) { lines.push(`\x1b[31m✗ ${pick.slot ?? 'pick'} ${pick.horse} IS A NON-RUNNER\x1b[0m — stake returned; check Rule 4 on anything bet at a price`); problems++; continue; }
    if ((pick.slot ?? '').toUpperCase() === 'LONG') {
      /* The LONG's own gate: 5+ places, or 4+ in a field of 16 or more — on the
         terms that will ACTUALLY apply, which is the offer only while it holds. */
      const offerHolds = offer && (offer.minRunners === undefined || running >= offer.minRunners);
      const eff = offerHolds ? offer.places : after.places;
      const open = eff >= 5 || (eff >= 4 && running >= 16);
      if (!open) {
        lines.push(`\x1b[31m✗ LONG NO LONGER QUALIFIES\x1b[0m — ${eff} places at ${running} runners fails the place test`);
        problems++;
      } else {
        lines.push(`\x1b[32m✓\x1b[0m LONG ${pick.horse} still clears the place test on ${eff} places`);
      }
      lines.push(`\x1b[33m⚠\x1b[0m re-check the LONG's PRICE too — ${pick.odds ?? '?'} on the card. §4: Lesrico was logged at 9/1 and started 3/1F`);
    }
  }

  console.log(lines.length ? `${head}\n      ${lines.join('\n      ')}` : `\x1b[32m✓\x1b[0m ${head} — unchanged`);
}

console.log();
if (problems) { console.log(`\x1b[31m${problems} thing(s) need a decision before the off.\x1b[0m`); process.exit(1); }
console.log('\x1b[32mNothing moved. Terms as priced.\x1b[0m');
