'use strict';
// check-jspf-s1-journey-postgres-fallback.js -- AC verification tests for jspf-s1
// Story: artefacts/2026-08-26-journey-stage-view-postgres-fallback/stories/jspf-s1-postgres-fallback-for-stage-view.md
// Test plan: artefacts/2026-08-26-journey-stage-view-postgres-fallback/test-plans/jspf-s1-test-plan.md
//
// Covers the shared resolveArtefactFromDiskOrPg helper wired into journey.js's
// 4 sites that never checked Postgres for a completed stage's durable content:
//   1. handleGetJourneyStageView (AC1, AC6)
//   2. handleGetStories          (AC2)
//   3. handlePostStories         (AC3, highest severity -- feeds the review session's context)
//   4. handlePostSideTripClarify (AC4)
// AC5/AC7/AC8 are regression/robustness guards repeated across all 4 sites.
//
// No external dependencies -- Node.js built-ins only, following this repo's
// plain-Node assert-based house style (see tests/check-avpf-s1-postgres-fallback.js,
// tests/check-das-s1-commit-artefact-git-fallback.js, tests/check-dsda-s1-default-all-stories.js).

var assert = require('assert');
var path = require('path');
var os = require('os');
var fs = require('fs');

var JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
var JOURNEY_STORE_PG_PATH = path.resolve(__dirname, '../src/web-ui/adapters/journey-store-pg.js');
var EXPORT_DATA_SOURCE_PATH = path.resolve(__dirname, '../src/web-ui/adapters/export-data-source.js');

function freshRequireJourney() {
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch (_) {}
  return require(JOURNEY_PATH);
}

function getStore() { return require(JOURNEY_STORE_PATH); }
function getPg() { return require(JOURNEY_STORE_PG_PATH); }
function getExportDataSource() { return require(EXPORT_DATA_SOURCE_PATH); }

var passed = 0, failed = 0, failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}

function makeRes() {
  var res = {
    _status: null, _headers: {}, _body: '',
    writeHead: function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); },
    setHeader: function(k, v) { res._headers[k] = v; },
    end: function(body) { res._body += (body || ''); }
  };
  return res;
}

function authReq(extra) {
  return Object.assign({
    session: { accessToken: 'test-token', userId: 1, login: 'user', csrfToken: 'test-csrf-token' },
    params: {}, body: { _csrf: 'test-csrf-token' }, headers: {}
  }, extra || {});
}

/** Enable the Postgres tier with a fake pool whose query() returns the given rows. */
function enablePg(pg, rows, opts) {
  opts = opts || {};
  process.env.DATABASE_URL = 'postgres://fake-jspf-s1-test';
  var queryCalled = false;
  pg._setPoolForTesting({
    query: async function() {
      queryCalled = true;
      if (opts.throws) throw new Error(opts.throws);
      return { rows: rows || [] };
    }
  });
  return { wasCalled: function() { return queryCalled; } };
}

function disablePg(pg) {
  delete process.env.DATABASE_URL;
  pg._setPoolForTesting(null);
}

var DEFINITION_ARTEFACT = [
  '# Epic 1: Mock Epic',
  '',
  '## Stories in this epic',
  '- jspf.1',
  '- jspf.2',
  '',
  '# Story jspf.1 — First mock story',
  'AC1: Something.',
  '',
  '# Story jspf.2 — Second mock story',
  'AC1: Something else.'
].join('\n');

var queue = [];

// ============================================================================
// AC1 -- site 1 (stage-view): Postgres fallback renders content when disk and
// git-fallback both miss.
// ============================================================================
queue.push(function() {
  console.log('\n[jspf-s1] AC1 -- stage-view Postgres fallback renders content when disk+git both miss');
  return test('handleGetJourneyStageView: disk missing, no connected repo, Postgres has content -> renders it', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var pg = getPg();
    var eds = getExportDataSource();
    store._clear();
    var journeyObj = store.createJourney('jspf-ac1-feature');
    var journeyId = journeyObj.journeyId;
    var artefactRelPath = 'artefacts/jspf-ac1-feature/discovery.md';
    store.completeStage(journeyId, 'discovery', artefactRelPath);

    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jspf-ac1-'));
    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpDir); // artefact file never written -- disk miss

    eds.setDbPool(null); // jspf-s1: explicit reset for order-independence -- see AC7.1's comment.
    var pgSpy = enablePg(pg, [{ skill_name: 'discovery', artefact_path: artefactRelPath, content: '# Discovery\n\nREAL-PG-CONTENT-AC1' }]);

    try {
      var req = authReq({ params: { journeyId: journeyId, stageName: 'discovery' } });
      var res = makeRes();
      await journey.handleGetJourneyStageView(req, res);

      assert.ok(res._body.includes('REAL-PG-CONTENT-AC1'), 'expected Postgres-sourced content in the rendered body');
      assert.ok(!res._body.includes('No artefact content found'), 'must not show the default not-found message when Postgres fallback succeeds');
    } finally {
      disablePg(pg);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// AC2 -- site 2 (story-list auto-populate): Postgres fallback fills autoIds
// when disk misses.
// ============================================================================
queue.push(function() {
  console.log('\n[jspf-s1] AC2 -- story-list auto-populate Postgres fallback fills autoIds when disk misses');
  return test('handleGetStories: definition disk file missing, Postgres has content -> textarea auto-populated', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var pg = getPg();
    store._clear();
    var journeyObj = store.createJourney('jspf-ac2-feature');
    var journeyId = journeyObj.journeyId;
    var artefactRelPath = 'artefacts/jspf-ac2-feature/definition.md';
    store.completeStage(journeyId, 'definition', artefactRelPath);

    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jspf-ac2-'));
    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpDir); // disk miss

    enablePg(pg, [{ skill_name: 'definition', artefact_path: artefactRelPath, content: DEFINITION_ARTEFACT }]);

    try {
      var req = authReq({ params: { journeyId: journeyId } });
      var res = makeRes();
      await journey.handleGetStories(req, res, { query: async function() { return { rows: [] }; } });

      assert.strictEqual(res._status, 200);
      assert.ok(res._body.includes('jspf.1'), 'expected the first Postgres-sourced story ID pre-filled');
      assert.ok(res._body.includes('jspf.2'), 'expected the second Postgres-sourced story ID pre-filled');
    } finally {
      disablePg(pg);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// AC3 -- site 3 (review-session context, highest severity): Postgres fallback
// fills priorArtefacts when disk misses.
// ============================================================================
queue.push(function() {
  console.log('\n[jspf-s1] AC3 -- review-session context Postgres fallback fills priorArtefacts when disk misses');
  return test('handlePostStories: 2 completed stages, both disk-missing, both in Postgres -> priorArtefacts carries real content for both', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var pg = getPg();
    store._clear();
    var journeyObj = store.createJourney('jspf-ac3-feature');
    var journeyId = journeyObj.journeyId;
    var discoveryRel = 'artefacts/jspf-ac3-feature/discovery.md';
    var definitionRel = 'artefacts/jspf-ac3-feature/definition.md';
    store.completeStage(journeyId, 'discovery', discoveryRel);
    store.completeStage(journeyId, 'definition', definitionRel);

    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jspf-ac3-'));
    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpDir); // both disk-missing
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});

    enablePg(pg, [
      { skill_name: 'discovery', artefact_path: discoveryRel, content: 'REAL-PG-DISCOVERY-AC3' },
      { skill_name: 'definition', artefact_path: definitionRel, content: 'REAL-PG-DEFINITION-AC3' }
    ]);

    // Intercept _startReviewSessionForJourney's priorArtefacts argument via
    // getRegisterHtmlSession() -- the review session's priorArtefacts is
    // passed straight into registerHtmlSession's options (see
    // _startReviewSessionForJourney in journey.js).
    var capturedOptions = null;
    journey.setRegisterHtmlSession(function(sid, sessionPath, skillName, options) {
      capturedOptions = options;
    });

    try {
      var req = authReq({ params: { journeyId: journeyId }, body: { stories: 'jspf.1', _csrf: 'test-csrf-token' } });
      var res = makeRes();
      await journey.handlePostStories(req, res);

      assert.ok(capturedOptions, 'expected registerHtmlSession to have been called with options');
      var priorArtefacts = capturedOptions.priorArtefacts;
      assert.ok(Array.isArray(priorArtefacts) && priorArtefacts.length === 2, 'expected priorArtefacts to contain both stages');
      var discoveryEntry = priorArtefacts.filter(function(a) { return a.path === discoveryRel; })[0];
      var definitionEntry = priorArtefacts.filter(function(a) { return a.path === definitionRel; })[0];
      assert.ok(discoveryEntry && discoveryEntry.content === 'REAL-PG-DISCOVERY-AC3', 'expected real Postgres-sourced discovery content, not empty');
      assert.ok(definitionEntry && definitionEntry.content === 'REAL-PG-DEFINITION-AC3', 'expected real Postgres-sourced definition content, not empty');
    } finally {
      disablePg(pg);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// AC4 -- site 4 (clarify side-trip context): Postgres fallback fills
// pre-loaded context when disk misses.
// ============================================================================
queue.push(function() {
  console.log('\n[jspf-s1] AC4 -- clarify side-trip Postgres fallback fills pre-loaded context when disk misses');
  return test('handlePostSideTripClarify: discovery disk file missing, Postgres has content -> session pre-loaded with it', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var pg = getPg();
    store._clear();
    var journeyObj = store.createJourney('jspf-ac4-feature');
    var journeyId = journeyObj.journeyId;
    store.setActiveSession(journeyId, 'prev-sess', 'discovery');

    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jspf-ac4-'));
    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpDir); // disk miss

    var sessions = new Map();
    journey.setRegisterHtmlSession(function(id, sessionPath, skill) {
      sessions.set(id, { skillName: skill, systemPrompt: 'SP-' + skill, turns: [], done: false });
    });
    journey.setLinkSessionToJourney(function() {});
    journey.setGetHtmlSession(function(id) { return sessions.get(id); });

    enablePg(pg, [{ skill_name: 'discovery', artefact_path: 'artefacts/jspf-ac4-feature/discovery.md', content: 'REAL-PG-DISCOVERY-AC4' }]);

    try {
      var req = authReq({ params: { journeyId: journeyId } });
      var res = makeRes();
      await journey.handlePostSideTripClarify(req, res);

      assert.strictEqual(res._status, 200);
      var sid = JSON.parse(res._body).sideTripSessionId;
      var session = sessions.get(sid);
      assert.ok(session, 'expected the clarify session to have been registered');
      assert.ok(session.systemPrompt.includes('REAL-PG-DISCOVERY-AC4'), 'expected the real Postgres-sourced discovery content pre-loaded into the session');
    } finally {
      disablePg(pg);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// AC5 -- regression: disk content still wins over Postgres at all 4 sites
// (Postgres is never even consulted when disk succeeds).
// ============================================================================
queue.push(function() {
  console.log('\n[jspf-s1] AC5.1 -- site 1 (stage-view): disk wins, Postgres never consulted');
  return test('handleGetJourneyStageView: disk has content -> Postgres canary never appears, query never called', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var pg = getPg();
    var eds = getExportDataSource();
    eds.setDbPool(null); // jspf-s1: explicit reset for order-independence -- see AC7.1's comment.
    store._clear();
    var journeyObj = store.createJourney('jspf-ac5a-feature');
    var journeyId = journeyObj.journeyId;
    var artefactRelPath = 'artefacts/jspf-ac5a-feature/discovery.md';
    store.completeStage(journeyId, 'discovery', artefactRelPath);

    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jspf-ac5a-'));
    var absPath = path.join(tmpDir, artefactRelPath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, 'DISK-CONTENT-AC5A', 'utf8');
    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpDir);

    var pgSpy = enablePg(pg, [{ skill_name: 'discovery', artefact_path: artefactRelPath, content: 'PG-CANARY — should never appear' }]);

    try {
      var req = authReq({ params: { journeyId: journeyId, stageName: 'discovery' } });
      var res = makeRes();
      await journey.handleGetJourneyStageView(req, res);

      assert.ok(res._body.includes('DISK-CONTENT-AC5A'), 'expected disk content in the rendered body');
      assert.ok(!res._body.includes('PG-CANARY'), 'must never contain the Postgres canary content');
      assert.strictEqual(pgSpy.wasCalled(), false, 'Postgres must never be consulted when disk succeeds');
    } finally {
      disablePg(pg);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

queue.push(function() {
  console.log('\n[jspf-s1] AC5.2 -- site 2 (story-list): disk wins, Postgres never consulted');
  return test('handleGetStories: disk has content -> Postgres canary never appears, query never called', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var pg = getPg();
    store._clear();
    var journeyObj = store.createJourney('jspf-ac5b-feature');
    var journeyId = journeyObj.journeyId;
    var artefactRelPath = 'artefacts/jspf-ac5b-feature/definition.md';
    store.completeStage(journeyId, 'definition', artefactRelPath);

    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jspf-ac5b-'));
    var absPath = path.join(tmpDir, artefactRelPath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, '# Story disk-content\n\n## dcw.1 — Disk content wins\nAC1: x.', 'utf8');
    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpDir);

    var pgSpy = enablePg(pg, [{ skill_name: 'definition', artefact_path: artefactRelPath, content: '## pg.1 — PG CANARY should never appear\nAC1: x.' }]);

    try {
      var req = authReq({ params: { journeyId: journeyId } });
      var res = makeRes();
      await journey.handleGetStories(req, res, { query: async function() { return { rows: [] }; } });

      assert.ok(res._body.includes('dcw.1'), 'expected disk-sourced story ID');
      assert.ok(!res._body.includes('pg.1'), 'must never contain the Postgres canary story ID');
      assert.strictEqual(pgSpy.wasCalled(), false, 'Postgres must never be consulted when disk succeeds');
    } finally {
      disablePg(pg);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

queue.push(function() {
  console.log('\n[jspf-s1] AC5.3 -- site 3 (review-session context): disk wins, Postgres never consulted');
  return test('handlePostStories: disk has content -> priorArtefacts carries disk content, Postgres canary never appears', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var pg = getPg();
    store._clear();
    var journeyObj = store.createJourney('jspf-ac5c-feature');
    var journeyId = journeyObj.journeyId;
    var artefactRelPath = 'artefacts/jspf-ac5c-feature/discovery.md';
    store.completeStage(journeyId, 'discovery', artefactRelPath);

    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jspf-ac5c-'));
    var absPath = path.join(tmpDir, artefactRelPath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, 'DISK-CONTENT-AC5C', 'utf8');
    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpDir);
    journey.setLinkSessionToJourney(function() {});

    var capturedOptions = null;
    journey.setRegisterHtmlSession(function(sid, sessionPath, skillName, options) { capturedOptions = options; });

    var pgSpy = enablePg(pg, [{ skill_name: 'discovery', artefact_path: artefactRelPath, content: 'PG-CANARY — should never appear' }]);

    try {
      var req = authReq({ params: { journeyId: journeyId }, body: { stories: 'jspf.1', _csrf: 'test-csrf-token' } });
      var res = makeRes();
      await journey.handlePostStories(req, res);

      assert.ok(capturedOptions, 'expected registerHtmlSession to have been called');
      var entry = capturedOptions.priorArtefacts.filter(function(a) { return a.path === artefactRelPath; })[0];
      assert.ok(entry && entry.content === 'DISK-CONTENT-AC5C', 'expected disk content, not Postgres content');
      assert.strictEqual(pgSpy.wasCalled(), false, 'Postgres must never be consulted when disk succeeds');
    } finally {
      disablePg(pg);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

queue.push(function() {
  console.log('\n[jspf-s1] AC5.4 -- site 4 (clarify side-trip): disk wins, Postgres never consulted');
  return test('handlePostSideTripClarify: disk has content -> session pre-loaded with disk content, Postgres canary never appears', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var pg = getPg();
    store._clear();
    var journeyObj = store.createJourney('jspf-ac5d-feature');
    var journeyId = journeyObj.journeyId;
    store.setActiveSession(journeyId, 'prev-sess', 'discovery');

    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jspf-ac5d-'));
    var absPath = path.join(tmpDir, 'artefacts', 'jspf-ac5d-feature', 'discovery.md');
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, 'DISK-CONTENT-AC5D', 'utf8');
    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpDir);

    var sessions = new Map();
    journey.setRegisterHtmlSession(function(id, sessionPath, skill) {
      sessions.set(id, { skillName: skill, systemPrompt: 'SP-' + skill, turns: [], done: false });
    });
    journey.setLinkSessionToJourney(function() {});
    journey.setGetHtmlSession(function(id) { return sessions.get(id); });

    var pgSpy = enablePg(pg, [{ skill_name: 'discovery', artefact_path: 'artefacts/jspf-ac5d-feature/discovery.md', content: 'PG-CANARY — should never appear' }]);

    try {
      var req = authReq({ params: { journeyId: journeyId } });
      var res = makeRes();
      await journey.handlePostSideTripClarify(req, res);

      var sid = JSON.parse(res._body).sideTripSessionId;
      var session = sessions.get(sid);
      assert.ok(session.systemPrompt.includes('DISK-CONTENT-AC5D'), 'expected disk content pre-loaded');
      assert.ok(!session.systemPrompt.includes('PG-CANARY'), 'must never contain the Postgres canary content');
      assert.strictEqual(pgSpy.wasCalled(), false, 'Postgres must never be consulted when disk succeeds');
    } finally {
      disablePg(pg);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// AC6 -- regression: site 1's existing git-fallback still works when disk AND
// Postgres both have nothing.
// ============================================================================
queue.push(function() {
  console.log('\n[jspf-s1] AC6 -- site 1 git-fallback still works when disk and Postgres both miss');
  return test('handleGetJourneyStageView: disk missing, Postgres empty, git-fallback succeeds -> git content rendered', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var pg = getPg();
    var eds = getExportDataSource();
    store._clear();
    var journeyObj = store.createJourney('jspf-ac6-feature');
    var journeyId = journeyObj.journeyId;
    var artefactRelPath = 'artefacts/jspf-ac6-feature/discovery.md';
    store.completeStage(journeyId, 'discovery', artefactRelPath);

    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jspf-ac6-'));
    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpDir); // disk miss

    var pgSpy = enablePg(pg, []); // Postgres has nothing for this stage

    eds.setDbPool({
      query: async function(sql, params) {
        var s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
        if (s.startsWith('SELECT PRODUCT_ID, TENANT_ID FROM JOURNEYS')) {
          return { rows: [{ product_id: 'p1', tenant_id: 't1' }] };
        }
        if (s.startsWith('SELECT REPO_OWNER, REPO_NAME FROM PRODUCTS')) {
          return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
        }
        return { rows: [] };
      }
    });

    var marker = 'GIT-FALLBACK-CONTENT-AC6-' + Date.now();
    var b64 = Buffer.from('# Discovery\n\n' + marker, 'utf8').toString('base64');
    var originalFetch = global.fetch;
    global.fetch = async function(url) {
      if (url.includes('/repos/acme/widgets/contents/' + artefactRelPath)) {
        return { ok: true, status: 200, json: async function() { return { content: b64, encoding: 'base64' }; } };
      }
      return { ok: false, status: 404, json: async function() { return { message: 'Not Found' }; } };
    };

    try {
      var req = authReq({ params: { journeyId: journeyId, stageName: 'discovery' } });
      var res = makeRes();
      await journey.handleGetJourneyStageView(req, res);

      assert.ok(res._body.includes(marker), 'expected git-fallback content to be rendered when disk and Postgres both miss');
      assert.ok(!res._body.includes('No artefact content found'), 'must not show the default not-found message when git-fallback succeeds');
    } finally {
      global.fetch = originalFetch;
      eds.setDbPool(null); // jspf-s1: export-data-source is a require()-cached singleton not reset by freshRequireJourney() -- leaving a pool wired here would leak into later tests expecting "no connected repo".
      disablePg(pg);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// AC7 -- true-empty case unchanged at all 4 sites (disk, Postgres, and for
// site 1, git all have nothing).
// ============================================================================
queue.push(function() {
  console.log('\n[jspf-s1] AC7.1 -- site 1: true-empty case shows the default not-found message');
  return test('handleGetJourneyStageView: disk, Postgres, and git all miss -> "No artefact content found"', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var pg = getPg();
    var eds = getExportDataSource();
    store._clear();
    var journeyObj = store.createJourney('jspf-ac7a-feature');
    var journeyId = journeyObj.journeyId;
    var artefactRelPath = 'artefacts/jspf-ac7a-feature/discovery.md';
    store.completeStage(journeyId, 'discovery', artefactRelPath);

    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jspf-ac7a-'));
    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpDir);

    eds.setDbPool(null); // jspf-s1: explicit reset -- export-data-source is a require()-cached singleton, must not inherit a pool left wired by an earlier test in this file.
    enablePg(pg, []); // nothing in Postgres either
    // ownerRepoForFeature throws with no pool wired, git-fallback silently no-ops.

    try {
      var req = authReq({ params: { journeyId: journeyId, stageName: 'discovery' } });
      var res = makeRes();
      await journey.handleGetJourneyStageView(req, res);

      assert.ok(res._body.includes('No artefact content found'), 'expected the unchanged default not-found message');
    } finally {
      disablePg(pg);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

queue.push(function() {
  console.log('\n[jspf-s1] AC7.2 -- site 2: true-empty case shows an empty textarea');
  return test('handleGetStories: disk and Postgres both miss -> empty textarea, no error', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var pg = getPg();
    store._clear();
    var journeyObj = store.createJourney('jspf-ac7b-feature');
    var journeyId = journeyObj.journeyId;
    var artefactRelPath = 'artefacts/jspf-ac7b-feature/definition.md';
    store.completeStage(journeyId, 'definition', artefactRelPath);

    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jspf-ac7b-'));
    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpDir);

    enablePg(pg, []);

    try {
      var req = authReq({ params: { journeyId: journeyId } });
      var res = makeRes();
      await journey.handleGetStories(req, res, { query: async function() { return { rows: [] }; } });

      assert.strictEqual(res._status, 200);
      var taMatch = res._body.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/);
      assert.ok(taMatch, 'expected to find the textarea');
      assert.strictEqual(taMatch[1].trim(), '', 'expected an empty textarea when neither source has content');
    } finally {
      disablePg(pg);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

queue.push(function() {
  console.log('\n[jspf-s1] AC7.3 -- site 3: true-empty case leaves priorArtefacts content empty');
  return test('handlePostStories: disk and Postgres both miss -> priorArtefacts entry has empty content, no error', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var pg = getPg();
    store._clear();
    var journeyObj = store.createJourney('jspf-ac7c-feature');
    var journeyId = journeyObj.journeyId;
    var artefactRelPath = 'artefacts/jspf-ac7c-feature/discovery.md';
    store.completeStage(journeyId, 'discovery', artefactRelPath);

    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jspf-ac7c-'));
    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpDir);
    journey.setLinkSessionToJourney(function() {});

    var capturedOptions = null;
    journey.setRegisterHtmlSession(function(sid, sessionPath, skillName, options) { capturedOptions = options; });

    enablePg(pg, []);

    try {
      var req = authReq({ params: { journeyId: journeyId }, body: { stories: 'jspf.1', _csrf: 'test-csrf-token' } });
      var res = makeRes();
      await journey.handlePostStories(req, res);

      assert.ok(capturedOptions, 'expected registerHtmlSession to have been called');
      var entry = capturedOptions.priorArtefacts.filter(function(a) { return a.path === artefactRelPath; })[0];
      assert.ok(entry, 'expected a priorArtefacts entry for the stage');
      assert.strictEqual(entry.content, '', 'expected empty content when neither source has anything');
    } finally {
      disablePg(pg);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

queue.push(function() {
  console.log('\n[jspf-s1] AC7.4 -- site 4: true-empty case leaves the session with no pre-loaded content');
  return test('handlePostSideTripClarify: disk and Postgres both miss -> session created with no discovery content appended, no error', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var pg = getPg();
    store._clear();
    var journeyObj = store.createJourney('jspf-ac7d-feature');
    var journeyId = journeyObj.journeyId;
    store.setActiveSession(journeyId, 'prev-sess', 'discovery');

    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jspf-ac7d-'));
    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpDir);

    var sessions = new Map();
    journey.setRegisterHtmlSession(function(id, sessionPath, skill) {
      sessions.set(id, { skillName: skill, systemPrompt: 'SP-' + skill, turns: [], done: false });
    });
    journey.setLinkSessionToJourney(function() {});
    journey.setGetHtmlSession(function(id) { return sessions.get(id); });

    enablePg(pg, []);

    try {
      var req = authReq({ params: { journeyId: journeyId } });
      var res = makeRes();
      await journey.handlePostSideTripClarify(req, res);

      assert.strictEqual(res._status, 200);
      var sid = JSON.parse(res._body).sideTripSessionId;
      var session = sessions.get(sid);
      assert.ok(session, 'expected the clarify session to have been registered');
      assert.strictEqual(session.systemPrompt, 'SP-clarify', 'expected the systemPrompt to be unchanged (no pre-loaded content appended) when neither source has anything');
    } finally {
      disablePg(pg);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// AC8 -- Postgres-lookup-throws degrades safely at all 4 sites (no unhandled
// exception, falls through to each site's own next behaviour).
// ============================================================================
queue.push(function() {
  console.log('\n[jspf-s1] AC8.1 -- site 1: Postgres throws -> degrades to default not-found message, no crash');
  return test('handleGetJourneyStageView: disk misses, Postgres query throws, no connected repo -> "No artefact content found", no unhandled exception', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var pg = getPg();
    var eds = getExportDataSource();
    store._clear();
    var journeyObj = store.createJourney('jspf-ac8a-feature');
    var journeyId = journeyObj.journeyId;
    var artefactRelPath = 'artefacts/jspf-ac8a-feature/discovery.md';
    store.completeStage(journeyId, 'discovery', artefactRelPath);

    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jspf-ac8a-'));
    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpDir);

    eds.setDbPool(null); // jspf-s1: explicit reset -- see AC7.1's comment.
    enablePg(pg, [], { throws: 'DB connection failed' });

    var threw = false;
    try {
      var req = authReq({ params: { journeyId: journeyId, stageName: 'discovery' } });
      var res = makeRes();
      await journey.handleGetJourneyStageView(req, res);
      assert.ok(res._body.includes('No artefact content found'), 'expected the default not-found message after Postgres throws and git-fallback is not connected');
    } catch (_e) {
      threw = true;
    } finally {
      disablePg(pg);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    assert.strictEqual(threw, false, 'handleGetJourneyStageView must not throw when the Postgres lookup fails');
  });
});

queue.push(function() {
  console.log('\n[jspf-s1] AC8.2 -- site 2: Postgres throws -> degrades to empty textarea, no crash');
  return test('handleGetStories: disk misses, Postgres query throws -> empty textarea, no unhandled exception', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var pg = getPg();
    store._clear();
    var journeyObj = store.createJourney('jspf-ac8b-feature');
    var journeyId = journeyObj.journeyId;
    var artefactRelPath = 'artefacts/jspf-ac8b-feature/definition.md';
    store.completeStage(journeyId, 'definition', artefactRelPath);

    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jspf-ac8b-'));
    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpDir);

    enablePg(pg, [], { throws: 'DB connection failed' });

    var threw = false;
    try {
      var req = authReq({ params: { journeyId: journeyId } });
      var res = makeRes();
      await journey.handleGetStories(req, res, { query: async function() { return { rows: [] }; } });
      assert.strictEqual(res._status, 200);
      var taMatch = res._body.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/);
      assert.ok(taMatch);
      assert.strictEqual(taMatch[1].trim(), '', 'expected an empty textarea when Postgres throws');
    } catch (_e) {
      threw = true;
    } finally {
      disablePg(pg);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    assert.strictEqual(threw, false, 'handleGetStories must not throw when the Postgres lookup fails');
  });
});

queue.push(function() {
  console.log('\n[jspf-s1] AC8.3 -- site 3: Postgres throws -> priorArtefacts content empty, no crash');
  return test('handlePostStories: disk misses, Postgres query throws -> priorArtefacts entry empty, no unhandled exception', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var pg = getPg();
    store._clear();
    var journeyObj = store.createJourney('jspf-ac8c-feature');
    var journeyId = journeyObj.journeyId;
    var artefactRelPath = 'artefacts/jspf-ac8c-feature/discovery.md';
    store.completeStage(journeyId, 'discovery', artefactRelPath);

    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jspf-ac8c-'));
    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpDir);
    journey.setLinkSessionToJourney(function() {});

    var capturedOptions = null;
    journey.setRegisterHtmlSession(function(sid, sessionPath, skillName, options) { capturedOptions = options; });

    enablePg(pg, [], { throws: 'DB connection failed' });

    var threw = false;
    try {
      var req = authReq({ params: { journeyId: journeyId }, body: { stories: 'jspf.1', _csrf: 'test-csrf-token' } });
      var res = makeRes();
      await journey.handlePostStories(req, res);
      assert.ok(capturedOptions);
      var entry = capturedOptions.priorArtefacts.filter(function(a) { return a.path === artefactRelPath; })[0];
      assert.ok(entry);
      assert.strictEqual(entry.content, '', 'expected empty content when Postgres throws');
    } catch (_e) {
      threw = true;
    } finally {
      disablePg(pg);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    assert.strictEqual(threw, false, 'handlePostStories must not throw when the Postgres lookup fails');
  });
});

queue.push(function() {
  console.log('\n[jspf-s1] AC8.4 -- site 4: Postgres throws -> no pre-loaded content, no crash');
  return test('handlePostSideTripClarify: disk misses, Postgres query throws -> session created with no pre-loaded content, no unhandled exception', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var pg = getPg();
    store._clear();
    var journeyObj = store.createJourney('jspf-ac8d-feature');
    var journeyId = journeyObj.journeyId;
    store.setActiveSession(journeyId, 'prev-sess', 'discovery');

    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jspf-ac8d-'));
    journey.setJourneyStoreModule(store);
    journey.setRepoRoot(tmpDir);

    var sessions = new Map();
    journey.setRegisterHtmlSession(function(id, sessionPath, skill) {
      sessions.set(id, { skillName: skill, systemPrompt: 'SP-' + skill, turns: [], done: false });
    });
    journey.setLinkSessionToJourney(function() {});
    journey.setGetHtmlSession(function(id) { return sessions.get(id); });

    enablePg(pg, [], { throws: 'DB connection failed' });

    var threw = false;
    try {
      var req = authReq({ params: { journeyId: journeyId } });
      var res = makeRes();
      await journey.handlePostSideTripClarify(req, res);
      assert.strictEqual(res._status, 200);
      var sid = JSON.parse(res._body).sideTripSessionId;
      var session = sessions.get(sid);
      assert.ok(session);
      assert.strictEqual(session.systemPrompt, 'SP-clarify', 'expected unchanged systemPrompt when Postgres throws');
    } catch (_e) {
      threw = true;
    } finally {
      disablePg(pg);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    assert.strictEqual(threw, false, 'handlePostSideTripClarify must not throw when the Postgres lookup fails');
  });
});

// ============================================================================
// Runner
// ============================================================================
(async function() {
  console.log('\n[jspf-s1-journey-postgres-fallback] Running ' + queue.length + ' AC verification tests...');
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }
  console.log('\n[jspf-s1-journey-postgres-fallback] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
