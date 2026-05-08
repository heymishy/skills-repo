'use strict';
// check-wucp4-session-wizard.js
// Tests for wucp.4 — Session start wizard — project/repo selection before journey begins
// All tests are written to FAIL until the implementation is complete (TDD).
// See test plan: artefacts/2026-05-08-web-ui-copilot-chat-parity/test-plans/wucp.4-test-plan.md

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
var tmpBase = path.join(os.tmpdir(), 'wucp4-test-' + Date.now());

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
// T4.1 — GET /journey returns wizard HTML when no activeFeatureSlug in session (AC1)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4.1: handleGetJourney returns wizard response when no activeFeatureSlug (AC1)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    assert.strictEqual(typeof routes.handleGetWizard, 'function', 'handleGetWizard must be exported');
    var repoRoot = mkTmp('t4-1');
    writeFile(repoRoot, '.github/pipeline-state.json', JSON.stringify({ features: [{ slug: 'feat-t41', stage: 'definition', name: 'Feature T41' }] }));
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok' } };
    var res = mockRes();
    routes.handleGetWizard(req, res);
    assert.ok(res.statusCode < 400, 'wizard handler must return a success response; got ' + res.statusCode);
    var bodyStr = JSON.stringify(res.body || '') + (typeof res.body === 'string' ? res.body : '');
    var hasNew = bodyStr.toLowerCase().includes('new') || bodyStr.toLowerCase().includes('project');
    var hasExisting = bodyStr.toLowerCase().includes('existing');
    assert.ok(hasNew || hasExisting, 'wizard response must include project selection options');
  });
});

// ---------------------------------------------------------------------------
// T4.2 — Wizard response does NOT contain journey stage content (AC1)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4.2: Wizard response does not contain journey stage skill instructions (AC1)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t4-2');
    writeFile(repoRoot, '.github/pipeline-state.json', JSON.stringify({ features: [{ slug: 'feat-t42', stage: 'definition' }] }));
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok' } };
    var res = mockRes();
    routes.handleGetWizard(req, res);
    var bodyStr = JSON.stringify(res.body || '') + (typeof res.body === 'string' ? res.body : '');
    // Journey stage content markers — must NOT appear in wizard response
    assert.ok(!bodyStr.includes('WEB UI PROTOCOL'), 'wizard must not include journey stage WEB UI PROTOCOL block');
  });
});

// ---------------------------------------------------------------------------
// T4.3 — "new" selection → no activeFeatureSlug set on session (AC2)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4.3: "new" selection leaves session.activeFeatureSlug unset (AC2)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    assert.strictEqual(typeof routes.handlePostWizardSelection, 'function', 'handlePostWizardSelection must be exported');
    var repoRoot = mkTmp('t4-3');
    writeFile(repoRoot, '.github/pipeline-state.json', JSON.stringify({ features: [] }));
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok' }, body: { selection: 'new' } };
    var res = mockRes();
    routes.handlePostWizardSelection(req, res);
    assert.ok(!req.session.activeFeatureSlug, 'activeFeatureSlug must not be set for "new project" selection; got: ' + req.session.activeFeatureSlug);
  });
});

// ---------------------------------------------------------------------------
// T4.4 — "new" selection → stageIndex set to 0 (AC2)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4.4: "new" selection sets stageIndex to 0 (AC2)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t4-4');
    writeFile(repoRoot, '.github/pipeline-state.json', JSON.stringify({ features: [] }));
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok' }, body: { selection: 'new' } };
    var res = mockRes();
    routes.handlePostWizardSelection(req, res);
    assert.strictEqual(req.session.stageIndex, 0, 'stageIndex must be 0 for new project; got: ' + req.session.stageIndex);
  });
});

// ---------------------------------------------------------------------------
// T4.5 — "new" selection: no artefact listing for any feature (AC2 + wucp.1)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4.5: "new" selection: wucp.1 context load does not scope to any feature (AC2)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t4-5');
    writeFile(repoRoot, '.github/pipeline-state.json', JSON.stringify({ features: [{ slug: 'some-feat', stage: 'definition' }] }));
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok' }, body: { selection: 'new' } };
    var res = mockRes();
    routes.handlePostWizardSelection(req, res);
    // After "new" selection, session must not have an activeFeatureSlug
    assert.ok(!req.session.activeFeatureSlug, 'activeFeatureSlug must be absent after new project selection');
  });
});

// ---------------------------------------------------------------------------
// T4.6 — "existing" list excludes released features (AC3)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4.6: Existing project list excludes released features (AC3)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    assert.strictEqual(typeof routes.handleGetWizard, 'function', 'handleGetWizard must be exported');
    var repoRoot = mkTmp('t4-6');
    var state = { features: [
      { slug: 'feat-active', stage: 'definition', name: 'Active Feature' },
      { slug: 'feat-released', stage: 'released', name: 'Released Feature' },
      { slug: 'feat-archived', stage: 'archived', name: 'Archived Feature' }
    ]};
    writeFile(repoRoot, '.github/pipeline-state.json', JSON.stringify(state));
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok' }, query: { view: 'existing' } };
    var res = mockRes();
    routes.handleGetWizard(req, res);
    var bodyStr = JSON.stringify(res.body || '') + (typeof res.body === 'string' ? res.body : '');
    assert.ok(!bodyStr.includes('feat-released'), 'released feature must NOT appear in list; body: ' + bodyStr.substring(0, 200));
  });
});

// ---------------------------------------------------------------------------
// T4.7 — "existing" list excludes archived features (AC3)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4.7: Existing project list excludes archived features (AC3)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t4-7');
    var state = { features: [
      { slug: 'feat-active', stage: 'definition', name: 'Active Feature' },
      { slug: 'feat-archived', stage: 'archived', name: 'Archived Feature' }
    ]};
    writeFile(repoRoot, '.github/pipeline-state.json', JSON.stringify(state));
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok' }, query: { view: 'existing' } };
    var res = mockRes();
    routes.handleGetWizard(req, res);
    var bodyStr = JSON.stringify(res.body || '') + (typeof res.body === 'string' ? res.body : '');
    assert.ok(!bodyStr.includes('feat-archived'), 'archived feature must NOT appear in list; body: ' + bodyStr.substring(0, 200));
  });
});

// ---------------------------------------------------------------------------
// T4.8 — Active feature appears in "existing" list with stage and health (AC3)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4.8: Active feature appears in existing list with stage info (AC3)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t4-8');
    var state = { features: [
      { slug: 'feat-active-t48', stage: 'review', name: 'Active T48', health: 'green' }
    ]};
    writeFile(repoRoot, '.github/pipeline-state.json', JSON.stringify(state));
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok' }, query: { view: 'existing' } };
    var res = mockRes();
    routes.handleGetWizard(req, res);
    var bodyStr = JSON.stringify(res.body || '') + (typeof res.body === 'string' ? res.body : '');
    assert.ok(bodyStr.includes('feat-active-t48'), 'active feature slug must appear in list: ' + bodyStr.substring(0, 200));
    assert.ok(bodyStr.includes('review'), 'feature stage must appear in list');
  });
});

// ---------------------------------------------------------------------------
// T4.9 — All features released/archived → "No active projects found" message (AC3 edge)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4.9: All features released/archived → "No active projects found" message and New project action (AC3 edge)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t4-9');
    var state = { features: [
      { slug: 'feat-rel1', stage: 'released' },
      { slug: 'feat-rel2', stage: 'released' }
    ]};
    writeFile(repoRoot, '.github/pipeline-state.json', JSON.stringify(state));
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok' }, query: { view: 'existing' } };
    var res = mockRes();
    routes.handleGetWizard(req, res);
    var bodyStr = JSON.stringify(res.body || '') + (typeof res.body === 'string' ? res.body : '');
    assert.ok(bodyStr.toLowerCase().includes('no active') || bodyStr.toLowerCase().includes('no pipeline') || bodyStr.toLowerCase().includes('start a new'),
      '"No active projects found" or similar message must appear when all features are released/archived; body: ' + bodyStr.substring(0, 200));
  });
});

// ---------------------------------------------------------------------------
// T4.10 — STAGE_INDEX exported from journey.js (AC4)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4.10: STAGE_INDEX exported from journey.js (AC4)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    assert.ok(routes.STAGE_INDEX !== undefined, 'STAGE_INDEX must be exported from journey.js');
    assert.strictEqual(typeof routes.STAGE_INDEX, 'object', 'STAGE_INDEX must be a plain object');
    assert.ok(routes.STAGE_INDEX !== null, 'STAGE_INDEX must not be null');
  });
});

// ---------------------------------------------------------------------------
// T4.11 — STAGE_INDEX maps all required stage names to correct indices (AC4)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4.11: STAGE_INDEX maps required stage names to correct indices (AC4)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var idx = routes.STAGE_INDEX;
    assert.ok(idx !== undefined, 'STAGE_INDEX must be exported');
    assert.strictEqual(idx['discovery'], 0, 'discovery must map to 0');
    assert.strictEqual(idx['benefit-metric'], 1, 'benefit-metric must map to 1');
    assert.strictEqual(idx['definition'], 2, 'definition must map to 2');
    assert.strictEqual(idx['review'], 3, 'review must map to 3');
    assert.strictEqual(idx['test-plan'], 4, 'test-plan must map to 4');
    assert.strictEqual(idx['definition-of-ready'], 5, 'definition-of-ready must map to 5');
    assert.strictEqual(idx['definition-of-done'], 11, 'definition-of-done must map to 11');
  });
});

// ---------------------------------------------------------------------------
// T4.12 — Feature selected: session.activeFeatureSlug set to selected slug (AC4)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4.12: Feature selection sets session.activeFeatureSlug to selected slug (AC4)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t4-12');
    var state = { features: [{ slug: 'feat-t412', stage: 'review', name: 'Feature T412' }] };
    writeFile(repoRoot, '.github/pipeline-state.json', JSON.stringify(state));
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok' }, body: { featureSlug: 'feat-t412' } };
    var res = mockRes();
    routes.handlePostWizardSelection(req, res);
    assert.strictEqual(req.session.activeFeatureSlug, 'feat-t412', 'session.activeFeatureSlug must be "feat-t412"; got: ' + req.session.activeFeatureSlug);
  });
});

// ---------------------------------------------------------------------------
// T4.13 — Feature at "review" stage → stageIndex set to 3 (AC4)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4.13: Feature at review stage → session.stageIndex set to 3 (AC4)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t4-13');
    var state = { features: [{ slug: 'feat-t413', stage: 'review' }] };
    writeFile(repoRoot, '.github/pipeline-state.json', JSON.stringify(state));
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok' }, body: { featureSlug: 'feat-t413' } };
    var res = mockRes();
    routes.handlePostWizardSelection(req, res);
    assert.strictEqual(req.session.stageIndex, 3, 'stageIndex must be 3 for review stage; got: ' + req.session.stageIndex);
  });
});

// ---------------------------------------------------------------------------
// T4.14 — Feature at unknown stage → stageIndex falls back to 0 (AC4)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4.14: Feature at unknown stage falls back to stageIndex 0 (AC4)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t4-14');
    var state = { features: [{ slug: 'feat-t414', stage: 'nonexistent-stage-unique' }] };
    writeFile(repoRoot, '.github/pipeline-state.json', JSON.stringify(state));
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok' }, body: { featureSlug: 'feat-t414' } };
    var res = mockRes();
    routes.handlePostWizardSelection(req, res);
    assert.strictEqual(req.session.stageIndex, 0, 'stageIndex must fall back to 0 for unknown stage; got: ' + req.session.stageIndex);
  });
});

// ---------------------------------------------------------------------------
// T4.15 — pipeline-state.json absent → informational message, no error (AC5)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4.15: pipeline-state.json absent → informational message, no error thrown (AC5)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t4-15');
    // NO pipeline-state.json in repoRoot
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok' }, query: { view: 'existing' } };
    var res = mockRes();
    var threw = false;
    try {
      routes.handleGetWizard(req, res);
    } catch (e) {
      threw = true;
    }
    assert.ok(!threw, 'handleGetWizard must not throw when pipeline-state.json is absent');
    assert.ok(res.statusCode < 500, 'status must not be 500 when pipeline-state.json is absent; got ' + res.statusCode);
    var bodyStr = JSON.stringify(res.body || '') + (typeof res.body === 'string' ? res.body : '');
    assert.ok(
      bodyStr.toLowerCase().includes('no pipeline') || bodyStr.toLowerCase().includes('no active') || bodyStr.toLowerCase().includes('start a new'),
      'response must contain informational message when pipeline-state.json absent; body: ' + bodyStr.substring(0, 200)
    );
  });
});

// ---------------------------------------------------------------------------
// T4.16 — pipeline-state.json absent → proceeds as new project (AC5 + AC2)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4.16: pipeline-state.json absent → proceeds as new project (AC5)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t4-16');
    // NO pipeline-state.json
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok' }, body: { selection: 'new-from-absent-state' } };
    var res = mockRes();
    var threw = false;
    try {
      routes.handlePostWizardSelection(req, res);
    } catch (e) {
      threw = true;
    }
    assert.ok(!threw, 'handlePostWizardSelection must not throw when pipeline-state.json is absent');
    assert.ok(res.statusCode < 500, 'must not 500 when pipeline-state.json absent; got ' + res.statusCode);
    assert.ok(!req.session.activeFeatureSlug, 'activeFeatureSlug must not be set in fallback; got: ' + req.session.activeFeatureSlug);
  });
});

// ---------------------------------------------------------------------------
// T4.17 — Returning session with activeFeatureSlug set: wizard skipped (AC6)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4.17: Returning session with activeFeatureSlug set — wizard skipped (AC6)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t4-17');
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok', activeFeatureSlug: 'active-feat-t417', stageIndex: 2 } };
    var res = mockRes();
    // handleGetJourney (or the wucp.4 update to it) should detect session.activeFeatureSlug and NOT show wizard
    routes.handleGetWizard(req, res);
    var bodyStr = JSON.stringify(res.body || '') + (typeof res.body === 'string' ? res.body : '');
    // Wizard should not be shown if activeFeatureSlug is already set
    var showsWizard = bodyStr.toLowerCase().includes('new project') && bodyStr.toLowerCase().includes('existing project');
    assert.ok(!showsWizard, 'wizard must NOT be shown when activeFeatureSlug is already set in session');
  });
});

// ---------------------------------------------------------------------------
// T4.18 — Session expired (no activeFeatureSlug) → wizard shown again (AC6)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4.18: Expired/new session (no activeFeatureSlug) → wizard shown again (AC6)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t4-18');
    writeFile(repoRoot, '.github/pipeline-state.json', JSON.stringify({ features: [{ slug: 'feat-t418', stage: 'definition' }] }));
    routes.setRepoRoot(repoRoot);
    // No activeFeatureSlug — session is new or expired
    var req = { session: { accessToken: 'tok' } };
    var res = mockRes();
    routes.handleGetWizard(req, res);
    assert.ok(res.statusCode < 400, 'handleGetWizard must return success for new/expired session; got ' + res.statusCode);
    // Same as T4.1 — wizard options must appear
    var bodyStr = JSON.stringify(res.body || '') + (typeof res.body === 'string' ? res.body : '');
    var hasWizardContent = bodyStr.toLowerCase().includes('new') || bodyStr.toLowerCase().includes('project');
    assert.ok(hasWizardContent, 'wizard must be shown for new/expired session');
  });
});

// ---------------------------------------------------------------------------
// T4.19 — NFR performance: feature list rendered under 200ms (NFR)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4.19: NFR performance — feature list read and response < 200ms', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t4-19');
    // 15 features
    var features = [];
    for (var i = 0; i < 15; i++) { features.push({ slug: 'feat-perf-' + i, stage: 'definition', name: 'Feature ' + i, health: 'green' }); }
    writeFile(repoRoot, '.github/pipeline-state.json', JSON.stringify({ features: features }));
    routes.setRepoRoot(repoRoot);
    var start = Date.now();
    var req = { session: { accessToken: 'tok' }, query: { view: 'existing' } };
    var res = mockRes();
    routes.handleGetWizard(req, res);
    var elapsed = Date.now() - start;
    assert.ok(elapsed < 200, 'handleGetWizard must respond in < 200ms for 15 features; took ' + elapsed + 'ms');
  });
});

// ---------------------------------------------------------------------------
// T4.20 — NFR security: slug not in allowlist rejected with HTTP 400 (NFR)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4.20: NFR security — slug not in allowlist rejected with HTTP 400; session not mutated', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t4-20');
    var state = { features: [{ slug: 'valid-feat-t420', stage: 'definition' }] };
    writeFile(repoRoot, '.github/pipeline-state.json', JSON.stringify(state));
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok' }, body: { featureSlug: 'injected-slug-not-in-allowlist' } };
    var res = mockRes();
    routes.handlePostWizardSelection(req, res);
    assert.strictEqual(res.statusCode, 400, 'must return 400 for slug not in allowlist; got ' + res.statusCode);
    assert.ok(!req.session.activeFeatureSlug, 'session must NOT be mutated with injected slug; got: ' + req.session.activeFeatureSlug);
  });
});

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
console.log('\n--- wucp.4: Session wizard tests ---\n');
queue.reduce(function(p, fn) { return p.then(fn); }, Promise.resolve()).then(function() {
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  FAIL: ' + f.name + '\n       ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
});
