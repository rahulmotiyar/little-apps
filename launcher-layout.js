(function (root) {
  'use strict';
  // Pack in reading order. A widget occupies two columns and two rows.
  function paginate(items, columns, rows) {
    var pages = [], page = [], used = [], cursor = 0;
    function place(item, index) {
      var w = Math.min(columns, item.columns || 1), h = Math.min(rows, item.rows || 1);
      for (var slot = cursor; slot < columns * rows; slot++) {
        var y = Math.floor(slot / columns), x = slot % columns, free = x + w <= columns && y + h <= rows;
        for (var dy = 0; free && dy < h; dy++) for (var dx = 0; dx < w; dx++) if (used[(y + dy) * columns + x + dx]) free = false;
        if (!free) continue;
        for (dy = 0; dy < h; dy++) for (dx = 0; dx < w; dx++) used[(y + dy) * columns + x + dx] = true;
        page.push({ index:index, column:x + 1, row:y + 1, columns:w, rows:h });
        cursor = slot + w;
        return true;
      }
      return false;
    }
    items.forEach(function (item, index) {
      if (!place(item, index)) {
        pages.push(page); page = []; used = []; cursor = 0; place(item, index);
      }
    });
    if (page.length) pages.push(page);
    return pages;
  }
  if (typeof module === 'object' && module.exports) module.exports = paginate;
  else root.LittleAppsPaginate = paginate;
}(typeof window === 'undefined' ? this : window));
