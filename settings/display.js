(function () {
  'use strict';
  var options = document.querySelectorAll('input[name="orientation"]');
  var message = document.getElementById('orientation-message');
  var orientation = window.LittleAppsOrientation;
  var saved = orientation.read();
  if (saved === 'auto') { var size = orientation.dimensions(); saved = size.width > size.height ? 'landscape' : 'portrait'; }
  var pending = false;

  function select(value) {
    for (var i = 0; i < options.length; i += 1) { options[i].checked = options[i].value === value; }
  }
  function enable(value) {
    for (var i = 0; i < options.length; i += 1) { options[i].disabled = !value; }
  }
  function failed() {
    pending = false; enable(true); select(saved);
    message.textContent = 'This browser can’t change orientation. Use your device’s rotation controls.';
    message.hidden = false;
  }
  function reportRestore(status) {
    if (status === 'unavailable' && saved !== 'auto') {
      message.textContent = 'The saved orientation couldn’t be applied here. Use your device’s rotation controls.';
      message.hidden = false;
    }
  }
  orientation.onRestore = reportRestore;
  reportRestore(orientation.status);
  for (var i = 0; i < options.length; i += 1) {
    options[i].onchange = function () {
      if (!this.checked || pending) { return; }
      var value = this.value;
      pending = true; enable(false);
      orientation.apply(value, function () {
        try {
          window.localStorage.setItem(orientation.key, value);
          saved = value;
          message.hidden = true;
          pending = false; enable(true); select(saved);
        } catch (error) {
          orientation.apply(saved, function () {}, function () {});
          pending = false; enable(true); select(saved);
          message.textContent = 'Couldn’t save this setting on this device.';
          message.hidden = false;
        }
      }, failed);
    };
  }
  select(saved);

}());
