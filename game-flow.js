(function (root) {
  'use strict';

  // Keep a result visible briefly, without advancing a hidden or departed page.
  function create() {
    var pending = null;
    var timer = null;
    var generation = 0;

    function clearTimer() {
      generation += 1;
      if (timer !== null) { root.clearTimeout(timer); timer = null; }
    }

    function cancel() {
      clearTimer();
      pending = null;
    }

    function arm() {
      if (!pending || document.hidden) { return; }
      var current = ++generation;
      timer = root.setTimeout(function () {
        if (current !== generation || !pending) { return; }
        timer = null;
        if (document.hidden) { return; }
        var callback = pending.callback;
        pending = null;
        callback();
      }, pending.delay);
    }

    function schedule(callback, delay) {
      cancel();
      if (typeof callback !== 'function') { return; }
      pending = { callback: callback, delay: typeof delay === 'number' && isFinite(delay) && delay >= 0 ? delay : 1000 };
      arm();
    }

    function visibilityChanged() {
      clearTimer();
      if (!document.hidden) { arm(); }
    }

    document.addEventListener('visibilitychange', visibilityChanged);
    root.addEventListener('pagehide', cancel);
    return { schedule: schedule, cancel: cancel };
  }

  root.LittleGameFlow = { create: create };
}(window));
