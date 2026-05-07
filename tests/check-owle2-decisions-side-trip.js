'use strict';
// check-owle2-decisions-side-trip.js -- owle.2: Decisions side-trip
// TDD: all tests FAIL before implementation, PASS after.

var assert = require('assert');
var crypto = require('crypto');
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

  // -- T1: logDecisionAvailable at all stages
  console.log('\n[owle2-decisions-side-trip] T1 -- logDecisionAvailable at all stages');
  {
    var r = freshRequire();
    await test('T1a: logDecisionAvailable=true at discovery stage', function() {
      var jobj = r.jStore.createJourney('feat');
      r.jStore.setActiveSession(jobj.journeyId, 'sess-1', 'discovery');
      var res = makeRes();
      r.j.handleGetStageControls(makeReq({ params: { journeyId: jobj.journeyId } }), res);
      assert.strictEqual(res._code, 200);
      assert.strictEqual(JSON.parse(res._body).logDecisionAvailable, true);
    });

    await test('T1b: logDecisionAvailable=true at test-plan stage', function() {
      var jobj = r.jStore.createJourney('feat');
      r.jStore.setActiveSession(jobj.journeyId, 'sess-2', 'test-plan');
      var res = makeRes();
      r.j.handleGetStageControls(makeReq({ params: { journeyId: jobj.journeyId } }), res);
      assert.strictEqual(res._code, 200);
      assert.strictEqual(JSON.parse(res._body).logDecisionAvailable, true);
    });
  }

  // -- T2: POST valid decision creates file
  console.log('\n[owle2-decisions-side-trip] T2 -- POST valid decision creates file');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle2-'));
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('test-feature-slug');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'definition');

    var res = makeRes();
    await r.j.handlePostDecisions(makeReq({
      params: { journeyId: jobj.journeyId },
      body: { title: 'Use SSE', context: 'Need streaming', decision: 'Use SSE not polling', rationale: 'Lower latency' }
    }), res);

    var filePath = path.join(tmpDir, 'artefacts', 'test-feature-slug', 'decisions.md');

    await test('T2a: response 200', function() { assert.strictEqual(res._code, 200); });
    await test('T2b: decisions.md created', function() { assert.ok(fs.existsSync(filePath), 'decisions.md not created'); });
    await test('T2c: file contains header line', function() {
      var content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('test-feature-slug'), 'header missing feature slug');
    });
    await test('T2d: file contains all four field values', function() {
      var content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('Use SSE'), 'title missing');
      assert.ok(content.includes('Need streaming'), 'context missing');
      assert.ok(content.includes('Use SSE not polling'), 'decision missing');
      assert.ok(content.includes('Lower latency'), 'rationale missing');
    });
    await test('T2e: file contains ISO 8601 date', function() {
      var content = fs.readFileSync(filePath, 'utf8');
      assert.ok(/\d{4}-\d{2}-\d{2}/.test(content), 'ISO date missing');
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T3: Append preserves prior content
  console.log('\n[owle2-decisions-side-trip] T3 -- Append preserves prior content');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle2-'));
    var artefactDir = path.join(tmpDir, 'artefacts', 'test-feature-slug');
    fs.mkdirSync(artefactDir, { recursive: true });
    var priorMarker = 'PRIOR_ENTRY_MARKER_' + crypto.randomUUID();
    fs.writeFileSync(path.join(artefactDir, 'decisions.md'), '# Decisions\n\n' + priorMarker + '\n', 'utf8');
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('test-feature-slug');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'definition');

    await r.j.handlePostDecisions(makeReq({
      params: { journeyId: jobj.journeyId },
      body: { title: 'New decision', context: 'ctx', decision: 'dec', rationale: 'rat' }
    }), makeRes());

    await test('T3a: prior marker still present', function() {
      var content = fs.readFileSync(path.join(artefactDir, 'decisions.md'), 'utf8');
      assert.ok(content.includes(priorMarker), 'prior entry was removed');
    });
    await test('T3b: new entry appended', function() {
      var content = fs.readFileSync(path.join(artefactDir, 'decisions.md'), 'utf8');
      assert.ok(content.includes('New decision'), 'new entry missing');
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T4: RISK-ACCEPT flag
  console.log('\n[owle2-decisions-side-trip] T4 -- RISK-ACCEPT flag');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle2-'));
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('test-feature-slug');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'definition');

    var res = makeRes();
    await r.j.handlePostDecisions(makeReq({
      params: { journeyId: jobj.journeyId },
      body: { title: 'Risky call', context: 'ctx', decision: 'dec', rationale: 'rat', riskAccept: true }
    }), res);

    await test('T4: file entry contains RISK-ACCEPT', function() {
      var filePath = path.join(tmpDir, 'artefacts', 'test-feature-slug', 'decisions.md');
      var content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('RISK-ACCEPT'), 'RISK-ACCEPT marker missing');
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T5: Missing required field returns 400, no write
  console.log('\n[owle2-decisions-side-trip] T5 -- Missing required field returns 400');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle2-'));
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('test-feature-slug');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'definition');

    var res = makeRes();
    await r.j.handlePostDecisions(makeReq({
      params: { journeyId: jobj.journeyId },
      body: { title: 'No rationale', context: 'ctx', decision: 'dec' } // rationale missing
    }), res);

    await test('T5a: returns 400', function() { assert.strictEqual(res._code, 400); });
    await test('T5b: response identifies missing field', function() {
      var parsed = JSON.parse(res._body);
      assert.ok(parsed.missing, 'missing field not in response');
      assert.ok(String(parsed.missing).includes('rationale'), 'rationale not named');
    });
    await test('T5c: no file written', function() {
      var filePath = path.join(tmpDir, 'artefacts', 'test-feature-slug', 'decisions.md');
      assert.ok(!fs.existsSync(filePath), 'file should not exist');
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T6: Path traversal guard
  console.log('\n[owle2-decisions-side-trip] T6 -- Path traversal guard');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle2-'));
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('../../etc/passwd');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'discovery');

    var res = makeRes();
    await r.j.handlePostDecisions(makeReq({
      params: { journeyId: jobj.journeyId },
      body: { title: 'T', context: 'C', decision: 'D', rationale: 'R' }
    }), res);

    await test('T6: path traversal returns 400', function() { assert.strictEqual(res._code, 400); });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T7: Write error returns 500, no partial file
  console.log('\n[owle2-decisions-side-trip] T7 -- Write error returns error response');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle2-'));
    // Make the artefacts/test-feat dir a FILE to cause mkdirSync/writeFileSync to throw
    var artefactsDir = path.join(tmpDir, 'artefacts');
    var featureDir = path.join(artefactsDir, 'test-feat');
    fs.mkdirSync(artefactsDir, { recursive: true });
    // Create featureDir as a file to block directory creation
    fs.writeFileSync(featureDir, 'blocking', 'utf8');
    r.j.setRepoRoot(tmpDir);
    var jobj = r.jStore.createJourney('test-feat');
    r.jStore.setActiveSession(jobj.journeyId, 'sess', 'discovery');

    var res = makeRes();
    await r.j.handlePostDecisions(makeReq({
      params: { journeyId: jobj.journeyId },
      body: { title: 'T', context: 'C', decision: 'D', rationale: 'R' }
    }), res);

    await test('T7: write error returns non-200 error response', function() {
      assert.ok(res._code && res._code >= 400, 'expected error status, got: ' + res._code);
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- Results
  console.log('\n[owle2-decisions-side-trip] ' + (passed + failed) + ' run, ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    failures.forEach(function(f) { console.log('  FAILURE:', f.name, '--', f.err && f.err.message || f.err); });
  }
  if (failed > 0) process.exit(1);
}

main().catch(function(err) { console.error(err); process.exit(1); });
