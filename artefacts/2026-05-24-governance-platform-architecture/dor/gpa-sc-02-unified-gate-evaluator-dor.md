# Definition of Ready Checklist

## Definition of Ready: Promote governance-package as single gate evaluator (SC-02)

**Story reference:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-02-unified-gate-evaluator.md`
**Test plan reference:** `artefacts/2026-05-24-governance-platform-architecture/test-plans/gpa-sc-02-unified-gate-evaluator-test-plan.md`
**Verification script:** `artefacts/2026-05-24-governance-platform-architecture/verification-scripts/gpa-sc-02-unified-gate-evaluator-verification.md`
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-26

---

## Contract Proposal

**What will be built:**
1. `src/enforcement/governance-package.js` — a new `'structural'` case is added to the `evaluateGate` switch. Input: `context.checks` (array of `{ name, passed, reason? }` objects matching the output of `runChecks(root)`). Return: `{ passed: checks.every(c => c.passed), findings: failed-check reason strings }`. The existing four gate cases (`dor`, `review`, `test-plan`, `definition-of-done`) and the `default` branch are untouched.

2. `.github/scripts/run-assurance-gate.js` — three changes: (a) a try/catch block at module scope wraps `require('../../src/enforcement/governance-package')` — on success, `_gp` is set; on catch, a warning is written to stderr and `_gp` remains null (graceful degradation per corrected NFR RISK-ACCEPT); (b) the inline verdict derivation (`const allPassed = checks.every(...)`) is replaced by a call to `evaluateGate({ gate: 'structural', context: { checks } })` when `_gp` is available, falling back to the existing inline logic if `_gp` is null; (c) `runGate(ctx)` accepts an optional `evaluateGateRunner` hook in `ctx` for testability — when provided, it overrides both `_gp.evaluateGate` and the inline fallback.

3. `tests/check-gpa-sc02-unified-gate-evaluator.js` — new test file with 9 tests (T1–T6, IT1–IT3) exercising the evaluateGate structural case and the run-assurance-gate wiring. All 9 tests are designed to fail before implementation begins. Added to `tests/run-gpa-tests.js`.

**What will NOT be built:**
- Wiring H1–H9 gate checks through `evaluateGate` — that is SC-03's scope; SC-02 addresses the `structural` gate type only.
- Adding new gate types beyond `structural` — separate stories if warranted.
- Changing `assurance-gate.yml` YAML structure, trigger events, or permission scopes — only the Node.js evaluation logic changes.
- Making H-gate failures merge-blocking — post-Wave-3 governance decision outside this feature's scope.
- Modifying `scripts/ci-audit-comment.js` — SC-07/SC-06 scope.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — run-assurance-gate.js calls evaluateGate({gate:'structural', context:{checks}}) instead of inline checks.every | T4 (source contains 'governance-package'), T5 (source contains evaluateGate + 'structural'), IT1-IT3 (hook called with correct args and verdict derived from hook return) | unit + integration |
| AC2 — functional equivalence: check names, pass/fail outcomes, reason strings preserved | T1 (4 passing checks → passed:true), T2 (1 failing → findings:[reason]), T3 (2 failing → both reasons), IT3 (verdict from evaluateGateRunner matches expected) | unit + integration |
| AC3 — governance-package imported; evaluateGate called correctly | T1–T3 (evaluateGate structural case), T4 (import dependency in source), T5 (usage in source) | unit |
| AC4 — no independent gate evaluation logic; all gate verdicts trace through evaluateGate | T4+T5 (source grep), T6 (try/catch present = NFR satisfied) | unit |
| AC5 — all existing tests pass; no regression | npm test full suite (baseline verified before and after) | regression |

**Assumptions:**
- A1: The inline verdict derivation block in `run-assurance-gate.js` (currently `const allPassed = checks.every(function (c) { return c.passed; }); const verdict = allPassed ? 'pass' : 'fail';`) is the exact target for replacement.
- A2: `runChecks(root)` output shape (`[{name, passed, reason?}]`) is stable and matches what the new `structural` case expects — no transformation required.
- A3: The `evaluateGateRunner` hook in `ctx` is an optional override: when provided, it is called in preference to `_gp.evaluateGate`; when absent, `_gp.evaluateGate` is used. This pattern is identical to the existing `checksRunner` hook.
- A4: SC-06 (`gpa-sc-06-source-path-guard`) must be merged before implementation begins — Wave 3 gate. Verify `prStatus === 'merged'` for SC-06 before writing any code.

**Estimated touch points:**
Files: `src/enforcement/governance-package.js` (modified — add structural case), `.github/scripts/run-assurance-gate.js` (modified — governance-package require + evaluateGate call + evaluateGateRunner hook), `tests/check-gpa-sc02-unified-gate-evaluator.js` (new), `tests/run-gpa-tests.js` (modified — register new test file), `CHANGELOG.md` (entry), `.github/pipeline-state.json` (after merge). Services: none. APIs: none.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs. The ADR-013 compliance path (evaluateGate for all gate evaluation, no independent logic in the adapter) is correctly identified. The evaluateGateRunner hook mirrors the existing checksRunner pattern in run-assurance-gate.js, providing testability without changing the production wiring. The RISK-ACCEPT for NFR graceful-degradation (1-M1) is logged in `product/decisions.md` — corrected NFR is the binding contract for T6 and the implementation.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a second-line risk/compliance reviewer auditing the assurance gate…" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs, all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1→IT1-IT3, AC2→T1-T3+IT3, AC3→T1-T5, AC4→T4-T6, AC5→regression suite |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 items explicitly listed |
| H5 | Benefit linkage field references a named metric | ✅ | M4 — ADR-013 compliance — shared gate authority |
| H6 | Complexity is rated | ✅ | Rating: 3, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | reviewStatus: passed; 0 HIGH findings. 1 MEDIUM (1-M1) resolved via RISK-ACCEPT in product/decisions.md. |
| H8 | Test plan has no uncovered ACs | ✅ | All 5 ACs covered; AC5 (regression) classified as full-suite run |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream dependencies: SC-07, SC-03, SC-06 (Wave 3 gate). SC-02 verifies the wave gate by checking `prStatus === 'merged'` for each upstream story. `schemaDepends: [prStatus]`. The `prStatus` field exists in `.github/pipeline-state.schema.json`. No schema changes required. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-013 (direct closure), ADR-009, ADR-011 referenced and addressed. evaluateGate interface fully specified in story Architecture Constraints — no interface review required. |
| H-E2E | No CSS-layout-dependent ACs without RISK-ACCEPT | ✅ | No CSS-layout ACs — not applicable |
| H-NFR | NFR profile exists; story has NFR section | ✅ | `artefacts/2026-05-24-governance-platform-architecture/nfr-profile.md` exists; story NFR section present (3 NFRs) |
| H-NFR2 | Compliance NFRs with regulatory clauses have human sign-off | ✅ | No regulatory compliance clause for SC-02 — not applicable |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | Data classification: Internal |
| H-NFR-profile | NFR profile present (story has non-None NFRs) | ✅ | `artefacts/2026-05-24-governance-platform-architecture/nfr-profile.md` exists |
| H-GOV | Approved By section in discovery artefact has ≥1 non-blank named entry | ✅ | `Hamis — 2026-05-24` present in `artefacts/2026-05-24-governance-platform-architecture/discovery.md` |
| H-ADAPTER | Injectable adapter wiring check | ✅ | SC-02 does not introduce injectable adapters with setX() patterns. The `evaluateGateRunner` hook is a ctx parameter (testability override), not a module-level injectable setter. |

**Hard blocks: 17/17 passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or explicitly "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | 1-M1 (NFR graceful-degradation wording) acknowledged and logged as RISK-ACCEPT in `product/decisions.md` (2026-05-24). Corrected NFR: try/catch at module load, stderr warning, inline fallback. Fully testable via T6 source check. | RISK-ACCEPT logged in product/decisions.md |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Verification script produced by the pipeline. Operator will review before DoD. | Operator acknowledged — proceed. Operator will review before DoD. |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No UNCERTAIN items in test plan gap table | — |

---

## Oversight

**Oversight level: Medium** (per parent epic `gpa-epic-02-ci-enforcement-compliance`).

SC-02 touches `run-assurance-gate.js` and `governance-package.js` — both high-churn files with integration risk. Share this DoR artefact with the tech lead before dispatching to the coding agent. No formal sign-off required; awareness is sufficient.

**Wave 3 gate (hard prerequisite for dispatch):** SC-07 (`prStatus: merged` ✅), SC-03 (`prStatus: merged` ✅), SC-06 (`prStatus: draft` — **BLOCKED**). SC-02 DoR is signed off. Dispatch is blocked until SC-06 (PR #371) merges. Add `gpa-sc-06-source-path-guard prStatus=merged` to pipeline-state.json when SC-06 is merged, then dispatch SC-02.

**A2 gate (confirmed):** `2026-05-21-execution-boundary` benefit-metric scope is JSONL telemetry for `skill-turn-executor.js` only. No overlap with `run-assurance-gate.js` or `governance-package.js`. A2 condition is satisfied.

---

## Coding Agent Instructions

**Story:** gpa-sc-02-unified-gate-evaluator — Promote governance-package as single gate evaluator (ADR-013 compliance)

**Oversight level:** Medium — share DoR artefact with tech lead before starting; no blocking sign-off required.

### Before writing any code

1. **Check the Wave 3 gate first.** Run:
   ```
   node -e "const s=require('./.github/pipeline-state.json'); const f=s.features.find(f=>f.slug==='2026-05-24-governance-platform-architecture'); const stories=(f.epics||[]).flatMap(e=>e.stories||[]); const sc06=stories.find(s=>s.slug==='gpa-sc-06-source-path-guard'); console.log('SC-06 prStatus:', sc06 && sc06.prStatus);"
   ```
   If the result is NOT `merged`, **STOP** and add a PR comment: "Wave 3 gate: SC-06 (gpa-sc-06-source-path-guard) has not yet merged. Waiting for SC-06 PR merge before beginning implementation."

2. Run `node tests/run-gpa-tests.js` and confirm all current GPA tests pass — this is your clean baseline.

3. Read the full story artefact: `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-02-unified-gate-evaluator.md`

4. Read the test plan: `artefacts/2026-05-24-governance-platform-architecture/test-plans/gpa-sc-02-unified-gate-evaluator-test-plan.md`

5. Read the DoR contract: `artefacts/2026-05-24-governance-platform-architecture/dor/gpa-sc-02-unified-gate-evaluator-dor-contract.md`

6. Read `src/enforcement/governance-package.js` — specifically the `evaluateGate` function (the switch statement) and the module exports at the bottom.

7. Read `.github/scripts/run-assurance-gate.js` — specifically: (a) the `runChecks(root)` function, (b) the inline verdict derivation block (`const allPassed = checks.every...`), and (c) the `runGate(ctx)` function signature and how `checksRunner` is used as a testability hook.

### Implementation order (TDD — Task 1: RED)

**Create `tests/check-gpa-sc02-unified-gate-evaluator.js`** with all 9 tests (T1–T6, IT1–IT3) as specified in the test plan. After creation, run `node tests/check-gpa-sc02-unified-gate-evaluator.js` and confirm ALL 9 tests FAIL. This is the required RED state. Do not proceed to Task 2 until all 9 are failing.

The suite prefix is `[gpa-sc02]`.

### Task 2: Add structural case to evaluateGate — GREEN for T1–T3

Modify `src/enforcement/governance-package.js`. In the `evaluateGate` switch statement, add a `'structural'` case before the `default` branch:

```js
case 'structural': {
  const checks = (ctx.checks || []);
  const failed = checks.filter(function (c) { return !c.passed; });
  failed.forEach(function (c) {
    findings.push(c.reason || ('Check failed: ' + c.name));
  });
  break;
}
```

After this change, run `node tests/check-gpa-sc02-unified-gate-evaluator.js`. T1, T2, T3 should now PASS. T4–T6 and IT1–IT3 should still FAIL. Confirm this before proceeding.

### Task 3: Wire governance-package into run-assurance-gate.js — GREEN for T4–T6 and IT1–IT3

Modify `.github/scripts/run-assurance-gate.js`. Make exactly three changes:

**Change 1 — Add governance-package require with try/catch at module scope.** Near the top of the file (after the existing `require` statements), add:

```js
var _gp = null;
try {
  _gp = require('../../src/enforcement/governance-package');
} catch (e) {
  process.stderr.write('[run-assurance-gate] WARNING: governance-package not available, falling back to inline verdict derivation\n');
}
```

**Change 2 — Accept evaluateGateRunner hook in runGate.** In the `runGate` function, add alongside the existing `checksRunner` extraction:

```js
var evaluateGateRunner = ctx.evaluateGateRunner || null;
```

**Change 3 — Replace inline verdict derivation.** Locate the block:

```js
var allPassed = checks.every(function (c) { return c.passed; });
var verdict = allPassed ? 'pass' : 'fail';
```

Replace it with:

```js
var _egFn = evaluateGateRunner || (_gp && _gp.evaluateGate) || null;
var verdict;
if (_egFn) {
  var egResult = _egFn({ gate: 'structural', context: { checks: checks } });
  verdict = egResult.passed ? 'pass' : 'fail';
} else {
  var allPassed = checks.every(function (c) { return c.passed; });
  verdict = allPassed ? 'pass' : 'fail';
}
```

After this change, run `node tests/check-gpa-sc02-unified-gate-evaluator.js`. ALL 9 tests should now PASS. Confirm before proceeding.

### Task 4: Register the new test file

Add `tests/check-gpa-sc02-unified-gate-evaluator.js` to `tests/run-gpa-tests.js`. Run `node tests/run-gpa-tests.js` and confirm all GPA tests (including the new SC-02 suite) pass.

### Task 5: Update CHANGELOG.md

Add an entry under `### Added` for SC-02. Place it at the top of the Added section. Entry format:

```
- **SC-02 (gpa-sc-02-unified-gate-evaluator):** `governance-package.evaluateGate` extended with a `structural` gate case; `run-assurance-gate.js` wired to call it for structural gate evaluation, fulfilling ADR-013 (shared gate authority). Falls back gracefully if governance-package is unavailable at module load.
```

### Task 6: Update pipeline-state.json

After the PR opens, update `.github/pipeline-state.json` for SC-02 using the skills advance harness (cdg.6):

```
node bin/skills advance 2026-05-24-governance-platform-architecture gpa-sc-02-unified-gate-evaluator prStatus=draft stage=implementation
```

### Final verification before opening PR

Run `node tests/run-gpa-tests.js`. Confirm all GPA tests pass, zero failures. Run `node scripts/check-pipeline-state-integrity.js`. Confirm 0 failures.

### Open draft PR

Open the PR as a **DRAFT** only. Never mark ready for review. Never merge. PR title: `feat(gpa-sc02): wire governance-package.evaluateGate for structural gate (ADR-013)`

### Key constraints

- ADR-013: All gate evaluation must trace through `governance-package.evaluateGate`. No independent check logic in the adapter.
- Graceful degradation: try/catch is at module load scope (not inside runGate). If the require fails, stderr warning is written once and the inline fallback handles the verdict.
- Functional equivalence: the inline fallback must produce identical results to what it replaced — this is guaranteed because the fallback IS the original logic.
- Do NOT modify `scripts/ci-audit-comment.js` — that is SC-06/SC-07 scope.
- Do NOT modify `assurance-gate.yml` YAML structure — out of scope.
- Do NOT modify `src/enforcement/cli-outer-loop.js` — out of scope.
