(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  if (root) { root.KindleMatch = api; }
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var MINUS = '\u2212';
  var TIMES = '\u00d7';

  function integer(value) {
    return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
  }

  function unit(rng) {
    var value;
    try { value = rng(); } catch (error) { return 0; }
    return typeof value === 'number' && isFinite(value) ? Math.max(0, Math.min(0.9999999999999999, value)) : 0;
  }

  function shuffle(list, rng) {
    for (var i = list.length - 1; i > 0; i -= 1) {
      var other = Math.floor(unit(rng) * (i + 1));
      var item = list[i]; list[i] = list[other]; list[other] = item;
    }
    return list;
  }

  function textCard(value, text, label) {
    return { kind: 'text', value: value, text: text, label: label || text };
  }

  function numberPairs(group, rng) {
    var values = [];
    var max = group === '3' ? 20 : (group === '4' ? 99 : 999);
    var min = group === '3' ? 1 : (group === '4' ? 11 : 101);
    for (var value = min; value <= max; value += 1) {
      // Leave at least two place-value terms to put together.
      if (group === '4' && value % 10 === 0) { continue; }
      if (group === '5' && value % 100 === 0) { continue; }
      values.push(value);
    }
    shuffle(values, rng);
    var pairs = [];
    for (var i = 0; i < 4; i += 1) {
      var number = values[i];
      var left;
      if (group === '3') {
        left = { kind: 'dots', value: number, label: number + ' stippen' };
      } else {
        var terms = [];
        var hundreds = Math.floor(number / 100) * 100;
        var tens = Math.floor((number % 100) / 10) * 10;
        var ones = number % 10;
        if (hundreds) { terms.push(hundreds); }
        if (tens) { terms.push(tens); }
        if (ones) { terms.push(ones); }
        left = textCard(number, terms.join(' + '));
      }
      pairs.push({ left: left, right: textCard(number, String(number)) });
    }
    return pairs;
  }

  function arithmeticPools(group, rng) {
    var max = group === '3' ? 20 : 100;
    var pools = { add: [], subtract: [], multiply: [], divide: [] };
    var answer;
    var a;
    var b;
    // One candidate per answer keeps the pool small and avoids bias toward
    // answers that happen to have many possible equations.
    if (group !== '5') {
      for (answer = 2; answer <= max; answer += 1) {
        a = 1 + Math.floor(unit(rng) * (answer - 1));
        pools.add.push({ a: a, b: answer - a, operator: '+', answer: answer });
      }
      for (answer = 0; answer < max; answer += 1) {
        b = 1 + Math.floor(unit(rng) * (max - answer));
        pools.subtract.push({ a: answer + b, b: b, operator: MINUS, answer: answer });
      }
    }
    if (group !== '3') {
      var tables = group === '4' ? [1, 2, 3, 4, 5, 10] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      for (var i = 0; i < tables.length; i += 1) {
        for (b = 1; b <= 10; b += 1) {
          a = tables[i];
          pools.multiply.push({ a: a, b: b, operator: TIMES, answer: a * b });
          if (group === '5') {
            pools.divide.push({ a: a * b, b: b, operator: ':', answer: a });
          }
        }
      }
    }
    return pools;
  }

  function sumPairs(group, rng) {
    var pools = arithmeticPools(group, rng);
    var operations = group === '3' ? ['add', 'subtract'] : (group === '4' ? ['add', 'subtract', 'multiply'] : ['multiply', 'divide']);
    shuffle(operations, rng);
    for (var name in pools) {
      if (Object.prototype.hasOwnProperty.call(pools, name)) { shuffle(pools[name], rng); }
    }
    var used = [];
    var pairs = [];
    for (var i = 0; i < 4; i += 1) {
      var pool = pools[operations[i % operations.length]];
      // Every pool has more than four possible answers, so this bounded scan
      // always finds an unused answer without random retries.
      for (var j = 0; j < pool.length; j += 1) {
        var equation = pool[j];
        if (used.indexOf(equation.answer) !== -1) { continue; }
        used.push(equation.answer);
        var text = equation.a + ' ' + equation.operator + ' ' + equation.b;
        pairs.push({ left: textCard(equation.answer, text), right: textCard(equation.answer, String(equation.answer)) });
        break;
      }
    }
    return pairs;
  }

  function timePairs(group, rng) {
    var step = group === '3' ? 60 : (group === '4' ? 15 : 5);
    var times = [];
    for (var hour = 1; hour <= 12; hour += 1) {
      for (var minute = 0; minute < 60; minute += step) {
        times.push({ hour: hour, minute: minute });
      }
    }
    shuffle(times, rng);
    var pairs = [];
    for (var i = 0; i < 4; i += 1) {
      var time = times[i];
      var text = time.hour + ':' + (time.minute < 10 ? '0' : '') + time.minute;
      var value = time.hour * 60 + time.minute;
      pairs.push({
        left: { kind: 'clock', value: value, hour: time.hour, minute: time.minute, label: text },
        right: textCard(value, text)
      });
    }
    return pairs;
  }

  function avoidMatchingRows(left, right, index) {
    if (index === right.length) { return true; }
    // At most 4! arrangements; retain the shuffled order wherever possible.
    for (var i = index; i < right.length; i += 1) {
      var item = right[index]; right[index] = right[i]; right[i] = item;
      if (right[index].id !== left[index].id && avoidMatchingRows(left, right, index + 1)) { return true; }
      item = right[index]; right[index] = right[i]; right[i] = item;
    }
    return false;
  }

  function createRound(group, topic, rng) {
    group = group === '4' || group === '5' ? group : '3';
    topic = topic === 'sums' || topic === 'time' ? topic : 'numbers';
    rng = typeof rng === 'function' ? rng : Math.random;
    var pairs = topic === 'sums' ? sumPairs(group, rng) : (topic === 'time' ? timePairs(group, rng) : numberPairs(group, rng));
    var left = [];
    var right = [];
    for (var i = 0; i < pairs.length; i += 1) {
      pairs[i].left.id = 'pair-' + i;
      pairs[i].right.id = 'pair-' + i;
      left.push(pairs[i].left); right.push(pairs[i].right);
    }
    shuffle(left, rng); shuffle(right, rng);
    avoidMatchingRows(left, right, 0);
    return { group: group, topic: topic, left: left, right: right, selected: null, matched: {}, count: 0, total: 4, complete: false };
  }

  function choose(state, side, index) {
    var complete = Boolean(state && state.complete);
    var result = { accepted: false, matched: false, mismatch: false, complete: complete };
    if (!state || complete || (side !== 'left' && side !== 'right') || !integer(index) || index < 0 || index >= state[side].length) { return result; }
    var card = state[side][index];
    if (state.matched[card.id]) { return result; }
    result.accepted = true;
    var selected = state.selected;
    if (!selected || selected.side === side) {
      state.selected = selected && selected.side === side && selected.index === index ? null : { side: side, index: index };
      return result;
    }
    if (state[selected.side][selected.index].id === card.id) {
      state.matched[card.id] = true;
      state.count += 1;
      state.complete = state.count === state.total;
      result.matched = true;
      result.complete = state.complete;
    } else {
      result.mismatch = true;
    }
    state.selected = null;
    return result;
  }

  return { createRound: createRound, choose: choose };
}));
