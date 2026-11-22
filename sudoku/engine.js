(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  if (root) { root.KindleSudoku = api; }
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var levels = {
    easy: { size: 4, boxRows: 2, boxCols: 2, clues: 10 },
    medium: { size: 6, boxRows: 2, boxCols: 3, clues: 20 },
    hard: { size: 9, boxRows: 3, boxCols: 3, clues: 34 }
  };

  function integer(value) { return typeof value === 'number' && isFinite(value) && Math.floor(value) === value; }
  function boxIndex(row, col, size, boxRows, boxCols) {
    return Math.floor(row / boxRows) * (size / boxCols) + Math.floor(col / boxCols);
  }

  function prepare(puzzle, size, boxRows, boxCols) {
    if (!integer(size) || size < 1 || size > 9 || !integer(boxRows) || !integer(boxCols) || boxRows < 1 || boxCols < 1 || boxRows * boxCols !== size || !puzzle || puzzle.length !== size * size) { return null; }
    var rows = [];
    var cols = [];
    var boxes = [];
    var board = [];
    var i;
    for (i = 0; i < size; i += 1) { rows.push(0); cols.push(0); boxes.push(0); }
    for (i = 0; i < puzzle.length; i += 1) {
      var value = puzzle[i];
      if (!integer(value) || value < 0 || value > size) { return null; }
      board.push(value);
      if (!value) { continue; }
      var row = Math.floor(i / size);
      var col = i % size;
      var box = boxIndex(row, col, size, boxRows, boxCols);
      var bit = 1 << (value - 1);
      if ((rows[row] & bit) || (cols[col] & bit) || (boxes[box] & bit)) { return null; }
      rows[row] |= bit;
      cols[col] |= bit;
      boxes[box] |= bit;
    }
    return { board: board, rows: rows, cols: cols, boxes: boxes };
  }

  function search(puzzle, size, boxRows, boxCols, limit) {
    var work = prepare(puzzle, size, boxRows, boxCols);
    if (!work) { return { count: 0, solution: null }; }
    var count = 0;
    var solution = null;
    var all = (1 << size) - 1;
    function visit() {
      if (count >= limit) { return; }
      var chosen = -1;
      var chosenMask = 0;
      var fewest = size + 1;
      var i;
      for (i = 0; i < work.board.length; i += 1) {
        if (work.board[i]) { continue; }
        var row = Math.floor(i / size);
        var col = i % size;
        var box = boxIndex(row, col, size, boxRows, boxCols);
        var mask = all & ~(work.rows[row] | work.cols[col] | work.boxes[box]);
        var options = 0;
        var remaining = mask;
        while (remaining) { remaining &= remaining - 1; options += 1; }
        if (!options) { return; }
        if (options < fewest) {
          chosen = i;
          chosenMask = mask;
          fewest = options;
          if (options === 1) { break; }
        }
      }
      if (chosen === -1) {
        count += 1;
        if (!solution) { solution = work.board.slice(0); }
        return;
      }
      var chosenRow = Math.floor(chosen / size);
      var chosenCol = chosen % size;
      var chosenBox = boxIndex(chosenRow, chosenCol, size, boxRows, boxCols);
      for (i = 1; i <= size && count < limit; i += 1) {
        var bit = 1 << (i - 1);
        if (!(chosenMask & bit)) { continue; }
        work.board[chosen] = i;
        work.rows[chosenRow] |= bit;
        work.cols[chosenCol] |= bit;
        work.boxes[chosenBox] |= bit;
        visit();
        work.board[chosen] = 0;
        work.rows[chosenRow] &= ~bit;
        work.cols[chosenCol] &= ~bit;
        work.boxes[chosenBox] &= ~bit;
      }
    }
    visit();
    return { count: count, solution: solution };
  }

  function countSolutions(puzzle, size, boxRows, boxCols, limit) {
    return search(puzzle, size, boxRows, boxCols, integer(limit) && limit > 0 && limit <= 10 ? limit : 2).count;
  }

  function solve(puzzle, size, boxRows, boxCols) { return search(puzzle, size, boxRows, boxCols, 1).solution; }

  function shuffled(list) {
    var result = list.slice(0);
    for (var i = result.length - 1; i > 0; i -= 1) {
      var other = Math.floor(Math.random() * (i + 1));
      var value = result[i];
      result[i] = result[other];
      result[other] = value;
    }
    return result;
  }

  function sequence(length) {
    var result = [];
    for (var i = 0; i < length; i += 1) { result.push(i); }
    return result;
  }

  function groupedOrder(size, groupSize) {
    var groups = shuffled(sequence(size / groupSize));
    var result = [];
    for (var i = 0; i < groups.length; i += 1) {
      var inside = shuffled(sequence(groupSize));
      for (var j = 0; j < inside.length; j += 1) { result.push(groups[i] * groupSize + inside[j]); }
    }
    return result;
  }

  function makePuzzle(config) {
    var size = config.size;
    var rows = groupedOrder(size, config.boxRows);
    var cols = groupedOrder(size, config.boxCols);
    var digits = shuffled(sequence(size));
    var board = [];
    for (var row = 0; row < size; row += 1) {
      for (var col = 0; col < size; col += 1) {
        board.push(digits[(rows[row] * config.boxCols + Math.floor(rows[row] / config.boxRows) + cols[col]) % size] + 1);
      }
    }
    var order = shuffled(sequence(size * size));
    var clues = size * size;
    for (var i = 0; i < order.length && clues > config.clues; i += 1) {
      var index = order[i];
      var saved = board[index];
      board[index] = 0;
      if (countSolutions(board, size, config.boxRows, config.boxCols, 2) === 1) { clues -= 1; }
      else { board[index] = saved; }
    }
    return board;
  }

  function createGame(level) {
    level = Object.prototype.hasOwnProperty.call(levels, level) ? level : 'easy';
    var config = levels[level];
    var givens = makePuzzle(config);
    return { level: level, size: config.size, boxRows: config.boxRows, boxCols: config.boxCols, givens: givens, board: givens.slice(0), history: [], complete: false };
  }

  function conflicts(state, index, value) {
    if (!integer(index) || index < 0 || index >= state.board.length || !integer(value) || value < 0 || value > state.size) { return true; }
    if (!value) { return false; }
    var row = Math.floor(index / state.size);
    var col = index % state.size;
    var boxRow = Math.floor(row / state.boxRows) * state.boxRows;
    var boxCol = Math.floor(col / state.boxCols) * state.boxCols;
    for (var i = 0; i < state.board.length; i += 1) {
      if (i === index || state.board[i] !== value) { continue; }
      var otherRow = Math.floor(i / state.size);
      var otherCol = i % state.size;
      if (otherRow === row || otherCol === col || (otherRow >= boxRow && otherRow < boxRow + state.boxRows && otherCol >= boxCol && otherCol < boxCol + state.boxCols)) { return true; }
    }
    return false;
  }

  function isComplete(state) {
    for (var i = 0; i < state.board.length; i += 1) { if (!state.board[i]) { return false; } }
    return Boolean(prepare(state.board, state.size, state.boxRows, state.boxCols));
  }

  function place(state, index, value) {
    var result = { accepted: false, conflict: false, complete: state.complete };
    if (!integer(index) || index < 0 || index >= state.board.length || !integer(value) || value < 0 || value > state.size || state.givens[index] || state.complete || state.board[index] === value) { return result; }
    if (conflicts(state, index, value)) { result.conflict = true; return result; }
    state.history.push({ index: index, previous: state.board[index], value: value });
    state.board[index] = value;
    state.complete = isComplete(state);
    return { accepted: true, conflict: false, complete: state.complete };
  }

  function undo(state) {
    if (!state.history.length) { return false; }
    var move = state.history.pop();
    state.board[move.index] = move.previous;
    state.complete = isComplete(state);
    return true;
  }

  return { createGame: createGame, place: place, undo: undo, conflicts: conflicts, isComplete: isComplete, countSolutions: countSolutions, solve: solve };
}));
