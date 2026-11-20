## Test Plan: The keyboard-navigation E2E spec checks the nav links the sidebar has today, so it passes instead of timing out

**Story reference:** artefacts/2026-11-21-wuce18-spec-repair/stories/wkrp-s1-wuce18-current-nav-labels.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Test runner:** the repaired spec is itself the test. It is not in the `npm test` chain (ADR-018); run with `NODE_ENV=test E2E_LOCAL_SUITE=true npx playwright test tests/e2e/wuce18-keyboard-nav.spec.ts`.

---

## AC Coverage

| AC | Description | E2E | Manual | Risk |
|----|-------------|-----|--------|------|
| AC1 | Both tests pass alone, three of three runs | 2 (the spec's two tests) | M1: repeat runs | 🟢 |
| AC2 | Label list equals the rendered main-section nav | 1 (test 1) | M2: compare with `NAV_ITEMS` | 🟢 |
| AC3 | Mechanism and second test unchanged | - | M2: read the diff | 🟢 |
| AC4 | Passes in the pull request's CI run; matrix entry moved after | CI report | M3: read the `pw-report-json` artefact; M5: CI on the final commit | 🟡 |
| AC5 | Changed files as stated | - | M4: diff check | 🟢 |

## Red first

The spec as it stands on master is the red result: test 1 times out at 30 s waiting for the "Run a Skill" link (measured 2026-11-21). The repair is then applied and the same command is repeated at least three times.

## Manual steps

- **M1:** three consecutive local runs of the spec alone, all passing both tests.
- **M2:** read the diff and `NAV_ITEMS`: the four labels are the non-account, non-admin rows; only the label list and a comment change.
- **M3:** after the draft pull request's CI run, read the E2E report: both `wuce18` tests pass.
- **M4:** list the changed files.
- **M5:** before asking for the merge, confirm a CI run exists on the pull request's final commit (the bmrp-s1 gap).

## Gaps

None. AC4 depends on CI; if the spec fails there for another reason, it stays quarantined and the reason is recorded.
