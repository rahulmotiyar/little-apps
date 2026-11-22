(function (root) {
  'use strict';
  function bind(element, options) {
    var start = null, claimed = false, suppressClick = false;
    function point(event) { return options.point ? options.point(event.clientX, event.clientY) : {x:event.clientX,y:event.clientY}; }
    function begin(event) {
      if (event.button != null && event.button !== 0 || event.isPrimary === false) return;
      start = point(event); claimed = false; suppressClick = false;
    }
    function move(event) {
      if (!start) return;
      var p = point(event), dx = p.x - start.x, dy = p.y - start.y;
      if (!claimed && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        claimed = true;
        if (event.pointerId != null && element.setPointerCapture) {
          try { element.setPointerCapture(event.pointerId); } catch (error) {}
        }
      }
      if (claimed) event.preventDefault();
    }
    function end(event) {
      if (!start) return;
      move(event);
      var p = point(event), dx = p.x - start.x;
      if (claimed) {
        event.preventDefault(); suppressClick = true;
        if (Math.abs(dx) >= 50) options.turn(dx < 0 ? 1 : -1);
      }
      start = null;
    }
    function cancel() { if (claimed) suppressClick = true; start = null; claimed = false; }
    if (options.pointerEvents) {
      element.addEventListener('pointerdown', begin);
      element.addEventListener('pointermove', move, {passive:false});
      element.addEventListener('pointerup', end);
      element.addEventListener('pointercancel', cancel);
    } else {
      function touch(handler, changed) { return function (event) {
        if (!changed && event.touches.length !== 1) { cancel(); return; }
        var p = (changed ? event.changedTouches : event.touches)[0];
        if (p) handler({clientX:p.clientX,clientY:p.clientY,preventDefault:function () { event.preventDefault(); }});
      }; }
      element.addEventListener('touchstart', touch(begin), {passive:true});
      element.addEventListener('touchmove', touch(move), {passive:false});
      element.addEventListener('touchend', touch(end, true), {passive:false});
      element.addEventListener('touchcancel', cancel);
      element.addEventListener('mousedown', begin);
      element.addEventListener('mousemove', move);
      element.addEventListener('mouseup', end);
      element.addEventListener('mouseleave', cancel);
    }
    element.addEventListener('dragstart', function (event) { event.preventDefault(); });
    element.addEventListener('click', function (event) {
      if (!suppressClick) return;
      suppressClick = false; event.preventDefault(); event.stopImmediatePropagation();
    }, true);
  }
  if (typeof module === 'object' && module.exports) module.exports = bind;
  else root.LittleAppsGestures = bind;
}(typeof window === 'undefined' ? this : window));
