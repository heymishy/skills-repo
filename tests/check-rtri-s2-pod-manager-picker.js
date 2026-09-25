#!/usr/bin/env node
// check-rtri-s2-pod-manager-picker.js — rtri-s2
// Verifies pod-manager.html's member picker wired to the real team roster
// (rtri-s1's GET /api/team/members). Follows this repo's hand-rolled
// test()/assert style, and the established JSDOM client-script harness
// pattern (see tests/check-csd-s1-derisk-canvas-mermaid.js): the REAL
// pod-manager.html file is loaded into a JSDOM instance, its inline
// <script> is extracted and eval'd in that window, and window.fetch is
// stubbed per test.
//
// AC1: "Available" roster shows real members, no pod-role chip until assigned
// AC2: real identity + selected pod role land in pod_members on save
// AC3: zero-member tenant renders an empty roster, not an error/fake names
// AC4: real members flow through unchanged to feature_collaborators via ep4-s1
// AC5: search-by-name regression guard; role-tabs hidden for "Available" (no throw)
// AC6: real identity strings rendered via safe DOM construction (MC-SEC-01)
// AC7: pod-role selector presented at add-time; selected value (not roster
//      response) written to role_id

'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var { JSDOM } = require('jsdom');

var ROOT = path.join(__dirname, '..');
var POD_MANAGER_HTML_PATH = path.resolve(ROOT, 'src/web-ui/public/pod-manager.html');

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

// ── JSDOM harness: load the REAL pod-manager.html, extract its inline
// <script>, eval it in a fresh window per test. Mirrors
// check-csd-s1-derisk-canvas-mermaid.js's own established pattern.
function extractInlineScript(html) {
  var m = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('no inline <script> found in pod-manager.html');
  return m[1];
}

function buildPage(fetchImpl) {
  var html = fs.readFileSync(POD_MANAGER_HTML_PATH, 'utf8');
  var dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/admin/pods/manager' });
  var win = dom.window;
  win.fetch = fetchImpl;
  var scriptSrc = extractInlineScript(html);
  win.eval(scriptSrc);
  return win;
}

function mockFetchRosterOnly(members) {
  return function(url) {
    if (url === '/api/team/members') {
      return Promise.resolve({ json: function() { return Promise.resolve({ members: members }); } });
    }
    return Promise.reject(new Error('unexpected fetch in this test: ' + url));
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — "Available" roster shows real members, no pod-role chip until assigned
// ─────────────────────────────────────────────────────────────────────────────

async function testAC1RealIdentitiesNoRoleChip() {
  var win = buildPage(mockFetchRosterOnly([
    { identity: 'alice@example.com', role: 'engineer' },
    { identity: 'bob-gh', role: 'admin' }
  ]));

  await win.openModal();

  var rows = win.document.querySelectorAll('#available-roster .roster-row');
  assert.strictEqual(rows.length, 2, 'AC1: exactly 2 real members rendered');
  var text = win.document.getElementById('available-roster').textContent;
  assert.ok(text.indexOf('alice@example.com') !== -1, 'AC1: alice@example.com shown, not a fake ORG_ROSTER name');
  assert.ok(text.indexOf('bob-gh') !== -1, 'AC1: bob-gh shown');
  assert.ok(text.indexOf('Hamish') === -1 && text.indexOf('Susan') === -1 && text.indexOf('Darren') === -1, 'AC1: no ORG_ROSTER fake names anywhere');
  assert.strictEqual(win.document.querySelectorAll('#available-roster .role-chip').length, 0, 'AC1: no role-chip in "Available" -- real members carry no pod role until AC7 assigns one');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC5 (role-tab half) — role-tabs are hidden for "Available", never throw
// ─────────────────────────────────────────────────────────────────────────────

async function testAC5RoleTabsHiddenNoThrow() {
  var win = buildPage(mockFetchRosterOnly([
    { identity: 'alice@example.com', role: 'engineer' }
  ]));

  await win.openModal();

  var tabsEl = win.document.getElementById('role-tabs');
  assert.strictEqual(tabsEl.children.length, 0, 'AC5: no role-tab elements rendered for "Available" (real members have no pod role to filter by)');
  assert.strictEqual(tabsEl.style.display, 'none', 'AC5: role-tabs container is hidden, not just empty');
  // Regression guard: opening/closing the modal again must not throw even
  // though role-tabs are now a no-op.
  win.document.getElementById('cancel-pod-btn').onclick();
  await win.openModal();
  assert.strictEqual(win.document.getElementById('available-roster').querySelectorAll('.roster-row').length, 1, 'AC5: re-opening the modal still renders the real roster correctly, no throw');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — zero-member tenant renders an empty roster, not an error or fake names
// ─────────────────────────────────────────────────────────────────────────────

async function testAC3ZeroMembersEmptyNoError() {
  var win = buildPage(mockFetchRosterOnly([]));

  await win.openModal();

  var rows = win.document.querySelectorAll('#available-roster .roster-row');
  assert.strictEqual(rows.length, 0, 'AC3: zero rows rendered for a zero-member tenant');
  assert.ok(!win.document.getElementById('error-banner').classList.contains('visible'), 'AC3: no error banner shown');
  var text = win.document.getElementById('available-roster').textContent;
  assert.ok(text.indexOf('Hamish') === -1 && text.indexOf('Susan') === -1 && text.indexOf('Darren') === -1, 'AC3: no ORG_ROSTER fallback to fake names');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — real identity string with HTML-significant characters is never
// interpreted as markup
// ─────────────────────────────────────────────────────────────────────────────

async function testAC6PayloadIdentityNeverInterpretedAsMarkup() {
  var payload = '<img src=x onerror=alert(1)>';
  var win = buildPage(mockFetchRosterOnly([
    { identity: payload, role: 'engineer' }
  ]));

  await win.openModal();

  assert.strictEqual(win.document.querySelectorAll('#available-roster img').length, 0, 'AC6: no <img> element was created from the payload identity string');
  var text = win.document.getElementById('available-roster').textContent;
  assert.ok(text.indexOf(payload) !== -1, 'AC6: the payload string is present as literal text content, safely rendered via textContent/createElement');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — pod-role selector is presented on "Add"; the confirmed value -- not
// the roster response's role -- is stored on the selection
// ─────────────────────────────────────────────────────────────────────────────

async function testAC7SelectorConfirmedValueUsedNotRosterRole() {
  // 'admin' is a team-permission role, not a valid pod role -- deliberately
  // chosen so a bug that copies it straight through is caught.
  var win = buildPage(mockFetchRosterOnly([
    { identity: 'alice@example.com', role: 'admin' }
  ]));

  await win.openModal();

  var addBtn = win.document.querySelector('#available-roster .add-btn');
  addBtn.onclick();

  var select = win.document.querySelector('#available-roster select');
  assert.ok(select, 'AC7: a pod-role <select> is presented after clicking Add');
  var optionValues = Array.prototype.map.call(select.querySelectorAll('option'), function(o) { return o.value; });
  assert.deepStrictEqual(optionValues, ['conductor', 'engineer', 'architect', 'product'], 'AC7: selector options are the existing VALID_ROLES, no new role vocabulary');

  select.value = 'engineer';
  var confirmBtn = win.document.querySelector('#available-roster .add-btn'); // Confirm reuses the add-btn class
  confirmBtn.onclick();

  assert.strictEqual(win.selection.length, 2, 'AC7: one real member added on top of the creator');
  var added = win.selection[1];
  assert.strictEqual(added.userId, 'alice@example.com', 'AC7: real identity stored as userId');
  assert.strictEqual(added.roleId, 'engineer', 'AC7: the SELECTOR\'S confirmed value is used');
  assert.notStrictEqual(added.roleId, 'admin', 'AC7: the roster response\'s own role ("admin") is never used -- it isn\'t even a valid pod role');
}

async function testAC7CancelDoesNotAddMember() {
  var win = buildPage(mockFetchRosterOnly([
    { identity: 'alice@example.com', role: 'engineer' }
  ]));

  await win.openModal();

  var addBtn = win.document.querySelector('#available-roster .add-btn');
  addBtn.onclick();

  var cancelBtn = win.document.querySelector('#available-roster .remove-btn'); // Cancel reuses the remove-btn class
  assert.ok(cancelBtn, 'AC7: a Cancel control is presented alongside the selector');
  cancelBtn.onclick();

  assert.strictEqual(win.selection.length, 1, 'AC7: cancelling leaves selection unchanged (only the creator)');
  assert.strictEqual(win.document.getElementById('your-team').querySelectorAll('.roster-row').length, 1, 'AC7: "Your team" shows only the creator after cancel (alice not added)');
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner (extended by later tasks)
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[rtri-s2] Running AC verification tests...\n');

  console.log('AC1 — real identities, no role chip');
  await test('AC1: "Available" roster shows real members, no pod-role chip until assigned', testAC1RealIdentitiesNoRoleChip);

  console.log('\nAC5 (role-tab half) — hidden, no throw');
  await test('AC5: role-tabs hidden for "Available", never throw', testAC5RoleTabsHiddenNoThrow);

  console.log('\nAC3 — zero members');
  await test('AC3: zero-member tenant renders an empty roster, not an error/fake names', testAC3ZeroMembersEmptyNoError);

  console.log('\nAC6 — safe DOM construction');
  await test('AC6: real identity strings rendered via safe DOM construction (MC-SEC-01)', testAC6PayloadIdentityNeverInterpretedAsMarkup);

  console.log('\nAC7 — selector confirmed value used, not roster role');
  await test('AC7: pod-role selector presented on Add; confirmed value (not roster role) is stored', testAC7SelectorConfirmedValueUsedNotRosterRole);

  console.log('\nAC7 — cancel has no side effect');
  await test('AC7: cancelling the pod-role selector does not add the member', testAC7CancelDoesNotAddMember);

  console.log('\n[rtri-s2] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f.name); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[rtri-s2] Unexpected error:', err);
  process.exit(1);
});
