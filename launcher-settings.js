(function () {
  'use strict';
  var page = document.querySelector('.home-page');
  var revealTimer;
  var loaded = false;
  var fontsReady = !document.fonts;
  page.classList.add('compact-icons');
  var grid = document.querySelector('.app-grid');
  var pager = document.getElementById('launcher-pagination');
  var items = grid ? Array.prototype.slice.call(grid.children) : [];
  var allItems = items.slice();
  var pages = [], currentPage = 0;
  try { currentPage = Number(window.sessionStorage.getItem('little-apps.launcher-page')) || 0; } catch (error) {}
  function showPage(index) {
    currentPage = Math.max(0, Math.min(index, pages.length - 1));
    var placements = pages[currentPage] || [];
    items.forEach(function (item) { item.hidden = true; });
    placements.forEach(function (place) {
      var item = items[place.index];
      item.style.gridColumn = place.column + ' / span ' + place.columns;
      item.style.gridRow = place.row + ' / span ' + place.rows;
      item.hidden = false;
    });
    if (pager) Array.prototype.forEach.call(pager.children, function (button, i) {
      if (i === currentPage) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    try { window.sessionStorage.setItem('little-apps.launcher-page', String(currentPage)); } catch (error) {}
  }
  function fitGrid() {
    var widgetsVisible = true;
    try { widgetsVisible = window.localStorage.getItem('little-apps.show-widgets') !== '0'; } catch (error) {}
    allItems.forEach(function (item) { if (item.classList.contains('launcher-widget')) item.hidden = !widgetsVisible; });
    items = allItems.filter(function (item) { return widgetsVisible || !item.classList.contains('launcher-widget'); });
    var orientation = window.LittleAppsOrientation;
    var size = orientation ? orientation.dimensions() : { width:window.innerWidth, height:window.innerHeight };
    var width = size.width, shortSide = Math.min(width, size.height);
    var columns = width >= 700 ? 5 : width >= 480 ? 4 : 3;
    ['columns-3', 'columns-4', 'columns-5', 'icons-tiny', 'icons-small-screen', 'icons-medium-screen'].forEach(function (name) { page.classList.remove(name); });
    page.classList.add('columns-' + columns);
    if (shortSide <= 360) page.classList.add('icons-tiny');
    else if (shortSide <= 540) page.classList.add('icons-small-screen');
    else if (shortSide <= 640) page.classList.add('icons-medium-screen');
    var shortLandscape = width >= 760 && width > size.height && size.height <= 650;
    var edgePadding = shortLandscape ? 24 : width <= 540 ? 20 : 32;
    var gap = shortLandscape ? 12 : width <= 540 ? 6 : 16;
    var maxGridWidth = shortLandscape ? columns * 136 - 12 : columns * 140 - 16;
    var gridWidth = Math.min(width - edgePadding * 2, maxGridWidth);
    var tileWidth = shortSide <= 360 ? 52 : shortSide <= 540 ? 56 : 80;
    var topPadding = page.classList.contains('web-fullscreen-ready') ? 52 : 24;
    var available = size.height - topPadding - 24;
    var rowSize = Math.min(shortSide <= 540 ? 96 : 128, Math.max(tileWidth + 38, Math.floor((available - 44 - 24) / 2)));
    page.style.setProperty('--launcher-cell-inset', Math.max(0, ((gridWidth - gap * (columns - 1)) / columns - tileWidth) / 2) + 'px');
    page.style.setProperty('--launcher-tile-size', tileWidth + 'px');
    page.style.setProperty('--launcher-row-size', rowSize + 'px');
    if (!grid || !window.LittleAppsPaginate) return;
    var specs = items.map(function (item) { var widget = item.classList.contains('launcher-widget'); return {columns:widget ? 2 : 1, rows:widget ? 2 : 1}; });
    var rows = Math.max(2, Math.floor((available + 24) / (rowSize + 24)));
    pages = window.LittleAppsPaginate(specs, columns, rows);
    if (pages.length > 1) pages = window.LittleAppsPaginate(specs, columns, Math.max(2, Math.floor((available - 44 + 24) / (rowSize + 24))));
    // Reserve the largest page's complete grid on every page. Sparse pages
    // keep the same top-left origin instead of shrinking around their icons.
    var displayRows = pages.reduce(function (maximum, entries) {
      return entries.reduce(function (count, place) { return Math.max(count, place.row + place.rows - 1); }, maximum);
    }, 1);
    grid.style.gridTemplateRows = 'repeat(' + displayRows + ', var(--launcher-row-size))';
    if (pager) {
      pager.textContent = '';
      pager.hidden = pages.length <= 1;
      pages.forEach(function (_, index) {
        var button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', 'Page ' + (index + 1) + ' of ' + pages.length);
        button.setAttribute('aria-controls', 'launcher-grid');
        button.onclick = function () { showPage(index); };
        pager.appendChild(button);
      });
    }
    showPage(currentPage);
  }
  function settleLayout() {
    fitGrid();
    window.clearTimeout(revealTimer);
    if (!loaded || !fontsReady) return;
    // The Kindle changes the browser viewport during its fullscreen handoff.
    // Publish only a settled, measured layout, including the widget contents
    // and the final font metrics, rather than exposing the unpadded first pass.
    revealTimer = window.setTimeout(function () {
      fitGrid();
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          document.documentElement.classList.remove('launcher-loading');
        });
      });
    }, 350);
  }
  var gestureSurface = document.querySelector('.launcher-main');
  if (gestureSurface && window.LittleAppsGestures) window.LittleAppsGestures(gestureSurface, {
    pointerEvents:!!window.PointerEvent,
    point:function (x, y) { return window.LittleAppsOrientation ? window.LittleAppsOrientation.point(x, y) : {x:x,y:y}; },
    turn:function (direction) { showPage(currentPage + direction); }
  });
  fitGrid();
  window.addEventListener('load', function () { loaded = true; settleLayout(); });
  if (document.fonts) {
    document.fonts.ready.then(function () { fontsReady = true; settleLayout(); });
  }
  window.addEventListener('pageshow', settleLayout);
  window.addEventListener('storage', settleLayout);
  window.addEventListener('resize', settleLayout);
  window.addEventListener('littleappsorientationchange', settleLayout);
}());
