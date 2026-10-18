#!/bin/sh
# Champions Day 2026 (Ascot, 17 Oct) — the settlement behind every figure in the
# settled panel on champions-day-2026.html.
#
# Results compiled from web search, NOT a pasted Racing Post card: see the _source
# note in champions-day-results.json for exactly what is corroborated and what is
# provisional. The sensitivity script says which assumptions can move the figure.
set -e
cd "$(dirname "$0")/../.."
node scripts/settle.mjs \
  --fixture scripts/analysis/champions-day-results.json \
  --picks   data/picks/champions-day.json
node scripts/analysis/champions-day-band-sensitivity.mjs
python3 -I scripts/analysis/champions-day-slots.py
