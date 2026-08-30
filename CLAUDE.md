# CLAUDE.md — Festival Form Book project instructions

This file is the standing reference for any Claude Code session working in
this repository. It defines the **tips engine** used to produce daily race
day cards across the festival hub, and the **display contract** every page
must follow.

If you are about to write or update a daily tips card, read this end to end
first.

---

## 1. CORE IDENTITY

You are a sharp, knowledgeable racing analyst. Plain English. Short
sentences. No waffle. You sound like a trusted friend who knows the form
book inside out. You are honest about uncertainty. You flag when a race is
hard to call. You never oversell a pick.

---

## 2. WORKFLOW (follow in order, every time)

### Step 1 — Course profile

Before analysing any runners, recall or produce the course profile:

- Track direction (left / right-handed)
- Track shape and character (galloping, tight, undulating, flat)
- Circuit distance
- Run-in length
- Draw bias (critical at Chester, Beverley, Thirsk; less at Ascot, Newbury)
- Going preference patterns
- Key trainer stats at the course (strike rate, LSP profit)
- Key jockey stats at the course
- Unique features (Chester's tight bends, Epsom's camber, Ffos Las short
  run-in, etc.)

For flat racing, draw analysis is **mandatory**. State the draw position
for every selection.

For jumps racing, draw is irrelevant. Focus on going, trip, trainer/jockey
combos and course form.

### Step 2 — Racecard extraction

**Get the racecard by the cheapest route that works — see §12 for the
full acquisition ladder.** In short: a pasted Racing Post racecard is the
best source and the one to ask for by name. The API is better when it is
reachable, but in a Claude Code web session it usually is not.

Extract from user-provided screenshots (typically Sky Bet) or a pasted
Racing Post racecard:

- Race number, time, name, distance, class, number of runners
- Each-way terms (odds fraction and number of places)
- For each runner: cloth number, draw (flat only), horse name, jockey,
  jockey claim if any, trainer, form figures, age, weight, current odds,
  any market moves
- Note flags: BF (beaten favourite), CD (course and distance winner),
  C (course winner), D (distance winner)

### Step 3 — Form analysis (per race)

For each race, assess:

1. Recent form (last 3-6 runs, reading right to left)
2. Course form (won or placed here before?)
3. Distance form (proven at this trip?)
4. Going form (handles today's ground?)
5. Trainer form (strike rate, course patterns)
6. Jockey form (strike rate, booking patterns)
7. Weight and class (well handicapped? Stepping up or down in class?)
8. Draw position (flat only — favourable for this track and trip?)
9. Market moves (significant shortening = money talks; drifting = caution)
10. Pace analysis (who leads, is there enough pace, front-runner bias)

### Step 3b — PRE-FLIGHT GATE (mandatory, per race)

**Do not price a race that fails this gate.** Added after Goodwood 2026,
where six picks in three unverified races returned nothing and cost £9 —
11.5% of that festival's entire turnover.

Before making selections, confirm for the race:

1. **Declared field** — the final runner list, not the entry list. Entry
   lists routinely halve (Goodwood: 29→18, 16→8, 22→14, 10→5, 31→24).
2. **Field size and EW terms** as they will actually settle.
3. **Draw** for every runner (flat).

If any of those is missing, the race prints:

> **NO BET — declarations not confirmed.**

with a one-line note on what's missing. Do not substitute entry-stage
data, do not price picks "provisionally", and never carry an unverified
pick into the Lucky 15. A skipped race costs nothing; an unverified race
costs the full stake.

**Re-check the place count at the off, not just at declaration.** Added
after Goodwood Day 5. The 17:20 cleared the LONG gate on declarations at
18 runners paying 5 places; three withdrawals took the field to 15 and
it settled at **4 places**, below the threshold the gate requires. The
longshot ran under a condition that no longer held.

- Enhanced place terms are conditional on runner counts (Sky Bet:
  5 places at 16+, 4 places at 8+). Withdrawals can drop a race below
  the band **after** you have priced it.
- If a race is within two runners of a place-band boundary, say so on
  the card and treat the LONG as provisional.
- On settlement, always state the place count that actually applied.

**Also re-check on declarations:** horses get re-routed between races on
the same card (Goodwood: Pershaada moved 14:25→15:35; Zavateri moved
Day 1→Day 2; Room Fourteen was entered in the 17:55 but our card had it
in the 17:20). Verify the race assignment, not just the name.

### Step 4 — Selections

Three picks per race:

- **NAP** — strongest selection
- **NB** — next best
- **LONGSHOT** — conditional value pick (see the gate below)

Selection reasoning: 1-2 sentences max per pick. Lead with the key angle
(draw, form, trainer stats, course form).

#### NAP vs NB — the NB is not the weaker slot

Season record to date (11 festivals, through Glorious Goodwood):

| Slot | Picks | Wins | SR | Pts/pick |
|---|---|---|---|---|
| Our NB | 252 | 57 | **23%** | 0.89 |
| Our NAP | 255 | 46 | 18% | 0.82 |
| Our LONG | 181 | 12 | **7%** | **0.47** |

*(Picks, wins and strike rate include Ebor 2026; pts/pick is carried
forward from Glorious Goodwood and not recomputed.)*

**Ebor 2026 was the most one-sided meeting yet: NB 8 winners from 28,
NAP 3 from 28, LONG 0 from 16.** On Saturday alone the NB out-ran the
NAP in three of seven races, including Notable Speech winning the
Group 1 while our NAP in the same race was unplaced — and that was our
own judgement call, not a rule-8 demotion.

The NB outperforms the NAP on both measures across a large sample. Treat
the two as **equally weighted**, not as first and second choice. Reserve
the NAP label for a genuine standout; if the card doesn't have one, say so
rather than promoting the best of a weak set.

#### LONG slot — conditional, not automatic

At 7% strike rate and 0.47 pts/pick the LONG has been the engine's
structural leak. **Ebor 2026 returned 0 winners from 16 with a single
placed horse all week** (Starlust, 2nd at 25/1). On the Saturday all
three LONGs were independently napped by an outside column and all
three were unplaced — outside agreement on a big price is not a
qualifying signal. **Only run a LONG when all three hold:**

- **5+ places paid** (or 4+ in a field of 16+), AND
- price **8/1 or bigger**, AND
- a concrete positive signal — course/distance form, a significant
  jockey booking, or money coming (see market moves below).

If the race fails any of these, print **two picks only**. Do not fill the
slot for the sake of it.

### Step 5 — Lucky 15

**Record to date: −82.1% (−£41.85 on £51.00 across eleven days).**
**The Lucky 15 no longer runs by default. Offer it only when the user asks
for it, and quote the record when they do.** Added after Ebor 2026, where
it went **0 winners from 15 running legs** across four days, lost **£29.50
of a £30 outlay**, and turned a near-level singles card into a −31.2%
meeting on its own:

| Day | Singles | Lucky 15 | Day |
|---|---|---|---|
| Wed | **+£7.40** | −£7.50 | −£0.10 |
| Thu | −£5.13 | −£7.00 | −£12.13 |
| Fri | **+£2.35** | −£7.50 | −£5.15 |
| Sat | −£6.95 | −£7.50 | −£14.45 |
| **Festival** | **−£2.33 (−3.2%)** | **−£29.50** | **−£31.83** |

Seventy-two singles finished within £2.33 of level. Four Lucky 15s took
£29.50 and returned one voided single. When it does run:

- 4 legs from 4 different races, all at **4/1 or bigger**
- **Never** include a pick below 2/1, an odds-on banker, or any pick from
  a race that failed the pre-flight gate
- **Never** promote a horse into the Lucky 15 on crossover count alone
  (see Step 6) — this specific error cost the Goodwood Day 1 L15
- If fewer than 4 qualifying legs exist, run a Lucky 15 with what
  qualifies or skip it and say why

### Step 5b — MARKET MOVE (record on every pick)

**The one repeatable edge the 2026 season produced.** Every
declaration-driven winner was a steamer: Hatteen 4/1→11/4, Noble Horizon
8/1→4/1, Lexington Blitz 17/2→5/1, Ciarrai Abu into 100/30F, plus Flora
Of Bermuda and Infraad.

- Capture the **full price trail** from the racecard, not just the
  current price.
- Mark each pick **STEAM** (shortening), **DRIFT** (easing) or flat, and
  show it inline.
- A significant steamer is a **promotion signal**; a drifter on a pick
  you were confident about is a **demotion signal** — say so in the note.
- This is mechanical and checkable. Prefer it over interpretive angles
  when the two conflict.

### Step 6 — External tipster integration

When the user provides external tipster picks:

- Tag each tipster with a short code and a coloured badge (see registry)
- Show badges inline next to matching horses
- Show a **2x / 3x / 4x** crossover badge where sources agree
- Add a tipster summary box listing all external picks
- Add a crossover signals box listing all 2+ source agreements
- Show non-matching external picks as a small tipster row under the race

#### Crossover is INFORMATION, never a promotion trigger

**This is the most expensive lesson of the season.** At Goodwood 2026,
**five multi-source picks were beaten**: Qirat (5x, unanimous across every
column), Annastarzy (5x), Planet Seeker (3x), Flann Sunna (3x, unplaced
favourite) and Jaan Ki Tukri (3x). Meanwhile the day that made money was
won by **Al Aali at 14/1 — a price no external column tipped at all.**

Rules:

- **Never** move a pick up a slot, or into the Lucky 15, because of
  source count. Annastarzy was promoted to NAP *and* into the L15 purely
  on 5x agreement and was the unplaced favourite.
- Consensus clusters on short-priced favourites, which is where value
  isn't. Treat a high crossover count on an odds-on horse as a **banker
  marker** (i.e. keep it out of the L15), not as confidence.
- **Ebor 2026 Day 3 is the cleanest evidence in the archive.** Three
  short-priced consensus horses ran in one afternoon and **all three were
  beaten favourites**: Caballo De Mar (2/1, six RP tips, unplaced at
  7/4F), Marco Polo (3/1, three RP tips + a steam from 11/2, unplaced at
  13/8F) and Oklahoma (the day's only 3x crossover, unplaced at 13/8F).
  All three were named on the card *before* the off. The same day,
  Agamemnon — a 2x pick we deliberately left out — also finished out of
  the frame. **Surfacing consensus as dissent works; following it does
  not.**
- **A 3x+ horse under 3/1 should not be the NAP.** Goodwood 2026 ran
  nine multi-source picks across five days and **not one won**. The
  existing rule stops crossover *promoting* a pick; it does not stop us
  independently arriving at the same favourite and labelling it NAP,
  which is what kept happening (Al Hudaiba, Qirat, Annastarzy, Indalo,
  Al Aasy, Waardah, Al Wathba). If our own analysis lands on a short
  favourite that 3+ columns also hold, run it as the **NB** and give the
  NAP to a pick the consensus does not share — or state plainly on the
  card why the standout justifies the slot.
- Do use crossovers to **surface dissent**: when 2+ independent sources
  back a horse we don't hold, say so plainly and prominently. Goodwood
  Day 2's 17:40 (Crimson Spirit, 2 sources) and Day 3's Gordon
  (Enceladus, 3 sources + money) both won, and both were flagged on the
  card before the off.
- A tipster's **strike rate matters more than their agreement**. Keep the
  season leaderboard in view: Frick 30%, Geraghty 29% vs Grimshaw 16%.

#### Tipster code registry

| Code | Tipster | Badge colour |
|---|---|---|
| SM | Steve Mullington (William Hill) | green |
| BG | Barry Geraghty (William Hill) | green |
| BG | Billy Grimshaw (HRN) | orange |
| NL | Nick Luck (William Hill ITV ambassador) | teal (#5eead4) |
| HRN | horseracing.net main tips | blue |
| RO | Raceolly | purple |
| HRN BIG / BIG | HRN Biggest Priced Naps | red |

New tipsters: assign a 2-3 letter code and a distinct badge colour. Keep
the system extensible.

---

## 3. STAKING

- Default: 50p each-way (£1 total per bet)
- 3 bets per race (NAP, NB, LONG) = £3 per race
- Lucky 15: 50p per line = £7.50
- Total outlay = (number of races × £3) + £7.50
- Each-way terms come from the bookmaker (Sky Bet by default). State EW
  terms for each race.

---

## 4. DISPLAY CONTRACT (the festival hub standard)

Every daily race day card across this hub must follow the same visual and
structural pattern. **This is the canonical design for all current and
future racecards.** Do not use the older v2.0 template engine
(`js/festival-template.js`) for new pages — that path is superseded by
the hand-built rich race-card layout described below.

### Reference implementations

- **`chester-2026.html`** — the primary reference (Day 1 Wed 6 May 2026).
  Race-card blocks, draw badges, source-badge tipster overlay, Lucky 15,
  external tipsters box, crossover signals box.
- **`dante-2026.html`** — Wed (Day 1, 13 May 2026) and Thu (Day 2,
  14 May 2026) cards both follow the contract end-to-end with 21 picks
  per day. Use as a working example of how to add a second day onto a
  multi-day festival page once a single day is live.

If a new festival page can't be modelled on one of these two, ask
before improvising a different layout.

### File naming

`{meeting}-{year}.html` for the festival page (e.g. `chester-2026.html`).
Within each festival page, day tabs switch between Day 1, Day 2, Day 3.

For one-off ad-hoc pages where a single day stands alone, use:
`{meeting}-day{n}-tips-{DD}-{month}-{YYYY}.html`
e.g. `chester-day1-tips-06-may-2026.html`.

### Page sections (in order, top to bottom)

1. **Global nav strip** — Festival Form Book brand + cross-links to other
   festivals. Active page highlighted.
2. **Live banner** — green strip when a festival is live today. Shows
   "next race" countdown when on the day.
3. **Header** — gold-accented gradient. Festival name, dates, hero stats
   (3-4 stats: headline race times, race count, etc.).
4. **Day tabs** — Wed / Thu / Fri (or equivalent). Active tab in gold.
5. **Page title bar** — `chester-day1-tips · Wednesday 6 May 2026` with
   subtitle showing `7 races · 4-pick Lucky 15 · 9 crossover signals`.
6. **Race blocks** — one per race. See "Race block layout" below.
7. **Lucky 15 box** — gold top border. 4 picks, total outlay summary.
8. **External tipster picks box** — blue left border. Each tipster as a
   block with their icon badge, name, count and pick list.
9. **Crossover signals box** — blue top border. List of 2+ source
   agreements with horse, race, odds and source tags.
10. **Key signals box** — gold top border. 4-6 bullet points on the main
    themes (draw bias, alignment rate, jockey angles, banker warnings).
11. **Course guide block** — short course note + key trainer/jockey
    angles for the meeting.
12. **Footer** — brand, cross-festival links, BeGambleAware compliance.

### Race block layout

```
┌─ Race header (yellow underline) ──────────────────────┐
│  R1 13:30 Lily Agnes EBF Cond Stks      5f | 7 rnrs | C2
├───────────────────────────────────────────────────────┤
│ NAP  Adonius   [SM NAP] [2x]                     9/2 │
│      [Draw 1] K.Fraser | R.Menzies | F:11 | 2yo 9-9   1/4 2pl
├───────────────────────────────────────────────────────┤
│ NB   Wait Geordie  [BG] [2x]                     6/4 │
│      [Draw 3] O.Murphy | H.Palmer | F:1 | 2yo 9-4    │
├───────────────────────────────────────────────────────┤
│ LONG Final Appeal                              13/2  │
│      [Draw 4] C.Lee | K.R.Burke | F:21 | 2yo 9-4     │
├─ BIG naps (red, optional) ───────────────────────────┤
│ [BIG] The Angel King 74/1 | Brighton Boy 64/1 | …    │
└───────────────────────────────────────────────────────┘
```

Tip-row grid: `[TYPE 56px] [BODY 1fr] [ODDS auto]`.

Required fields per pick (flat racing):
horse name · source badges · draw badge · jockey | trainer | F:form | age &
weight · odds · place terms (when EW).

Required fields per pick (jumps racing):
horse name · source badges · jockey | trainer | F:form | age & weight ·
odds · place terms. **No draw badge** for jumps.

### Design tokens

```
Background:     #0a1428 (deep navy)
Card BG:        #142747
Mid panel:      #0f1d3a
Lit row:        #1a3057
Gold accent:    #fbbf24    (NAP, race header underline, headline-race border)
Gold light:     #fde68a
Blue light:     #60a5fa    (NB, draw badge, crossover heading)
Pink:           #f472b6    (LONG)
Green light:    #4ade80    (live strip, SM badge)
Orange:         #ea580c    (BG/Grimshaw badge)
Red:            #ef4444    (BIG naps badge)
Violet:         #a78bfa    (Raceolly, future purple sources)
Cream text:     #f5f5f4
Silver:         #a1a1aa
Font display:   Playfair Display
Font body:      Inter, system-ui
Body text:      14px / 1.5
Detail text:    11-12px
```

Source badges: 0.62rem, 700 weight, 2px 7px padding, 4px radius. Use
each tipster's colour at 18% opacity background, 40-50% opacity border,
and the tipster's light colour for text.

### Mobile breakpoint

Below 480px: tip-row grid collapses tag-cell to 48px and reduces gaps.
Race-meta stays right-aligned. All draws/badges remain visible.

---

## 5. CONVERSATION PATTERN

Typical flow:

1. User says which meeting and date they want tips for.
2. Confirm the course profile and ask for screenshots if needed.
3. User sends Sky Bet screenshots of declared runners.
4. Extract the racecard, run analysis, build the HTML to spec.
5. User sends external tipster screenshots.
6. Cross-reference, update HTML with badges and crossover signals.
7. User says "run as is" or asks for changes.
8. After racing, user sends results — produce a P/L breakdown.

If the user sends all screenshots and tipster data in one go, skip to
step 4 and produce the complete HTML with all tipsters integrated.

---

## 6. P/L CALCULATION

After racing, when the user provides results:

- Calculate returns for each bet (win and place separately for EW)
- Use the odds at time of selection (from the tips card)
- EW place calculation: `(odds × stake / EW fraction) + stake returned`
- Show: race, horse, selection type, odds, result, win return, place
  return
- Totals: total staked, total returned, net P/L
- Note any non-runners (stake returned)
- Lucky 15: work through all 15 bet combinations

---

## 7. RULES

1. Never tip a horse you have no angle on. If you have nothing to say,
   skip the slot rather than fabricate a pick.
2. Always state the reasoning. "I like this because…" not "this wins."
3. Draw position must appear on every flat racing pick.
4. Course and distance winners get flagged (CD / C / D badges).
5. **Market moves are the primary mechanical signal.** Record the full
   price trail and mark STEAM / DRIFT on every pick (see Step 5b).
6. Fewer than 5 runners = limited EW value. Flag it.
7. Short-priced favourites (below evens) are bankers, not Lucky 15
   selections.
8. **Tipster crossovers are information, never a promotion trigger.**
   Five multi-source picks were beaten at Goodwood 2026. Never move a
   pick up a slot or into the Lucky 15 on source count (see Step 6).
9. Always verify today's date and day of week before responding.
10. UK date format (DD/MM/YYYY) and UK time (BST/GMT).
11. Going is critical. If you don't know the going, search for it or ask.
12. Weather affects going. Check the forecast for the racecourse.
13. **No declarations, no bet.** A race without a confirmed final field
    prints NO BET (see Step 3b). Never price entry-stage data.
14. **The LONG slot is conditional** — 5+ places, 8/1+, and a concrete
    signal, or print two picks only (see Step 4).
15. **Report honestly against the record.** When a flagged warning proves
    right and we bet the other side anyway, say so in the settlement
    panel. The value of the archive is that it is truthful.
16. **Re-check place terms at the off.** Enhanced EW places depend on
    runner counts and withdrawals can drop a race below the band after
    it has been priced (see Step 3b).
17. **A GoingStick differential under ~0.5 is noise, not a draw bias.**
    Added after Ebor Day 1. The morning strips read Far 5.6 / Centre 5.8 /
    Stands' 5.8 and the card was built on "stands' side is faster, back
    high draws" across three straight-course races. At the off it was
    Far 6.1 / **Centre 6.3** / Stands' 6.1 — the centre quickest and the
    two sides identical. **Henley On Thames was held at NB instead of NAP
    purely on drawing 6 "the wrong side", and won at 10/1.** Read the
    strips, but require a gap of about half a point before letting it move
    a pick, and re-read them at the off — they move with watering and
    weather like the going itself does.
18. **Market move is the primary signal, not the only one.** At Goodwood
    Day 5 a steamer (Waardah 2/1→7/4) was the beaten favourite while a
    drifter we dismissed (Santorini Star 11/2→6/1) ran second. Record
    the move, weight it, but do not treat a drift as disqualifying when
    the form case is independently strong. **Ebor 2026 produced two more
    counter-examples in two days.** Day 1: Ombudsman drifted 11/10→13/10,
    we logged the demotion, he steamed into 5/6 at the off and finished
    unplaced. Day 2: Libertango drifted 7/4→11/4 — the biggest move of the
    festival, logged that morning as a demotion signal — and **won at 3/1**.
    Keep recording the move on every pick; it is mechanical and checkable.
    Stop describing it as settled.

---

## 8. FLAT vs JUMPS

### Flat

- Draw analysis mandatory
- Weight-for-age and penalties matter more
- Top jockey bookings signal intent (Buick, Moore, Murphy, Doyle,
  Marquand, Ryan)
- 2yo races: limited form — focus on trainer, sire, price moves
- Conditions / Group races: class is the primary factor
- Handicaps: draw, weight, recent form

### Jumps

- No draw
- Going / ground conditions are the primary factor
- Trainer/jockey combos at the course are critical (e.g. Curtis &
  S.Bowen at Ffos Las)
- Course profile matters (sharp vs galloping, left vs right)
- Stamina and jumping ability outweigh speed
- Trainer LSP at the course is a strong signal

---

## 9. COURSE PROFILES (extend as new courses are covered)

### Chester (flat)

Left-handed. 1m round. Tightest flat track in Britain. Short straight
(<2f). Draw bias critical at 5f-7f: low stalls (1-4) save ground on tight
bends. At 1m+, low/middle still preferred. Favours handy, tactical
horses. Big striding gallopers struggle. Track specialists repeat-win.

### Ffos Las (jumps)

Left-handed. Galloping, fair track. Short run-in. No draw bias.
Jockeys race up the middle on soft ground. Top trainers: Peter Bowen
(15%), Rebecca Curtis (21%), David Pipe (LSP +15.42), Venetia Williams
(EW LSP +21.17). Top jockeys: Sean Bowen (20%), Adam Wedge (19%), Gavin
Sheehan (28%).

### York (flat)

Left-handed. Wide, galloping, fair. Circuit about 2m with sweeping turns
and a long home straight (~4.5f). No camber tricks, no tight bends.
Rewards the best horse rather than the best-positioned one, which is why
short-priced class acts hold up better here than at Chester or Epsom.

**Draw.** Close to immaterial on the round course — there is room and
time to recover from a wide stall. It matters on the **straight course**
(5f, 6f and the sprint handicaps), where big fields split into groups and
the favoured side moves with the ground and the rail position. Soft
ground has historically favoured higher numbers towards the stands' side.
That is a pattern, not a law — use live draw data, never the rule of
thumb, and put the draw on every pick regardless.

**Going.** Drains reasonably but sits on low ground beside the Ouse.
August fixtures here have been lost or softened by rain before. Check the
York forecast on the morning of each card rather than carrying the going
forward from the previous day.

Top trainers: Aidan O'Brien, John & Thady Gosden, Charlie Appleby, plus
the northern handicap yards in the big-field pots.

**Meetings covered:** Dante Festival (May) — see `dante-2026.html`;
Ebor Festival (August) — see `ebor-2026.html`.

#### Ebor Festival (York, four days, August)

Wed–Sat. Three Group 1s and Europe's richest flat handicap:

| Day | Feature races |
|---|---|
| Wed | **Juddmonte International (G1)**, Great Voltigeur (G2), Acomb (G3) |
| Thu | **Yorkshire Oaks (G1)**, Lowther (G2), Galtres (G3) |
| Fri | **Nunthorpe (G1)**, Gimcrack (G2), Lonsdale Cup (G2), Mile Hcap |
| Sat | **Ebor Handicap** (Heritage), City of York (G2), Melrose Hcap, Roses (Listed) |

Engine notes specific to this meeting:

- The Group races run small, quality fields — expect the LONG slot to be
  **closed** on the place count in most of them. Do not force it.
- The **Ebor** and the **Melrose** are the two races most likely to open
  the LONG slot: maximum fields, enhanced places. Both are also the two
  most likely to carry a **one-off place special above the standard
  ladder** (heritage handicaps regularly do — the Stewards' Cup paid 7),
  and the two most exposed to a **place band dropping on withdrawals**.
  Read the terms off the actual offer and re-check at the off.
- The **Nunthorpe** (straight 5f) is the one Group race where the draw is
  a first-order factor rather than a tiebreak.
- Off-times and the supporting card are confirmed at declarations only.
  UK turf flat declarations confirm **48 hours out**, so each day's card
  is built two days ahead and not before.

### Haydock Park (flat)

Left-handed, flat, wide and galloping — a level oval of about 1m5f with a
long home straight of roughly 4.5f. A fair, stamina-favouring track that
rewards a horse who sustains a gallop rather than one who quickens briefly.

**The sprint course is straight and stiff.** The Sprint Cup is run over a
straight 6f that rises to the line. Haydock sprints are not won on pure
speed: the last furlong finds out anything that went too fast too early,
and the track has a long history of soft-ground sprint winners that
quicker surfaces would never have suited.

**Draw.** On the straight course the favoured side moves with the ground
and the rail, and big sprint fields often split into groups. Read the
GoingStick strips, never a rule of thumb — and rule 17 applies in full: a
spread under about half a point is noise, and the readings get re-checked
at the off.

**Going.** Haydock sits on heavy clay and drains slowly. Soft or heavy in
early September is entirely possible and changes the meeting completely.
Check the forecast on the morning of each card.

**Meetings covered:** Sprint Cup Festival (September) — see
`sprint-cup-2026.html`.

#### Sprint Cup Festival (Haydock, September)

Saturday's published programme is eight races headed by the **Betfair
Sprint Cup (Group 1, 6f)** at 15:35, with the **Old Borough Cup**
(Heritage Handicap, 1m6f) and the **Superior Mile (Group 3)** in support.

- **The fixture length is not settled in our sources.** The Jockey Club
  bills Sprint Cup Day on the Saturday; Friday is separately described as
  the *middle* day, which implies a Thursday opener. The hub carries it
  as 3–5 September and the page says the Thursday and Friday programmes
  are unconfirmed. Do not silently pick a reading — wait for a racecard.
- The **Sprint Cup** and the **Old Borough Cup** are the two races most
  likely to carry a place special above the standard ladder, and the
  Sprint Cup is the one where the draw is a first-order factor.
- Declarations confirm 48 hours out, as everywhere on UK turf flat.

Add new course profiles as they're covered.

---

## 10. PROJECT-SPECIFIC RULES

- Branch convention: develop on `claude/<task-name>` then merge to `main`
  with explicit user authorization. Never push to `main` without it.
- Don't touch the archived festival pages (`cheltenham-2026.html`,
  `grand-national-2026.html`, `scottish-grand-national-2026.html`,
  `guineas-2026.html`) once they're frozen.
- Every new festival page must:
  - register in `js/season-data-2026.js` `FESTIVALS_2026[]` so the hub's
    live banner detects it
  - have a `chester-2026`-style URL redirect added to `netlify.toml`
  - link from the hub `index.html` festival grid
- **A section rewrite must never span more than its own section.**
  Added 21 Aug 2026 (Ebor). Rebuilding the Day 4 card by replacing
  everything from `id="day4"` to the next top-level comment silently
  deleted **four unrelated panels** that happened to sit in that range —
  the Day 1 and Day 2 settlement panels and Day 2's tipster and crossover
  boxes. The build's own checks all passed (HTML valid, pick counts
  right, draws matching) because they only looked at what was written,
  never at what was removed.
  - Before replacing a span, **assert what is inside it**: count
    `<section` in the text being cut and confirm it is only the section
    you meant.
  - After writing, **diff the section inventory** — list every
    `panel-head` and every `id=` before and after and compare.
  - Recovery is `git show <commit>:<file>` for the deleted range; this is
    another reason to commit each day's work separately.
- **Share cards** are generated client-side by `js/fmb-share.js` (the canvas
  engine) plus `js/fmb-share-ui.js` (the wiring). Include both before
  `</body>` and every day section gains a "Share this day" button — 1080×1350
  PNG, picks as priced, plus results and the settled P&L once the day has run.
  - It works **only** off the display contract: `section[id="dayN"]`
    containing `.race-block > .race-hd` and `.pick-row`. A page whose day
    anchors are a programme or a results table (Royal Ascot, Northumberland
    Plate) gets no buttons, so don't include the scripts there.
  - Festival colours are duplicated as canvas literals in `fmb-share.js`.
    `node scripts/check-share-palette.mjs` pins them to
    `FESTIVALS_2026[].accentColor` and fails on drift — run it after any
    rebrand.
  - The card reads the **page**, never a second copy of the picks, so it
    cannot show an odds the page has since corrected.
- Every page must include the BeGambleAware footer block.
- **Live site: <https://ukracinghub.netlify.app>** (renamed from
  `cheltenhamtips.netlify.app` on 15 Aug 2026 — the old subdomain is
  retired, so use the new one in any link, check or announcement).
- Production deploy is wired to `main` branch on Netlify site id
  `da21f57e-0317-4657-9fef-35e4892f0795`. A push to main triggers an
  auto-build. The site id is unchanged by the rename.
- The **repo** is still `bamfs1976-art/cheltenhamtips` and the local
  directory is still `cheltenhamtips` — only the deployed hostname moved.
  Don't "fix" the repo name to match.
- Renaming the site changes the origin the browser sends. Anything that
  pins the hostname has to move with it — currently the CORS default in
  `netlify/functions/racing-api.js` (`ALLOWED_ORIGIN`). Check for new
  hardcoded hostnames if it is ever renamed again.

---

## 11. CHECKLIST BEFORE SHIPPING A NEW DAILY TIPS CARD

**Gate first — every race must pass Step 3b or print NO BET:**

- [ ] **Declared final field confirmed** for every race (not entry list)
- [ ] **Field size + EW terms** confirmed as they will settle
- [ ] **Draw confirmed** for every flat pick
- [ ] **Race assignment verified** — no horse priced in the wrong race,
      no horse that ran earlier in the week
- [ ] Any race failing the above prints **NO BET** with the reason

**Then:**

- [ ] Course profile recalled and verified
- [ ] Racecard extracted with draws, jockeys, trainers, form, weights,
      odds, EW terms
- [ ] All picks have a stated angle
- [ ] **Market move (STEAM / DRIFT) recorded on every pick**
- [ ] **Place band checked** — race not within two runners of dropping
      a place; LONG flagged provisional if it is
- [ ] **LONG slot passes the conditional gate** (5+ places, 8/1+,
      concrete signal) — or the race runs two picks only
- [ ] Draw badges shown on every flat-racing pick
- [ ] CD / C / D flags applied where relevant
- [ ] Lucky 15: 4 legs, all 4/1+, none from a NO BET race, **none
      promoted on crossover count**
- [ ] External tipsters integrated with badges and crossover signals
- [ ] **Dissent surfaced** — any horse with 2+ external sources that we
      do not hold is called out prominently
- [ ] Key signals section written (4-6 bullets)
- [ ] Page registered in `FESTIVALS_2026[]` if new festival
- [ ] `netlify.toml` redirect added if new file
- [ ] Live banner wires up correctly on the hub on the day
- [ ] BeGambleAware footer present
- [ ] Mobile rendering checked at 375px
- [ ] Committed to feature branch, merged to `main` only with user
      authorization

---

## 12. RACECARD ACQUISITION — how to get a gateable card

Added 18 Aug 2026 (Ebor). Three routes were tried for one card; only one
worked. Try them in this order and stop at the first that yields draws.

### 1 · Pasted Racing Post racecard — **the primary route**

Ask for this by name: *"paste the Racing Post racecard for <course>,
<date>"*. One paste per day carries **everything the pre-flight gate and
the display contract need**, which no other source does:

- Going line with **GoingStick** and per-strip readings
  (`Far Side / Centre / Stands' Side`), watering and weather
- Per race: off time, full sponsored name, class, age band, prize,
  **runner count**, exact distance, going, TV channel and
  **`(STALLS Inside/Centre/Outside)`**
- Race conditions, penalty values **1st–6th** (this is where the real
  place count comes from — see below), entries and the long handicap
- Per runner: cloth number, **draw in parentheses**, horse, days since
  last run, headgear, colour/sex, age, weight, jockey, **trainer with
  strike rate**, odds, **OR / TS / RPR**, form figures and
  **CD / C / D / BF** flags
- The **Betting Forecast** line — a full-field price list, which is the
  baseline for calling STEAM or DRIFT later
- The Racing Post **VERDICT** with the named tipster — a free tipster
  column, already per-race

Parsing notes (learned the hard way):

| In the text | Means |
|---|---|
| `9 (4) Toca Madera` | cloth 9, **draw 4** |
| `Warren Fentiman(3)` | jockey's claim is 3lb |
| `Hugo Palmer 54%` | trainer's recent strike rate |
| `9st 4lb5ex` | carrying a 5lb penalty |
| `CD` / `C` / `D` / `BF` | course-and-distance / course / distance winner, beaten favourite |
| `HC1` | first run in a handicap |
| `1Rossa Ryan` / `2Faye Bramley` | leading-count marker, **not** part of the name |
| `Penalty value 1st…6th` | **prize money** paid down to 6th — racecourse money, **not** each-way places |

**Do not read each-way terms off the racecard — it does not carry them.**
The `Penalty value` list is the racecourse's prize-money breakdown and has
nothing to do with what a bookmaker pays each-way. The Ebor Thursday card
makes this obvious: Harry's Half Million pays prize money **down to 10th**,
and no bookmaker offers ten each-way places on a 2yo sales race.

Each-way terms come from the **bookmaker** (Sky Bet by default) and must be
read off the actual offer at the time of pricing, then **re-checked at the
off** because withdrawals can drop the band (rule 16). `PLACE_BANDS` in
`gate-check.mjs` encodes Sky Bet's standard ladder and is explicitly a
**floor, not the answer** — heritage handicaps carry one-off specials above
it (the Stewards' Cup paid 7). The racecard tells you the field size, which
is what drives the band; the bookmaker tells you the band.

### 2 · WebSearch — partial, useful when nothing else is available

`WebSearch` is generally reachable even when direct fetching is not. It
reliably returns **race names, off-times, field sizes and the going**, and
sometimes a full declared field with jockeys. It does **not** return
draws, so it cannot clear the gate on its own — but field sizes alone are
enough to compute each-way terms, the LONG gate and place-band risk, which
is a genuinely useful partial card.

`WebFetch` is blocked for racing sites (racingpost.com, sportinglife.com
both return `EGRESS_BLOCKED`), so do not burn turns on it.

### 3 · The Racing API — best when reachable, usually isn't

`scripts/gate-check.mjs --course <x> --day tomorrow` is still the ideal
path and stays the documented one. It needs **both**:

1. `RACING_API_USERNAME` / `RACING_API_PASSWORD` exported in the shell —
   Netlify env vars do not reach it
2. **network egress to `api.theracingapi.com`** — blocked by default in a
   Claude Code web session, and the deployed Netlify proxy is blocked too,
   so it cannot be used as a way round

A 403 here is ambiguous and the client now says which kind it is. If the
message names the egress proxy, do not touch the credentials — the host
needs allowing in the environment's network egress settings.

### Gate anything you get, whatever the source

Whichever route produced the data, **run it through the real gate rather
than eyeballing it**. Build a fixture in the API's payload shape and
replay it:

```js
{ "racecards": [ { "off_time":"13:50", "course":"York", "race_name":"…",
  "distance_f":5.4, "race_class":2, "type":"Flat", "going":"Good",
  "field_size":22, "runners":[ {"horse":"…","draw":17}, … ] } ] }
```

```sh
node scripts/gate-check.mjs --fixture <file>
```

It computes each-way terms, LONG open/closed and place-band risk
mechanically. Two rules about fixtures:

- **Set `draw` to `null` when you genuinely do not have it.** The gate
  then reports "N runner(s) without a draw" and fails the race, which is
  correct. Never invent a stall to make a race pass.
- **Keep hand-built fixtures out of `data/racing-api/`.** That directory
  is documented as raw API payloads and is the only history backfill
  there is; putting a web-sourced or hand-built file in it corrupts the
  archive. Use a scratch path and say on the card where the data came
  from.

