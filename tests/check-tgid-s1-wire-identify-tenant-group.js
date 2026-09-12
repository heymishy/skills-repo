'use strict';
// check-tgid-s1-wire-identify-tenant-group.js — AC verification for tgid-s1
// (identifyTenantGroup() wired into bootstrapFlags(), the real bri-s1.3 session-bootstrap
// entry point — once per session, skipped when no tenantId, bounded by the same timeout
// budget as flag resolution)

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

var flagBootstrapPath = require.resolve('../src/web-ui/modules/flag-bootstrap');

function freshFlagBootstrap() {
  delete require.cache[flagBootstrapPath];
  return require('../src/web-ui/modules/flag-bootstrap');
}

async function main() {
  var flagBootstrap = freshFlagBootstrap();
  var queue = [];

  // ── AC1 — first bootstrap with a real tenantId calls identifyTenantGroup once ──

  queue.push(function() {
    console.log('\n[tgid-s1] U1 -- bootstrapFlags calls identifyTenantGroup exactly once for a fresh session with a tenantId (AC1)');
    return test('U1: identifyTenantGroup called once with the session tenantId', async function() {
      var req = { session: { tenantId: 'acme' } };
      var calls = [];
      var deps = {
        isEnabled: function() { return Promise.resolve(true); },
        identifyTenantGroup: function(tenantId) { calls.push(tenantId); return Promise.resolve(); }
      };
      await flagBootstrap.bootstrapFlags(req, deps);
      assert.deepStrictEqual(calls, ['acme']);
    });
  });

  // ── AC2 — a second bootstrap call within the same session does not re-call it ──

  queue.push(function() {
    console.log('\n[tgid-s1] U2 -- a second bootstrapFlags call in the same session does not re-invoke identifyTenantGroup (AC2)');
    return test('U2: second bootstrapFlags call within the same session skips identifyTenantGroup', async function() {
      var req = { session: { tenantId: 'acme' } };
      var calls = 0;
      var deps = {
        isEnabled: function() { return Promise.resolve(true); },
        identifyTenantGroup: function() { calls++; return Promise.resolve(); }
      };
      await flagBootstrap.bootstrapFlags(req, deps);
      assert.strictEqual(calls, 1);
      await flagBootstrap.bootstrapFlags(req, deps);
      assert.strictEqual(calls, 1, 'second bootstrap call within the same session must not re-invoke identifyTenantGroup');
    });
  });

  // ── AC3 — no tenantId means identifyTenantGroup is never called ────────────

  queue.push(function() {
    console.log('\n[tgid-s1] U3 -- bootstrapFlags never calls identifyTenantGroup when req.session.tenantId is falsy (AC3)');
    return test('U3: no tenantId on session -> identifyTenantGroup not called', async function() {
      var req = { session: {} };
      var calls = 0;
      var deps = {
        isEnabled: function() { return Promise.resolve(true); },
        identifyTenantGroup: function() { calls++; return Promise.resolve(); }
      };
      await flagBootstrap.bootstrapFlags(req, deps);
      assert.strictEqual(calls, 0);
    });
  });

  // ── AC4 — a slow/hanging identifyTenantGroup does not block bootstrap beyond budget ──

  queue.push(function() {
    console.log('\n[tgid-s1] U4 -- a hanging identifyTenantGroup does not delay bootstrapFlags beyond the timeout budget, flags still resolve correctly (AC4)');
    return test('U4: hanging identifyTenantGroup bounded by timeout; flag resolution still completes', async function() {
      var req = { session: { tenantId: 'acme' } };
      var deps = {
        isEnabled: function() { return Promise.resolve(true); },
        identifyTenantGroup: function() { return new Promise(function() { /* never resolves */ }); },
        timeoutMs: 50
      };
      var start = Date.now();
      var flags = await flagBootstrap.bootstrapFlags(req, deps);
      var elapsed = Date.now() - start;
      assert.ok(elapsed < 250, 'bootstrapFlags must not hang on a stuck identifyTenantGroup; took ' + elapsed + 'ms');
      assert.strictEqual(flags['wizard-ui'], true, 'flag resolution must still complete correctly despite the stuck group-identify call');
    });
  });

  // ── AC1 — the tenantId passed through is exactly req.session.tenantId, unmodified ──

  queue.push(function() {
    console.log('\n[tgid-s1] U5 -- the tenantId passed to identifyTenantGroup matches req.session.tenantId exactly (AC1)');
    return test('U5: identifyTenantGroup receives the exact session tenantId, no transformation', async function() {
      var req = { session: { tenantId: 'tenant-with-dashes-123' } };
      var received = null;
      var deps = {
        isEnabled: function() { return Promise.resolve(true); },
        identifyTenantGroup: function(tenantId) { received = tenantId; return Promise.resolve(); }
      };
      await flagBootstrap.bootstrapFlags(req, deps);
      assert.strictEqual(received, 'tenant-with-dashes-123');
    });
  });

  // ── NFR — both a slow isEnabled and a slow identifyTenantGroup stay within budget ──

  queue.push(function() {
    console.log('\n[tgid-s1] N1 -- bootstrapFlags total time stays within budget when both isEnabled and identifyTenantGroup are slow (Performance NFR)');
    return test('N1: combined slow adapter calls still complete within the documented timeout budget', async function() {
      var req = { session: { tenantId: 'acme' } };
      var deps = {
        isEnabled: function() {
          return new Promise(function(resolve) { setTimeout(function() { resolve(true); }, 30); });
        },
        identifyTenantGroup: function() {
          return new Promise(function(resolve) { setTimeout(resolve, 30); });
        },
        timeoutMs: 100
      };
      var start = Date.now();
      await flagBootstrap.bootstrapFlags(req, deps);
      var elapsed = Date.now() - start;
      assert.ok(elapsed <= 300, 'bootstrapFlags total time must stay within budget; took ' + elapsed + 'ms');
    });
  });

  // ── Run queue sequentially ────────────────────────────────────────────────

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[tgid-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[tgid-s1] Unexpected error:', err);
  process.exit(1);
});
