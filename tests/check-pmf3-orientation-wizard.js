'use strict';
// check-pmf3-orientation-wizard.js
// Tests for pmf.3 — Context-aware orientation wizard — three-step session start
// See test plan: artefacts/2026-06-14-web-ui-pm-flow/test-plans/pmf.3-test-plan.md

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
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err)); return Promise.resolve();
  }
}

function freshRequire(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

var JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var tmpBase = path.join(os.tmpdir(), 'pmf3-test-' + Date.now());

function mkTmp(subdir) {
  var d = path.join(tmpBase, subdir);
  fs.mkdirSync(d, { recursive: true });
  return d;
}

function writeFile(dir, relPath, content) {
  var fullPath = path.join(dir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

function mockRes() {
  var res = { statusCode: 200, body: null, headers: {} };
  res.status = function(code) { res.statusCode = code; return res; };
  res.json = function(data) { res.body = data; return res; };
  res.send = function(data) { res.body = data; return res; };
  res.writeHead = function(code, hdrs) { res.statusCode = code; if (hdrs) Object.assign(res.headers, hdrs); return res; };
  res.end = function(data) { res.body = data; return res; };
  res.redirect = function(url) { res.headers.location = url; res.statusCode = 302; return res; };
  return res;
}

process.on('exit', function() {
  try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch (_) {}
});

var queue = [];

// ---------------------------------------------------------------------------
// T3.1 — Step 1 renders three named options (AC1)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.1: Step 1 renders three option headings — new, existing, resume (AC1)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t3-1');
    writeFile(repoRoot, '.github/pipeline-state.json', JSON.stringify({ features: [{ slug: 'feat-t31', stage: 'definition' }] }));
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok' } }; // no view param
    var res = mockRes();
    routes.handleGetWizard(req, res);
    var body = typeof res.body === 'string' ? res.body : '';
    assert.ok(body.toLowerCase().includes('something new') || body.toLowerCase().includes('start something'),
      'Step 1 must include "Start something new" option; body: ' + body.substring(0, 300));
    assert.ok(body.toLowerCase().includes('existing'),
      'Step 1 must include "Continue an existing feature" option; body: ' + body.substring(0, 300));
    assert.ok(body.toLowerCase().includes('resume') || body.toLowerCase().includes('active session'),
      'Step 1 must include "Resume active session" option; body: ' + body.substring(0, 300));
  });
});

// ---------------------------------------------------------------------------
// T3.2 — Step 1 does NOT pre-render the feature list (AC1)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.2: Step 1 (no view param) does not render feature slug list in body (AC1)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t3-2');
    writeFile(repoRoot, '.github/pipeline-state.json', JSON.stringify({ features: [
      { slug: 'feat-unique-t32-alpha', stage: 'definition', name: 'Alpha Feature' }
    ]}));
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok' } }; // no view param → Step 1
    var res = mockRes();
    routes.handleGetWizard(req, res);
    var body = typeof res.body === 'string' ? res.body : '';
    assert.ok(!body.includes('feat-unique-t32-alpha'),
      'Step 1 must NOT render feature slug; slug should only appear in Step 2 (view=existing); body: ' + body.substring(0, 300));
  });
});

// ---------------------------------------------------------------------------
// T3.3 — Step 2 renders feature CARDS (not plain li slugs) (AC4)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.3: Step 2 (view=existing) renders feature cards with class, not plain li slugs (AC4)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t3-3');
    writeFile(repoRoot, '.github/pipeline-state.json', JSON.stringify({ features: [
      { slug: 'feat-pmf3-t3', stage: 'definition', name: 'PMF3 Test Feature', health: 'green' }
    ]}));
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok' }, query: { view: 'existing' } };
    var res = mockRes();
    routes.handleGetWizard(req, res);
    var body = typeof res.body === 'string' ? res.body : '';
    assert.ok(body.includes('feat-pmf3-t3'),
      'Step 2 must include the feature slug; body: ' + body.substring(0, 300));
    assert.ok(body.includes('wiz-feature-card') || body.includes('class='),
      'Step 2 must render feature cards (with class attribute), not plain <li> slugs; body: ' + body.substring(0, 300));
  });
});

// ---------------------------------------------------------------------------
// T3.4 — POST from-idea redirects to /skills/discovery/sessions?idea=<ideaId> (AC3)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.4: POST selection=from-idea redirects to discovery sessions with idea param (AC3)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t3-4');
    writeFile(repoRoot, '.github/pipeline-state.json', JSON.stringify({ features: [] }));
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok' }, body: { selection: 'from-idea', ideaId: 'idea-001' } };
    var res = mockRes();
    routes.handlePostWizardSelection(req, res);
    assert.strictEqual(res.statusCode, 302, 'Must redirect with 302; got: ' + res.statusCode);
    var location = res.headers.Location || res.headers.location || '';
    assert.ok(location.includes('/skills/discovery/sessions'),
      'Must redirect to /skills/discovery/sessions; location: ' + location);
    assert.ok(location.includes('idea'),
      'Redirect URL must include idea param; location: ' + location);
    assert.ok(!req.session.activeFeatureSlug,
      'from-idea must NOT set activeFeatureSlug on session');
  });
});

// ---------------------------------------------------------------------------
// T3.5 — Step 3: no active sessions → "No active sessions" message (AC6)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.5: Step 3 (view=resume) with no sessions → no-sessions message (AC6)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    routes.setListHtmlSessions(function() { return []; }); // empty store
    var req = { session: { accessToken: 'tok' }, query: { view: 'resume' } };
    var res = mockRes();
    routes.handleGetWizard(req, res);
    var body = typeof res.body === 'string' ? res.body : '';
    assert.ok(res.statusCode < 400, 'Must return success status; got: ' + res.statusCode);
    assert.ok(
      body.toLowerCase().includes('no active') ||
      body.toLowerCase().includes('no sessions') ||
      body.toLowerCase().includes('24 hour'),
      'Must show a no-active-sessions message; body: ' + body.substring(0, 300)
    );
  });
});

// ---------------------------------------------------------------------------
// T3.6 — Step 3: session within 24h appears (AC6)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.6: Step 3 lists session with lastActivity within 24h (AC6)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var now = Date.now();
    var mockSessions = [
      { sessionId: 'sess-active-t36', session: { skillName: 'discovery', done: false, lastActivity: now - (60 * 60 * 1000) } }
    ];
    routes.setListHtmlSessions(function() { return mockSessions; });
    var req = { session: { accessToken: 'tok' }, query: { view: 'resume' } };
    var res = mockRes();
    routes.handleGetWizard(req, res);
    var body = typeof res.body === 'string' ? res.body : '';
    assert.ok(body.includes('discovery'),
      'Active session skillName must appear in Step 3 output; body: ' + body.substring(0, 300));
    assert.ok(body.includes('sess-active-t36'),
      'Active sessionId must appear in Step 3 output; body: ' + body.substring(0, 300));
  });
});

// ---------------------------------------------------------------------------
// T3.7 — Step 3: stale session (>24h) NOT shown (AC6)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.7: Step 3 does NOT list session with lastActivity older than 24h (AC6)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var now = Date.now();
    var staleMs = 25 * 60 * 60 * 1000; // 25h ago
    var mockSessions = [
      { sessionId: 'sess-stale-t37', session: { skillName: 'discovery', done: false, lastActivity: now - staleMs } }
    ];
    routes.setListHtmlSessions(function() { return mockSessions; });
    var req = { session: { accessToken: 'tok' }, query: { view: 'resume' } };
    var res = mockRes();
    routes.handleGetWizard(req, res);
    var body = typeof res.body === 'string' ? res.body : '';
    assert.ok(!body.includes('sess-stale-t37'),
      'Stale session (>24h) must NOT appear in Step 3; body: ' + body.substring(0, 300));
  });
});

// ---------------------------------------------------------------------------
// T3.8 — POST resume-session redirects to /skills/<skill>/sessions/<id>/chat (AC7)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.8: POST selection=resume-session redirects to skill session chat (AC7)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var req = { session: { accessToken: 'tok' }, body: {
      selection: 'resume-session',
      sessionId: 'sess-abc',
      skillName: 'discovery'
    }};
    var res = mockRes();
    routes.handlePostWizardSelection(req, res);
    assert.strictEqual(res.statusCode, 302, 'Must redirect with 302; got: ' + res.statusCode);
    var location = res.headers.Location || res.headers.location || '';
    assert.ok(location === '/skills/discovery/sessions/sess-abc/chat',
      'Must redirect to /skills/discovery/sessions/sess-abc/chat; got: ' + location);
  });
});

// Run all tests
Promise.all(queue.map(function(fn) { return fn(); })).then(function() {
  console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) { console.log('  FAIL: ' + f.name + '\n    ' + (f.err && f.err.stack || f.err)); });
    process.exit(1);
  }
});
