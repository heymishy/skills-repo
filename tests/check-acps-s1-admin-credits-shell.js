'use strict';

// check-acps-s1-admin-credits-shell.js — acps-s1
// Story: artefacts/2026-07-24-admin-credits-page-styling/stories/acps-s1.md
// Test plan: artefacts/2026-07-24-admin-credits-page-styling/test-plans/acps-s1-test-plan.md
//
// Covers AC1 (renderShell wrapping present), AC2 (tenant table data/form fields
// unchanged), AC4 (navigation path back to dashboard exists). AC3 (existing
// CSRF/audit flow unaffected) is covered by the existing, unmodified
// tests/check-sec-perf-s3-admin-credits-csrf.js and tests/check-arl-s5-credit-audit-log.js
// suites, run separately (see run-all-tests.js).

var assert = require('assert');
var path = require('path');

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

var CREDITS_PATH = path.resolve(__dirname, '../src/web-ui/modules/credits.js');
var ADMIN_CREDITS_PATH = path.resolve(__dirname, '../src/web-ui/routes/admin-credits.js');

function freshRequireCredits() {
  delete require.cache[require.resolve(CREDITS_PATH)];
  return require(CREDITS_PATH);
}

function freshRequireAdminCredits(creditsMod) {
  if (creditsMod) {
    delete require.cache[require.resolve(CREDITS_PATH)];
    require.cache[require.resolve(CREDITS_PATH)] = {
      id: require.resolve(CREDITS_PATH),
      filename: require.resolve(CREDITS_PATH),
      loaded: true,
      exports: creditsMod
    };
  }
  delete require.cache[require.resolve(ADMIN_CREDITS_PATH)];
  return require(ADMIN_CREDITS_PATH);
}

function makeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body += (b || ''); };
  return r;
}

function makeTwoRowMockDb() {
  return {
    query: async function(sql) {
      if (sql.includes('SELECT tenant_id, balance')) {
        return { rows: [
          { tenant_id: 'tenant-a', balance: 10 },
          { tenant_id: 'tenant-b', balance: 99 }
        ] };
      }
      if (sql.includes('SELECT tenant_id FROM')) return { rows: [{ tenant_id: 'tenant-a' }, { tenant_id: 'tenant-b' }] };
      return { rows: [] };
    }
  };
}

async function main() {
  var queue = [];

  // AC1: page wrapped in renderShell -- shared nav/tokens present, old bare
  // <!DOCTYPE html>/<h1>-only markup absent.
  queue.push(function() {
    console.log('\n[acps-s1] AC1 -- adminCreditsGet wraps output in renderShell');
    return test('adminCreditsGetWrapsInRenderShell', async function() {
      var credits = freshRequireCredits();
      credits.setCreditsAdapter(makeTwoRowMockDb());
      var handler = freshRequireAdminCredits(credits);

      var req = { session: { userId: 1, role: 'admin', login: 'alice' } };
      var res = makeRes();
      await handler.adminCreditsGet(req, res);

      assert.strictEqual(res._status, 200, 'Expected 200, got ' + res._status);
      // renderShell's known structure must be present.
      assert.ok(res._body.includes('class="sw-app"'), 'Response must contain the shared shell wrapper (.sw-app)');
      assert.ok(res._body.includes('class="sw-sidebar"'), 'Response must contain the shared sidebar nav (.sw-sidebar)');
      assert.ok(res._body.includes('sw-theme-toggle'), 'Response must contain the shared shell theme toggle');
      // Old bare markup pattern must be gone: a standalone <h1> with no shell
      // wrapper, i.e. <body> immediately followed by a raw <h1> with no sw-app div.
      assert.ok(!/<body>\s*<h1>/.test(res._body), 'Old bare <body><h1> markup must not be present');
      assert.ok(!res._body.includes('<h1>Admin: Credits</h1>'), 'Old unstyled <h1>Admin: Credits</h1> must not be present');
    });
  });

  // AC2: tenant table data/form fields unchanged.
  queue.push(function() {
    console.log('\n[acps-s1] AC2 -- adminCreditsGet preserves tenant table data and form fields');
    return test('adminCreditsGetPreservesTableData', async function() {
      var credits = freshRequireCredits();
      credits.setCreditsAdapter(makeTwoRowMockDb());
      var handler = freshRequireAdminCredits(credits);

      var req = { session: { userId: 1, role: 'admin', login: 'alice' } };
      var res = makeRes();
      await handler.adminCreditsGet(req, res);

      // Both tenant rows present with correct balances.
      assert.ok(res._body.includes('tenant-a'), 'Response must contain tenant-a');
      assert.ok(res._body.includes('value="tenant-a"'), 'Response must contain hidden input value for tenant-a');
      assert.ok(res._body.includes('tenant-b'), 'Response must contain tenant-b');
      assert.ok(res._body.includes('value="tenant-b"'), 'Response must contain hidden input value for tenant-b');
      assert.ok(res._body.includes('>10<'), 'Response must contain balance 10 for tenant-a');
      assert.ok(res._body.includes('>99<'), 'Response must contain balance 99 for tenant-b');

      // Each row's adjust form: CSRF field, hidden tenantId, amount input, submit button.
      var formCount = (res._body.match(/action="\/api\/admin\/credits\/adjust"/g) || []).length;
      assert.strictEqual(formCount, 2, 'Expected exactly 2 adjust forms (one per tenant row), found ' + formCount);
      assert.ok(res._body.includes('name="_csrf"'), 'Each adjust form must embed a CSRF field');
      assert.ok(res._body.includes('name="tenantId"'), 'Each adjust form must have a hidden tenantId field');
      assert.ok(res._body.includes('name="amount"'), 'Each adjust form must have an amount input field');
      assert.ok(res._body.includes('type="hidden"'), 'tenantId must remain a hidden input');
      assert.ok(res._body.includes('type="submit"'), 'Each adjust form must have a submit button');
    });
  });

  // AC4: a navigation path back to the dashboard exists (via the shared
  // shell's own nav, not a page-specific back-link).
  queue.push(function() {
    console.log('\n[acps-s1] AC4 -- adminCreditsGet response has a navigation path back to the dashboard');
    return test('adminCreditsGetHasNavigationBack', async function() {
      var credits = freshRequireCredits();
      credits.setCreditsAdapter(makeTwoRowMockDb());
      var handler = freshRequireAdminCredits(credits);

      var req = { session: { userId: 1, role: 'admin', login: 'alice' } };
      var res = makeRes();
      await handler.adminCreditsGet(req, res);

      assert.ok(res._body.includes('href="/dashboard"'), 'Response must contain a nav link back to /dashboard');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[acps-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[acps-s1] Unexpected error:', err);
  process.exit(1);
});
