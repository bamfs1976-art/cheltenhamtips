# Racing API archive

Raw payloads from The Racing API, written by `scripts/gate-check.mjs` and
`scripts/settle.mjs`.

**These are committed on purpose.** The free plan serves today's results only —
there is no history backfill — so this directory is the only archive we get.
Deleting a file here loses that day permanently.

Replay one with `--fixture`:

    node scripts/settle.mjs --course goodwood \
      --picks data/picks/goodwood-day5.json \
      --fixture data/racing-api/results-2026-08-01-goodwood.json
