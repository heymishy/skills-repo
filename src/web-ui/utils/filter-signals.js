'use strict';
// filter-signals.js -- sptu-s2: pure filtering-by-type/source function over
// getSignals()'s own existing output, applied BEFORE paginateSignals() slices
// it -- filtering a single page after the fact would produce an inconsistent
// totalCount/page count. No I/O, no adapter calls -- independently
// unit-testable, matching paginate-signals.js's own established precedent.

/**
 * @param {Array} signals — getSignals()'s own existing output, unmodified order
 * @param {{hideTypes?: string[], hideSources?: string[]}} [opts]
 * @returns {Array} signals with any item matching a hidden type OR hidden source removed
 */
function filterSignals(signals, opts) {
  const list = signals || [];
  opts = opts || {};
  const hideTypes = (opts.hideTypes || []).map(_normalize).filter(Boolean);
  const hideSources = (opts.hideSources || []).map(_normalize).filter(Boolean);
  if (hideTypes.length === 0 && hideSources.length === 0) return list;

  const typeSet = new Set(hideTypes);
  const sourceSet = new Set(hideSources);
  return list.filter(function(s) {
    const type = _normalize(s && s.type);
    const source = _normalize(s && s.source);
    if (type && typeSet.has(type)) return false;
    if (source && sourceSet.has(source)) return false;
    return true;
  });
}

function _normalize(v) {
  return String(v == null ? '' : v).trim().toLowerCase();
}

module.exports = { filterSignals };
