/* ════════════════════════════════════════════════════════════
   Veeer Sukhadiya Books — shared page reader (all books)
   Book data comes from window.BOOK (set in /readers/<slug>.html):
   { slug, title, author, pages, w, h, search, toc:[{t,p,l}] }
   Pages load one at a time from /readers/<slug>/p/NNN.webp.
════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var B = window.BOOK;
  if (!B || !B.pages) { document.body.textContent = 'Book not found.'; return; }

  // ── Setup ─────────────────────────────────────────────
  var qs = new URLSearchParams(location.search);
  var PREVIEW = qs.get('preview') === '1';
  var PREVIEW_MAX = Math.max(1, parseInt(qs.get('pages'), 10) || 5);
  var TOTAL = PREVIEW ? Math.min(PREVIEW_MAX, B.pages) : B.pages;
  var RATIO = (B.h && B.w) ? B.h / B.w : 1.5;          // page height / width
  var DIR = B.slug + '/';
  var FRAMED = window.parent !== window;
  var ZMIN = 0.5, ZMAX = 4;

  function pad(n) { return ('00' + n).slice(-3); }
  function pageSrc(n) { return DIR + 'p/' + pad(n) + '.' + (B.ext || 'webp'); }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var K_BOOK = 'vsr:book:' + B.slug, K_PREFS = 'vsr:prefs';

  // ── Icons ─────────────────────────────────────────────
  var I = {
    back: '<path d="M15 18l-6-6 6-6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    prev: '<path d="M15 18l-6-6 6-6"/>',
    next: '<path d="M9 18l6-6-6-6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    mark: '<path d="M6 3h12v18l-6-4.5L6 21z"/>',
    aa: '<path d="M3 19l5-14 5 14M5 14h6M15 19v-5.5a2.5 2.5 0 015 0V19M15 16h5"/>',
    full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    exitfull: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.5M12 17h.01"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    minus: '<path d="M5 12h14"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    one: '<rect x="7" y="4" width="10" height="16" rx="1"/>',
    two: '<rect x="3" y="5" width="8" height="14" rx="1"/><rect x="13" y="5" width="8" height="14" rx="1"/>',
    scroll: '<rect x="6" y="2" width="12" height="9" rx="1"/><rect x="6" y="13" width="12" height="9" rx="1"/>'
  };
  function ico(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + I[n] + '</svg>'; }

  // ── Build DOM ─────────────────────────────────────────
  var app = document.createElement('div');
  app.id = 'app';
  app.innerHTML =
    '<header id="top" class="bar">' +
      '<button class="ib" id="b-back" title="Back to store">' + ico('back') + '<span class="lbl">Store</span></button>' +
      '<button class="ib" id="b-sb" title="Contents, pages &amp; bookmarks (C)" aria-label="Open sidebar">' + ico('menu') + '</button>' +
      '<div id="title"><b></b><span></span></div>' +
      (B.search ? '<button class="ib" id="b-find" title="Search in book (Ctrl+F)" aria-label="Search">' + ico('search') + '</button>' : '') +
      (PREVIEW ? '' : '<button class="ib" id="b-mark" title="Bookmark this page (B)" aria-label="Bookmark this page">' + ico('mark') + '</button>') +
      '<button class="ib" id="b-aa" title="Display settings" aria-label="Display settings">' + ico('aa') + '</button>' +
      '<button class="ib hide-sm" id="b-full" title="Full screen (F)" aria-label="Full screen">' + ico('full') + '</button>' +
      '<button class="ib hide-sm" id="b-help" title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts">' + ico('help') + '</button>' +
    '</header>' +
    '<div id="body">' +
      '<aside id="sb" aria-label="Book navigation">' +
        '<div id="sb-tabs" role="tablist">' +
          '<button data-tab="toc">Contents</button><button data-tab="pages">Pages</button>' +
          (PREVIEW ? '' : '<button data-tab="marks">Bookmarks</button>') +
          (B.search ? '<button data-tab="find">Search</button>' : '') +
        '</div>' +
        '<div class="pane toc" id="p-toc"></div>' +
        '<div class="pane" id="p-pages"><div class="thumbs" id="thumbs"></div></div>' +
        '<div class="pane" id="p-marks"></div>' +
        '<div class="pane" id="p-find"><div id="q-box"><input id="q" type="search" placeholder="Search this book…" autocomplete="off"><div id="q-info"></div></div><div id="q-res"></div></div>' +
      '</aside>' +
      '<div id="sb-veil"></div>' +
      '<main id="main" tabindex="-1">' +
        '<div class="zone l" id="z-l"><span>' + ico('prev') + '</span></div>' +
        '<div class="zone r" id="z-r"><span>' + ico('next') + '</span></div>' +
        '<div id="spread"></div><div id="scroll" hidden></div>' +
      '</main>' +
    '</div>' +
    '<footer id="foot" class="bar">' +
      '<button class="ib" id="b-prev" title="Previous page (←)" aria-label="Previous page">' + ico('prev') + '</button>' +
      '<div id="pg-box"><input id="pg-in" inputmode="numeric" aria-label="Page number"><span id="pg-tot"></span></div>' +
      '<input id="slider" type="range" min="1" step="1" aria-label="Book progress">' +
      '<span id="pct"></span>' +
      '<button class="ib" id="b-next" title="Next page (→)" aria-label="Next page">' + ico('next') + '</button>' +
    '</footer>' +
    '<div id="slide-tip"></div>' +
    '<div class="pop" id="pop" role="dialog" aria-label="Display settings">' +
      '<h4>Theme</h4><div class="seg" id="seg-theme">' +
        '<button data-v="dark"><i class="sw" style="background:#2b2b2b"></i>Dark</button>' +
        '<button data-v="light"><i class="sw" style="background:#f3f0e8"></i>Light</button>' +
        '<button data-v="sepia"><i class="sw" style="background:#c9a878"></i>Sepia</button>' +
        '<button data-v="night"><i class="sw" style="background:#000"></i>Night</button></div>' +
      '<h4>Layout</h4><div class="seg" id="seg-view">' +
        '<button data-v="one">' + ico('one') + '1 Page</button>' +
        '<button data-v="two">' + ico('two') + '2 Pages</button>' +
        '<button data-v="scroll">' + ico('scroll') + 'Scroll</button></div>' +
      '<h4>Zoom</h4><div class="zoom-row">' +
        '<button class="ib" id="z-out" aria-label="Zoom out">' + ico('minus') + '</button><span id="zoom-lbl">100%</span>' +
        '<button class="ib" id="z-in" aria-label="Zoom in">' + ico('plus') + '</button></div>' +
      '<div class="seg" id="seg-fit" style="margin-top:8px"><button data-v="page">Fit page</button><button data-v="width">Fit width</button></div>' +
    '</div>' +
    '<div id="veil"></div>' +
    '<div class="modal" id="help" role="dialog" aria-label="Keyboard shortcuts"><h3>Keyboard shortcuts</h3><div class="keys">' +
      '<span><kbd>→</kbd> <kbd>Space</kbd></span><span>Next page</span>' +
      '<span><kbd>←</kbd></span><span>Previous page</span>' +
      '<span><kbd>Home</kbd> <kbd>End</kbd></span><span>First / last page</span>' +
      '<span><kbd>G</kbd></span><span>Go to page number</span>' +
      '<span><kbd>+</kbd> <kbd>−</kbd> <kbd>0</kbd></span><span>Zoom in / out / fit</span>' +
      '<span><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd></span><span>1 page / 2 pages / scroll</span>' +
      '<span><kbd>T</kbd></span><span>Change theme</span>' +
      '<span><kbd>N</kbd> <kbd>S</kbd></span><span>Night / sepia</span>' +
      '<span><kbd>C</kbd></span><span>Contents &amp; pages</span>' +
      '<span><kbd>Ctrl</kbd>+<kbd>F</kbd></span><span>Search in book</span>' +
      '<span><kbd>B</kbd></span><span>Bookmark page</span>' +
      '<span><kbd>F</kbd></span><span>Full screen</span>' +
      '<span><kbd>H</kbd></span><span>Hide / show toolbars</span>' +
      '<span><kbd>Esc</kbd></span><span>Close panels</span>' +
    '</div><div style="margin-top:16px;text-align:right"><button class="btn ghost" id="help-x">Close</button></div></div>' +
    '<div id="toast" role="status"></div>';
  document.body.appendChild(app);

  var main = $('main'), spreadEl = $('spread'), scrollEl = $('scroll'), slider = $('slider'), pgIn = $('pg-in');
  $('title').firstChild.textContent = B.title;
  $('title').lastChild.textContent = B.author ? '· ' + B.author : '';
  if (PREVIEW) $('title').firstChild.insertAdjacentHTML('afterend', '<i class="badge">Preview</i>');
  $('pg-tot').textContent = '/ ' + TOTAL;
  slider.max = TOTAL;
  if (!document.fullscreenEnabled && !document.webkitFullscreenEnabled) $('b-full').style.display = 'none';

  // ── State ─────────────────────────────────────────────
  var prefs = store.get(K_PREFS, {});
  var saved = PREVIEW ? {} : store.get(K_BOOK, {});
  var S = {
    page: 1,
    view: prefs.view || (innerWidth >= 1100 && innerWidth > innerHeight ? 'two' : 'one'),
    theme: prefs.theme || 'dark',
    fit: prefs.fit || 'page',       // 'page' | 'width' | null (custom zoom)
    zoom: 1,                        // current zoom multiplier relative to "fit page"
    marks: Array.isArray(saved.marks) ? saved.marks : []
  };
  if (!S.fit) S.zoom = clamp(+prefs.zoom || 1, ZMIN, ZMAX);

  function persist() {
    store.set(K_PREFS, { view: S.view, theme: S.theme, fit: S.fit, zoom: S.zoom });
    if (!PREVIEW) store.set(K_BOOK, { page: S.page, marks: S.marks, at: Date.now() });
  }
  var persistT;
  function persistSoon() { clearTimeout(persistT); persistT = setTimeout(persist, 300); }

  // ── Image cache (decoded, LRU) ────────────────────────
  var cache = new Map();
  function getImg(n) {
    var img = cache.get(n);
    if (img) { cache.delete(n); cache.set(n, img); return img; }
    img = new Image();
    img.decoding = 'async';
    img.alt = 'Page ' + n;
    img.draggable = false;
    img.src = pageSrc(n);
    img._ready = (img.decode ? img.decode() : Promise.resolve()).catch(function () {});
    cache.set(n, img);
    if (cache.size > 14) cache.delete(cache.keys().next().value);
    return img;
  }
  function idle(fn, ms) {
    if (window.requestIdleCallback) requestIdleCallback(fn, { timeout: ms || 500 });
    else setTimeout(fn, ms || 120);
  }
  function preload(list) {
    idle(function () { list.forEach(function (n) { if (n >= 1 && n <= TOTAL) getImg(n); }); }, 400);
  }

  function makePage(n, w, h) {
    var d = document.createElement('div');
    d.className = 'page' + (n === 1 ? ' cover' : '');
    d.style.width = w + 'px'; d.style.height = h + 'px';
    d.dataset.n = n;
    return d;
  }
  function fillPage(d, n) {
    var img = getImg(n);
    if (img.complete && img.naturalWidth) { d.appendChild(img); d.classList.add('ok'); return; }
    img._ready.then(function () {
      if (d.dataset.n == n && !d.contains(img)) { d.appendChild(img); d.classList.add('ok'); }
    });
  }

  // ── Geometry ──────────────────────────────────────────
  function pagesShown() {
    if (S.view !== 'two' || S.page === 1) return [S.page];
    return S.page + 1 <= TOTAL ? [S.page, S.page + 1] : [S.page];
  }
  function fitSize(k) {  // page width when the spread of k pages fits the viewport
    var pad = innerWidth <= 640 ? 16 : 36;
    var W = main.clientWidth - pad - (k - 1) * 6, H = main.clientHeight - pad;
    var byH = H / RATIO, byW = W / k;
    return { page: Math.max(80, Math.min(byH, byW)), width: Math.max(80, byW) };
  }
  function pageWidth(k) {
    var f = fitSize(k);
    if (S.fit === 'page') S.zoom = 1;
    if (S.fit === 'width') S.zoom = f.width / f.page;
    return f.page * S.zoom;
  }
  function scrollWidth() {
    var W = main.clientWidth - (innerWidth <= 640 ? 12 : 24);
    var base = Math.min(W, 820);
    if (S.fit === 'page') S.zoom = 1;
    if (S.fit === 'width') S.zoom = W / base;
    return Math.max(80, base * S.zoom);
  }

  // ── Render: page modes ────────────────────────────────
  function renderSpread(keepScroll) {
    var shown = pagesShown();
    var w = Math.round(pageWidth(shown.length)), h = Math.round(w * RATIO);
    var frag = document.createDocumentFragment();
    shown.forEach(function (n) { var d = makePage(n, w, h); fillPage(d, n); frag.appendChild(d); });
    spreadEl.replaceChildren(frag);
    if (!keepScroll) main.scrollTo(0, 0);
    document.body.classList.toggle('zoomed', main.scrollWidth > main.clientWidth + 2 || S.zoom > 1.01);
    var nx = shown[shown.length - 1];
    preload([nx + 1, nx + 2, nx + 3, shown[0] - 1, shown[0] - 2]);
  }

  // ── Render: scroll mode ───────────────────────────────
  var scrollBuilt = false, scrollW = 0, scrollGap = 14;
  function buildScroll() {
    scrollW = Math.round(scrollWidth());
    var h = Math.round(scrollW * RATIO);
    scrollGap = innerWidth <= 640 ? 8 : 14;
    var frag = document.createDocumentFragment();
    for (var n = 1; n <= TOTAL; n++) {
      var d = makePage(n, scrollW, h);
      d.insertAdjacentHTML('beforeend', '<span class="pno">' + n + '</span>');
      frag.appendChild(d);
    }
    if (PREVIEW && B.pages > TOTAL) frag.appendChild(endCard(scrollW, Math.round(h * 0.6)));
    scrollEl.replaceChildren(frag);
    scrollBuilt = true;
  }
  function scrollPageAt() {
    var h = scrollW * RATIO + scrollGap;
    return clamp(Math.floor((main.scrollTop + main.clientHeight * 0.35 - 18) / h) + 1, 1, TOTAL);
  }
  function scrollToPage(n, smooth) {
    var h = scrollW * RATIO + scrollGap;
    main.scrollTo({ top: (n - 1) * h + (n > 1 ? 10 : 0), behavior: smooth ? 'smooth' : 'auto' });
  }
  function loadNear(n) {
    var kids = scrollEl.children;
    for (var i = Math.max(1, n - 2); i <= Math.min(TOTAL, n + 3); i++) {
      var d = kids[i - 1];
      if (d && !d.classList.contains('ok') && !d._loading) { d._loading = 1; fillPage(d, i); }
    }
  }
  var scrollRAF = 0;
  main.addEventListener('scroll', function () {
    if (S.view !== 'scroll' || scrollRAF) return;
    scrollRAF = requestAnimationFrame(function () {
      scrollRAF = 0;
      var n = scrollPageAt();
      loadNear(n);
      if (n !== S.page) { S.page = n; updateChrome(); persistSoon(); }
    });
  }, { passive: true });

  function endCard(w, h) {
    var d = document.createElement('div');
    d.className = 'end-card';
    d.style.width = w + 'px'; d.style.minHeight = Math.min(h, 460) + 'px';
    d.innerHTML = '<h2>That’s the end of the preview</h2><p>You’ve read ' + TOTAL + ' of ' + B.pages +
      ' pages of <i>' + esc(B.title) + '</i>. Get the book to keep reading.</p>' +
      '<button class="btn" data-act="buy">Get the full book</button>';
    return d;
  }
  function notifyHost(type) {
    if (!FRAMED) return false;
    try { parent.postMessage({ source: 'veeer-reader', type: type, slug: B.slug, page: S.page }, location.origin); return true; }
    catch (x) { return false; }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-act="buy"]');
    if (!b) return;
    if (!notifyHost('buy')) location.href = '/product/' + encodeURIComponent(B.slug);
  });
  // The store page hosting the reader can ask it to jump to a page.
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || e.data.source !== 'veeer-host') return;
    if (e.data.type === 'goto') goTo(+e.data.page || 1);
  });

  // ── Chrome (toolbar/footer/sidebar state) ─────────────
  function updateChrome() {
    var shown = S.view === 'scroll' ? [S.page] : pagesShown();
    var first = shown[0], last = shown[shown.length - 1];
    if (document.activeElement !== pgIn) pgIn.value = shown.length > 1 ? first + '–' + last : first;
    slider.value = first;
    var pct = TOTAL > 1 ? Math.round((last - 1) / (TOTAL - 1) * 100) : 100;
    slider.style.setProperty('--fill', (TOTAL > 1 ? (first - 1) / (TOTAL - 1) * 100 : 100) + '%');
    $('pct').textContent = pct + '%';
    $('b-prev').disabled = first <= 1;
    var moreInPreview = PREVIEW && B.pages > TOTAL && S.view !== 'scroll';
    $('b-next').disabled = showingEnd || (last >= TOTAL && !moreInPreview);
    var mk = $('b-mark');
    if (mk) {
      var on = S.marks.some(function (m) { return m.p === first; });
      mk.classList.toggle('on', on);
      mk.title = on ? 'Remove bookmark (B)' : 'Bookmark this page (B)';
    }
    $('zoom-lbl').textContent = Math.round(S.zoom * 100) + '%';
    segOn('seg-fit', S.fit);
    // Sidebar highlights (only if built)
    if (tocBuilt) {
      var act = null;
      tocLinks.forEach(function (a) { if (+a.dataset.p <= first) act = a; });
      tocLinks.forEach(function (a) { a.classList.toggle('on', a === act); });
    }
    if (thumbsBuilt) {
      thumbEls.forEach(function (t, i) { t.classList.toggle('on', shown.indexOf(i + 1) >= 0); });
      if (document.body.classList.contains('sb-open') && curTab === 'pages') {
        var t = thumbEls[first - 1]; if (t) t.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  var showingEnd = false;
  function render(opts) {
    opts = opts || {};
    document.body.classList.toggle('v-scroll', S.view === 'scroll');
    if (S.view === 'scroll') {
      spreadEl.hidden = true; scrollEl.hidden = false;
      if (!scrollBuilt || opts.relayout) buildScroll();
      if (!opts.fromScroll) scrollToPage(S.page, opts.smooth);
      loadNear(S.page);
      document.body.classList.remove('zoomed');
    } else {
      scrollEl.hidden = true; spreadEl.hidden = false;
      if (scrollBuilt) { scrollEl.replaceChildren(); scrollBuilt = false; }
      if (showingEnd) {
        var w = Math.round(pageWidth(1));
        spreadEl.replaceChildren(endCard(w, Math.round(w * RATIO)));
        main.scrollTo(0, 0);
      } else renderSpread(opts.keepScroll);
    }
    updateChrome();
    persistSoon();
  }

  // ── Navigation ────────────────────────────────────────
  function normalise(n) {             // snap to spread start in 2-page mode (cover solo, then 2-3, 4-5 …)
    n = clamp(n, 1, TOTAL);
    if (S.view === 'two' && n > 1 && n % 2 === 1) n -= 1;
    return n;
  }
  function goTo(n, smooth) {
    showingEnd = false;
    S.page = normalise(n);
    render({ smooth: smooth });
  }
  function step(dir) {
    if (S.view === 'scroll') {
      if (dir > 0 && S.page >= TOTAL) return;
      goTo(S.page + dir, true); return;
    }
    if (dir < 0 && showingEnd) { showingEnd = false; render(); return; }
    var shown = pagesShown();
    if (dir > 0) {
      var last = shown[shown.length - 1];
      if (last >= TOTAL) {
        if (PREVIEW && B.pages > TOTAL && !showingEnd) { showingEnd = true; render(); notifyHost('preview-end'); }
        return;
      }
      goTo(last + 1);
    } else {
      if (S.page <= 1) return;
      goTo(S.view === 'two' ? (S.page <= 3 ? 1 : S.page - 2) : S.page - 1);
    }
  }

  // ── Zoom / view / theme ───────────────────────────────
  function setZoom(z) {
    var before = S.view === 'scroll' ? S.page : null;
    S.fit = null;
    S.zoom = clamp(Math.round(z * 100) / 100, ZMIN, ZMAX);
    if (S.view === 'scroll') { render({ relayout: true }); if (before) scrollToPage(before); }
    else render({ keepScroll: true });
  }
  function setFit(f) {
    S.fit = f;
    render({ relayout: true });
  }
  function setView(v) {
    if (v === S.view) return;
    S.view = v;
    segOn('seg-view', v);
    showingEnd = false;
    S.page = normalise(S.page);
    render({ relayout: true });
  }
  function setTheme(t) {
    S.theme = t;
    document.body.classList.remove('t-dark', 't-light', 't-sepia', 't-night');
    document.body.classList.add('t-' + t);
    segOn('seg-theme', t);
    persistSoon();
  }
  var THEMES = ['dark', 'light', 'sepia', 'night'];
  function segOn(id, v) {
    var el = $(id); if (!el) return;
    Array.prototype.forEach.call(el.children, function (b) { b.classList.toggle('on', b.dataset.v === v); });
  }
  function seg(id, fn) {
    $(id).addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) fn(b.dataset.v); });
  }
  seg('seg-theme', setTheme);
  seg('seg-view', setView);
  seg('seg-fit', setFit);
  $('z-in').onclick = function () { setZoom(S.zoom + 0.15); };
  $('z-out').onclick = function () { setZoom(S.zoom - 0.15); };

  // ── Sidebar ───────────────────────────────────────────
  var curTab = 'toc', tocBuilt = false, tocLinks = [], thumbsBuilt = false, thumbEls = [];
  function openSidebar(tab) {
    document.body.classList.add('sb-open');
    showTab(tab || curTab);
    setTimeout(relayoutSoon, 240);
  }
  function closeSidebar() {
    if (!document.body.classList.contains('sb-open')) return;
    document.body.classList.remove('sb-open');
    setTimeout(relayoutSoon, 240);
  }
  function showTab(tab) {
    if (!$('p-' + tab) || !document.querySelector('[data-tab="' + tab + '"]')) tab = 'toc';
    curTab = tab;
    Array.prototype.forEach.call($('sb-tabs').children, function (b) { b.classList.toggle('on', b.dataset.tab === tab); });
    ['toc', 'pages', 'marks', 'find'].forEach(function (t) { $('p-' + t).classList.toggle('on', t === tab); });
    if (tab === 'toc') buildToc();
    if (tab === 'pages') buildThumbs();
    if (tab === 'marks') buildMarks();
    if (tab === 'find') { loadText(); setTimeout(function () { $('q').focus(); $('q').select(); }, 30); }
    updateChrome();
  }
  $('sb-tabs').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) showTab(b.dataset.tab); });
  $('b-sb').onclick = function () { document.body.classList.contains('sb-open') ? closeSidebar() : openSidebar(); };
  $('sb-veil').onclick = closeSidebar;
  function pickedFromSidebar() { if (innerWidth <= 900) closeSidebar(); }

  function buildToc() {
    if (tocBuilt) return;
    tocBuilt = true;
    var toc = (B.toc || []).filter(function (t) { return t.p <= TOTAL; });
    if (!toc.length) toc = [{ t: 'Cover', p: 1, l: 0 }];
    $('p-toc').innerHTML = toc.map(function (t) {
      return '<a href="#" data-p="' + t.p + '" class="l' + (t.l || 0) + '"><span class="t">' + esc(t.t) + '</span><span class="n">' + t.p + '</span></a>';
    }).join('') + (PREVIEW && B.pages > TOTAL ? '<div class="empty">Contents shown for the preview pages only.</div>' : '');
    tocLinks = Array.prototype.slice.call($('p-toc').querySelectorAll('a'));
    $('p-toc').addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a) return;
      e.preventDefault(); goTo(+a.dataset.p); pickedFromSidebar();
    });
  }

  function buildThumbs() {
    if (thumbsBuilt) return;
    thumbsBuilt = true;
    // One sprite image holds every thumbnail (tc columns × tr rows).
    var box = $('thumbs'), frag = document.createDocumentFragment();
    if (!B.tc) return buildThumbImgs(box, frag);   // readers converted without a sprite
    var cols = B.tc, rows = B.tr || Math.ceil(B.pages / cols);
    var sprite = 'url("' + DIR + 'thumbs.webp")';
    var probe = new Image();
    probe.onload = function () { Array.prototype.forEach.call(box.querySelectorAll('.page'), function (p) { p.classList.add('ok'); }); };
    probe.src = DIR + 'thumbs.webp';
    for (var n = 1; n <= TOTAL; n++) {
      var i = n - 1, c = i % cols, r = Math.floor(i / cols);
      var t = document.createElement('div');
      t.className = 'th'; t.dataset.n = n;
      var p = document.createElement('div');
      p.className = 'page' + (n === 1 ? ' cover' : '');
      p.style.aspectRatio = '1 / ' + RATIO;
      p.style.backgroundImage = sprite;
      p.style.backgroundSize = (cols * 100) + '% ' + (rows * 100) + '%';
      p.style.backgroundPosition = (cols > 1 ? c / (cols - 1) * 100 : 0) + '% ' + (rows > 1 ? r / (rows - 1) * 100 : 0) + '%';
      t.appendChild(p); t.appendChild(document.createTextNode(n));
      frag.appendChild(t);
      thumbEls.push(t);
    }
    box.appendChild(frag);
    wireThumbs(box);
  }
  function wireThumbs(box) {
    box.addEventListener('click', function (e) {
      var t = e.target.closest('.th'); if (!t) return;
      goTo(+t.dataset.n); pickedFromSidebar();
    });
  }
  // Fallback: lazy-load each page image as its own thumbnail.
  function buildThumbImgs(box, frag) {
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        var p = en.target, img = new Image();
        img.decoding = 'async'; img.loading = 'lazy'; img.alt = ''; img.src = pageSrc(+p.dataset.n);
        img.onload = function () { p.classList.add('ok'); };
        p.appendChild(img); io.unobserve(p);
      });
    }, { root: $('p-pages'), rootMargin: '200px' }) : null;
    for (var n = 1; n <= TOTAL; n++) {
      var t = document.createElement('div');
      t.className = 'th'; t.dataset.n = n;
      var p = document.createElement('div');
      p.className = 'page' + (n === 1 ? ' cover' : ''); p.dataset.n = n;
      p.style.aspectRatio = '1 / ' + RATIO;
      t.appendChild(p); t.appendChild(document.createTextNode(n));
      frag.appendChild(t); thumbEls.push(t);
      if (io) io.observe(p); else { var im = new Image(); im.src = pageSrc(n); p.appendChild(im); p.classList.add('ok'); }
    }
    box.appendChild(frag);
    wireThumbs(box);
  }

  // ── Bookmarks ─────────────────────────────────────────
  function toggleMark() {
    if (PREVIEW) return;
    var p = S.view === 'scroll' ? S.page : pagesShown()[0];
    var i = S.marks.findIndex(function (m) { return m.p === p; });
    if (i >= 0) { S.marks.splice(i, 1); toast('Bookmark removed'); }
    else {
      S.marks.push({ p: p, t: Date.now(), l: chapterOf(p) });
      S.marks.sort(function (a, b) { return a.p - b.p; });
      toast('Page ' + p + ' bookmarked', 'View', function () { openSidebar('marks'); });
    }
    persist(); updateChrome();
    if (curTab === 'marks') buildMarks();
  }
  function chapterOf(p) {
    var name = '';
    (B.toc || []).forEach(function (t) { if (t.p <= p) name = t.t; });
    return name;
  }
  function buildMarks() {
    var el = $('p-marks');
    if (!S.marks.length) { el.innerHTML = '<div class="empty">No bookmarks yet.<br>Press the bookmark icon (or <kbd>B</kbd>) to save a page.</div>'; return; }
    el.innerHTML = S.marks.map(function (m) {
      return '<div class="bm" data-p="' + m.p + '"><span class="t">' + (m.l ? esc(m.l) : 'Page ' + m.p) + '</span><span class="n">p. ' + m.p +
        '</span><button data-del="' + m.p + '" aria-label="Remove bookmark" title="Remove">' + ico('x') + '</button></div>';
    }).join('');
  }
  $('p-marks').addEventListener('click', function (e) {
    var del = e.target.closest('[data-del]');
    if (del) {
      var p = +del.dataset.del;
      S.marks = S.marks.filter(function (m) { return m.p !== p; });
      persist(); buildMarks(); updateChrome(); return;
    }
    var r = e.target.closest('.bm'); if (r) { goTo(+r.dataset.p); pickedFromSidebar(); }
  });

  // ── Search ────────────────────────────────────────────
  var TEXT = null, textLoading = null;
  function norm(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"'); }
  function loadText() {
    if (!B.search || TEXT || textLoading) return textLoading;
    $('q-info').textContent = 'Loading…';
    textLoading = fetch(DIR + 'text.json').then(function (r) { return r.json(); }).then(function (arr) {
      TEXT = arr.slice(0, TOTAL).map(function (t) { return { raw: t, n: norm(t) }; });
      $('q-info').textContent = PREVIEW ? 'Searching the preview pages' : 'Search all ' + TOTAL + ' pages';
      if ($('q').value) doSearch();
    }).catch(function () { $('q-info').textContent = 'Search is unavailable offline.'; textLoading = null; });
    return textLoading;
  }
  function doSearch() {
    var q = $('q').value.trim(), out = $('q-res');
    if (!TEXT) { loadText(); return; }
    if (q.length < 2) { out.innerHTML = ''; $('q-info').textContent = 'Type at least 2 letters'; return; }
    var nq = norm(q), hits = [], count = 0;
    for (var i = 0; i < TEXT.length && hits.length < 150; i++) {
      var t = TEXT[i], at = t.n.indexOf(nq);
      if (at < 0) continue;
      var c = 0, k = at; while (k >= 0) { c++; k = t.n.indexOf(nq, k + nq.length); }
      count += c;
      var a = Math.max(0, at - 60), b = Math.min(t.raw.length, at + nq.length + 80);
      hits.push('<div class="res" data-p="' + (i + 1) + '"><span class="n">Page ' + (i + 1) + (c > 1 ? ' · ' + c + ' matches' : '') + '</span><span class="s">' +
        (a > 0 ? '…' : '') + esc(t.raw.slice(a, at)) + '<mark>' + esc(t.raw.slice(at, at + nq.length)) + '</mark>' + esc(t.raw.slice(at + nq.length, b)) + (b < t.raw.length ? '…' : '') + '</span></div>');
    }
    $('q-info').textContent = hits.length ? count + ' match' + (count === 1 ? '' : 'es') + ' on ' + hits.length + ' page' + (hits.length === 1 ? '' : 's') : 'No matches for “' + q + '”';
    out.innerHTML = hits.join('');
  }
  var qT;
  $('q').addEventListener('input', function () { clearTimeout(qT); qT = setTimeout(doSearch, 180); });
  $('q').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { var f = $('q-res').querySelector('.res'); if (f) { goTo(+f.dataset.p); pickedFromSidebar(); } }
  });
  $('q-res').addEventListener('click', function (e) { var r = e.target.closest('.res'); if (r) { goTo(+r.dataset.p); pickedFromSidebar(); } });

  // ── Popover / modal / toast ───────────────────────────
  var pop = $('pop');
  $('b-aa').onclick = function (e) { e.stopPropagation(); pop.classList.toggle('on'); };
  document.addEventListener('click', function (e) { if (pop.classList.contains('on') && !pop.contains(e.target) && !e.target.closest('#b-aa')) pop.classList.remove('on'); });
  function help(on) { $('help').classList.toggle('on', on); $('veil').classList.toggle('on', on); }
  $('b-help').onclick = function () { help(true); };
  $('help-x').onclick = function () { help(false); };
  $('veil').onclick = function () { help(false); };

  var toastT;
  function toast(msg, act, fn) {
    var t = $('toast');
    t.innerHTML = '<span>' + esc(msg) + '</span>' + (act ? '<button>' + esc(act) + '</button>' : '');
    if (act) t.querySelector('button').onclick = function () { t.classList.remove('on'); fn(); };
    t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, act ? 5000 : 2200);
  }

  // ── Fullscreen / UI toggle ────────────────────────────
  function toggleFull() {
    var d = document, el = d.documentElement;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
  }
  function onFullChange() {
    var on = !!(document.fullscreenElement || document.webkitFullscreenElement);
    $('b-full').innerHTML = ico(on ? 'exitfull' : 'full');
    relayoutSoon();
  }
  document.addEventListener('fullscreenchange', onFullChange);
  document.addEventListener('webkitfullscreenchange', onFullChange);
  $('b-full').onclick = toggleFull;
  function toggleUI() { document.body.classList.toggle('ui-hidden'); setTimeout(relayoutSoon, 240); }

  // ── Buttons ───────────────────────────────────────────
  $('b-prev').onclick = function () { step(-1); };
  $('b-next').onclick = function () { step(1); };
  $('z-l').onclick = function () { step(-1); };
  $('z-r').onclick = function () { step(1); };
  if ($('b-mark')) $('b-mark').onclick = toggleMark;
  if ($('b-find')) $('b-find').onclick = function () { openSidebar('find'); };
  $('b-back').onclick = function () {
    var dest = PREVIEW ? '/product/' + encodeURIComponent(B.slug) : '/library';
    if (notifyHost('close')) return;
    var sameRef = document.referrer && document.referrer.indexOf(location.origin) === 0;
    if (sameRef && history.length > 1) history.back(); else location.href = dest;
  };

  // Page number input
  pgIn.addEventListener('focus', function () { pgIn.value = S.page; pgIn.select(); });
  pgIn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { var n = parseInt(pgIn.value, 10); if (n) goTo(n); pgIn.blur(); }
    if (e.key === 'Escape') pgIn.blur();
  });
  pgIn.addEventListener('blur', updateChrome);

  // Slider with live tooltip
  var tip = $('slide-tip');
  function tipAt() {
    var r = slider.getBoundingClientRect(), f = TOTAL > 1 ? (slider.value - 1) / (TOTAL - 1) : 0;
    tip.style.left = (r.left + 8 + f * (r.width - 16)) + 'px';
    var ch = chapterOf(+slider.value);
    tip.textContent = 'Page ' + slider.value + (ch ? ' · ' + ch : '');
    tip.classList.add('show');
    slider.style.setProperty('--fill', f * 100 + '%');
  }
  slider.addEventListener('input', tipAt);
  slider.addEventListener('change', function () { tip.classList.remove('show'); goTo(+slider.value); });
  slider.addEventListener('pointerup', function () { tip.classList.remove('show'); });
  slider.addEventListener('blur', function () { tip.classList.remove('show'); });

  // ── Keyboard ──────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    var tag = e.target.tagName;
    if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F') && B.search) { e.preventDefault(); openSidebar('find'); return; }
    if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+' || e.key === '-' || e.key === '0')) {
      e.preventDefault(); if (e.key === '0') setFit('page'); else setZoom(S.zoom + (e.key === '-' ? -0.15 : 0.15)); return;
    }
    if (e.key === 'Escape') {
      if ($('help').classList.contains('on')) help(false);
      else if (pop.classList.contains('on')) pop.classList.remove('on');
      else if (document.body.classList.contains('sb-open')) closeSidebar();
      else if (document.body.classList.contains('ui-hidden')) toggleUI();
      if (tag === 'INPUT') e.target.blur();
      return;
    }
    if (tag === 'INPUT' || e.ctrlKey || e.metaKey || e.altKey) return;
    var scrollable = main.scrollHeight > main.clientHeight + 2;
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': if (S.view !== 'scroll') { e.preventDefault(); step(1); } else if (e.key === 'ArrowRight') step(1); break;
      case 'ArrowLeft': case 'PageUp': if (S.view !== 'scroll') { e.preventDefault(); step(-1); } else if (e.key === 'ArrowLeft') step(-1); break;
      case ' ': if (S.view !== 'scroll' && !scrollable) { e.preventDefault(); e.shiftKey ? step(-1) : step(1); } break;
      case 'Home': e.preventDefault(); goTo(1); break;
      case 'End': e.preventDefault(); goTo(TOTAL); break;
      case '+': case '=': setZoom(S.zoom + 0.15); break;
      case '-': case '_': setZoom(S.zoom - 0.15); break;
      case '0': setFit('page'); break;
      case '1': setView('one'); break;
      case '2': setView('two'); break;
      case '3': setView('scroll'); break;
      case 'n': case 'N': setTheme(S.theme === 'night' ? 'dark' : 'night'); break;
      case 's': case 'S': setTheme(S.theme === 'sepia' ? 'dark' : 'sepia'); break;
      case 't': case 'T': setTheme(THEMES[(THEMES.indexOf(S.theme) + 1) % THEMES.length]); break;
      case 'c': case 'C': document.body.classList.contains('sb-open') ? closeSidebar() : openSidebar(); break;
      case 'b': case 'B': toggleMark(); break;
      case 'f': case 'F': toggleFull(); break;
      case 'h': case 'H': toggleUI(); break;
      case 'g': case 'G': e.preventDefault(); if (document.body.classList.contains('ui-hidden')) toggleUI(); pgIn.focus(); break;
      case '?': help(true); break;
    }
  });

  // ── Mouse wheel: Ctrl/pinch = zoom; plain wheel flips pages when nothing to scroll ──
  var wheelLock = 0;
  main.addEventListener('wheel', function (e) {
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(S.zoom * (e.deltaY < 0 ? 1.08 : 0.926)); return; }
    if (S.view === 'scroll') return;
    var canScroll = main.scrollHeight > main.clientHeight + 2;
    if (canScroll) {
      var atTop = main.scrollTop <= 0, atBot = main.scrollTop + main.clientHeight >= main.scrollHeight - 2;
      if (!((e.deltaY > 0 && atBot) || (e.deltaY < 0 && atTop))) return;
    }
    if (Math.abs(e.deltaY) < 25 || Date.now() < wheelLock) return;
    wheelLock = Date.now() + 450;
    e.preventDefault();
    step(e.deltaY > 0 ? 1 : -1);
    if (e.deltaY < 0 && canScroll) requestAnimationFrame(function () { main.scrollTop = main.scrollHeight; });
  }, { passive: false });

  // ── Touch: swipe to turn, tap centre to hide toolbars, pinch to zoom ──
  var t0 = null, pinch0 = 0, zoom0 = 1;
  function dist(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }
  main.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) { pinch0 = dist(e.touches); zoom0 = S.zoom; t0 = null; return; }
    if (e.touches.length === 1) t0 = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now(), sl: main.scrollLeft };
  }, { passive: true });
  main.addEventListener('touchmove', function (e) {
    if (e.touches.length === 2 && pinch0) {
      var z = zoom0 * dist(e.touches) / pinch0;
      if (Math.abs(z - S.zoom) > 0.05) setZoom(z);
    }
  }, { passive: true });
  main.addEventListener('touchend', function (e) {
    if (pinch0 && e.touches.length < 2) { pinch0 = 0; return; }
    if (!t0) return;
    var dx = e.changedTouches[0].clientX - t0.x, dy = e.changedTouches[0].clientY - t0.y, dt = Date.now() - t0.t;
    var panned = Math.abs(main.scrollLeft - t0.sl) > 2;
    t0 = null;
    if (S.view === 'scroll' || panned || document.body.classList.contains('zoomed')) return;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4 && dt < 700) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  // Tap/click on the page centre toggles the toolbars (touch screens only, to stay out of the way on desktop)
  main.addEventListener('click', function (e) {
    if (e.target.closest('.zone,.end-card,button')) return;
    if (!matchMedia('(pointer:coarse)').matches) return;
    var r = main.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
    if (S.view !== 'scroll' && !document.body.classList.contains('zoomed')) {
      if (x < 0.25) return step(-1);
      if (x > 0.75) return step(1);
    }
    toggleUI();
  });

  // ── Resize ────────────────────────────────────────────
  var rzT;
  function relayoutSoon() {
    clearTimeout(rzT);
    rzT = setTimeout(function () {
      var p = S.page;
      if (S.view === 'scroll') { render({ relayout: true }); scrollToPage(p); }
      else render({ keepScroll: true });
    }, 60);
  }
  window.addEventListener('resize', relayoutSoon);
  window.addEventListener('pagehide', persist);
  document.addEventListener('visibilitychange', function () { if (document.hidden) persist(); });

  // ── Start ─────────────────────────────────────────────
  setTheme(S.theme);
  segOn('seg-view', S.view);
  var start = parseInt(qs.get('page'), 10) || (saved.page | 0) || 1;
  S.page = normalise(start);
  render();
  if (!PREVIEW && !qs.get('page') && saved.page > 2) {
    toast('Welcome back — resumed at page ' + saved.page, 'Start over', function () { goTo(1); });
  }
  // Warm up the thumbnail + contents UI in idle time so the sidebar opens instantly
  idle(buildToc, 2000);
  main.focus({ preventScroll: true });
})();
