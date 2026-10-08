#!/usr/bin/env python3
"""RPR calibration, Newmarket (Rowley Mile), Sat 10 Oct 2026 -- and the race that
breaks the residual.

Run: python3 -I scripts/analysis/rpr-calibration-newmarket-10-oct.py

THE FINDING. CLAUDE.md section 6 says raw RPR is a projection to each race's par,
that the RPR-OR gap is arithmetic which selects the outsider, and that the
constructive instrument is the RESIDUAL against the race's own OR->RPR line.
The 29-runner Cesarewitch fits a slope of +0.0016 -- flatter than the -0.006 in
the Cambridgeshire that produced the method. A flat line has a consequence the
rule did not state:

    resid = RPR - (a + b*OR),  and with b ~ 0  =>  resid = RPR - mean(RPR)

which is the raw RPR shifted by a constant. Measured here: corr(residual, RPR)
= 0.999996 and the largest discrepancy is 0.02lb. So ranking by residual IS
ranking by RPR -- the exact thing the rule exists to prevent -- and it does so
SILENTLY, returning a tidy ordered list with plausible numbers beside it.

    The residual is only a reading when the line has a slope.
    Check r(RPR, OR) first; below about 0.3 there is no line and no residual.

The 16:50 nursery reads +0.143 and is the same case. The 16:15 maiden carries no
official marks at all, so nothing is computed for it -- section 6 says a maiden
leaves RPR untestable, and that is reported rather than skipped.

LIMIT, stated because it matters more than usual here: four of the seven races
fit on five rated runners or fewer and the Dewhurst on three. Those rows are
printed rather than hidden, but a three-point line is not evidence and no pick
on the card rests on one.

Data: pasted Racing Post DECLARED racecard, 8 Oct 2026 (section 12 route 1),
48 hours out, all four entry-vs-declared checks passed.
Columns: (horse, OR, TS, RPR, board odds).
"""

RACES = [
  ('13:15', 'Modern Games Darley Stakes (Group 3)', 5, False, [
   ('Haatem', 110, 94, 122, '3/1'),
   ('Boiling Point', 110, 114, 123, '8/1'),
   ('High Stock', 104, 81, 117, '25/1'),
   ('The Lost King', 110, 107, 122, '7/4'),
   ('Humidity', 111, 112, 117, '4/1')]),
  ('13:50', 'Native Trail Zetland Stakes (Group 3)', 6, False, [
   ('Apulia Bay', 92, 90, 99, '10/1'),
   ('Bowdens', None, 53, 84, '20/1'),
   ('Drumbeat', None, 88, 108, '6/5'),
   ('Netherstream', 83, 72, 97, '7/1'),
   ('Sword Salute', 94, 86, 101, '5/1'),
   ('Wykehurst Park', 81, 77, 88, '10/1')]),
  ('14:25', 'Emirates Autumn Stakes (Group 3)', 7, False, [
   ('Al Jabbar', None, 74, 99, '17/2'),
   ('Clash Of Hearts', 93, 82, 99, '50/1'),
   ('Mia Fantasia', 95, 71, 104, '16/1'),
   ('Notable Dream', 99, 93, 113, '7/1'),
   ('Rock Montreal', 106, 94, 109, '7/4'),
   ('Sergei Diaghilev', None, 102, 110, '3/1'),
   ('Sole Ambition', 90, 98, 101, '9/1')]),
  ('15:00', 'Darley Dewhurst Stakes (Group 1)', 5, False, [
   ('Darkness Falls', None, 117, 121, '15/8'),
   ('Desert Castle', 116, 79, 123, '10/11'),
   ('Gentle Hurricane', 105, 87, 110, '50/1'),
   ('Great Barrier Reef', None, 102, 116, '7/1'),
   ('Jassas', 92, 84, 103, '40/1')]),
  ('15:40', 'Club Godolphin Cesarewitch Handicap (Heritage Handic', 29, True, [
   ('Tactician', 102, 93, 109, '33/1'),
   ('Beylerbeyi', 101, 99, 112, '5/1'),
   ('Align The Stars', 100, 96, 108, '66/1'),
   ('Berkshire Sundance', 99, 95, 108, '50/1'),
   ('Valedictory', 99, 94, 109, '14/1'),
   ('Kirchner', 97, 86, 108, '9/1'),
   ('Dawn Rising', 97, 106, 115, '13/2'),
   ('Manxman', 97, 81, 105, '14/1'),
   ('Tashkhan', 95, 96, 109, '100/1'),
   ('Reverend Hubert', 95, 97, 100, '14/1'),
   ('Cock And Bull', 92, 96, 101, '11/1'),
   ('Mountain Road', 92, 88, 107, '12/1'),
   ('Shrimp Shady', 91, 97, 112, '66/1'),
   ('Bahadur', 91, 104, 112, '100/1'),
   ('Sea Lantern', 89, 102, 112, '6/1'),
   ('Sax Appeal', 88, 98, 108, '100/1'),
   ('Dream On Baby', 87, 89, 101, '16/1'),
   ('Alphonse Le Grande', 87, 109, 110, '33/1'),
   ('Pole Star', 87, 96, 112, '40/1'),
   ('Highwind', 85, 99, 105, '33/1'),
   ('Naval Tribute', 85, 91, 113, '40/1'),
   ('High Fibre', 84, 95, 112, '28/1'),
   ('Percy Shelley', 84, 102, 113, '100/1'),
   ('Letsbefrank', 82, 100, 106, '66/1'),
   ('Gooloogong', 82, 91, 114, '40/1'),
   ('Premiere Ligne', 81, 96, 107, '33/1'),
   ('Wahraan', 80, 98, 108, '150/1'),
   ('Appier', 79, 99, 110, '150/1'),
   ('Vaguely Royal', 78, 84, 103, '150/1')]),
  ('16:15', "Triple Time Maiden Fillies' Stakes", 7, False, [
   ('Constella', None, None, None, None),
   ('Cullenagh Rainbow', None, None, 82, None),
   ('Desert Romance', None, None, None, None),
   ('Friendly Force', None, 63, 72, None),
   ('Intangible Truth', None, None, 65, None),
   ('Lakota Pass', None, 41, 53, None),
   ('Probing', None, None, None, None)]),
  ('16:50', 'Dubai Racing Club Nursery Handicap', 9, True, [
   ('Dandyman Dan', 94, 85, 99, None),
   ('Majestic Jude', 91, 71, 89, None),
   ('National Honour', 89, 65, 99, None),
   ('Silver Sovereign', 84, 82, 98, None),
   ('Asgar', 83, 89, 94, None),
   ('Midgham Man', 82, 90, 99, None),
   ('United Authority', 81, 73, 88, None),
   ('Mobadir', 79, 92, 98, None),
   ('Motown Filly', 78, 86, 93, None)]),
]


def fit(xs, ys):
    n = len(xs); mx = sum(xs) / n; my = sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs)
    if sxx == 0:
        return 0.0, my
    b = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sxx
    return b, my - b * mx


def corr(xs, ys):
    n = len(xs); mx = sum(xs) / n; my = sum(ys) / n
    sx = sum((x - mx) ** 2 for x in xs) ** .5
    sy = sum((y - my) ** 2 for y in ys) ** .5
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy) if sx and sy else float('nan')


def main():
    print('CALIBRATION -- may RPR carry an argument in this race?\n')
    print(f"{'race':6} {'n':>3} {'ratio':>6} {'r(RPR,OR)':>10} {'r(gap,OR)':>10}  verdict")
    fits = {}
    for off, name, n, hcap, rs in RACES:
        rated = [(h, o, p, od) for h, o, ts, p, od in rs if o is not None and p is not None]
        if len(rated) < 3:
            print(f'{off:6} {len(rated):3}  {"--":>6} {"--":>10} {"--":>10}  no official marks -- untestable (maiden)')
            continue
        ors = [x[1] for x in rated]; rprs = [x[2] for x in rated]
        osp = max(ors) - min(ors); rsp = max(rprs) - min(rprs)
        ratio = rsp / osp if osp else float('nan')
        r1 = corr(ors, rprs); r2 = corr([p - o for _, o, p, _ in rated], ors)
        if abs(r1) < 0.30:
            v = 'CARRIES NOTHING -- no line, so no residual either'
        elif ratio < 0.45 or r2 < -0.90:
            v = 'par -- residual only'
        elif len(rated) <= 5:
            v = f'usable, but only a {len(rated)}-point line'
        else:
            v = 'usable'
        print(f'{off:6} {len(rated):3} {ratio:6.2f} {r1:10.3f} {r2:10.3f}  {v}')
        b, a = fit(ors, rprs)
        fits[off] = (b, a, rated)

    print('\n\nTHE DEGENERATION, measured -- 15:40 Cesarewitch\n')
    b, a, rated = fits['15:40']
    res = [p - (a + b * o) for _, o, p, _ in rated]
    rpr = [p for _, _, p, _ in rated]
    mean_rpr = sum(rpr) / len(rpr)
    print(f'  fitted slope b            = {b:+.4f}   (Cambridgeshire read -0.006)')
    print(f'  corr(residual, raw RPR)   = {corr(res, rpr):.6f}')
    print(f'  max |resid - (RPR - mean)| = {max(abs(r - (p - mean_rpr)) for r, p in zip(res, rpr)):.3f} lb')
    print('\n  The residual is the raw RPR shifted by a constant. Ranking by it')
    print('  ranks by RPR -- which is what the rule exists to prevent.')

    print('\n\nWHAT THE CARD USED INSTEAD, in the two races where RPR is empty:')
    print('  15:40  course-and-distance form, the 4lb penalty (won since the weights),')
    print('         the handicapper\'s own Future OR, and Topspeed.')
    print('  16:50  Topspeed, distance form, and the handicap mark.')


if __name__ == '__main__':
    main()
