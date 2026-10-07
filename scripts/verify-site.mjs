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
    pages: ['ebor-2026.html','goodwood-2026.html','st-leger-2026.html','sprint-cup-2026.html',
            'royal-ascot-2026.html'],
    why: 'narrowing the row boundary to sibling rows cleared 17 of 19; the rest are on the oldest '
       + 'pages, whose race blocks nest differently, and are unreviewed rather than known-good',
  },
};

/* HTML defines a handful of genuinely mixed-case named entities; everything
   else with a capital in it is a typo for the lowercase form. */
const KNOWN_MIXED = new Set(['&Alpha;','&Beta;','&Gamma;','&Delta;','&Epsilon;','&Zeta;','&Eta;',
  '&Theta;','&Iota;','&Kappa;','&Lambda;','&Mu;','&Nu;','&Xi;','&Omicron;','&Pi;','&Rho;','&Sigma;',
  '&Tau;','&Upsilon;','&Phi;','&Chi;','&Psi;','&Omega;','&Aacute;','&Agrave;','&Acirc;','&Atilde;',
  '&Auml;','&Aring;','&AElig;','&Ccedil;','&Eacute;','&Egrave;','&Ecirc;','&Euml;','&Iacute;',
  '&Igrave;','&Icirc;','&Iuml;','&Ntilde;','&Oacute;','&Ograve;','&Ocirc;','&Otilde;','&Ouml;',
  '&Oslash;','&Uacute;','&Ugrave;','&Ucirc;','&Uuml;','&Yacute;','&ETH;','&THORN;','&Dagger;',
  '&OElig;','&Scaron;','&Yuml;','&Prime;','&ImaginaryI;','&TRADE;']);

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
//    RESOLVED 6 Oct 2026, and the check was wrong for the THIRD time. The two
//    earlier versions counted pick-rows alone; this one tested `id="day\d+"`,
//    `race-hd` and `pick-row` anywhere on the PAGE. The engine's condition is a
//    NESTING one — a .race-block inside the dayN section — so a page-level
//    regex cannot express it however many terms it ands together.
//
//    northumberland-plate is exactly that shape: three dayN sections that hold
//    RESULTS tables, with the tips cards in sibling sections carrying no day
//    anchor. 76 pick rows on the page, zero reachable from a day section.
//    Confirmed by running the engine's own predicate in a real browser across
//    every page — scripts/analysis/share-eligibility.mjs, 0 mismatches.
//
//    So scope it properly: walk each dayN section's span by counting section
//    tags, and look for the race-block inside that span.
const daySpans = (s) => {
  const out = [];
  const open = /<section\b[^>]*\bid="(day\d+|d\d+)"[^>]*>/g;
  let m;
  while ((m = open.exec(s))) {
    // Walk forward counting <section>/</section> until this one closes.
    let depth = 1;
    const tag = /<\/?section\b/g;
    tag.lastIndex = m.index + m[0].length;
    let t;
    while (depth > 0 && (t = tag.exec(s))) {
      depth += t[0] === '</section' ? -1 : 1;
    }
    out.push({ id: m[1], inner: s.slice(m.index + m[0].length, t ? t.index : s.length) });
  }
  return out;
};

check('Share scripts present iff the share engine would render', pages.flatMap((f) => {
  const s = src[f];
  // A day renders iff it contains a race-block that has BOTH a head and a pick.
  const renders = daySpans(s).filter((d) =>
    /class="race-block"/.test(d.inner) && /class="race-hd"/.test(d.inner) && /class="pick-row"/.test(d.inner));
  const share = /fmb-share\.js/.test(s);
  if (renders.length && !share) return [`${f}: ${renders.length} renderable day(s) (${renders.map((d) => d.id).join(', ')}), but no share scripts`];
  if (!renders.length && share) return [`${f}: share scripts but no day section the engine would render`];
  return [];
}));

// 3b. An HTML entity is case-sensitive: &NDASH; is not &ndash;, it renders as
//     literal text. Found 7 Oct 2026 on FOUR pages at once -- the Phase 8
//     generator uppercased a live-strip date label in the source instead of
//     leaving it to CSS text-transform, so every multi-day page it built shipped
//     "9&NDASH;10 OCT 2026" into the banner. The single-day pages were clean
//     only because they have no date range. Nothing caught it: it is valid HTML,
//     it nests correctly, and it is visible only by looking at the page.
check('No malformed HTML entities', pages.flatMap((f) => {
  const bad = [...new Set((src[f].match(/&[A-Za-z][A-Za-z0-9]*;/g) || [])
    .filter((e) => /[A-Z]/.test(e) && e !== e.toLowerCase() && !KNOWN_MIXED.has(e)))];
  return bad.length ? [`${f}: ${bad.join(', ')}`] : [];
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
//
//    Stop at the next SIBLING ROW, not just the next pick-row: a race block ends
//    with tipster and BIG-naps rows that legitimately carry the same badges, and
//    an earlier version of this check ran past them and reported three false
//    positives on royal-ascot. A check that cries wolf gets switched off.
check('No duplicate source badge within a pick row', pages.flatMap((f) =>
  [...src[f].matchAll(/<div class="pick-row">[\s\S]*?(?=<div class="(?:pick-row|tip-row|l15-foot)"|<p class="race-hd"|<\/section>)/g)]
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
