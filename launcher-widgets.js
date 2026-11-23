(function () {
  'use strict';
  var together = document.getElementById('together-open');
  if (together) together.href = window.location.protocol + '//' + window.location.hostname + ':8766/';
  var time = document.getElementById('widget-time');
  var clockDate = document.getElementById('clock-date');
  var hourHand = document.getElementById('clock-hour-hand');
  var minuteHand = document.getElementById('clock-minute-hand');
  var month = document.getElementById('calendar-month');
  var days = document.getElementById('calendar-days');
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var now = new Date();
  var viewedYear = now.getFullYear(), viewedMonth = now.getMonth();
  var currentYear = viewedYear, currentMonth = viewedMonth;
  var lastDay = '';
  var tickTimer;

  function two(number) { return number < 10 ? '0' + number : String(number); }
  function squarePoint(minute, radius) {
    var angle = minute * Math.PI / 30;
    var x = Math.sin(angle), y = -Math.cos(angle);
    var scale = radius / Math.max(Math.abs(x), Math.abs(y));
    return [Math.round(10 * (100 + x * scale)) / 10, Math.round(10 * (100 + y * scale)) / 10];
  }
  function renderClockFace() {
    var minuteTicks = [], hourTicks = [];
    var numerals = document.getElementById('clock-numerals');
    for (var minute = 0; minute < 60; minute++) {
      var onHour = minute % 5 === 0;
      var start = squarePoint(minute, 95), end = squarePoint(minute, onHour ? 88 : 92);
      (onHour ? hourTicks : minuteTicks).push('M' + start.join(' ') + 'L' + end.join(' '));
      if (onHour) {
        var position = squarePoint(minute, 76);
        var numeral = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numeral.setAttribute('x', position[0]);
        numeral.setAttribute('y', position[1] + 5.5);
        numeral.textContent = String(minute / 5 || 12);
        numerals.appendChild(numeral);
      }
    }
    document.getElementById('clock-minute-ticks').setAttribute('d', minuteTicks.join(''));
    document.getElementById('clock-hour-ticks').setAttribute('d', hourTicks.join(''));
  }
  function renderClockTime(today) {
    var hour = today.getHours(), minute = today.getMinutes();
    hourHand.setAttribute('transform', 'rotate(' + ((hour % 12) * 30 + minute / 2) + ' 100 100)');
    minuteHand.setAttribute('transform', 'rotate(' + minute * 6 + ' 100 100)');
    clockDate.textContent = two(today.getDate());
    time.textContent = two(hour) + ':' + two(minute) + ', ' + weekdays[today.getDay()] + ', ' + today.getDate() + ' ' + months[today.getMonth()];
    time.setAttribute('datetime', today.toISOString());
  }
  function renderCalendar(today) {
    month.textContent = months[viewedMonth] + ' ' + viewedYear;
    days.textContent = '';
    var offset = (new Date(viewedYear, viewedMonth, 1).getDay() + 6) % 7;
    var count = new Date(viewedYear, viewedMonth + 1, 0).getDate();
    for (var index = 0; index < 42; index++) {
      var cell = document.createElement('span');
      var number = index - offset + 1;
      if (number > 0 && number <= count) {
        cell.textContent = String(number);
        if (viewedYear === today.getFullYear() && viewedMonth === today.getMonth() && number === today.getDate()) {
          cell.className = 'today';
          cell.setAttribute('aria-label', 'Today, ' + months[viewedMonth] + ' ' + number);
        }
      }
      days.appendChild(cell);
    }
  }
  function update() {
    window.clearTimeout(tickTimer);
    var today = new Date();
    renderClockTime(today);
    var dayKey = today.getFullYear() + '-' + today.getMonth() + '-' + today.getDate();
    if (dayKey !== lastDay) {
      if (viewedYear === currentYear && viewedMonth === currentMonth) {
        viewedYear = today.getFullYear();
        viewedMonth = today.getMonth();
      }
      currentYear = today.getFullYear();
      currentMonth = today.getMonth();
      lastDay = dayKey;
      renderCalendar(today);
    }
    tickTimer = window.setTimeout(update, 60000 - today.getTime() % 60000);
  }
  function changeMonth(delta) {
    var next = new Date(viewedYear, viewedMonth + delta, 1);
    viewedYear = next.getFullYear();
    viewedMonth = next.getMonth();
    renderCalendar(new Date());
  }
  document.getElementById('calendar-previous').onclick = function () { changeMonth(-1); };
  document.getElementById('calendar-next').onclick = function () { changeMonth(1); };
  renderClockFace();
  update();
  window.addEventListener('pageshow', update);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) update(); });
}());
