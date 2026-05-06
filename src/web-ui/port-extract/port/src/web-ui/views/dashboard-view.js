'use strict';

// dashboard-view.js — bodyContent for GET /dashboard.
// Pure renderer; takes plain JS objects and returns HTML string.

const { escHtml } = require('../utils/html-shell');
const { pill, btn } = require('./components');

/**
 * @param {object} data
 * @param {string} data.greetingName
 * @param {string} data.dateLabel              e.g. 'Tuesday, 6 May'
 * @param {number} data.pendingActionsCount
 * @param {number} data.inProgressCount
 * @param {Array<{name,label,desc,est,stage}>} data.skills
 * @param {Array<{what,feature,age,you}>} data.actions
 * @param {Array<{skill,feature,when,stage,tone}>} data.recent
 */
function renderDashboard(data) {
  const skills = (data.skills || []).slice(0, 6).map(function(s) {
    return [
      '<a class="sw-skill-card" href="/api/skills/' + escHtml(s.name) + '/sessions" data-method="POST">',
        '<form method="POST" action="/api/skills/' + escHtml(s.name) + '/sessions" style="all:unset;display:contents">',
          '<div class="sw-skill-card__head">',
            '<div class="sw-skill-card__name">' + escHtml(s.label) + '</div>',
            pill('neutral', s.stage, { dot: false }),
          '</div>',
          '<p class="sw-skill-card__desc">' + escHtml(s.desc) + '</p>',
          '<div class="sw-skill-card__foot">',
            '<span class="sw-skill-card__est">~' + escHtml(s.est) + '</span>',
            '<button class="sw-skill-card__cta" type="submit">Start →</button>',
          '</div>',
        '</form>',
      '</a>'
    ].join('');
  }).join('');

  const actions = (data.actions || []).map(function(a) {
    return [
      '<li>',
        '<div class="sw-list-dot" style="background:' + (a.you ? 'var(--accent)' : 'var(--muted-2)') + '"></div>',
        '<div class="sw-list-main">',
          '<div class="sw-list-title">' + escHtml(a.what) + '</div>',
          '<div class="sw-list-sub">' + escHtml(a.feature) + ' · ' + escHtml(a.age) + '</div>',
        '</div>',
        '<span class="sw-list-arrow">→</span>',
      '</li>'
    ].join('');
  }).join('');

  const recent = (data.recent || []).map(function(r) {
    return [
      '<li>',
        '<div class="sw-list-main">',
          '<div class="sw-list-title">' + escHtml(r.skill) + '</div>',
          '<div class="sw-list-sub">' + escHtml(r.feature) + ' · ' + escHtml(r.when) + '</div>',
        '</div>',
        pill(r.tone || 'neutral', r.stage),
      '</li>'
    ].join('');
  }).join('');

  return [
    '<style>',
      '.sw-dash { max-width: 1040px; }',
      '.sw-greet h1 { margin: 4px 0 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px; }',
      '.sw-greet p  { margin: 6px 0 0; color: var(--muted); font-size: 15px; }',
      '.sw-greet .sw-greet-date { font-size: 13px; color: var(--muted); }',
      '.sw-greet strong { color: var(--ink); font-weight: 500; }',
      '.sw-skill-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }',
      '.sw-skill-card {',
        'background: var(--surface); border: 1px solid var(--line); border-radius: 8px;',
        'padding: 16px; text-decoration: none; color: var(--ink);',
        'display: flex; flex-direction: column; gap: 8px; min-height: 132px;',
      '}',
      '.sw-skill-card:hover { border-color: var(--muted-2); }',
      '.sw-skill-card__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }',
      '.sw-skill-card__name { font-size: 15px; font-weight: 600; }',
      '.sw-skill-card__desc { margin: 0; font-size: 13px; color: var(--muted); line-height: 1.5; flex: 1; }',
      '.sw-skill-card__foot { display: flex; justify-content: space-between; align-items: center; }',
      '.sw-skill-card__est  { font-size: 12px; color: var(--muted-2); }',
      '.sw-skill-card__cta  { background: none; border: none; padding: 0; font: inherit; cursor: pointer;',
        'font-size: 12px; color: var(--accent-ink); font-weight: 500; }',
      '.sw-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 40px; }',
      '.sw-list-dot { width: 6px; height: 6px; border-radius: 50%; flex: 0 0 6px; }',
      '.sw-list-main { flex: 1; min-width: 0; }',
      '.sw-list-title { font-size: 14px; color: var(--ink); }',
      '.sw-list-sub   { font-size: 12px; color: var(--muted); margin-top: 2px; }',
      '.sw-list-arrow { font-size: 12px; color: var(--muted); }',
      '.sw-section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }',
      '.sw-section-head a { font-size: 13px; color: var(--muted); text-decoration: none; }',
    '</style>',
    '<div class="sw-dash">',
      '<div class="sw-greet">',
        '<p class="sw-greet-date">' + escHtml(data.dateLabel || '') + '</p>',
        '<h1>Good morning, ' + escHtml(data.greetingName || 'there') + '.</h1>',
        '<p>You have <strong>' + escHtml(String(data.pendingActionsCount || 0)) + ' things waiting</strong>',
        ' and <strong>' + escHtml(String(data.inProgressCount || 0)) + ' in-progress session' +
          ((data.inProgressCount === 1) ? '' : 's') + '</strong>.</p>',
      '</div>',
      '<section style="margin-top:32px">',
        '<div class="sw-section-head">',
          '<h2 class="sw-section-title">Run a skill</h2>',
          '<a href="/skills">Browse all →</a>',
        '</div>',
        '<div class="sw-skill-grid">' + skills + '</div>',
      '</section>',
      '<div class="sw-cols">',
        '<section>',
          '<h2 class="sw-section-title">Waiting on you</h2>',
          '<ul class="sw-list">' + (actions || '<li><div class="sw-list-main"><div class="sw-list-sub">Nothing waiting.</div></div></li>') + '</ul>',
        '</section>',
        '<section>',
          '<h2 class="sw-section-title">Recent sessions</h2>',
          '<ul class="sw-list">' + (recent || '<li><div class="sw-list-main"><div class="sw-list-sub">No recent sessions.</div></div></li>') + '</ul>',
        '</section>',
      '</div>',
    '</div>'
  ].join('');
}

module.exports = { renderDashboard };
