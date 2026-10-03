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

  return [
    '<div class="sw-card signal-item" data-signal-type="' + safeType + '" style="' + itemStyle + '">',
    '  <div>',
    '    <div class="signal-source">' + safeSource + '</div>',
    '    <div class="signal-type">' + safeType + '</div>',
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

/**
 * @param {Array<{id:string,source:string,type:string,text:string,timestamp:?string,cta:{label:string,skill:string}}>} signals -- already the current page's own slice
 * @param {string} csrfToken
 * @param {object} [pagination] -- ep2-s3: optional pagination metadata from paginateSignals(). Omitted -> renders exactly as before ep2-s3 (ep2-s1's own 7 existing test calls all omit it).
 * @returns {string} HTML body content for the /signals panel page
 */
function renderSignalsPanel(signals, csrfToken, pagination) {
  if (!signals || signals.length === 0) {
    return '<div class="sw-empty"><div class="sw-empty-icon">❖</div><h1>No signals yet</h1><p>No improvement signals were found in the workspace.</p></div>';
  }
  const items = signals.map(function(s) { return _signalItem(s, csrfToken); }).join('\n');
  return [
    '<p class="sw-section-title">Improvement signals</p>',
    '<div class="signals-list" style="display:flex;flex-direction:column;gap:12px">',
    items,
    '</div>',
    _paginationBar(pagination)
  ].join('\n');
}

module.exports = { renderSignalsPanel };
