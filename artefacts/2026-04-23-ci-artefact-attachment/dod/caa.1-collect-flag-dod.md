# Definition of Done: caa.1 — Add `--collect` flag to `trace-report.js`

**PR:** https://github.com/heymishy/skills-repo/pull/186 | **Merged:** 2026-04-23
**Story:** artefacts/2026-04-23-ci-artefact-attachment/stories/caa.1-collect-flag.md
**Test plan:** artefacts/2026-04-23-ci-artefact-attachment/test-plans/caa.1-collect-flag-test-plan.md
**DoR artefact:** artefacts/2026-04-23-ci-artefact-attachment/dor/caa.1-collect-flag-dor.md
**Assessed by:** Copilot / /definition-of-done skill
**Date:** 2026-04-23

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ❌ | `--collect` flag not present in `scripts/trace-report.js`; `.ci-artefact-staging/` directory does not exist | Code inspection: `Select-String "collect" scripts/trace-report.js` returns no output | PR #186 contained only an "Initial plan" commit with zero file changes |
| AC2 | ❌ | No `manifest.json` written; `--collect` code path not implemented | Code inspection | Same as AC1 |
| AC3 | ❌ | Auto-resolve logic not implemented | Code inspection | Same as AC1 |
| AC4 | ❌ | Error-exit path not implemented | Code inspection | Same as AC1 |
| AC5 | ❌ | Idempotent rebuild not implemented | Code inspection | Same as AC1 |
| AC6 | ❌ | Cannot verify zero-dep constraint without an implementation | Code inspection | Same as AC1 |

---

## Scope Deviations

PR #186 merged with zero file changes. The GitHub Copilot coding agent committed only an "Initial plan" step and the branch was merged before any implementation commits were added. The full story scope — `trace-report.js --collect` flag, `.ci-artefact-staging/` directory creation, `manifest.json` output — was not delivered.

---

## Test Plan Coverage

**Tests from plan implemented:** 0 / 18
**Tests passing in CI:** 0 / 0 implemented

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1a: staging-dir-created | ❌ | N/A | Test file `tests/check-caa1-collect.js` does not exist |
| T1b: staging-dir-has-sequenced-files | ❌ | N/A | |
| T1c: staging-dir-integration | ❌ | N/A | |
| T2a: manifest-json-written | ❌ | N/A | |
| T2b: manifest-fields-present | ❌ | N/A | |
| T2c: manifest-integration | ❌ | N/A | |
| T3a: auto-resolve-single-active-feature | ❌ | N/A | |
| T3b: auto-resolve-ignores-archived | ❌ | N/A | |
| T4a: no-feature-exits-code-1 | ❌ | N/A | |
| T4b: no-feature-stderr-message | ❌ | N/A | |
| T5a: idempotent-clears-stale-file | ❌ | N/A | |
| T5b: idempotent-integration | ❌ | N/A | |
| T6a: zero-npm-deps | ❌ | N/A | |
| (plus 5 additional unit/integration tests) | ❌ | N/A | |

**Gaps (tests not implemented):** All 18 tests unimplemented. Risk: HIGH — downstream stories (caa.2, caa.3) depend on this staging directory contract.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: --collect completes in under 2 seconds | ❌ | Not implemented |
| Security: staging dir must not include context.yml or secrets | ❌ | Not implemented |
| Dependency constraint (MM2): zero new npm dependencies | ❌ | Cannot verify — no implementation |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M2-zero-breakage: no existing tests broken | ✅ | Now | Existing `npm test` suites pass (16/18 pass — 2 pre-existing failures in `check-assurance-gate.js` for p3.3 which are unrelated to this story) |
| MM2-zero-dep: zero new npm deps | ❌ | On re-delivery | Not verifiable without implementation |
| M1-evidence-reach: reviewer can reach artefacts in ≤2 clicks | ❌ | On re-delivery | Staging dir not created |

---

## Outcome

**INCOMPLETE** (original PR #186)

---

## Re-delivery — PR #190 (2026-04-23)

**All ACs delivered.** Full implementation landed in PR #190 (VS Code inner loop reimplementation). `tests/check-caa1-collect.js`: 40/40 assertions passing. `dodStatus` set to `complete` in `pipeline-state.json`.

---

## Smoke-test finding — PR #191 (2026-04-23)

**Finding:** Running `node scripts/trace-report.js --collect` without `--feature` in CI failed with `No feature resolved` because there are 12 non-archived features in `pipeline-state.json`. `resolveActiveFeature` requires exactly one (AC3).

**Fix applied in `.github/workflows/assurance-gate.yml`:** Added `Resolve active feature` step (id: `resolve_feature`) that uses `node` to pick the last non-completed feature (falling back to the last non-archived feature). The `Collect governed artefacts` step now passes `--feature ${{ steps.resolve_feature.outputs.slug }}` explicitly, so `resolveActiveFeature` uses the explicit-slug path (no auto-resolve needed in CI).

**AC3 behavior unchanged:** The auto-resolve logic in `resolveActiveFeature` is correct as specified. The workflow works around multi-feature repos by always supplying `--feature`. No code change to `scripts/trace-report.js` or tests required.

**Follow-up actions:**
1. Re-open or create a new implementation issue for caa.1 — coding agent must implement `trace-report.js --collect` flag, staging directory, and `manifest.json` as specified by all 6 ACs.
2. Ensure test file `tests/check-caa1-collect.js` is produced before or alongside implementation (per DoR TDD requirement).
3. Add the caa.1 test file to `npm test` chain in `package.json` once implementation is confirmed passing.
4. caa.2 and caa.3 remain unblockable until caa.1 is delivered — they depend on the staging directory contract.

---

## DoD Observations

1. **Empty PR pattern — pipeline risk (→ /improve candidate):** The GitHub Copilot coding agent for this feature submitted PRs containing only an "Initial plan" step (zero file changes). These were merged before any implementation commits were pushed. The pipeline state was manually updated with `acVerified: 6/6` without code-level evidence. This created a false "merged" status for unimplemented work. Recommendation: the DoR Coding Agent Instructions block and issue-dispatch output should include explicit guidance to reviewers not to merge a coding agent PR until implementation commits are visible in the diff.

2. **Pre-existing test failures (not caused by caa.1):** `check-assurance-gate.js` has 2 failing tests (`workflow-yaml-uses-pinned-immutable-ref`, `download-uses-https-not-http`) that are pre-existing (related to p3.3). These are not caused by or related to caa.1.
