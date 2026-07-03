'use strict';

var assert = require('assert');
var passed = 0; var failed = 0; var failures = [];

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
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

var posthogPath = require.resolve('../src/web-ui/modules/posthog-server');
var httpsPath = require.resolve('https');

function installHttpsMock() {
  var captured = [];
  require.cache[httpsPath] = {
    id: httpsPath, filename: httpsPath, loaded: true,
    exports: {
      request: function(_opts, _cb) {
        var chunks = [];
        var fakeReq = {
          _errFn: null,
          on: function(ev, fn) { if (ev === 'error') fakeReq._errFn = fn; return fakeReq; },
          write: function(data) { chunks.push(typeof data === 'string' ? data : data.toString()); },
          end: function() { try { captured.push(JSON.parse(chunks.join(''))); } catch(e) { captured.push({ _raw: chunks.join('') }); } },
          triggerError: function(err) { if (fakeReq._errFn) fakeReq._errFn(err); }
        };
        return fakeReq;
      }
    }
  };
  return captured;
}

function freshPosthog() {
  delete require.cache[posthogPath];
  return require('../src/web-ui/modules/posthog-server');
}

async function main() {
  var queue = [];

  // ── Group A — identify() (AC1) ────────────────────────────────────────────────

  queue.push(function() {
    console.log('\n[pla-s1] A1 -- identify sends HTTP POST with correct envelope');
    return test('A1: identify() sends $identify event with api_key and distinct_id', function() {
      var captured = installHttpsMock();
      process.env.POSTHOG_KEY = 'test-key-pla-s1';
      var posthog = freshPosthog();
      posthog.identify('alice', { $set: { login: 'alice', tenantId: 'acme', role: 'admin' } });
      assert.strictEqual(captured.length, 1, 'Expected exactly 1 captured request');
      assert.strictEqual(captured[0].api_key, 'test-key-pla-s1', 'api_key must match POSTHOG_KEY');
      assert.strictEqual(captured[0].distinct_id, 'alice', 'distinct_id must be alice');
      assert.strictEqual(captured[0].event, '$identify', 'event must be $identify');
    });
  });

  queue.push(function() {
    console.log('\n[pla-s1] A2 -- identify body has correct $set payload');
    return test('A2: identify() $set payload deep-equals caller argument', function() {
      var captured = installHttpsMock();
      process.env.POSTHOG_KEY = 'test-key-pla-s1';
      var posthog = freshPosthog();
      posthog.identify('alice', { $set: { login: 'alice', tenantId: 'acme', role: 'admin' } });
      assert.strictEqual(captured.length, 1, 'Expected 1 captured request');
      assert.deepStrictEqual(
        captured[0].properties.$set,
        { login: 'alice', tenantId: 'acme', role: 'admin' },
        '$set payload must deep-equal the caller-supplied object'
      );
    });
  });

  // ── Group B — groupIdentify() (AC2) ──────────────────────────────────────────

  queue.push(function() {
    console.log('\n[pla-s1] B1 -- groupIdentify sends $groupidentify event');
    return test('B1: groupIdentify() sends $groupidentify event', function() {
      var captured = installHttpsMock();
      process.env.POSTHOG_KEY = 'test-key-pla-s1';
      var posthog = freshPosthog();
      posthog.groupIdentify('company', 'acme', { name: 'acme' });
      assert.strictEqual(captured.length, 1, 'Expected 1 captured request');
      assert.strictEqual(captured[0].event, '$groupidentify', 'event must be $groupidentify');
    });
  });

  queue.push(function() {
    console.log('\n[pla-s1] B2 -- groupIdentify body has correct group fields');
    return test('B2: groupIdentify() properties have $group_type, $group_key, $group_set', function() {
      var captured = installHttpsMock();
      process.env.POSTHOG_KEY = 'test-key-pla-s1';
      var posthog = freshPosthog();
      posthog.groupIdentify('company', 'acme', { name: 'acme' });
      assert.strictEqual(captured.length, 1, 'Expected 1 captured request');
      assert.strictEqual(captured[0].properties.$group_type, 'company', '$group_type must be company');
      assert.strictEqual(captured[0].properties.$group_key, 'acme', '$group_key must be acme');
      assert.deepStrictEqual(captured[0].properties.$group_set, { name: 'acme' }, '$group_set must deep-equal caller arg');
    });
  });

  // ── Group C — captureException() (AC3) ───────────────────────────────────────

  queue.push(function() {
    console.log('\n[pla-s1] C1 -- captureException sends $exception event');
    return test('C1: captureException() sends $exception event with correct distinct_id', function() {
      var captured = installHttpsMock();
      process.env.POSTHOG_KEY = 'test-key-pla-s1';
      var posthog = freshPosthog();
      var err = new Error('test error');
      posthog.captureException(err, 'alice', { skillName: 'discovery' });
      assert.strictEqual(captured.length, 1, 'Expected 1 captured request');
      assert.strictEqual(captured[0].event, '$exception', 'event must be $exception');
      assert.strictEqual(captured[0].distinct_id, 'alice', 'distinct_id must be alice');
    });
  });

  queue.push(function() {
    console.log('\n[pla-s1] C2 -- captureException body has correct exception shape');
    return test('C2: captureException() properties have $exception_type, $exception_message, $exception_stack_trace_raw', function() {
      var captured = installHttpsMock();
      process.env.POSTHOG_KEY = 'test-key-pla-s1';
      var posthog = freshPosthog();
      var err = new Error('test error');
      posthog.captureException(err, 'alice', { skillName: 'discovery' });
      assert.strictEqual(captured.length, 1, 'Expected 1 captured request');
      assert.strictEqual(captured[0].properties.$exception_type, 'Error', '$exception_type must be Error');
      assert.strictEqual(captured[0].properties.$exception_message, 'test error', '$exception_message must be test error');
      assert.strictEqual(typeof captured[0].properties.$exception_stack_trace_raw, 'string', '$exception_stack_trace_raw must be a string');
      assert.ok(
        captured[0].properties.$exception_stack_trace_raw.includes('Error'),
        '$exception_stack_trace_raw must include Error'
      );
    });
  });

  queue.push(function() {
    console.log('\n[pla-s1] C3 -- captureException merges additional properties');
    return test('C3: captureException() merges extra props into properties', function() {
      var captured = installHttpsMock();
      process.env.POSTHOG_KEY = 'test-key-pla-s1';
      var posthog = freshPosthog();
      var err = new Error('test error');
      posthog.captureException(err, 'alice', { skillName: 'discovery', sessionId: 'sess-1' });
      assert.strictEqual(captured.length, 1, 'Expected 1 captured request');
      assert.strictEqual(captured[0].properties.skillName, 'discovery', 'skillName must be merged into properties');
      assert.strictEqual(captured[0].properties.sessionId, 'sess-1', 'sessionId must be merged into properties');
    });
  });

  // ── Group D — capture() with groups (AC4) ────────────────────────────────────

  queue.push(function() {
    console.log('\n[pla-s1] D1 -- capture() with groups adds $groups to body');
    return test('D1: capture() with 4th groups param adds $groups to properties', function() {
      var captured = installHttpsMock();
      process.env.POSTHOG_KEY = 'test-key-pla-s1';
      var posthog = freshPosthog();
      var originalProps = { costUsd: 0.05 };
      posthog.capture('alice', 'stage_completed', originalProps, { company: 'acme' });
      assert.strictEqual(captured.length, 1, 'Expected 1 captured request');
      assert.deepStrictEqual(captured[0].properties.$groups, { company: 'acme' }, '$groups must deep-equal groups arg');
      // Also verify input arg was not mutated
      assert.ok(!('$groups' in originalProps), 'Original properties object must not be mutated');
    });
  });

  // ── Group E — capture() backward compat (AC5) ─────────────────────────────────

  queue.push(function() {
    console.log('\n[pla-s1] E1 -- capture() without groups does not add $groups');
    return test('E1: capture() with 3 args produces no $groups key (backward compat)', function() {
      var captured = installHttpsMock();
      process.env.POSTHOG_KEY = 'test-key-pla-s1';
      var posthog = freshPosthog();
      posthog.capture('alice', 'stage_completed', { costUsd: 0.05 });
      assert.strictEqual(captured.length, 1, 'Expected 1 captured request');
      assert.ok(!('$groups' in captured[0].properties), '$groups must NOT be present when groups arg is omitted');
    });
  });

  // ── Group F — PRIVACY_MODE constant (AC6) ────────────────────────────────────

  queue.push(function() {
    console.log('\n[pla-s1] F1 -- PRIVACY_MODE truthy when env=true');
    return test('F1: PRIVACY_MODE is truthy when POSTHOG_PRIVACY_MODE=true', function() {
      process.env.POSTHOG_PRIVACY_MODE = 'true';
      var posthog = freshPosthog();
      assert.ok(posthog.PRIVACY_MODE, 'PRIVACY_MODE must be truthy when env var is true');
      delete process.env.POSTHOG_PRIVACY_MODE;
    });
  });

  queue.push(function() {
    console.log('\n[pla-s1] F2 -- PRIVACY_MODE falsy when env unset');
    return test('F2: PRIVACY_MODE is falsy when POSTHOG_PRIVACY_MODE is absent', function() {
      delete process.env.POSTHOG_PRIVACY_MODE;
      var posthog = freshPosthog();
      assert.ok(!posthog.PRIVACY_MODE, 'PRIVACY_MODE must be falsy when env var is absent');
    });
  });

  // ── Group G — no-op when POSTHOG_KEY absent (AC7) ────────────────────────────

  queue.push(function() {
    console.log('\n[pla-s1] G1 -- identify no-ops when key absent');
    return test('G1: identify() makes 0 https calls when POSTHOG_KEY absent', function() {
      var captured = installHttpsMock();
      delete process.env.POSTHOG_KEY;
      var posthog = freshPosthog();
      posthog.identify('alice', { $set: { login: 'alice', tenantId: 'acme', role: 'admin' } });
      assert.strictEqual(captured.length, 0, 'Expected 0 captured requests when key absent');
    });
  });

  queue.push(function() {
    console.log('\n[pla-s1] G2 -- groupIdentify no-ops when key absent');
    return test('G2: groupIdentify() makes 0 https calls when POSTHOG_KEY absent', function() {
      var captured = installHttpsMock();
      delete process.env.POSTHOG_KEY;
      var posthog = freshPosthog();
      posthog.groupIdentify('company', 'acme', { name: 'acme' });
      assert.strictEqual(captured.length, 0, 'Expected 0 captured requests when key absent');
    });
  });

  queue.push(function() {
    console.log('\n[pla-s1] G3 -- captureException no-ops when key absent');
    return test('G3: captureException() makes 0 https calls when POSTHOG_KEY absent', function() {
      var captured = installHttpsMock();
      delete process.env.POSTHOG_KEY;
      var posthog = freshPosthog();
      posthog.captureException(new Error('err'), 'alice', {});
      assert.strictEqual(captured.length, 0, 'Expected 0 captured requests when key absent');
    });
  });

  queue.push(function() {
    console.log('\n[pla-s1] G4 -- capture() no-ops when key absent (existing behavior)');
    return test('G4: capture() makes 0 https calls when POSTHOG_KEY absent (existing behavior preserved)', function() {
      var captured = installHttpsMock();
      delete process.env.POSTHOG_KEY;
      var posthog = freshPosthog();
      posthog.capture('alice', 'stage_completed', {});
      assert.strictEqual(captured.length, 0, 'Expected 0 captured requests when key absent');
    });
  });

  // ── NFR Tests ─────────────────────────────────────────────────────────────────

  queue.push(function() {
    console.log('\n[pla-s1] N1 -- https error does not propagate to caller');
    return test('N1: fire-and-forget: https error event does not throw to caller', function() {
      var lastReq = null;
      require.cache[httpsPath] = {
        id: httpsPath, filename: httpsPath, loaded: true,
        exports: {
          request: function(_opts, _cb) {
            var chunks = [];
            var fakeReq = {
              _errFn: null,
              on: function(ev, fn) { if (ev === 'error') fakeReq._errFn = fn; return fakeReq; },
              write: function(data) { chunks.push(typeof data === 'string' ? data : data.toString()); },
              end: function() {
                // Immediately fire the error event after end
                if (fakeReq._errFn) fakeReq._errFn(new Error('connection refused'));
              }
            };
            lastReq = fakeReq;
            return fakeReq;
          }
        }
      };
      process.env.POSTHOG_KEY = 'test-key-pla-s1';
      var posthog = freshPosthog();
      // Must not throw
      var threw = false;
      try {
        posthog.capture('alice', 'test_event', {});
      } catch (e) {
        threw = true;
      }
      assert.ok(!threw, 'capture() must not throw when https fires an error event');
    });
  });

  queue.push(function() {
    console.log('\n[pla-s1] N2 -- POSTHOG_KEY value does not appear in log output');
    return test('N2: POSTHOG_KEY value is not logged to console on https error', function() {
      var logOutput = [];
      var origLog = console.log;
      var origWarn = console.warn;
      var origError = console.error;
      console.log = function() { logOutput.push(Array.prototype.join.call(arguments, ' ')); };
      console.warn = function() { logOutput.push(Array.prototype.join.call(arguments, ' ')); };
      console.error = function() { logOutput.push(Array.prototype.join.call(arguments, ' ')); };

      try {
        require.cache[httpsPath] = {
          id: httpsPath, filename: httpsPath, loaded: true,
          exports: {
            request: function(_opts, _cb) {
              var chunks = [];
              var fakeReq = {
                _errFn: null,
                on: function(ev, fn) { if (ev === 'error') fakeReq._errFn = fn; return fakeReq; },
                write: function(data) { chunks.push(typeof data === 'string' ? data : data.toString()); },
                end: function() { if (fakeReq._errFn) fakeReq._errFn(new Error('connection refused')); }
              };
              return fakeReq;
            }
          }
        };
        process.env.POSTHOG_KEY = 'super-secret-key';
        var posthog = freshPosthog();
        posthog.capture('alice', 'test_event', {});
      } finally {
        console.log = origLog;
        console.warn = origWarn;
        console.error = origError;
        delete process.env.POSTHOG_KEY;
      }

      var combined = logOutput.join('\n');
      assert.ok(
        !combined.includes('super-secret-key'),
        'POSTHOG_KEY value must not appear in any log output'
      );
    });
  });

  // ── Run queue sequentially ────────────────────────────────────────────────────

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  // Restore POSTHOG_KEY env to a clean state
  delete process.env.POSTHOG_KEY;
  delete process.env.POSTHOG_PRIVACY_MODE;

  console.log('\n[pla-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[pla-s1] Unexpected error:', err);
  process.exit(1);
});
