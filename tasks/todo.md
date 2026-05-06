# Festival Form Book v2.0 — Build Plan
_Started: 2026-05-02_

## Critical Constraint
**DO NOT TOUCH**: cheltenham-2026.html, grand-national-2026.html, scottish-grand-national-2026.html  
In scope: index.html, season-2026.html, cheltenham-2027.html, new festival pages

---

## Architecture Decisions

### Design system
New palette (#0f1117 bg, #1a1d26 card, #2a2d36 border, #00a651 NH green, #f5c842 flat gold).
index.html currently uses similar but slightly different values. Update CSS variables on index.html
to align. Festival archive pages keep their own palette (they're frozen).

### Template engine (Phase 2)
`js/festival-template.js` — exported `renderFestivalPage(config)` function.
Each future festival page is a thin HTML shell:
- `<script src="/js/festival-template.js"></script>`
- Inline `const config = { ... }` with all race/tipster data
- `renderFestivalPage(config)` called on DOMContentLoaded
cheltenham-2027.html migrated to this pattern.

### Data persistence
- Season tipster data: `localStorage['season_2026_tipsters']` — computed on season-2026.html load
- Betting bank per festival: `localStorage['bank_{slug}']`
- No Supabase (client-side only site)

### Racing API
Proxy exists (netlify/functions/racing-api.js). No active subscription confirmed.
Phase 4 form stats = manual entry initially; API integration ready to drop in.

---

## Phase 1 — Hub Homepage
Target file: **index.html**

- [ ] 1a. Update CSS tokens to new design system values
- [ ] 1b. Countdown widget: "Next up in X days" — computes from next undone festival date
- [ ] 1c. Upgrade festival grid cards: add race count, P&L if archive, crossover alert badge
- [ ] 1d. Status badge logic: LIVE if today is within festival dates, UPCOMING otherwise
- [ ] 1e. Tipster season league: pull aggregated data from each festival's embedded scorecard
      (Currently static HTML — make JS-driven, read from localStorage or embedded constants)
- [ ] 1f. Recent results strip: last 5 settled tips across all festivals (from embedded RESULTS data)
- [ ] 1g. Navigation consistency: ensure all festival pages have a "← Hub" link
- [ ] 1h. Responsible gambling footer already present — ensure on all pages

---

## Phase 2 — Festival Template System
Target files: **js/festival-template.js**, **cheltenham-2027.html**

- [ ] 2a. Create js/festival-template.js with renderFestivalPage(config)
      Renders: day tabs, race cards (NAP/NB/EW/tipster columns), crossover box,
      EW tracker, results entry, P&L dashboard, tipster scorecard
- [ ] 2b. Define config schema (see spec) — fully documented with JSDoc
- [ ] 2c. Migrate cheltenham-2027.html to thin shell + config object
      Keep the current cheltenham-2027.html visual design (green NH theme)
- [ ] 2d. Add netlify.toml redirect for /cheltenham-2027

---

## Phase 3 — Crossover Intelligence
Target files: **js/festival-template.js** (built-in), **index.html** (alert)

- [ ] 3a. renderCrossoverBadge() — WATCH (2 tipsters), STRONG (3), BANKER (4+)
      Colour-blind safe: text label alongside colour badge
- [ ] 3b. Historical crossover tracking: after each festival, record signal outcomes
      Stored in localStorage['crossover_history_2026']
- [ ] 3c. Hub crossover alert card: scan active festivals for 3+ agreements
      Show alert banner on index.html if any exist

---

## Phase 4 — Betting Intelligence
Target files: **js/festival-template.js**, **js/betting-utils.js**

- [ ] 4a. EW value calculator: computeEWValue(odds, terms, outlay)
      Show win return, EW return, breakeven odds, flag EW advantage >20%
- [ ] 4b. Festival betting bank: enter starting bank, track bets, show P&L
      localStorage-backed, colour coded green/amber/red
- [ ] 4c. Quick form stats: inline expandable section per horse
      Manual data entry via a simple textarea/JSON input in admin mode
      API-ready: if RacingAPI available, auto-fetch

---

## Phase 5 — Content and Sharing
Target files: **js/festival-template.js**, **index.html**

- [ ] 5a. Festival preview section: auto-rendered from config.preview fields
      Key races, ante-post picks, ground/weather notes
- [ ] 5b. Shareable tip cards: styled div → copy as image (html2canvas CDN)
      Presets: Day selections, Crossover banker, P&L summary
- [ ] 5c. Email capture modal: sign-up form, store in localStorage
      Placeholder Mailchimp/ConvertKit integration point

---

## Phase 6 — Polish
- [ ] 6a. Mobile audit: 375px, 390px, 768px, 1440px — all breakpoints
- [ ] 6b. Accessibility: WCAG 2.2 AA contrast, keyboard nav, screen reader P&L
- [ ] 6c. Performance: lazy load off-screen festival sections, cache API data
- [ ] 6d. Responsible gambling: BeGambleAware footer on ALL pages (verify)

---

## Open Questions (to resolve with Anthony before building)

1. **Guineas-2026.html scope**: It's an active festival (day 2 of 3, today 2 May).
   Treat as protected (like archives) until complete, or apply Phase 3 crossover upgrades now?

2. **season-2026.html**: Major redesign to match new design system, or data-only update?

3. **cheltenham-2027.html**: It already has significant hand-built code (countdown, day tabs, etc.).
   Full rewrite to template system, or wrap existing code in the template API?

4. **Phase sequencing**: Build one full phase before starting next, or build Phase 1 + 2 together
   since the template engine unlocks the hub's live data pull?

5. **Racing API subscription**: Active or not? Affects Phase 4 form stats approach.

---

## Build Order

Phase 1 (hub) → Phase 2 (template) → Phase 3 (crossover) → Phase 4 (betting) → Phase 5 (sharing) → Phase 6 (polish)
Phases 1 and 2 can partly overlap (template engine informs what live data the hub can pull).

---

## Done

- [x] Friday 1 May results added to guineas-2026.html (2026-05-02)
- [x] Saturday 2 May race card and tips populated in guineas-2026.html
- [x] Nick Luck (WH) tipster picks added to scorecard
- [x] Deployed to cheltenhamtips.netlify.app
- [x] Chester 2026 page built and registered as live festival (2026-05-06)
- [x] Chester Day 1 published in rich-card format (Nap/NB/Long with draw,
      jockey/trainer, form, weight, odds, place terms; Lucky 15; external
      tipster integration; crossover signals; key signals)
- [x] Tips engine + display contract captured in CLAUDE.md (2026-05-06)

---

## Phase 7 — Tips Engine + Display Contract (NEW · 2026-05-06)

The Chester 2026 Day 1 build set the standard. From now on every daily
race day card on the hub follows the same engine and the same display
contract, both documented in `CLAUDE.md`.

### Done in this phase

- [x] `CLAUDE.md`: workflow, tipster registry, staking, design tokens,
      mobile breakpoint, project rules, pre-ship checklist
- [x] `README.md` updated with engine summary + race-key data shape
- [x] Chester 2026 reference implementation deployed and live

### Roll-out tasks

- [ ] 7a. Extract the rich race-card renderer from `chester-2026.html`
      into `js/festival-template.js` so future festival pages can drop
      it in via `renderFestivalPage(config)` with no copy-paste of the
      grid CSS or render logic
- [ ] 7b. Update `cheltenham-2027.html` shell to use the rich card
      renderer (currently uses the older `STATIC_TIPS` shape)
- [ ] 7c. Build Dante Festival 2026 (13-15 May) using the engine —
      first new festival born under the contract
- [ ] 7d. Build Epsom Derby 2026 (5-6 June) using the engine
- [ ] 7e. Backfill: revisit Cheltenham 2027 SHELL once Dante and Derby
      have proven the renderer in production
- [ ] 7f. Add a P/L module: when `RESULTS` is filled in for a race day,
      the page renders win/place returns per pick, total staked, total
      returned, net P/L, plus Lucky 15 combinations

### Acceptance criteria for an "engine-compliant" daily card

- Every NAP / NB / LONG has a stated angle (no fabricated picks)
- Every flat-racing pick shows the draw badge
- CD / C / D flags applied where relevant
- Lucky 15 picked and totalled (avoiding bankers below 2/1)
- External tipster picks integrated with badges + crossover signals
- Key signals section written (4-6 bullets)
- Festival registered in `FESTIVALS_2026[]` in `js/season-data-2026.js`
- `netlify.toml` redirect added for the clean URL
- BeGambleAware footer present
- Mobile renders cleanly at 375px
