'use strict';
// check-das-s3-backfill-on-repo-connect.js
// TDD tests for das-s3: backfill already-completed stage artefacts (still on
// local disk) to a product's repo at the moment it's connected. Tests
// AC1-AC4 per
// artefacts/2026-08-06-durable-artefact-storage/test-plans/das-s3-test-plan.md

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

var ARTEFACT_BACKFILL_PATH = path.resolve(__dirname, '../src/web-ui/adapters/artefact-backfill.js');
var ARTEFACT_COMMIT_WRITER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/artefact-commit-writer.js');
var PRODUCT_REPO_PATH = path.resolve(__dirname, '../src/web-ui/routes/product-repo.js');
var PRODUCTS_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var REPO_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/repo-adapter.js');

function getBackfill() { return require(ARTEFACT_BACKFILL_PATH); }
function getCommitWriter() { return require(ARTEFACT_COMMIT_WRITER_PATH); }
function getProductRepo() { return require(PRODUCT_REPO_PATH); }
function getProducts() { return require(PRODUCTS_PATH); }
function getRepoAdapter() { return require(REPO_ADAPTER_PATH); }

var tmpRoot = path.join(os.tmpdir(), 'das-s3-tests-' + Date.now());
fs.mkdirSync(tmpRoot, { recursive: true });

function writeArtefact(relPath, content) {
  var abs = path.join(tmpRoot, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
  return abs;
}

function makeJourney(featureSlug, completedStages) {
  return { featureSlug: featureSlug, completedStages: completedStages };
}

function mockRes() {
  return {
    _status: null, _body: null,
    status: function(c) { this._status = c; return this; },
    json: function(b) { this._body = b; return this; }
  };
}

/**
 * Shared mock pool for tests exercising _applyRepoChange / route handlers.
 * `products` -- [{product_id, tenant_id}], `journeys` -- [{product_id, tenant_id, feature_slug, data}]
 */
function makeMockPool(products, journeys) {
  var queries = [];
  return {
    _queries: queries,
    query: async function(sql, params) {
      queries.push({ sql: sql, params: params });
      if (/SELECT product_id, tenant_id FROM products WHERE product_id/i.test(sql)) {
        var p = (products || []).find(function(x) { return x.product_id === params[0]; });
        return { rows: p ? [p] : [] };
      }
      if (/SELECT feature_slug, data FROM journeys WHERE product_id/i.test(sql)) {
        var pid = params[0], tid = params[1];
        var matches = (journeys || []).filter(function(j) { return j.product_id === pid && j.tenant_id === tid; });
        return { rows: matches.map(function(j) { return { feature_slug: j.feature_slug, data: j.data }; }) };
      }
      if (/UPDATE products SET repo_provider/i.test(sql)) {
        return { rows: [] };
      }
      return { rows: [] };
    }
  };
}

var queue = [];

// ---------------------------------------------------------------------------
// AC1 (unit) — each completed stage with local content still present gets
// committed, one commit-adapter call per stage.
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('backfillCompletedStages_commitsEachStageWithLocalContent', async function() {
    var backfill = getBackfill();
    var acw = getCommitWriter();
    var slug = 'das-s3-ac1-' + Date.now();
    var stages = [
      { skillName: 'discovery', artefactPath: 'artefacts/' + slug + '/discovery.md' },
      { skillName: 'benefit-metric', artefactPath: 'artefacts/' + slug + '/benefit-metric.md' },
      { skillName: 'definition', artefactPath: 'artefacts/' + slug + '/definition.md' }
    ];
    stages.forEach(function(s) { writeArtefact(s.artefactPath, '# content for ' + s.skillName); });
    var journey = makeJourney(slug, stages);

    var commitCalls = [];
    acw.setArtefactCommitAdapter(async function(artefactPath, content, token, owner, repo) {
      commitCalls.push({ artefactPath: artefactPath, content: content, token: token, owner: owner, repo: repo });
      return { ok: true };
    });

    var result = await backfill.backfillCompletedStagesToRepo(journey, 'acme', 'widgets', 'test-token', tmpRoot);

    assert.strictEqual(commitCalls.length, 3, 'commit adapter must be called once per completed stage with local content');
    stages.forEach(function(s, i) {
      assert.strictEqual(commitCalls[i].artefactPath, s.artefactPath);
      assert.strictEqual(commitCalls[i].content, '# content for ' + s.skillName);
      assert.strictEqual(commitCalls[i].owner, 'acme');
      assert.strictEqual(commitCalls[i].repo, 'widgets');
      assert.strictEqual(commitCalls[i].token, 'test-token');
    });
    assert.deepStrictEqual(result, { attempted: 3, succeeded: 3, skipped: [] });
  });
});

// ---------------------------------------------------------------------------
// AC1 (architecture constraint) — reuses das-s1's artefact-commit-writer.js's
// commitArtefact, not a new/separate commit implementation.
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('backfillCompletedStages_reusesArtefactCommitWriter', async function() {
    var backfill = getBackfill();
    var acw = getCommitWriter();
    var slug = 'das-s3-reuse-' + Date.now();
    var stages = [{ skillName: 'discovery', artefactPath: 'artefacts/' + slug + '/discovery.md' }];
    stages.forEach(function(s) { writeArtefact(s.artefactPath, '# content'); });
    var journey = makeJourney(slug, stages);

    acw.setArtefactCommitAdapter(async function() { return { ok: true }; });

    var originalCommitArtefact = acw.commitArtefact;
    var callCount = 0;
    acw.commitArtefact = function() {
      callCount++;
      return originalCommitArtefact.apply(acw, arguments);
    };

    try {
      await backfill.backfillCompletedStagesToRepo(journey, 'acme', 'widgets', 'test-token', tmpRoot);
      assert.strictEqual(callCount, 1, 'the backfill function must call artefact-commit-writer.js\'s own exported commitArtefact -- not a separate, new commit implementation');
    } finally {
      acw.commitArtefact = originalCommitArtefact;
    }
  });
});

// ---------------------------------------------------------------------------
// AC2 (unit, edge case) — a stage whose local file no longer exists is
// skipped; the other stages still proceed (best-effort, not all-or-nothing).
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('backfillCompletedStages_skipsStageWithMissingLocalFile', async function() {
    var backfill = getBackfill();
    var acw = getCommitWriter();
    var slug = 'das-s3-ac2-' + Date.now();
    var stages = [
      { skillName: 'discovery', artefactPath: 'artefacts/' + slug + '/discovery.md' },
      { skillName: 'benefit-metric', artefactPath: 'artefacts/' + slug + '/benefit-metric.md' },
      { skillName: 'definition', artefactPath: 'artefacts/' + slug + '/definition.md' }
    ];
    stages.forEach(function(s) { writeArtefact(s.artefactPath, '# content for ' + s.skillName); });
    // Simulate a prior redeploy having wiped the middle stage's local file.
    fs.unlinkSync(path.join(tmpRoot, stages[1].artefactPath));
    var journey = makeJourney(slug, stages);

    var commitCalls = [];
    acw.setArtefactCommitAdapter(async function(artefactPath) {
      commitCalls.push(artefactPath);
      return { ok: true };
    });

    var result = await backfill.backfillCompletedStagesToRepo(journey, 'acme', 'widgets', 'test-token', tmpRoot);

    assert.strictEqual(commitCalls.length, 2, 'commit adapter must be called for the 2 stages whose local content still exists');
    assert.ok(!commitCalls.includes(stages[1].artefactPath), 'the missing stage must never be attempted');
    assert.strictEqual(result.attempted, 3);
    assert.strictEqual(result.succeeded, 2);
    assert.deepStrictEqual(result.skipped, ['benefit-metric']);
  });
});

// ---------------------------------------------------------------------------
// AC4 (unit, negative control) — zero completed stages -> zero work attempted
// at all, exercised through _applyRepoChange itself (the common path).
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('backfillCompletedStages_noOpsForZeroCompletedStages', async function() {
    var productRepo = getProductRepo();
    var repoAdapter = getRepoAdapter();
    var acw = getCommitWriter();

    repoAdapter.setRepoAdapter(async function() { return { hasAccess: true, status: 200 }; });
    var commitCalled = false;
    acw.setArtefactCommitAdapter(async function() { commitCalled = true; return { ok: true }; });

    var slug = 'das-s3-ac4-' + Date.now();
    var pool = makeMockPool(
      [{ product_id: 'prod-ac4', tenant_id: 'tenant-ac4' }],
      [{ product_id: 'prod-ac4', tenant_id: 'tenant-ac4', feature_slug: slug, data: { featureSlug: slug, completedStages: [] } }]
    );

    var originalExistsSync = fs.existsSync;
    var existsSyncCalls = 0;
    fs.existsSync = function() { existsSyncCalls++; return originalExistsSync.apply(fs, arguments); };

    var result;
    try {
      result = await productRepo._applyRepoChange(pool, 'prod-ac4', 'tenant-ac4', 'acme', 'widgets', 'test-token');
    } finally {
      fs.existsSync = originalExistsSync;
    }

    assert.ok(result.success);
    assert.deepStrictEqual(result.backfill, { attempted: 0, succeeded: 0, skipped: [] });
    assert.ok(!commitCalled, 'commit adapter must never be called when there are zero completed stages');
    assert.strictEqual(existsSyncCalls, 0, 'zero completed stages must add zero local-file-existence checks (AC4: no wasted work on the common path)');
  });
});

// ---------------------------------------------------------------------------
// AC3 (unit) — _applyRepoChange's own return value includes the exact
// backfill shape: { attempted, succeeded, skipped }.
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('applyRepoChange_responseIncludesBackfillField', async function() {
    var productRepo = getProductRepo();
    var repoAdapter = getRepoAdapter();
    var acw = getCommitWriter();

    repoAdapter.setRepoAdapter(async function() { return { hasAccess: true, status: 200 }; });
    acw.setArtefactCommitAdapter(async function() { return { ok: true }; });

    var slug = 'das-s3-ac3-' + Date.now();
    var present = { skillName: 'discovery', artefactPath: 'artefacts/' + slug + '/discovery.md' };
    var missing = { skillName: 'benefit-metric', artefactPath: 'artefacts/' + slug + '/benefit-metric.md' };
    writeArtefact(present.artefactPath, '# present');
    // missing.artefactPath deliberately never written

    var pool = makeMockPool(
      [{ product_id: 'prod-ac3', tenant_id: 'tenant-ac3' }],
      [{ product_id: 'prod-ac3', tenant_id: 'tenant-ac3', feature_slug: slug, data: { featureSlug: slug, completedStages: [present, missing] } }]
    );

    getProductRepo(); // ensure module cache warm (repoRoot adapter shared singleton)
    require('../src/web-ui/adapters/repo-root').setRepoRoot(tmpRoot);

    var result = await productRepo._applyRepoChange(pool, 'prod-ac3', 'tenant-ac3', 'acme', 'widgets', 'test-token');

    assert.ok(result.success);
    assert.deepStrictEqual(result.backfill, { attempted: 2, succeeded: 1, skipped: ['benefit-metric'] });
  });
});

// ---------------------------------------------------------------------------
// Integration — handlePostProductRepoCreate migrated to _applyRepoChange:
// creating a brand-new repo now also backfills and reports it.
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('handlePostProductRepoCreate_migratedToUseApplyRepoChange_includesBackfill', async function() {
    var products = getProducts();
    var repoAdapter = getRepoAdapter();
    var acw = getCommitWriter();

    require('../src/web-ui/adapters/repo-root').setRepoRoot(tmpRoot);

    repoAdapter.setCreateRepoAdapter(async function(token, name) {
      return { owner: { login: 'newowner' }, name: name };
    });
    repoAdapter.setRepoAdapter(async function() { return { hasAccess: true, status: 200 }; });

    var commitCalls = [];
    acw.setArtefactCommitAdapter(async function(artefactPath, content, token, owner, repo) {
      commitCalls.push({ artefactPath: artefactPath, owner: owner, repo: repo });
      return { ok: true };
    });

    var slug = 'das-s3-it1-' + Date.now();
    var stage = { skillName: 'discovery', artefactPath: 'artefacts/' + slug + '/discovery.md' };
    writeArtefact(stage.artefactPath, '# discovery content for IT1');

    var pool = makeMockPool(
      [{ product_id: 'prod-it1', tenant_id: 'tenant-it1' }],
      [{ product_id: 'prod-it1', tenant_id: 'tenant-it1', feature_slug: slug, data: { featureSlug: slug, completedStages: [stage] } }]
    );

    var req = { session: { tenantId: 'tenant-it1', login: 'user1', accessToken: 'token-it1' }, params: { id: 'prod-it1' }, body: { name: 'new-repo-it1' } };
    var res = mockRes();
    var ph = { capture: function() {} };

    await products.handlePostProductRepoCreate(req, res, null, pool, ph);

    assert.strictEqual(res._status, 201, 'expected a 201 success from handlePostProductRepoCreate, got ' + res._status);
    assert.ok(res._body && res._body.backfill, 'response must include a backfill field -- proof the migration to _applyRepoChange happened');
    assert.deepStrictEqual(res._body.backfill, { attempted: 1, succeeded: 1, skipped: [] });
    assert.strictEqual(commitCalls.length, 1);
    assert.strictEqual(commitCalls[0].artefactPath, stage.artefactPath);
    assert.strictEqual(commitCalls[0].owner, 'newowner');
    assert.strictEqual(commitCalls[0].repo, 'new-repo-it1');
  });
});

// ---------------------------------------------------------------------------
// Integration — handlePutProductEdit and handlePostConnectRepo both surface
// an identically-shaped backfill field through the same shared code path.
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('handlePutProductEdit_and_handlePostConnectRepo_bothIncludeBackfillField', async function() {
    var products = getProducts();
    var productRepo = getProductRepo();
    var repoAdapter = getRepoAdapter();
    var acw = getCommitWriter();

    require('../src/web-ui/adapters/repo-root').setRepoRoot(tmpRoot);
    repoAdapter.setRepoAdapter(async function() { return { hasAccess: true, status: 200 }; });
    acw.setArtefactCommitAdapter(async function() { return { ok: true }; });

    var slugEdit = 'das-s3-it2-edit-' + Date.now();
    var slugConnect = 'das-s3-it2-connect-' + Date.now();
    var stageEdit = { skillName: 'discovery', artefactPath: 'artefacts/' + slugEdit + '/discovery.md' };
    var stageConnect = { skillName: 'discovery', artefactPath: 'artefacts/' + slugConnect + '/discovery.md' };
    writeArtefact(stageEdit.artefactPath, '# edit path content');
    writeArtefact(stageConnect.artefactPath, '# connect path content');

    var poolEdit = makeMockPool(
      [{ product_id: 'prod-edit', tenant_id: 'tenant-it2' }],
      [{ product_id: 'prod-edit', tenant_id: 'tenant-it2', feature_slug: slugEdit, data: { featureSlug: slugEdit, completedStages: [stageEdit] } }]
    );
    var poolConnect = makeMockPool(
      [{ product_id: 'prod-connect', tenant_id: 'tenant-it2' }],
      [{ product_id: 'prod-connect', tenant_id: 'tenant-it2', feature_slug: slugConnect, data: { featureSlug: slugConnect, completedStages: [stageConnect] } }]
    );

    var reqEdit = { session: { tenantId: 'tenant-it2', login: 'user1', accessToken: 'tok' }, params: { id: 'prod-edit' }, body: { owner: 'acme', repo: 'edit-repo' } };
    var resEdit = mockRes();
    await products.handlePutProductEdit(reqEdit, resEdit, null, poolEdit, { capture: function() {} });

    var reqConnect = { session: { tenantId: 'tenant-it2', login: 'user1', accessToken: 'tok' }, params: { id: 'prod-connect' }, body: { owner: 'acme', repo: 'connect-repo' } };
    var resConnect = mockRes();
    await productRepo.handlePostConnectRepo(reqConnect, resConnect, null, poolConnect, { capture: function() {} });

    assert.strictEqual(resEdit._status, 200);
    assert.strictEqual(resConnect._status, 200);
    assert.ok(resEdit._body.backfill, 'handlePutProductEdit response must include a backfill field');
    assert.ok(resConnect._body.backfill, 'handlePostConnectRepo response must include a backfill field');
    assert.deepStrictEqual(Object.keys(resEdit._body.backfill).sort(), ['attempted', 'skipped', 'succeeded']);
    assert.deepStrictEqual(Object.keys(resConnect._body.backfill).sort(), ['attempted', 'skipped', 'succeeded']);
    assert.deepStrictEqual(resEdit._body.backfill, { attempted: 1, succeeded: 1, skipped: [] });
    assert.deepStrictEqual(resConnect._body.backfill, { attempted: 1, succeeded: 1, skipped: [] });
  });
});

// ---------------------------------------------------------------------------
// NFR (Performance) — latency is reported honestly; no invented threshold.
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('backfillLatency_addsBoundedDelayToRepoConnection', async function() {
    var backfill = getBackfill();
    var acw = getCommitWriter();
    var slug = 'das-s3-nfr-perf-' + Date.now();
    var stages = [];
    for (var i = 0; i < 5; i++) {
      var s = { skillName: 'stage' + i, artefactPath: 'artefacts/' + slug + '/stage' + i + '.md' };
      writeArtefact(s.artefactPath, '# content ' + i);
      stages.push(s);
    }
    var journey = makeJourney(slug, stages);
    acw.setArtefactCommitAdapter(function() {
      return new Promise(function(resolve) { setTimeout(function() { resolve({ ok: true }); }, 200); });
    });

    var zeroJourney = makeJourney(slug + '-zero', []);
    var zeroStart = Date.now();
    await backfill.backfillCompletedStagesToRepo(zeroJourney, 'acme', 'widgets', 'tok', tmpRoot);
    var zeroElapsed = Date.now() - zeroStart;

    var start = Date.now();
    var result = await backfill.backfillCompletedStagesToRepo(journey, 'acme', 'widgets', 'tok', tmpRoot);
    var elapsed = Date.now() - start;

    console.log('  [NFR] backfill of 5 stages (~200ms commit each) took ' + elapsed + 'ms; zero-stage baseline took ' + zeroElapsed + 'ms -- reported honestly, no invented pass/fail threshold');
    assert.strictEqual(result.succeeded, 5);
    assert.ok(elapsed > zeroElapsed, 'backfilling 5 stages with a real per-commit delay must measurably take longer than the zero-stage baseline');
  });
});

// ---------------------------------------------------------------------------
// NFR (Security / ADR-025) — backfill's own journeys lookup never crosses a
// tenant boundary, even when a differently-tenanted journey row shares the
// same product_id value.
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('backfillTenantScoping_neverCrossesTenantBoundary', async function() {
    var productRepo = getProductRepo();
    var repoAdapter = getRepoAdapter();
    var acw = getCommitWriter();

    repoAdapter.setRepoAdapter(async function() { return { hasAccess: true, status: 200 }; });
    var commitCalls = [];
    acw.setArtefactCommitAdapter(async function(artefactPath) {
      commitCalls.push(artefactPath);
      return { ok: true };
    });

    var ownSlug = 'das-s3-tenant-own-' + Date.now();
    var impostorSlug = 'das-s3-tenant-impostor-' + Date.now();
    var ownStage = { skillName: 'discovery', artefactPath: 'artefacts/' + ownSlug + '/discovery.md' };
    var impostorStage = { skillName: 'discovery', artefactPath: 'artefacts/' + impostorSlug + '/discovery.md' };
    writeArtefact(ownStage.artefactPath, '# own tenant content');
    writeArtefact(impostorStage.artefactPath, '# impostor tenant content -- must never be committed');
    require('../src/web-ui/adapters/repo-root').setRepoRoot(tmpRoot);

    // Same product_id deliberately reused across two different tenant_id
    // rows -- an adversarial/defensive fixture proving the query's own
    // tenant_id condition (not merely product_id) is what excludes the
    // impostor row, per ADR-025.
    var pool = makeMockPool(
      [{ product_id: 'prod-shared', tenant_id: 'tenant-real' }],
      [
        { product_id: 'prod-shared', tenant_id: 'tenant-real', feature_slug: ownSlug, data: { featureSlug: ownSlug, completedStages: [ownStage] } },
        { product_id: 'prod-shared', tenant_id: 'tenant-impostor', feature_slug: impostorSlug, data: { featureSlug: impostorSlug, completedStages: [impostorStage] } }
      ]
    );

    var result = await productRepo._applyRepoChange(pool, 'prod-shared', 'tenant-real', 'acme', 'widgets', 'tok');

    assert.ok(result.success);
    assert.strictEqual(commitCalls.length, 1, 'exactly one stage (the real tenant\'s own) must be committed');
    assert.strictEqual(commitCalls[0], ownStage.artefactPath);
    assert.ok(!commitCalls.includes(impostorStage.artefactPath), 'the other tenant\'s stage must never be committed, even though it shares the same product_id');
  });
});

// ---------------------------------------------------------------------------
// NFR (Audit) — every backfill attempt (success or skip) is logged with the
// feature slug and stage name.
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('backfillLog_recordsEveryAttempt', async function() {
    var backfill = getBackfill();
    var acw = getCommitWriter();
    var slug = 'das-s3-audit-' + Date.now();
    var okStage = { skillName: 'discovery', artefactPath: 'artefacts/' + slug + '/discovery.md' };
    var skipStage = { skillName: 'benefit-metric', artefactPath: 'artefacts/' + slug + '/benefit-metric.md' };
    writeArtefact(okStage.artefactPath, '# ok');
    // skipStage.artefactPath deliberately never written
    var journey = makeJourney(slug, [okStage, skipStage]);

    acw.setArtefactCommitAdapter(async function() { return { ok: true }; });

    var infoLines = [];
    var errorLines = [];
    var originalInfo = console.info;
    var originalError = console.error;
    console.info = function(msg) { infoLines.push(msg); };
    console.error = function(msg) { errorLines.push(msg); };

    var result;
    try {
      result = await backfill.backfillCompletedStagesToRepo(journey, 'acme', 'widgets', 'tok', tmpRoot);
    } finally {
      console.info = originalInfo;
      console.error = originalError;
    }

    assert.strictEqual(result.succeeded, 1);
    assert.strictEqual(result.skipped.length, 1);

    var committedLog = infoLines.find(function(l) {
      try { var p = JSON.parse(l); return p.event === 'artefact_backfill_committed' && p.featureSlug === slug && p.stage === okStage.skillName; } catch (_) { return false; }
    });
    var skippedLog = infoLines.find(function(l) {
      try { var p = JSON.parse(l); return p.event === 'artefact_backfill_skipped' && p.featureSlug === slug && p.stage === skipStage.skillName; } catch (_) { return false; }
    });

    assert.ok(committedLog, 'expected a logged entry naming the feature slug and stage for the successful backfill attempt');
    assert.ok(skippedLog, 'expected a logged entry naming the feature slug and stage for the skipped backfill attempt');
  });
});

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
(async function() {
  console.log('\ncheck-das-s3-backfill-on-repo-connect.js');
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
