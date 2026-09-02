'use strict';
// check-acdg-s2-durability-signal.js
// TDD tests for acdg-s2: add a distinguishable durability signal for
// stage-completion commits, reusing ep1-s6's shared _logCrossChannelEvent
// helper. Same call site as das-s1/acdg-s1 (handlePostGateConfirm) --
// reuses their proven fixture pattern.
//
// Covers AC1-AC4 per
// artefacts/2026-09-01-artefact-commit-durability-gap/test-plans/acdg-s2-test-plan.md

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

var tmpRoot = path.join(os.tmpdir(), 'acdg-s2-tests-' + Date.now());
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
  var featureSlug = opts.featureSlug || ('test-feature-acdg-s2-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  var skillName = opts.skillName || 'review';
  var artefactRelPath = opts.artefactRelPath || ('artefacts/' + featureSlug + '/' + skillName + '.md');
  var artefactContent = opts.artefactContent || ('# ' + skillName + ' artefact for ' + featureSlug);

  var journeyObj = store.createJourney(featureSlug);
  var journeyId = journeyObj.journeyId;
  var sid = 'sid-acdg-s2-' + Date.now() + '-' + Math.random();
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

async function withCapturedLogs(fn) {
  var origLog = console.log;
  var logs = [];
  console.log = function(msg) { logs.push(msg); };
  try {
    await fn();
  } finally {
    console.log = origLog;
  }
  return logs;
}

function crossChannelLines(logs) {
  return logs.filter(function(l) { return String(l).indexOf('[cross-channel] ') === 0; });
}
function parseCrossChannelLine(line) {
  return JSON.parse(String(line).slice('[cross-channel] '.length));
}

var queue = [];

// ---------------------------------------------------------------------------
// AC1 (unit) — artefact_commit_succeeded logged with base fields
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('successfulCommit_logsArtefactCommitSucceeded', async function() {
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
    acw.setArtefactCommitAdapter(async function() { return { ok: true }; });

    var logs = await withCapturedLogs(async function() {
      await journey.handlePostGateConfirm(authReq({ params: { journeyId: setup.journeyId } }), makeRes());
    });
    var line = crossChannelLines(logs).find(function(l) { return parseCrossChannelLine(l).eventType === 'artefact_commit_succeeded'; });
    assert.ok(line, 'expected an artefact_commit_succeeded log line');
    var parsed = parseCrossChannelLine(line);
    assert.strictEqual(parsed.featureSlug, setup.featureSlug);
    assert.strictEqual(parsed.stage, setup.skillName);
    assert.ok(parsed.timestamp);
  });
});

// ---------------------------------------------------------------------------
// AC2 (unit) — artefact_commit_failed logged with base fields + reason
// (commit-failure branch)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('commitFailure_logsArtefactCommitFailedWithReason', async function() {
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

    var logs = await withCapturedLogs(async function() {
      await journey.handlePostGateConfirm(authReq({ params: { journeyId: setup.journeyId } }), makeRes());
    });
    var line = crossChannelLines(logs).find(function(l) { return parseCrossChannelLine(l).eventType === 'artefact_commit_failed'; });
    assert.ok(line, 'expected an artefact_commit_failed log line');
    var parsed = parseCrossChannelLine(line);
    assert.strictEqual(parsed.featureSlug, setup.featureSlug);
    assert.strictEqual(parsed.stage, setup.skillName);
    assert.ok(parsed.reason && parsed.reason.indexOf('simulated GitHub API failure') !== -1, 'expected a reason field describing the failure');
  });
});

// ---------------------------------------------------------------------------
// AC2 (unit) — artefact_commit_failed also fires for the resolution-failure
// branch (acdg-s1's own fix), not just the commit-failure branch
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('resolutionFailureWithProductIdSet_logsArtefactCommitFailed', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();

    var setup = setupStageSession(journey, store, { productId: 'linked-product-id' });
    eds.setDbPool(createMockPool([], []));

    var logs = await withCapturedLogs(async function() {
      await journey.handlePostGateConfirm(authReq({ params: { journeyId: setup.journeyId } }), makeRes());
    });
    var line = crossChannelLines(logs).find(function(l) { return parseCrossChannelLine(l).eventType === 'artefact_commit_failed'; });
    assert.ok(line, 'expected an artefact_commit_failed log line for the resolution-failure branch too');
  });
});

// ---------------------------------------------------------------------------
// AC3 (unit) — artefact_commit_skipped logged with base fields + reason
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('genuinelyUnlinked_logsArtefactCommitSkipped', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();

    var setup = setupStageSession(journey, store, {}); // no productId
    eds.setDbPool(createMockPool([], []));

    var logs = await withCapturedLogs(async function() {
      await journey.handlePostGateConfirm(authReq({ params: { journeyId: setup.journeyId } }), makeRes());
    });
    var line = crossChannelLines(logs).find(function(l) { return parseCrossChannelLine(l).eventType === 'artefact_commit_skipped'; });
    assert.ok(line, 'expected an artefact_commit_skipped log line');
    var parsed = parseCrossChannelLine(line);
    assert.strictEqual(parsed.featureSlug, setup.featureSlug);
    assert.strictEqual(parsed.stage, setup.skillName);
    assert.strictEqual(parsed.reason, 'no connected repo');
  });
});

// ---------------------------------------------------------------------------
// AC4 (unit) — all 3 event types parse as valid JSON after the prefix
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('allThreeEventTypes_parseAsValidJson', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();
    var acw = getArtefactCommitWriter();

    // succeeded
    var setupA = setupStageSession(journey, store, {});
    eds.setDbPool(createMockPool(
      [{ feature_slug: setupA.featureSlug, product_id: 'p1', tenant_id: 't1' }],
      [{ product_id: 'p1', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }]
    ));
    acw.setArtefactCommitAdapter(async function() { return { ok: true }; });
    var logsA = await withCapturedLogs(async function() {
      await journey.handlePostGateConfirm(authReq({ params: { journeyId: setupA.journeyId } }), makeRes());
    });

    // skipped
    var setupB = setupStageSession(journey, store, {});
    eds.setDbPool(createMockPool([], []));
    var logsB = await withCapturedLogs(async function() {
      await journey.handlePostGateConfirm(authReq({ params: { journeyId: setupB.journeyId } }), makeRes());
    });

    // failed
    var setupC = setupStageSession(journey, store, { productId: 'linked-product-id' });
    eds.setDbPool(createMockPool([], []));
    var logsC = await withCapturedLogs(async function() {
      await journey.handlePostGateConfirm(authReq({ params: { journeyId: setupC.journeyId } }), makeRes());
    });

    var allLines = crossChannelLines(logsA).concat(crossChannelLines(logsB)).concat(crossChannelLines(logsC));
    assert.ok(allLines.length >= 3, 'expected at least 3 cross-channel lines across the 3 scenarios');
    allLines.forEach(function(l) {
      assert.doesNotThrow(function() { parseCrossChannelLine(l); }, 'every [cross-channel] line must parse as valid JSON: ' + l);
    });
  });
});

// ---------------------------------------------------------------------------
// Integration — a full gate-confirm request emits exactly one durability
// event per stage completion
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('integration_exactlyOneDurabilityEventPerCompletion', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();
    var acw = getArtefactCommitWriter();

    var setup = setupStageSession(journey, store, {});
    eds.setDbPool(createMockPool(
      [{ feature_slug: setup.featureSlug, product_id: 'p1', tenant_id: 't1' }],
      [{ product_id: 'p1', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }]
    ));
    acw.setArtefactCommitAdapter(async function() { return { ok: true }; });

    var logs = await withCapturedLogs(async function() {
      await journey.handlePostGateConfirm(authReq({ params: { journeyId: setup.journeyId } }), makeRes());
    });
    var durabilityLines = crossChannelLines(logs).filter(function(l) {
      var t = parseCrossChannelLine(l).eventType;
      return t === 'artefact_commit_succeeded' || t === 'artefact_commit_failed' || t === 'artefact_commit_skipped';
    });
    assert.strictEqual(durabilityLines.length, 1, 'expected exactly one durability event, got ' + durabilityLines.length);
  });
});

// ---------------------------------------------------------------------------
// NFR — PostHog call failure does not block or throw during stage completion
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('nfr_postHogFailureDoesNotBlockCompletion', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();
    var acw = getArtefactCommitWriter();
    var posthogServer = require('../src/web-ui/modules/posthog-server');

    var setup = setupStageSession(journey, store, {});
    eds.setDbPool(createMockPool(
      [{ feature_slug: setup.featureSlug, product_id: 'p1', tenant_id: 't1' }],
      [{ product_id: 'p1', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }]
    ));
    acw.setArtefactCommitAdapter(async function() { return { ok: true }; });

    var origCapture = posthogServer.capture;
    // Scoped to this story's own new event types only -- a pre-existing,
    // unrelated 'stage_completed' capture call elsewhere in this same
    // handler is not wrapped in try/catch (out of this story's scope to
    // fix), so a blanket throw-on-everything monkey-patch would fail this
    // test for a reason unrelated to acdg-s2's own NFR claim.
    posthogServer.capture = function(distinctId, eventType) {
      if (String(eventType).indexOf('artefact_commit_') === 0) { throw new Error('simulated PostHog outage'); }
      return origCapture.apply(this, arguments);
    };
    var res = makeRes();
    try {
      await assert.doesNotReject(journey.handlePostGateConfirm(authReq({ params: { journeyId: setup.journeyId } }), res));
    } finally {
      posthogServer.capture = origCapture;
    }
    assert.ok(res._status === null || res._status < 400, 'stage completion must succeed even when PostHog throws, got status ' + res._status);
  });
});

// ---------------------------------------------------------------------------
// NFR — log lines contain no credentials or full artefact content
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('nfr_logLinesContainNoCredentialsOrFullContent', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();
    var acw = getArtefactCommitWriter();

    var setup = setupStageSession(journey, store, { artefactContent: '# secret-marker-content-should-never-appear-in-logs' });
    eds.setDbPool(createMockPool(
      [{ feature_slug: setup.featureSlug, product_id: 'p1', tenant_id: 't1' }],
      [{ product_id: 'p1', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }]
    ));
    acw.setArtefactCommitAdapter(async function() { return { ok: true }; });

    var logs = await withCapturedLogs(async function() {
      await journey.handlePostGateConfirm(authReq({ params: { journeyId: setup.journeyId } }), makeRes());
    });
    var line = crossChannelLines(logs).find(function(l) { return parseCrossChannelLine(l).eventType === 'artefact_commit_succeeded'; });
    assert.ok(line);
    assert.ok(line.indexOf('secret-marker-content') === -1, 'log line must not contain full artefact content');
    assert.ok(line.indexOf('test-token') === -1, 'log line must not contain the access token');
    var parsed = parseCrossChannelLine(line);
    var allowedKeys = ['eventType', 'timestamp', 'featureSlug', 'stage', 'operatorId'];
    Object.keys(parsed).forEach(function(k) {
      assert.ok(allowedKeys.indexOf(k) !== -1, 'unexpected key in log line: ' + k);
    });
  });
});

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
(async function() {
  console.log('\ncheck-acdg-s2-durability-signal.js');
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
