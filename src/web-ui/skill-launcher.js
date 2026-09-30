'use strict';
// skill-launcher.js -- ep1-s3: redesigned skill launcher. Shows 5 hardcoded
// primary CTAs; all real skills remain available via a native <details>
// collapsible advanced section (zero JS, zero new dependency, matching this
// codebase's own existing canvas-diagram-alternative and context-manifest-
// panel convention). Config.yml parameterization of PRIMARY_SKILLS is
// deferred to Phase 5 (story's own explicit Out of Scope).
const { escHtml } = require('./utils/html-shell');
const _csrf = require('./middleware/csrf');

const PRIMARY_SKILLS = ['discovery', 'ideate', 'reverse-engineer', 'spike', 'improve'];

function _skillCard(skill, csrfToken, sizeClass) {
  const safeName = escHtml(skill.name || '');
  const safeDesc = escHtml(skill.description || '');
  return [
    '<div class="sw-card ' + sizeClass + '" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">',
    '  <div>',
    '    <div class="el-skill-name">' + safeName + '</div>',
    '    <div class="el-skill-desc">' + safeDesc + '</div>',
    '  </div>',
    '  <form method="POST" action="/api/skills/' + safeName + '/sessions" style="flex-shrink:0">',
    '    ' + _csrf.csrfField(csrfToken),
    '    <button type="submit" class="sw-btn sw-btn--primary ' + sizeClass + '">Start</button>',
    '  </form>',
    '</div>'
  ].join('\n');
}

/**
 * @param {Array<{name:string,description:string}>} skills - the real, complete skill list
 * @param {string} csrfToken
 * @returns {string} HTML body content for the /skills launcher page
 */
function renderSkillLauncher(skills, csrfToken) {
  if (skills.length === 0) {
    return '<div class="sw-empty"><div class="sw-empty-icon">❖</div><h1>No skills available</h1><p>No SKILL.md files were found in the repository.</p></div>';
  }

  const bySlug = {};
  skills.forEach(function(s) { bySlug[s.name] = s; });

  const primaryCards = PRIMARY_SKILLS
    .map(function(name) { return bySlug[name]; })
    .filter(function(s) { return !!s; }) // gracefully skip a primary name absent from a narrow skills list
    .map(function(s) { return _skillCard(s, csrfToken, 'el-primary-card'); })
    .join('\n');

  const advancedCards = skills.map(function(s) { return _skillCard(s, csrfToken, 'el-advanced-card'); }).join('\n');

  return [
    '<p class="sw-section-title">Get started</p>',
    '<div class="el-primary" style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px">',
    primaryCards,
    '</div>',
    '<details class="el-advanced">',
    '  <summary class="el-advanced-summary">Advanced skills (all ' + skills.length + ')</summary>',
    '  <div class="el-advanced-body" style="display:flex;flex-direction:column;gap:8px;margin-top:12px">',
    advancedCards,
    '  </div>',
    '</details>'
  ].join('\n');
}

module.exports = { renderSkillLauncher, PRIMARY_SKILLS };
