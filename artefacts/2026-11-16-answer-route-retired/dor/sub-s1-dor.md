## Definition of Ready: Retire the dead /answer form route so it answers 410 Gone instead of a server error

**Story reference:** artefacts/2026-11-16-answer-route-retired/stories/sub-s1-retire-the-answer-route.md
**Test plan reference:** artefacts/2026-11-16-answer-route-retired/test-plans/sub-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Track:** short

## Contract Proposal
See `artefacts/2026-11-16-answer-route-retired/dor/sub-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** Two source files and one new test; all 6 acceptance criteria (AC) map to a named test or live scenario. The exclusion list (`handlePostAnswerHtml`, the adapter, the question page, the chat markup, wuce.24 tests, wiring, deletion, dependencies) has zero test assertions against it except T5, which asserts only that `handlePostAnswerHtml` is unchanged (it is not edited); the touched files are exactly those the tests need (B1/D1 check).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "the operator" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 6 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2, AC3 T3, AC4 T4, AC5 T5 and wuce.24, AC6 live |
| H4 | Out of scope populated | ✅ | |
| H5 | Benefit linkage | ✅ (short-track) | Removes an always-5xx route and a guard-bypass hazard |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC6 live-only |
| H9 | Architecture Constraints populated | ✅ | ADR-011 named; ADR-012, ADR-025 not engaged; decision to retire recorded |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | The 410 page uses `renderShell` only |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | |
| H-ADAPTER | Injectable adapter (D37) | ✅ | Deliberately NOT wired (decision recorded): the stub keeps throwing, and the route no longer reaches it; T2 asserts the stub is not called |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | A short status page via the shared shell; no new styles; `hasDesignSystemTrack` not set |

**Hard blocks: 19/19 passed** (3 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | ⚠️ Pending operator | AC6 needs one POST from a signed-in production tab after deploy |
| W5 | ⚠️ Accepted | The chat page still contains the dead fallback form; a user without JavaScript who submits it now sees an honest 410 page instead of a 500 |

## Standards injection
Domain tags `[web-ui]`: matched `.github/standards/web-ui/web-ui-patterns.md`. The agent must read it first.

## Oversight level
**Low** - failure-path change on a route no working client uses. No named sign-off required.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-16-answer-route-retired/stories/sub-s1-retire-the-answer-route.md
Test plan: artefacts/2026-11-16-answer-route-retired/test-plans/sub-s1-test-plan.md
Contract: artefacts/2026-11-16-answer-route-retired/dor/sub-s1-dor-contract.md
Goal: write tests/check-sub-s1-answer-route-retired.js (T1 to T6) first and confirm T1, T2 and T3 FAIL for the right reason (500, adapter called); then add handleAnswerRetiredHtml and change the route in server.js.
Constraints:
- Do NOT wire submitAnswer and do not edit handlePostAnswerHtml, the adapter or any wuce.24 test. The route simply stops calling the legacy handler.
- Escape the skill and session ids with the file's escHtml; no form in the 410 page; no model call, session lookup or credit change.
- Read .github/standards/web-ui/web-ui-patterns.md and .github/architecture-guardrails.md first. No new npm dependencies.
- Stage only the files you changed (never `git add -A` on artefacts/ after a full-suite run).
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No.
