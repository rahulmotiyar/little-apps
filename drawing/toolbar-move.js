(function () {
  'use strict';
  var paper = document.getElementById('paper');
  var toolbar = document.getElementById('drawing-toolbar');
  var handle = document.getElementById('toolbar-handle');
  var pen = document.getElementById('pen');
  var width = document.getElementById('width');
  var penOptions = document.getElementById('pen-options');
  var widthOptions = document.getElementById('width-options');
  var key = 'little-apps.draw.toolbar-position.v1';
  var position = null, drag = null, lastTouch = 0;
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function logicalRect(element) { return window.LittleAppsOrientation ? window.LittleAppsOrientation.rect(element) : element.getBoundingClientRect(); }
  function logicalEvent(event) { var p = window.LittleAppsOrientation ? window.LittleAppsOrientation.point(event.clientX, event.clientY) : { x:event.clientX, y:event.clientY }; return { clientX:p.x, clientY:p.y }; }
  function metrics() {
    var bounds = logicalRect(paper);
    var sx = paper.clientWidth / (bounds.width || paper.clientWidth || 1);
    var sy = paper.clientHeight / (bounds.height || paper.clientHeight || 1);
    return { bounds:bounds, sx:sx, sy:sy, maxX:Math.max(0, paper.clientWidth - toolbar.offsetWidth), maxY:Math.max(0, paper.clientHeight - toolbar.offsetHeight) };
  }
  function setLayout(layout) {
    toolbar.setAttribute('data-layout', layout);
    toolbar.setAttribute('aria-orientation', layout);
  }
  function placeMenus() {
    var m = metrics();
    [ [penOptions, pen], [widthOptions, width] ].forEach(function (item) {
      var menu = item[0], anchor = item[1];
      if (menu.hidden) { return; }
      var button = logicalRect(anchor);
      var w = menu.offsetWidth, h = menu.offsetHeight;
      var buttonLeft = (button.left - m.bounds.left) * m.sx;
      var buttonRight = (button.right - m.bounds.left) * m.sx;
      var buttonTop = (button.top - m.bounds.top) * m.sy;
      var buttonBottom = (button.bottom - m.bounds.top) * m.sy;
      var x, y;
      if (toolbar.getAttribute('data-layout') === 'vertical') {
        var left = buttonLeft, right = paper.clientWidth - buttonRight;
        x = right >= w || right >= left ? buttonRight : buttonLeft - w;
        y = buttonTop;
      } else {
        var below = paper.clientHeight - buttonBottom;
        var above = buttonTop;
        x = buttonLeft;
        y = below >= h || below >= above ? buttonBottom : buttonTop - h;
      }
      menu.style.right = 'auto'; menu.style.left = clamp(x, 0, Math.max(0, paper.clientWidth - w)) + 'px';
      menu.style.top = clamp(y, 0, Math.max(0, paper.clientHeight - h)) + 'px';
    });
  }
  function setPixels(x, y, edge) {
    var m = metrics(); x = clamp(x, 0, m.maxX); y = clamp(y, 0, m.maxY);
    toolbar.style.right = 'auto'; toolbar.style.left = x + 'px'; toolbar.style.top = y + 'px';
    position = { x: m.maxX ? x / m.maxX : 0, y: m.maxY ? y / m.maxY : 0, edge: edge || null, layout: toolbar.getAttribute('data-layout') };
    placeMenus();
  }
  function applyPosition() {
    if (position) { setLayout(position.edge === 'left' || position.edge === 'right' ? 'vertical' : position.edge === 'top' || position.edge === 'bottom' ? 'horizontal' : position.layout || 'vertical'); }
    else { setLayout(paper.clientWidth >= 480 && paper.clientHeight < 432 ? 'horizontal' : 'vertical'); }
    toolbar.setAttribute('data-dock', position && position.edge || '');
    var m = metrics();
    if (!position) {
      setPixels(Math.max(0, m.maxX - 12), Math.min(12, m.maxY));
      position = null;
    }
    else {
      var x = position.x * m.maxX, y = position.y * m.maxY;
      if (position.edge === 'left') { x = 0; y = 0; }
      if (position.edge === 'right') { x = m.maxX; y = 0; }
      if (position.edge === 'top') { x = 0; y = 0; }
      if (position.edge === 'bottom') { x = 0; y = m.maxY; }
      setPixels(x, y, position.edge);
    }
  }
  function save() { try { window.localStorage.setItem(key, JSON.stringify(position)); } catch (error) {} }
  function prevent(event) { if (event.cancelable !== false) { event.preventDefault(); } }
  function start(event, source, id) {
    if (drag) { return; }
    event = logicalEvent(event);
    var m = metrics(), rect = logicalRect(toolbar);
    var grip = logicalRect(handle);
    drag = { source:source, id:id, x:event.clientX, y:event.clientY, left:(rect.left - m.bounds.left) * m.sx, top:(rect.top - m.bounds.top) * m.sy, edge:position && position.edge,
      gripX:(event.clientX - grip.left) * m.sx, gripY:(event.clientY - grip.top) * m.sy, detached:false };
  }
  function move(event) {
    if (!drag) { return; }
    event = logicalEvent(event);
    var m = metrics();
    if (Math.abs(event.clientX - drag.x) > 3 || Math.abs(event.clientY - drag.y) > 3) { drag.moved = true; }
    if (!drag.moved) { return; }
    if (drag.edge && !drag.detached) {
      toolbar.setAttribute('data-dock', '');
      var bar = logicalRect(toolbar), grip = logicalRect(handle);
      m = metrics();
      drag.x = event.clientX; drag.y = event.clientY;
      drag.left = (event.clientX - m.bounds.left - (grip.left - bar.left)) * m.sx - drag.gripX;
      drag.top = (event.clientY - m.bounds.top - (grip.top - bar.top)) * m.sy - drag.gripY;
      drag.detached = true;
    }
    setPixels(drag.left + (event.clientX - drag.x) * m.sx, drag.top + (event.clientY - drag.y) * m.sy);
  }
  function end() {
    if (!drag) { return; }
    if (!drag.moved) { drag = null; return; }
    var m = metrics(), rect = logicalRect(toolbar);
    var x = (rect.left - m.bounds.left) * m.sx, y = (rect.top - m.bounds.top) * m.sy;
    var edges = [ { name:'left', distance:x }, { name:'right', distance:m.maxX-x },
      { name:'top', distance:y }, { name:'bottom', distance:m.maxY-y } ];
    edges.sort(function (a, b) { return a.distance - b.distance; });
    var edge = edges[0].distance <= 0.5 ? edges[0].name : null;
    if (edge) {
      setLayout(edge === 'left' || edge === 'right' ? 'vertical' : 'horizontal');
      toolbar.setAttribute('data-dock', edge);
      m = metrics();
      x = edge === 'right' ? m.maxX : 0;
      y = edge === 'bottom' ? m.maxY : 0;
    }
    drag = null; setPixels(x, y, edge); save();
  }
  function touchById(list, id) { for (var i = 0; i < list.length; i += 1) { if (list[i].identifier === id) { return list[i]; } } return null; }
  if (window.PointerEvent) {
    handle.addEventListener('pointerdown', function (event) { if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) { return; } prevent(event); start(event, 'pointer', event.pointerId); if (handle.setPointerCapture) { try { handle.setPointerCapture(event.pointerId); } catch (error) {} } });
    window.addEventListener('pointermove', function (event) { if (drag && drag.source === 'pointer' && drag.id === event.pointerId) { prevent(event); move(event); } });
    window.addEventListener('pointerup', function (event) { if (drag && drag.source === 'pointer' && drag.id === event.pointerId) { prevent(event); end(); } });
    window.addEventListener('pointercancel', function (event) { if (drag && drag.source === 'pointer' && drag.id === event.pointerId) { end(); } });
  } else {
    var touchOptions = false;
    try {
      var passiveProbe = Object.defineProperty({}, 'passive', { get:function () { touchOptions = { passive:false }; } });
      var noop = function () {};
      window.addEventListener('toolbar-passive-test', noop, passiveProbe);
      window.removeEventListener('toolbar-passive-test', noop, passiveProbe);
    } catch (error) {}
    handle.addEventListener('touchstart', function (event) { if (event.touches.length !== 1) { return; } prevent(event); lastTouch = new Date().getTime(); start(event.touches[0], 'touch', event.touches[0].identifier); }, touchOptions);
    window.addEventListener('touchmove', function (event) { if (!drag || drag.source !== 'touch') { return; } var touch = touchById(event.touches, drag.id); if (touch) { prevent(event); move(touch); } }, touchOptions);
    window.addEventListener('touchend', function (event) { if (drag && drag.source === 'touch' && touchById(event.changedTouches, drag.id)) { prevent(event); lastTouch = new Date().getTime(); end(); } }, touchOptions);
    window.addEventListener('touchcancel', function () { if (drag && drag.source === 'touch') { end(); } });
    handle.addEventListener('mousedown', function (event) { if (event.button !== 0 || new Date().getTime() - lastTouch < 800) { return; } prevent(event); start(event, 'mouse', 0); });
    window.addEventListener('mousemove', function (event) { if (drag && drag.source === 'mouse') { prevent(event); move(event); } });
    window.addEventListener('mouseup', function (event) { if (drag && drag.source === 'mouse') { prevent(event); end(); } });
  }
  handle.addEventListener('keydown', function (event) {
    var directions = { ArrowLeft:[-16,0], ArrowRight:[16,0], ArrowUp:[0,-16], ArrowDown:[0,16] };
    var direction = directions[event.key]; if (!direction) { return; }
    prevent(event);
    if (position && position.edge) { toolbar.setAttribute('data-dock', ''); }
    var m = metrics(), rect = logicalRect(toolbar);
    setPixels((rect.left - m.bounds.left) * m.sx + direction[0], (rect.top - m.bounds.top) * m.sy + direction[1]); save();
  });
  pen.addEventListener('click', placeMenus); width.addEventListener('click', placeMenus);
  window.addEventListener('resize', applyPosition); window.addEventListener('littleappsorientationchange', applyPosition); window.addEventListener('blur', end);
  try { var saved = JSON.parse(window.localStorage.getItem(key) || 'null'); if (saved && typeof saved.x === 'number' && typeof saved.y === 'number' && isFinite(saved.x) && isFinite(saved.y)) { position = { x:clamp(saved.x,0,1), y:clamp(saved.y,0,1), edge: /^(left|right|top|bottom)$/.test(saved.edge) ? saved.edge : null, layout: /^(horizontal|vertical)$/.test(saved.layout) ? saved.layout : 'vertical' }; } } catch (error) {}
  applyPosition();
}());
