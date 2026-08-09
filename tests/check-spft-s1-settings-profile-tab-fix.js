#!/usr/bin/env node
// check-spft-s1-settings-profile-tab-fix.js — spft-s1
// Verifies the Settings page's Profile tab actually renders instead of being
// permanently hidden by a double-wrapped <div> whose outer wrapper never
// carries the correct id for the tab-switching script to find.
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-c1-settings-shell-and-profile-tab.js).
//
// AC1: Profile content visible on initial render (single active div)
// AC2: No orphaned outer wrapper element (regression-proof by construction)
// AC3: Exactly one tab-panel-profile element
// AC4: Non-admin rendering unaffected

'use strict';

var assert = require('assert');
var path = require('path');

var ROOT = path.join(__dirname, '..');

var passed = 0;
var failed = 0;
var failures = [];

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(function() { passed++; console.log('  [PASS]', name); })
    .catch(function(err) {
      failed++;
      failures.push({ name: name, err: err });
      console.log('  [FAIL]', name, '--', (err && err.message) || err);
    });
}

var SETTINGS_PATH = path.resolve(ROOT, 'src/web-ui/routes/settings.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

async function testAC1SingleActiveDivOnInitialRender() {
  var settings = freshRequire(SETTINGS_PATH);
  var html = settings.renderSettingsPage({
    user: { login: 'kim' },
    linkedSet: new Set(),
    isAdmin: false
  });

  var matches = html.match(/<div id="tab-panel-profile"[^>]*>/);
  assert.ok(matches, 'AC1: a tab-panel-profile div must exist');
  assert.ok(matches[0].indexOf('sw-tab-panel') !== -1, 'AC1: it must carry the sw-tab-panel class');
  assert.ok(matches[0].indexOf('sw-tab-panel--active') !== -1, 'AC1: it must carry sw-tab-panel--active directly, on the same element');
}

async function testAC1ProfileContentPresentAndNotWrapped() {
  var settings = freshRequire(SETTINGS_PATH);
  var html = settings.renderSettingsPage({
    user: { login: 'kim' },
    linkedSet: new Set(['github']),
    isAdmin: false
  });

  assert.ok(html.indexOf('Sign-in methods') !== -1, 'AC1: Profile tab content (Sign-in methods section) must be present');
  assert.ok(html.indexOf('kim') !== -1, 'AC1: the identity card must show the real login');
  assert.ok(html.indexOf('tab-panel-profile-wrap') === -1, 'AC1: the old wrapper id must no longer exist anywhere in the output');
}

async function testAC2NoOrphanedWrapperElement() {
  var settings = freshRequire(SETTINGS_PATH);
  var html = settings.renderSettingsPage({
    user: { login: 'kim' },
    linkedSet: new Set(),
    isAdmin: false
  });

  assert.ok(html.indexOf('tab-panel-profile-wrap') === -1,
    'AC2: no separate outer-wrapper element exists, so its --active class can never be lost independently of the real content');
}

async function testAC3ExactlyOneTabPanelProfileElement() {
  var settings = freshRequire(SETTINGS_PATH);
  var html = settings.renderSettingsPage({
    user: { login: 'kim' },
    linkedSet: new Set(),
    isAdmin: false
  });

  var count = (html.match(/id="tab-panel-profile"/g) || []).length;
  assert.strictEqual(count, 1, 'AC3: exactly one element must carry id="tab-panel-profile", found ' + count);
}

async function testAC4NonAdminRenderingUnaffected() {
  var settings = freshRequire(SETTINGS_PATH);
  var html = settings.renderSettingsPage({
    user: { login: 'liam' },
    linkedSet: new Set(),
    isAdmin: false
  });

  assert.ok(html.indexOf('id="tab-panel-profile"') !== -1, 'AC4: Profile panel still renders for a non-admin user');
  assert.ok(html.indexOf('sw-tab-panel--active') !== -1, 'AC4: Profile panel is still active by default for a non-admin user');
  assert.ok(html.indexOf('tab-billing') !== -1, 'AC4: Billing tab button still present for a non-admin user');
  assert.ok(html.indexOf('tab-credits') === -1, 'AC4: Credits tab button still absent for a non-admin user');
  assert.ok(html.indexOf('tab-impersonate') === -1, 'AC4: Impersonate tab button still absent for a non-admin user');
}

async function main() {
  console.log('check-spft-s1-settings-profile-tab-fix.js');

  await test('AC1: tab-panel-profile div carries sw-tab-panel--active directly on initial render', testAC1SingleActiveDivOnInitialRender);
  await test('AC1: Profile content present, no wrapper id anywhere in output', testAC1ProfileContentPresentAndNotWrapped);
  await test('AC2: no orphaned outer-wrapper element exists', testAC2NoOrphanedWrapperElement);
  await test('AC3: exactly one tab-panel-profile element', testAC3ExactlyOneTabPanelProfileElement);
  await test('AC4: non-admin rendering unaffected (Profile active, Billing present, Credits/Impersonate absent)', testAC4NonAdminRenderingUnaffected);

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) {
      console.log('  -', f.name);
      console.log('   ', (f.err && f.err.message) || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
