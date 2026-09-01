# Implementation Plan: ep1-s2

**Story:** ep1-s2 — Artefact Resolution and HANDOFF CONTEXT Population (revised scope — see decisions.md 2026-09-02)
**DoR:** `artefacts/new-feature-af17f555/dor/ep1-s2-dor.md` (+ `dor/ep1-s2-dor-contract.md`, revised)
**Test plan:** `artefacts/new-feature-af17f555/test-plans/ep1-s2-test-plan.md` (revised, "Revised Test Plan (2026-09-02)" section)
**Branch:** `feature/ep1-s2` (worktree: `.worktrees/ep1-s2`)
**Date:** 2026-09-02

---

## Why this is small

Investigation before this plan found `buildSystemPrompt()`'s pre-existing `_KEY_DIRS` disk-scan (`src/web-ui/routes/skills.js` ~line 1946-1982) already does everything this story's AC2 wants for `stories/` and `review/`. The only confirmed gap is `_KEY_DIRS` missing `'epics'`, plus an adjacent related gap (`'dor'`). See `decisions.md` (2026-09-02).

## File map

| File | Change |
|---|---|
| `src/web-ui/routes/skills.js` | `_KEY_DIRS` constant: add `'epics'`, `'dor'` |
| `tests/check-ep1-s2-key-dirs-epics-dor.js` | New — 3 tests (epics injected, dor injected, regression on existing entries) |

## Task 1 — Add `'epics'` and `'dor'` to `_KEY_DIRS`, with tests

**Failing test first** (`tests/check-ep1-s2-key-dirs-epics-dor.js`):

```js
'use strict';
var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var passed = 0, failed = 0;
function check(name, fn) { try { fn(); console.log('PASS:', name); passed++; } catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; } }

var skills = require('../src/web-ui/routes/skills');
var _scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s2-'));

function writeArtefact(slug, relPath, content) {
  var abs = path.join(_scratchRoot, 'artefacts', slug, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
}

check('epics/*.md is injected into the FEATURE ARTEFACTS block', () => {
  var slug = 'ep1s2-epics-fixture';
  writeArtefact(slug, 'epics/my-epic.md', '# My Epic\n\nContent.');
  var prompt = skills.buildSystemPrompt('discovery', null, _scratchRoot, [], { activeFeatureSlug: slug });
  assert.ok(prompt.indexOf('epics/my-epic.md') !== -1, 'expected epics file path in prompt');
  assert.ok(prompt.indexOf('My Epic') !== -1, 'expected epics file content in prompt');
});

check('dor/*.md is injected into the FEATURE ARTEFACTS block', () => {
  var slug = 'ep1s2-dor-fixture';
  writeArtefact(slug, 'dor/some-story-dor.md', '# DoR\n\nSigned off.');
  var prompt = skills.buildSystemPrompt('discovery', null, _scratchRoot, [], { activeFeatureSlug: slug });
  assert.ok(prompt.indexOf('dor/some-story-dor.md') !== -1, 'expected dor file path in prompt');
  assert.ok(prompt.indexOf('Signed off') !== -1, 'expected dor file content in prompt');
});

check('regression: stories/, review/, test-plans/, verification-scripts/ still injected', () => {
  var slug = 'ep1s2-regression-fixture';
  writeArtefact(slug, 'stories/s1.md', 'Story content');
  writeArtefact(slug, 'review/s1-review-1.md', 'Review content');
  writeArtefact(slug, 'test-plans/s1-test-plan.md', 'Test plan content');
  writeArtefact(slug, 'verification-scripts/s1-verification.md', 'Verification content');
  var prompt = skills.buildSystemPrompt('discovery', null, _scratchRoot, [], { activeFeatureSlug: slug });
  ['stories/s1.md', 'review/s1-review-1.md', 'test-plans/s1-test-plan.md', 'verification-scripts/s1-verification.md'].forEach(function(p) {
    assert.ok(prompt.indexOf(p) !== -1, 'expected ' + p + ' still injected');
  });
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
```

**Run:** expect the first two to FAIL (epics/dor not yet in `_KEY_DIRS`), the regression test to PASS (existing behaviour already works).

**Implementation** (`src/web-ui/routes/skills.js`, line ~1966):

```js
var _KEY_DIRS = ['stories', 'review', 'test-plans', 'verification-scripts', 'epics', 'dor'];
```

**Run:** expect all 3 PASS.

## Task 2 — Full regression suite

```bash
npm test
```

Expected: 589 files (588 baseline + 1 new), 1 pre-existing known flake, 0 new failures.

## Self-review checklist

- [x] Exact file paths, no placeholders
- [x] Complete code
- [x] Failing test written before implementation
- [x] Expected output stated
- [x] No scope beyond the confirmed `_KEY_DIRS` gap (no new module, no change to `priorArtefacts`)
