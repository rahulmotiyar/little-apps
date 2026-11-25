(function () {
  'use strict';
  var warning = document.getElementById('storage-warning');
  function setting(id, key, changed) {
    var input = document.getElementById(id), saved = true;
    if (!input) { return; }
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

  var language = window.LittleAppsLanguage;
  if (!language) { return; }
  var displayPanel = document.getElementById('display');
  var languagePanel = document.getElementById('language');
  var displayTab = document.getElementById('display-tab');
  var languageTab = document.getElementById('language-tab');
  var languageWarning = document.getElementById('language-warning');
  var choices = document.querySelectorAll('input[name="app-language"]');

  function selectPanel() {
    var showLanguage = window.location.hash === '#language';
    displayPanel.hidden = showLanguage;
    languagePanel.hidden = !showLanguage;
    (showLanguage ? displayTab : languageTab).removeAttribute('aria-current');
    (showLanguage ? languageTab : displayTab).setAttribute('aria-current', 'page');
  }

  function selectLanguage() {
    var saved = language.read();
    Array.prototype.forEach.call(choices, function (choice) { choice.checked = choice.value === saved; });
  }

  Array.prototype.forEach.call(choices, function (choice) {
    choice.onchange = function () {
      if (!choice.checked) { return; }
      languageWarning.hidden = language.save(choice.value);
      selectLanguage();
    };
  });
  window.addEventListener('hashchange', selectPanel);
  window.addEventListener('pageshow', selectLanguage);
  window.addEventListener('storage', function (event) {
    if (event.key === language.key || event.key === null) { selectLanguage(); }
  });
  selectPanel();
  selectLanguage();
}());
