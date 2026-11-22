(function () {
  'use strict';
  var together = document.getElementById('together-open');
  if (together) together.href = window.location.protocol + '//' + window.location.hostname + ':8766/';
  var time = document.getElementById('widget-time');
  var date = document.getElementById('widget-date');
  var month = document.getElementById('calendar-month');
  var days = document.getElementById('calendar-days');
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var now = new Date();
  var viewedYear = now.getFullYear(), viewedMonth = now.getMonth();
  var currentYear = viewedYear, currentMonth = viewedMonth;
  var lastDay = '';

  function two(number) { return number < 10 ? '0' + number : String(number); }
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
    var today = new Date();
    time.textContent = two(today.getHours()) + ':' + two(today.getMinutes());
    time.setAttribute('datetime', today.toISOString());
    date.textContent = weekdays[today.getDay()] + ', ' + today.getDate() + ' ' + months[today.getMonth()];
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
  }
  function changeMonth(delta) {
    var next = new Date(viewedYear, viewedMonth + delta, 1);
    viewedYear = next.getFullYear();
    viewedMonth = next.getMonth();
    renderCalendar(new Date());
  }
  document.getElementById('calendar-previous').onclick = function () { changeMonth(-1); };
  document.getElementById('calendar-next').onclick = function () { changeMonth(1); };
  update();
  window.setInterval(update, 30000);
}());
