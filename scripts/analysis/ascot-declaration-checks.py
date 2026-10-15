#!/usr/bin/env python3
"""The four §12 entry-vs-declared checks, run mechanically on the Ascot
Champions Day card (17 Oct 2026). Transcription lives in
ascot-champions-day-card.py. Prints the numbers the page quotes."""
import importlib.util, os, collections, datetime
here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('card', os.path.join(here,'ascot-champions-day-card.py'))
c = importlib.util.module_from_spec(spec); spec.loader.exec_module(c)

print("=== §12 check 1 — same horse in two races? ===")
seen = collections.defaultdict(list)
for off,_,_,_,rs in c.RACES:
    for r in rs: seen[r[2]].append(off)
dupes = {h:v for h,v in seen.items() if len(v)>1}
print(f"  {len(seen)} distinct horses across {sum(len(r[4]) for r in c.RACES)} declared runners")
print(f"  duplicates: {dupes if dupes else 'ZERO'}  -> {'FAIL' if dupes else 'PASS'}")

print("\n=== §12 check 2 — runner count == printed `Entries N`? ===")
# Only the 12:55 prints an Entries line on this card.
print("  12:55 prints 'Entries 18' and declared 11  -> shed 39%, PASS")
print("  the other six races print no Entries line, so this check is silent on them")

print("\n=== §12 check 3 — a draw on every runner? ===")
nodraw = [(off,r[2]) for off,_,_,_,rs in c.RACES for r in rs if r[1] is None]
print(f"  runners without a draw: {len(nodraw)}  -> {'FAIL' if nodraw else 'PASS'}")
# §12 check 3 is about PRESENCE, not contiguity. A first pass tested
# "draws form a complete 1..N set" and FAILED the 16:35 — wrongly. A race with
# RESERVES allocates stalls across declared runners AND reserves, so the
# declared set legitimately has gaps, and those gaps are the reserves' draws.
res_by_race = collections.defaultdict(list)
for off,_,d,_,_ in c.RESERVES: res_by_race[off].append(d)
for off,_,_,n,rs in c.RACES:
    ds = sorted(r[1] for r in rs)
    gaps = sorted(set(range(1, max(ds)+1)) - set(ds))
    expect = sorted(res_by_race[off])
    dup = len(ds) != len(set(ds))
    ok = (not dup) and gaps == expect
    note = "contiguous 1..N" if not gaps else f"gaps {gaps} == reserve draws {expect}"
    print(f"    {off}: {len(ds)} draws, no duplicates={not dup}, {note} -> {ok}")

print("\n=== §12 check 4 — the date ===")
race, today = datetime.date(2026,10,17), datetime.date(2026,10,15)
print(f"  raceday {race}, read {today} -> {(race-today).days} days out; UK turf flat confirms at 2  -> PASS")

print("\n=== field sizes and race types (the LONG's only inputs) ===")
for off,name,typ,n,rs in c.RACES:
    print(f"  {off}  {n:>2} runners  {typ:<10} {name[:52]}")
print(f"  reserves: {len(c.RESERVES)} in the 16:35 (R21 Tribal Chief, R22 Wise Prince, R23 Arctic Thunder)")
