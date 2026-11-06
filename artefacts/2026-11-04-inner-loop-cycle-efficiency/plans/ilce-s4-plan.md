# /workflow reconciles merged-but-no-DoD stories against live GitHub, not just pipeline-state.json — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. `/workflow` cross-references `gh pr list --state merged` against every story's recorded `prUrl`, flags a reconciliation gap when a story's `prStatus`/`stage` disagrees with that live result (ADR-030's corruption pattern), also surfaces the simpler "prStatus merged but dodStatus not complete" case directly from `pipeline-state.json`, degrades gracefully when `gh` is unavailable, and surfaces every finding prominently at the top of the session-start report.
**Branch:** `feature/ilce-s4`
**Worktree:** `.worktrees/ilce-s4`
**Test command:** `node scripts/run-all-tests.js` (full suite) / `node tests/check-ilce-s4-dod-handoff-reconciliation.js` (this story's file directly)

---

## File map

```
Create:
  scripts/lib/dod-handoff-reconciliation.js   — crossReferenceStories, findReconciliationGaps,
                                                  findPipelineStateOnlyGaps, runReconciliationCheck,
                                                  flattenStories, extractPrNumber
  tests/check-ilce-s4-dod-handoff-reconciliation.js — regression tests for AC1–AC5 + NFR

Modify:
  skills/workflow/SKILL.md    — Session start behaviour: wire the reconciliation callout in
                                  before the status table
```

---

## Task 1: Core cross-reference function — AC1

**Files:**
- Create: `scripts/lib/dod-handoff-reconciliation.js`
- Test: `tests/check-ilce-s4-dod-handoff-reconciliation.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
const assert = require('assert');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log('  ✗ ' + name + ': ' + err.message);
  }
}

// AC1: cross-reference correctly matches a story's prUrl against gh pr list output
test('crossReferenceStories matches a story prUrl against a real merged PR', () => {
  const { crossReferenceStories } = require('../scripts/lib/dod-handoff-reconciliation');
  const ghMergedPrs = [{ number: 999, mergedAt: '2026-10-01T00:00:00Z' }];
  const stories = [{ slug: 'abc-s1', prUrl: 'https://github.com/org/repo/pull/999', prStatus: 'merged' }];
  const result = crossReferenceStories(ghMergedPrs, stories);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].storySlug, 'abc-s1');
  assert.deepStrictEqual(result[0].liveMatch, { number: 999, mergedAt: '2026-10-01T00:00:00Z' });
});

// AC1 (no match case): a story whose prUrl does not correspond to any merged PR
test('crossReferenceStories returns liveMatch null when no merged PR matches', () => {
  const { crossReferenceStories } = require('../scripts/lib/dod-handoff-reconciliation');
  const ghMergedPrs = [{ number: 999, mergedAt: '2026-10-01T00:00:00Z' }];
  const stories = [{ slug: 'abc-s2', prUrl: 'https://github.com/org/repo/pull/111', prStatus: 'draft' }];
  const result = crossReferenceStories(ghMergedPrs, stories);
  assert.strictEqual(result[0].liveMatch, null);
});

console.log('\n── Summary ──');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(({ name, err }) => {
    console.log(`  ✗ ${name}`);
    console.log(`      ${err.message}`);
  });
}
if (failed > 0) {
  process.exit(1);
}
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ilce-s4-dod-handoff-reconciliation.js
```

Expected output: `Error: Cannot find module '../scripts/lib/dod-handoff-reconciliation'`

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';

function extractPrNumber(prUrl) {
  if (!prUrl) return null;
  const m = /\/pull\/(\d+)/.exec(prUrl);
  return m ? Number(m[1]) : null;
}

function crossReferenceStories(ghMergedPrs, stories) {
  const byNumber = new Map(ghMergedPrs.map(pr => [pr.number, pr]));
  return stories.map(story => {
    const prNumber = extractPrNumber(story.prUrl);
    const liveMatch = prNumber !== null ? (byNumber.get(prNumber) || null) : null;
    return { storySlug: story.slug, prUrl: story.prUrl || null, liveMatch };
  });
}

module.exports = { extractPrNumber, crossReferenceStories };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ilce-s4-dod-handoff-reconciliation.js
```

Expected output: `Passed: 2`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same established rotating baseline (`scripts/check-pipeline-state-integrity.js`, `tests/check-pcr-s1-test-runner.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-cat-s1-core-trace-builder.js` — not all necessarily failing every run), 0 new failures.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/dod-handoff-reconciliation.js tests/check-ilce-s4-dod-handoff-reconciliation.js
git commit -m "feat: add crossReferenceStories for live-GitHub merged-PR cross-reference"
```

---

## Task 2: Reconciliation-gap detection — AC2 (both directions)

**Files:**
- Modify: `scripts/lib/dod-handoff-reconciliation.js`
- Test: `tests/check-ilce-s4-dod-handoff-reconciliation.js`

- [ ] **Step 1: Write the failing test**

```javascript
// AC2: flags a reconciliation gap when prUrl matches a merged PR but prStatus disagrees
test('findReconciliationGaps flags a gap when live-merged story has a non-merged prStatus', () => {
  const { crossReferenceStories, findReconciliationGaps } = require('../scripts/lib/dod-handoff-reconciliation');
  const ghMergedPrs = [{ number: 999, mergedAt: '2026-10-01T00:00:00Z' }];
  const stories = [{ slug: 'abc-s1', prUrl: 'https://github.com/org/repo/pull/999', prStatus: 'draft' }];
  const crossRef = crossReferenceStories(ghMergedPrs, stories);
  const gaps = findReconciliationGaps(crossRef, stories);
  assert.strictEqual(gaps.length, 1);
  assert.strictEqual(gaps[0].storySlug, 'abc-s1');
  assert.strictEqual(gaps[0].severity, 'merged-no-dod');
  assert.strictEqual(gaps[0].source, 'live-reconciliation');
});

// AC2 (negative/control case): no finding when prUrl and prStatus agree
test('findReconciliationGaps produces no finding when prStatus already says merged', () => {
  const { crossReferenceStories, findReconciliationGaps } = require('../scripts/lib/dod-handoff-reconciliation');
  const ghMergedPrs = [{ number: 999, mergedAt: '2026-10-01T00:00:00Z' }];
  const stories = [{ slug: 'abc-s1', prUrl: 'https://github.com/org/repo/pull/999', prStatus: 'merged' }];
  const crossRef = crossReferenceStories(ghMergedPrs, stories);
  const gaps = findReconciliationGaps(crossRef, stories);
  assert.strictEqual(gaps.length, 0);
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ilce-s4-dod-handoff-reconciliation.js
```

Expected output: `Error: findReconciliationGaps is not a function` (the 2 new tests fail; the first 2 still pass).

- [ ] **Step 3: Write minimal implementation**

Add to `scripts/lib/dod-handoff-reconciliation.js`, update `module.exports`:

```javascript
function findReconciliationGaps(crossReferenceResults, stories) {
  const bySlug = new Map(stories.map(s => [s.slug, s]));
  const gaps = [];
  for (const result of crossReferenceResults) {
    if (!result.liveMatch) continue;
    const story = bySlug.get(result.storySlug);
    if (!story) continue;
    if (story.prStatus !== 'merged') {
      gaps.push({
        storySlug: result.storySlug,
        severity: 'merged-no-dod',
        source: 'live-reconciliation',
        message: `Story "${result.storySlug}" has prUrl matching a real merged PR (#${result.liveMatch.number}, merged ${result.liveMatch.mergedAt}) but pipeline-state.json's own prStatus reads "${story.prStatus}" -- reconciliation gap per ADR-030.`,
      });
    }
  }
  return gaps;
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ilce-s4-dod-handoff-reconciliation.js
```

Expected output: `Passed: 4`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: 0 new failures beyond the established rotating baseline.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/dod-handoff-reconciliation.js tests/check-ilce-s4-dod-handoff-reconciliation.js
git commit -m "feat: add findReconciliationGaps for ADR-030's live-vs-recorded mismatch pattern"
```

---

## Task 3: Graceful degradation + pipeline-state-only fallback — AC4

**Files:**
- Modify: `scripts/lib/dod-handoff-reconciliation.js`
- Test: `tests/check-ilce-s4-dod-handoff-reconciliation.js`

- [ ] **Step 1: Write the failing test**

```javascript
// AC4: degrades gracefully and falls back to pipeline-state-only checking when gh is unavailable
test('runReconciliationCheck falls back to pipeline-state-only gaps when gh call throws', () => {
  const { runReconciliationCheck } = require('../scripts/lib/dod-handoff-reconciliation');
  const pipelineState = {
    features: [{
      slug: 'test-feat',
      stories: [{ slug: 'merged-no-dod-s1', prUrl: 'https://github.com/org/repo/pull/1', prStatus: 'merged', dodStatus: 'none' }],
    }],
  };
  const throwingExec = () => { throw new Error('gh: command not found'); };
  const result = runReconciliationCheck({ pipelineState, execGhPrList: throwingExec });
  assert.strictEqual(result.liveCheckFailed, true);
  assert.ok(typeof result.warning === 'string' && result.warning.length > 0, 'a warning message must be present');
  assert.ok(result.warning.indexOf('gh') !== -1, 'warning should mention gh CLI unavailability');
  // The fallback must still perform the pipeline-state-only check, not give up entirely.
  assert.strictEqual(result.gaps.length, 1);
  assert.strictEqual(result.gaps[0].storySlug, 'merged-no-dod-s1');
  assert.strictEqual(result.gaps[0].source, 'pipeline-state-only');
});

// AC4 (no-crash case): runReconciliationCheck does not throw even when gh fails
test('runReconciliationCheck does not throw when gh call throws', () => {
  const { runReconciliationCheck } = require('../scripts/lib/dod-handoff-reconciliation');
  const pipelineState = { features: [] };
  const throwingExec = () => { throw new Error('network unreachable'); };
  assert.doesNotThrow(() => runReconciliationCheck({ pipelineState, execGhPrList: throwingExec }));
});

// AC3's "existing pipeline-state.json fields agreeing with it" path, exercised directly:
// a story flagged by the plain prStatus=merged + dodStatus!=complete check, independent of gh.
test('runReconciliationCheck surfaces pipeline-state-only gaps even when the live gh call succeeds', () => {
  const { runReconciliationCheck } = require('../scripts/lib/dod-handoff-reconciliation');
  const pipelineState = {
    features: [{
      slug: 'test-feat',
      epics: [{
        name: 'test-epic',
        stories: [{ slug: 'epic-nested-s1', prUrl: 'https://github.com/org/repo/pull/2', prStatus: 'merged', dodStatus: 'none' }],
      }],
    }],
  };
  const emptyExec = () => [];
  const result = runReconciliationCheck({ pipelineState, execGhPrList: emptyExec });
  assert.strictEqual(result.liveCheckFailed, false);
  assert.strictEqual(result.gaps.length, 1);
  assert.strictEqual(result.gaps[0].storySlug, 'epic-nested-s1');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ilce-s4-dod-handoff-reconciliation.js
```

Expected output: `Error: runReconciliationCheck is not a function` (the 3 new tests fail; the first 4 still pass).

- [ ] **Step 3: Write minimal implementation**

Add to `scripts/lib/dod-handoff-reconciliation.js`, update `module.exports`:

```javascript
function flattenStories(pipelineState) {
  const stories = [];
  for (const feature of (pipelineState && pipelineState.features) || []) {
    for (const story of feature.stories || []) {
      stories.push(story);
    }
    for (const epic of feature.epics || []) {
      for (const story of epic.stories || []) {
        stories.push(story);
      }
    }
  }
  return stories;
}

function findPipelineStateOnlyGaps(stories) {
  return stories
    .filter(s => s.prStatus === 'merged' && s.dodStatus !== 'complete')
    .map(s => ({
      storySlug: s.slug,
      severity: 'merged-no-dod',
      source: 'pipeline-state-only',
      message: `Story "${s.slug}" has prStatus "merged" but dodStatus is "${s.dodStatus || 'not set'}" -- merged but Definition of Done not complete.`,
    }));
}

function defaultExecGhPrList() {
  const { execSync } = require('child_process');
  const output = execSync('gh pr list --state merged --json number,mergedAt --limit 1000', { encoding: 'utf8', timeout: 15000 });
  return JSON.parse(output);
}

function runReconciliationCheck({ pipelineState, execGhPrList = defaultExecGhPrList } = {}) {
  const stories = flattenStories(pipelineState);
  const pipelineStateOnlyGaps = findPipelineStateOnlyGaps(stories);

  let ghMergedPrs;
  try {
    ghMergedPrs = execGhPrList();
  } catch (err) {
    return {
      gaps: pipelineStateOnlyGaps,
      warning: 'Could not reach gh CLI this session (' + err.message + ') -- falling back to pipeline-state.json-only checking. Live reconciliation did not run.',
      liveCheckFailed: true,
    };
  }

  const crossReferenceResults = crossReferenceStories(ghMergedPrs, stories);
  const liveMismatchGaps = findReconciliationGaps(crossReferenceResults, stories);

  const bySlug = new Map();
  for (const gap of [...pipelineStateOnlyGaps, ...liveMismatchGaps]) {
    bySlug.set(gap.storySlug, gap);
  }

  return { gaps: Array.from(bySlug.values()), warning: null, liveCheckFailed: false };
}
```

Update `module.exports` at the bottom of the file to:

```javascript
module.exports = {
  extractPrNumber,
  crossReferenceStories,
  findReconciliationGaps,
  flattenStories,
  findPipelineStateOnlyGaps,
  runReconciliationCheck,
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ilce-s4-dod-handoff-reconciliation.js
```

Expected output: `Passed: 7`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: 0 new failures beyond the established rotating baseline.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/dod-handoff-reconciliation.js tests/check-ilce-s4-dod-handoff-reconciliation.js
git commit -m "feat: add graceful gh-unavailable fallback and pipeline-state-only gap detection"
```

---

## Task 4: Wire the reconciliation callout into /workflow's session-start report — AC3

**Files:**
- Modify: `skills/workflow/SKILL.md`
- Test: `tests/check-ilce-s4-dod-handoff-reconciliation.js`

- [ ] **Step 1: Write the failing test**

```javascript
// AC3: the reconciliation callout appears before the status table, not after
test('workflow SKILL.md wires the reconciliation check in before the status table', () => {
  const fs = require('fs');
  const path = require('path');
  const content = fs.readFileSync(path.join(__dirname, '..', 'skills/workflow/SKILL.md'), 'utf8');
  assert.ok(content.includes('dod-handoff-reconciliation'), 'must reference scripts/lib/dod-handoff-reconciliation.js');
  assert.ok(content.includes('runReconciliationCheck'), 'must reference runReconciliationCheck specifically');
  const sessionStartIdx = content.indexOf('## Session start behaviour');
  const reconciliationIdx = content.indexOf('runReconciliationCheck');
  const tableHeaderIdx = content.indexOf('| Feature | Stage | Status | Next action |');
  assert.ok(sessionStartIdx !== -1 && reconciliationIdx !== -1 && tableHeaderIdx !== -1, 'all three markers must be present');
  assert.ok(sessionStartIdx < reconciliationIdx, 'the reconciliation wiring must be inside the Session start behaviour section');
  assert.ok(reconciliationIdx < tableHeaderIdx, 'the reconciliation callout must be instructed BEFORE the status table, not after');
});

// AC4's warning must also be instructed to surface in the session-start output
test('workflow SKILL.md instructs surfacing the gh-unavailable warning, not silently swallowing it', () => {
  const fs = require('fs');
  const path = require('path');
  const content = fs.readFileSync(path.join(__dirname, '..', 'skills/workflow/SKILL.md'), 'utf8');
  assert.ok(content.includes('.warning'), 'must reference the result object\'s warning field');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ilce-s4-dod-handoff-reconciliation.js
```

Expected output: assertion failures naming `dod-handoff-reconciliation`/`runReconciliationCheck` missing.

- [ ] **Step 3: Write minimal implementation**

Read `skills/workflow/SKILL.md`'s current "## Session start behaviour" section first (lines ~38-67) before editing. Insert a new paragraph immediately after the `## Session start behaviour` heading's first sentence ("When invoked without a specific feature, output the status table immediately — no preamble.") and BEFORE the `## Pipeline Status — [date]` example block, so the callout is instructed to print first:

```markdown
**Before the status table:** call `scripts/lib/dod-handoff-reconciliation.js`'s `runReconciliationCheck({ pipelineState })` (reading the real `pipeline-state.json` already loaded for this session). If `result.gaps.length > 0`, print this callout FIRST — before the status table, before everything else in the report:

> ⚠️ **Merged-but-no-DoD gap(s) found: [N]** — [comma-separated story slugs] — merged but Definition of Done not complete. Run `/definition-of-done` for each.

If `result.warning` is non-null (the live `gh` check could not run this session), also print it, directly below the callout above — do not silently swallow it:

> ℹ️ [result.warning]

If `result.gaps.length === 0` and `result.warning` is null, skip both lines and proceed straight to the status table — do not print an empty/all-clear callout.
```

Do not touch any other part of the "## Session start behaviour" section or any other section of the file.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ilce-s4-dod-handoff-reconciliation.js
```

Expected output: `Passed: 9`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: 0 new failures beyond the established rotating baseline. Pay attention to whether any existing test asserts on the exact current text of `skills/workflow/SKILL.md`'s Session start behaviour section (a lock-in test like `ilce-s3`'s `s3fw-s1` collision) — if one exists and breaks, STOP and report BLOCKED with details rather than forcing past it; do not assume none exists without checking.

- [ ] **Step 6: Commit**

```bash
git add skills/workflow/SKILL.md tests/check-ilce-s4-dod-handoff-reconciliation.js
git commit -m "feat: surface merged-but-no-DoD reconciliation gaps at the top of /workflow's session-start report"
```

---

## Task 5: Real-data regression anchor (AC5) + NFR performance test

**Files:**
- Test: `tests/check-ilce-s4-dod-handoff-reconciliation.js`

- [ ] **Step 1: Write the failing test**

```javascript
// AC5: the check correctly identifies every real, currently-known merged-but-no-DoD story.
// Computed dynamically (not hardcoded 22) to avoid a brittle test, per the test plan's own
// guidance -- the real count will have grown or shrunk since the original 2026-11-04 audit.
test('runReconciliationCheck finds every real merged-but-no-DoD story in this repo\'s own pipeline-state.json', () => {
  const fs = require('fs');
  const path = require('path');
  const { flattenStories, findPipelineStateOnlyGaps, runReconciliationCheck } = require('../scripts/lib/dod-handoff-reconciliation');
  const realPipelineState = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.github/pipeline-state.json'), 'utf8'));
  const realStories = flattenStories(realPipelineState);
  const expectedSlugs = new Set(
    realStories.filter(s => s.prStatus === 'merged' && s.dodStatus !== 'complete').map(s => s.slug)
  );
  assert.ok(expectedSlugs.size > 0, 'this repo is expected to have at least one real merged-but-no-DoD story at the time this test runs');
  const noOpExec = () => [];
  const result = runReconciliationCheck({ pipelineState: realPipelineState, execGhPrList: noOpExec });
  const foundSlugs = new Set(result.gaps.map(g => g.storySlug));
  for (const slug of expectedSlugs) {
    assert.ok(foundSlugs.has(slug), `expected real gap "${slug}" was not found by runReconciliationCheck`);
  }
});

// NFR: the gh pr list call (mocked here) does not meaningfully slow down the check
test('runReconciliationCheck with a mocked gh call completes in well under a second', () => {
  const { runReconciliationCheck } = require('../scripts/lib/dod-handoff-reconciliation');
  const pipelineState = { features: [{ slug: 'perf-test', stories: Array.from({ length: 50 }, (_, i) => ({ slug: 'perf-s' + i, prUrl: 'https://github.com/org/repo/pull/' + i, prStatus: 'merged', dodStatus: 'complete' })) }] };
  const mockExec = () => Array.from({ length: 50 }, (_, i) => ({ number: i, mergedAt: '2026-10-01T00:00:00Z' }));
  const start = Date.now();
  runReconciliationCheck({ pipelineState, execGhPrList: mockExec });
  const elapsedMs = Date.now() - start;
  assert.ok(elapsedMs < 1000, `expected well under 1000ms for a mocked call, took ${elapsedMs}ms`);
});
```

- [ ] **Step 2: Run test — must pass immediately** (no RED step expected for the AC5 test specifically — it reads real repo data and the already-implemented function; the NFR test is likewise a confirmation, not new production code)

```bash
node tests/check-ilce-s4-dod-handoff-reconciliation.js
```

Expected output: `Passed: 11`, `Failed: 0`. If the AC5 test fails, that is a real finding (the mechanism doesn't actually catch a real known gap) — report it rather than loosening the assertion.

- [ ] **Step 3: Write minimal implementation**

No production code change required.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ilce-s4-dod-handoff-reconciliation.js
```

Expected output: `Passed: 11`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: 0 new failures beyond the established rotating baseline.

- [ ] **Step 6: Commit**

```bash
git add tests/check-ilce-s4-dod-handoff-reconciliation.js
git commit -m "test: confirm AC5's real-data regression anchor and the NFR performance budget"
```
