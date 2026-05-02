/**
 * festival-template.js  ·  Festival Form Book v2.0
 * Renders a complete festival page from a config object.
 *
 * Usage:
 *   <div id="festival-root"></div>
 *   <script src="/js/season-data-2026.js"></script>  <!-- optional, for scorecard -->
 *   <script src="/js/festival-template.js"></script>
 *   <script>
 *     const config = { ... };
 *     document.addEventListener('DOMContentLoaded', () => renderFestivalPage(config));
 *   </script>
 *
 * ─── Config schema ────────────────────────────────────────────────────────────
 *
 * @typedef {Object} FestivalTheme
 * @property {string} bg       Background, e.g. '#071a0e'
 * @property {string} card     Card background
 * @property {string} border   Border colour
 * @property {string} accent   Primary accent (NH green / flat gold etc.)
 * @property {string} gold     Gold/highlight colour
 * @property {string} text     Primary text
 * @property {string} muted    Secondary / muted text
 * @property {string} [font]   Font-family stack (optional)
 *
 * @typedef {Object} FestivalMeta
 * @property {string}   slug            Unique slug, e.g. 'cheltenham-2027'
 * @property {string}   name            Full name, e.g. 'Cheltenham Festival 2027'
 * @property {string}   shortName       Short name for nav, e.g. 'Cheltenham'
 * @property {string}   icon            Emoji, e.g. '🏆'
 * @property {string[]} dates           ISO date strings ['2027-03-09', ...]
 * @property {string}   dateLabel       Human-readable range, e.g. '9–12 March 2027'
 * @property {string}   venue           Racecourse name
 * @property {string}   countdownTarget ISO datetime for first race
 * @property {string}   hubUrl          URL for ← Hub link (default 'index.html')
 * @property {string}   [seasonUrl]     URL for season standings page
 * @property {FestivalTheme} theme      CSS colour tokens
 *
 * @typedef {Object} DayConfig
 * @property {number} idx     Zero-based day index
 * @property {string} name    Day name, e.g. 'Tuesday'
 * @property {string} emoji   Day emoji, e.g. '🟢'
 * @property {string} label   Full label, e.g. 'Day 1 – Champion Day'
 * @property {string} date    Full date string, e.g. 'Tuesday 9 March 2027'
 *
 * @typedef {Object} RaceConfig
 * @property {string} key     Race key 'HH:MM-dayIdx' (dayIdx is zero-based)
 * @property {number} dayIdx  Day index
 * @property {string} time    Race time 'HH:MM'
 * @property {string} name    Race name
 * @property {string} grade   Race grade, e.g. 'Grade 1', 'Premier Handicap'
 *
 * @typedef {Object} TipsterConfig
 * @property {string} id      Identifier matching tips object keys
 * @property {string} label   Display name
 * @property {string} color   CSS colour
 * @property {string} icon    Emoji
 *
 * @typedef {Object} TipData
 * @property {string}  horse   Horse name or 'TBC'
 * @property {string}  [odds]  Odds string e.g. '5/1' or 'TBC'
 * @property {boolean} [ew]    Each-way flag
 * @property {string}  [reason] Selection reason
 *
 * @typedef {Object} FestivalConfig
 * @property {FestivalMeta}    meta
 * @property {DayConfig[]}     days
 * @property {RaceConfig[]}    races
 * @property {TipsterConfig[]} tipsters
 * @property {{ [raceKey: string]: { [tipsterId: string]: TipData } }} tips
 * @property {{ headline: string, note: string }} [preview]
 */

'use strict';

// ── Crossover strength thresholds ─────────────────────────────────────────────
const CROSSOVER_WATCH  = 2; // 2 tipsters agree
const CROSSOVER_STRONG = 3; // 3 tipsters agree
const CROSSOVER_BANKER = 4; // 4+ tipsters agree

// ── Grade badge colours ───────────────────────────────────────────────────────
const GRADE_STYLES = {
  'Grade 1':          'background:rgba(212,175,55,0.15);color:#f0c86a;border:1px solid rgba(212,175,55,0.25)',
  'Grade 2':          'background:rgba(192,192,192,0.1);color:#c0c0c0;border:1px solid rgba(192,192,192,0.2)',
  'Grade 3':          'background:rgba(255,255,255,0.07);color:#9ba8a0;border:1px solid rgba(255,255,255,0.1)',
  'Premier Handicap': 'background:rgba(59,130,246,0.1);color:#93c5fd;border:1px solid rgba(59,130,246,0.2)',
  'goldcup':          'background:rgba(212,175,55,0.2);color:#f0c86a;border:1px solid rgba(212,175,55,0.4)',
};

// ────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// ────────────────────────────────────────────────────────────────────────────
function renderFestivalPage(config) {
  const root = document.getElementById('festival-root');
  if (!root) {
    console.error('[festival-template] #festival-root element not found');
    return;
  }

  const { meta, days, races, tipsters, tips = {}, preview } = config;
  const theme = meta.theme || {};

  // Inject component styles
  _injectStyles(theme);

  // Build DOM
  root.innerHTML = '';
  root.appendChild(_buildBackLink(meta));
  root.appendChild(_buildHero(meta, preview));
  root.appendChild(_buildNav(days, theme));

  const main = document.createElement('main');
  main.className = 'ft-main';
  main.setAttribute('id', 'ft-main');

  days.forEach(day => {
    const raceList = races.filter(r => r.dayIdx === day.idx);
    const section  = _buildDaySection(day, raceList, tipsters, tips, theme);
    if (day.idx > 0) section.setAttribute('hidden', '');
    main.appendChild(section);
  });

  root.appendChild(main);
  root.appendChild(_buildScorecard(meta, theme));
  root.appendChild(_buildFooter(meta, theme));

  // Start live countdown
  _startCountdown(meta.countdownTarget);
}

// Exposed globally for nav tab onclick handlers
window.ftSwitchDay = function(idx) {
  document.querySelectorAll('.ft-day-section').forEach((s, i) => {
    if (i === idx) {
      s.removeAttribute('hidden');
    } else {
      s.setAttribute('hidden', '');
    }
  });
  document.querySelectorAll('.ft-nav-tab').forEach((t, i) => {
    t.classList.toggle('active', i === idx);
    t.setAttribute('aria-selected', i === idx ? 'true' : 'false');
  });
  // Scroll nav tab into view on mobile
  const activeTab = document.querySelector('.ft-nav-tab.active');
  if (activeTab) activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
};

// ────────────────────────────────────────────────────────────────────────────
// STYLE INJECTION
// ────────────────────────────────────────────────────────────────────────────
function _injectStyles(theme) {
  if (document.getElementById('ft-styles')) return;
  const bg     = theme.bg     || '#0f1117';
  const card   = theme.card   || '#1a1d26';
  const border = theme.border || 'rgba(255,255,255,0.1)';
  const accent = theme.accent || '#00a651';
  const gold   = theme.gold   || '#f5c842';
  const text   = theme.text   || '#e0e0e0';
  const muted  = theme.muted  || '#888';
  const font   = theme.font   || "'Inter', system-ui, sans-serif";

  const css = `
:root {
  --ft-bg:     ${bg};
  --ft-card:   ${card};
  --ft-border: ${border};
  --ft-accent: ${accent};
  --ft-gold:   ${gold};
  --ft-text:   ${text};
  --ft-muted:  ${muted};
  --ft-font:   ${font};
}
body {
  background: var(--ft-bg);
  color: var(--ft-text);
  font-family: var(--ft-font);
  min-height: 100vh;
  overflow-x: hidden;
}
/* ── Back link ── */
.ft-back {
  display: inline-flex; align-items: center; gap: 6px;
  color: var(--ft-muted); text-decoration: none; font-size: 0.8rem;
  font-weight: 500; padding: 14px 20px 0; transition: color 0.2s;
}
.ft-back:hover { color: var(--ft-accent); }
.ft-back:focus-visible { outline: 2px solid var(--ft-accent); border-radius: 4px; }
/* ── Hero ── */
.ft-hero {
  text-align: center; padding: 48px 20px 36px;
  background: var(--ft-bg);
  border-bottom: 1px solid var(--ft-border);
  position: relative; overflow: hidden;
}
.ft-hero::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse 80% 50% at 50% 0%, ${accent}18 0%, transparent 65%);
  pointer-events: none;
}
.ft-hero::after {
  content: '🐎'; position: absolute; font-size: 180px;
  opacity: 0.04; right: -20px; top: -10px; transform: scaleX(-1);
  pointer-events: none;
}
.ft-hero-eyebrow {
  font-size: 0.68rem; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--ft-gold); margin-bottom: 10px;
}
.ft-hero h1 {
  font-size: clamp(2rem, 6vw, 4rem); font-weight: 800; line-height: 1.1;
  color: var(--ft-text); margin-bottom: 6px;
}
.ft-hero h1 .ft-gold { color: var(--ft-gold); }
.ft-hero-dates {
  font-size: 0.95rem; color: var(--ft-muted); margin-bottom: 24px; letter-spacing: 0.04em;
}
.ft-countdown {
  display: inline-flex; gap: 14px; align-items: center;
  background: rgba(255,255,255,0.04); border: 1px solid var(--ft-border);
  border-radius: 50px; padding: 12px 24px; margin-bottom: 28px;
}
.ft-cd-unit { text-align: center; min-width: 44px; }
.ft-cd-num {
  display: block; font-size: 1.5rem; font-weight: 700; color: var(--ft-gold);
  line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: -0.02em;
}
.ft-cd-label {
  display: block; font-size: 0.62rem; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--ft-muted); margin-top: 3px;
}
.ft-cd-sep { font-size: 1.2rem; color: var(--ft-border); padding-bottom: 8px; }
.ft-hero-live {
  font-size: 1.1rem; font-weight: 700; color: var(--ft-accent);
  padding: 10px 20px; margin-bottom: 20px;
}
.ft-hero-links { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.ft-hero-link {
  display: inline-flex; align-items: center; gap: 5px;
  background: rgba(255,255,255,0.06); border: 1px solid var(--ft-border);
  color: var(--ft-text); text-decoration: none; font-size: 0.78rem;
  font-weight: 500; padding: 7px 16px; border-radius: 6px;
  transition: border-color 0.2s; min-height: 36px;
}
.ft-hero-link:hover { border-color: var(--ft-accent); color: var(--ft-accent); }
.ft-hero-link:focus-visible { outline: 2px solid var(--ft-accent); border-radius: 6px; }
/* Preview note */
.ft-preview {
  max-width: 620px; margin: 0 auto 28px; padding: 14px 18px;
  background: rgba(255,255,255,0.03); border: 1px solid var(--ft-border);
  border-radius: 8px; font-size: 0.85rem; color: var(--ft-muted); line-height: 1.6;
}
.ft-preview strong { color: var(--ft-text); }
/* ── Sticky nav ── */
.ft-nav {
  position: sticky; top: 0; z-index: 100;
  background: var(--ft-bg);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--ft-border);
  overflow-x: auto; white-space: nowrap; scrollbar-width: none;
}
.ft-nav::-webkit-scrollbar { display: none; }
.ft-nav-inner { display: inline-flex; min-width: 100%; justify-content: center; }
.ft-nav-tab {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 14px 20px; font-size: 0.82rem; font-weight: 600;
  color: var(--ft-muted); cursor: pointer;
  border: none; border-bottom: 2px solid transparent;
  background: none; transition: color 0.2s, border-color 0.2s;
  white-space: nowrap; font-family: var(--ft-font);
  min-height: 48px; letter-spacing: 0.01em;
}
.ft-nav-tab:hover { color: var(--ft-text); }
.ft-nav-tab.active { color: var(--ft-gold); border-bottom-color: var(--ft-gold); }
.ft-nav-tab:focus-visible { outline: 2px solid var(--ft-accent); outline-offset: -2px; }
/* ── Main content ── */
.ft-main { max-width: 900px; margin: 0 auto; padding: 24px 16px 40px; }
/* ── Day header ── */
.ft-day-hd {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ft-border);
}
.ft-day-name {
  font-size: 1.1rem; font-weight: 700; color: var(--ft-text); margin-bottom: 2px;
}
.ft-day-date { font-size: 0.82rem; color: var(--ft-muted); }
/* ── Race card ── */
.ft-races { display: flex; flex-direction: column; gap: 14px; }
.ft-race {
  background: var(--ft-card); border: 1px solid var(--ft-border);
  border-radius: 10px; overflow: hidden; transition: border-color 0.15s;
}
.ft-race:hover { border-color: var(--ft-accent); }
.ft-race-hd {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 11px 16px 10px;
  background: rgba(255,255,255,0.025);
  border-bottom: 1px solid var(--ft-border);
}
.ft-race-time {
  font-size: 0.82rem; font-weight: 700; color: var(--ft-gold);
  letter-spacing: 0.04em; min-width: 40px;
}
.ft-race-name {
  font-size: 0.9rem; font-weight: 600; color: var(--ft-text); flex: 1;
}
.ft-grade-badge {
  font-size: 0.65rem; font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase; padding: 2px 8px; border-radius: 10px;
}
/* ── Crossover badge ── */
.ft-crossover {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 16px;
  font-size: 0.78rem; font-weight: 600;
  border-bottom: 1px solid var(--ft-border);
}
.ft-crossover-badge {
  font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.1em; padding: 2px 8px; border-radius: 10px;
}
.ft-xo-watch  { background: rgba(245,200,66,0.15); color: #fde047; border: 1px solid rgba(245,200,66,0.3); }
.ft-xo-strong { background: rgba(251,146,60,0.15); color: #fdba74; border: 1px solid rgba(251,146,60,0.3); }
.ft-xo-banker { background: rgba(74,222,128,0.15); color: #86efac; border: 1px solid rgba(74,222,128,0.35); }
.ft-xo-horse  { color: var(--ft-text); }
.ft-xo-detail { color: var(--ft-muted); font-size: 0.73rem; font-weight: 400; }
/* ── Tips grid ── */
.ft-tips-grid {
  display: grid; gap: 0;
}
.ft-tip {
  display: grid; grid-template-columns: 110px 1fr auto auto;
  align-items: center; gap: 10px;
  padding: 9px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  transition: background 0.12s;
}
.ft-tip:last-child { border-bottom: none; }
.ft-tip:hover { background: rgba(255,255,255,0.02); }
.ft-tip-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.72rem; font-weight: 600; letter-spacing: 0.03em;
  white-space: nowrap;
}
.ft-tip-avatar {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 0.72rem;
  flex-shrink: 0;
}
.ft-tip-horse {
  font-size: 0.86rem; font-weight: 600; color: var(--ft-text);
}
.ft-tip-horse.ft-tbc { color: var(--ft-muted); font-style: italic; font-weight: 400; }
.ft-tip-odds {
  font-size: 0.75rem; color: var(--ft-muted); white-space: nowrap; text-align: right;
}
.ft-tip-ew {
  font-size: 0.62rem; font-weight: 700; color: var(--ft-gold);
  background: rgba(245,200,66,0.12); border: 1px solid rgba(245,200,66,0.25);
  padding: 1px 5px; border-radius: 4px; letter-spacing: 0.04em;
}
.ft-tip-reason {
  grid-column: 2 / -1;
  font-size: 0.72rem; color: var(--ft-muted); margin-top: 1px; line-height: 1.4;
}
/* TBC state */
.ft-tbc-banner {
  text-align: center; padding: 20px 16px; color: var(--ft-muted);
  font-size: 0.82rem; font-style: italic;
}
/* ── Scorecard ── */
.ft-scorecard {
  max-width: 900px; margin: 0 auto 16px; padding: 0 16px;
}
.ft-scorecard-hd {
  display: flex; align-items: center; gap: 12px; margin-bottom: 14px;
}
.ft-scorecard-hd h2 {
  font-size: 0.95rem; font-weight: 700; color: var(--ft-text); white-space: nowrap;
}
.ft-sc-line { flex: 1; height: 1px; background: var(--ft-border); }
.ft-sc-tbl {
  width: 100%; border-collapse: collapse; font-size: 0.82rem;
  border: 1px solid var(--ft-border); border-radius: 8px; overflow: hidden;
}
.ft-sc-tbl thead th {
  background: var(--ft-card); color: var(--ft-muted);
  font-size: 0.68rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.07em; padding: 8px 12px; text-align: left;
  border-bottom: 1px solid var(--ft-border); white-space: nowrap;
}
.ft-sc-tbl thead th.num { text-align: center; }
.ft-sc-tbl tbody td {
  padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.04);
}
.ft-sc-tbl tbody tr:last-child td { border-bottom: none; }
.ft-sc-tbl tbody td.num { text-align: center; }
.ft-sc-tbl tbody tr:hover td { background: rgba(255,255,255,0.02); }
.ft-sc-name { font-weight: 600; font-size: 0.84rem; }
.ft-sc-total { font-size: 0.95rem; font-weight: 700; color: var(--ft-gold); }
.ft-sc-pts  { font-size: 0.73rem; color: var(--ft-muted); }
.ft-sc-note {
  font-size: 0.73rem; color: var(--ft-muted); margin-top: 8px; text-align: right;
}
/* ── Footer ── */
.ft-footer {
  border-top: 1px solid var(--ft-border); padding: 28px 20px 32px;
  max-width: 900px; margin: 0 auto;
}
.ft-footer-inner {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; text-align: center;
}
.ft-rg-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(0,166,81,0.08); border: 1px solid rgba(0,166,81,0.2);
  color: #00a651; font-size: 0.78rem; font-weight: 600;
  padding: 7px 16px; border-radius: 6px;
}
.ft-rg-links {
  display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;
  font-size: 0.77rem; color: var(--ft-muted);
}
.ft-rg-links a { color: #00a651; text-decoration: none; }
.ft-rg-links a:hover { text-decoration: underline; }
.ft-rg-links a:focus-visible { outline: 2px solid #00a651; border-radius: 2px; }
.ft-footer-nav {
  display: flex; gap: 12px; flex-wrap: wrap;
  justify-content: center; font-size: 0.75rem; margin-top: 4px;
}
.ft-footer-nav a { color: var(--ft-muted); text-decoration: none; transition: color 0.2s; }
.ft-footer-nav a:hover { color: var(--ft-accent); }
.ft-footer-nav a:focus-visible { outline: 2px solid var(--ft-accent); border-radius: 2px; }
.ft-rg-note { font-size: 0.73rem; color: var(--ft-muted); line-height: 1.6; max-width: 560px; }
/* ── Responsive ── */
@media (max-width: 600px) {
  .ft-tip { grid-template-columns: 90px 1fr auto; }
  .ft-tip-ew { display: none; }
  .ft-tip-reason { display: none; }
  .ft-grade-badge { display: none; }
  .ft-hero h1 { font-size: 1.8rem; }
  .ft-cd-num { font-size: 1.2rem; }
}
@media (max-width: 420px) {
  .ft-tip { grid-template-columns: 80px 1fr; }
  .ft-tip-odds { display: none; }
}
  `;

  const style = document.createElement('style');
  style.id   = 'ft-styles';
  style.textContent = css;
  document.head.appendChild(style);
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT BUILDERS
// ────────────────────────────────────────────────────────────────────────────

function _buildBackLink(meta) {
  const a = document.createElement('a');
  a.href      = meta.hubUrl || 'index.html';
  a.className = 'ft-back';
  a.setAttribute('aria-label', 'Back to Festival Hub');
  a.textContent = '← Hub';
  return a;
}

function _buildHero(meta, preview) {
  const div = document.createElement('div');
  div.className = 'ft-hero';

  // Check if festival is in the past, live, or upcoming
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(meta.dates[0]);
  const endDate   = new Date(meta.dates[meta.dates.length - 1]);
  const isLive    = today >= startDate && today <= endDate;
  const isPast    = today > endDate;

  let countdownHtml = '';
  if (!isPast && !isLive) {
    countdownHtml = `
      <div class="ft-countdown" role="timer" aria-label="Countdown to festival" id="ft-countdown">
        <div class="ft-cd-unit">
          <span class="ft-cd-num" id="cd-days">--</span>
          <span class="ft-cd-label">Days</span>
        </div>
        <span class="ft-cd-sep" aria-hidden="true">:</span>
        <div class="ft-cd-unit">
          <span class="ft-cd-num" id="cd-hours">--</span>
          <span class="ft-cd-label">Hours</span>
        </div>
        <span class="ft-cd-sep" aria-hidden="true">:</span>
        <div class="ft-cd-unit">
          <span class="ft-cd-num" id="cd-mins">--</span>
          <span class="ft-cd-label">Mins</span>
        </div>
        <span class="ft-cd-sep" aria-hidden="true">:</span>
        <div class="ft-cd-unit">
          <span class="ft-cd-num" id="cd-secs">--</span>
          <span class="ft-cd-label">Secs</span>
        </div>
      </div>`;
  } else if (isLive) {
    countdownHtml = `<div class="ft-hero-live" role="status">🏇 The Festival is LIVE!</div>`;
  }

  let previewHtml = '';
  if (preview) {
    previewHtml = `
      <div class="ft-preview">
        <strong>${_esc(preview.headline || '')}</strong>
        ${preview.note ? `<br><span>${_esc(preview.note)}</span>` : ''}
      </div>`;
  }

  const seasonLink = meta.seasonUrl
    ? `<a href="${_esc(meta.seasonUrl)}" class="ft-hero-link">📊 Season Standings</a>`
    : '';

  div.innerHTML = `
    <div class="ft-hero-eyebrow">${_esc(meta.dateLabel)} · ${_esc(meta.venue)}</div>
    <h1>${_esc(meta.icon)} <span class="ft-gold">${_esc(meta.shortName)}</span> ${_esc(meta.dates[0].slice(0,4))}</h1>
    <p class="ft-hero-dates">${_esc(meta.name)} · ${_esc(meta.dateLabel)}</p>
    ${countdownHtml}
    ${previewHtml}
    <div class="ft-hero-links">
      <a href="${_esc(meta.hubUrl || 'index.html')}" class="ft-hero-link">← Festival Hub</a>
      ${seasonLink}
    </div>
  `;

  return div;
}

function _buildNav(days, theme) {
  const nav  = document.createElement('nav');
  nav.className = 'ft-nav';
  nav.setAttribute('aria-label', 'Festival days');

  const inner = document.createElement('div');
  inner.className = 'ft-nav-inner';
  inner.setAttribute('role', 'tablist');

  days.forEach(day => {
    const btn = document.createElement('button');
    btn.className = 'ft-nav-tab' + (day.idx === 0 ? ' active' : '');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', day.idx === 0 ? 'true' : 'false');
    btn.setAttribute('aria-controls', `ft-day-${day.idx}`);
    btn.setAttribute('onclick', `ftSwitchDay(${day.idx})`);
    btn.innerHTML = `${day.emoji || ''} ${_esc(day.label)}`;
    inner.appendChild(btn);
  });

  nav.appendChild(inner);
  return nav;
}

function _buildDaySection(day, races, tipsters, tips, theme) {
  const section = document.createElement('section');
  section.className = 'ft-day-section';
  section.id = `ft-day-${day.idx}`;
  section.setAttribute('role', 'tabpanel');
  section.setAttribute('aria-labelledby', `ft-tab-${day.idx}`);

  const hd = document.createElement('div');
  hd.className = 'ft-day-hd';
  hd.innerHTML = `
    <div class="ft-day-name">${_esc(day.label)}</div>
    <div class="ft-day-date">${_esc(day.date)}</div>
  `;
  section.appendChild(hd);

  if (!races.length) {
    const empty = document.createElement('p');
    empty.className = 'ft-tbc-banner';
    empty.textContent = 'Races for this day will be published closer to the festival.';
    section.appendChild(empty);
    return section;
  }

  const racesWrap = document.createElement('div');
  racesWrap.className = 'ft-races';

  races.forEach(race => {
    const card = _buildRaceCard(race, tipsters, tips[race.key] || {});
    racesWrap.appendChild(card);
  });

  section.appendChild(racesWrap);
  return section;
}

function _buildRaceCard(race, tipsters, raceTips) {
  const card = document.createElement('article');
  card.className = 'ft-race';
  card.setAttribute('aria-label', `${race.time} ${race.name}`);

  // Grade badge style
  const gradeSt = GRADE_STYLES[race.grade] || GRADE_STYLES['Grade 3'];
  const isGoldCup = race.grade === 'goldcup' || race.name.toLowerCase().includes('gold cup');

  // Header
  const hd = document.createElement('div');
  hd.className = 'ft-race-hd';
  hd.innerHTML = `
    <span class="ft-race-time">${_esc(race.time)}</span>
    <span class="ft-race-name">${_esc(race.name)}${isGoldCup ? ' 🏆' : ''}</span>
    <span class="ft-grade-badge" style="${isGoldCup ? GRADE_STYLES['goldcup'] : gradeSt}">${_esc(race.grade)}</span>
  `;
  card.appendChild(hd);

  // Crossover detection
  const crossover = _detectCrossover(raceTips, tipsters.map(t => t.id));
  if (crossover) {
    const xoBadge = document.createElement('div');
    xoBadge.className = 'ft-crossover';
    const badgeClass = crossover.strength === 'BANKER' ? 'ft-xo-banker'
                     : crossover.strength === 'STRONG' ? 'ft-xo-strong'
                     : 'ft-xo-watch';
    const colour = crossover.strength === 'BANKER' ? '⭐⭐'
                 : crossover.strength === 'STRONG' ? '⭐'
                 : '';
    xoBadge.innerHTML = `
      <span class="ft-crossover-badge ${badgeClass}" aria-label="${crossover.strength}: ${crossover.count} tipsters agree">
        ${colour} ${crossover.strength}
      </span>
      <span class="ft-xo-horse">${_esc(_titleCase(crossover.horse))}</span>
      <span class="ft-xo-detail">${crossover.count} of ${tipsters.length} tipsters</span>
    `;
    card.appendChild(xoBadge);
  }

  // Tips grid
  const allTbc = tipsters.every(t => {
    const tip = raceTips[t.id];
    return !tip || !tip.horse || tip.horse === 'TBC';
  });

  if (allTbc) {
    const tbcDiv = document.createElement('div');
    tbcDiv.className = 'ft-tbc-banner';
    tbcDiv.textContent = 'Tips to be confirmed — check back closer to the festival.';
    card.appendChild(tbcDiv);
    return card;
  }

  const grid = document.createElement('div');
  grid.className = 'ft-tips-grid';

  tipsters.forEach(tipster => {
    const tip = raceTips[tipster.id];
    if (!tip) return;

    const isTbc = !tip.horse || tip.horse === 'TBC';
    const row = document.createElement('div');
    row.className = 'ft-tip';

    const horseName = isTbc ? 'TBC' : tip.horse;
    const oddsText  = tip.odds && tip.odds !== 'TBC' && tip.odds !== '0/1' ? tip.odds : '';
    const ewBadge   = tip.ew && !isTbc ? '<span class="ft-tip-ew" aria-label="Each way">E/W</span>' : '';
    const reasonHtml = tip.reason && !isTbc
      ? `<div class="ft-tip-reason">${_esc(tip.reason)}</div>` : '';

    row.innerHTML = `
      <div class="ft-tip-label" style="color:${_esc(tipster.color)}">
        <div class="ft-tip-avatar" style="background:${_esc(tipster.color)}1a;border:1px solid ${_esc(tipster.color)}33;" aria-hidden="true">${tipster.icon}</div>
        ${_esc(tipster.label)}
      </div>
      <div class="ft-tip-horse ${isTbc ? 'ft-tbc' : ''}">${_esc(horseName)}</div>
      <div class="ft-tip-odds">${_esc(oddsText)}</div>
      ${ewBadge}
      ${reasonHtml}
    `;
    grid.appendChild(row);
  });

  card.appendChild(grid);
  return card;
}

function _buildScorecard(meta, theme) {
  const section = document.createElement('section');
  section.className = 'ft-scorecard';
  section.setAttribute('aria-label', '2026 Season Standings');

  // Only render if computeSeasonScores is available (season-data-2026.js loaded)
  if (typeof computeSeasonScores !== 'function') return section;

  const scores  = computeSeasonScores().slice(0, 12); // Top 12
  const hd = document.createElement('div');
  hd.className = 'ft-scorecard-hd';
  hd.innerHTML = `
    <h2>📊 2026 Season Standings</h2>
    <div class="ft-sc-line" aria-hidden="true"></div>
    ${meta.seasonUrl ? `<a href="${_esc(meta.seasonUrl)}" class="ft-hero-link" style="font-size:0.75rem;padding:5px 12px;">Full table →</a>` : ''}
  `;
  section.appendChild(hd);

  const wrap = document.createElement('div');
  wrap.style.overflowX = 'auto';
  wrap.style.borderRadius = '8px';

  const tbl = document.createElement('table');
  tbl.className = 'ft-sc-tbl';
  tbl.innerHTML = `
    <thead>
      <tr>
        <th scope="col" style="width:36px;" class="num">#</th>
        <th scope="col">Tipster</th>
        <th scope="col" class="num">Chelt</th>
        <th scope="col" class="num">GN</th>
        <th scope="col" class="num">SGN</th>
        <th scope="col" class="num">Guin</th>
        <th scope="col" class="num">Total</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');
  scores.forEach((t, i) => {
    const rankClass = i === 0 ? 'style="color:#f5c842;font-weight:700"'
                    : i === 1 ? 'style="color:#c0c0c0;font-weight:700"'
                    : i === 2 ? 'style="color:#cd7f32;font-weight:700"'
                    : '';
    const cPts   = t.cSc   ? `${t.cSc.pts}`   : '—';
    const gnPts  = t.gnSc  ? `${t.gnSc.pts}`  : '—';
    const sgnPts = t.sgnSc ? `${t.sgnSc.pts}` : '—';
    const guinPts= t.guinSc? `${t.guinSc.pts}` : '—';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="num" ${rankClass}>${i + 1}</td>
      <td>
        <span style="display:inline-flex;align-items:center;gap:7px;">
          <span style="font-size:0.85rem;">${t.icon}</span>
          <span class="ft-sc-name" style="color:${_esc(t.color)}">${_esc(t.label)}</span>
        </span>
      </td>
      <td class="num ft-sc-pts">${cPts}</td>
      <td class="num ft-sc-pts">${gnPts}</td>
      <td class="num ft-sc-pts">${sgnPts}</td>
      <td class="num ft-sc-pts">${guinPts}</td>
      <td class="num"><span class="ft-sc-total">${t.total}</span></td>
    `;
    tbody.appendChild(tr);
  });

  tbl.appendChild(tbody);
  wrap.appendChild(tbl);
  section.appendChild(wrap);

  const note = document.createElement('p');
  note.className = 'ft-sc-note';
  note.textContent = 'Scoring: 3pts win · 1pt placed · 0pts miss. Guineas in progress.';
  section.appendChild(note);

  return section;
}

function _buildFooter(meta, theme) {
  const footer = document.createElement('footer');
  footer.className = 'ft-footer';

  const inner = document.createElement('div');
  inner.className = 'ft-footer-inner';

  const seasonLink = meta.seasonUrl
    ? `<a href="${_esc(meta.seasonUrl)}">📊 Season Standings</a>` : '';

  inner.innerHTML = `
    <div class="ft-rg-badge" role="note">🛡️ Bet Responsibly — for information and entertainment only</div>
    <div class="ft-rg-links" role="list" aria-label="Responsible gambling resources">
      <a href="https://www.begambleaware.org" target="_blank" rel="noopener noreferrer" role="listitem">BeGambleAware.org</a>
      <a href="https://www.gamstop.co.uk" target="_blank" rel="noopener noreferrer" role="listitem">GamStop</a>
      <a href="https://www.gamblingtherapy.org" target="_blank" rel="noopener noreferrer" role="listitem">Gambling Therapy</a>
      <span role="listitem">Helpline: <strong>0808 8020 133</strong> (free, 24/7)</span>
    </div>
    <p class="ft-rg-note">
      Tips are for information and entertainment. Gambling should be fun.
      Never bet more than you can afford to lose.
    </p>
    <nav class="ft-footer-nav" aria-label="Site navigation">
      <a href="${_esc(meta.hubUrl || 'index.html')}">← Hub</a>
      ${seasonLink}
    </nav>
  `;

  footer.appendChild(inner);
  return footer;
}

// ────────────────────────────────────────────────────────────────────────────
// CROSSOVER DETECTION
// ────────────────────────────────────────────────────────────────────────────
function _detectCrossover(raceTips, tipsterIds) {
  const horseCounts = {};

  tipsterIds.forEach(id => {
    const t = raceTips[id];
    if (!t || !t.horse || t.horse === 'TBC' || t.horse === '—') return;
    const h = t.horse.toLowerCase().trim();
    if (!horseCounts[h]) horseCounts[h] = [];
    horseCounts[h].push(id);
  });

  const signals = Object.entries(horseCounts)
    .filter(([, ids]) => ids.length >= CROSSOVER_WATCH)
    .map(([horse, ids]) => ({ horse, count: ids.length, tipsters: ids }))
    .sort((a, b) => b.count - a.count);

  if (!signals.length) return null;

  const top = signals[0];
  const strength = top.count >= CROSSOVER_BANKER ? 'BANKER'
                 : top.count >= CROSSOVER_STRONG  ? 'STRONG'
                 : 'WATCH';

  return { ...top, strength };
}

// ────────────────────────────────────────────────────────────────────────────
// COUNTDOWN
// ────────────────────────────────────────────────────────────────────────────
function _startCountdown(targetDateStr) {
  const el = document.getElementById('ft-countdown');
  if (!el) return;

  const target = new Date(targetDateStr);

  function update() {
    const diff = target - Date.now();
    if (diff <= 0) {
      el.innerHTML = '<span style="color:var(--ft-accent);font-weight:700;font-size:1rem;">🏇 Race day is here!</span>';
      return;
    }
    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000)  / 60000);
    const secs  = Math.floor((diff % 60000)    / 1000);

    const cd = document.getElementById('ft-countdown');
    if (!cd) return;
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(val).padStart(2, '0');
    };
    set('cd-days',  days);
    set('cd-hours', hours);
    set('cd-mins',  mins);
    set('cd-secs',  secs);
  }

  update();
  setInterval(update, 1000);
}

// ────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ────────────────────────────────────────────────────────────────────────────
function _esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _titleCase(str) {
  return String(str).replace(/\b\w/g, c => c.toUpperCase());
}
