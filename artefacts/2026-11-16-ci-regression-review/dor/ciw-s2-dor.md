## Definition of Ready: Deprecate the Fleet Aggregation and GitHub Pages workflows so they stop running

**Story reference:** artefacts/2026-11-16-ci-regression-review/stories/ciw-s2-disable-fleet-aggregation-and-resolve-pages.md
**Test plan reference:** artefacts/2026-11-16-ci-regression-review/test-plans/ciw-s2-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Track:** short

## Contract Proposal
See `artefacts/2026-11-16-ci-regression-review/dor/ciw-s2-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** Five files touched; all 6 acceptance criteria (AC) map to a named test, the full suite, or a live scenario. The exclusion list (any deletion, repository settings, `check-fleet-aggregation`, the dashboard tests, fleet scripts, dependencies) has zero test assertions against it, and the touched files are exactly those the tests need (B1/D1 check: `check-dviz2-pages-workflow.js` asserts `pages.yml` and is a required, listed touchpoint, not an exclusion).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "the operator reading the Actions tab" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 6 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2, AC3 T3, AC4 T4, AC5 full suite, AC6 live |
| H4 | Out of scope populated | ✅ | |
| H5 | Benefit linkage | ✅ (short-track) | Removes 191 always-red runs and a public-exposure risk |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC6 live-only |
| H9 | Architecture Constraints populated | ✅ | ADR-011 named; platform change policy |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | Safety, reliability |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | A README banner only; no UI markup |

**Hard blocks: 19/19 passed** (3 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | ⚠️ Pending operator | AC6 needs time on the real Actions list after merge |
| W5 | ⚠️ Accepted | "Fully deprecated" is read as non-destructive: nothing is deleted. Removing `dashboards/` and its 8 tests is open question 1 and needs the operator's separate go-ahead |

## Standards injection
Domain tags `[ci]`: no matching standards file; the agent reads `.github/architecture-guardrails.md`.

## Oversight level
**Low** - removes triggers from two workflows that have never succeeded. No named sign-off required.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-16-ci-regression-review/stories/ciw-s2-disable-fleet-aggregation-and-resolve-pages.md
Test plan: artefacts/2026-11-16-ci-regression-review/test-plans/ciw-s2-test-plan.md
Contract: artefacts/2026-11-16-ci-regression-review/dor/ciw-s2-dor-contract.md
Goal: write tests/check-ciw-s2-deprecated-workflows.js (T1 to T4) first and confirm T1, T2 and T3 FAIL for the right reason (push and schedule triggers present, no header or banner); then edit the two workflows, dashboards/README.md and the two dviz2 assertions.
Constraints:
- Deprecate, do not delete. Jobs, steps and secret references in both workflows stay byte-for-byte; only triggers and the header comment change.
- Do not change repository settings or enable Pages.
- Edit check-dviz2-pages-workflow.js T3 and T4 only; list the edit in the evidence.
- Stage only the files you changed (never `git add -A` on artefacts/ after a full-suite run). No new npm dependencies.
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No.
