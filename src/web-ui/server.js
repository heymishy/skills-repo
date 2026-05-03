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
const { handleGetActions }                                           = require('./routes/dashboard');
const { handleGetFeatures, handleGetFeatureArtefacts }               = require('./routes/features');
const { handleGetStatus, handleGetStatusExport }                     = require('./routes/status');
const { handlePostAnnotation }                                       = require('./routes/annotation');   // wuce.8
const { handleExecuteSkill }                                         = require('./routes/execute');        // wuce.9
const { handleGetSkills, handlePostSession, handlePostAnswer }       = require('./routes/skills');          // wuce.13

const PORT = process.env.PORT || 3000;

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
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie':   `session_id=${E2E_SESSION_ID}; HttpOnly; SameSite=Strict; Path=/`,
    });
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

  } else if (pathname === '/dashboard') {
    authGuard(req, res, () => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html><body><h1>Dashboard</h1></body></html>');
    });

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

  } else if (pathname === '/api/skills' && req.method === 'GET') {
    await handleGetSkills(req, res);

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions$/) && req.method === 'POST') {
    const skillNameParam = pathname.split('/')[3];
    req.params = { name: skillNameParam };
    await handlePostSession(req, res);

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/answers$/) && req.method === 'POST') {
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5] };
    await handlePostAnswer(req, res);

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
