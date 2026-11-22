(function () {
  'use strict';

  var engine = window.KindleWords;
  var flow = window.LittleGameFlow.create();
  var state;
  var displayed = null;
  var displayedIndex = 0;
  var waitingNext = false;
  var resultOpen = false;
  var exited = false;
  var selectedLetters = [];
  var readingButtons = [];
  var letterButtons = [];
  var slots = [];
  var stars = [];
  var page = document.getElementById('words-page');
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
  var spellPicture = document.getElementById('spell-picture');
  var spellClue = document.getElementById('spell-clue');
  var wordSlots = document.getElementById('word-slots');
  var letterBank = document.getElementById('letter-bank');
  var undoLetter = document.getElementById('undo-letter');
  var checkWord = document.getElementById('check-word');
  var feedback = document.getElementById('feedback');
  var overlay = document.getElementById('result-overlay');
  var resultTitle = document.getElementById('result-title');
  var resultCopy = document.getElementById('result-copy');
  var resultNew = document.getElementById('result-new-round');
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

  function updateStars() {
    for (var i = 0; i < stars.length; i += 1) { flag(stars[i], 'earned', i < state.index); }
    starsContainer.setAttribute('aria-label', state.index + ' van ' + state.total + ' sterren');
    text(progress, (state.activity === 'spell' ? 'Woord ' : 'Vraag ') + Math.min(displayedIndex + 1, state.total) + ' van ' + state.total);
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
    text(resultTitle, 'Hoera!');
    text(resultCopy, 'Vijf sterren. Goed gedaan!');
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
      slots[k].setAttribute('aria-label', 'Letter ' + (k + 1) + ': ' + (letter || 'leeg'));
    }
    wordSlots.setAttribute('aria-label', 'Jouw woord: ' + (selectedLetters.length ? selectedWord() : 'nog leeg'));
    undoLetter.disabled = waitingNext || resultOpen || !selectedLetters.length;
    checkWord.disabled = waitingNext || resultOpen || selectedLetters.length !== displayed.word.length;
  }

  function chooseLetter(index) {
    if (resultOpen || waitingNext || state.activity !== 'spell' || !letterButtons[index] || letterButtons[index].disabled || selectedLetters.length >= displayed.word.length) { return; }
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
      text(feedback, 'Nog niet. Probeer een ander antwoord.');
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
    if (String(state.group) === '3') {
      spellPicture.setAttribute('src', 'pictures/' + displayed.word + '.svg');
      show(spellPicture, true);
    }
    for (var i = 0; i < displayed.word.length; i += 1) {
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
      button.setAttribute('aria-label', 'Letter ' + displayed.letters[j]);
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
    state = engine.createRound(nextGroup, nextActivity);
    group.value = String(state.group);
    activity.value = state.activity;
    renderQuestion();
  }

  function nextQuestion() {
    if (resultOpen || !waitingNext) { return; }
    renderQuestion();
    focus(state.activity === 'read' ? readingButtons[0] : letterButtons[0]);
  }

  function exitGame() {
    exited = true;
    startRound('3', 'read');
  }

  for (var i = 0; i < 5; i += 1) { stars.push(document.getElementById('star-' + i)); }
  undoLetter.onclick = function () {
    if (resultOpen || waitingNext || state.activity !== 'spell' || !selectedLetters.length) { return; }
    selectedLetters.pop();
    text(feedback, '');
    updateSpelling();
  };
  checkWord.onclick = function () {
    if (resultOpen || waitingNext || state.activity !== 'spell' || checkWord.disabled || selectedLetters.length !== displayed.word.length) { return; }
    var result = engine.answer(state, selectedWord());
    if (!result.accepted) { return; }
    if (!result.correct) {
      text(feedback, 'Kijk nog eens naar de letters. Je kunt terug.');
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
  exit.onclick = exitGame;
  resultExit.onclick = exitGame;
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
    if (exited) { exited = false; startRound('3', 'read'); }
    else if (resultOpen) { scheduleResult(); }
    else if (waitingNext) { flow.schedule(nextQuestion, 1000); }
  }, false);
  startRound('3', 'read');
}());
