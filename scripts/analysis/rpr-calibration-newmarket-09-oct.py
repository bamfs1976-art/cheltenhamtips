#!/usr/bin/env python3
"""Is the racecard's RPR column usable? Newmarket (Rowley Mile), Fri 9 Oct 2026.

Reproduces every figure in the "Is the RPR column usable today?" panel on
future-champions-2026.html. Run: python3 -I scripts/analysis/rpr-calibration-newmarket-09-oct.py

WHY. The 28-runner Cambridgeshire (26 Sep 2026) established that this column is
a projection to each RACE's par, not an achieved rating: OR spanned 82-108 while
RPR spanned 111-118, and regressing RPR on OR gave a slope of -0.006. CLAUDE.md
section 6 records three consequences, all of which this script applies:

  1. CALIBRATE PER RACE. RPR spread / OR spread ran 0.27 in that handicap and
     1.16 in a 7-runner Group 2. The column is worthless in one and close to
     honest in the other, so the ratio decides whether RPR may carry an argument
     at all.
  2. NEVER POOL RACES. Pooled across four races the correlation was only -0.276
     and the first script run printed "NOT the projection signature" -- the
     opposite of the within-race -0.976 / -0.934 / -0.908. Pooling different
     pars destroys the effect. Everything here is computed within one race.
  3. THE GAP IS ARITHMETIC. (RPR - OR) is biggest for the lowest mark BY
     CONSTRUCTION, so "well handicapped on the figures" selects the outsider
     every time. r(gap, OR) near -1 is that signature. The constructive
     instrument is the RESIDUAL against the race's own OR->RPR line.

RESULT on this card: the five Group/Listed races return ratios 0.86-2.00 with
gap correlations -0.27 to +0.64 (no par signature, RPR informative). Both
handicaps are the compressed ones -- the Old Rowley Cup reads ratio 0.32 and
r(gap,OR) -0.968, against 0.27 and -0.976 in the Cambridgeshire. In the 17:20
the within-race r(RPR,OR) comes out NEGATIVE (-0.177), the first in the archive.

LIMIT: only runners carrying a British official rating enter the fit. That is 5
of 8 in the Fillies' Mile and 10 of 13 in the Cornwallis, because Irish-trained
juveniles have no mark. A five-point line is weak and is labelled as such on the
page.

Data: pasted Racing Post declared racecard, 7 Oct 2026 (section 12 route 1).
Columns kept are (horse, OR, TS, RPR, board odds).
"""

RACES = [
  ('13:15', 'Newmarket Academy Godolphin Beacon Project Cornwallis St', 13, False, [
   ('Carry The Flag', None, 114, 113, '20/1'),
   ('Flann Sunna', 104, 99, 113, '5/2'),
   ('Marco Polo', None, 94, 103, '7/1'),
   ('Minster Man', 88, 91, 101, '12/1'),
   ('Mussab', 102, 101, 108, '8/1'),
   ('Never Enough', 86, 77, 97, '16/1'),
   ('Perfect Strike', 89, 88, 95, '20/1'),
   ('This Moment', 98, 98, 106, '10/1'),
   ('Armor Supreme', None, 107, 111, '25/1'),
   ('Bint Archange', 89, 86, 103, '50/1'),
   ('Fast Track', 101, 111, 113, '9/1'),
   ('In The Black', 101, 98, 112, '7/2'),
   ('Rogue Jewel', 86, 76, 95, '40/1')]),
  ('13:50', 'Godolphin Lifetime Care Oh So Sharp Stakes (Group 3) (Fi', 16, False, [
   ('Celestia', 89, 82, 96, '25/1'),
   ('Chasing Daylight', None, 40, 87, '8/1'),
   ('Dark Issue', 97, 94, 106, '14/1'),
   ('Forest Berry', 78, 74, 88, '50/1'),
   ('Golden Ring', None, 89, 95, '8/1'),
   ('Greek Symphony', 72, 83, 83, '66/1'),
   ('Lola De Valence', 89, 79, 94, '50/1'),
   ('Minkaas', 94, 83, 98, '10/1'),
   ('Miss Kodi', 95, 96, 106, '9/2'),
   ("Nuit d'Eclair", 100, 93, 107, '7/2'),
   ('Polyxena', 83, 90, 95, '25/1'),
   ('Sea Venture', 94, 93, 105, '10/1'),
   ('Siena Storm', 94, 80, 102, '4/1'),
   ('Sweltering', None, 80, 93, '14/1'),
   ('Thuritha', 85, 77, 92, '40/1'),
   ('Topaz', 92, 87, 105, '16/1')]),
  ('14:25', 'Thoroughbred Industry Employee Awards Challenge Stakes (', 6, False, [
   ('Holguin', 109, 84, 123, '10/1'),
   ('Never So Brave', 112, 117, 123, '11/2'),
   ('Witness Stand', 111, 109, 123, '12/1'),
   ('Time To Turn', 107, 113, 116, '2/1'),
   ('Flora Of Bermuda', 111, 114, 126, '7/4'),
   ('Pina Sonata', 107, 107, 123, '15/2')]),
  ('14:57', "bet365 Fillies' Mile (Group 1)", 8, False, [
   ('Dancing Destiny', None, 95, 112, '40/1'),
   ('Exceptionally', None, 98, 108, '66/1'),
   ('Forbidden Fire', 102, 90, 107, '12/1'),
   ('Haven', None, 91, 96, '18/1'),
   ('Lex Victoria', 93, 26, 99, '16/1'),
   ('Musical Times', 115, 108, 123, '4/9'),
   ('Rogue Passion', 105, 94, 112, '4/1'),
   ('Scommessa Sicura', 99, 90, 106, '66/1')]),
  ('15:30', 'bet365 Old Rowley Cup Handicap (Heritage Handicap)', 11, True, [
   ('Archers Bay', 100, 104, 112, '11/2'),
   ('Decade Of Time', 97, 104, 109, '8/1'),
   ('Spyce', 96, 95, 112, '12/1'),
   ('Into The Light', 95, 99, 111, '33/1'),
   ('Study Of Words', 94, 96, 110, '7/2'),
   ('Turty Tree', 93, 104, 109, '13/2'),
   ("Devil's Peak", 91, 103, 112, '13/2'),
   ('High Storm', 86, 104, 110, '40/1'),
   ('Liberate', 83, 79, 106, '9/1'),
   ("Lord d'Or", 81, 104, 109, '16/1'),
   ('Kahin', 81, 99, 110, '16/1')]),
  ('16:10', 'Godolphin Under Starters Orders EBF Boadicea Stakes (Lis', 14, False, [
   ('Dance In The Storm', 98, 110, 117, None),
   ('Forty Years On', 105, 99, 121, None),
   ('Magic Basma', 100, 104, 114, None),
   ('Cherry Baker', 86, 94, 100, None),
   ('Golden Palace', 95, 98, 104, None),
   ('Hollywood Treasure', 96, 91, 109, None),
   ('Isle Of Fernandez', 96, 95, 108, None),
   ('Lady Youmzain', 95, 98, 103, None),
   ('Midnight Tango', 102, 86, 115, None),
   ('Rogue Attraction', 88, 84, 103, None),
   ("Ruby's Angel", 95, 91, 104, None),
   ('Sing The Blues', 90, 99, 107, None),
   ('The Prettiest Star', 105, 111, 118, None),
   ('Zen Diva', 95, 100, 111, None)]),
  ('16:45', 'Newmarket Pony Academy Pride Stakes (Group 3)', 17, False, [
   ('Francophone', 100, 98, 115, None),
   ('Miss Wong', 83, 85, 104, None),
   ('Naga', 104, 89, 113, None),
   ('Noche Clasica', 106, 98, 115, None),
   ('Patagonia Girl', 80, 80, 95, None),
   ('Snellen', 104, 91, 116, None),
   ('Legacy Link', 107, 104, 117, None),
   ('Della Pace', 93, 74, 105, None),
   ('Felicitas', 101, 112, 113, None),
   ('Lizzana', 98, 91, 110, None),
   ('On Message', 104, 105, 116, None),
   ('Pacific Mission', 102, 99, 114, None),
   ('Previous', 92, 95, 102, None),
   ('Rose Ghaiyyath', 98, 104, 110, None),
   ('Silver Lake', 99, 102, 114, None),
   ('Song Of The Clouds', 94, 74, 104, None),
   ('Touleen', 110, 107, 121, None)]),
  ('17:20', 'HKJC World Pool Handicap', 15, True, [
   ('Back To Me', 82, 74, 86, None),
   ('Majestic Dane', 82, None, 82, None),
   ('Waistcoat', 79, 77, 89, None),
   ('Righthere Rightnow', 79, 82, 90, None),
   ('George Wickham', 80, 69, 84, None),
   ('Commander Of Life', 78, 74, 86, None),
   ('Lion Of Mali', 80, 76, 85, None),
   ('The Sweet Escape', 76, 78, 86, None),
   ('Bintola', 78, 74, 87, None),
   ('Expert Agent', 75, 91, 88, None),
   ('Nanoscience', 75, 67, 85, None),
   ('Mister Mojito', 72, 76, 90, None),
   ('Lunario', 72, 81, 89, None),
   ('Albemagic', 71, 53, 82, None),
   ('Akabusi', 70, 86, 86, None)]),
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


def verdict(ratio, r_rpr_or, r_gap_or):
    """What the two diagnostics license. Deliberately not a single threshold:
    a low ratio says the LEVEL is compressed toward a par, and a gap
    correlation near -1 says the GAP is arithmetic. The residual survives
    both; a near-zero r(RPR,OR) means even that is thin."""
    if abs(r_rpr_or) < 0.30:
        return 'carries nothing -- lead on other figures'
    if ratio < 0.45 or r_gap_or < -0.90:
        return 'PAR -- residual only, never the level or the gap'
    if ratio < 0.70 or r_gap_or < -0.55:
        return 'partly compressed -- prefer the residual'
    return 'usable'


def main():
    print('CALIBRATION -- may RPR carry an argument in this race?\n')
    print(f"{'race':6} {'n':>3} {'OR spr':>7} {'RPR spr':>8} {'ratio':>6} "
          f"{'r(RPR,OR)':>10} {'r(gap,OR)':>10}  verdict")
    fits = {}
    for off, name, n, hcap, rs in RACES:
        rated = [(h, o, p, od) for h, o, ts, p, od in rs if o is not None and p is not None]
        ors = [x[1] for x in rated]; rprs = [x[2] for x in rated]
        osp = max(ors) - min(ors); rsp = max(rprs) - min(rprs)
        ratio = rsp / osp if osp else float('nan')
        r1 = corr(ors, rprs)
        r2 = corr([p - o for _, o, p, _ in rated], ors)
        print(f'{off:6} {len(rated):3} {osp:7} {rsp:8} {ratio:6.2f} '
              f'{r1:10.3f} {r2:10.3f}  {verdict(ratio, r1, r2)}')
        b, a = fit(ors, rprs)
        fits[off] = sorted(((h, o, p, od, p - (a + b * o)) for h, o, p, od in rated),
                           key=lambda t: -t[4])

    print('\n\nRESIDUAL RANKING -- how far above the par its OWN mark predicts\n')
    for off, name, n, hcap, rs in RACES:
        print(f'{off}  {name}  ({n} runners, {"handicap" if hcap else "non-handicap"})')
        for i, (h, o, p, od, res) in enumerate(fits[off], 1):
            print(f'   {i:2}. {h:20} OR {o:3}  RPR {p:3}  resid {res:+6.1f}  '
                  f'{od or "no price":>9}{"  <" if i <= 3 else ""}')
        print()

    print('THE TRAP, stated in full -- 15:30 Old Rowley Cup')
    rs = dict((off, r) for off, nm, n, h, r in RACES)['15:30']
    g = sorted(((p - o, h, o, od) for h, o, ts, p, od in rs if o and p), reverse=True)
    print('  biggest RPR-OR gaps (and their marks):')
    for gp, h, o, od in g[:3]:
        print(f'    {h:16} +{gp:3}  off OR {o}  at {od}')
    print('  smallest:')
    for gp, h, o, od in g[-3:]:
        print(f'    {h:16} +{gp:3}  off OR {o}  at {od}')
    order = [h for h, o, p, od, res in fits['15:30']]
    rank = lambda h: order.index(h) + 1
    print('\n  The gap ranks the two 16/1 shots off the joint-lowest mark (81) first and second.')
    k, l = rank('Kahin'), rank("Lord d'Or")
    print('  The residual ranks Kahin %d and Lord d\'Or %d of %d.' % (k, l, len(order)))
    print('  One is a read. The other was arithmetic.')


if __name__ == '__main__':
    main()
