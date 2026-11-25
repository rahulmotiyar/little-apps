(function () {
  'use strict';
  var key = 'little-apps.orientation';
  var current = 'auto', rotation = 'none';
  function read() {
    try {
      var value = window.localStorage.getItem(key);
      return value === 'portrait' || value === 'landscape' ? value : 'auto';
    } catch (error) { return 'auto'; }
  }
  function viewport() {
    var w = window.innerWidth || document.documentElement.clientWidth;
    var h = window.innerHeight || document.documentElement.clientHeight;
    var visible = window.visualViewport;
    if (visible && visible.scale === 1 && visible.width > 0 && visible.height > 0) {
      w = Math.min(w, visible.width);
      h = Math.min(h, visible.height);
    }
    return { width:Math.floor(w), height:Math.floor(h) };
  }
  function dimensions(screen) {
    screen = screen || viewport();
    var w = screen.width, h = screen.height;
    return { physicalWidth:w, physicalHeight:h, width:rotation === 'none' ? w : h, height:rotation === 'none' ? h : w };
  }
  function rect(element) {
    var r = element.getBoundingClientRect(), size = dimensions();
    if (rotation === 'left') { return { left:size.physicalHeight-r.bottom, top:r.left, right:size.physicalHeight-r.top, bottom:r.right, width:r.height, height:r.width }; }
    if (rotation === 'right') { return { left:r.top, top:size.physicalWidth-r.right, right:r.bottom, bottom:size.physicalWidth-r.left, width:r.height, height:r.width }; }
    return r;
  }
  function point(x, y) {
    var size = dimensions();
    if (rotation === 'left') { return { x:size.physicalHeight-y, y:x }; }
    if (rotation === 'right') { return { x:y, y:size.physicalWidth-x }; }
    return { x:x, y:y };
  }
  function notify() {
    var event = document.createEvent('Event');
    event.initEvent('littleappsorientationchange', false, false);
    window.dispatchEvent(event);
  }
  function update(announce) {
    var screen = viewport(), w = screen.width, h = screen.height;
    rotation = current === 'landscape' && h > w ? 'left' : current === 'portrait' && w > h ? 'right' : 'none';
    var size = dimensions(screen), root = document.documentElement;
    document.body.setAttribute('data-little-rotation', rotation);
    document.body.classList.toggle('little-narrow', size.width <= 420);
    document.body.classList.toggle('little-compact', size.height <= 650);
    document.body.classList.toggle('little-landscape', size.width >= 480 && size.width > size.height);
    document.body.classList.toggle('little-wide-landscape', size.width >= 760 && size.width > size.height);
    document.body.classList.toggle('little-short-landscape', size.width >= 760 && size.width > size.height && size.height <= 650);
    root.style.setProperty('--little-view-width', size.width + 'px');
    root.style.setProperty('--little-view-height', size.height + 'px');
    root.style.setProperty('--little-screen-width', w + 'px');
    root.style.setProperty('--little-screen-height', h + 'px');
    if (announce) { notify(); }
  }
  function apply(value, success, failure) {
    if (value !== 'auto' && value !== 'portrait' && value !== 'landscape') { failure(); return; }
    current = value;
    update(true);
    success();
  }
  window.LittleAppsOrientation = { key:key, read:read, apply:apply, dimensions:dimensions, rect:rect, point:point, status:'applied' };
  current = read();
  update(false);
  window.addEventListener('resize', function () { update(true); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', function () { update(true); });
  function syncNativeBar() {
    if (!window.location || !window.history || !window.history.replaceState || !window.URL) return;
    try {
      var nativeApp = /(?:^|[?&])kindle-app=1(?:&|$)/.test(window.location.search) || window.sessionStorage.getItem('little-apps.kindle') === '1';
      if (!nativeApp) return;
      var show = window.localStorage.getItem('little-apps.show-kindle-bar') !== '0';
      var url = new window.URL(window.location.href);
      var value = show ? '1' : '0';
      if (url.searchParams.get('kindle-bar') !== value) {
        url.searchParams.set('kindle-bar', value);
        window.history.replaceState(null, '', url.href);
      }
    } catch (error) { /* Storage or history restrictions must not block an app. */ }
  }
  window.LittleAppsDisplay = { syncNativeBar:syncNativeBar };
  syncNativeBar();
  window.addEventListener('pageshow', syncNativeBar);
  window.addEventListener('storage', syncNativeBar);
}());
