## Definition of Ready: Stop the incident-record pull request: the GitHub issue is the record, and the fix is a short-track story and PR

**Story reference:** artefacts/2026-11-16-ci-regression-review/stories/inc-s2-record-incidents-in-the-fix-pr.md
**Test plan reference:** artefacts/2026-11-16-ci-regression-review/test-plans/inc-s2-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-16 (re-signed after the operator's rescoping)
**Track:** short

## Contract Proposal
See `artefacts/2026-11-16-ci-regression-review/dor/inc-s2-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** One workflow deleted, one test edited, one test added; all 6 acceptance criteria (AC) map to a named test, the full suite, or a live scenario. The exclusion list (the bridge, the recogniser script and library, `run-all-tests.js`, the eit-s1 and coha-s6 tests, `workspace/incidents.json`, skills, replacements, dependencies) has zero test assertions against it except T3 and T5, which only assert that the bridge and the library still load (they are not edited), and the touched files are exactly those the tests need (B1/D1 check).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "the operator" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 6 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2, AC3 T3, AC4 T4, AC5 T5, AC6 live |
| H4 | Out of scope populated | ✅ | |
| H5 | Benefit linkage | ✅ (short-track) | Removes unreviewed bot PRs and about 23% of PR gating runs |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC6 live-only |
| H9 | Architecture Constraints populated | ✅ | ADR-011 named; ADR-009 deviation noted moot; platform change policy |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | Safety, reliability |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | No UI |

**Hard blocks: 19/19 passed** (3 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | ⚠️ Pending operator | AC6 needs the next natural production error; no deliberate error is created |
| W5 | ⚠️ Accepted | Deleting the workflow-guarding tests removes about 14 tests; they only assert properties of a file that no longer exists. The PR diff lists them |
| W6 | ⚠️ Accepted | The recogniser script and library become unused by any workflow; they stay (eit-s1 uses the library) and their removal is a separate approved cleanup |

## Standards injection
Domain tags `[ci, incident-handling]`: no matching standards file; the agent reads `.github/architecture-guardrails.md`.

## Oversight level
**Low** - removes an unused workflow and its tests. No named sign-off required.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-16-ci-regression-review/stories/inc-s2-record-incidents-in-the-fix-pr.md
Test plan: artefacts/2026-11-16-ci-regression-review/test-plans/inc-s2-test-plan.md
Contract: artefacts/2026-11-16-ci-regression-review/dor/inc-s2-dor-contract.md
Goal: write tests/check-inc-s2-no-incident-pr.js (T1 to T5) first and confirm T1, T2 and T4 FAIL for the right reason (workflow present, coha-s7 test still reads it); then delete the workflow and edit the coha-s7 test.
Constraints:
- Delete only the workflow file. In the coha-s7 test remove only the workflow-reading block and its private helpers and constant; keep every logic test and keep a credential scan over the script, library and test file.
- Do not touch the bridge, the recogniser script or library, run-all-tests.js, the eit-s1 or coha-s6 tests, workspace/incidents.json or any skill. No replacement workflow, no local script (the operator rejected both).
- Stage only the files you changed (never `git add -A` on artefacts/ after a full-suite run). No new npm dependencies.
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No.
