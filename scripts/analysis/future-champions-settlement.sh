#!/bin/sh
# Future Champions 2026 (Newmarket, 9–10 Oct) — the settlement behind every figure
# in the two settled panels on future-champions-2026.html.
#
# Results are transcribed from Racing Post result screenshots; see the _source note
# in each JSON. Both exit 0, which matters: a non-zero exit means a pick placed in a
# race whose published result does not run as deep as the race pays, and nothing can
# be published until that is resolved.
set -e
cd "$(dirname "$0")/../.."
for d in fri sat; do
  node scripts/settle.mjs \
    --fixture scripts/analysis/future-champions-results-$d.json \
    --picks   data/picks/future-champions-$d.json
done
python3 -I scripts/analysis/future-champions-slots.py
