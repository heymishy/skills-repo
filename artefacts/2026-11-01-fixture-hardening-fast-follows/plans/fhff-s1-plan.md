# Sweep fragile wall-clock NFR budgets and re-tune run-all-tests.js's concurrency cap — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Fix the 4 known contention-sensitive wall-clock NFR tests (`rb-s3`, `cat-s4`, `cat-s1`, `bri-s2.2`) so they tolerate real concurrent execution, then re-tune `scripts/run-all-tests.js`'s production concurrency cap as high as that evidence allows — buying back full-suite speed `tfhc-s9` had to give up for NFR-budget safety.
**Branch:** `feature/fhff-s1`
**Worktree:** `.worktrees/fhff-s1`
**Test command:** `npm test` (= `node scripts/run-all-tests.js`); this story's own new test file is run directly via `node tests/check-fhff-s1-pool-concurrency.js` during development (instant) and is also swept into `npm test` once committed.

**Task count note:** This plan uses 3 tasks rather than the skill's default one-task-per-AC granularity, per the operator's explicit instruction ("Yes with 3") at `/branch-setup` hand-off — same precedent as `tfhc-s9`'s own plan. AC2 is the only AC with a literal, pre-specifiable TDD shape; AC1/AC3/AC4/AC5 are genuinely investigation-heavy (per `/clarify`'s own finding and this story's Complexity Rating 3 / Scope stability Unstable), so Tasks 2–3 give a concrete, reproducible *procedure* with real commands and explicit decision rules rather than pre-written final diffs — the actual widened millisecond values cannot be known until the real contended-run-time evidence is gathered during execution.

---

## File map

```
Create:
  tests/check-fhff-s1-pool-concurrency.js                — the story's own unit test (AC2)

Modify:
  scripts/run-all-tests.js                                — extract getPoolConcurrency(); re-tune its value
  tests/check-rb-s3-harness-agnostic-instructions.js       — fix/widen the 2000ms assembly+drift budget (line 330)
  tests/check-cat-s4-features-page-integration.js          — fix/widen the 100ms walk budget (line 392)
  tests/check-cat-s1-core-trace-builder.js                 — fix/widen the 50ms walk budget (line 279)
  tests/check-bri-s2.2-neon-staging-branch.js               — fix/widen IT1 (line 174) / IT2 (line 189) as needed
```

---

## Background: each file's current budget (read directly from source before this story)

| File | Line | Assertion | Mechanism |
|------|------|-----------|-----------|
| `tests/check-rb-s3-harness-agnostic-instructions.js` | 330 | `assert.ok(elapsed < 2000, ...)` | real subprocess spawn (`runAssembly`) + `checkDrift()` |
| `tests/check-cat-s4-features-page-integration.js` | 392 | `assert.ok(elapsedMs < 100, ...)` | in-process walk+classify+adapt+render, 205-file `phase4-scale` dir |
| `tests/check-cat-s1-core-trace-builder.js` | 279 | `assert.ok(elapsedMs < 50, ...)` | in-process walk only (`buildArtefactTrace`), same 205-file dir |
| `tests/check-bri-s2.2-neon-staging-branch.js` | 174 (IT1), 189 (IT2) | `elapsed < 1000` (IT1); `elapsed >= 300 && elapsed < 1000` (IT2) | mocked-timing `waitForDbReady`/`DbConnectTimeoutError` — IT2's upper bound is a real `setTimeout` that can fire late under event-loop lag |

All 4 pass standalone; all 4 are sensitive to real sibling-process CPU contention under the full suite. This is exactly the shape the test plan's Honest scoping note describes — do not invent a synthetic contention simulation.

---

## Task 1: Extract `getPoolConcurrency()` as a behaviour-preserving refactor

**Goal:** Make the production concurrency value independently callable/testable (per `.github/standards/testing/test-design-patterns.md`'s "a whole-file source-text regex is vacuous" rule, already injected into this story's DoR) *without yet changing its value* — that happens in Task 3, once Task 2's evidence justifies a specific number.

**Files:**
- Create: `tests/check-fhff-s1-pool-concurrency.js`
- Modify: `scripts/run-all-tests.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-fhff-s1-pool-concurrency.js`:

```js
#!/usr/bin/env node
/**
 * check-fhff-s1-pool-concurrency.js
 *
 * Tests for fhff-s1 -- getPoolConcurrency(), the extracted, independently
 * testable production concurrency-cap function in scripts/run-all-tests.js.
 *
 * Covers: AC2 (unit). AC1/AC3/AC4/AC5 are real-environment manual
 * verifications -- see the story's own test plan Coverage gaps table.
 *
 * Run: node tests/check-fhff-s1-pool-concurrency.js
 */
'use strict';

const os = require('os');
const { getPoolConcurrency } = require('../scripts/run-all-tests.js');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function ok() { totalPassed++; }
function fail(label, message) {
  totalFailed++;
  issues.push(`  ✗ [${label}] ${message}`);
}
function assertCheck(label, condition, message) {
  if (condition) { ok(); } else { fail(label, message); }
}

// -- Task 1: extraction is behaviour-preserving (same value as today's
// inline formula). This is NOT yet AC2's final "higher than before" claim
// -- that assertion replaces this one in Task 3, once the cap is actually
// re-tuned using Task 2's real evidence. ----------------------------------
{
  const T = 'extraction-is-behaviour-preserving';
  const oldFormulaValue = Math.max(1, Math.ceil(os.cpus().length / 3));
  const newCap = getPoolConcurrency();
  assertCheck(T, newCap === oldFormulaValue,
    `Expected getPoolConcurrency() to return the same value as the pre-extraction formula (${oldFormulaValue}) until Task 3 re-tunes it, got ${newCap}`);
}

if (totalFailed > 0) {
  console.error(`[fhff-s1-pool-concurrency] FAIL -- ${issues.length} issue(s) found:`);
  issues.forEach(i => console.error(i));
  process.exit(1);
} else {
  console.log(`[fhff-s1-pool-concurrency] ${totalPassed} check(s) OK ✓`);
}
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fhff-s1-pool-concurrency.js
```

Expected output: `TypeError: getPoolConcurrency is not a function` (the export doesn't exist yet).

- [ ] **Step 3: Extract the function in `scripts/run-all-tests.js`**

Add this function near the top-level helpers (same section as `GRANDFATHER_LIST`/`SEQUENTIAL_EXCLUSIVE_LIST`, before `runAll`):

```js
/**
 * Returns the production concurrency cap used by runAll()'s pool phase.
 * Extracted out of the formerly-inline Math.max(1, Math.ceil(...))
 * expression so AC2 can assert against this function's real return value
 * rather than a fragile whole-file source-text match (see
 * .github/standards/testing/test-design-patterns.md, applied at fhff-s1's
 * own DoR). See decisions.md's fhff-s1 entries for the real contended-
 * run-time evidence behind this value.
 *
 * @returns {number}
 */
function getPoolConcurrency() {
  return Math.max(1, Math.ceil(os.cpus().length / 3));
}
```

Then replace the `poolResult` block inside `runAll` (the one with the long `Math.max(1, Math.ceil(os.cpus().length / 3))` comment) with:

```js
  const poolResult = await runFilesConcurrently(poolFiles, {
    concurrency: getPoolConcurrency(),
    timeoutMs: 120000,
    cwd: repoRoot
  });
```

(The old explanatory comment above that block can be deleted — its content now belongs on `getPoolConcurrency()`'s own docstring above.)

Finally, add `getPoolConcurrency` to the `module.exports` block:

```js
module.exports = {
  discoverTestFiles: discoverTestFiles,
  GRANDFATHER_LIST: GRANDFATHER_LIST,
  SEQUENTIAL_EXCLUSIVE_LIST: SEQUENTIAL_EXCLUSIVE_LIST,
  getAllTestFiles: getAllTestFiles,
  runFilesConcurrently: runFilesConcurrently,
  getPoolConcurrency: getPoolConcurrency,
  runAll: runAll
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fhff-s1-pool-concurrency.js
```

Expected output: `[fhff-s1-pool-concurrency] 1 check(s) OK ✓`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same file count as this story's own `/branch-setup` baseline (+1 for the new test file), and only the known baseline failures — `scripts/check-pipeline-state-integrity.js` ([C3]), `tests/check-pcr-s1-test-runner.js` (N1 flake), `tests/check-p3.5-validate-trace.js` (stray-artefact flake), plus the 4 files this story exists to fix (`rb-s3`, `cat-s4`, `cat-s1`, `bri-s2.2` — still expected to fail intermittently at this point, since the cap hasn't changed yet and no fix has been applied). No *other* new or different failure.

- [ ] **Step 6: Commit**

```bash
git add scripts/run-all-tests.js tests/check-fhff-s1-pool-concurrency.js
git commit -m "refactor: extract getPoolConcurrency() from run-all-tests.js's inline cap formula"
```

---

## Task 2: Investigate and fix the 4 fragile files (AC1, AC5)

**Goal:** Gather real contended-run-time evidence at a deliberately-raised trial concurrency, then for each of the 4 files either (a) widen its budget to an evidence-justified value, or (b) defer the fix and log why in `decisions.md` per AC5 — never force through a threshold wide enough to be meaningless.

**Files:**
- Modify (conditionally — only files that get a real, justified widen): `tests/check-rb-s3-harness-agnostic-instructions.js`, `tests/check-cat-s4-features-page-integration.js`, `tests/check-cat-s1-core-trace-builder.js`, `tests/check-bri-s2.2-neon-staging-branch.js`
- Modify (temporary, not committed until Task 3): `scripts/run-all-tests.js`'s `getPoolConcurrency()` return statement

- [ ] **Step 1: Set a trial concurrency and generate real contention**

Temporarily change `getPoolConcurrency()`'s return statement to a higher trial value, starting with the full core count:

```js
function getPoolConcurrency() {
  return os.cpus().length; // TEMPORARY — fhff-s1 Task 2 investigation trial. Do not commit this line as-is.
}
```

Do not commit this intermediate state — it exists only to generate real contention for measurement during this task.

- [ ] **Step 2: Run the full suite 5 times and record every failure**

```bash
node scripts/run-all-tests.js
```

Run this 5 times in a row. For each run, record:
- Which of the 4 named files failed (if any)
- The exact `elapsed`/`elapsedMs` value reported in each failure's assertion message (the message already embeds the measured value, e.g. `assembly + drift-check took 2340ms — expected under 2000ms`)
- Any file **outside** the 4 named ones that fails — if this happens, STOP per the DoR's own constraint: do not fix or touch that 5th file; add a PR comment naming it and treat this trial concurrency as the ceiling for this story (do not raise it further).

- [ ] **Step 3: Decide, per file, whether a widen is safe and meaningful**

For each of the 4 files that showed a real failure above, apply this rule:

- **If the observed failing values across the 5 runs are bounded and the file's underlying operation still meaningfully constrains regressions** (i.e. a threshold of `ceil(max observed value × 1.5)` is still tight enough that a genuine performance regression in that code path would still be caught), widen that file's assertion to that computed value. Update the assertion's own message to cite the real measured range and this story, e.g.:

  ```js
  // Widened 2026-11 (fhff-s1): real contended-run-time evidence showed this
  // assertion failing up to ~<observed-max>ms under full-suite concurrent
  // load at the new cap (previously 2000ms, tuned for concurrency 3 at
  // tfhc-s9). New budget retains meaningful regression-detection headroom.
  // See decisions.md's fhff-s1 entries.
  assert.ok(elapsed < <new-value>, `assembly + drift-check took ${elapsed}ms — expected under <new-value>ms`);
  ```

  Apply the same pattern to `cat-s4` (line 392), `cat-s1` (line 279), and `bri-s2.2`'s IT1 (line 174) / IT2 (line 189) — for IT2 specifically, widen the **upper bound** only (`elapsed < 1000` → a larger number); the lower bound (`elapsed >= 300`) stays unchanged since that's checking the timeout actually waited its configured budget, not a contention-sensitive value.

- **If no such bounded widen exists** (failures are unbounded, or the required threshold would make the NFR meaningless — e.g. a sub-100ms regression-detection budget would need to become several seconds to pass reliably), do **not** widen that file. Leave its original assertion untouched, and add a `decisions.md` entry now:

  ```
  **2026-11-01 | RISK-ACCEPT | /subagent-execution (fhff-s1, Task 2)**
  **Decision:** Defer fixing <file>'s wall-clock budget — a safe widen was not found.
  **Rationale:** [real observed values / why no bounded widen preserves a meaningful NFR]
  **Made by:** Copilot (AC5)
  **Revisit trigger:** If a future story needs this file stable under higher concurrency, revisit with fresh evidence.
  ```

- [ ] **Step 4: Confirm stability at the chosen trial concurrency**

Re-run `node scripts/run-all-tests.js` 5 more times at the same trial concurrency with the widened assertions in place. All 4 files (fixed-or-deferred) should now show no *unexpected* failure — a deferred file is expected to still occasionally fail (that's what AC5's deferral means) and stays in the known-baseline list; a fixed file must now pass every time.

If any fixed file still fails intermittently, either widen further (repeat Step 3's bounded-widen check) or back off the trial concurrency by 1 (`os.cpus().length - 1`) and repeat Steps 2–4 at the lower value — same iterative pattern `tfhc-s9` used (it started at the raw core count, then `-2`, then settled on `Math.ceil(cores/3)`).

- [ ] **Step 5: Mutation-check each widened assertion**

For each file actually widened in Step 3, temporarily revert its threshold to the *original* (pre-this-story) value and re-run that single file standalone (`node tests/check-<file>.js`) under no artificial load — confirm it still **passes** standalone at the old value (proving the widen was about contention tolerance, not masking a real regression in the normal case). Then restore the widened value.

- [ ] **Step 6: Commit**

```bash
git add tests/check-rb-s3-harness-agnostic-instructions.js tests/check-cat-s4-features-page-integration.js tests/check-cat-s1-core-trace-builder.js tests/check-bri-s2.2-neon-staging-branch.js artefacts/2026-11-01-fixture-hardening-fast-follows/decisions.md
git commit -m "fix: widen contention-sensitive wall-clock NFR budgets with real evidence (fhff-s1)"
```

(Only `git add` the files actually modified — a deferred file per AC5 has no diff to stage.)

---

## Task 3: Re-tune the production cap and close out AC1/AC2/AC3

**Goal:** Make `getPoolConcurrency()`'s real, permanent return value match the trial concurrency Task 2 confirmed stable, prove AC2's "higher than before" claim with a genuinely-discriminating test, and run the final repeated verification sweeps.

**Files:**
- Modify: `scripts/run-all-tests.js`
- Modify: `tests/check-fhff-s1-pool-concurrency.js`

- [ ] **Step 1: Replace Task 1's test block with AC2's real final assertion**

In `tests/check-fhff-s1-pool-concurrency.js`, replace the `extraction-is-behaviour-preserving` block with:

```js
{
  const T = 'AC2-concurrency-cap-retuned-upward';
  const oldFormulaValue = Math.max(1, Math.ceil(os.cpus().length / 3));
  const newCap = getPoolConcurrency();
  assertCheck(T, newCap > oldFormulaValue,
    `Expected getPoolConcurrency() (${newCap}) to be strictly greater than the old formula's value (${oldFormulaValue})`);
  assertCheck(T + '-sanity-ceiling', newCap <= os.cpus().length,
    `Expected getPoolConcurrency() (${newCap}) to never exceed the real core count (${os.cpus().length})`);
}
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fhff-s1-pool-concurrency.js
```

Expected output: a failure on `AC2-concurrency-cap-retuned-upward` — `getPoolConcurrency()` still returns the old formula's value at this point (Task 2's trial value was never committed to this function).

- [ ] **Step 3: Set the real, permanent value**

Replace `getPoolConcurrency()`'s body with the trial concurrency value Task 2 confirmed stable (remove the `TEMPORARY` comment from Task 2 Step 1). Follow the existing code's own documentation style (see `tfhc-s9`'s own comment at the old inline site for the expected level of detail):

```js
function getPoolConcurrency() {
  // Re-tuned 2026-11 (fhff-s1): the previous Math.max(1, Math.ceil(cores/3))
  // value (tfhc-s9) was throttled specifically because rb-s3/cat-s4/cat-s1
  // failed under contention at higher concurrency. This story's own NFR-
  // budget sweep fixed those 3 plus a 4th (bri-s2.2) with real evidence-
  // justified widened budgets, confirmed stable across 10 repeated full-
  // suite runs (5 in Task 2, 5 more below) at this value. See decisions.md's
  // fhff-s1 entries for the full measurement history.
  return <the value Task 2 confirmed stable>;
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fhff-s1-pool-concurrency.js
```

Expected output: `[fhff-s1-pool-concurrency] 2 check(s) OK ✓`

- [ ] **Step 5: Mutation-test the guard**

Temporarily revert `getPoolConcurrency()` to return the old formula value, confirm `node tests/check-fhff-s1-pool-concurrency.js` now fails on `AC2-concurrency-cap-retuned-upward`. Restore the real value and confirm it passes again.

- [ ] **Step 6: Final verification sweeps (AC1, AC3)**

```bash
npm test
```

Run this 5 more times. Expected output each time: the same known baseline failures only (`scripts/check-pipeline-state-integrity.js` [C3], `tests/check-pcr-s1-test-runner.js` N1 flake, `tests/check-p3.5-validate-trace.js` stray-artefact flake, plus any file Task 2 explicitly deferred under AC5) — `rb-s3`, `cat-s4`, `cat-s1`, and `bri-s2.2` must now pass in every run unless individually deferred. No file outside this known list may appear (AC3).

- [ ] **Step 7: Commit**

```bash
git add scripts/run-all-tests.js tests/check-fhff-s1-pool-concurrency.js
git commit -m "perf: re-tune run-all-tests.js's pool concurrency cap based on fhff-s1's NFR-budget sweep"
```

---

## After all 3 tasks: AC4 (manual, not a task)

AC4 (real CI `Unit test chain` step duration measurably reduces below 124s) has no task above by design — per the test plan's own Coverage gaps table, it is measured manually once this story's own PR is open, via the same `gh api repos/heymishy/skills-repo/actions/jobs/<id>` technique already proven at `tfhc-s9`'s own DoD. Do not add a 4th task for it.
