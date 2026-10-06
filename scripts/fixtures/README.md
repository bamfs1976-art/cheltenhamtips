# scripts/fixtures

Hand-built fixtures for exercising the engine's own checks. **Not API payloads** —
those live in `data/racing-api/` and §12 says to keep hand-built files out of it,
because that directory is the only history backfill there is.

| File | Replays |
|---|---|
| `nr-regression.json` | The three withdrawals the archive already lost money to. Goodwood Day 5's 18→15 (5-place offer lost), St Leger Day 1's 15:00 9→7 (Consent third for nothing), and La Pittura withdrawn from the Cambridgeshire 16:15. |

```sh
node scripts/nr-check.mjs --card scripts/fixtures/nr-regression.json \
  --nr "17:20 A, 17:20 B, 17:20 C, 15:00 D, 15:00 E, 16:15 La Pittura, 15:40 Pathein"
```

Expected: 5 things need a decision, exit 1. If that ever exits 0, rule 16 has
stopped being enforced.
