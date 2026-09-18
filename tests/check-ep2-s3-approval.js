'use strict';
// tests/check-ep2-s3-approval.js — Part 1

// vrne-s1's own env-setup requirement for requiring server.js: must be set
// BEFORE that require() below runs, matching
// tests/check-vrne-s1-server-wiring.js's established setup for this exact
// real-dispatch pattern. NODE_ENV=test + no DATABASE_URL routes server.js to
// its bri-s3.2/rbg-s1 in-memory fake-test-db bootstrap branch, which wires a
// real (fake-backed) getCurrentRole adapter -- required for requireNonViewer's
// live role resolution to see the viewer role seeded via
// /test/seed-multi-user-roles below.
process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

const assert = require('assert');
const EventEmitter = require('events').EventEmitter;
const journeyRoute = require('../src/web-ui/routes/journey');
const router = require('../src/web-ui/server').router;
const seedTestSession = require('../src/web-ui/middleware/session').seedTestSession;

async function testApprovalHandlerExists() {
  assert.strictEqual(typeof journeyRoute.handlePostJourneyApprove, 'function');
}
testApprovalHandlerExists()
  .then(() => console.log('  ok - approval handler exported'))
  .catch((err) => { console.error('  FAIL - testApprovalHandlerExists:', err.message); process.exitCode = 1; });

// Part 2 — vrne-s1 (AC2) regression: the new POST /api/journey/:journeyId/approve
// route must deny a viewer-role session with 403, exactly like its sibling
// /api/journey/:journeyId/gate-confirm route does. Task 2's server.js wiring
// initially omitted this gate (caught in spec-compliance review) -- this test
// guards against the gate being dropped again.
//
// integrationMockRes/dispatchAndAwaitResponse/seedMultiUserRolesForIntegrationTest
// below are copied from check-vrne-s1-server-wiring.js's own equivalent
// helpers (its T-integration-real-dispatch test) rather than imported, since
// that file has no exported test-helper module today. If either file's
// harness is ever fixed independently, check the other for the same fix --
// most importantly the timing hazard dispatchAndAwaitResponse exists to
// route around: router(req, res) does NOT reliably resolve only once the
// response is fully written. Some route branches (e.g. authGuard-wrapped
// ones) invoke their async gate check fire-and-forget -- authGuard calls
// next() and only .catch()es it for unhandled errors, never awaiting or
// returning that promise up to router()'s own caller -- so `await
// router(req, res)` can resolve BEFORE an async requireNonViewer check
// inside that callback has actually written a status code. This route
// (a direct inline `await requireNonViewer(...)`, same as gate-confirm and
// plain POST /api/journey) doesn't hit that specific hazard today, but this
// helper is shared across both hazard shapes so the test doesn't depend on
// which internal pattern the route happens to use -- it resolves once
// res.end() actually fires, not once router()'s own promise settles.

function integrationMockRes() {
  var _statusCode = null;
  var _headers = {};
  var _chunks = [];
  return {
    writeHead: function(code, headers) { _statusCode = code; Object.assign(_headers, headers || {}); return this; },
    setHeader: function(k, v) { _headers[k] = v; },
    end: function(body) { if (body != null) _chunks.push(body); },
    _get: function() { return { statusCode: _statusCode, headers: _headers, body: _chunks.join('') }; }
  };
}

function dispatchAndAwaitResponse(req) {
  return new Promise(function(resolve, reject) {
    var res = integrationMockRes();
    var origEnd = res.end;
    var settled = false;
    res.end = function(body) {
      origEnd(body);
      if (!settled) { settled = true; resolve(res._get()); }
    };
    router(req, res).catch(function(err) {
      if (!settled) { settled = true; reject(err); }
    });
  });
}

function seedMultiUserRolesForIntegrationTest(sharedOrg) {
  return new Promise(function(resolve, reject) {
    var req = new EventEmitter();
    req.method = 'POST';
    req.url = '/test/seed-multi-user-roles';
    req.headers = { 'content-type': 'application/json' };
    var res = integrationMockRes();
    var origEnd = res.end;
    res.end = function(body) {
      origEnd(body);
      var result = res._get();
      if (result.statusCode !== 200) {
        reject(new Error('seed-multi-user-roles failed: ' + result.statusCode + ' ' + result.body));
      } else {
        resolve(result);
      }
    };
    router(req, res).then(function() {
      req.emit('data', JSON.stringify({ sharedOrg: sharedOrg }));
      req.emit('end');
    }).catch(reject);
  });
}

async function testApproveRouteDeniesViewer() {
  var sharedOrg = 'e2e-ep2-s3-approve-viewer-gate';
  await seedMultiUserRolesForIntegrationTest(sharedOrg);

  var sessionId = 'deadbeef02';
  seedTestSession(sessionId, {
    accessToken: 'e2e-test-access-token',
    userId: 9002,
    login: 'e2e-viewer',
    tenantId: sharedOrg
  });
  var cookieHeader = { cookie: 'session_id=' + sessionId };

  var req = { headers: cookieHeader, method: 'POST', url: '/api/journey/does-not-matter/approve' };
  var result = await dispatchAndAwaitResponse(req);
  assert.strictEqual(result.statusCode, 403, 'POST /api/journey/:id/approve must return 403 for a viewer-role session, got ' + result.statusCode + ' -- ' + result.body);
}
testApproveRouteDeniesViewer()
  .then(() => console.log('  ok - approve route denies viewer role (vrne-s1 AC2)'))
  .catch((err) => { console.error('  FAIL - testApproveRouteDeniesViewer:', err.message); process.exitCode = 1; });

// tests/check-ep2-s3-approval.js — Part 2
// Minimal smoke check that routes/skills.js still loads after the Sign Off
// button/modal injection -- real behavioral proof is Task 5's E2E test,
// matching the established pattern from ep2-s1/ep2-s2's own equivalent
// "page-still-loads" checks for this heavily-tested existing file.
function testSkillsHandlerStillExported() {
  const skillsRoute = require('../src/web-ui/routes/skills');
  assert.strictEqual(typeof skillsRoute.handleGetChatHtml, 'function');
}
testSkillsHandlerStillExported();
console.log('  ok - routes/skills.js still loads after Sign Off button injection');

// tests/check-ep2-s3-approval.js — Part 3
// Task 4: Integration tests -- full approval path, isolation.
//
// Mirrors check-owle2-decisions-side-trip.js's own established harness for
// testing this same class of handler (handlePostDecisions, same file,
// routes/journey.js): a real fs.mkdtempSync temp dir as repoRoot, a real
// journey via journey-store's createJourney/setActiveSession, and a
// freshRequire() per test block (delete require.cache + re-require) so each
// block gets its own isolated module-level state (_repoRoot, in-memory
// journeys map) rather than mutating the journey.js/journey-store.js
// instances Part 1/2 above already share with server.js's router. Real
// filesystem throughout -- fs is never mocked, matching the precedent.
//
// Difference from handlePostDecisions: handlePostJourneyApprove also runs
// middleware/csrf.js's csrfGuard, which requires body._csrf to equal
// session.csrfToken (see csrfGuard's `submitted === expected` check) --
// makeReqP3/makeResP3 below set up a real, matching token pair so the CSRF
// check passes rather than being routed around. It also takes a third pool
// argument; every test here passes null, since handlePostJourneyApprove's
// own try/catch around _featureCollaboratorStore.getFeatureCollaborators
// degrades non-fatally to approverRole = null when pool is null (pool.query
// throws synchronously on a null pool).

const fs = require('fs');
const path = require('path');
const os = require('os');

const JOURNEY_PATH_P3 = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
const JOURNEY_STORE_PATH_P3 = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');

function freshRequireP3() {
  try { delete require.cache[require.resolve(JOURNEY_PATH_P3)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH_P3)]; } catch (_) {}
  const jStore = require(JOURNEY_STORE_PATH_P3);
  const j = require(JOURNEY_PATH_P3);
  return { jStore: jStore, j: j };
}

function makeResP3() {
  const res = { _code: null, _body: '', _headers: {} };
  res.writeHead = function(code, headers) { res._code = code; Object.assign(res._headers, headers || {}); };
  res.end = function(body) { res._body += (body || ''); };
  return res;
}

const P3_CSRF_TOKEN = 'csrf-tok-p3';

function makeReqP3(overrides) {
  return Object.assign({
    session: { accessToken: 'tok', login: 'approver-user', csrfToken: P3_CSRF_TOKEN },
    params: {},
    body: { _csrf: P3_CSRF_TOKEN },
    headers: {}
  }, overrides);
}

let p3Passed = 0;
let p3Failed = 0;
const p3Failures = [];

function testP3(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { p3Passed++; console.log('  [PASS]', name); },
        function(err) { p3Failed++; p3Failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    p3Passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    p3Failed++; p3Failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

async function testFullApprovalPathWritesDecisionsEntry() {
  const r = freshRequireP3();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep2-s3-test-'));
  r.j.setRepoRoot(tmpDir);
  const featureSlug = 'test-feature-approval';
  const jobj = r.jStore.createJourney(featureSlug);
  r.jStore.setActiveSession(jobj.journeyId, 'sess-p3-1', 'discovery');

  const res = makeResP3();
  const reasonText = 'Discovery scope is clear and matches the benefit-metric target.';
  await r.j.handlePostJourneyApprove(makeReqP3({
    params: { journeyId: jobj.journeyId },
    body: { _csrf: P3_CSRF_TOKEN, reason: reasonText }
  }), res, null);

  const decisionsPath = path.join(tmpDir, 'artefacts', featureSlug, 'decisions.md');
  const content = fs.existsSync(decisionsPath) ? fs.readFileSync(decisionsPath, 'utf8') : '';
  const nextStage = r.jStore.getNextStage('discovery');

  await testP3('testFullApprovalPathWritesDecisionsEntry: response 200', function() {
    assert.strictEqual(res._code, 200, 'expected 200, got ' + res._code + ' -- ' + res._body);
  });
  await testP3('testFullApprovalPathWritesDecisionsEntry: response body written/stage/nextStage/approver correct', function() {
    const parsed = JSON.parse(res._body);
    assert.strictEqual(parsed.written, decisionsPath);
    assert.strictEqual(parsed.stage, 'discovery');
    assert.strictEqual(parsed.nextStage, nextStage);
    assert.strictEqual(parsed.approver, 'approver-user');
  });
  await testP3('testFullApprovalPathWritesDecisionsEntry: decisions.md created', function() {
    assert.ok(fs.existsSync(decisionsPath), 'decisions.md not created');
  });
  await testP3('testFullApprovalPathWritesDecisionsEntry: title line present with real stage/approver', function() {
    assert.ok(content.includes('## discovery approved by approver-user'), 'title line missing or wrong -- got: ' + content);
  });
  await testP3('testFullApprovalPathWritesDecisionsEntry: Date field present with real ISO date', function() {
    const today = new Date().toISOString().slice(0, 10);
    assert.ok(content.includes('**Date:** ' + today), 'Date field missing/wrong -- got: ' + content);
  });
  await testP3('testFullApprovalPathWritesDecisionsEntry: Context field present with real stage/feature values', function() {
    assert.ok(content.includes('**Context:** Approval recorded via Sign Off at the discovery stage of feature test-feature-approval.'), 'Context field missing/wrong -- got: ' + content);
  });
  await testP3('testFullApprovalPathWritesDecisionsEntry: Decision field present with real stage/nextStage values', function() {
    assert.ok(content.includes('**Decision:** discovery approved and advancing to ' + nextStage + '.'), 'Decision field missing/wrong -- got: ' + content);
  });
  await testP3('testFullApprovalPathWritesDecisionsEntry: Rationale field present with the real reason text', function() {
    assert.ok(content.includes('**Rationale:** ' + reasonText), 'Rationale field missing/wrong -- got: ' + content);
  });

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

async function testEmptyReasonReturns400AndWritesNoFile() {
  const r = freshRequireP3();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep2-s3-test-'));
  r.j.setRepoRoot(tmpDir);
  const featureSlug = 'test-feature-approval-empty-reason';
  const jobj = r.jStore.createJourney(featureSlug);
  r.jStore.setActiveSession(jobj.journeyId, 'sess-p3-2', 'discovery');

  const res = makeResP3();
  await r.j.handlePostJourneyApprove(makeReqP3({
    params: { journeyId: jobj.journeyId },
    body: { _csrf: P3_CSRF_TOKEN, reason: '' }
  }), res, null);

  const decisionsPath = path.join(tmpDir, 'artefacts', featureSlug, 'decisions.md');

  await testP3('empty reason: returns 400 with the exact handler error', function() {
    assert.strictEqual(res._code, 400, 'expected 400, got ' + res._code + ' -- ' + res._body);
    const parsed = JSON.parse(res._body);
    assert.strictEqual(parsed.error, 'Reason cannot be empty');
  });
  await testP3('empty reason: no decisions.md written', function() {
    assert.ok(!fs.existsSync(decisionsPath), 'decisions.md should not exist after a rejected empty reason');
  });

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Dedicated proof that the written entry uses the REAL field names
// (**Date:**/**Context:**/**Decision:**/**Rationale:**) and never the DoR's
// original (confirmed nonexistent) literal "session-phase" field -- guards
// against ever silently reverting to that wrong assumption.
async function testWrittenEntryUsesRealFieldNamesNotSessionPhase() {
  const r = freshRequireP3();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep2-s3-test-'));
  r.j.setRepoRoot(tmpDir);
  const featureSlug = 'test-feature-approval-field-format';
  const jobj = r.jStore.createJourney(featureSlug);
  r.jStore.setActiveSession(jobj.journeyId, 'sess-p3-3', 'test-plan');

  const res = makeResP3();
  await r.j.handlePostJourneyApprove(makeReqP3({
    params: { journeyId: jobj.journeyId },
    body: { _csrf: P3_CSRF_TOKEN, reason: 'Field format proof reason.' }
  }), res, null);

  const decisionsPath = path.join(tmpDir, 'artefacts', featureSlug, 'decisions.md');
  const content = fs.readFileSync(decisionsPath, 'utf8');

  await testP3('field format: response is 200', function() {
    assert.strictEqual(res._code, 200, 'expected 200, got ' + res._code + ' -- ' + res._body);
  });
  await testP3('field format: uses the real Date/Context/Decision/Rationale field names', function() {
    assert.ok(content.includes('**Date:**'), 'missing **Date:** field -- got: ' + content);
    assert.ok(content.includes('**Context:**'), 'missing **Context:** field -- got: ' + content);
    assert.ok(content.includes('**Decision:**'), 'missing **Decision:** field -- got: ' + content);
    assert.ok(content.includes('**Rationale:**'), 'missing **Rationale:** field -- got: ' + content);
  });
  await testP3('field format: does NOT contain the DoR\'s nonexistent session-phase field', function() {
    assert.ok(!content.toLowerCase().includes('session-phase'), 'entry unexpectedly contains a session-phase field -- got: ' + content);
  });

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

async function runPart3() {
  console.log('\n[ep2-s3-approval Part 3] Integration -- full approval path, isolation');
  await testFullApprovalPathWritesDecisionsEntry();
  await testEmptyReasonReturns400AndWritesNoFile();
  await testWrittenEntryUsesRealFieldNamesNotSessionPhase();

  console.log('\n[ep2-s3-approval Part 3] ' + (p3Passed + p3Failed) + ' run, ' + p3Passed + ' passed, ' + p3Failed + ' failed');
  if (p3Failures.length > 0) {
    p3Failures.forEach(function(f) { console.log('  FAILURE:', f.name, '--', f.err && f.err.message || f.err); });
    process.exitCode = 1;
  }
}

runPart3().catch(function(err) { console.error('Part 3 crashed:', err); process.exitCode = 1; });
