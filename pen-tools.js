(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  if (root) { root.LittleAppsPens = api; }
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  var styles = ['pencil', 'sharp', 'brush'];
  var names = { pencil:'Pencil', sharp:'Sharp pen', brush:'Brush' };
  var widths = [3, 6, 12];
  var widthNames = ['Fine', 'Medium', 'Thick'];
  var eraserNames = ['Small', 'Medium', 'Large'];
  var eraserRadii = [8, 14, 24];

  function inkWidth(stroke) { return stroke.width * (stroke.style === 'pencil' ? 0.8 : stroke.style === 'brush' ? 1.5 : 1); }
  function createRenderer(document) {
    var graphiteTile = null, graphiteContext = null, graphitePattern = null;
    function pencilInk(context) {
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
    function configureInk(context, stroke) {
      var color = stroke.style === 'pencil' ? pencilInk(context) : '#000';
      context.globalCompositeOperation = stroke.style === 'pencil' || stroke.style === 'brush' ? 'darken' : 'source-over';
      context.fillStyle = color; context.strokeStyle = color;
    }
    function brushGradient(context, first, last, width, radial) {
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

    function drawDot(context, point, width, stroke) {
      if (stroke && stroke.style === 'brush') { context.fillStyle = brushGradient(context, point, point, width, true); }
      context.beginPath();
      context.arc(point[0], point[1], width / 2, 0, Math.PI * 2, false);
      context.fill();
    }

    function drawCurve(context, first, control, last, width, stroke) {
      if (stroke && stroke.style === 'brush') { context.strokeStyle = brushGradient(context, first, last, width, false); }
      context.lineWidth = width;
      context.beginPath();
      context.moveTo(first[0], first[1]);
      context.quadraticCurveTo(control[0], control[1], last[0], last[1]);
      context.stroke();
    }

    return { configure:configureInk, dot:drawDot, curve:drawCurve };
  }

  return { styles:styles, names:names, widths:widths, widthNames:widthNames, eraserNames:eraserNames, eraserRadii:eraserRadii, strokeWidth:inkWidth, createRenderer:createRenderer };
}));
