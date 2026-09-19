'use strict';

// dashboard.js — action queue route handler (ADR-012: adapter pattern) +
//                dashboard HTML route handler (wuce.18, ADR-009)
// GET /api/actions — returns personalised action queue for authenticated user.
// GET /dashboard   — renders HTML shell with navigation for authenticated user.
// Server-side repository access validation enforced via getPendingActions adapter.

const { getPendingActions: defaultGetPendingActions } = require('../adapters/action-queue');
const { renderShell, escHtml }                        = require('../utils/html-shell');
const { isEffectivelyAdmin }                          = require('../modules/impersonation'); // d2
const csrf                                            = require('../middleware/csrf'); // d2 -- impersonation exit banner CSRF token
const { renderDashboard }                             = require('../views/dashboard-view');
const { listJourneys }                                = require('../modules/journey-store'); // dsa-s2 Task 3 (AC7)
const path                                            = require('path');

// dsa-s2 -- static, platform-wide skill catalog for the "Run a skill" grid.
// Real skill names confirmed against routes/skills.js's own real
// skillName === '...' branches ('discovery', 'definition', 'test-plan',
// 'definition-of-ready', 'review') plus routes/journey.js's skill registry
// ('implementation-plan', step 7 there) -- do not invent names not present
// in either.
const _DASHBOARD_SKILLS_CATALOG = [
  { name: 'discovery', label: 'Discovery', stage: 'outer', desc: 'Structure a raw idea into a formal discovery artefact.', est: '15m' },
  { name: 'definition', label: 'Definition', stage: 'outer', desc: 'Break approved discovery into epics and stories.', est: '20m' },
  { name: 'test-plan', label: 'Test plan', stage: 'outer', desc: 'Write failing tests and an AC verification script.', est: '10m' },
  { name: 'implementation-plan', label: 'Implementation plan', stage: 'inner', desc: 'Task-by-task plan with exact file paths.', est: '12m' },
  { name: 'definition-of-ready', label: 'Definition of ready', stage: 'outer', desc: 'Sign off scope, tests, and architecture before coding.', est: '8m' },
  { name: 'review', label: 'Review', stage: 'outer', desc: 'Quality-check stories for traceability and scope discipline.', est: '10m' }
];

// Audit logger — replaced via setLogger() in tests and production bootstrap
let _logger = {
  info: (/* event, data */) => {},
  warn: (/* event, data */) => {}
};

// Injectable getPendingActions implementation (replaced in integration tests)
let _getPendingActions = defaultGetPendingActions;

function setLogger(logger) { _logger = logger; }
function setGetPendingActions(fn) { _getPendingActions = fn; }

/**
 * Map the real getPendingActions() adapter shape
 * ({ items: [{featureName, artefactType, daysPending, artefactUrl}], bannerMessage }) into the
 * shape renderDashboard() expects ({ actions: [{what, feature, age, you}], pendingActionsCount }).
 *
 * dsa-s2 Task 2 code-quality review: `raw.bannerMessage` (e.g. "Some
 * repositories could not be checked") is intentionally NOT surfaced here --
 * renderDashboard()'s own data contract has no banner-rendering slot for it.
 * This is a real, deliberate scope boundary (AC5 only asks for the pending
 * item list), not an oversight -- a future story would need to add a banner
 * slot to renderDashboard() before this could be wired through.
 * @param {{items: Array, bannerMessage: (string|null)}} raw
 * @returns {{actions: Array, pendingActionsCount: number}}
 */
function _mapPendingActionsForDashboard(raw) {
  const items = (raw && raw.items) || [];
  const actions = items.map(function(item) {
    return {
      what: 'Sign off ' + item.artefactType,
      feature: item.featureName,
      age: item.daysPending === 0 ? 'today' : (Math.max(0, item.daysPending) + 'd ago'),
      you: true
    };
  });
  return { actions: actions, pendingActionsCount: items.length };
}

/**
 * dsa-s2 Task 3 -- format an ISO completedAt timestamp as a relative-day
 * string ('today' / 'Nd ago'), matching the exact convention
 * _mapPendingActionsForDashboard() already uses for the pending-actions
 * `age` field (Task 2, AC5). dashboard-view.js's recent-sessions markup
 * (views/dashboard-view.js) does no formatting of its own -- it directly
 * `escHtml(r.when)`s whatever string is supplied, the same way it directly
 * `escHtml(a.age)`s the pending-actions field -- so a raw ISO timestamp
 * would render unformatted in the UI if not converted here first.
 * @param {string} isoString
 * @returns {string}
 */
function _formatCompletedAgo(isoString) {
  const completedMs = new Date(isoString).getTime();
  if (Number.isNaN(completedMs)) return isoString;
  const days = Math.max(0, Math.floor((Date.now() - completedMs) / (24 * 60 * 60 * 1000)));
  return days === 0 ? 'today' : (days + 'd ago');
}

/**
 * Derive dashboard in-progress-count and recent-sessions data from real
 * journey-store data (listJourneys()). dsa-s2 Task 3 (AC7).
 *
 * inProgressCount counts journeys where complete === false.
 * recent flattens every journey's completedStages into a single list, sorted
 * newest-first by the raw completedAt timestamp (before relative-day
 * formatting -- sorting on the formatted 'Nd ago' string would be lexically
 * wrong, e.g. '10d ago' < '2d ago'), then capped at topN. renderDashboard()'s
 * own data contract for data.recent is {skill,feature,when,stage,tone} (see
 * views/dashboard-view.js JSDoc); pillBg/pillColor are additionally carried
 * as CSS custom-property token references for callers that need direct
 * color values rather than the named `tone` renderDashboard()'s pill()
 * component consumes.
 * @param {Array} journeys - real journey objects from listJourneys()
 * @param {number} topN - max recent-session entries to return
 * @returns {{inProgressCount: number, recent: Array}}
 */
function _deriveDashboardJourneyData(journeys, topN) {
  const inProgressCount = journeys.filter(function(j) { return !j.complete; }).length;
  const allStages = [];
  journeys.forEach(function(j) {
    (j.completedStages || []).forEach(function(cs) {
      allStages.push({
        skill: cs.skillName,
        feature: j.featureSlug,
        whenRaw: cs.completedAt,
        stage: 'done',
        tone: 'green',
        pillBg: 'var(--green-soft)',
        pillColor: 'var(--green)'
      });
    });
  });
  allStages.sort(function(a, b) { return a.whenRaw < b.whenRaw ? 1 : (a.whenRaw > b.whenRaw ? -1 : 0); });
  const recent = allStages.slice(0, topN).map(function(entry) {
    return {
      skill: entry.skill,
      feature: entry.feature,
      when: _formatCompletedAgo(entry.whenRaw),
      stage: entry.stage,
      tone: entry.tone,
      pillBg: entry.pillBg,
      pillColor: entry.pillColor
    };
  });
  return { inProgressCount: inProgressCount, recent: recent };
}

/**
 * GET /api/actions — return personalised action queue.
 * Requires authentication; returns 401 if no session.
 * @param {object} req
 * @param {object} res
 */
async function handleGetActions(req, res) {
  // API authentication check — return 401 JSON (not redirect) for API consumers
  const isAuthenticated = req.session &&
    req.session.userId !== undefined &&
    req.session.accessToken;
  if (!isAuthenticated) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  const userIdentity = {
    id:    req.session.userId,
    login: req.session.login
  };
  const token = req.session.accessToken;

  let result;
  try {
    result = await _getPendingActions(userIdentity, token);
  } catch (err) {
    _logger.warn('action_queue_error', { userId: userIdentity.id, reason: err.message });
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to load action queue' }));
    return;
  }

  // Audit log: user ID and item count only — never tokens or artefact content
  _logger.info('action_queue_load', {
    userId:    userIdentity.id,
    itemCount: result.items.length,
    timestamp: new Date().toISOString()
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(result));
}

/**
 * GET /dashboard — render the HTML shell dashboard for authenticated users.
 * Performs its own auth check and redirects to /auth/github when unauthenticated
 * (AC2: 302 → /auth/github). Renders renderShell with user login in header (AC1, AC3).
 * Writes audit log on every authenticated request.
 *
 * @param {object} req
 * @param {object} res
 */
async function handleDashboard(req, res) {
  // Auth check — redirect to /auth/github if no session token (AC2)
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }

  const userId = req.session.userId;
  const login  = req.session.login || '';
  // b2/d2: gates the Admin credits nav entry -- d2 replaces the inline
  // req.session.role check with the named, testable isEffectivelyAdmin()
  // helper (modules/impersonation.js), which keys off the EFFECTIVE role
  // (the impersonation target's role while impersonating, never the real
  // admin's own role) -- the exact security property AC2/AC3 name. The
  // underlying boolean value is unchanged for a non-impersonating session
  // (still req.session.role === 'admin', kept self-healed by requireAdmin's
  // own live role-check, sec-perf-s2).
  const isAdmin = isEffectivelyAdmin(req.session);
  // d2 (AC1): forward the active impersonation state (if any) so renderShell
  // can surface the persistent banner -- the shell decides whether to render
  // it; this route only supplies the data.
  const imp = req.session.impersonation;
  const impersonation = (imp && imp.active && imp.target)
    ? { active: true, targetLogin: imp.target.login, targetTenantId: imp.target.tenantId, csrfToken: await csrf.generateCsrfToken(req) }
    : null;

  // Audit log (per Coding Agent Instructions requirement)
  _logger.info('dashboard_accessed', {
    userId,
    route:     '/dashboard',
    timestamp: new Date().toISOString()
  });

  const now = new Date();
  // dsa-s2 -- 'en-US' is a placeholder locale, not wired to the real
  // per-user locale preference this codebase already has (routes/settings.js,
  // si-s2's timezone/date_format columns). Reading that preference is out of
  // scope for this story's own ACs (dashboard token/layout/data-wiring, not
  // a locale-preference feature) -- flagged here rather than left as an
  // unexplained hardcode, matching the placeholder-value comments below.
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  let pendingResult;
  try {
    pendingResult = await _getPendingActions({ id: userId, login: login }, req.session.accessToken);
  } catch (err) {
    _logger.warn('dashboard_pending_actions_error', { userId: userId, reason: err.message });
    pendingResult = { items: [], bannerMessage: null };
  }
  const mapped = _mapPendingActionsForDashboard(pendingResult);

  // dsa-s2 Task 3 (AC7) -- repo root resolved relative to THIS file's own
  // location (src/web-ui/routes/), not copied from server.js's __dirname
  // (src/web-ui/) -- routes/dashboard.js is one directory level deeper, so
  // it needs '../../..' where server.js uses '../..' to reach the same real
  // repo root (confirmed by direct path.resolve() comparison against
  // server.js's own _journeyRootForBee2 resolution, bee.2).
  let journeys;
  try {
    const repoRoot = process.env.COPILOT_REPO_PATH || path.resolve(__dirname, '../../..');
    const allJourneys = listJourneys(repoRoot);
    journeys = req.session.tenantId
      ? allJourneys.filter(function(j) { return j.tenantId === req.session.tenantId; })
      : allJourneys;
  } catch (err) {
    _logger.warn('dashboard_journeys_error', { userId: userId, reason: err.message });
    journeys = [];
  }
  const journeyData = _deriveDashboardJourneyData(journeys, 5);

  const bodyContent = renderDashboard({
    greetingName: login || 'there',
    dateLabel: dateLabel,
    pendingActionsCount: mapped.pendingActionsCount,
    inProgressCount: journeyData.inProgressCount,
    skills: _DASHBOARD_SKILLS_CATALOG,
    actions: mapped.actions,
    recent: journeyData.recent
  });
  const html = renderShell({
    title:       'Dashboard',
    bodyContent,
    user:        { login },
    active:      'dashboard',
    isAdmin,
    impersonation
  });

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

module.exports = {
  handleGetActions,
  handleDashboard,
  setLogger,
  setGetPendingActions,
  _mapPendingActionsForDashboard,
  _deriveDashboardJourneyData
};
