'use strict';

// server.js — Node.js HTTP server entry point for web-ui
// Uses built-in http module — zero external npm dependencies.
// Session middleware, auth routes, health handler, and authGuard mounted here.

const http = require('http');
const { URL } = require('url');

const { sessionMiddleware }                                          = require('./middleware/session');
const { handleAuthGithub, handleAuthCallback, handleLogout, authGuard } = require('./routes/auth');
const { handleArtefactRoute }                                        = require('./routes/artefact');
const { handleSignOff, handleArtefactRead }                             = require('./routes/sign-off');
const { healthCheckHandler }                                         = require('./routes/health');
const { validateRequiredEnvVars }                                    = require('./config/validate-env');
const { handleGetActions, handleDashboard, handleGetActionsHtml }                          = require('./routes/dashboard');
const { handleGetFeatures, handleGetFeatureArtefacts }               = require('./routes/features');
const { handleGetStatus, handleGetStatusExport }                     = require('./routes/status');
const { handlePostAnnotation }                                       = require('./routes/annotation');   // wuce.8
const { handleExecuteSkill }                                         = require('./routes/execute');        // wuce.9
const { handleGetSkills, handlePostSession, handlePostAnswer, handleGetSessionState, handleCommitArtefact, handleResumeSession, handleGetSkillsHtml, handlePostSkillSessionHtml, handleGetQuestionHtml, handlePostAnswerHtml, handleGetCommitPreviewHtml, handlePostCommitHtml, handleGetResultHtml, registerHtmlSession, htmlGetNextQuestion, htmlRecordAnswer, htmlGetPreview, htmlCommitSession } = require('./routes/skills'); // wuce.13 / wuce.23 / wuce.24 / wuce.25
const { setLogger }                                                  = require('./routes/auth');
const { setFetchPipelineState }                                      = require('./adapters/feature-list');
const { setFetchArtefactDirectory }                                  = require('./adapters/artefact-list');
const skillsAdapter                                                  = require('./adapters/skills');          // wuce.23 HTML form wiring
const { listAvailableSkills }                                        = require('../adapters/skill-discovery'); // wuce.23 skill list
const sessionManager                                                 = require('../modules/session-manager'); // wuce.23 session creation
const _path                                                          = require('path');                       // wuce.23 session ID extraction

const PORT = process.env.PORT || 3000;
const GITHUB_API_BASE = process.env.GITHUB_API_BASE_URL || 'https://api.github.com';

// Wire up console logger for auth events (login, logout, state_mismatch)
setLogger({
  info: (event, data) => console.log(`[auth] ${event}`, JSON.stringify(data)),
  warn: (event, data) => console.warn(`[auth] ${event}`, JSON.stringify(data))
});

// Wire skill list + session creation — active in production AND when
// WIRE_SKILL_ADAPTERS=true (used by playwright.local.config.js to test adapter
// wiring while keeping NODE_ENV=test for session seeding).
// Both operations are filesystem-only and require no GitHub token.
if (process.env.NODE_ENV !== 'test' || process.env.WIRE_SKILL_ADAPTERS === 'true') {
  const _repoRoot = process.env.COPILOT_REPO_PATH || _path.resolve(__dirname, '../..');
  skillsAdapter.setListSkills(async function(_token) {
    return listAvailableSkills(_repoRoot);
  });
  skillsAdapter.setCreateSession(async function(skillName, _token) {
    const sessionPath = sessionManager.createSession('html-' + skillName);
    const id = _path.basename(sessionPath);
    registerHtmlSession(id, sessionPath, skillName);
    return { id };
  });
  skillsAdapter.setGetNextQuestion(async function(skillName, sessionId, _token) {
    return htmlGetNextQuestion(skillName, sessionId);
  });
  skillsAdapter.setSubmitAnswer(async function(skillName, sessionId, answer, _token) {
    return htmlRecordAnswer(skillName, sessionId, answer) || { nextUrl: '/skills/' + encodeURIComponent(skillName) };
  });
  skillsAdapter.setGetCommitPreview(async function(skillName, sessionId, _token) {
    return htmlGetPreview(skillName, sessionId);
  });
  skillsAdapter.setCommitSession(async function(skillName, sessionId, token) {
    return htmlCommitSession(skillName, sessionId, token, { login: '', email: 'web-ui@localhost' });
  });
}

// Wire real GitHub pipeline-state fetcher for production (non-test) mode.
// Fetches .github/pipeline-state.json from the given owner/repo using the user's token.
if (process.env.NODE_ENV !== 'test') {
  // Wire real GitHub Contents API for listing artefacts in a feature directory.
  setFetchArtefactDirectory(async (owner, repo, featureSlug, token) => {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/artefacts/${featureSlug}`;
    let response;
    try {
      response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept':        'application/vnd.github.v3+json'
        }
      });
    } catch (err) {
      console.error('[artefact-list] network error fetching artefact directory', err.message);
      return null;
    }
    if (!response.ok) {
      console.warn('[artefact-list] artefact directory fetch failed', response.status, owner, repo, featureSlug);
      return null;
    }
    return response.json();
  });

  setFetchPipelineState(async (owner, repo, token) => {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/.github/pipeline-state.json`;
    let response;
    try {
      response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept':        'application/vnd.github.v3+json'
        }
      });
    } catch (err) {
      console.error('[feature-list] network error fetching pipeline-state', err.message);
      return null;
    }
    if (!response.ok) {
      console.warn('[feature-list] pipeline-state fetch failed', response.status, owner, repo);
      return null;
    }
    const data = await response.json();
    const decoded = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
    return JSON.parse(decoded);
  });
}

// ── Test-mode infrastructure (NODE_ENV=test only) ─────────────────────────
// Pre-seed a well-known test session and override the artefact fetcher with
// fixture files so E2E tests can authenticate and render artefacts without
// hitting the real GitHub API.
//
// E2E_SESSION_ID is a 64-char hex string that Playwright's auth fixture
// injects as the `session_id` cookie.  The session has an accessToken so
// the authGuard passes on every protected route.
//
// SECURITY: The seeded token ('e2e-test-access-token') is not a real GitHub
// credential.  The test fetcher is never active outside NODE_ENV=test.
if (process.env.NODE_ENV === 'test') {
  const { seedTestSession }          = require('./middleware/session');
  const { setFetcher }               = require('./routes/artefact');
  const { ArtefactNotFoundError }    = require('./adapters/artefact-fetcher');
  const _fs   = require('fs');
  const _path = require('path');

  // Well-known session ID shared between server and auth fixture.
  const E2E_SESSION_ID = 'e2e' + '0'.repeat(60) + '1';
  seedTestSession(E2E_SESSION_ID, {
    accessToken: 'e2e-test-access-token',
    userId:      9999,
    login:       'e2e-tester',
  });

  // Fixture fetcher: serves <type>-sample.md for the canonical test slug;
  // throws ArtefactNotFoundError for any other slug (exercises the 404 path).
  const FIXTURE_DIR  = _path.join(__dirname, '../../tests/fixtures/markdown');
  const TEST_SLUG    = '2026-05-02-web-ui-copilot-execution-layer';
  setFetcher(function e2eTestFetcher(slug, artefactType) {
    if (slug !== TEST_SLUG) {
      return Promise.reject(new ArtefactNotFoundError(slug, artefactType));
    }
    const fixturePath = _path.join(FIXTURE_DIR, artefactType + '-sample.md');
    if (!_fs.existsSync(fixturePath)) {
      return Promise.reject(new ArtefactNotFoundError(slug, artefactType));
    }
    return Promise.resolve(_fs.readFileSync(fixturePath, 'utf8'));
  });
}

/** Parse query parameters from a URL into a plain object. */
function parseQuery(searchParams) {
  const result = {};
  for (const [key, val] of searchParams.entries()) {
    result[key] = val;
  }
  return result;
}

/**
 * Route and handle an incoming request.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
async function router(req, res) {
  const parsed   = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsed.pathname;

  req.query = parseQuery(parsed.searchParams);

  // ── Test-mode session-seed endpoint (NODE_ENV=test only) ─────────────────
  // Must be handled BEFORE sessionMiddleware to avoid a double Set-Cookie.
  // Playwright's withAuth fixture calls this to re-seed the test session
  // (handles cases where a prior test consumed/mutated it, e.g. via logout).
  if (pathname === '/test/session' && req.method === 'GET' && process.env.NODE_ENV === 'test') {
    const { seedTestSession } = require('./middleware/session');
    const E2E_SESSION_ID = 'e2e' + '0'.repeat(60) + '1';
    seedTestSession(E2E_SESSION_ID, {
      accessToken: 'e2e-test-access-token',
      userId:      9999,
      login:       'e2e-tester',
    });
    // No Set-Cookie returned — the fixture injects the cookie via storageState.
    // Returning Set-Cookie (SameSite=Strict) would overwrite the fixture's
    // SameSite=Strict cookie and break first-navigation auth in tests.
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ sessionId: E2E_SESSION_ID, login: 'e2e-tester' }));
    return;
  }

  // Attach session before routing
  sessionMiddleware(req, res);

  if (pathname === '/auth/github' && req.method === 'GET') {
    await handleAuthGithub(req, res);

  } else if (pathname === '/auth/github/callback' && req.method === 'GET') {
    await handleAuthCallback(req, res);

  } else if (pathname === '/auth/logout' && req.method === 'GET') {
    await handleLogout(req, res);

  } else if (pathname === '/sign-off' && req.method === 'POST') {
    authGuard(req, res, () => handleSignOff(req, res));

  } else if (pathname === '/api/actions' && req.method === 'GET') {
    await handleGetActions(req, res);

  } else if (pathname === '/status/export' && req.method === 'GET') {
    await handleGetStatusExport(req, res);

  } else if (pathname === '/status' && req.method === 'GET') {
    await handleGetStatus(req, res);

  } else if (pathname === '/actions' && req.method === 'GET') {
    authGuard(req, res, async () => {
      await handleGetActionsHtml(req, res);
    });

  } else if (pathname === '/dashboard') {
    handleDashboard(req, res);

  } else if (pathname.match(/^\/artefact\/[^/]+\/[^/]+$/) && req.method === 'GET') {
    const parts        = pathname.split('/').filter(Boolean);
    const slug         = parts[1];
    const artefactType = parts[2];
    await handleArtefactRoute(req, res, slug, artefactType);

  } else if (pathname === '/health') {
    healthCheckHandler(req, res);

  } else if (pathname === '/features' && req.method === 'GET') {
    authGuard(req, res, async () => {
      await handleGetFeatures(req, res);
    });

  } else if (pathname.startsWith('/features/') && req.method === 'GET') {
    const featureSlug = pathname.slice('/features/'.length);
    authGuard(req, res, async () => {
      await handleGetFeatureArtefacts(req, res, featureSlug);
    });

  } else if (pathname.startsWith('/api/artefacts/') && pathname.endsWith('/annotations') && req.method === 'POST') {
    authGuard(req, res, async () => {
      await handlePostAnnotation(req, res);
    });

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/execute$/) && req.method === 'POST') {
    const skillNameParam = pathname.split('/')[3];
    req.params = { name: skillNameParam };
    await handleExecuteSkill(req, res);

  } else if (pathname === '/skills' && req.method === 'GET') {
    authGuard(req, res, async () => {
      await handleGetSkillsHtml(req, res);
    });

  } else if (pathname.match(/^\/skills\/[^/]+\/sessions\/[^/]+\/commit-preview$/) && req.method === 'GET') {
    const parts = pathname.split('/');
    req.params = { name: parts[2], id: parts[4] };
    authGuard(req, res, async () => { await handleGetCommitPreviewHtml(req, res); });

  } else if (pathname.match(/^\/skills\/[^/]+\/sessions\/[^/]+\/result$/) && req.method === 'GET') {
    const parts = pathname.split('/');
    req.params = { name: parts[2], id: parts[4] };
    authGuard(req, res, async () => { await handleGetResultHtml(req, res); });

  } else if (pathname.match(/^\/skills\/[^/]+\/sessions\/[^/]+\/next$/) && req.method === 'GET') {
    const parts = pathname.split('/');
    req.params = { name: parts[2], id: parts[4] };
    authGuard(req, res, async () => {
      await handleGetQuestionHtml(req, res);
    });

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/answer$/) && req.method === 'POST') {
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5] };
    authGuard(req, res, async () => {
      await handlePostAnswerHtml(req, res);
    });

  } else if (pathname === '/api/skills' && req.method === 'GET') {
    await handleGetSkills(req, res);

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions$/) && req.method === 'POST') {
    const skillNameParam = pathname.split('/')[3];
    req.params = { name: skillNameParam };
    const ct = (req.headers['content-type'] || '');
    if (ct.includes('application/x-www-form-urlencoded')) {
      authGuard(req, res, async () => { await handlePostSkillSessionHtml(req, res); });
    } else {
      await handlePostSession(req, res);
    }

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/answers$/) && req.method === 'POST') {
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5] };
    await handlePostAnswer(req, res);

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/state$/) && req.method === 'GET') {
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5] };
    await handleGetSessionState(req, res);

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/commit$/) && req.method === 'POST') {
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5] };
    const ct = (req.headers['content-type'] || '');
    if (ct.includes('application/x-www-form-urlencoded')) {
      authGuard(req, res, async () => { await handlePostCommitHtml(req, res); });
    } else {
      await handleCommitArtefact(req, res);
    }

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/resume$/) && req.method === 'GET') {
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5] };
    await handleResumeSession(req, res);

  } else if (pathname === '/api/me' && req.method === 'GET') {
    const authenticated = !!(req.session && req.session.accessToken);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      authenticated,
      login: authenticated ? (req.session.login || null) : null,
      sessionId: req.sessionId
    }));

  } else {
    // Sign-in page (unauthenticated root)
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<html><body><h1>Sign in with GitHub</h1><a href="/auth/github">Sign in with GitHub</a></body></html>');
  }
}

/** Create and return the HTTP server instance. */
function createApp() {
  return http.createServer((req, res) => {
    router(req, res).catch((err) => {
      console.error('[router error]', err.message, err.stack);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    });
  });
}

if (require.main === module) {
  try {
    validateRequiredEnvVars();
  } catch (err) {
    console.error('[startup] ' + err.message);
    process.exit(1);
  }
  const server = createApp();
  server.listen(PORT, () => {
    const gheMode = !!process.env.GITHUB_API_BASE_URL;
    console.log(`Web UI server listening on port ${PORT}`);
    console.log(`GitHub hostname: ${process.env.GITHUB_API_BASE_URL || 'github.com'} (Enterprise mode: ${gheMode})`);
  });
}

module.exports = { createApp, router };
