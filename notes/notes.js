(function () {
  'use strict';

  var STORAGE_KEY = 'little-apps.notes.v1';
  var model = window.KindleNotesState;
  var MAX_NOTES = model.maxNotes;
  var MAX_LENGTH = model.maxLength;
  var state = model.create();
  var notes = state.notes;
  var storageBlocked = false;
  var storageMessage = '';
  var board = document.getElementById('notes-board');
  var addButton = document.getElementById('add-note');
  var undoButton = document.getElementById('undo-remove');
  var empty = document.getElementById('empty-notes');
  var status = document.getElementById('notes-status');

  function setText(element, text) {
    if (element.textContent !== text) {
      element.textContent = text;
    }
  }

  function setStatus(message) {
    setText(status, message);
    status.style.display = message ? 'block' : 'none';
  }

  function load() {
    var raw;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      storageBlocked = true;
      storageMessage = 'Notes cannot be saved in this browser. Keep this page open.';
      setStatus(storageMessage);
      return;
    }
    if (raw === null) {
      return;
    }
    try {
      state = model.decode(raw);
      notes = state.notes;
      setStatus('');
    } catch (error) {
      storageBlocked = true;
      storageMessage = 'Saved notes could not be opened. New changes stay only on this page.';
      setStatus(storageMessage);
    }
  }

  function save() {
    if (storageBlocked) {
      setStatus(storageMessage);
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, model.encode(state));
      setStatus('');
    } catch (error) {
      setStatus('Could not save changes. Keep this page open.');
    }
  }

  function button(label, className) {
    var element = document.createElement('button');
    element.type = 'button';
    element.className = className;
    element.textContent = label;
    return element;
  }

  function removeNote(note) {
    var i;
    for (i = 0; i < notes.length; i += 1) {
      if (notes[i] === note) {
        model.remove(state, i);
        break;
      }
    }
    save();
    render();
    undoButton.focus();
  }

  function makeNote(note, index) {
    var slot = document.createElement('section');
    var card = document.createElement('div');
    var top = document.createElement('div');
    var label = document.createElement('label');
    var removeWrap = document.createElement('div');
    var remove = button('Remove', 'note-remove icon-clear');
    var textarea = document.createElement('textarea');
    var limit = document.createElement('p');
    var inputId = 'note-text-' + index;

    slot.className = 'note-slot';
    card.className = 'note-card';
    top.className = 'note-top';
    label.className = 'note-label';
    label.htmlFor = inputId;
    label.textContent = 'Note ' + (index + 1);
    removeWrap.className = 'note-remove-wrap';
    remove.setAttribute('aria-label', 'Remove note ' + (index + 1));
    textarea.className = 'note-text';
    textarea.id = inputId;
    textarea.rows = 6;
    textarea.maxLength = MAX_LENGTH;
    textarea.placeholder = 'Write a note';
    textarea.value = note.text;
    textarea.setAttribute('aria-describedby', 'note-limit-' + index);
    limit.id = 'note-limit-' + index;
    limit.className = 'note-limit';
    limit.textContent = 'Maximum ' + MAX_LENGTH + ' characters.';
    limit.style.display = note.text.length >= MAX_LENGTH - 100 ? 'block' : 'none';

    function edit() {
      if (textarea.value.length > MAX_LENGTH) {
        textarea.value = textarea.value.slice(0, MAX_LENGTH);
      }
      note.text = textarea.value;
      limit.style.display = note.text.length >= MAX_LENGTH - 100 ? 'block' : 'none';
      save();
    }

    textarea.addEventListener('input', edit, false);
    textarea.addEventListener('change', edit, false);
    remove.addEventListener('click', function () {
      removeNote(note);
    }, false);

    removeWrap.appendChild(remove);
    top.appendChild(label);
    top.appendChild(removeWrap);
    card.appendChild(top);
    card.appendChild(textarea);
    card.appendChild(limit);
    slot.appendChild(card);
    return slot;
  }

  function render() {
    var i;
    while (board.firstChild) {
      board.removeChild(board.firstChild);
    }
    for (i = 0; i < notes.length; i += 1) {
      board.appendChild(makeNote(notes[i], i));
    }
    addButton.disabled = notes.length >= MAX_NOTES;
    addButton.textContent = notes.length >= MAX_NOTES ? 'Board full' : 'Add note';
    undoButton.style.display = state.removed ? 'inline-block' : 'none';
    empty.style.display = notes.length ? 'none' : 'block';
  }

  addButton.addEventListener('click', function () {
    if (!model.add(state)) {
      return;
    }
    save();
    render();
    document.getElementById('note-text-0').focus();
  }, false);

  undoButton.addEventListener('click', function () {
    if (model.undoRemove(state)) {
      save();
      render();
      addButton.focus();
    }
  }, false);

  load();
  render();
}());
