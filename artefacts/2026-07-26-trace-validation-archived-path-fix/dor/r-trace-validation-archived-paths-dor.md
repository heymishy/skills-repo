# Definition of Ready Checklist

## Definition of Ready: Resolve archived-feature paths in test_plan_coverage (test-coverage closure)

**Story reference:** artefacts/2026-07-26-trace-validation-archived-path-fix/stories/r-trace-validation-archived-paths.md
**Test plan reference:** artefacts/2026-07-26-trace-validation-archived-path-fix/test-plans/r-trace-validation-archived-paths-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-12

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Already present in the retrospective story: "a pipeline operator merging a PR that touches pipeline-state.json" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ N/A | Retrospective story format uses status-tagged ACs (ALREADY-MET / NEEDS-TESTS) rather than GWT — this DoR closes AC3 specifically |
| H3 | Every AC has at least one test in the test plan | ✅ | AC3 (test coverage gate) covered by T1-T4 |
| H4 | Out-of-scope section is populated | ✅ | 3 items, already present in the story |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Tooling improvement, explicitly "none — tooling improvement" per the story's own Benefit Linkage |
| H6 | Complexity is rated | ✅ | Rating 1 — the fix is already merged and working; this closes a test-coverage gap only |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — no `/review` run |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Test-only change to `tests/`, reusing `check-p3.5-validate-trace.js`'s established copy-script-into-tmpdir harness pattern — no change to `scripts/validate-trace.sh`/`.ps1` themselves |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | CI-tooling test, no UI surface |
| H-NFR | NFR profile or explicit "None" field | ✅ | None — CI-tooling test only |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Retrospective/short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No adapter involved |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable — fix already merged, only adding test coverage | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Resolve archived-feature paths in test_plan_coverage (AC3 test-coverage closure) — artefacts/2026-07-26-trace-validation-archived-path-fix/stories/r-trace-validation-archived-paths.md
Test plan: artefacts/2026-07-26-trace-validation-archived-path-fix/test-plans/r-trace-validation-archived-paths-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Test-only story -- do NOT modify scripts/validate-trace.sh or
  scripts/validate-trace.ps1 (the fix is already merged and working;
  only test coverage is missing).
- Reuse the copy-script-into-tmpdir harness pattern already established
  in tests/check-p3.5-validate-trace.js (REPO_ROOT is derived from the
  script's own on-disk location, so copying it into a fixture tmp
  directory's scripts/ subfolder makes it treat that tmp directory as
  the repo root).
- PowerShell tests must skip gracefully (not fail) when pwsh is
  unavailable, matching the existing hasPwsh() convention.
- Re-run tests/check-p3.5-validate-trace.js unmodified -- all existing
  cases must still pass.
- Open a draft PR when tests pass -- do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — test-only story closing a known, already-scoped gap on an already-merged, already-working fix)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-12

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
