#!/usr/bin/env node
// check-pmnv-s1-pod-manager-nav-entry.js — AC verification tests for pmnv-s1
// (Add Pod Manager to the sidebar nav), story
// artefacts/2026-09-23-pod-manager-nav-fix/stories/pmnv-s1-pod-manager-nav-entry.md
//
// AC1/AC3: "Pod Manager" nav item renders for every authenticated user (admin
//      and non-admin alike), alongside "Org board" in the main section.
// AC2: the raw NAV_ITEMS entry itself has href '/admin/pods/manager', is not
//      adminOnly, and is not in the 'account' section.
// AC4 (integration, not repeated here): the pre-existing, unmodified
//      tests/check-b2-account-nav.js dangling-link regression suite covers
//      this new entry automatically — re-run that file directly, no new
//      integration test needed in this file.
//
// Follows this repo's hand-rolled test()/assert convention (see
// tests/check-b2-account-nav.js) — no Jest/Mocha. No external dependencies.

'use strict';

var assert = require('assert');
var path = require('path');

var HTML_SHELL_PATH = path.resolve(__dirname, '../src/web-ui/utils/html-shell.js');

var passed = 0;
var failed = 0;
var failures = [];

function test(name, fn) {
  try {
    fn();
    passed++; console.log('  [PASS]', name);
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
  }
}

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function main() {
  // ── AC1/AC3: nav item renders for every authenticated user ─────────────────
  console.log('\nAC1/AC3 — Pod Manager nav item present for admin and non-admin alike');

  test('renderShell (isAdmin=false): contains Pod Manager, its href, and Org board', function() {
    var shell = freshRequire(HTML_SHELL_PATH);
    var html = shell.renderShell({
      title: 'Dashboard',
      bodyContent: '<h1>Dashboard</h1>',
      user: { login: 'alice' },
      active: 'dashboard',
      isAdmin: false
    });
    assert.ok(html.includes('Pod Manager'), 'expected a Pod Manager link');
    assert.ok(html.includes('/admin/pods/manager'), 'expected the Pod Manager href');
    assert.ok(html.includes('Org board'), 'expected Org board still present (regression guard)');
  });

  test('renderShell (isAdmin=true): Pod Manager still present (identical for admins)', function() {
    var shell = freshRequire(HTML_SHELL_PATH);
    var html = shell.renderShell({
      title: 'Dashboard',
      bodyContent: '<h1>Dashboard</h1>',
      user: { login: 'bob' },
      active: 'dashboard',
      isAdmin: true
    });
    assert.ok(html.includes('Pod Manager'), 'expected a Pod Manager link for admin users too');
    assert.ok(html.includes('/admin/pods/manager'), 'expected the Pod Manager href');
  });

  // ── AC2: the raw NAV_ITEMS entry's own shape ────────────────────────────────
  console.log('\nAC2 — Pod Manager NAV_ITEMS entry has the correct shape');

  test('NAV_ITEMS: pod-manager entry has correct href, is not adminOnly, is not in the account section', function() {
    var shell = freshRequire(HTML_SHELL_PATH);
    var entry = shell.NAV_ITEMS.find(function(item) { return item.id === 'pod-manager'; });
    assert.ok(entry, 'expected a NAV_ITEMS entry with id "pod-manager"');
    assert.strictEqual(entry.href, '/admin/pods/manager', 'expected href to point at the real Pod Manager route');
    assert.ok(!entry.adminOnly, 'expected adminOnly to be falsy -- the real route is authGuard-only, not admin-gated');
    assert.notStrictEqual(entry.section, 'account', 'expected the main section, not the account-settings bottom section');
  });

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

main();
