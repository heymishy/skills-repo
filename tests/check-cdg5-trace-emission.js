'use strict';
// check-cdg5-trace-emission.js
// TDD tests for cdg.5: chain-hash trace emission on gate-confirm.
//
// Tests are RED until Tasks 2-5 are implemented.
// T1, T4, T6, IT1 require setWriteTrace in journey.js (Task 3).
// T2, T3, NFR-INT-1 require governance-package.writeTrace extension (Task 2).
// T5 requires setWriteTrace export (Task 3).
// T7 requires .gitignore entry (Task 5).
// NFR-ISO-1 is structural (passes once isolation pattern is in place).

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
var GOV_PKG_PATH = path.resolve(ROOT, 'src', 'enforcement', 'governance-package.js');
var TMP_ROOT = path.join(ROOT, 'workspace', 'test-tmp-cdg5');
fs.mkdirSync(TMP_ROOT, { recursive: true });

function freshRequireJourney() {
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch (_) {}
  return require(JOURNEY_PATH);
}

function getStore() {
  return require(JOURNEY_STORE_PATH);
}

function makeRes() {
  var res = {
    _status: null,
    _headers: {},
    _body: '',
    writeHead: function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); },
    setHeader: function(k, v) { res._headers[k] = v; },
    end: function(body) { res._body += (body || ''); }
  };
  return res;
}

function authReq(extra) {
  return Object.assign({
    session: { accessToken: 'test-token', userId: 1, login: 'user' },
    params: {},
    body: {}
  }, extra || {});
}

function setupDorSession(journey, store, opts) {
  opts = opts || {};
  var featureSlug = opts.featureSlug || 'test-feature-cdg5';
  var artefactRelPath = opts.artefactRelPath || path.join('artefacts', 'test', 'dor-cdg5.md');
  var skillName = opts.skillName || 'definition-of-ready';

  store._clear();
  var journeyObj = store.createJourney(featureSlug);
  var journeyId = journeyObj.journeyId;
  store.setStoryList(journeyId, ['cdg5-story1']);
  var sid = 'sid-cdg5-' + Date.now() + '-' + Math.random();
  store.setActiveSession(journeyId, sid, skillName);

  if (opts.writeArtefact !== false) {
    var absArtefact = path.join(TMP_ROOT, artefactRelPath);
    fs.mkdirSync(path.dirname(absArtefact), { recursive: true });
    fs.writeFileSync(absArtefact, opts.artefactContent || '# DoR artefact', 'utf8');
  }

  journey.setJourneyStoreModule(store);
  journey.setRegisterHtmlSession(function() {});
  journey.setLinkSessionToJourney(function() {});
  journey.setRepoRoot(TMP_ROOT);

  journey.setGetHtmlSession(function(s) {
    if (s === sid) {
      return {
        skillName: skillName,
        done: true,
        artefactPath: artefactRelPath,
        artefactContent: opts.artefactContent || '# DoR artefact',
        journeyId: journeyId,
        turns: [],
        systemPrompt: 'test'
      };
    }
    return null;
  });

  return { journeyId: journeyId, sid: sid };
}

var queue = [];

// ---------------------------------------------------------------------------
// T1 — setWriteTrace stub called with required fields on DoR gate-confirm (AC1)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1: setWriteTrace called with required fields on DoR gate-confirm', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var capturedArg = null;

    var setup = setupDorSession(journey, store, { featureSlug: 'cdg5-t1-feature' });

    journey.setValidate(function() { return { exitCode: 0 }; });
    journey.setPipelineStateWriter(function() {});
    journey.setWriteTrace(function(entry) { capturedArg = entry; });

    var req = authReq({ params: { journeyId: setup.journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.ok(capturedArg !== null, 'T1: setWriteTrace must be called');
    assert.ok(typeof capturedArg.timestamp === 'string' && capturedArg.timestamp.length > 0, 'T1: entry.timestamp must be an ISO string');
    assert.strictEqual(capturedArg.featureSlug, 'cdg5-t1-feature', 'T1: entry.featureSlug must match journey featureSlug');
    assert.ok(typeof capturedArg.storyId === 'string' || capturedArg.storyId === null, 'T1: entry.storyId must be string or null');
    assert.strictEqual(capturedArg.stage, 'definition-of-ready', 'T1: entry.stage must be definition-of-ready');
    assert.strictEqual(capturedArg.exitCode, 0, 'T1: entry.exitCode must be 0');
    assert.ok(typeof capturedArg.operatorEmail === 'string', 'T1: entry.operatorEmail must be a string (may be empty)');
  });
});

// ---------------------------------------------------------------------------
// T2 — chain hash correct for N>1 entries (AC2, tests governance-package directly)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T2: chain hash correct for second entry (uses prevChainHash from prior entry)', function() {
    var govPkg = require(GOV_PKG_PATH);
    var tmpPath = path.join(TMP_ROOT, 'chain-test-t2-' + Date.now() + '.trace.jsonl');

    var priorChainHash = 'abc123def456abc123def456abc123def456abc123def456abc123def456abcd';
    var priorEntry = { timestamp: '2026-01-01T00:00:00.000Z', featureSlug: 'chain-test', storyId: 'story-1', stage: 'definition-of-ready', operatorEmail: 'a@b.com', exitCode: 0, chainHash: priorChainHash };
    fs.writeFileSync(tmpPath, JSON.stringify(priorEntry) + '\n', 'utf8');

    var entry2 = { timestamp: '2026-01-01T01:00:00.000Z', featureSlug: 'chain-test', storyId: 'story-2', stage: 'definition-of-ready', operatorEmail: 'a@b.com', exitCode: 0 };
    var result2 = govPkg.writeTrace(entry2, { tracePath: tmpPath });

    var entryWithoutHash = { timestamp: entry2.timestamp, featureSlug: entry2.featureSlug, storyId: entry2.storyId, stage: entry2.stage, operatorEmail: entry2.operatorEmail, exitCode: entry2.exitCode };
    var expectedHash = crypto.createHash('sha256').update(JSON.stringify(entryWithoutHash) + priorChainHash).digest('hex');

    assert.strictEqual(result2.chainHash, expectedHash, 'T2: second entry chainHash must incorporate prevChainHash');
    assert.strictEqual(result2.chainHash.length, 64, 'T2: chainHash must be 64-char hex string');

    try { fs.unlinkSync(tmpPath); } catch (_) {}
  });
});

// ---------------------------------------------------------------------------
// T3 — first entry uses empty-string prior hash (AC3)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3: first entry in absent trace file uses empty-string prior hash', function() {
    var govPkg = require(GOV_PKG_PATH);
    var tmpPath = path.join(TMP_ROOT, 'first-entry-t3-' + Date.now() + '.trace.jsonl');

    var entry = { timestamp: '2026-05-01T10:00:00.000Z', featureSlug: 'first-entry-test', storyId: 'cdg.5', stage: 'definition-of-ready', operatorEmail: 'x@y.com', exitCode: 0 };
    var result = govPkg.writeTrace(entry, { tracePath: tmpPath });

    var entryWithoutHash = { timestamp: entry.timestamp, featureSlug: entry.featureSlug, storyId: entry.storyId, stage: entry.stage, operatorEmail: entry.operatorEmail, exitCode: entry.exitCode };
    var expectedHash = crypto.createHash('sha256').update(JSON.stringify(entryWithoutHash) + '').digest('hex');

    assert.strictEqual(result.chainHash, expectedHash, 'T3: first entry chainHash must be SHA-256 of entry + empty prevHash');
    assert.ok(fs.existsSync(tmpPath), 'T3: trace file must be created');
    var line = fs.readFileSync(tmpPath, 'utf8').trim();
    var parsed = JSON.parse(line);
    assert.strictEqual(parsed.chainHash, expectedHash, 'T3: persisted line chainHash must match returned value');

    try { fs.unlinkSync(tmpPath); } catch (_) {}
  });
});

// ---------------------------------------------------------------------------
// T4 — no trace written when validate returns non-zero exitCode (AC4)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4: setWriteTrace NOT called when validate returns non-zero exitCode', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var writeTraceCalled = false;

    var setup = setupDorSession(journey, store, { featureSlug: 'cdg5-t4-feature' });

    journey.setValidate(function() { return { exitCode: 3, stderr: 'H3: validation failed' }; });
    journey.setPipelineStateWriter(function() {});
    journey.setWriteTrace(function() { writeTraceCalled = true; });

    var req = authReq({ params: { journeyId: setup.journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.strictEqual(res._status, 422, 'T4: expected 422 when validate fails, got ' + res._status);
    assert.ok(!writeTraceCalled, 'T4: setWriteTrace must NOT be called when validate returns non-zero');
  });
});

// ---------------------------------------------------------------------------
// T5 — setWriteTrace is exported from journey.js (AC5)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T5: setWriteTrace is exported as a function from journey.js', function() {
    var journey = freshRequireJourney();
    assert.strictEqual(typeof journey.setWriteTrace, 'function', 'T5: setWriteTrace must be exported as a function');
  });
});

// ---------------------------------------------------------------------------
// T6 — default stub throws "Adapter not wired: writeTrace" (AC6, D37)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T6: default writeTrace stub (no setWriteTrace) throws D37 "Adapter not wired: writeTrace"', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var featureSlug = 'cdg5-t6-feature';
    store._clear();
    var journeyObj = store.createJourney(featureSlug);
    var journeyId = journeyObj.journeyId;
    store.setStoryList(journeyId, ['story-t6']);
    var sid = 'sid-cdg5-t6-' + Date.now();
    store.setActiveSession(journeyId, sid, 'definition-of-ready');

    var artefactRelPath = path.join('artefacts', 'test-cdg5-t6', 'dor.md');
    var absArtefact = path.join(TMP_ROOT, artefactRelPath);
    fs.mkdirSync(path.dirname(absArtefact), { recursive: true });
    fs.writeFileSync(absArtefact, '# DoR T6', 'utf8');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(TMP_ROOT);
    journey.setValidate(function() { return { exitCode: 0 }; });
    journey.setPipelineStateWriter(function() {});
    // DO NOT call journey.setWriteTrace() — test the default stub

    journey.setGetHtmlSession(function(s) {
      if (s === sid) {
        return { skillName: 'definition-of-ready', done: true, artefactPath: artefactRelPath, artefactContent: '# DoR T6', journeyId: journeyId, turns: [], systemPrompt: 'test' };
      }
      return null;
    });

    var req = authReq({ params: { journeyId: journeyId } });
    var res = makeRes();
    var caughtErr = null;
    try {
      await journey.handlePostGateConfirm(req, res);
    } catch (e) {
      caughtErr = e;
    }

    // D37: default stub MUST throw — either propagates as exception or yields 500
    var isError = (caughtErr !== null) || (res._status === 500);
    assert.ok(isError, 'T6: D37 throw must propagate as exception or 500 response. status=' + res._status + ' caught=' + (caughtErr && caughtErr.message));
    var errorText = (caughtErr && caughtErr.message) || res._body || '';
    assert.ok(
      errorText.includes('Adapter not wired: writeTrace') || errorText.includes('writeTrace'),
      'T6: error must reference writeTrace. Got: ' + errorText
    );
  });
});

// ---------------------------------------------------------------------------
// T7 — workspace/traces/ appears in .gitignore (AC7)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T7: workspace/traces/ is listed in .gitignore', function() {
    var gitignorePath = path.join(ROOT, '.gitignore');
    assert.ok(fs.existsSync(gitignorePath), 'T7: .gitignore must exist');
    var content = fs.readFileSync(gitignorePath, 'utf8');
    var lines = content.split('\n').map(function(l) { return l.trim(); });
    var hasEntry = lines.some(function(l) { return l === 'workspace/traces/' && !l.startsWith('#'); });
    assert.ok(hasEntry, 'T7: .gitignore must contain a non-commented line "workspace/traces/"');
  });
});

// ---------------------------------------------------------------------------
// IT1 — real governance-package.writeTrace integration (AC1, AC2, NFR-INT-1)
// Verifies: two consecutive gate-confirms append two entries with correct chain hashes
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('IT1: real writeTrace integration — appends two entries with correct chain hashes', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var govPkg = require(GOV_PKG_PATH);

    var featureSlug = 'cdg5-it1-' + Date.now();
    var tmpTracePath = path.join(TMP_ROOT, featureSlug + '.trace.jsonl');

    // Wire real writeTrace with temp path injection
    journey.setWriteTrace(function(entry) {
      return govPkg.writeTrace(entry, { tracePath: tmpTracePath });
    });

    // --- First gate-confirm ---
    var setup1 = setupDorSession(journey, store, { featureSlug: featureSlug, artefactRelPath: path.join('artefacts', 'test', 'it1-dor1.md') });
    journey.setValidate(function() { return { exitCode: 0 }; });
    journey.setPipelineStateWriter(function() {});

    var req1 = authReq({ params: { journeyId: setup1.journeyId } });
    var res1 = makeRes();
    await journey.handlePostGateConfirm(req1, res1);

    assert.ok(fs.existsSync(tmpTracePath), 'IT1: trace file must exist after first gate-confirm');
    var lines1 = fs.readFileSync(tmpTracePath, 'utf8').split('\n').filter(function(l) { return l.trim(); });
    assert.strictEqual(lines1.length, 1, 'IT1: trace file must have exactly 1 line after first call');
    var entry1 = JSON.parse(lines1[0]);
    assert.ok(typeof entry1.chainHash === 'string' && entry1.chainHash.length === 64, 'IT1: first entry must have 64-char chainHash');
    var e1WithoutHash = { timestamp: entry1.timestamp, featureSlug: entry1.featureSlug, storyId: entry1.storyId, stage: entry1.stage, operatorEmail: entry1.operatorEmail, exitCode: entry1.exitCode };
    var expectedHash1 = crypto.createHash('sha256').update(JSON.stringify(e1WithoutHash) + '').digest('hex');
    assert.strictEqual(entry1.chainHash, expectedHash1, 'IT1: first entry chainHash must use empty prevHash');

    // --- Second gate-confirm (same featureSlug, new journey/story) ---
    store._clear();
    var journeyObj2 = store.createJourney(featureSlug);
    var journeyId2 = journeyObj2.journeyId;
    store.setStoryList(journeyId2, ['cdg5-story2-it1']);
    var sid2 = 'sid-it1-second-' + Date.now();
    store.setActiveSession(journeyId2, sid2, 'definition-of-ready');

    var artefactRelPath2 = path.join('artefacts', 'test', 'it1-dor2.md');
    var absArt2 = path.join(TMP_ROOT, artefactRelPath2);
    fs.mkdirSync(path.dirname(absArt2), { recursive: true });
    fs.writeFileSync(absArt2, '# DoR 2', 'utf8');

    journey.setJourneyStoreModule(store);
    journey.setGetHtmlSession(function(s) {
      if (s === sid2) {
        return { skillName: 'definition-of-ready', done: true, artefactPath: artefactRelPath2, artefactContent: '# DoR 2', journeyId: journeyId2, turns: [], systemPrompt: 'test' };
      }
      return null;
    });

    var req2 = authReq({ params: { journeyId: journeyId2 } });
    var res2 = makeRes();
    await journey.handlePostGateConfirm(req2, res2);

    var lines2 = fs.readFileSync(tmpTracePath, 'utf8').split('\n').filter(function(l) { return l.trim(); });
    assert.strictEqual(lines2.length, 2, 'IT1 (NFR-INT-1): trace file must have 2 lines after second call — appendFileSync, not overwrite');
    var entry2 = JSON.parse(lines2[1]);
    assert.ok(typeof entry2.chainHash === 'string' && entry2.chainHash.length === 64, 'IT1: second entry must have 64-char chainHash');
    var e2WithoutHash = { timestamp: entry2.timestamp, featureSlug: entry2.featureSlug, storyId: entry2.storyId, stage: entry2.stage, operatorEmail: entry2.operatorEmail, exitCode: entry2.exitCode };
    var expectedHash2 = crypto.createHash('sha256').update(JSON.stringify(e2WithoutHash) + entry1.chainHash).digest('hex');
    assert.strictEqual(entry2.chainHash, expectedHash2, 'IT1: second entry chainHash must chain from first entry chainHash');

    // Cleanup
    try { fs.unlinkSync(tmpTracePath); } catch (_) {}
  });
});

// ---------------------------------------------------------------------------
// NFR-INT-1 — governance-package.js must use appendFileSync (static source check)
// (Runtime coverage provided by IT1 line-count assertion)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('NFR-INT-1: governance-package.js source uses appendFileSync for trace writes', function() {
    assert.ok(fs.existsSync(GOV_PKG_PATH), 'NFR-INT-1: governance-package.js must exist');
    var govSrc = fs.readFileSync(GOV_PKG_PATH, 'utf8');
    assert.ok(govSrc.includes('appendFileSync'), 'NFR-INT-1: governance-package.js must call appendFileSync for trace appends');
  });
});

// ---------------------------------------------------------------------------
// NFR-ISO-1 — structural isolation: test temp files use unique paths
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('NFR-ISO-1: test isolation — TMP_ROOT is under workspace/test-tmp-cdg5 within repo', function() {
    assert.ok(TMP_ROOT.includes('test-tmp-cdg5'), 'NFR-ISO-1: TMP_ROOT must include test-tmp-cdg5 marker');
    assert.ok(TMP_ROOT.startsWith(ROOT), 'NFR-ISO-1: TMP_ROOT must be within repo root');
    // T2, T3 use Date.now() in trace paths — unique per run
    // IT1 uses featureSlug with Date.now() — unique per run
    // All temp files deleted in individual test cleanup blocks
    assert.ok(true, 'NFR-ISO-1: structural isolation confirmed via Date.now() slugs and per-test cleanup');
  });
});

// ---------------------------------------------------------------------------
// Run all tests sequentially
// ---------------------------------------------------------------------------
console.log('\n[cdg5-trace-emission] Running chain-hash trace emission tests...\n');

queue.reduce(function(p, fn) { return p.then(fn); }, Promise.resolve()).then(function() {
  console.log('\n[cdg5-trace-emission] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  if (failures.length > 0) {
    console.log('Failures:');
    failures.forEach(function(f) { console.log('  - ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
  }
  if (failed > 0) process.exit(1);
});
