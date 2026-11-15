## Definition of Ready: Report every server error to the error chain, not only the ones the router catches

**Story reference:** artefacts/2026-11-15-error-capture-coverage/stories/ecg-s1-capture-all-server-5xx.md
**Test plan reference:** artefacts/2026-11-15-error-capture-coverage/test-plans/ecg-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-15
**Track:** short

## Contract Proposal
See `artefacts/2026-11-15-error-capture-coverage/dor/ecg-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** Three production files change (the capture module, `authGuard`, the server entry) plus one new test file; all 8 acceptance criteria (AC) map to a named test or a named live scenario. The contract's exclusion list (route statuses, bodies and headers, the 48 response sites, the malformed-id and slow-404 fixes, client-side errors, alert/bridge/incident record) has zero test assertions against it, and the touched files are exactly the ones the tests need (B1/D1 check: no touched file appears in the exclusion list).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied, as for the earlier short-track stories in this repo.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "the operator of the platform" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 8 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2, AC3 T3a to T3c, AC4 T4a and T4b, AC5 T5, AC6 T6a and T6b, AC7 T7, AC8 live scenario 9 |
| H4 | Out of scope populated | ✅ | 5 exclusions |
| H5 | Benefit linkage | ✅ (short-track) | Error-chain coverage: from 3 call sites plus the router catch to every 5xx |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | No review ran |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC8 live-only, acknowledged |
| H9 | Architecture Constraints populated | ✅ | Names ADR-011 and records that ADR-025 is not engaged |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | No AC depends on CSS layout |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | Security and privacy, performance and reliability NFRs in the story |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | No new injectable adapter; the existing capture client seam is reused |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | No UI markup changes; `hasDesignSystemTrack` not set |

**Hard blocks: 19/19 passed** (3 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W1, W2, W3 | ✅ | |
| W4 | ⚠️ Pending operator | Scenario 9 needs the operator's approval; it opens one real GitHub issue and one incident-record PR |
| W5 | ⚠️ Accepted | Once live, previously invisible 5xx errors will start opening issues (one per route and code); expect an initial burst for already-existing bugs (the malformed-id 500s) until `uid-s1` ships |

## Standards injection
Domain tags `[web-ui]`: matched `.github/standards/web-ui/web-ui-patterns.md`. The agent must read it first.

## Oversight level
**Medium** - this changes the entry point every request passes through (`createApp`) and the guard around every logged-in route, even though responses must stay identical. A named sign-off is not required, but the operator reviews the PR before merge and approves the live scenario.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-15-error-capture-coverage/stories/ecg-s1-capture-all-server-5xx.md
Test plan: artefacts/2026-11-15-error-capture-coverage/test-plans/ecg-s1-test-plan.md
Contract: artefacts/2026-11-15-error-capture-coverage/dor/ecg-s1-dor-contract.md
Goal: write tests/check-ecg-s1-capture-all-5xx.js (T1 to T8) first and confirm every capture-expecting test FAILS for the right reason (zero reports today for guarded failures and direct 5xx; no handleUnhandledRejection export); then implement. No scope beyond the 8 ACs.
Constraints:
- Responses (status, headers, body) must stay byte-identical; capture runs beside the response, never before or instead of it, and every capture call is inside its own try/catch.
- Report each request at most once (flag on the request, set by captureServerError when context.req is given).
- Do not change what is sent to error tracking: same fields, same scrubber, same fingerprint rule.
- The safety net lives in createApp only; do not edit the 48 response sites. authGuard reports the real error; the process unhandledRejection handler calls an exported handleUnhandledRejection.
- Read .github/standards/web-ui/web-ui-patterns.md and .github/architecture-guardrails.md first. No new npm dependencies.
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges; no production deploy; no live request that opens an issue without the operator's approval.
Oversight level: Medium - operator reviews the PR and approves the live scenario.
```

## Sign-off
**Oversight level:** Medium; **Sign-off required:** No named sign-off; the operator's PR review and live-scenario approval apply; W4 and W5 advisory.
