# DoR Contract: Promote governance-package as single gate evaluator (SC-02)

**Story:** gpa-sc-02-unified-gate-evaluator
**DoR artefact:** `artefacts/2026-05-24-governance-platform-architecture/dor/gpa-sc-02-unified-gate-evaluator-dor.md`
**Date:** 2026-05-26

---

## In Scope — Required Touchpoints

| File | Change type | Notes |
|------|-------------|-------|
| `src/enforcement/governance-package.js` | Modified | Add `'structural'` case to `evaluateGate` switch. Input: `context.checks` array (`{name, passed, reason?}`). Return: `{passed: checks.every(c=>c.passed), findings: failed-check reason strings}`. All existing cases (`dor`, `review`, `test-plan`, `definition-of-done`, `default`) untouched. |
| `.github/scripts/run-assurance-gate.js` | Modified | Three changes only: (1) add try/catch at module scope wrapping `require('../../src/enforcement/governance-package')`; (2) accept `evaluateGateRunner` hook in `runGate(ctx)` alongside existing `checksRunner`; (3) replace inline `checks.every(...)` verdict with `evaluateGate({gate:'structural', context:{checks}})` call, falling back to inline logic if `_gp` is null. |
| `tests/check-gpa-sc02-unified-gate-evaluator.js` | New | 9 tests: T1–T6 (unit), IT1–IT3 (integration). Suite prefix `[gpa-sc02]`. All 9 designed to fail before implementation. |
| `tests/run-gpa-tests.js` | Modified | Register `tests/check-gpa-sc02-unified-gate-evaluator.js` |
| `CHANGELOG.md` | Modified | Add SC-02 entry under `### Added` |
| `.github/pipeline-state.json` | Modified | After PR opens: `prStatus=draft stage=implementation` via `node bin/skills advance` |

---

## Out of Scope — MUST NOT Touch

The following files are explicitly excluded from SC-02:

- `scripts/ci-audit-comment.js` — SC-07/SC-06 scope; do not modify
- `.github/workflows/assurance-gate.yml` — YAML structure, trigger events, permission grants are out of scope; only the Node.js evaluation logic changes
- `src/enforcement/cli-outer-loop.js` — H1-H9 wiring is SC-03's scope; do not modify
- `bin/skills` — out of scope
- Any file under `artefacts/` — read-only pipeline inputs
- `standards/` — read-only standards documents
- `.github/templates/` — platform infrastructure
- `.github/skills/` — platform infrastructure
- Any merge-blocking logic — H-gate failures are reported but do not fail the workflow job

---

## Schema Dependencies

`schemaDepends: [prStatus]`

SC-02 is gated on the Wave 3 gate condition: SC-07, SC-03, and SC-06 must all have `prStatus: merged` in `.github/pipeline-state.json` before implementation begins. The `prStatus` field exists in `.github/pipeline-state.schema.json` (enum: `none|draft|open|merged`). No schema changes are required by SC-02.

---

## Upstream Story Dependencies

SC-02 has three upstream Wave 3 gate stories:

- **SC-07** (`gpa-sc-07-inline-js-extraction`): `prStatus: merged` ✅
- **SC-03** (`gpa-sc-03-cli-validate-ci`): `prStatus: merged` ✅
- **SC-06** (`gpa-sc-06-source-path-guard`): `prStatus: draft` — **BLOCKED until merged**

Do not begin implementation until SC-06 has `prStatus: merged`. Wave 3 gate check command:

```
node -e "const s=require('./.github/pipeline-state.json'); const f=s.features.find(f=>f.slug==='2026-05-24-governance-platform-architecture'); const stories=(f.epics||[]).flatMap(e=>e.stories||[]); ['gpa-sc-07-inline-js-extraction','gpa-sc-03-cli-validate-ci','gpa-sc-06-source-path-guard'].forEach(id=>{ const st=stories.find(s=>s.slug===id); console.log(id, ':', st && st.prStatus); });"
```

All three must print `merged` before implementation begins.

---

## Test File Contract

**File:** `tests/check-gpa-sc02-unified-gate-evaluator.js`
**Suite prefix:** `[gpa-sc02]`
**Minimum test count:** 6 unit (T1–T6) + 3 integration (IT1–IT3) = 9 tests
**Must be registered in `tests/run-gpa-tests.js`** before the PR is opened.
**Must run clean with `node tests/check-gpa-sc02-unified-gate-evaluator.js`** (no test runner dependencies).

---

## Scope Violation Indicators

If any of the following are observed, stop and leave a PR comment:

1. `run-assurance-gate.js` contains independent gate evaluation logic (a new `checks.every(...)` expression that is NOT the inline fallback inside the `else` branch) — this violates ADR-013.
2. `assurance-gate.yml` is modified in any way — out of scope.
3. `scripts/ci-audit-comment.js` is modified — SC-07/SC-06 scope.
4. `cli-outer-loop.js` is modified — SC-03 scope.
5. The Wave 3 gate command shows any upstream story with `prStatus` other than `merged` — implementation must not begin until all three are merged.
6. The new `structural` case in `governance-package.js` changes the return shape from `{ passed, findings }` — all existing callers depend on this shape.
