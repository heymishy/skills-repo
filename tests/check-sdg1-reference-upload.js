'use strict';
// check-sdg1-reference-upload.js — TDD unit tests for sdg.1 (Reference upload modal UI)
// Tests: T1–T8
// All tests FAIL until src/web-ui/modules/reference-validator.js is implemented
// and POST /api/journey/:journeyId/reference-upload is wired.

var assert = require('assert');
var path   = require('path');
var os     = require('os');
var fs     = require('fs');

var ROOT            = path.join(__dirname, '..');
var VALIDATOR_PATH  = path.join(ROOT, 'src', 'web-ui', 'modules', 'reference-validator.js');
var JOURNEY_PATH    = path.join(ROOT, 'src', 'web-ui', 'routes', 'journey.js');
var JOURNEY_STORE   = path.join(ROOT, 'src', 'web-ui', 'modules', 'journey-store.js');

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

function makeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.setHeader  = function(k, v) { r._headers[k] = v; };
  r.end        = function(b) { r._body += (b || ''); };
  return r;
}

function makeReq(overrides) {
  return Object.assign({ session: { accessToken: 'tok', login: 'tester' }, params: {}, body: undefined }, overrides);
}

function freshRequireJourney() {
  // Only clear journey.js — leave journey-store cached so both callers share the same instance
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(VALIDATOR_PATH)]; } catch (_) {}
  return require(JOURNEY_PATH);
}

function getStore() {
  // Return the already-cached instance (same as what journey.js uses)
  return require(JOURNEY_STORE);
}

function makeTmpDir(suffix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sdg1-test-' + suffix + '-'));
}

// Tests are defined inline in the sequential runner below

// ── Runner — sequential to avoid store._clear() races ───────────────────────

Promise.resolve()
  .then(function() { return test('T1: reference-validator module loads without error', function() {
    if (!fs.existsSync(VALIDATOR_PATH)) throw new Error('Module not found: ' + VALIDATOR_PATH);
    var mod = require(VALIDATOR_PATH);
    assert.strictEqual(typeof mod.validateReferenceFile, 'function', 'validateReferenceFile must be exported');
    assert.strictEqual(typeof mod.writeReferenceFile, 'function', 'writeReferenceFile must be exported');
  }); })
  .then(function() { return test('T2: validateReferenceFile rejects non-.md extension', function() {
    var mod = require(VALIDATOR_PATH);
    var result = mod.validateReferenceFile({ name: 'strategy.xlsx', size: 1000, content: Buffer.from('hello') });
    assert.strictEqual(result.valid, false);
    assert.ok(result.error && (result.error.includes('strategy.xlsx') || result.error.toLowerCase().includes('.md') || result.error.toLowerCase().includes('markdown')));
  }); })
  .then(function() { return test('T3: validateReferenceFile rejects files exceeding 1 MB', function() {
    var mod = require(VALIDATOR_PATH);
    var result = mod.validateReferenceFile({ name: 'big.md', size: 1_048_577, content: Buffer.alloc(1_048_577, 65) });
    assert.strictEqual(result.valid, false);
    assert.ok(result.error);
  }); })
  .then(function() { return test('T4: validateReferenceFile rejects non-UTF-8 binary content', function() {
    var mod = require(VALIDATOR_PATH);
    var result = mod.validateReferenceFile({ name: 'binary.md', size: 6, content: Buffer.from([0xFF, 0xFE, 0x80, 0x81, 0x82, 0x00]) });
    assert.strictEqual(result.valid, false);
    assert.ok(result.error);
  }); })
  .then(function() { return test('T5: valid file written to artefacts/[slug]/reference/[filename]', function() {
    var mod = require(VALIDATOR_PATH);
    var tmpRoot = makeTmpDir('write');
    try {
      mod.writeReferenceFile(tmpRoot, 'test-feature', 'strategy.md', '# Strategy\n\nContent here.');
      var expected = path.join(tmpRoot, 'artefacts', 'test-feature', 'reference', 'strategy.md');
      assert.ok(fs.existsSync(expected));
      assert.strictEqual(fs.readFileSync(expected, 'utf8'), '# Strategy\n\nContent here.');
    } finally { fs.rmSync(tmpRoot, { recursive: true, force: true }); }
  }); })
  .then(function() { return test('T6: journey.referenceFiles populated after successful upload', async function() {
    var journey = freshRequireJourney();
    var store   = getStore();
    var tmpRoot = makeTmpDir('session');
    journey.setRepoRoot(tmpRoot);
    store._clear();
    var j = store.createJourney('test-sdg1-feat');
    var jid = j.journeyId;
    var req = makeReq({ params: { journeyId: jid }, body: { files: [{ name: 'strategy.md', size: 100, contentBase64: Buffer.from('# Strategy content').toString('base64') }] } });
    var res = makeRes();
    await journey.handlePostReferenceUpload(req, res);
    assert.strictEqual(res._status, 200, 'Expected HTTP 200; got ' + res._status + '; body: ' + res._body);
    var updated = store.getJourney(jid);
    assert.ok(updated && updated.referenceFiles && Array.isArray(updated.referenceFiles) && updated.referenceFiles.length > 0);
    var entry = updated.referenceFiles[0];
    assert.ok(entry.path, 'Entry needs path');
    assert.ok(entry.uploadedAt, 'Entry needs uploadedAt');
    assert.ok(typeof entry.sizeBytes === 'number', 'Entry needs sizeBytes');
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }); })
  .then(function() { return test('T7: path traversal filename rejected with HTTP 400', async function() {
    var journey = freshRequireJourney();
    var store   = getStore();
    var tmpRoot = makeTmpDir('traversal');
    journey.setRepoRoot(tmpRoot);
    store._clear();
    var j = store.createJourney('test-sdg1-traversal');
    var req = makeReq({ params: { journeyId: j.journeyId }, body: { files: [{ name: '../../etc/passwd.md', size: 10, contentBase64: Buffer.from('evil').toString('base64') }] } });
    var res = makeRes();
    await journey.handlePostReferenceUpload(req, res);
    assert.strictEqual(res._status, 400, 'Expected HTTP 400; got ' + res._status);
    var escaped = path.join(tmpRoot, 'etc', 'passwd.md');
    if (fs.existsSync(escaped)) throw new Error('Traversal file should not be written: ' + escaped);
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }); })
  .then(function() { return test('T8: invalid file in batch does not block valid files', async function() {
    var journey = freshRequireJourney();
    var store   = getStore();
    var tmpRoot = makeTmpDir('batch');
    journey.setRepoRoot(tmpRoot);
    store._clear();
    var j = store.createJourney('test-sdg1-batch');
    var req = makeReq({ params: { journeyId: j.journeyId }, body: { files: [
      { name: 'good.md',  size: 100, contentBase64: Buffer.from('# Good content').toString('base64') },
      { name: 'bad.xlsx', size: 100, contentBase64: Buffer.from('not md').toString('base64') }
    ]}});
    var res = makeRes();
    await journey.handlePostReferenceUpload(req, res);
    assert.ok(res._status === 200 || res._status === 207, 'Expected 200 or 207; got ' + res._status);
    var goodPath = path.join(tmpRoot, 'artefacts', 'test-sdg1-batch', 'reference', 'good.md');
    assert.ok(fs.existsSync(goodPath), 'good.md should be written');
    var badPath = path.join(tmpRoot, 'artefacts', 'test-sdg1-batch', 'reference', 'bad.xlsx');
    assert.ok(!fs.existsSync(badPath), 'bad.xlsx should NOT be written');
    var rb = JSON.parse(res._body);
    assert.ok(Array.isArray(rb.errors) && rb.errors.length > 0);
    assert.ok(rb.errors[0].name === 'bad.xlsx');
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }); })
  .then(function() {
    console.log('\n[sdg1-reference-upload] Results: ' + passed + ' passed, ' + failed + ' failed');
    if (failures.length) { failures.forEach(function(f) { console.log('  FAILED: ' + f.name); }); process.exit(1); }
  });
