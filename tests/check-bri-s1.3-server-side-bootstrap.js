'use strict';
// check-bri-s1.3-server-side-bootstrap.js — AC verification for bri-s1.3
// (server-side flag bootstrap at session start to avoid UI flicker — bootstrapFlags()
// session-level flag cache with bounded timeout + handleGetWizard gated render +
// handleGetWizardBootstrapped session-start wrapper)

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
var routesPath = require.resolve('../src/web-ui/routes/journey');

function freshFlagBootstrap() {
  delete require.cache[flagBootstrapPath];
  return require('../src/web-ui/modules/flag-bootstrap');
}

function freshRoutes() {
  delete require.cache[routesPath];
  return require('../src/web-ui/routes/journey');
}

function fakeRes() {
  var res = {
    statusCode: null,
    headers: null,
    body: '',
    writeHead: function(code, headers) { res.statusCode = code; res.headers = headers; },
    end: function(body) { res.body = body || ''; }
  };
  return res;
}

async function main() {
  var flagBootstrap = freshFlagBootstrap();
  var routes = freshRoutes();
  var queue = [];

  // ── AC1 — bootstrap resolves all relevant flags before returning ───────────

  queue.push(function() {
    console.log('\n[bri-s1.3] U1 -- bootstrapFlags(req) resolves wizard-ui onto req.session.flags before returning (AC1)');
    return test('U1: bootstrapFlags resolves flag onto session before returning', async function() {
      var req = { session: {} };
      var deps = { isEnabled: function() { return Promise.resolve(true); } };
      await flagBootstrap.bootstrapFlags(req, deps);
      assert.strictEqual(req.session.flags['wizard-ui'], true);
    });
  });

  // ── AC3 — slow/hanging adapter still resolves promptly with the safe default ─

  queue.push(function() {
    console.log('\n[bri-s1.3] U2 -- bootstrapFlags resolves within budget and defaults false when isEnabled hangs (AC3)');
    return test('U2: bootstrapFlags does not hang; defaults false on a never-resolving adapter', async function() {
      var req = { session: {} };
      var deps = {
        isEnabled: function() { return new Promise(function() { /* never resolves */ }); },
        timeoutMs: 50
      };
      var start = Date.now();
      await flagBootstrap.bootstrapFlags(req, deps);
      var elapsed = Date.now() - start;
      assert.ok(elapsed < 250, 'bootstrapFlags must not hang; took ' + elapsed + 'ms');
      assert.strictEqual(req.session.flags['wizard-ui'], false);
    });
  });

  // ── AC2 — a second call within the same session does not re-query isEnabled ──

  queue.push(function() {
    console.log('\n[bri-s1.3] U3 -- bootstrapFlags does not re-query isEnabled once session.flags is populated (AC2)');
    return test('U3: second bootstrapFlags call in same session does not re-invoke isEnabled', async function() {
      var req = { session: {} };
      var calls = 0;
      var deps = { isEnabled: function() { calls++; return Promise.resolve(true); } };
      await flagBootstrap.bootstrapFlags(req, deps);
      assert.strictEqual(calls, 1);
      await flagBootstrap.bootstrapFlags(req, deps);
      assert.strictEqual(calls, 1, 'second bootstrap call within the same session must not re-invoke isEnabled');
    });
  });

  // ── AC1, AC4 — handleGetWizard renders/omits the gated element from initial HTML ─

  queue.push(function() {
    console.log('\n[bri-s1.3] IT1 -- handleGetWizard renders the gated element when flag is true (AC1, AC4)');
    return test('IT1: handleGetWizard renders gated element when req.session.flags["wizard-ui"] is true', function() {
      var req = { session: { flags: { 'wizard-ui': true } } };
      var res = fakeRes();
      routes.handleGetWizard(req, res);
      assert.ok(res.body.indexOf('id="wizard-canvas-gated"') !== -1, 'gated element must be present in initial HTML');
    });
  });

  queue.push(function() {
    console.log('\n[bri-s1.3] IT2 -- handleGetWizard omits the gated element when flag is false (AC1, AC4)');
    return test('IT2: handleGetWizard omits gated element when req.session.flags["wizard-ui"] is false', function() {
      var req = { session: { flags: { 'wizard-ui': false } } };
      var res = fakeRes();
      routes.handleGetWizard(req, res);
      assert.ok(res.body.indexOf('id="wizard-canvas-gated"') === -1, 'gated element must be server-omitted, not present');
    });
  });

  queue.push(function() {
    console.log('\n[bri-s1.3] IT3 -- handleGetWizard defaults to gate-off when flags have not been bootstrapped yet (AC1, AC3)');
    return test('IT3: handleGetWizard omits gated element when session.flags is unset', function() {
      var req = { session: {} };
      var res = fakeRes();
      routes.handleGetWizard(req, res);
      assert.ok(res.body.indexOf('id="wizard-canvas-gated"') === -1, 'unbootstrapped session must default to gate off');
    });
  });

  // ── AC1 — handleGetWizardBootstrapped resolves + renders in a single initial response ─

  queue.push(function() {
    console.log('\n[bri-s1.3] IT4 -- handleGetWizardBootstrapped resolves the flag and renders it in the same initial response (AC1)');
    return test('IT4: handleGetWizardBootstrapped renders gated element with no preceding client-side fetch', async function() {
      var req = { session: {} };
      var res = fakeRes();
      await routes.handleGetWizardBootstrapped(req, res, { isEnabled: function() { return Promise.resolve(true); } });
      assert.ok(res.body.indexOf('id="wizard-canvas-gated"') !== -1);
      assert.ok(res.body.indexOf("fetch('/api/flags')") === -1, 'no client-side flag fetch may precede the gated markup');
    });
  });

  // ── AC2 — second render within the same session reuses the cached flag ─────

  queue.push(function() {
    console.log('\n[bri-s1.3] IT5 -- a second handleGetWizardBootstrapped call in the same session does not re-invoke isEnabled (AC2)');
    return test('IT5: repeat handleGetWizardBootstrapped call within same session does not re-query isEnabled', async function() {
      var req = { session: {} };
      var calls = 0;
      var deps = { isEnabled: function() { calls++; return Promise.resolve(true); } };
      await routes.handleGetWizardBootstrapped(req, fakeRes(), deps);
      await routes.handleGetWizardBootstrapped(req, fakeRes(), deps);
      assert.strictEqual(calls, 1, 'a PostHog toggle mid-session must not apply until the next session start');
    });
  });

  // ── AC3 — handleGetWizardBootstrapped does not block on a slow/hanging adapter ─

  queue.push(function() {
    console.log('\n[bri-s1.3] IT6 -- handleGetWizardBootstrapped does not block the response on a slow/hanging PostHog call (AC3)');
    return test('IT6: handleGetWizardBootstrapped responds promptly with the safe-default-gated HTML when isEnabled hangs', async function() {
      var req = { session: {} };
      var res = fakeRes();
      var deps = { isEnabled: function() { return new Promise(function() { /* never resolves */ }); }, timeoutMs: 50 };
      var start = Date.now();
      await routes.handleGetWizardBootstrapped(req, res, deps);
      var elapsed = Date.now() - start;
      assert.ok(elapsed < 250, 'handleGetWizardBootstrapped must not hang; took ' + elapsed + 'ms');
      assert.ok(res.body.indexOf('id="wizard-canvas-gated"') === -1, 'must fall back to the safe default (gate off)');
    });
  });

  // ── Performance NFR — bootstrap overhead stays within the 200ms budget ──────

  queue.push(function() {
    console.log('\n[bri-s1.3] N1 -- bootstrapFlags adds no more than 200ms over a 50ms simulated adapter latency (Performance NFR)');
    return test('N1: bootstrap total time stays within adapter latency + 200ms budget', async function() {
      var req = { session: {} };
      var deps = { isEnabled: function() {
        return new Promise(function(resolve) { setTimeout(function() { resolve(true); }, 50); });
      } };
      var start = Date.now();
      await flagBootstrap.bootstrapFlags(req, deps);
      var elapsed = Date.now() - start;
      assert.ok(elapsed <= 250, 'bootstrap total time must stay within adapter latency (50ms) + 200ms budget; took ' + elapsed + 'ms');
    });
  });

  // ── Run queue sequentially ────────────────────────────────────────────────

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[bri-s1.3] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[bri-s1.3] Unexpected error:', err);
  process.exit(1);
});
