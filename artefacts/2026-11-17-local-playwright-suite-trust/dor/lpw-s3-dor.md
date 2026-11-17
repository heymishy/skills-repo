## Definition of Ready: The board's Advance button and drag-to-advance work, and a failed advance is never reported as success

**Story reference:** artefacts/2026-11-17-local-playwright-suite-trust/stories/lpw-s3-board-advance-works.md
**Test plan reference:** artefacts/2026-11-17-local-playwright-suite-trust/test-plans/lpw-s3-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-17
**Track:** short

## Contract Proposal
See `artefacts/2026-11-17-local-playwright-suite-trust/dor/lpw-s3-dor-contract.md`.

## Contract Review
Contract review passed. All 8 acceptance criteria (AC) map to a named test, a CI run or a live step. The exclusion list (`csrfGuard`, gate-confirm behaviour, the real commit path, the ruleset) has zero assertions against it (B1/D1 check).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | "an operator moving features along the kanban board" |
| H2 | At least 3 ACs in Given / When / Then | Pass | 8 ACs |
| H3 | Every AC has a test | Pass | AC1 T1 and specs, AC2 T2, AC3 T3, AC4 T4 and spec, AC5 specs, AC6 T5, AC7 live, AC8 T6 |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | Restores a broken board action and makes failures visible |
| H6 | Complexity rated | Pass | 2, Unstable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | `schemaDepends: []`; AC5 and AC7 live |
| H9 | Architecture Constraints populated | Pass | ADR-011 named; platform change policy followed |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | No layout AC |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | security, reliability, observability |
| H-ADAPTER | Injectable adapter (D37) | Pass | A test-mode commit adapter is introduced: it throws outside test mode, the wiring is its own task in `server.js`, and T4 asserts the card moves (behaviour, not assignment) |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | No new component; the error message reuses the board's existing element |

**Hard blocks: 19/19 passed** (5 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | Pending | AC5 and AC7 are observed in CI and on staging after merge |
| W5 | Accepted | The board specs that pass alone but fail in the whole suite may have a separate cause; AC5 requires it to be named if so |
| W6 | Accepted | Issues #1140 and #1141 are the source issues: the pull request body says `Fixes #1140` and `Fixes #1141` and `closingIssuesReferences` is checked |

## Standards injection
Domain tags `[web-ui] [kanban] [test]`: read `src/web-ui/views/kanban-view.js`, `src/web-ui/routes/products.js` (`handlePostBoardAdvance`), `src/web-ui/middleware/csrf.js`, `src/web-ui/routes/journey.js` (`handlePostGateConfirm`), issue #1140 and the s1.1, s3.1 and s3.2 specs first.

## Oversight level
**Low** - a small, well-evidenced fix in the board; no named sign-off required. It changes production behaviour, so the operator merges.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-17-local-playwright-suite-trust/stories/lpw-s3-board-advance-works.md
Test plan: artefacts/2026-11-17-local-playwright-suite-trust/test-plans/lpw-s3-test-plan.md
Contract: artefacts/2026-11-17-local-playwright-suite-trust/dor/lpw-s3-dor-contract.md
Goal: write T1 to T6 first and confirm they FAIL today; fix the board script and the advance handler; add the test-mode commit adapter as a separate wiring task; fix psh-s6; run the board specs in the whole suite and in the core job twice; correct the ep3-s1 reason.
Constraints:
- Do not weaken csrfGuard, exempt the route, or change gate-confirm. No new npm dependency.
- The test-mode commit adapter must throw outside NODE_ENV=test; its wiring is its own task.
- Work in a worktree under .worktrees/lpw-s3; verify the absolute path before every edit. Stage only the files you changed. Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges. The PR body says "Fixes #1140" and "Fixes #1141" (verify closingIssuesReferences).
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No.
