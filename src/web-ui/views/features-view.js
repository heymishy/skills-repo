'use strict';

// features-view.js — bodyContent for GET /features and the empty state.

const { escHtml } = require('../utils/html-shell');
const { pill, btn } = require('./components');

const STAGES = [
  { id: 'discovery',  label: 'Discovery'  },
  { id: 'definition', label: 'Definition' },
  { id: 'review',     label: 'In review'  },
  { id: 'delivery',   label: 'Delivery'   },
  { id: 'committed',  label: 'Shipped'    }
];

function renderStageDots(stage) {
  const idx = STAGES.findIndex(function(s) { return s.id === stage; });
  const dots = STAGES.map(function(s, i) {
    let bg, w;
    if (i < idx)        { bg = 'var(--ink-2)'; w = 22; }
    else if (i === idx) { bg = (s.id === 'review') ? 'var(--amber)' : 'var(--ink)'; w = 22; }
    else                { bg = 'var(--line)'; w = 14; }
    return '<div style="width:' + w + 'px;height:4px;border-radius:2px;background:' + bg + '"></div>';
  }).join('');
  return '<div class="sw-stagedots" title="' + escHtml(stage || '') + '">' + dots + '</div>';
}

/**
 * @param {object} data
 * @param {Array<{slug,title,stage,updated,owner,artefactCount}>} data.features
 * @param {number} data.repoCount
 */
function renderFeaturesList(data) {
  const features = data.features || [];

  if (features.length === 0) {
    return [
      '<div class="sw-empty">',
        '<div class="sw-empty-icon">◫</div>',
        '<h1>No features found</h1>',
        '<p>Features appear here as soon as a Discovery session is committed.<br>The fastest way is to run one now.</p>',
        '<div style="display:flex;gap:8px;justify-content:center">',
          btn('primary', 'Start a Discovery session', { icon: '✦', href: '/skills' }),
          btn('ghost',   'Import existing',           { href: '/features' }),
        '</div>',
      '</div>'
    ].join('');
  }

  const filterPills = ['<button class="sw-filter-pill sw-filter-pill--active">All stages</button>']
    .concat(STAGES.map(function(s) {
      return '<button class="sw-filter-pill">' + escHtml(s.label) + '</button>';
    })).join('');

  const rows = features.map(function(f) {
    return [
      '<li>',
      '<a class="sw-frow" href="/features/' + escHtml(f.slug) + '">',
        '<div>',
          '<div class="sw-frow-title">' + escHtml(f.title) + '</div>',
          '<div class="sw-frow-slug">' + escHtml(f.slug) + '</div>',
        '</div>',
        renderStageDots(f.stage),
        '<div class="sw-frow-owner"><div class="sw-avatar">' +
          escHtml((f.owner || '?').charAt(0).toUpperCase()) + '</div>' + escHtml(f.owner || '') + '</div>',
        '<span class="sw-frow-updated">' + escHtml(f.updated || '') + '</span>',
        '<span class="sw-frow-count">' + escHtml(String(f.artefactCount || 0)) + '</span>',
      '</a>',
      '</li>',
    ].join('');
  }).join('');

  return [
    '<style>',
      '.sw-feat { max-width: 1100px; }',
      '.sw-feat-head { margin-bottom: 24px; }',
      '.sw-filterbar { display: flex; gap: 8px; margin-bottom: 16px; align-items: center; font-size: 13px; flex-wrap: wrap; }',
      '.sw-filter-pill { padding: 5px 10px; border-radius: 5px; background: transparent; border: 1px solid transparent; color: var(--muted); cursor: pointer; font: inherit; }',
      '.sw-filter-pill--active { background: var(--surface); border-color: var(--line); color: var(--ink); font-weight: 500; }',
      '.sw-ftable { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }',
      '.sw-fhead, .sw-frow { display: grid; grid-template-columns: 1fr 200px 140px 120px 80px; padding: 14px 16px; align-items: center; gap: 12px; }',
      '.sw-fhead { padding: 10px 16px; font-size: 12px; color: var(--muted); font-weight: 500; letter-spacing: 0.3px; text-transform: uppercase; border-bottom: 1px solid var(--line); background: var(--bg); }',
      '.sw-frow { text-decoration: none; color: var(--ink); border-top: 1px solid var(--line); }',
      '.sw-frow:first-of-type { border-top: none; }',
      '.sw-frow:hover { background: var(--bg); }',
      '.sw-frow-title { font-size: 14px; font-weight: 500; }',
      '.sw-frow-slug { font-size: 12px; color: var(--muted); margin-top: 2px; font-family: var(--mono); }',
      '.sw-stagedots { display: flex; gap: 4px; align-items: center; }',
      '.sw-frow-owner { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--ink-2); }',
      '.sw-frow-updated { font-size: 13px; color: var(--muted); }',
      '.sw-frow-count { font-size: 13px; color: var(--ink-2); text-align: right; font-variant-numeric: tabular-nums; }',
      '.sw-feat-foot { display: flex; justify-content: space-between; margin-top: 16px; font-size: 12px; color: var(--muted); }',
    '</style>',
    '<div class="sw-feat">',
      '<header class="sw-feat-head">',
        '<h1 class="sw-page-h1">Features</h1>',
        '<p class="sw-page-sub">' + features.length + ' active across ' + (data.repoCount || 0) + ' repositories</p>',
      '</header>',
      '<div class="sw-filterbar">' + filterPills + '</div>',
      '<ul class="sw-ftable">',
        '<li class="sw-fhead"><span>Feature</span><span>Pipeline</span><span>Owner</span><span>Updated</span><span style="text-align:right">Artefacts</span></li>',
        rows,
      '</ul>',
      '<div class="sw-feat-foot">',
        '<span>Showing ' + features.length + ' of ' + features.length + '</span>',
        '<span>Synced from GitHub</span>',
      '</div>',
    '</div>'
  ].join('');
}

module.exports = { renderFeaturesList };
