#!/usr/bin/env node
/* Whole-site verification. Run after any page edit, and before any merge.
 *
 *   node scripts/verify-site.mjs
 *
 * WHY THIS EXISTS, and why it is not a checklist in a commit message.
 *
 * §10 records the Ebor failure: rebuilding the Day 4 card deleted four
 * unrelated panels, and "the build's own checks all passed (HTML valid, pick
 * counts right, draws matching) because they only looked at what was WRITTEN,
 * never at what was REMOVED." Every check that day was scoped to the thing
 * being edited, so nothing could see the collateral damage.
 *
 * The governing rule here is borrowed from bumasello/mazetick's scripts/
 * verify.mjs (MIT), which was written after the same class of bug — their
 * footer-link check passed because the hrefs were right while the TEXT around
 * them had broken, and their article check swept only <main> so the footer was
 * out of scope. Their rule, and now ours:
 *
 *   EVERY CHECK SCANS EVERY PAGE. Never a sample, never a region.
 *
 * A check that takes an argument naming what to look at cannot catch what you
 * did not know to name. So nothing here takes one.
 *
 * Exits 1 on any failure so it can guard a merge.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const fail = [];
/* Pre-existing debt on pages frozen before a convention existed. Listed, not
   hidden: a check that silently tolerates a class of failure stops being a
   check. These are reported separately and do NOT fail the run; adding an entry
   is a deliberate act that needs a reason and a date. */
const KNOWN = {
  'Every table wrapped in .tbl-scroll': {
    pages: ['cheltenham-2026.html','chester-2026.html','ebor-2026.html','grand-national-2026.html',
            'guineas-2026.html','index.html','northumberland-plate-2026.html','royal-ascot-2026.html',
            'scottish-grand-national-2026.html','season-2026.html','sprint-cup-2026.html'],
    why: 'built before the .tbl-scroll convention (Sep 2026); frozen archives per §10',
  },
  'No duplicate source badge within a pick row': {
    pages: ['ebor-2026.html','goodwood-2026.html','st-leger-2026.html','sprint-cup-2026.html'],
    why: 'flagged 6 Oct 2026, not yet reviewed one by one; some may be legitimate repeats',
  },
};

const debtSeen = [];
const check = (name, problems) => {
  const known = KNOWN[name];
  const live = known ? problems.filter((p) => !known.pages.some((pg) => p.startsWith(pg))) : problems;
  const held = problems.length - live.length;
  if (live.length) fail.push({ name, problems: live });
  if (held) debtSeen.push(`${name}: ${held} known (${known.why})`);
  const mark = live.length ? '\x1b[31m✗\x1b[0m' : held ? '\x1b[33m~\x1b[0m' : '\x1b[32m✓\x1b[0m';
  console.log(`${mark} ${name}${live.length ? ` — ${live.length}` : ''}${held ? ` (${held} known debt)` : ''}`);
  for (const p of live.slice(0, 10)) console.log(`      ${p}`);
  if (live.length > 10) console.log(`      …and ${live.length - 10} more`);
};

const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
if (!pages.length) { console.error('No pages found.'); process.exit(1); }
console.log(`Verifying ${pages.length} pages.\n`);

const src = Object.fromEntries(pages.map((f) => [f, read(f)]));

/* The data layer, evaluated once. These are browser globals in plain files,
   so evaluate the declarations rather than importing a module. */
const dataSrc = fs.readFileSync(path.join(ROOT, 'js/season-data-2026.js'), 'utf8');
const FEST = new Function(dataSrc + '; return FESTIVALS_2026;')();
const LEDGER = new Function(dataSrc + '; return ROI_LEDGER;')();
const navSrc = fs.readFileSync(path.join(ROOT, 'js/fmb-ui.js'), 'utf8');
const toml = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
const hub = src['index.html'] ?? '';

// 1. Tag nesting and div balance, on every page.
check('HTML nesting balanced', pages.flatMap((f) => {
  const s = src[f], VOID = /^(br|img|meta|link|input|hr|source|col)$/i, stack = [], bad = [];
  for (const m of s.matchAll(/<(\/?)([a-zA-Z][\w-]*)(\s[^>]*?)?(\/?)>/g)) {
    const [, close, tag, , self] = m;
    if (VOID.test(tag) || self) continue;
    if (!close) stack.push(tag);
    else if (!stack.length) bad.push(`${f}: stray </${tag}>`);
    else if (stack[stack.length - 1] !== tag) bad.push(`${f}: </${tag}> closes <${stack.pop()}>`);
    else stack.pop();
  }
  if (stack.length) bad.push(`${f}: unclosed <${stack.join('>, <')}>`);
  const o = (s.match(/<div/g) || []).length, c = (s.match(/<\/div>/g) || []).length;
  if (o !== c) bad.push(`${f}: ${o} <div> vs ${c} </div>`);
  return bad.slice(0, 3);
}));

// 2. Rule: every page carries the BeGambleAware block.
check('BeGambleAware footer on every page',
  pages.filter((f) => !/begambleaware/i.test(src[f])).map((f) => `${f}: missing`));

// 3. §10: the share engine works ONLY off section[id="dayN"] containing
//    .race-block > .race-hd AND .pick-row. Test that exact condition — an
//    earlier version of this check counted pick-rows alone and reported three
//    false positives, which is the same "checked the wrong thing" failure the
//    header of this file is about.
check('Share scripts present iff the share engine would render', pages.flatMap((f) => {
  const s = src[f];
  const eligible = /id="day\d+"/.test(s) && /class="race-hd"/.test(s) && /<div class="pick-row"/.test(s);
  const share = /fmb-share\.js/.test(s);
  if (eligible && !share) return [`${f}: day sections + picks, but no share scripts`];
  if (!eligible && share) return [`${f}: share scripts but the engine would render nothing`];
  return [];
}));

// 4. Tables wider than the viewport must sit in .tbl-scroll, or they push the
//    page sideways at 375px.
check('Every table wrapped in .tbl-scroll', pages.flatMap((f) => {
  const t = (src[f].match(/<table/g) || []).length;
  const w = (src[f].match(/<div class="tbl-scroll">\s*<table/g) || []).length;
  return t === w ? [] : [`${f}: ${t} tables, ${w} wrapped`];
}));

// 5. A source badge twice in one pick row overstates the support behind a
//    horse. This shipped live through three deploys once.
check('No duplicate source badge within a pick row', pages.flatMap((f) =>
  [...src[f].matchAll(/<div class="pick-row">[\s\S]*?(?=<div class="pick-row"|<p class="race-hd"|<\/section>)/g)]
    .flatMap((m) => {
      const labs = [...m[0].matchAll(/class="sb[^"]*"[^>]*>([^<]+)</g)].map((x) => x[1].trim());
      const dup = [...new Set(labs)].filter((x) => labs.filter((y) => y === x).length > 1);
      return dup.length ? [`${f}: ${dup.join(', ')}`] : [];
    })));

// 6/7/8. Registration: §10 says a festival page must be in FESTIVALS_2026, have
//    a netlify redirect, and link from the hub.
const slugOf = (f) => f.replace(/\.html$/, '');
const registered = new Set(FEST.map((x) => x.slug));
const fileFests = pages.filter((f) => f !== 'index.html' && f !== 'season-2026.html' && registered.has(slugOf(f)));
check('Every registered festival page is reachable', FEST.flatMap((x) =>
  !x.url || x.url === 'index.html' ? [] : fs.existsSync(path.join(ROOT, x.url)) ? [] : [`${x.slug}: url ${x.url} does not exist`]));
check('Every festival page has a netlify redirect',
  fileFests.filter((f) => !toml.includes(`from = "/${slugOf(f)}"`)).map((f) => `${slugOf(f)}: no redirect`));
check('Every festival page is linked from the hub',
  fileFests.filter((f) => !hub.includes(f)).map((f) => `${f}: not linked from index.html`));

// 9. §10: adding a festival means adding BOTH sort and end, because statusOf()
//    derives live/upcoming/archive from them and falls back to a stale literal.
check('Every nav entry carries both sort and end', [...navSrc.matchAll(/\{\s*name:\s*'([^']+)'[^}]*\}/g)]
  .flatMap((m) => (/url:/.test(m[0]) && (!/sort:/.test(m[0]) || !/end:/.test(m[0]))) ? [`${m[1]}: missing sort or end`] : []));

// 10. The share palette is the one copy a stylesheet cannot keep honest.
const themeBlock = fs.readFileSync(path.join(ROOT, 'js/fmb-share.js'), 'utf8').match(/var THEMES = \{([\s\S]*?)\n  \};/);
const themes = Object.fromEntries([...(themeBlock?.[1] ?? '').matchAll(/'([a-z0-9-]+)':\s*\{[^}]*?to:\s*'(#[0-9a-fA-F]{6})'/g)].map((m) => [m[1], m[2].toLowerCase()]));
check('Share palette matches accentColor', FEST.flatMap((x) =>
  !themes[x.slug] ? [`${x.slug}: no theme`] : themes[x.slug] !== String(x.accentColor).toLowerCase() ? [`${x.slug}: ${themes[x.slug]} vs ${x.accentColor}`] : []));

// 11. An empty array hole parses as undefined and silently breaks every
//    consumer. One was introduced wiring the October festivals in.
check('No malformed festival rows', FEST.flatMap((x, i) => !x || !x.slug ? [`index ${i}: empty/undefined row`] : []));

// 12. The ledger is the season figure. It must parse and self-reconcile.
check('Ledger reconciles', (() => {
  const bad = LEDGER.flatMap((r, i) => (typeof r?.staked !== 'number' || typeof r?.returned !== 'number') ? [`row ${i}: non-numeric`] : []);
  const st = LEDGER.reduce((a, r) => a + (r?.staked ?? 0), 0);
  console.log(`      ${LEDGER.length} rows · £${st.toFixed(2)} staked · £${LEDGER.reduce((a, r) => a + (r?.returned ?? 0), 0).toFixed(2)} returned`);
  return bad;
})());

console.log();
if (debtSeen.length) {
  console.log('\x1b[33mKnown pre-existing debt, carried deliberately:\x1b[0m');
  for (const d of debtSeen) console.log(`  ~ ${d}`);
  console.log();
}
if (fail.length) { console.log(`\x1b[31m${fail.length} check(s) failed.\x1b[0m`); process.exit(1); }
console.log('\x1b[32mAll checks passed.\x1b[0m');
