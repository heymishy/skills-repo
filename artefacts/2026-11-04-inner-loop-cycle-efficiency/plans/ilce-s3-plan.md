# /subagent-execution runs spec-compliance and code-quality review in parallel, with symmetric discard-and-re-dispatch on either reviewer's fix — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. `/subagent-execution` dispatches spec-compliance and code-quality review concurrently by default; whenever either reviewer requires a fix, the other reviewer's pre-fix result is discarded and re-dispatched against post-fix code.
**Branch:** `feature/ilce-s3`
**Worktree:** `.worktrees/ilce-s3`
**Test command:** `node scripts/run-all-tests.js` (full suite) / `node tests/check-ilce-s3-review-outcome.js` (this story's file directly)

---

## File map

```
Create:
  scripts/lib/review-outcome.js        — decideReviewOutcome(specResult, qualityResult) pure decision function
  tests/check-ilce-s3-review-outcome.js — regression tests for AC1–AC5

Modify:
  skills/subagent-execution/SKILL.md    — Steps 2a-2d: parallel dispatch, symmetric discard-and-re-dispatch, single-record retention
```

---

## Task 1: Core decision function — both-clean and symmetric redispatch directions

**Files:**
- Create: `scripts/lib/review-outcome.js`
- Test: `tests/check-ilce-s3-review-outcome.js`

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

// AC2: both reviewers pass clean -> accept both, no redispatch
test('decideReviewOutcome returns accept-both when both reviewers pass clean', () => {
  const { decideReviewOutcome } = require('../scripts/lib/review-outcome');
  const result = decideReviewOutcome({ status: 'pass' }, { status: 'pass' });
  assert.deepStrictEqual(result, { action: 'accept-both' });
});

// AC3 direction 1: spec requires a fix, quality already passed -> discard+redispatch quality
test('decideReviewOutcome returns redispatch-quality when spec requires a fix and quality already passed', () => {
  const { decideReviewOutcome } = require('../scripts/lib/review-outcome');
  const result = decideReviewOutcome({ status: 'fix-required' }, { status: 'pass' });
  assert.deepStrictEqual(result, { action: 'redispatch-quality', discard: 'quality' });
});

// AC3 direction 2 (the symmetric case): quality requires a fix, spec already passed -> discard+redispatch spec
test('decideReviewOutcome returns redispatch-spec when quality requires a fix and spec already passed', () => {
  const { decideReviewOutcome } = require('../scripts/lib/review-outcome');
  const result = decideReviewOutcome({ status: 'pass' }, { status: 'fix-required' });
  assert.deepStrictEqual(result, { action: 'redispatch-spec', discard: 'spec' });
});

// Edge case: both require a fix -> spec takes priority (must fix spec first; quality gets redispatched after)
test('decideReviewOutcome returns redispatch-quality when both reviewers require a fix (spec fix takes priority)', () => {
  const { decideReviewOutcome } = require('../scripts/lib/review-outcome');
  const result = decideReviewOutcome({ status: 'fix-required' }, { status: 'fix-required' });
  assert.deepStrictEqual(result, { action: 'redispatch-quality', discard: 'quality' });
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
node tests/check-ilce-s3-review-outcome.js
```

Expected output: `Error: Cannot find module '../scripts/lib/review-outcome'`

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';

function decideReviewOutcome(specResult, qualityResult) {
  const specOk = specResult && specResult.status === 'pass';
  const qualityOk = qualityResult && qualityResult.status === 'pass';

  if (specOk && qualityOk) {
    return { action: 'accept-both' };
  }
  // Spec takes priority when both need a fix: fix spec first, quality gets
  // re-dispatched against the post-spec-fix code regardless of its own
  // pre-fix outcome, since that code is about to change anyway.
  if (!specOk) {
    return { action: 'redispatch-quality', discard: 'quality' };
  }
  return { action: 'redispatch-spec', discard: 'spec' };
}

module.exports = { decideReviewOutcome };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ilce-s3-review-outcome.js
```

Expected output: `Passed: 4`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same established rotating baseline as the branch-setup baseline (`scripts/check-pipeline-state-integrity.js`, `tests/check-pcr-s1-test-runner.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-cat-s1-core-trace-builder.js` — not all necessarily failing every run), 0 new failures.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/review-outcome.js tests/check-ilce-s3-review-outcome.js
git commit -m "feat: add decideReviewOutcome symmetric discard-and-redispatch decision function"
```

---

## Task 2: Final-record retention — only the post-fix result survives

**Files:**
- Modify: `scripts/lib/review-outcome.js`
- Test: `tests/check-ilce-s3-review-outcome.js`

- [ ] **Step 1: Write the failing test**

```javascript
// AC4: buildFinalRecord retains only the post-fix result, discarding the pre-fix one
test('buildFinalRecord retains only the post-fix result when a redispatch occurred', () => {
  const { buildFinalRecord } = require('../scripts/lib/review-outcome');
  const preFixQuality = { status: 'pass', notes: 'PRE-FIX — stale' };
  const postFixQuality = { status: 'pass', notes: 'POST-FIX — current' };
  const record = buildFinalRecord(
    { status: 'fix-required' }, // original spec result (now fixed)
    preFixQuality,
    { action: 'redispatch-quality', discard: 'quality' },
    postFixQuality
  );
  assert.strictEqual(record.qualityResult, postFixQuality);
  assert.notStrictEqual(record.qualityResult, preFixQuality);
  assert.ok(JSON.stringify(record).indexOf('PRE-FIX') === -1, 'pre-fix result must not appear anywhere in the final record');
});

// AC4 (no-redispatch case): buildFinalRecord just carries both original results through unchanged
test('buildFinalRecord carries both original results through when no redispatch occurred', () => {
  const { buildFinalRecord } = require('../scripts/lib/review-outcome');
  const specResult = { status: 'pass' };
  const qualityResult = { status: 'pass' };
  const record = buildFinalRecord(specResult, qualityResult, { action: 'accept-both' }, null);
  assert.strictEqual(record.specResult, specResult);
  assert.strictEqual(record.qualityResult, qualityResult);
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ilce-s3-review-outcome.js
```

Expected output: `Error: buildFinalRecord is not a function` (or similar — the two new tests fail, the 4 existing ones still pass).

- [ ] **Step 3: Write minimal implementation**

Add to `scripts/lib/review-outcome.js` (update `module.exports` to include the new function alongside `decideReviewOutcome`):

```javascript
function buildFinalRecord(specResult, qualityResult, decision, postFixResult) {
  if (decision.action === 'redispatch-quality') {
    return { specResult, qualityResult: postFixResult };
  }
  if (decision.action === 'redispatch-spec') {
    return { specResult: postFixResult, qualityResult };
  }
  return { specResult, qualityResult };
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ilce-s3-review-outcome.js
```

Expected output: `Passed: 6`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: 0 new failures beyond the established rotating baseline.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/review-outcome.js tests/check-ilce-s3-review-outcome.js
git commit -m "feat: add buildFinalRecord to retain only post-fix results in the task record"
```

---

## Task 3: Wire parallel dispatch and symmetric discard-and-redispatch into /subagent-execution

**Files:**
- Modify: `skills/subagent-execution/SKILL.md`
- Test: `tests/check-ilce-s3-review-outcome.js`

- [ ] **Step 1: Write the failing test**

```javascript
// AC1: Steps 2b and 2c are dispatched together, not sequentially
test('subagent-execution SKILL.md Step 2 dispatches spec-compliance and code-quality review concurrently', () => {
  const fs = require('fs');
  const path = require('path');
  const content = fs.readFileSync(path.join(__dirname, '..', 'skills/subagent-execution/SKILL.md'), 'utf8');
  assert.ok(content.includes('review-outcome'), 'must reference scripts/lib/review-outcome.js');
  assert.ok(content.includes('decideReviewOutcome'), 'must reference decideReviewOutcome specifically');
  assert.ok(content.includes('concurrently') || content.includes('same turn') || content.includes('in parallel'), 'must instruct concurrent dispatch, not sequential');
});

// AC3/AC4: the wiring references the symmetric discard-and-redispatch and single-record retention
test('subagent-execution SKILL.md references symmetric discard-and-redispatch and buildFinalRecord', () => {
  const fs = require('fs');
  const path = require('path');
  const content = fs.readFileSync(path.join(__dirname, '..', 'skills/subagent-execution/SKILL.md'), 'utf8');
  assert.ok(content.includes('buildFinalRecord'), 'must reference buildFinalRecord specifically');
  assert.ok(content.includes('redispatch-quality') || content.includes('redispatch-spec'), 'must reference at least one of the two symmetric redispatch actions');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ilce-s3-review-outcome.js
```

Expected output: assertion failures naming `review-outcome`/`decideReviewOutcome` missing.

- [ ] **Step 3: Write minimal implementation**

Read `skills/subagent-execution/SKILL.md`'s current Steps 2a-2d first (the "Per-task loop" section) before editing — this is a prose rewrite of the existing sequential instructions, not a pure insertion like `ilce-s1`/`ilce-s2`'s additive paragraphs. Replace the existing "### 2b — Dispatch spec compliance reviewer" / "### 2c — Dispatch code quality reviewer" sequential instructions (currently: dispatch 2b, wait, then dispatch 2c only after 2b is ✅) with:

```markdown
### 2b/2c — Dispatch both reviewers concurrently

Construct context for BOTH reviewers and dispatch them together, in the same turn (same message, same batch of tool calls) — not sequentially. Each reviewer still receives its own precisely constructed context (full task text, git diff since the task started, the relevant instructions from the original 2b/2c — spec compliance reviews against the ACs; code quality reviews against conventions and `.github/architecture-guardrails.md`), plus the same background-process warning as 2a.

Once both results are back, call `scripts/lib/review-outcome.js`'s `decideReviewOutcome(specResult, qualityResult)`:

- `{action: 'accept-both'}` — both passed clean. Proceed to 2d with both results as-is.
- `{action: 'redispatch-quality', discard: 'quality'}` — spec-compliance required a fix (or both did, in which case spec takes priority since its fix changes the code quality was evaluated against anyway). Apply the spec fix, discard the code-quality result (it was evaluated against pre-fix code), and re-dispatch code-quality review against the post-fix code.
- `{action: 'redispatch-spec', discard: 'spec'}` — the symmetric case: code-quality required a fix while spec-compliance already passed. Apply the quality fix, discard the spec-compliance result, and re-dispatch spec-compliance review against the post-fix code.

Repeat the redispatch-and-decide cycle until `decideReviewOutcome` returns `{action: 'accept-both'}`.

Build the task's final review record via `buildFinalRecord(specResult, qualityResult, decision, postFixResult)` — this retains only the post-fix result on whichever side was redispatched; the pre-fix result never appears in the final record.
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ilce-s3-review-outcome.js
```

Expected output: `Passed: 8`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: 0 new failures beyond the established rotating baseline.

- [ ] **Step 6: Commit**

```bash
git add skills/subagent-execution/SKILL.md tests/check-ilce-s3-review-outcome.js
git commit -m "feat: wire parallel dispatch and symmetric discard-and-redispatch into subagent-execution"
```

---

## Task 4: Confirm AC5's measurement data is already complete (no new code expected)

**Files:**
- Test: `tests/check-ilce-s3-review-outcome.js`

- [ ] **Step 1: Write the failing test**

```javascript
// AC5: a dispatched task's timing records already contain enough data to compute active-minutes-per-task
test('subagent-execution timing records include dispatchCount, enabling active-minutes-per-task measurement', () => {
  const { appendTimingRecord } = require('../scripts/lib/pipeline-timings');
  const os = require('os');
  const path = require('path');
  const fs = require('fs');
  const logPath = path.join(os.tmpdir(), 'ilce-s3-timing-' + Date.now() + '.jsonl');
  appendTimingRecord({ skill: 'subagent-execution', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'subagent-execution', dispatchCount: 2 }, logPath);
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').map(JSON.parse);
  assert.strictEqual(lines[0].dispatchCount, 2);
  assert.ok(typeof lines[0].timestamp === 'string', 'timestamp must be present to compute elapsed time');
  fs.unlinkSync(logPath);
});
```

- [ ] **Step 2: Run test — must pass immediately** (no RED step expected — this is confirming `ilce-s1`'s already-shipped `appendTimingRecord`/`dispatchCount` mechanism already covers AC5's data requirement, not building new code)

```bash
node tests/check-ilce-s3-review-outcome.js
```

Expected output: `Passed: 9`, `Failed: 0`. If this fails, that is a real finding — report it (AC5's assumption that `ilce-s1`'s mechanism already covers this would be wrong) rather than silently patching around it.

- [ ] **Step 3: Write minimal implementation**

No production code change required.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ilce-s3-review-outcome.js
```

Expected output: `Passed: 9`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: 0 new failures beyond the established rotating baseline.

- [ ] **Step 6: Commit**

```bash
git add tests/check-ilce-s3-review-outcome.js
git commit -m "test: confirm AC5's active-minutes-per-task data is already complete via ilce-s1's dispatchCount mechanism"
```
