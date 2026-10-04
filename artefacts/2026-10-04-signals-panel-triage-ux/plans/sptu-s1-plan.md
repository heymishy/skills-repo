# Add `/signals` to the main navigation — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/sptu-s1`
**Worktree:** `.worktrees/sptu-s1`
**Test command:** `node tests/check-sptu-s1-signals-nav.js` (single file); `npm test` (full suite)

---

## File map

```
Create:
  tests/check-sptu-s1-signals-nav.js   — 4 AC tests for the new nav entry (unit-level, via the real renderShell/NAV_ITEMS)

Modify:
  src/web-ui/utils/html-shell.js       — add one entry to NAV_ITEMS: { id: 'signals', label: 'Signals', href: '/signals', icon: '◎' }
```

---

## Task 1: Write failing tests for the Signals nav entry (AC1–AC4)

**Files:**
- Create: `tests/check-sptu-s1-signals-nav.js`

- [ ] **Step 1: Write the failing test file**

```javascript
#!/usr/bin/env node
/**
 * check-sptu-s1-signals-nav.js -- AC verification for sptu-s1
 * (add /signals to the main navigation).
 *
 * Story: artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s1.md
 * Test plan: artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s1-test-plan.md
 *
 * Run: node tests/check-sptu-s1-signals-nav.js
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HTML_SHELL_PATH = path.join(ROOT, 'src/web-ui/utils/html-shell.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++; console.log('  ✓ ' + name);
  } catch (err) {
    failed++; console.log('  ✗ ' + name + ' -- ' + (err && err.message || err));
  }
}

// Mirrors check-b2-account-nav.js's own pathRegisteredInServer helper exactly
// (kept local rather than extracted into a shared module, matching that
// file's own precedent of not touching an already-merged, working test file).
function pathRegisteredInServer(pathname, serverSrc) {
  return serverSrc.indexOf("pathname === '" + pathname + "'") !== -1 ||
         serverSrc.indexOf('pathname === "' + pathname + '"') !== -1;
}

function extractMainNav(html) {
  const start = html.indexOf('<nav aria-label="Main navigation">');
  const end = html.indexOf('</nav>', start);
  return html.slice(start, end);
}

(function main() {
  const shell = require(HTML_SHELL_PATH);

  test('AC1: renderShell includes a "Signals" nav row linking to /signals, in the main section', function() {
    const html = shell.renderShell({ title: 'T', bodyContent: '<p>x</p>', user: { login: 'testuser' }, active: 'org-kanban' });
    const mainNav = extractMainNav(html);
    assert.ok(mainNav.includes('href="/signals"'), 'expected href="/signals" inside the main navigation section');
    assert.ok(mainNav.includes('>Signals<'), 'expected visible "Signals" text inside the main navigation section');
  });

  test('AC2: the Signals row (and only the Signals row) is active when active="signals"', function() {
    const html = shell.renderShell({ title: 'T', bodyContent: '<p>x</p>', user: { login: 'testuser' }, active: 'signals' });
    const signalsLinkMatch = html.match(/<a href="\/signals"[^>]*>/);
    assert.ok(signalsLinkMatch, 'expected a /signals link in the rendered sidebar');
    assert.ok(signalsLinkMatch[0].includes('sw-nav-item--active'), 'expected the /signals link to carry sw-nav-item--active');

    const orgKanbanMatch = html.match(/<a href="\/org\/kanban"[^>]*>/);
    assert.ok(orgKanbanMatch, 'expected an /org/kanban link in the rendered sidebar');
    assert.ok(!orgKanbanMatch[0].includes('sw-nav-item--active'), 'expected /org/kanban to NOT be active when active="signals"');
  });

  test('AC3: zero dangling NAV_ITEMS entries after the new Signals row is added', function() {
    const serverSrc = fs.readFileSync(path.join(ROOT, 'src/web-ui/server.js'), 'utf8');
    const unresolved = shell.NAV_ITEMS.filter(function(item) {
      return !pathRegisteredInServer(item.href.split('?')[0], serverSrc);
    });
    assert.strictEqual(unresolved.length, 0,
      'unresolved NAV_ITEMS hrefs: ' + unresolved.map(function(i) { return i.href; }).join(', '));
  });

  test('AC4: the Signals nav link has no tabindex override', function() {
    const html = shell.renderShell({ title: 'T', bodyContent: '<p>x</p>', user: { login: 'testuser' }, active: 'org-kanban' });
    const signalsLinkMatch = html.match(/<a href="\/signals"[^>]*>/);
    assert.ok(signalsLinkMatch, 'expected a /signals link in the rendered sidebar');
    assert.ok(!signalsLinkMatch[0].includes('tabindex'), 'expected no tabindex override on the Signals nav link');
  });

  console.log('\n[sptu-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-sptu-s1-signals-nav.js
```

Expected output:
```
  ✗ AC1: renderShell includes a "Signals" nav row linking to /signals, in the main section -- expected href="/signals" inside the main navigation section
  ✗ AC2: the Signals row (and only the Signals row) is active when active="signals" -- expected a /signals link in the rendered sidebar
  ✓ AC3: zero dangling NAV_ITEMS entries after the new Signals row is added
  ✗ AC4: the Signals nav link has no tabindex override -- expected a /signals link in the rendered sidebar

[sptu-s1] Results: 1 passed, 3 failed
```
(AC3 passes trivially before the change — there's no new entry yet to be dangling. AC1/AC2/AC4 fail because no `/signals` link exists yet.)

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/check-sptu-s1-signals-nav.js
git commit -m "test: add failing AC1-AC4 tests for the signals nav entry (sptu-s1)"
```

---

## Task 2: Add the Signals entry to NAV_ITEMS

**Files:**
- Modify: `src/web-ui/utils/html-shell.js`

- [ ] **Step 1: Write the implementation**

In `src/web-ui/utils/html-shell.js`, inside the `NAV_ITEMS` array (currently lines 54-78), add a new entry immediately after the `pod-manager` entry and before the `b2:` comment that introduces the account-level items:

```javascript
  { id: 'pod-manager', label: 'Pod Manager', href: '/admin/pods/manager', icon: '⬡' },
  // sptu-s1: /signals (ep2-s1) shipped with no nav entry at all -- the route
  // already passes active: 'signals' to renderShell (signals-panel.js:39),
  // anticipating this row. Same "API shipped, UI never wired" gap as
  // pod-manager/admin-mock-gateway before their own fix. authGuard-only
  // route (no requireAdmin), tenant/workspace-wide, so this lives in the
  // main section, not the account-settings section below.
  { id: 'signals', label: 'Signals', href: '/signals', icon: '◎' },
  // b2: account-level items, rendered in a visually distinct bottom section by
```

(The last line above is the existing comment immediately preceding the `settings` entry — shown only to anchor the insertion point exactly; do not duplicate it.)

- [ ] **Step 2: Run test — must pass**

```bash
node tests/check-sptu-s1-signals-nav.js
```

Expected output:
```
  ✓ AC1: renderShell includes a "Signals" nav row linking to /signals, in the main section
  ✓ AC2: the Signals row (and only the Signals row) is active when active="signals"
  ✓ AC3: zero dangling NAV_ITEMS entries after the new Signals row is added
  ✓ AC4: the Signals nav link has no tabindex override

[sptu-s1] Results: 4 passed, 0 failed
```

- [ ] **Step 3: Run the existing dangling-link regression suite — must still pass**

```bash
node tests/check-b2-account-nav.js
```

Expected output: all existing tests in that file still pass (the new entry resolves cleanly, same as every pre-existing entry).

- [ ] **Step 4: Run full suite — no regressions**

```bash
npm test
```

Expected output: same result as the `/branch-setup` baseline (712 files; the one pre-existing `tests/check-p3.5-validate-trace.js` failure, RISK-ACCEPTed in `decisions.md`, 2026-10-04 — no NEW failures introduced).

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/utils/html-shell.js
git commit -m "feat: add /signals to the main sidebar navigation (sptu-s1)"
```
