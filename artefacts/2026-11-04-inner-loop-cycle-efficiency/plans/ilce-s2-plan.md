# /branch-complete skips the redundant full-suite rerun when a fresh result exists — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. `/branch-complete`'s Step 1 reuses a fresh `/verify-completion` result instead of rerunning the full suite, when safe to do so.
**Branch:** `feature/ilce-s2`
**Worktree:** `.worktrees/ilce-s2`
**Test command:** `node scripts/run-all-tests.js` (full suite) / `node tests/check-ilce-s2-branch-complete-freshness.js` (this story's file directly)

---

## File map

```
Create:
  scripts/lib/branch-complete-freshness.js       — isFresh(record) + skip/ran decision logic
  tests/check-ilce-s2-branch-complete-freshness.js — regression tests for AC1–AC4

Modify:
  skills/branch-complete/SKILL.md                — Step 1 reads the freshness check before running the full suite
```

---

## Task 1: Core freshness-check function — commit-state and fullSuite conditions

**Files:**
- Create: `scripts/lib/branch-complete-freshness.js`
- Test: `tests/check-ilce-s2-branch-complete-freshness.js`

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

// AC1: fresh when no commit since and fullSuite=true
test('isFresh returns true when no commit since the verify-completion record and fullSuite is true', () => {
  const { isFresh } = require('../scripts/lib/branch-complete-freshness');
  const record = { stage: 'verify-completion', fullSuite: true, timestamp: '2026-11-05T00:00:00.000Z' };
  const result = isFresh(record, { lastCommitTimestamp: '2026-11-04T23:00:00.000Z' });
  assert.strictEqual(result, true);
});

// AC2: not fresh when a commit happened after the record
test('isFresh returns false when a commit happened after the verify-completion record', () => {
  const { isFresh } = require('../scripts/lib/branch-complete-freshness');
  const record = { stage: 'verify-completion', fullSuite: true, timestamp: '2026-11-05T00:00:00.000Z' };
  const result = isFresh(record, { lastCommitTimestamp: '2026-11-05T00:05:00.000Z' });
  assert.strictEqual(result, false);
});

// AC3: not fresh when fullSuite is false, even with no commit since
test('isFresh returns false when the record covered only a partial/targeted run (fullSuite=false)', () => {
  const { isFresh } = require('../scripts/lib/branch-complete-freshness');
  const record = { stage: 'verify-completion', fullSuite: false, timestamp: '2026-11-05T00:00:00.000Z' };
  const result = isFresh(record, { lastCommitTimestamp: '2026-11-04T23:00:00.000Z' });
  assert.strictEqual(result, false);
});

// AC1/AC2: no verify-completion record at all is never fresh
test('isFresh returns false when no verify-completion record is provided', () => {
  const { isFresh } = require('../scripts/lib/branch-complete-freshness');
  const result = isFresh(null, { lastCommitTimestamp: '2026-11-04T23:00:00.000Z' });
  assert.strictEqual(result, false);
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
node tests/check-ilce-s2-branch-complete-freshness.js
```

Expected output: `Error: Cannot find module '../scripts/lib/branch-complete-freshness'`

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';

function isFresh(record, context) {
  if (!record) return false;
  if (record.stage !== 'verify-completion') return false;
  if (!record.fullSuite) return false;
  const recordTime = new Date(record.timestamp).getTime();
  const commitTime = new Date(context.lastCommitTimestamp).getTime();
  return commitTime <= recordTime;
}

module.exports = { isFresh };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ilce-s2-branch-complete-freshness.js
```

Expected output: `Passed: 4`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same pre-existing failure set as the branch-setup baseline (3 known pre-existing files), 0 new failures

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/branch-complete-freshness.js tests/check-ilce-s2-branch-complete-freshness.js
git commit -m "feat: add isFresh freshness-check function for branch-complete's rerun guard"
```

---

## Task 2: Skip/ran decision logged to the timing log

**Files:**
- Modify: `scripts/lib/branch-complete-freshness.js`
- Test: `tests/check-ilce-s2-branch-complete-freshness.js`

- [ ] **Step 1: Write the failing test**

```javascript
// AC4: decideSkipOrRun logs the correct skip/ran flag
test('decideSkipOrRun returns skipped:true when fresh, and appends that to the timing log', () => {
  const { decideSkipOrRun } = require('../scripts/lib/branch-complete-freshness');
  const { appendTimingRecord } = require('../scripts/lib/pipeline-timings');
  const os = require('os');
  const path = require('path');
  const fs = require('fs');
  const logPath = path.join(os.tmpdir(), 'ilce-s2-decision-' + Date.now() + '.jsonl');

  const freshRecord = { stage: 'verify-completion', fullSuite: true, timestamp: '2026-11-05T00:00:00.000Z' };
  const decision = decideSkipOrRun(freshRecord, { lastCommitTimestamp: '2026-11-04T23:00:00.000Z' });
  assert.strictEqual(decision.skipped, true);

  appendTimingRecord({ skill: 'branch-complete', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'branch-complete', skipped: decision.skipped }, logPath);
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
  const written = JSON.parse(lines[lines.length - 1]);
  assert.strictEqual(written.skipped, true);
  fs.unlinkSync(logPath);
});

test('decideSkipOrRun returns skipped:false when not fresh', () => {
  const { decideSkipOrRun } = require('../scripts/lib/branch-complete-freshness');
  const staleRecord = { stage: 'verify-completion', fullSuite: false, timestamp: '2026-11-05T00:00:00.000Z' };
  const decision = decideSkipOrRun(staleRecord, { lastCommitTimestamp: '2026-11-04T23:00:00.000Z' });
  assert.strictEqual(decision.skipped, false);
});
```

Note: `scripts/lib/pipeline-timings.js`'s `ALLOWED_FIELDS` already includes a general-purpose set — `skipped` is a new field not yet in that allowlist. This task must also add `skipped` to `ALLOWED_FIELDS` in `scripts/lib/pipeline-timings.js` (one-line addition, additive only — do not remove or reorder existing fields).

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ilce-s2-branch-complete-freshness.js
```

Expected output: first new test fails because `decideSkipOrRun` doesn't exist yet, and/or because `skipped` isn't yet in `pipeline-timings.js`'s `ALLOWED_FIELDS` so it gets silently stripped.

- [ ] **Step 3: Write minimal implementation**

In `scripts/lib/branch-complete-freshness.js`, add:

```javascript
function decideSkipOrRun(record, context) {
  return { skipped: isFresh(record, context) };
}

module.exports = { isFresh, decideSkipOrRun };
```

In `scripts/lib/pipeline-timings.js`, change the `ALLOWED_FIELDS` line to add `'skipped'`:

```javascript
const ALLOWED_FIELDS = ['skill', 'featureSlug', 'storySlug', 'stage', 'timestamp', 'dispatchCount', 'fullSuite', 'skipped'];
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ilce-s2-branch-complete-freshness.js
```

Expected output: `Passed: 6`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: 0 new failures beyond the established baseline. Specifically re-run `node tests/check-ilce-s1-pipeline-timings.js` directly too, to confirm adding `skipped` to `ALLOWED_FIELDS` didn't break any of `ilce-s1`'s own 10 tests (it shouldn't — purely additive).

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/branch-complete-freshness.js scripts/lib/pipeline-timings.js tests/check-ilce-s2-branch-complete-freshness.js
git commit -m "feat: add decideSkipOrRun and skipped field for branch-complete's timing log"
```

---

## Task 3: Wire the freshness check into /branch-complete's Step 1

**Files:**
- Modify: `skills/branch-complete/SKILL.md`
- Test: `tests/check-ilce-s2-branch-complete-freshness.js`

- [ ] **Step 1: Write the failing test**

```javascript
// AC1-AC4: branch-complete/SKILL.md's Step 1 references the freshness-check module
test('branch-complete SKILL.md Step 1 references the freshness-check module', () => {
  const fs = require('fs');
  const path = require('path');
  const content = fs.readFileSync(path.join(__dirname, '..', 'skills/branch-complete/SKILL.md'), 'utf8');
  const step1Index = content.indexOf('## Step 1');
  const freshnessRefIndex = content.indexOf('branch-complete-freshness');
  assert.ok(step1Index !== -1, 'must have a "## Step 1" heading');
  assert.ok(freshnessRefIndex !== -1, 'must reference branch-complete-freshness.js');
  assert.ok(freshnessRefIndex > step1Index, 'the reference must appear within or after Step 1, not elsewhere in the file');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ilce-s2-branch-complete-freshness.js
```

Expected output: assertion failure, "must reference branch-complete-freshness.js"

- [ ] **Step 3: Write minimal implementation**

Read `skills/branch-complete/SKILL.md`'s current "## Step 1 - Final test verification" section first (it currently just runs the test command unconditionally). Insert this paragraph immediately after the `## Step 1 - Final test verification` heading, before the existing `[test command]` code block:

```markdown
**Before running the full suite below, check for an already-fresh `/verify-completion` result** — read the most recent `verify-completion`-stage record for this story from `.github/pipeline-timings.jsonl` (via `scripts/lib/pipeline-timings.js`'s reader) and pass it to `scripts/lib/branch-complete-freshness.js`'s `decideSkipOrRun(record, {lastCommitTimestamp})`. If `decideSkipOrRun` returns `{skipped: true}`, reuse that result and skip the rerun below — append `{skipped: true}` to the timing log via `appendTimingRecord` and proceed to Step 2. If `{skipped: false}`, run the full suite as below, then append `{skipped: false}`.
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ilce-s2-branch-complete-freshness.js
```

Expected output: `Passed: 7`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: 0 new failures beyond the established baseline.

- [ ] **Step 6: Commit**

```bash
git add skills/branch-complete/SKILL.md tests/check-ilce-s2-branch-complete-freshness.js
git commit -m "feat: wire the freshness check into branch-complete Step 1"
```
