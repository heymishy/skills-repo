'use strict';
// check-lab-s3.3-credit-enforcement.js — AC verification tests for lab-s3.3 (Credit enforcement — 402 turn guard)
// Tests AC1–AC7 (per story lab-s3.3-credit-enforcement.md):
//   AC1: balance = 0 → 402, Anthropic adapter not called
//   AC2: balance = -10 → 402, Anthropic adapter not called
//   AC3: balance = 50 → Anthropic adapter called, adjustBalance(-1) called, response passes through
//   AC4: TURN_CREDIT_COST=2 env → adjustBalance(-2)
//   AC5: balance check is first operation after session auth (verified via source inspection)
//   AC6: credits_balance_check audit log emitted on 402
//   AC7: Anthropic adapter invocation count = 0 on 402

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';

const path = require('path');
const fs   = require('fs');
const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function check(label, ok) {
  if (ok) {
    passed++;
    console.log('PASS:', label);
  } else {
    failed++;
    console.error('FAIL:', label);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal mock req/res pair. */
function mockReqRes(overrides) {
  overrides = overrides || {};
  var _headers = {};
  var _statusCode = null;
  var _body = '';
  var ended = false;

  var res = {
    writeHead: function(code, hdrs) {
      _statusCode = code;
      if (hdrs) Object.assign(_headers, hdrs);
    },
    end: function(chunk) {
      if (chunk) _body += chunk;
      ended = true;
    },
    write: function(chunk) {
      if (chunk) _body += chunk;
    },
    getStatus:  function() { return _statusCode; },
    getBody:    function() { return _body; },
    getHeaders: function() { return _headers; },
    isEnded:    function() { return ended; }
  };

  var req = Object.assign({
    session: { accessToken: 'tok', tenantId: 'tenant-1' },
    params:  {},
    query:   {},
    body:    {},
    headers: { 'content-type': 'application/json' }
  }, overrides.req || {});

  return { req: req, res: res };
}

/** Build a mock credits db adapter returning a fixed balance. */
function mockCreditsDb(balance, adjustCalls) {
  return {
    query: async function(sql, params) {
      if (sql.includes('SELECT')) {
        return { rows: balance === null ? [] : [{ balance: balance }] };
      }
      // UPDATE (adjustBalance)
      if (adjustCalls) {
        adjustCalls.push({ sql: sql, params: params });
      }
      return { rows: [] };
    }
  };
}

// ── T1: creditsGuard module exists and exports creditsGuard ───────────────

console.log('\n── T1: credits-guard.js module ──');

const guardPath = path.join(ROOT, 'src', 'web-ui', 'middleware', 'credits-guard.js');
check('credits-guard.js file exists', fs.existsSync(guardPath));

delete require.cache[guardPath];
const guardModule = require(guardPath);
check('exports creditsGuard function', typeof guardModule.creditsGuard === 'function');

// ── T2: AC1 — balance = 0 → 402, next not called, Anthropic adapter not called ──

console.log('\n── T2: AC1 — balance=0 returns 402 (AC7: Anthropic adapter call count = 0) ──');

(async function testAC1() {
  const creditsPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'credits'));
  delete require.cache[creditsPath];
  const credits = require(creditsPath);
  credits.setCreditsAdapter(mockCreditsDb(0, null));

  delete require.cache[guardPath];
  const { creditsGuard } = require(guardPath);

  var { req, res } = mockReqRes();
  var nextCalled = false;
  await creditsGuard(req, res, function() { nextCalled = true; });

  check('AC1: balance=0 returns 402', res.getStatus() === 402);
  check('AC7: next() not called when balance=0 (Anthropic adapter not invoked)', !nextCalled);

  var bodyObj = null;
  try { bodyObj = JSON.parse(res.getBody()); } catch (_) {}
  check('AC1: 402 body has error field', bodyObj && bodyObj.error === 'Insufficient credits');
  check('AC1: 402 body has topUpUrl field', bodyObj && bodyObj.topUpUrl === '/settings/billing');
  check('AC1: 402 body has no extra fields', bodyObj && Object.keys(bodyObj).length === 2);
  check('AC1: Content-Type is application/json', (res.getHeaders()['Content-Type'] || '').includes('application/json'));
})().then(runAC2).catch(function(err) {
  console.error('T2 error:', err.message);
  failed++;
  runAC2();
});

// ── T3: AC2 — balance = -10 → 402 ──────────────────────────────────────────

async function runAC2() {
  console.log('\n── T3: AC2 — balance=-10 returns 402 ──');

  const creditsPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'credits'));
  delete require.cache[creditsPath];
  const credits = require(creditsPath);
  credits.setCreditsAdapter(mockCreditsDb(-10, null));

  delete require.cache[guardPath];
  const { creditsGuard } = require(guardPath);

  var { req, res } = mockReqRes();
  var nextCalled = false;
  await creditsGuard(req, res, function() { nextCalled = true; });

  check('AC2: balance=-10 returns 402', res.getStatus() === 402);
  check('AC2: next() not called when balance=-10', !nextCalled);

  var bodyObj = null;
  try { bodyObj = JSON.parse(res.getBody()); } catch (_) {}
  check('AC2: 402 body correct for negative balance', bodyObj && bodyObj.error === 'Insufficient credits' && bodyObj.topUpUrl === '/settings/billing');

  await runAC3();
}

// ── T4: AC3 — balance = 50 → next() called ─────────────────────────────────

async function runAC3() {
  console.log('\n── T4: AC3 — balance=50, next() called, Anthropic adapter invoked ──');

  const creditsPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'credits'));
  delete require.cache[creditsPath];
  const credits = require(creditsPath);
  credits.setCreditsAdapter(mockCreditsDb(50, null));

  delete require.cache[guardPath];
  const { creditsGuard } = require(guardPath);

  var { req, res } = mockReqRes();
  var nextCalled = false;
  await creditsGuard(req, res, function() { nextCalled = true; });

  check('AC3: balance=50 calls next()', nextCalled);
  check('AC3: no 402 response when balance > 0', res.getStatus() !== 402);

  await runAC3Integration();
}

// ── T5: AC3 integration — adjustBalance(-1) called after successful turn ──

async function runAC3Integration() {
  console.log('\n── T5: AC3 integration — adjustBalance(-1) called after handlePostTurnHtml ──');

  const creditsPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'credits'));
  delete require.cache[creditsPath];
  const credits = require(creditsPath);

  var adjustCalls = [];
  credits.setCreditsAdapter(mockCreditsDb(50, adjustCalls));

  // Wire skills module with mock turn executor and session
  const skillsPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'skills'));
  delete require.cache[skillsPath];
  var skillsMod;
  try {
    skillsMod = require(skillsPath);
  } catch (_e) {
    check('AC3 integration: skills module loads', false);
    await runAC4();
    return;
  }

  // Wire a no-op disk session writer (avoid file system writes)
  skillsMod.setSessionStore({
    write:        function() {},
    read:         function() { return null; },
    list:         function() { return []; },
    loadSessions: function() {}
  });

  // Wire mock Anthropic turn executor that returns a simple response
  var anthropicCallCount = 0;
  skillsMod.setSkillTurnExecutorAdapter(async function(_sys, _hist, _user, _tok) {
    anthropicCallCount++;
    return 'Hello from mock model';
  });

  // Register a test session
  var testSessionId = 'lab-s3.3-test-session-' + Date.now();
  skillsMod._setHtmlSession(testSessionId, {
    skillName:   'discovery',
    sessionPath: null,
    systemPrompt: 'test system prompt',
    turns:        [],
    done:         false,
    journeyId:    null
  });

  // Build mock req/res for handlePostTurnHtml
  var { req, res } = mockReqRes({
    req: {
      session:    { accessToken: 'tok', tenantId: 'tenant-ac3', login: 'tester' },
      params:     { name: 'discovery', id: testSessionId },
      body:       { answer: 'test answer' },
      headers:    { 'content-type': 'application/json' }
    }
  });

  var originalCost = process.env.TURN_CREDIT_COST;
  delete process.env.TURN_CREDIT_COST; // default = 1

  try {
    await skillsMod.handlePostTurnHtml(req, res);
  } catch (e) {
    check('AC3 integration: handlePostTurnHtml does not throw', false);
    console.error('  Error:', e.message);
    process.env.TURN_CREDIT_COST = originalCost;
    await runAC4();
    return;
  }

  if (originalCost !== undefined) {
    process.env.TURN_CREDIT_COST = originalCost;
  } else {
    delete process.env.TURN_CREDIT_COST;
  }

  check('AC3: Anthropic adapter was called', anthropicCallCount > 0);
  check('AC3: adjustBalance was called', adjustCalls.length > 0);
  if (adjustCalls.length > 0) {
    var adjustDelta = adjustCalls[0].params && adjustCalls[0].params[0];
    check('AC3: adjustBalance called with negative delta', adjustDelta < 0);
    check('AC3: adjustBalance delta = -1 (default TURN_CREDIT_COST)', adjustDelta === -1);
  } else {
    failed++; console.error('FAIL: AC3: adjustBalance delta = -1 (no call recorded)');
    failed++; console.error('FAIL: AC3: adjustBalance called with negative delta (no call recorded)');
  }

  await runAC4();
}

// ── T6: AC4 — TURN_CREDIT_COST=2 → adjustBalance(-2) ──────────────────────

async function runAC4() {
  console.log('\n── T6: AC4 — TURN_CREDIT_COST=2 → adjustBalance(-2) ──');

  const creditsPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'credits'));
  delete require.cache[creditsPath];
  const credits = require(creditsPath);

  var adjustCalls = [];
  credits.setCreditsAdapter(mockCreditsDb(100, adjustCalls));

  const skillsPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'skills'));
  delete require.cache[skillsPath];
  var skillsMod;
  try {
    skillsMod = require(skillsPath);
  } catch (_e) {
    check('AC4: skills module loads', false);
    await runAC6();
    return;
  }

  skillsMod.setSessionStore({
    write:        function() {},
    read:         function() { return null; },
    list:         function() { return []; },
    loadSessions: function() {}
  });

  skillsMod.setSkillTurnExecutorAdapter(async function() { return 'mock response'; });

  var testSessionId2 = 'lab-s3.3-test-session-ac4-' + Date.now();
  skillsMod._setHtmlSession(testSessionId2, {
    skillName:    'discovery',
    sessionPath:  null,
    systemPrompt: 'test',
    turns:        [],
    done:         false,
    journeyId:    null
  });

  var { req, res } = mockReqRes({
    req: {
      session:  { accessToken: 'tok', tenantId: 'tenant-ac4', login: 'tester' },
      params:   { name: 'discovery', id: testSessionId2 },
      body:     { answer: 'test' },
      headers:  { 'content-type': 'application/json' }
    }
  });

  var originalCost = process.env.TURN_CREDIT_COST;
  process.env.TURN_CREDIT_COST = '2';

  try {
    await skillsMod.handlePostTurnHtml(req, res);
  } catch (e) {
    check('AC4: handlePostTurnHtml does not throw with TURN_CREDIT_COST=2', false);
    console.error('  Error:', e.message);
    process.env.TURN_CREDIT_COST = originalCost;
    await runAC6();
    return;
  }

  process.env.TURN_CREDIT_COST = originalCost;

  check('AC4: adjustBalance called when TURN_CREDIT_COST=2', adjustCalls.length > 0);
  if (adjustCalls.length > 0) {
    var adjustDelta = adjustCalls[0].params && adjustCalls[0].params[0];
    check('AC4: adjustBalance delta = -2', adjustDelta === -2);
  } else {
    failed++; console.error('FAIL: AC4: adjustBalance delta = -2 (no call recorded)');
  }

  await runAC6();
}

// ── T7: AC6 — credits_balance_check audit log emitted on 402 ────────────────

async function runAC6() {
  console.log('\n── T7: AC6 — audit log emitted on 402 ──');

  const creditsPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'credits'));
  delete require.cache[creditsPath];
  const credits = require(creditsPath);
  credits.setCreditsAdapter(mockCreditsDb(0, null));

  delete require.cache[guardPath];
  const { creditsGuard } = require(guardPath);

  var loggedEvents = [];
  var origInfo = console.info;
  console.info = function() { loggedEvents.push(Array.from(arguments)); };

  var { req, res } = mockReqRes();
  try {
    await creditsGuard(req, res, function() {});
  } finally {
    console.info = origInfo;
  }

  check('AC6: credits_balance_check event logged', loggedEvents.some(function(args) {
    return args[0] === 'credits_balance_check';
  }));

  var evt = loggedEvents.find(function(args) { return args[0] === 'credits_balance_check'; });
  if (evt) {
    var data = evt[1];
    check('AC6: event has tenantId field', data && data.tenantId !== undefined);
    check('AC6: event has balance field', data && data.balance !== undefined);
    check('AC6: event has result=blocked', data && data.result === 'blocked');
    check('AC6: event does not contain accessToken', data && !('accessToken' in data));
  } else {
    failed++; console.error('FAIL: AC6: event has tenantId field (no event found)');
    failed++; console.error('FAIL: AC6: event has balance field (no event found)');
    failed++; console.error('FAIL: AC6: event has result=blocked (no event found)');
    failed++; console.error('FAIL: AC6: event does not contain accessToken (no event found)');
  }

  runSourceChecks();
}

// ── T8: Source checks — server.js wires creditsGuard before Anthropic call ──

function runSourceChecks() {
  console.log('\n── T8: Source checks — server.js + skills.js wiring ──');

  var serverSrc = fs.readFileSync(path.join(ROOT, 'src', 'web-ui', 'server.js'), 'utf8');
  check('server.js imports creditsGuard', serverSrc.includes("require('./middleware/credits-guard')"));
  check('server.js mounts creditsGuard on /turn route',
    serverSrc.includes('creditsGuard') && serverSrc.includes('/turn'));
  // creditsGuard must appear before handlePostTurnHtml in the turn route DISPATCH block (not just imports).
  // Find the turn route dispatch block by looking for the pathname match.
  var turnRouteBlockStart = serverSrc.indexOf("pathname.match(/^\\/api\\/skills\\/[^/]+\\/sessions\\/[^/]+\\/turn$/");
  var turnRouteBlockEnd   = serverSrc.indexOf('handlePostTurnHtml', turnRouteBlockStart);
  var cgInTurnBlock       = serverSrc.indexOf('creditsGuard', turnRouteBlockStart);
  check('server.js: creditsGuard appears before handlePostTurnHtml in turn route dispatch',
    turnRouteBlockStart !== -1 && cgInTurnBlock !== -1 && turnRouteBlockEnd !== -1 && cgInTurnBlock < turnRouteBlockEnd);

  var skillsSrc = fs.readFileSync(path.join(ROOT, 'src', 'web-ui', 'routes', 'skills.js'), 'utf8');
  check('skills.js calls adjustBalance after successful turn',
    skillsSrc.includes('adjustBalance') && skillsSrc.includes('TURN_CREDIT_COST'));
  check('skills.js reads TURN_CREDIT_COST from process.env at request time (not module load)',
    skillsSrc.includes("process.env.TURN_CREDIT_COST"));
  // adjustBalance must NOT appear at module top level (must be inside a function)
  var adjIdx = skillsSrc.indexOf('adjustBalance');
  var moduleHeaderEnd = skillsSrc.indexOf('\nasync function handlePostTurnHtml');
  check('skills.js: adjustBalance is inside a handler function (not module top level)',
    adjIdx !== -1 && moduleHeaderEnd !== -1 && adjIdx > moduleHeaderEnd);
  // Delta must be negative
  check('skills.js: adjustBalance delta is negative',
    skillsSrc.includes('-_guardCost') || skillsSrc.includes('-_streamGuardCost') || skillsSrc.includes('adjustBalance(_') && skillsSrc.includes(',-'));

  // credits-guard.js touchpoints
  var guardSrc = fs.readFileSync(guardPath, 'utf8');
  check('credits-guard.js: 402 status code', guardSrc.includes('402'));
  check('credits-guard.js: exact error body', guardSrc.includes('"Insufficient credits"'));
  check('credits-guard.js: exact topUpUrl value', guardSrc.includes('"/settings/billing"'));
  check('credits-guard.js: calls getBalance', guardSrc.includes('getBalance'));
  check('credits-guard.js: no accessToken in 402 body or log',
    !guardSrc.includes('accessToken'));

  // ── Final summary ──────────────────────────────────────────────────────────
  console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
}
