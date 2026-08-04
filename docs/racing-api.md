# The Racing API integration

Automates the two manual steps that have cost the most: verifying declarations
before pricing a card, and settling results afterwards.

Provider: <https://theracingapi.com>. Specs and schemas were read from the
[api-evangelist/the-racing-api](https://github.com/api-evangelist/the-racing-api)
profile — that repo is metadata only (OpenAPI, JSON Schema, Postman, examples),
not the data itself.

---

## 1. Setup

Get a free key at theracingapi.com, then:

```sh
export RACING_API_USERNAME='...'
export RACING_API_PASSWORD='...'
```

For the deployed proxy, set the same two names in **Netlify → Site settings →
Environment variables**. They are never referenced from client-side code.

---

## 2. What the free plan actually covers

| Endpoint | Use |
|---|---|
| `/v1/racecards/free` | Declared runners with **draw** — the pre-flight gate |
| `/v1/results/today/free` | Finishing **position for every runner** — settlement |
| `/v1/courses`, `/v1/courses/regions` | Course IDs |

Two limits matter:

- **`day` is `today` or `tomorrow` only.** There is no arbitrary date.
- **Results are today only.** There is no free history backfill.

Because of the second point, every payload is archived to `data/racing-api/`.
Today's pull is tomorrow's history — that directory is the only backfill we get,
so it is committed rather than ignored.

Rate limit is 1 request/second; the client throttles and backs off on 429.

---

## 3. Pre-flight gate

Implements CLAUDE.md Step 3b against declared fields instead of transcribed
screenshots.

```sh
node scripts/gate-check.mjs --course goodwood
node scripts/gate-check.mjs --course york --day tomorrow --json
node scripts/gate-check.mjs --fixture data/racing-api/racecards-2026-08-01-goodwood.json
```

For each race it reports field size, computed each-way terms, draw coverage,
whether the LONG slot is open, and **whether the race sits near a place-band
boundary**. Exit code is 1 if any race fails the gate, so it can guard a build.

The boundary warning is the one that matters. Goodwood Day 5's 17:20 was priced
at 18 runners paying 5 places; three withdrawals took it to 15 and it settled at
4, below the threshold the LONG gate requires. The check now flags that in
advance:

```
⚠ place band at risk — 2 runner(s) above the 16-runner boundary;
  3 withdrawal(s) drops this to 4 places. Treat any LONG as provisional
  and re-check at the off.
```

`PLACE_BANDS` encodes Sky Bet's standard enhanced offer (5 places at 16+,
4 at 8+, 2 at 5+). It is a **floor, not the answer** — heritage handicaps carry
one-off specials well above it, and the Stewards' Cup paid 7. Fields of 20+ get
an explicit reminder to check.

---

## 4. Settlement

```sh
# Full finishing order, every runner — replaces the screenshot step
node scripts/settle.mjs --course goodwood

# Each-way P&L for our card, settled at card odds
node scripts/settle.mjs --course goodwood --picks data/picks/goodwood-day5.json

# Re-settle a past day from the archive
node scripts/settle.mjs --course goodwood --picks <picks> \
  --fixture data/racing-api/results-2026-08-01-goodwood.json
```

Picks file:

```json
{
  "event": "Goodwood Day 5",
  "date": "2026-08-01",
  "races": [
    {
      "off": "17:20",
      "ewFrac": 5,
      "declaredPlaces": 5,
      "picks": [
        { "type": "NAP",  "horse": "Crest Of Fire",  "odds": "7/2" },
        { "type": "LONG", "horse": "Thunder Wonder", "odds": "9/1" }
      ]
    }
  ]
}
```

- `places` — omit it and the place count is derived from **what actually ran**,
  not what was declared. That is the fix for the Day 5 failure.
- `declaredPlaces` — what the card was priced at. If it differs from the settled
  count the output says so, which is what CLAUDE.md rule 16 asks for.
- `ewFrac` — each-way denominator, default 5.
- Non-runners return the stake; missing horses are listed as unresolved rather
  than silently treated as losers.

Stake defaults to 50p each-way (`--stake` to change). The Lucky 15 is **not**
settled here — reduced multiples after a non-runner still need doing by hand.

---

## 5. Field mapping

`js/racing-api-map.js` maps every API field to ours and marks the gaps.
`RACING_API_GAPS` lists what the API carries that we currently have no
equivalent for — `spotlight`, `sire`, `trainer_14_days`, `trainer_rtf`,
`ew_places`, odds `history`.

`normaliseApiResult()` converts an API race into the `{ winner, second, third }`
shape the season scorer already reads, and adds `fourth`…`seventh`, `order`,
`ranCount` and `nonRunners` alongside. **Scoring semantics are unchanged** —
a 4th still scores `miss`, so no season figure moves.

`positionOf()` distinguishes three cases that the old data model conflated:

| Return | Meaning |
|---|---|
| `1`–`n` | Finishing position |
| `null` | Non-runner, **or unknown** on a legacy hand-entered result |
| `Infinity` | Confirmed unplaced |

An unpublished position is not a loss. That distinction is why five Day 5
positions were reported as a floor rather than a settled figure.

---

## 6. Paid plans — not wired up

`netlify/functions/racing-api.js` knows which endpoints need which plan and
returns an explanatory 403 rather than an opaque upstream error. To enable one,
add it to `ALLOWED_ENDPOINTS` there and to `FREE_ENDPOINTS` in
`scripts/lib/racing-api.mjs`.

| Plan | Adds |
|---|---|
| Basic | `/v1/racecards/basic`, `/v1/results/today` |
| Standard ~$19/mo | `/v1/results` (**history — enables backtesting**), trainer/jockey course and distance analysis |
| Pro ~$59/mo | `/v1/racecards/pro` (runner `stats`, `spotlight`, `trainer_14_days`, `past_results_flags`), `/v1/odds/{race_id}/{horse_id}` (**full price history + `ew_places` per bookmaker**) |

Worth stating plainly: season turnover is ~£609 with a net of −£93. Pro at
~£46/month costs more than the loss it would be trying to fix. Standard is
defensible as a research spend — it would let the engine rules be **backtested
rather than inferred from ~190 picks** — but not as a tipping edge on its own.
