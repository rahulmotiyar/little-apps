(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../pen-tools.js'));
  } else {
    root.KindleNotebook = factory(root.LittleAppsPens);
  }
}(this, function (pens) {
  'use strict';

  var MAX_NOTES = 50;
  var MAX_TITLE = 120;
  var MAX_BODY = 20000;
  var MAX_SECTIONS = 20;
  var MAX_SECTION_NAME = 60;
  var MAX_INK_STROKES = 200;
  var MAX_INK_POINTS = 20000;
  var MAX_STROKE_POINTS = 1000;
  var MAX_SEQUENCE = 9007199254740991;

  function create() {
    return { nextId: 1, notes: [], activeId: null, removed: null, nextSectionId: 1, sections: [{ id: 'unfiled', name: 'Notes' }], activeSectionId: 'unfiled' };
  }

  function integer(value) {
    return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
  }

  function sequence(id, prefix) {
    var suffix;
    var value;
    if (typeof id !== 'string' || id.indexOf(prefix) !== 0) { return null; }
    suffix = id.slice(prefix.length);
    if (!/^[1-9][0-9]*$/.test(suffix)) { return null; }
    value = Number(suffix);
    return integer(value) && value < MAX_SEQUENCE && String(value) === suffix ? value : null;
  }

  function validTimestamp(value) {
    return integer(value) && value >= 0 && value <= 8640000000000000;
  }

  function timestamp(now) {
    var value = now === undefined ? Date.now() : now;
    return validTimestamp(value) ? value : null;
  }

  function validText(title, body) {
    return typeof title === 'string' && title.length <= MAX_TITLE && typeof body === 'string' && body.length <= MAX_BODY;
  }

  function array(value) {
    return Object.prototype.toString.call(value) === '[object Array]';
  }

  function copyInk(strokes) {
    var copy = [];
    var total = 0;
    var stroke;
    var points;
    var point;
    var i;
    var j;
    if (!array(strokes) || strokes.length > MAX_INK_STROKES) { return null; }
    for (i = 0; i < strokes.length; i += 1) {
      stroke = strokes[i];
      if (!stroke || pens.widths.indexOf(stroke.width) === -1 || (stroke.style !== undefined && pens.styles.indexOf(stroke.style) === -1) || !array(stroke.points) || stroke.points.length < 1 || stroke.points.length > MAX_STROKE_POINTS) { return null; }
      total += stroke.points.length;
      if (total > MAX_INK_POINTS) { return null; }
      points = [];
      for (j = 0; j < stroke.points.length; j += 1) {
        point = stroke.points[j];
        if (!array(point) || point.length !== 2 || typeof point[0] !== 'number' || !isFinite(point[0]) || Math.abs(point[0]) > 100000 || typeof point[1] !== 'number' || !isFinite(point[1]) || Math.abs(point[1]) > 100000) { return null; }
        points.push([point[0], point[1]]);
      }
      var saved = { width: stroke.width, points: points };
      if (stroke.style) { saved.style = stroke.style; }
      copy.push(saved);
    }
    return copy;
  }

  function sameInk(a, b) {
    var i;
    var j;
    if (a.length !== b.length) { return false; }
    for (i = 0; i < a.length; i += 1) {
      if (a[i].width !== b[i].width || a[i].style !== b[i].style || a[i].points.length !== b[i].points.length) { return false; }
      for (j = 0; j < a[i].points.length; j += 1) {
        if (a[i].points[j][0] !== b[i].points[j][0] || a[i].points[j][1] !== b[i].points[j][1]) { return false; }
      }
    }
    return true;
  }

  function copyNote(note, version) {
    var ink;
    var copy;
    if (!note || Object.prototype.toString.call(note) !== '[object Object]' || sequence(note.id, 'note-') === null || !validText(note.title, note.body)) { throw new Error('Unrecognised notebook note'); }
    copy = { id: note.id, title: note.title, body: note.body, sectionId: 'unfiled', createdAt: null, updatedAt: null, ink: [] };
    if (version === 2) {
      ink = copyInk(note.ink);
      if (typeof note.sectionId !== 'string' || (note.createdAt !== null && !validTimestamp(note.createdAt)) || (note.updatedAt !== null && !validTimestamp(note.updatedAt)) || ink === null) { throw new Error('Unrecognised notebook note details'); }
      copy.sectionId = note.sectionId;
      copy.createdAt = note.createdAt;
      copy.updatedAt = note.updatedAt;
      copy.ink = ink;
      if (validTimestamp(note.indexedAt)) { copy.indexedAt = note.indexedAt; }
    }
    return copy;
  }

  function get(state, id) {
    var i;
    for (i = 0; i < state.notes.length; i += 1) {
      if (state.notes[i].id === id) { return state.notes[i]; }
    }
    return null;
  }

  function getSection(state, id) {
    var i;
    for (i = 0; i < state.sections.length; i += 1) {
      if (state.sections[i].id === id) { return state.sections[i]; }
    }
    return null;
  }

  function selectSection(state, id) {
    var i;
    if (!getSection(state, id)) { return false; }
    state.activeSectionId = id;
    state.activeId = null;
    for (i = 0; i < state.notes.length; i += 1) {
      if (state.notes[i].sectionId === id) { state.activeId = state.notes[i].id; break; }
    }
    return true;
  }

  function availableSectionName(state, name, currentId) {
    var clean;
    if (typeof name !== 'string') { return null; }
    clean = name.replace(/^\s+|\s+$/g, '');
    if (!clean || clean.length > MAX_SECTION_NAME) { return null; }
    var duplicate = state.sections.some(function (section) {
      return section.id !== currentId && section.name.trim().toLowerCase() === clean.toLowerCase();
    });
    return duplicate ? null : clean;
  }

  function addSection(state, name) {
    if (state.sections.length >= MAX_SECTIONS || state.nextSectionId >= MAX_SEQUENCE) { return null; }
    var clean = availableSectionName(state, name);
    if (!clean) { return null; }
    var section = { id: 'section-' + state.nextSectionId, name: clean };
    state.nextSectionId += 1;
    state.sections.push(section);
    state.activeSectionId = section.id;
    state.activeId = null;
    return section;
  }

  function renameSection(state, id, name) {
    var section = getSection(state, id);
    var clean = availableSectionName(state, name, id);
    if (!section || !clean) { return null; }
    section.name = clean;
    return section;
  }

  function removeSection(state, id) {
    if (state.sections.length < 2 || !getSection(state, id)) { return false; }
    var target = state.sections[0].id === id ? state.sections[1] : state.sections[0];
    var targetId = target.id;
    state.sections = state.sections.filter(function (section) { return section.id !== id; });
    // The built-in storage ID must survive, even when its displayed section is removed.
    if (id === 'unfiled') { target.id = 'unfiled'; }
    function refile(note) {
      if (note.sectionId === id || note.sectionId === targetId) { note.sectionId = target.id; }
    }
    state.notes.forEach(refile);
    if (state.removed) { refile(state.removed.note); }
    if (state.activeSectionId === id || state.activeSectionId === targetId) { state.activeSectionId = target.id; }
    return true;
  }

  function add(state, sectionId, now) {
    var selected = sectionId === undefined ? state.activeSectionId : sectionId;
    var time = timestamp(now);
    var note;
    if (state.notes.length >= MAX_NOTES || state.nextId >= MAX_SEQUENCE || !getSection(state, selected) || time === null) { return null; }
    note = { id: 'note-' + state.nextId, title: '', body: '', sectionId: selected, createdAt: time, updatedAt: time, ink: [] };
    state.nextId += 1;
    state.notes.unshift(note);
    state.activeId = note.id;
    state.activeSectionId = selected;
    if (state.removed) { state.removed.index += 1; }
    return note;
  }

  function select(state, id) {
    var note = get(state, id);
    if (!note) { return false; }
    state.activeId = id;
    state.activeSectionId = note.sectionId;
    return true;
  }

  function update(state, id, title, body, now) {
    var note = get(state, id);
    var time;
    if (!note || !validText(title, body) || (note.title === title && note.body === body)) { return false; }
    time = timestamp(now);
    if (time === null) { return false; }
    note.title = title;
    note.body = body;
    note.updatedAt = time;
    return true;
  }

  function move(state, id, sectionId, now) {
    var note = get(state, id);
    var time;
    if (!note || !getSection(state, sectionId) || note.sectionId === sectionId) { return false; }
    time = timestamp(now);
    if (time === null) { return false; }
    note.sectionId = sectionId;
    note.updatedAt = time;
    if (state.activeId === id) { state.activeSectionId = sectionId; }
    return true;
  }

  function updateInk(state, id, strokes, now) {
    var note = get(state, id);
    var ink;
    var time;
    if (!note) { return false; }
    ink = copyInk(strokes);
    if (ink === null || sameInk(note.ink, ink)) { return false; }
    time = timestamp(now);
    if (time === null) { return false; }
    note.ink = ink;
    note.updatedAt = time;
    return true;
  }

  function remove(state, id) {
    var note;
    var distance;
    var candidate;
    var i;
    for (i = 0; i < state.notes.length; i += 1) {
      if (state.notes[i].id === id) {
        note = state.notes[i];
        state.removed = { note: note, index: i };
        state.notes.splice(i, 1);
        if (state.activeId === id) {
          state.activeId = null;
          state.activeSectionId = note.sectionId;
          for (distance = 0; distance < state.notes.length; distance += 1) {
            candidate = state.notes[i + distance];
            if (candidate && candidate.sectionId === note.sectionId) { state.activeId = candidate.id; break; }
            candidate = state.notes[i - 1 - distance];
            if (candidate && candidate.sectionId === note.sectionId) { state.activeId = candidate.id; break; }
          }
        }
        return true;
      }
    }
    return false;
  }

  function undoRemove(state) {
    var note;
    if (!state.removed) { return null; }
    note = state.removed.note;
    state.notes.splice(state.removed.index, 0, note);
    state.activeId = note.id;
    state.activeSectionId = note.sectionId;
    state.removed = null;
    return note;
  }

  function encode(state) {
    return JSON.stringify({ version: 2, nextId: state.nextId, notes: state.notes, activeId: state.activeId, removed: state.removed, nextSectionId: state.nextSectionId, sections: state.sections, activeSectionId: state.activeSectionId });
  }

  function decode(raw) {
    var saved = JSON.parse(raw);
    var state = create();
    var seen = {};
    var sectionIds = {};
    var sectionNames = [];
    var largestId = 0;
    var largestSectionId = 0;
    var section;
    var cleanName;
    var number;
    var note;
    var i;
    if (!saved || (saved.version !== 1 && saved.version !== 2) || !integer(saved.nextId) || saved.nextId < 1 || saved.nextId > MAX_SEQUENCE || !array(saved.notes) || saved.notes.length > MAX_NOTES + 1) { throw new Error('Unrecognised notebook'); }
    state.nextId = saved.nextId;
    if (saved.version === 2) {
      if (!array(saved.sections) || !saved.sections.length || saved.sections.length > MAX_SECTIONS || !integer(saved.nextSectionId) || saved.nextSectionId < 1 || saved.nextSectionId > MAX_SEQUENCE) { throw new Error('Unrecognised notebook sections'); }
      state.sections = [];
      state.nextSectionId = saved.nextSectionId;
      for (i = 0; i < saved.sections.length; i += 1) {
        section = saved.sections[i];
        if (!section || typeof section.name !== 'string') { throw new Error('Unrecognised notebook section'); }
        number = section.id === 'unfiled' ? 0 : sequence(section.id, 'section-');
        cleanName = section.name.replace(/^\s+|\s+$/g, '');
        if (number === null || sectionIds[section.id] || !cleanName || section.name.length > MAX_SECTION_NAME || sectionNames.indexOf(cleanName.toLowerCase()) !== -1) { throw new Error('Unrecognised notebook section'); }
        sectionIds[section.id] = true;
        sectionNames.push(cleanName.toLowerCase());
        largestSectionId = Math.max(largestSectionId, number);
        state.sections.push({ id: section.id, name: section.name });
      }
      if (!sectionIds.unfiled || state.nextSectionId <= largestSectionId || !getSection(state, saved.activeSectionId)) { throw new Error('Unrecognised notebook section selection'); }
      state.activeSectionId = saved.activeSectionId;
    }
    for (i = 0; i < saved.notes.length; i += 1) {
      note = copyNote(saved.notes[i], saved.version);
      if (seen[note.id] || !getSection(state, note.sectionId)) { throw new Error('Duplicate or unfiled notebook note'); }
      seen[note.id] = true;
      largestId = Math.max(largestId, sequence(note.id, 'note-'));
      state.notes.push(note);
    }
    if (saved.removed !== undefined && saved.removed !== null) {
      if (state.notes.length > MAX_NOTES || !integer(saved.removed.index) || saved.removed.index < 0 || saved.removed.index > state.notes.length) { throw new Error('Unrecognised removed notebook note'); }
      note = copyNote(saved.removed.note, saved.version);
      if (seen[note.id] || !getSection(state, note.sectionId)) { throw new Error('Duplicate or unfiled removed notebook note'); }
      largestId = Math.max(largestId, sequence(note.id, 'note-'));
      state.removed = { note: note, index: saved.removed.index };
    }
    if (state.nextId <= largestId) { throw new Error('Unrecognised notebook note counter'); }
    note = get(state, saved.activeId);
    if (saved.activeId !== null && (!note || note.sectionId !== state.activeSectionId)) { throw new Error('Unrecognised active notebook note'); }
    state.activeId = saved.activeId;
    return state;
  }

  return { create: create, add: add, get: get, select: select, update: update, remove: remove, undoRemove: undoRemove, encode: encode, decode: decode, addSection: addSection, renameSection: renameSection, removeSection: removeSection, getSection: getSection, selectSection: selectSection, move: move, updateInk: updateInk, maxNotes: MAX_NOTES, maxTitle: MAX_TITLE, maxBody: MAX_BODY, maxSections: MAX_SECTIONS, maxSectionName: MAX_SECTION_NAME, maxInkStrokes: MAX_INK_STROKES, maxInkPoints: MAX_INK_POINTS, maxStrokePoints: MAX_STROKE_POINTS };
}));
