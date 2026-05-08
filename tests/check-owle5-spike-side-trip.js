'use strict';
// check-owle5-spike-side-trip.js -- owle.5: Spike side-trip
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

  // -- T1: spikeAvailable always true at any stage
  console.log('\n[owle5-spike-side-trip] T1 -- spikeAvailable at all stages');
  {
    var r = freshRequire();
    for (var s of ['discovery', 'dor', 'definition', 'test-plan']) {
      var jobj = r.jStore.createJourney('feat');
      r.jStore.setActiveSession(jobj.journeyId, 'sess', s);
      var res = makeRes();
      r.j.handleGetStageControls(makeReq({ params: { journeyId: jobj.journeyId } }), res);
      var data = JSON.parse(res._body);
      await test('T1: spikeAvailable=true at ' + s, function(d) { return function() {
        assert.strictEqual(d.spikeAvailable, true);
      }; }(data));
    }
  }

  // -- T2: Valid spike creation writes artefact file
  console.log('\n[owle5-spike-side-trip] T2 -- Valid spike creation writes file');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle5-'));
    fs.mkdirSync(path.join(tmpDir, 'artefacts', 'test-feature'), { recursive: true });
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('test-feature');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'discovery');
    var res = makeRes();
    await r.j.handlePostSpike(makeReq({
      params: { journeyId: jobj.journeyId },
      body: {
        title: 'Assess SSE scaling',
        question: 'Can the Node.js http server handle 50 concurrent SSE connections?',
        scopeLimitHours: 4,
        doneCondition: 'Benchmark result shows P95 < 200ms'
      }
    }), res);
    var spikePath = path.join(tmpDir, 'artefacts', 'test-feature', 'spikes', 'assess-sse-scaling-spike.md');
    await test('T2a: response 201', function() { assert.strictEqual(res._code, 201); });
    await test('T2b: spike file exists', function() { assert.ok(fs.existsSync(spikePath)); });
    await test('T2c: file has title, question, scopeLimit, doneCondition, OPEN status', function() {
      var c = fs.readFileSync(spikePath, 'utf8');
      assert.ok(c.includes('Assess SSE scaling'), 'title missing');
      assert.ok(c.includes('50 concurrent SSE'), 'question missing');
      assert.ok(c.includes('4'), 'scopeLimit missing');
      assert.ok(c.includes('Benchmark result'), 'doneCondition missing');
      assert.ok(c.includes('OPEN'), 'status OPEN missing');
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T3: openSpikes in stage-controls when OPEN spike exists
  console.log('\n[owle5-spike-side-trip] T3 -- openSpikes in stage-controls');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle5-'));
    var spikesDir = path.join(tmpDir, 'artefacts', 'test-feature', 'spikes');
    fs.mkdirSync(spikesDir, { recursive: true });
    var spikeFile = path.join(spikesDir, 'my-spike-spike.md');
    fs.writeFileSync(spikeFile, '# My Spike\nstatus: OPEN\n', 'utf8');
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('test-feature');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'discovery');
    var res = makeRes();
    r.j.handleGetStageControls(makeReq({ params: { journeyId: jobj.journeyId } }), res);
    var data = JSON.parse(res._body);
    await test('T3: openSpikes array present', function() {
      assert.ok(Array.isArray(data.openSpikes), 'openSpikes not array');
      assert.ok(data.openSpikes.length > 0, 'openSpikes empty');
    });
    await test('T3: openSpikes entry has title and path', function() {
      var spike = data.openSpikes[0];
      assert.ok(spike.title, 'title missing');
      assert.ok(spike.path, 'path missing');
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T4: PATCH resolves spike, clears from openSpikes
  console.log('\n[owle5-spike-side-trip] T4 -- PATCH resolves spike');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle5-'));
    var spikesDir = path.join(tmpDir, 'artefacts', 'test-feature', 'spikes');
    fs.mkdirSync(spikesDir, { recursive: true });
    var slug = 'my-spike';
    var spikePath = path.join(spikesDir, slug + '-spike.md');
    fs.writeFileSync(spikePath, '# My Spike\nstatus: OPEN\noutcome:\n', 'utf8');
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('test-feature');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'discovery');
    var res = makeRes();
    await r.j.handlePatchSpike(makeReq({
      params: { journeyId: jobj.journeyId, spikeSlug: slug },
      body: { outcome: 'PROCEED', summary: 'Benchmarks confirmed < 100ms P95' }
    }), res);
    await test('T4a: response 200', function() { assert.strictEqual(res._code, 200); });
    await test('T4b: spike file has RESOLVED status and PROCEED outcome', function() {
      var c = fs.readFileSync(spikePath, 'utf8');
      assert.ok(c.includes('RESOLVED'), 'RESOLVED status missing');
      assert.ok(c.includes('PROCEED'), 'PROCEED outcome missing');
      assert.ok(c.includes('100ms P95'), 'summary missing');
    });
    // After resolving, stage-controls should not include this spike in openSpikes
    var res2 = makeRes();
    r.j.handleGetStageControls(makeReq({ params: { journeyId: jobj.journeyId } }), res2);
    var data2 = JSON.parse(res2._body);
    await test('T4c: openSpikes does not include resolved spike', function() {
      var open = (data2.openSpikes || []).filter(function(s) { return s.path && s.path.includes(slug); });
      assert.strictEqual(open.length, 0, 'resolved spike still in openSpikes');
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T5: Path traversal guard on title
  console.log('\n[owle5-spike-side-trip] T5 -- Path traversal guard');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle5-'));
    fs.mkdirSync(path.join(tmpDir, 'artefacts', 'test-feature'), { recursive: true });
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('test-feature');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'discovery');
    var res = makeRes();
    await r.j.handlePostSpike(makeReq({
      params: { journeyId: jobj.journeyId },
      body: { title: '../../etc/passwd', question: 'q', scopeLimitHours: 1, doneCondition: 'd' }
    }), res);
    await test('T5: path traversal title returns 400', function() { assert.strictEqual(res._code, 400); });
    // No file written outside allowed dir
    await test('T5: no file outside spikes dir', function() {
      assert.ok(!fs.existsSync(path.join(tmpDir, 'etc', 'passwd')));
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T6: Title with only special chars returns 400
  console.log('\n[owle5-spike-side-trip] T6 -- Empty slug title returns 400');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle5-'));
    fs.mkdirSync(path.join(tmpDir, 'artefacts', 'test-feature'), { recursive: true });
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('test-feature');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'discovery');
    var res = makeRes();
    await r.j.handlePostSpike(makeReq({
      params: { journeyId: jobj.journeyId },
      body: { title: '!!!', question: 'q', scopeLimitHours: 1, doneCondition: 'd' }
    }), res);
    await test('T6: only-special-char title returns 400', function() { assert.strictEqual(res._code, 400); });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T7: Duplicate title returns 409
  console.log('\n[owle5-spike-side-trip] T7 -- Duplicate title returns 409');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle5-'));
    var spikesDir = path.join(tmpDir, 'artefacts', 'test-feature', 'spikes');
    fs.mkdirSync(spikesDir, { recursive: true });
    fs.writeFileSync(path.join(spikesDir, 'my-spike-spike.md'), '# My Spike\nstatus: OPEN\n', 'utf8');
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('test-feature');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'discovery');
    var res = makeRes();
    await r.j.handlePostSpike(makeReq({
      params: { journeyId: jobj.journeyId },
      body: { title: 'My Spike', question: 'q', scopeLimitHours: 1, doneCondition: 'd' }
    }), res);
    await test('T7a: duplicate title returns 409', function() { assert.strictEqual(res._code, 409); });
    await test('T7b: existing file content unchanged', function() {
      var c = fs.readFileSync(path.join(spikesDir, 'my-spike-spike.md'), 'utf8');
      assert.ok(c.includes('My Spike'), 'file overwritten');
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T8: Feature slug read server-side
  console.log('\n[owle5-spike-side-trip] T8 -- featureSlug read server-side');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle5-'));
    fs.mkdirSync(path.join(tmpDir, 'artefacts', 'correct-slug'), { recursive: true });
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('correct-slug');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'discovery');
    await r.j.handlePostSpike(makeReq({
      params: { journeyId: jobj.journeyId },
      body: { title: 'My Spike', question: 'q', scopeLimitHours: 1, doneCondition: 'd', featureSlug: 'injected' }
    }), makeRes());
    await test('T8: spike written under correct-slug, not injected', function() {
      assert.ok(fs.existsSync(path.join(tmpDir, 'artefacts', 'correct-slug', 'spikes', 'my-spike-spike.md')));
      assert.ok(!fs.existsSync(path.join(tmpDir, 'artefacts', 'injected', 'spikes', 'my-spike-spike.md')));
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- Results
  console.log('\n[owle5-spike-side-trip] ' + (passed + failed) + ' run, ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    failures.forEach(function(f) { console.log('  FAILURE:', f.name, '--', f.err && f.err.message || f.err); });
  }
  if (failed > 0) process.exit(1);
}

main().catch(function(err) { console.error(err); process.exit(1); });
