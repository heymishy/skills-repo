'use strict';
// check-posthog-flags-graceful-degradation.js — AC verification for
// isEnabledOrDefault(), a defense-in-depth wrapper around isEnabled() added
// after a missing POSTHOG_KEY_PROD production secret left the adapter unwired,
// causing every isEnabled()-gated route (handleGetSettings, handleGetOrgKanban)
// to 500 instead of degrading gracefully. isEnabled() itself keeps its D37
// stub-throws contract unchanged (tests/check-bri-s1.1-isenabled-helper.js A3
// still covers that) — this file only covers the new wrapper.

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

  queue.push(function() {
    console.log('\nAC1 -- isEnabledOrDefault() resolves false (not a rejection) when the adapter is entirely unwired');
    return test('AC1: unwired adapter -> isEnabledOrDefault resolves false', async function() {
      var flags = freshFlags(); // fresh module load, no setPostHogFlagsAdapter() call
      var result = await flags.isEnabledOrDefault('org-kanban-view', { tenantId: 'acme' });
      assert.strictEqual(result, false, 'Expected false, not a thrown/rejected error');
    });
  });

  queue.push(function() {
    console.log('\nAC2 -- isEnabled() itself is untouched: still throws the exact D37 message when unwired');
    return test('AC2: isEnabled() (not the wrapper) still rejects when unwired', async function() {
      var flags = freshFlags();
      await assert.rejects(
        function() { return flags.isEnabled('org-kanban-view', {}); },
        function(err) {
          assert.strictEqual(
            err.message,
            'Adapter not wired: posthogFlagsAdapter. Call setPostHogFlagsAdapter() before use.',
            'isEnabled() must keep throwing the exact D37 message — this wrapper must not weaken that contract'
          );
          return true;
        }
      );
    });
  });

  queue.push(function() {
    console.log('\nAC3 -- isEnabledOrDefault() returns the real adapter result when wired and healthy (true)');
    return test('AC3: wired adapter resolving true -> isEnabledOrDefault resolves true', async function() {
      var flags = freshFlags();
      flags.setPostHogFlagsAdapter({ evaluateFlag: async function() { return true; } });
      var result = await flags.isEnabledOrDefault('org-kanban-view', { tenantId: 'acme' });
      assert.strictEqual(result, true, 'Expected true when the wired adapter resolves true');
    });
  });

  queue.push(function() {
    console.log('\nAC4 -- isEnabledOrDefault() returns the real adapter result when wired and healthy (false)');
    return test('AC4: wired adapter resolving false -> isEnabledOrDefault resolves false', async function() {
      var flags = freshFlags();
      flags.setPostHogFlagsAdapter({ evaluateFlag: async function() { return false; } });
      var result = await flags.isEnabledOrDefault('org-kanban-view', { tenantId: 'acme' });
      assert.strictEqual(result, false, 'Expected false when the wired adapter resolves false');
    });
  });

  queue.push(function() {
    console.log('\nAC5 -- a genuinely wired adapter that itself throws (e.g. PostHog API failure) still degrades to false, not a rejection');
    return test('AC5: wired adapter throwing -> isEnabledOrDefault resolves false, does not reject', async function() {
      var flags = freshFlags();
      flags.setPostHogFlagsAdapter({ evaluateFlag: async function() { throw new Error('ECONNRESET'); } });
      var result = await flags.isEnabledOrDefault('org-kanban-view', { tenantId: 'acme' });
      assert.strictEqual(result, false, 'Expected false, not a thrown/rejected error');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('Unexpected error:', err);
  process.exit(1);
});
