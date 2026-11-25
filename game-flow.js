(function (root) {
  'use strict';

  // Keep a result visible briefly, without advancing a hidden or departed page.
  function create() {
    var pending = null;
    var timer = null;
    var generation = 0;
    var leaving = false;

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
      if (leaving || typeof callback !== 'function') { return; }
      pending = { callback: callback, delay: typeof delay === 'number' && isFinite(delay) && delay >= 0 ? delay : 1000 };
      arm();
    }

    // Let the link navigate normally while keeping the current board on screen.
    function exit(event) {
      if (event && (event.defaultPrevented || event.button > 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)) { return; }
      leaving = true;
      cancel();
      return true;
    }

    function resume() {
      var exited = leaving;
      leaving = false;
      return exited;
    }

    function visibilityChanged() {
      clearTimer();
      if (!document.hidden) { arm(); }
    }

    document.addEventListener('visibilitychange', visibilityChanged);
    root.addEventListener('pagehide', cancel);
    return { schedule: schedule, cancel: cancel, exit: exit, resume: resume };
  }

  root.LittleGameFlow = { create: create };
}(window));
