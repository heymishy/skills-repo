## Definition of Ready: The live npm audit test checks the shape of the audit

**Story reference:** artefacts/2026-11-19-audit-test-fixture/stories/cvt-s1-live-audit-test-independent-of-findings.md
**Test plan reference:** artefacts/2026-11-19-audit-test-fixture/test-plans/cvt-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-19
**Track:** short

## Contract Proposal
- `tests/check-coha-s3-vulnerability-ci-step.js` (AC1, AC2): the one case `fullAuditStepRunsAgainstRealRepoDependencyTree` asserts the audit's shape instead of a named critical finding.
- `tests/check-cvt-s1-live-audit-shape.js` (T1 to T4).
- A DoD.
- Not built: no change to `scripts/check-vulnerability-findings.js`, any workflow, any other case in the coha-s3 test, or any dependency.

## Contract Review
Contract review passed. All 4 acceptance criteria map to a named test. The coha-s3 test is a required touchpoint and is not excluded.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | the operator who merges pull requests |
| H2 | At least 3 ACs in Given / When / Then | Pass | 4 ACs |
| H3 | Every AC has a test | Pass | |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | none introduced |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | The case still needs the npm registry and fails when it is unreachable, as before. |
| W2 | Accepted | Other tests that depend on live external state were not searched for. |

## Oversight level
**Low** - test-only change; the operator reviews the pull request.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-19-audit-test-fixture/stories/cvt-s1-live-audit-test-independent-of-findings.md
Test plan: artefacts/2026-11-19-audit-test-fixture/test-plans/cvt-s1-test-plan.md
Goal: write tests/check-cvt-s1-live-audit-shape.js first and confirm T1 to T4 fail; then repair the one case in tests/check-coha-s3-vulnerability-ci-step.js.
Constraints:
- Change only that case and add the new test. Do not change scripts/check-vulnerability-findings.js, any workflow, or any dependency.
- Check the absolute path contains .worktrees/cvt-s1/ before every edit.
```
