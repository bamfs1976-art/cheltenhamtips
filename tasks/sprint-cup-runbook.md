# Sprint Cup Festival 2026 — build runbook

**Haydock Park · Thu 3 – Sat 5 September 2026 · flat**
Page: `sprint-cup-2026.html` · clean URL `/sprint-cup-2026`

Preview shipped Sun 30 Aug. Every race prints **NO BET — declarations not
confirmed**. This is the sequence that turns it into priced cards.

---

## Standing constraint

UK turf flat declarations confirm **48 hours out**. Nothing is priced
before its own declarations land, and nothing is priced from an entry list
(CLAUDE.md rule 13). Ebor is the reason: the Ebor Handicap listed **50
runners at entry and 22 were declared**.

| Card | Declarations land | Build day |
|---|---|---|
| Thu 3 Sep · opener | Tue 1 Sep | Tue 1 / Wed 2 |
| Fri 4 Sep · Charity Day | Wed 2 Sep | Wed 2 / Thu 3 |
| Sat 5 Sep · **Sprint Cup** | Thu 3 Sep | Thu 3 / Fri 4 |

## Open question — RESOLVED 2 Sep 2026

**Three days.** Thursday 3 September is confirmed as a Haydock raceday
with seven flat races, 13:30–17:00. The 3–5 Sep dates already carried in
`FESTIVALS_2026`, `js/fmb-ui.js`, the hub calendar and the countdown are
correct and need no change.

## Standing blocker on pricing

Neither automated route reaches a racecard from a Claude Code web session:

- **Racing API** — `api.theracingapi.com` returns **403 CONNECT** at the
  egress proxy, and no credentials are exported in the shell. Both would
  have to be fixed; credentials alone will not help.
- **WebSearch** — returns race counts, some off-times and occasional race
  names, but **never draws**. A flat race without a draw cannot clear the
  gate, so this cannot price a card on its own.

**Ask for the Racing Post racecard by name** (CLAUDE.md §12, route 1).
One paste per day carries the draw, field size, going with GoingStick
strips, trainer strike rates, OR/TS/RPR, form, CD flags and the betting
forecast — everything the gate and the display contract need.

## Per-day sequence

1. **Get the racecard.** Ask for the Racing Post racecard by name
   (CLAUDE.md §12). It is the only source that carries the draw, and
   without a draw a flat race cannot clear the gate.
2. **Gate it.** Build a fixture in the API payload shape and replay it:
   `node scripts/gate-check.mjs --fixture <scratch path>`.
   Keep hand-built fixtures **out of** `data/racing-api/`.
   Verify every draw list is a complete 1..n permutation before pricing.
3. **Build the card** to the display contract (CLAUDE.md §4). Draw badge
   on every pick, market move on every pick, LONG only if it clears the
   conditional gate.
4. **Each-way terms off the bookmaker**, never off the racecard. The
   Sprint Cup and the Old Borough Cup are the likely place specials.
   Re-check at the off (rule 16) — that fired on three consecutive days
   at Ebor.
5. **Lucky 15 does not run** unless asked for (Step 5, post-Ebor).
6. **Settle** on the day: `node scripts/settle.mjs`. Results are today
   only on the free plan.

## On the day

- Flip `js/fmb-ui.js` from `status: 'upcoming'` to `'live'` on Thu 3 Sep,
  and to `'archive'` after Sat 5. That registry is explicit by design.
- Re-check the GoingStick strips at the off. Rule 17 held on all three
  days it was tested at York; the readings moved every time.

## After the festival

- [ ] `concluded:true` + headline in `FESTIVALS_2026`
- [ ] `js/fmb-ui.js` status → `archive`
- [ ] Hub featured card → St Leger (Doncaster, 10–13 Sep); demote Sprint
      Cup to the archive grid
- [ ] Add Sprint Cup rows to `ROI_LEDGER` and `L15_LEDGER`
- [ ] Fold the meeting into the CLAUDE.md §2 slot table and L15 line
