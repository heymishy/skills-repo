## Definition of Ready: Shrink the CI known-failures baseline from 70 files to the 3 that actually fail, and stop it going stale

**Story reference:** artefacts/2026-11-16-ci-regression-review/stories/bfl-s1-clear-baseline-test-failures.md
**Test plan reference:** artefacts/2026-11-16-ci-regression-review/test-plans/bfl-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Track:** short

## Contract Proposal
See `artefacts/2026-11-16-ci-regression-review/dor/bfl-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** Three source files, one new test and up to two existing tests touched; all 6 acceptance criteria (AC) map to a named test or live scenario. The exclusion list (the three failing files, the baseline mechanism, `run-all-tests.js`, workflows, other tests, dependencies) has zero test assertions against it, and the touched files are exactly those the tests need (B1/D1 check: the checker script and the baseline data file are required touchpoints and are not excluded).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "the operator relying on CI to catch regressions" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 6 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2, AC3 T3, AC4 T4, AC5 T5, AC6 live |
| H4 | Out of scope populated | ✅ | |
| H5 | Benefit linkage | ✅ (short-track) | Closes the silent hole: 67 passing files excused |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC6 live-only |
| H9 | Architecture Constraints populated | ✅ | ADR-011 named; platform change policy |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | Reliability, safety |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | |

**Hard blocks: 19/19 passed** (3 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | ⚠️ Pending operator | AC6 needs the next real PR run after merge |
| W5 | ⚠️ Accepted | Making stale entries fail means the PR that fixes a baseline file (`bfl-s2`) must remove its entry in the same PR; that is the intended discipline, but it can surprise a drive-by fix |
| W6 | ⚠️ Accepted | If a currently baselined file ever becomes flaky-passing in CI, the check would fail on a lucky pass; the three are deterministic, so accepted |

## Standards injection
Domain tags `[ci, tests]`: no matching standards file; the agent reads `.github/architecture-guardrails.md`.

## Oversight level
**Low** - makes an existing gate stricter; no product behaviour change. No named sign-off required.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-16-ci-regression-review/stories/bfl-s1-clear-baseline-test-failures.md
Test plan: artefacts/2026-11-16-ci-regression-review/test-plans/bfl-s1-test-plan.md
Contract: artefacts/2026-11-16-ci-regression-review/dor/bfl-s1-dor-contract.md
Goal: write tests/check-bfl-s1-baseline-tightened.js (T1 to T5) first and confirm T1, T2 and T3 FAIL for the right reason (70-entry baseline; excused failure; stale entry exits 0); then change the baseline data and the checker.
Constraints:
- Derive the three files from the CI artefact test-results-43811318391 (or a newer one), never from a local Windows run.
- Only the stale-entry exit and message change in the checker; parsing and loading stay as they are.
- Edit an existing test only where it encodes the old behaviour; list each edit in the evidence.
- Stage only the files you changed (never `git add -A` on artefacts/ after a full-suite run). No new npm dependencies.
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No.
