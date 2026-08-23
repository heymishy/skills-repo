'use strict';

// check-rcfc-s1-journey-forms-csrf.js — AC1 (story rcfc-s1)
// Story: artefacts/2026-08-17-remaining-csrf-form-coverage/stories/rcfc-s1-extend-csrf-to-remaining-forms.md
// Test plan: artefacts/2026-08-17-remaining-csrf-form-coverage/test-plans/rcfc-s1-test-plan.md
//
// Full server.js router dispatch (not the handler in isolation), per sec-perf-s3's
// established D37 wiring-test convention and this story's own test plan (AC1 section):
// "every test dispatches through the real server.js router". Proves the pre-fix
// vulnerability (POST with no/invalid _csrf currently succeeds) fails against the fixed
// handler, and that a legitimate round trip (GET page -> extract real embedded token ->
// POST with it) still works after the fix, for all 6 journey-flow routes.
//
// req.body is pre-set directly on the dispatched request object rather than emitted via
// a fake EventEmitter stream -- csrf.js's own _readBody() and journey.js's _readFormBody()
// both explicitly short-circuit on `req.body !== undefined` ("mirrors the _readBody
// short-circuit already present in every route file in this codebase" -- csrf.js's own
// comment), so this is a sanctioned test-injection path, not a workaround.

var assert = require('assert');
var path = require('path');
var os = require('os');
var fs = require('fs');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

// ── Test-mode bootstrap (mirrors check-vrne-s2-skill-session-gate.js's own
// integration setup exactly) — fake in-memory DB/role adapters, no real Postgres. ──
process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

var router          = require('../src/web-ui/server').router;
var seedTestSession  = require('../src/web-ui/middleware/session').seedTestSession;
var getSession       = require('../src/web-ui/middleware/session').getSession;
var journeyRoutes    = require('../src/web-ui/routes/journey');
var journeyStore     = require('../src/web-ui/modules/journey-store');
var skillsRoutes     = require('../src/web-ui/routes/skills');

var REPO_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'rcfc-s1-journey-'));
journeyRoutes.setRepoRoot(REPO_ROOT);

// session_id cookie values are matched by sessionMiddleware's own regex,
// /session_id=([a-f0-9]+)/ (middleware/session.js) -- lowercase hex only, no
// hyphens or other characters, or the cookie silently fails to parse and a
// brand-new (unauthenticated) session is used instead.
var _sidCounter = 0;
function nextSid() {
  _sidCounter += 1;
  return require('crypto').createHash('sha1').update('rcfc-s1-' + _sidCounter).digest('hex');
}

function seedSession(label, extra) {
  var sid = nextSid();
  seedTestSession(sid, Object.assign({
    accessToken: 'e2e-test-access-token',
    userId: 9500 + _sidCounter,
    login: 'rcfc-s1-tester-' + _sidCounter,
    tenantId: null
  }, extra || {}));
  return sid;
}

function makeRes() {
  var res = { _status: null, _headers: {}, _body: '' };
  res.writeHead = function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); };
  res.end = function(body) { res._body += (body || ''); };
  return res;
}

function getReq(sid, url) {
  return { method: 'GET', url: url, headers: { cookie: 'session_id=' + sid } };
}

// body pre-set directly on req.body — see file header comment on why this is a
// sanctioned test-injection path, not a bypass of the real dispatch.
function postReq(sid, url, body) {
  return { method: 'POST', url: url, headers: { cookie: 'session_id=' + sid }, body: body || {} };
}

function extractCsrfValue(html) {
  var m = html.match(/name="_csrf" value="([^"]*)"/);
  return m ? m[1] : null;
}

// Some GET routes (e.g. /journey/wizard, /journey/:id/reference-modal) are
// registered in server.js as `authGuard(req, res, async () => { ... })` --
// NOT awaited by router() itself -- so router()'s own returned promise can
// resolve before the wrapped handler has actually finished writing the
// response. Waiting on res.end() being called (rather than on router()'s
// promise) works for both that case and the directly-awaited case, so it's
// used universally here. Mirrors check-vrne-s2-skill-session-gate.js's own
// dispatchAndAwaitResponse helper.
function dispatch(req) {
  return new Promise(function(resolve, reject) {
    var res = makeRes();
    var settled = false;
    var origEnd = res.end;
    res.end = function(body) {
      origEnd(body);
      if (!settled) { settled = true; resolve(res); }
    };
    router(req, res).catch(function(err) {
      if (!settled) { settled = true; reject(err); }
    });
  });
}

var queue = [];

// =============================================================================
// Route 1 — POST /journey/wizard (handlePostWizardSelection)
// =============================================================================

queue.push(function() {
  return test('journey-wizard-rejected-without-csrf: POST /journey/wizard with no _csrf field returns 403', async function() {
    var sid = seedSession('wiz-reject');
    var res = await dispatch(postReq(sid, '/journey/wizard', { selection: 'new' }));
    assert.strictEqual(res._status, 403, 'expected 403, got ' + res._status);
    assert.strictEqual(res._body, 'Forbidden');
    var session = getSession(sid);
    assert.ok(!session.stageIndex && session.stageIndex !== 0, 'session must NOT be mutated without a valid CSRF token; got stageIndex=' + session.stageIndex);
  });
});

queue.push(function() {
  return test('journey-wizard-full-round-trip: GET /journey/wizard embeds real token, POST with it succeeds', async function() {
    var sid = seedSession('wiz-roundtrip');
    var getRes = await dispatch(getReq(sid, '/journey/wizard'));
    assert.ok(getRes._status < 400, 'GET /journey/wizard must succeed; got ' + getRes._status);
    var token = extractCsrfValue(getRes._body);
    assert.ok(token, 'a _csrf token must be embedded in the rendered wizard page HTML');

    var postRes = await dispatch(postReq(sid, '/journey/wizard', { selection: 'new', _csrf: token }));
    assert.strictEqual(postRes._status, 302, 'expected 302 redirect on legitimate round-trip submission, got ' + postRes._status);
    assert.strictEqual(postRes._headers.Location, '/journey');
    var session = getSession(sid);
    assert.strictEqual(session.stageIndex, 0, 'stageIndex must be set to 0 on legitimate "new" selection');
  });
});

// =============================================================================
// Route 2 — POST /api/journey (handlePostJourney)
// =============================================================================

queue.push(function() {
  return test('api-journey-rejected-without-csrf: POST /api/journey with no _csrf field returns 403', async function() {
    var sid = seedSession('create-reject');
    var beforeCount = journeyStore.listJourneys().length;
    var res = await dispatch(postReq(sid, '/api/journey', { featureName: 'RCFC S1 Reject Feature' }));
    assert.strictEqual(res._status, 403, 'expected 403, got ' + res._status);
    assert.strictEqual(res._body, 'Forbidden');
    var afterCount = journeyStore.listJourneys().length;
    assert.strictEqual(afterCount, beforeCount, 'no journey must be created without a valid CSRF token');
  });
});

queue.push(function() {
  return test('api-journey-full-round-trip: GET /journey embeds real token, POST /api/journey with it succeeds', async function() {
    var sid = seedSession('create-roundtrip');
    var getRes = await dispatch(getReq(sid, '/journey'));
    assert.ok(getRes._status < 400, 'GET /journey must succeed; got ' + getRes._status);
    var token = extractCsrfValue(getRes._body);
    assert.ok(token, 'a _csrf token must be embedded in the rendered journey-home page HTML');

    var beforeCount = journeyStore.listJourneys().length;
    var postRes = await dispatch(postReq(sid, '/api/journey', { featureName: 'RCFC S1 Roundtrip Feature', _csrf: token }));
    assert.strictEqual(postRes._status, 303, 'expected 303 redirect on legitimate round-trip submission, got ' + postRes._status);
    assert.ok(/^\/skills\/discovery\/sessions\//.test(postRes._headers.Location), 'expected redirect into the new discovery session, got ' + postRes._headers.Location);
    var afterCount = journeyStore.listJourneys().length;
    assert.strictEqual(afterCount, beforeCount + 1, 'a new journey must be created on a legitimate round-trip submission');
  });
});

// =============================================================================
// Route 3 — POST /api/journey/:journeyId/gate-confirm (handlePostGateConfirm)
// =============================================================================

function seedGateConfirmJourney(label) {
  var journeyObj = journeyStore.createJourney('rcfc-s1-gc-' + label, 'default');
  var journeyId = journeyObj.journeyId;
  var sessionId = 'rcfc-s1-gc-session-' + label;
  var artefactRelPath = 'artefacts/rcfc-s1-gc-' + label + '/discovery.md';
  skillsRoutes._setHtmlSession(sessionId, {
    skillName: 'discovery',
    sessionPath: null,
    systemPrompt: 'test',
    turns: [],
    artefactContent: '# gate-confirm test artefact (' + label + ')',
    artefactPath: artefactRelPath,
    done: true,
    journeyId: journeyId
  });
  journeyStore.setActiveSession(journeyId, sessionId, 'discovery');
  return { journeyId: journeyId, sessionId: sessionId, artefactRelPath: artefactRelPath };
}

queue.push(function() {
  return test('gate-confirm-rejected-without-csrf: POST gate-confirm with no _csrf field returns 403', async function() {
    var fixture = seedGateConfirmJourney('reject');
    var sid = seedSession('gc-reject');
    var absPath = path.join(REPO_ROOT, fixture.artefactRelPath);
    var res = await dispatch(postReq(sid, '/api/journey/' + fixture.journeyId + '/gate-confirm', {}));
    assert.strictEqual(res._status, 403, 'expected 403, got ' + res._status);
    assert.strictEqual(res._body, 'Forbidden');
    assert.strictEqual(fs.existsSync(absPath), false, 'artefact must NOT be written to disk without a valid CSRF token');
    var journey = journeyStore.getJourney(fixture.journeyId);
    assert.strictEqual((journey.completedStages || []).length, 0, 'no stage must be completed without a valid CSRF token');
  });
});

queue.push(function() {
  return test('gate-confirm-full-round-trip: GET stage-review embeds real token, POST gate-confirm with it succeeds', async function() {
    var fixture = seedGateConfirmJourney('roundtrip');
    var sid = seedSession('gc-roundtrip');
    var absPath = path.join(REPO_ROOT, fixture.artefactRelPath);

    var getRes = await dispatch(getReq(sid, '/journey/' + fixture.journeyId + '/stage-review'));
    assert.ok(getRes._status < 400, 'GET stage-review must succeed; got ' + getRes._status);
    var token = extractCsrfValue(getRes._body);
    assert.ok(token, 'a _csrf token must be embedded in the rendered stage-review page HTML');

    var postRes = await dispatch(postReq(sid, '/api/journey/' + fixture.journeyId + '/gate-confirm', { _csrf: token }));
    assert.ok(postRes._status < 400, 'expected a success/redirect status on legitimate round-trip submission, got ' + postRes._status);
    assert.strictEqual(fs.readFileSync(absPath, 'utf8'), '# gate-confirm test artefact (roundtrip)', 'artefact must be written to disk with the session content on a legitimate submission');
    var journey = journeyStore.getJourney(fixture.journeyId);
    assert.strictEqual((journey.completedStages || []).length, 1, 'exactly one stage must be completed on a legitimate submission');
    assert.strictEqual(journey.completedStages[0].skillName, 'discovery');
  });
});

// =============================================================================
// Route 4 — POST /api/journey/:journeyId/reference-modal/skip (handlePostReferenceModalSkip)
// =============================================================================

queue.push(function() {
  return test('reference-modal-skip-rejected-without-csrf: POST reference-modal/skip with no _csrf field returns 403', async function() {
    var journeyObj = journeyStore.createJourney('rcfc-s1-rm-reject', 'default');
    var sid = seedSession('rm-reject');
    var res = await dispatch(postReq(sid, '/api/journey/' + journeyObj.journeyId + '/reference-modal/skip', {}));
    assert.strictEqual(res._status, 403, 'expected 403, got ' + res._status);
    assert.strictEqual(res._body, 'Forbidden');
    var journey = journeyStore.getJourney(journeyObj.journeyId);
    assert.strictEqual(journey.activeSessionId, null, 'no session must be linked to the journey without a valid CSRF token');
  });
});

queue.push(function() {
  return test('reference-modal-skip-full-round-trip: GET reference-modal embeds real token, POST skip with it succeeds', async function() {
    var journeyObj = journeyStore.createJourney('rcfc-s1-rm-roundtrip', 'default');
    var sid = seedSession('rm-roundtrip');

    var getRes = await dispatch(getReq(sid, '/journey/' + journeyObj.journeyId + '/reference-modal'));
    assert.ok(getRes._status < 400, 'GET reference-modal must succeed; got ' + getRes._status);
    var token = extractCsrfValue(getRes._body);
    assert.ok(token, 'a _csrf token must be embedded in the rendered reference-modal page HTML');

    var postRes = await dispatch(postReq(sid, '/api/journey/' + journeyObj.journeyId + '/reference-modal/skip', { _csrf: token }));
    assert.strictEqual(postRes._status, 303, 'expected 303 redirect on legitimate round-trip submission, got ' + postRes._status);
    assert.ok(/^\/skills\/discovery\/sessions\//.test(postRes._headers.Location), 'expected redirect into a new discovery session, got ' + postRes._headers.Location);
    var journey = journeyStore.getJourney(journeyObj.journeyId);
    assert.ok(journey.activeSessionId, 'a session must be linked to the journey on a legitimate submission');
  });
});

// =============================================================================
// Route 5 — POST /api/journey/:journeyId/reference (handlePostReference)
// =============================================================================

queue.push(function() {
  return test('reference-rejected-without-csrf: POST reference with no _csrf field returns 403', async function() {
    var journeyObj = journeyStore.createJourney('rcfc-s1-ref-reject', 'default');
    var sid = seedSession('ref-reject');
    var expectedPath = path.join(REPO_ROOT, 'artefacts', 'rcfc-s1-ref-reject', 'reference', 'my-doc.md');
    var res = await dispatch(postReq(sid, '/api/journey/' + journeyObj.journeyId + '/reference', { filename: 'my-doc', content: 'reject-test content' }));
    assert.strictEqual(res._status, 403, 'expected 403, got ' + res._status);
    assert.strictEqual(res._body, 'Forbidden');
    assert.strictEqual(fs.existsSync(expectedPath), false, 'reference doc must NOT be written to disk without a valid CSRF token');
  });
});

queue.push(function() {
  return test('reference-full-round-trip: GET reference embeds real token, POST with it succeeds', async function() {
    var journeyObj = journeyStore.createJourney('rcfc-s1-ref-roundtrip', 'default');
    var sid = seedSession('ref-roundtrip');
    var expectedPath = path.join(REPO_ROOT, 'artefacts', 'rcfc-s1-ref-roundtrip', 'reference', 'my-doc.md');

    var getRes = await dispatch(getReq(sid, '/journey/' + journeyObj.journeyId + '/reference'));
    assert.ok(getRes._status < 400, 'GET reference must succeed; got ' + getRes._status);
    var token = extractCsrfValue(getRes._body);
    assert.ok(token, 'a _csrf token must be embedded in the rendered reference page HTML');

    var postRes = await dispatch(postReq(sid, '/api/journey/' + journeyObj.journeyId + '/reference', { filename: 'my-doc', content: 'roundtrip content', _csrf: token }));
    assert.strictEqual(postRes._status, 303, 'expected 303 redirect on legitimate round-trip submission, got ' + postRes._status);
    assert.strictEqual(postRes._headers.Location, '/journey/' + journeyObj.journeyId + '/reference');
    assert.strictEqual(fs.readFileSync(expectedPath, 'utf8'), 'roundtrip content', 'reference doc must be written to disk on a legitimate submission');
  });
});

// =============================================================================
// Route 6 — POST /api/journey/:journeyId/stories (handlePostStories)
// =============================================================================

queue.push(function() {
  return test('stories-rejected-without-csrf: POST stories with no _csrf field returns 403', async function() {
    var journeyObj = journeyStore.createJourney('rcfc-s1-st-reject', 'default');
    var sid = seedSession('st-reject');
    var res = await dispatch(postReq(sid, '/api/journey/' + journeyObj.journeyId + '/stories', { stories: 'story-1' }));
    assert.strictEqual(res._status, 403, 'expected 403, got ' + res._status);
    assert.strictEqual(res._body, 'Forbidden');
    var journey = journeyStore.getJourney(journeyObj.journeyId);
    assert.ok(!journey.storyList, 'no story list must be set without a valid CSRF token');
  });
});

queue.push(function() {
  return test('stories-full-round-trip: GET stories embeds real token, POST with it succeeds', async function() {
    var journeyObj = journeyStore.createJourney('rcfc-s1-st-roundtrip', 'default');
    var sid = seedSession('st-roundtrip');

    var getRes = await dispatch(getReq(sid, '/journey/' + journeyObj.journeyId + '/stories'));
    assert.ok(getRes._status < 400, 'GET stories must succeed; got ' + getRes._status);
    var token = extractCsrfValue(getRes._body);
    assert.ok(token, 'a _csrf token must be embedded in the rendered stories page HTML');

    var postRes = await dispatch(postReq(sid, '/api/journey/' + journeyObj.journeyId + '/stories', { stories: 'story-1', _csrf: token }));
    assert.strictEqual(postRes._status, 303, 'expected 303 redirect on legitimate round-trip submission, got ' + postRes._status);
    assert.ok(/^\/skills\/review\/sessions\//.test(postRes._headers.Location), 'expected redirect into a new review session, got ' + postRes._headers.Location);
    var journey = journeyStore.getJourney(journeyObj.journeyId);
    assert.deepStrictEqual(journey.storyList, ['story-1'], 'story list must be set on a legitimate submission');
  });
});

// =============================================================================
// Run
// =============================================================================

async function main() {
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }
  try { fs.rmSync(REPO_ROOT, { recursive: true, force: true }); } catch (_) {}
  console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===');
  if (failed > 0) {
    failures.forEach(function(f) {
      console.log('FAILED:', f.name, '-', f.err && (f.err.stack || f.err.message) || f.err);
    });
    process.exit(1);
  }
  process.exit(0);
}

main();
