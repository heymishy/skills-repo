## Definition of Ready: Record per-test-file results in CI so the next audit can use test history

**Story reference:** artefacts/2026-11-16-ci-regression-review/stories/trr-s1-record-per-test-file-results.md
**Test plan reference:** artefacts/2026-11-16-ci-regression-review/test-plans/trr-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Track:** short

## Contract Proposal
See `artefacts/2026-11-16-ci-regression-review/dor/trr-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** Four files touched; all 6 acceptance criteria (AC) map to a named test or live scenario (AC6 added at test-plan time). The exclusion list (which files run, concurrency, timeouts, pass/fail semantics, the regression-check script, other workflows, dependencies) has zero test assertions against it, and the touched files are exactly the ones the tests need (B1/D1 check: `scripts/run-all-tests.js` and `pr-checks.yml` are required touchpoints and are not in the exclusion list).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "the operator planning what to cut or speed up" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 6 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2 and T3, AC3 T4, AC4 T5, AC5 T6, AC6 live |
| H4 | Out of scope populated | ✅ | |
| H5 | Benefit linkage | ✅ (short-track) | Enables evidence-based pruning and flake tracking |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC6 live-only |
| H9 | Architecture Constraints populated | ✅ | Platform change policy: scripts and workflows via PR |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | No secrets or bodies stored; bounded text |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | |

**Hard blocks: 19/19 passed** (3 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | ⚠️ Pending operator | AC6 needs the first real PR run after merge |
| W5 | ⚠️ Accepted | `tests/check-pcr-s1-test-runner.js` is a known baseline failure; this change must not worsen it, and it is not a reason to skip the AC5 check on `check-tfhc-s9` |

## Standards injection
Domain tags `[ci, tests]`: no matching standards file; the agent reads `.github/architecture-guardrails.md`.

## Oversight level
**Low** - additive output, no behaviour change to pass/fail. No named sign-off required.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-16-ci-regression-review/stories/trr-s1-record-per-test-file-results.md
Test plan: artefacts/2026-11-16-ci-regression-review/test-plans/trr-s1-test-plan.md
Contract: artefacts/2026-11-16-ci-regression-review/dor/trr-s1-dor-contract.md
Goal: write tests/check-trr-s1-per-file-test-results.js (T1 to T6) first and confirm T1, T3, T4 and T5 FAIL for the right reason (no results file, no upload step); then extend run-all-tests.js, the workflow and .gitignore.
Constraints:
- Additive only: failedFiles, elapsedMs, the flushing of stdout and stderr, the lists and the exit code are unchanged.
- Writing the results file must never change the suite's outcome; no secrets or full output bodies are stored.
- Stage only the files you changed (never `git add -A` on artefacts/ after a full-suite run). No new npm dependencies.
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No.
