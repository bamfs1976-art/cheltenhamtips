/* Renders the Day 1 external-consensus share card to a 1080x1350 PNG.
 *
 * WHY A SECOND CARD TYPE. js/fmb-share.js draws OUR day: a NAP/NB/LONG row per
 * race, priced, and once the day has run, settled. Day 1 here has no priced
 * card — no declared racecard has been pasted, so rule 13 holds and the page
 * says NO BET. Feeding other people's selections through the day card would
 * render them in our slot colours, which is the one thing a share card must
 * never do: it is the artefact that LEAVES the site, where nobody can hold it
 * against the page it came from.
 *
 * NO SECOND COPY OF THE PALETTE. The theme is read out of js/fmb-share.js at
 * render time, so scripts/check-share-palette.mjs still pins these colours to
 * FESTIVALS_2026[].accentColor. Only the layout is new.
 *
 * Numbers come from cheltenham-nov-day1-consensus.mjs — imported, never
 * retyped (CLAUDE.md §10, 8 Oct: read a figure off its derivation).
 *
 *   node scripts/analysis/render-consensus-card.mjs [out.png]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { RACES, ROWS, desks, pairs, crossovers } from './cheltenham-nov-day1-consensus.mjs';

const { chromium } = (() => {
  const req = createRequire(import.meta.url);
  for (const id of ['playwright-core', '/opt/node-tools/node_modules/playwright-core']) {
    try { return req(id); } catch { /* try the next */ }
  }
  throw new Error('playwright-core not found — install it or point at the container tool install.');
})();

/* Discover Chromium rather than assert a path: the container image moves and
   a hardcoded build number stops existing (§10, 25 Oct). */
const chromeExe = (() => {
  const root = '/opt/pw-browsers';
  for (const dir of fs.readdirSync(root).filter(d => d.startsWith('chromium-')).sort().reverse()) {
    for (const sub of ['chrome-linux64', 'chrome-linux']) {
      const exe = `${root}/${dir}/${sub}/chrome`;
      if (fs.existsSync(exe)) return exe;
    }
  }
  throw new Error(`No Chromium found under ${root} — the container image has moved again.`);
})();

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const OUT = process.argv[2] || path.join(ROOT, 'cheltenham-nov-day1-consensus.png');

/* The theme, from the engine itself. */
const engine = fs.readFileSync(path.join(ROOT, 'js/fmb-share.js'), 'utf8');
const sandbox = {};
new Function('globalThis', engine).call(sandbox, sandbox);
const TH = sandbox.FMBShare.theme('cheltenham-november-2026');

/* Badge colours are the §6 registry's. RC (@RoadCheltenham) is new today. */
const BADGE = { RO: '#a78bfa', SPOT: '#f0abfc', BG: '#ea580c', RC: '#fca5a5' };

const deskTips = Object.fromEntries(desks.map(d => [d.code, d]));
const tips = desks.reduce((n, d) => n + Object.values(d.picks).reduce((m, s) => m + s.length, 0), 0);
const shared = pairs.reduce((n, p) => n + p.shared, 0);
const diverge = pairs.reduce((n, p) => n + p.diverge, 0);
const tested = pairs.filter(p => p.shared > 0).length;
const liveRaces = RACES.filter(r => desks.filter(d => (d.picks[r.time] || []).length).length > 1).length;
const panels = ROWS.filter(r => r.kind === 'panel').length;
const absent = ROWS.filter(r => r.kind === 'absent').length;

/* One line per desk. The divergence record is computed; the standing note is
   what the archive already knows about that column (CLAUDE.md §6). */
const NOTE = {
  RO:   'value column, big prices \u2014 agrees with nobody, as usual',
  SPOT: 'one desk, one verdict per race \u2014 it cannot agree with itself',
  BG:   'HRN masthead \u2014 4th independence test: 2/3, 2/3, 6/6, now 3/3',
  RC:   'new column \u2014 two tips is too few to settle independence either way'
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const raceRow = (r, i) => {
  const held = desks.filter(d => (d.picks[r.time] || []).length);
  const cells = held.length
    ? held.map(d => `<span class="t"><b style="color:${BADGE[d.code]};background:${BADGE[d.code]}22;border-color:${BADGE[d.code]}66">${d.code}</b>${esc((d.picks[r.time] || []).join(' / '))}</span>`).join('')
    : '<span class="none">no column holds a view here</span>';
  return `<div class="race${i % 2 ? '' : ' alt'}">
    <div class="rh"><span class="tm">${r.time}</span><span class="nm">${esc(r.name)}</span>
      <span class="cnt">${held.length ? held.length + (held.length === 1 ? ' opinion' : ' opinions') : '—'}</span></div>
    <div class="tips">${cells}</div>
  </div>`;
};

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: 1080px 1350px; margin: 0 }
  * { box-sizing: border-box; margin: 0; padding: 0 }
  body { width: 1080px; height: 1350px; background: #fff; overflow: hidden;
         font-family: Inter, system-ui, sans-serif; -webkit-font-smoothing: antialiased }
  .disp { font-family: 'Playfair Display','Bitstream Charter',Georgia,serif }
  .band { height: 168px; padding: 44px 64px 0;
          background: linear-gradient(90deg, ${TH.from}, ${TH.to}); position: relative }
  .strap { font-weight: 700; font-size: 21px; color: rgba(255,255,255,.82); letter-spacing: .02em }
  .ttl { font-weight: 700; font-size: 46px; color: #fff; margin-top: 14px }
  .shoe { position: absolute; right: 56px; top: 36px; width: 92px; height: 92px }
  .sub { padding: 22px 64px 0; font-weight: 600; font-size: 21px; color: #475569 }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 18px 64px 0 }
  .st { background: #f4f6fa; border-radius: 13px; height: 86px; text-align: center; padding-top: 12px }
  .st .v { font-weight: 700; font-size: 32px }
  .st .l { font-weight: 600; font-size: 13.5px; color: #8b94a5; margin-top: 4px; line-height: 1.25 }
  .races { padding: 18px 48px 0 }
  .race { border-radius: 14px; padding: 12px 16px 14px }
  .race.alt { background: #f7f9fc }
  .rh { display: flex; align-items: baseline; gap: 12px }
  .tm { font-weight: 700; font-size: 22px; color: ${TH.to}; font-family: 'Playfair Display','Bitstream Charter',Georgia,serif }
  .nm { font-weight: 700; font-size: 20px; color: #0c1322; font-family: 'Playfair Display','Bitstream Charter',Georgia,serif }
  .cnt { margin-left: auto; font-weight: 600; font-size: 14px; color: #94a3b8 }
  .tips { display: flex; flex-wrap: wrap; gap: 7px 10px; margin-top: 6px }
  .t { display: inline-flex; align-items: center; gap: 7px; font-weight: 600; font-size: 16.5px; color: #1f2937 }
  .t b { font-size: 11.5px; font-weight: 700; letter-spacing: .04em; padding: 2px 7px;
         border-radius: 4px; border: 1px solid }
  .none { font-weight: 600; font-size: 15px; color: #a8b0be; font-style: italic }
  .desks { margin: 16px 64px 0; background: #f4f6fa; border-radius: 14px; padding: 12px 18px 14px }
  .dh { font-weight: 700; font-size: 13px; color: #8b94a5; letter-spacing: .05em; margin-bottom: 8px }
  .d { display: flex; align-items: center; gap: 10px; padding: 6px 0;
       border-top: 1px solid #e3e8f0; font-size: 15.5px }
  .d:first-of-type { border-top: 0 }
  .d b { font-size: 11.5px; font-weight: 700; letter-spacing: .04em; padding: 2px 7px;
         border-radius: 4px; border: 1px solid; min-width: 44px; text-align: center }
  .dn { font-weight: 700; color: #0c1322; min-width: 184px }
  .dt { font-weight: 600; color: #64748b; min-width: 62px }
  .dd { font-weight: 700; color: #15803d; min-width: 108px }
  .dx { font-weight: 500; color: #8b94a5; font-size: 14.5px }
  .flag { margin: 14px 64px 0; background: #fffbeb; border-left: 6px solid #d97706;
          border-radius: 12px; padding: 12px 18px }
  .flag .h { font-weight: 700; font-size: 15px; color: #92400e; letter-spacing: .03em }
  .flag .b { font-weight: 500; font-size: 16px; color: #713f12; line-height: 1.45; margin-top: 3px }
  .gate { margin: 12px 64px 0; background: #f8fafc; border-left: 6px solid #64748b;
          border-radius: 12px; padding: 12px 18px }
  .gate .h { font-weight: 700; font-size: 15px; color: #475569; letter-spacing: .03em }
  .gate .b { font-weight: 500; font-size: 16px; color: #475569; line-height: 1.45; margin-top: 3px }
  .foot { position: absolute; bottom: 36px; left: 64px; right: 64px; display: flex;
          align-items: baseline; font-weight: 600; font-size: 17px }
  .foot .ga { color: #8b94a5 } .foot .nt { color: #a8b0be; margin-left: 9px }
  .foot .mk { margin-left: auto; font-weight: 700; font-size: 20px; color: ${TH.to};
              font-family: 'Playfair Display','Bitstream Charter',Georgia,serif }
</style></head><body>
  <div class="band">
    <div class="strap">${esc(TH.strap)}</div>
    <div class="ttl disp">Day 1 &middot; Friday 13 November</div>
    <svg class="shoe" viewBox="0 0 100 100"><path d="M22.1 67.7 A33 33 0 1 1 77.9 67.7"
      fill="none" stroke="rgba(255,255,255,.92)" stroke-width="15.6" stroke-linecap="round"/>
      <circle cx="23.6" cy="68.5" r="7.8" fill="rgba(255,255,255,.92)"/>
      <circle cx="76.4" cy="68.5" r="7.8" fill="rgba(255,255,255,.92)"/></svg>
  </div>
  <div class="sub">Cheltenham, Old Course &middot; Good, good to soft in places &middot; what the outside columns say</div>
  <div class="stats">
    <div class="st"><div class="v disp" style="color:${TH.to}">${desks.length}</div><div class="l">desks with<br>an opinion</div></div>
    <div class="st"><div class="v disp" style="color:${TH.to}">${tips}</div><div class="l">tips across<br>6 races</div></div>
    <div class="st"><div class="v disp" style="color:#dc2626">${crossovers.length}</div><div class="l">crossovers<br>on the card</div></div>
    <div class="st"><div class="v disp" style="color:${TH.to}">${diverge}/${shared}</div><div class="l">comparisons<br>that diverge</div></div>
  </div>
  <div class="races">${RACES.map(raceRow).join('')}</div>
  <div class="desks">
    <div class="dh">THE COLUMNS, AFTER THE PANELS AND THE ABSENTEES COME OUT</div>
    ${desks.map(d => {
      const mine = pairs.filter(p => p.a === d.code || p.b === d.code);
      const sh = mine.reduce((n, p) => n + p.shared, 0);
      const dv = mine.reduce((n, p) => n + p.diverge, 0);
      const n = Object.values(d.picks).reduce((m, s) => m + s.length, 0);
      return `<div class="d">
        <b style="color:${BADGE[d.code]};background:${BADGE[d.code]}22;border-color:${BADGE[d.code]}66">${d.code}</b>
        <span class="dn">${esc(d.name)}</span>
        <span class="dt">${n} tip${n === 1 ? '' : 's'}</span>
        <span class="dd">${dv}/${sh} divergent</span>
        <span class="dx">${esc(NOTE[d.code] || '')}</span></div>`;
    }).join('')}
  </div>
  <div class="flag">
    <div class="h">THE NAP BADGE COUNTS ROWS, NOT OPINIONS</div>
    <div class="b">The source grid naps <b>Ga Law at 2/8</b>. One of those two rows is an HRN panel
      harvesting Raceolly&rsquo;s own pick &mdash; so it is <b>one opinion, not two</b>. Both &ldquo;Biggest Priced&rdquo;
      panels count zero, and WH and Mullington posted nothing: n/a, not 0%.</div>
  </div>
  <div class="gate">
    <div class="h">OUR CARD: NO BET &mdash; RULE 13</div>
    <div class="b">No declared racecard in hand, so no field sizes, no each-way terms, nothing priced.
      <b>Nothing above is a Festival Form Book selection.</b> ${tested}/${tested} tested pairings are fully
      divergent across ${liveRaces} races that had two or more desks in them.</div>
  </div>
  <div class="foot"><span class="ga">18+ &middot; begambleaware.org</span>
    <span class="nt">External columns only &middot; no selection advised</span>
    <span class="mk">${esc(TH.mark)}</span></div>
</body></html>`;

const browser = await chromium.launch({ executablePath: chromeExe });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.screenshot({ path: OUT });
await browser.close();
console.log(`${OUT}  1080x1350`);
console.log(`  ${desks.length} desks · ${tips} tips · ${crossovers.length} crossovers · ${diverge}/${shared} diverge · ${panels} panels and ${absent} absentees discounted`);
