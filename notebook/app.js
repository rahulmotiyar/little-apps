(function () {
  'use strict';

  var model = window.KindleNotebook;
  var storageKey = 'little-apps.notebook.v2';
  var legacyKey = 'little-apps.notebook.v1';
  var state = model.create();
  var dirty = false;
  var needsMigration = false;
  var writeBlocked = false;
  var saveTimer = null;
  var itemNodes = {};
  var sectionNodes = {};
  var ink;
  var inkLoadedId = null;
  var historyNoteId = null;
  var textHistory = [];
  var textGroupOpen = false;
  var lastTextEdit = 0;
  var mode = 'write';
  var toolMessage = '';
  var formatter = null;
  var page = document.querySelector('.notebook-page');
  var list = document.getElementById('notes-list');
  var newButton = document.getElementById('new-note');
  var undoButton = document.getElementById('undo-remove');
  var newSectionButton = document.getElementById('new-section');
  var sectionForm = document.getElementById('section-form');
  var sectionName = document.getElementById('section-name');
  var sectionError = document.getElementById('section-error');
  var cancelSection = document.getElementById('cancel-section');
  var noteSection = document.getElementById('note-section');
  var noteTimestamp = document.getElementById('note-timestamp');
  var showNotesButton = document.getElementById('show-notes');
  var exitLink = document.getElementById('exit');
  var titleInput = document.getElementById('editor-title');
  var bodyInput = document.getElementById('editor-body');
  var writeButton = document.getElementById('write-tool');
  var drawButton = document.getElementById('draw-tool');
  var eraseButton = document.getElementById('erase-tool');
  var toolUndo = document.getElementById('undo-tool');
  var removeButton = document.getElementById('remove-note');
  var writingMode = document.getElementById('writing-mode');
  var drawingMode = document.getElementById('drawing-mode');
  var empty = document.getElementById('empty-notebook');
  var editor = document.getElementById('editor');
  var storageStatus = document.getElementById('storage-status');
  var editorStatus = document.getElementById('editor-status');
  var toolStatus = document.getElementById('tool-status') || editorStatus;

  try {
    if (window.Intl && window.Intl.DateTimeFormat) {
      formatter = new window.Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
      formatter.format(new Date(0));
    }
  } catch (error) { formatter = null; }

  function setText(node, text) { if (node.textContent !== text) { node.textContent = text; } }
  function focus(node) { if (node && typeof node.focus === 'function') { node.focus(); } }
  function selectedNote() { return model.get(state, state.activeId); }
  function clearChildren(node) { while (node.firstChild) { node.removeChild(node.firstChild); } }
  function setClass(name, present) {
    var classes = (' ' + page.className + ' ').replace(new RegExp(' ' + name + ' ', 'g'), ' ');
    page.className = (classes + (present ? name : '')).replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');
  }
  function pad(number) { return number < 10 ? '0' + number : String(number); }
  function formatDate(value) {
    if (typeof value !== 'number' || !isFinite(value)) { return 'Date not recorded'; }
    var date = new Date(value);
    if (formatter) { return formatter.format(date); }
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return pad(date.getUTCDate()) + ' ' + months[date.getUTCMonth()] + ' ' + date.getUTCFullYear() + ' ' + pad(date.getUTCHours()) + ':' + pad(date.getUTCMinutes()) + ' UTC';
  }
  function noteDate(note) { return note.updatedAt !== null ? note.updatedAt : note.createdAt !== null ? note.createdAt : note.indexedAt; }
  function dateLabel(note) { return (note.updatedAt === null && note.createdAt === null ? 'Indexed ' : '') + formatDate(noteDate(note)); }
  function updateTimestamp(note) {
    if (!note) { setText(noteTimestamp, ''); noteTimestamp.removeAttribute('datetime'); return; }
    var value = noteDate(note);
    var prefix = note.updatedAt === null && note.createdAt === null ? 'Indexed ' : (note.createdAt !== null && (note.updatedAt === null || note.updatedAt === note.createdAt) ? 'Created ' : 'Updated ');
    setText(noteTimestamp, prefix + formatDate(value));
    noteTimestamp.setAttribute('title', formatter ? 'Europe/Amsterdam' : 'UTC');
    if (value !== null) { noteTimestamp.setAttribute('datetime', new Date(value).toISOString()); }
    else { noteTimestamp.removeAttribute('datetime'); }
  }
  function showStorageError(text) { setText(storageStatus, text); storageStatus.style.display = 'block'; }
  function setToolNotice(text) {
    toolMessage = text || '';
    setText(toolStatus, toolMessage);
    if (toolStatus !== editorStatus) { toolStatus.style.display = toolMessage ? 'block' : 'none'; }
  }
  function updateSaveStatus() {
    if (toolStatus === editorStatus && toolMessage) { setText(editorStatus, toolMessage); }
    else if (writeBlocked) { setText(editorStatus, 'Changes stay in this page.'); }
    else if (dirty) { setText(editorStatus, 'Unsaved changes'); }
    else { setText(editorStatus, 'Saved on this device'); }
  }
  function readSaved() {
    var raw;
    var legacy = false;
    try {
      raw = window.localStorage.getItem(storageKey);
      if (raw === null) { raw = window.localStorage.getItem(legacyKey); legacy = raw !== null; }
    } catch (error) {
      writeBlocked = true;
      showStorageError('This browser cannot read saved notes. Edits stay in this page; keep it open.');
      return false;
    }
    if (raw === null) { state = model.create(); needsMigration = false; return true; }
    try {
      var restored = model.decode(raw);
      if (!restored) { throw new Error('Unreadable saved notebook'); }
      state = restored;
      needsMigration = legacy;
      state.notes.forEach(function (note) {
        if (note.createdAt === null && note.updatedAt === null && !note.indexedAt) {
          note.indexedAt = Date.now(); dirty = true;
        }
      });
      return true;
    } catch (error) {
      writeBlocked = true;
      showStorageError('Saved notes could not be opened and have been kept untouched. New edits stay in this page; keep it open.');
      return false;
    }
  }
  function saveNow() {
    if (saveTimer !== null) { window.clearTimeout(saveTimer); saveTimer = null; }
    if (!dirty || writeBlocked) { updateSaveStatus(); return !dirty; }
    try {
      window.localStorage.setItem(storageKey, model.encode(state));
      dirty = false;
      needsMigration = false;
      setText(storageStatus, '');
      storageStatus.style.display = 'none';
      updateSaveStatus();
      return true;
    } catch (error) {
      showStorageError('Your latest changes could not be saved. Keep this page open; saving will be tried again after your next edit.');
      updateSaveStatus();
      return false;
    }
  }
  function scheduleSave() {
    if (saveTimer !== null) { window.clearTimeout(saveTimer); }
    updateSaveStatus();
    saveTimer = window.setTimeout(function () { saveTimer = null; saveNow(); }, 350);
  }
  function noteTitle(note) { return note.title.replace(/^\s+|\s+$/g, '') || 'Untitled note'; }
  function notePreview(note) {
    var text = note.body.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
    return text ? text.slice(0, 100) : (note.ink && note.ink.length ? 'Drawing' : 'Empty note');
  }
  function updateListItem(note) {
    var item = note && itemNodes['note-' + note.id];
    if (!item) { return; }
    setText(item.title, noteTitle(note));
    setText(item.preview, notePreview(note));
    setText(item.time, dateLabel(note));
    if (typeof noteDate(note) === 'number') { item.time.setAttribute('datetime', new Date(noteDate(note)).toISOString()); }
  }
  function renderList() {
    var scrollTop = list.scrollTop;
    clearChildren(list);
    itemNodes = {};
    sectionNodes = {};
    for (var s = 0; s < state.sections.length; s += 1) {
      var section = state.sections[s];
      var group = document.createElement('div');
      group.className = 'notebook-section';
      var heading = document.createElement('button');
      heading.type = 'button';
      heading.className = 'section-heading';
      heading.setAttribute('data-section-id', section.id);
      if (section.id === state.activeSectionId) { heading.setAttribute('aria-current', 'true'); }
      var name = document.createElement('span');
      name.className = 'section-name';
      name.textContent = section.name;
      heading.appendChild(name);
      var sectionNotes = document.createElement('div');
      sectionNotes.className = 'section-notes';
      var count = 0;
      for (var i = 0; i < state.notes.length; i += 1) {
        var note = state.notes[i];
        if (note.sectionId !== section.id) { continue; }
        count += 1;
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'notebook-item' + (note.id === state.activeId ? ' active' : '');
        button.setAttribute('data-note-id', note.id);
        if (note.id === state.activeId) { button.setAttribute('aria-current', 'true'); }
        var title = document.createElement('span');
        title.className = 'notebook-item-title';
        var preview = document.createElement('span');
        preview.className = 'notebook-item-preview';
        var time = document.createElement('time');
        time.className = 'notebook-item-time';
        button.appendChild(title); button.appendChild(preview); button.appendChild(time);
        button.onclick = function () { openNote(this.getAttribute('data-note-id')); };
        itemNodes['note-' + note.id] = { button: button, title: title, preview: preview, time: time };
        updateListItem(note);
        sectionNotes.appendChild(button);
      }
      var counter = document.createElement('span');
      counter.className = 'section-count';
      counter.textContent = String(count);
      heading.appendChild(counter);
      heading.onclick = function () { openSection(this.getAttribute('data-section-id')); };
      var sectionHeader = document.createElement('div');
      sectionHeader.className = 'section-header';
      sectionHeader.appendChild(heading);
      var more = document.createElement('button');
      more.type = 'button'; more.className = 'section-more';
      more.setAttribute('aria-label', 'Options for ' + section.name);
      more.setAttribute('aria-expanded', 'false');
      more.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>';
      var menu = document.createElement('div'); menu.className = 'section-menu'; menu.hidden = true;
      var deletion = document.createElement('button'); deletion.type = 'button';
      deletion.textContent = 'Delete section'; deletion.disabled = state.sections.length < 2;
      deletion.setAttribute('data-section-id', section.id);
      deletion.onclick = function () {
        flush();
        if (model.removeSection(state, this.getAttribute('data-section-id'))) {
          dirty = true; renderAll(); saveNow();
        }
      };
      var explanation = document.createElement('p');
      explanation.textContent = state.sections.length < 2 ? 'Keep at least one section.' : 'Notes move to the first remaining section.';
      menu.appendChild(deletion); menu.appendChild(explanation);
      more.onclick = (function (panel, button) { return function () {
        var wasOpen = !panel.hidden;
        Array.prototype.forEach.call(list.querySelectorAll('.section-menu'), function (node) { node.hidden = true; });
        Array.prototype.forEach.call(list.querySelectorAll('.section-more'), function (node) { node.setAttribute('aria-expanded', 'false'); });
        panel.hidden = wasOpen; button.setAttribute('aria-expanded', String(!wasOpen));
      }; }(menu, more));
      sectionHeader.appendChild(more); sectionHeader.appendChild(menu);
      group.appendChild(sectionHeader);
      if (!count) {
        var placeholder = document.createElement('p');
        placeholder.className = 'section-empty';
        placeholder.textContent = 'No notes yet';
        sectionNotes.appendChild(placeholder);
      }
      group.appendChild(sectionNotes);
      list.appendChild(group);
      sectionNodes['section-' + section.id] = heading;
    }
    list.scrollTop = scrollTop;
  }
  function updateUndoTool() {
    var available = selectedNote() && (mode === 'write' ? textHistory.length > 0 : ink && ink.canUndo());
    toolUndo.disabled = !available;
  }
  function applyMode(nextMode) {
    mode = nextMode;
    setClass('tool-write', mode === 'write');
    setClass('tool-draw', mode === 'draw');
    setClass('tool-erase', mode === 'erase');
    writingMode.style.display = '';
    drawingMode.style.display = '';
    bodyInput.readOnly = mode !== 'write';
    writeButton.setAttribute('aria-pressed', mode === 'write' ? 'true' : 'false');
    drawButton.setAttribute('aria-pressed', mode === 'draw' ? 'true' : 'false');
    eraseButton.setAttribute('aria-pressed', mode === 'erase' ? 'true' : 'false');
    if (ink) { if (mode !== 'write') { ink.setTool(mode); } ink.resize(); }
    updateUndoTool();
  }
  function renderSectionOptions(note) {
    clearChildren(noteSection);
    for (var i = 0; i < state.sections.length; i += 1) {
      var option = document.createElement('option');
      option.value = state.sections[i].id;
      option.textContent = state.sections[i].name;
      noteSection.appendChild(option);
    }
    noteSection.value = note ? note.sectionId : state.activeSectionId;
    noteSection.disabled = !note;
  }
  function loadEditor() {
    var note = selectedNote();
    editor.style.display = note ? '' : 'none';
    empty.style.display = note ? 'none' : '';
    removeButton.disabled = !note;
    titleInput.disabled = !note;
    bodyInput.disabled = !note;
    writeButton.disabled = !note;
    drawButton.disabled = !note;
    eraseButton.disabled = !note;
    titleInput.value = note ? note.title : '';
    bodyInput.value = note ? note.body : '';
    undoButton.hidden = !state.removed;
    undoButton.style.display = state.removed ? '' : 'none';
    undoButton.disabled = !state.removed;
    newButton.disabled = state.notes.length >= model.maxNotes;
    setClass('is-empty', state.notes.length === 0);
    if (historyNoteId !== (note ? note.id : null)) {
      historyNoteId = note ? note.id : null;
      textHistory = [];
      textGroupOpen = false;
      mode = 'write';
      setToolNotice('');
    }
    if (ink && inkLoadedId !== (note ? note.id : null)) {
      ink.load(note ? note.ink : []);
      inkLoadedId = note ? note.id : null;
    }
    renderSectionOptions(note);
    updateTimestamp(note);
    applyMode(mode);
    updateSaveStatus();
  }
  function renderAll() { renderList(); loadEditor(); }
  function captureEditor(recordHistory) {
    var note = selectedNote();
    if (!note) { return false; }
    var title = titleInput.value.slice(0, model.maxTitle || 120);
    var body = bodyInput.value.slice(0, model.maxBody || 20000);
    if (titleInput.value !== title) { titleInput.value = title; }
    if (bodyInput.value !== body) { bodyInput.value = body; }
    if (note.title === title && note.body === body) { return false; }
    if (recordHistory !== false) {
      var now = new Date().getTime();
      if (!textGroupOpen || now - lastTextEdit > 700) {
        textHistory.push({ title: note.title, body: note.body });
        if (textHistory.length > 20) { textHistory.shift(); }
      }
      textGroupOpen = true;
      lastTextEdit = now;
    }
    if (!model.update(state, note.id, title, body)) { return false; }
    dirty = true;
    note = selectedNote();
    updateListItem(note); updateTimestamp(note); updateUndoTool();
    return true;
  }
  function handleInput() { if (captureEditor(true)) { scheduleSave(); } }
  function flush() {
    if (ink) { ink.finish(); }
    captureEditor(true);
    textGroupOpen = false;
    saveNow();
  }
  function openNote(id) {
    flush();
    if (!model.get(state, id)) { return; }
    var before = state.activeId;
    var beforeSection = state.activeSectionId;
    model.select(state, id);
    if (needsMigration || before !== state.activeId || beforeSection !== state.activeSectionId) { dirty = true; }
    renderAll();
    setClass('show-editor', true);
    applyMode('write');
    saveNow();
    focus(editor);
  }
  function openSection(id) {
    flush();
    var before = state.activeId;
    var beforeSection = state.activeSectionId;
    if (!model.selectSection(state, id)) { return; }
    if (needsMigration || before !== state.activeId || beforeSection !== state.activeSectionId) { dirty = true; }
    renderAll();
    setClass('show-editor', false);
    saveNow();
    focus(sectionNodes['section-' + id]);
  }
  function hideSectionForm() {
    sectionForm.hidden = true;
    sectionForm.style.display = 'none';
    setText(sectionError, '');
  }
  function switchTool(nextMode) {
    if (!selectedNote()) { return; }
    flush();
    setToolNotice('');
    applyMode(nextMode);
    if (nextMode === 'write') { focus(bodyInput); }
  }

  newButton.onclick = function () {
    flush();
    var note = model.add(state);
    if (!note) {
      if (selectedNote()) { setClass('show-editor', true); }
      setText(editorStatus, 'Notebook is full. Delete a note to add another (50 notes maximum).');
      return;
    }
    dirty = true;
    hideSectionForm(); renderAll();
    setClass('show-editor', true);
    applyMode('write'); saveNow(); focus(titleInput);
  };
  newSectionButton.onclick = function () {
    flush();
    setClass('show-editor', false);
    sectionForm.hidden = false;
    sectionForm.style.display = '';
    sectionName.value = '';
    setText(sectionError, '');
    focus(sectionName);
  };
  sectionForm.onsubmit = function (event) {
    if (event) { event.preventDefault(); }
    flush();
    var name = sectionName.value.replace(/^\s+|\s+$/g, '');
    if (!name) { setText(sectionError, 'Give this section a name.'); focus(sectionName); return false; }
    var section = model.addSection(state, name);
    if (!section) { setText(sectionError, 'Try a different section name, up to 60 characters.'); focus(sectionName); return false; }
    dirty = true;
    hideSectionForm(); renderAll();
    setClass('show-editor', false);
    saveNow(); focus(sectionNodes['section-' + section.id]);
    return false;
  };
  cancelSection.onclick = function () { hideSectionForm(); focus(newSectionButton); };
  noteSection.onchange = function () {
    flush();
    var note = selectedNote();
    if (note && model.move(state, note.id, this.value)) {
      dirty = true; renderAll(); setClass('show-editor', true); saveNow();
    }
  };
  showNotesButton.onclick = function () {
    flush(); setClass('show-editor', false);
    var item = itemNodes['note-' + state.activeId];
    focus(item ? item.button : sectionNodes['section-' + state.activeSectionId] || newButton);
  };
  removeButton.onclick = function () {
    flush();
    var note = selectedNote();
    if (!note || !model.remove(state, note.id)) { return; }
    dirty = true; renderAll();
    if (!selectedNote()) { setClass('show-editor', false); }
    saveNow(); focus(editor.style.display !== 'none' ? editor : newButton);
  };
  undoButton.onclick = function () {
    flush();
    var note = model.undoRemove(state);
    if (!note) { return; }
    dirty = true; renderAll(); setClass('show-editor', true); saveNow(); focus(editor);
  };
  writeButton.onclick = function () { switchTool('write'); };
  drawButton.onclick = function () { switchTool('draw'); };
  eraseButton.onclick = function () { switchTool('erase'); };
  toolUndo.onclick = function () {
    flush();
    var note = selectedNote();
    if (!note) { return; }
    if (mode !== 'write') {
      if (ink) { ink.undo(); saveNow(); updateUndoTool(); }
      return;
    }
    var previous = textHistory.pop();
    if (!previous) { updateUndoTool(); return; }
    if (model.update(state, note.id, previous.title, previous.body)) {
      titleInput.value = previous.title; bodyInput.value = previous.body;
      dirty = true; note = selectedNote(); updateListItem(note); updateTimestamp(note); saveNow();
    }
    textGroupOpen = false;
    updateUndoTool();
  };
  titleInput.oninput = handleInput;
  bodyInput.oninput = handleInput;
  titleInput.onblur = flush;
  bodyInput.onblur = flush;
  exitLink.onclick = flush;
  window.addEventListener('pagehide', flush, false);
  window.addEventListener('resize', function () { if (ink) { ink.resize(); } }, false);
  window.addEventListener('pageshow', function (event) {
    if (event.persisted && !dirty && !writeBlocked) {
      readSaved(); inkLoadedId = null; historyNoteId = null;
      textHistory = []; renderAll(); setClass('show-editor', false);
    }
  }, false);

  ink = window.NotebookInk.create({
    canvas: document.getElementById('note-drawing'),
    paper: document.getElementById('drawing-paper'),
    onChange: function (strokes) {
      var note = selectedNote();
      if (!note || inkLoadedId !== note.id) { return; }
      if (model.updateInk(state, note.id, strokes)) {
        dirty = true; note = selectedNote(); updateListItem(note); updateTimestamp(note); scheduleSave();
      }
      updateUndoTool();
    },
    onNotice: setToolNotice
  });
  storageStatus.style.display = 'none';
  readSaved(); hideSectionForm(); renderAll(); setClass('show-editor', false); saveNow();
}());
