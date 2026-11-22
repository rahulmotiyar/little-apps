(function () {
  'use strict';
  var warning = document.getElementById('storage-warning');
  function setting(id, key, changed) {
    var input = document.getElementById(id), saved = true;
    if (!input) return;
    try { saved = window.localStorage.getItem(key) !== '0'; }
    catch (error) { warning.hidden = false; }
    input.checked = saved;
    input.onchange = function () {
      try {
        window.localStorage.setItem(key, input.checked ? '1' : '0');
        saved = input.checked; warning.hidden = true;
        if (changed) changed();
      } catch (error) { input.checked = saved; warning.hidden = false; }
    };
  }
  setting('show-widgets', 'little-apps.show-widgets');
  setting('show-kindle-bar', 'little-apps.show-kindle-bar', function () {
    if (window.LittleAppsDisplay) window.LittleAppsDisplay.syncNativeBar();
  });
}());
