## Definition of Ready: Reject malformed, empty and oversized skill turns before they reach the model

**Story reference:** artefacts/2026-11-16-turn-body-validation/stories/tvl-s1-turn-body-validation.md
**Test plan reference:** artefacts/2026-11-16-turn-body-validation/test-plans/tvl-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Track:** short

## Contract Proposal
See `artefacts/2026-11-16-turn-body-validation/dor/tvl-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** One source file and one new test file; all 8 acceptance criteria (AC) map to a named test or a named live scenario. The contract's exclusion list (`server.js`, credits and viewer guards, `_readBody`, other routes, model executors, `/answer`, `commit-preview`, rate limiting, dependencies) has zero test assertions against it, and the touched files are exactly the ones the tests need (B1/D1 check: no touched file appears in the exclusion list). The existing turn tests are named so the regression risk is explicit.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied, as for the earlier short-track stories in this repo.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "the operator paying for model calls" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 8 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2, AC3 T3a and T3b, AC4 T4, AC5 T5, AC6 T6 and existing tests, AC7 T7, AC8 live scenario 9 |
| H4 | Out of scope populated | ✅ | 4 exclusions |
| H5 | Benefit linkage | ✅ (short-track) | Removes avoidable model spend and an unbounded body read |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | No review ran |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC8 live-only, acknowledged |
| H9 | Architecture Constraints populated | ✅ | Names ADR-011, records ADR-025 not engaged; ordering of checks stated |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | No AC depends on CSS layout |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | Cost and safety, security, reliability, performance in the story |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | None introduced; existing stubs are only used as test doubles |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | No UI markup changes; `hasDesignSystemTrack` not set |

**Hard blocks: 19/19 passed** (3 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W1, W2, W3 | ✅ | |
| W4 | ⚠️ Pending operator | Scenario 9 (live, staging) needs a signed-in staging session after deploy |
| W5 | ⚠️ Accepted | An empty answer is now rejected; if any page or script legitimately sends an empty answer to start or skip a turn, it will start getting 400. The page sends `__init__` to start, and a search found no other empty sender; the existing turn tests are the safety net |
| W6 | ⚠️ Accepted | The 100000-character answer cap is a safety bound chosen by the agent (about 25000 tokens); a legitimate larger paste would be refused. The operator can raise it in review |

## Standards injection
Domain tags `[web-ui]`: matched `.github/standards/web-ui/web-ui-patterns.md`. The agent must read it first.

## Oversight level
**Low** - failure-path validation only; valid turns are unchanged. No named sign-off required.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-16-turn-body-validation/stories/tvl-s1-turn-body-validation.md
Test plan: artefacts/2026-11-16-turn-body-validation/test-plans/tvl-s1-test-plan.md
Contract: artefacts/2026-11-16-turn-body-validation/dor/tvl-s1-dor-contract.md
Goal: write tests/check-tvl-s1-turn-body-validation.js (T1 to T8) first and confirm T1, T2, T3b, T4 and T5 FAIL for the right reason (200 and a model call today); then add the limited reader and the shared validation to routes/skills.js and call it from both handlers. No scope beyond the 8 ACs.
Constraints:
- Order: unknown session 404 first, then body validation, then the journey lock, then the model call. A rejection must never leave turnInProgress set.
- Do not change server.js, _readBody, the credits guard or any response shape. __init__ and the {answer, attemptId} request shape must keep working.
- Run every existing test file named in the contract; fix only genuine regressions your change causes, and edit an existing test only if it depended on an invalid body (list each in the evidence).
- Stage only the files you changed (never `git add -A` on artefacts/ after a full-suite run: the suite writes stub files there).
- Read .github/standards/web-ui/web-ui-patterns.md and .github/architecture-guardrails.md first. No new npm dependencies.
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No; W4 to W6 advisory.
