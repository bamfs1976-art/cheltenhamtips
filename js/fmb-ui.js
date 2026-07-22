/* ============================================================
   Festival Form Book — shared UI behaviour (fmb-ui.js)
   Progressive enhancement for the static site. No dependencies.
   Exposes window.FMB with helpers used by page-level scripts.
   ============================================================ */
(function () {
  'use strict';

  /* Nav registry — presentation config only (names/urls/status/type).
     Status is explicit so the nav matches how the hub frames each
     festival, independent of the wall clock. Results/business data
     stay in season-data-2026.js and are never duplicated here. */
  var FESTIVALS = [
    { name: 'Newmarket July Festival', short: 'Newmarket July', url: 'newmarket-july-2026.html', type: 'flat',  status: 'live',     date: '9–11 Jul 2026', sort: '2026-07-09', venue: 'Newmarket (July Course)' },
    { name: 'Cheltenham Festival 2027', short: 'Cheltenham 2027', url: 'cheltenham-2027.html',    type: 'jumps', status: 'upcoming', date: '9–12 Mar 2027', sort: '2027-03-09', venue: 'Cheltenham' },
    { name: 'Northumberland Plate',     short: 'Northumberland Plate', url: 'northumberland-plate-2026.html', type: 'flat',  status: 'archive', date: '25–27 Jun 2026', sort: '2026-06-25', venue: 'Newcastle' },
    { name: 'Royal Ascot 2026',         short: 'Royal Ascot',   url: 'royal-ascot-2026.html',   type: 'flat',  status: 'archive', date: '16–20 Jun 2026', sort: '2026-06-16', venue: 'Ascot' },
    { name: 'Epsom Derby 2026',         short: 'Epsom Derby',   url: 'epsom-derby-2026.html',   type: 'flat',  status: 'archive', date: '5–6 Jun 2026',   sort: '2026-06-05', venue: 'Epsom Downs' },
    { name: 'Dante Festival 2026',      short: 'Dante',         url: 'dante-2026.html',         type: 'flat',  status: 'archive', date: '13–15 May 2026', sort: '2026-05-13', venue: 'York' },
    { name: '2000/1000 Guineas 2026',   short: 'Guineas',       url: 'guineas-2026.html',       type: 'flat',  status: 'archive', date: '2–3 May 2026',   sort: '2026-05-02', venue: 'Newmarket' },
    { name: 'Chester May Festival 2026',short: 'Chester',       url: 'chester-2026.html',       type: 'flat',  status: 'archive', date: '6–8 May 2026',   sort: '2026-05-06', venue: 'Chester' },
    { name: 'Scottish Grand National',  short: 'Scottish GN',   url: 'scottish-grand-national-2026.html', type: 'jumps', status: 'archive', date: '17–18 Apr 2026', sort: '2026-04-17', venue: 'Ayr' },
    { name: 'Grand National Festival',  short: 'Aintree GN',    url: 'grand-national-2026.html', type: 'jumps', status: 'archive', date: '9–11 Apr 2026',  sort: '2026-04-09', venue: 'Aintree' },
    { name: 'Cheltenham Festival 2026', short: 'Cheltenham 2026', url: 'cheltenham-2026.html',  type: 'jumps', status: 'archive', date: '10–13 Mar 2026', sort: '2026-03-10', venue: 'Cheltenham' }
  ];

  var STATUS_LABEL = { live: 'Live', upcoming: 'Upcoming', archive: 'Concluded' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function byStatus(st) {
    return FESTIVALS.filter(function (f) { return f.status === st; })
      .sort(function (a, b) { return a.sort < b.sort ? -1 : 1; });
  }

  /* Which festival the "Next"/"Live" pill points at */
  function featuredFestival() {
    var live = byStatus('live')[0];
    if (live) return live;
    var up = byStatus('upcoming')[0];
    return up || null;
  }

  /* ── Build the grouped nav group lists + mobile sheet + pill ── */
  function buildNav() {
    var groups = { live: byStatus('live'), upcoming: byStatus('upcoming'), archive: byStatus('archive') };

    Object.keys(groups).forEach(function (st) {
      var host = document.querySelector('[data-mega-list="' + st + '"]');
      if (host) host.innerHTML = megaItems(groups[st], st);
      var acc = document.querySelector('[data-acc-list="' + st + '"]');
      if (acc) acc.innerHTML = megaItems(groups[st], st);
    });

    // "Next"/"Live" pill
    var feat = featuredFestival();
    document.querySelectorAll('[data-next-pill]').forEach(function (pill) {
      if (!feat) { pill.style.display = 'none'; return; }
      var lead = feat.status === 'live' ? 'Live' : 'Next';
      pill.href = feat.url;
      pill.innerHTML =
        '<span class="fmb-dot fmb-dot--' + feat.status + '" aria-hidden="true"></span>' +
        '<span>' + esc(lead) + ': ' + esc(feat.short) + '</span>' +
        '<span class="fmb-next-date">· ' + esc(feat.date) + '</span>';
    });
  }

  function megaItems(list, st) {
    if (!list.length) return '<p class="fmb-mega__empty">Nothing ' + esc(STATUS_LABEL[st].toLowerCase()) + ' right now.</p>';
    return list.map(function (f) {
      return '<a class="fmb-mega__item" href="' + esc(f.url) + '">' +
        '<span class="fmb-dot fmb-dot--' + st + '" aria-hidden="true"></span>' +
        '<span class="sr-only">' + esc(STATUS_LABEL[st]) + ':</span>' +
        '<span class="fmb-mega__name">' + esc(f.short) + '</span>' +
        '<span class="fmb-mega__label">' + esc(f.date) + '</span></a>';
    }).join('');
  }

  /* ── Mega-menu open/close (desktop) ─────────────────────── */
  function wireMega() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.fmb-tab[aria-controls]'));
    function closeAll(except) {
      tabs.forEach(function (t) {
        if (t === except) return;
        t.setAttribute('aria-expanded', 'false');
        var m = document.getElementById(t.getAttribute('aria-controls'));
        if (m) m.hidden = true;
      });
    }
    tabs.forEach(function (tab) {
      var mega = document.getElementById(tab.getAttribute('aria-controls'));
      tab.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = tab.getAttribute('aria-expanded') === 'true';
        closeAll(open ? null : tab);
        tab.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (mega) mega.hidden = open;
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.fmb-mega') && !e.target.closest('.fmb-tab')) closeAll(null);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeAll(null); closeSheet(); closeSearch(); }
    });
  }

  /* ── Mobile sheet + accordion ───────────────────────────── */
  function closeSheet() {
    var sheet = document.getElementById('fmb-sheet');
    if (sheet) sheet.setAttribute('data-open', 'false');
    var b = document.querySelector('.fmb-burger');
    if (b) b.setAttribute('aria-expanded', 'false');
  }
  function wireSheet() {
    var burger = document.querySelector('.fmb-burger');
    var sheet = document.getElementById('fmb-sheet');
    if (!burger || !sheet) return;
    burger.addEventListener('click', function () {
      var open = sheet.getAttribute('data-open') === 'true';
      sheet.setAttribute('data-open', open ? 'false' : 'true');
      burger.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
    var closeBtn = sheet.querySelector('[data-sheet-close]');
    if (closeBtn) closeBtn.addEventListener('click', closeSheet);
    sheet.querySelectorAll('.fmb-acc__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (panel) panel.hidden = open;
      });
    });
  }

  /* ── Search stub ────────────────────────────────────────── */
  function closeSearch() {
    var pop = document.getElementById('fmb-search-pop');
    var btn = document.querySelector('[data-search-toggle]');
    if (pop) pop.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }
  function wireSearch() {
    var btn = document.querySelector('[data-search-toggle]');
    var pop = document.getElementById('fmb-search-pop');
    if (!btn || !pop) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !pop.hidden;
      pop.hidden = open;
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (!open) { var inp = pop.querySelector('input'); if (inp) inp.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.fmb-search')) closeSearch();
    });
  }

  /* ── Tooltip: Escape + tap-to-toggle on touch ───────────── */
  function wireTooltips() {
    document.querySelectorAll('.fmb-tip__btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.preventDefault(); });
    });
  }

  /* ── Email capture → /api/subscribe stub ────────────────── */
  function wireCapture() {
    document.querySelectorAll('form[data-capture]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = form.querySelector('input[type="email"]');
        var msg = form.parentNode.querySelector('.fmb-capture__msg');
        var email = (input && input.value || '').trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          if (msg) { msg.textContent = 'Please enter a valid email address.'; msg.className = 'fmb-capture__msg err'; }
          return;
        }
        if (msg) { msg.textContent = 'Signing you up…'; msg.className = 'fmb-capture__msg'; }
        fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, list: 'saturday-nap' })
        }).then(function (r) {
          if (msg) {
            if (r.ok) { msg.textContent = '✓ You’re in — the Saturday NAP lands by 9am.'; msg.className = 'fmb-capture__msg ok'; form.reset(); }
            else { msg.textContent = 'Something went wrong — please try again.'; msg.className = 'fmb-capture__msg err'; }
          }
        }).catch(function () {
          if (msg) { msg.textContent = 'Network error — please try again.'; msg.className = 'fmb-capture__msg err'; }
        });
      });
    });
  }

  /* ── Sparkline: inline SVG from a numeric series ────────── */
  function sparkline(values, opts) {
    opts = opts || {};
    var w = opts.w || 72, h = opts.h || 20, pad = 2;
    var stroke = opts.stroke || 'var(--fmb-accent)';
    var vals = (values || []).map(Number);
    if (vals.length < 2) return '<svg width="' + w + '" height="' + h + '" aria-hidden="true"></svg>';
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    var span = (max - min) || 1;
    var step = (w - pad * 2) / (vals.length - 1);
    var pts = vals.map(function (v, i) {
      var x = pad + i * step;
      var y = h - pad - ((v - min) / span) * (h - pad * 2);
      return x.toFixed(1) + ',' + y.toFixed(1);
    });
    var last = pts[pts.length - 1].split(',');
    return '<svg class="fmb-spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Points trend across festivals">' +
      '<polyline fill="none" stroke="' + stroke + '" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" points="' + pts.join(' ') + '"/>' +
      '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="1.8" fill="' + stroke + '"/></svg>';
  }

  /* ── Generic table sorter (numeric/text by data-sort) ───── */
  function makeSortable(table, opts) {
    opts = opts || {};
    var tbody = table.tBodies[0];
    var headers = Array.prototype.slice.call(table.querySelectorAll('th.sortable'));
    function getRows() {
      return Array.prototype.slice.call(tbody.querySelectorAll('tr[data-row]'));
    }
    function sortBy(idx, dir) {
      var rows = getRows();
      rows.sort(function (a, b) {
        var av = a.children[idx].getAttribute('data-val');
        var bv = b.children[idx].getAttribute('data-val');
        var an = parseFloat(av), bn = parseFloat(bv);
        var cmp = (!isNaN(an) && !isNaN(bn)) ? an - bn : String(av).localeCompare(String(bv));
        return dir === 'asc' ? cmp : -cmp;
      });
      rows.forEach(function (r) {
        tbody.appendChild(r);
        var ex = r.getAttribute('data-expand-id');
        if (ex) { var er = document.getElementById(ex); if (er) tbody.appendChild(er); }
      });
      headers.forEach(function (h) { h.setAttribute('aria-sort', 'none'); });
      headers[idx] && headers[idx].setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending');
      if (opts.afterSort) opts.afterSort();
    }
    headers.forEach(function (h, i) {
      h.tabIndex = 0;
      var colIdx = parseInt(h.getAttribute('data-col'), 10);
      function toggle() {
        var cur = h.getAttribute('aria-sort');
        var dir = cur === 'descending' ? 'asc' : 'desc';
        sortBy(colIdx, dir);
      }
      h.addEventListener('click', toggle);
      h.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    });
    return { sortBy: sortBy };
  }

  function init() {
    buildNav();
    wireMega();
    wireSheet();
    wireSearch();
    wireTooltips();
    wireCapture();
  }

  window.FMB = {
    FESTIVALS: FESTIVALS,
    STATUS_LABEL: STATUS_LABEL,
    esc: esc,
    sparkline: sparkline,
    makeSortable: makeSortable,
    featuredFestival: featuredFestival
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
