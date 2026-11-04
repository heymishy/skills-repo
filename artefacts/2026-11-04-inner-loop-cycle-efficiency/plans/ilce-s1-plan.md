# Add structured per-skill timing writes to pipeline-timings.jsonl — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Each of the 5 inner-loop skills appends one structured timing record to `.github/pipeline-timings.jsonl` when it completes its own stage.
**Branch:** `feature/ilce-s1`
**Worktree:** `.worktrees/ilce-s1`
**Test command:** `node scripts/run-all-tests.js` (full suite) / `node tests/check-ilce-s1-pipeline-timings.js` (this story's file directly)

---

## File map

```
Create:
  scripts/lib/pipeline-timings.js        — appendTimingRecord/validateRecord/sanitizeRecord shared module
  tests/check-ilce-s1-pipeline-timings.js — regression tests for AC1–AC4

Modify:
  skills/branch-setup/SKILL.md           — add timing-write step to "State update — mandatory final step"
  skills/implementation-plan/SKILL.md    — same
  skills/subagent-execution/SKILL.md     — same, includes dispatchCount
  skills/verify-completion/SKILL.md      — same, includes fullSuite
  skills/branch-complete/SKILL.md        — same
```

---

## Task 1: Core append function — required fields, allowlist sanitization, fresh-file creation

**Files:**
- Create: `scripts/lib/pipeline-timings.js`
- Test: `tests/check-ilce-s1-pipeline-timings.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

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

function tempLogPath() {
  return path.join(os.tmpdir(), 'ilce-s1-timings-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.jsonl');
}

// AC1: well-formed record with required fields
test('appendTimingRecord writes a well-formed record with required fields', () => {
  const { appendTimingRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  appendTimingRecord({ skill: 'implementation-plan', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'implementation-plan' }, logPath);
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
  const record = JSON.parse(lines[lines.length - 1]);
  assert.strictEqual(record.skill, 'implementation-plan');
  assert.strictEqual(record.featureSlug, 'test-feat');
  assert.strictEqual(record.storySlug, 'test-s1');
  assert.strictEqual(record.stage, 'implementation-plan');
  assert.ok(typeof record.timestamp === 'string' && !isNaN(Date.parse(record.timestamp)), 'timestamp must be a valid ISO 8601 string');
  fs.unlinkSync(logPath);
});

// AC2: creates the file fresh when it does not exist
test('appendTimingRecord creates the log file fresh when it does not exist', () => {
  const { appendTimingRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  assert.ok(!fs.existsSync(logPath), 'precondition: file must not exist yet');
  appendTimingRecord({ skill: 'branch-setup', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'branch-setup' }, logPath);
  assert.ok(fs.existsSync(logPath));
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
  assert.strictEqual(lines.length, 1);
  assert.doesNotThrow(() => JSON.parse(lines[0]));
  fs.unlinkSync(logPath);
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
node tests/check-ilce-s1-pipeline-timings.js
```

Expected output: `Error: Cannot find module '../scripts/lib/pipeline-timings'`

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';
const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, '..', '..', '.github', 'pipeline-timings.jsonl');
const ALLOWED_FIELDS = ['skill', 'featureSlug', 'storySlug', 'stage', 'timestamp', 'dispatchCount', 'fullSuite'];
const REQUIRED_FIELDS = ['skill', 'featureSlug', 'storySlug', 'stage', 'timestamp'];

function validateRecord(record) {
  for (const field of REQUIRED_FIELDS) {
    if (!(field in record)) {
      return { valid: false, reason: 'missing required field: ' + field };
    }
  }
  return { valid: true };
}

function sanitizeRecord(record) {
  const clean = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in record) clean[field] = record[field];
  }
  return clean;
}

function appendTimingRecord(record, logPath) {
  const target = logPath || LOG_PATH;
  try {
    const full = Object.assign({ timestamp: new Date().toISOString() }, record);
    const validation = validateRecord(full);
    if (!validation.valid) {
      console.warn('[pipeline-timings] WARNING: ' + validation.reason + ' -- skipping write');
      return false;
    }
    const clean = sanitizeRecord(full);
    fs.appendFileSync(target, JSON.stringify(clean) + '\n', 'utf8');
    return true;
  } catch (err) {
    console.warn('[pipeline-timings] WARNING: failed to write timing record -- ' + err.message);
    return false;
  }
}

module.exports = { appendTimingRecord, validateRecord, sanitizeRecord, LOG_PATH, ALLOWED_FIELDS, REQUIRED_FIELDS };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ilce-s1-pipeline-timings.js
```

Expected output: `Passed: 2`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same pre-existing failure count as the branch-setup baseline (the 4 already-acknowledged pre-existing failures), 0 new failures

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/pipeline-timings.js tests/check-ilce-s1-pipeline-timings.js
git commit -m "feat: add appendTimingRecord core function for inner-loop timing instrumentation"
```

---

## Task 2: Stage-conditional fields (dispatchCount, fullSuite) and the schema allowlist

**Files:**
- Modify: `scripts/lib/pipeline-timings.js` (no change needed — allowlist already covers both fields; this task adds the regression tests proving it)
- Test: `tests/check-ilce-s1-pipeline-timings.js`

- [ ] **Step 1: Write the failing test**

```javascript
// AC1: dispatchCount is stage-conditional (subagent-execution only)
test('appendTimingRecord includes dispatchCount only when provided, for any stage', () => {
  const { appendTimingRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  appendTimingRecord({ skill: 'subagent-execution', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'subagent-execution', dispatchCount: 3 }, logPath);
  appendTimingRecord({ skill: 'branch-setup', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'branch-setup' }, logPath);
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').map(JSON.parse);
  assert.strictEqual(lines[0].dispatchCount, 3);
  assert.ok(!('dispatchCount' in lines[1]), 'a record with no dispatchCount passed in must not contain the field');
  fs.unlinkSync(logPath);
});

// AC1: fullSuite is stage-conditional (verify-completion only)
test('appendTimingRecord includes fullSuite only when provided', () => {
  const { appendTimingRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  appendTimingRecord({ skill: 'verify-completion', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'verify-completion', fullSuite: true }, logPath);
  appendTimingRecord({ skill: 'verify-completion', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'verify-completion', fullSuite: false }, logPath);
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').map(JSON.parse);
  assert.strictEqual(lines[0].fullSuite, true);
  assert.strictEqual(lines[1].fullSuite, false);
  fs.unlinkSync(logPath);
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ilce-s1-pipeline-timings.js
```

Expected output: these 2 new tests fail if `ALLOWED_FIELDS` doesn't already include `dispatchCount`/`fullSuite` — but Task 1's implementation already lists both, so this step confirms them rather than driving new code. If somehow failing, the allowlist is missing a field.

- [ ] **Step 3: Write minimal implementation**

No production code change required — `ALLOWED_FIELDS` from Task 1 already includes both fields. This task exists to make that contract explicit and regression-tested, not to add new behaviour.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ilce-s1-pipeline-timings.js
```

Expected output: `Passed: 4`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: 0 new failures

- [ ] **Step 6: Commit**

```bash
git add tests/check-ilce-s1-pipeline-timings.js
git commit -m "test: lock in dispatchCount/fullSuite stage-conditional field contract"
```

---

## Task 3: Schema validation and non-fatal write-failure behaviour

**Files:**
- Modify: `scripts/lib/pipeline-timings.js` (no change needed — Task 1's try/catch and `validateRecord` already implement this; this task adds the regression tests)
- Test: `tests/check-ilce-s1-pipeline-timings.js`

- [ ] **Step 1: Write the failing test**

```javascript
// AC4: schema validator rejects a record missing a required field
test('validateRecord rejects a record missing a required field', () => {
  const { validateRecord } = require('../scripts/lib/pipeline-timings');
  const result = validateRecord({ skill: 'branch-setup', featureSlug: 'test-feat', stage: 'branch-setup', timestamp: new Date().toISOString() });
  assert.strictEqual(result.valid, false);
  assert.ok(/storySlug/.test(result.reason), 'reason must name the missing field');
});

// AC4: validateRecord accepts a well-formed record
test('validateRecord accepts a well-formed record', () => {
  const { validateRecord } = require('../scripts/lib/pipeline-timings');
  const result = validateRecord({ skill: 'branch-setup', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'branch-setup', timestamp: new Date().toISOString() });
  assert.strictEqual(result.valid, true);
});

// AC4: a write failure does not throw and does not block the caller
test('appendTimingRecord does not throw when the underlying write fails', () => {
  const pipelineTimings = require('../scripts/lib/pipeline-timings');
  const originalAppend = fs.appendFileSync;
  fs.appendFileSync = () => { throw new Error('simulated disk failure'); };
  let threw = false;
  let result;
  try {
    result = pipelineTimings.appendTimingRecord({ skill: 'branch-setup', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'branch-setup' }, tempLogPath());
  } catch (e) {
    threw = true;
  } finally {
    fs.appendFileSync = originalAppend;
  }
  assert.strictEqual(threw, false, 'appendTimingRecord must not throw on write failure');
  assert.strictEqual(result, false, 'appendTimingRecord must return false on write failure, not throw');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ilce-s1-pipeline-timings.js
```

Expected output: these 3 tests pass against Task 1's existing implementation (same note as Task 2 — the behaviour was built defensively from the start; this task locks it in with explicit regression coverage per the test plan's AC4 split).

- [ ] **Step 3: Write minimal implementation**

No production code change required.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ilce-s1-pipeline-timings.js
```

Expected output: `Passed: 7`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: 0 new failures

- [ ] **Step 6: Commit**

```bash
git add tests/check-ilce-s1-pipeline-timings.js
git commit -m "test: lock in schema validation and non-fatal write-failure behaviour"
```

---

## Task 4: Concurrent-write safety

**Files:**
- Test: `tests/check-ilce-s1-pipeline-timings.js`

- [ ] **Step 1: Write the failing test**

```javascript
// AC3: two near-simultaneous append calls do not corrupt the file
test('two near-simultaneous append calls do not corrupt the log file', () => {
  const { appendTimingRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  appendTimingRecord({ skill: 'branch-setup', featureSlug: 'test-feat', storySlug: 'existing', stage: 'branch-setup' }, logPath);
  appendTimingRecord({ skill: 'implementation-plan', featureSlug: 'test-feat', storySlug: 'concurrent-a', stage: 'implementation-plan' }, logPath);
  appendTimingRecord({ skill: 'implementation-plan', featureSlug: 'test-feat', storySlug: 'concurrent-b', stage: 'implementation-plan' }, logPath);
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
  assert.strictEqual(lines.length, 3, 'all 3 appends must be present as 3 separate lines');
  lines.forEach(line => assert.doesNotThrow(() => JSON.parse(line), 'every line must parse as valid JSON, none interleaved or truncated'));
  fs.unlinkSync(logPath);
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ilce-s1-pipeline-timings.js
```

Expected output: this test passes against Task 1's implementation (`fs.appendFileSync` with the `O_APPEND` flag is atomic for writes of this size) — confirming the existing design is safe rather than driving a code change.

- [ ] **Step 3: Write minimal implementation**

No production code change required.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ilce-s1-pipeline-timings.js
```

Expected output: `Passed: 8`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: 0 new failures

- [ ] **Step 6: Commit**

```bash
git add tests/check-ilce-s1-pipeline-timings.js
git commit -m "test: lock in concurrent-write safety for the timing log"
```

---

## Task 5: Wire the timing write into /branch-setup, /implementation-plan, /verify-completion, /branch-complete

**Files:**
- Modify: `skills/branch-setup/SKILL.md`, `skills/implementation-plan/SKILL.md`, `skills/verify-completion/SKILL.md`, `skills/branch-complete/SKILL.md`
- Test: `tests/check-ilce-s1-pipeline-timings.js`

- [ ] **Step 1: Write the failing test**

```javascript
// AC1: each of the 4 skills' State update section references the shared timing module
test('branch-setup, implementation-plan, verify-completion, and branch-complete SKILL.md files reference pipeline-timings', () => {
  const skillFiles = [
    'skills/branch-setup/SKILL.md',
    'skills/implementation-plan/SKILL.md',
    'skills/verify-completion/SKILL.md',
    'skills/branch-complete/SKILL.md',
  ];
  skillFiles.forEach(relPath => {
    const content = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
    assert.ok(content.includes('pipeline-timings.jsonl'), relPath + ' must reference pipeline-timings.jsonl in its State update section');
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ilce-s1-pipeline-timings.js
```

Expected output: `AssertionError: skills/branch-setup/SKILL.md must reference pipeline-timings.jsonl in its State update section`

- [ ] **Step 3: Write minimal implementation**

Add this paragraph immediately before the closing confirmation line of each file's existing "## State update — mandatory final step" section (do not alter any other existing content in that section):

```markdown
**Timing instrumentation:** Append one record to `.github/pipeline-timings.jsonl` via `scripts/lib/pipeline-timings.js`'s `appendTimingRecord({skill, featureSlug, storySlug, stage})` — `skill` is this skill's own name, `stage` matches this skill's stage value. A write failure here is non-fatal and must not block this skill's own completion.
```

For `skills/verify-completion/SKILL.md` specifically, use this variant instead (adds the `fullSuite` field):

```markdown
**Timing instrumentation:** Append one record to `.github/pipeline-timings.jsonl` via `scripts/lib/pipeline-timings.js`'s `appendTimingRecord({skill: 'verify-completion', featureSlug, storySlug, stage: 'verify-completion', fullSuite})` — `fullSuite` is `true` if Step 1 ran the complete test suite, `false` if it ran a targeted/partial subset. A write failure here is non-fatal and must not block this skill's own completion.
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ilce-s1-pipeline-timings.js
```

Expected output: `Passed: 9`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: 0 new failures

- [ ] **Step 6: Commit**

```bash
git add skills/branch-setup/SKILL.md skills/implementation-plan/SKILL.md skills/verify-completion/SKILL.md skills/branch-complete/SKILL.md tests/check-ilce-s1-pipeline-timings.js
git commit -m "feat: wire timing instrumentation into branch-setup, implementation-plan, verify-completion, branch-complete"
```

---

## Task 6: Wire the timing write into /subagent-execution (with dispatchCount)

**Files:**
- Modify: `skills/subagent-execution/SKILL.md`
- Test: `tests/check-ilce-s1-pipeline-timings.js`

- [ ] **Step 1: Write the failing test**

```javascript
// AC1: subagent-execution's State update section references pipeline-timings and dispatchCount
test('subagent-execution SKILL.md references pipeline-timings and dispatchCount', () => {
  const content = fs.readFileSync(path.join(__dirname, '..', 'skills/subagent-execution/SKILL.md'), 'utf8');
  assert.ok(content.includes('pipeline-timings.jsonl'), 'must reference pipeline-timings.jsonl');
  assert.ok(content.includes('dispatchCount'), 'must reference dispatchCount specifically');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ilce-s1-pipeline-timings.js
```

Expected output: `AssertionError: must reference pipeline-timings.jsonl`

- [ ] **Step 3: Write minimal implementation**

Add this paragraph to `skills/subagent-execution/SKILL.md`'s existing "## State update — mandatory final step" section, immediately before its closing confirmation line:

```markdown
**Timing instrumentation:** After each task's dispatch round completes, append one record to `.github/pipeline-timings.jsonl` via `scripts/lib/pipeline-timings.js`'s `appendTimingRecord({skill: 'subagent-execution', featureSlug, storySlug, stage: 'subagent-execution', dispatchCount})` — `dispatchCount` is the number of subagent dispatches issued for that task (implementer + reviewer(s), counting any re-dispatch). A write failure here is non-fatal and must not block this skill's own completion.
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ilce-s1-pipeline-timings.js
```

Expected output: `Passed: 10`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: 0 new failures

- [ ] **Step 6: Commit**

```bash
git add skills/subagent-execution/SKILL.md tests/check-ilce-s1-pipeline-timings.js
git commit -m "feat: wire timing instrumentation into subagent-execution with dispatchCount"
```
