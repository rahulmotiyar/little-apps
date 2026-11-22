(function (root, factory) {
  "use strict";

  var api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.KindleNoughts = api;
  }
}(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  function reset(state) {
    state.board = [null, null, null, null, null, null, null, null, null];
    state.turn = "X";
    state.winner = null;
    state.draw = false;
    state.winningCells = [];
    state.history = [];
  }

  function createGame() {
    var state = {};
    reset(state);
    return state;
  }

  function updateOutcome(state) {
    var i;
    var line;
    var mark;
    state.winner = null;
    state.draw = false;
    state.winningCells = [];

    for (i = 0; i < lines.length; i += 1) {
      line = lines[i];
      mark = state.board[line[0]];
      if (mark !== null && mark === state.board[line[1]] && mark === state.board[line[2]]) {
        state.winner = mark;
        state.winningCells = line.slice(0);
        return;
      }
    }
    for (i = 0; i < state.board.length; i += 1) {
      if (state.board[i] === null) {
        return;
      }
    }
    state.draw = true;
  }

  function play(state, index) {
    if (typeof index !== "number" || index % 1 !== 0 || index < 0 || index > 8 ||
        state.winner !== null || state.draw || state.board[index] !== null) {
      return false;
    }
    state.board[index] = state.turn;
    state.history.push(index);
    state.turn = state.turn === "X" ? "O" : "X";
    updateOutcome(state);
    return true;
  }

  function undo(state) {
    var index;
    if (state.history.length === 0) {
      return false;
    }
    index = state.history.pop();
    state.turn = state.board[index];
    state.board[index] = null;
    updateOutcome(state);
    return true;
  }

  return {
    createGame: createGame,
    play: play,
    undo: undo,
    reset: reset
  };
}));
