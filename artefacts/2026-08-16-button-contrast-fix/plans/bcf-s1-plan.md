# Fix dark-mode (and light-mode) button contrast bug on the Products page — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/bcf-s1`
**Worktree:** `.worktrees/bcf-s1`
**Test command:** `npm test`

---

## File map

```
Create:
  tests/check-bcf-s1-button-contrast.js  — unit tests for AC1-AC4

Modify:
  src/web-ui/routes/products.js  — 11 inline style `color:var(--accent-ink)`
                                     -> `color:#fff` value changes only
```

---

## Task 1: Write the failing test, then fix all 11 instances (AC1–AC4)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-bcf-s1-button-contrast.js` (create)

This is a single mechanical task (one property value, 11 known locations, no design
ambiguity) — unlike `nia-s1`'s two-task split (which had two independently-designed
fixes), there is no natural sub-slice here; all 4 ACs are verified together.

- [ ] **Step 1: Snapshot pre-fix reference strings**

Before writing the test, re-verify current line numbers and capture exact pre-fix
style strings for AC2/AC3's regression baselines:

```bash
grep -n "var(--accent)" src/web-ui/routes/products.js
```

Confirm the 11 buggy lines match (approximately) the triage's line numbers, and note
the exact full `style="..."` string for: `Designate` (~1168), `Save` (~1312), the
progress-bar-fill div (~605), and the plain text-only links (`Edit`, `Add`,
`Connect a repo`, `Request promotion`, `Approve`, pending-review badge, approved span,
`.pvc-tab:focus-visible`). These become the AC2/AC3 test's "must remain unchanged"
snapshot values.

- [ ] **Step 2: Write the failing test**

Create `tests/check-bcf-s1-button-contrast.js`:

```javascript
#!/usr/bin/env node
// check-bcf-s1-button-contrast.js — AC verification tests for bcf-s1
// (Fix dark-mode (and light-mode) button contrast bug on the Products page),
// story artefacts/2026-08-16-button-contrast-fix/stories/bcf-s1-fix-button-contrast.md
//
// AC1: 11 identified button/link elements have color:#fff (not
//      color:var(--accent-ink)) alongside background:var(--accent)
// AC2: Designate/Save buttons' styles remain byte-for-byte unchanged
// AC3: plain text-only accent links and the progress-bar-fill div are untouched
// AC4: computed WCAG contrast ratio of #fff on --accent meets the measured
//      target in both light and dark mode
//
// Follows this repo's hand-rolled test()/assert convention (see
// tests/check-b2-account-nav.js) — no Jest/Mocha, Node.js built-ins only.

'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var PRODUCTS_PATH   = path.resolve(__dirname, '../src/web-ui/routes/products.js');
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

// WCAG relative-luminance contrast ratio, computed directly from hex values —
// no external dependency.
function srgbToLinear(c) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function relLuminance(hex) {
  hex = hex.replace('#', '');
  var r = parseInt(hex.slice(0, 2), 16);
  var g = parseInt(hex.slice(2, 4), 16);
  var b = parseInt(hex.slice(4, 6), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}
function contrastRatio(hex1, hex2) {
  var l1 = relLuminance(hex1), l2 = relLuminance(hex2);
  var lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function main() {
  var productsSrc = fs.readFileSync(PRODUCTS_PATH, 'utf8');
  var shellSrc = fs.readFileSync(HTML_SHELL_PATH, 'utf8');

  var LABELS = [
    'Create your first product', 'New product', 'Generate context files',
    'Confirm and create product', 'Add module', 'Select', 'Connect',
    'Create new repo', 'Create', 'New feature', 'Start'
  ];

  // ── AC1 ──────────────────────────────────────────────────────────────────
  test('AC1: all 11 identified buttons/links use color:#fff, not color:var(--accent-ink)', function() {
    assert.strictEqual(
      productsSrc.indexOf('color:var(--accent-ink)'), -1,
      'expected zero remaining color:var(--accent-ink) occurrences in products.js'
    );
    // Count background:var(--accent) + color:#fff pairings inside a single
    // style attribute — expect at least the 11 fixed buttons plus the 2
    // pre-existing Designate/Save reference buttons (13 total). The
    // progress-bar-fill div (opacity:-styled, no `color` property at all —
    // not a text element) also matches `background:var(--accent)` but is
    // explicitly excluded here, since it is not part of this story's AC1
    // claim (covered separately by AC3's "untouched" check).
    var styleAttrRe = /style="[^"]*background:var\(--accent\)[^"]*"/g;
    var matches = productsSrc.match(styleAttrRe) || [];
    var textElements = matches.filter(function(m) { return m.indexOf('opacity:') === -1; });
    var accentBgCount = textElements.length;
    var whiteTextCount = textElements.filter(function(m) { return m.indexOf('color:#fff') !== -1; }).length;
    assert.ok(accentBgCount >= 13, 'expected at least 13 background:var(--accent) text-element style attributes, found ' + accentBgCount);
    assert.strictEqual(whiteTextCount, accentBgCount, 'expected every background:var(--accent) text-element style attribute to also use color:#fff, got ' + whiteTextCount + '/' + accentBgCount);
  });

  // ── AC2 ──────────────────────────────────────────────────────────────────
  test('AC2: Designate and Save buttons remain unchanged (reference pattern)', function() {
    assert.ok(/background:var\(--accent\);color:#fff;font-size:13px;cursor:pointer">Designate</.test(productsSrc),
      'expected Designate button style unchanged');
    assert.ok(/background:var\(--accent\);color:#fff;font-size:14px;cursor:pointer">Save</.test(productsSrc),
      'expected Save button style unchanged');
  });

  // ── AC3 ──────────────────────────────────────────────────────────────────
  test('AC3: plain text-only accent links and the progress-bar-fill div are untouched', function() {
    // Text-only links: color:var(--accent) with no FILLED accent background in the
    // same attribute. Note: `background:none` (e.g. the "Approve"/"Request promotion"
    // buttons) is explicitly allowed here — it means "no visible background box," the
    // same "text-only" pattern as links with no background property at all. Only
    // `background:var(--accent)` (the actual buggy filled-background pattern) is
    // disqualifying.
    var textLinkRe = /style="[^"]*color:var\(--accent\)[^"]*"/g;
    var textLinkMatches = productsSrc.match(textLinkRe) || [];
    var withFilledAccentBackground = textLinkMatches.filter(function(m) { return m.indexOf('background:var(--accent)') !== -1; });
    assert.strictEqual(withFilledAccentBackground.length, 0, 'expected no text-only accent-color style attribute to also carry a filled background:var(--accent)');
    // Progress-bar-fill div: background:var(--accent) + opacity, no color property.
    assert.ok(/background:var\(--accent\);opacity:/.test(productsSrc), 'expected the progress-bar-fill div style to be present and unchanged');
  });

  // ── AC4 ──────────────────────────────────────────────────────────────────
  test('AC4: computed contrast ratio of #fff on --accent matches the measured target in both themes', function() {
    var lightAccentMatch = /:root\s*\{[^}]*--accent:\s*(#[0-9A-Fa-f]{6});/.exec(shellSrc);
    var darkAccentMatch = /\[data-theme="dark"\]\s*\{[^}]*--accent:\s*(#[0-9A-Fa-f]{6});/.exec(shellSrc);
    assert.ok(lightAccentMatch, 'expected to find light-mode --accent token');
    assert.ok(darkAccentMatch, 'expected to find dark-mode --accent token');

    var lightRatio = contrastRatio(lightAccentMatch[1], '#FFFFFF');
    var darkRatio = contrastRatio(darkAccentMatch[1], '#FFFFFF');

    assert.ok(Math.abs(lightRatio - 6.29) < 0.05, 'expected light-mode contrast ~6.29:1, got ' + lightRatio.toFixed(2));
    assert.ok(Math.abs(darkRatio - 4.47) < 0.05, 'expected dark-mode contrast ~4.47:1, got ' + darkRatio.toFixed(2));
  });

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
}

main();
```

- [ ] **Step 3: Run test — AC1/AC3 must fail (AC2/AC4 pass, unaffected by the bug)**

```bash
node tests/check-bcf-s1-button-contrast.js
```

Expected: `AC1` FAILs (11 `color:var(--accent-ink)` instances still present); `AC2` PASSes
(Designate/Save already correct, untouched by anything so far); `AC3` PASSes (no
text-only link ever had a background — this AC was never broken, it's a regression
guard); `AC4` PASSes (this AC only tests the token values themselves, which are
unaffected by the products.js bug — it's asserting a fact about `html-shell.js`, not
about the fix).

- [ ] **Step 4: Write minimal implementation**

In `src/web-ui/routes/products.js`, replace each of the 11 occurrences of
`color:var(--accent-ink)` with `color:#fff`. Every occurrence is inside a style
attribute that also contains `background:var(--accent)` — do not touch any other
character in these style strings. The safest mechanical approach: since every one of
the 11 buggy lines pairs `background:var(--accent)` immediately followed by
`color:var(--accent-ink)`, a literal string replace of
`background:var(--accent);color:var(--accent-ink)` → `background:var(--accent);color:#fff`
across the file is exact and non-ambiguous (re-verify with the Step 1 grep that this
exact substring appears exactly 11 times before relying on a global replace — if any
instance has different spacing/ordering, handle it individually instead).

- [ ] **Step 5: Run test — all 4 ACs must pass**

```bash
node tests/check-bcf-s1-button-contrast.js
```

Expected output: `4 passed, 0 failed`

- [ ] **Step 6: Run full suite — no regressions**

```bash
npm test
```

Expected output: same pre-existing failures as the branch-setup baseline (see
`decisions.md`'s branch-setup RISK-ACCEPT entry for the exact count/file list observed
at worktree creation), plus `check-bcf-s1-button-contrast.js` passing (4/4). Specifically
re-check any existing test that touches `products.js` (if any are found via
`grep -rl "products.js" tests/` during Step 1) still passes.

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-bcf-s1-button-contrast.js
git commit -m "fix: correct dark/light-mode button contrast on Products page (accent-ink -> #fff)"
```

---

## Task 2: Open draft PR

- [ ] **Step 1:** Confirm the 4 unit tests pass and the full suite shows only the known pre-existing baseline failures (no new ones).
- [ ] **Step 2:** Push the branch and open a draft PR (handled by `/branch-complete`, not this plan).
