'use strict';
// check-sdg2-journey-persistence.js — TDD unit tests for sdg.2 (Reference file persistence)
// Tests: T1–T8
// All tests FAIL until src/web-ui/modules/journey-state-persistence.js is implemented
// and buildSystemPrompt() in src/web-ui/routes/skills.js accepts referenceFiles.

var assert = require('assert');
var path   = require('path');

var ROOT          = path.join(__dirname, '..');
var PERSIST_PATH  = path.join(ROOT, 'src', 'web-ui', 'modules', 'journey-state-persistence.js');
var SKILLS_PATH   = path.join(ROOT, 'src', 'web-ui', 'routes', 'skills.js');
var JOURNEY_PATH  = path.join(ROOT, 'src', 'web-ui', 'routes', 'journey.js');
var STORE_PATH    = path.join(ROOT, 'src', 'web-ui', 'modules', 'journey-store.js');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var r = fn();
    if (r && typeof r.then === 'function') {
      return r.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.message || String(err))); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.message || String(err))); return Promise.resolve();
  }
}

function freshRequireSkills() {
  try { delete require.cache[require.resolve(SKILLS_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  return require(SKILLS_PATH);
}

Promise.resolve()
  // ── T1 — updateJourneyReferenceFiles populates referenceFiles array ──────────
  .then(function() { return test('T1: updateJourneyReferenceFiles populates referenceFiles on journeyState', function() {
    var mod = require(PERSIST_PATH);
    assert.strictEqual(typeof mod.updateJourneyReferenceFiles, 'function', 'updateJourneyReferenceFiles must be exported');
    var state = {};
    mod.updateJourneyReferenceFiles(state, [
      { path: 'artefacts/test-feat/reference/strategy.md', sizeBytes: 1200 }
    ]);
    assert.ok(Array.isArray(state.referenceFiles), 'referenceFiles must be an array');
    assert.strictEqual(state.referenceFiles.length, 1);
    var entry = state.referenceFiles[0];
    assert.ok(entry.path, 'entry needs path');
    assert.ok(entry.uploadedAt, 'entry needs uploadedAt');
    assert.strictEqual(typeof entry.sizeBytes, 'number', 'sizeBytes must be a number');
  }); })

  // ── T2 — entry shape is exactly { path, uploadedAt, sizeBytes } ─────────────
  .then(function() { return test('T2: referenceFiles entry has exactly {path, uploadedAt, sizeBytes}', function() {
    var mod = require(PERSIST_PATH);
    var state = {};
    mod.updateJourneyReferenceFiles(state, [
      { path: 'artefacts/test-feat/reference/data.md', sizeBytes: 500 }
    ]);
    var entry = state.referenceFiles[0];
    var keys = Object.keys(entry).sort();
    assert.deepStrictEqual(keys, ['path', 'sizeBytes', 'uploadedAt'], 'Entry must have exactly path, uploadedAt, sizeBytes');
    assert.ok(!isNaN(new Date(entry.uploadedAt).getTime()), 'uploadedAt must be a valid ISO 8601 date');
    assert.strictEqual(entry.path, 'artefacts/test-feat/reference/data.md');
    assert.strictEqual(entry.sizeBytes, 500);
  }); })

  // ── T3 — buildSystemPrompt accepts referenceFiles parameter ─────────────────
  .then(function() { return test('T3: buildSystemPrompt accepts {priorArtefacts, referenceFiles} as 4th arg', function() {
    var skills = freshRequireSkills();
    assert.strictEqual(typeof skills.buildSystemPrompt, 'function', 'buildSystemPrompt must be exported');
    var repoPath = path.join(__dirname, '..');
    var result = skills.buildSystemPrompt('ideate', repoPath, repoPath, {
      priorArtefacts: [],
      referenceFiles: [{ path: 'artefacts/test-feat/reference/strategy.md', uploadedAt: '2026-06-26T00:00:00Z', sizeBytes: 500 }]
    });
    assert.ok(typeof result === 'string', 'buildSystemPrompt must return a string');
    assert.ok(result.length > 0, 'returned string must not be empty');
  }); })

  // ── T4 — buildSystemPrompt without referenceFiles does not throw ─────────────
  .then(function() { return test('T4: buildSystemPrompt without referenceFiles does not throw (regression guard)', function() {
    var skills = freshRequireSkills();
    var repoPath = path.join(__dirname, '..');
    var result = skills.buildSystemPrompt('ideate', repoPath, repoPath, { priorArtefacts: [] });
    assert.ok(typeof result === 'string' && result.length > 0, 'must return non-empty string without referenceFiles');
  }); })

  // ── T5 — referenceFiles survives JSON round-trip ────────────────────────────
  .then(function() { return test('T5: referenceFiles survives JSON serialise/deserialise (AC3 resume)', function() {
    var mod = require(PERSIST_PATH);
    var state = {};
    mod.updateJourneyReferenceFiles(state, [
      { path: 'artefacts/feat/reference/a.md', sizeBytes: 100 },
      { path: 'artefacts/feat/reference/b.md', sizeBytes: 200 }
    ]);
    var restored = JSON.parse(JSON.stringify(state));
    assert.ok(Array.isArray(restored.referenceFiles), 'referenceFiles must survive JSON round-trip');
    assert.strictEqual(restored.referenceFiles.length, 2);
    assert.strictEqual(restored.referenceFiles[0].path, 'artefacts/feat/reference/a.md');
    assert.strictEqual(restored.referenceFiles[1].path, 'artefacts/feat/reference/b.md');
  }); })

  // ── T6 — re-upload replaces previous list ───────────────────────────────────
  .then(function() { return test('T6: re-upload replaces previous referenceFiles list (AC4)', function() {
    var mod = require(PERSIST_PATH);
    var state = {};
    mod.updateJourneyReferenceFiles(state, [{ path: 'a.md', sizeBytes: 10 }]);
    assert.strictEqual(state.referenceFiles.length, 1);
    mod.updateJourneyReferenceFiles(state, [{ path: 'b.md', sizeBytes: 20 }]);
    assert.strictEqual(state.referenceFiles.length, 1, 're-upload must replace, not append');
    assert.strictEqual(state.referenceFiles[0].path, 'b.md', 'new file should be present');
  }); })

  // ── T7 — multiple files tracked independently ───────────────────────────────
  .then(function() { return test('T7: multiple files tracked as independent entries (AC5)', function() {
    var mod = require(PERSIST_PATH);
    var state = {};
    mod.updateJourneyReferenceFiles(state, [
      { path: 'artefacts/f/reference/a.md', sizeBytes: 1 },
      { path: 'artefacts/f/reference/b.md', sizeBytes: 2 },
      { path: 'artefacts/f/reference/c.md', sizeBytes: 3 }
    ]);
    assert.strictEqual(state.referenceFiles.length, 3, 'all 3 files must be tracked');
    var paths = state.referenceFiles.map(function(e) { return e.path; });
    assert.ok(paths.indexOf('artefacts/f/reference/a.md') !== -1);
    assert.ok(paths.indexOf('artefacts/f/reference/b.md') !== -1);
    assert.ok(paths.indexOf('artefacts/f/reference/c.md') !== -1);
    // Verify entries are independent (no shared references)
    assert.notStrictEqual(state.referenceFiles[0], state.referenceFiles[1]);
  }); })

  // ── T8 — atomic failure: write failure must not update journey state ─────────
  .then(function() { return test('T8: write failure does not orphan journey state (NFR-ATOMIC)', async function() {
    // Re-require journey.js fresh
    try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
    try { delete require.cache[require.resolve(STORE_PATH)]; } catch (_) {}
    var journey = require(JOURNEY_PATH);
    var store   = require(STORE_PATH);

    var tmpDir = require('os').tmpdir();
    var tmpRoot = require('fs').mkdtempSync(require('path').join(tmpDir, 'sdg2-atomic-'));
    journey.setRepoRoot(tmpRoot);
    store._clear();
    var j = store.createJourney('test-sdg2-atomic');
    var jid = j.journeyId;

    // Replace fs.writeFileSync with a version that throws on first call
    var fs = require('fs');
    var origWrite = fs.writeFileSync;
    var callCount = 0;
    fs.writeFileSync = function() {
      callCount++;
      if (callCount === 1) {
        fs.writeFileSync = origWrite; // restore before throwing
        throw new Error('Simulated disk write failure');
      }
      return origWrite.apply(fs, arguments);
    };

    function makeRes() {
      var r = { _status: null, _body: '' };
      r.writeHead = function(s) { r._status = s; };
      r.setHeader  = function() {};
      r.end        = function(b) { r._body += (b || ''); };
      return r;
    }

    var req = {
      session: { accessToken: 'tok', login: 'tester' },
      params: { journeyId: jid },
      body: { files: [{ name: 'fail.md', size: 10, contentBase64: Buffer.from('# content').toString('base64') }] }
    };
    var res = makeRes();
    await journey.handlePostReferenceUpload(req, res);

    // Restore in case the mock wasn't triggered
    fs.writeFileSync = origWrite;

    var updated = store.getJourney(jid);
    var refFiles = updated && updated.referenceFiles;
    assert.ok(
      !refFiles || refFiles.length === 0,
      'referenceFiles must NOT be populated when file write fails; got: ' + JSON.stringify(refFiles)
    );
    require('fs').rmSync(tmpRoot, { recursive: true, force: true });
  }); })

  .then(function() {
    console.log('\n[sdg2-journey-persistence] Results: ' + passed + ' passed, ' + failed + ' failed');
    if (failures.length) { failures.forEach(function(f) { console.log('  FAILED: ' + f.name); }); process.exit(1); }
  });
