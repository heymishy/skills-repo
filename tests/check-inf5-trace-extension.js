'use strict';
// check-inf5-trace-extension.js
// TDD tests for inf.5: extend chain-hash trace to emit on infra-plan sign-off.
// 7 unit tests + 1 NFR. RED until journey.js is extended.

var assert = require('assert');
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');

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

var ROOT = path.resolve(__dirname, '..');
var JOURNEY_PATH = path.resolve(ROOT, 'src', 'web-ui', 'routes', 'journey.js');
var JOURNEY_STORE_PATH = path.resolve(ROOT, 'src', 'web-ui', 'modules', 'journey-store.js');
var TMP_ROOT = path.join(ROOT, 'workspace', 'test-tmp-inf5');
fs.mkdirSync(TMP_ROOT, { recursive: true });

function freshRequireJourney() {
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch (_) {}
  return require(JOURNEY_PATH);
}

function getStore() {
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch (_) {}
  return require(JOURNEY_STORE_PATH);
}

function makeRes() {
  return {
    _status: null, _headers: {}, _body: '',
    writeHead: function(status, headers) { this._status = status; Object.assign(this._headers, headers || {}); },
    setHeader: function(k, v) { this._headers[k] = v; },
    end: function(body) { this._body += (body || ''); }
  };
}

function authReq(extra) {
  return Object.assign({
    session: { accessToken: 'test-token', userId: 1, login: 'user' },
    params: {}, body: {}
  }, extra || {});
}

function setupSession(journey, store, opts) {
  opts = opts || {};
  var featureSlug = opts.featureSlug || 'test-feature-inf5';
  var skillName = opts.skillName || 'infra-plan';
  var artefactRelPath = opts.artefactRelPath ||
    path.join('artefacts', featureSlug, 'infra', 'story1-infra-plan.md');
  var infraPlanRelPath = opts.infraPlanRelPath || artefactRelPath;
  var artefactContent = opts.artefactContent || '# Infra Plan\n**Status: PASS**\n';

  store._clear();
  var journeyObj = store.createJourney(featureSlug);
  var journeyId = journeyObj.journeyId;
  store.setStoryList(journeyId, [opts.storyId || 'story1']);
  var sid = 'sid-inf5-' + Date.now() + '-' + Math.random();
  store.setActiveSession(journeyId, sid, skillName);

  var absArtefact = path.join(TMP_ROOT, artefactRelPath);
  fs.mkdirSync(path.dirname(absArtefact), { recursive: true });
  fs.writeFileSync(absArtefact, artefactContent, 'utf8');

  journey.setJourneyStoreModule(store);
  journey.setRegisterHtmlSession(function() {});
  journey.setLinkSessionToJourney(function() {});
  journey.setRepoRoot(TMP_ROOT);

  var sessionData = {
    skillName: skillName,
    done: true,
    artefactPath: artefactRelPath,
    artefactContent: artefactContent,
    journeyId: journeyId,
    turns: [],
    systemPrompt: 'test'
  };
  if (skillName === 'infra-plan') {
    sessionData.infraPlanPath = infraPlanRelPath;
  }

  journey.setGetHtmlSession(function(s) {
    if (s === sid) return sessionData;
    return null;
  });

  return { journeyId: journeyId, sid: sid, infraPlanRelPath: infraPlanRelPath, artefactContent: artefactContent };
}

var queue = [];

// ---------------------------------------------------------------------------
// T1 — source: journey.js contains infra-plan sign-off handler
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1: journey.js registers infra-plan sign-off trace handler', function() {
    var src = fs.readFileSync(JOURNEY_PATH, 'utf8');
    assert.ok(
      src.includes('infra-plan') || src.includes('infraPlan') || src.includes('infra_plan'),
      'T1: journey.js must contain an infra-plan identifier for the sign-off trace handler'
    );
  });
});

// ---------------------------------------------------------------------------
// T2 — functional: writeTrace called with infraPlanPath when skillName=infra-plan
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T2: writeTrace called with infraPlanPath on infra-plan gate-confirm', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var capturedArg = null;

    var setup = setupSession(journey, store, { featureSlug: 'inf5-t2-feature' });
    journey.setPipelineStateWriter(function() {});
    journey.setWriteTrace(function(entry) { capturedArg = entry; });

    await journey.handlePostGateConfirm(authReq({ params: { journeyId: setup.journeyId } }), makeRes());

    assert.ok(capturedArg !== null, 'T2: setWriteTrace must be called for infra-plan sign-off');
    assert.ok(typeof capturedArg.infraPlanPath === 'string' && capturedArg.infraPlanPath.length > 0,
      'T2: trace entry must include non-empty infraPlanPath field');
    assert.strictEqual(capturedArg.featureSlug, 'inf5-t2-feature', 'T2: featureSlug must match journey');
    assert.strictEqual(capturedArg.exitCode, 0, 'T2: exitCode must be 0');
  });
});

// ---------------------------------------------------------------------------
// T3 — source: journey.js uses fs.readFileSync + SHA-256 for infra hash
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3: journey.js computes infra hash from disk (fs.readFileSync + SHA-256)', function() {
    var src = fs.readFileSync(JOURNEY_PATH, 'utf8');
    assert.ok(
      src.includes("createHash('sha256')") || src.includes('createHash("sha256")'),
      'T3: journey.js must use crypto.createHash("sha256") for infra-plan hash'
    );
    assert.ok(src.includes('readFileSync'),
      'T3: journey.js must read infra-plan artefact from disk via fs.readFileSync (ougl disk-canonicity)'
    );
  });
});

// ---------------------------------------------------------------------------
// T4 — functional: infra-plan trace entry has event='infra-plan-sign-off'
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4: infra-plan trace entry has distinct event type "infra-plan-sign-off"', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var capturedArg = null;

    var setup = setupSession(journey, store, { featureSlug: 'inf5-t4-feature' });
    journey.setPipelineStateWriter(function() {});
    journey.setWriteTrace(function(entry) { capturedArg = entry; });

    await journey.handlePostGateConfirm(authReq({ params: { journeyId: setup.journeyId } }), makeRes());

    assert.ok(capturedArg !== null, 'T4: writeTrace must be called');
    assert.strictEqual(capturedArg.event, 'infra-plan-sign-off',
      'T4: infra-plan entry must have event="infra-plan-sign-off"');
  });
});

// ---------------------------------------------------------------------------
// T5 — functional: infraPlanHash is SHA-256 of artefact disk content
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T5: infraPlanHash is SHA-256 of infra-plan artefact content on disk', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var capturedArg = null;

    var artefactContent = '# Infra Plan\n**Status: PASS**\nHash-target content 42\n';
    var infraPlanRelPath = path.join('artefacts', 'inf5-t5-feature', 'infra', 'story1-infra-plan.md');
    var setup = setupSession(journey, store, {
      featureSlug: 'inf5-t5-feature',
      artefactRelPath: infraPlanRelPath,
      infraPlanRelPath: infraPlanRelPath,
      artefactContent: artefactContent
    });
    var expectedHash = crypto.createHash('sha256').update(artefactContent, 'utf8').digest('hex');

    journey.setPipelineStateWriter(function() {});
    journey.setWriteTrace(function(entry) { capturedArg = entry; });

    await journey.handlePostGateConfirm(authReq({ params: { journeyId: setup.journeyId } }), makeRes());

    assert.ok(capturedArg !== null, 'T5: writeTrace must be called');
    assert.ok(typeof capturedArg.infraPlanHash === 'string' && capturedArg.infraPlanHash.length === 64,
      'T5: infraPlanHash must be a 64-char hex string');
    assert.strictEqual(capturedArg.infraPlanHash, expectedHash,
      'T5: infraPlanHash must match SHA-256 of disk content');
  });
});

// ---------------------------------------------------------------------------
// T6 — functional: DoR gate-confirm (hasInfraTrack false) → no infra trace entry
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T6: no infra-plan-sign-off entry when skillName is definition-of-ready', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var capturedEntries = [];

    var setup = setupSession(journey, store, {
      featureSlug: 'inf5-t6-feature',
      skillName: 'definition-of-ready',
      artefactRelPath: path.join('artefacts', 'inf5-t6-feature', 'dor', 'story1-dor.md'),
      artefactContent: '# DoR\n**Proceed:** Yes\n'
    });
    journey.setValidate(function() { return { exitCode: 0 }; });
    journey.setPipelineStateWriter(function() {});
    journey.setWriteTrace(function(entry) { capturedEntries.push(entry); });

    await journey.handlePostGateConfirm(authReq({ params: { journeyId: setup.journeyId } }), makeRes());

    var infraEntries = capturedEntries.filter(function(e) { return e.event === 'infra-plan-sign-off'; });
    assert.strictEqual(infraEntries.length, 0,
      'T6: no infra-plan-sign-off entry for DoR gate-confirm (hasInfraTrack: false)');
  });
});

// ---------------------------------------------------------------------------
// T7 — functional: DoR trace emitted when hasInfraTrack absent; no infra entry
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T7: DoR trace emitted normally; no infra entry when hasInfraTrack absent', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var capturedEntries = [];

    var setup = setupSession(journey, store, {
      featureSlug: 'inf5-t7-feature',
      skillName: 'definition-of-ready',
      artefactRelPath: path.join('artefacts', 'inf5-t7-feature', 'dor', 'story1-dor.md'),
      artefactContent: '# DoR\n**Proceed:** Yes\n'
    });
    journey.setValidate(function() { return { exitCode: 0 }; });
    journey.setPipelineStateWriter(function() {});
    journey.setWriteTrace(function(entry) { capturedEntries.push(entry); });

    await journey.handlePostGateConfirm(authReq({ params: { journeyId: setup.journeyId } }), makeRes());

    var dorEntries = capturedEntries.filter(function(e) { return e.stage === 'definition-of-ready'; });
    var infraEntries = capturedEntries.filter(function(e) { return e.event === 'infra-plan-sign-off'; });
    assert.ok(dorEntries.length >= 1, 'T7: DoR trace entry must still be emitted');
    assert.strictEqual(infraEntries.length, 0, 'T7: no infra-plan-sign-off entry when hasInfraTrack absent');
  });
});

// ---------------------------------------------------------------------------
// NFR — trace record for infra-plan has no raw artefact content
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('NFR: infra-plan trace record contains no raw artefact content (path + hash only)', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var capturedArg = null;

    var artefactContent = '# Infra Plan SENTINEL_CONTENT_ABC123XYZ\n**Status: PASS**\n';
    var infraPlanRelPath = path.join('artefacts', 'inf5-nfr-feature', 'infra', 'story1-infra-plan.md');
    var setup = setupSession(journey, store, {
      featureSlug: 'inf5-nfr-feature',
      artefactRelPath: infraPlanRelPath,
      infraPlanRelPath: infraPlanRelPath,
      artefactContent: artefactContent
    });

    journey.setPipelineStateWriter(function() {});
    journey.setWriteTrace(function(entry) { capturedArg = entry; });

    await journey.handlePostGateConfirm(authReq({ params: { journeyId: setup.journeyId } }), makeRes());

    assert.ok(capturedArg !== null, 'NFR: writeTrace must be called');
    var serialized = JSON.stringify(capturedArg);
    assert.ok(!serialized.includes('SENTINEL_CONTENT_ABC123XYZ'),
      'NFR: trace record must not contain raw artefact content — path and hash only');
  });
});

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
async function runAll() {
  console.log('\ncheck-inf5-trace-extension.js');
  console.log('================================');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + (failed === 0 ? 'All ' + passed + ' tests passing' : passed + ' passing, ' + failed + ' failing'));
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + '\n    ' + (f.err && f.err.message || f.err)); });
  }
  process.exit(failed > 0 ? 1 : 0);
}
runAll().catch(function(e) { console.error(e); process.exit(1); });
