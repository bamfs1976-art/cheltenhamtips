"""Crossovers and divergence on the DECLARED Cheltenham Day 1 card.

The companion to cheltenham-nov-day1-consensus.mjs, which read a tipster
consensus GRID the morning before. This reads the declared racecard's own
"Tipped by" column, so it counts only horses that are actually running.

One thing moved between the two, and it is the reason to run both:
@RoadCheltenham's two picks (Folie Golith, Moneygarrow) are NOT IN THE
DECLARED FIELD. A grid can carry a column's opinion on a horse that does not
run; the card cannot. So the desk count drops from four to three.

§6 rules applied here:
  - aggregator panels ("Big Price", "Big Naps") are ZERO opinions
  - a desk's agreement is tested on the PAIR, not against the house column
  - two desks agree if their selection SETS intersect at all

Usage: python3 scripts/analysis/cheltenham-nov-day1-crossovers.py <card.json>
"""
import json, sys, collections, itertools

PANELS = {'Big Price', 'Big Naps'}
runners = json.load(open(sys.argv[1]))['Friday']
races = collections.OrderedDict()
for r in runners:
    races.setdefault((r['time'], r['race']), []).append(r)

picks = collections.defaultdict(lambda: collections.defaultdict(set))   # desk -> time -> horses
panel_rows = 0
for r in runners:
    if not r['by']:
        continue
    for part in r['by'].split(','):
        name = part.strip().replace(' (NAP)', '')
        if name in PANELS:
            panel_rows += 1
            continue
        picks[name][r['time']].add(r['horse'])

desks = sorted(picks, key=lambda d: -sum(len(v) for v in picks[d].values()))
times = [t for t, _ in races]

print('Cheltenham, Fri 13 Nov 2026 — Day 1, DECLARED card\n')
print(f'{len(runners)} declared runners across {len(races)} races')
print(f'desks with an opinion: {len(desks)}  ({", ".join(desks)})')
print(f'aggregator panel rows discounted to zero: {panel_rows}')
print('absent from the meeting (n/a, not 0%): William Hill, Steve Mullington')
print('on the grid but NOT IN THE DECLARED FIELD: @RoadCheltenham '
      '(Folie Golith, Moneygarrow) — so it is three desks here, not four\n')

for d in desks:
    n = sum(len(v) for v in picks[d].values())
    print(f'  {d:12s} {n} tip(s) in {len(picks[d])} race(s)')

print('\ncrossovers (2+ desks on one horse)')
cross = []
for t, _ in races:
    holders = collections.defaultdict(list)
    for d in desks:
        for h in picks[d].get(t, ()):
            holders[h].append(d)
    for h, who in holders.items():
        if len(who) > 1:
            cross.append((t, h, who)); print(f'  {t} {h} — {" + ".join(who)}')
live = sum(1 for t, _ in races if sum(1 for d in desks if picks[d].get(t)) > 1)
if not cross:
    print(f'  NONE — none yet, at {len(desks)} columns, and {live} of {len(races)} races '
          f'had two or more desks in them')

print('\npairwise divergence (shared races where the two named different horses)')
sh_tot = dv_tot = clean = tested = 0
for a, b in itertools.combinations(desks, 2):
    shared = [t for t in times if picks[a].get(t) and picks[b].get(t)]
    agree = [t for t in shared if picks[a][t] & picks[b][t]]
    dv = len(shared) - len(agree)
    sh_tot += len(shared); dv_tot += dv
    if shared:
        tested += 1
        clean += (dv == len(shared))
    print(f'  {a + "–" + b:26s} {dv}/{len(shared)}' + ('  fully divergent' if shared and dv == len(shared) else ''))
print(f'  {"TOTAL":26s} {dv_tot}/{sh_tot} comparisons diverge · '
      f'{clean}/{tested} tested pairings fully divergent')

g = [p for p in desks if p == 'Grimshaw']
if g and 'Spotlight' in desks:
    shared = [t for t in times if picks['Grimshaw'].get(t) and picks['Spotlight'].get(t)]
    agree = [t for t in shared if picks['Grimshaw'][t] & picks['Spotlight'][t]]
    print(f'\nGrimshaw vs Spotlight: {len(shared) - len(agree)}/{len(shared)} divergent — '
          'fourth running of the independence test (Doncaster 2/3, Newmarket 2/3, Ascot 6/6)')
