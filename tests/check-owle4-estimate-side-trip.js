'use strict';
// check-owle4-estimate-side-trip.js -- owle.4: Estimate side-trip
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

  // -- T1: estimateAvailable only at discovery + definition
  console.log('\n[owle4-estimate-side-trip] T1 -- estimateAvailable stage gating');
  {
    var r = freshRequire();
    var stages = ['discovery', 'definition', 'test-plan', 'dor'];
    for (var i = 0; i < stages.length; i++) {
      var stage = stages[i];
      var jobj = r.jStore.createJourney('feat');
      r.jStore.setActiveSession(jobj.journeyId, 'sess', stage);
      var res = makeRes();
      r.j.handleGetStageControls(makeReq({ params: { journeyId: jobj.journeyId } }), res);
      var data = JSON.parse(res._body);
      (function(s, d) {
        if (s === 'discovery' || s === 'definition') {
          test('T1: estimateAvailable=true at ' + s, function() {
            assert.strictEqual(d.estimateAvailable, true);
          });
        } else {
          test('T1: estimateAvailable=false at ' + s, function() {
            assert.ok(!d.estimateAvailable, 'expected false/absent at ' + s + ', got ' + d.estimateAvailable);
          });
        }
      })(stage, data);
    }
    // wait for sync tests to settle
    await new Promise(function(r) { setTimeout(r, 0); });
  }

  // -- T2: Valid E1 submission creates estimation-norms.md
  console.log('\n[owle4-estimate-side-trip] T2 -- Valid E1 creates estimation-norms.md');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle4-'));
    fs.mkdirSync(path.join(tmpDir, 'workspace'), { recursive: true });
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('test-feature');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'discovery');
    var res = makeRes();
    await r.j.handlePostEstimate(makeReq({
      params: { journeyId: jobj.journeyId },
      body: { pass: 'E1', focusHours: 4, complexity: 2, scopeStability: 'Stable', notes: 'Initial estimate' }
    }), res);
    var normPath = path.join(tmpDir, 'workspace', 'estimation-norms.md');
    await test('T2a: response 200', function() { assert.strictEqual(res._code, 200); });
    await test('T2b: estimation-norms.md created', function() { assert.ok(fs.existsSync(normPath)); });
    await test('T2c: file has table header row', function() {
      var c = fs.readFileSync(normPath, 'utf8');
      assert.ok(c.includes('| date'), 'table header missing');
      assert.ok(c.includes('focusHours'), 'focusHours col missing');
    });
    await test('T2d: file contains data row values', function() {
      var c = fs.readFileSync(normPath, 'utf8');
      assert.ok(c.includes('test-feature'), 'feature slug missing');
      assert.ok(c.includes('E1'), 'pass missing');
      assert.ok(c.includes('4'), 'focusHours missing');
      assert.ok(c.includes('Stable'), 'scopeStability missing');
      assert.ok(c.includes('Initial estimate'), 'notes missing');
    });
    await test('T2e: date column has ISO date', function() {
      var c = fs.readFileSync(normPath, 'utf8');
      assert.ok(/\d{4}-\d{2}-\d{2}/.test(c), 'ISO date missing');
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T3: E2 appends to existing file, E1 row preserved
  console.log('\n[owle4-estimate-side-trip] T3 -- E2 appends, E1 preserved');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle4-'));
    fs.mkdirSync(path.join(tmpDir, 'workspace'), { recursive: true });
    var existingContent = '| date | feature | pass | focusHours | complexity | scopeStability | notes |\n'
      + '|------|---------|------|------------|------------|----------------|-------|\n'
      + '| 2026-01-01 | test-feature | E1 | 3 | 1 | Stable | prior |\n';
    fs.writeFileSync(path.join(tmpDir, 'workspace', 'estimation-norms.md'), existingContent, 'utf8');
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('test-feature');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'definition');
    await r.j.handlePostEstimate(makeReq({
      params: { journeyId: jobj.journeyId },
      body: { pass: 'E2', focusHours: 5, complexity: 2, scopeStability: 'Stable', notes: 'Refined' }
    }), makeRes());
    await test('T3a: E1 row still present', function() {
      var c = fs.readFileSync(path.join(tmpDir, 'workspace', 'estimation-norms.md'), 'utf8');
      assert.ok(c.includes('prior'), 'E1 row removed');
    });
    await test('T3b: E2 row appended', function() {
      var c = fs.readFileSync(path.join(tmpDir, 'workspace', 'estimation-norms.md'), 'utf8');
      assert.ok(c.includes('E2'), 'E2 row missing');
      assert.ok(c.includes('Refined'), 'E2 notes missing');
    });
    await test('T3c: header appears only once', function() {
      var c = fs.readFileSync(path.join(tmpDir, 'workspace', 'estimation-norms.md'), 'utf8');
      var headerCount = (c.match(/\| date \|/g) || []).length;
      assert.strictEqual(headerCount, 1, 'header duplicated');
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T4: Non-numeric focusHours returns 400, no write
  console.log('\n[owle4-estimate-side-trip] T4 -- Non-numeric focusHours returns 400');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle4-'));
    fs.mkdirSync(path.join(tmpDir, 'workspace'), { recursive: true });
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('test-feature');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'discovery');
    var res = makeRes();
    await r.j.handlePostEstimate(makeReq({
      params: { journeyId: jobj.journeyId },
      body: { pass: 'E1', focusHours: 'abc', complexity: 1, scopeStability: 'Stable', notes: '' }
    }), res);
    await test('T4a: returns 400', function() { assert.strictEqual(res._code, 400); });
    await test('T4b: identifies focusHours', function() {
      var p = JSON.parse(res._body);
      assert.ok(String(p.error || p.missing || p.invalid || '').toLowerCase().includes('focus') ||
                String(JSON.stringify(p)).toLowerCase().includes('focus'), 'focusHours not identified');
    });
    await test('T4c: no file written', function() {
      assert.ok(!fs.existsSync(path.join(tmpDir, 'workspace', 'estimation-norms.md')));
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T5: Negative focusHours returns 400
  console.log('\n[owle4-estimate-side-trip] T5 -- Negative focusHours returns 400');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle4-'));
    fs.mkdirSync(path.join(tmpDir, 'workspace'), { recursive: true });
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('test-feature');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'discovery');
    var res = makeRes();
    await r.j.handlePostEstimate(makeReq({
      params: { journeyId: jobj.journeyId },
      body: { pass: 'E1', focusHours: -1, complexity: 1, scopeStability: 'Stable', notes: '' }
    }), res);
    await test('T5: negative focusHours returns 400', function() { assert.strictEqual(res._code, 400); });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T6: Feature slug is read server-side
  console.log('\n[owle4-estimate-side-trip] T6 -- featureSlug read server-side');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle4-'));
    fs.mkdirSync(path.join(tmpDir, 'workspace'), { recursive: true });
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('correct-feature');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'discovery');
    await r.j.handlePostEstimate(makeReq({
      params: { journeyId: jobj.journeyId },
      body: { pass: 'E1', focusHours: 2, complexity: 1, scopeStability: 'Stable', notes: '', featureSlug: 'injected-feature' }
    }), makeRes());
    await test('T6: written row contains correct-feature, not injected-feature', function() {
      var c = fs.readFileSync(path.join(tmpDir, 'workspace', 'estimation-norms.md'), 'utf8');
      assert.ok(c.includes('correct-feature'), 'correct-feature missing');
      assert.ok(!c.includes('injected-feature'), 'injected-feature appeared in file');
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T7: Valid POST returns { success: true, row: "..." }
  console.log('\n[owle4-estimate-side-trip] T7 -- Response includes success and row');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle4-'));
    fs.mkdirSync(path.join(tmpDir, 'workspace'), { recursive: true });
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('test-feature');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'discovery');
    var res = makeRes();
    await r.j.handlePostEstimate(makeReq({
      params: { journeyId: jobj.journeyId },
      body: { pass: 'E1', focusHours: 3, complexity: 1, scopeStability: 'Stable', notes: 'ok' }
    }), res);
    await test('T7a: response 200', function() { assert.strictEqual(res._code, 200); });
    await test('T7b: response has success:true', function() {
      var p = JSON.parse(res._body);
      assert.strictEqual(p.success, true);
    });
    await test('T7c: response has row string', function() {
      var p = JSON.parse(res._body);
      assert.ok(typeof p.row === 'string' && p.row.length > 0, 'row missing');
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- Results
  console.log('\n[owle4-estimate-side-trip] ' + (passed + failed) + ' run, ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    failures.forEach(function(f) { console.log('  FAILURE:', f.name, '--', f.err && f.err.message || f.err); });
  }
  if (failed > 0) process.exit(1);
}

main().catch(function(err) { console.error(err); process.exit(1); });
