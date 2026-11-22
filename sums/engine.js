(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  if (root) { root.KindleSums = api; }
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var GROUPS = {
    '3': { label: 'Groep 3', max: 20 },
    '4': { label: 'Groep 4', max: 100 },
    '5': { label: 'Groep 5', max: 1000 }
  };
  var MINUS = '\u2212';

  function integer(value) { return typeof value === 'number' && isFinite(value) && Math.floor(value) === value; }
  function unit(rng) {
    var value;
    try { value = rng(); } catch (error) { return 0; }
    return typeof value === 'number' && isFinite(value) ? Math.max(0, Math.min(0.9999999999999999, value)) : 0;
  }
  function shuffle(list, rng) {
    for (var i = list.length - 1; i > 0; i -= 1) {
      var other = Math.floor(unit(rng) * (i + 1));
      var value = list[i]; list[i] = list[other]; list[other] = value;
    }
    return list;
  }
  function pools(max, rng) {
    var add = [];
    var subtract = [];
    // Sample possible answers, not every pair of operands. Even Groep 5
    // needs fewer than 2,000 numbers rather than half a million equations.
    for (var answer = 0; answer <= max; answer += 1) {
      if (answer >= 2) { add.push(answer); }
      if (answer < max) { subtract.push(answer); }
    }
    return { add: shuffle(add, rng), subtract: shuffle(subtract, rng) };
  }
  function pick(pool, usedAnswers) {
    while (pool.length) {
      var answer = pool.pop();
      if (usedAnswers.indexOf(answer) === -1) { return answer; }
    }
    return null;
  }
  function choices(answer, max, rng) {
    var nearby = [];
    for (var distance = 1; distance <= max && nearby.length < 6; distance += 1) {
      if (answer - distance >= 0) { nearby.push(answer - distance); }
      if (answer + distance <= max) { nearby.push(answer + distance); }
    }
    shuffle(nearby, rng);
    return shuffle([answer, nearby[0], nearby[1], nearby[2]], rng);
  }

  function createRound(group, mode, rng) {
    group = group === '4' || group === '5' ? group : '3';
    mode = mode === 'subtract' || mode === 'mixed' ? mode : 'add';
    rng = typeof rng === 'function' ? rng : Math.random;
    var max = GROUPS[group].max;
    var available = pools(max, rng);
    var first = unit(rng) < 0.5 ? 'add' : 'subtract';
    var usedAnswers = [];
    var questions = [];
    for (var i = 0; i < 5; i += 1) {
      var operation = mode === 'mixed' ? (i % 2 === 0 ? first : (first === 'add' ? 'subtract' : 'add')) : mode;
      var answer = pick(available[operation], usedAnswers);
      var firstOperand = operation === 'add' ? 1 + Math.floor(unit(rng) * (answer - 1)) : answer + 1 + Math.floor(unit(rng) * (max - answer));
      var next = { a: firstOperand, b: operation === 'add' ? answer - firstOperand : firstOperand - answer, operator: operation === 'add' ? '+' : MINUS, answer: answer };
      usedAnswers.push(answer);
      next.choices = choices(next.answer, max, rng);
      questions.push(next);
    }
    return { group: group, mode: mode, index: 0, total: 5, questions: questions, answers: [], complete: false };
  }

  function question(state) {
    return state && !state.complete && integer(state.index) && state.index >= 0 ? state.questions[state.index] || null : null;
  }

  function choose(state, value) {
    var current = question(state);
    var complete = Boolean(state && state.complete);
    if (!current || !integer(value) || current.choices.indexOf(value) === -1) { return { accepted: false, correct: false, complete: complete }; }
    if (value !== current.answer) { return { accepted: true, correct: false, complete: false }; }
    state.answers.push(value);
    state.index += 1;
    state.complete = state.index === state.total;
    return { accepted: true, correct: true, complete: state.complete };
  }

  return { GROUPS: GROUPS, createRound: createRound, question: question, choose: choose };
}));
