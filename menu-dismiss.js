(function () {
  'use strict';

  function onOutsidePress(getOpenMenu, dismiss) {
    function handle(event) {
      var menu = getOpenMenu();
      if (menu && !menu.panel.contains(event.target) && !menu.trigger.contains(event.target)) {
        dismiss();
      }
    }

    // Capture the press before a canvas suppresses clicks or a menu action replaces its row.
    if (window.PointerEvent) {
      document.addEventListener('pointerdown', handle, true);
    } else {
      document.addEventListener('touchstart', handle, true);
      document.addEventListener('mousedown', handle, true);
    }
    document.addEventListener('click', handle, true);
  }

  // Measure and place in the same coordinate space, including on rotated Kindles.
  function place(panel, trigger, side, options) {
    options = options || {};
    var orientation = window.LittleAppsOrientation;
    function rect(element) { return orientation ? orientation.rect(element) : element.getBoundingClientRect(); }
    var container = options.container;
    var bounds = container ? rect(container) : { left:0, top:0 };
    var size = container ? { width:container.clientWidth, height:container.clientHeight }
      : orientation ? orientation.dimensions() : { width:window.innerWidth, height:window.innerHeight };
    var scaleX = size.width / (bounds.width || size.width || 1);
    var scaleY = size.height / (bounds.height || size.height || 1);
    var anchor = rect(trigger);
    var left = (anchor.left - bounds.left) * scaleX;
    var right = (anchor.right - bounds.left) * scaleX;
    var top = (anchor.top - bounds.top) * scaleY;
    var bottom = (anchor.bottom - bounds.top) * scaleY;
    var room = { left:left, right:size.width - right, top:top, bottom:size.height - bottom };
    var opposite = { left:'right', right:'left', top:'bottom', bottom:'top' }[side];
    var beside = side === 'left' || side === 'right';
    var crossSize = beside ? size.height : size.width;
    var inset = Math.min(options.crossInset || 0, crossSize / 4);
    var maxWidth = size.width - (beside ? 0 : 2 * inset);
    var maxHeight = Math.min(options.maxHeight || size.height, size.height - (beside ? 2 * inset : 0));

    if (options.minWidth) { panel.style.width = Math.max(options.minWidth, right - left) + 'px'; }
    panel.style.maxWidth = maxWidth + 'px';
    panel.style.maxHeight = maxHeight + 'px';
    var extent = beside ? panel.offsetWidth : panel.offsetHeight;
    if (room[side] < extent && room[opposite] > room[side]) { side = opposite; }

    if (beside) { panel.style.maxWidth = Math.max(0, Math.min(maxWidth, room[side])) + 'px'; }
    else { panel.style.maxHeight = Math.max(0, Math.min(maxHeight, room[side])) + 'px'; }

    var width = panel.offsetWidth, height = panel.offsetHeight;
    function fit(start, length) { return Math.max(inset, Math.min(start, crossSize - inset - length)); }
    var x = beside ? (side === 'right' ? right : left - width) : fit(left, width);
    var y = beside ? fit(top, height) : (side === 'bottom' ? bottom : top - height);
    panel.style.right = 'auto';
    panel.style.left = x + 'px';
    panel.style.top = y + 'px';
  }

  window.LittleAppsMenus = { onOutsidePress: onOutsidePress, place: place };
}());
