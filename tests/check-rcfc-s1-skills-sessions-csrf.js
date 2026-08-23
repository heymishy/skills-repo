'use strict';

// check-rcfc-s1-skills-sessions-csrf.js — AC2 (story rcfc-s1, Task 2)
// Story: artefacts/2026-08-17-remaining-csrf-form-coverage/stories/rcfc-s1-extend-csrf-to-remaining-forms.md
// Test plan: artefacts/2026-08-17-remaining-csrf-form-coverage/test-plans/rcfc-s1-test-plan.md
// (`tests/check-rcfc-s1-skills-sessions-csrf.js — AC2 (2 routes)` section)
//
// Full server.js router dispatch (not the handler in isolation), same convention as
// check-rcfc-s1-journey-forms-csrf.js (Task 1). Proves the pre-fix vulnerability (a POST
// with no/invalid _csrf currently succeeds) fails against the fixed handler, and that a
// legitimate round trip (GET page -> extract real embedded token -> POST with it) still
// works after the fix, for the 2 skill-session-form routes:
//   - POST /api/skills/:name/sessions            (handlePostSkillSessionHtml, form path)
//   - POST /api/skills/:name/sessions/:id/commit (handlePostCommitHtml, form path)
//
// The JSON-path siblings of both routes (handlePostSession, handleCommitArtefact) are
// explicitly out of scope for this story -- each "rejected-without-csrf" test below also
// dispatches an equivalent JSON-content-type request with no _csrf field and asserts it is
// NOT blocked by the csrf guard (proven by Content-Type: application/json in the response,
// vs. the guard's own fixed text/plain "Forbidden" signature), confirming the JSON sibling's
// existing behaviour is untouched by this change.
//
// req.body is pre-set directly on the dispatched request object rather than emitted via a
// fake EventEmitter stream for the JSON-path negative checks (content-type: application/json
// requests) -- csrf.js's own _readBody() short-circuits on `req.body !== undefined`. Form-path
// requests instead emit a real form-urlencoded body via the fake EventEmitter stream so the
// full csrfGuard body-parsing path is exercised end-to-end, matching Task 1's convention.

var assert = require('assert');

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

// ── Test-mode bootstrap (mirrors check-rcfc-s1-journey-forms-csrf.js's own setup exactly) ──
process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

var router          = require('../src/web-ui/server').router;
var seedTestSession  = require('../src/web-ui/middleware/session').seedTestSession;
var skillsRoutes     = require('../src/web-ui/routes/skills');

// session_id cookie values are matched by sessionMiddleware's own regex,
// /session_id=([a-f0-9]+)/ (middleware/session.js) -- lowercase hex only, no
// hyphens or other characters, or the cookie silently fails to parse and a
// brand-new (unauthenticated) session is used instead.
var _sidCounter = 0;
function nextSid() {
  _sidCounter += 1;
  return require('crypto').createHash('sha1').update('rcfc-s1-skills-' + _sidCounter).digest('hex');
}

function seedSession(label, extra) {
  var sid = nextSid();
  seedTestSession(sid, Object.assign({
    accessToken: 'e2e-test-access-token',
    userId: 9600 + _sidCounter,
    login: 'rcfc-s1-skills-tester-' + _sidCounter,
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

// Form-encoded POST — body arrives via a real (fake) EventEmitter stream, so
// csrfGuard's own body-parsing path is exercised end-to-end (Task 1 convention).
function postFormReq(sid, url, formBody) {
  var raw = Object.keys(formBody || {}).map(function(k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(formBody[k]);
  }).join('&');
  var req = {
    method: 'POST',
    url: url,
    headers: { cookie: 'session_id=' + sid, 'content-type': 'application/x-www-form-urlencoded' },
    on: function(event, cb) {
      if (event === 'data') setTimeout(function() { cb(Buffer.from(raw)); }, 0);
      if (event === 'end')  setTimeout(function() { cb(); }, 5);
      return req;
    }
  };
  return req;
}

// JSON-path POST — req.body pre-set directly (sanctioned test-injection path per
// csrf.js's own _readBody short-circuit comment; not exercised by the JSON handlers
// under test here since they read via _readBody too, same short-circuit).
function postJsonReq(sid, url, jsonBody) {
  return {
    method: 'POST',
    url: url,
    headers: { cookie: 'session_id=' + sid, 'content-type': 'application/json' },
    body: jsonBody || {}
  };
}

// makeRes() stores header keys exactly as the handler wrote them (writeHead is not
// case-normalising, unlike a real http.ServerResponse) -- handlers in this codebase mix
// 'Content-Type' and 'content-type' casing, so header reads must be case-insensitive.
function getHeader(res, name) {
  var lower = name.toLowerCase();
  var keys = Object.keys(res._headers || {});
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === lower) return res._headers[keys[i]];
  }
  return undefined;
}

function extractCsrfValue(html) {
  var m = html.match(/name="_csrf" value="([^"]*)"/);
  return m ? m[1] : null;
}

// Some GET routes wrap their handler in `authGuard(req, res, async () => { ... })` --
// NOT awaited by router() itself -- so router()'s own returned promise can resolve
// before the wrapped handler has actually finished writing the response. Waiting on
// res.end() being called (rather than on router()'s promise) works for both that case
// and the directly-awaited case. Mirrors check-rcfc-s1-journey-forms-csrf.js's own
// dispatch helper.
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
// Route 1 — POST /api/skills/:name/sessions (handlePostSkillSessionHtml, form path)
// =============================================================================

queue.push(function() {
  return test('skill-session-form-rejected-without-csrf: POST /api/skills/:name/sessions (form) with no _csrf field returns 403; JSON sibling unaffected', async function() {
    var createCalls = 0;
    skillsRoutes.setCreateSession(async function() { createCalls += 1; return { id: 'sess-should-not-be-created' }; });

    var sid = seedSession('session-reject');
    var res = await dispatch(postFormReq(sid, '/api/skills/discovery/sessions', { skill: 'discovery' }));
    assert.strictEqual(res._status, 403, 'expected 403, got ' + res._status);
    assert.strictEqual(res._body, 'Forbidden');
    assert.strictEqual(createCalls, 0, 'createSession must NOT be called without a valid CSRF token');

    // Negative check (test plan AC2): the JSON path for the SAME route pattern must be
    // unaffected -- it is not wired to the csrf guard at all, so a JSON POST with no
    // _csrf field must NOT hit the guard's 403/"Forbidden" signature.
    var jsonRes = await dispatch(postJsonReq(sid, '/api/skills/discovery/sessions', {}));
    assert.ok(
      !(jsonRes._status === 403 && jsonRes._body === 'Forbidden'),
      'JSON-path sibling (handlePostSession) must not be blocked by the csrf guard; got status=' + jsonRes._status + ' body=' + jsonRes._body
    );
    assert.ok(
      (getHeader(jsonRes, 'content-type') || '').indexOf('application/json') === 0,
      'JSON-path sibling must still respond with its own application/json content-type, got ' + getHeader(jsonRes, 'content-type')
    );
  });
});

queue.push(function() {
  return test('skill-session-form-full-round-trip: GET /skills embeds real token, POST /api/skills/:name/sessions with it succeeds', async function() {
    skillsRoutes.setListSkills(async function() {
      return [{ name: 'discovery', description: 'Structures a raw idea into a discovery artefact.' }];
    });
    var createCalls = 0;
    skillsRoutes.setCreateSession(async function(skillName) {
      createCalls += 1;
      assert.strictEqual(skillName, 'discovery');
      return { id: 'sess-roundtrip-xyz' };
    });

    var sid = seedSession('session-roundtrip');
    var getRes = await dispatch(getReq(sid, '/skills'));
    assert.ok(getRes._status === null || getRes._status < 400, 'GET /skills must succeed; got ' + getRes._status);
    var token = extractCsrfValue(getRes._body);
    assert.ok(token, 'a _csrf token must be embedded in the rendered skills-list page HTML');

    var postRes = await dispatch(postFormReq(sid, '/api/skills/discovery/sessions', { skill: 'discovery', _csrf: token }));
    assert.strictEqual(postRes._status, 303, 'expected 303 redirect on legitimate round-trip submission, got ' + postRes._status);
    assert.strictEqual(getHeader(postRes, 'location'), '/skills/discovery/sessions/sess-roundtrip-xyz/chat');
    assert.strictEqual(createCalls, 1, 'createSession must be called exactly once on a legitimate submission');
  });
});

// =============================================================================
// Route 2 — POST /api/skills/:name/sessions/:id/commit (handlePostCommitHtml, form path)
// =============================================================================

var COMMIT_PREVIEW_FIXTURE = {
  artefactPath:    'artefacts/2026-08-17-rcfc-s1-fixture/discovery.md',
  artefactContent: '# rcfc-s1 commit-preview fixture\n',
  branchName:      'main',
  defaultMessage:  'feat: rcfc-s1 fixture',
  reviewers:       []
};

queue.push(function() {
  return test('skill-commit-form-rejected-without-csrf: POST commit (form) with no _csrf field returns 403; JSON sibling unaffected', async function() {
    var commitCalls = 0;
    skillsRoutes.setCommitSession(async function() { commitCalls += 1; return { artefactPath: 'should-not-commit.md', featureSlug: 'x', artefactType: 'discovery' }; });

    var sid = seedSession('commit-reject');
    var res = await dispatch(postFormReq(sid, '/api/skills/discovery/sessions/sess-commit-reject/commit', { message: 'reject attempt' }));
    assert.strictEqual(res._status, 403, 'expected 403, got ' + res._status);
    assert.strictEqual(res._body, 'Forbidden');
    assert.strictEqual(commitCalls, 0, 'commitSession must NOT be called without a valid CSRF token');

    // Negative check (test plan AC2): the JSON path for the SAME route pattern must be
    // unaffected -- it is not wired to the csrf guard at all.
    var jsonRes = await dispatch(postJsonReq(sid, '/api/skills/discovery/sessions/sess-commit-reject/commit', {}));
    assert.ok(
      !(jsonRes._status === 403 && jsonRes._body === 'Forbidden'),
      'JSON-path sibling (handleCommitArtefact) must not be blocked by the csrf guard; got status=' + jsonRes._status + ' body=' + jsonRes._body
    );
    assert.ok(
      (getHeader(jsonRes, 'content-type') || '').indexOf('application/json') === 0,
      'JSON-path sibling must still respond with its own application/json content-type, got ' + getHeader(jsonRes, 'content-type')
    );
  });
});

queue.push(function() {
  return test('skill-commit-form-full-round-trip: GET commit-preview embeds real token, POST commit with it succeeds', async function() {
    skillsRoutes.setGetCommitPreview(async function(skillName, sessionId) {
      assert.strictEqual(skillName, 'discovery');
      assert.strictEqual(sessionId, 'sess-commit-roundtrip');
      return COMMIT_PREVIEW_FIXTURE;
    });
    var commitCalls = 0;
    skillsRoutes.setCommitSession(async function(skillName, sessionId) {
      commitCalls += 1;
      assert.strictEqual(skillName, 'discovery');
      assert.strictEqual(sessionId, 'sess-commit-roundtrip');
      return { artefactPath: COMMIT_PREVIEW_FIXTURE.artefactPath, featureSlug: '2026-08-17-rcfc-s1-fixture', artefactType: 'discovery' };
    });

    var sid = seedSession('commit-roundtrip');
    var getRes = await dispatch(getReq(sid, '/skills/discovery/sessions/sess-commit-roundtrip/commit-preview'));
    assert.ok(getRes._status === null || getRes._status < 400, 'GET commit-preview must succeed; got ' + getRes._status);
    var token = extractCsrfValue(getRes._body);
    assert.ok(token, 'a _csrf token must be embedded in the rendered commit-preview page HTML');

    var postRes = await dispatch(postFormReq(sid, '/api/skills/discovery/sessions/sess-commit-roundtrip/commit', { message: 'roundtrip commit', _csrf: token }));
    assert.strictEqual(postRes._status, 303, 'expected 303 redirect on legitimate round-trip submission, got ' + postRes._status);
    assert.strictEqual(getHeader(postRes, 'location'), '/skills/discovery/sessions/sess-commit-roundtrip/result');
    assert.strictEqual(commitCalls, 1, 'commitSession must be called exactly once on a legitimate submission');
  });
});

// =============================================================================
// Run
// =============================================================================

async function main() {
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }
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
