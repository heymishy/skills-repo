'use strict';
var assert = require('assert');
var { Writable } = require('stream');

// ── helpers ──────────────────────────────────────────────────────────────────

function makeCapture() {
  var lines = [];
  var stream = new Writable({
    write: function(chunk, _enc, cb) {
      String(chunk).split('\n').forEach(function(l) { if (l.trim()) lines.push(l); });
      cb();
    }
  });
  return { stream: stream, lines: lines };
}

// ── T5: pino output is valid JSON with level, time, msg ──────────────────────
(function T5() {
  var cap = makeCapture();
  var logger;
  try {
    logger = require('../src/web-ui/logger').createLogger({ destination: cap.stream });
  } catch (e) {
    assert.fail('T5 FAIL — logger module not found: ' + e.message);
  }
  logger.info('test message');
  // Give pino a tick to flush
  setImmediate(function() {
    assert.ok(cap.lines.length > 0, 'T5 FAIL — no log lines emitted');
    var parsed;
    try { parsed = JSON.parse(cap.lines[0]); } catch (e) {
      assert.fail('T5 FAIL — log line is not valid JSON: ' + cap.lines[0]);
    }
    assert.ok(parsed.level !== undefined, 'T5 FAIL — missing level field');
    assert.ok(typeof parsed.time === 'number', 'T5 FAIL — missing or non-numeric time field');
    assert.ok(typeof parsed.msg === 'string', 'T5 FAIL — missing or non-string msg field');
    console.log('T5 PASS — pino emits valid JSON with level/time/msg');
    runT6();
  });
})();

// ── T6: correlationId field present when provided ─────────────────────────────
function runT6() {
  var cap = makeCapture();
  var logger = require('../src/web-ui/logger').createLogger({ destination: cap.stream });
  var child = logger.child({ correlationId: 'test-corr-001' });
  child.info('correlation test');
  setImmediate(function() {
    assert.ok(cap.lines.length > 0, 'T6 FAIL — no log lines emitted');
    var parsed = JSON.parse(cap.lines[0]);
    assert.strictEqual(parsed.correlationId, 'test-corr-001', 'T6 FAIL — correlationId field absent or wrong');
    console.log('T6 PASS — correlationId propagated via child logger');
    console.log('\n--- Task 1 tests complete ---');
  });
}
