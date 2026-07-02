'use strict';

// server.js — Node.js HTTP server entry point for web-ui
// Uses built-in http module — zero external npm dependencies.
// Session middleware, auth routes, health handler, and authGuard mounted here.

const http = require('http');
const { URL } = require('url');

const { sessionMiddleware }                                          = require('./middleware/session');
const { handleLanding }                                              = require('./routes/landing');     // bee.1
const { handleAuthGithub, handleAuthCallback, handleLogout, authGuard } = require('./routes/auth');
const { handleArtefactRoute }                                        = require('./routes/artefact');
const { handleSignOff, handleArtefactRead }                             = require('./routes/sign-off');
const { healthCheckHandler }                                         = require('./routes/health');
const { validateRequiredEnvVars }                                    = require('./config/validate-env');
const { handleGetActions, handleDashboard, handleGetActionsHtml }                          = require('./routes/dashboard');
const { handleGetFeatures, handleGetFeatureArtefacts, handleGetIdeas, handlePostIdea, handleDeleteIdea } = require('./routes/features');
const { handleGetStatus, handleGetStatusExport }                     = require('./routes/status');
const { handlePostAnnotation }                                       = require('./routes/annotation');   // wuce.8
const { handleExecuteSkill }                                         = require('./routes/execute');        // wuce.9
const { handleGetSkills, handlePostSession, handlePostAnswer, handleGetSessionState, handleCommitArtefact, handleResumeSession, handleGetSkillsHtml, handlePostSkillSessionHtml, handleGetQuestionHtml, handlePostAnswerHtml, handleGetCommitPreviewHtml, handlePostCommitHtml, handleGetResultHtml, registerHtmlSession, htmlGetNextQuestion, htmlGetPreview, htmlCommitSession, htmlGetCompletePage, handleGetChatHtml, handlePostTurnHtml, handlePostTurnStreamHtml, handlePostAssumptionConfirm, handlePostCanvasEditHtml } = require('./routes/skills'); // wuce.13 / wuce.23 / wuce.24 / wuce.25 / dsq.3 / mfc.1 / mfc.3 / iwu.4 / dic.5
const { setLogger, setFetchOrgs }                                    = require('./routes/auth');
const { setFetchPipelineState }                                      = require('./adapters/feature-list');
const { setFetchArtefactDirectory }                                  = require('./adapters/artefact-list');
const skillsAdapter                                                  = require('./adapters/skills');          // wuce.23 HTML form wiring
const { listAvailableSkills }                                        = require('../adapters/skill-discovery'); // wuce.23 skill list
const sessionManager                                                 = require('../modules/session-manager'); // wuce.23 session creation
const _path                                                          = require('path');                       // wuce.23 session ID extraction
const { handleGetJourney, handlePostJourney, handleGetJourneyResume, handleGetStageReview, handleGetReference, handlePostReference, handlePostReferenceUpload, handleGetReferenceModal, handleGetReferenceModalStart, handlePostReferenceModalSkip, handlePostGateConfirm, handleGetStories, handlePostStories, handleGetJourneyComplete, handleGetStageControls, handlePostEstimate, handlePostSpike, handlePatchSpike, handleGetTrace, handlePostDecisions, handlePostSideTripClarify, handleDeleteSideTrip, handleGetJourneyState, setPipelineStateWriter, setValidate, setWriteTrace, handleGetWizard, handlePostWizardSelection, handleJourneys, setListJourneys } = require('./routes/journey'); // ougl.3 / owle.1-6 / wucp.4 / sdg.1 / bee.2
const pipelineStateWriterFactory                                     = require('./adapters/pipeline-state-writer'); // owle.6
const { setToolExecutor }                                            = require('./modules/tool-executor'); // wucp.3
const { setCreditsAdapter }                                          = require('./modules/credits');       // lab-s3.1

const PORT = process.env.PORT || 3000;
const GITHUB_API_BASE = process.env.GITHUB_API_BASE_URL || 'https://api.github.com';

// Wire up console logger for auth events (login, logout, state_mismatch)
const _ts = () => new Date().toISOString();
setLogger({
  info: (event, data) => console.log(`[auth] ${event}`, JSON.stringify(Object.assign({ timestamp: _ts() }, data))),
  warn: (event, data) => console.warn(`[auth] ${event}`, JSON.stringify(Object.assign({ timestamp: _ts() }, data)))
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
  skillsAdapter.setGetCommitPreview(async function(skillName, sessionId, _token) {
    return htmlGetPreview(skillName, sessionId);
  });
  skillsAdapter.setCommitSession(async function(skillName, sessionId, token, login) {
    const name = login || 'web-ui';
    return htmlCommitSession(skillName, sessionId, token, { name, email: name + '@users.noreply.github.com' });
  });

  // wucp.3 — wire real fs adapter for tool execution loop (read_file / list_dir)
  const _repoRootForTools = process.env.COPILOT_REPO_PATH || _path.resolve(__dirname, '../..');
  setToolExecutor(function(verb, resolvedPath) {
    var _fs = require('fs');
    if (verb === 'list_dir') {
      return _fs.readdirSync(resolvedPath).join('\n');
    }
    return _fs.readFileSync(resolvedPath, 'utf8');
  });

  // sec-perf AC1 — rate limiter for SSE turn endpoint (30 turns/min per tenant)
  const { createRateLimiter } = require('./middleware/rate-limiter');
  const _turnStreamRateLimiter = createRateLimiter({ maxRequests: 30, windowMs: 60000 });

  // mfc.1 — wire real Copilot API executor for model-first chat turns
  const { skillTurnExecutor: realSkillTurnExecutor, skillTurnExecutorStream: realSkillTurnExecutorStream } = require('../modules/skill-turn-executor');
  const { setSkillTurnExecutorAdapter, setSkillTurnExecutorStreamAdapter, setSessionStore: _setSessionStore, _setHtmlSession: _restoreHtmlSession, startSessionEviction } = require('./routes/skills');
  setSkillTurnExecutorAdapter(realSkillTurnExecutor);
  setSkillTurnExecutorStreamAdapter(realSkillTurnExecutorStream);
  // _nextQuestionExecutorAdapter and _sectionDraftExecutorAdapter are no-ops (AC9 — mfc.1);
  // no wiring required.

  // wsm.1 — wire disk session persistence adapter and restore sessions on startup
  const _diskSessionStoreAdapter = require('./adapters/session-store');
  _setSessionStore(_diskSessionStoreAdapter);
  _diskSessionStoreAdapter.loadSessions(_restoreHtmlSession);

  // wsm.2 — prune stale skill sessions from in-process _sessionStore hourly
  startSessionEviction();

  // jdsk.1 — wire journey disk adapter and reload journeys from workspace/journeys/
  const _journeyStore = require('./modules/journey-store');
  const _journeyRoot  = process.env.COPILOT_REPO_PATH || _path.resolve(__dirname, '../..');
  if (process.env.DATABASE_URL) {
    // p3.1 — Postgres journey persistence (Neon free tier, see Decision 9)
    const _journeyPg = require('./adapters/journey-store-pg');
    _journeyStore.setPgAdapter(_journeyPg);
    // Auto-migrate schema on startup then load journeys (CREATE TABLE IF NOT EXISTS is idempotent)
    _journeyPg.migrateSchema()
      .then(function() { return _journeyStore.loadAllFromPg(); })
      .catch(function(err) {
        console.error('[server] Postgres startup failed:', err.message);
      });
  } else {
    const _journeyDisk = require('../modules/journey-disk');
    _journeyStore.setDiskAdapter(_journeyDisk);
    _journeyStore.loadAllFromDisk(_journeyRoot);
  }

  // bee.2 — Task 3: wire listJourneys adapter for GET /journeys (D37 separate wiring task)
  {
    const _journeyStoreForBee2 = require('./modules/journey-store');
    const _journeyRootForBee2  = process.env.COPILOT_REPO_PATH || _path.resolve(__dirname, '../..');
    setListJourneys(async function(tenantId) {
      var all = _journeyStoreForBee2.listJourneys(_journeyRootForBee2);
      return tenantId ? all.filter(function(j) { return j.tenantId === tenantId; }) : all;
    });
  }

  // lab-s3.1 — Wire credits DB adapter (D37 mandatory separate wiring task)
  if (process.env.DATABASE_URL) {
    const { Pool } = require('pg');
    const _creditsPool = new Pool({ connectionString: process.env.DATABASE_URL });
    setCreditsAdapter(_creditsPool);
    console.log('Credits DB adapter wired');
  }

  // p3.2 — Upstash Redis session persistence (see Decision 9)
  if (process.env.UPSTASH_REDIS_REST_URL) {
    const _sessionRedis = require('./adapters/session-redis');
    const { setRedisAdapter, loadSessionsFromRedis } = require('./middleware/session');
    setRedisAdapter(_sessionRedis);
    loadSessionsFromRedis().catch(function(err) {
      console.error('[server] loadSessionsFromRedis failed:', err.message);
    });

    // wsm.2 — Skill session Redis persistence: turns survive Fly.io deploys
    const _skillSessionRedis = require('./adapters/skill-session-redis');
    const { setSkillSessionRedisAdapter, readSessionFromRedis, mergeRedisSessionData } = require('./routes/skills');
    const { setReadSessionFromRedis, setMergeRedisSessionData } = require('./routes/journey');
    setSkillSessionRedisAdapter(_skillSessionRedis);
    setReadSessionFromRedis(readSessionFromRedis);
    setMergeRedisSessionData(mergeRedisSessionData);
  }
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
    // Local-first: read from disk when running locally so in-flight branch work is visible.
    const _fs        = require('fs');
    const _repoRoot  = process.env.COPILOT_REPO_PATH || _path.resolve(__dirname, '../..');
    const _localPath = _path.join(_repoRoot, '.github', 'pipeline-state.json');
    if (_fs.existsSync(_localPath)) {
      try {
        return JSON.parse(_fs.readFileSync(_localPath, 'utf8'));
      } catch (e) {
        console.warn('[feature-list] local pipeline-state parse error, falling back to GitHub API', e.message);
      }
    }

    // Remote fallback: fetch from GitHub API (used in production / remote repos)
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

// p1.1: Wire real GitHub org-fetch for tenant resolution (D37 rule 3 — separate wiring task)
if (process.env.NODE_ENV !== 'test') {
  setFetchOrgs(async function(accessToken, page) {
    const url = GITHUB_API_BASE + '/user/orgs?per_page=100&page=' + (page || 1);
    const response = await fetch(url, {
      headers: {
        'Authorization': 'token ' + accessToken,
        'Accept':        'application/json',
        'User-Agent':    'skills-pipeline-web-ui'
      }
    });
    if (!response.ok) {
      throw new Error('GitHub orgs fetch failed: ' + response.status);
    }
    const orgs = await response.json();
    const link = response.headers.get('link') || '';
    const nextMatch = link.match(/<[^>]+[?&]page=(\d+)[^>]*>;\s*rel="next"/);
    const nextPage = nextMatch ? parseInt(nextMatch[1], 10) : null;
    return { orgs: orgs, nextPage: nextPage };
  });
}

// owle.6: Wire pipeline-state auto-writer (runs on every gate-confirm success)
{
  const repoRootForAdapter = process.env.COPILOT_REPO_PATH || _path.resolve(__dirname, '../..');
  if (process.env.NODE_ENV === 'test') {
    setPipelineStateWriter(function() {}); // no-op in test mode
  } else {
    setPipelineStateWriter(pipelineStateWriterFactory(repoRootForAdapter));
  }
}

// cdg.4: Wire validate adapter — DoR gate-confirm enforcement (D37 mandatory separate wiring)
{
  if (process.env.NODE_ENV === 'test') {
    setValidate(function() { return { exitCode: 0 }; }); // no-op in test mode
  } else {
    setValidate(require('../enforcement/cli-outer-loop').validate);
  }
}

// cdg.5: Wire writeTrace adapter -- gate-confirm chain-hash trace emission (D37 mandatory separate wiring)
{
  if (process.env.NODE_ENV === 'test') {
    setWriteTrace(function() {}); // no-op in test mode
  } else {
    setWriteTrace(require('../enforcement/governance-package').writeTrace);
  }
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

  // ── Stub skill turn stream adapter (NODE_ENV=test) ───────────────────────
  // Wires a canned streaming response so the definition canvas can be driven
  // from the browser without a real model API call or GitHub token.
  // Submit any turn in the chat and the stub returns a fixed definition artefact.
  const { setSkillTurnExecutorStreamAdapter } = require('./routes/skills');
  const _STUB_ARTEFACT = [
    '# Definition — Stub Feature',
    '',
    '**Slicing strategy:** vertical',
    '',
    '## Epic 1 — Platform Core',
    '',
    '### s.1 — Set up repository',
    '',
    'Complexity: 1',
    '',
    '### s.2 — Configure CI pipeline',
    '',
    'Complexity: 2',
    '',
    '## Epic 2 — Operator Tools',
    '',
    '### s.3 — Build operator dashboard',
    '',
    'Complexity: 2',
    '',
    '### s.4 — Add export feature',
    '',
    'Complexity: 1',
    '',
    '---ARTEFACT-COMPLETE---',
  ].join('\n');

  setSkillTurnExecutorStreamAdapter(function stubSkillTurnStream(_sys, _hist, _user, _token, onChunk) {
    // Stream the stub artefact in small chunks to exercise the chunked display path
    const words = _STUB_ARTEFACT.split(' ');
    let i = 0;
    return new Promise(function(resolve) {
      function next() {
        if (i >= words.length) { resolve(_STUB_ARTEFACT); return; }
        const chunk = (i === 0 ? '' : ' ') + words[i++];
        onChunk(chunk);
        setTimeout(next, 8);
      }
      next();
    });
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
    // Return Set-Cookie so Playwright's APIRequestContext (page.request) stores
    // the session cookie in its own cookie jar. Without this, page.request.post()
    // doesn't send the cookie because APIRequestContext has a separate cookie store
    // from the browser context that context.addCookies() fills.
    // No Secure flag — we run on HTTP in test mode; SameSite=Lax allows API calls.
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie': `session_id=${E2E_SESSION_ID}; HttpOnly; SameSite=Lax; Path=/`,
    });
    res.end(JSON.stringify({ sessionId: E2E_SESSION_ID, login: 'e2e-tester' }));
    return;
  }

  // dic-canvas E2E: seed a definition session with stub artefact content
  if (pathname === '/test/seed-definition-session' && req.method === 'POST' && process.env.NODE_ENV === 'test') {
    const { _setHtmlSession } = require('./routes/skills');
    const _uid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const _sessionId = 'def-e2e-' + _uid;
    _setHtmlSession(_sessionId, {
      skillName:      'definition',
      sessionPath:    null,
      systemPrompt:   'test',
      turns:          [],
      artefactContent: [
        '# Definition — E2E Canvas Test Feature',
        '',
        '**Slicing strategy:** vertical',
        '',
        '## Epic 1 — Platform Core',
        '',
        '### s.1 — Set up repo',
        '',
        'Complexity: 1',
        '',
        '### s.2 — Configure CI',
        '',
        'Complexity: 2',
        '',
        '## Epic 2 — Operator Tools',
        '',
        '### s.3 — Build dashboard',
        '',
        'Complexity: 2',
        '',
      ].join('\n'),
      artefactPath:   null,
      done:           false,
      journeyId:      null,
      phaseModel:     [{ name: 'Phase 1 (current)', isCurrent: true }],
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ sessionId: _sessionId }));
    return;
  }

  // ── /test/canvas — one-shot browser shortcut (NODE_ENV=test only) ──────────
  // GET this URL in the browser to:
  //   1. authenticate as e2e-tester (no GitHub OAuth needed)
  //   2. seed a definition session with stub artefact content
  //   3. redirect straight to the canvas chat page
  // The stub skill-turn adapter (wired above) returns a canned definition
  // artefact when you submit any turn, so the full drag/add/apply flow is
  // testable without a real model API call or GitHub token.
  if (pathname === '/test/canvas' && req.method === 'GET' && process.env.NODE_ENV === 'test') {
    const { seedTestSession } = require('./middleware/session');
    const { _setHtmlSession } = require('./routes/skills');
    const E2E_SESSION_ID = 'e2e' + '0'.repeat(60) + '1';
    seedTestSession(E2E_SESSION_ID, {
      accessToken: 'e2e-test-access-token',
      userId:      9999,
      login:       'e2e-tester',
    });
    const _uid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const _defSessionId = 'def-e2e-' + _uid;
    _setHtmlSession(_defSessionId, {
      skillName:      'definition',
      sessionPath:    null,
      systemPrompt:   'test',
      turns:          [],
      artefactContent: [
        '# Definition — Stub Canvas Feature',
        '',
        '**Slicing strategy:** vertical',
        '',
        '## Epic 1 — Platform Core',
        '',
        '### s.1 — Set up repository',
        '',
        'Complexity: 1',
        '',
        '### s.2 — Configure CI pipeline',
        '',
        'Complexity: 2',
        '',
        '## Epic 2 — Operator Tools',
        '',
        '### s.3 — Build operator dashboard',
        '',
        'Complexity: 2',
        '',
        '### s.4 — Add export feature',
        '',
        'Complexity: 1',
        '',
      ].join('\n'),
      artefactPath:   null,
      done:           false,
      journeyId:      null,
      phaseModel:     [{ name: 'Phase 1 (current)', isCurrent: true }],
    });
    res.writeHead(302, {
      'Location':   `/skills/definition/sessions/${_defSessionId}/chat`,
      'Set-Cookie': `session_id=${E2E_SESSION_ID}; HttpOnly; SameSite=Lax; Path=/`,
    });
    res.end();
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

  } else if (pathname === '/api/ideas' && req.method === 'GET') {
    authGuard(req, res, () => handleGetIdeas(req, res));

  } else if (pathname === '/api/ideas' && req.method === 'POST') {
    authGuard(req, res, async () => { await handlePostIdea(req, res); });

  } else if (pathname.match(/^\/api\/ideas\/[^/]+$/) && req.method === 'DELETE') {
    const ideaId = decodeURIComponent(pathname.slice('/api/ideas/'.length));
    authGuard(req, res, () => handleDeleteIdea(req, res, ideaId));

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

  } else if (pathname.match(/^\/skills\/[^/]+\/sessions\/[^/]+\/complete$/) && req.method === 'GET') {
    // dsq.3 — post-session /clarify gate page
    const parts = pathname.split('/');
    const skillName = decodeURIComponent(parts[2]);
    const sessionId = decodeURIComponent(parts[4]);
    authGuard(req, res, async () => {
      const html = htmlGetCompletePage(skillName, sessionId);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });

  } else if (pathname.match(/^\/skills\/[^/]+\/sessions\/[^/]+\/result$/) && req.method === 'GET') {
    const parts = pathname.split('/');
    req.params = { name: parts[2], id: parts[4] };
    authGuard(req, res, async () => { await handleGetResultHtml(req, res); });

  } else if (pathname.match(/^\/skills\/[^/]+\/sessions\/[^/]+\/chat$/) && req.method === 'GET') {
    // mfc.1 — model-first chat page (replaces /next form flow)
    const parts = pathname.split('/');
    req.params = { name: parts[2], id: parts[4] };
    authGuard(req, res, async () => {
      await handleGetChatHtml(req, res);
    });

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/turn$/) && req.method === 'POST') {
    // mfc.1 — model turn endpoint
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5] };
    authGuard(req, res, async () => {
      await handlePostTurnHtml(req, res);
    });

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/turn-stream$/) && req.method === 'POST') {
    // mfc.3 — streaming model turn endpoint (SSE)
    // sec-perf AC1: rate-limited to 30 turns/min per tenant to prevent Anthropic API abuse
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5] };
    authGuard(req, res, async () => {
      let _rlOk = false;
      _turnStreamRateLimiter(req, res, () => { _rlOk = true; });
      if (!_rlOk) return;
      await handlePostTurnStreamHtml(req, res);
    });

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/canvas-edit$/) && req.method === 'POST') {
    // dic.5 — canvas-edit dispatch endpoint
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5] };
    authGuard(req, res, async () => {
      await handlePostCanvasEditHtml(req, res);
    });

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/assumption\/[^/]+\/confirm$/) && req.method === 'POST') {
    // iwu.4 — confirm/flag assumption card endpoint
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5], cardId: parts[7] };
    authGuard(req, res, async () => {
      await handlePostAssumptionConfirm(req, res);
    });

  } else if (pathname.match(/^\/skills\/[^/]+\/sessions\/[^/]+\/next$/) && req.method === 'GET') {
    // backward-compat: redirect /next to /chat
    const parts = pathname.split('/');
    const skillNameBc = decodeURIComponent(parts[2]);
    const sessionIdBc = decodeURIComponent(parts[4]);
    res.writeHead(303, { Location: '/skills/' + encodeURIComponent(skillNameBc) + '/sessions/' + encodeURIComponent(sessionIdBc) + '/chat' });
    res.end();

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

  } else if (pathname === '/journey/wizard' && req.method === 'POST') {
    // wucp.4 — wizard feature selection POST
    await handlePostWizardSelection(req, res);

  } else if (pathname === '/journeys' && req.method === 'GET') {
    // bee.2 — first-run empty-state experience
    authGuard(req, res, async function() { await handleJourneys(req, res); });

  } else if (pathname === '/journey' && req.method === 'GET') {
    // jdsk.1 — journey home screen (replaces old wizard-first routing)
    {
      handleGetJourney(req, res);
    }

  } else if (pathname.match(/^\/journey\/[^/]+\/resume$/) && req.method === 'GET') {
    // step4 — resume journey: create new session for current stage
    req.params = { featureSlug: pathname.split('/')[2] };
    await handleGetJourneyResume(req, res);

  } else if (pathname.match(/^\/journey\/[^/]+\/stage-review$/) && req.method === 'GET') {
    // step5 — artefact review panel before gate-confirm
    req.params = { journeyId: pathname.split('/')[2] };
    await handleGetStageReview(req, res);

  } else if (pathname.match(/^\/journey\/[^/]+\/reference$/) && req.method === 'GET') {
    // step7 — reference docs list + upload form
    req.params = { journeyId: pathname.split('/')[2] };
    await handleGetReference(req, res);

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/reference$/) && req.method === 'POST') {
    // step7 — save reference doc
    req.params = { journeyId: pathname.split('/')[3] };
    await handlePostReference(req, res);

  } else if (pathname.match(/^\/journey\/[^/]+\/reference-modal$/) && req.method === 'GET') {
    // sdg.1 — strategy grounding modal (new-product upload gate)
    req.params = { journeyId: pathname.split('/')[2] };
    authGuard(req, res, async () => { await handleGetReferenceModal(req, res); });

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/reference-upload$/) && req.method === 'POST') {
    // sdg.1 — reference file upload handler (JSON body: {files:[{name,size,contentBase64}]})
    req.params = { journeyId: pathname.split('/')[3] };
    authGuard(req, res, async () => { await handlePostReferenceUpload(req, res); });

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/reference-modal\/start$/) && req.method === 'GET') {
    // sdg.1 — start first skill session after upload modal
    req.params = { journeyId: pathname.split('/')[3] };
    authGuard(req, res, async () => { await handleGetReferenceModalStart(req, res); });

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/reference-modal\/skip$/) && req.method === 'POST') {
    // sdg.1 — skip strategy grounding and proceed to first skill
    req.params = { journeyId: pathname.split('/')[3] };
    authGuard(req, res, async () => { await handlePostReferenceModalSkip(req, res); });

  } else if (pathname === '/api/journey' && req.method === 'POST') {
    // ougl.3 — start journey + discovery session
    await handlePostJourney(req, res);

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/gate-confirm$/) && req.method === 'POST') {
    // ougl.5 — gate-confirm: save artefact and advance to next stage
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    await handlePostGateConfirm(req, res);

  } else if (pathname.match(/^\/journey\/[^/]+\/stories$/) && req.method === 'GET') {
    // ougl.6 — per-story stage routing: story list entry form
    const journeyIdPart = pathname.split('/')[2];
    req.params = { journeyId: journeyIdPart };
    await handleGetStories(req, res);

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/stories$/) && req.method === 'POST') {
    // ougl.6 — per-story stage routing: set story list + start test-plan
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    await handlePostStories(req, res);

  } else if (pathname.match(/^\/journey\/[^/]+\/complete$/) && req.method === 'GET') {
    // ougl.7 — journey completion screen
    const journeyIdPart = pathname.split('/')[2];
    req.params = { journeyId: journeyIdPart };
    await handleGetJourneyComplete(req, res);

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/stage-controls$/) && req.method === 'GET') {
    // owle.1 — stage control flags (clarifyAvailable)
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    authGuard(req, res, () => handleGetStageControls(req, res));

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/side-trip\/clarify$/) && req.method === 'POST') {
    // owle.1 — open clarify side-trip
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    authGuard(req, res, async () => await handlePostSideTripClarify(req, res));

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/decisions$/) && req.method === 'POST') {
    // owle.2 — append decision entry to decisions.md
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    authGuard(req, res, async () => await handlePostDecisions(req, res));

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/trace$/) && req.method === 'GET') {
    // owle.3 — artefact chain trace
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    authGuard(req, res, async () => await handleGetTrace(req, res));

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/estimate$/) && req.method === 'POST') {
    // owle.4 — post estimate row to workspace/estimation-norms.md
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    authGuard(req, res, async () => await handlePostEstimate(req, res));

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/spikes\/[^/]+$/) && req.method === 'PATCH') {
    // owle.5 — record spike outcome
    const parts = pathname.split('/');
    req.params = { journeyId: parts[3], spikeSlug: parts[5] };
    authGuard(req, res, async () => await handlePatchSpike(req, res));

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/spikes$/) && req.method === 'POST') {
    // owle.5 — create spike
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    authGuard(req, res, async () => await handlePostSpike(req, res));

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/side-trip$/) && req.method === 'DELETE') {
    // owle.1 — close side-trip
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    authGuard(req, res, async () => await handleDeleteSideTrip(req, res));

  } else if (pathname.match(/^\/api\/journey\/[^/]+$/) && req.method === 'GET') {
    // owle.1 — journey state (excludes sideTripSessionId)
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    authGuard(req, res, () => handleGetJourneyState(req, res));

  } else if (pathname === '/api/me' && req.method === 'GET') {
    const authenticated = !!(req.session && req.session.accessToken);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      authenticated,
      login: authenticated ? (req.session.login || null) : null,
      sessionId: req.sessionId
    }));

  } else if (pathname === '/' && req.method === 'GET') {
    // bee.1 — public landing page (no auth required)
    await handleLanding(req, res);

  } else {
    // Sign-in page (unauthenticated root)
    const { renderLoginPage } = require('./utils/html-shell');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderLoginPage());
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
  process.on('unhandledRejection', function(reason) {
    console.error('[unhandledRejection]', reason && reason.stack ? reason.stack : reason);
  });
  process.on('uncaughtException', function(err) {
    console.error('[uncaughtException]', err && err.stack ? err.stack : err);
  });

  try {
    validateRequiredEnvVars();
  } catch (err) {
    console.error('[startup] ' + err.message);
    process.exit(1);
  }
  const server = createApp();
  server.listen(PORT, () => {
    const gheMode = !!process.env.GITHUB_API_BASE_URL;
    const startTs = new Date().toISOString();
    console.log(`[${startTs}] Web UI server listening on port ${PORT}`);
    console.log(`[${startTs}] GitHub hostname: ${process.env.GITHUB_API_BASE_URL || 'github.com'} (Enterprise mode: ${gheMode})`);
    if (process.env.WUCE_ENABLE_THINKING === '1') {
      const budget = process.env.WUCE_THINKING_BUDGET_TOKENS || '10000';
      console.log(`[${startTs}] Extended thinking: ENABLED (budget_tokens=${budget}, WUCE_ENABLE_THINKING=1)`);
    }
  });
}

module.exports = { createApp, router };
