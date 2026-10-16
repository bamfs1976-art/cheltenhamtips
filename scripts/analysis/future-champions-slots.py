#!/usr/bin/env python3
"""Per-slot returns for Future Champions 2026, and the running §4 pts/pick table.

§4 keeps a pts/pick table on "the only picks that record returns" — the settled days
from 10 Sep onwards. Through the Cambridgeshire that was 81 picks, £81.00 staked and
£67.09 returned. This adds the two Future Champions days to it.

Reads settle.mjs's `--json` ledger rather than re-summing its printed lines. The first
version of this script did re-sum them and disagreed with settle.mjs by 0.1pp on the
same day — fifteen figures each rounded to the penny, then added, is not the sum
rounded once. §10's rule about reading a figure off its derivation applies to one
script reading another's, not only to prose.

Voids ARE counted as picks, because the 81-pick figure they are being added to counts
them. A void returns its stake, so it pulls points-per-pick toward 1.00 without being
a result; the void column below says how many, so the reader can discount it.

Run via scripts/analysis/future-champions-settlement.sh.
"""
import json, subprocess, pathlib, tempfile, os

ROOT = pathlib.Path(__file__).resolve().parents[2]
DAYS = (("Friday 9 Oct", "fri"), ("Saturday 10 Oct", "sat"))
# Carried forward from the Cambridgeshire recompute recorded in CLAUDE.md §4.
PRIOR = {"NAP": (38, 7, 28.50), "NB": (38, 9, 36.34), "LONG": (5, 0, 2.25)}


def ledger(day):
    fd, path = tempfile.mkstemp(suffix=".json")
    os.close(fd)
    try:
        subprocess.run(
            ["node", "scripts/settle.mjs",
             "--fixture", f"scripts/analysis/future-champions-results-{day}.json",
             "--picks", f"data/picks/future-champions-{day}.json",
             "--json", path],
            cwd=ROOT, capture_output=True, text=True, check=True)
        return json.load(open(path))
    finally:
        os.unlink(path)


slots, totals = {}, {}
for label, day in DAYS:
    d = ledger(day)
    totals[label] = (d["staked"], d["returned"])
    for p in d["picks"]:
        a = slots.setdefault(p["slot"], dict(picks=0, wins=0, placed=0, void=0, ret=0.0))
        a["picks"] += 1
        a["ret"] += p["returned"]
        if p["outcome"] == "won": a["wins"] += 1
        elif p["outcome"] == "placed": a["placed"] += 1
        elif p["outcome"] == "void": a["void"] += 1

print("\n── Future Champions 2026 by day " + "─" * 34)
S = R = 0.0
for label, (s, r) in totals.items():
    S += s; R += r
    print(f"  {label:16} staked £{s:6.2f}  returned £{r:6.2f}  net {r-s:+7.2f}  {100*(r-s)/s:+6.1f}%")
print(f"  {'MEETING':16} staked £{S:6.2f}  returned £{R:6.2f}  net {R-S:+7.2f}  {100*(R-S)/S:+6.1f}%")

print("\n── Future Champions 2026 by slot (voids counted as picks) " + "─" * 9)
print(f"  {'slot':5} {'picks':>5} {'wins':>5} {'placed':>6} {'void':>5} {'returned':>9} {'net':>8} {'pts/pick':>9}")
for k in ("NAP", "NB", "LONG"):
    a = slots.get(k)
    if not a:
        print(f"  {k:5} slot did not run"); continue
    print(f"  {k:5} {a['picks']:5} {a['wins']:5} {a['placed']:6} {a['void']:5} "
          f"£{a['ret']:8.2f} {a['ret']-a['picks']:+8.2f} {a['ret']/a['picks']:9.2f}")

print("\n── Running §4 table: every settled pick that records its return " + "─" * 3)
print(f"  {'slot':5} {'picks':>5} {'wins':>5} {'SR':>5} {'returned':>9} {'net':>8} {'pts/pick':>9}")
tp, tr = 0, 0.0
for k in ("NAP", "NB", "LONG"):
    p0, w0, r0 = PRIOR[k]
    a = slots.get(k, dict(picks=0, wins=0, ret=0.0))
    p, w, r = p0 + a["picks"], w0 + a["wins"], r0 + a["ret"]
    tp += p; tr += r
    print(f"  {k:5} {p:5} {w:5} {100*w/p:4.0f}% £{r:8.2f} {r-p:+8.2f} {r/p:9.2f}")
print(f"  {'TOTAL':5} {tp:5} {'':5} {'':5} £{tr:8.2f} {tr-tp:+8.2f} {tr/tp:9.2f}")
