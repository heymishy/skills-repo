'use strict';

// actions-view.js — bodyContent for GET /actions (HTML).

const { escHtml } = require('../utils/html-shell');
const { btn } = require('./components');

/**
 * @param {object} data
 * @param {Array<{title, feature, actionType, artefactPath}>} data.items
 */
function renderActions(data) {
  const items = data.items || [];

  if (items.length === 0) {
    return [
      '<div class="sw-empty">',
        '<div class="sw-empty-icon">✓</div>',
        '<h1>No pending actions</h1>',
        '<p>No artefacts are waiting on your sign-off, and you have no in-progress sessions.<br>This is a good time to start a new piece of work.</p>',
        '<div style="display:flex;gap:8px;justify-content:center">',
          btn('primary', 'Run a skill',       { icon: '✦', href: '/skills' }),
          btn('ghost',   'Browse features',   { href: '/features' }),
        '</div>',
      '</div>'
    ].join('');
  }

  const rows = items.map(function(i) {
    return '<li>' +
      '<div class="sw-list-dot" style="width:6px;height:6px;border-radius:50%;background:var(--accent);flex:0 0 6px"></div>' +
      '<div class="sw-list-main">' +
        '<a class="sw-list-title" style="color:inherit;text-decoration:none" href="/artefact/' + escHtml(i.artefactPath || '') + '">' +
          escHtml(i.title || '') + '</a>' +
        '<div class="sw-list-sub">' + escHtml(i.feature || '') + ' · ' + escHtml(i.actionType || '') + '</div>' +
      '</div>' +
      '<span class="sw-list-arrow">→</span>' +
    '</li>';
  }).join('');

  return [
    '<style>',
      '.sw-actions { max-width: 720px; }',
      '.sw-actions h1 { margin: 0 0 4px; font-size: 24px; font-weight: 600; letter-spacing: -0.3px; }',
      '.sw-actions p.sub  { margin: 0 0 24px; color: var(--muted); font-size: 14px; }',
      '.sw-actions .sw-list-main { flex: 1; min-width: 0; }',
      '.sw-actions .sw-list-title { font-size: 14px; color: var(--ink); display: block; }',
      '.sw-actions .sw-list-sub   { font-size: 12px; color: var(--muted); margin-top: 2px; }',
    '</style>',
    '<div class="sw-actions">',
      '<h1>My actions</h1>',
      '<p class="sub">' + items.length + ' item' + (items.length === 1 ? '' : 's') + ' waiting on you</p>',
      '<ul class="sw-list">' + rows + '</ul>',
    '</div>'
  ].join('');
}

module.exports = { renderActions };
