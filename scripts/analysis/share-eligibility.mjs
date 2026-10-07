/* Share-button eligibility: does verify-site's regex scoping agree with the
 * share engine's own DOM scoping, on every page?
 *
 * WHY THIS EXISTS. The "share scripts present iff the engine would render"
 * check was wrong three times running. Twice it counted .pick-row elements
 * alone; the third version and'ed three page-level regexes together. The
 * engine's condition (js/fmb-share.js, the day-section filter) is a NESTING
 * one — a .race-block INSIDE a section whose id is dayN — and no page-level
 * regex can express that, however many terms it has.
 *
 * It mattered on northumberland-plate-2026.html, whose three dayN sections
 * hold RESULTS tables while the tips cards sit in sibling sections with no day
 * anchor: 76 pick rows on the page, none reachable from a day section. §10
 * said that page gets no buttons; the check said it should. §10 was right.
 *
 * RESULT 6 Oct 2026 — 0 divergences across 25 pages. Six pages render and
 * carry the scripts (cambridgeshire day2-3, ebor day1-4, goodwood day1-5,
 * newmarket-july day1-3, sprint-cup day1-3, st-leger day1-4); the other
 * nineteen render nothing and correctly have none.
 *
 *   node scripts/analysis/share-eligibility.mjs     # needs a server on :8899
 *   python3 -m http.server 8899                     # from the repo root
 *
 * If this ever reports a divergence, the regex in verify-site.mjs is the thing
 * that is wrong — the browser is running the actual engine.
 */
import fs from 'node:fs';
import { chromium } from 'playwright-core';
const ROOT = '/home/user/cheltenhamtips';
const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).sort();

const daySpans = (s) => {
  const out = []; const open = /<section\b[^>]*\bid="(day\d+|d\d+)"[^>]*>/g; let m;
  while ((m = open.exec(s))) {
    let depth = 1; const tag = /<\/?section\b/g; tag.lastIndex = m.index + m[0].length; let t;
    while (depth > 0 && (t = tag.exec(s))) depth += t[0] === '</section' ? -1 : 1;
    out.push({ id: m[1], inner: s.slice(m.index + m[0].length, t ? t.index : s.length) });
  }
  return out;
};

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage();
let diff = 0;
for (const f of pages) {
  const s = fs.readFileSync(`${ROOT}/${f}`, 'utf8');
  const regex = daySpans(s).filter(d =>
    /class="race-block"/.test(d.inner) && /class="race-hd"/.test(d.inner) && /class="pick-row"/.test(d.inner)
  ).map(d => d.id);
  await p.goto(`http://localhost:8899/${f}`, { waitUntil: 'domcontentloaded' });
  /* Count the share buttons the ENGINE actually rendered, rather than
     re-implementing its predicate here. Corrected 7 Oct 2026: this script
     previously reimplemented the day filter, and on 6 Oct that copy was
     STRICTER than fmb-share-ui.js itself -- which required only a .race-block,
     so it put a button on a fully gated day. Two agreeing reimplementations are
     not a check on the original; only running it is. Found by rendering the page
     and counting buttons, which is what this now does. */
  await p.waitForFunction(() => document.readyState === 'complete');
  const dom = await p.evaluate(() => Array.prototype.slice
    .call(document.querySelectorAll('.fmb-share-row'))
    .map(r => r.closest('section')?.id)
    .filter(Boolean));
  const same = JSON.stringify(regex) === JSON.stringify(dom);
  if (!same) { diff++; console.log(`DIVERGES ${f}: regex=[${regex}] dom=[${dom}]`); }
  else if (dom.length) console.log(`ok ${f.padEnd(34)} ${dom.join(', ')}`);
}
await b.close();
console.log(`\n${diff} divergence(s) between the regex scoping and the engine's DOM scoping.`);
