# Branch-complete's freshness check must not be invalidated by verify-completion's own bookkeeping commit — Implementation Plan

**Goal:** Make every test in the test plan pass. `/branch-complete`'s freshness check excludes commits that only touch `.github/pipeline-state.json`/`.github/pipeline-timings.jsonl` when determining "has anything changed since the timing record was written."
**Branch:** `feature/bcfx-s1`
**Worktree:** `.worktrees/bcfx-s1`
**Test command:** `node tests/check-bcfx-s1-freshness-commit-filter.js`

---

## File map

```
Modify:
  scripts/lib/branch-complete-freshness.js — add getLastCodeCommitTimestamp(execGitLog)
  skills/branch-complete/SKILL.md           — Step 1: call the new function instead of an
                                                unspecified raw git log -1

Create:
  tests/check-bcfx-s1-freshness-commit-filter.js
```

---

## Task 1: getLastCodeCommitTimestamp + wiring

**Files:**
- Modify: `scripts/lib/branch-complete-freshness.js`
- Modify: `skills/branch-complete/SKILL.md`
- Create: `tests/check-bcfx-s1-freshness-commit-filter.js`

- [ ] **Step 1: Write the failing tests**

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

// AC1: a bookkeeping-only commit does not count -- the function falls through to
// the prior real code commit's timestamp instead.
test('getLastCodeCommitTimestamp excludes a commit that only touches the bookkeeping paths', () => {
  const { getLastCodeCommitTimestamp } = require('../scripts/lib/branch-complete-freshness');
  // Simulates: `git log -1 --format=%cI -- . ':!.github/pipeline-state.json' ':!.github/pipeline-timings.jsonl'`
  const mockExecGitLog = () => '2026-11-06T00:00:00+00:00\n';
  const result = getLastCodeCommitTimestamp(mockExecGitLog);
  assert.strictEqual(result, '2026-11-06T00:00:00+00:00');
});

// AC1 (edge case): no code commit exists yet at all
test('getLastCodeCommitTimestamp returns null when no code commit exists', () => {
  const { getLastCodeCommitTimestamp } = require('../scripts/lib/branch-complete-freshness');
  const mockExecGitLog = () => '';
  const result = getLastCodeCommitTimestamp(mockExecGitLog);
  assert.strictEqual(result, null);
});

// AC2: a real code commit after the record still correctly reports not-fresh
test('isFresh still correctly reports not-fresh when getLastCodeCommitTimestamp finds a later real commit', () => {
  const { isFresh, getLastCodeCommitTimestamp } = require('../scripts/lib/branch-complete-freshness');
  const record = { stage: 'verify-completion', fullSuite: true, timestamp: '2026-11-06T00:00:00.000Z' };
  const mockExecGitLog = () => '2026-11-06T00:05:00+00:00\n'; // 5 minutes after the record -- a real later commit
  const lastCommitTimestamp = getLastCodeCommitTimestamp(mockExecGitLog);
  const fresh = isFresh(record, { lastCommitTimestamp });
  assert.strictEqual(fresh, false);
});

// AC3: injectable, no real git process required to test
test('getLastCodeCommitTimestamp uses the injected executor, not real execSync, when provided', () => {
  const { getLastCodeCommitTimestamp } = require('../scripts/lib/branch-complete-freshness');
  let called = false;
  const mockExecGitLog = () => { called = true; return '2026-11-06T00:00:00+00:00\n'; };
  getLastCodeCommitTimestamp(mockExecGitLog);
  assert.strictEqual(called, true, 'the injected mock must be the one actually called');
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
node tests/check-bcfx-s1-freshness-commit-filter.js
```

Expected output: `Error: getLastCodeCommitTimestamp is not a function` — all 4 tests fail.

- [ ] **Step 3: Write minimal implementation**

Read `scripts/lib/branch-complete-freshness.js`'s current full content first (it's small — `isFresh` and `decideSkipOrRun`). Add this function right after `isFresh`'s closing brace, and update `module.exports`:

```javascript
function defaultExecGitLog() {
  const { execSync } = require('child_process');
  return execSync(
    "git log -1 --format=%cI -- . ':!.github/pipeline-state.json' ':!.github/pipeline-timings.jsonl'",
    { encoding: 'utf8' }
  );
}

function getLastCodeCommitTimestamp(execGitLog = defaultExecGitLog) {
  const output = execGitLog().trim();
  return output.length > 0 ? output : null;
}
```

Update `module.exports` to:

```javascript
module.exports = { isFresh, decideSkipOrRun, getLastCodeCommitTimestamp };
```

Then edit `skills/branch-complete/SKILL.md`'s Step 1 paragraph. Read its current exact text first. Where it currently says "pass the result to `scripts/lib/branch-complete-freshness.js`'s `decideSkipOrRun(record, {lastCommitTimestamp})`" without specifying how `lastCommitTimestamp` is computed, add a clause naming the correct source: `lastCommitTimestamp` must come from `scripts/lib/branch-complete-freshness.js`'s own `getLastCodeCommitTimestamp()` — not a raw `git log -1`, which would always see `/verify-completion`'s own just-made bookkeeping commit and incorrectly report not-fresh every time. Insert this as a parenthetical or short added sentence immediately after the existing `decideSkipOrRun(record, {lastCommitTimestamp})` reference, without restructuring the rest of the paragraph.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-bcfx-s1-freshness-commit-filter.js
```

Expected output: `Passed: 4`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same established rotating baseline (`scripts/check-pipeline-state-integrity.js`, `tests/check-pcr-s1-test-runner.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-cat-s1-core-trace-builder.js` — not all necessarily failing every run), 0 new failures. Also directly re-run `node tests/check-ilce-s2-branch-complete-freshness.js` (the original story's own test file) to confirm this change doesn't break any of its 9 existing tests — `isFresh`'s own signature and logic are unchanged, so this should pass unmodified.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/branch-complete-freshness.js skills/branch-complete/SKILL.md tests/check-bcfx-s1-freshness-commit-filter.js
git commit -m "fix: exclude bookkeeping-only commits from branch-complete's freshness check"
```
