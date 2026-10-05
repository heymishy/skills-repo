'use strict';
// signals-panel-view.js -- ep2-s1: renders real signals (from ep1-s1's real
// getSignals(), the same function ep1-s2's /api/signals handler already
// calls) as a web UI list. Each signal's CTA is a real, submittable form --
// ep2-s2 is what makes that form's target endpoint seed-aware; until then it
// behaves exactly like a normal, non-seeded skill launch (ep1-s3's own
// convention), which is expected, not a bug.
const { escHtml } = require('../utils/html-shell');
const _csrf = require('../middleware/csrf');
const { deriveDismissKey } = require('../modules/dismissed-signals-store');

function _hiddenField(name, value) {
  return '<input type="hidden" name="' + name + '" value="' + escHtml(value == null ? '' : String(value)) + '">';
}

// sptu-s4: Dismiss/Undismiss as a plain <form> POST, matching the existing
// CTA-form convention in this same file (zero client-JS, native keyboard
// focusability -- AC6). The server recomputes the dismiss key from these raw
// fields rather than trusting a client-submitted hash (DoR contract).
function _dismissControl(signal, csrfToken, isDismissedFlag, currentUrl) {
  const action = isDismissedFlag ? '/signals/undismiss' : '/signals/dismiss';
  const label = isDismissedFlag ? 'Undismiss' : 'Dismiss';
  return [
    '<form method="POST" action="' + action + '" style="margin-top:6px">',
    '  ' + _csrf.csrfField(csrfToken),
    '  ' + _hiddenField('signalSource', signal.source),
    '  ' + _hiddenField('signalType', signal.type),
    '  ' + _hiddenField('signalText', signal.text),
    '  ' + _hiddenField('returnTo', currentUrl || '/signals'),
    '  <button type="submit" class="sw-btn">' + label + '</button>',
    '</form>'
  ].join('\n');
}

function _signalItem(signal, csrfToken, isDismissedFlag, currentUrl) {
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
  // sptu-s4: a text marker, not colour alone (AC6/NFR Accessibility).
  const dismissedMarkerHtml = isDismissedFlag ? '<span class="signal-dismissed-marker">✓ Dismissed</span>' : '';

  return [
    '<div class="sw-card signal-item" data-signal-type="' + safeType + '"' + (isDismissedFlag ? ' data-signal-dismissed="true"' : '') + ' style="' + itemStyle + '">',
    '  <div>',
    '    <div class="signal-source">' + safeSource + '</div>',
    '    <div class="signal-type">' + safeType + '</div>' + (dismissedMarkerHtml ? ' ' + dismissedMarkerHtml : ''),
    '    <div class="signal-text">' + safeText + '</div>',
    '  </div>',
    '  <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">',
    '    <form method="POST" action="/api/skills/' + safeSkillName + '/sessions">',
    '      ' + _csrf.csrfField(csrfToken),
    '      ' + _hiddenField('signalSource', signal.source),
    '      ' + _hiddenField('signalType', signal.type),
    '      ' + _hiddenField('signalText', signal.text),
    '      ' + _hiddenField('signalTimestamp', signal.timestamp),
    '      <button type="submit" class="sw-btn sw-btn--primary">' + safeCtaLabel + '</button>',
    '    </form>',
    '    ' + _dismissControl(signal, csrfToken, isDismissedFlag, currentUrl),
    '  </div>',
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

// sptu-s4 (AC3): plain <a> link, same zero-client-JS/keyboard-native
// convention as the filter-bar toggles.
function _dismissToggleBar(showDismissed) {
  const href = showDismissed ? '/signals' : '/signals?showDismissed=true';
  const label = showDismissed ? 'Hide dismissed' : 'Show dismissed';
  return '<p class="sw-dismiss-toggle"><a href="' + href + '" class="sw-btn">' + escHtml(label) + '</a></p>';
}

/**
 * @param {Array<{id:string,source:string,type:string,text:string,timestamp:?string,cta:{label:string,skill:string}}>} signals -- already the current page's own slice
 * @param {string} csrfToken
 * @param {object} [pagination] -- ep2-s3: optional pagination metadata from paginateSignals(). Omitted -> renders exactly as before ep2-s3.
 * @param {object} [filterState] -- sptu-s2: optional {availableTypes, availableSources, hideTypes, hideSources}. Omitted -> no filter bar, renders exactly as before sptu-s2.
 * @param {object} [dismissState] -- sptu-s4: optional {showDismissed, dismissedKeys: Set<string>, currentUrl}. Omitted -> every item renders as not-dismissed, no toggle bar, matching every pre-sptu-s4 test call exactly.
 * @returns {string} HTML body content for the /signals panel page
 */
function renderSignalsPanel(signals, csrfToken, pagination, filterState, dismissState) {
  const filterBarHtml = _filterBar(filterState);
  const hasActiveFilter = !!(filterState && ((filterState.hideTypes || []).length || (filterState.hideSources || []).length));
  const showDismissed = !!(dismissState && dismissState.showDismissed);
  const dismissedKeys = (dismissState && dismissState.dismissedKeys) || new Set();
  const currentUrl = (dismissState && dismissState.currentUrl) || '/signals';
  const dismissToggleHtml = _dismissToggleBar(showDismissed);

  if (!signals || signals.length === 0) {
    if (hasActiveFilter) {
      // sptu-s2 (AC4): distinct from ep2-s1's own "no signals in the
      // workspace at all" message below -- this means signals EXIST but the
      // current filter combination matches none of them.
      return [
        filterBarHtml,
        dismissToggleHtml,
        '<div class="sw-empty"><div class="sw-empty-icon">❖</div><h1>No signals match the current filters</h1><p>Try clearing a filter to see more.</p><p><a href="/signals" class="sw-btn">Clear filters</a></p></div>'
      ].join('\n');
    }
    return [dismissToggleHtml, '<div class="sw-empty"><div class="sw-empty-icon">❖</div><h1>No signals yet</h1><p>No improvement signals were found in the workspace.</p></div>'].join('\n');
  }
  const items = signals.map(function(s) {
    const key = deriveDismissKey(s);
    const isDismissedFlag = dismissedKeys.has(key);
    return _signalItem(s, csrfToken, isDismissedFlag, currentUrl);
  }).join('\n');
  return [
    filterBarHtml,
    dismissToggleHtml,
    '<p class="sw-section-title">Improvement signals</p>',
    '<div class="signals-list" style="display:flex;flex-direction:column;gap:12px">',
    items,
    '</div>',
    _paginationBar(pagination)
  ].join('\n');
}

module.exports = { renderSignalsPanel };
