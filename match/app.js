(function () {
  'use strict';

  var engine = window.KindleMatch;
  var flow = window.LittleGameFlow.create();
  var state;
  var resultOpen = false;
  var page = document.getElementById('match-page');
  var group = document.getElementById('group');
  var topic = document.getElementById('topic');
  var newRound = document.getElementById('new-round');
  var exit = document.getElementById('exit');
  var progress = document.getElementById('progress-copy');
  var starsContainer = document.getElementById('stars');
  var instruction = document.getElementById('instruction');
  var leftCards = document.getElementById('left-cards');
  var rightCards = document.getElementById('right-cards');
  var feedback = document.getElementById('feedback');
  var overlay = document.getElementById('result-overlay');
  var resultTitle = document.getElementById('result-title');
  var resultCopy = document.getElementById('result-copy');
  var resultNew = document.getElementById('result-new-round');
  var resultExit = document.getElementById('result-exit');
  var buttons = { left: [], right: [] };
  var stars = [];
  var svgNS = 'http://www.w3.org/2000/svg';

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

  function svgElement(name, attributes) {
    var element = document.createElementNS(svgNS, name);
    for (var key in attributes) {
      if (Object.prototype.hasOwnProperty.call(attributes, key)) { element.setAttribute(key, String(attributes[key])); }
    }
    return element;
  }

  function point(degrees, distance) {
    var angle = degrees * Math.PI / 180;
    return { x: 60 + Math.sin(angle) * distance, y: 60 - Math.cos(angle) * distance };
  }

  function clock(card) {
    var face = svgElement('svg', { viewBox: '0 0 120 120', width: 120, height: 120, 'class': 'card-clock clock-face', 'aria-hidden': 'true', focusable: 'false' });
    face.appendChild(svgElement('circle', { cx: 60, cy: 60, r: 56, fill: 'none', stroke: 'currentColor', 'stroke-width': 3 }));
    for (var i = 1; i <= 12; i += 1) {
      var outer = point(i * 30, 53);
      var inner = point(i * 30, 49);
      face.appendChild(svgElement('line', { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y, stroke: 'currentColor', 'stroke-width': 2 }));
      var position = point(i * 30, 40);
      var number = svgElement('text', { x: position.x, y: position.y + 4, 'text-anchor': 'middle', 'font-family': 'Arial, sans-serif', 'font-size': 11, 'font-weight': 'bold', fill: 'currentColor' });
      text(number, i);
      face.appendChild(number);
    }
    var minute = Number(card.minute) || 0;
    var hourEnd = point(((Number(card.hour) % 12) + minute / 60) * 30, 22);
    var minuteEnd = point(minute * 6, 30);
    face.appendChild(svgElement('line', { x1: 60, y1: 60, x2: hourEnd.x, y2: hourEnd.y, stroke: 'currentColor', 'stroke-width': 4, 'stroke-linecap': 'round', 'data-hand': 'hour' }));
    face.appendChild(svgElement('line', { x1: 60, y1: 60, x2: minuteEnd.x, y2: minuteEnd.y, stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', 'data-hand': 'minute' }));
    face.appendChild(svgElement('circle', { cx: 60, cy: 60, r: 3, fill: 'currentColor' }));
    return face;
  }

  function dots(card) {
    var content = document.createElement('span');
    content.className = 'card-dots';
    content.setAttribute('aria-hidden', 'true');
    var count = Math.max(0, Math.min(20, Math.floor(Number(card.value) || 0)));
    if (!count) { text(content, '0'); }
    for (var start = 0; start < count; start += 5) {
      var five = document.createElement('span');
      five.className = 'dot-five';
      for (var i = start; i < Math.min(start + 5, count); i += 1) {
        var dot = document.createElement('span');
        dot.className = 'count-dot';
        five.appendChild(dot);
      }
      content.appendChild(five);
    }
    return content;
  }

  function cardButton(card, side, index) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'card-button';
    button.setAttribute('class', 'card-button');
    button.setAttribute('data-side', side);
    button.setAttribute('data-index', String(index));
    button.setAttribute('aria-label', card.label || card.text || String(card.value));
    button.setAttribute('aria-pressed', 'false');
    var content = document.createElement('span');
    content.className = 'card-content';
    if (card.kind === 'clock') {
      content.className += ' card-clock-content';
      content.appendChild(clock(card));
    }
    else if (card.kind === 'dots') { content.appendChild(dots(card)); }
    else {
      var label = document.createElement('span');
      label.className = 'card-text';
      text(label, card.text === undefined ? card.value : card.text);
      content.appendChild(label);
    }
    button.appendChild(content);
    var tick = document.createElement('span');
    tick.className = 'match-tick';
    tick.setAttribute('aria-hidden', 'true');
    text(tick, '✓');
    button.appendChild(tick);
    button.onclick = function () { choose(this.getAttribute('data-side'), Number(this.getAttribute('data-index'))); };
    return button;
  }

  function updateBoard() {
    var sides = ['left', 'right'];
    for (var s = 0; s < sides.length; s += 1) {
      var side = sides[s];
      for (var i = 0; i < buttons[side].length; i += 1) {
        var button = buttons[side][i];
        var matched = !!state.matched[state[side][i].id];
        var selected = !!state.selected && state.selected.side === side && state.selected.index === i;
        button.disabled = matched || resultOpen;
        flag(button, 'matched', matched);
        flag(button, 'chosen', selected);
        button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      }
    }
    for (var j = 0; j < stars.length; j += 1) { flag(stars[j], 'earned', j < state.count); }
    starsContainer.setAttribute('aria-label', state.count + ' of ' + state.total + ' stars earned');
    text(progress, state.count + ' of ' + state.total + ' pairs');
  }

  function hideResult() {
    resultOpen = false;
    show(overlay, false);
    overlay.setAttribute('aria-hidden', 'true');
    page.removeAttribute('aria-hidden');
    exit.removeAttribute('tabindex');
    group.disabled = false;
    topic.disabled = false;
    newRound.disabled = false;
  }

  function openResult() {
    resultOpen = true;
    text(resultTitle, 'All matched!');
    text(resultCopy, 'Four pairs. Four stars. Hooray!');
    show(overlay, true, 'table');
    overlay.setAttribute('aria-hidden', 'false');
    group.disabled = true;
    topic.disabled = true;
    newRound.disabled = true;
    exit.setAttribute('tabindex', '-1');
    focus(resultNew);
    page.setAttribute('aria-hidden', 'true');
    scheduleResult();
  }

  function scheduleResult() {
    flow.schedule(function () {
      startRound(state.group, state.topic);
      focus(buttons.left[0]);
    }, 2600);
  }

  function startRound(nextGroup, nextTopic) {
    flow.cancel();
    hideResult();
    state = engine.createRound(nextGroup, nextTopic);
    group.value = String(state.group);
    topic.value = state.topic;
    text(instruction, state.topic === 'time' ? 'Match each clock to its time.' : state.topic === 'sums' ? 'Match each sum to its answer.' : 'Match the cards with the same number.');
    text(feedback, '');
    var sides = ['left', 'right'];
    var containers = { left: leftCards, right: rightCards };
    for (var s = 0; s < sides.length; s += 1) {
      var side = sides[s];
      clear(containers[side]);
      buttons[side] = [];
      for (var i = 0; i < state[side].length; i += 1) {
        var button = cardButton(state[side][i], side, i);
        buttons[side].push(button);
        containers[side].appendChild(button);
      }
    }
    updateBoard();
  }

  function choose(side, index) {
    if (resultOpen || !buttons[side] || !buttons[side][index] || buttons[side][index].disabled) { return; }
    var result = engine.choose(state, side, index);
    if (!result.accepted) { return; }
    updateBoard();
    if (result.mismatch) { text(feedback, 'Not quite. Try another pair.'); }
    else { text(feedback, ''); }
    if (result.complete) { openResult(); }
  }

  for (var i = 0; i < 4; i += 1) { stars.push(document.getElementById('star-' + i)); }
  group.onchange = function () { if (!resultOpen) { startRound(this.value, topic.value); } };
  topic.onchange = function () { if (!resultOpen) { startRound(group.value, this.value); } };
  newRound.onclick = function () { if (!resultOpen) { startRound(state.group, state.topic); } };
  resultNew.onclick = function () { if (resultOpen) { startRound(state.group, state.topic); focus(buttons.left[0]); } };
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
    if (flow.resume()) { startRound('3', 'numbers'); }
    else if (resultOpen) { scheduleResult(); }
  }, false);
  startRound('3', 'numbers');
}());
