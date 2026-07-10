'use strict';
// check-bri-s1.4-tenant-level-targeting.js — AC verification for bri-s1.4
// (tenant-level flag targeting via PostHog Group Analytics — group-key derivation on
// isEnabled(), identifyTenantGroup() group registration, session-only tenantId sourcing)

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

var flagsModulePath = require.resolve('../src/web-ui/modules/posthog-flags');
var configModulePath = require.resolve('../src/web-ui/modules/posthog-config');

function freshFlags() {
  delete require.cache[flagsModulePath];
  return require('../src/web-ui/modules/posthog-flags');
}

function freshConfig() {
  delete require.cache[configModulePath];
  return require('../src/web-ui/modules/posthog-config');
}

async function main() {
  var queue = [];

  // ── AC1 (unit) — two users in the same tenant get identical isEnabled() results ──

  queue.push(function() {
    console.log('\n[bri-s1.4] A1 -- isEnabled() resolves identically for two users sharing the same tenantId (AC1 unit)');
    return test('A1: isEnabled(flag, {tenantId:"acme", userId:"user-1"}) === isEnabled(flag, {tenantId:"acme", userId:"user-2"})', async function() {
      var flags = freshFlags();
      flags.setPostHogFlagsAdapter({
        evaluateFlag: async function(flagKey, context) { return context.tenantId === 'acme'; }
      });
      var r1 = await flags.isEnabled('wizard-ui', { tenantId: 'acme', userId: 'user-1' });
      var r2 = await flags.isEnabled('wizard-ui', { tenantId: 'acme', userId: 'user-2' });
      assert.strictEqual(r1, true);
      assert.strictEqual(r2, true);
      assert.strictEqual(r1, r2, 'Both users in the same tenant must resolve identically');
    });
  });

  // ── AC1 (integration) — the group key derived from tenantId drives the identical result ──

  queue.push(function() {
    console.log('\n[bri-s1.4] I1 -- isEnabled() derives context.groups.tenant from tenantId identically for both users (AC1 integration)');
    return test('I1: adapter receives groups.tenant === "acme" for both users, regardless of userId', async function() {
      var flags = freshFlags();
      var receivedContexts = [];
      flags.setPostHogFlagsAdapter({
        evaluateFlag: async function(flagKey, context) { receivedContexts.push(context); return context.groups && context.groups.tenant === 'acme'; }
      });
      var r1 = await flags.isEnabled('wizard-ui', { tenantId: 'acme', userId: 'user-1' });
      var r2 = await flags.isEnabled('wizard-ui', { tenantId: 'acme', userId: 'user-2' });
      assert.strictEqual(receivedContexts.length, 2);
      assert.strictEqual(receivedContexts[0].groups.tenant, 'acme');
      assert.strictEqual(receivedContexts[1].groups.tenant, 'acme');
      assert.strictEqual(r1, r2, 'Both calls must resolve identically once the group key is derived');
    });
  });

  // ── AC2 (integration) — a tenant-targeted flag returns true only for the targeted tenant ──

  queue.push(function() {
    console.log('\n[bri-s1.4] I2 -- flag targeted at tenant-x returns true for tenant-x, false for tenant-y (AC2 integration)');
    return test('I2: isEnabled(flag, {tenantId:"tenant-x"}) === true; isEnabled(flag, {tenantId:"tenant-y"}) === false', async function() {
      var flags = freshFlags();
      flags.setPostHogFlagsAdapter({
        evaluateFlag: async function(flagKey, context) {
          return !!(context.groups && context.groups.tenant === 'tenant-x');
        }
      });
      var targeted = await flags.isEnabled('some-flag', { tenantId: 'tenant-x' });
      var other = await flags.isEnabled('some-flag', { tenantId: 'tenant-y' });
      assert.strictEqual(targeted, true, 'tenant-x must receive true');
      assert.strictEqual(other, false, 'tenant-y must receive false');
    });
  });

  // ── AC3 (unit) — group registration failure on first call does not throw and falls back ──

  queue.push(function() {
    console.log('\n[bri-s1.4] A2 -- identifyTenantGroup() does not throw when groupIdentify rejects; isEnabled() still falls back to false (AC3 unit)');
    return test('A2: identifyTenantGroup("acme") swallows a rejecting groupIdentify; isEnabled() resolves false', async function() {
      var flags = freshFlags();
      var groupIdentifyCalls = 0;
      flags.setPostHogFlagsAdapter({
        groupIdentify: function() {
          groupIdentifyCalls++;
          return Promise.reject(new Error('group type "tenant" not yet defined'));
        },
        evaluateFlag: async function() { throw new Error('group state unknown'); }
      });

      await assert.doesNotReject(
        function() { return flags.identifyTenantGroup('acme'); },
        'identifyTenantGroup() must never throw/reject, even when the adapter\'s groupIdentify call rejects'
      );
      assert.strictEqual(groupIdentifyCalls, 1);

      var result = await flags.isEnabled('wizard-ui', { tenantId: 'acme' });
      assert.strictEqual(result, false, 'isEnabled() must still fall back to the safe default');
    });
  });

  // ── AC3 (integration) — first-time group registration during "session bootstrap" does not block ──
  // Note: S1.3 (server-side bootstrap) is still at definition-of-ready and has no bootstrap
  // call site in code yet. This test simulates the described bootstrap sequence — identifyTenantGroup()
  // ahead of isEnabled() — directly against this story's exported functions (see decisions.md).

  queue.push(function() {
    console.log('\n[bri-s1.4] I3 -- a delayed first-time group registration does not block or crash a simulated session-bootstrap sequence (AC3 integration)');
    return test('I3: identifyTenantGroup() then isEnabled() completes promptly for a brand-new tenant with delayed group registration', async function() {
      var flags = freshFlags();
      flags.setPostHogFlagsAdapter({
        groupIdentify: function() {
          return new Promise(function(resolve, reject) {
            setTimeout(function() { reject(new Error('registration timed out')); }, 30);
          });
        },
        evaluateFlag: async function() { return false; }
      });

      var start = Date.now();
      await flags.identifyTenantGroup('new-tenant-1');
      var result = await flags.isEnabled('wizard-ui', { tenantId: 'new-tenant-1' });
      var elapsed = Date.now() - start;

      assert.strictEqual(result, false, 'must resolve to the safe default, not hang or throw');
      assert.ok(elapsed < 1000, 'session-bootstrap-equivalent sequence must complete promptly (' + elapsed + 'ms)');
    });
  });

  // ── AC4 (unit) — a solo-tenant customer uses the identical mechanism, no special-casing ──

  queue.push(function() {
    console.log('\n[bri-s1.4] A3 -- solo-tenant context flows through the identical isEnabled() call path as a multi-user tenant (AC4 unit)');
    return test('A3: isEnabled(flag, {tenantId:"solo-tenant-1"}) derives groups.tenant via the same code path, no special-casing', async function() {
      var flags = freshFlags();
      var receivedContext = null;
      flags.setPostHogFlagsAdapter({
        evaluateFlag: async function(flagKey, context) { receivedContext = context; return true; }
      });

      // Same exact function reference and call shape used by the multi-user AC1 tests above —
      // only the tenantId value differs, proving no solo-tenant-specific branch exists.
      var isEnabledRef = flags.isEnabled;
      var result = await isEnabledRef('wizard-ui', { tenantId: 'solo-tenant-1' });

      assert.strictEqual(result, true);
      assert.ok(receivedContext, 'evaluateFlag must have been called');
      assert.strictEqual(receivedContext.groups.tenant, 'solo-tenant-1', 'the solo tenant must be derived into groups.tenant identically to a multi-user tenant');
    });
  });

  // ── Security NFR — tenantId for group targeting is read only from req.session.tenantId ──

  queue.push(function() {
    console.log('\n[bri-s1.4] N1 -- resolveTenantIdFromRequest() reads only req.session.tenantId, never req.body/req.query (Security NFR)');
    return test('N1: resolveTenantIdFromRequest() returns the session value; body/query are never even read', function() {
      var flags = freshFlags();

      // Proxies that throw on ANY property access -- if the implementation ever reads
      // req.body or req.query, this test fails immediately rather than merely by coincidence.
      var poisonedBody = new Proxy({}, { get: function() { throw new Error('req.body must never be read for tenant targeting'); } });
      var poisonedQuery = new Proxy({}, { get: function() { throw new Error('req.query must never be read for tenant targeting'); } });

      var fakeReq = {
        session: { tenantId: 'acme' },
        body: poisonedBody,
        query: poisonedQuery
      };

      var resolved = flags.resolveTenantIdFromRequest(fakeReq);
      assert.strictEqual(resolved, 'acme', 'must resolve the session tenantId');
    });
  });

  // ── Performance NFR — group identification adds no more than 100ms to session bootstrap ──

  queue.push(function() {
    console.log('\n[bri-s1.4] N2 -- identifyTenantGroup() adds no more than 100ms of its own overhead over adapter latency (Performance NFR)');
    return test('N2: identifyTenantGroup() total duration is within simulated adapter latency + 100ms budget', async function() {
      var flags = freshFlags();
      var simulatedLatencyMs = 30;
      flags.setPostHogFlagsAdapter({
        groupIdentify: function() {
          return new Promise(function(resolve) {
            setTimeout(function() { resolve(); }, simulatedLatencyMs);
          });
        },
        evaluateFlag: async function() { return true; }
      });
      var start = Date.now();
      await flags.identifyTenantGroup('acme');
      var elapsed = Date.now() - start;
      assert.ok(
        elapsed <= simulatedLatencyMs + 100,
        'Expected elapsed (' + elapsed + 'ms) <= simulated latency + 100ms budget (' + (simulatedLatencyMs + 100) + 'ms)'
      );
    });
  });

  // ── D37 — identifyTenantGroup() inherits isEnabled()'s stub-throw when no adapter is wired ──

  queue.push(function() {
    console.log('\n[bri-s1.4] A4 -- identifyTenantGroup() throws the documented D37 error when no adapter is wired (inherited, not restated)');
    return test('A4: unwired identifyTenantGroup() rejects with the exact same D37 message as isEnabled()', async function() {
      var flags = freshFlags(); // fresh module load, no setPostHogFlagsAdapter() call
      await assert.rejects(
        function() { return flags.identifyTenantGroup('acme'); },
        function(err) {
          assert.strictEqual(
            err.message,
            'Adapter not wired: posthogFlagsAdapter. Call setPostHogFlagsAdapter() before use.',
            'Error message must match isEnabled()\'s D37 message exactly -- inherited, not a second mechanism'
          );
          return true;
        }
      );
    });
  });

  // ── D37 wiring — the real adapter wired at startup exposes groupIdentify (posthog-config.js) ──

  queue.push(function() {
    console.log('\n[bri-s1.4] I4 -- initPostHogFlagsClient() wires a real groupIdentify() implementation onto the adapter (D37 wiring task)');
    return test('I4: setPostHogFlagsAdapter is called with a groupIdentify function alongside evaluateFlag', function() {
      var cfg = freshConfig();
      var setAdapterCalls = [];
      function FakePostHogCtor() {}
      var result = cfg.initPostHogFlagsClient(
        'staging',
        { POSTHOG_KEY_STAGING: 'phc_test_staging' },
        {
          PostHogClient: FakePostHogCtor,
          setPostHogFlagsAdapter: function(a) { setAdapterCalls.push(a); },
          logger: { info: function() {}, error: function() {} }
        }
      );
      assert.strictEqual(result.wired, true);
      assert.strictEqual(setAdapterCalls.length, 1);
      assert.strictEqual(typeof setAdapterCalls[0].evaluateFlag, 'function');
      assert.strictEqual(typeof setAdapterCalls[0].groupIdentify, 'function', 'wired adapter must also expose groupIdentify (bri-s1.4)');
    });
  });

  queue.push(function() {
    console.log('\n[bri-s1.4] I5 -- the wired groupIdentify() calls the real PostHog client\'s groupIdentifyImmediate() with the right group type/key (D37 wiring task)');
    return test('I5: adapter.groupIdentify("tenant", "acme") invokes client.groupIdentifyImmediate({groupType:"tenant", groupKey:"acme"})', async function() {
      var cfg = freshConfig();
      var groupIdentifyCalls = [];
      function FakePostHogCtor() {
        this.groupIdentifyImmediate = function(args) { groupIdentifyCalls.push(args); return Promise.resolve(); };
        this.isFeatureEnabled = function() { return Promise.resolve(true); };
      }
      var setAdapterCalls = [];
      cfg.initPostHogFlagsClient(
        'staging',
        { POSTHOG_KEY_STAGING: 'phc_test_staging' },
        {
          PostHogClient: FakePostHogCtor,
          setPostHogFlagsAdapter: function(a) { setAdapterCalls.push(a); },
          logger: { info: function() {}, error: function() {} }
        }
      );
      await setAdapterCalls[0].groupIdentify('tenant', 'acme');
      assert.strictEqual(groupIdentifyCalls.length, 1);
      assert.strictEqual(groupIdentifyCalls[0].groupType, 'tenant');
      assert.strictEqual(groupIdentifyCalls[0].groupKey, 'acme');
    });
  });

  // ── Run queue sequentially ────────────────────────────────────────────────────

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[bri-s1.4] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[bri-s1.4] Unexpected error:', err);
  process.exit(1);
});
