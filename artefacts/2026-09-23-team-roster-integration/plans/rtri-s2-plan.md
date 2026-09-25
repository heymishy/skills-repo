# Wire pod-manager.html's member picker to the real roster — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/rtri-s2`
**Worktree:** `.worktrees/rtri-s2`
**Test command:** `node scripts/run-all-tests.js` (full suite) / `node tests/check-rtri-s2-pod-manager-picker.js` (this story's file only)

---

## File map

```
Modify:
  src/web-ui/public/pod-manager.html  — replace ORG_ROSTER with a real fetch,
                                          add the AC7 pod-role selector, hide
                                          role-tabs for "Available" (AC5 decision)

Create:
  tests/check-rtri-s2-pod-manager-picker.js — all 9 tests (6 unit via jsdom, 3 integration)
```

---

## Task 1: Real roster fetch + rendering — AC1, AC3, AC6, AC5 (role-tab no-throw half)

**Files:**
- Modify: `src/web-ui/public/pod-manager.html`
- Create: `tests/check-rtri-s2-pod-manager-picker.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/check-rtri-s2-pod-manager-picker.js` with this content:

```javascript
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rtri-s2-pod-manager-picker.js
```

Expected output: all 4 tests fail — `pod-manager.html` still has `ORG_ROSTER`, not a real fetch; `openModal` doesn't return a promise; role-tabs still render the old way.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/public/pod-manager.html`, make these exact changes to the inline `<script>` block:

**3a. Replace `ORG_ROSTER` with `realRoster`:**

Find:
```javascript
    // Demo org roster -- a real deployment would fetch this from a users
    // endpoint. Kept inline here since ep1-s1's scope is pod creation, not
    // an org-directory API.
    var ORG_ROSTER = [
      { userId: 'hamish-uuid', name: 'Hamish', roleId: 'conductor' },
      { userId: 'susan-uuid', name: 'Susan', roleId: 'engineer' },
      { userId: 'darren-uuid', name: 'Darren', roleId: 'engineer' }
    ];
    var VALID_ROLES = ['conductor', 'engineer', 'architect', 'product'];
    var selection = []; // { userId, name, roleId } -- creator pre-included per design.md
```

Replace with:
```javascript
    // rtri-s2: real roster fetched from rtri-s1's GET /api/team/members on
    // modal open -- replaces ORG_ROSTER's hardcoded 3-name fixture. Each
    // entry is { identity, role } -- `role` is a TEAM PERMISSION role
    // (admin/engineer/product/viewer), deliberately never read into a pod
    // role (see Architecture Constraints in stories/rtri-s2.md). Populated
    // by fetchRoster(), called from openModal().
    var realRoster = [];
    var VALID_ROLES = ['conductor', 'engineer', 'architect', 'product'];
    var selection = []; // { userId, name, roleId } -- creator pre-included per design.md
```

**3b. Simplify the filter-state comment block (role-tab filter no longer applies):**

Find:
```javascript
    // Combined roster filter state -- role tab and search term apply together,
    // not as two separate un-combined passes. Tracked at module level so the
    // search handler can read the active role tab without re-deriving it
    // from the DOM.
    var activeRoleFilter = null; // null = 'All'
    var currentSearchTerm = '';
```

Replace with:
```javascript
    // rtri-s2: role-tab filtering no longer applies to "Available" -- real
    // members carry no pod role until added (AC1/AC7), so role-tabs are
    // hidden entirely (see renderTabs()). Only the search term filters
    // "Available" now.
    var currentSearchTerm = '';
```

**3c. Add `buildIdentitySpan` right after `buildNameRoleSpan`:**

Find (the closing of `buildNameRoleSpan`):
```javascript
    function buildNameRoleSpan(name, roleId, suffixText) {
      var wrap = document.createElement('span');
      var nameText = document.createTextNode(name + ' ');
      wrap.appendChild(nameText);
      var chip = document.createElement('span');
      chip.className = 'role-chip';
      chip.textContent = roleId;
      wrap.appendChild(chip);
      if (suffixText) {
        wrap.appendChild(document.createTextNode(' ' + suffixText));
      }
      return wrap;
    }
```

Replace with (adds a new function immediately after, same block):
```javascript
    function buildNameRoleSpan(name, roleId, suffixText) {
      var wrap = document.createElement('span');
      var nameText = document.createTextNode(name + ' ');
      wrap.appendChild(nameText);
      var chip = document.createElement('span');
      chip.className = 'role-chip';
      chip.textContent = roleId;
      wrap.appendChild(chip);
      if (suffixText) {
        wrap.appendChild(document.createTextNode(' ' + suffixText));
      }
      return wrap;
    }

    // rtri-s2: safe DOM construction for a bare identity string (no role
    // chip) -- used for "Available" panel entries, which carry no pod role
    // until AC7's selector assigns one. Same createElement/textContent
    // discipline as buildNameRoleSpan (MC-SEC-01, AC6).
    function buildIdentitySpan(identity) {
      var span = document.createElement('span');
      span.textContent = identity;
      return span;
    }
```

**3d. Replace `renderRoster()`:**

Find:
```javascript
    function renderRoster() {
      var el = document.getElementById('available-roster');
      el.innerHTML = '';
      ORG_ROSTER.filter(function(u) {
        var roleMatch = !activeRoleFilter || activeRoleFilter === 'All' || u.roleId === activeRoleFilter;
        var searchMatch = !currentSearchTerm || u.name.toLowerCase().indexOf(currentSearchTerm.toLowerCase()) !== -1;
        return roleMatch && searchMatch;
      }).forEach(function(u) {
          var row = document.createElement('div');
          row.className = 'roster-row';
          row.appendChild(buildNameRoleSpan(u.name, u.roleId));
          var btn = document.createElement('button');
          btn.className = 'add-btn';
          btn.textContent = 'Add';
          btn.onclick = function() { addMember(u); };
          row.appendChild(btn);
          el.appendChild(row);
        });
    }
```

Replace with (this task's version calls `addMember(u)` directly still — Task 2 will change this line to route through the pod-role selector instead):
```javascript
    function renderRoster() {
      var el = document.getElementById('available-roster');
      el.innerHTML = '';
      realRoster.filter(function(u) {
        return !currentSearchTerm || u.identity.toLowerCase().indexOf(currentSearchTerm.toLowerCase()) !== -1;
      }).forEach(function(u) {
          var row = document.createElement('div');
          row.className = 'roster-row';
          // AC1: no pod-role chip in "Available" -- real members carry no
          // pod role until assigned via the selector (AC7, added in a later task).
          row.appendChild(buildIdentitySpan(u.identity));
          var btn = document.createElement('button');
          btn.className = 'add-btn';
          btn.textContent = 'Add';
          btn.onclick = function() { addMember({ userId: u.identity, name: u.identity, roleId: VALID_ROLES[0] }); };
          row.appendChild(btn);
          el.appendChild(row);
        });
    }
```

(Note: this task's `onclick` is an intentionally temporary stand-in — Task 2 replaces it with the real pod-role selector flow. Using `VALID_ROLES[0]` here only lets Tasks 1's own 4 tests pass without depending on Task 2's not-yet-written code; Task 2's own tests will fail against this temporary line, which is expected and correct RED/GREEN discipline.)

**3e. Replace `renderTabs()`:**

Find:
```javascript
    function renderTabs() {
      var el = document.getElementById('role-tabs');
      el.innerHTML = '';
      ['All'].concat(VALID_ROLES).forEach(function(r) {
        var tab = document.createElement('span');
        tab.className = 'role-tab' + (r === 'All' ? ' active' : '');
        tab.textContent = r;
        tab.onclick = function() {
          document.querySelectorAll('.role-tab').forEach(function(t) { t.classList.remove('active'); });
          tab.classList.add('active');
          activeRoleFilter = r === 'All' ? null : r;
          renderRoster();
        };
        el.appendChild(tab);
      });
    }
```

Replace with:
```javascript
    function renderTabs() {
      // rtri-s2: role-tabs have no meaningful filter target for the real
      // roster (real members carry no pod role until added -- AC1/AC7), so
      // this panel's tabs are hidden entirely rather than rendered-disabled
      // or repurposed (DoR contract, AC5 decision, 2026-09-24).
      var el = document.getElementById('role-tabs');
      el.innerHTML = '';
      el.style.display = 'none';
    }
```

**3f. Modify `openModal()` to fetch the real roster:**

Find:
```javascript
    function openModal() {
      selection = [{ userId: 'me-uuid', name: 'You', roleId: 'conductor' }]; // creator pre-included by default
      nameInput.value = '';
      errorBanner.classList.remove('visible');
      activeRoleFilter = null; // 'All'
      currentSearchTerm = '';
      rosterSearchInput.value = '';
      renderTabs();
      renderRoster();
      renderTeam();
      modal.classList.add('open');
    }
```

Replace with:
```javascript
    function openModal() {
      selection = [{ userId: 'me-uuid', name: 'You', roleId: 'conductor' }]; // creator pre-included by default
      nameInput.value = '';
      errorBanner.classList.remove('visible');
      currentSearchTerm = '';
      rosterSearchInput.value = '';
      renderTabs();
      renderTeam();
      modal.classList.add('open');
      // rtri-s2: fetch the real roster (replaces the old synchronous
      // ORG_ROSTER render). Returns the promise so tests can await
      // completion -- the real onclick handler ignores the return value,
      // matching every other fire-and-forget click handler in this file.
      return fetchRoster();
    }
```

**3g. Add `fetchRoster()` — place it immediately after `openModal()`:**

```javascript
    // rtri-s2: fetches the real team roster (rtri-s1's GET /api/team/members)
    // and re-renders "Available" once it resolves. Called from openModal().
    function fetchRoster() {
      return fetch('/api/team/members')
        .then(function(r) { return r.json(); })
        .then(function(body) {
          realRoster = (body && body.members) || [];
          renderRoster();
        });
    }
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rtri-s2-pod-manager-picker.js
```

Expected output: `[rtri-s2] 4 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same baseline as `/branch-setup` (700 files, 1 pre-existing failure — `tests/check-p3.5-validate-trace.js`), plus this story's own new file now passing 4/4. If `tests/check-pcr-s1-test-runner.js` fails, re-run it standalone once (`node tests/check-pcr-s1-test-runner.js`) — this has been a confirmed, repeated, unrelated flake this session; if it passes standalone, it's not a regression.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/public/pod-manager.html tests/check-rtri-s2-pod-manager-picker.js
git commit -m "feat(rtri-s2): replace ORG_ROSTER with a real fetch against rtri-s1's roster endpoint"
```

---

## Task 2: Pod-role selector on Add — AC7

**Files:**
- Modify: `src/web-ui/public/pod-manager.html`
- Modify: `tests/check-rtri-s2-pod-manager-picker.js`

- [ ] **Step 1: Write the failing tests**

Add these test functions to `tests/check-rtri-s2-pod-manager-picker.js`, after `testAC6PayloadIdentityNeverInterpretedAsMarkup`:

```javascript
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
  assert.strictEqual(win.document.getElementById('your-team').querySelectorAll('.roster-row').length, 0, 'AC7: "Your team" shows no new row after cancel');
}
```

Add the calls to `main()`, right after the AC6 block and before the summary line:

```javascript
  console.log('\nAC7 — selector confirmed value used, not roster role');
  await test('AC7: pod-role selector presented on Add; confirmed value (not roster role) is stored', testAC7SelectorConfirmedValueUsedNotRosterRole);

  console.log('\nAC7 — cancel has no side effect');
  await test('AC7: cancelling the pod-role selector does not add the member', testAC7CancelDoesNotAddMember);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rtri-s2-pod-manager-picker.js
```

Expected output: the 2 new tests fail (clicking "Add" currently calls `addMember` directly with `VALID_ROLES[0]`, per Task 1's temporary stand-in — no `<select>` is ever presented). The 4 Task 1 tests still pass.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/public/pod-manager.html`, make these exact changes:

**3a. Replace `renderRoster()`'s temporary `onclick` with a call to the new selector function:**

Find:
```javascript
          var btn = document.createElement('button');
          btn.className = 'add-btn';
          btn.textContent = 'Add';
          btn.onclick = function() { addMember({ userId: u.identity, name: u.identity, roleId: VALID_ROLES[0] }); };
          row.appendChild(btn);
```

Replace with:
```javascript
          var btn = document.createElement('button');
          btn.className = 'add-btn';
          btn.textContent = 'Add';
          btn.onclick = function() { showRoleSelector(row, u, btn); };
          row.appendChild(btn);
```

**3b. Add `showRoleSelector` — place it immediately after `addMember`:**

Find (the existing `addMember` function, for placement reference):
```javascript
    function addMember(u) {
      if (selection.some(function(m) { return m.userId === u.userId; })) return;
      selection.push({ userId: u.userId, name: u.name, roleId: u.roleId });
      renderTeam();
    }
```

Replace with (adds a new function immediately after, same block):
```javascript
    function addMember(u) {
      if (selection.some(function(m) { return m.userId === u.userId; })) return;
      selection.push({ userId: u.userId, name: u.name, roleId: u.roleId });
      renderTeam();
    }

    var _roleSelectorSeq = 0; // rtri-s2: unique id suffix for each selector's <select>/<label> pair

    // rtri-s2 (AC7): replaces a roster row's "Add" button with a pod-role
    // selector (native <select>, matching this app's own labelled-control
    // convention) plus Confirm/Cancel. The selected value -- never
    // realRoster's own `role` field (a team permission role, a different
    // vocabulary) -- is what gets written to pod_members.role_id.
    function showRoleSelector(row, u, addBtn) {
      var selectId = 'pod-role-select-' + (_roleSelectorSeq++);

      var label = document.createElement('label');
      label.setAttribute('for', selectId);
      label.textContent = 'Pod role';
      label.className = 'role-selector-label';

      var select = document.createElement('select');
      select.id = selectId;
      VALID_ROLES.forEach(function(r) {
        var opt = document.createElement('option');
        opt.value = r;
        opt.textContent = r;
        select.appendChild(opt);
      });

      var confirmBtn = document.createElement('button');
      confirmBtn.className = 'add-btn';
      confirmBtn.textContent = 'Confirm';
      confirmBtn.onclick = function() {
        // AC7: the selector's own value is authoritative -- u.role (the
        // roster's team-permission role) is never read here.
        var memberToAdd = { userId: u.identity, name: u.identity, roleId: select.value };
        addMember(memberToAdd);
        renderRoster();
      };

      var cancelBtn = document.createElement('button');
      cancelBtn.className = 'remove-btn';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.onclick = function() {
        renderRoster(); // AC7: no selection change on cancel
      };

      row.removeChild(addBtn);
      row.appendChild(label);
      row.appendChild(select);
      row.appendChild(confirmBtn);
      row.appendChild(cancelBtn);
    }
```

**3c. Add a small CSS rule for the new label** (keeps the selector visually consistent with the existing minimal-UI bar). In the `<style>` block, find:
```css
    .add-btn, .remove-btn { font-size: 0.75rem; padding: 2px 8px; border: 1px solid #d0d0d5; border-radius: 6px; background: #fff; }
```

Replace with:
```css
    .add-btn, .remove-btn { font-size: 0.75rem; padding: 2px 8px; border: 1px solid #d0d0d5; border-radius: 6px; background: #fff; }
    .role-selector-label { font-size: 0.75rem; margin: 0 4px 0 8px; }
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rtri-s2-pod-manager-picker.js
```

Expected output: `[rtri-s2] 6 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same baseline (700 files, 1 pre-existing failure).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/public/pod-manager.html tests/check-rtri-s2-pod-manager-picker.js
git commit -m "feat(rtri-s2): add the AC7 pod-role selector on Add, replacing the temporary VALID_ROLES[0] stand-in"
```

---

## Task 3: Integration — AC2 (save), AC4 (cross-story), AC5 (search)

**Files:**
- Modify: `tests/check-rtri-s2-pod-manager-picker.js`

No production code changes — per the DoR contract, `POST /api/pods/create`/`pod-store.js` and `ep4-s1`'s collaborator-sourcing code are both unchanged by design (Architecture Constraints). This task adds 3 integration tests: one driving the full client-side save flow against the REAL `handlePostPodsCreate` handler (not re-implemented), one calling `ep4-s1`'s real `populateFeatureCollaboratorsFromPods` directly, and one exercising search-by-name against real identities.

- [ ] **Step 1: Write the failing tests**

Add these requires near the top of `tests/check-rtri-s2-pod-manager-picker.js`, immediately after the existing `var { JSDOM } = require('jsdom');` line:

```javascript
var { handlePostPodsCreate } = require(path.resolve(ROOT, 'src/web-ui/routes/pods.js'));
var { populateFeatureCollaboratorsFromPods } = require(path.resolve(ROOT, 'src/web-ui/modules/feature-collaborator-store.js'));
```

Add this narrow, self-contained fake pool for the pods/feature-collaborators domain, after the existing `mockFetchRosterOnly` function:

```javascript
// ── Narrow, self-contained in-memory fake pool for pods/pod_members/
// feature_collaborators -- mirrors pod-store.js's and
// feature-collaborator-store.js's own real query shapes exactly, matching
// this repo's established per-file fake-pool convention (see rtri-s1's own
// makeFakePool).
function makePodsFakePool() {
  var pods = []; // { pod_id, tenant_id, name, created_by }
  var podMembers = []; // { pod_id, user_id, role_id }
  var featureCollaborators = []; // { collaborator_id, feature_id, user_id, role_id, pod_id }
  var nextPodId = 1;

  function _norm(sql) {
    return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
  }

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];

    if (s.indexOf('SELECT POD_ID, NAME FROM PODS WHERE TENANT_ID') === 0) {
      var match = pods.filter(function(row) { return row.tenant_id === p[0] && row.name === p[1]; });
      return Promise.resolve({ rows: match.length ? [{ pod_id: match[0].pod_id, name: match[0].name }] : [] });
    }

    if (s.indexOf('INSERT INTO PODS') === 0) {
      pods.push({ pod_id: p[0], tenant_id: p[1], name: p[2], created_by: p[3] });
      return Promise.resolve({ rows: [] });
    }

    if (s.indexOf('INSERT INTO POD_MEMBERS') === 0) {
      podMembers.push({ pod_id: p[0], user_id: p[1], role_id: p[2] });
      return Promise.resolve({ rows: [] });
    }

    if (s.indexOf('SELECT USER_ID, ROLE_ID FROM POD_MEMBERS WHERE POD_ID') === 0) {
      var members = podMembers.filter(function(m) { return m.pod_id === p[0]; });
      return Promise.resolve({ rows: members.map(function(m) { return { user_id: m.user_id, role_id: m.role_id }; }) });
    }

    if (s.indexOf('SELECT COLLABORATOR_ID, USER_ID, ROLE_ID, POD_ID FROM FEATURE_COLLABORATORS WHERE FEATURE_ID') === 0) {
      var existing = featureCollaborators.filter(function(c) { return c.feature_id === p[0]; });
      return Promise.resolve({ rows: existing });
    }

    if (s.indexOf('SELECT USER_ID FROM FEATURE_COLLABORATOR_REMOVALS WHERE FEATURE_ID') === 0) {
      return Promise.resolve({ rows: [] }); // no removals in this fixture
    }

    if (s.indexOf('INSERT INTO FEATURE_COLLABORATORS') === 0) {
      featureCollaborators.push({ collaborator_id: p[0], feature_id: p[1], user_id: p[2], role_id: p[3], pod_id: p[4] });
      return Promise.resolve({ rows: [] });
    }

    console.warn('[fake-pool] unhandled query (returning empty rows): ' + s.slice(0, 160));
    return Promise.resolve({ rows: [] });
  }

  return {
    query: query,
    _state: function() { return { pods: pods, podMembers: podMembers, featureCollaborators: featureCollaborators }; }
  };
}

function makeFakeRes() {
  var r = { statusCode: null, body: '' };
  r.writeHead = function(code) { r.statusCode = code; };
  r.end = function(b) { r.body = b != null ? String(b) : ''; };
  return r;
}
```

Now add this test function, after `testAC7CancelDoesNotAddMember`:

```javascript
// ─────────────────────────────────────────────────────────────────────────────
// AC2 — saving with real members writes real identities and selected pod
// roles to pod_members
// ─────────────────────────────────────────────────────────────────────────────

async function testAC2SavesRealIdentitiesAndSelectedRoles() {
  var pool = makePodsFakePool();

  var win = buildPage(function(url, opts) {
    if (url === '/api/team/members') {
      return Promise.resolve({ json: function() {
        return Promise.resolve({ members: [
          { identity: 'alice@example.com', role: 'admin' },
          { identity: 'bob-gh', role: 'viewer' }
        ] });
      } });
    }
    if (url === '/api/pods/create') {
      var body = JSON.parse(opts.body);
      var req = { session: { tenantId: 'acme', userId: 'me-uuid' } };
      var res = makeFakeRes();
      return handlePostPodsCreate(req, res, pool, body).then(function() {
        return { status: res.statusCode, json: function() { return Promise.resolve(JSON.parse(res.body)); } };
      });
    }
    return Promise.reject(new Error('unexpected fetch: ' + url));
  });

  await win.openModal();

  // Add alice as 'engineer' (not her roster role 'admin')
  win.document.querySelector('#available-roster .add-btn').onclick();
  win.document.querySelector('#available-roster select').value = 'engineer';
  win.document.querySelector('#available-roster .add-btn').onclick();

  // Add bob as 'architect' (not his roster role 'viewer')
  var bobAddBtn = win.document.querySelectorAll('#available-roster .add-btn')[1];
  bobAddBtn.onclick();
  win.document.querySelector('#available-roster select').value = 'architect';
  win.document.querySelector('#available-roster .add-btn').onclick();

  win.document.getElementById('pod-name-input').value = 'Core Platform';
  await win.saveBtn.onclick();

  var state = pool._state();
  assert.strictEqual(state.podMembers.length, 3, 'AC2: 3 pod_members rows written (creator + 2 real members)');
  var alice = state.podMembers.filter(function(m) { return m.user_id === 'alice@example.com'; })[0];
  var bob = state.podMembers.filter(function(m) { return m.user_id === 'bob-gh'; })[0];
  assert.ok(alice, 'AC2: alice\'s real identity is a pod_members.user_id value');
  assert.strictEqual(alice.role_id, 'engineer', 'AC2: alice\'s SELECTED pod role (engineer), not her roster role (admin)');
  assert.ok(bob, 'AC2: bob\'s real identity is a pod_members.user_id value');
  assert.strictEqual(bob.role_id, 'architect', 'AC2: bob\'s SELECTED pod role (architect), not his roster role (viewer)');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — a pod created with real members flows unchanged into
// feature_collaborators via ep4-s1
// ─────────────────────────────────────────────────────────────────────────────

async function testAC4FlowsIntoFeatureCollaboratorsUnchanged() {
  var pool = makePodsFakePool();

  // Seed a pod with 2 real-identity pod_members rows directly (AC2's own
  // save path is already proven above; this test starts from its outcome).
  await pool.query('INSERT INTO pods (pod_id, tenant_id, name, created_by) VALUES ($1, $2, $3, $4)', ['pod-1', 'acme', 'Core Platform', 'me-uuid']);
  await pool.query('INSERT INTO pod_members (pod_id, user_id, role_id) VALUES ($1, $2, $3)', ['pod-1', 'alice@example.com', 'engineer']);
  await pool.query('INSERT INTO pod_members (pod_id, user_id, role_id) VALUES ($1, $2, $3)', ['pod-1', 'bob-gh', 'architect']);

  // Call ep4-s1's own real, unmodified pod-assignment write path directly --
  // the same function the "Assign pods" UI calls.
  var result = await populateFeatureCollaboratorsFromPods(pool, { featureId: 'feature-1', podIds: ['pod-1'] });

  assert.strictEqual(result.addedCount, 2, 'AC4: both real members flowed through');
  var state = pool._state();
  var collaboratorUserIds = state.featureCollaborators.filter(function(c) { return c.feature_id === 'feature-1'; }).map(function(c) { return c.user_id; });
  assert.ok(collaboratorUserIds.indexOf('alice@example.com') !== -1, 'AC4: alice\'s real identity is a feature_collaborators.user_id value');
  assert.ok(collaboratorUserIds.indexOf('bob-gh') !== -1, 'AC4: bob\'s real identity is a feature_collaborators.user_id value');
  // Zero new code needed in ep4-s1's own module -- proven by calling its
  // real, unmodified function directly and getting the right result.
}

// ─────────────────────────────────────────────────────────────────────────────
// AC5 (search half) — search-by-name continues to filter real identities
// ─────────────────────────────────────────────────────────────────────────────

async function testAC5SearchFiltersRealIdentities() {
  var win = buildPage(mockFetchRosterOnly([
    { identity: 'alice@example.com', role: 'engineer' },
    { identity: 'alison@example.com', role: 'engineer' },
    { identity: 'bob-gh', role: 'admin' }
  ]));

  await win.openModal();

  win.document.getElementById('roster-search').value = 'ali';
  win.document.getElementById('roster-search').oninput();

  var text = win.document.getElementById('available-roster').textContent;
  assert.ok(text.indexOf('alice@example.com') !== -1, 'AC5: alice@example.com matches "ali"');
  assert.ok(text.indexOf('alison@example.com') !== -1, 'AC5: alison@example.com matches "ali"');
  assert.ok(text.indexOf('bob-gh') === -1, 'AC5: bob-gh does not match "ali" and is filtered out');
}
```

Add the calls to `main()`, right after the AC7 blocks and before the summary line:

```javascript
  console.log('\nAC2 — saves real identities and selected roles');
  await test('AC2: saving with real members writes real identities and selected pod roles to pod_members', testAC2SavesRealIdentitiesAndSelectedRoles);

  console.log('\nAC4 — flows into feature_collaborators via ep4-s1');
  await test('AC4: a pod created with real members flows unchanged into feature_collaborators via ep4-s1', testAC4FlowsIntoFeatureCollaboratorsUnchanged);

  console.log('\nAC5 (search half) — filters real identities');
  await test('AC5: search-by-name continues to filter real identities correctly', testAC5SearchFiltersRealIdentities);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rtri-s2-pod-manager-picker.js
```

Expected output: the 3 new tests fail or error — `handlePostPodsCreate`/`populateFeatureCollaboratorsFromPods` are real, already-shipped functions, so these tests should mostly just work already (Tasks 1-2 built everything they depend on), but run this step for real red/green discipline; if any of the 3 unexpectedly already pass before you'd expect, investigate why rather than assuming it's fine.

- [ ] **Step 3: (no implementation step needed — Tasks 1-2 already provide all the client-side code; `handlePostPodsCreate` and `populateFeatureCollaboratorsFromPods` are real, pre-existing, unmodified functions)**

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rtri-s2-pod-manager-picker.js
```

Expected output: `[rtri-s2] 9 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same baseline (700 files, 1 pre-existing failure). Pay particular attention to any other test file exercising `routes/pods.js` or `feature-collaborator-store.js` directly (e.g. `tests/check-ep1-s1*.js`, `tests/check-ep4-s1*.js`) — this task calls their real functions but must not modify their behaviour.

- [ ] **Step 6: Commit**

```bash
git add tests/check-rtri-s2-pod-manager-picker.js
git commit -m "test(rtri-s2): integration coverage for AC2 (save), AC4 (ep4-s1 cross-story), AC5 (search)"
```

---

## Final check before /verify-completion

- [ ] All 9 tests in `tests/check-rtri-s2-pod-manager-picker.js` pass
- [ ] `node scripts/run-all-tests.js` shows no NEW failures beyond the acknowledged baseline
- [ ] Walk through `artefacts/2026-09-23-team-roster-integration/verification-scripts/rtri-s2-verification.md` manually (live server, real sign-in) before opening the PR
- [ ] Given this feature's own established practice, consider a real live check on `wuce-staging.fly.dev` once deployed — the picker's real-data behaviour (including the AC7 role-selector flow) has never been visually confirmed in a real browser
