(function () {
  'use strict';

  var key = 'little-apps.language';
  var languages = ['en', 'nl', 'de', 'hi', 'zh-Hans'];
  // Dutch, German, Hindi and Simplified Chinese. English comes from the page.
  var labels = {
    settings: ['Instellingen', 'Einstellungen', 'सेटिंग्स', '设置'],
    sections: ['Instellingenmenu', 'Einstellungsmenü', 'सेटिंग्स मेनू', '设置菜单'],
    general: ['Algemeen', 'Allgemein', 'सामान्य', '常规'],
    display: ['Scherm', 'Anzeige', 'डिस्प्ले', '显示'],
    language: ['Taal', 'Sprache', 'भाषा', '语言'],
    appLanguage: ['Taal van de apps', 'Sprache der Apps', 'ऐप की भाषा', '应用语言'],
    orientation: ['Schermstand', 'Ausrichtung', 'स्क्रीन की दिशा', '屏幕方向'],
    portrait: ['Staand', 'Hochformat', 'पोर्ट्रेट', '纵向'],
    landscape: ['Liggend', 'Querformat', 'लैंडस्केप', '横向'],
    launcher: ['Startscherm', 'Startbildschirm', 'होम स्क्रीन', '主屏幕'],
    widgets: ['Toon widgets op het startscherm', 'Widgets auf dem Startbildschirm anzeigen', 'होम स्क्रीन पर विजेट दिखाएँ', '在主屏幕上显示小组件'],
    kindleBar: ['Toon de Kindle-balk in alle apps', 'Kindle-Leiste in allen Apps anzeigen', 'सभी ऐप में Kindle बार दिखाएँ', '在所有应用中显示 Kindle 状态栏'],
    saveError: ['Deze instelling kon niet worden opgeslagen.', 'Die Einstellung konnte nicht gespeichert werden.', 'यह सेटिंग सहेजी नहीं जा सकी।', '无法保存此设置。'],
    apps: ['Apps', 'Apps', 'ऐप', '应用'],
    clock: ['Klok', 'Uhr', 'घड़ी', '时钟'],
    calendar: ['Kalender', 'Kalender', 'कैलेंडर', '日历'],
    maths: ['Rekenen', 'Mathe', 'गणित', '数学'],
    match: ['Zoek paren', 'Paare', 'जोड़ी मिलाएँ', '配对'],
    words: ['Woorden', 'Wörter', 'शब्द', '单词'],
    draw: ['Tekenen', 'Zeichnen', 'चित्र बनाएँ', '绘画'],
    sticky: ['Plakbriefjes', 'Haftnotizen', 'स्टिकी नोट्स', '便签'],
    notes: ['Notities', 'Notizen', 'नोट्स', '笔记'],
    notebook: ['Notitieboek', 'Notizbuch', 'नोटबुक', '笔记本'],
    exit: ['Sluiten', 'Schließen', 'बंद करें', '退出'],
    reset: ['Opnieuw', 'Neu starten', 'फिर शुरू करें', '重来'],
    undo: ['Ongedaan maken', 'Rückgängig', 'पूर्ववत करें', '撤销'],
    help: ['Hulp', 'Hilfe', 'मदद', '帮助'],
    group: ['Schoolgroep', 'Klassenstufe', 'कक्षा', '年级'],
    activity: ['Activiteit', 'Übung', 'गतिविधि', '活动'],
    numbers: ['Getallen', 'Zahlen', 'संख्याएँ', '数字'],
    sums: ['Sommen', 'Aufgaben', 'सवाल', '算式'],
    time: ['Tijd', 'Uhrzeit', 'समय', '时间'],
    addition: ['+ Optellen', '+ Addition', '+ जोड़', '+ 加法'],
    subtraction: ['− Aftrekken', '− Subtraktion', '− घटाव', '− 减法'],
    mixed: ['± Gemengd', '± Gemischt', '± मिश्रित', '± 混合'],
    reading: ['Lezen', 'Lesen', 'पढ़ना', '阅读'],
    spelling: ['Spellen', 'Buchstabieren', 'वर्तनी', '拼写'],
    difficulty: ['Moeilijkheid', 'Schwierigkeit', 'कठिनाई', '难度'],
    easy: ['Makkelijk · 4 × 4', 'Leicht · 4 × 4', 'आसान · 4 × 4', '简单 · 4 × 4'],
    medium: ['Normaal · 6 × 6', 'Mittel · 6 × 6', 'मध्यम · 6 × 6', '中等 · 6 × 6'],
    hard: ['Moeilijk · 9 × 9', 'Schwer · 9 × 9', 'कठिन · 9 × 9', '困难 · 9 × 9']
  };
  var bindings = [];
  var current;

  function read() {
    try {
      var saved = window.localStorage.getItem(key);
      return languages.indexOf(saved) >= 0 ? saved : 'en';
    } catch (error) { return 'en'; }
  }

  function setLanguage(language) {
    if (current === language) { return; }
    current = language;
    document.documentElement.lang = language;
    var index = languages.indexOf(language) - 1;
    bindings.forEach(function (binding) {
      var translated = index >= 0 ? labels[binding.key][index] : binding.original;
      if (binding.attribute) {
        if (binding.node.getAttribute(binding.attribute) !== translated) { binding.node.setAttribute(binding.attribute, translated); }
      } else if (binding.node.textContent !== translated) { binding.node.textContent = translated; }
    });
  }

  function bind(marker, attribute) {
    Array.prototype.forEach.call(document.querySelectorAll('[' + marker + ']'), function (node) {
      var label = node.getAttribute(marker);
      if (!Object.prototype.hasOwnProperty.call(labels, label)) { return; }
      bindings.push({ node:node, key:label, attribute:attribute, original:attribute ? node.getAttribute(attribute) : node.textContent });
    });
  }

  bind('data-lang-text', null);
  bind('data-lang-label', 'aria-label');
  bind('data-lang-title', 'title');
  setLanguage(read());

  window.LittleAppsLanguage = {
    key:key,
    read:read,
    save:function (language) {
      if (languages.indexOf(language) < 0) { return false; }
      try { window.localStorage.setItem(key, language); }
      catch (error) { return false; }
      setLanguage(language);
      return true;
    }
  };
  window.addEventListener('pageshow', function () { setLanguage(read()); });
  window.addEventListener('storage', function (event) {
    if (event.key === key || event.key === null) { setLanguage(read()); }
  });
}());
