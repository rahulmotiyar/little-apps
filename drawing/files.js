(function () {
  'use strict';
  var key = 'little-apps.drawing.files.v1';
  var menu = document.getElementById('file-menu');
  var button = document.getElementById('file-button');
  var name = document.getElementById('file-name');
  var input = document.getElementById('file-rename');
  var list = document.getElementById('file-list');
  var shareButton = document.getElementById('file-share');
  var pendingDelete = null;
  var library, bridge = null, unusable = false;
  function firstFile(raw, legacy) { return { id:'first', name:'Untitled drawing', raw:raw || null, legacy:!!legacy }; }
  function read() {
    try {
      var raw = window.localStorage.getItem(key);
      if (raw) {
        var saved = JSON.parse(raw);
        if (!saved || !Array.isArray(saved.files) || !saved.files.length || typeof saved.active !== 'string') { throw new Error('Invalid drawing library'); }
        var found = false;
        saved.files.forEach(function (file) {
          if (!file || typeof file.id !== 'string' || typeof file.name !== 'string' || (file.raw !== null && typeof file.raw !== 'string')) { throw new Error('Invalid drawing file'); }
          if (file.id === saved.active) { found = true; }
        });
        if (!found) { throw new Error('Missing active drawing'); }
        return saved;
      }
      var old = window.localStorage.getItem('little-apps.drawing.v2');
      var legacy = false;
      if (!old) { old = window.localStorage.getItem('little-apps.drawing.v1'); legacy = !!old; }
      return { version:1, active:'first', files:[firstFile(old, legacy)] };
    } catch (error) {
      unusable = true;
      return { version:1, active:'first', files:[firstFile(null, false)] };
    }
  }
  function active(data) {
    for (var i = 0; i < data.files.length; i += 1) { if (data.files[i].id === data.active) { return data.files[i]; } }
    return null;
  }
  function clone() { return JSON.parse(JSON.stringify(library)); }
  function commit(next) {
    if (unusable) { return false; }
    try { window.localStorage.setItem(key, JSON.stringify(next)); library = next; return true; }
    catch (error) { return false; }
  }
  function warn() { document.getElementById('storage-warning').style.display = 'block'; }
  function render() {
    var file = active(library); name.textContent = file.name; input.value = file.name;
    while (list.firstChild) { list.removeChild(list.firstChild); }
    library.files.forEach(function (item) {
      var entry = document.createElement('div'); entry.className = 'drawing-file-entry';
      var row = document.createElement('button'); row.type = 'button'; row.className = 'drawing-file-row';
      row.setAttribute('aria-current', String(item.id === library.active));
      var label = document.createElement('span'); label.textContent = item.name; row.appendChild(label);
      if (item.id === library.active) { var mark = document.createElement('span'); mark.textContent = '✓'; mark.setAttribute('aria-hidden', 'true'); row.appendChild(mark); }
      row.onclick = function () {
        if (item.id === library.active) { close(); return; }
        if (!bridge || !bridge.save()) { warn(); return; }
        var next = clone(); next.active = item.id;
        if (!commit(next)) { warn(); return; }
        bridge.open(); render(); close();
      };
      entry.appendChild(row);
      var remove = document.createElement('button'); remove.type = 'button'; remove.className = 'drawing-file-delete';
      remove.setAttribute('aria-label', 'Delete ' + item.name); remove.title = 'Delete ' + item.name;
      remove.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/></svg>';
      remove.onclick = function () { pendingDelete = item.id; render(); };
      entry.appendChild(remove); list.appendChild(entry);
      if (pendingDelete === item.id) {
        var confirm = document.createElement('div'); confirm.className = 'drawing-delete-confirm';
        var text = document.createElement('span'); text.textContent = 'Delete “' + item.name + '”?'; confirm.appendChild(text);
        var cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Cancel';
        cancel.onclick = function () { pendingDelete = null; render(); }; confirm.appendChild(cancel);
        var accept = document.createElement('button'); accept.type = 'button'; accept.textContent = 'Delete';
        accept.onclick = function () {
          if (!bridge || !bridge.save()) { warn(); return; }
          var next = clone(), removed = null;
          for (var i = 0; i < next.files.length; i += 1) { if (next.files[i].id === item.id) { removed = next.files.splice(i, 1)[0]; break; } }
          if (!removed) { return; }
          if (!next.deleted) { next.deleted = []; } next.deleted.push(removed);
          var changedActive = next.active === item.id;
          if (!next.files.length) { next.files.push({ id:'drawing-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000000), name:'Untitled drawing', raw:null, legacy:false }); }
          if (changedActive) { next.active = next.files[0].id; }
          if (!commit(next)) { warn(); return; }
          pendingDelete = null; if (changedActive) { bridge.open(); } render();
        };
        confirm.appendChild(accept); list.appendChild(confirm);
      }
    });

  }
  function close() { pendingDelete = null; menu.hidden = true; button.setAttribute('aria-expanded', 'false'); }
  function rename() {
    var text = input.value.replace(/^\s+|\s+$/g, '');
    if (!text) { input.value = active(library).name; return; }
    var next = clone(); active(next).name = text;
    if (!commit(next)) { warn(); return; }
    render();
  }
  library = read();
  window.DrawFiles = {
    current:function () { return active(library); },
    save:function (raw) { var next = clone(), file = active(next); file.raw = raw; file.legacy = false; return commit(next); },
    connect:function (api) { bridge = api; }
  };
  button.onclick = function () { if (!menu.hidden) { close(); return; } menu.hidden = false; button.setAttribute('aria-expanded', 'true'); render(); };
  // A menu action can replace its own DOM node before the event reaches the document.
  menu.addEventListener('click', function (event) { event.stopPropagation(); });
  document.getElementById('file-rename-save').onclick = rename;
  input.addEventListener('keydown', function (event) { if (event.key === 'Enter') { event.preventDefault(); rename(); } });
  document.getElementById('file-new').onclick = function () {
    if (!bridge || !bridge.save()) { warn(); return; }
    var next = clone(), id = 'drawing-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000000);
    next.active = id; next.files.push({ id:id, name:'Untitled drawing', raw:null, legacy:false });
    if (!commit(next)) { warn(); return; }
    bridge.open(); render(); input.focus(); input.select();
  };
  var shareDialog = document.getElementById('share-dialog');
  var shareMessage = document.getElementById('share-message');
  var shareLink = document.getElementById('share-link');
  var shareQR = document.getElementById('share-qr');
  var shareRequest = null;
  document.getElementById('share-close').onclick = function () {
    if (shareRequest) { shareRequest.abort(); shareRequest = null; }
    shareDialog.hidden = true;
  };
  function renderShareQR(url) {
    var qr = new window.StillQRCode(0, 0); // Medium error correction, selected automatically.
    qr.addData(url); qr.make();
    var count = qr.getModuleCount(), quiet = 4, scale = 5, size = (count + quiet * 2) * scale;
    shareQR.width = size; shareQR.height = size;
    var context = shareQR.getContext('2d');
    if (!context) { throw new Error('QR canvas unavailable'); }
    context.fillStyle = '#fff'; context.fillRect(0, 0, size, size);
    context.fillStyle = '#000';
    for (var row = 0; row < count; row += 1) {
      for (var col = 0; col < count; col += 1) {
        if (qr.isDark(row, col)) { context.fillRect((col + quiet) * scale, (row + quiet) * scale, scale, scale); }
      }
    }
    shareQR.hidden = false;
  }
  shareButton.onclick = function () {
    if (!bridge) { return; }
    shareDialog.hidden = false; shareLink.hidden = true; shareQR.hidden = true; shareMessage.textContent = 'Preparing a link…';
    var image;
    try { image = bridge.exportImage().toDataURL('image/png'); }
    catch (error) { shareMessage.textContent = 'Could not prepare this drawing for sharing.'; return; }
    try {
      var request = new XMLHttpRequest(); shareRequest = request;
      request.open('POST', '../drawing/share', true);
      request.setRequestHeader('Content-Type', 'application/json');
      request.onreadystatechange = function () {
        if (request.readyState !== 4 || request !== shareRequest) { return; }
        shareRequest = null;
        if (request.status !== 201) { shareMessage.textContent = 'Could not create a link. Make sure Little Apps is running and try again.'; return; }
        try {
          var result = JSON.parse(request.responseText);
          if (!result.path || !/^\/drawing\/share\/[A-Za-z0-9_-]+$/.test(result.path)) { throw new Error('Invalid link'); }
          var host = window.location.host;
          var isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
          if (isLocal && /^\d{1,3}(\.\d{1,3}){3}$/.test(result.network_address || '')) {
            host = result.network_address + (window.location.port ? ':' + window.location.port : '');
            isLocal = false;
          }
          var url = window.location.protocol + '//' + host + result.path;
          shareLink.href = url; shareLink.textContent = url; shareLink.hidden = false;
          if (!isLocal) { try { renderShareQR(url); } catch (error) { shareQR.hidden = true; } }
          shareMessage.textContent = isLocal ? 'Open Draw using its Wi-Fi address to share with another device.' : shareQR.hidden ? 'Open this link on another device on the same Wi-Fi. It expires in 10 minutes.' : 'Scan with your phone on the same Wi-Fi. The link expires in 10 minutes.';
        } catch (error) { shareMessage.textContent = 'Could not create a link. Please try again.'; }
      };
      request.send(JSON.stringify({ image:image }));
    } catch (error) { shareRequest = null; shareMessage.textContent = 'Could not create a link. Make sure Little Apps is running and try again.'; }
  };
  document.addEventListener('click', function (event) { if (!menu.hidden && !menu.contains(event.target) && !button.contains(event.target)) { close(); } });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') { close(); } });
  render();
}());
