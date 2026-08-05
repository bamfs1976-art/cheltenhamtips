#!/usr/bin/env node
// End-to-end check that The Racing API is wired up and returning the shapes
// gate-check.mjs and settle.mjs depend on.
//
//   node scripts/api-selftest.mjs
//   node scripts/api-selftest.mjs --course york      # Ebor readiness
//
// Exits 0 if everything the engine needs is present, 1 otherwise.

import { get, racecards, resultsToday, courses, archive, ukDate } from './lib/racing-api.mjs';

const ok = (s) => `\x1b[32m✓\x1b[0m ${s}`;
const bad = (s) => `\x1b[31m✗\x1b[0m ${s}`;
const warn = (s) => `\x1b[33m⚠\x1b[0m ${s}`;
const dim = (s) => `\x1b[90m${s}\x1b[0m`;

let failures = 0;
const check = (cond, pass, fail) => {
  if (cond) console.log(ok(pass));
  else { console.log(bad(fail)); failures++; }
  return cond;
};

function first(payload, ...keys) {
  for (const k of keys) if (Array.isArray(payload?.[k])) return payload[k];
  return Array.isArray(payload) ? payload : [];
}

async function step(label, fn) {
  process.stdout.write(dim(`… ${label}\r`));
  try {
    const r = await fn();
    process.stdout.write(' '.repeat(60) + '\r');
    return r;
  } catch (err) {
    process.stdout.write(' '.repeat(60) + '\r');
    console.log(bad(`${label} — ${err.message.split('\n')[0]}`));
    failures++;
    return null;
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--course');
  const course = i >= 0 ? argv[i + 1] : null;

  console.log(`\nThe Racing API — self-test · ${ukDate()}\n`);

  // 1. Credentials
  if (!process.env.RACING_API_USERNAME || !process.env.RACING_API_PASSWORD) {
    console.log(bad('RACING_API_USERNAME / RACING_API_PASSWORD are not set in this shell.'));
    console.log(dim('   Netlify env vars do not reach a local shell — export them here too:'));
    console.log(dim("   export RACING_API_USERNAME='...'  export RACING_API_PASSWORD='...'"));
    process.exitCode = 1;
    return;
  }
  console.log(ok('credentials present in the environment'));

  // 2. Auth + cheapest endpoint
  const regions = await step('checking auth', () => get('/v1/courses/regions'));
  if (!regions) {
    console.log(dim('\n   Auth failed — nothing else can be tested.'));
    process.exitCode = 1;
    return;
  }
  console.log(ok('authenticated (HTTP Basic accepted)'));

  // 3. Courses — resolve the meeting we care about
  const cx = await step('fetching courses', () => courses());
  const courseList = first(cx, 'courses', 'data');
  check(courseList.length > 0, `courses endpoint returned ${courseList.length} GB courses`,
        'courses endpoint returned nothing');
  if (course) {
    const hits = courseList.filter((c) =>
      String(c.course ?? c.name ?? '').toLowerCase().includes(course.toLowerCase()));
    check(hits.length > 0,
      `"${course}" found: ${hits.map((h) => `${h.course ?? h.name} (id ${h.id ?? h.course_id})`).join(', ')}`,
      `"${course}" not found in the course list`);
  }

  // 4. Racecards — what the pre-flight gate needs
  const rc = await step('fetching racecards (today)', () => racecards({ day: 'today' }));
  const cards = first(rc, 'racecards', 'data');
  if (cards.length === 0) {
    console.log(warn('racecards/free returned 0 races for today — check again on a race day'));
  } else {
    console.log(ok(`racecards/free returned ${cards.length} races today`));
    const withRunners = cards.filter((r) => Array.isArray(r.runners) && r.runners.length);
    check(withRunners.length > 0, `${withRunners.length} races carry a declared runner list`,
          'no race carried a runners array — the gate cannot run');
    const sample = withRunners[0];
    if (sample) {
      const r0 = sample.runners[0];
      const drawn = sample.runners.filter((r) => r.draw !== undefined && r.draw !== null && r.draw !== '');
      console.log(dim(`   sample: ${sample.off ?? '?'} ${sample.course ?? '?'} — ${sample.race_name ?? '?'} (${sample.runners.length} runners)`));
      check(r0.horse !== undefined, 'runner.horse present', 'runner.horse MISSING');
      check(drawn.length > 0 || String(sample.type ?? '').includes('jump'),
            `runner.draw present on ${drawn.length}/${sample.runners.length} runners`,
            'runner.draw MISSING — the flat draw rule cannot be enforced');
      check(sample.off !== undefined, 'race.off present (used as the race key)', 'race.off MISSING');
      ['class', 'type', 'going', 'dist_f'].forEach((k) => {
        if (sample[k] === undefined) console.log(warn(`race.${k} absent — card metadata will be thinner`));
      });
    }
    if (course) {
      const mine = cards.filter((r) => String(r.course ?? '').toLowerCase().includes(course.toLowerCase()));
      console.log(mine.length
        ? ok(`${mine.length} races at "${course}" today`)
        : dim(`   no racing at "${course}" today — expected unless the meeting is on`));
    }
  }

  // 5. Results — what settlement needs
  const rs = await step('fetching results (today)', () => resultsToday());
  const results = first(rs, 'results', 'data');
  if (results.length === 0) {
    console.log(warn('results/today/free returned 0 races — normal before the first race is settled'));
  } else {
    console.log(ok(`results/today/free returned ${results.length} settled races`));
    const sample = results.find((r) => Array.isArray(r.runners) && r.runners.length);
    if (sample) {
      const positioned = sample.runners.filter((r) => Number.isFinite(Number(r.position)));
      console.log(dim(`   sample: ${sample.off ?? '?'} ${sample.course ?? '?'} — ${sample.runners.length} runners`));
      check(positioned.length > 0,
        `runner.position present on ${positioned.length}/${sample.runners.length} runners ` +
          `— full finishing order, not just the first three`,
        'runner.position MISSING — settlement cannot resolve places');
      check(sample.runners.some((r) => r.sp !== undefined),
        'runner.sp present (starting price)', 'runner.sp absent — SP settlement by hand');
    }
  }

  // 6. Archive is writable — the free tier has no history, so this matters
  const f = await step('writing to the archive', () =>
    archive(`selftest-${ukDate()}`, { ok: true, ranAt: ukDate() }));
  check(!!f, `archive is writable (${f})`, 'could not write to data/racing-api/');

  // ── verdict ──
  console.log('');
  if (failures === 0) {
    console.log(ok('\x1b[1mAll checks passed — the engine can run off the API.\x1b[0m'));
    console.log(dim('   Pre-flight gate:  node scripts/gate-check.mjs --course york --day tomorrow'));
    console.log(dim('   Settlement:       node scripts/settle.mjs --course york'));
  } else {
    console.log(bad(`\x1b[1m${failures} check(s) failed.\x1b[0m See docs/racing-api.md.`));
  }
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((err) => {
  console.error(`\n${err.message}\n`);
  process.exitCode = 2;
});
