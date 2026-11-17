## Definition of Ready: The model-session browser specs run against the test server without the chat page looping, and join the browser suite

**Story reference:** artefacts/2026-11-17-local-playwright-suite-trust/stories/lpw-s5-model-session-specs-and-stub-turn-loop.md
**Test plan reference:** artefacts/2026-11-17-local-playwright-suite-trust/test-plans/lpw-s5-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-18
**Track:** short

## Contract Proposal
See `artefacts/2026-11-17-local-playwright-suite-trust/dor/lpw-s5-dor-contract.md`.

## Contract Review
Contract review passed. All 5 acceptance criteria (AC) map to a named test or to the specs themselves. The exclusion list (`public/`, `modules/`, `routes/`, `src/modules/`) has no test assertion against it other than T5, which asserts it is unchanged (B1/D1).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | "the operator who relies on the browser suite" |
| H2 | At least 3 ACs in Given / When / Then | Pass | 5 ACs |
| H3 | Every AC has a test | Pass | AC1 T1a, T1b; AC2 T2; AC3 the four specs; AC4 T4a, T4b; AC5 T5 |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | Closes the "model sessions" gap, and corrects a wrong quarantine reason |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | `schemaDepends: []` |
| H9 | Architecture Constraints populated | Pass | ADR-011 named |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | No CSS-layout AC; Playwright is configured |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | security, reliability, runtime |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | None introduced; an existing test-mode stub adapter's text changes |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | No UI change |

**Hard blocks: 19/19 passed** (6 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | Accepted | T2 needs chromium inside a check script; if it cannot launch it reports a skip with a reason, and AC2 is then covered by the four specs passing |
| W5 | Accepted | The page's unbounded auto-continue remains in product code (separate issue); a real model that keeps answering without a question mark can still trigger it |

## Standards injection
Domain tags `[testing] [web-ui]`: read `tests/e2e/capability-matrix.json`, the stub block in `src/web-ui/server.js`, the four specs, and `tests/e2e/fixtures/pods.js`.

## Oversight level
**Low** - a test-only stub change and specs. No named sign-off.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-17-local-playwright-suite-trust/stories/lpw-s5-model-session-specs-and-stub-turn-loop.md
Test plan: artefacts/2026-11-17-local-playwright-suite-trust/test-plans/lpw-s5-test-plan.md
Contract: artefacts/2026-11-17-local-playwright-suite-trust/dor/lpw-s5-dor-contract.md
Goal: write T1a to T5 first and confirm T1a, T1b (question) and T2 FAIL against master's stub; end the stub text on a question; fix ep2-s1's roster step; move the four specs out of quarantine.
Constraints:
- Only the NODE_ENV=test stub block changes in src/web-ui/server.js; nothing under public/, modules/, routes/ or src/modules/.
- Specs pass alone and in core order, twice. Core runtime grows by no more than about 30 seconds.
- Work in a worktree under .worktrees/lpw-s5; verify the absolute path before every edit. Stage only the files you changed. Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree.
Oversight level: Low.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No named sign-off.
