'use strict';
// check-bri-s1.1-isenabled-helper.js — AC verification for bri-s1.1
// (shared isEnabled() PostHog feature-flag helper used identically by every API route
// and every UI-rendering code path — D37 injectable adapter, stub-throws default)

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

var modulePath = require.resolve('../src/web-ui/modules/posthog-flags');

function freshFlags() {
  delete require.cache[modulePath];
  return require('../src/web-ui/modules/posthog-flags');
}

async function main() {
  var queue = [];

  // ── AC1 — isEnabled() returns the wired adapter's boolean result ────────────

  queue.push(function() {
    console.log('\n[bri-s1.1] A1 -- isEnabled() returns true when adapter resolves true');
    return test('A1: isEnabled(\'wizard-ui\', {tenantId:\'acme\'}) resolves true', async function() {
      var flags = freshFlags();
      flags.setPostHogFlagsAdapter({ evaluateFlag: async function() { return true; } });
      var result = await flags.isEnabled('wizard-ui', { tenantId: 'acme' });
      assert.strictEqual(result, true, 'Expected isEnabled() to resolve true');
    });
  });

  queue.push(function() {
    console.log('\n[bri-s1.1] A2 -- isEnabled() returns false when adapter resolves false (not hardcoded true)');
    return test('A2: isEnabled(\'wizard-ui\', {tenantId:\'acme\'}) resolves false', async function() {
      var flags = freshFlags();
      flags.setPostHogFlagsAdapter({ evaluateFlag: async function() { return false; } });
      var result = await flags.isEnabled('wizard-ui', { tenantId: 'acme' });
      assert.strictEqual(result, false, 'Expected isEnabled() to resolve false');
    });
  });

  // ── AC2 — D37 stub-throws when adapter not wired ────────────────────────────

  queue.push(function() {
    console.log('\n[bri-s1.1] A3 -- isEnabled() throws documented D37 error when adapter not wired');
    return test('A3: unwired isEnabled() rejects with exact D37 message', async function() {
      var flags = freshFlags(); // fresh module load, no setPostHogFlagsAdapter() call
      await assert.rejects(
        function() { return flags.isEnabled('wizard-ui', {}); },
        function(err) {
          assert.strictEqual(
            err.message,
            'Adapter not wired: posthogFlagsAdapter. Call setPostHogFlagsAdapter() before use.',
            'Error message must match exactly'
          );
          return true;
        }
      );
    });
  });

  // ── AC3 — same shared function reference used by both call sites ───────────

  queue.push(function() {
    console.log('\n[bri-s1.1] A4 -- route call site and UI-render call site share the same isEnabled reference and result');
    return test('A4: two require() call sites use identical function + identical result', async function() {
      var flags = freshFlags();
      flags.setPostHogFlagsAdapter({
        evaluateFlag: async function(flagKey) { return flagKey === 'wizard-ui'; }
      });

      // Simulate a route-handler module and a UI-render module both requiring the helper.
      delete require.cache[modulePath]; // ensure the require below re-resolves via cache, not a fresh instance
      var routeCallSite = require('../src/web-ui/modules/posthog-flags');
      var renderCallSite = require('../src/web-ui/modules/posthog-flags');

      assert.strictEqual(routeCallSite.isEnabled, renderCallSite.isEnabled, 'Both call sites must share the identical isEnabled function reference');

      // Re-wire the adapter via the singleton (module cache is shared, so this affects both).
      routeCallSite.setPostHogFlagsAdapter({
        evaluateFlag: async function(flagKey) { return flagKey === 'wizard-ui'; }
      });

      var routeResult = await routeCallSite.isEnabled('wizard-ui', { tenantId: 'acme' });
      var renderResult = await renderCallSite.isEnabled('wizard-ui', { tenantId: 'acme' });
      assert.strictEqual(routeResult, true, 'Route call site must resolve true');
      assert.strictEqual(renderResult, true, 'Render call site must resolve true');
      assert.strictEqual(routeResult, renderResult, 'Both call sites must resolve identically');
    });
  });

  // ── AC4 — PostHog API failure returns safe default (false), never throws ───

  queue.push(function() {
    console.log('\n[bri-s1.1] A5 -- isEnabled() resolves false (does not throw) when the adapter call fails');
    return test('A5: adapter throwing ECONNRESET-style error resolves to false, not a rejection', async function() {
      var flags = freshFlags();
      flags.setPostHogFlagsAdapter({
        evaluateFlag: async function() { throw new Error('ECONNRESET'); }
      });
      var result = await flags.isEnabled('wizard-ui', { tenantId: 'acme' });
      assert.strictEqual(result, false, 'Expected safe default false on adapter failure');
    });
  });

  // ── Security NFR — token-shaped context fields never forwarded to the adapter ──

  queue.push(function() {
    console.log('\n[bri-s1.1] N1 -- accessToken field is never forwarded to the adapter\'s evaluateFlag call');
    return test('N1: context passed to evaluateFlag omits accessToken', async function() {
      var flags = freshFlags();
      var receivedContext = null;
      flags.setPostHogFlagsAdapter({
        evaluateFlag: async function(flagKey, context) { receivedContext = context; return true; }
      });
      await flags.isEnabled('wizard-ui', { tenantId: 'acme', accessToken: 'secret-token-value' });
      assert.ok(receivedContext, 'evaluateFlag must have been called with a context');
      assert.ok(!('accessToken' in receivedContext), 'accessToken must not be forwarded to the adapter');
      assert.strictEqual(receivedContext.tenantId, 'acme', 'Non-token fields must still be forwarded');
    });
  });

  // ── NFR — performance: helper adds negligible overhead over adapter latency ──

  queue.push(function() {
    console.log('\n[bri-s1.1] N2 -- isEnabled() adds no more than 200ms of its own overhead over adapter latency');
    return test('N2: total isEnabled() duration is within adapter latency + 200ms budget', async function() {
      var flags = freshFlags();
      var simulatedLatencyMs = 50;
      flags.setPostHogFlagsAdapter({
        evaluateFlag: function() {
          return new Promise(function(resolve) {
            setTimeout(function() { resolve(true); }, simulatedLatencyMs);
          });
        }
      });
      var start = Date.now();
      await flags.isEnabled('wizard-ui', { tenantId: 'acme' });
      var elapsed = Date.now() - start;
      assert.ok(
        elapsed <= simulatedLatencyMs + 200,
        'Expected elapsed (' + elapsed + 'ms) <= simulated latency + 200ms budget (' + (simulatedLatencyMs + 200) + 'ms)'
      );
    });
  });

  // ── Run queue sequentially ────────────────────────────────────────────────────

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[bri-s1.1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[bri-s1.1] Unexpected error:', err);
  process.exit(1);
});
