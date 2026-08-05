/*
 * Field mapping between The Racing API and this project's own data model.
 *
 * Purpose: make our stored data forward-compatible with the API without
 * rewriting the season history or changing how anything scores. Nothing in
 * here alters existing numbers — it adds a canonical vocabulary and adapters
 * so that an upgrade to a paid plan is a drop-in rather than a migration.
 *
 * Not currently loaded by any page — nothing on the site needs it at runtime
 * yet, so it is not shipped to visitors. It is consumed by the scripts in
 * scripts/ and is ready to drop into a page with a <script> tag when a
 * paid plan makes live data worth rendering. Pure constants and functions,
 * safe to load anywhere.
 */

/* ── Canonical field names ──────────────────────────────────────────
 * Left: the name The Racing API uses. Right: what we call it, and where
 * it currently lives. Where "—" appears we have no equivalent yet; those
 * are the genuine gaps in the engine, listed so they stay visible.
 */
const RACING_API_FIELDS = {
  // Race level
  race_id:      { ours: 'raceId',      where: 'not stored — we key races by "HH:MM-dayIndex"' },
  course:       { ours: 'course',      where: 'page title / festival name' },
  date:         { ours: 'date',        where: 'FESTIVALS_2026[].dates' },
  // NOTE: the FREE plan (RacecardBasic) uses off_time / distance_f / race_class /
  // sex_restriction / field_size, while the Pro racecard and the published
  // examples use off / dist_f / class / sex_rest. Verified against the OpenAPI
  // spec 2026-08-05. Use the resolvers in scripts/lib/racing-api.mjs, which
  // accept either spelling, rather than reading these keys directly.
  off_time:     { ours: 'off',         where: 'race key prefix, e.g. "15:35" (free plan)' },
  off:          { ours: 'off',         where: 'race key prefix (pro plan / examples)' },
  race_name:    { ours: 'raceName',    where: 'race-hd text' },
  distance_f:   { ours: 'distanceF',   where: 'race-hd text, unparsed (free plan)' },
  dist_f:       { ours: 'distanceF',   where: 'race-hd text, unparsed (pro plan)' },
  race_class:   { ours: 'raceClass',   where: 'race-hd text, unparsed (free plan)' },
  class:        { ours: 'raceClass',   where: 'race-hd text, unparsed (pro plan)' },
  field_size:   { ours: 'fieldSize',   where: 'race-hd runner count — authoritative on the free plan' },
  race_status:  { ours: 'raceStatus',  where: '— declaration status, not yet used by the gate' },
  type:         { ours: 'code',        where: 'implicit — flat vs jumps decides the draw rule' },
  going:        { ours: 'going',       where: 'results panel prose' },
  pattern:      { ours: 'pattern',     where: 'race-hd text (Group 1/2/3, Listed)' },

  // Runner level
  horse_id:     { ours: 'horseId',     where: '— we match on name only, which is fragile' },
  horse:        { ours: 'horse',       where: 'pick-horse span, and *_PICKS values' },
  number:       { ours: 'cloth',       where: 'not stored' },
  draw:         { ours: 'draw',        where: 'draw-b badge' },
  position:     { ours: 'position',    where: '— we store only winner/second/third' },
  sp:           { ours: 'sp',          where: 'results prose, e.g. "(11/8F SP)"' },
  sp_dec:       { ours: 'spDec',       where: '—' },
  btn:          { ours: 'beatenBy',    where: '—' },
  jockey:       { ours: 'jockey',      where: 'conns span' },
  trainer:      { ours: 'trainer',     where: 'conns span' },
  form:         { ours: 'form',        where: 'conns span, "F:..."' },
  or:           { ours: 'officialRating', where: 'conns span on some cards, "OR94"' },
  rpr:          { ours: 'rpr',         where: 'conns span on some cards, "RPR114"' },
  ts:           { ours: 'topSpeed',    where: 'conns span on some cards, "TS104"' },
  lbs:          { ours: 'weightLbs',   where: 'conns span as "9-2", unparsed' },
  headgear:     { ours: 'headgear',    where: '—' },
  comment:      { ours: 'comment',     where: '—' },
  spotlight:    { ours: 'spotlight',   where: '— currently screenshotted from an aggregator' },
  sire:         { ours: 'sire',        where: '— no sire data at all, despite CLAUDE.md §8' },
  dam:          { ours: 'dam',         where: '—' },
  damsire:      { ours: 'damsire',     where: '—' },
  trainer_14_days: { ours: 'trainer14', where: '— trainer form is currently eyeballed' },
  trainer_rtf:  { ours: 'trainerRtf',  where: '—' },
  past_results_flags: { ours: 'flags', where: 'sb-cd badge (CD / C / D / BF), hand-applied' },

  // Odds (Pro plan — not wired up, listed so the shape is known)
  ew_places:    { ours: 'places',      where: 'race-hd text, hand-read; the Day 5 failure point' },
  ew_denom:     { ours: 'ewFrac',      where: 'race-hd text, hand-read' },
  history:      { ours: 'priceTrail',  where: 'pick-note prose, 2-4 points read off a screenshot' },
};

/* Fields the API has that we have no equivalent for at all. These are the
 * concrete gaps — worth keeping in code rather than in a commit message. */
const RACING_API_GAPS = Object.entries(RACING_API_FIELDS)
  .filter(([, v]) => v.where.startsWith('—'))
  .map(([k, v]) => ({ apiField: k, ours: v.ours, note: v.where.replace(/^—\s*/, '') }));

/* ── Adapters ───────────────────────────────────────────────────────
 * Convert an API results race into the shape our scorer already reads,
 * while carrying the extra positions the scorer ignores but settlement needs.
 */

/** Strip country suffixes and punctuation so "Rafe's Da Man" === "Rafes Da Man". */
function normHorse(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/\([a-z]{2,3}\)/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * API results race → our { winner, second, third } plus extras.
 * The first three keys keep the existing scorer working untouched; everything
 * else is additive.
 */
function normaliseApiResult(apiRace) {
  const runners = (apiRace.runners ?? []).slice();
  const ran = runners
    .filter((r) => Number.isFinite(Number(r.position)))
    .sort((a, b) => Number(a.position) - Number(b.position));
  const nonRunners = runners
    .filter((r) => !Number.isFinite(Number(r.position)))
    .map((r) => r.horse);

  const at = (i) => (ran[i] ? ran[i].horse : null);

  return {
    // Consumed by scorePick() today — shape unchanged.
    winner: at(0),
    second: at(1),
    third: at(2),
    // Additive: what settlement needs and the scorer ignores.
    fourth: at(3),
    fifth: at(4),
    sixth: at(5),
    seventh: at(6),
    raceId: apiRace.race_id ?? null,
    off: apiRace.off_time ?? apiRace.off ?? null,
    going: apiRace.going ?? null,
    ranCount: ran.length,
    nonRunners,
    order: ran.map((r) => ({
      position: Number(r.position),
      horse: r.horse,
      horseId: r.horse_id ?? null,
      draw: r.draw ?? null,
      sp: r.sp ?? null,
    })),
  };
}

/** Finishing position of a horse in a normalised result, or null. */
function positionOf(result, horse) {
  if (!result) return null;
  const target = normHorse(horse);
  if (Array.isArray(result.order)) {
    const hit = result.order.find((r) => normHorse(r.horse) === target);
    if (hit) return hit.position;
    if (result.nonRunners?.some((n) => normHorse(n) === target)) return null;
    return Infinity;
  }
  // Legacy hand-entered result: only the first three are known.
  const seq = [result.winner, result.second, result.third, result.fourth,
               result.fifth, result.sixth, result.seventh];
  const idx = seq.findIndex((h) => h && normHorse(h) === target);
  return idx >= 0 ? idx + 1 : null; // null = unknown, not "unplaced"
}

/**
 * Build our race key ("HH:MM-dayIndex") from an API race.
 * Keeps API-sourced results droppable straight into the existing *_RESULTS maps.
 */
function raceKeyFor(apiRace, dayIndex) {
  const raw = apiRace.off_time ?? apiRace.off ?? apiRace.off_dt ?? '';
  const m = String(raw).match(/(\d{1,2}):(\d{2})/);
  const off = m ? `${m[1].padStart(2, '0')}:${m[2]}` : String(raw).trim();
  return `${off}-${dayIndex}`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RACING_API_FIELDS, RACING_API_GAPS,
    normaliseApiResult, positionOf, raceKeyFor, normHorse,
  };
}
