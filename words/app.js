(function () {
  'use strict';

  var engine = window.KindleWords;
  var preference = window.LittleAppsLanguage;
  var flow = window.LittleGameFlow.create();
  var state, copy;
  var displayed = null;
  var displayedIndex = 0;
  var waitingNext = false;
  var resultOpen = false;
  var selectedLetters = [];
  var readingButtons = [];
  var letterButtons = [];
  var slots = [];
  var stars = [];
  var page = document.getElementById('words-page');
  var main = document.getElementById('words-main');
  var group = document.getElementById('group');
  var activity = document.getElementById('activity');
  var newRound = document.getElementById('new-round');
  var exit = document.getElementById('exit');
  var starsContainer = document.getElementById('stars');
  var progress = document.getElementById('progress-copy');
  var readPanel = document.getElementById('read-panel');
  var storyTitle = document.getElementById('story-title');
  var story = document.getElementById('story');
  var readQuestion = document.getElementById('read-question');
  var readChoices = document.getElementById('read-choices');
  var spellPanel = document.getElementById('spell-panel');
  var spellPrompt = document.getElementById('spell-prompt');
  var bankInstruction = document.getElementById('bank-instruction');
  var spellPicture = document.getElementById('spell-picture');
  var spellClue = document.getElementById('spell-clue');
  var wordSlots = document.getElementById('word-slots');
  var letterBank = document.getElementById('letter-bank');
  var undoLetter = document.getElementById('undo-letter');
  var undoLabel = document.getElementById('undo-letter-label');
  var checkWord = document.getElementById('check-word');
  var checkLabel = document.getElementById('check-word-label');
  var feedback = document.getElementById('feedback');
  var overlay = document.getElementById('result-overlay');
  var resultTitle = document.getElementById('result-title');
  var resultCopy = document.getElementById('result-copy');
  var resultNew = document.getElementById('result-new-round');
  var resultNewLabel = document.getElementById('result-new-label');
  var resultExit = document.getElementById('result-exit');

  function text(node, value) {
    value = String(value);
    if (node.textContent !== value) { node.textContent = value; }
  }

  function flag(node, name, present) {
    var current = (' ' + (node.getAttribute('class') || '') + ' ').replace(new RegExp(' ' + name + ' ', 'g'), ' ');
    node.setAttribute('class', (current + (present ? name : '')).replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' '));
  }

  function show(node, visible, display) {
    node.hidden = !visible;
    if (visible) { node.removeAttribute('hidden'); }
    else { node.setAttribute('hidden', 'hidden'); }
    node.style.display = visible ? display || '' : 'none';
  }

  function focus(node) {
    if (node && typeof node.focus === 'function') { node.focus(); }
  }

  function clear(node) {
    while (node.firstChild) { node.removeChild(node.firstChild); }
  }

  function selectedLanguage() { return preference ? preference.read() : 'nl'; }

  function label(key, values) {
    return copy[key].replace(/\{(\w+)\}/g, function (_, name) { return values[name]; });
  }

  function updateLanguage() {
    copy = engine.getCopy(state.language);
    main.setAttribute('lang', state.language);
    overlay.setAttribute('lang', state.language);
    readPanel.setAttribute('aria-label', copy.reading);
    spellPanel.setAttribute('aria-label', copy.spelling);
    letterBank.setAttribute('aria-label', copy.tiles);
    text(activity.options[0], copy.reading);
    text(activity.options[1], copy.spelling);
    text(spellPrompt, copy.clue);
    text(bankInstruction, copy.order);
    text(undoLabel, copy.undo);
    text(checkLabel, copy.check);
    text(resultNewLabel, copy.reset);
  }

  function updateStars() {
    for (var i = 0; i < stars.length; i += 1) { flag(stars[i], 'earned', i < state.index); }
    starsContainer.setAttribute('aria-label', label('stars', { number:state.index, total:state.total }));
    text(progress, label(state.activity === 'spell' ? 'spellProgress' : 'readProgress', { number:Math.min(displayedIndex + 1, state.total), total:state.total }));
  }

  function hideResult() {
    resultOpen = false;
    show(overlay, false);
    overlay.setAttribute('aria-hidden', 'true');
    page.removeAttribute('aria-hidden');
    exit.removeAttribute('tabindex');
    group.disabled = false;
    activity.disabled = false;
    newRound.disabled = false;
  }

  function openResult() {
    resultOpen = true;
    text(resultTitle, copy.result);
    text(resultCopy, copy.resultCopy);
    show(overlay, true, 'table');
    overlay.setAttribute('aria-hidden', 'false');
    group.disabled = true;
    activity.disabled = true;
    newRound.disabled = true;
    exit.setAttribute('tabindex', '-1');
    focus(resultNew);
    page.setAttribute('aria-hidden', 'true');
    scheduleResult();
  }

  function scheduleResult() {
    flow.schedule(function () {
      startRound(state.group, state.activity);
      focus(state.activity === 'read' ? readingButtons[0] : letterButtons[0]);
    }, 2600);
  }

  function selectedWord() {
    var word = '';
    for (var i = 0; i < selectedLetters.length; i += 1) { word += displayed.letters[selectedLetters[i]]; }
    return word;
  }

  function updateSpelling() {
    var used = {};
    for (var i = 0; i < selectedLetters.length; i += 1) { used[selectedLetters[i]] = true; }
    for (var j = 0; j < letterButtons.length; j += 1) { letterButtons[j].disabled = waitingNext || resultOpen || !!used[j]; }
    for (var k = 0; k < slots.length; k += 1) {
      var letter = k < selectedLetters.length ? displayed.letters[selectedLetters[k]] : '';
      text(slots[k], letter || '\u00a0');
      slots[k].setAttribute('aria-label', label('slot', { number:k + 1, value:letter || copy.empty }));
    }
    wordSlots.setAttribute('aria-label', label('word', { value:selectedLetters.length ? selectedWord() : copy.empty }));
    undoLetter.disabled = waitingNext || resultOpen || !selectedLetters.length;
    checkWord.disabled = waitingNext || resultOpen || selectedLetters.length !== slots.length;
  }

  function chooseLetter(index) {
    if (resultOpen || waitingNext || state.activity !== 'spell' || !letterButtons[index] || letterButtons[index].disabled || selectedLetters.length >= slots.length) { return; }
    selectedLetters.push(index);
    text(feedback, '');
    updateSpelling();
  }

  function correctAnswer(result) {
    waitingNext = true;
    if (state.activity === 'read') {
      for (var i = 0; i < readingButtons.length; i += 1) { readingButtons[i].disabled = true; }
    } else { updateSpelling(); }
    text(feedback, '');
    updateStars();
    if (result.complete) {
      openResult();
    } else {
      flow.schedule(nextQuestion, 1000);
    }
  }

  function chooseReading(index) {
    if (resultOpen || waitingNext || state.activity !== 'read' || !readingButtons[index] || readingButtons[index].disabled) { return; }
    var result = engine.answer(state, displayed.choices[index]);
    if (!result.accepted) { return; }
    if (!result.correct) {
      readingButtons[index].disabled = true;
      flag(readingButtons[index], 'tried', true);
      text(feedback, copy.readRetry);
      return;
    }
    flag(readingButtons[index], 'correct', true);
    readingButtons[index].setAttribute('aria-pressed', 'true');
    correctAnswer(result);
  }

  function renderReading() {
    text(storyTitle, displayed.title);
    text(story, displayed.story);
    text(readQuestion, displayed.question);
    for (var i = 0; i < displayed.choices.length; i += 1) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'reading-choice';
      button.setAttribute('class', 'reading-choice');
      button.setAttribute('data-choice', String(i));
      button.setAttribute('aria-pressed', 'false');
      text(button, displayed.choices[i]);
      button.onclick = function () { chooseReading(Number(this.getAttribute('data-choice'))); };
      readingButtons.push(button);
      readChoices.appendChild(button);
    }
    undoLetter.disabled = true;
    checkWord.disabled = true;
  }

  function renderSpelling() {
    text(spellClue, displayed.clue);
    if (displayed.picture) {
      spellPicture.setAttribute('src', 'pictures/' + displayed.picture + '.svg');
      show(spellPicture, true);
    }
    for (var i = 0; i < displayed.letters.length; i += 1) {
      var slot = document.createElement('span');
      slot.className = 'word-slot';
      slots.push(slot);
      wordSlots.appendChild(slot);
    }
    for (var j = 0; j < displayed.letters.length; j += 1) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'letter-button';
      button.setAttribute('data-letter', String(j));
      button.setAttribute('aria-label', label('tile', { value:displayed.letters[j] }));
      text(button, displayed.letters[j]);
      button.onclick = function () { chooseLetter(Number(this.getAttribute('data-letter'))); };
      letterButtons.push(button);
      letterBank.appendChild(button);
    }
    updateSpelling();
  }

  function renderQuestion() {
    displayed = engine.question(state);
    displayedIndex = state.index;
    waitingNext = false;
    if (!displayed) { openResult(); return; }
    selectedLetters = [];
    readingButtons = [];
    letterButtons = [];
    slots = [];
    clear(readChoices);
    clear(wordSlots);
    clear(letterBank);
    show(spellPicture, false);
    spellPicture.removeAttribute('src');
    text(feedback, '');
    show(readPanel, state.activity === 'read');
    show(spellPanel, state.activity === 'spell');
    if (state.activity === 'read') { renderReading(); }
    else { renderSpelling(); }
    updateStars();
  }

  function startRound(nextGroup, nextActivity) {
    flow.cancel();
    hideResult();
    state = engine.createRound(nextGroup, nextActivity, null, selectedLanguage());
    updateLanguage();
    group.value = String(state.group);
    activity.value = state.activity;
    renderQuestion();
  }

  function nextQuestion() {
    if (resultOpen || !waitingNext) { return; }
    renderQuestion();
    focus(state.activity === 'read' ? readingButtons[0] : letterButtons[0]);
  }

  for (var i = 0; i < 5; i += 1) { stars.push(document.getElementById('star-' + i)); }
  undoLetter.onclick = function () {
    if (resultOpen || waitingNext || state.activity !== 'spell' || !selectedLetters.length) { return; }
    selectedLetters.pop();
    text(feedback, '');
    updateSpelling();
  };
  checkWord.onclick = function () {
    if (resultOpen || waitingNext || state.activity !== 'spell' || checkWord.disabled || selectedLetters.length !== slots.length) { return; }
    var result = engine.answer(state, selectedWord());
    if (!result.accepted) { return; }
    if (!result.correct) {
      text(feedback, copy.spellRetry);
      return;
    }
    correctAnswer(result);
  };
  group.onchange = function () { if (!resultOpen) { startRound(this.value, activity.value); } };
  activity.onchange = function () { if (!resultOpen) { startRound(group.value, this.value); } };
  newRound.onclick = function () { if (!resultOpen) { startRound(state.group, state.activity); } };
  resultNew.onclick = function () {
    if (resultOpen) { startRound(state.group, state.activity); focus(state.activity === 'read' ? readingButtons[0] : letterButtons[0]); }
  };
  exit.onclick = flow.exit;
  resultExit.onclick = flow.exit;
  document.addEventListener('keydown', function (event) {
    if (!resultOpen) { return; }
    var key = event.key || event.keyCode;
    if (key === 'Tab' || key === 9) {
      event.preventDefault();
      focus(document.activeElement === resultNew ? resultExit : resultNew);
    } else if (key === 'Escape' || key === 27) { event.preventDefault(); }
  }, false);
  document.addEventListener('focusin', function (event) {
    if (resultOpen && event.target !== resultNew && event.target !== resultExit) { focus(resultNew); }
  }, false);
  window.addEventListener('pageshow', function () {
    if (flow.resume()) { startRound('3', 'read'); }
    else if (state.language !== selectedLanguage()) { startRound(state.group, state.activity); }
    else if (resultOpen) { scheduleResult(); }
    else if (waitingNext) { flow.schedule(nextQuestion, 1000); }
  }, false);
  window.addEventListener('storage', function (event) {
    if (preference && (event.key === preference.key || event.key === null) && state.language !== selectedLanguage()) {
      startRound(state.group, state.activity);
    }
  });
  startRound('3', 'read');
}());
