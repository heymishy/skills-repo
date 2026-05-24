'use strict';
// check-owle6-pipeline-state-auto-write.js -- owle.6: Auto-write pipeline-state on gate-confirm
// TDD: all tests must FAIL before implementation, PASS after.

var assert = require('assert');
var crypto = require('crypto');
var path = require('path');
var os = require('os');
var fs = require('fs');

var JOURNEY_PATH       = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
var ADAPTER_PATH       = path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-writer.js');

function freshRequire() {
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch (_) {}
  var jStore = require(JOURNEY_STORE_PATH);
  var j      = require(JOURNEY_PATH);
  return { jStore: jStore, j: j };
}

function freshAdapter() {
  try { delete require.cache[require.resolve(ADAPTER_PATH)]; } catch (_) {}
  return require(ADAPTER_PATH);
}

function makeRes() {
  var res = { _code: null, _body: '', _headers: {} };
  res.writeHead = function(code, headers) { res._code = code; Object.assign(res._headers, headers || {}); };
  res.end = function(body) { res._body += (body || ''); };
  return res;
}

function makeReq(overrides) {
  return Object.assign({ session: { accessToken: 'tok', login: 'user' }, params: {}, body: {}, headers: {} }, overrides);
}

function makeSessionStore() {
  var store = new Map();
  return {
    register: function(id, sessionPath, skill) {
      store.set(id, { skillName: skill, sessionPath: sessionPath, systemPrompt: 'SP-' + skill,
        turns: [], artefactContent: null, artefactPath: null, done: false, journeyId: null });
    },
    get: function(id) { return store.get(id); },
    store: store
  };
}

/** Wire up a gate-confirm call for the given skill, returns the handler promise */
function setupAndRunGateConfirm(r, tmpDir, featureSlug, skillName) {
  var sessions = makeSessionStore();
  var sessionId = 'gc-sess-' + crypto.randomUUID();
  sessions.register(sessionId, path.join(os.tmpdir(), 'ougl', sessionId + '.md'), skillName);
  var sess = sessions.get(sessionId);
  sess.done = true;
  sess.artefactPath = 'artefacts/' + featureSlug + '/' + skillName + '.md';
  sess.artefactContent = '# ' + skillName + ' artefact for ' + featureSlug;

  r.j.setRegisterHtmlSession(sessions.register.bind(sessions));
  r.j.setLinkSessionToJourney(function() {});
  r.j.setGetHtmlSession(function(id) { return sessions.get(id); });
  r.j.setRepoRoot(tmpDir);

  fs.mkdirSync(path.join(tmpDir, 'artefacts', featureSlug), { recursive: true });

  var jobj = r.jStore.createJourney(featureSlug);
  r.jStore.setActiveSession(jobj.journeyId, sessionId, skillName);

  var req = makeReq({ params: { journeyId: jobj.journeyId } });
  var res = makeRes();
  return r.j.handlePostGateConfirm(req, res).then(function() {
    return { res: res, jobj: jobj, sessionId: sessionId };
  });
}

function makePipelineState(features) {
  return JSON.stringify({ schemaVersion: '1', features: features || [] }, null, 2) + '\n';
}

var passed = 0;
var failed = 0;
var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) {
          failed++;
          failures.push({ name: name, err: err });
          console.log('  [FAIL]', name, '--', err && err.message || err);
        }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++;
    failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

async function main() {

  // -- T1: gate-confirm success calls _pipelineStateWriter spy (discovery stage)
  console.log('\n[owle6] T1 -- gate-confirm triggers pipelineStateWriter spy (discovery stage)');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle6-t1-'));
    var spyCalls = [];
    r.j.setPipelineStateWriter(function(featureSlug, storyId, stateUpdate) {
      spyCalls.push({ featureSlug: featureSlug, storyId: storyId, stateUpdate: stateUpdate });
    });
    await setupAndRunGateConfirm(r, tmpDir, 'test-feature', 'discovery');

    await test('T1a: spy called exactly once', function() {
      assert.strictEqual(spyCalls.length, 1, 'Expected spy called once, got ' + spyCalls.length);
    });

    await test('T1b: spy called with correct featureSlug', function() {
      assert.strictEqual(spyCalls[0].featureSlug, 'test-feature');
    });

    await test('T1c: stateUpdate includes discoveryStatus:complete', function() {
      assert.strictEqual(spyCalls[0].stateUpdate.discoveryStatus, 'complete');
    });

    await test('T1d: stateUpdate includes artefact field', function() {
      assert.ok(spyCalls[0].stateUpdate.artefact, 'artefact field missing from stateUpdate');
      assert.ok(spyCalls[0].stateUpdate.artefact.includes('discovery'), 'artefact field should reference discovery');
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T2: gate-confirm at DoR stage calls spy with dorStatus:signed-off
  console.log('\n[owle6] T2 -- gate-confirm at dor stage includes dorStatus:signed-off');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle6-t2-'));
    var spyCalls = [];
    r.j.setPipelineStateWriter(function(featureSlug, storyId, stateUpdate) {
      spyCalls.push({ featureSlug: featureSlug, storyId: storyId, stateUpdate: stateUpdate });
    });
    // cdg.4: inject passing validate stub so T2 is not blocked by D37 default throw
    if (typeof r.j.setValidate === 'function') {
      r.j.setValidate(function() { return { exitCode: 0 }; });
    }

    // For DoR stage, journey needs stories set up so it can advance/complete
    r.j.setRegisterHtmlSession(function() {});
    r.j.setLinkSessionToJourney(function() {});
    var sessions = makeSessionStore();
    var sessionId = 'gc-dor-' + crypto.randomUUID();
    sessions.register(sessionId, path.join(os.tmpdir(), 'dor-' + sessionId + '.md'), 'definition-of-ready');
    var sess = sessions.get(sessionId);
    sess.done = true;
    sess.artefactPath = 'artefacts/dor-feature/definition-of-ready.md';
    sess.artefactContent = '# DoR artefact';
    r.j.setGetHtmlSession(function(id) { return sessions.get(id); });
    r.j.setRepoRoot(tmpDir);
    fs.mkdirSync(path.join(tmpDir, 'artefacts', 'dor-feature'), { recursive: true });

    var jobj = r.jStore.createJourney('dor-feature');
    r.jStore.setActiveSession(jobj.journeyId, sessionId, 'definition-of-ready');

    await r.j.handlePostGateConfirm(makeReq({ params: { journeyId: jobj.journeyId } }), makeRes());

    await test('T2a: spy called once at DoR stage', function() {
      assert.strictEqual(spyCalls.length, 1, 'Expected spy called once, got ' + spyCalls.length);
    });

    await test('T2b: stateUpdate includes dorStatus:signed-off', function() {
      assert.strictEqual(spyCalls[0].stateUpdate.dorStatus, 'signed-off');
    });

    await test('T2c: stateUpdate includes updatedAt date string', function() {
      assert.ok(spyCalls[0].stateUpdate.updatedAt, 'updatedAt missing');
      assert.match(spyCalls[0].stateUpdate.updatedAt, /^\d{4}-\d{2}-\d{2}$/);
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T3: adapter called with feature not in state creates feature entry
  console.log('\n[owle6] T3 -- adapter creates feature entry when not present');
  {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle6-t3-'));
    fs.mkdirSync(path.join(tmpDir, '.github'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '.github', 'pipeline-state.json'),
      makePipelineState([{ slug: 'existing-feature', name: 'Existing' }]), 'utf8');

    var factory = freshAdapter();

    await test('T3a: adapter does not throw for missing feature', async function() {
      var writer = factory(tmpDir);
      await writer('brand-new-feature', null, { stage: 'discovery' });
    });

    await test('T3b: feature entry created in state file', function() {
      var state = JSON.parse(fs.readFileSync(path.join(tmpDir, '.github', 'pipeline-state.json'), 'utf8'));
      var found = state.features.find(function(f) { return f.slug === 'brand-new-feature' || f.id === 'brand-new-feature'; });
      assert.ok(found, 'feature entry not created');
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T4: adapter rejects invalid enum value, file not written
  console.log('\n[owle6] T4 -- adapter rejects schema-invalid update, file unchanged');
  {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle6-t4-'));
    fs.mkdirSync(path.join(tmpDir, '.github'), { recursive: true });
    var originalContent = makePipelineState([{ slug: 'feat-x', name: 'Feature X' }]);
    var statePath = path.join(tmpDir, '.github', 'pipeline-state.json');
    fs.writeFileSync(statePath, originalContent, 'utf8');

    var factory = freshAdapter();
    var writer = factory(tmpDir);
    var threw = null;

    await test('T4a: adapter throws for invalid prStatus', async function() {
      try {
        await writer('feat-x', null, { prStatus: 'invalid-value' });
        assert.fail('Expected adapter to throw');
      } catch (err) {
        threw = err;
        assert.ok(err.message.toLowerCase().includes('schema') || err.message.toLowerCase().includes('invalid'),
          'Error message should mention schema or invalid: ' + err.message);
      }
    });

    await test('T4b: pipeline-state.json unchanged after rejected write', function() {
      var content = fs.readFileSync(statePath, 'utf8');
      assert.strictEqual(content, originalContent, 'File should be unchanged after schema-invalid write');
    });

    await test('T4c: no .tmp file leftover', function() {
      assert.ok(!fs.existsSync(statePath + '.tmp'), '.tmp file should not exist after failed write');
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T5: adapter uses atomic write (tmp file then rename)
  console.log('\n[owle6] T5 -- adapter uses atomic tmp-then-rename write');
  {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle6-t5-'));
    fs.mkdirSync(path.join(tmpDir, '.github'), { recursive: true });
    var statePath = path.join(tmpDir, '.github', 'pipeline-state.json');
    fs.writeFileSync(statePath, makePipelineState([]), 'utf8');

    var factory = freshAdapter();
    var writer = factory(tmpDir);

    // Spy on fs methods to track call order
    var origWriteFileSync = fs.writeFileSync;
    var origRenameSync = fs.renameSync;
    var fsCalls = [];
    fs.writeFileSync = function(p, d, o) { fsCalls.push({ op: 'write', path: p }); return origWriteFileSync.call(fs, p, d, o); };
    fs.renameSync = function(a, b) { fsCalls.push({ op: 'rename', from: a, to: b }); return origRenameSync.call(fs, a, b); };

    try {
      await writer('some-feature', null, { stage: 'discovery' });
    } finally {
      fs.writeFileSync = origWriteFileSync;
      fs.renameSync = origRenameSync;
    }

    await test('T5a: fs.writeFileSync called with .tmp path', function() {
      var tmpWrite = fsCalls.find(function(c) { return c.op === 'write' && c.path.endsWith('.tmp'); });
      assert.ok(tmpWrite, '.tmp write not found in fs calls: ' + JSON.stringify(fsCalls));
    });

    await test('T5b: fs.renameSync called from .tmp to final path', function() {
      var rename = fsCalls.find(function(c) { return c.op === 'rename'; });
      assert.ok(rename, 'renameSync not called');
      assert.ok(rename.from.endsWith('.tmp'), 'rename source should end in .tmp, got ' + rename.from);
      assert.strictEqual(rename.to, statePath, 'rename target should be the state path');
    });

    await test('T5c: .tmp file not present after write completes', function() {
      assert.ok(!fs.existsSync(statePath + '.tmp'), '.tmp file should not exist after successful write');
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T6: accessToken not present in any log output during gate-confirm
  console.log('\n[owle6] T6 -- accessToken not present in log output');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle6-t6-'));
    var secretToken = 'ghs_SECRET_TOKEN_' + crypto.randomUUID().replace(/-/g, '');

    r.j.setPipelineStateWriter(function(featureSlug, storyId, stateUpdate) {
      // real-like writer that logs (simulate what adapter would do)
      console.info(JSON.stringify({ event: 'pipeline_state_updated', featureSlug: featureSlug, storyId: storyId, fieldsChanged: Object.keys(stateUpdate) }));
    });

    // Capture console.info output
    var loggedLines = [];
    var origInfo = console.info;
    console.info = function() {
      var line = Array.prototype.slice.call(arguments).join(' ');
      loggedLines.push(line);
      origInfo.apply(console, arguments);
    };

    var sessions = makeSessionStore();
    var sessionId = 'gc-t6-' + crypto.randomUUID();
    sessions.register(sessionId, path.join(os.tmpdir(), 't6-' + sessionId + '.md'), 'discovery');
    var sess = sessions.get(sessionId);
    sess.done = true;
    sess.artefactPath = 'artefacts/sec-feature/discovery.md';
    sess.artefactContent = '# discovery';
    r.j.setRegisterHtmlSession(sessions.register.bind(sessions));
    r.j.setLinkSessionToJourney(function() {});
    r.j.setGetHtmlSession(function(id) { return sessions.get(id); });
    r.j.setRepoRoot(tmpDir);
    fs.mkdirSync(path.join(tmpDir, 'artefacts', 'sec-feature'), { recursive: true });

    var jobj = r.jStore.createJourney('sec-feature');
    r.jStore.setActiveSession(jobj.journeyId, sessionId, 'discovery');

    await r.j.handlePostGateConfirm(
      makeReq({ params: { journeyId: jobj.journeyId }, session: { accessToken: secretToken, login: 'user' } }),
      makeRes()
    );

    console.info = origInfo;

    await test('T6a: accessToken value not present in any log line', function() {
      var allLogs = loggedLines.join('\n');
      assert.ok(!allLogs.includes(secretToken), 'secretToken found in logs: ' + allLogs.slice(0, 200));
    });

    await test('T6b: log does include expected event fields', function() {
      var allLogs = loggedLines.join('\n');
      assert.ok(allLogs.includes('pipeline_state_updated') || allLogs.includes('discoveryStatus') || allLogs.length > 0,
        'Expected some log output about the pipeline state update');
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T7: no-op writer (simulating NODE_ENV=test) does not modify pipeline-state.json
  console.log('\n[owle6] T7 -- no-op writer leaves pipeline-state.json unchanged');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle6-t7-'));
    var stateDir = path.join(tmpDir, '.github');
    fs.mkdirSync(stateDir, { recursive: true });
    var statePath = path.join(stateDir, 'pipeline-state.json');
    var originalStateContent = makePipelineState([{ slug: 'noop-feature', name: 'No-op Feature' }]);
    fs.writeFileSync(statePath, originalStateContent, 'utf8');

    // Wire no-op (as server.js does when NODE_ENV=test)
    r.j.setPipelineStateWriter(function() {});
    r.j.setRegisterHtmlSession(function() {});
    r.j.setLinkSessionToJourney(function() {});
    var sessions = makeSessionStore();
    var sessionId = 'gc-t7-' + crypto.randomUUID();
    sessions.register(sessionId, path.join(os.tmpdir(), 't7-' + sessionId + '.md'), 'discovery');
    var sess = sessions.get(sessionId);
    sess.done = true;
    sess.artefactPath = 'artefacts/noop-feature/discovery.md';
    sess.artefactContent = '# discovery';
    r.j.setGetHtmlSession(function(id) { return sessions.get(id); });
    r.j.setRepoRoot(tmpDir);
    fs.mkdirSync(path.join(tmpDir, 'artefacts', 'noop-feature'), { recursive: true });

    var jobj = r.jStore.createJourney('noop-feature');
    r.jStore.setActiveSession(jobj.journeyId, sessionId, 'discovery');

    await r.j.handlePostGateConfirm(makeReq({ params: { journeyId: jobj.journeyId } }), makeRes());

    await test('T7a: pipeline-state.json unchanged when no-op writer used', function() {
      var content = fs.readFileSync(statePath, 'utf8');
      assert.strictEqual(content, originalStateContent, 'File was modified by no-op writer');
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T8: concurrent gate-confirm calls → final pipeline-state is valid JSON
  console.log('\n[owle6] T8 -- concurrent gate-confirm calls produce valid final JSON');
  {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle6-t8-'));
    var stateDir = path.join(tmpDir, '.github');
    fs.mkdirSync(stateDir, { recursive: true });
    var statePath = path.join(stateDir, 'pipeline-state.json');
    fs.writeFileSync(statePath, makePipelineState([]), 'utf8');

    // Use real adapter for concurrency test
    var factory = freshAdapter();
    var writer = factory(tmpDir);

    // Run two concurrent writes for different features
    await Promise.all([
      writer('feature-alpha', null, { stage: 'discovery', discoveryStatus: 'complete' }),
      writer('feature-beta', null, { stage: 'discovery', discoveryStatus: 'complete' })
    ]);

    await test('T8a: pipeline-state.json is valid JSON after concurrent writes', function() {
      var content = fs.readFileSync(statePath, 'utf8');
      var state = JSON.parse(content); // throws if invalid
      assert.ok(state.features, 'features array missing');
    });

    await test('T8b: both feature entries present after concurrent writes', function() {
      var state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      var alpha = state.features.find(function(f) { return f.slug === 'feature-alpha' || f.id === 'feature-alpha'; });
      var beta = state.features.find(function(f) { return f.slug === 'feature-beta' || f.id === 'feature-beta'; });
      assert.ok(alpha, 'feature-alpha not found');
      assert.ok(beta, 'feature-beta not found');
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // Summary
  console.log('\n=== owle6 results:', passed, 'passed,', failed, 'failed ===');
  if (failures.length) {
    failures.forEach(function(f) { console.log('  FAILED:', f.name, '--', f.err && f.err.message || f.err); });
    process.exit(1);
  }
}

main().catch(function(err) { console.error(err); process.exit(1); });
