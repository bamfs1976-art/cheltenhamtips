"""Builds the Day 1 race blocks for cheltenham-november-2026.html.

TWO THINGS THIS DOES THAT A HAND-WRITTEN SECTION CANNOT.

1. Every stat line (`.conns`) is DERIVED from the parsed racecard, never typed
   beside the prose. §10, 8 Oct: a figure stated in prose must be read off the
   derivation. The first draft of this card typed "TS 149" for a horse the card
   rates 134, and the note under it said 134 — two numbers, one horse, one
   paragraph. Deriving the line removes the chance.

2. Every numeric claim a pick note makes is declared in `claims` and CHECKED
   against the racecard before a line of HTML is written. A mismatch exits
   non-zero. That is the check §10 says does not exist — "no check compares a
   number in a sentence against the script that produced it" — built for the
   one place it is cheap to build: the card's own figures.

Usage:
  python3 scripts/analysis/cheltenham-nov-day1-build.py <card.json> <picks.json> <out.html>
"""
import json, sys, collections

card_path, picks_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
runners = json.load(open(card_path))['Friday']
spec = json.load(open(picks_path))

by_name = {r['horse']: r for r in runners}
races = collections.OrderedDict()
for r in runners:
    races.setdefault(r['time'], []).append(r)

# ---- check every declared claim against the racecard -----------------------
fails = []
for horse, claims in spec['claims'].items():
    r = by_name.get(horse)
    if r is None:
        fails.append(f'{horse}: not in the declared field')
        continue
    for field, want in claims:
        got = r.get(field)
        if got in (None, ''):
            fails.append(f'{horse}: card has no {field}, note claims {want}')
            continue
        ok = abs(float(got) - float(want)) < 1e-9
        if not ok:
            fails.append(f'{horse}: note claims {field}={want}, card says {got}')
if fails:
    print('CLAIM CHECK FAILED —', len(fails), 'mismatch(es):')
    for f in fails: print('  ', f)
    sys.exit(1)
print(f'claim check: {sum(len(v) for v in spec["claims"].values())} figures across '
      f'{len(spec["claims"])} horses, all agree with the racecard')

# ---- field sizes must agree with what the race headers assert --------------
for rc in spec['races']:
    actual = len(races[rc['t']])
    if actual != rc['n']:
        print(f'FIELD SIZE MISMATCH {rc["t"]}: header says {rc["n"]}, card has {actual}')
        sys.exit(1)
print('field sizes: all six headers agree with the declared card')

def conns(r):
    """The stat line, straight off the racecard."""
    jk = r['jockey'] + (f"({r['claim']})" if r['claim'] else '')
    tr = r['trainer'] + (f" {round(float(r['trpc'])*100)}%" if r['trpc'] else '')
    wt = r['wt'].replace('-', 'st ') + 'lb'
    figs = ' &middot; '.join(
        f'{k} {r[f]}' for k, f in (('OR','or'), ('TS','ts'), ('RPR','rpr')) if r[f])
    return (f'{jk} | {tr} | F:{r["form"]} | {r["age"]}yo {wt}'
            + (f' | {figs}' if figs else ''))

LONG_TXT = {
 'open': None,
 'shut-nonhcap': ('<strong>LONG shut, and in a non-handicap it cannot open at any field size.</strong> '
   'The non-handicap ladder tops out at three places however many run, so the four the place test '
   'needs is unreachable here &mdash; arithmetic settled before anyone counted the field. Two picks only.'),
 'shut-small': ('<strong>LONG shut &mdash; four runners is win only.</strong> There are no places to pay, '
   'so the slot fails on the place leg before price or signal is reached. Two picks only.'),
 'shut-hcap8': ('<strong>LONG shut on the place count, and this one is a judgement the field size makes for us.</strong> '
   'Eight runners in a handicap pays three; the test needs four, which needs sixteen. Two picks only &mdash; '
   'and note the race is <em>on</em> the 8-runner boundary, so one withdrawal takes it to two places.'),
}

out = []
for rc in spec['races']:
    hd = (f'{rc["t"]} &middot; {rc["name"]} &middot; {rc["dist"]} &middot; {rc["n"]} rnrs '
          f'&middot; {rc["cls"]} &middot; {rc["ew"]}')
    out.append('    <div class="race-block">')
    out.append(f'      <p class="race-hd">{hd}</p>')
    out.append(f'      <div class="tip-row">{rc["note"]}</div>')
    for pk in rc['picks']:
        r = by_name[pk['h']]
        badges = ''.join(f'<span class="sb sb-{c}">{t}</span>' for c, t in pk.get('sb', []))
        out.append('      <div class="pick-row">')
        out.append(f'        <div class="pick-tag {pk["tag"]}">{pk["tag"].upper()}</div>')
        out.append(f'        <div><span class="pick-horse">{pk["h"]}</span>{badges}'
                   f'<span class="conns">{conns(r)}</span>'
                   f'<div class="pick-note">{pk["pn"]}</div></div>')
        out.append(f'        <div class="pick-odds">{pk["odds"]}</div>')
        out.append('      </div>')
    txt = LONG_TXT[rc['long']]
    if txt:
        out.append(f'      <div class="nobet">{txt}</div>')
    out.append('    </div>')

open(out_path, 'w').write('\n'.join(out) + '\n')
npicks = sum(len(r['picks']) for r in spec['races'])
print(f'wrote {out_path}: {len(spec["races"])} race blocks, {npicks} pick rows, '
      f'{sum(1 for r in spec["races"] for p in r["picks"] if p["tag"]=="long")} LONG')
