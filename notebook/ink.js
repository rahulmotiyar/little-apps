(function (root, factory) {
  'use strict';
  var pens = typeof module === 'object' && module.exports ? require('../pen-tools.js') : root.LittleAppsPens;
  var api = factory(root, pens);
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  if (root) { root.NotebookInk = api; }
}(typeof window !== 'undefined' ? window : null, function (root, pens) {
  'use strict';

  var MAX_STROKES = 200;
  var MAX_POINTS = 20000;
  var MAX_STROKE_POINTS = 1000;
  var MAX_COORDINATE = 100000;

  function copy(list) {
    var result = [];
    for (var i = 0; i < list.length; i += 1) {
      var points = [];
      for (var j = 0; j < list[i].points.length; j += 1) { points.push(list[i].points[j].slice(0)); }
      var stroke = { width: list[i].width, points: points };
      if (list[i].style) { stroke.style = list[i].style; }
      result.push(stroke);
    }
    return result;
  }

  function valid(list) {
    if (Object.prototype.toString.call(list) !== '[object Array]' || list.length > MAX_STROKES) { return false; }
    var count = 0;
    for (var i = 0; i < list.length; i += 1) {
      var stroke = list[i];
      if (!stroke || pens.widths.indexOf(stroke.width) === -1 || (stroke.style !== undefined && pens.styles.indexOf(stroke.style) === -1) || Object.prototype.toString.call(stroke.points) !== '[object Array]' || !stroke.points.length || stroke.points.length > MAX_STROKE_POINTS) { return false; }
      count += stroke.points.length;
      if (count > MAX_POINTS) { return false; }
      for (var j = 0; j < stroke.points.length; j += 1) {
        var point = stroke.points[j];
        if (Object.prototype.toString.call(point) !== '[object Array]' || point.length !== 2 || typeof point[0] !== 'number' || typeof point[1] !== 'number' || !isFinite(point[0]) || !isFinite(point[1]) || Math.abs(point[0]) > MAX_COORDINATE || Math.abs(point[1]) > MAX_COORDINATE) { return false; }
      }
    }
    return true;
  }

  function distanceSquared(point, first, second) {
    var dx = second[0] - first[0];
    var dy = second[1] - first[1];
    var length = dx * dx + dy * dy;
    var t = length ? ((point[0] - first[0]) * dx + (point[1] - first[1]) * dy) / length : 0;
    t = Math.max(0, Math.min(1, t));
    dx = point[0] - first[0] - t * dx;
    dy = point[1] - first[1] - t * dy;
    return dx * dx + dy * dy;
  }

  function segmentsNear(a, b, c, d, radiusSquared) {
    var abX = b[0] - a[0];
    var abY = b[1] - a[1];
    var cdX = d[0] - c[0];
    var cdY = d[1] - c[1];
    var denominator = abX * cdY - abY * cdX;
    if (denominator) {
      var acX = c[0] - a[0];
      var acY = c[1] - a[1];
      var t = (acX * cdY - acY * cdX) / denominator;
      var u = (acX * abY - acY * abX) / denominator;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) { return true; }
    }
    return distanceSquared(a, c, d) <= radiusSquared || distanceSquared(b, c, d) <= radiusSquared || distanceSquared(c, a, b) <= radiusSquared || distanceSquared(d, a, b) <= radiusSquared;
  }

  function midpoint(first, second) { return [(first[0] + second[0]) / 2, (first[1] + second[1]) / 2]; }

  function curveNear(first, second, start, control, end, radius, toleranceSquared, depth) {
    if (Math.max(first[0], second[0]) + radius < Math.min(start[0], control[0], end[0]) || Math.min(first[0], second[0]) - radius > Math.max(start[0], control[0], end[0]) || Math.max(first[1], second[1]) + radius < Math.min(start[1], control[1], end[1]) || Math.min(first[1], second[1]) - radius > Math.max(start[1], control[1], end[1])) { return false; }
    if (depth >= 10 || distanceSquared(control, start, end) <= toleranceSquared) { return segmentsNear(first, second, start, end, radius * radius); }
    var leftControl = midpoint(start, control);
    var rightControl = midpoint(control, end);
    var middle = midpoint(leftControl, rightControl);
    return curveNear(first, second, start, leftControl, middle, radius, toleranceSquared, depth + 1) || curveNear(first, second, middle, rightControl, end, radius, toleranceSquared, depth + 1);
  }

  function create(options) {
    options = options || {};
    var canvas = options.canvas;
    var paper = options.paper || canvas;
    var host = canvas && canvas.ownerDocument && canvas.ownerDocument.defaultView || root;
    var renderer = pens.createRenderer(canvas && canvas.ownerDocument);
    var onChange = typeof options.onChange === 'function' ? options.onChange : function () {};
    var onNotice = typeof options.onNotice === 'function' ? options.onNotice : function () {};
    var context = null;
    var strokes = [];
    var history = [];
    var gesture = null;
    var tool = 'draw';
    var penStyle = 'sharp';
    var penWidth = pens.widths[1];
    var eraserRadius = pens.eraserRadii[1];
    var source = null;
    var sourceId = null;
    var lastTouch = 0;
    var pointCount = 0;
    var width = 0;
    var height = 0;
    var density = 1;
    var viewScale = 1;
    var offsetX = 0;
    var offsetY = 0;
    var needsFit = true;

    try { context = canvas && canvas.getContext('2d'); } catch (error) { context = null; }
    if (!context) { onNotice('This browser cannot open the drawing pad.'); }

    function recount() {
      pointCount = 0;
      for (var i = 0; i < strokes.length; i += 1) { pointCount += strokes[i].points.length; }
    }

    function fit() {
      var left = 0;
      var top = 0;
      var right = 1000;
      var bottom = 1000;
      for (var i = 0; i < strokes.length; i += 1) {
        var margin = pens.strokeWidth(strokes[i]) / 2 + 2;
        for (var j = 0; j < strokes[i].points.length; j += 1) {
          var point = strokes[i].points[j];
          left = Math.min(left, point[0] - margin);
          top = Math.min(top, point[1] - margin);
          right = Math.max(right, point[0] + margin);
          bottom = Math.max(bottom, point[1] + margin);
        }
      }
      viewScale = Math.min(width / (right - left), height / (bottom - top));
      offsetX = (width - (right - left) * viewScale) / 2 - left * viewScale;
      offsetY = (height - (bottom - top) * viewScale) / 2 - top * viewScale;
    }

    function drawStroke(stroke, completed) {
      var points = stroke.points;
      var strokeWidth = pens.strokeWidth(stroke);
      renderer.configure(context, stroke);
      renderer.dot(context, points[0], strokeWidth, stroke);
      if (points.length < 2) { return; }
      if (stroke.style === 'brush' || stroke.style === 'pencil') {
        for (var part = 1; part < points.length; part += 1) {
          var previous = points[part - 1];
          var start = part === 1 ? previous : midpoint(points[part - 2], previous);
          renderer.curve(context, start, previous, midpoint(previous, points[part]), strokeWidth, stroke);
        }
        if (completed) {
          var finalPoint = points[points.length - 1];
          renderer.curve(context, midpoint(points[points.length - 2], finalPoint), finalPoint, finalPoint, strokeWidth, stroke);
        }
        return;
      }
      context.lineWidth = strokeWidth;
      context.beginPath();
      context.moveTo(points[0][0], points[0][1]);
      for (var i = 1; i < points.length; i += 1) {
        var end = midpoint(points[i - 1], points[i]);
        context.quadraticCurveTo(points[i - 1][0], points[i - 1][1], end[0], end[1]);
      }
      if (completed) {
        var last = points[points.length - 1];
        context.quadraticCurveTo(last[0], last[1], last[0], last[1]);
      }
      context.stroke();
    }

    function redraw() {
      if (!context || !width || !height) { return; }
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.setTransform(viewScale * density, 0, 0, viewScale * density, offsetX * density, offsetY * density);
      context.fillStyle = '#000';
      context.strokeStyle = '#000';
      context.lineCap = 'round';
      context.lineJoin = 'round';
      for (var i = 0; i < strokes.length; i += 1) {
        drawStroke(strokes[i], !gesture || gesture.stroke !== strokes[i]);
      }
    }

    function resize() {
      if (!context || !paper) { return false; }
      var bounds = host && host.LittleAppsOrientation ? host.LittleAppsOrientation.rect(paper) : paper.getBoundingClientRect();
      var nextWidth = Math.floor(bounds.width || bounds.right - bounds.left || 0);
      var nextHeight = Math.floor(bounds.height || bounds.bottom - bounds.top || 0);
      if (nextWidth < 1 || nextHeight < 1) { return false; }
      var nextDensity = Math.max(1, Math.min(2, host && host.devicePixelRatio || 1));
      if (nextWidth === width && nextHeight === height && nextDensity === density && !needsFit) { return true; }
      width = nextWidth;
      height = nextHeight;
      density = nextDensity;
      canvas.width = Math.max(1, Math.round(width * density));
      canvas.height = Math.max(1, Math.round(height * density));
      fit();
      needsFit = false;
      redraw();
      return true;
    }

    function position(event) {
      if (!width || !height || !event || typeof event.clientX !== 'number' || typeof event.clientY !== 'number') { return null; }
      var bounds = host && host.LittleAppsOrientation ? host.LittleAppsOrientation.rect(canvas) : canvas.getBoundingClientRect();
      var boundsWidth = bounds.width || bounds.right - bounds.left;
      var boundsHeight = bounds.height || bounds.bottom - bounds.top;
      if (!boundsWidth || !boundsHeight) { return null; }
      var point = host && host.LittleAppsOrientation ? host.LittleAppsOrientation.point(event.clientX, event.clientY) : { x:event.clientX, y:event.clientY };
      var x = Math.max(0, Math.min(width, (point.x - bounds.left) * width / boundsWidth));
      var y = Math.max(0, Math.min(height, (point.y - bounds.top) * height / boundsHeight));
      return [Math.round(Math.max(-MAX_COORDINATE, Math.min(MAX_COORDINATE, (x - offsetX) / viewScale)) * 10) / 10, Math.round(Math.max(-MAX_COORDINATE, Math.min(MAX_COORDINATE, (y - offsetY) / viewScale)) * 10) / 10];
    }

    function eraseBetween(first, second) {
      var removed = false;
      for (var i = strokes.length - 1; i >= 0; i -= 1) {
        var stroke = strokes[i];
        var radius = eraserRadius / viewScale + pens.strokeWidth(stroke) / 2;
        var hit = stroke.points.length === 1 && distanceSquared(stroke.points[0], first, second) <= radius * radius;
        var start = stroke.points[0];
        var tolerance = 1 / viewScale;
        for (var j = 1; !hit && j < stroke.points.length; j += 1) {
          var end = midpoint(stroke.points[j - 1], stroke.points[j]);
          hit = curveNear(first, second, start, stroke.points[j - 1], end, radius, tolerance * tolerance, 0);
          start = end;
        }
        if (!hit && stroke.points.length > 1) { hit = segmentsNear(first, second, start, stroke.points[stroke.points.length - 1], radius * radius); }
        if (hit) { strokes.splice(i, 1); removed = true; }
      }
      if (removed) { recount(); gesture.changed = true; redraw(); }
    }

    function begin(event, kind, id) {
      if (!context || gesture || !resize()) { return; }
      var point = position(event);
      if (!point) { return; }
      if (tool === 'draw' && (strokes.length >= MAX_STROKES || pointCount >= MAX_POINTS)) {
        onNotice('Drawing full. Erase a stroke or use Undo to make room.');
        return;
      }
      gesture = { before: copy(strokes), tool: tool, changed: false, last: point, stroke: null };
      onNotice('');
      source = kind;
      sourceId = id;
      if (tool === 'erase') { eraseBetween(point, point); }
      else {
        gesture.stroke = { width: penWidth, points: [point] };
        if (penStyle !== 'sharp') { gesture.stroke.style = penStyle; }
        strokes.push(gesture.stroke);
        pointCount += 1;
        gesture.changed = true;
        renderer.configure(context, gesture.stroke);
        renderer.dot(context, point, pens.strokeWidth(gesture.stroke), gesture.stroke);
      }
    }

    function move(event, finalSample) {
      if (!gesture) { return; }
      var point = position(event);
      if (!point) { return; }
      if (gesture.tool === 'erase') { eraseBetween(gesture.last, point); gesture.last = point; return; }
      var previous = gesture.stroke.points[gesture.stroke.points.length - 1];
      var dx = point[0] - previous[0];
      var dy = point[1] - previous[1];
      if ((!dx && !dy) || (!finalSample && (dx * dx + dy * dy) * viewScale * viewScale < 0.25)) { return; }
      if (pointCount >= MAX_POINTS || gesture.stroke.points.length >= MAX_STROKE_POINTS) {
        onNotice(pointCount >= MAX_POINTS ? 'Drawing full. Erase a stroke or use Undo to make room.' : 'Lift your finger, then continue drawing.');
        return;
      }
      gesture.stroke.points.push(point);
      pointCount += 1;
      var points = gesture.stroke.points;
      var count = points.length;
      var start = count === 2 ? points[0] : midpoint(points[count - 3], previous);
      renderer.curve(context, start, previous, midpoint(previous, point), pens.strokeWidth(gesture.stroke), gesture.stroke);
    }

    function movePointer(event, finalSample) {
      if (event && typeof event.getCoalescedEvents === 'function') {
        try {
          var samples = event.getCoalescedEvents();
          for (var i = 0; samples && i < samples.length; i += 1) { move(samples[i], false); }
        } catch (error) {}
      }
      move(event, finalSample);
    }

    function finish() {
      if (!gesture) { return; }
      var ended = gesture;
      if (ended.tool === 'draw' && ended.stroke.points.length > 1) {
        var points = ended.stroke.points;
        var last = points[points.length - 1];
        renderer.curve(context, midpoint(points[points.length - 2], last), last, last, pens.strokeWidth(ended.stroke), ended.stroke);
      }
      gesture = null;
      source = null;
      sourceId = null;
      if (ended.changed) {
        history.push(ended.before);
        if (history.length > 20) { history.shift(); }
        onChange(copy(strokes));
      }
    }

    function load(list) {
      if (!valid(list)) { onNotice('This drawing could not be opened.'); return false; }
      gesture = null;
      source = null;
      sourceId = null;
      strokes = copy(list);
      history = [];
      recount();
      needsFit = true;
      resize();
      return true;
    }

    function setTool(value) {
      if (value !== 'draw' && value !== 'erase') { return false; }
      tool = value;
      if (canvas && canvas.style) { canvas.style.cursor = value === 'erase' ? 'cell' : 'crosshair'; }
      return true;
    }

    function setPen(style, widthIndex) {
      penStyle = style;
      penWidth = pens.widths[widthIndex];
    }

    function setEraserSize(sizeIndex) { eraserRadius = pens.eraserRadii[sizeIndex]; }

    function undo() {
      finish();
      if (!history.length) { return false; }
      strokes = history.pop();
      onNotice('');
      recount();
      if (width && height) { fit(); }
      redraw();
      onChange(copy(strokes));
      return true;
    }

    function prevent(event) { if (event && event.cancelable !== false && event.preventDefault) { event.preventDefault(); } }
    function findTouch(list, id) { for (var i = 0; i < list.length; i += 1) { if (list[i].identifier === id) { return list[i]; } } return null; }

    if (context && host && host.addEventListener && canvas.addEventListener) {
      var nonPassive = false;
      try {
        var listener = function () {};
        var passiveTest = Object.defineProperty({}, 'passive', { get: function () { nonPassive = { passive: false }; } });
        host.addEventListener('notebook-passive-test', listener, passiveTest);
        host.removeEventListener('notebook-passive-test', listener, passiveTest);
      } catch (error) { nonPassive = false; }

      if (host.PointerEvent) {
        canvas.addEventListener('pointerdown', function (event) {
          if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) { return; }
          prevent(event);
          begin(event, 'pointer', event.pointerId);
          if (gesture && canvas.setPointerCapture) { try { canvas.setPointerCapture(event.pointerId); } catch (error) {} }
        }, false);
        host.addEventListener('pointermove', function (event) { if (source === 'pointer' && sourceId === event.pointerId) { prevent(event); movePointer(event, false); } }, false);
        host.addEventListener('pointerup', function (event) { if (source === 'pointer' && sourceId === event.pointerId) { prevent(event); movePointer(event, true); finish(); } }, false);
        host.addEventListener('pointercancel', function (event) { if (source === 'pointer' && sourceId === event.pointerId) { finish(); } }, false);
        canvas.addEventListener('lostpointercapture', function () { if (source === 'pointer') { finish(); } }, false);
      } else {
        canvas.addEventListener('touchstart', function (event) {
          prevent(event); lastTouch = new Date().getTime();
          if (!gesture && event.touches.length === 1) { begin(event.touches[0], 'touch', event.touches[0].identifier); }
        }, nonPassive);
        canvas.addEventListener('touchmove', function (event) {
          prevent(event);
          var touch = source === 'touch' && findTouch(event.touches, sourceId);
          if (touch) { move(touch); }
        }, nonPassive);
        host.addEventListener('touchend', function (event) {
          lastTouch = new Date().getTime();
          var touch = source === 'touch' && findTouch(event.changedTouches, sourceId);
          if (touch) { prevent(event); move(touch, true); finish(); }
        }, nonPassive);
        host.addEventListener('touchcancel', function (event) {
          lastTouch = new Date().getTime();
          if (source === 'touch' && findTouch(event.changedTouches, sourceId)) { finish(); }
        }, nonPassive);
        canvas.addEventListener('mousedown', function (event) {
          if (event.button !== 0 || new Date().getTime() - lastTouch < 800) { return; }
          prevent(event); begin(event, 'mouse', 0);
        }, false);
        host.addEventListener('mousemove', function (event) { if (source === 'mouse') { prevent(event); move(event); } }, false);
        host.addEventListener('mouseup', function (event) { if (source === 'mouse') { prevent(event); move(event, true); finish(); } }, false);
      }
      host.addEventListener('blur', finish, false);
      host.addEventListener('pagehide', finish, false);
      host.addEventListener('resize', resize, false);
      host.addEventListener('littleappsorientationchange', resize, false);
    }

    return { load: load, setTool: setTool, setPen: setPen, setEraserSize: setEraserSize, resize: resize, finish: finish, undo: undo, canUndo: function () { return Boolean(history.length || gesture && gesture.changed); }, getStrokes: function () { return copy(strokes); } };
  }

  return { create: create };
}));
