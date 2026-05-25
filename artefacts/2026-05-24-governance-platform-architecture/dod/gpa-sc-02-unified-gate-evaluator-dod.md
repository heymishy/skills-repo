# Definition of Done: Promote governance-package as single gate evaluator (ADR-013 compliance)

**PR:** [#372](https://github.com/heymishy/skills-repo/pull/372) | **Merged:** 2026-05-25
**Story:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-02-unified-gate-evaluator.md`
**Test plan:** `artefacts/2026-05-24-governance-platform-architecture/test-plans/gpa-sc-02-unified-gate-evaluator-test-plan.md`
**DoR artefact:** `artefacts/2026-05-24-governance-platform-architecture/dor/gpa-sc-02-unified-gate-evaluator-dor.md`
**Assessed by:** GitHub Copilot
**Date:** 2026-05-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `run-assurance-gate.js` calls `evaluateGate({ gate: 'structural', context: { checks: runChecks(root) } })`; inline `checkResults` verdict logic replaced by delegating to `evaluateGate`. `runChecks` retained as collector. | T4 (`governance-package` import present), T5 (`evaluateGate` + `'structural'` present in source), IT1–IT3 integration tests | None |
| AC2 | ✅ | IT2 asserts `evaluateGateRunner` receives all 4 check names (`workspace-state-valid`, `pipeline-state-valid`, `artefacts-dir-exists`, `governance-gates-exists`) with correct structure; IT3 asserts verdict derives from evaluator return value — functional equivalence demonstrated by full `npm test` suite passing (exit 0). | IT2, IT3, `npm test` (AC5) | None |
| AC3 | ✅ | T1: `evaluateGate({ gate: 'structural', context: { checks: [all-pass] } })` → `{ passed: true, findings: [] }`. T2: one fail → `{ passed: false, findings: ['<reason>'] }`. T3: two fails → both reasons collected in `findings`. | T1, T2, T3 (unit tests against `governance-package` directly) | None |
| AC4 | ✅ | IT3 asserts verdict is derived from `evaluateGateRunner` return value, not from `checks.every` inline logic. When `checksRunner` returns all-failing and `evaluateGateRunner` returns `{ passed: true }`, result is `pass` — confirming no independent verdict logic remains. | IT3 (explicit anti-pattern test) | None |
| AC5 | ✅ | `npm test` exits 0 after SC-02 merge. All pre-existing tests continue to pass; no regressions. | `npm test` (full suite run on master post-merge) | None |

---

## Scope Deviations

None. SC-02 addressed only the `structural` gate type in `governance-package.evaluateGate` and the corresponding call site in `run-assurance-gate.js`. H1-H9 wiring (SC-03's scope), new gate types, and YAML structure changes were not touched.

The SC-05 root-cause fix (`cli-init.js` missing `track` field) was bundled into the SC-02 PR branch as a correctness fix for a schema violation found during CI. This was within the story's scope since it affected the same `pipeline-state.json` the tests validate. Four additional SC-05 tests (T15–T18) were added as part of the fix.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9
**Tests passing in CI:** 9 / 9

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 — structural all-pass returns `{ passed: true, findings: [] }` | ✅ | ✅ | |
| T2 — structural one-fail returns reason in findings | ✅ | ✅ | |
| T3 — structural multiple-fail collects all reasons | ✅ | ✅ | |
| T4 — `run-assurance-gate.js` references governance-package | ✅ | ✅ | |
| T5 — `run-assurance-gate.js` calls evaluateGate with structural gate | ✅ | ✅ | |
| T6 — try/catch wraps governance-package require (NFR) | ✅ | ✅ | |
| IT1 — evaluateGateRunner hook called when provided in ctx | ✅ | ✅ | |
| IT2 — evaluateGateRunner receives gate:structural and 4 check names | ✅ | ✅ | |
| IT3 — verdict derived from evaluateGateRunner return, not inline checks.every | ✅ | ✅ | |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Functional equivalence — all existing CI gate pass/fail behaviours preserved | ✅ | IT2 asserts all 4 check names are passed correctly to `evaluateGate`; IT3 asserts verdict derives from evaluator return; `npm test` (AC5) — full suite passes, no regressions. |
| No external npm dependencies | ✅ | SC-02 touches only `src/enforcement/governance-package.js` and `.github/scripts/run-assurance-gate.js` — both use only Node.js built-ins and local requires. |
| Graceful degradation — try/catch wraps governance-package require | ✅ | T6 asserts `try` block and `governance-package` string appear together in `run-assurance-gate.js` source. Verified by `Select-String` grep. |

---

## Metric Signal

| Metric | Signal | Evidence | Date measured |
|--------|--------|----------|---------------|
| M4: ADR-013 compliance — shared gate authority | on-track | SC-02 merged: `run-assurance-gate.js` now calls `governance-package.evaluateGate` for the structural gate. T4/T5 assert import and call presence; IT3 asserts verdict derives from `evaluateGate` return, not inline logic. ADR-013 obligation ("No surface adapter reimplements governance logic independently") is now met for the structural gate type. Status moves from non-compliant to compliant. | 2026-05-25 |

M4 is a binary compliance metric. Target (compliant) is reached at SC-02 DoD — no further measurement cadence is required unless a future story modifies `run-assurance-gate.js`.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. **SC-05 root-cause bundled into SC-02 PR branch (no scope violation):** The `cli-init.js` missing `track` field (which caused `features > 16: 'track' is a required property` schema violations in CI) was discovered during SC-02's CI run and fixed on the same branch. The fix added 4 tests (T15–T18) to `tests/check-gpa-sc05-skills-init.js`. This is a correctness fix, not a scope expansion — SC-05's delivery obligation was already signed off; the fix closes a defect in the shipped implementation. Recommend as `/improve` candidate: "DoR contract should explicitly verify that `skills init` produces schema-valid stubs by running `validate-trace.sh` against a fresh state, not just checking exit code 0."

2. **Epic-nested story state persistence gap:** `bin/skills advance` ran successfully for SC-01/04/05 on the SC-02 branch but the changes did not persist to master after merge (likely merge resolution used branch state over master). The correct final state was applied directly on master post-DoD. Recommend as `/improve` candidate: "State bookkeeping for epic-nested stories should be applied on master after merge, not on feature branches, to avoid merge resolution loss."

3. **M4 closes the ADR-013 compliance gap opened at Phase 4 delivery:** The shared `governance-package` was introduced in Phase 4 but `run-assurance-gate.js` was never updated to call it. SC-02 closes this without any interface-breaking change — all existing `evaluateGate` callers with `gate: 'dor'|'review'|'test-plan'|'definition-of-done'` are unaffected.
