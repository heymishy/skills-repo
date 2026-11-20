## Test Plan: The bulk-assign E2E spec opens the collapsed group it clicks in, so it passes instead of timing out

**Story reference:** artefacts/2026-11-21-bmau-s1-spec-repair/stories/bmrp-s1-bmau-s1-opens-collapsed-group.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Test runner:** the repaired spec is itself the test. It is not in the `npm test` chain (ADR-018); run with `NODE_ENV=test E2E_LOCAL_SUITE=true npx playwright test tests/e2e/bmau-s1-bulk-assign-rerender.spec.js`.

---

## AC Coverage

| AC | Description | E2E | Manual | Risk |
|----|-------------|-----|--------|------|
| AC1 | Passes alone, three of three runs | 1 (the spec) | M1: repeat runs | 🟢 |
| AC2 | Opens the group and asserts `aria-expanded` first | 1 (same spec) | - | 🟢 |
| AC3 | Original assertions unchanged | 1 (same spec) | M2: read the diff | 🟢 |
| AC4 | Stale header replaced | - | M2: read the diff | 🟢 |
| AC5 | Passes in the pull request's CI run; matrix entry moved | CI report | M3: read the `pw-report-json` artefact | 🟡 |
| AC6 | Changed files as stated | - | M4: diff check | 🟢 |

## Red first

The spec as it stands on master is the red result: one run alone fails at the first `check()` with "element is not visible" (measured 2026-11-21). The repair is then applied and the same command is repeated at least three times.

## Manual steps

- **M1:** three consecutive local runs of the spec alone, all passing.
- **M2:** read the diff: the only added lines are the group-opening step and the replaced header; no assertion is removed or loosened.
- **M3:** after the draft pull request's CI run, read the E2E report: `bmau-s1` passes. The matrix entry moves only on that evidence.
- **M4:** list the changed files.

## Gaps

None. AC5 depends on CI; if the spec fails there for another reason, it stays quarantined and the reason is recorded.
