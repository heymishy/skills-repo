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

queue.push(function() {
  return test('NFR-Accessibility: progress status markup includes an aria-live="polite" region', function() {
    var html = pe._renderCaptureAllProgress({ current: 3, total: 8 });
    assert.ok(html.indexOf('aria-live="polite"') !== -1, 'must expose progress to assistive technology, not purely visual');
    assert.ok(html.indexOf('3') !== -1 && html.indexOf('8') !== -1, 'must show the actual current/total counts');
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
