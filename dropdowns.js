(function () {
  'use strict';
  // Together's in-page quiet-select pattern, kept separate from planner data.
  var opened = null;
  var views = [];
  function close(restore) {
    if (!opened) { return; }
    var old = opened; opened = null;
    old.view.trigger.setAttribute('aria-expanded', 'false');
    old.panel.parentNode.removeChild(old.panel);
    if (restore) { old.view.trigger.focus(); }
  }
  function sync() {
    views.forEach(function (view) {
      var selected = view.source.options[view.source.selectedIndex];
      var shortLabel = selected && document.body.classList.contains('little-narrow') && selected.getAttribute('data-short');
      var value = shortLabel || (selected ? selected.textContent : '');
      var label = view.source.getAttribute('aria-label');
      if (view.text.textContent !== value) { view.text.textContent = value; }
      if (view.trigger.getAttribute('aria-label') !== label) { view.trigger.setAttribute('aria-label', label); }
      view.trigger.disabled = view.source.disabled;
      if (opened && opened.view === view && view.source.disabled) { close(false); }
    });
  }
  function open(view) {
    if (view.source.disabled) { return; }
    if (opened && opened.view === view) { close(true); return; }
    close(false);
    var panel = document.createElement('div');
    panel.className = 'quiet-select-menu'; panel.id = view.trigger.id + '-menu';
    panel.setAttribute('role', 'listbox'); panel.setAttribute('aria-label', view.source.getAttribute('aria-label'));
    var rows = [];
    Array.prototype.forEach.call(view.source.options, function (option) {
      var row = document.createElement('button'); row.type = 'button'; row.className = 'quiet-select-option';
      row.setAttribute('role', 'option'); row.setAttribute('aria-selected', option.selected ? 'true' : 'false');
      row.disabled = option.disabled; row.tabIndex = -1;
      var check = document.createElement('span'); check.className = 'quiet-option-check'; check.setAttribute('aria-hidden', 'true'); check.textContent = option.selected ? '✓' : '';
      var text = document.createElement('span'); text.textContent = option.textContent;
      row.appendChild(check); row.appendChild(text); panel.appendChild(row); rows.push(row);
      row.onclick = function () {
        if (view.source.disabled || option.disabled) { return; }
        close(true); view.source.value = option.value;
        var event = document.createEvent('HTMLEvents'); event.initEvent('change', true, false); view.source.dispatchEvent(event); sync();
      };
      row.onkeydown = function (event) {
        event.stopPropagation(); var i = rows.indexOf(row); var next = -1;
        if (event.key === 'ArrowDown') { next = (i + 1) % rows.length; }
        if (event.key === 'ArrowUp') { next = (i + rows.length - 1) % rows.length; }
        if (event.key === 'Home') { next = 0; } if (event.key === 'End') { next = rows.length - 1; }
        if (next >= 0) { event.preventDefault(); rows[next].focus(); }
        if (event.key === 'Escape') { event.preventDefault(); close(true); }
        if (event.key === 'Tab') { close(true); }
      };
    });
    document.body.appendChild(panel); opened = { view: view, panel: panel, trigger: view.trigger };
    view.trigger.setAttribute('aria-expanded', 'true');
    var orient = window.LittleAppsOrientation;
    var rect = orient ? orient.rect(view.trigger) : view.trigger.getBoundingClientRect();
    var dims = orient ? orient.dimensions() : { width:window.innerWidth, height:window.innerHeight };
    var width = Math.min(dims.width - 28, Math.max(218, rect.width));
    panel.style.width = width + 'px'; panel.style.left = Math.max(14, Math.min(rect.left, dims.width - width - 14)) + 'px';
    var below = dims.height - rect.bottom - 14; var above = rect.top - 14;
    var height = Math.min(panel.scrollHeight + 2, 360, Math.max(below, above));
    panel.style.maxHeight = height + 'px'; panel.style.top = (below >= height ? rect.bottom : Math.max(8, rect.top - height)) + 'px';
    (rows[view.source.selectedIndex] || rows[0]).focus();
  }
  Array.prototype.forEach.call(document.querySelectorAll('.tool-actions select, select[data-quiet-select]'), function (source, index) {
    var id = source.id || ('app-select-' + index); var wrap = document.createElement('span'); wrap.className = 'quiet-select-wrap'; wrap.setAttribute('data-for', id);
    var trigger = document.createElement('button'); trigger.type = 'button'; trigger.className = 'quiet-select-trigger'; trigger.id = id + '-button';
    trigger.setAttribute('role', 'combobox'); trigger.setAttribute('aria-label', source.getAttribute('aria-label')); trigger.setAttribute('aria-haspopup', 'listbox'); trigger.setAttribute('aria-expanded', 'false'); trigger.setAttribute('aria-controls', trigger.id + '-menu');
    var text = document.createElement('span'); text.className = 'quiet-select-value';
    var caret = document.createElement('span'); caret.className = 'plan-dropdown-caret'; caret.setAttribute('aria-hidden', 'true');
    source.parentNode.insertBefore(wrap, source); wrap.appendChild(source); wrap.appendChild(trigger); trigger.appendChild(text); trigger.appendChild(caret);
    source.hidden = true; source.style.display = 'none'; source.tabIndex = -1; source.setAttribute('aria-hidden', 'true');
    var view = { source: source, trigger: trigger, text: text }; views.push(view);
    trigger.onclick = function () { open(view); };
    trigger.onkeydown = function (event) { event.stopPropagation(); if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open(view); } };
    source.addEventListener('change', sync);
    new MutationObserver(sync).observe(source, { attributes: true, attributeFilter: ['disabled', 'aria-label'], childList:true, subtree:true });
  });
  if (views.length) {
    window.LittleAppsMenus.onOutsidePress(function () { return opened; }, function () { close(false); });
  }
  window.addEventListener('resize', function () { close(false); });
  window.addEventListener('littleappsorientationchange', function () { close(false); sync(); });
  window.addEventListener('pagehide', function () { close(false); });
  window.addEventListener('pageshow', sync);
  sync();
}());
