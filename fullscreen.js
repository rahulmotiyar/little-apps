(function () {
  'use strict';

  var button = document.getElementById('web-fullscreen');
  var message = document.getElementById('web-fullscreen-message');
  var root = document.documentElement;
  var api;

  if (document.fullscreenEnabled === true &&
      typeof root.requestFullscreen === 'function' &&
      typeof document.exitFullscreen === 'function') {
    api = { enter: 'requestFullscreen', exit: 'exitFullscreen', element: 'fullscreenElement', change: 'fullscreenchange' };
  } else if (document.webkitFullscreenEnabled === true &&
             typeof root.webkitRequestFullscreen === 'function' &&
             typeof document.webkitExitFullscreen === 'function') {
    api = { enter: 'webkitRequestFullscreen', exit: 'webkitExitFullscreen', element: 'webkitFullscreenElement', change: 'webkitfullscreenchange' };
  }

  if (!button || !api) { return; }

  function update() {
    var active = Boolean(document[api.element]);
    var label = active ? 'Exit fullscreen' : 'Enter fullscreen';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.classList.toggle('is-fullscreen', active);
    message.textContent = '';
  }

  function failed() {
    message.textContent = 'Fullscreen is unavailable in this browser.';
  }

  button.addEventListener('click', function () {
    try {
      var result = document[api.element] ? document[api.exit]() : root[api.enter]();
      if (result && typeof result.then === 'function') { result.then(null, failed); }
    } catch (error) {
      failed();
    }
  });

  document.addEventListener(api.change, update);
  document.addEventListener(api.change.replace('change', 'error'), failed);
  window.addEventListener('pageshow', update);
  document.body.classList.add('web-fullscreen-ready');
  var launcher = document.querySelector('.home-page');
  if (launcher) launcher.classList.add('web-fullscreen-ready');
  update();
  button.hidden = false;
}());
