(function (root) {
  'use strict';
  function paginate(items, columns, rows) {
    if (columns < 1 || rows < 1) return [];
    var pages = [];
    var pending = items.map(function (item, index) {
      return { index:index, columns:Math.min(columns, item.columns || 1), rows:Math.min(rows, item.rows || 1) };
    });

    while (pending.length) {
      var page = [], used = [];
      // Apps can fill slots beside widgets or ahead of a widget that needs the next page.
      pending = pending.filter(function (item) {
        for (var slot = 0; slot < columns * rows; slot++) {
          var y = Math.floor(slot / columns), x = slot % columns;
          var free = x + item.columns <= columns && y + item.rows <= rows;
          for (var dy = 0; free && dy < item.rows; dy++) {
            for (var dx = 0; dx < item.columns; dx++) {
              if (used[(y + dy) * columns + x + dx]) free = false;
            }
          }
          if (!free) continue;
          for (dy = 0; dy < item.rows; dy++) {
            for (dx = 0; dx < item.columns; dx++) used[(y + dy) * columns + x + dx] = true;
          }
          page.push({ index:item.index, column:x + 1, row:y + 1, columns:item.columns, rows:item.rows });
          return false;
        }
        return true;
      });
      pages.push(page);
    }
    return pages;
  }
  if (typeof module === 'object' && module.exports) module.exports = paginate;
  else root.LittleAppsPaginate = paginate;
}(typeof window === 'undefined' ? this : window));
