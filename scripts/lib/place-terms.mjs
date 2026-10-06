/* The place-terms model. ONE copy, imported by gate-check, settle and nr-check.
 *
 * It used to be two copies that disagreed. gate-check.mjs was corrected on
 * 25 Sep 2026 off a real Sky Bet offer; settle.mjs kept the old ladder (5 at
 * 16+, 4 at 8+) that the St Leger dividends had already disproved — so the
 * file that computes MONEY was running the wrong table. Hence this module.
 *
 * ── PLACES ───────────────────────────────────────────────────────────────
 * Race-type aware, because five places at 16+ is a HANDICAP term and applying
 * it to a big-field stakes race is the single most likely way to wave through
 * a bet that should be refused. Backtested at 21/21 against every observed
 * place count in the archive (scripts/analysis/place-bands-backtest.mjs); the
 * old ladder scored 7/21.
 *
 * ── FRACTIONS, and why they are not just another column ──────────────────
 * Added 6 Oct 2026 after reviewing bumasello/mazetick, which reads one firm's
 * terms HOURLY: 324 races, nine days, 81 term changes. Two findings this model
 * now carries:
 *
 *   1. The classic ladder describes the OPEN, not the off. Divergence from it
 *      runs 28.7% at the opening and 39.5% at the close.
 *   2. A promotion ALWAYS costs the fraction. In 54 promotions it did not
 *      improve once — 48 gained a place and were cut, 6 were already cut,
 *      zero kept the fraction.
 *
 * So a place count and a fraction are not a pair you can look up together. The
 * count below is the BASE; where the fraction is known to move with a
 * promotion, `fracStable: false` says so and the caller must read the real
 * one off the offer. Settlement REFUSES to guess it (see settle.mjs) — a
 * silent default to 1/5 understates a 1/4 race by 20% on every place return.
 *
 * Stability is read from mazetick's own categories: 113 races across two
 * categories moved zero times in nine days, and those are the ones marked
 * stable. The rest moved, so we do not pretend to know them.
 */

export const BANDS = {
  handicap: [
    { min: 16, places: 4, frac: '1/4', fracStable: false,
      src: 'places: Sky Bet offer 25 Sep 2026 + Tote model. fraction: opens 1/4, no 1/4 by the close (mazetick, 40 races) — READ THE OFFER' },
    { min: 12, places: 3, frac: '1/4', fracStable: false,
      src: 'places: Tote model. fraction: 1/4 at the open, gone by the close (mazetick, 88 races) — READ THE OFFER' },
    { min: 8, places: 3, frac: '1/5', fracStable: true,
      src: 'places + fraction: Tote model and mazetick (45 races, zero changes in nine days)' },
    { min: 5, places: 2, frac: '1/4', fracStable: true, src: 'Tote model, 45 races' },
    { min: 1, places: 0, frac: '—', fracStable: true, src: 'win only' },
  ],
  other: [
    { min: 8, places: 3, frac: '1/5', fracStable: true,
      src: 'places + fraction: Tote model and mazetick (68 races, zero changes in nine days)' },
    { min: 5, places: 2, frac: '1/4', fracStable: true, src: 'Tote model, 45 races' },
    { min: 1, places: 0, frac: '—', fracStable: true, src: 'win only' },
  ],
};

/* Runner counts at which the place count changes. A race just above one can
   lose a place to withdrawals AFTER it has been priced — Goodwood Day 5 and
   St Leger Day 1 both did. */
export const BOUNDARIES = { handicap: [16, 12, 8, 5], other: [8, 5] };
export const AT_RISK_MARGIN = 2;

/** Nurseries are handicaps. */
export function isHandicap(race = {}) {
  return /handicap|\bh'?cap\b|nursery/i.test(
    `${race.race_name ?? ''} ${race.race_type ?? ''} ${race.pattern ?? ''}`,
  );
}

export function bandsFor(race) {
  return isHandicap(race) ? BANDS.handicap : BANDS.other;
}

/** The BASE terms. An advertised offer sits above this and is never inferred. */
export function placeTerms(runners, race = {}) {
  const bands = bandsFor(race);
  const b = bands.find((x) => runners >= x.min) ?? bands.at(-1);
  return { places: b.places, frac: b.frac, fracStable: b.fracStable, src: b.src };
}

export function boundaryRisk(runners, race = {}) {
  const list = isHandicap(race) ? BOUNDARIES.handicap : BOUNDARIES.other;
  const b = list.find((x) => runners >= x && runners <= x + AT_RISK_MARGIN);
  if (b === undefined) return null;
  const below = placeTerms(b - 1, race);
  return { boundary: b, margin: runners - b, dropsTo: below.places };
}

/** "1/4" | "1/5" → the divisor settle.mjs divides odds by. */
export function fracDivisor(frac) {
  const m = String(frac).match(/^1\s*\/\s*(\d+)$/);
  return m ? Number(m[1]) : null;
}
