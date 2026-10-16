#!/usr/bin/env python3
"""Champions Day 2026 — external columns, crossovers, and the price move.

Two sources arrived the evening before the card:

  1. A Racing Post free-tips list for Ascot "TOMORROW" — 19 tip rows, with a
     price-comparison odds button on each.
  2. A William Hill news article (by their news team, quoting the trading desk).
     This is a BOOKMAKER'S OWN BOARD, not a tipster column and not a comparison,
     so §6's shorter-price test does not apply to it. It is handled separately
     and deliberately counted as ZERO opinions.

The headline finding is about the price test, not about the tips — see
BASE RATE below. Run: python3 -I scripts/analysis/champions-day-external-overlay.py
"""
import importlib.util, pathlib, statistics

ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location(
    "card", ROOT / "scripts/analysis/ascot-champions-day-card.py")
card = importlib.util.module_from_spec(spec); spec.loader.exec_module(card)

# Our priced card.
OURS = {
    "12:55": [("NAP", "Speed Of Sound", "16/1"), ("NB", "Night In Vegas", "13/2")],
    "13:30": [("NAP", "Daiquiri Bay", "10/1"), ("NB", "Gregory", "5/1")],
    "14:05": [("NAP", "Almeraq", "6/5"), ("NB", "Prince Of India", "14/1")],
    "14:40": [("NAP", "Minnie Hauk", "8/1"), ("NB", "Kalpana", "6/4")],
    "15:20": [("NAP", "Ten Bob Tony", "8/1"), ("NB", "Gstaad", "10/3")],
    "16:00": [("NAP", "Constitution River", "6/1"), ("NB", "Calandagan", "2/1")],
    "16:35": [("NAP", "Gavriel", "5/1"), ("NB", "Crown Of Oaks", "7/1"),
              ("LONG", "Ebt's Guard", "14/1")],
}

# (off, horse, desk, writer, odds-on-the-comparison-button, stars)
RP = [
    ("12:55", "Arapaho Gold",  "Spotlight",    "Richard Russell",      "11/4",  1),
    ("13:30", "Queenstown",    "Topspeed",     "Craig Thake",          "11/1",  1),
    ("13:30", "Highwayman",    "Spotlight",    "Richard Austen",       "3/1",   3),
    ("14:05", "Almeraq",       "The Punt Acca", None,                  "11/8",  1),
    ("14:05", "Almeraq",       "Spotlight",    "Richard O'Brien",      "11/8",  1),
    ("14:05", "Jasour",        "The Punt",     "Harry Wilson",         "100/1", 1),
    ("14:05", "Soul Love",     "The North",    "Colin Russell",        "28/1",  2),
    ("14:40", "Kalpana",       "The Punt Acca", None,                  "11/8",  1),
    ("14:40", "Kalpana",       "Spotlight",    "Richard Austen",       "11/8",  1),
    ("15:20", "Zavateri",      "Spotlight",    "Steve Boow",           "10/1",  1),
    ("16:00", "Ombudsman",     "Spotlight",    "Ben Hutton",           "2/1",   1),
    ("16:35", "Ebt's Guard",   "Postdata",     None,                   "10/1",  2),
    ("16:35", "Ebt's Guard",   "Lambourn",     "Otis Brankin-Frisby",  "10/1",  2),
    ("16:35", "Mister Winston", "Andrew Mount", None,                  "28/1",  2),
    ("16:35", "Mister Winston", "Sam Hardy",   None,                   "28/1",  2),
    ("16:35", "Scoville",      "RP Ratings",   "Paul Curtis",          "4/1",   1),
    ("16:35", "Fifth Column",  "Newmarket",    "David Milnes",         "16/1",  1),
    ("16:35", "Hickory",       "Eyecatcher",   "Richard Russell",      "11/1",  1),
    ("16:35", "Hickory",       "Spotlight",    "Ben Hutton",           "11/1",  1),
    # Mullington's seven, already on the page from the William Hill ITV column.
    ("12:55", "Arapaho Gold",   "Mullington",  "Steve Mullington",     None,    None),
    ("13:30", "Caballo De Mar", "Mullington",  "Steve Mullington",     None,    None),
    ("14:05", "Almeraq",        "Mullington",  "Steve Mullington",     None,    None),
    ("14:40", "Kalpana",        "Mullington",  "Steve Mullington",     None,    None),
    ("15:20", "Talk Of New York", "Mullington", "Steve Mullington",    None,    None),
    ("16:00", "Bay City Roller", "Mullington", "Steve Mullington",     None,    None),
    ("16:35", "Fifth Column",   "Mullington",  "Steve Mullington",     None,    None),
]


def dec(frac):
    n, d = frac.split("/")
    return float(n) / float(d) + 1.0


def prob(frac):
    return 1.0 / dec(frac)


FORECAST = {}
for off, _n, _t, _r, runners in card.RACES:
    for row in runners:
        FORECAST[(off, row[2])] = row[8]

print("\n" + "=" * 72)
print("1 · DESKS, NOT ROWS  (§6: count opinions, not appearances)")
print("=" * 72)
desks = {}
for off, horse, desk, writer, odds, stars in RP:
    desks.setdefault(desk, []).append((off, horse, writer))
print(f"  {len(RP)} tip rows from {len(desks)} desks across 7 races.\n")
for d, rows in sorted(desks.items(), key=lambda kv: (-len(kv[1]), kv[0])):
    print(f"  {d:14} {len(rows)} tip(s): " + ", ".join(f"{o} {h}" for o, h, _ in rows))

print("\n  Spotlight files ONE verdict per race under five different bylines —")
print("  a column cannot agree with itself, so those 7 rows are 7 opinions, not 7 agreements.")

byhorse_pre = {}
for off, horse, desk, writer, odds, stars in RP:
    byhorse_pre.setdefault((off, horse), []).append(desk)
ourset = {(o, h) for o, picks in OURS.items() for _, h, _ in picks}

print("\n" + "=" * 72)
print("2 · DIVERGENCE TESTS — PAIRWISE, on the desks that actually form a badge")
print("=" * 72)
print("""  The first version of this script tested every desk against Spotlight and
  called nine of them independent. That answers the wrong question. A crossover
  badge is a claim about the TWO desks that share the horse, and most of these
  badges do not involve Spotlight at all. Diverging from Spotlight proves a desk
  is not Spotlight republished; it proves NOTHING about whether it is independent
  of its co-signer. §6 already says a multi-desk crossover is several pairwise
  claims — this is that rule applied to the pair, not to the house column.
""")

# Divergences recorded in CLAUDE.md from earlier meetings, pooled per §6.
PRIOR = {
    ("Eyecatcher", "Spotlight"): (2, 0, "Future Champions, both days"),
    ("Newmarket", "Spotlight"): (2, 0, "Future Champions, both days"),
    ("Spotlight", "The Punt Acca"): (1, 1, "Future Champions Saturday"),
}


def pairwise(a, b):
    """Shared races and divergences between two desks ON THIS CARD."""
    ra = {o: h for o, h, _ in desks[a]}
    rb = {o: h for o, h, _ in desks[b]}
    shared = sorted(set(ra) & set(rb))
    div = [(o, ra[o], rb[o]) for o in shared if ra[o] != rb[o]]
    return shared, div


for (off, horse), ds in sorted(byhorse_pre.items()):
    if len(ds) < 2:
        continue
    for i in range(len(ds)):
        for j in range(i + 1, len(ds)):
            a, b = sorted((ds[i], ds[j]))
            shared, div = pairwise(a, b)
            pri = PRIOR.get((a, b))
            ps, pd, pwhen = pri if pri else (0, 0, None)
            ts, td = len(shared) + ps, len(div) + pd
            if td:
                verdict = "VERIFIED — independence shown by divergence"
            elif ts == 1:
                verdict = "UNTESTABLE — one shared race, agreement proves nothing"
            else:
                verdict = f"NOT YET — none at {ts} shared races (republication-shaped)"
            extra = f"  [+{ps} shared/{pd} div from {pwhen}]" if pri else ""
            print(f"  {off} {horse:16} {a} + {b}")
            print(f"       this card: {len(shared)} shared, {len(div)} divergence(s){extra}")
            print(f"       -> {verdict}")

print("\n  And one pair that IS cleanly settled, in the one race they share:")
sh, dv = pairwise("The Punt", "The Punt Acca")
print(f"  The Punt v The Punt Acca — {len(sh)} shared, {len(dv)} divergence(s):")
for o, x, y in dv:
    print(f"    {o}: {x} v {y}")
print("  Two desks under one masthead disagreeing in the only race they share.")
print("  That is the strongest form of the test and it costs nothing to run.")

byline = {}
for off, horse, desk, writer, _, _ in RP:
    if writer:
        byline.setdefault(writer, set()).add(desk)
shared_byline = {w: ds for w, ds in byline.items() if len(ds) > 1}
print("\n  WRITERS APPEARING UNDER MORE THAN ONE MASTHEAD ON THIS CARD:")
for w, ds in sorted(shared_byline.items()):
    print(f"    {w} files for {' and '.join(sorted(ds))}")
if not shared_byline:
    print("    none")
print("""
  Note what this does and does not say. Eyecatcher is staffed from the same
  pool as Spotlight, which is a concrete reason to doubt they are independent
  desks — stronger than a bare count of zero divergences. But in the 16:35
  itself the two rows are DIFFERENT people (Russell for Eyecatcher, Hutton for
  Spotlight), so that race's agreement is two writers agreeing, not one writer
  counted twice. Both statements are true and the badge stays unverified.""")

print("\n" + "=" * 72)
print("4 · ALIGNMENT, PER COLUMN  (§6: never only in aggregate)")
print("=" * 72)
for d, rows in sorted(desks.items()):
    hit = sum(1 for o, h, _ in rows if (o, h) in ourset)
    print(f"  {d:14} {hit}/{len(rows)} with us")
ours_n = sum(len(v) for v in OURS.values())
held = len({(o, h) for o, h, *_ in [(r[0], r[1]) + tuple() for r in RP]} & ourset)
print(f"\n  Of our {ours_n} picks, {held} are held by at least one column; "
      f"{ours_n - held} are held by nobody.")

print("\n" + "=" * 72)
print("5 · THE PRICE TEST, AND WHY ITS BASE RATE BREAKS IT HERE")
print("=" * 72)
print("  §6: a price-COMPARISON quotes longer than any single card by construction,")
print("  so a SHORTER price cannot be shopping — it is the market moving.\n")
rows = []
seen = set()
# Mullington carries no comparison price, so he contributes no price row.
for off, horse, desk, writer, odds, stars in RP:
    if (off, horse) in seen:
        continue
    seen.add((off, horse))
    if odds is None:
        continue
    fc = FORECAST.get((off, horse))
    if not fc:
        print(f"  !! no racecard forecast for {off} {horse}")
        continue
    ratio = prob(odds) / prob(fc)
    rows.append((off, horse, fc, odds, ratio))

shorter = [r for r in rows if r[4] > 1]
longer = [r for r in rows if r[4] < 1]
print(f"  {len(rows)} horses priced on both. "
      f"SHORTER than our card: {len(shorter)}.  LONGER: {len(longer)}.")
print("\n  Read naively that is ten STEAMs on one card. It is not.")
print("  EVERY horse on this list is somebody's SELECTION. A sample chosen for")
print("  being tipped is a sample chosen for having been backed, so 'shorter' is")
print("  the BASE RATE of the list, not a signal about any horse in it.\n")

med = statistics.median(r[4] for r in rows)
print(f"  Median move across the list: x{med:.3f} of implied probability "
      f"({(med - 1) * 100:+.1f}%).")
print("  §5b's fix applies — take the deviation from the list's own median,")
print("  exactly as it says to do against a book's margin:\n")
print(f"  {'race':6} {'horse':16} {'card':>7} {'list':>7} {'ratio':>7} {'v median':>9}  read")
for off, horse, fc, odds, ratio in sorted(rows, key=lambda r: -r[4]):
    rel = ratio / med
    read = "STEAM" if rel > 1.10 else "DRIFT" if rel < 0.90 else "flat"
    mark = "  <-- OUR " + next(s for o, ps in OURS.items() if o == off
                               for s, h, _ in ps if h == horse) \
        if (off, horse) in ourset else ""
    print(f"  {off:6} {horse:16} {fc:>7} {odds:>7} {ratio:>7.3f} {rel:>9.3f}  {read}{mark}")

print("\n  CAVEAT, stated rather than glossed: the ratio is noisiest at the longest")
print("  prices, where one step on the price ladder is a large proportional move.")
print("  Jasour (150/1->100/1) and Soul Love (50/1->28/1) are the two least")
print("  trustworthy rows here for exactly that reason.")

print("\n" + "=" * 72)
print("6 · THE LONG'S PRICE  (§4: re-check the PRICE, not just the place count)")
print("=" * 72)
eg = next(r for r in rows if r[1] == "Ebt's Guard")
print(f"  Ebt's Guard  card {eg[2]}  ->  comparison {eg[3]}")
print(f"  ratio x{eg[4]:.3f}, v median x{eg[4] / med:.3f} — a genuine STEAM after normalising.")
print(f"  Still clears the slot's 8/1 minimum at {eg[3]}, so the LONG holds.")
print("  Two desks (Postdata + Lambourn) also tip it. Record the observation;")
print("  §6 forbids the crossover count from moving the slot either way.")
