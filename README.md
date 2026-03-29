# 🏇 The Festival Form Book

Expert tips, race guides and live results for Britain and Ireland's biggest horse racing festivals.

## 🔗 Live Site

Deploy to Netlify and access at your custom URL. Each festival is a standalone HTML page linked from the hub homepage.

---

## 📁 File Structure

```
/
├── index.html                  ← Hub homepage (festival grid, tipster league, calendar)
├── cheltenham-2026.html        ← Cheltenham Festival 2026 (ARCHIVE — fully completed)
├── grand-national-2026.html    ← Grand National Festival 2026 (UPCOMING — tips live)
├── cheltenham-2027.html        ← Cheltenham Festival 2027 (SHELL — tips coming Feb 2027)
├── cheltenham-2026-analytics.docx ← Post-festival analytics report
├── netlify.toml                ← Netlify deployment config
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

## 🖊️ Adding Tips

Each festival file has a `STATIC_TIPS` (Cheltenham) or `TIPS` (Grand National) object. Each race key maps to an object with `nap`, `nb`, and optionally `ew` (each-way) picks.

```javascript
'16:00-0': {
  nap: {
    horse:   'Horse Name',
    odds:    '9/2',
    dec:     5.5,
    trainer: 'W P Mullins',
    conf:    78,    // confidence 0-100
    reason:  'Why this horse wins...'
  },
  nb: { ... },
  ew: { ... }
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
| Cheltenham Festival 2026 | 10–13 March 2026 | ✅ Complete |
| Grand National Festival 2026 | 9–11 April 2026 | 🔜 Upcoming |
| Epsom Derby 2026 | 6–7 June 2026 | 🔲 Shell needed |
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
