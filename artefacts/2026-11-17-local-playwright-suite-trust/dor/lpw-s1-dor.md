## Definition of Ready: The local Playwright suite becomes a trustworthy, measured, non-blocking signal

**Story reference:** artefacts/2026-11-17-local-playwright-suite-trust/stories/lpw-s1-make-the-local-playwright-suite-trustworthy.md
**Test plan reference:** artefacts/2026-11-17-local-playwright-suite-trust/test-plans/lpw-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-17
**Track:** short

## Contract Proposal
See `artefacts/2026-11-17-local-playwright-suite-trust/dor/lpw-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** All 8 acceptance criteria (AC) map to a named test, a CI run or a live step. The exclusion list (production code, ruleset, Scenario jobs, quarantine) has zero assertions against it (B1/D1 check). The fake database and workflow edits are required touchpoints named in the contract, not excluded ones.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "the operator" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 8 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1 + specs, AC2 T2 + spec, AC3 T3 + specs, AC4 T4 + specs, AC5 specs, AC6 T3 and T5, AC7 T3, AC8 live |
| H4 | Out of scope populated | ✅ | |
| H5 | Benefit linkage | ✅ (short-track) | Turns a switched-off suite into a measured signal |
| H6 | Complexity rated | ✅ | 2, Unstable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC8 live-only |
| H9 | Architecture Constraints populated | ✅ | ADR-011 named; platform change policy followed |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | No new layout AC; Playwright tooling exists |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | |
| H-ADAPTER | Injectable adapter (D37) | ✅ | The first-login adapter is wired to the fake database in test mode as its own task; verified by behaviour (two identities, two outcomes), not by assignment |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | No UI change |

**Hard blocks: 19/19 passed** (5 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | ⚠️ Pending | AC8 is observed on the pull request's own CI (two runs on one commit) |
| W5 | ⚠️ Accepted | The kanban board, model-session and pod groups (29 tests) are measured, not fixed, here |
| W6 | ⚠️ Accepted | Coverage via `c8` depends on the server flushing V8 coverage on exit; checked first, with a fallback of reporting route coverage only |

## Standards injection
Domain tags `[ci] [test]`: read `.github/workflows/e2e.yml`, `playwright.config.js`, `src/web-ui/adapters/fake-test-db.js` and the triage notes first.

## Oversight level
**Low** - test-environment and workflow changes only; the job is non-blocking. No named sign-off.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-17-local-playwright-suite-trust/stories/lpw-s1-make-the-local-playwright-suite-trustworthy.md
Test plan: artefacts/2026-11-17-local-playwright-suite-trust/test-plans/lpw-s1-test-plan.md
Contract: artefacts/2026-11-17-local-playwright-suite-trust/dor/lpw-s1-dor-contract.md
Goal: write T1 to T5 first and confirm T1, T2, T3, T4, T5 FAIL today; then implement the fake database handlers, the first-login wiring (a separate task), the spec fixes, the repository fixture, the job and the summary script.
Constraints:
- No production behaviour change; the "connect a repo" gate and the first-login redirect are intentional and stay.
- The job stays non-blocking and keeps its name. Do not touch Scenario A or B, required checks or the ruleset.
- No new npm dependency; run `c8` with `npx` at a pinned version in the job only.
- Run the changed specs locally with NODE_ENV=test where the machine allows (browser tests can crash on this Windows machine); CI is the record.
- Stage only the files you changed. Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No.
