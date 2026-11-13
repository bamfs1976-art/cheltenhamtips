"""RPR calibration, Cheltenham November Day 1 (Fri 13 Nov 2026).

Runs §6's three diagnostics IN ORDER on every race with enough rated runners,
before any selection is made:

  1. r(RPR, OR)  — is there a line at all?  SIGNED, > +0.3 (15 Oct: a NEGATIVE
                   correlation is the par signature at its most extreme, so
                   |r| is the wrong test).
  2. ratio       — spread(RPR) / spread(OR); is the LEVEL compressed?
  3. r(gap, OR)  — is the RPR-OR gap arithmetic rather than analysis?

And the 15 Oct degeneracy test the slope alone misses: the line's REACH,
|b| * spread(OR), against spread(RPR). Below about a third the residual IS
the raw RPR and ranking by it is the projection you were trying to escape.

Usage: python3 scripts/analysis/rpr-calibration-cheltenham-13-nov.py <card.json>
where card.json is the parsed racecard (see the Friday sheet of the supplied
workbook). Prints a row per race; nothing here selects a horse.
"""
import json, sys, statistics as st

def pearson(xs, ys):
    n = len(xs)
    if n < 3: return None
    mx, my = sum(xs) / n, sum(ys) / n
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    dx = sum((x - mx) ** 2 for x in xs) ** .5
    dy = sum((y - my) ** 2 for y in ys) ** .5
    return None if dx == 0 or dy == 0 else num / (dx * dy)

def fit(xs, ys):
    n = len(xs); mx, my = sum(xs) / n, sum(ys) / n
    den = sum((x - mx) ** 2 for x in xs)
    if den == 0: return None, None
    b = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / den
    return my - b * mx, b

card = json.load(open(sys.argv[1]))['Friday']
races = {}
for r in card:
    races.setdefault((r['time'], r['race']), []).append(r)

print('Cheltenham, Fri 13 Nov 2026 — RPR calibration, all six races\n')
hdr = f'{"race":34s} {"rated":>5} {"r(RPR,OR)":>10} {"ratio":>7} {"r(gap,OR)":>10} {"reach":>7}  verdict'
print(hdr); print('-' * len(hdr))

for (t, name), rs in races.items():
    rated = [x for x in rs if x['or'] and x['rpr']]
    n = len(rated)
    label = f'{t} {name}'[:34]
    if n < 3:
        print(f'{label:34s} {n:5d} {"—":>10} {"—":>7} {"—":>10} {"—":>7}  too few rated runners — RPR untestable')
        continue
    OR = [float(x['or']) for x in rated]
    RPR = [float(x['rpr']) for x in rated]
    gap = [p - o for p, o in zip(RPR, OR)]
    r1 = pearson(RPR, OR)
    sOR, sRPR = max(OR) - min(OR), max(RPR) - min(RPR)
    ratio = sRPR / sOR if sOR else None
    r3 = pearson(gap, OR)
    _, b = fit(OR, RPR)
    reach = abs(b) * sOR / sRPR if (b is not None and sRPR) else None

    if r1 is None or r1 <= 0.3:
        verdict = 'NO LINE — RPR carries nothing, lead on something else'
    elif reach is not None and reach < 1 / 3:
        verdict = 'DEGENERATE — residual IS raw RPR, do not rank on it'
    elif ratio is not None and ratio < 0.5:
        verdict = 'race par — residual only, never the raw gap'
    else:
        verdict = 'usable'
    f = lambda v, p=3: ('—' if v is None else f'{v:.{p}f}')
    print(f'{label:34s} {n:5d} {f(r1):>10} {f(ratio,2):>7} {f(r3):>10} {f(reach,2):>7}  {verdict}')

print('\nNote: a race where several runners carry no OR cannot be fitted at all.')
for (t, name), rs in races.items():
    un = [x['horse'] for x in rs if not x['or']]
    if un:
        print(f'  {t} {name}: {len(un)} of {len(rs)} unrated — {", ".join(un)}')
