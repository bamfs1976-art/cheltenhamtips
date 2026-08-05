// Shared client for The Racing API (https://theracingapi.com).
//
// Credentials come from the environment and never touch client-side code:
//   RACING_API_USERNAME
//   RACING_API_PASSWORD
//
// Free-tier constraints this client respects:
//   - HTTP Basic auth
//   - 1 request per second on the free endpoints
//   - /v1/racecards/free accepts day=today|tomorrow only (no arbitrary date)
//   - /v1/results/today/free is today only — there is no free history backfill
//
// Because the free tier cannot look backwards, every raw payload is written to
// data/racing-api/ so that today's data becomes tomorrow's archive.

import fs from 'node:fs/promises';
import path from 'node:path';

const BASE = 'https://api.theracingapi.com';
const CACHE_DIR = path.resolve('data/racing-api');

// Endpoints available on the free plan, with their per-second rate limit.
export const FREE_ENDPOINTS = {
  '/v1/courses': 1,
  '/v1/courses/regions': 1,
  '/v1/racecards/free': 1,
  '/v1/results/today/free': 1,
};

let lastRequestAt = 0;

function credentials() {
  const user = process.env.RACING_API_USERNAME;
  const pass = process.env.RACING_API_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      'RACING_API_USERNAME and RACING_API_PASSWORD must be set.\n' +
        'Get a free key at https://theracingapi.com and export them, or add them\n' +
        'to the Netlify environment for the deployed proxy.'
    );
  }
  return Buffer.from(`${user}:${pass}`).toString('base64');
}

async function throttle(perSecond) {
  const minGap = 1000 / perSecond;
  const wait = lastRequestAt + minGap - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

/**
 * GET an endpoint on The Racing API.
 * Retries on 429 and 5xx with exponential backoff.
 */
export async function get(endpoint, params = {}, { retries = 4 } = {}) {
  const limit = FREE_ENDPOINTS[endpoint];
  if (limit === undefined) {
    throw new Error(
      `${endpoint} is not on the free plan. Paid endpoints are deliberately not ` +
        'wired up — add it to FREE_ENDPOINTS only once the subscription covers it.'
    );
  }

  const url = new URL(BASE + endpoint);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }

  const auth = credentials();
  let lastErr;

  for (let attempt = 0; attempt <= retries; attempt++) {
    await throttle(limit);
    let res;
    try {
      res = await fetch(url, {
        headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
      });
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
      continue;
    }

    if (res.ok) return res.json();

    if (res.status === 401 || res.status === 403) {
      throw new Error(
        `${res.status} from ${endpoint} — check the credentials, and check the ` +
          'endpoint is included in your plan.'
      );
    }
    if (res.status === 429 || res.status >= 500) {
      lastErr = new Error(`${res.status} from ${endpoint}`);
      await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
      continue;
    }
    throw new Error(`${res.status} from ${endpoint}: ${(await res.text()).slice(0, 300)}`);
  }
  throw lastErr ?? new Error(`${endpoint} failed after ${retries} retries`);
}

/** Write a raw payload to the archive. The free tier has no history, so this is ours. */
export async function archive(name, payload) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, `${name}.json`);
  await fs.writeFile(file, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  return file;
}

/** Read a previously archived payload, or null if it isn't there. */
export async function readArchive(name) {
  try {
    return JSON.parse(await fs.readFile(path.join(CACHE_DIR, `${name}.json`), 'utf8'));
  } catch {
    return null;
  }
}

/** Racecards for today or tomorrow. Free tier accepts no other day. */
export async function racecards({ day = 'today', regionCodes = ['gb'], courseIds } = {}) {
  if (!['today', 'tomorrow'].includes(day)) {
    throw new Error(`day must be "today" or "tomorrow" on the free plan (got "${day}")`);
  }
  const params = { day, limit: 500 }; // spec max for this endpoint
  if (regionCodes?.length) params.region_codes = regionCodes.join(',');
  if (courseIds?.length) params.course_ids = courseIds.join(',');
  return get('/v1/racecards/free', params);
}

/**
 * Today's results. There is no free endpoint for any other date.
 * limit is capped at 100 by the API (a larger value returns 422), so this
 * pages through with skip until a short page comes back.
 */
export async function resultsToday({ region = 'gb', maxPages = 10 } = {}) {
  const PAGE = 100;
  const all = [];
  let raw = null;
  for (let page = 0; page < maxPages; page++) {
    const res = await get('/v1/results/today/free', {
      region,
      limit: PAGE,
      skip: page * PAGE,
    });
    raw = raw ?? res;
    const batch = res.results ?? res.data ?? [];
    all.push(...batch);
    if (batch.length < PAGE) break;
  }
  return { ...raw, results: all };
}

/** Course list, used to resolve a course name to its course_id. */
export async function courses({ regionCodes = ['gb'] } = {}) {
  return get('/v1/courses', { region_codes: regionCodes.join(',') });
}


/* ── Field-name resolution ──────────────────────────────────────────
 * The free plan's RacecardBasic uses different names from the Pro
 * racecard and from the published examples. Verified against the
 * OpenAPI spec, 2026-08-05:
 *   free:  off_time, distance_f, race_class, sex_restriction, field_size
 *   pro/examples: off, dist_f, class, sex_rest
 * These resolvers accept either, so the same code works on both plans.
 */
const pick = (obj, ...names) => {
  for (const n of names) {
    const v = obj?.[n];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return null;
};

/** Off time as "HH:MM" — the race key prefix. */
export function raceOff(race) {
  const v = pick(race, 'off_time', 'off');
  if (v) {
    const m = String(v).match(/(\d{1,2}):(\d{2})/);
    if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
    return String(v);
  }
  const dt = pick(race, 'off_dt');
  if (dt) {
    const m = String(dt).match(/T?(\d{2}):(\d{2})/);
    if (m) return `${m[1]}:${m[2]}`;
  }
  return null;
}

export const raceDistanceF = (race) => pick(race, 'distance_f', 'dist_f');
export const raceClass     = (race) => pick(race, 'race_class', 'class');
export const raceType      = (race) => pick(race, 'type');
export const raceGoing     = (race) => pick(race, 'going');
export const raceStatus    = (race) => pick(race, 'race_status');

/** Declared field size — the API states it directly on the free plan. */
export function raceFieldSize(race) {
  const n = pick(race, 'field_size');
  if (n !== null && Number.isFinite(Number(n))) return Number(n);
  return Array.isArray(race?.runners) ? race.runners.length : 0;
}

/** Case- and punctuation-insensitive horse-name comparison. */
export function sameHorse(a, b) {
  const norm = (x) =>
    String(x ?? '')
      .toLowerCase()
      .replace(/\([a-z]{2,3}\)/g, '') // strip country suffixes: Foo (IRE)
      .replace(/[^a-z0-9]/g, '')
      .trim();
  return norm(a) !== '' && norm(a) === norm(b);
}

/** Today in UK format, for filenames and display. */
export function ukDate(d = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(d)
    .split('/')
    .reverse()
    .join('-'); // YYYY-MM-DD
}
