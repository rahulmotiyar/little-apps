(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KindleNotesState = factory();
  }
}(this, function () {
  'use strict';

  var MAX_NOTES = 24;
  var MAX_LENGTH = 3000;

  function create() {
    return { notes: [], removed: null };
  }

  function validNote(note) {
    return note && typeof note.text === 'string' && note.text.length <= MAX_LENGTH;
  }

  function decode(raw) {
    var saved = JSON.parse(raw);
    var state = create();
    var i;
    if (!saved || saved.version !== 1 || Object.prototype.toString.call(saved.notes) !== '[object Array]' || saved.notes.length > MAX_NOTES + 1) {
      throw new Error('Unrecognised notes');
    }
    for (i = 0; i < saved.notes.length; i += 1) {
      if (!validNote(saved.notes[i])) {
        throw new Error('Unrecognised note');
      }
      state.notes.push({ text: saved.notes[i].text });
    }
    if (saved.removed !== undefined && saved.removed !== null) {
      if (!validNote(saved.removed.note) || typeof saved.removed.index !== 'number' || saved.removed.index % 1 !== 0 || saved.removed.index < 0 || saved.removed.index > state.notes.length || state.notes.length > MAX_NOTES) {
        throw new Error('Unrecognised removed note');
      }
      state.removed = { note: { text: saved.removed.note.text }, index: saved.removed.index };
    }
    return state;
  }

  function encode(state) {
    return JSON.stringify({ version: 1, notes: state.notes, removed: state.removed });
  }

  function add(state) {
    if (state.notes.length >= MAX_NOTES) {
      return false;
    }
    state.notes.unshift({ text: '' });
    if (state.removed) {
      state.removed.index += 1;
    }
    return true;
  }

  function remove(state, index) {
    if (typeof index !== 'number' || index % 1 !== 0 || index < 0 || index >= state.notes.length) {
      return false;
    }
    state.removed = { note: state.notes[index], index: index };
    state.notes.splice(index, 1);
    return true;
  }

  function undoRemove(state) {
    if (!state.removed) {
      return false;
    }
    state.notes.splice(state.removed.index, 0, state.removed.note);
    state.removed = null;
    return true;
  }

  return { create: create, decode: decode, encode: encode, add: add, remove: remove, undoRemove: undoRemove, maxNotes: MAX_NOTES, maxLength: MAX_LENGTH };
}));
