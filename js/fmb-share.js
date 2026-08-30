/* Festival Form Book — share cards.
 *
 * One card per race day: the picks as they were priced, and — once the day is
 * settled — how they ran. Built for the places a card actually gets sent:
 * 1080×1350, the portrait 4:5 that Instagram, X and WhatsApp all crop kindly.
 *
 * ONE IMPLEMENTATION, MANY FESTIVALS. Every festival page in this hub is built
 * to the same display contract (CLAUDE.md §4) — `.race-hd` for the race line,
 * `.pick-row` with `.pick-tag` / `.pick-horse` / `.draw-b` / `.pick-odds` for
 * the picks. That contract is what makes a single card generator possible, so
 * this file reads a plain spec object and knows nothing about any one meeting.
 * Festivals differ by a THEME and by what the adapter hands over. Copying a
 * canvas exporter into twelve festival pages would guarantee twelve cards that
 * drift apart the first time anyone changes a colour.
 *
 * NO NETWORK, NO DEPENDENCIES. It draws from data already on the page and
 * returns a Blob. A share card that needed a fetch would fail exactly when
 * someone wanted it.
 *
 * ---------------------------------------------------------------------------
 * THE COLOURS BELOW ARE A COPY, and the only copy of the palette a stylesheet
 * cannot supply — this draws to a canvas, where var(--eb) means nothing. They
 * are pinned to `FESTIVALS_2026[].accentColor` in js/season-data-2026.js by
 * scripts/check-share-palette.mjs, which fails if the two ever disagree.
 *
 * Without that guard this file is exactly where a rebrand goes unnoticed: a
 * share card is the one artefact that LEAVES the site, so nobody who sees one
 * can hold it against the page it came from.
 * ---------------------------------------------------------------------------
 */
(function (root) {
  'use strict';

  var W = 1080, H = 1350, P = 64;
  var DISP = "'Playfair Display',Georgia,serif";
  var BODY = "'Inter',system-ui,sans-serif";

  /* `to` is the festival's own accentColor; `from` is a dark ground that keeps
     the white title legible on every one of them. `strap` runs above the title
     and `mark` sits bottom-right — together they are what makes a card
     recognisable at thumbnail size. */
  var THEMES = {
    'cheltenham-2026':              { from: '#06281a', to: '#2d7a4f', strap: 'FESTIVAL FORM BOOK · CHELTENHAM',        mark: 'CHELTENHAM 2026' },
    'grand-national-2026':          { from: '#3b0d0d', to: '#c0392b', strap: 'FESTIVAL FORM BOOK · GRAND NATIONAL',    mark: 'GRAND NATIONAL 2026' },
    'scottish-grand-national-2026': { from: '#171a4a', to: '#4338ca', strap: 'FESTIVAL FORM BOOK · SCOTTISH GN',       mark: 'SCOTTISH GN 2026' },
    'guineas-2026':                 { from: '#0b1f52', to: '#1d4ed8', strap: 'FESTIVAL FORM BOOK · GUINEAS',           mark: 'GUINEAS 2026' },
    'chester-2026':                 { from: '#3a2405', to: '#d97706', strap: 'FESTIVAL FORM BOOK · CHESTER MAY',       mark: 'CHESTER 2026' },
    'dante-2026':                   { from: '#241154', to: '#7c3aed', strap: 'FESTIVAL FORM BOOK · DANTE FESTIVAL',    mark: 'DANTE 2026' },
    'epsom-derby-2026':             { from: '#0b1f52', to: '#1d4ed8', strap: 'FESTIVAL FORM BOOK · EPSOM DERBY',       mark: 'EPSOM DERBY 2026' },
    'royal-ascot-2026':             { from: '#241154', to: '#7c3aed', strap: 'FESTIVAL FORM BOOK · ROYAL ASCOT',       mark: 'ROYAL ASCOT 2026' },
    'northumberland-plate-2026':    { from: '#042f2c', to: '#0d9488', strap: 'FESTIVAL FORM BOOK · N’LAND PLATE',      mark: 'N’LAND PLATE 2026' },
    'newmarket-july-2026':          { from: '#22330a', to: '#84cc16', strap: 'FESTIVAL FORM BOOK · NEWMARKET JULY',    mark: 'NEWMARKET JULY 2026' },
    'goodwood-2026':                { from: '#062b42', to: '#0ea5e9', strap: 'FESTIVAL FORM BOOK · GLORIOUS GOODWOOD', mark: 'GOODWOOD 2026' },
    'ebor-2026':                    { from: '#3d0716', to: '#e11d48', strap: 'FESTIVAL FORM BOOK · EBOR FESTIVAL',     mark: 'EBOR 2026' },
    'sprint-cup-2026':              { from: '#431407', to: '#f97316', strap: 'FESTIVAL FORM BOOK · SPRINT CUP',        mark: 'SPRINT CUP 2026' },
    'st-leger-2026':                { from: '#3f2d05', to: '#eab308', strap: 'FESTIVAL FORM BOOK · ST LEGER',          mark: 'ST LEGER 2026' },
    'ayr-gold-cup-2026':            { from: '#2e1065', to: '#a855f7', strap: 'FESTIVAL FORM BOOK · AYR GOLD CUP',      mark: 'AYR GOLD CUP 2026' },
    'cambridgeshire-2026':          { from: '#083344', to: '#0891b2', strap: 'FESTIVAL FORM BOOK · CAMBRIDGESHIRE',    mark: 'CAMBRIDGESHIRE 2026' }
  };
  var FALLBACK = { from: '#0a1428', to: '#fbbf24', strap: 'FESTIVAL FORM BOOK', mark: 'FESTIVAL FORM BOOK' };

  function theme(slug) { return THEMES[slug] || FALLBACK; }

  /* Slot colours match the page: gold NAP, blue NB, pink LONG (CLAUDE.md §4). */
  var SLOT = { NAP: '#b8860b', NB: '#2563eb', LONG: '#db2777', L15: '#b8860b', GATE: '#6b7280' };
  function slotHex(tag) { return SLOT[String(tag || '').toUpperCase()] || '#6b7280'; }

  /* Result colouring. Anything we could not confirm reads muted rather than
     red — an unconfirmed finishing position is not the same claim as "beaten",
     and the settlement panels on the site are careful about that distinction. */
  function resultHex(r) {
    var t = String(r || '').toUpperCase();
    if (t === 'WON') return '#15803d';
    if (/^(2ND|3RD|4TH|5TH|PLACED)$/.test(t)) return '#2563eb';
    if (t === 'NR' || t === 'NON-RUNNER') return '#6b7280';
    return '#94a3b8';
  }

  /* ---- primitives ------------------------------------------------------- */

  /* CLAMPED. arcTo does not bound its radius: hand it 999 for a pill and it
     sweeps arcs outside the rectangle, painting a swirl across the card rather
     than failing. Half the shorter side is the largest radius a rectangle can
     have, so 999 now means "fully round" exactly as a caller would expect. */
  function roundRect(x, a, b, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    x.beginPath();
    x.moveTo(a + r, b);
    x.arcTo(a + w, b, a + w, b + h, r);
    x.arcTo(a + w, b + h, a, b + h, r);
    x.arcTo(a, b + h, a, b, r);
    x.arcTo(a, b, a + w, b, r);
    x.closePath();
  }

  /* Truncates to fit and appends an ellipsis only if it actually cut. A horse
     name that fits must not gain a "…" — that reads as missing data. */
  function fit(x, text, max) {
    var t = String(text == null ? '' : text);
    if (max <= 0) return '';
    if (x.measureText(t).width <= max) return t;
    while (t.length > 1 && x.measureText(t + '…').width > max) t = t.slice(0, -1);
    return t + '…';
  }

  /* The brand mark: a horseshoe, drawn rather than loaded so a card never
     waits on an image that may not arrive. */
  function drawMark(x, cx, cy, h) {
    var r = h * 0.36;
    x.save();
    x.translate(cx, cy);
    x.strokeStyle = 'rgba(255,255,255,.92)';
    x.lineWidth = h * 0.17;
    x.lineCap = 'round';
    x.beginPath();
    x.arc(0, 0, r, Math.PI * 0.82, Math.PI * 0.18, false);
    x.stroke();
    x.fillStyle = 'rgba(255,255,255,.92)';
    [-1, 1].forEach(function (s) {
      x.beginPath();
      x.arc(s * r * 0.80, r * 0.56, h * 0.085, 0, Math.PI * 2);
      x.fill();
    });
    x.restore();
  }

  function pill(x, label, a, b, hgt, bg, fg, font) {
    x.font = font;
    var w = x.measureText(label).width + 22;
    x.fillStyle = bg;
    roundRect(x, a, b, w, hgt, hgt / 2); x.fill();
    x.fillStyle = fg;
    x.textAlign = 'center';
    x.fillText(label, a + w / 2, b + hgt * 0.72);
    x.textAlign = 'left';
    return w;
  }

  function brandBand(x, th, title, subtitle) {
    var g = x.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, th.from); g.addColorStop(1, th.to);
    x.fillStyle = g; x.fillRect(0, 0, W, 168);
    drawMark(x, W - P - 34, 84, 92);
    x.fillStyle = 'rgba(255,255,255,.82)'; x.font = '700 21px ' + BODY;
    x.fillText(fit(x, th.strap, W - P - 170), P, 64);
    x.fillStyle = '#ffffff'; x.font = '700 46px ' + DISP;
    x.fillText(fit(x, title, W - P - 170), P, 124);
    x.fillStyle = '#475569'; x.font = '600 22px ' + BODY;
    x.fillText(fit(x, subtitle || '', W - 2 * P), P, 208);
  }

  function statBand(x, th, stats, y) {
    var n = stats.length; if (!n) return y;
    var gap = 12, w = (W - 2 * P - gap * (n - 1)) / n;
    stats.forEach(function (s, i) {
      var cx = P + i * (w + gap);
      x.fillStyle = '#f4f6fa'; roundRect(x, cx, y, w, 78, 13); x.fill();
      x.fillStyle = s.hex || th.to; x.font = '700 30px ' + DISP;
      x.textAlign = 'center';
      x.fillText(fit(x, String(s.value), w - 16), cx + w / 2, y + 40);
      x.fillStyle = '#8b94a5'; x.font = '600 14px ' + BODY;
      x.fillText(fit(x, s.label, w - 12), cx + w / 2, y + 62);
      x.textAlign = 'left';
    });
    return y + 78;
  }

  /* The settled strip. Only drawn for a day that has actually run — a card for
     an unraced day must not imply a result. */
  function settledStrip(x, th, s, y) {
    var neg = /^[−-]/.test(String(s.net));
    x.fillStyle = neg ? '#fef2f2' : '#f0fdf4';
    roundRect(x, P, y, W - 2 * P, 92, 14); x.fill();
    x.fillStyle = neg ? '#dc2626' : '#15803d';
    roundRect(x, P, y, 6, 92, 3); x.fill();
    x.fillStyle = '#64748b'; x.font = '700 15px ' + BODY;
    x.fillText('SETTLED', P + 26, y + 28);
    var cells = [
      ['Staked', s.staked, '#334155'],
      ['Returned', s.returned, '#334155'],
      ['Net', s.net, neg ? '#dc2626' : '#15803d'],
      ['ROI', s.roi, neg ? '#dc2626' : '#15803d']
    ].filter(function (c) { return c[1] != null && c[1] !== ''; });
    var cw = (W - 2 * P - 26) / cells.length;
    cells.forEach(function (c, i) {
      var cx = P + 26 + i * cw;
      x.fillStyle = '#8b94a5'; x.font = '600 14px ' + BODY;
      x.fillText(c[0], cx, y + 54);
      x.fillStyle = c[2]; x.font = '700 30px ' + DISP;
      x.fillText(fit(x, String(c[1]), cw - 14), cx, y + 84);
    });
    return y + 92;
  }

  function footer(x, th, note) {
    /* The 18+ / BeGambleAware line is drawn FIRST and never truncated; the
       explanatory note takes whatever room is left. Trimming the tail instead
       is what cuts "begambleaware.org" off a long-noted card — the one piece
       of text here that is never allowed to be the part that gives way. It is
       also a compliance requirement on every page in this hub. */
    x.font = '700 20px ' + DISP;
    var markW = x.measureText(th.mark).width;
    var fixed = '18+ · begambleaware.org';
    x.fillStyle = '#8b94a5'; x.font = '600 18px ' + BODY;
    x.fillText(fixed, P, H - 46);
    var used = x.measureText(fixed + ' · ').width;
    var room = W - 2 * P - markW - 24 - used;
    if (room > 60) {
      x.fillStyle = '#a8b0be';
      x.fillText(fit(x, note || '', room), P + used, H - 46);
    }
    x.fillStyle = th.to; x.font = '700 20px ' + DISP;
    x.textAlign = 'right'; x.fillText(th.mark, W - P, H - 46); x.textAlign = 'left';
  }

  function canvas() {
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var x = c.getContext('2d');
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);
    x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    return { c: c, x: x };
  }

  function ready() {
    try {
      if (document.fonts && document.fonts.ready) return document.fonts.ready;
    } catch (e) { /* a browser without the font API just draws sooner */ }
    return Promise.resolve();
  }

  function toBlob(c) {
    return new Promise(function (res) { c.toBlob(res, 'image/png'); });
  }

  /* ---- the day card ------------------------------------------------------ */
  /*
   * spec = {
   *   fest:      'ebor-2026',                       // picks the theme
   *   title:     'Day 3 · Nunthorpe day',
   *   subtitle:  'Friday 21 August 2026 · York',
   *   stats:     [{ value, label, hex }],           // 0–5 of them
   *   races:     [{ time, name, meta, picks:[{ tag, horse, draw, odds, result }] }],
   *   settled:   { staked, returned, net, roi },    // omit for an unraced day
   *   note:      '…'
   * }
   *
   * Rows are sized to the day rather than fixed: a six-race card breathes and
   * an eight-race card compresses, which beats a fixed height that either
   * leaves half the card empty or runs the last race off the bottom. Beyond
   * what will fit, the card SAYS how many races it dropped — a silent slice
   * reads as "that was the whole day" when it was not.
   */
  function dayCard(spec) {
    return ready().then(function () {
      var th = theme(spec.fest), k = canvas(), x = k.x;
      brandBand(x, th, spec.title, spec.subtitle);

      var y = 236;
      if (spec.stats && spec.stats.length) y = statBand(x, th, spec.stats, y) + 22;

      /* Work back from the bottom so the settled strip and footer always have
         their room, whatever the race count does. */
      var bottom = H - 96;
      if (spec.settled) bottom -= 106;

      var races = (spec.races || []).slice();
      var room = bottom - y;
      var MIN_ROW = 86;
      var shown = races.length;
      if (races.length && room / races.length < MIN_ROW) {
        shown = Math.max(1, Math.floor(room / MIN_ROW));
      }
      var dropped = races.length - shown;
      if (dropped > 0) races = races.slice(0, shown);

      if (!races.length) {
        x.fillStyle = '#586275'; x.font = '600 24px ' + BODY;
        x.fillText('No priced races on this card.', P, y + 40);
      }

      var rowH = races.length ? Math.min(150, room / races.length) : 0;

      races.forEach(function (r, i) {
        var ry = y + i * rowH;
        if (i % 2 === 0) {
          x.fillStyle = '#f7f9fc';
          roundRect(x, P - 16, ry, W - 2 * (P - 16), rowH - 8, 14); x.fill();
        }

        /* race line */
        x.fillStyle = th.to; x.font = '700 24px ' + DISP;
        x.fillText(r.time || '', P, ry + 30);
        var nameX = P + 78;
        x.fillStyle = '#0c1322'; x.font = '700 22px ' + DISP;
        var metaW = 0;
        if (r.meta) { x.font = '600 15px ' + BODY; metaW = x.measureText(r.meta).width + 18; }
        x.font = '700 22px ' + DISP;
        x.fillText(fit(x, r.name || '', W - P - nameX - metaW), nameX, ry + 30);
        if (r.meta) {
          x.fillStyle = '#94a3b8'; x.font = '600 15px ' + BODY;
          x.textAlign = 'right'; x.fillText(r.meta, W - P, ry + 29); x.textAlign = 'left';
        }

        /* picks */
        var picks = (r.picks || []).slice(0, 3);
        var ph = picks.length ? Math.min(30, (rowH - 46) / picks.length) : 0;
        picks.forEach(function (p, j) {
          var py = ry + 44 + j * ph, base = py + ph * 0.7;
          var tag = String(p.tag || '').toUpperCase();
          var col = slotHex(tag);

          x.font = '700 13px ' + BODY;
          var tw = Math.max(46, x.measureText(tag).width + 18);
          x.globalAlpha = 0.14; x.fillStyle = col;
          roundRect(x, P + 4, py + 2, tw, ph - 7, 5); x.fill();
          x.globalAlpha = 1; x.fillStyle = col;
          x.textAlign = 'center'; x.fillText(tag, P + 4 + tw / 2, base - 3); x.textAlign = 'left';

          var hx = P + 4 + tw + 12;

          /* odds are pinned right; the result pill sits just inside them, and
             the horse name is the piece that gives way. */
          var rightEdge = W - P;
          x.font = '700 21px ' + DISP;
          var oddsW = p.odds ? x.measureText(p.odds).width : 0;
          var resW = 0;
          if (p.result) { x.font = '700 13px ' + BODY; resW = x.measureText(p.result).width + 30; }

          x.font = '700 20px ' + DISP;
          x.fillStyle = '#0c1322';
          var drawTxt = p.draw ? '  (' + p.draw + ')' : '';
          x.font = '600 14px ' + BODY;
          var drawW = drawTxt ? x.measureText(drawTxt).width : 0;
          x.font = '700 20px ' + DISP;
          var nameRoom = rightEdge - hx - oddsW - resW - drawW - 26;
          var shownName = fit(x, p.horse || '', nameRoom);
          x.fillText(shownName, hx, base - 2);
          if (drawTxt) {
            var after = hx + x.measureText(shownName).width;
            x.fillStyle = '#94a3b8'; x.font = '600 14px ' + BODY;
            x.fillText(drawTxt, after, base - 2);
          }

          if (p.result) {
            var rc = resultHex(p.result);
            x.globalAlpha = 0.13; x.fillStyle = rc;
            x.font = '700 13px ' + BODY;
            var rw = x.measureText(p.result).width + 20;
            roundRect(x, rightEdge - oddsW - 14 - rw, py + 3, rw, ph - 9, 5); x.fill();
            x.globalAlpha = 1; x.fillStyle = rc;
            x.textAlign = 'center';
            x.fillText(p.result, rightEdge - oddsW - 14 - rw / 2, base - 4);
            x.textAlign = 'left';
          }

          if (p.odds) {
            x.fillStyle = '#0c1322'; x.font = '700 21px ' + DISP;
            x.textAlign = 'right'; x.fillText(p.odds, rightEdge, base - 2); x.textAlign = 'left';
          }
        });
      });

      if (dropped > 0) {
        x.fillStyle = '#94a3b8'; x.font = '600 17px ' + BODY;
        x.fillText('+ ' + dropped + ' more race' + (dropped > 1 ? 's' : '') +
                   ' on the card — see the full day online', P, bottom + 26);
      }

      if (spec.settled) settledStrip(x, th, spec.settled, H - 190);
      footer(x, th, spec.note || 'Selections as priced · 50p each-way');
      return toBlob(k.c);
    });
  }

  /* ---- delivery ---------------------------------------------------------- */

  function slug(s) {
    return String(s || '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'card';
  }

  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  /* Uses the native share sheet where there is one — on a phone that is the
     whole point of the card — and falls back to a download everywhere else.
     Feature-detects canShare with the actual file: Safari advertises share()
     but rejects files, and finding that out after the card is built means the
     user taps once and gets nothing. */
  function shareOrDownload(blob, name, text) {
    var file = null;
    try { file = new File([blob], name, { type: 'image/png' }); } catch (e) { /* older browsers */ }
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      return navigator.share({ files: [file], text: text || '' })
        .catch(function () { /* a cancelled share is not a failure */ });
    }
    download(blob, name);
    return Promise.resolve();
  }

  root.FMBShare = {
    W: W, H: H, PAD: P,
    THEMES: THEMES, theme: theme,
    dayCard: dayCard,
    download: download, shareOrDownload: shareOrDownload, slug: slug,
    slotHex: slotHex, resultHex: resultHex, roundRect: roundRect, fit: fit
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
