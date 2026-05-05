'use strict';

// artefact-view.js — bodyContent wrapper for GET /artefact/:slug/:type.
// Wraps already-rendered prose HTML in the document/sidebar layout
// (sign-off panel + comments). Existing markdown→HTML rendering is reused.

const { escHtml } = require('../utils/html-shell');
const { pill, btn } = require('./components');

/**
 * @param {object} data
 * @param {string} data.proseHtml          - already-sanitised, from markdown-renderer
 * @param {object} data.meta               - { feature, stage, author, updated }
 * @param {string} data.commitSha
 * @param {string} data.commitUrl
 * @param {Array<{login, role, signed}>} data.signoffs
 * @param {Array<{by, text, when, resolved}>} data.comments
 */
function renderArtefact(data) {
  const m = data.meta || {};
  const metaRow = [
    ['Feature',      m.feature],
    ['Stage',        m.stage],
    ['Author',       m.author ? '@' + m.author : ''],
    ['Last updated', m.updated]
  ].filter(function(p) { return p[1]; }).map(function(p) {
    return '<span><span class="sw-meta-k">' + escHtml(p[0]) + '</span>' +
      '<span class="sw-meta-v">' + escHtml(p[1]) + '</span></span>';
  }).join('');

  const signoffs = (data.signoffs || []);
  const pendingCount = signoffs.filter(function(s) { return !s.signed; }).length;
  const signoffRows = signoffs.map(function(s) {
    const av = s.signed
      ? '<div class="sw-avatar" style="background:var(--green-soft);color:var(--green)">✓</div>'
      : '<div class="sw-avatar">' + escHtml((s.login || '?').charAt(0).toUpperCase()) + '</div>';
    return '<li>' + av +
      '<div class="sw-list-main">' +
        '<div class="sw-list-title">@' + escHtml(s.login) + '</div>' +
        '<div class="sw-list-sub">' + escHtml(s.role || '') + '</div>' +
      '</div>' +
      '<span style="font-size:12px;color:' + (s.signed ? 'var(--green)' : 'var(--muted)') + '">' +
        (s.signed ? 'Signed' : 'Pending') + '</span>' +
    '</li>';
  }).join('');

  const comments = (data.comments || []);
  const commentRows = comments.length === 0
    ? '<li style="display:block"><span class="sw-list-sub">No open comments.</span></li>'
    : comments.map(function(c, i) {
        const last = i === comments.length - 1;
        return '<li class="sw-comment' + (last ? ' sw-comment--last' : '') + '">' +
          '<div class="sw-comment-head">' +
            '<div class="sw-avatar">' + escHtml((c.by || '?').charAt(0).toUpperCase()) + '</div>' +
            '<span class="sw-comment-by">@' + escHtml(c.by) + '</span>' +
            '<span class="sw-comment-when">' + escHtml(c.when || '') + '</span>' +
          '</div>' +
          '<p class="sw-comment-text">' + escHtml(c.text) + '</p>' +
          '<div class="sw-comment-actions">' +
            '<a href="#">Reply</a><a href="#" class="sw-muted-link">Resolve</a>' +
          '</div>' +
        '</li>';
      }).join('');

  return [
    '<style>',
      '.sw-art { display: grid; grid-template-columns: minmax(0,1fr) 320px; gap: 32px; max-width: 1180px; }',
      '.sw-art-doc { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 48px 64px 64px; min-height: 600px; }',
      '.sw-art-meta { display: flex; gap: 24px; flex-wrap: wrap; font-family: var(--sans); font-size: 12px; color: var(--muted); border-bottom: 1px solid var(--line); padding-bottom: 16px; margin-bottom: 28px; }',
      '.sw-meta-k { text-transform: uppercase; letter-spacing: 0.4px; font-weight: 500; margin-right: 6px; }',
      '.sw-meta-v { color: var(--ink); }',
      '.sw-art-foot { margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--muted); }',
      '.sw-art-foot a { color: var(--accent-ink); text-decoration: none; }',
      '.sw-art-side { display: flex; flex-direction: column; gap: 20px; }',
      '.sw-side-card { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 16px; }',
      '.sw-side-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }',
      '.sw-side-head h3 { margin: 0; font-size: 13px; font-weight: 600; letter-spacing: 0.4px; text-transform: uppercase; color: var(--muted); }',
      '.sw-comment { padding: 0 0 14px; border-bottom: 1px solid var(--line-2); margin-bottom: 14px; list-style: none; }',
      '.sw-comment--last { border: none; padding-bottom: 0; margin-bottom: 0; }',
      '.sw-comment-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }',
      '.sw-comment-by { font-size: 13px; font-weight: 500; }',
      '.sw-comment-when { font-size: 12px; color: var(--muted); margin-left: auto; }',
      '.sw-comment-text { margin: 0 0 6px; font-size: 13px; color: var(--ink-2); line-height: 1.5; }',
      '.sw-comment-actions { display: flex; gap: 12px; font-size: 12px; }',
      '.sw-comment-actions a { color: var(--accent-ink); text-decoration: none; }',
      '.sw-muted-link { color: var(--muted) !important; }',
      '.sw-side-card ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }',
      '.sw-side-card .sw-list-title { font-size: 13px; font-weight: 500; }',
      '.sw-side-card .sw-list-sub   { font-size: 11px; color: var(--muted); }',
    '</style>',
    '<div class="sw-art">',
      '<article class="sw-art-doc">',
        '<div class="sw-doc">',
          (m.title ? '<h1>' + escHtml(m.title) + '</h1>' : ''),
          (metaRow ? '<div class="sw-art-meta">' + metaRow + '</div>' : ''),
          data.proseHtml || '',
        '</div>',
        '<div class="sw-art-foot">',
          '<span>Committed by @' + escHtml(m.author || 'unknown') +
            (data.commitSha ? ' · sha <code>' + escHtml(data.commitSha) + '</code>' : '') + '</span>',
          (data.commitUrl ? '<a href="' + escHtml(data.commitUrl) + '">View on GitHub →</a>' : ''),
        '</div>',
      '</article>',
      '<aside class="sw-art-side">',
        '<section class="sw-side-card">',
          '<div class="sw-side-head"><h3>Sign-off</h3>' +
            (pendingCount > 0 ? pill('amber', 'Awaiting ' + pendingCount) : pill('green', 'All signed')) +
          '</div>',
          '<ul>' + signoffRows + '</ul>',
        '</section>',
        '<section class="sw-side-card">',
          '<div class="sw-side-head"><h3>Comments</h3>' +
            '<span style="font-size:12px;color:var(--muted)">' + comments.length + ' open</span>' +
          '</div>',
          '<ul>' + commentRows + '</ul>',
          '<form method="POST" action="/api/artefacts/' + escHtml(m.featureSlug || '') + '/' + escHtml(m.fileSlug || '') + '/annotations" style="margin-top:12px">',
            '<textarea name="text" class="sw-textarea" rows="3" placeholder="Add a comment…"></textarea>',
            '<div style="margin-top:8px;display:flex;justify-content:flex-end">' + btn('primary', 'Comment', { type: 'submit' }) + '</div>',
          '</form>',
        '</section>',
      '</aside>',
    '</div>'
  ].join('');
}

module.exports = { renderArtefact };
