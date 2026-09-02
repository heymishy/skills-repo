'use strict';
// check-acdg-s1-commit-guard.js
// TDD tests for acdg-s1: fix the silent artefact-commit failure in
// stage-completion (AC2 guard). Reuses das-s1's own proven fixture
// pattern (check-das-s1-commit-artefact-git-fallback.js) since this story
// touches the exact same handlePostGateConfirm call site.
//
// Covers AC1, AC2-revised, AC3-revised, AC4 per
// artefacts/2026-09-01-artefact-commit-durability-gap/test-plans/acdg-s1-test-plan.md

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
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}

var JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
var EXPORT_DATA_SOURCE_PATH = path.resolve(__dirname, '../src/web-ui/adapters/export-data-source.js');
var ARTEFACT_COMMIT_WRITER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/artefact-commit-writer.js');

function freshRequireJourney() {
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch (_) {}
  return require(JOURNEY_PATH);
}
function getStore() { return require(JOURNEY_STORE_PATH); }
function getExportDataSource() { return require(EXPORT_DATA_SOURCE_PATH); }
function getArtefactCommitWriter() { return require(ARTEFACT_COMMIT_WRITER_PATH); }

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
    params: {},
    body: { _csrf: 'test-csrf-token' }
  }, extra || {});
}

var tmpRoot = path.join(os.tmpdir(), 'acdg-s1-tests-' + Date.now());
fs.mkdirSync(tmpRoot, { recursive: true });

function createMockPool(journeyRows, productRows) {
  async function query(sql, params) {
    var s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
    if (s.startsWith('SELECT PRODUCT_ID, TENANT_ID FROM JOURNEYS WHERE FEATURE_SLUG')) {
      var slug = params[0];
      var match = journeyRows.filter(function(r) { return r.feature_slug === slug; });
      return { rows: match.map(function(r) { return { product_id: r.product_id, tenant_id: r.tenant_id }; }) };
    }
    if (s.startsWith('SELECT REPO_OWNER, REPO_NAME FROM PRODUCTS WHERE PRODUCT_ID') && s.includes('TENANT_ID')) {
      var productId = params[0], tenantId = params[1];
      var pmatch = productRows.filter(function(r) { return r.product_id === productId && r.tenant_id === tenantId; });
      return { rows: pmatch.map(function(r) { return { repo_owner: r.repo_owner, repo_name: r.repo_name }; }) };
    }
    return { rows: [] };
  }
  return { query: query };
}

function setupStageSession(journey, store, opts) {
  opts = opts || {};
  var featureSlug = opts.featureSlug || ('test-feature-acdg-s1-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  var skillName = opts.skillName || 'review';
  var artefactRelPath = opts.artefactRelPath || ('artefacts/' + featureSlug + '/' + skillName + '.md');
  var artefactContent = opts.artefactContent || ('# ' + skillName + ' artefact for ' + featureSlug);

  var journeyObj = store.createJourney(featureSlug);
  var journeyId = journeyObj.journeyId;
  var sid = 'sid-acdg-s1-' + Date.now() + '-' + Math.random();
  store.setActiveSession(journeyId, sid, skillName);

  if (opts.productId) {
    store.setJourneyFields(journeyId, { productId: opts.productId });
  }

  if (opts.writeArtefact !== false) {
    var absArtefact = path.join(tmpRoot, artefactRelPath);
    fs.mkdirSync(path.dirname(absArtefact), { recursive: true });
    fs.writeFileSync(absArtefact, artefactContent, 'utf8');
  }

  journey.setJourneyStoreModule(store);
  journey.setRegisterHtmlSession(function() {});
  journey.setLinkSessionToJourney(function() {});
  journey.setRepoRoot(tmpRoot);
  journey.setPipelineStateWriter(function() {});

  journey.setGetHtmlSession(function(s) {
    if (s === sid) {
      return { skillName: skillName, done: true, artefactPath: artefactRelPath, artefactContent: artefactContent, journeyId: journeyId, turns: [], systemPrompt: 'test' };
    }
    return null;
  });

  return { journeyId: journeyId, sid: sid, featureSlug: featureSlug, artefactRelPath: artefactRelPath, artefactContent: artefactContent, skillName: skillName };
}

var queue = [];

// ---------------------------------------------------------------------------
// AC1 (unit, regression-protection) — commitArtefact throws after a
// successful resolve -> blocks completion, returns the existing error.
// Expected to PASS on unmodified code (confirmed via full code read of
// artefact-commit-writer.js during /branch-setup).
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('commitArtefactThrowsAfterSuccessfulResolve_blocksCompletion', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();
    var acw = getArtefactCommitWriter();

    var setup = setupStageSession(journey, store, {});
    var pool = createMockPool(
      [{ feature_slug: setup.featureSlug, product_id: 'p1', tenant_id: 't1' }],
      [{ product_id: 'p1', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }]
    );
    eds.setDbPool(pool);
    acw.setArtefactCommitAdapter(async function() { throw new Error('simulated GitHub API failure'); });

    var req = authReq({ params: { journeyId: setup.journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.ok(res._status >= 400, 'expected an error status, got ' + res._status);
    var journeyObj = store.getJourney(setup.journeyId);
    var stageEntry = (journeyObj.completedStages || []).find(function(s) { return s.skillName === setup.skillName; });
    assert.strictEqual(stageEntry, undefined, 'stage must NOT be marked complete when the commit fails');
  });
});

// ---------------------------------------------------------------------------
// AC2-revised (unit, THE FIX) — journey.productId is set, but
// ownerRepoForFeature throws -> genuine anomaly, must block + error.
// Expected to FAIL on unmodified code (today silently skips regardless of
// productId). This directly reproduces the shape of new-feature-af17f555's
// own historical incident.
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('productIdSetButResolutionFails_blocksCompletionWithClearError', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();
    var acw = getArtefactCommitWriter();

    var setup = setupStageSession(journey, store, { productId: 'linked-product-id' });
    // No matching journey/product row at all -- ownerRepoForFeature throws
    // ExportNotFoundError, exactly as it did for new-feature-af17f555.
    var pool = createMockPool([], []);
    eds.setDbPool(pool);
    var commitCalled = false;
    acw.setArtefactCommitAdapter(async function() { commitCalled = true; return { ok: true }; });

    var req = authReq({ params: { journeyId: setup.journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.ok(res._status >= 400, 'expected an error status for a productId-linked journey whose resolution failed, got ' + res._status);
    assert.ok(!commitCalled, 'commitArtefact must never be reached when resolution itself failed');
    var journeyObj = store.getJourney(setup.journeyId);
    var stageEntry = (journeyObj.completedStages || []).find(function(s) { return s.skillName === setup.skillName; });
    assert.strictEqual(stageEntry, undefined, 'stage must NOT be marked complete -- this is the fix for the confirmed historical bug');
  });
});

// ---------------------------------------------------------------------------
// AC3-revised (unit, regression-protection) — journey.productId is NOT
// set -> genuinely no product link, commit skipped, no error.
// Expected to PASS on unmodified code (unchanged behaviour).
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('productIdUnset_resolutionFailsSilentlyUnchanged', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();
    var acw = getArtefactCommitWriter();

    var setup = setupStageSession(journey, store, {}); // no productId
    var pool = createMockPool([], []);
    eds.setDbPool(pool);
    var commitCalled = false;
    acw.setArtefactCommitAdapter(async function() { commitCalled = true; return { ok: true }; });

    var req = authReq({ params: { journeyId: setup.journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.ok(!commitCalled, 'commit adapter must never be called for a genuinely unlinked feature');
    assert.ok(res._status === null || res._status < 400, 'no error should be surfaced for a genuinely unlinked feature, got status ' + res._status);
    var journeyObj = store.getJourney(setup.journeyId);
    var stageEntry = (journeyObj.completedStages || []).find(function(s) { return s.skillName === setup.skillName; });
    assert.ok(stageEntry, 'stage must be marked complete exactly as before this story for genuinely unlinked features');
  });
});

// ---------------------------------------------------------------------------
// Integration — full request-level test for AC2-revised
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('integration_linkedFeatureResolutionFailure_journeyNeverGainsCompletedStage', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();

    var setup = setupStageSession(journey, store, { productId: 'linked-product-id' });
    eds.setDbPool(createMockPool([], []));

    var req = authReq({ params: { journeyId: setup.journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    var reloaded = store.getJourney(setup.journeyId);
    assert.strictEqual((reloaded.completedStages || []).length, 0, 'journey must show zero completed stages after a blocked completion');
  });
});

// ---------------------------------------------------------------------------
// Integration — full request-level test for AC3-revised
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('integration_unlinkedFeature_journeyGainsCompletedStageUnchanged', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();

    var setup = setupStageSession(journey, store, {});
    eds.setDbPool(createMockPool([], []));

    var req = authReq({ params: { journeyId: setup.journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    var reloaded = store.getJourney(setup.journeyId);
    assert.strictEqual((reloaded.completedStages || []).length, 1, 'journey must show exactly one completed stage, unchanged from pre-story behaviour');
  });
});

// ---------------------------------------------------------------------------
// NFR — Performance: no wasted commitArtefact call when resolution itself
// already failed (no new round-trip introduced by this story's fix)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('nfr_noWastedCommitCallWhenResolutionFails', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();
    var acw = getArtefactCommitWriter();

    var setup = setupStageSession(journey, store, { productId: 'linked-product-id' });
    eds.setDbPool(createMockPool([], []));
    var commitCallCount = 0;
    acw.setArtefactCommitAdapter(async function() { commitCallCount++; return { ok: true }; });

    var req = authReq({ params: { journeyId: setup.journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.strictEqual(commitCallCount, 0, 'commitArtefact must never be invoked when ownerRepoForFeature already failed -- no wasted round-trip');
  });
});

// NFR — Security: not independently automated-testable as a negative
// property beyond code review (per test plan) -- verified manually at DoD
// by diffing the PR against journey.js's existing req.session.accessToken
// usage, confirming no new credential parameter or full artefact body is
// added to any error message. No automated test for this NFR.

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
(async function() {
  console.log('\ncheck-acdg-s1-commit-guard.js');
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) {
      console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err));
    });
    process.exit(1);
  }
})();
