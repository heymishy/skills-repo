#!/usr/bin/env node
// check-si-s1-theme-toggle-relocation.js -- si-s1
// Story: artefacts/2026-08-17-settings-improvements/stories/si-s1-relocate-theme-toggle.md
// Test plan: artefacts/2026-08-17-settings-improvements/test-plans/si-s1-test-plan.md
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-c1-settings-shell-and-profile-tab.js, tests/check-story5-client-agency-comments.js)
// -- no Jest/Mocha.
//
// AC1: dark/light mode toggle visible in Settings' Profile tab panel
// AC2: relocated toggle reuses swToggleTheme()/'sw-theme' unmodified (markup + source assertion)
// AC3: toggle exists in exactly one location -- absent from topbar, present once in Settings
// AC4: click on the relocated toggle fires a new, distinct _posthog.capture event
// NFR (Accessibility): relocated control retains aria-label + CSS class hooks

'use strict';

var assert = require('assert');
var fs = require('fs');
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

var HTML_SHELL_PATH = path.resolve(ROOT, 'src/web-ui/utils/html-shell.js');
var SETTINGS_PATH    = path.resolve(ROOT, 'src/web-ui/routes/settings.js');
var POSTHOG_PATH     = path.resolve(ROOT, 'src/web-ui/modules/posthog-server.js');
var SERVER_PATH      = path.resolve(ROOT, 'src/web-ui/server.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function mockReq(overrides) {
  return Object.assign({
    session: {},
    query: {},
    headers: {},
    body: undefined
  }, overrides || {});
}

function mockRes() {
  var r = { statusCode: null, body: '', headers: {} };
  r.writeHead = function(code, hdrs) { r.statusCode = code; Object.assign(r.headers, hdrs || {}); };
  r.end = function(b) { r.body = (b != null ? String(b) : ''); r._ended = true; };
  return r;
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 -- rendersThemeToggleInProfileTab
// ─────────────────────────────────────────────────────────────────────────────

async function rendersThemeToggleInProfileTab() {
  var settings = freshRequire(SETTINGS_PATH);
  var html = settings.renderProfileTab({ login: 'ada' }, new Set(['github']));

  var panelIdx = html.indexOf('id="tab-panel-profile"');
  var btnIdx = html.indexOf('<button class="sw-theme-toggle"');
  assert.ok(panelIdx !== -1, 'AC1: Profile tab panel wrapper present');
  assert.ok(btnIdx !== -1, 'AC1: .sw-theme-toggle button present in Profile tab output');
  assert.ok(btnIdx > panelIdx, 'AC1: toggle button is nested inside the Profile tab panel');
  assert.ok(html.indexOf('aria-label="Toggle dark mode"') !== -1, 'AC1: retains aria-label="Toggle dark mode"');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC2 -- themeToggleClickFlipsDataThemeAndLocalStorage
// (swToggleTheme() itself is reused unmodified -- verified two ways: the
// relocated markup wires the same onclick handler, and html-shell.js's own
// SHELL_JS source for swToggleTheme's body is byte-for-byte unchanged.)
// ─────────────────────────────────────────────────────────────────────────────

async function themeToggleClickFlipsDataThemeAndLocalStorage() {
  var htmlShell = freshRequire(HTML_SHELL_PATH);
  var relocatedMarkup = htmlShell.renderThemeToggle();
  assert.ok(relocatedMarkup.indexOf('swToggleTheme()') !== -1, 'AC2: relocated button wires the existing swToggleTheme() handler');

  // Inspect the RESOLVED runtime script (rendered output), not the source
  // file text, to sidestep the source's own string-literal escaping -- this
  // is the exact JS the browser executes, unchanged by this story.
  var shellHtml = htmlShell.renderShell({ title: 'x', bodyContent: '', user: { login: 'zed' }, active: 'x' });
  var unmodifiedBody =
    "window.swToggleTheme=function(){" +
    "var cur=_html.getAttribute('data-theme')||'light';" +
    "var next=cur==='dark'?'light':'dark';" +
    "_html.setAttribute('data-theme',next);" +
    "localStorage.setItem('sw-theme',next);" +
    "};";
  assert.ok(shellHtml.indexOf(unmodifiedBody) !== -1, 'AC2: swToggleTheme() function body is byte-for-byte unchanged (localStorage key \'sw-theme\' untouched)');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC3 -- themeToggleExistsInExactlyOneLocation (edge case: absent AND not duplicated)
// ─────────────────────────────────────────────────────────────────────────────

async function themeToggleExistsInExactlyOneLocation() {
  var htmlShell = freshRequire(HTML_SHELL_PATH);
  var settings = freshRequire(SETTINGS_PATH);

  var shellHtml = htmlShell.renderShell({
    title: 'Dashboard',
    bodyContent: '<p>hi</p>',
    user: { login: 'zed' },
    active: 'org-kanban'
  });
  assert.ok(shellHtml.indexOf('<button class="sw-theme-toggle"') === -1, 'AC3: topbar (renderShell) no longer renders the toggle button');

  var settingsHtml = settings.renderSettingsPage({ user: { login: 'zed' }, linkedSet: new Set(), isAdmin: false });
  var occurrences = settingsHtml.split('<button class="sw-theme-toggle"').length - 1;
  assert.strictEqual(occurrences, 1, 'AC3 edge case: exactly one toggle button instance on the full Settings page (not zero, not duplicated) -- got ' + occurrences);
}

// ─────────────────────────────────────────────────────────────────────────────
// AC4 -- themeToggleClickFiresPostHogEvent
// ─────────────────────────────────────────────────────────────────────────────

async function themeToggleClickFiresPostHogEvent() {
  var settings = freshRequire(SETTINGS_PATH);

  // Plain require (NOT freshRequire) -- must be the SAME cached module object
  // settings.js's own require('../modules/posthog-server') already resolved
  // to (settings.js was just freshRequired above), matching
  // tests/check-story5-client-agency-comments.js's established monkeypatch
  // convention for this exact _posthog.capture pattern.
  var posthogServer = require(POSTHOG_PATH);
  var captured = [];
  var originalCapture = posthogServer.capture;
  posthogServer.capture = function(distinctId, event, properties) {
    captured.push({ distinctId: distinctId, event: event, properties: properties });
  };

  try {
    var req = mockReq({ session: { login: 'ada', tenantId: 'ada-tenant' } });
    var res = mockRes();
    await settings.handlePostThemeToggleClicked(req, res);

    assert.strictEqual(captured.length, 1, 'AC4: expected exactly one capture call on click');
    assert.strictEqual(typeof captured[0].event, 'string', 'AC4: event name must be a real string');
    assert.ok(captured[0].event.length > 0, 'AC4: event name must be non-empty');
    assert.notStrictEqual(captured[0].event, 'theme_toggle_clicked_topbar', 'AC4: event name is distinct from any prior topbar-toggle event (none existed to reuse)');
    assert.strictEqual(res.statusCode, 204, 'AC4: capture endpoint responds without a page navigation/reload');
  } finally {
    posthogServer.capture = originalCapture;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NFR (Accessibility) -- themeToggleRetainsAccessibilityAttributes
// ─────────────────────────────────────────────────────────────────────────────

async function themeToggleRetainsAccessibilityAttributes() {
  var htmlShell = freshRequire(HTML_SHELL_PATH);
  var markup = htmlShell.renderThemeToggle();

  assert.ok(markup.indexOf('aria-label="Toggle dark mode"') !== -1, 'NFR-a11y: aria-label retained');
  assert.ok(markup.indexOf('class="sw-theme-toggle"') !== -1, 'NFR-a11y: sw-theme-toggle class hook retained');
  assert.ok(markup.indexOf('sw-theme-toggle-icon--light') !== -1 && markup.indexOf('sw-theme-toggle-icon--dark') !== -1, 'NFR-a11y: icon class hooks retained');

  // Settings page still ships the shared .sw-theme-toggle CSS rule (focus/hover
  // states) via the shared shell stylesheet -- not a per-route duplicate.
  var settings = freshRequire(SETTINGS_PATH);
  var settingsHtml = settings.renderSettingsPage({ user: { login: 'zed' }, linkedSet: new Set(), isAdmin: false });
  assert.ok(settingsHtml.indexOf('.sw-theme-toggle {') !== -1, 'NFR-a11y: shared .sw-theme-toggle CSS rule present on the Settings page');
}

// ─────────────────────────────────────────────────────────────────────────────
// Bonus -- server.js wiring (source inspection, matches check-c1's
// testServerWiresSettingsRoute convention)
// ─────────────────────────────────────────────────────────────────────────────

async function serverWiresThemeToggleCaptureRoute() {
  var serverSource = fs.readFileSync(SERVER_PATH, 'utf8');
  assert.ok(serverSource.indexOf('handlePostThemeToggleClicked') !== -1, 'server.js imports/uses handlePostThemeToggleClicked');
  assert.ok(/pathname === '\/settings\/theme-toggle-clicked' && req\.method === 'POST'/.test(serverSource), 'server.js registers POST /settings/theme-toggle-clicked');
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[si-s1] Running AC verification tests...\n');

  console.log('AC1 -- toggle visible in Profile tab');
  await test('rendersThemeToggleInProfileTab', rendersThemeToggleInProfileTab);

  console.log('\nAC2 -- click flips data-theme/localStorage via unmodified swToggleTheme()');
  await test('themeToggleClickFlipsDataThemeAndLocalStorage', themeToggleClickFlipsDataThemeAndLocalStorage);

  console.log('\nAC3 -- toggle exists in exactly one location');
  await test('themeToggleExistsInExactlyOneLocation', themeToggleExistsInExactlyOneLocation);

  console.log('\nAC4 -- click fires a new PostHog event');
  await test('themeToggleClickFiresPostHogEvent', themeToggleClickFiresPostHogEvent);

  console.log('\nNFR -- accessibility attributes retained');
  await test('themeToggleRetainsAccessibilityAttributes', themeToggleRetainsAccessibilityAttributes);

  console.log('\nBonus -- server.js wiring');
  await test('serverWiresThemeToggleCaptureRoute', serverWiresThemeToggleCaptureRoute);

  console.log('\n[si-s1] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f.name + ' -- ' + (f.err && f.err.stack || f.err)); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[si-s1] Unexpected error:', err);
  process.exit(1);
});
