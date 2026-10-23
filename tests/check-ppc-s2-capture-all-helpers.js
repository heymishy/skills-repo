'use strict';
var assert = require('assert');
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
var queue = [];

var ca = require('../src/utils/capture-all');

queue.push(function() {
  return test('buildCaptureAllList: returns only ACs with a stored target; untargeted ACs go to skipped with a named reason', function() {
    var feature = {
      acs: [{ acId: 'AC1' }, { acId: 'AC2' }, { acId: 'AC3' }, { acId: 'AC4' }],
      captureTargets: [
        { acId: 'AC1', url: 'http://x/1', selector: '#a' },
        { acId: 'AC2', url: 'http://x/2', selector: '#b' },
        { acId: 'AC3', url: 'http://x/3', selector: '#c' }
      ]
    };
    var result = ca.buildCaptureAllList(feature);
    assert.strictEqual(result.toCapture.length, 3);
    assert.deepStrictEqual(result.toCapture.map(function(t) { return t.acId; }), ['AC1', 'AC2', 'AC3']);
    assert.deepStrictEqual(result.toCapture[0].target, { url: 'http://x/1', selector: '#a' });
    assert.strictEqual(result.skipped.length, 1);
    assert.deepStrictEqual(result.skipped[0], { acId: 'AC4', reason: 'no capture target set' });
  });
});

queue.push(function() {
  return test('measureCaptureDuration: returns the exact elapsed milliseconds between two timestamps', function() {
    assert.strictEqual(ca.measureCaptureDuration(1000, 4500), 3500);
  });
});

queue.push(function() {
  return test('checkTimingThreshold: a 65000ms duration exceeds the threshold without failing the run', function() {
    assert.deepStrictEqual(ca.checkTimingThreshold(65000), { exceedsThreshold: true });
  });
});

queue.push(function() {
  return test('checkTimingThreshold: exactly 60000ms does NOT trigger the flag (strictly greater-than 60s)', function() {
    assert.deepStrictEqual(ca.checkTimingThreshold(60000), { exceedsThreshold: false });
  });
});

var lock = require('../src/web-ui/modules/capture-all-lock');

queue.push(function() {
  return test('capture-all-lock: a second acquire for the same journeyId is rejected while the first is held', function() {
    lock._clearForTesting();
    assert.strictEqual(lock.tryAcquireLock('journey-a'), true);
    assert.strictEqual(lock.tryAcquireLock('journey-a'), false, 'a second concurrent acquire for the same journey must be rejected');
    assert.strictEqual(lock.tryAcquireLock('journey-b'), true, 'a different journey must be unaffected');
    lock.releaseLock('journey-a');
    assert.strictEqual(lock.tryAcquireLock('journey-a'), true, 'after release, a new acquire must succeed');
  });
});

queue.push(function() {
  return test('capture-all-lock: setTotal/updateProgress/getLockState reflect current progress', function() {
    lock._clearForTesting();
    lock.tryAcquireLock('journey-c');
    lock.setTotal('journey-c', 8);
    lock.updateProgress('journey-c', 3);
    assert.deepStrictEqual(
      Object.assign({}, lock.getLockState('journey-c')),
      Object.assign({}, lock.getLockState('journey-c'), { current: 3, total: 8 })
    );
    assert.strictEqual(lock.getLockState('journey-c').current, 3);
    assert.strictEqual(lock.getLockState('journey-c').total, 8);
    assert.strictEqual(lock.getLockState('journey-missing'), null, 'an unlocked journey returns null, never throws');
  });
});

var pe = require('../src/web-ui/routes/playback-evidence');
var store = require('../src/web-ui/modules/journey-store');
pe.setJourneyStoreModule(store);

queue.push(function() {
  return test('NFR-Accessibility: progress status markup includes an aria-live="polite" region', function() {
    var html = pe._renderCaptureAllProgress({ current: 3, total: 8 });
    assert.ok(html.indexOf('aria-live="polite"') !== -1, 'must expose progress to assistive technology, not purely visual');
    assert.ok(html.indexOf('3') !== -1 && html.indexOf('8') !== -1, 'must show the actual current/total counts');
  });
});

function makeRes() {
  var res = {
    _status: null, _json: null, _body: null, _headers: {},
    json: function(body) { res._status = res._status || 200; res._json = body; },
    writeHead: function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); },
    end: function(body) { res._body = (res._body || '') + (body || ''); },
    setHeader: function(k, v) { res._headers[k] = v; }
  };
  res.status = function(code) { res._status = code; return res; };
  return res;
}
function makeReq(tenantId, productId, featureSlug, extra) {
  return Object.assign({
    session: { tenantId: tenantId, accessToken: 'test-token', login: 'user', csrfToken: 'test-csrf-token' },
    sessionId: 'sid-' + tenantId,
    params: { productId: productId, featureSlug: featureSlug },
    headers: { accept: 'text/html' }
  }, extra || {});
}
function setupDodCompleteJourneyForProgressTest(opts) {
  opts = opts || {};
  var slug = opts.featureSlug || ('ppc-s2-progress-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  var dodContent = ['## AC Coverage', '', '| AC | Satisfied? | Evidence |', '|----|------------|----------|', '| AC1 — First | Yes | screenshot |'].join('\n');
  var j = store.createJourney(slug);
  store.setJourneyFields(j.journeyId, { tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' });
  store.setPgAdapterForTesting({
    saveJourney: async function() {},
    getArtefactsForJourney: async function() {
      return [{ skill_name: 'definition-of-done', artefact_path: 'artefacts/' + slug + '/dod.md', content: dodContent }];
    }
  });
  store.completeStage(j.journeyId, 'definition-of-done', 'artefacts/' + slug + '/dod.md', null);
  return { journeyId: j.journeyId, featureSlug: slug, tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' };
}

queue.push(function() {
  return test('capture-all progress wiring: no lock held -> button renders, no progress markup', async function() {
    store._clearForTesting();
    lock._clearForTesting();
    var setup = setupDodCompleteJourneyForProgressTest({});
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, null);
    var html = res._body;
    assert.ok(html.indexOf('Capture all evidence') !== -1, 'button must render when no run is in progress');
    assert.ok(html.indexOf('aria-live="polite"') === -1, 'progress markup must NOT render when no run is in progress');
  });
});

queue.push(function() {
  return test('capture-all progress wiring: lock held -> progress markup renders, button absent', async function() {
    store._clearForTesting();
    lock._clearForTesting();
    var setup = setupDodCompleteJourneyForProgressTest({});
    lock.tryAcquireLock(setup.journeyId);
    lock.setTotal(setup.journeyId, 5);
    lock.updateProgress(setup.journeyId, 2);
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, null);
    var html = res._body;
    assert.ok(html.indexOf('aria-live="polite"') !== -1, 'progress markup must render when a run is in progress');
    assert.ok(html.indexOf('Capturing AC 2 of 5') !== -1, 'must show the real current/total counts from the lock state');
    assert.ok(html.indexOf('Capture all evidence') === -1, 'the trigger button must NOT render while a run is already in progress');
  });
});

(async function() {
  console.log('\ncheck-ppc-s2-capture-all-helpers.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
