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
    # Billy Grimshaw (HRN), arrived 19:44 the evening before. NINE tips across
    # SIX races — two selections in each of three races, which is a shape §6's
    # divergence test has never met. His odds column is explicitly headed
    # "Best Odds"; the RP list's red buttons carry no such label. That
    # difference turns out to matter more than anything else here.
    ("13:30", "Daiquiri Bay",   "Grimshaw",    "Billy Grimshaw",       "12/1",  None),
    ("13:30", "Mount Atlas",    "Grimshaw",    "Billy Grimshaw",       "28/1",  None),
    ("14:05", "Division",       "Grimshaw",    "Billy Grimshaw",       "9/1",   None),
    ("14:05", "Paborus",        "Grimshaw",    "Billy Grimshaw",       "17/1",  None),
    ("14:40", "Sparan Nua",     "Grimshaw",    "Billy Grimshaw",       "12/1",  None),
    ("14:40", "Coedana",        "Grimshaw",    "Billy Grimshaw",       "37/1",  None),
    ("15:20", "Gstaad",         "Grimshaw",    "Billy Grimshaw",       "14/5",  None),
    ("16:00", "Bay City Roller", "Grimshaw",   "Billy Grimshaw",       "7/1",   None),
    ("16:35", "Gavriel",        "Grimshaw",    "Billy Grimshaw",       "5/1",   None),
]
# Which desks state that their odds are a PRICE COMPARISON. §6's shorter-price
# test is only licensed where the column says so — see section 5.
LABELLED_BEST_ODDS = {"Grimshaw"}


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
    """Shared races and divergences between two desks ON THIS CARD.

    A desk may hold MORE THAN ONE selection in a race — Grimshaw doubles up in
    three of his six. Two desks agree in a race if their selection SETS
    intersect at all, and diverge only if they are disjoint. That is the right
    reading, but note what it costs: a desk covering two of sixteen runners is
    twice as likely to intersect by chance as one covering a single runner, so
    agreement with a multi-pick desk is WEAKER evidence than agreement with a
    single-pick one, and a divergence from it is correspondingly stronger.
    """
    ra, rb = {}, {}
    for o, h, _ in desks[a]:
        ra.setdefault(o, set()).add(h)
    for o, h, _ in desks[b]:
        rb.setdefault(o, set()).add(h)
    shared = sorted(set(ra) & set(rb))
    div = [(o, "/".join(sorted(ra[o])), "/".join(sorted(rb[o])))
           for o in shared if not (ra[o] & rb[o])]
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
print("5 · TWO PRICE LISTS, AND THEY POINT OPPOSITE WAYS")
print("=" * 72)
print("""  §6: a price-COMPARISON quotes longer than any single card by construction,
  so a SHORTER price cannot be shopping — it is the market moving.

  Two lists arrived 75 minutes apart on the same card. They share NO HORSE, so
  they cannot be compared directly — but each can be differenced against our
  racecard forecast, and the two answers are opposite. That is the finding.
""")

SOURCES = {}
seen = set()
for off, horse, desk, writer, odds, stars in RP:
    if odds is None:
        continue
    src = "Grimshaw (labelled Best Odds)" if desk in LABELLED_BEST_ODDS \
        else "RP free-tips list (odds UNLABELLED)"
    # Dedupe on the SOURCE, not the desk: two desks on one list quote one price
    # for one horse, and counting it twice would double-weight it in the median.
    if (off, horse, src) in seen:
        continue
    seen.add((off, horse, src))
    fc = FORECAST.get((off, horse))
    if not fc:
        print(f"  !! no racecard forecast for {off} {horse}")
        continue
    SOURCES.setdefault(src, []).append((off, horse, fc, odds, prob(odds) / prob(fc)))

medians = {}
for src, rows in SOURCES.items():
    short = sum(1 for r in rows if r[4] > 1)
    med = statistics.median(r[4] for r in rows)
    medians[src] = med
    print(f"  {src}")
    print(f"    {len(rows)} horses · shorter than our card: {short} · longer: {len(rows)-short-sum(1 for r in rows if r[4]==1)}"
          f" · level: {sum(1 for r in rows if r[4]==1)}")
    print(f"    median move: x{med:.3f} of implied probability ({(med-1)*100:+.1f}%)\n")

print("""  THE MEDIAN IS A PROPERTY OF THE SOURCE, NOT OF THE MARKET.
  Yesterday's reading of the RP list said "+14.9% is the base rate of a tips
  list — every horse on one has been backed". That story predicts BOTH lists
  read shorter. Grimshaw's reads LONGER, by almost exactly as much. The
  selection-bias explanation is not supported and is withdrawn.

  What distinguishes them is visible on the page: Grimshaw's odds sit in boxes
  headed "Best Odds"; the RP buttons carry no label at all. A best-odds
  comparison SHOULD read longer than one card's forecast, and Grimshaw's does.
  So the honest rule is narrower than either version:

    Apply the shorter-price test only where the column STATES its odds are a
    comparison. Where it does not say, you do not know what you are
    differencing — record both observations and call neither.

  And normalise WITHIN a source. Never pool two.
""")

for src, rows in SOURCES.items():
    med = medians[src]
    licensed = "LICENSED — column states Best Odds" if "Best Odds" in src \
        else "NOT LICENSED — source unstated, reads recorded but not called"
    print(f"  {src}  [{licensed}]")
    print(f"  {'race':6} {'horse':16} {'card':>7} {'list':>7} {'ratio':>7} {'v median':>9}  read")
    for off, horse, fc, odds, ratio in sorted(rows, key=lambda r: -r[4]):
        rel = ratio / med
        read = "STEAM" if rel > 1.10 else "DRIFT" if rel < 0.90 else "flat"
        if "Best Odds" not in src:
            read = f"({read})"
        mark = "  <-- OUR " + next(sl for o, ps in OURS.items() if o == off
                                   for sl, h, _ in ps if h == horse) \
            if (off, horse) in ourset else ""
        print(f"  {off:6} {horse:16} {fc:>7} {odds:>7} {ratio:>7.3f} {rel:>9.3f}  {read}{mark}")
    print()

print("""  CAVEAT, stated rather than glossed: the ratio is noisiest at the longest
  prices, where one step on the ladder is a large proportional move. Coedana
  (25/1->37/1) and Jasour (150/1->100/1) are the least trustworthy rows in
  either table, and they sit at the extremes of both.""")

print("\n" + "=" * 72)
print("6 · THE LONG'S PRICE  (§4: re-check the PRICE, not just the place count)")
print("=" * 72)
rp = SOURCES["RP free-tips list (odds UNLABELLED)"]
eg = next(r for r in rp if r[1] == "Ebt's Guard")
print(f"  Ebt's Guard  card {eg[2]}  ->  {eg[3]} on the RP list.")
print(f"  ratio x{eg[4]:.3f}, v that list's median x{eg[4]/medians['RP free-tips list (odds UNLABELLED)']:.3f}.")
print("""
  WITHDRAWN AS A STEAM. That list does not say its odds are a comparison, and
  the second list shows the two sources are not measuring the same thing. One
  unlabelled observation against our forecast is two points from unknown books.

  What is unchanged and is what actually matters: 10/1 and 14/1 BOTH clear the
  slot's 8/1 minimum, so the LONG holds either way. Record both observations,
  call the direction at the off against a source that states what it is.
""")
