(function () {
  'use strict';

  var engine = window.KindleSudoku;
  var flow = window.LittleGameFlow.create();
  var state;
  var selected = -1;
  var cells = [];
  var numberKeys = [];
  var padColumns = 0;
  var resultOpen = false;
  var exited = false;
  var page = document.getElementById('sudoku-page');
  var puzzle = document.getElementById('puzzle');
  var body = document.getElementById('board-body');
  var shell = document.getElementById('board-shell');
  var tools = document.getElementById('puzzle-tools');
  var keypad = document.getElementById('keypad');
  var difficulty = document.getElementById('difficulty');
  var newButton = document.getElementById('new-puzzle');
  var undoButton = document.getElementById('undo');
  var clearButton = document.getElementById('clear-cell');
  var exitLink = document.getElementById('exit');
  var status = document.getElementById('puzzle-status');
  var rule = document.getElementById('puzzle-rule');
  var overlay = document.getElementById('result-overlay');
  var resultNew = document.getElementById('result-new-puzzle');
  var resultExit = document.getElementById('result-exit');

  function focus(node) { if (node && typeof node.focus === 'function') { node.focus(); } }

  function queueNextPuzzle() {
    flow.schedule(function () {
      if (resultOpen && state.complete && !exited) { newPuzzle(state.level); }
    }, 2600);
  }

  function candidates(index) {
    var result = [];
    for (var value = 1; value <= state.size; value += 1) {
      if (!engine.conflicts(state, index, value)) { result.push(value); }
    }
    return result;
  }

  function nextEmpty() {
    var best = -1;
    var count = state.size + 1;
    for (var i = 0; i < state.board.length; i += 1) {
      if (!state.board[i]) {
        var choices = candidates(i).length;
        if (choices < count) { count = choices; best = i; }
      }
    }
    return best;
  }

  function clearChildren(node) {
    while (node.firstChild) { node.removeChild(node.firstChild); }
  }

  function selectCell(index, moveFocus) {
    if (resultOpen || state.givens[index]) { return; }
    selected = index;
    render();
    if (moveFocus) { focus(cells[index]); }
  }

  function buildBoard() {
    clearChildren(body);
    cells = [];
    for (var row = 0; row < state.size; row += 1) {
      var tr = document.createElement('tr');
      for (var col = 0; col < state.size; col += 1) {
        var index = row * state.size + col;
        var td = document.createElement('td');
        td.style.width = (100 / state.size) + '%';
        td.className = ((col + 1) % state.boxCols === 0 && col < state.size - 1 ? 'box-right ' : '') + ((row + 1) % state.boxRows === 0 && row < state.size - 1 ? 'box-bottom' : '');
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'sudoku-cell';
        button.setAttribute('data-cell', String(index));
        button.onclick = function () { selectCell(Number(this.getAttribute('data-cell')), false); };
        td.appendChild(button);
        tr.appendChild(td);
        cells.push(button);
      }
      body.appendChild(tr);
    }
  }

  function columnsForPad() {
    var view = window.LittleAppsOrientation && window.LittleAppsOrientation.dimensions();
    var width = view ? view.width : window.innerWidth || document.documentElement.clientWidth;
    var height = view ? view.height : window.innerHeight || document.documentElement.clientHeight;
    if (width >= 480 && width > height) { return state.size === 4 ? 2 : 3; }
    return width >= 480 || state.size === 4 ? state.size : 3;
  }

  function buildPad() {
    padColumns = columnsForPad();
    numberKeys = [];
    clearChildren(keypad);
    var row;
    for (var value = 1; value <= state.size; value += 1) {
      if ((value - 1) % padColumns === 0) {
        row = document.createElement('div');
        row.className = 'key-row';
        keypad.appendChild(row);
      }
      var slot = document.createElement('div');
      slot.className = 'key-slot';
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'number-key';
      button.textContent = String(value);
      button.setAttribute('data-number', String(value));
      button.setAttribute('aria-label', 'Place ' + value);
      button.onclick = function () { place(Number(this.getAttribute('data-number'))); };
      slot.appendChild(button);
      row.appendChild(slot);
      numberKeys.push(button);
    }
  }

  function updateResult() {
    if (state.complete) {
      overlay.style.display = 'table';
      overlay.setAttribute('aria-hidden', 'false');
      difficulty.disabled = true;
      newButton.disabled = true;
      undoButton.disabled = true;
      exitLink.setAttribute('tabindex', '-1');
      if (!resultOpen) { resultOpen = true; focus(resultNew); queueNextPuzzle(); }
      page.setAttribute('aria-hidden', 'true');
    } else {
      var wasOpen = resultOpen;
      resultOpen = false;
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
      page.removeAttribute('aria-hidden');
      exitLink.removeAttribute('tabindex');
      difficulty.disabled = false;
      newButton.disabled = false;
      if (wasOpen) { focus(cells[selected]); }
    }
  }

  function render(message) {
    for (var i = 0; i < cells.length; i += 1) {
      var fixed = Boolean(state.givens[i]);
      var value = state.board[i];
      cells[i].textContent = value ? String(value) : '';
      cells[i].className = 'sudoku-cell' + (fixed ? ' given' : '') + (selected === i ? ' selected' : '');
      cells[i].disabled = fixed || state.complete;
      cells[i].setAttribute('aria-pressed', selected === i ? 'true' : 'false');
      cells[i].setAttribute('aria-label', 'Row ' + (Math.floor(i / state.size) + 1) + ', column ' + (i % state.size + 1) + ', ' + (value || 'empty') + (fixed ? ', fixed number' : ''));
      cells[i].setAttribute('tabindex', selected === i ? '0' : '-1');
    }
    for (var number = 0; number < numberKeys.length; number += 1) {
      numberKeys[number].disabled = selected < 0 || state.complete || (state.level === 'easy' && engine.conflicts(state, selected, number + 1));
    }
    clearButton.disabled = selected < 0 || !state.board[selected] || state.complete;
    undoButton.disabled = !state.history.length;
    if (message) {
      status.textContent = message;
    } else if (state.complete) {
      status.textContent = '';
    } else if (state.level === 'easy' && selected >= 0 && !state.board[selected]) {
      var choices = candidates(selected);
      status.textContent = choices.length ? 'Which number fits the dark square?' : 'Try Undo, then another number.';
    } else {
      status.textContent = 'Tap a square, then a number.';
    }
    updateResult();
  }

  function place(value) {
    if (resultOpen || selected < 0) { return; }
    var result = engine.place(state, selected, value);
    if (!result.accepted) { render(result.conflict ? 'Try another number.' : undefined); return; }
    if (state.level === 'easy' && value && !state.complete) { selected = nextEmpty(); }
    render();
  }

  function fitBoard() {
    if (!state) { return; }
    if (padColumns !== columnsForPad()) { buildPad(); render(); }
    var view = window.LittleAppsOrientation && window.LittleAppsOrientation.dimensions();
    var width = view ? view.width : window.innerWidth || document.documentElement.clientWidth;
    var height = view ? view.height : window.innerHeight || document.documentElement.clientHeight;
    var landscape = width >= 480 && width > height;
    var header = document.getElementById('sudoku-header');
    var availableWidth = shell.parentNode.clientWidth;
    var main = document.getElementById('sudoku-main');
    var padding = main && window.getComputedStyle(main);
    var verticalInset = padding ? parseFloat(padding.paddingTop) + parseFloat(padding.paddingBottom) : 48;
    var toolsGap = main ? parseFloat(window.getComputedStyle(tools).marginTop) : 20;
    var below = landscape ? 0 : tools.offsetHeight + toolsGap;
    var availableHeight = height - (header ? header.offsetHeight : 52) - verticalInset - below;
    var size = Math.max(1, Math.floor(Math.min(availableWidth, landscape ? 620 : availableWidth, availableHeight)));
    var cellSize = Math.max(1, Math.floor((size - state.size - 7) / state.size));
    shell.style.width = size + 'px';
    for (var i = 0; i < cells.length; i += 1) {
      cells[i].style.height = cellSize + 'px';
      cells[i].style.fontSize = Math.max(12, Math.floor(cellSize * 0.55)) + 'px';
    }
  }

  function newPuzzle(level) {
    flow.cancel();
    state = engine.createGame(level);
    selected = nextEmpty();
    difficulty.value = state.level;
    rule.textContent = state.size === 4 ? 'Use 1, 2, 3 and 4 once in each row, column and little box.' : 'Use 1–' + state.size + ' once in each row, column and box.';
    buildBoard();
    buildPad();
    render();
    fitBoard();
  }

  function exitGame() {
    flow.cancel();
    exited = true;
    newPuzzle('easy');
  }

  newButton.onclick = function () { if (!resultOpen) { newPuzzle(state.level); } };
  resultNew.onclick = function () { if (resultOpen) { newPuzzle(state.level); } };
  difficulty.onchange = function () { if (!resultOpen) { newPuzzle(this.value); } };
  clearButton.onclick = function () { place(0); };
  undoButton.onclick = function () {
    if (resultOpen) { return; }
    var previous = state.history[state.history.length - 1];
    if (engine.undo(state)) {
      flow.cancel();
      if (previous && typeof previous.index === 'number') { selected = previous.index; }
      render('Last number undone.');
    }
  };
  exitLink.onclick = exitGame;
  resultExit.onclick = exitGame;
  document.addEventListener('keydown', function (event) {
    var key = event.key || event.keyCode;
    if (resultOpen) {
      if (key === 'Tab' || key === 9) {
        event.preventDefault();
        focus(document.activeElement === resultNew ? resultExit : resultNew);
      } else if (key === 'Escape' || key === 27) { event.preventDefault(); }
      return;
    }
    if (event.target === difficulty) { return; }
    if (typeof key === 'number' && key >= 49 && key <= 57) { key = String(key - 48); }
    if (typeof key === 'string' && /^[1-9]$/.test(key) && Number(key) <= state.size) {
      event.preventDefault();
      place(Number(key));
    } else if (key === 'Backspace' || key === 'Delete' || key === 8 || key === 46) {
      event.preventDefault();
      place(0);
    } else if (selected >= 0) {
      var step = key === 'ArrowLeft' || key === 37 ? -1 : key === 'ArrowRight' || key === 39 ? 1 : key === 'ArrowUp' || key === 38 ? -state.size : key === 'ArrowDown' || key === 40 ? state.size : 0;
      if (step) {
        event.preventDefault();
        var next = selected + step;
        while (next >= 0 && next < cells.length && state.givens[next]) { next += step; }
        if (next >= 0 && next < cells.length) { selectCell(next, true); }
      }
    }
  }, false);
  document.addEventListener('focusin', function (event) {
    if (resultOpen && event.target !== resultNew && event.target !== resultExit) { focus(resultNew); }
  }, false);
  window.addEventListener('resize', fitBoard, false);
  window.addEventListener('littleappsorientationchange', fitBoard, false);
  window.addEventListener('pageshow', function () {
    if (exited) { exited = false; newPuzzle('easy'); } else {
      fitBoard();
      if (resultOpen && state.complete) { queueNextPuzzle(); }
    }
  }, false);
  puzzle.style.display = '';
  newPuzzle('easy');
}());
