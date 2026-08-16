# Fix affordance mismatch on the sign-out control and theme-toggle button — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/nia-s1`
**Worktree:** `.worktrees/nia-s1`
**Test command:** `npm test`

---

## File map

```
Create:
  tests/check-nia-s1-nav-icon-affordance.js  — unit tests for AC1-AC4

Modify:
  src/web-ui/utils/html-shell.js  — renderSidebar's .sw-signout element (visible
                                     label + confirm() gate), renderShell's
                                     themeToggle constant (sun/moon icon pair),
                                     DESIGN_SYSTEM_CSS (supporting CSS for both)
```

---

## Task 1: Sign-out control — visible label + confirmation gate (AC1, AC2)

**Files:**
- Modify: `src/web-ui/utils/html-shell.js`
- Test: `tests/check-nia-s1-nav-icon-affordance.js` (create)

- [x] **Step 1: Write the failing test**

Create `tests/check-nia-s1-nav-icon-affordance.js`:

```javascript
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
    assert.ok(/class="sw-theme-toggle-icon--light"/.test(sidebarHtml), 'expected a light-mode icon element');
    assert.ok(/class="sw-theme-toggle-icon--dark"/.test(sidebarHtml), 'expected a dark-mode icon element');
    assert.ok(/\[data-theme="dark"\][^{]*\.sw-theme-toggle-icon/.test(sidebarHtml) || /\.sw-theme-toggle-icon--dark\s*\{[^}]*display:\s*none/.test(sidebarHtml),
      'expected [data-theme="dark"] CSS gating referencing the theme toggle icon classes');
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
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-nia-s1-nav-icon-affordance.js
```

Expected output: `AC1` and `AC2` FAIL (no "Sign out" text node exists yet, no `onclick`/`confirm(` on `.sw-signout` yet); `AC3`/`AC4` also FAIL at this point since the file hasn't been touched yet (write the whole test file up front per this plan, all 4 assertions fail together on the unmodified source).

- [x] **Step 3: Write minimal implementation**

In `src/web-ui/utils/html-shell.js`'s `renderSidebar`, replace:

```javascript
'<a class="sw-signout" href="/auth/logout" title="Sign out">↗</a>',
```

with:

```javascript
'<a class="sw-signout" href="/auth/logout" title="Sign out" onclick="return confirm(\'Sign out of wuce?\')">' +
  '<span class="sw-signout-icon" aria-hidden="true">↗</span>' +
  '<span class="sw-signout-label">Sign out</span>' +
'</a>',
```

In `DESIGN_SYSTEM_CSS`, replace:

```css
.sw-signout { margin-left: auto; color: var(--muted-2); text-decoration: none; }
.sw-signout:hover { color: var(--ink-2); }
```

with:

```css
.sw-signout {
  margin-left: auto; display: inline-flex; align-items: center; gap: 4px;
  color: var(--muted-2); text-decoration: none; font-size: 12px;
}
.sw-signout:hover { color: var(--ink-2); }
.sw-signout-icon { font-size: 12px; line-height: 1; }
```

(`.sw-sidebar--collapsed .sw-signout { display:none; }` already exists and needs no change — collapsed sidebar still hides the whole control, unaffected by this story.)

- [x] **Step 4: Run test — AC1/AC2 must pass (AC3/AC4 still fail, untouched by this task)**

```bash
node tests/check-nia-s1-nav-icon-affordance.js
```

Expected output: `AC1` and `AC2` PASS; `AC3`/`AC4` still FAIL (theme toggle untouched until Task 2).

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same pre-existing failures as the branch-setup baseline (see `decisions.md`'s branch-setup RISK-ACCEPT entry for the exact count/file list observed at worktree creation), plus 2/4 new tests passing so far in `check-nia-s1-nav-icon-affordance.js` (AC3/AC4 expected-fail until Task 2). Specifically re-check `tests/check-b2-account-nav.js` (asserts `html.includes('/auth/logout')`) still passes — it does, since `href="/auth/logout"` is unchanged.

- [x] **Step 6: Commit**

```bash
git add src/web-ui/utils/html-shell.js tests/check-nia-s1-nav-icon-affordance.js
git commit -m "fix: add visible label and confirm() gate to sidebar sign-out control"
```

---

## Task 2: Theme-toggle button — replace ambiguous glyph with CSS-gated sun/moon icon pair (AC3, AC4)

**Files:**
- Modify: `src/web-ui/utils/html-shell.js`
- Test: `tests/check-nia-s1-nav-icon-affordance.js` (already written in Task 1; this task makes AC3/AC4 pass)

- [x] **Step 1: (test already written in Task 1 — re-run to confirm AC3/AC4 currently fail)**

```bash
node tests/check-nia-s1-nav-icon-affordance.js
```

Expected output: `AC3: theme toggle no longer renders ◑...` FAIL (glyph still present); `AC4: theme toggle class/onclick/aria-label unchanged...` FAIL (no icon-class elements exist yet to check gating against, though the button attributes themselves already match — the assertion on `sw-theme-toggle-icon` classes in AC3 is the blocking one).

- [x] **Step 2: Write minimal implementation**

In `src/web-ui/utils/html-shell.js`'s `renderShell`, replace:

```javascript
const themeToggle =
  '<button class="sw-theme-toggle" onclick="swToggleTheme()" aria-label="Toggle dark mode" title="Toggle dark/light mode">◑</button>';
```

with:

```javascript
const themeToggle =
  '<button class="sw-theme-toggle" onclick="swToggleTheme()" aria-label="Toggle dark mode" title="Toggle dark/light mode">' +
    '<span class="sw-theme-toggle-icon sw-theme-toggle-icon--light" aria-hidden="true">☀</span>' +
    '<span class="sw-theme-toggle-icon sw-theme-toggle-icon--dark" aria-hidden="true">☾</span>' +
  '</button>';
```

(`☀` = ☀ sun, `☾` = ☾ moon — written as escapes to avoid any source-encoding ambiguity, matching how other non-ASCII glyphs in this file are written as literal characters elsewhere; either literal or escape form is acceptable as long as the rendered output is correct.)

In `DESIGN_SYSTEM_CSS`, directly after the existing `.sw-theme-toggle:hover { ... }` rule, add:

```css
.sw-theme-toggle-icon--dark { display: none; }
[data-theme="dark"] .sw-theme-toggle-icon--light { display: none; }
[data-theme="dark"] .sw-theme-toggle-icon--dark { display: inline; }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not([data-theme="dark"]) .sw-theme-toggle-icon--light { display: none; }
  :root:not([data-theme="light"]):not([data-theme="dark"]) .sw-theme-toggle-icon--dark { display: inline; }
}
```

This mirrors the exact existing color-token pattern in `DESIGN_SYSTEM_CSS` (`[data-theme="dark"] { ... }` plus the `@media (prefers-color-scheme: dark) { :root:not(...):not(...) { ... } }` no-JS fallback) — no changes to `SHELL_JS`'s `swToggleTheme` function are needed, since it already sets `data-theme` on `<html>`, which these new CSS rules key off directly.

- [x] **Step 3: Run test — all 4 ACs must pass**

```bash
node tests/check-nia-s1-nav-icon-affordance.js
```

Expected output: `4 passed, 0 failed`

- [x] **Step 4: Run full suite — no regressions**

```bash
npm test
```

Expected output: same pre-existing failures as the branch-setup baseline, plus `check-nia-s1-nav-icon-affordance.js` passing (4/4). Specifically re-check `tests/check-acps-s1-admin-credits-shell.js` (asserts `res._body.includes('sw-theme-toggle')`) still passes — it does, since `class="sw-theme-toggle"` is unchanged on the outer button. No new failures beyond baseline.

- [x] **Step 5: Commit**

```bash
git add src/web-ui/utils/html-shell.js tests/check-nia-s1-nav-icon-affordance.js
git commit -m "fix: replace ambiguous theme-toggle glyph with CSS-gated sun/moon icon pair"
```

---

## Task 3: Open draft PR

- [x] **Step 1:** Confirm all 4 unit tests pass and the full suite shows only the known pre-existing baseline failures (no new ones).
- [ ] **Step 2:** Push the branch and open a draft PR (handled by `/branch-complete`, not this plan).
