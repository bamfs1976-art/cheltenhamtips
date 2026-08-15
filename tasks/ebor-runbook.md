# Ebor Festival 2026 — build runbook

**York (Knavesmire) · Wed 19 – Sat 22 August 2026 · flat · 4 days**
Page: `ebor-2026.html` · clean URL `/ebor-2026`

Preview shipped Sat 15 Aug. Every race currently prints **NO BET —
declarations not confirmed**. This file is the sequence that turns the
preview into four priced cards.

---

## Standing constraint

UK turf flat declarations confirm **48 hours out**. Nothing is priced
before its own declarations land, and nothing is priced from an entry
list (CLAUDE.md rule 13). Entry lists routinely halve.

| Card | Declarations land | Build day |
|---|---|---|
| Wed 19 · Juddmonte | Mon 17 Aug | Mon 17 / Tue 18 |
| Thu 20 · Yorkshire Oaks | Tue 18 Aug | Tue 18 / Wed 19 |
| Fri 21 · Nunthorpe | Wed 19 Aug | Wed 19 / Thu 20 |
| Sat 22 · Ebor Handicap | Thu 20 Aug | Thu 20 / Fri 21 |

---

## Per-day sequence

### 1 · Gate the card (the day before, or two days out)

The free Racing API plan serves `today` and `tomorrow` only — there is no
arbitrary date — so the gate can first be run for Wednesday's card on
**Tuesday 18 August**. Before that, declarations come from a screencard.

```sh
export RACING_API_USERNAME='...' RACING_API_PASSWORD='...'
node scripts/api-selftest.mjs --course york --day tomorrow   # once, first
node scripts/gate-check.mjs   --course york --day tomorrow
```

Credentials are not set in this repo's shell and Netlify env vars do not
reach a local shell — export them in the terminal you are running from.

Read the gate output for:

- **NO BET rows** — any race missing a declared field, or missing a draw
  on a flat runner. These print NO BET on the card and take no picks.
- **`LONG slot: closed`** — that race runs **two picks only**. Expect
  this in most of the Group races.
- **`⚠ place band at risk`** — the race is within two runners of a
  boundary. Say so on the card and treat the LONG as provisional.
- **`ℹ big field (20+)`** — check for a big-race place special. The Ebor
  and the Melrose are the likely candidates; heritage handicaps regularly
  pay above the standard ladder.

Every payload is archived to `data/racing-api/` automatically. Those files
are committed on purpose — the free plan has no history backfill, so
that directory is the only archive there is.

### 2 · Build the card

Follow CLAUDE.md §2 in order. Non-negotiables for this meeting:

- Draw badge on **every** pick (flat).
- Market move (**STEAM / DRIFT**) with the full price trail on every pick.
- LONG only if 5+ places (or 4+ at 16+ runners) **and** 8/1+ **and** a
  concrete signal. Otherwise two picks.
- A 3x+ crossover horse under 3/1 does **not** get the NAP — run it as
  the NB and give the NAP to a pick the consensus doesn't share.
- Lucky 15: 4 legs, all 4/1+, none from a NO BET race, none promoted on
  source count. Fewer than 4 qualifying legs → run short or skip and say
  why.
- Surface dissent: any horse with 2+ external sources we don't hold.

Match the display contract in CLAUDE.md §4. The page's own CSS already
carries every class the contract needs (`.pick-row`, `.pick-tag`,
`.draw-b`, `.sb-*` source badges, `.nobet`, `.pending-inline`).

### 3 · On the day

- **Re-check the place count at the off**, not just at declaration
  (rule 16). Withdrawals can drop a race below the band after pricing.
- **Re-check race assignment** — horses get re-routed between races on
  the same card.
- Flip the Ebor entry in `js/fmb-ui.js` from `status: 'upcoming'` to
  `status: 'live'` on Wed 19, and to `'archive'` after Sat 22. That
  registry is explicit by design, so it does not follow the clock. The
  hub's live banner *is* date-driven off `FESTIVALS_2026` and needs no
  change.

### 4 · Settle

```sh
node scripts/settle.mjs --course york --picks data/picks/ebor-day1.json
```

Picks file shape is documented in `docs/racing-api.md` §4. Omit `places`
so the count is derived from what actually ran; set `declaredPlaces` to
what the card was priced at, so a mismatch is reported rather than
buried. Results are **today only** on the free plan — settle on the day
or the data is gone.

The Lucky 15 is not settled by the script. Reduced multiples after a
non-runner still need doing by hand.

Report honestly against the record (rule 15): where a flagged warning
proved right and we bet the other side anyway, the settlement panel says
so.

---

## After the festival

- [ ] Set `concluded:true` and write the `headline` in
      `FESTIVALS_2026[]` (`js/season-data-2026.js`).
- [ ] Flip `js/fmb-ui.js` status to `archive`.
- [ ] Move the hub Featured card on to the next meeting (Sprint Cup
      Festival, Haydock, 3–5 Sep) and demote Ebor to the archive grid.
- [ ] Add the Ebor column to `season-2026.html` — leaderboard table
      header, per-tipster scores, and an event breakdown block. The
      Goodwood section is the pattern to copy.
- [ ] Add `EBOR_PICKS` / `EBOR_RESULTS` to `js/season-data-2026.js`.
- [ ] Fold the meeting into the season slot record in CLAUDE.md §2
      (NAP / NB / LONG table) and the Lucky 15 line.
