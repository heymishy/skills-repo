## Definition of Ready: Send a function name on every stack frame so PostHog groups the error into an issue

**Story reference:** artefacts/2026-11-16-exception-frame-function/stories/ecf-s1-frame-function.md
**Test plan reference:** artefacts/2026-11-16-exception-frame-function/test-plans/ecf-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Track:** short

## Contract Proposal
See `artefacts/2026-11-16-exception-frame-function/dor/ecf-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** One function changed, one new test file with a fixture, and two assertions edited in an existing test; all 7 acceptance criteria (AC) map to a named test or a named live scenario. The contract's exclusion list (fingerprint, route label, code allow-list, message scrubbing, issue titles and bodies, the commit result page, reprocessing, new dependencies) has zero test assertions against it, and the touched files are exactly the ones the tests need (B1/D1 check: no touched file appears in the exclusion list).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied, as for the earlier short-track stories in this repo.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "the operator who relies on the error chain to open a GitHub issue for every server error" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 7 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2, AC3 T3, AC4 T4, AC5 T5, AC6 existing suite, AC7 live scenario 7 |
| H4 | Out of scope populated | ✅ | 4 exclusions |
| H5 | Benefit linkage | ✅ (short-track) | Closes the gap between "reported to PostHog" and "becomes an issue" |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | No review ran |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC7 live-only, acknowledged |
| H9 | Architecture Constraints populated | ✅ | Names ADR-011; privacy rule and sff-s1 pattern recorded |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | No AC depends on CSS layout |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | Privacy, reliability, performance in the story |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | None introduced |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | No UI markup changes; `hasDesignSystemTrack` not set |

**Hard blocks: 19/19 passed** (3 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W1, W2, W3 | ✅ | |
| W4 | ⚠️ Pending operator | Scenario 7 (live) needs a signed-in production session after deploy and opens a real GitHub issue and incident PR (approved for this work) |
| W5 | ⚠️ Accepted | PostHog's accepted schema is not published; a further missing field would surface in `$cymbal_errors` and become a new story |

## Standards injection
Domain tags `[web-ui]`: matched `.github/standards/web-ui/web-ui-patterns.md`. The agent must read it first.

## Oversight level
**Low** - error-reporting path only, no change to responses or data. No named sign-off required.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-16-exception-frame-function/stories/ecf-s1-frame-function.md
Test plan: artefacts/2026-11-16-exception-frame-function/test-plans/ecf-s1-test-plan.md
Contract: artefacts/2026-11-16-exception-frame-function/dor/ecf-s1-dor-contract.md
Goal: write tests/check-ecf-s1-frame-function.js (T1 to T5) and the fixture first and confirm T1, T3, T4 and T5 FAIL for the right reason (function key missing today); then implement. No scope beyond the 7 ACs.
Constraints:
- Change only scrubFrame (and a placeholder constant beside REDACTED_FILENAME). A function name is kept only if it matches the existing RE_IDENT; otherwise use the fixed string "<anonymous>". Never derive the placeholder from the input.
- Update only the two assertions in scrubEvent_function_identifierShapedOnly; do not change any other existing test.
- The fixture must hold the real shapes quoted in the story diagnosis; do not invent shapes (learning D62).
- Read .github/standards/web-ui/web-ui-patterns.md and .github/architecture-guardrails.md first. No new npm dependencies.
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges; no production deploy.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No; W4 and W5 advisory.
