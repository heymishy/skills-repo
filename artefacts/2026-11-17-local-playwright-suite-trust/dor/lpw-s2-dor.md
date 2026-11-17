## Definition of Ready: A small required core of browser tests, chosen by capability and measured coverage

**Story reference:** artefacts/2026-11-17-local-playwright-suite-trust/stories/lpw-s2-choose-the-required-core-browser-set.md
**Test plan reference:** artefacts/2026-11-17-local-playwright-suite-trust/test-plans/lpw-s2-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-17
**Track:** short

## Contract Proposal
See `artefacts/2026-11-17-local-playwright-suite-trust/dor/lpw-s2-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** All 8 acceptance criteria (AC) map to a named test, a CI run or a live step. The exclusion list (ruleset, Scenario jobs, spec deletion, production code, request log) has zero assertions against it (B1/D1 check). The workflow and matrix are required touchpoints named in the test plan.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "the operator" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 8 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1 and T5, AC2 live, AC3 T2, AC4 T3, AC5 live, AC6 T4 and T5, AC7 T2 and CI, AC8 live |
| H4 | Out of scope populated | ✅ | |
| H5 | Benefit linkage | ✅ (short-track) | Turns an unmeasured suite into a small blocking core with stated reasons for the rest |
| H6 | Complexity rated | ✅ | 2, Unstable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC2, AC5, AC8 live-only |
| H9 | Architecture Constraints populated | ✅ | ADR-011 named; platform change policy followed |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | No layout AC |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | None introduced |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | No UI change |

**Hard blocks: 19/19 passed** (5 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | ⚠️ Pending | AC2, AC5 and AC8 are observed on the pull request's own CI |
| W5 | ⚠️ Accepted | Fixes for the kanban, pod and model-session groups are attempted only where one shared environment cause is found; the rest are quarantined with an owner and review date |
| W6 | ⚠️ Accepted | The core must reach 95% of the passing-spec union; if a capability has no passing spec it is recorded as a gap, not hidden |
| W7 | ⚠️ Accepted | Journeys are not folded into Scenario A or B (different harness); the matrix records which spec protects each journey |

## Standards injection
Domain tags `[ci] [test]`: read `.github/workflows/e2e.yml`, `playwright.config.js`, `tests/check-a5-ci-gate-config.js`, the `lpw-s1` evidence and `decisions.md` first.

## Oversight level
**Low** - test tooling and a new non-required job; no production change. No named sign-off.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-17-local-playwright-suite-trust/stories/lpw-s2-choose-the-required-core-browser-set.md
Test plan: artefacts/2026-11-17-local-playwright-suite-trust/test-plans/lpw-s2-test-plan.md
Contract: artefacts/2026-11-17-local-playwright-suite-trust/dor/lpw-s2-dor-contract.md
Goal: write T1 to T5 first and confirm they FAIL today; build the scripts and the measurement workflow; run the measurement in CI; build the matrix from the measurement; select the core; add the core job; fix or quarantine the failing specs; record two CI runs.
Constraints:
- Do not make any job required, change the ruleset, fold journeys into Scenario A or B, delete a spec or weaken an assertion.
- The measurement workflow must not run on a push to master or on a schedule.
- No new npm dependency; run `c8` with `npx` at the pinned version in CI only.
- Work in a worktree under .worktrees/lpw-s2; verify the absolute path before every edit. Stage only the files you changed. Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges. PR body ends with `Fixes` only if a source issue exists (none here).
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No.
