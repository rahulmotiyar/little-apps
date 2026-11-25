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

  window.LittleAppsMenus = { onOutsidePress: onOutsidePress };
}());
