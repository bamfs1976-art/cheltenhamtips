#!/usr/bin/env python3
"""Derivation for the "RPR is a race par, not a rating" finding — CLAUDE.md §6.

    python3 -I scripts/analysis/rpr-is-a-race-par.py

Reproduces every number that panel quotes: the Cambridgeshire's OR/RPR spreads,
the regression slope of RPR on OR, the within-race correlations, the pooled
figure that says the opposite, and the per-pick residuals that rescued two picks
and killed two.

Committed 6 Oct 2026 under the §10 rule that no published number ships without
the script that produced it. The panel went up on 26 September; this script is
nine days late, which is the gap the rule exists to close.
"""
import os, statistics as st, importlib.util

# The fixture is a declared Racing Post card transcribed on 24 Sep 2026.
spec = importlib.util.spec_from_file_location(
    'card', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fixtures',
                         'newmarket-2026-09-26-declared.py'))
card = importlib.util.module_from_spec(spec); spec.loader.exec_module(card)
SAT = card.SAT

OR_I, RPR_I, NAME_I, ODDS_I = 12, 14, 2, 11

def corr(xs, ys):
    n = len(xs); mx, my = sum(xs)/n, sum(ys)/n
    num = sum((a-mx)*(b-my) for a, b in zip(xs, ys))
    den = (sum((a-mx)**2 for a in xs) * sum((b-my)**2 for b in ys)) ** .5
    return num/den if den else float('nan')

def slope(xs, ys):
    n = len(xs); mx, my = sum(xs)/n, sum(ys)/n
    sxx = sum((a-mx)**2 for a in xs) or 1
    b = sum((a-mx)*(c-my) for a, c in zip(xs, ys))/sxx
    return b, my - b*mx

print('WITHIN-RACE: does the RPR-OR gap track OR inversely? (projection signature)\n')
print(f"{'race':7}{'n':>4}{'corr(OR,gap)':>14}{'slope RPR~OR':>14}{'OR spread':>11}{'RPR spread':>12}{'ratio':>7}")
pool_or, pool_gap = [], []
for R in SAT:
    rows = [(t[OR_I], t[RPR_I]) for t in R['r'] if isinstance(t[OR_I], int) and isinstance(t[RPR_I], int)]
    if len(rows) < 5: continue
    ors = [a for a, _ in rows]; rprs = [b for _, b in rows]; gaps = [b-a for a, b in rows]
    pool_or += ors; pool_gap += gaps
    m, _ = slope(ors, rprs)
    so, sr = max(ors)-min(ors), max(rprs)-min(rprs)
    print(f"{R['off']:7}{len(rows):>4}{corr(ors, gaps):>14.3f}{m:>14.3f}{so:>11}{sr:>12}{sr/so:>7.2f}")
print(f"\nPOOLED across races: corr = {corr(pool_or, pool_gap):.3f}")
print('  Pooling mixes races with different pars and DESTROYS the effect. The first')
print('  run of this analysis read the pooled number and reported "not the projection')
print('  signature" — the opposite of what the per-race rows say. Read the groups.\n')

R = [x for x in SAT if x['off'] == '15:40'][0]
rows = sorted([(t[OR_I], t[RPR_I], t[NAME_I], t[ODDS_I]) for t in R['r']], reverse=True)
ors = [o for o, _, _, _ in rows]; rprs = [r for _, r, _, _ in rows]
print(f"THE CAMBRIDGESHIRE, {len(rows)} runners")
print(f"  OR  {min(ors)}-{max(ors)}  spread {max(ors)-min(ors):>2}  sd {st.stdev(ors):.1f}")
print(f"  RPR {min(rprs)}-{max(rprs)}  spread {max(rprs)-min(rprs):>2}  sd {st.stdev(rprs):.1f}")
print('  biggest gaps (lowest marks):  ' + ', '.join(f'{n} {r-o:+d} @{d}' for o, r, n, d in rows[-4:]))
print('  smallest gaps (highest marks):' + ', '.join(f' {n} {r-o:+d} @{d}' for o, r, n, d in rows[:3]))

print('\nTHE CONSTRUCTIVE INSTRUMENT: residual against each race\'s own OR->RPR line')
PICKS = {'13:22': ['Polyxena', 'Fire Thunder'], '16:50': ['Huscal', 'Rocking Ends'],
         '15:40': ['Bourbon Blues', 'Erzindjan', 'Alcarath']}
for R in SAT:
    if R['off'] not in PICKS: continue
    rows = [(t[OR_I], t[RPR_I], t[NAME_I]) for t in R['r']
            if isinstance(t[OR_I], int) and isinstance(t[RPR_I], int)]
    if len(rows) < 5: continue
    b, a = slope([x[0] for x in rows], [x[1] for x in rows])
    res = sorted([(r-(a+b*o), nm, o, r) for o, r, nm in rows], reverse=True)
    for i, (v, nm, o, r) in enumerate(res, 1):
        if nm in PICKS[R['off']]:
            print(f"  {R['off']}  {nm:<16} OR {o:>3}  RPR {r:>3}  residual {v:>+5.1f}  rank {i}/{len(res)}")
