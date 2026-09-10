# Collapse the always-expanded "Ref docs" context manifest into a single summary indicator — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Wrap `buildContextManifestHtml()`'s existing, unchanged per-file chip output in a native `<details>` element, collapsed by default, with a `<summary>` line reflecting file count and warning state — so the context panel no longer permanently occupies vertical space with a file-by-file list.
**Branch:** `feature/wnl-s1`
**Worktree:** `.worktrees/wnl-s1`
**Test command:** `npm test` (unit/integration, `scripts/run-all-tests.js`)

---

## File map

```
Create:
  tests/check-wnl-s1-context-manifest-collapse.js  — 7 new unit tests for the collapse/expand behaviour

Modify:
  src/web-ui/routes/skills.js  — buildContextManifestHtml() (~line 2680): wrap existing chip output in <details>/<summary>
```

---

## Task 1: AC1/AC2/AC3/AC5 — collapsed-by-default, unchanged chip content on expand, native toggle

**Files:**
- Modify: `src/web-ui/routes/skills.js`
- Create: `tests/check-wnl-s1-context-manifest-collapse.js`

- [x] **Step 1: Write the failing tests**

```javascript
// tests/check-wnl-s1-context-manifest-collapse.js
'use strict';

// check-wnl-s1-context-manifest-collapse.js
// Tests for wnl-s1 — collapsed-by-default context manifest summary.
// All output lines are prefixed with [wnl-s1].

const { buildContextManifestHtml } = require('../src/web-ui/routes/skills');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log('[wnl-s1] PASS:', label);
    passed++;
  } else {
    console.error('[wnl-s1] FAIL:', label);
    failed++;
  }
}

// T1: collapsed-by-default-all-loaded
(function() {
  const html = buildContextManifestHtml([
    { path: 'a.md', status: 'ok' },
    { path: 'b.md', status: 'ok' },
    { path: 'c.md', status: 'ok' }
  ]);
  assert(/<details[^>]*id="context-manifest"/.test(html), 'T1: <details id="context-manifest"> present');
  assert(!/<details[^>]*\bopen\b/.test(html.match(/<details[^>]*>/)[0]), 'T1: <details> has no open attribute (collapsed by default)');
  assert(html.includes('Context loaded (3 files)'), 'T1: summary reflects 3-file count');
})();

// T2: collapsed-summary-reflects-exact-file-count (singular/plural)
(function() {
  const html1 = buildContextManifestHtml([{ path: 'a.md', status: 'ok' }]);
  assert(html1.includes('Context loaded (1 file)') && !html1.includes('(1 files)'), 'T2: singular "1 file"');
  const html5 = buildContextManifestHtml([1,2,3,4,5].map(function(i) { return { path: 'f' + i + '.md', status: 'ok' }; }));
  assert(html5.includes('Context loaded (5 files)'), 'T2: plural "5 files"');
})();

// T3: expand-reveals-unchanged-chip-list
(function() {
  const files = [
    { path: 'product/mission.md', status: 'ok' },
    { path: 'product/tech-stack.md', status: 'ok' }
  ];
  const html = buildContextManifestHtml(files);
  const chipCount = (html.match(/class="chip-ok"/g) || []).length;
  assert(chipCount === 2, 'T3: two chip-ok elements present inside the details body (got ' + chipCount + ')');
  assert(html.includes('mission.md') && html.includes('tech-stack.md'), 'T3: both basenames present');
})();

// T4: native-details-element-present-not-custom-js
(function() {
  const html = buildContextManifestHtml([{ path: 'a.md', status: 'ok' }]);
  assert(html.includes('<details'), 'T4: real <details> element used');
  assert(!html.includes('<script>'), 'T4: no custom <script> toggle logic added');
  assert(!/onclick=/.test(html), 'T4: no onclick handler added');
})();

// T5: warning-cue-visible-without-expanding
(function() {
  const html = buildContextManifestHtml([
    { path: 'a.md', status: 'ok' },
    { path: 'b.md', status: 'ok' },
    { path: 'c.md', status: 'ok' },
    { path: 'd.md', status: 'ok' },
    { path: 'e.md', status: 'warn' }
  ]);
  const summaryMatch = html.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
  assert(summaryMatch, 'T5: summary element found');
  const summaryText = summaryMatch[1];
  assert(summaryText.includes('4 of 5'), 'T5: summary shows "4 of 5"');
  assert(/[⚠]/.test(summaryText), 'T5: summary contains warning symbol');
})();

// T6: warning-cue-absent-when-all-loaded
(function() {
  const html = buildContextManifestHtml([
    { path: 'a.md', status: 'ok' },
    { path: 'b.md', status: 'ok' }
  ]);
  const summaryMatch = html.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
  const summaryText = summaryMatch[1];
  assert(!/[⚠]/.test(summaryText), 'T6: no warning symbol when all loaded');
  assert(!summaryText.includes(' of '), 'T6: no "X of Y" partial-count language when all loaded');
})();

// T7: per-file-markup-regression-guard
(function() {
  const fixtures = [
    [{ path: 'product/mission.md', status: 'ok' }, { path: 'product/constraints.md', status: 'warn' }],
    [],
    [{ path: '<script>alert(1)</script>/malicious.md', status: 'ok' }]
  ];
  fixtures.forEach(function(files, i) {
    const html = buildContextManifestHtml(files);
    if (files.length === 0) {
      assert(html.includes('no context loaded') || html.includes('context-manifest-empty'), 'T7.' + i + ': empty placeholder present');
      assert(!html.includes('chip-ok') && !html.includes('chip-warn'), 'T7.' + i + ': no chips when empty');
    } else {
      files.forEach(function(f) {
        const status = f.status || 'ok';
        const cls = status === 'warn' ? 'chip-warn' : 'chip-ok';
        assert(html.includes('class="' + cls + '"'), 'T7.' + i + ': ' + cls + ' present for ' + f.path);
      });
    }
    if (i === 2) {
      assert(!html.includes('<script>alert'), 'T7.' + i + ': raw script tag not present (escaped)');
    }
  });
})();

console.log('[wnl-s1] Results: passed=' + passed + ' failed=' + failed);
process.exit(failed > 0 ? 1 : 0);
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-wnl-s1-context-manifest-collapse.js
```

Expected output: Multiple FAIL lines — the current `buildContextManifestHtml()` returns a plain `<div id="context-manifest">`, not a `<details>` element, so T1/T4/T5/T6 fail immediately; T3/T7 currently pass (chip markup already correct) since they test pre-existing behaviour, not the new collapse behaviour.

- [x] **Step 3: Write minimal implementation**

```javascript
// src/web-ui/routes/skills.js — replace buildContextManifestHtml() (~line 2680)
function buildContextManifestHtml(files) {
  var list = files || [];
  var items = list.map(function(f) {
    var p = (typeof f === 'string') ? f : f.path;
    var status = (typeof f === 'string') ? 'ok' : (f.status || 'ok');
    var basename = path.basename(p);
    var safeBasename = escHtml(basename);
    if (status === 'warn') {
      return '<span class="chip-warn" aria-label="' + safeBasename + ' — missing">' +
        safeBasename + ' <span aria-hidden="true" style="font-size:11px">⚠</span>' +
        ' <span style="font-size:10px">missing</span></span>';
    }
    return '<span class="chip-ok" aria-label="' + safeBasename + ' — loaded">' +
      safeBasename + ' <span aria-hidden="true" style="font-size:11px">✓</span>' +
      ' <span style="font-size:10px">loaded</span></span>';
  });
  var inner = items.length > 0
    ? items.join('\n    ')
    : '<span id="context-manifest-empty" style="font-size:12px;color:var(--muted)">no context loaded</span>';

  var total = list.length;
  var missing = list.filter(function(f) {
    var status = (typeof f === 'string') ? 'ok' : (f.status || 'ok');
    return status === 'warn';
  }).length;
  var loadedCount = total - missing;
  var summaryText;
  if (total === 0) {
    summaryText = 'No context loaded';
  } else if (missing > 0) {
    summaryText = 'Context loaded (' + loadedCount + ' of ' + total + ' file' + (total === 1 ? '' : 's') + ') ⚠';
  } else {
    summaryText = 'Context loaded (' + total + ' file' + (total === 1 ? '' : 's') + ') ✓';
  }

  return '<details id="context-manifest" aria-label="Loaded context files"' +
    ' style="padding:6px 16px;border-bottom:1px solid var(--line);background:var(--bg)">' +
    '\n  <summary style="cursor:pointer;font-size:12px;list-style:none">' + escHtml(summaryText) + '</summary>' +
    '\n  <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px">' +
    '\n    ' + inner + '\n  </div>' +
    '\n</details>';
}
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-wnl-s1-context-manifest-collapse.js
```

Expected output: `[wnl-s1] Results: passed=N failed=0`

- [x] **Step 5: Run full suite — no regressions, including the named existing test**

```bash
node tests/check-iwu1-context-manifest.js
npm test
```

Expected output: `iwu1` — all 9 tests PASS. Full suite — `632 file(s) run, 1 failed` (only the known pre-existing `tests/check-p3.5-validate-trace.js`; `check-pcr-s1-test-runner.js`'s baseline flake was confirmed non-reproducible in isolation and unrelated to this story).

- [x] **Step 6: Commit**

```bash
git add tests/check-wnl-s1-context-manifest-collapse.js src/web-ui/routes/skills.js
git commit -m "feat: collapse context manifest into a single summary indicator

The 'Ref docs' context panel showed one chip per loaded file,
unconditionally, on every session page load. Wraps the existing,
unchanged per-file chip markup in a native <details> element,
collapsed by default, with a <summary> line showing file count and a
non-colour warning cue when any file failed to load -- no custom JS
toggle logic, native keyboard/screen-reader semantics for free.
Confirmed the existing tests/check-iwu1-context-manifest.js suite (8
tests + 1 integration test) still passes unmodified."
```

---

<!-- All 6 ACs (AC1-AC6) covered by this single task -- AC3 and AC6 are
     satisfied structurally (native <details> presence, T4) since their
     own interaction behaviour is native-browser-guaranteed, not
     implementation logic, per the test plan's own gap-typing. -->
