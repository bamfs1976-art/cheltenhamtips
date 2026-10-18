#!/usr/bin/env python3
"""Per-slot returns for Champions Day 2026, and the running §4 pts/pick table.

Adds the 15 Ascot picks to the 112 that already record their returns (the settled
days from 10 Sep onwards). Same construction as future-champions-slots.py: reads
settle.mjs's `--json` ledger rather than re-summing printed lines, and counts voids
as picks because the 112-pick figure being added to counts them.

Run via scripts/analysis/champions-day-settlement.sh.
"""
import json, subprocess, pathlib, tempfile, os

ROOT = pathlib.Path(__file__).resolve().parents[2]
# Carried forward from the Future Champions recompute recorded in CLAUDE.md §4.
PRIOR = {"NAP": (53, 9, 40.51), "NB": (53, 11, 42.76), "LONG": (6, 0, 2.25)}

fd, path = tempfile.mkstemp(suffix=".json"); os.close(fd)
try:
    subprocess.run(
        ["node", "scripts/settle.mjs",
         "--fixture", "scripts/analysis/champions-day-results.json",
         "--picks", "data/picks/champions-day.json", "--json", path],
        cwd=ROOT, capture_output=True, text=True, check=True)
    d = json.load(open(path))
finally:
    os.unlink(path)

slots = {}
for p in d["picks"]:
    a = slots.setdefault(p["slot"], dict(picks=0, wins=0, placed=0, void=0, ret=0.0))
    a["picks"] += 1
    a["ret"] += p["returned"]
    if p["outcome"] == "won": a["wins"] += 1
    elif p["outcome"] == "placed": a["placed"] += 1
    elif p["outcome"] == "void": a["void"] += 1

s, r = d["staked"], d["returned"]
print(f"\n── Champions Day 2026 (Ascot, one day) {'─' * 28}")
print(f"  staked £{s:.2f}  returned £{r:.2f}  net {r-s:+.2f}  {100*(r-s)/s:+.1f}%")

print(f"\n── By slot (voids counted as picks) {'─' * 31}")
print(f"  {'slot':5} {'picks':>5} {'wins':>5} {'placed':>6} {'void':>5} {'returned':>9} {'net':>8} {'pts/pick':>9}")
for k in ("NAP", "NB", "LONG"):
    a = slots.get(k)
    if not a:
        print(f"  {k:5} slot did not run"); continue
    print(f"  {k:5} {a['picks']:5} {a['wins']:5} {a['placed']:6} {a['void']:5} "
          f"£{a['ret']:8.2f} {a['ret']-a['picks']:+8.2f} {a['ret']/a['picks']:9.2f}")

print(f"\n── Running §4 table: every settled pick that records its return {'─' * 3}")
print(f"  {'slot':5} {'picks':>5} {'wins':>5} {'SR':>5} {'returned':>9} {'net':>8} {'pts/pick':>9}")
tp, tr = 0, 0.0
for k in ("NAP", "NB", "LONG"):
    p0, w0, r0 = PRIOR[k]
    a = slots.get(k, dict(picks=0, wins=0, ret=0.0))
    p, w, rr = p0 + a["picks"], w0 + a["wins"], r0 + a["ret"]
    tp += p; tr += rr
    print(f"  {k:5} {p:5} {w:5} {100*w/p:4.0f}% £{rr:8.2f} {rr-p:+8.2f} {rr/p:9.2f}")
print(f"  {'TOTAL':5} {tp:5} {'':5} {'':5} £{tr:8.2f} {tr-tp:+8.2f} {tr/tp:9.2f}")
