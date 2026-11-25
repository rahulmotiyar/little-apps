(function () {
  'use strict';

  var engine = window.KindleSums;
  var flow = window.LittleGameFlow.create();
  var state;
  var displayed = null;
  var displayedIndex = 0;
  var waitingNext = false;
  var resultOpen = false;
  var hintOpen = false;
  var page = document.getElementById('sums-page');
  var level = document.getElementById('level');
  var mode = document.getElementById('mode');
  var newRound = document.getElementById('new-round');
  var exit = document.getElementById('exit');
  var stars = document.querySelectorAll('#stars .progress-star');
  var starsContainer = document.getElementById('stars');
  var progress = document.getElementById('progress-copy');
  var prompt = document.getElementById('question-prompt');
  var equation = document.getElementById('equation');
  var left = document.getElementById('left-number');
  var operator = document.getElementById('operator');
  var right = document.getElementById('right-number');
  var answer = document.getElementById('answer-slot');
  var feedback = document.getElementById('feedback');
  var hint = document.getElementById('hint');
  var hintLabel = document.getElementById('hint-label');
  var countingHelp = document.getElementById('counting-help');
  var countingCopy = document.getElementById('counting-copy');
  var countingModel = document.getElementById('counting-model');
  var overlay = document.getElementById('result-overlay');
  var resultTitle = document.getElementById('result-title');
  var resultCopy = document.getElementById('result-copy');
  var resultNew = document.getElementById('result-new-round');
  var resultExit = document.getElementById('result-exit');
  var choices = [];
  var choiceNumbers = [];

  function setText(node, value) {
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

  function clearChildren(node) {
    while (node.firstChild) { node.removeChild(node.firstChild); }
  }

  function updateStars() {
    var earned = state.answers.length;
    for (var i = 0; i < stars.length; i += 1) { flag(stars[i], 'earned', i < earned); }
    starsContainer.setAttribute('aria-label', earned + ' of ' + state.total + ' stars earned');
    setText(progress, 'Sum ' + Math.min(displayedIndex + 1, state.total) + ' of ' + state.total);
  }

  function hideResult() {
    resultOpen = false;
    show(overlay, false);
    overlay.setAttribute('aria-hidden', 'true');
    page.removeAttribute('aria-hidden');
    exit.removeAttribute('tabindex');
    level.disabled = false;
    mode.disabled = false;
    newRound.disabled = false;
    hint.disabled = false;
  }

  function openResult() {
    resultOpen = true;
    setText(resultTitle, 'Five stars!');
    setText(resultCopy, 'You did all five. Hooray!');
    show(overlay, true, 'table');
    overlay.setAttribute('aria-hidden', 'false');
    level.disabled = true;
    mode.disabled = true;
    newRound.disabled = true;
    hint.disabled = true;
    exit.setAttribute('tabindex', '-1');
    focus(resultNew);
    page.setAttribute('aria-hidden', 'true');
    flow.schedule(resetSameSettings, 2600);
  }

  function resetHint() {
    hintOpen = false;
    hint.setAttribute('aria-expanded', 'false');
    setText(hintLabel, state.group === '3' ? 'Count with dots' : 'Help');
    setText(countingCopy, '');
    clearChildren(countingModel);
    show(countingHelp, false);
  }

  function dotGroup(count, crossed) {
    var group = document.createElement('span');
    group.className = 'dot-group';
    group.setAttribute('aria-label', count + ' dots' + (crossed ? ', ' + crossed + ' crossed out' : ''));
    if (!count) {
      var zero = document.createElement('span');
      zero.className = 'dot-zero';
      zero.textContent = '0';
      group.appendChild(zero);
    }
    for (var i = 0; i < count; i += 1) {
      var dot = document.createElement('span');
      dot.className = 'sum-dot' + (i >= count - crossed ? ' taken-away' : '');
      dot.setAttribute('aria-hidden', 'true');
      group.appendChild(dot);
    }
    return group;
  }

  function buildCountingHelp() {
    clearChildren(countingModel);
    if (state.group !== '3') {
      setText(countingCopy, state.group === '4' ? 'Use tens and ones.' : 'Use hundreds, tens and ones.');
      var parts = document.createElement('div');
      parts.className = 'place-value-hint';
      var inputs = [displayed.a, displayed.b];
      for (var p = 0; p < inputs.length; p += 1) {
        var step = document.createElement('p');
        step.className = 'hint-step';
        setText(step, inputs[p] + ' = ' + placeValue(inputs[p]));
        parts.appendChild(step);
      }
      var strategy = document.createElement('p');
      strategy.className = 'hint-step';
      setText(strategy, displayed.operator === '+' ? 'Add each part, then put the parts together.' : 'Take away one part at a time. Exchange a ten or a hundred if needed.');
      parts.appendChild(strategy);
      countingModel.appendChild(parts);
      return;
    }
    if (displayed.operator === '+') {
      setText(countingCopy, 'Count all the dots.');
      countingModel.appendChild(dotGroup(displayed.a, 0));
      var plus = document.createElement('span');
      plus.className = 'dot-separator';
      plus.textContent = '+';
      plus.setAttribute('aria-hidden', 'true');
      countingModel.appendChild(plus);
      countingModel.appendChild(dotGroup(displayed.b, 0));
    } else {
      setText(countingCopy, 'Cross out ' + displayed.b + '. Count what’s left.');
      countingModel.appendChild(dotGroup(displayed.a, displayed.b));
    }
  }

  function placeValue(value) {
    if (state.group === '4' && value === 100) { return '10 tens'; }
    if (value === 1000) { return '10 hundreds'; }
    var parts = [];
    for (var place = state.group === '4' ? 10 : 100; place >= 1; place /= 10) {
      var part = Math.floor(value / place) * place;
      if (part) { parts.push(part); }
      value %= place;
    }
    return parts.join(' + ') || '0';
  }

  function renderQuestion() {
    displayed = engine.question(state);
    displayedIndex = state.index;
    waitingNext = false;
    if (!displayed) { openResult(); return; }
    setText(prompt, displayed.operator === '+' ? 'How many altogether?' : 'How many are left?');
    setText(left, displayed.a);
    setText(operator, displayed.operator);
    setText(right, displayed.b);
    setText(answer, '?');
    if (equation) { equation.setAttribute('aria-label', displayed.a + (displayed.operator === '+' ? ' plus ' : ' minus ') + displayed.b + ' equals what?'); }
    setText(feedback, '');
    for (var i = 0; i < choices.length; i += 1) {
      setText(choiceNumbers[i], displayed.choices[i]);
      choices[i].disabled = false;
      choices[i].setAttribute('aria-label', 'Answer ' + displayed.choices[i]);
      choices[i].setAttribute('aria-pressed', 'false');
      flag(choices[i], 'correct', false);
      flag(choices[i], 'tried', false);
    }
    hint.disabled = false;
    resetHint();
    updateStars();
  }

  function startRound(nextGroup, nextMode) {
    flow.cancel();
    hideResult();
    state = engine.createRound(nextGroup, nextMode);
    page.setAttribute('data-group', state.group);
    level.value = state.group;
    mode.value = state.mode;
    renderQuestion();
  }

  function chooseAnswer(index) {
    if (resultOpen || waitingNext || !displayed || index % 1 !== 0 || index < 0 || index >= choices.length || choices[index].disabled) { return; }
    var result = engine.choose(state, displayed.choices[index]);
    if (!result.accepted) { return; }
    if (!result.correct) {
      choices[index].disabled = true;
      flag(choices[index], 'tried', true);
      setText(feedback, state.group === '3' ? 'Try another number. You can count the dots.' : 'Try another number. Help can show the parts.');
      return;
    }
    for (var i = 0; i < choices.length; i += 1) { choices[i].disabled = true; }
    waitingNext = true;
    hint.disabled = true;
    flag(choices[index], 'correct', true);
    choices[index].setAttribute('aria-pressed', 'true');
    setText(answer, displayed.answer);
    if (equation) { equation.setAttribute('aria-label', displayed.a + (displayed.operator === '+' ? ' plus ' : ' minus ') + displayed.b + ' equals ' + displayed.answer); }
    setText(feedback, '');
    updateStars();
    if (result.complete) {
      openResult();
    } else {
      flow.schedule(nextQuestion, 1000);
    }
  }

  function resetSameSettings() {
    startRound(state.group, state.mode);
    focus(choices[0]);
  }

  function nextQuestion() {
    if (resultOpen || !waitingNext) { return; }
    renderQuestion();
    focus(choices[0]);
  }

  for (var i = 0; i < 4; i += 1) {
    var choice = document.getElementById('choice-' + i);
    choice.setAttribute('data-choice', String(i));
    choice.onclick = function () { chooseAnswer(Number(this.getAttribute('data-choice'))); };
    choices.push(choice);
    choiceNumbers.push(document.getElementById('choice-number-' + i));
  }
  hint.onclick = function () {
    if (resultOpen || !displayed) { return; }
    hintOpen = !hintOpen;
    if (hintOpen) { buildCountingHelp(); }
    hint.setAttribute('aria-expanded', hintOpen ? 'true' : 'false');
    setText(hintLabel, state.group === '3' ? (hintOpen ? 'Hide dots' : 'Count with dots') : (hintOpen ? 'Hide help' : 'Help'));
    show(countingHelp, hintOpen);
  };
  newRound.onclick = function () { if (!resultOpen) { resetSameSettings(); } };
  resultNew.onclick = function () { if (resultOpen) { resetSameSettings(); } };
  level.onchange = function () { if (!resultOpen) { startRound(this.value, mode.value); } };
  mode.onchange = function () { if (!resultOpen) { startRound(level.value, this.value); } };
  exit.onclick = flow.exit;
  resultExit.onclick = flow.exit;

  document.addEventListener('keydown', function (event) {
    var key = event.key || event.keyCode;
    if (resultOpen) {
      if (key === 'Tab' || key === 9) {
        event.preventDefault();
        focus(document.activeElement === resultNew ? resultExit : resultNew);
      } else if (key === 'Escape' || key === 27) { event.preventDefault(); }
      return;
    }
    var target = event.target || document.activeElement;
    var tag = target && target.tagName ? String(target.tagName).toLowerCase() : '';
    if (tag === 'select' || tag === 'input' || tag === 'textarea' || target && target.isContentEditable || event.repeat) { return; }
    if (typeof key === 'number' && key >= 49 && key <= 52) { key = String(key - 48); }
    if (typeof key === 'string' && /^[1-4]$/.test(key)) {
      event.preventDefault();
      chooseAnswer(Number(key) - 1);
    }
  }, false);
  document.addEventListener('focusin', function (event) {
    if (resultOpen && event.target !== resultNew && event.target !== resultExit) { focus(resultNew); }
  }, false);
  window.addEventListener('pageshow', function () {
    if (flow.resume()) { startRound('3', 'add'); }
    else if (resultOpen) { flow.schedule(resetSameSettings, 2600); }
    else if (waitingNext) { flow.schedule(nextQuestion, 1000); }
  }, false);
  startRound('3', 'add');
}());
