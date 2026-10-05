'use strict';
// signals-panel-view.js -- ep2-s1: renders real signals (from ep1-s1's real
// getSignals(), the same function ep1-s2's /api/signals handler already
// calls) as a web UI list. Each signal's CTA is a real, submittable form --
// ep2-s2 is what makes that form's target endpoint seed-aware; until then it
// behaves exactly like a normal, non-seeded skill launch (ep1-s3's own
// convention), which is expected, not a bug.
const { escHtml } = require('../utils/html-shell');
const _csrf = require('../middleware/csrf');

function _hiddenField(name, value) {
  return '<input type="hidden" name="' + name + '" value="' + escHtml(value == null ? '' : String(value)) + '">';
}

function _signalItem(signal, csrfToken) {
  const safeText = escHtml(signal.text || '');
  const safeSource = escHtml(signal.source || '');
  const safeType = escHtml(signal.type || '');
  const cta = signal.cta || { label: 'Review', skill: '/improve' };
  const safeCtaLabel = escHtml(cta.label || 'Review');
  const skillName = (cta.skill || '/improve').replace(/^\//, '');
  const safeSkillName = escHtml(skillName);
  const isParseError = signal.type === 'parse-error';
  const itemStyle = 'display:flex;align-items:flex-start;justify-content:space-between;gap:16px' +
    (isParseError ? ';border-left:3px solid #b45309;background:rgba(180,83,9,0.08);padding-left:12px' : '');
  const hasNoDate = signal.timestamp == null;
  const noDateMarkerHtml = hasNoDate
    ? '<span class="signal-no-date-marker">🕑 No date</span>'
    : '';

  return [
    '<div class="sw-card signal-item" data-signal-id="' + escHtml(signal.id || '') + '" data-signal-type="' + safeType + '" style="' + itemStyle + '">',
    '  <div>',
    '    <div class="signal-source">' + safeSource + '</div>',
    '    <div class="signal-type">' + safeType + '</div>' + (noDateMarkerHtml ? ' ' + noDateMarkerHtml : ''),
    '    <div class="signal-text">' + safeText + '</div>',
    '  </div>',
    '  <form method="POST" action="/api/skills/' + safeSkillName + '/sessions" style="flex-shrink:0">',
    '    ' + _csrf.csrfField(csrfToken),
    '    ' + _hiddenField('signalSource', signal.source),
    '    ' + _hiddenField('signalType', signal.type),
    '    ' + _hiddenField('signalText', signal.text),
    '    ' + _hiddenField('signalTimestamp', signal.timestamp),
    '    <button type="submit" class="sw-btn sw-btn--primary">' + safeCtaLabel + '</button>',
    '  </form>',
    '</div>'
  ].join('\n');
}

function _paginationBar(pagination) {
  if (!pagination) return '';
  const prevLink = pagination.hasPrevious
    ? '<a href="/signals?page=' + (pagination.currentPage - 1) + '" class="sw-btn">Previous</a>'
    : '';
  const nextLink = pagination.hasNext
    ? '<a href="/signals?page=' + (pagination.currentPage + 1) + '" class="sw-btn">Next</a>'
    : '';
  const isLastPage = pagination.currentPage === pagination.totalPages;
  const positionText = 'Signals ' + pagination.startIndex + '–' + pagination.endIndex + ' of ' + pagination.totalCount +
    (isLastPage ? ' (last page)' : '');
  return [
    '<div class="sw-pagination" style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;gap:12px">',
    '  <span>' + prevLink + '</span>',
    '  <span class="sw-pagination-position">' + positionText + '</span>',
    '  <span>' + nextLink + '</span>',
    '</div>'
  ].join('\n');
}

// sptu-s3: makes the signals-aggregator's own existing recency sort
// (already applied by getSignals()'s _sortSignals() since ep1-s1) visible
// and honestly qualified -- most real signals (87% as measured 2026-10-04)
// have no timestamp at all and are not actually sorted by recency, so the
// copy must not claim an unqualified "sorted by recency" guarantee (AC3).
function _sortOrderLabel() {
  return '<p class="sw-sort-label">Sorted by most recent first for signals that have a date — signals with no date are shown last, in their original order</p>';
}

function _toggleHideValue(currentList, value) {
  const idx = currentList.indexOf(value);
  if (idx === -1) return currentList.concat([value]);
  return currentList.slice(0, idx).concat(currentList.slice(idx + 1));
}

function _buildFilterUrl(hideTypes, hideSources) {
  const params = [];
  if (hideTypes.length) params.push('hideType=' + encodeURIComponent(hideTypes.join(',')));
  if (hideSources.length) params.push('hideSource=' + encodeURIComponent(hideSources.join(',')));
  return '/signals' + (params.length ? '?' + params.join('&') : '');
}

function _filterToggleLink(value, isHidden, nextUrl) {
  const label = (isHidden ? 'Show ' : 'Hide ') + value;
  return '<a href="' + escHtml(nextUrl) + '" class="sw-btn sw-filter-toggle' + (isHidden ? ' sw-filter-toggle--active' : '') + '">' +
    (isHidden ? '✓ ' : '') + escHtml(label) + '</a>';
}

// sptu-s2: filter toggle bar -- plain <a> links (zero-client-JS convention,
// matching ep2-s3's own Previous/Next precedent), so every control is
// natively keyboard-focusable with no custom tabindex handling needed (AC5).
function _filterBar(filterState) {
  if (!filterState) return '';
  const availableTypes = filterState.availableTypes || [];
  const availableSources = filterState.availableSources || [];
  const hideTypes = filterState.hideTypes || [];
  const hideSources = filterState.hideSources || [];
  if (availableTypes.length === 0 && availableSources.length === 0) return '';

  const typeLinks = availableTypes.map(function(t) {
    const isHidden = hideTypes.indexOf(t) !== -1;
    return _filterToggleLink(t, isHidden, _buildFilterUrl(_toggleHideValue(hideTypes, t), hideSources));
  }).join(' ');

  const sourceLinks = availableSources.map(function(s) {
    const isHidden = hideSources.indexOf(s) !== -1;
    return _filterToggleLink(s, isHidden, _buildFilterUrl(hideTypes, _toggleHideValue(hideSources, s)));
  }).join(' ');

  // AC5 (accessibility): the ✓ glyph is a text character, not a colour-only
  // cue -- the --active class also changes more than colour (see CSS), but
  // this inline text marker is what guarantees colour is never the sole signal.
  const activeSummary = (hideTypes.length || hideSources.length)
    ? '<p class="sw-filter-summary">Hiding: ' + escHtml(hideTypes.concat(hideSources).join(', ')) +
      ' — <a href="/signals">Clear filters</a></p>'
    : '';

  return [
    '<div class="sw-filter-bar" style="margin-bottom:16px">',
    '  <p class="sw-filter-bar-label">Filter by type:</p>',
    '  <div class="sw-filter-bar-row" style="display:flex;flex-wrap:wrap;gap:6px">' + typeLinks + '</div>',
    '  <p class="sw-filter-bar-label">Filter by source:</p>',
    '  <div class="sw-filter-bar-row" style="display:flex;flex-wrap:wrap;gap:6px">' + sourceLinks + '</div>',
    activeSummary,
    '</div>'
  ].join('\n');
}

/**
 * @param {Array<{id:string,source:string,type:string,text:string,timestamp:?string,cta:{label:string,skill:string}}>} signals -- already the current page's own slice
 * @param {string} csrfToken
 * @param {object} [pagination] -- ep2-s3: optional pagination metadata from paginateSignals(). Omitted -> renders exactly as before ep2-s3.
 * @param {object} [filterState] -- sptu-s2: optional {availableTypes, availableSources, hideTypes, hideSources}. Omitted -> no filter bar, renders exactly as before sptu-s2 (ep2-s1's own 7 existing test calls all omit it).
 * @returns {string} HTML body content for the /signals panel page
 */
function renderSignalsPanel(signals, csrfToken, pagination, filterState) {
  const filterBarHtml = _filterBar(filterState);
  const sortOrderLabelHtml = _sortOrderLabel();
  const hasActiveFilter = !!(filterState && ((filterState.hideTypes || []).length || (filterState.hideSources || []).length));

  if (!signals || signals.length === 0) {
    if (hasActiveFilter) {
      // sptu-s2 (AC4): distinct from ep2-s1's own "no signals in the
      // workspace at all" message below -- this means signals EXIST but the
      // current filter combination matches none of them.
      return [
        filterBarHtml,
        sortOrderLabelHtml,
        '<div class="sw-empty"><div class="sw-empty-icon">❖</div><h1>No signals match the current filters</h1><p>Try clearing a filter to see more.</p><p><a href="/signals" class="sw-btn">Clear filters</a></p></div>'
      ].join('\n');
    }
    return [
      sortOrderLabelHtml,
      '<div class="sw-empty"><div class="sw-empty-icon">❖</div><h1>No signals yet</h1><p>No improvement signals were found in the workspace.</p></div>'
    ].join('\n');
  }
  const items = signals.map(function(s) { return _signalItem(s, csrfToken); }).join('\n');
  return [
    filterBarHtml,
    sortOrderLabelHtml,
    '<p class="sw-section-title">Improvement signals</p>',
    '<div class="signals-list" style="display:flex;flex-direction:column;gap:12px">',
    items,
    '</div>',
    _paginationBar(pagination)
  ].join('\n');
}

module.exports = { renderSignalsPanel };
