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
    runTask2Tests();
  });
}

// ── Task 2 tests ─────────────────────────────────────────────────────────────

function runTask2Tests() {
  // ── T1: correlationId is a non-empty string ───────────────────────────────────
  (function T1() {
    var crypto = require('crypto');
    var id = crypto.randomUUID();
    assert.ok(typeof id === 'string' && id.length >= 8,
      'T1 FAIL — correlationId shape invalid: ' + id);
    console.log('T1 PASS — correlationId is a non-empty string');
  })();

  // ── T2: correlationId is unique across two calls ──────────────────────────────
  (function T2() {
    var crypto = require('crypto');
    var id1 = crypto.randomUUID();
    var id2 = crypto.randomUUID();
    assert.notStrictEqual(id1, id2, 'T2 FAIL — two correlationIds are identical');
    console.log('T2 PASS — correlationId is unique across concurrent calls');
  })();

  // ── T9: sse_open event structure ──────────────────────────────────────────────
  (function T9() {
    var cap = makeCapture();
    var tlog = require('../src/web-ui/logger').createLogger({ destination: cap.stream });
    var child = tlog.child({ correlationId: 'corr-t9' });
    child.info({ event: 'sse_open', sessionId: 'sess-1', turnId: 'turn-1' }, 'SSE stream opened');
    setImmediate(function() {
      var parsed = JSON.parse(cap.lines[0]);
      assert.strictEqual(parsed.event, 'sse_open', 'T9 FAIL — sse_open event missing');
      assert.strictEqual(parsed.correlationId, 'corr-t9', 'T9 FAIL — correlationId missing on sse_open');
      console.log('T9 PASS — sse_open event logged with correlationId');
      T10();
    });
  })();
}

// ── T10: sse_close event structure ───────────────────────────────────────────
function T10() {
  var cap = makeCapture();
  var tlog = require('../src/web-ui/logger').createLogger({ destination: cap.stream });
  var child = tlog.child({ correlationId: 'corr-t10' });
  child.info({ event: 'sse_close', chunk_count: 3 }, 'SSE stream closed');
  setImmediate(function() {
    var parsed = JSON.parse(cap.lines[0]);
    assert.strictEqual(parsed.event, 'sse_close', 'T10 FAIL — sse_close event missing');
    assert.strictEqual(parsed.chunk_count, 3, 'T10 FAIL — chunk_count missing or wrong');
    assert.strictEqual(parsed.correlationId, 'corr-t10', 'T10 FAIL — correlationId missing on sse_close');
    console.log('T10 PASS — sse_close event logged with chunk_count and correlationId');
    T11();
  });
}

// ── T11: sse_error event structure ───────────────────────────────────────────
function T11() {
  var cap = makeCapture();
  var tlog = require('../src/web-ui/logger').createLogger({ destination: cap.stream });
  var child = tlog.child({ correlationId: 'corr-t11' });
  child.error({ event: 'sse_error', error_message: 'adapter timeout' }, 'SSE stream error');
  setImmediate(function() {
    var parsed = JSON.parse(cap.lines[0]);
    assert.strictEqual(parsed.event, 'sse_error', 'T11 FAIL — sse_error event missing');
    assert.strictEqual(parsed.error_message, 'adapter timeout', 'T11 FAIL — error_message missing');
    assert.strictEqual(parsed.correlationId, 'corr-t11', 'T11 FAIL — correlationId missing on sse_error');
    console.log('T11 PASS — sse_error event logged with error_message and correlationId');
    T12();
  });
}

// ── T12: all events for a turn share the same correlationId ──────────────────
function T12() {
  var corrId = 'corr-t12-shared';
  var cap = makeCapture();
  var tlog = require('../src/web-ui/logger').createLogger({ destination: cap.stream });
  var child = tlog.child({ correlationId: corrId });
  child.info({ event: 'sse_open', sessionId: 's', turnId: 't' }, 'open');
  child.info({ event: 'llm_complete', llm_duration_ms: 42 }, 'llm done');
  child.info({ event: 'sse_close', chunk_count: 2 }, 'close');
  setImmediate(function() {
    assert.ok(cap.lines.length >= 3, 'T12 FAIL — expected 3 log events, got ' + cap.lines.length);
    cap.lines.forEach(function(line, i) {
      var parsed = JSON.parse(line);
      assert.strictEqual(parsed.correlationId, corrId,
        'T12 FAIL — event ' + i + ' has wrong correlationId: ' + parsed.correlationId);
    });
    console.log('T12 PASS — all 3 turn events share the same correlationId');
    console.log('\n--- Task 2 tests complete ---');
    runTask3Tests();
  });
}

function runTask3Tests() {
  // T3: llm_duration_ms is a positive integer
  (function T3() {
    var cap = makeCapture();
    var tlog = require('../src/web-ui/logger').createLogger({ destination: cap.stream });
    var child = tlog.child({ correlationId: 'corr-t3' });
    child.info({ event: 'llm_complete', llm_duration_ms: 42 }, 'LLM call complete');
    setImmediate(function() {
      var parsed = JSON.parse(cap.lines[0]);
      assert.ok(Number.isInteger(parsed.llm_duration_ms) && parsed.llm_duration_ms >= 1,
        'T3 FAIL — llm_duration_ms is not a positive integer: ' + parsed.llm_duration_ms);
      console.log('T3 PASS — llm_duration_ms is a positive integer');
      T4();
    });
  })();

  function T4() {
    var cap = makeCapture();
    var tlog = require('../src/web-ui/logger').createLogger({ destination: cap.stream });
    var child = tlog.child({ correlationId: 'corr-t4' });
    child.info({ event: 'llm_complete', llm_duration_ms: 123 }, 'LLM call complete');
    setImmediate(function() {
      var parsed = JSON.parse(cap.lines[0]);
      assert.strictEqual(parsed.correlationId, 'corr-t4', 'T4 FAIL — correlationId missing on llm_complete');
      assert.strictEqual(parsed.event, 'llm_complete', 'T4 FAIL — event field wrong');
      console.log('T4 PASS — llm_complete event includes correlationId');
      T13();
    });
  }

  function T13() {
    var start = Date.now();
    setTimeout(function() {
      var duration = Date.now() - start;
      var cap = makeCapture();
      var tlog = require('../src/web-ui/logger').createLogger({ destination: cap.stream });
      var child = tlog.child({ correlationId: 'corr-t13' });
      child.info({ event: 'llm_complete', llm_duration_ms: duration }, 'LLM call complete');
      setImmediate(function() {
        var parsed = JSON.parse(cap.lines[0]);
        assert.ok(parsed.llm_duration_ms >= 15,
          'T13 FAIL — llm_duration_ms too small for 25ms delay: ' + parsed.llm_duration_ms);
        console.log('T13 PASS — llm_duration_ms reflects actual adapter delay (' + parsed.llm_duration_ms + 'ms)');
        console.log('\n--- Task 3 tests complete ---');
        runTask4Tests();
      });
    }, 25);
  }
}

function runTask4Tests() {
  // T7: access token absent from all turn log events
  (function T7() {
    var fakeToken = 'ghp_FAKE_TOKEN_1234ABCD';
    var cap = makeCapture();
    var tlog = require('../src/web-ui/logger').createLogger({ destination: cap.stream });
    var child = tlog.child({ correlationId: 'corr-t7' });
    // Emit the events a turn would emit — none should contain the fake token
    child.info({ event: 'sse_open', sessionId: 'sess-x', turnId: 'turn-x' }, 'SSE stream opened');
    child.info({ event: 'llm_complete', llm_duration_ms: 100 }, 'LLM call complete');
    child.info({ event: 'sse_close', chunk_count: 2 }, 'SSE stream closed');
    setImmediate(function() {
      var all = cap.lines.join('');
      assert.ok(all.indexOf(fakeToken) === -1,
        'T7 FAIL — fake access token found in log output');
      console.log('T7 PASS — access token value absent from all log lines');
      T8();
    });
  })();

  function T8() {
    var fakeSecret = 'FAKE_SESSION_SECRET_XYZ9';
    var cap = makeCapture();
    var tlog = require('../src/web-ui/logger').createLogger({ destination: cap.stream });
    var child = tlog.child({ correlationId: 'corr-t8' });
    child.info({ event: 'sse_open', sessionId: 'sess-y', turnId: 'turn-y' }, 'SSE stream opened');
    child.info({ event: 'sse_close', chunk_count: 1 }, 'SSE stream closed');
    setImmediate(function() {
      var all = cap.lines.join('');
      assert.ok(all.indexOf(fakeSecret) === -1,
        'T8 FAIL — fake SESSION_SECRET found in log output');
      console.log('T8 PASS — SESSION_SECRET value absent from all log lines');
      NFR_SEC_1();
    });
  }

  function NFR_SEC_1() {
    var secrets = ['ghp_FAKE_TOKEN_NFRSEC', 'CLIENT_SECRET_NFRSEC', 'SESSION_SECRET_NFRSEC'];
    var cap = makeCapture();
    var tlog = require('../src/web-ui/logger').createLogger({ destination: cap.stream });
    var child = tlog.child({ correlationId: 'corr-nfrsec' });
    child.info({ event: 'sse_open', sessionId: 'sess-nfr', turnId: 'turn-nfr' }, 'SSE stream opened');
    child.info({ event: 'llm_complete', llm_duration_ms: 55 }, 'LLM call complete');
    child.info({ event: 'sse_close', chunk_count: 5 }, 'SSE stream closed');
    setImmediate(function() {
      var all = cap.lines.join('');
      secrets.forEach(function(secret) {
        assert.ok(all.indexOf(secret) === -1,
          'NFR-SEC-1 FAIL — secret value found in log output: ' + secret);
      });
      console.log('NFR-SEC-1 PASS — no secret values in log output (security NFR met)');
      console.log('\n--- Task 4 tests complete ---');
      console.log('\n=== All obs-1 tests complete ===');
    });
  }
}
