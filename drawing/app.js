(function () {
  'use strict';

  var storageKey = 'little-apps.drawing.v2';
  var legacyStorageKey = 'little-apps.drawing.v1';
  var maxStrokes = 200;
  var maxPoints = 20000;
  var maxStrokePoints = 1000;
  var penNames = ['Fine', 'Medium', 'Thick'];
  var penWidths = [3, 6, 12];
  var pen = 1;
  var penStyle = 'sharp';
  var eraserSize = 1;
  var penStyleNames = { pencil: 'Pencil', sharp: 'Sharp pen', brush: 'Brush' };
  var eraserNames = ['Small', 'Medium', 'Large'];
  var eraserRadii = [8, 14, 24];
  var tool = 'pen';
  var gesture = null;
  var gestureChanged = false;
  var panPoint = null;
  var history = [];
  var redoHistory = [];
  var zoomSteps = [1, 1.5, 2];
  var zoomIndex = 0;
  var strokes = [];
  var beforeClear = null;
  var pointCount = 0;
  var current = null;
  var activeSource = null;
  var activeId = null;
  var lastTouch = 0;
  var canvas = document.getElementById('drawing');
  var paper = document.getElementById('paper');
  var status = document.getElementById('drawing-status');
  var penButton = document.getElementById('pen');
  var widthButton = document.getElementById('width');
  var eraserButton = document.getElementById('eraser');
  var moveButton = document.getElementById('move-tool');
  var zoomButton = document.getElementById('zoom');
  var redoButton = document.getElementById('redo');
  var undoButton = document.getElementById('undo');
  var clearButton = document.getElementById('clear');
  var penOptions = document.getElementById('pen-options');
  var widthOptions = document.getElementById('width-options');
  var styleButtons = [document.getElementById('pen-pencil'), document.getElementById('pen-sharp'), document.getElementById('pen-brush')];
  var widthButtons = [document.getElementById('width-fine'), document.getElementById('width-medium'), document.getElementById('width-thick')];
  var context;
  var scale = 1;
  var viewScale = 1;
  var offsetX = 0;
  var offsetY = 0;
  var density = 1;
  var previousWidth = 0;
  var previousHeight = 0;

  try { context = canvas.getContext('2d'); } catch (error) { context = null; }
  if (!context) {
    message('This browser cannot open the drawing pad.', true);
    return;
  }

  function message(text, warning) {
    status.className = warning ? 'tool-status' : 'tool-status is-quiet';
    status.textContent = text;
    status.style.display = text ? 'block' : 'none';
  }

  function storageFailed() {
    document.getElementById('storage-warning').style.display = 'block';
  }

  function countPoints(list) {
    var count = 0;
    for (var i = 0; i < list.length; i += 1) { count += list[i].points.length; }
    return count;
  }

  function validStrokes(list, legacy) {
    if (Object.prototype.toString.call(list) !== '[object Array]' || list.length > maxStrokes) { return false; }
    var total = 0;
    for (var i = 0; i < list.length; i += 1) {
      var stroke = list[i];
      if (!stroke || (stroke.style && !Object.prototype.hasOwnProperty.call(penStyleNames, stroke.style)) || penWidths.indexOf(stroke.width) === -1 || Object.prototype.toString.call(stroke.points) !== '[object Array]' || stroke.points.length < 1 || stroke.points.length > maxStrokePoints) { return false; }
      total += stroke.points.length;
      if (total > maxPoints) { return false; }
      for (var j = 0; j < stroke.points.length; j += 1) {
        var point = stroke.points[j];
        if (Object.prototype.toString.call(point) !== '[object Array]' || point.length !== 2 || typeof point[0] !== 'number' || typeof point[1] !== 'number' || !isFinite(point[0]) || !isFinite(point[1]) || point[0] < (legacy ? 0 : -1000000) || point[0] > (legacy ? 1000 : 1000000) || point[1] < (legacy ? 0 : -1000000) || point[1] > (legacy ? 1000 : 1000000)) { return false; }
      }
    }
    return true;
  }

  function restore() {
    try {
      var entry = window.DrawFiles ? window.DrawFiles.current() : null;
      var raw = entry ? entry.raw : window.localStorage.getItem(storageKey);
      var legacy = entry ? entry.legacy : false;
      if (!raw && !window.DrawFiles) {
        raw = window.localStorage.getItem(legacyStorageKey);
        legacy = true;
      }
      if (!raw) { return; }
      var saved = JSON.parse(raw);
      if (!saved || !validStrokes(saved.strokes, legacy) || (saved.beforeClear !== null && !validStrokes(saved.beforeClear, legacy))) { return; }
      strokes = saved.strokes;
      beforeClear = saved.beforeClear;
      pointCount = countPoints(strokes);
      if (saved.pen === 0 || saved.pen === 1 || saved.pen === 2) { pen = saved.pen; }
      if (Object.prototype.hasOwnProperty.call(penStyleNames, saved.penStyle)) { penStyle = saved.penStyle; }
      if (saved.eraserSize === 0 || saved.eraserSize === 1 || saved.eraserSize === 2) { eraserSize = saved.eraserSize; }
    } catch (error) {
      if (!(error instanceof SyntaxError)) { storageFailed(); }
    }
  }

  function save() {
    try {
      var raw = JSON.stringify({ version: 2, strokes: strokes, beforeClear: beforeClear, pen: pen, penStyle: penStyle, eraserSize: eraserSize });
      if (window.DrawFiles) { if (!window.DrawFiles.save(raw)) { storageFailed(); return false; } }
      else { window.localStorage.setItem(storageKey, raw); }
      return true;
    } catch (error) { storageFailed(); return false; }
  }

  function updateButtons() {
    penButton.setAttribute('aria-pressed', String(tool === 'pen'));
    penButton.setAttribute('data-style', penStyle);
    penButton.setAttribute('aria-label', 'Pen: ' + penStyleNames[penStyle]);
    eraserButton.setAttribute('aria-pressed', String(tool === 'eraser'));
    moveButton.setAttribute('aria-pressed', String(tool === 'move'));
    var isEraser = tool === 'eraser';
    var sizeIndex = isEraser ? eraserSize : pen;
    var sizeNames = isEraser ? eraserNames : penNames;
    widthButton.disabled = tool === 'move';
    widthButton.title = (isEraser ? 'Eraser size: ' : 'Pen width: ') + sizeNames[sizeIndex];
    widthButton.setAttribute('aria-label', widthButton.title);
    widthButton.className = 'tool-button pen-width-' + sizeIndex;
    widthButton.setAttribute('data-tool', isEraser ? 'eraser' : 'pen');
    for (var i = 0; i < styleButtons.length; i += 1) {
      styleButtons[i].setAttribute('aria-pressed', String(['pencil', 'sharp', 'brush'][i] === penStyle));
      widthButtons[i].setAttribute('aria-pressed', String(i === sizeIndex));
      widthButtons[i].textContent = sizeNames[i];
    }
    zoomButton.title = 'Zoom: ' + Math.round(zoomSteps[zoomIndex] * 100) + '%';
    zoomButton.setAttribute('aria-label', zoomButton.title);
    undoButton.disabled = !history.length && !strokes.length && !beforeClear;
    redoButton.disabled = !redoHistory.length;
    clearButton.disabled = !strokes.length;
  }

  function snapshot() { return JSON.parse(JSON.stringify({ strokes: strokes, beforeClear: beforeClear })); }
  function remember() {
    history.push(snapshot());
    if (history.length > 20) { history.shift(); }
    redoHistory = [];
  }
  function restoreSnapshot(state) {
    strokes = state.strokes; beforeClear = state.beforeClear; pointCount = countPoints(strokes);
  }

  function inkWidth(stroke) { return stroke.width * (stroke.style === 'pencil' ? 0.8 : stroke.style === 'brush' ? 1.5 : 1); }
  var graphiteTile = null, graphiteContext = null, graphitePattern = null;
  function pencilInk() {
    if (!context.createPattern) { return '#666'; }
    try {
      if (!graphiteTile) {
        var tile = document.createElement('canvas'); tile.width = 16; tile.height = 16;
        var texture = tile.getContext('2d');
        if (!texture) { return '#666'; }
        texture.fillStyle = '#b0b0b0'; texture.fillRect(0, 0, 16, 16);
        var seed = 7919;
        for (var i = 0; i < 64; i += 1) {
          seed = (seed * 1664525 + 1013904223) >>> 0; var x = (seed >>> 16) % 16;
          seed = (seed * 1664525 + 1013904223) >>> 0; var y = (seed >>> 16) % 16;
          texture.fillStyle = i % 3 === 0 ? '#666' : '#888';
          texture.fillRect(x, y, 1, 1);
        }
        graphiteTile = tile;
      }
      if (graphiteContext !== context) { graphitePattern = context.createPattern(graphiteTile, 'repeat'); graphiteContext = context; }
      return graphitePattern || '#666';
    } catch (error) { return '#666'; }
  }
  function configureInk(stroke) {
    var color = stroke.style === 'pencil' ? pencilInk() : '#000';
    context.globalCompositeOperation = stroke.style === 'pencil' || stroke.style === 'brush' ? 'darken' : 'source-over';
    context.fillStyle = color; context.strokeStyle = color;
  }
  function brushGradient(first, last, width, radial) {
    var gradient;
    try {
      if (radial && context.createRadialGradient) {
        gradient = context.createRadialGradient(first[0], first[1], 0, first[0], first[1], width / 2);
        gradient.addColorStop(0, '#222'); gradient.addColorStop(0.55, '#555'); gradient.addColorStop(1, '#aaa');
      } else if (!radial && context.createLinearGradient) {
        var dx = last[0] - first[0], dy = last[1] - first[1], length = Math.sqrt(dx * dx + dy * dy) || 1;
        var x = (first[0] + last[0]) / 2, y = (first[1] + last[1]) / 2;
        var nx = -dy / length * width / 2, ny = dx / length * width / 2;
        if (!nx && !ny) { nx = width / 2; }
        gradient = context.createLinearGradient(x - nx, y - ny, x + nx, y + ny);
        gradient.addColorStop(0, '#aaa'); gradient.addColorStop(0.25, '#666');
        gradient.addColorStop(0.5, '#222'); gradient.addColorStop(0.75, '#666'); gradient.addColorStop(1, '#aaa');
      }
    } catch (error) { return '#333'; }
    return gradient || '#333';
  }

  function drawDot(point, width, stroke) {
    if (stroke && stroke.style === 'brush') { context.fillStyle = brushGradient(point, point, width, true); }
    context.beginPath();
    context.arc(point[0], point[1], width / 2, 0, Math.PI * 2, false);
    context.fill();
  }

  function midpoint(first, second) {
    return [(first[0] + second[0]) / 2, (first[1] + second[1]) / 2];
  }

  function drawCurve(first, control, last, width, stroke) {
    if (stroke && stroke.style === 'brush') { context.strokeStyle = brushGradient(first, last, width, false); }
    context.lineWidth = width;
    context.beginPath();
    context.moveTo(first[0], first[1]);
    context.quadraticCurveTo(control[0], control[1], last[0], last[1]);
    context.stroke();
  }

  function drawStroke(stroke) {
    var points = stroke.points;
    configureInk(stroke);
    if (stroke.style === 'pencil' || stroke.style === 'brush') {
      var width = inkWidth(stroke);
      drawDot(points[0], width, stroke);
      for (var part = 1; part < points.length; part += 1) {
        var previous = points[part - 1];
        var start = part === 1 ? previous : midpoint(points[part - 2], previous);
        drawCurve(start, previous, midpoint(previous, points[part]), width, stroke);
      }
      if (points.length > 1) {
        var finalPoint = points[points.length - 1];
        drawCurve(midpoint(points[points.length - 2], finalPoint), finalPoint, finalPoint, width, stroke);
      }
      return;
    }
    if (points.length === 1) { drawDot(points[0], inkWidth(stroke), stroke); return; }
    context.lineWidth = inkWidth(stroke);
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);
    for (var i = 1; i < points.length; i += 1) {
      var end = midpoint(points[i - 1], points[i]);
      context.quadraticCurveTo(points[i - 1][0], points[i - 1][1], end[0], end[1]);
    }
    var last = points[points.length - 1];
    context.quadraticCurveTo(last[0], last[1], last[0], last[1]);
    context.stroke();
  }

  function redraw() {
    context.globalCompositeOperation = 'source-over';
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(scale, 0, 0, scale, offsetX * density, offsetY * density);
    context.fillStyle = '#000';
    context.strokeStyle = '#000';
    context.lineCap = 'round';
    context.lineJoin = 'round';
    for (var i = 0; i < strokes.length; i += 1) {
      drawStroke(strokes[i]);
    }
  }

  function exportDrawing() {
    finish();
    var left = 0, top = 0, right = 1000, bottom = 1000, i, j;
    for (i = 0; i < strokes.length; i += 1) {
      var stroke = strokes[i], margin = inkWidth(stroke) / 2 + 2;
      for (j = 0; j < stroke.points.length; j += 1) {
        var point = stroke.points[j];
        left = Math.min(left, point[0] - margin); top = Math.min(top, point[1] - margin);
        right = Math.max(right, point[0] + margin); bottom = Math.max(bottom, point[1] + margin);
      }
    }
    var factor = 1600 / Math.max(right - left, bottom - top);
    var image = document.createElement('canvas');
    image.width = Math.max(1, Math.ceil((right - left) * factor));
    image.height = Math.max(1, Math.ceil((bottom - top) * factor));
    var exportContext = image.getContext('2d');
    if (!exportContext) { throw new Error('Cannot create drawing image'); }
    var previousContext = context;
    try {
      context = exportContext;
      context.globalCompositeOperation = 'source-over';
      context.fillStyle = '#fff'; context.fillRect(0, 0, image.width, image.height);
      context.setTransform(factor, 0, 0, factor, -left * factor, -top * factor);
      context.lineCap = 'round'; context.lineJoin = 'round';
      for (i = 0; i < strokes.length; i += 1) { drawStroke(strokes[i]); }
    } finally { context = previousContext; }
    return image;
  }

  function finish() {
    if (!activeSource) { return; }
    if (current) {
      var points = current.points;
      if (points.length > 1) {
        var last = points[points.length - 1];
        drawCurve(midpoint(points[points.length - 2], last), last, last, inkWidth(current), current);
      }
    }
    var changed = !!current || gestureChanged;
    current = null; gesture = null; gestureChanged = false; panPoint = null;
    activeSource = null; activeId = null;
    updateButtons();
    if (changed) { save(); }
  }

  function fitDrawing(width, height) {
    var left = 0;
    var top = 0;
    var right = 1000;
    var bottom = 1000;
    for (var i = 0; i < strokes.length; i += 1) {
      var stroke = strokes[i];
      var margin = inkWidth(stroke) / 2 + 2;
      for (var j = 0; j < stroke.points.length; j += 1) {
        var point = stroke.points[j];
        left = Math.min(left, point[0] - margin);
        top = Math.min(top, point[1] - margin);
        right = Math.max(right, point[0] + margin);
        bottom = Math.max(bottom, point[1] + margin);
      }
    }
    viewScale = Math.min(width / (right - left), height / (bottom - top));
    offsetX = (width - (right - left) * viewScale) / 2 - left * viewScale;
    offsetY = (height - (bottom - top) * viewScale) / 2 - top * viewScale;
    if (zoomSteps[zoomIndex] !== 1) {
      var zoom = zoomSteps[zoomIndex];
      offsetX = width / 2 - (width / 2 - offsetX) * zoom;
      offsetY = height / 2 - (height / 2 - offsetY) * zoom;
      viewScale *= zoom;
    }
    scale = viewScale * density;
  }

  function fitPaper() {
    var view = window.LittleAppsOrientation && window.LittleAppsOrientation.dimensions();
    var width = paper.clientWidth || (view ? view.width : window.innerWidth || document.documentElement.clientWidth);
    var viewportHeight = view ? view.height : window.innerHeight || document.documentElement.clientHeight;
    var top = window.LittleAppsOrientation ? window.LittleAppsOrientation.rect(paper).top : paper.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0);
    var height = Math.max(120, Math.floor(viewportHeight - top));
    width = Math.max(180, Math.floor(width));
    if (width === previousWidth && height === previousHeight) { return; }
    finish();
    previousWidth = width;
    previousHeight = height;
    paper.style.height = height + 'px';
    density = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(width * density));
    canvas.height = Math.max(1, Math.round(height * density));
    fitDrawing(width, height);
    redraw();
  }

  function position(event) {
    var bounds = window.LittleAppsOrientation ? window.LittleAppsOrientation.rect(canvas) : canvas.getBoundingClientRect();
    var width = bounds.width || bounds.right - bounds.left;
    var height = bounds.height || bounds.bottom - bounds.top;
    if (!width || !height || typeof event.clientX !== 'number' || typeof event.clientY !== 'number') { return null; }
    var input = window.LittleAppsOrientation ? window.LittleAppsOrientation.point(event.clientX, event.clientY) : { x:event.clientX, y:event.clientY };
    var x = Math.max(0, Math.min(previousWidth, (input.x - bounds.left) * previousWidth / width));
    var y = Math.max(0, Math.min(previousHeight, (input.y - bounds.top) * previousHeight / height));
    return [
      Math.round(Math.max(-1000000, Math.min(1000000, (x - offsetX) / viewScale)) * 10) / 10,
      Math.round(Math.max(-1000000, Math.min(1000000, (y - offsetY) / viewScale)) * 10) / 10
    ];
  }

  function prevent(event) { if (event.cancelable !== false) { event.preventDefault(); } }

  function touchById(list, id) {
    for (var i = 0; i < list.length; i += 1) { if (list[i].identifier === id) { return list[i]; } }
    return null;
  }

  function distanceToSegment(point, a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1];
    var length = dx * dx + dy * dy;
    var t = length ? Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / length)) : 0;
    var x = point[0] - (a[0] + t * dx), y = point[1] - (a[1] + t * dy);
    return Math.sqrt(x * x + y * y);
  }
  function eraseAt(event) {
    var point = position(event); if (!point) { return; }
    var radius = eraserRadii[eraserSize] / viewScale;
    for (var i = strokes.length - 1; i >= 0; i -= 1) {
      var stroke = strokes[i], pts = stroke.points, hit = false;
      for (var j = 0; j < pts.length; j += 1) {
        if (distanceToSegment(point, pts[j], pts[Math.min(j + 1, pts.length - 1)]) <= radius + inkWidth(stroke) / 2) { hit = true; break; }
      }
      if (hit) {
        if (!gestureChanged) { remember(); gestureChanged = true; }
        pointCount -= stroke.points.length; strokes.splice(i, 1);
      }
    }
    if (gestureChanged) { redraw(); updateButtons(); }
  }
  function begin(event, source, id) {
    if (activeSource) { return; }
    if (tool === 'move' || tool === 'eraser') {
      gesture = tool; gestureChanged = false; activeSource = source; activeId = id;
      if (tool === 'move') { var pan = window.LittleAppsOrientation ? window.LittleAppsOrientation.point(event.clientX, event.clientY) : { x:event.clientX, y:event.clientY }; panPoint = [pan.x, pan.y]; }
      else { eraseAt(event); }
      return;
    }
    if (strokes.length >= maxStrokes || pointCount >= maxPoints) {
      message('Drawing full. Undo or clear to continue (200 strokes / 20,000 points).', true); return;
    }
    var point = position(event); if (!point) { return; }
    remember(); current = { width: penWidths[pen], style: penStyle, points: [point] };
    strokes.push(current); pointCount += 1; activeSource = source; activeId = id;
    message(''); configureInk(current); drawDot(point, inkWidth(current), current); updateButtons();
  }

  function move(event, ending) {
    if (gesture === 'move') {
      var bounds = window.LittleAppsOrientation ? window.LittleAppsOrientation.rect(canvas) : canvas.getBoundingClientRect();
      var pan = window.LittleAppsOrientation ? window.LittleAppsOrientation.point(event.clientX, event.clientY) : { x:event.clientX, y:event.clientY };
      offsetX += (pan.x - panPoint[0]) * previousWidth / (bounds.width || previousWidth);
      offsetY += (pan.y - panPoint[1]) * previousHeight / (bounds.height || previousHeight);
      panPoint = [pan.x, pan.y]; redraw(); return;
    }
    if (gesture === 'eraser') { eraseAt(event); return; }
    if (!current) { return; }
    var point = position(event); if (!point) { return; }
    var previous = current.points[current.points.length - 1];
    var dx = point[0] - previous[0], dy = point[1] - previous[1], distance = dx * dx + dy * dy;
    if (distance === 0 || (!ending && distance * viewScale * viewScale < 0.25)) { return; }
    if (pointCount >= maxPoints || current.points.length >= maxStrokePoints) {
      message(pointCount >= maxPoints ? 'Drawing full. Undo or clear to continue (200 strokes / 20,000 points).' : 'Long stroke paused. Lift your finger, then continue drawing.', true); return;
    }
    current.points.push(point); pointCount += 1;
    var count = current.points.length;
    var first = count === 2 ? previous : midpoint(current.points[count - 3], previous);
    drawCurve(first, previous, midpoint(previous, point), inkWidth(current), current);
  }

  function movePointer(event, ending) {
    var samples = null;
    if (typeof event.getCoalescedEvents === 'function') {
      try { samples = event.getCoalescedEvents(); } catch (error) {}
    }
    if (samples) {
      for (var i = 0; i < samples.length; i += 1) { move(samples[i], false); }
    }
    move(event, ending);
  }

  var nonPassive = false;
  try {
    var testListener = function () {};
    var options = Object.defineProperty({}, 'passive', { get: function () { nonPassive = { passive: false }; } });
    window.addEventListener('drawing-passive-test', testListener, options);
    window.removeEventListener('drawing-passive-test', testListener, options);
  } catch (error) { nonPassive = false; }

  if (window.PointerEvent) {
    canvas.addEventListener('pointerdown', function (event) {
      prevent(event);
      if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) { return; }
      begin(event, 'pointer', event.pointerId);
      if (activeSource && canvas.setPointerCapture) {
        try { canvas.setPointerCapture(event.pointerId); } catch (error) {}
      }
    }, false);
    window.addEventListener('pointermove', function (event) {
      if (activeSource === 'pointer' && event.pointerId === activeId) { prevent(event); movePointer(event, false); }
    }, false);
    window.addEventListener('pointerup', function (event) {
      if (activeSource === 'pointer' && event.pointerId === activeId) { prevent(event); movePointer(event, true); finish(); }
    }, false);
    window.addEventListener('pointercancel', function (event) {
      if (activeSource === 'pointer' && event.pointerId === activeId) { finish(); }
    }, false);
    canvas.addEventListener('lostpointercapture', function () { if (activeSource === 'pointer') { finish(); } }, false);
  } else {
    canvas.addEventListener('touchstart', function (event) {
      prevent(event);
      lastTouch = new Date().getTime();
      if (!activeSource && event.touches.length === 1) { begin(event.touches[0], 'touch', event.touches[0].identifier); }
    }, nonPassive);
    canvas.addEventListener('touchmove', function (event) {
      prevent(event);
      if (activeSource !== 'touch') { return; }
      var touch = touchById(event.touches, activeId);
      if (touch) { move(touch); }
    }, nonPassive);
    window.addEventListener('touchend', function (event) {
      lastTouch = new Date().getTime();
      if (activeSource !== 'touch') { return; }
      var touch = touchById(event.changedTouches, activeId);
      if (touch) { prevent(event); move(touch, true); finish(); }
    }, nonPassive);
    window.addEventListener('touchcancel', function (event) {
      lastTouch = new Date().getTime();
      if (activeSource === 'touch' && touchById(event.changedTouches, activeId)) { finish(); }
    }, nonPassive);
    canvas.addEventListener('mousedown', function (event) {
      if (event.button !== 0 || new Date().getTime() - lastTouch < 800) { return; }
      prevent(event);
      begin(event, 'mouse', 0);
    }, false);
    window.addEventListener('mousemove', function (event) {
      if (activeSource === 'mouse') { prevent(event); move(event); }
    }, false);
    window.addEventListener('mouseup', function (event) {
      if (activeSource === 'mouse') { prevent(event); move(event, true); finish(); }
    }, false);
  }

  function closeOptions() {
    penOptions.hidden = true; widthOptions.hidden = true;
    penButton.setAttribute('aria-expanded', 'false'); widthButton.setAttribute('aria-expanded', 'false');
  }
  function selectTool(value) {
    finish(); closeOptions(); tool = value; updateButtons();
    message(value === 'pen' ? '' : value === 'eraser' ? 'Eraser: touch a stroke to remove it.' : 'Move: drag the canvas.');
  }
  penButton.onclick = function () {
    var opening = tool !== 'pen' || penOptions.hidden;
    selectTool('pen'); penOptions.hidden = !opening; penButton.setAttribute('aria-expanded', String(opening));
  };
  eraserButton.onclick = function () { selectTool('eraser'); };
  moveButton.onclick = function () { selectTool('move'); };
  widthButton.onclick = function () {
    if (tool === 'move') { return; }
    finish(); var opening = widthOptions.hidden; closeOptions(); widthOptions.hidden = !opening;
    widthButton.setAttribute('aria-expanded', String(opening));
  };
  ['pencil', 'sharp', 'brush'].forEach(function (style, index) {
    styleButtons[index].onclick = function () { penStyle = style; tool = 'pen'; closeOptions(); updateButtons(); message(penStyleNames[style]); save(); };
  });
  widthButtons.forEach(function (button, index) {
    button.onclick = function () {
      if (tool === 'eraser') { eraserSize = index; } else { pen = index; }
      closeOptions(); updateButtons(); message((tool === 'eraser' ? 'Eraser: ' + eraserNames[index] : penStyleNames[penStyle] + ': ' + penNames[index])); save();
    };
  });
  var penMenu = { panel: penOptions, trigger: penButton };
  var widthMenu = { panel: widthOptions, trigger: widthButton };
  window.LittleAppsMenus.onOutsidePress(function () {
    if (!penOptions.hidden) { return penMenu; }
    return widthOptions.hidden ? null : widthMenu;
  }, closeOptions);
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') { closeOptions(); } });
  zoomButton.onclick = function () {
    closeOptions(); finish(); var oldZoom = zoomSteps[zoomIndex]; zoomIndex = (zoomIndex + 1) % zoomSteps.length;
    var ratio = zoomSteps[zoomIndex] / oldZoom;
    offsetX = previousWidth / 2 - (previousWidth / 2 - offsetX) * ratio;
    offsetY = previousHeight / 2 - (previousHeight / 2 - offsetY) * ratio;
    viewScale *= ratio; scale = viewScale * density; redraw(); updateButtons();
    message('Zoom: ' + Math.round(zoomSteps[zoomIndex] * 100) + '%');
  };
  undoButton.onclick = function () {
    finish();
    if (history.length) { redoHistory.push(snapshot()); restoreSnapshot(history.pop()); }
    else if (strokes.length) { redoHistory.push(snapshot()); pointCount -= strokes.pop().points.length; }
    else if (beforeClear) { redoHistory.push(snapshot()); strokes = beforeClear; beforeClear = null; pointCount = countPoints(strokes); }
    else { return; }
    redraw(); updateButtons(); message('Last change undone.'); save();
  };
  redoButton.onclick = function () {
    finish(); if (!redoHistory.length) { return; }
    history.push(snapshot()); if (history.length > 20) { history.shift(); }
    restoreSnapshot(redoHistory.pop()); redraw(); updateButtons(); message('Change restored.'); save();
  };
  clearButton.onclick = function () {
    finish(); if (!strokes.length) { return; }
    remember(); beforeClear = strokes; strokes = []; pointCount = 0;
    fitDrawing(previousWidth, previousHeight); redraw(); updateButtons(); message('Page cleared. Undo brings it back.'); save();
  };
  window.addEventListener('resize', fitPaper, false);
  window.addEventListener('littleappsorientationchange', fitPaper, false);
  window.addEventListener('blur', finish, false);
  window.addEventListener('pagehide', finish, false);
  restore();
  if (window.DrawFiles) {
    window.DrawFiles.connect({
      save: function () { finish(); return save(); },
      exportImage: exportDrawing,
      open: function () {
        finish(); closeOptions(); strokes = []; beforeClear = null; pointCount = 0;
        history = []; redoHistory = []; viewScale = 1; zoomIndex = 0; offsetX = 0; offsetY = 0;
        restore(); fitDrawing(previousWidth, previousHeight); redraw(); updateButtons(); message('');
      }
    });
  }
  penButton.disabled = false; widthButton.disabled = false; eraserButton.disabled = false; moveButton.disabled = false; zoomButton.disabled = false;
  updateButtons();
  fitPaper();
}());
