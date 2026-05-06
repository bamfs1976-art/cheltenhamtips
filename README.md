# 🏇 The Festival Form Book

Expert tips, race guides and live results for Britain and Ireland's biggest horse racing festivals.

## 🔗 Live Site

Deploy to Netlify and access at your custom URL. Each festival is a standalone HTML page linked from the hub homepage.

> **🤖 Working with Claude on this repo?** Read [`CLAUDE.md`](./CLAUDE.md) first — it
> defines the **tips engine** (workflow, tipster registry, staking) and the
> **display contract** every daily race day card must follow. The reference
> implementation is `chester-2026.html` Day 1.

---

## 📁 File Structure

```
/
├── index.html                  ← Hub homepage (festival grid, tipster league, calendar)
├── chester-2026.html           ← Chester May Festival 2026 (LIVE — reference implementation
│                                  for the rich daily tips card design)
├── cheltenham-2026.html        ← Cheltenham Festival 2026 (ARCHIVE — fully completed)
├── grand-national-2026.html    ← Grand National Festival 2026 (ARCHIVE)
├── scottish-grand-national-2026.html ← Scottish GN 2026 (ARCHIVE)
├── guineas-2026.html           ← Qipco Guineas Festival 2026 (ARCHIVE)
├── cheltenham-2027.html        ← Cheltenham Festival 2027 (SHELL)
├── season-2026.html            ← Season tipster leaderboard
├── js/
│   ├── season-data-2026.js     ← FESTIVALS_2026 registry (live-banner source of truth)
│   └── festival-template.js    ← Shared festival template engine
├── netlify.toml                ← Netlify config + redirects
├── CLAUDE.md                   ← Tips engine + display contract for Claude sessions
└── README.md                   ← This file
```

---

## 🗓️ Adding a New Festival

When a new festival is ready, follow these steps:

### 1. Create the festival HTML file
Copy the most similar existing festival file as a template:
- **Jump festivals** (Cheltenham, Grand National): start from `grand-national-2026.html`
- **Flat festivals** (Derby, Ascot, Goodwood): build fresh with a new colour theme

Name the file: `[festival-name]-[year].html`
Examples: `royal-ascot-2026.html`, `epsom-derby-2026.html`, `st-leger-2026.html`

### 2. Inject the global nav
The global nav strip must be added to every new festival file. Copy this block and paste it immediately after `<body>`:

```html
<nav class="ffb-nav">
  <a href="index.html" class="ffb-brand">🏇 Festival Form Book</a>
  <div class="ffb-links">
    <a href="index.html" class="ffb-link"><span class="ffb-dot ffb-dot-home"></span>Hub</a>
    <a href="cheltenham-2026.html" class="ffb-link"><span class="ffb-dot ffb-dot-archive"></span>Cheltenham 2026</a>
    <a href="grand-national-2026.html" class="ffb-link"><span class="ffb-dot ffb-dot-archive"></span>Grand National 2026</a>
    <a href="your-new-festival.html" class="ffb-link ffb-active"><span class="ffb-dot ffb-dot-upcoming"></span>Your Festival Name</a>
    <!-- add more links here as the portfolio grows -->
  </div>
</nav>
```

Also add the global nav CSS to the `<style>` block (copy from any existing festival file — search for `/* ── GLOBAL NAV`).

### 3. Update all existing festival files
Add a link to the new festival in the `ffb-links` div of every existing festival file. Keep the list consistent across all pages.

### 4. Update the hub homepage (index.html)
- Add a new festival card to the `festival-grid` section
- Update the hero stats (races tracked, festivals covered)
- Add an entry to the race calendar strip
- Update the `<nav>` links at the top

### 5. Add a redirect in netlify.toml
```toml
[[redirects]]
  from = "/royal-ascot-2026"
  to   = "/royal-ascot-2026.html"
  status = 200
```

---

## 📊 Entering Results (During a Festival)

Each festival file has a `RACE_RESULTS_CONFIRMED` (Cheltenham) or `RESULTS` (Grand National) JavaScript object near the top of the `<script>` block.

**Key format:** `'HH:MM-dayIdx'` where dayIdx is 0 = first day, 1 = second day, etc.

**Example (Cheltenham):**
```javascript
'16:00-0': { winner: 'Lossiemouth', second: 'Brighterdaysahead', third: 'The New Lion' },
```

**Example (Grand National):**
```javascript
'16:00-2': { winner: 'I Am Maximus', second: 'Iroko', third: 'Grangeclare West', sp: '10/1' },
```

Update as each race is run. The leaderboard and results panel update automatically.

---

## 🖊️ Adding Tips — the daily card engine

**Read [`CLAUDE.md`](./CLAUDE.md) for the full tips engine.** The short version:

### Workflow per race day

1. **Course profile first.** Before any selections, recall the course
   (direction, shape, draw bias, going, key trainer/jockey stats).
2. **Extract the racecard** from Sky Bet screenshots: time, race name,
   distance, class, runners, EW terms; per runner — cloth no, draw,
   jockey/claim, trainer, form figures, age, weight, odds, market moves,
   CD/C/D flags.
3. **Form analysis** — recent form, course form, distance, going, trainer,
   jockey, weight & class, draw, market moves, pace.
4. **Three picks per race**: NAP (strongest), NB (next best), LONGSHOT
   (value at bigger odds, must have a credible chance). 1-2 sentences each,
   leading with the angle.
5. **Lucky 15** — pick the 4 strongest NAPs from across the card,
   avoiding bankers below 2/1. £7.50 (15 × 50p).
6. **External tipster integration** — badges inline next to matching
   horses, **2x** badge on crossover horses, tipster summary box,
   crossover signals box, key signals box (4-6 bullets).

### Display contract (every page must match)

The reference implementation is `chester-2026.html` Day 1. Every daily card
on the hub follows the same structure:

```
Live strip (when live today)
Header (gold accent, hero stats)
Day tabs (Wed / Thu / Fri)
Page title bar  ──  "chester-day1-tips · Wednesday 6 May 2026"
Race blocks (one per race)
   ├ NAP row  (tag · horse + source badges · draw + jockey | trainer | F:form | age wt · odds · place terms)
   ├ NB row
   ├ LONG row
   └ BIG naps row (red, optional — biggest-priced naps with no crossover)
Lucky 15 box (gold border)
External tipster picks (blue left border)
Crossover signals (blue top border)
Key signals (gold top border, 4-6 bullets)
Course guide block
Footer (BeGambleAware)
```

Tip-row grid: `[TYPE 56px] [BODY 1fr] [ODDS auto]`. On flat racing every
pick MUST show the draw badge.

### Source/tipster code registry

| Code | Tipster | Badge |
|---|---|---|
| SM | Steve Mullington (William Hill) | green |
| BG | Billy Grimshaw (HRN) | orange |
| HRN | horseracing.net main tips | blue |
| RO | Raceolly | purple |
| BIG | HRN Biggest Priced Naps | red |
| NL | Nick Luck | as needed |
| 2x | Two or more sources agree (computed) | gold |
| CD / C / D | Course-and-distance / course / distance winner | gold |

### Race key format

`'HH:MM-dayIdx'` where `dayIdx` is 0 = first day, 1 = second day, etc. Used
across all festival files for both `RESULTS` and tip data.

```javascript
'13:30-0': {
  tips: [
    { tag:'NAP',  horse:'Adonius', sources:['SM NAP','2x'],
      draw:1, jockey:'K.Fraser', trainer:'R.Menzies',
      form:'11', age:'2yo', wt:'9-9',
      odds:'9/2', place:'1/4 2pl' },
    { tag:'NB',   horse:'Wait Geordie', sources:['BG','2x'],
      draw:3, jockey:'O.Murphy', trainer:'H.Palmer', /* ... */ },
    { tag:'LONG', horse:'Final Appeal', /* ... */ },
  ],
  bigNaps:'…',  // optional red banner
}
```

---

## 🎨 Festival Colour Themes

Each festival has its own colour identity:

| Festival | Theme | Primary Colour |
|---|---|---|
| Cheltenham | Dark green / gold | `#1a3a1a` / `#d4a843` |
| Grand National | Navy / scarlet | `#0b1628` / `#c0392b` |
| Royal Ascot | Royal blue / gold | `#1a3a6b` / `#d4a843` |
| Epsom Derby | Purple / cream | `#6b2fa0` / `#f5f0e8` |
| Glorious Goodwood | Navy / lime | `#1a5276` / `#a3e635` |
| St Leger | Bronze / cream | `#7b3f00` / `#f5f0e8` |

---

## 🚀 Deploying to Netlify

### Option A — Drag and drop
1. Go to [netlify.com](https://netlify.com) → Log in
2. Drag the entire folder onto the Netlify dashboard
3. Done — get your URL

### Option B — GitHub + auto-deploy (recommended)
1. Push all files to a GitHub repository
2. In Netlify: New Site → Import from Git → Select repo
3. Build settings are already in `netlify.toml` — no changes needed
4. Every `git push` to `main` auto-deploys

### Setting a custom domain
In Netlify: Site Settings → Domain Management → Add Custom Domain
Example: `festivalformbook.co.uk`

---

## 📅 Season Calendar

| Festival | Dates | Status |
|---|---|---|
| Cheltenham Festival 2026 | 10–13 March 2026 | ✅ Archive |
| Grand National Festival 2026 | 9–11 April 2026 | ✅ Archive |
| Scottish Grand National 2026 | 17–18 April 2026 | ✅ Archive |
| Qipco Guineas Festival 2026 | 1–3 May 2026 | ✅ Archive |
| **Boodles Chester May Festival 2026** | **6–8 May 2026** | **🔴 Live (rich tips engine)** |
| Dante Festival 2026 | 13–15 May 2026 | 🔲 Shell needed |
| Epsom Derby 2026 | 5–6 June 2026 | 🔲 Shell needed |
| Royal Ascot 2026 | 16–20 June 2026 | 🔲 Shell needed |
| Glorious Goodwood 2026 | 28 Jul – 1 Aug 2026 | 🔲 Shell needed |
| St Leger Festival 2026 | 9–12 September 2026 | 🔲 Shell needed |
| Cheltenham Festival 2027 | 9–12 March 2027 | 🔲 Shell ready |
| Grand National Festival 2027 | April 2027 | 🔲 Shell needed |

---

## ⚠️ Responsible Gambling

This site provides tips for entertainment purposes only. Always bet responsibly.

- [BeGambleAware.org](https://www.begambleaware.org)
- [GamCare](https://www.gamcare.org.uk)
- [GamStop](https://www.gamstop.co.uk)
- National Gambling Helpline: 0808 8020 133
