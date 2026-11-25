(function () {
  'use strict';

  var model = window.KindleNotebook;
  var pens = window.LittleAppsPens;
  var orientation = window.LittleAppsOrientation;
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
  var penStyle = 'sharp';
  var penWidth = 1;
  var eraserSize = 1;
  var formatter = null;
  var sectionBeingRenamed = null;
  var sectionFormAnchor = null;
  var openMenu = null;
  var page = document.querySelector('.notebook-page');
  var layout = document.querySelector('.notebook-layout');
  var list = document.getElementById('notes-list');
  var newButton = document.getElementById('new-note');
  var undoButton = document.getElementById('undo-remove');
  var newSectionButton = document.getElementById('new-section');
  var sectionForm = document.getElementById('section-form');
  var sectionName = document.getElementById('section-name');
  var sectionError = document.getElementById('section-error');
  var saveSectionButton = document.getElementById('add-section');
  var cancelSection = document.getElementById('cancel-section');
  var noteSection = document.getElementById('note-section');
  var noteTimestamp = document.getElementById('note-timestamp');
  var toggleIndex = document.getElementById('toggle-index');
  var indexPanel = document.getElementById('notebook-index');
  var exitLink = document.getElementById('exit');
  var titleInput = document.getElementById('editor-title');
  var bodyInput = document.getElementById('editor-body');
  var writeButton = document.getElementById('write-tool');
  var drawButton = document.getElementById('pen');
  var eraseButton = document.getElementById('eraser');
  var widthButton = document.getElementById('width');
  var penOptions = document.getElementById('pen-options');
  var widthOptions = document.getElementById('width-options');
  var penChoices = penOptions.querySelectorAll('button');
  var widthChoices = widthOptions.querySelectorAll('button');
  var noteTools = document.getElementById('note-tools');
  var indexMenu = document.getElementById('index-menu');
  var toolUndo = document.getElementById('undo-tool');
  var writingMode = document.getElementById('writing-mode');
  var drawingMode = document.getElementById('drawing-mode');
  var empty = document.getElementById('empty-notebook');
  var editor = document.getElementById('editor');
  var storageStatus = document.getElementById('storage-status');
  var toolStatus = document.getElementById('tool-status');

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
    var value = note && noteDate(note);
    var date = note ? formatDate(value) : '';
    var prefix = '';
    if (note) {
      if (note.createdAt === null && note.updatedAt === null) { prefix = 'Indexed '; }
      else if (note.updatedAt === null || note.updatedAt === note.createdAt) { prefix = 'Created '; }
      else { prefix = 'Updated '; }
    }
    setText(noteTimestamp, prefix + date);
    noteTimestamp.setAttribute('title', prefix + date + (formatter && date ? ' (Europe/Amsterdam)' : ''));
    if (typeof value === 'number') { noteTimestamp.setAttribute('datetime', new Date(value).toISOString()); }
    else { noteTimestamp.removeAttribute('datetime'); }
  }
  function showStorageError(text) { setText(storageStatus, text); storageStatus.style.display = 'block'; }
  function setToolNotice(text) {
    setText(toolStatus, text || '');
    toolStatus.style.display = text ? 'block' : 'none';
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
    if (!dirty || writeBlocked) { return !dirty; }
    try {
      window.localStorage.setItem(storageKey, model.encode(state));
      dirty = false;
      needsMigration = false;
      setText(storageStatus, '');
      storageStatus.style.display = 'none';
      return true;
    } catch (error) {
      showStorageError('Your latest changes could not be saved. Keep this page open; saving will be tried again after your next edit.');
      return false;
    }
  }
  function scheduleSave() {
    if (saveTimer !== null) { window.clearTimeout(saveTimer); }
    saveTimer = window.setTimeout(function () { saveTimer = null; saveNow(); }, 350);
  }
  function noteTitle(note) { return note.title.replace(/^\s+|\s+$/g, '') || 'Untitled'; }
  function updateListItem(note) {
    var item = note && itemNodes['note-' + note.id];
    if (!item) { return; }
    setText(item.title, noteTitle(note));
    item.more.setAttribute('aria-label', 'Options for ' + noteTitle(note));
    setText(item.time, dateLabel(note));
    if (typeof noteDate(note) === 'number') { item.time.setAttribute('datetime', new Date(noteDate(note)).toISOString()); }
  }
  function closeMenu() {
    if (!openMenu) { return; }
    openMenu.panel.hidden = true;
    openMenu.trigger.setAttribute('aria-expanded', 'false');
    openMenu = null;
  }
  function rect(element) { return orientation ? orientation.rect(element) : element.getBoundingClientRect(); }
  function positionMenu() {
    if (!openMenu) { return; }
    var panel = openMenu.panel;
    var workspace = rect(layout);
    var fromIndex = panel === indexMenu;
    var edge = fromIndex ? rect(indexPanel).right - workspace.left : rect(noteTools).left - workspace.left;
    panel.style.maxWidth = Math.max(0, fromIndex ? workspace.width - edge : edge) + 'px';
    panel.style.maxHeight = workspace.height + 'px';
    panel.style.left = (fromIndex ? edge : edge - panel.offsetWidth) + 'px';
    panel.style.top = Math.max(0, Math.min(rect(openMenu.trigger).top - workspace.top, workspace.height - panel.offsetHeight)) + 'px';
  }
  function showMenu(panel, trigger) {
    closeMenu();
    openMenu = { panel:panel, trigger:trigger };
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    positionMenu();
  }
  function action(label, handler) {
    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.onclick = handler;
    return button;
  }
  function moreButton(id, showActions) {
    var more = document.createElement('button');
    more.type = 'button';
    more.className = 'section-more';
    more.setAttribute('data-id', id);
    more.setAttribute('aria-controls', 'index-menu');
    more.setAttribute('aria-expanded', 'false');
    more.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>';
    more.onclick = function () {
      if (openMenu && openMenu.trigger === this) { closeMenu(); return; }
      showActions(this.getAttribute('data-id'), this);
    };
    return more;
  }
  function showSectionActions(id, trigger) {
    clearChildren(indexMenu);
    var rename = action('Rename section', function () { closeMenu(); showSectionForm(id, trigger); });
    var deletion = action('Delete section', function () {
      flush();
      if (model.removeSection(state, id)) {
        dirty = true; renderAll(); saveNow();
        focus(sectionNodes['section-' + state.activeSectionId] || newSectionButton);
      }
    });
    deletion.disabled = state.sections.length < 2;
    var explanation = document.createElement('p');
    explanation.textContent = deletion.disabled ? 'Keep at least one section.' : 'Notes move to the first remaining section.';
    indexMenu.appendChild(rename); indexMenu.appendChild(deletion); indexMenu.appendChild(explanation);
    showMenu(indexMenu, trigger);
    focus(rename);
  }
  function showNoteActions(id, trigger) {
    clearChildren(indexMenu);
    var deletion = action('Delete note…', function () {
      var note = model.get(state, id);
      if (!note) { closeMenu(); return; }
      clearChildren(indexMenu);
      var question = document.createElement('p');
      question.id = 'note-delete-question';
      question.textContent = 'Delete “' + noteTitle(note) + '”?';
      var choices = document.createElement('div');
      choices.className = 'note-confirm-actions';
      choices.setAttribute('role', 'group');
      choices.setAttribute('aria-labelledby', question.id);
      var cancel = action('Cancel', function () { closeMenu(); focus(trigger); });
      var confirm = action('Delete', function () {
        flush();
        if (!model.remove(state, id)) { return; }
        dirty = true; renderAll(); saveNow();
        focus(selectedNote() ? editor : newButton);
      });
      confirm.className = 'confirm-delete';
      choices.appendChild(cancel); choices.appendChild(confirm);
      indexMenu.appendChild(question); indexMenu.appendChild(choices);
      positionMenu();
      focus(cancel);
    });
    indexMenu.appendChild(deletion);
    showMenu(indexMenu, trigger);
    focus(deletion);
  }
  function renderList() {
    var scrollTop = list.scrollTop;
    closeMenu();
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
        var time = document.createElement('time');
        time.className = 'notebook-item-time';
        button.appendChild(title); button.appendChild(time);
        button.onclick = function () { openNote(this.getAttribute('data-note-id')); };
        var noteMore = moreButton(note.id, showNoteActions);
        var row = document.createElement('div'); row.className = 'note-row';
        row.appendChild(button); row.appendChild(noteMore);
        itemNodes['note-' + note.id] = { title: title, time: time, more: noteMore };
        updateListItem(note);
        sectionNotes.appendChild(row);
      }
      if (!count && section.id === 'unfiled' && section.name === 'Notes') { continue; }
      var counter = document.createElement('span');
      counter.className = 'section-count';
      counter.textContent = String(count);
      heading.appendChild(counter);
      heading.onclick = function () { openSection(this.getAttribute('data-section-id')); };
      var sectionHeader = document.createElement('div');
      sectionHeader.className = 'section-header';
      sectionHeader.appendChild(heading);
      var more = moreButton(section.id, showSectionActions);
      more.setAttribute('aria-label', 'Options for ' + section.name);
      sectionHeader.appendChild(more);
      group.appendChild(sectionHeader);
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
  function updatePenControls() {
    var erasing = mode === 'erase';
    var size = erasing ? eraserSize : penWidth;
    var sizeNames = erasing ? pens.eraserNames : pens.widthNames;
    drawButton.setAttribute('data-style', penStyle);
    drawButton.title = 'Pen: ' + pens.names[penStyle];
    drawButton.setAttribute('aria-label', drawButton.title);
    widthButton.className = 'tool-button note-tool pen-width-' + size;
    widthButton.setAttribute('data-tool', erasing ? 'eraser' : 'pen');
    widthButton.title = (erasing ? 'Eraser size: ' : 'Pen width: ') + sizeNames[size];
    widthButton.setAttribute('aria-label', widthButton.title);
    for (var i = 0; i < penChoices.length; i += 1) {
      penChoices[i].setAttribute('aria-pressed', String(pens.styles[i] === penStyle));
      widthChoices[i].setAttribute('aria-pressed', String(i === size));
      setText(widthChoices[i], sizeNames[i]);
    }
    if (ink) {
      ink.setPen(penStyle, penWidth);
      ink.setEraserSize(eraserSize);
    }
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
    updatePenControls();
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
    titleInput.disabled = !note;
    bodyInput.disabled = !note;
    writeButton.disabled = !note;
    drawButton.disabled = !note;
    eraseButton.disabled = !note;
    widthButton.disabled = !note;
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
    saveNow();
    focus(sectionNodes['section-' + id]);
  }
  function hideSectionForm() {
    sectionForm.hidden = true;
    sectionForm.style.display = 'none';
    sectionBeingRenamed = null;
    sectionFormAnchor = null;
    setText(sectionError, '');
  }
  function showSectionForm(id, anchor) {
    flush();
    var section = id && model.getSection(state, id);
    sectionBeingRenamed = section ? section.id : null;
    sectionFormAnchor = anchor;
    sectionForm.hidden = false;
    sectionForm.style.display = '';
    sectionName.value = section ? section.name : '';
    setText(saveSectionButton, section ? 'Rename' : 'Add');
    setText(sectionError, '');
    focus(sectionName);
    if (section) { sectionName.select(); }
  }
  function switchTool(nextMode) {
    if (!selectedNote()) { return; }
    flush();
    closeMenu();
    setToolNotice('');
    applyMode(nextMode);
    if (nextMode === 'write') { focus(bodyInput); }
  }

  newButton.onclick = function () {
    flush();
    var note = model.add(state);
    if (!note) {
      setToolNotice('Notebook is full. Delete a note to add another (50 notes maximum).');
      return;
    }
    dirty = true;
    hideSectionForm(); renderAll();
    applyMode('write'); saveNow(); focus(titleInput);
  };
  newSectionButton.onclick = function () { showSectionForm(null, this); };
  sectionForm.onsubmit = function (event) {
    if (event) { event.preventDefault(); }
    flush();
    var name = sectionName.value.replace(/^\s+|\s+$/g, '');
    if (!name) { setText(sectionError, 'Give this section a name.'); focus(sectionName); return false; }
    var section = sectionBeingRenamed ? model.renameSection(state, sectionBeingRenamed, name) : model.addSection(state, name);
    if (!section) { setText(sectionError, 'Try a different section name, up to 60 characters.'); focus(sectionName); return false; }
    dirty = true;
    hideSectionForm(); renderAll();
    saveNow(); focus(sectionNodes['section-' + section.id] || newSectionButton);
    return false;
  };
  cancelSection.onclick = function () {
    var anchor = sectionFormAnchor;
    hideSectionForm();
    focus(anchor && indexPanel.contains(anchor) ? anchor : newSectionButton);
  };
  noteSection.onchange = function () {
    flush();
    var note = selectedNote();
    if (note && model.move(state, note.id, this.value)) {
      dirty = true; renderAll(); saveNow();
    }
  };
  toggleIndex.onclick = function () {
    flush();
    closeMenu();
    indexPanel.hidden = !indexPanel.hidden;
    var label = indexPanel.hidden ? 'Expand sidebar' : 'Collapse sidebar';
    toggleIndex.setAttribute('aria-expanded', String(!indexPanel.hidden));
    toggleIndex.setAttribute('aria-label', label);
    toggleIndex.setAttribute('title', label);
    if (ink) { ink.resize(); }
  };
  undoButton.onclick = function () {
    flush();
    var note = model.undoRemove(state);
    if (!note) { return; }
    dirty = true; renderAll(); saveNow(); focus(editor);
  };
  writeButton.onclick = function () { switchTool('write'); };
  drawButton.onclick = function () {
    var opening = penOptions.hidden;
    switchTool('draw');
    if (opening) { showMenu(penOptions, drawButton); focus(penChoices[pens.styles.indexOf(penStyle)]); }
  };
  eraseButton.onclick = function () { switchTool('erase'); };
  widthButton.onclick = function () {
    var opening = widthOptions.hidden;
    switchTool(mode === 'erase' ? 'erase' : 'draw');
    if (opening) { showMenu(widthOptions, widthButton); focus(widthChoices[mode === 'erase' ? eraserSize : penWidth]); }
  };
  pens.styles.forEach(function (style, index) {
    penChoices[index].onclick = function () {
      penStyle = style;
      closeMenu(); updatePenControls(); focus(drawButton);
    };
    widthChoices[index].onclick = function () {
      if (mode === 'erase') { eraserSize = index; }
      else { penWidth = index; }
      closeMenu(); updatePenControls(); focus(widthButton);
    };
  });
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
  window.LittleAppsMenus.onOutsidePress(function () { return openMenu; }, closeMenu);
  list.addEventListener('scroll', function () { if (openMenu && openMenu.panel === indexMenu) { closeMenu(); } });
  document.addEventListener('keydown', function (event) {
    if (openMenu && (event.key === 'Escape' || event.keyCode === 27)) {
      var trigger = openMenu.trigger;
      closeMenu(); focus(trigger); event.preventDefault();
    }
  }, false);
  window.addEventListener('pagehide', function () { closeMenu(); flush(); }, false);
  window.addEventListener('resize', positionMenu, false);
  window.addEventListener('littleappsorientationchange', positionMenu, false);
  window.addEventListener('pageshow', function (event) {
    if (event.persisted && !dirty && !writeBlocked) {
      readSaved(); inkLoadedId = null; historyNoteId = null;
      textHistory = []; renderAll();
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
  readSaved(); hideSectionForm(); renderAll(); saveNow();
}());
