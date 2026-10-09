# scripts/fixtures

Hand-built fixtures for exercising the engine's own checks. **Not API payloads** —
those live in `data/racing-api/` and §12 says to keep hand-built files out of it,
because that directory is the only history backfill there is.

| File | Replays |
|---|---|
| `nr-regression.json` | The three withdrawals the archive already lost money to. Goodwood Day 5's 18→15 (5-place offer lost), St Leger Day 1's 15:00 9→7 (Consent third for nothing), and La Pittura withdrawn from the Cambridgeshire 16:15. Plus **the Lesrico price case** (added 9 Oct 2026): a LONG logged at 9/1 that started 3/1F, which no withdrawal causes and which the band checks cannot see. |

```sh
node scripts/nr-check.mjs --card scripts/fixtures/nr-regression.json \
  --nr "17:20 A, 17:20 B, 17:20 C, 15:00 D, 15:00 E, 16:15 La Pittura, 15:40 Pathein"
```

Expected: **6** things need a decision, exit 1. If that ever exits 0, rule 16 has
stopped being enforced.

The Lesrico row is the one case here that **fires with no withdrawals at all** —
`node scripts/nr-check.mjs --card scripts/fixtures/nr-regression.json` on its own
exits 1 because of it. That is deliberate: §4 found the LONG's *price* moves
further between pricing and the off than the place band does, and a check driven
only by `--nr` can never see it. Record the LONG's prices as `oddsObserved[]`
(source + odds, oldest first) and the script scores the latest against the slot's
own 8/1 minimum.
