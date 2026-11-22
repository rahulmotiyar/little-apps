(function () {
  'use strict';
  var trigger = document.getElementById('help');
  var overlay = document.getElementById('help-overlay');
  var close = document.getElementById('help-close');
  var page = document.getElementById('sudoku-page');
  var result = document.getElementById('result-overlay');
  var opened = false;
  function dismiss() {
    if (!opened) { return; }
    opened = false; overlay.style.display = 'none'; overlay.setAttribute('aria-hidden', 'true');
    page.removeAttribute('aria-hidden'); trigger.setAttribute('aria-expanded', 'false'); trigger.focus();
  }
  trigger.onclick = function () {
    if (result.getAttribute('aria-hidden') === 'false') { return; }
    opened = true; overlay.style.display = 'flex'; overlay.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true'); close.focus(); page.setAttribute('aria-hidden', 'true');
  };
  close.onclick = dismiss;
  overlay.onclick = function (event) { if (event.target === overlay) { dismiss(); } };
  document.addEventListener('keydown', function (event) {
    if (!opened) { return; }
    event.stopImmediatePropagation();
    if (event.key === 'Escape') { event.preventDefault(); dismiss(); }
    if (event.key === 'Tab') { event.preventDefault(); close.focus(); }
  }, true);
  document.addEventListener('focusin', function (event) {
    if (opened && !overlay.contains(event.target)) { close.focus(); }
  });
  window.addEventListener('pagehide', dismiss);
}());
