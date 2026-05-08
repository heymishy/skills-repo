'use strict';
// check-owle3-trace-side-trip.js -- owle.3: Trace side-trip
// TDD: all tests FAIL before implementation, PASS after.

var assert = require('assert');
var path = require('path');
var os = require('os');
var fs = require('fs');

var JOURNEY_PATH       = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');

function freshRequire() {
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch(_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch(_) {}
  var jStore = require(JOURNEY_STORE_PATH);
  var j      = require(JOURNEY_PATH);
  return { jStore: jStore, j: j };
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

function mkTree(base, files) {
  files.forEach(function(f) {
    var full = path.join(base, f);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, '# ' + path.basename(f), 'utf8');
  });
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
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch(err) {
    failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

async function main() {

  // -- T1: traceAvailable at all stages
  console.log('\n[owle3-trace-side-trip] T1 -- traceAvailable at all stages');
  {
    var r = freshRequire();
    await test('T1a: traceAvailable=true at discovery stage', function() {
      var jobj = r.jStore.createJourney('feat');
      r.jStore.setActiveSession(jobj.journeyId, 'sess-1', 'discovery');
      var res = makeRes();
      r.j.handleGetStageControls(makeReq({ params: { journeyId: jobj.journeyId } }), res);
      assert.strictEqual(res._code, 200);
      assert.strictEqual(JSON.parse(res._body).traceAvailable, true);
    });
    await test('T1b: traceAvailable=true at dor stage', function() {
      var jobj = r.jStore.createJourney('feat');
      r.jStore.setActiveSession(jobj.journeyId, 'sess-2', 'dor');
      var res = makeRes();
      r.j.handleGetStageControls(makeReq({ params: { journeyId: jobj.journeyId } }), res);
      assert.strictEqual(res._code, 200);
      assert.strictEqual(JSON.parse(res._body).traceAvailable, true);
    });
  }

  // -- T2: Fully-linked artefact tree returns PASSED
  console.log('\n[owle3-trace-side-trip] T2 -- Fully-linked tree returns passed');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle3-'));
    mkTree(path.join(tmpDir, 'artefacts', 'myfeat'), [
      'discovery.md',
      'benefit-metric.md',
      'stories/s1.md',
      'test-plans/s1-test-plan.md',
      'dor/s1-dor.md'
    ]);
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('myfeat');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'definition');
    var res = makeRes();
    await r.j.handleGetTrace(makeReq({ params: { journeyId: jobj.journeyId } }), res);
    await test('T2: status passed, no findings', function() {
      var data = JSON.parse(res._body);
      assert.strictEqual(data.status, 'passed');
      assert.strictEqual(data.findings.length, 0);
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T3: Missing test-plan returns HAS-FINDINGS
  console.log('\n[owle3-trace-side-trip] T3 -- Missing test-plan returns has-findings');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle3-'));
    mkTree(path.join(tmpDir, 'artefacts', 'myfeat'), [
      'discovery.md',
      'benefit-metric.md',
      'stories/s1.md',
      // test-plan absent
      'dor/s1-dor.md'
    ]);
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('myfeat');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'definition');
    var res = makeRes();
    await r.j.handleGetTrace(makeReq({ params: { journeyId: jobj.journeyId } }), res);
    await test('T3a: status has-findings', function() {
      var data = JSON.parse(res._body);
      assert.strictEqual(data.status, 'has-findings');
    });
    await test('T3b: finding type missing-test-plan', function() {
      var data = JSON.parse(res._body);
      assert.ok(data.findings.some(function(f) { return f.type === 'missing-test-plan'; }), 'missing-test-plan finding not present');
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T4: Missing discovery.md returns FAILED
  console.log('\n[owle3-trace-side-trip] T4 -- Missing discovery.md returns failed');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle3-'));
    // Artefacts dir exists but no discovery.md
    fs.mkdirSync(path.join(tmpDir, 'artefacts', 'myfeat'), { recursive: true });
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('myfeat');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'discovery');
    var res = makeRes();
    await r.j.handleGetTrace(makeReq({ params: { journeyId: jobj.journeyId } }), res);
    await test('T4a: status failed', function() {
      var data = JSON.parse(res._body);
      assert.strictEqual(data.status, 'failed');
    });
    await test('T4b: finding for missing discovery', function() {
      var data = JSON.parse(res._body);
      assert.ok(data.findings && data.findings.length > 0, 'no findings');
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T5: Empty artefact directory returns HAS-FINDINGS or FAILED (no throw)
  console.log('\n[owle3-trace-side-trip] T5 -- Empty artefact dir returns has-findings or failed');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle3-'));
    fs.mkdirSync(path.join(tmpDir, 'artefacts', 'emptyslug'), { recursive: true });
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('emptyslug');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'discovery');
    var res = makeRes();
    await r.j.handleGetTrace(makeReq({ params: { journeyId: jobj.journeyId } }), res);
    await test('T5: no unhandled exception, status is has-findings or failed', function() {
      var data = JSON.parse(res._body);
      assert.ok(data.status === 'has-findings' || data.status === 'failed', 'expected has-findings or failed, got: ' + data.status);
      assert.ok(data.findings && data.findings.length > 0, 'no findings');
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T6: Second call replaces prior result
  console.log('\n[owle3-trace-side-trip] T6 -- Second call is fresh (no caching)');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle3-'));
    // First call: full tree → passed
    mkTree(path.join(tmpDir, 'artefacts', 'myfeat'), [
      'discovery.md', 'stories/s1.md', 'test-plans/s1-test-plan.md', 'dor/s1-dor.md'
    ]);
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('myfeat');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'definition');
    var res1 = makeRes();
    await r.j.handleGetTrace(makeReq({ params: { journeyId: jobj.journeyId } }), res1);

    // Remove test-plan between calls → second call should show has-findings
    fs.unlinkSync(path.join(tmpDir, 'artefacts', 'myfeat', 'test-plans', 's1-test-plan.md'));
    var res2 = makeRes();
    await r.j.handleGetTrace(makeReq({ params: { journeyId: jobj.journeyId } }), res2);

    await test('T6: second result reflects current state (has-findings after removal)', function() {
      var d1 = JSON.parse(res1._body);
      var d2 = JSON.parse(res2._body);
      assert.strictEqual(d1.status, 'passed');
      assert.strictEqual(d2.status, 'has-findings');
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T7: Path traversal guard
  console.log('\n[owle3-trace-side-trip] T7 -- Path traversal guard');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle3-'));
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('../../etc/passwd');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'discovery');
    var res = makeRes();
    await r.j.handleGetTrace(makeReq({ params: { journeyId: jobj.journeyId } }), res);
    await test('T7: path traversal returns 400', function() {
      assert.strictEqual(res._code, 400);
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T8: Performance with 10 stories / many files
  console.log('\n[owle3-trace-side-trip] T8 -- Performance with 10 stories');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle3-'));
    var files = ['discovery.md', 'benefit-metric.md'];
    for (var i = 1; i <= 10; i++) {
      files.push('stories/s' + i + '.md');
      files.push('test-plans/s' + i + '-test-plan.md');
      files.push('dor/s' + i + '-dor.md');
    }
    mkTree(path.join(tmpDir, 'artefacts', 'perfslug'), files);
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('perfslug');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'discovery');
    var res = makeRes();
    await r.j.handleGetTrace(makeReq({ params: { journeyId: jobj.journeyId } }), res);
    await test('T8: completes without error, 10 stories all passed', function() {
      var data = JSON.parse(res._body);
      assert.strictEqual(data.status, 'passed');
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- Results
  console.log('\n[owle3-trace-side-trip] ' + (passed + failed) + ' run, ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    failures.forEach(function(f) { console.log('  FAILURE:', f.name, '--', f.err && f.err.message || f.err); });
  }
  if (failed > 0) process.exit(1);
}

main().catch(function(err) { console.error(err); process.exit(1); });
