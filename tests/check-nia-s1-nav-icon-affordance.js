#!/usr/bin/env node
// check-nia-s1-nav-icon-affordance.js — AC verification tests for nia-s1
// (Fix affordance mismatch on the sign-out control and theme-toggle button),
// story artefacts/2026-08-16-nav-icon-affordance/stories/nia-s1-fix-nav-icon-affordance.md
//
// AC1: .sw-signout has a visible "Sign out" text label, href unchanged
// AC2: .sw-signout's onclick gates navigation behind confirm()
// AC3: theme toggle no longer renders the ambiguous ◑ glyph; renders a
//      CSS-gated sun/moon icon pair keyed off [data-theme]
// AC4: theme toggle's class/onclick/aria-label unchanged; swToggleTheme()
//      behaviour unregressed
//
// Follows this repo's hand-rolled test()/assert convention (see
// tests/check-b2-account-nav.js) — no Jest/Mocha, Node.js built-ins only.

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
  var shell = freshRequire(HTML_SHELL_PATH);
  var sidebarHtml = shell.renderShell({
    title: 'Dashboard',
    bodyContent: '<h1>Dashboard</h1>',
    user: { login: 'alice' },
    active: 'dashboard',
    isAdmin: false
  });

  // ── AC1 ──────────────────────────────────────────────────────────────────
  test('AC1: .sw-signout contains a visible "Sign out" text label, href unchanged', function() {
    var m = /<a class="sw-signout"[^>]*href="\/auth\/logout"[^>]*>([\s\S]*?)<\/a>/.exec(sidebarHtml);
    assert.ok(m, 'expected a .sw-signout anchor with href="/auth/logout"');
    assert.ok(/Sign out/.test(m[1]), 'expected the visible text "Sign out" inside the anchor, got: ' + m[1]);
  });

  // ── AC2 ──────────────────────────────────────────────────────────────────
  test('AC2: .sw-signout onclick gates navigation behind confirm()', function() {
    var m = /<a class="sw-signout"([^>]*)>/.exec(sidebarHtml);
    assert.ok(m, 'expected a .sw-signout anchor');
    var attrs = m[1];
    assert.ok(/onclick="return confirm\(/.test(attrs), 'expected onclick="return confirm(...)" gating navigation, got attrs: ' + attrs);
    assert.ok(/confirm\('[^']+'\)/.test(attrs) || /confirm\("[^"]+"\)/.test(attrs), 'expected a non-empty confirm() message');
  });

  // ── AC3 ──────────────────────────────────────────────────────────────────
  test('AC3: theme toggle no longer renders ◑; renders a CSS-gated sun/moon icon pair', function() {
    assert.ok(sidebarHtml.indexOf('◑') === -1, 'expected the ambiguous ◑ glyph to be absent');
    assert.ok(/class="sw-theme-toggle-icon sw-theme-toggle-icon--light"/.test(sidebarHtml), 'expected a light-mode icon element');
    assert.ok(/class="sw-theme-toggle-icon sw-theme-toggle-icon--dark"/.test(sidebarHtml), 'expected a dark-mode icon element');
    assert.ok(/\.sw-theme-toggle-icon--dark\s*\{[^}]*display:\s*none/.test(sidebarHtml), 'expected the dark icon hidden by default');
    assert.ok(/\[data-theme="dark"\]\s*\.sw-theme-toggle-icon--light\s*\{[^}]*display:\s*none/.test(sidebarHtml), 'expected [data-theme="dark"] to hide the light icon');
    assert.ok(/\[data-theme="dark"\]\s*\.sw-theme-toggle-icon--dark\s*\{[^}]*display:\s*inline/.test(sidebarHtml), 'expected [data-theme="dark"] to show the dark icon');
    assert.ok(/prefers-color-scheme:\s*dark/.test(sidebarHtml), 'expected the existing no-JS OS-preference fallback pattern to also gate the new icons');
  });

  // ── AC4 ──────────────────────────────────────────────────────────────────
  test('AC4: theme toggle class/onclick/aria-label unchanged; swToggleTheme() logic unregressed', function() {
    assert.ok(/<button class="sw-theme-toggle" onclick="swToggleTheme\(\)" aria-label="Toggle dark mode"/.test(sidebarHtml),
      'expected the theme toggle button\'s class/onclick/aria-label unchanged');
    assert.ok(/window\.swToggleTheme=function\(\)\{/.test(sidebarHtml), 'expected swToggleTheme function definition present');
    assert.ok(/_html\.setAttribute\('data-theme',next\)/.test(sidebarHtml), 'expected swToggleTheme to still set data-theme on <html>');
    assert.ok(/localStorage\.setItem\('sw-theme',next\)/.test(sidebarHtml), 'expected swToggleTheme to still persist to localStorage');
  });

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
}

main();
