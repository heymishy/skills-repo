#!/usr/bin/env node
// check-b2-account-nav.js — AC verification tests for b2 (Restructure account-level
// nav items and add a dangling-link regression test), story
// artefacts/2026-07-21-web-ui-experience-redesign/stories/b2-account-nav-restructure-and-dangling-link-test.md
//
// AC1: non-admin sidebar bottom section shows Settings + identity, no Admin credits
// AC2: admin sidebar bottom section additionally shows Admin credits, gated on the
//      SAME live role check requireAdmin already performs (not a stale cached role)
// AC3: every NAV_ITEMS href (including these new account-level entries) resolves to
//      a route registered in server.js
// AC4: the same resolution check fails against the pre-fix (b1) NAV_ITEMS shape
// NFR (Security): the nav item's visibility is UX only — requireAdmin's own gate on
//      the real route is the actual security boundary, unaffected by nav state.
//
// Follows this repo's hand-rolled test()/assert convention (see
// tests/check-b1-nav-fix.js, tests/check-sec-perf-s2-stale-role-revalidation.js) —
// no Jest/Mocha. No external dependencies — Node.js built-ins only.

'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var HTML_SHELL_PATH = path.resolve(__dirname, '../src/web-ui/utils/html-shell.js');
var REQUIRE_ADMIN_PATH = path.resolve(__dirname, '../src/web-ui/middleware/require-admin.js');
var SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');

var passed = 0;
var failed = 0;
var failures = [];

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

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function makeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body += (b || ''); };
  return r;
}

// Mirrors check-b1-nav-fix.js's pathRegisteredInServer helper exactly (kept local
// rather than extracted into a shared module, to avoid touching b1's already-merged,
// working test file for this story).
function pathRegisteredInServer(pathname, serverSrc) {
  return serverSrc.indexOf("pathname === '" + pathname + "'") !== -1 ||
         serverSrc.indexOf('pathname === "' + pathname + '"') !== -1;
}

async function main() {
  var queue = [];

  // ── AC1: non-admin sidebar bottom section ──────────────────────────────────
  queue.push(function() {
    console.log('\nAC1 — non-admin sidebar: Settings + identity, no Admin credits');
    return test('renderShell (isAdmin=false): contains Settings + identity block, no Admin credits', function() {
      var shell = freshRequire(HTML_SHELL_PATH);
      var html = shell.renderShell({
        title: 'Dashboard',
        bodyContent: '<h1>Dashboard</h1>',
        user: { login: 'alice' },
        active: 'dashboard',
        isAdmin: false
      });
      assert.ok(html.includes('Settings'), 'expected a Settings link');
      assert.ok(html.includes('/settings'), 'expected the Settings link href');
      assert.ok(html.includes('alice'), 'expected the identity block (login)');
      assert.ok(html.includes('/auth/logout'), 'expected the sign-out link');
      assert.ok(!html.includes('Admin credits'), 'non-admin must NOT see Admin credits');
    });
  });

  // ── AC2 (unit): admin sidebar bottom section ────────────────────────────────
  queue.push(function() {
    console.log('\nAC2 (unit) — admin sidebar: Settings + Admin credits + identity');
    return test('renderShell (isAdmin=true): contains Settings, Admin credits, and identity block', function() {
      var shell = freshRequire(HTML_SHELL_PATH);
      var html = shell.renderShell({
        title: 'Dashboard',
        bodyContent: '<h1>Dashboard</h1>',
        user: { login: 'bob' },
        active: 'dashboard',
        isAdmin: true
      });
      assert.ok(html.includes('Settings'), 'expected a Settings link');
      assert.ok(html.includes('Admin credits'), 'admin should see Admin credits');
      assert.ok(html.includes('/admin/credits'), 'expected the Admin credits href');
      assert.ok(html.includes('bob'), 'expected the identity block (login)');
    });
  });

  // ── AC2 (integration): live role re-check, not a stale cached role ─────────
  queue.push(function() {
    console.log('\nAC2 (integration) — nav visibility reflects a live role re-check, not a stale cached role');
    return test('sidebar hides Admin credits after requireAdmin self-heals a revoked session role', async function() {
      var requireAdminMod = freshRequire(REQUIRE_ADMIN_PATH);
      var shell = freshRequire(HTML_SHELL_PATH);

      // Session started as admin (cached at login time)...
      var req = { session: { userId: 1, tenantId: 'acme', role: 'admin' } };

      // ...but the live-role adapter (the SAME mechanism requireAdmin already uses
      // in production, wired in server.js to getRoleForTenant) reports the role was
      // since revoked in the DB.
      requireAdminMod.setGetCurrentRole(async function(/* tenantId */) { return 'user'; });

      var res = makeRes();
      await requireAdminMod.requireAdmin(req, res, function() {});
      // The live check denies access to the admin-only route AND self-heals the
      // cached session role -- this is the existing, unmodified requireAdmin
      // mechanism (sec-perf-s2) that this story consumes, per its own out-of-scope
      // note ("does not modify the admin-check mechanism itself").
      assert.strictEqual(req.session.role, 'user', 'requireAdmin should have self-healed the cached role');

      // A subsequent sidebar render, using the now-corrected session role (the same
      // req.session.role === 'admin' computation used by settings.js/dashboard.js),
      // must NOT show Admin credits.
      var isAdminNow = req.session.role === 'admin';
      var html = shell.renderShell({
        title: 'Dashboard',
        bodyContent: '<h1>Dashboard</h1>',
        user: { login: 'carol' },
        active: 'dashboard',
        isAdmin: isAdminNow
      });
      assert.ok(!html.includes('Admin credits'), 'Admin credits must NOT show once the live check revoked admin status');
    });
  });

  // ── AC3 — every NAV_ITEMS href resolves to a registered route ──────────────
  queue.push(function() {
    console.log('\nAC3 — every NAV_ITEMS href (including account-level entries) resolves to a registered route');
    return test('AC3: zero dangling NAV_ITEMS entries', function() {
      var shell = freshRequire(HTML_SHELL_PATH);
      var serverSrc = fs.readFileSync(path.join(ROOT, 'src/web-ui/server.js'), 'utf8');
      var unresolved = shell.NAV_ITEMS.filter(function(item) {
        return !pathRegisteredInServer(item.href.split('?')[0], serverSrc);
      });
      assert.strictEqual(unresolved.length, 0,
        'unresolved NAV_ITEMS hrefs: ' + unresolved.map(function(i) { return i.href; }).join(', '));
    });
  });

  queue.push(function() {
    console.log('\nAC3 — the account-level entries (Settings, Admin credits) are present and correctly tagged');
    return test('AC3: Settings + Admin credits present in NAV_ITEMS with section "account"', function() {
      var shell = freshRequire(HTML_SHELL_PATH);
      var settingsItem = shell.NAV_ITEMS.find(function(i) { return i.href === '/settings'; });
      var adminItem = shell.NAV_ITEMS.find(function(i) { return i.href === '/admin/credits'; });
      assert.ok(settingsItem, 'expected a NAV_ITEMS entry for /settings');
      assert.strictEqual(settingsItem.section, 'account', 'Settings must be tagged section: account');
      assert.ok(adminItem, 'expected a NAV_ITEMS entry for /admin/credits');
      assert.strictEqual(adminItem.section, 'account', 'Admin credits must be tagged section: account');
      assert.strictEqual(adminItem.adminOnly, true, 'Admin credits must be tagged adminOnly: true');
    });
  });

  // ── AC4 — test validity: the same check fails against the pre-fix shape ────
  queue.push(function() {
    console.log('\nAC4 — the resolution check fails against the CURRENT (pre-fix) NAV_ITEMS shape');
    return test('AC4: pre-fix fixture (Features/Actions/Status) fails the resolution check', function() {
      var preFixNavItems = [
        { id: 'dashboard', href: '/dashboard' },
        { id: 'journey',   href: '/journey' },
        { id: 'skills',    href: '/skills' },
        { id: 'features',  href: '/features' },
        { id: 'actions',   href: '/actions' },
        { id: 'status',    href: '/status' }
      ];
      var serverSrc = fs.readFileSync(path.join(ROOT, 'src/web-ui/server.js'), 'utf8');
      var unresolved = preFixNavItems.filter(function(item) {
        return !pathRegisteredInServer(item.href, serverSrc);
      });
      assert.strictEqual(unresolved.length, 3, 'expected exactly 3 unresolved (dead) entries in the pre-fix fixture');
      assert.ok(unresolved.every(function(i) { return ['features', 'actions', 'status'].indexOf(i.id) !== -1; }),
        'the 3 unresolved entries should be exactly features/actions/status');
    });
  });

  // ── NFR (Security): nav visibility is UX only, not the security boundary ──
  queue.push(function() {
    console.log('\nNFR (Security) — requireAdmin denies a non-admin regardless of nav state');
    return test('requireAdmin: non-admin session denied 403, bypassing any nav/UI visibility state entirely', async function() {
      var requireAdminMod = freshRequire(REQUIRE_ADMIN_PATH);
      // No nav rendering involved at all here -- directly exercises the route's own
      // gate, matching the NFR's "bypassing the UI entirely" measurement method.
      // Cross-references existing coverage in check-arl-s2-admin-middleware.js and
      // check-sec-perf-s2-stale-role-revalidation.js rather than duplicating it.
      var req = { session: { userId: 7, tenantId: 'acme', role: 'user' } };
      var res = makeRes();
      var nextCalled = false;
      await requireAdminMod.requireAdmin(req, res, function() { nextCalled = true; });
      assert.ok(!nextCalled, 'next() must NOT be called for a non-admin session');
      assert.strictEqual(res._status, 403, 'expected 403 regardless of what any nav item shows');
    });
  });

  // ── Regression: server.js actually wires isAdmin into at least one real page ─
  queue.push(function() {
    console.log('\nRegression — dashboard.js and settings.js compute and forward isAdmin to renderShell');
    return test('dashboard.js and settings.js pass isAdmin through to renderShell', function() {
      var dashboardSrc = fs.readFileSync(path.join(ROOT, 'src/web-ui/routes/dashboard.js'), 'utf8');
      var settingsSrc = fs.readFileSync(path.join(ROOT, 'src/web-ui/routes/settings.js'), 'utf8');
      assert.ok(/isAdmin/.test(dashboardSrc), 'dashboard.js should compute/forward isAdmin');
      assert.ok(/isAdmin/.test(settingsSrc), 'settings.js should compute/forward isAdmin');
    });
  });

  // Run queue sequentially
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n── Summary ──');
  console.log('  Passed: ' + passed);
  console.log('  Failed: ' + failed);
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[b2] Unexpected error:', err);
  process.exit(1);
});
