#!/usr/bin/env python3
"""§6 RPR calibration for Ascot, British Champions Day, 17 Oct 2026.

Three diagnostics IN ORDER (§6, 8 Oct 2026):
  1. r(RPR, OR)  — does a line exist at all? Below ~0.3 there is none,
                   so there is no residual either.
  2. ratio       — RPR spread / OR spread. Is the LEVEL compressed?
  3. r(gap, OR)  — is the GAP arithmetic (the par signature)?
Only where (1) passes is a residual computed. Run before any selection."""
import importlib.util, os, math
here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('card', os.path.join(here,'ascot-champions-day-card.py'))
c = importlib.util.module_from_spec(spec); spec.loader.exec_module(c)

def corr(xs, ys):
    n=len(xs)
    if n<3: return float('nan')
    mx,my=sum(xs)/n,sum(ys)/n
    sx=math.sqrt(sum((x-mx)**2 for x in xs)); sy=math.sqrt(sum((y-my)**2 for y in ys))
    if sx==0 or sy==0: return float('nan')
    return sum((x-mx)*(y-my) for x,y in zip(xs,ys))/(sx*sy)

def fit(xs, ys):
    n=len(xs); mx,my=sum(xs)/n,sum(ys)/n
    den=sum((x-mx)**2 for x in xs)
    b=0.0 if den==0 else sum((x-mx)*(y-my) for x,y in zip(xs,ys))/den
    return my-b*mx, b

print(f"{'race':<7}{'rated':>6}{'r(RPR,OR)':>11}{'ratio':>8}{'r(gap,OR)':>11}   verdict")
VERDICTS={}
for off,name,typ,n,rs in c.RACES:
    rated=[(r[9],r[11],r[2]) for r in rs if r[9] is not None]   # OR, RPR, horse
    k=len(rated)
    if k<3:
        print(f"{off:<7}{k:>6}{'—':>11}{'—':>8}{'—':>11}   too few rated runners — nothing rests on this")
        VERDICTS[off]=('none',None); continue
    ors=[x[0] for x in rated]; rprs=[x[1] for x in rated]
    r1=corr(ors,rprs)
    os_, rs_ = max(ors)-min(ors), max(rprs)-min(rprs)
    ratio = float('nan') if os_==0 else rs_/os_
    gaps=[rp-o for o,rp,_ in rated]
    r3=corr(ors,gaps)
    # GATE 1 is SIGNED, not absolute (refinement, 15 Oct 2026). A NEGATIVE
    # r(RPR,OR) means better-marked horses are projected LOWER — that is the par
    # signature at its most extreme, not evidence of a line. Testing |r| lets it
    # through: the Balmoral reads -0.326 and would have passed an abs() gate.
    if r1 < 0.3:
        v=('EMPTY — no line (r is NEGATIVE: the par signature)' if r1 < 0
           else 'EMPTY — no line, so no residual')+'; lead on something else'
        VERDICTS[off]=('empty',None)
    elif ratio < 0.5 or r3 < -0.85:
        v='PAR — residual only, never the raw gap'
        VERDICTS[off]=('par',fit(ors,rprs))
    else:
        v='usable — column carries real information'
        VERDICTS[off]=('usable',fit(ors,rprs))
    print(f"{off:<7}{k:>6}{r1:>11.3f}{ratio:>8.2f}{r3:>11.3f}   {v}")

print("\n=== residual ranking, only where a line exists ===")
for off,name,typ,n,rs in c.RACES:
    kind,ab = VERDICTS[off]
    if kind in ('none','empty'):
        print(f"\n{off}  — not computed ({kind})"); continue
    a,b = ab
    rated=[(r[9],r[11],r[2],r[8]) for r in rs if r[9] is not None]
    # §6, 8 Oct, tested b ~ 0. That is the wrong quantity (refinement,
    # 15 Oct 2026): what matters is the LINE'S REACH against the thing being
    # ranked. The line moves a runner by at most |b| * spread(OR); if that is
    # small beside spread(RPR), the residual is raw RPR wearing a decimal point.
    ors_=[o for o,_,_,_ in rated]; rprs_=[rp for _,rp,_,_ in rated]
    reach = abs(b)*(max(ors_)-min(ors_)); span = max(rprs_)-min(rprs_)
    frac = float('inf') if span==0 else reach/span
    degenerate = frac < 0.33
    res=sorted(((rp-(a+b*o)), h, px) for o,rp,h,px in rated)[::-1]
    flag = (f"  *** LINE REACH {reach:.1f}lb vs RPR SPREAD {span}lb = {frac:.0%}"
            " — this residual IS raw RPR, do not rank on it ***") if degenerate else f"  (line reach {reach:.1f}lb of {span}lb RPR spread = {frac:.0%})"
    print(f"\n{off}  slope b={b:+.3f}{flag}")
    for i,(v,h,px) in enumerate(res[:4],1):
        print(f"   {i}. {h:<22}{v:+6.1f}   {px}")
