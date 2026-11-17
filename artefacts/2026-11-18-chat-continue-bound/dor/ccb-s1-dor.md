## Definition of Ready: The chat page stops sending hidden "continue" turns after a few, and shows the operator what it has

**Story reference:** artefacts/2026-11-18-chat-continue-bound/stories/ccb-s1-bound-hidden-continue-turns.md
**Test plan reference:** artefacts/2026-11-18-chat-continue-bound/test-plans/ccb-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-18
**Track:** short

## Contract Proposal
See `artefacts/2026-11-18-chat-continue-bound/dor/ccb-s1-dor-contract.md`.

## Contract Review
Contract review passed. All 5 acceptance criteria (AC) map to a named test. The exclusion list (turn handlers, SSE framing, gateway, ideate exemption) has no test assertion against it other than the unchanged regression suites (B1/D1).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | "an operator working through a skill session in the chat page" |
| H2 | At least 3 ACs in Given / When / Then | Pass | 5 ACs |
| H3 | Every AC has a test | Pass | AC1 T1a, T1b; AC2 T2a, T2b; AC3 T3; AC4 T4; AC5 T5a to T5c |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | Removes an unbounded token-spending loop |
| H6 | Complexity rated | Pass | 2, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | `schemaDepends: []` |
| H9 | Architecture Constraints populated | Pass | ADR-011 named |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | No CSS-layout AC |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | cost, accessibility, security |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | None introduced |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | A plain-text notice bubble in the existing thread, no new tokens, layout or control (`hasDesignSystemTrack` not set) |

**Hard blocks: 19/19 passed** (6 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | Accepted | The cap values (2 and 5) are a product decision made here; the operator reads them in the diff and can change them |
| W5 | Accepted | The embedded script is a large string; the jsdom harness proves the real script, not a copy |

## Standards injection
Domain tags `[web-ui] [chat]`: read the client script in `src/web-ui/routes/skills.js` (the `sendTurn` function and its `evt.done` branch), `tests/check-icv-s1-ideate-canvas-turn2-render-fix.js` (harness) and `tests/check-ltd-s1-truncation-detection.js`.

## Oversight level
**Medium** - a behaviour change in the chat page's script; the operator reads the diff and the cap values before merging. No separate named sign-off.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-18-chat-continue-bound/stories/ccb-s1-bound-hidden-continue-turns.md
Test plan: artefacts/2026-11-18-chat-continue-bound/test-plans/ccb-s1-test-plan.md
Contract: artefacts/2026-11-18-chat-continue-bound/dor/ccb-s1-dor-contract.md
Goal: write T1a to T5c first against the real page script in jsdom and confirm T1 to T4 FAIL today; add the bounded counter, identical-reply stop, notice and reset to the client script.
Constraints:
- Client script only; no change to turn handlers, SSE framing, the gateway or the ideate exemption.
- check-icv-s1 and check-ltd-s1 (and every other test reading the chat-page script) pass unchanged; the four lpw-s5 browser specs still pass.
- Work in a worktree under .worktrees/ccb-s1; verify the absolute path before every edit. Stage only the files you changed. Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. The tests must never create a real git commit or leave artefact files (see the icv-s1 harness's no-op commit adapter and disposable slug).
Oversight level: Medium.
```

## Sign-off
**Oversight level:** Medium; **Sign-off required:** No named sign-off; the operator's review of the diff and cap values at merge.
