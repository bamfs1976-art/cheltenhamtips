#!/usr/bin/env python3
"""Champions Day 2026 — external columns, crossovers, and the price move.

Two sources arrived the evening before the card:

  1. A Racing Post free-tips list for Ascot "TOMORROW" — 19 tip rows, with a
     price-comparison odds button on each.
  2. A William Hill news article (by their news team, quoting the trading desk).
     This is a BOOKMAKER'S OWN BOARD, not a tipster column and not a comparison,
     so §6's shorter-price test does not apply to it. It is handled separately
     and deliberately counted as ZERO opinions.

And on RACE MORNING, 04:48, three horseracing.net panels: Biggest Priced Tips,
Biggest Priced Naps, and Raceolly's own list. Their odds sit under a "Best Odds"
heading, which makes them the SECOND labelled comparison on this card. They
read longer, like the first — but two of the three panels select on PRICE,
which the rival explanation also predicts, so the apparent replication is
confounded and is reported as such. See sections 5c and 7.

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
    # Frick (@frickstips), posted 19:17 on X. Seven bets across five races —
    # the SECOND multi-pick desk in two days. His prices are the ones he struck,
    # not a comparison and not a firm's board: a third kind of price source.
    ("13:30", "Highwayman",     "Frick",       "Frick",                "3/1",   None),
    ("14:05", "Coppull",        "Frick",       "Frick",                "11/1",  None),
    ("14:05", "Soul Love",      "Frick",       "Frick",                "28/1",  None),
    ("14:40", "Johanna Walsh",  "Frick",       "Frick",                "11/2",  None),
    ("15:20", "Rayif",          "Frick",       "Frick",                "13/2",  None),
    ("16:35", "Hickory",        "Frick",       "Frick",                "9/1",   None),
    ("16:35", "Classic",        "Frick",       "Frick",                "20/1",  None),
    # Raceolly, read off horseracing.net at 04:48 on race morning. FIVE Ascot
    # tips, so unlike Eyecatcher or Newmarket he is a multi-race desk and the
    # divergence test can actually settle him. His prices are the site's
    # "Best Odds" figures — the same feed as the two panels below, which is the
    # whole point of section 7.
    ("12:55", "Speed Of Sound", "Raceolly",    "Raceolly",             "12/1",  None),
    ("13:30", "Amiloc",         "Raceolly",    "Raceolly",             "17/1",  None),
    ("14:05", "Jasour",         "Raceolly",    "Raceolly",             "129/1", None),
    ("15:20", "Hawk Mountain",  "Raceolly",    "Raceolly",             "37/1",  None),
    ("16:35", "Whip Cracker",   "Raceolly",    "Raceolly",             "39/1",  None),
]

# The two aggregator panels. §6 counts these as ZERO opinions — they are other
# columns' selections collected, row-labelled "1 Nap" / "1 Tip" / "3 Naps".
# They are NOT desks and never enter the crossover count; they are here only
# for their prices and for what the row labels assert.
# (off, horse, panel, row label, Best Odds)
PANELS = [
    ("12:55", "Crusherman",     "HRN Biggest Priced Naps", "1 Nap",  "66/1"),
    ("14:05", "Jasour",         "HRN Biggest Priced Naps", "1 Nap",  "129/1"),
    ("15:20", "Dancing Gemini", "HRN Biggest Priced Naps", "3 Naps", "109/1"),
    ("15:20", "Needle Match",   "HRN Biggest Priced Naps", "1 Nap",  "119/1"),
    ("14:05", "Binhareer",      "HRN Biggest Priced Tips", "1 Tip",  "41/1"),
    ("14:40", "Believed",       "HRN Biggest Priced Tips", "1 Tip",  "27/1"),
    ("16:35", "Valvano",        "HRN Biggest Priced Tips", "1 Tip",  "37/1"),
]
HRN_SRC = "horseracing.net panels + Raceolly, 04:48 race morning (labelled Best Odds)"
# Which desks state that their odds are a PRICE COMPARISON. §6's shorter-price
# test is only licensed where the column says so — see section 5.
LABELLED_BEST_ODDS = {"Grimshaw", "Raceolly"}


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
print("5 · FOUR PRICE SOURCES, AND THEY SPLIT ON WHETHER THEY SAY WHAT THEY ARE")
print("=" * 72)
print("""  §6: a price-COMPARISON quotes longer than any single card by construction,
  so a SHORTER price cannot be shopping — it is the market moving.

  FOUR price sources now sit on this card: an unlabelled Racing Post tips list,
  Grimshaw's labelled "Best Odds" boxes, Frick's STRUCK bets, and the
  horseracing.net panels that arrived at 04:48 on race morning — also labelled
  "Best Odds". Each is differenced against our racecard forecast and normalised
  against ITS OWN median, never pooled. The two labelled comparisons read one
  way and the two unlabelled/struck sources read the other — but see 5c before
  calling the fourth source a replication: it selects on price and so cannot
  separate the source rule from the rival story on its own.
""")

SOURCES = {}
seen = set()
for off, horse, desk, writer, odds, stars in RP:
    if odds is None:
        continue
    src = (HRN_SRC if desk == "Raceolly"
           else "Grimshaw (labelled Best Odds)" if desk in LABELLED_BEST_ODDS
           else "Frick (prices STRUCK, posted 19:17)" if desk == "Frick"
           else "RP free-tips list (odds UNLABELLED)")
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

# The panel rows carry prices but no opinion. They share Raceolly's feed, so
# they go in the SAME source bucket — pooling two feeds is exactly what §6
# forbids, and pooling one feed with itself is just reading the feed.
for off, horse, _panel, _label, odds in PANELS:
    if (off, horse, HRN_SRC) in seen:
        continue
    seen.add((off, horse, HRN_SRC))
    fc = FORECAST[(off, horse)]
    SOURCES[HRN_SRC].append((off, horse, fc, odds, prob(odds) / prob(fc)))

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
  (25/1->37/1), Jasour (150/1->100/1) and Needle Match (100/1->119/1) are the
  least trustworthy rows in these tables, and they sit at the extremes of them.
  Rank by the normalised figure, then discount the extremes.""")

print("\n" + "=" * 72)
print("5b · THE CONTROL THAT WAS MISSING — two sources priced the same horses")
print("=" * 72)
print("""  Yesterday's panel said the two lists shared no horse, so they could only be
  differenced against our forecast and never against each other. Frick's list
  closed that, and the race-morning panels widen it again.
""")
byhorse_price = {}
for src, rows in SOURCES.items():
    for off, horse, fc, odds, ratio in rows:
        byhorse_price.setdefault((off, horse), {})[src] = odds
overlap = {k: v for k, v in byhorse_price.items() if len(v) > 1}
for (off, horse), quotes in sorted(overlap.items()):
    fc = FORECAST[(off, horse)]
    qs = " · ".join(f"{s.split(' (')[0]} {o}" for s, o in sorted(quotes.items()))
    same = len(set(quotes.values())) == 1
    print(f"  {off} {horse:14} card {fc:>6}  |  {qs}   {'IDENTICAL' if same else 'differ'}")
n_ident = sum(1 for q in overlap.values() if len(set(q.values())) == 1)
cross = {k: v for k, v in overlap.items()
         if any("Best Odds" in s_ for s_ in v) and any("Best Odds" not in s_ for s_ in v)}
print(f"""
  {len(overlap)} shared horses, {n_ident} quoted IDENTICALLY. The two identical ones come
  from a tips page and a tipster's struck bet posted 27 minutes apart, so the
  unlabelled RP buttons are quoting a real, available price — not a forecast
  and not a stale number. The reason to distrust them is NOT that they are
  fictional, only that they do not say which book they come from.

  AND THE PAIRING THAT WAS GENUINELY MISSING HAS NOW ARRIVED: a LABELLED
  best-odds source against an unlabelled one, on the same horse. Grimshaw
  overlapped nothing, so his direction was never checked against anybody.""")
for (off, horse), q in sorted(cross.items()):
    lab = [(k, v) for k, v in q.items() if "Best Odds" in k][0]
    unl = [(k, v) for k, v in q.items() if "Best Odds" not in k][0]
    longer = prob(lab[1]) < prob(unl[1])
    print(f"    {off} {horse}: labelled {lab[1]} v unlabelled {unl[1]} — labelled is "
          f"{'LONGER, as a comparison should be' if longer else 'SHORTER, which a comparison should not be'}")
print(f"""
  {len(cross)} horse is not a result. But it is the first direct evidence that the
  labelled/unlabelled split is a property of the SOURCES and not only of the
  two different sets of horses they happen to pick, which is what 5c tests
  statistically and this tests directly.
""")

print("=" * 72)
print("5c · IS IT THE SOURCE, OR IS IT THE HORSES? (the alternative, tested)")
print("=" * 72)
print("""  The source story says Grimshaw reads longer because he quotes best odds.
  The rival story says he reads longer because of WHAT HE PICKS: he is a value
  column backing outsiders, and outsiders drift while money concentrates on the
  fancied. If so the split is about horses, not price sources, and the rule
  written last night is wrong again.

  Test: rank each horse by our card price WITHIN ITS OWN RACE (1 = shortest),
  as a fraction of the field. If the rival story holds, the drifters sit at the
  outsider end regardless of which list they came from.
""")
RANK = {}
for off, _n, _t, _c, runners in card.RACES:
    pr = sorted(((row[2], dec(row[8])) for row in runners), key=lambda x: x[1])
    for i, (hname, _d) in enumerate(pr):
        RANK[(off, hname)] = (i + 1) / len(pr)

import statistics as st
for src, rows in SOURCES.items():
    sh = [RANK[(o, h)] for o, h, _f, _od, r in rows if r > 1 and (o, h) in RANK]
    lo = [RANK[(o, h)] for o, h, _f, _od, r in rows if r < 1 and (o, h) in RANK]
    f = lambda v: f"{st.mean(v):.2f}" if v else "  — "
    print(f"  {src.split(' (')[0]:12} shorter-than-card n={len(sh)} mean rank {f(sh)}"
          f"   |  longer n={len(lo)} mean rank {f(lo)}")
allsh = [RANK[(o, h)] for rows in SOURCES.values() for o, h, _f, _od, r in rows if r > 1 and (o, h) in RANK]
alllo = [RANK[(o, h)] for rows in SOURCES.values() for o, h, _f, _od, r in rows if r < 1 and (o, h) in RANK]
print(f"\n  POOLED: shorter n={len(allsh)} mean rank {st.mean(allsh):.2f}"
      f"  |  longer n={len(alllo)} mean rank {st.mean(alllo):.2f}")
print("""
  Read it honestly. If shorter and longer sat at clearly different depths in
  their races, the rival story would be carrying the result and the source rule
  would be an artefact. Judge by how far apart those two means are against a
  mid-field value of 0.50, and on how few horses each count rests.
""")
depth = {s_: st.mean([RANK[(o, h)] for o, h, *_ in rows if (o, h) in RANK])
         for s_, rows in SOURCES.items()}
print("  AND THE NEW SOURCE IS CONFOUNDED — say so before claiming a replication.")
print("  Mean field depth of each source's horses (0 = favourite end, 1 = outsider end):")
for s_, d in sorted(depth.items(), key=lambda kv: -kv[1]):
    print(f"    {d:.2f}  {s_.split(',')[0]}")
print("""
  Two of those panels are headed BIGGEST PRICED. They select on price, so the
  horses in them sit far deeper in their races than any other source's — and
  "outsiders drift" predicts a source made of outsiders reads LONGER, which is
  exactly what it does. On its own, therefore, this source cannot tell the two
  stories apart, and calling it a clean replication of the labelled/unlabelled
  rule would be overclaiming.

  What it does still carry is the WITHIN-source comparison, and that points
  away from the rival story: inside this source the SHORTER horses sit deeper
  than the longer ones, when "outsiders drift" needs the drifters to be the
  deeper group. Same shape as the pooled figures above. Weak evidence, stated
  as weak.
""")

print("=" * 72)
print("5d · THE UNCOMFORTABLE ONE: our card prices are better than the market's")
print("=" * 72)
LIVE = {}
for src, rows in SOURCES.items():
    if "Best Odds" in src:
        continue  # a best-odds comparison is longer by construction; not a live board
    for off, horse, fc, odds, ratio in rows:
        LIVE.setdefault((off, horse), (fc, odds, ratio))
sh = [v for v in LIVE.values() if v[2] > 1]
med = st.median(v[2] for v in LIVE.values())
print(f"""  Set aside the labelled best-odds list, which is longer by construction, and
  pool the two sources that quote an ordinary live price — the RP buttons and
  Frick's struck bets. They agree exactly where they overlap.

    {len(LIVE)} distinct horses · {len(sh)} priced SHORTER than our card · median x{med:.3f}

  Our card prices come from the racecard's BETTING FORECAST, pasted the day
  before. On most of these horses that forecast is more generous than anything
  the market was actually showing the night before racing.

  That does not invalidate anything: §6 settles at the odds on the card, which
  is a stated convention, and a forecast of SP is not a claim that the price was
  available. But it has two consequences worth saying out loud once:

    1. Settling at card odds OVERSTATES returns wherever the card is the more
       generous number. The season's figures are computed at prices the market
       was not offering.
    2. The LONG gate tests the CARD price against 8/1. Ebt's Guard is 14/1 on
       the card and 10/1 live. Both clear, so nothing moves today — but a
       longshot priced at 9/1 on a forecast could be under 8/1 in the market
       before a single withdrawal, which is the Lesrico failure arriving a day
       earlier than §4 expects it.

  Stated limit: one card, {len(LIVE)} horses, and a forecast-to-live comparison is
  not a like-for-like market move. This is a flag to measure again, not a result.
""")

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

print("\n" + "=" * 72)
print("7 · THE RACE-MORNING PANELS  (§6: an aggregator panel is ZERO opinions)")
print("=" * 72)
print(f"""  Three horseracing.net panels, read at 04:48 on race morning: Biggest Priced
  Tips, Biggest Priced Naps, and Raceolly's own list. {len(PANELS)} Ascot rows in the two
  panels and {len(desks['Raceolly'])} in Raceolly's list.

  RACEOLLY IS A DESK AND COUNTS. The panels are NOT and do not: they row-label
  their entries "1 Nap" / "1 Tip" / "3 Naps", which is other columns' selections
  collected, never an opinion of their own.
""")
held_by = {}
for off, horse, desk, *_ in RP:
    held_by.setdefault((off, horse), set()).add(desk)
print(f"  {'race':6} {'horse':16} {'label':8} {'best odds':>9}  resolves to")
for off, horse, panel, label, odds in PANELS:
    known = sorted(held_by.get((off, horse), set()))
    if known:
        res = f"held by {'/'.join(known)} — duplicate, panel row adds NO new opinion"
    else:
        res = "no known column holds it — count as ONE, independence untestable"
    print(f"  {off:6} {horse:16} {label:8} {odds:>9}  {res}")

print("""
  THE PRICE LEG OF §6's DUPLICATE TEST IS VACUOUS INSIDE ONE SITE.
  §6's loosened test (9 Oct) resolves a panel row when the same horse, in the
  same race, is held by a known column at a price the panel equals or beats.
  Jasour satisfies it perfectly: the Naps panel says 129/1 and Raceolly says
  129/1. But BOTH ROWS ARE ON horseracing.net, reading one best-odds feed, so
  the prices MUST match — the agreement is produced by the page, not observed.

  That is not a small caveat, because §6's own worked example has the same
  shape. The Cambridgeshire case that justified the price leg was Raceolly at
  40/1 against an HRN Biggest Priced Naps row at "the identical 40/1" — the
  same column against the same site's panel. Its price leg was vacuous too, and
  the archive records it as the test working.

  What survives, and it is the useful half: the duplicate still resolves,
  because a KNOWN COLUMN HOLDS THE HORSE. That leg is sound. It is only the
  matching price that carries no information when both rows share a feed.
  Demand a price match only ACROSS sites with independent feeds — which is
  exactly the cross-feed pairing section 5b found on this same horse, where the
  labelled 129/1 sits against an unlabelled 100/1 and the gap is real.
""")

multi = [(o, h, l, od) for o, h, _p, l, od in PANELS if not l.startswith("1 ")]
print("  MULTI-COUNT ROWS (a panel asserting more than one column napped it):")
for off, horse, label, odds in multi:
    known = sorted(held_by.get((off, horse), set()))
    print(f"    {off} {horse} — \"{label}\" at {odds}; known columns holding it: "
          f"{', '.join(known) if known else 'NONE'}")
print("""    The biggest count a panel has asserted in this archive. The Cambridgeshire
    saw "2 Naps" (St Anton) and the Cesarewitch saw "2 Naps" (Align The Stars,
    half of which resolved to Sam Hardy). Nothing resolves here — no column we
    track holds the horse — so §6's rule applies unchanged and unflatteringly:
    COUNT IT AS ONE and say the mastheads are not visible, so independence
    cannot be proved by a divergence and it earns no badge.

    Note where it sits. The 15:20 is the QEII, which is where our NAP Ten Bob
    Tony runs and where William Hill's trading desk said their own risk was.
    A 109/1 shot carrying the day's loudest unverifiable panel row does not
    change that and is recorded, not acted on.
""")

print("  DISSENT — 2+ sources on a horse we do not hold (§11 checklist):")
for (off, horse), ds in sorted(byhorse_pre.items()):
    if len(ds) < 2 or (off, horse) in ourset:
        continue
    sh, dv = pairwise(*sorted(ds)[:2])
    print(f"    {off} {horse:16} {len(ds)}x ({', '.join(sorted(ds))}) — "
          f"{len(sh)} shared race(s), {len(dv)} divergence(s)")
print("""    Jasour is new this morning and is the thinnest kind of 2x there is: a
    one-tip desk (The Punt) and a five-tip desk (Raceolly) meeting in the only
    race they share, so it is UNTESTABLE by §6's own rule. Surfaced because the
    checklist says to surface it, at 150/1 on our card.
""")

print("  RACEOLLY, PER COLUMN:")
rh = sum(1 for o, h, _ in desks["Raceolly"] if (o, h) in ourset)
print(f"    {rh}/{len(desks['Raceolly'])} with us — and the one agreement is our 12:55 NAP Speed Of Sound.")
sos = next(r for r in SOURCES[HRN_SRC] if r[1] == "Speed Of Sound")
print(f"    card {sos[2]}, panel {sos[3]}: ratio x{sos[4]:.3f}, "
      f"v the source's median x{sos[4]/medians[HRN_SRC]:.3f}.")
print("""    This source STATES its odds are a comparison, so unlike last night's RP
    list the shorter-price test is licensed on it: a comparison quotes longer
    than one card by construction, so a shorter price is the market moving.
    That makes it the first licensed STEAM on one of our own picks on this
    card — and the first external support Speed Of Sound has had from anybody.

  AND THE PRICE WE MOST WANTED IS NOT HERE. These panels do not quote Ebt's
  Guard, our LONG. §4 says re-check the LONG's PRICE at the off and not just
  the place count, and the only two observations of it remain the card's 14/1
  and an unlabelled 10/1 that section 6 withdrew as a STEAM call. Both clear
  the slot's 8/1 minimum, so the LONG holds; the direction is still uncalled.
""")

print("\n" + "=" * 72)
print("8 · SCORED  (results, 18 Oct — §15: report honestly against the record)")
print("=" * 72)
import json as _json, pathlib as _pl
RES = _json.loads((ROOT / "scripts/analysis/champions-day-results.json").read_text())
# position -> horse, per race, only as deep as the published result runs.
POS, PLACES = {}, {"12:55": 3, "13:30": 3, "14:05": 3, "14:40": 3,
                   "15:20": 3, "16:00": 2, "16:35": 4}
for r in RES["results"]:
    for run in r["runners"]:
        POS[(r["off_time"], run["horse"])] = run["position"]


def outcome(off, horse):
    p = POS.get((off, horse))
    if p == "NR":
        return "NR"
    if p is None:
        return "lost"          # below the published depth, which reaches the place count
    return "WON" if p == "1" else ("placed" if int(p) <= PLACES[off] else "lost")


print(f"  {'desk':14} {'tips':>4} {'wins':>5} {'placed':>7}   winners")
rows = []
for d, rs in sorted(desks.items()):
    o = [(off, h, outcome(off, h)) for off, h, _ in rs]
    w = [f"{off} {h}" for off, h, x in o if x == "WON"]
    rows.append((d, len(o), len(w), sum(1 for _, _, x in o if x == "placed"), w))
for d, n, w, pl, names in sorted(rows, key=lambda r: (-r[2], -r[3], r[0])):
    print(f"  {d:14} {n:4} {w:5} {pl:7}   {', '.join(names) or '—'}")

ours = [(off, sl, h, outcome(off, h)) for off, ps in OURS.items() for sl, h, _ in ps]
print(f"\n  OURS           {len(ours):4} {sum(1 for *_, x in ours if x == 'WON'):5} "
      f"{sum(1 for *_, x in ours if x == 'placed'):7}   "
      f"{', '.join(f'{o} {h}' for o, _, h, x in ours if x == 'WON')}")

print("""
  FRICK, THE LEADERBOARD'S TOP COLUMN AT 30%, WENT 0 FROM 7 — and §6 recorded
  his 0/7 ALIGNMENT with us the night before as "the most informative row on the
  page". Both numbers are now in: he agreed with us in none of our seven races
  and he did not win any of them either. An alignment of zero told us nothing
  about his results, which is precisely what §6 says alignment is not.
""")

gw = [f"{off} {h}" for off, h, _ in desks["Grimshaw"] if outcome(off, h) == "WON"]
print(f"""  AND THE WINNER CAME FROM A MULTI-PICK DESK, IN A RACE WHERE WE TOOK HIS OTHER
  HORSE. Grimshaw's winners: {', '.join(gw)}.
  He tipped TWO horses in the 13:30 — Daiquiri Bay and Mount Atlas. Daiquiri Bay
  was our NAP and finished outside the three; Mount Atlas won at 33/1. §6 added
  the multi-pick rule on 16 Oct and priced it as a COST — "a desk covering two of
  sixteen runners is twice as likely to intersect by chance". This is the other
  side of that ledger: doubling up is also how a desk covers the 33/1 winner, and
  the one of his two we shared is the one that lost.
""")

ext2x = {}
for off, horse, desk, *_ in RP:
    ext2x.setdefault((off, horse), set()).add(desk)
flagged = [(off, h, ds) for (off, h), ds in sorted(ext2x.items())
           if len(ds) >= 2 and (off, h) not in ourset]
print("  DISSENT, SCORED — the 2x+ horses we surfaced and did not hold:")
for off, h, ds in flagged:
    print(f"    {off} {h:16} {len(ds)}x {outcome(off, h):7} ({', '.join(sorted(ds))})")
print("""
  Fifth Column won the Balmoral at 22/1 and was on this page as a 2x we did not
  hold. That is §6's dissent rule working for the fourth meeting running, and the
  fourth time the archive has had to write down that WE FLAGGED IT IS NOT A
  RETURN. Future Champions declined three winners the same way eight days ago.
""")
