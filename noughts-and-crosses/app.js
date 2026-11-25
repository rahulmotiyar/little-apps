(function () {
  'use strict';

  var engine = window.KindleNoughts;
  var flow = window.LittleGameFlow.create();
  var state = engine.createGame();
  var storageKey = 'little-apps.noughts.v1';
  var names = ['Top left', 'Top middle', 'Top right', 'Middle left', 'Centre', 'Middle right', 'Bottom left', 'Bottom middle', 'Bottom right'];
  var cells = document.querySelectorAll('[data-cell]');
  var status = document.getElementById('turn-status');
  var hint = document.getElementById('turn-hint');
  var undoButton = document.getElementById('undo');
  var shell = document.getElementById('board-shell');
  var game = document.getElementById('game');
  var page = document.getElementById('game-page');
  var newRoundButton = document.getElementById('new-round');
  var exitLink = document.getElementById('game-exit');
  var resultOverlay = document.getElementById('result-overlay');
  var resultTitle = document.getElementById('result-title');
  var resultCopy = document.getElementById('result-copy');
  var resultNewRound = document.getElementById('result-new-round');
  var resultExit = document.getElementById('result-exit');
  var resultOpen = false;
  var focusBeforeResult = null;
  var previousWidth = 0;
  var previousHeight = 0;
  var previousTop = -1;
  var previousAvailable = 0;

  function storageUnavailable() {
    document.getElementById('storage-note').style.display = 'block';
    fitBoard();
  }

  function restore() {
    try {
      var raw = window.localStorage.getItem(storageKey);
      if (!raw) { return; }
      var saved = JSON.parse(raw);
      if (!saved || Object.prototype.toString.call(saved.moves) !== '[object Array]' || saved.moves.length > 9) { return; }
      var restored = engine.createGame();
      for (var i = 0; i < saved.moves.length; i += 1) {
        if (!engine.play(restored, saved.moves[i])) { return; }
      }
      state = restored;
    } catch (error) {
      if (!(error instanceof SyntaxError)) { storageUnavailable(); }
    }
  }

  function save() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ moves: state.history }));
    } catch (error) {
      storageUnavailable();
    }
  }

  function setText(node, value) {
    if (node.textContent !== value) { node.textContent = value; }
  }

  function focus(node) {
    if (node && typeof node.focus === 'function') { node.focus(); }
  }

  function queueNextRound() {
    flow.schedule(function () {
      if (resultOpen && (state.winner || state.draw)) { startNewRound(); }
    }, 2600);
  }

  function updateResult(complete) {
    if (complete) {
      setText(resultTitle, state.winner ? state.winner + ' wins!' : 'A draw!');
      setText(resultCopy, state.winner ? 'Three in a row. Hooray!' : 'A new round starts shortly.');
      newRoundButton.disabled = true;
      undoButton.disabled = true;
      exitLink.setAttribute('tabindex', '-1');
      resultOverlay.setAttribute('aria-hidden', 'false');
      resultOverlay.style.display = 'table';
      if (!resultOpen) {
        focusBeforeResult = document.activeElement;
        resultOpen = true;
        focus(resultNewRound);
        queueNextRound();
      }
      if (document.activeElement !== resultNewRound && document.activeElement !== resultExit) { focus(resultNewRound); }
      page.setAttribute('aria-hidden', 'true');
    } else {
      resultOverlay.style.display = 'none';
      resultOverlay.setAttribute('aria-hidden', 'true');
      page.removeAttribute('aria-hidden');
      exitLink.removeAttribute('tabindex');
      newRoundButton.disabled = false;
      if (resultOpen) {
        resultOpen = false;
        focus(focusBeforeResult && !focusBeforeResult.disabled ? focusBeforeResult : newRoundButton);
        focusBeforeResult = null;
      }
    }
  }

  function render() {
    var complete = Boolean(state.winner || state.draw);
    for (var i = 0; i < cells.length; i += 1) {
      var mark = state.board[i] || '';
      var winning = state.winningCells.indexOf(i) !== -1;
      setText(cells[i], mark);
      cells[i].className = winning ? 'cell winning' : 'cell';
      cells[i].disabled = Boolean(mark || complete);
      cells[i].setAttribute('aria-label', names[i] + ', ' + (mark || 'empty'));
    }
    if (complete) {
      setText(status, 'Round complete');
      setText(hint, 'A new round starts shortly.');
    } else {
      setText(status, state.history.length ? state.turn + "\u2019s turn" : 'X goes first');
      setText(hint, 'Tap any empty square.');
    }
    undoButton.disabled = state.history.length === 0;
    updateResult(complete);
    fitBoard();
  }

  function fitBoard() {
    var view = window.LittleAppsOrientation && window.LittleAppsOrientation.dimensions();
    var width = view ? view.width : window.innerWidth || document.documentElement.clientWidth;
    var height = view ? view.height : window.innerHeight || document.documentElement.clientHeight;
    var column = shell.parentNode;
    var available = column.clientWidth;
    var top = window.LittleAppsOrientation ? window.LittleAppsOrientation.rect(shell).top : shell.getBoundingClientRect().top;
    if (width === previousWidth && height === previousHeight && top === previousTop && available === previousAvailable) { return; }
    previousWidth = width;
    previousHeight = height;
    previousTop = top;
    previousAvailable = available;
    shell.style.width = '100%';
    var cellHeight = Math.max(1, Math.floor((height - top - 16 - 6) / 3));
    var markSize = Math.floor(Math.min(cellHeight, (available - 6) / 3) * 0.65);
    for (var i = 0; i < cells.length; i += 1) {
      cells[i].style.height = cellHeight + 'px';
      cells[i].style.fontSize = Math.max(30, markSize) + 'px';
    }
  }

  for (var i = 0; i < cells.length; i += 1) {
    cells[i].onclick = function () {
      if (resultOpen) { return; }
      var index = Number(this.getAttribute('data-cell'));
      if (engine.play(state, index)) { render(); save(); }
    };
  }
  undoButton.onclick = function () {
    if (resultOpen) { return; }
    if (engine.undo(state)) { flow.cancel(); render(); save(); }
  };
  function startNewRound() {
    flow.cancel();
    engine.reset(state);
    render();
    save();
  }
  newRoundButton.onclick = function () {
    if (!resultOpen) { startNewRound(); }
  };
  resultNewRound.onclick = function () {
    if (resultOpen) { startNewRound(); }
  };
  function exitGame() {
    flow.cancel();
    engine.reset(state);
    render();
    save();
  }
  exitLink.onclick = exitGame;
  resultExit.onclick = exitGame;
  document.addEventListener('keydown', function (event) {
    if (!resultOpen) { return; }
    var key = event.key || event.keyCode;
    if (key === 'Tab' || key === 9) {
      event.preventDefault();
      if (event.shiftKey) {
        focus(document.activeElement === resultNewRound ? resultExit : resultNewRound);
      } else {
        focus(document.activeElement === resultExit ? resultNewRound : resultExit);
      }
    } else if (key === 'Escape' || key === 27) {
      event.preventDefault();
    }
  }, false);
  document.addEventListener('focusin', function (event) {
    if (resultOpen && event.target !== resultNewRound && event.target !== resultExit) {
      focus(resultNewRound);
    }
  }, false);
  window.addEventListener('resize', fitBoard, false);
  window.addEventListener('littleappsorientationchange', fitBoard, false);
  window.addEventListener('pageshow', function () {
    flow.cancel();
    restore();
    render();
    fitBoard();
    if (resultOpen) { queueNextRound(); }
  }, false);
  restore();
  game.style.display = '';
  render();
  fitBoard();
}());
