(function () {
  'use strict';
  var inKindleApp = /(?:^|[?&])kindle-app=1(?:&|$)/.test(window.location.search);
  try {
    if (inKindleApp) { window.sessionStorage.setItem('little-apps.kindle', '1'); }
    else { inKindleApp = window.sessionStorage.getItem('little-apps.kindle') === '1'; }
  } catch (error) {}
  var exit = document.getElementById('kindle-exit');
  if (!exit) return;
  exit.style.display = 'inline-block';
  if (!inKindleApp || !window.history || !window.history.replaceState) return;

  var target = exit.href;
  var pendingExit = false;
  exit.addEventListener('click', function (event) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (pendingExit) { event.preventDefault(); return; }
    // Keep the current page visible while the installed helper handles Exit.
    try { window.history.replaceState(null, '', target); }
    catch (error) { return; }
    event.preventDefault();
    pendingExit = true;
    // Some browser versions only report full navigations to the helper.
    window.setTimeout(function () { window.location.replace(target); }, 1200);
  });
}());
