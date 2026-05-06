'use strict';

// commit-view.js — bodyContent for commit-preview, commit-result, and the
// 409 already-committed page.

const { escHtml } = require('../utils/html-shell');
const { pill, btn } = require('./components');

/**
 * @param {object} data
 * @param {string} data.artefactPath
 * @param {string} data.artefactContent       raw markdown text
 * @param {string} data.commitFormAction      POST URL
 * @param {string} [data.branchName]
 * @param {string} [data.defaultMessage]
 * @param {Array<string>} [data.reviewers]
 */
function renderCommitPreview(data) {
  const reviewers = (data.reviewers || []).map(function(r) {
    return pill('accent', '@' + r, { dot: false });
  }).join('');

  return [
    '<style>',
      '.sw-commit { max-width: 880px; margin: 0 auto; }',
      '.sw-commit-head { margin-bottom: 24px; }',
      '.sw-commit-head h1 { margin: 12px 0 4px; font-size: 26px; font-weight: 600; letter-spacing: -0.3px; }',
      '.sw-commit-head p  { margin: 0; color: var(--muted); font-size: 14px; }',
      '.sw-commit-file { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; margin-bottom: 20px; }',
      '.sw-commit-file-bar { padding: 10px 16px; border-bottom: 1px solid var(--line); background: var(--bg); display: flex; justify-content: space-between; align-items: center; }',
      '.sw-commit-file-bar-l { display: flex; align-items: center; gap: 10px; }',
      '.sw-commit-file-bar-l span:first-child { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.4px; font-weight: 500; }',
      '.sw-commit-pre { margin: 0; padding: 24px 28px; font-family: var(--serif); font-size: 14.5px; line-height: 1.7; color: var(--ink-2); white-space: pre-wrap; max-height: 480px; overflow: auto; }',
      '.sw-commit-meta { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 20px; margin-bottom: 20px; }',
      '.sw-commit-meta h3 { margin: 0 0 12px; font-size: 13px; font-weight: 600; letter-spacing: 0.4px; text-transform: uppercase; color: var(--muted); }',
      '.sw-commit-meta-grid { display: grid; grid-template-columns: 120px 1fr; gap: 10px 16px; font-size: 14px; align-items: center; }',
      '.sw-commit-meta-grid > span:nth-child(odd) { color: var(--muted); }',
      '.sw-commit-actions { display: flex; gap: 8px; justify-content: flex-end; }',
    '</style>',
    '<div class="sw-commit">',
      '<header class="sw-commit-head">',
        pill('green', 'Session complete'),
        '<h1>Review & commit</h1>',
        '<p>This will create <code>' + escHtml(data.artefactPath) + '</code> on a new branch.</p>',
      '</header>',
      '<div class="sw-commit-file">',
        '<div class="sw-commit-file-bar">',
          '<div class="sw-commit-file-bar-l">',
            '<span>File</span>',
            '<code>' + escHtml(data.artefactPath) + '</code>',
          '</div>',
        '</div>',
        '<pre class="sw-commit-pre">' + escHtml(data.artefactContent || '') + '</pre>',
      '</div>',
      '<form method="POST" action="' + escHtml(data.commitFormAction) + '">',
        '<div class="sw-commit-meta">',
          '<h3>Commit details</h3>',
          '<div class="sw-commit-meta-grid">',
            '<span>Branch</span><code>' + escHtml(data.branchName || 'main') + '</code>',
            '<span>Commit message</span>' +
              '<input class="sw-input" name="message" value="' + escHtml(data.defaultMessage || '') + '">',
            '<span>Reviewers</span><div style="display:flex;gap:6px;flex-wrap:wrap">' + reviewers + '</div>',
          '</div>',
        '</div>',
        '<div class="sw-commit-actions">',
          btn('ghost',  'Save as draft', { type: 'button' }),
          btn('primary','Commit',        { type: 'submit', icon: '✓' }),
        '</div>',
      '</form>',
    '</div>'
  ].join('');
}

/**
 * @param {object} data
 * @param {string} data.artefactPath
 * @param {string} data.featureSlug
 * @param {string} data.artefactType
 * @param {string} [data.prUrl]
 * @param {string} [data.nextSkillName]
 * @param {string} [data.nextSkillLabel]
 */
function renderCommitResult(data) {
  return [
    '<style>',
      '.sw-result { max-width: 600px; margin: 60px auto 0; }',
      '.sw-result-icon { width: 56px; height: 56px; border-radius: 50%; background: var(--green-soft); color: var(--green); display: grid; place-items: center; font-size: 24px; margin-bottom: 20px; }',
      '.sw-result h1 { margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.3px; }',
      '.sw-result p { margin: 6px 0 24px; color: var(--muted); font-size: 15px; }',
      '.sw-result-card { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 20px; margin-bottom: 16px; }',
      '.sw-result-grid { display: grid; grid-template-columns: 110px 1fr; gap: 10px 12px; font-size: 14px; }',
      '.sw-result-grid > span:nth-child(odd) { color: var(--muted); }',
      '.sw-result-next { background: var(--accent-soft); border: 1px solid #DDD6FE; border-radius: 10px; padding: 16px; margin-bottom: 24px; display: flex; gap: 12px; }',
      '.sw-result-next p { margin: 0 0 10px; font-size: 13.5px; color: var(--accent-ink); line-height: 1.5; }',
    '</style>',
    '<div class="sw-result">',
      '<div class="sw-result-icon">✓</div>',
      '<h1>Committed.</h1>',
      '<p>The artefact is on a new branch.</p>',
      '<div class="sw-result-card">',
        '<div class="sw-result-grid">',
          '<span>File</span>',
          '<a href="/artefact/' + escHtml(data.featureSlug) + '/' + escHtml(data.artefactType) + '"><code>' +
            escHtml(data.artefactPath) + '</code></a>',
          (data.prUrl ? '<span>Pull request</span><a href="' + escHtml(data.prUrl) + '">' + escHtml(data.prUrl) + '</a>' : ''),
        '</div>',
      '</div>',
      (data.nextSkillName ? [
        '<div class="sw-result-next">',
          '<div style="font-size:18px;color:var(--accent)">✦</div>',
          '<div>',
            '<p><strong>Next up:</strong> ' + escHtml(data.nextSkillLabel || data.nextSkillName) + ' builds directly on this artefact.</p>',
            '<form method="POST" action="/api/skills/' + escHtml(data.nextSkillName) + '/sessions">' +
              btn('accent', 'Start ' + (data.nextSkillLabel || data.nextSkillName), { type: 'submit' }) +
            '</form>',
          '</div>',
        '</div>'
      ].join('') : ''),
      '<div style="display:flex;gap:8px">',
        btn('ghost', 'View artefact',     { href: '/artefact/' + escHtml(data.featureSlug) + '/' + escHtml(data.artefactType) }),
        btn('ghost', 'Back to features',  { href: '/features' }),
      '</div>',
    '</div>'
  ].join('');
}

function renderAlreadyCommitted(data) {
  return [
    '<div class="sw-empty">',
      '<div class="sw-empty-icon">!</div>',
      '<h1>Already committed.</h1>',
      '<p>This session\'s artefact has already been saved. Reviewers can comment and request changes from the artefact view.</p>',
      '<div style="display:flex;gap:8px;justify-content:center">',
        (data.artefactUrl ? btn('primary', 'View artefact', { href: data.artefactUrl }) : ''),
        btn('ghost', 'Back to features', { href: '/features' }),
      '</div>',
    '</div>'
  ].join('');
}

module.exports = { renderCommitPreview, renderCommitResult, renderAlreadyCommitted };
