'use strict';
// paginate-signals.js -- ep2-s3: pure pagination-math function slicing
// getSignals()'s own existing output, PAGE_SIZE at a time, in its existing
// order. No I/O, no adapter calls -- independently unit-testable, matching
// ep2-s2's own utils/signal-context.js precedent.

const SIGNALS_PAGE_SIZE = 50;

/**
 * @param {Array} signals — getSignals()'s own existing output, unmodified order
 * @param {string|undefined} rawPage — req.query.page: a plain string or undefined, never pre-parsed
 * @returns {{pageSignals:Array, currentPage:number, totalPages:number, totalCount:number, startIndex:number, endIndex:number, hasPrevious:boolean, hasNext:boolean}}
 */
function paginateSignals(signals, rawPage) {
  const list = signals || [];
  const totalCount = list.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / SIGNALS_PAGE_SIZE));

  let page = parseInt(rawPage, 10);
  if (!Number.isInteger(page) || page < 1) page = 1;
  if (page > totalPages) page = totalPages;

  const sliceStart = (page - 1) * SIGNALS_PAGE_SIZE;
  const sliceEnd = Math.min(sliceStart + SIGNALS_PAGE_SIZE, totalCount);
  const pageSignals = list.slice(sliceStart, sliceEnd);

  // endIndex needs no +1: slice-end is exclusive/0-indexed, which numerically
  // equals the inclusive/1-indexed display end -- do not "fix" this to match
  // startIndex's own +1, that would introduce an off-by-one display bug.
  return {
    pageSignals,
    currentPage: page,
    totalPages: totalPages,
    totalCount: totalCount,
    startIndex: totalCount === 0 ? 0 : sliceStart + 1,
    endIndex: sliceEnd,
    hasPrevious: page > 1,
    hasNext: page < totalPages
  };
}

module.exports = { paginateSignals, SIGNALS_PAGE_SIZE };
