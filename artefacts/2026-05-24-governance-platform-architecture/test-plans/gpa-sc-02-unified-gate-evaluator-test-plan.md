# Test Plan: SC-02 — Refactor assurance gate to unified gate evaluator

**Story:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-02-unified-gate-evaluator.md`
**Feature:** `2026-05-24-governance-platform-architecture`
**Test plan author:** pipeline /test-plan skill
**Date:** 2026-05-24
**Review report:** `artefacts/2026-05-24-governance-platform-architecture/review/gpa-sc-02-unified-gate-evaluator-review-1.md` — PASS

---

## NFR clarification (review finding 1-M1 resolution)

The story's NFR "Graceful degradation: If `governance-package` is not installed…" describes an impossible failure mode (local modules cannot be "not installed"). Per RISK-ACCEPT entry in `product/decisions.md` (2026-05-24), the corrected NFR binding this test plan is:

> If `require('../../src/enforcement/governance-package')` throws at module load time (e.g. file-not-found, syntax error in module, bad merge), `run-assurance-gate.js` must catch the error, write a warning to stderr, and fall back to the existing inline structural check verdict logic. Implementation: a `try/catch` block wrapping the `require` call at module scope.

---

## AC coverage

| AC | Description | Test IDs |
|----|-------------|----------|
| AC1 | `run-assurance-gate.js` calls `governance-package.evaluateGate({ gate: 'structural', context: { checks: runChecks(root) } })` for verdict | T4, T5, IT1, IT2, IT3 |
| AC2 | Gate verdict, check names, and failed-check reason strings are identical to previous inline implementation | IT2, IT3 |
| AC3 | `evaluateGate({ gate: 'structural', context: { checks: [...all 4...] } })` returns `{ passed: true, findings: [] }` for all-pass; `{ passed: false, findings: ['<reason>'] }` for one fail | T1, T2, T3 |
| AC4 | No independent gate evaluation logic remains in `run-assurance-gate.js` (all verdicts through `evaluateGate`) | IT3 |
| AC5 | All existing tests pass — no regression | Existing `npm test` suite |
| NFR | Graceful degradation: try/catch wraps governance-package require at module scope | T6 |

---

## Test environment

- **Runtime:** Node.js (same as all existing tests — plain `node tests/check-gpa-sc02-unified-gate-evaluator.js`)
- **External dependencies:** none — zero npm deps
- **Test data:** all fixtures constructed inline; no filesystem reads needed for unit tests
- **Integration tests:** use `os.tmpdir()` + temp dirs (same pattern as `check-assurance-gate.js`)
- **Test file:** `tests/check-gpa-sc02-unified-gate-evaluator.js`
- **Runner entry:** `tests/run-gpa-tests.js` (existing GPA runner) — add entry for sc02 file
- **Output prefix:** `[gpa-sc02]`
- **Pass/fail format:** `[gpa-sc02] Results: N passed, 0 failed`

### Files modified by implementation

| File | Change |
|------|--------|
| `src/enforcement/governance-package.js` | Add `structural` case to `evaluateGate` switch |
| `.github/scripts/run-assurance-gate.js` | Require governance-package (try/catch); call `evaluateGate` for verdict; accept `evaluateGateRunner` ctx hook |
| `tests/check-gpa-sc02-unified-gate-evaluator.js` | New test file (this plan) |
| `tests/run-gpa-tests.js` | Register sc02 test file |
| `CHANGELOG.md` | Entry under `### Added` |
| `.github/pipeline-state.json` | SC-02 stage/status update |

---

## Unit tests — governance-package.evaluateGate structural gate

These tests call `governance-package.evaluateGate` directly and assert the `structural` gate case behaves correctly.

All three fail before SC-02 because the `structural` case does not exist in `evaluateGate` — the `default` branch returns `{ passed: false, findings: ['Unknown gate: "structural"'] }` regardless of the checks.

### T1 — structural gate all-pass returns `{ passed: true, findings: [] }`

**AC:** AC3
**Input:**
```js
evaluateGate({
  gate: 'structural',
  context: {
    checks: [
      { name: 'workspace-state-valid',  passed: true },
      { name: 'pipeline-state-valid',   passed: true },
      { name: 'artefacts-dir-exists',   passed: true },
      { name: 'governance-gates-exists', passed: true },
    ],
  },
})
```
**Expected:** `{ passed: true, findings: [] }`
**Fails before SC-02:** yes — returns `{ passed: false, findings: ['Unknown gate: "structural"'] }`

### T2 — structural gate one-fail returns correct shape with reason string

**AC:** AC3
**Input:** same 4-check array but `workspace-state-valid` has `passed: false, reason: 'workspace/state.json not found'`
**Expected:** `{ passed: false, findings: ['workspace/state.json not found'] }`
**Fails before SC-02:** yes — findings contains `'Unknown gate: "structural"'` instead of the check reason

### T3 — structural gate multiple failures collects all reason strings

**AC:** AC3
**Input:** 4 checks with `workspace-state-valid` and `governance-gates-exists` both failing with distinct reason strings
**Expected:** `{ passed: false, findings: ['workspace/state.json not found', '.github/governance-gates.yml not found'] }`
**Fails before SC-02:** yes — findings contains `'Unknown gate: "structural"'` only

---

## Source code tests — run-assurance-gate.js

These tests read the source of `.github/scripts/run-assurance-gate.js` and assert structural properties of the implementation. They fail before SC-02 because the expected code patterns are not yet present.

### T4 — run-assurance-gate.js references governance-package

**AC:** AC1
**Assertion:** source of `.github/scripts/run-assurance-gate.js` contains `'governance-package'`
**Fails before SC-02:** yes — governance-package is not referenced in the file

### T5 — run-assurance-gate.js calls evaluateGate with structural gate

**AC:** AC1
**Assertion:** source of `.github/scripts/run-assurance-gate.js` contains `evaluateGate` AND `'structural'` within proximity of each other (or: source contains the string `gate: 'structural'`)
**Fails before SC-02:** yes — `evaluateGate` is not called in the file

### T6 — run-assurance-gate.js has try/catch guard around governance-package require (NFR)

**AC:** NFR graceful degradation
**Assertion:** source of `.github/scripts/run-assurance-gate.js` contains a `try` block AND `governance-package` in the same region, confirming the require is wrapped in error handling
**Fails before SC-02:** yes — no try/catch wrapping governance-package

---

## Integration tests — runGate with evaluateGateRunner hook

These tests call `runGate` with an injected `evaluateGateRunner` function via the `ctx` argument (similar to the existing `checksRunner` hook). This hook is not accepted by `runGate` before SC-02, so all three tests fail before implementation.

**Test context setup (shared):**
```js
const tmpDir  = fs.mkdtempSync(path.join(os.tmpdir(), 'sc02-gate-'));
const fakeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sc02-root-'));
// Create the 4 required files so checksRunner (real) returns all-pass
fs.mkdirSync(path.join(fakeRoot, 'workspace'));
fs.writeFileSync(path.join(fakeRoot, 'workspace', 'state.json'), '{}');
fs.mkdirSync(path.join(fakeRoot, '.github'));
fs.writeFileSync(path.join(fakeRoot, '.github', 'pipeline-state.json'), '{}');
fs.mkdirSync(path.join(fakeRoot, 'artefacts'));
fs.writeFileSync(path.join(fakeRoot, '.github', 'governance-gates.yml'), 'gates: []');
```

### IT1 — evaluateGateRunner is called when provided in ctx

**AC:** AC1
**Setup:** inject `evaluateGateRunner` that sets a flag `called = true` and returns `{ passed: true, findings: [] }`
**Call:** `runGate({ trigger: 'test', prRef: '', commitSha: '', tracesDir: tmpDir, root: fakeRoot, evaluateGateRunner: mockFn })`
**Assertion:** `called === true`
**Fails before SC-02:** yes — `runGate` does not accept `evaluateGateRunner` and the hook is never called

### IT2 — evaluateGateRunner receives correct structural gate arguments

**AC:** AC1, AC2
**Setup:** inject `evaluateGateRunner` that captures its arguments
**Assertion:** captured call args equal `{ gate: 'structural', context: { checks: [array of 4 check objects] } }` with check names `workspace-state-valid`, `pipeline-state-valid`, `artefacts-dir-exists`, `governance-gates-exists`
**Fails before SC-02:** yes — hook never called

### IT3 — verdict is derived from evaluateGateRunner return value, not inline checks

**AC:** AC1, AC4 (no independent verdict logic in runGate)
**Setup:**
- `checksRunner`: returns all 4 checks with `passed: false` (all failing)
- `evaluateGateRunner`: ignores checks, returns `{ passed: true, findings: [] }`
**Assertion:** `result.verdict === 'pass'`
**Rationale:** Before SC-02, `runGate` derives verdict inline from `checks.every(c => c.passed)`, so all-failing checks → `'fail'`. After SC-02, verdict comes from `evaluateGateRunner`'s return → `'pass'`. This directly tests that the inline logic has been replaced.
**Fails before SC-02:** yes — inline `checks.every` gives `verdict='fail'` regardless of evaluateGateRunner

---

## Regression tests (AC5 reference)

AC5 (no regression) is satisfied by the existing `npm test` suite — specifically, the 8+ test files that already pass on `master` before SC-02 implementation. No additional regression tests are written in the SC-02 file; the test runner exits with the combined results.

A note on backward compatibility: existing `runGate` callers (the CLI entry point and CI workflow) do not pass `evaluateGateRunner` — they receive the standard verdict from `governance-package.evaluateGate` after SC-02. No existing caller signatures change.

---

## Pre-condition: Wave 3 gate

SC-02 coding cannot begin until SC-06 (PR #371, path traversal guard for `sourceIntegrity`) is merged to master. This is the Wave 3 gate condition specified in the story. The DoR checker should verify SC-06's `prStatus = 'merged'` before signing off SC-02.

---

## Test file structure reference

```
tests/check-gpa-sc02-unified-gate-evaluator.js
  Prefix: [gpa-sc02]
  Sections:
    1. Unit tests — governance-package evaluateGate structural gate (T1, T2, T3)
    2. Source code checks — run-assurance-gate.js (T4, T5, T6)
    3. Integration tests — runGate with evaluateGateRunner hook (IT1, IT2, IT3)
  Total: 9 tests (3 unit + 3 source + 3 integration)
  All must fail before SC-02 implementation.
  All must pass after SC-02 implementation.
```

---

## Verification script

See `artefacts/2026-05-24-governance-platform-architecture/verification-scripts/gpa-sc-02-unified-gate-evaluator-verification.md` for the AC-by-AC verification checklist.
