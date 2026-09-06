/* Festival Form Book — share card wiring.
 *
 * Reads the day sections a festival page already renders and puts a "Share
 * this day" button on each one. Nothing here is festival-specific: it works
 * off the display contract in CLAUDE.md §4, which every card on this hub is
 * built to —
 *
 *   section[id=dayN] / section[id=dN]   one race day
 *   .panel-head                         its title
 *   .race-block > .race-hd              "13:50 · Race Name · 7f · 20 rnrs · …"
 *   .pick-row                           .pick-tag .pick-horse .draw-b .pick-odds
 *
 * READING THE PAGE RATHER THAN A DATA FILE IS THE POINT. A card built from a
 * separate copy of the picks would be a second source of truth, and the first
 * time someone corrected an odds on the page — which happened three times at
 * Ebor alone — the card would quietly keep exporting the old one. This way a
 * card cannot say something the page does not.
 *
 * It also means a page needs no markup changes to gain share cards: include
 * the two scripts and every day that follows the contract gets a button.
 */
(function () {
  'use strict';

  if (typeof document === 'undefined') return;

  var S = window.FMBShare;
  if (!S) return;

  /* Which festival we are on. `data-fest` on <body> wins so a page can be
     explicit; otherwise the filename is the slug, which is the file-naming
     convention in CLAUDE.md §4. */
  function festSlug() {
    var b = document.body && document.body.getAttribute('data-fest');
    if (b) return b;
    var f = (location.pathname.split('/').pop() || '').replace(/\.html?$/i, '');
    return f || 'index';
  }

  function txt(el) {
    return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '';
  }

  /* "13:50 · Sky Bet Mile Handicap (Heritage) · 7f192y · 20 rnrs · EW 1/5 5pl · …"
     Every page in the hub writes the race line this way, so one parser does
     the lot. Anything after the name is squeezed into a short right-hand meta
     — distance and field size are what a reader actually wants there. */
  function parseRaceHead(s) {
    var bits = s.split('·').map(function (t) { return t.trim(); }).filter(Boolean);
    var time = '', name = '', rest = bits;
    if (bits.length && /^\d{1,2}[:.]\d{2}$/.test(bits[0])) { time = bits[0].replace('.', ':'); rest = bits.slice(1); }
    if (rest.length) { name = rest[0]; rest = rest.slice(1); }
    var dist = rest.find(function (t) { return /^\d+(m|f)/i.test(t); }) || '';
    var rnrs = rest.find(function (t) { return /\d+\s*(rnrs|runners)/i.test(t); }) || '';
    var meta = [dist, rnrs.replace(/runners/i, 'rnrs')].filter(Boolean).join(' · ');
    return { time: time, name: name, meta: meta };
  }

  /* A pick row, or null for the rows that are not picks — the NO BET gate rows
     and the Lucky 15 legs. The gate rows must not become picks on a card: a
     race that printed NO BET is the one thing a share card really must not
     misrepresent. */
  function parsePick(row) {
    var tag = txt(row.querySelector('.pick-tag')).toUpperCase();
    if (!tag || tag === 'GATE' || tag === 'L15') return null;
    var horse = txt(row.querySelector('.pick-horse'));
    if (!horse || /^NO BET/i.test(horse)) return null;
    var drawEl = row.querySelector('.draw-b');
    var draw = drawEl ? txt(drawEl).replace(/^draw\s*/i, '') : '';
    return {
      tag: tag,
      horse: horse,
      draw: draw,
      odds: txt(row.querySelector('.pick-odds')),
      result: row.getAttribute('data-result') || ''
    };
  }

  function racesIn(section) {
    var out = [];
    section.querySelectorAll('.race-block').forEach(function (blk) {
      var hd = blk.querySelector('.race-hd');
      if (!hd) return;
      var picks = [];
      blk.querySelectorAll('.pick-row').forEach(function (r) {
        var p = parsePick(r); if (p) picks.push(p);
      });
      var head = parseRaceHead(txt(hd));
      /* The Lucky 15 panel is a `.race-block` too, and its head is a heading
         rather than a race line. Requiring an off-time is what separates them:
         without this the L15 rides onto every card as a phantom eighth race
         with no selections. */
      if (!head.time) return;
      /* A block with a race line but no picks IS a race — one that printed
         NO BET. It stays on the card as a row with no selections rather than
         vanishing: "we did not bet this" is information, and dropping it would
         overstate coverage. */
      out.push({ time: head.time, name: head.name, meta: head.meta, picks: picks });
    });
    return out;
  }

  /* Day sections, in page order. Two id schemes are in use across the hub —
     `day1…day4` on most pages and `d1…d5` on Royal Ascot — and the settlement
     panels (`day3-results`) must not be mistaken for a day's card. */
  function daySections() {
    var all = Array.prototype.slice.call(
      document.querySelectorAll('section[id^="day"], section[id^="d"]'));
    return all.filter(function (s) {
      return /^(day\d+|d\d+)$/.test(s.id) && s.querySelector('.race-block');
    });
  }

  /* The settlement panel that belongs to a day, if the day has run. Matches the
     `dayN-results` convention; the totals are read out of its `.pl-box` so the
     card and the page cannot disagree about the money. */
  function settledFor(section) {
    var res = document.getElementById(section.id + '-results');
    if (!res) return null;
    var box = res.querySelector('.pl-box');
    if (!box) return null;
    var t = txt(box);
    /* The sign class MUST include '+'. Without it a profitable day fails to
       match its own line and the regex runs on to the next "staked … returned
       … net …" in the same box — which on a settled page is the festival
       total. Caught at Haydock, where Day 3's card showed the meeting's
       −£0.74 instead of the day's +£2.50. */
    var m = t.match(/staked\s*£([\d.]+)\s*·?\s*returned\s*£([\d.]+)\s*·?\s*net\s*([+−-]?\s*£[\d.]+)\s*\(([^)]+)\)/i);
    if (!m) return null;
    return { staked: '£' + m[1], returned: '£' + m[2], net: m[3].replace(/\s+/g, '').replace('-', '−'), roi: m[4] };
  }

  /* Per-pick results for a settled day, read off the settlement panel's own
     semantic spans: `.res-w` won, `.res-p` placed, `.res-v` void/non-runner.
     The class carries the outcome and the horse name sits inside it, so this
     is a lookup rather than a guess at prose.

     NOT EVERY PAGE SUPPORTS THIS, and that is fine. Ebor's panels name the
     horse and its slot inside the span ("Blue Courvoisier (NAP) 17/2 WON"),
     so the lookup is exact. Goodwood's older panels put only the outcome in
     the span ("LONG, WON") with the horse elsewhere in the row — nothing
     matches, nothing is badged, and the card still shows the picks as priced.
     Matching those by prose is precisely the guesswork this avoids.

     ONLY those three are badged. A pick that appears in no result span gets no
     badge at all rather than "unpl", because across this festival a great many
     finishing positions were never published — the settlement panels settle
     those as unplaced for money while saying so explicitly, and a share card
     has no room for that caveat. Stamping "unpl" on a horse that may have run
     fourth is a claim the page itself does not make. */
  function resultsFor(section) {
    var res = document.getElementById(section.id + '-results');
    var map = {};
    if (!res) return map;
    res.querySelectorAll('.res-w, .res-p, .res-v').forEach(function (sp) {
      var t = txt(sp);
      var kind = sp.className.indexOf('res-w') >= 0 ? 'WON'
               : sp.className.indexOf('res-v') >= 0 ? 'NR' : 'PLACED';
      /* One span can name two horses ("Point Lynas (NAP) and Aalto (NB) BOTH
         NON-RUNNERS"), so match every horse in it rather than assuming one. */
      var re = /([A-Z][A-Za-z'’\u2019.-]*(?:\s+[A-Z][A-Za-z'’\u2019.-]*)*)\s*\((NAP|NB|LONG)\)/g, m;
      while ((m = re.exec(t))) {
        var pos = kind;
        if (kind === 'PLACED') {
          var after = t.slice(m.index).match(/\b(\d(?:st|nd|rd|th))\b/);
          if (after) pos = after[1];
        }
        map[m[1].trim().toLowerCase()] = pos;
      }
    });
    return map;
  }

  function statsFor(races, settled) {
    var picks = races.reduce(function (n, r) { return n + r.picks.length; }, 0);
    var priced = races.filter(function (r) { return r.picks.length; }).length;
    var out = [
      { value: String(races.length), label: races.length === 1 ? 'race' : 'races' },
      { value: String(picks), label: 'picks' }
    ];
    if (priced !== races.length) out.push({ value: String(races.length - priced), label: 'no bet' });
    out.push({ value: '£' + (picks * 1).toFixed(2), label: 'singles outlay' });
    return out;
  }

  function dayTitle(section) {
    var h = txt(section.querySelector('.panel-head'));
    /* Panel heads carry an emoji and a trailing gate/pick summary. Keep the
       part that names the day and drop the decoration — a card title has to
       read at thumbnail size. */
    h = h.replace(/^[^A-Za-z0-9]+/, '');
    var cut = h.split('·').map(function (s) { return s.trim(); }).filter(Boolean);
    return cut.slice(0, 2).join(' · ') || (section.id.toUpperCase() + ' card');
  }

  function daySubtitle(section) {
    var h = txt(section.querySelector('.panel-head'));
    var cut = h.split('·').map(function (s) { return s.trim(); }).filter(Boolean);
    var tail = cut.slice(2).filter(function (s) { return !/gated|picks|overlaid|columns/i.test(s); });
    var venue = (document.body && document.body.getAttribute('data-venue')) || '';
    return [tail.join(' · '), venue].filter(Boolean).join(' · ');
  }

  function build(section) {
    var races = racesIn(section);
    var settled = settledFor(section);
    var results = resultsFor(section);
    races.forEach(function (r) {
      r.picks.forEach(function (p) {
        var hit = results[p.horse.toLowerCase()];
        if (hit) p.result = hit;
      });
    });
    return {
      fest: festSlug(),
      title: dayTitle(section),
      subtitle: daySubtitle(section),
      stats: statsFor(races, settled),
      races: races,
      settled: settled,
      note: settled
        ? 'Settled at the prices shown · 50p each-way singles'
        : 'Selections as priced · 50p each-way · not a guarantee'
    };
  }

  /* Shared so the button cannot disagree with itself about what it is doing
     while it works, or forget to re-enable after a render throws. */
  function working(btn, promise, filename, text) {
    var label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Building…';
    promise
      .then(function (b) { return S.shareOrDownload(b, filename, text); })
      .catch(function (e) { console.error('[fmb-share]', e); btn.textContent = 'Card failed'; })
      .then(function () {
        setTimeout(function () { btn.disabled = false; btn.textContent = label; }, 600);
      });
  }

  function mount() {
    var sections = daySections();
    if (!sections.length) return;

    var css = document.createElement('style');
    css.textContent =
      '.fmb-share-row{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px}' +
      '.fmb-share-btn{font:600 0.74rem/1 Inter,system-ui,sans-serif;padding:8px 14px;border-radius:20px;' +
      'border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.06);color:#f5f5f4;' +
      'cursor:pointer;transition:background .15s,border-color .15s}' +
      '.fmb-share-btn:hover:not(:disabled){background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.32)}' +
      '.fmb-share-btn:disabled{opacity:.6;cursor:default}' +
      '@media print{.fmb-share-row{display:none}}';
    document.head.appendChild(css);

    sections.forEach(function (section) {
      var row = document.createElement('div');
      row.className = 'fmb-share-row';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fmb-share-btn';
      btn.textContent = '📷 Share this day';
      btn.setAttribute('aria-label', 'Download a share card for ' + dayTitle(section));
      btn.addEventListener('click', function () {
        var spec = build(section);
        var name = S.slug(festSlug() + '-' + section.id) + '.png';
        working(btn, S.dayCard(spec), name, spec.title + ' — ' + spec.subtitle);
      });
      row.appendChild(btn);

      var head = section.querySelector('.panel-head');
      if (head && head.nextSibling) section.insertBefore(row, head.nextSibling);
      else section.appendChild(row);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
