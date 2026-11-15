## Definition of Ready: Put the error type and route in the issue title, and keep the real error code

**Story reference:** artefacts/2026-11-16-error-issue-title/stories/eit-s1-error-issue-title.md
**Test plan reference:** artefacts/2026-11-16-error-issue-title/test-plans/eit-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Track:** short

## Contract Proposal
See `artefacts/2026-11-16-error-issue-title/dor/eit-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** One scrubber expression and two allow-list entries, one new test file and a few edited assertions in one existing test; all 7 acceptance criteria (AC) map to a named test or a named live scenario. The contract's exclusion list (issue body and labels, the bridge, the incident script, the PostHog destination, retitling, new dependencies) has zero test assertions against it except T5, which only calls the bridge and incident script as consumers and does not edit them (B1/D1 check: no touched file appears in the exclusion list).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied, as for the earlier short-track stories in this repo.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "the operator reading the GitHub issues the error chain opens" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 7 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2, AC3 T3, AC4 T4, AC5 T5, AC6 T6, AC7 live scenario 7 |
| H4 | Out of scope populated | ✅ | 4 exclusions |
| H5 | Benefit linkage | ✅ (short-track) | Self-describing issues; real error code preserved |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | No review ran |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC7 live-only, acknowledged |
| H9 | Architecture Constraints populated | ✅ | Names ADR-011; privacy and grouping rules recorded |
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
| W4 | ⚠️ Pending operator | Scenario 7 (live) needs a signed-in production session after deploy and opens a real issue and incident PR (approved for this work) |
| W5 | ⚠️ Accepted | Two new allow-listed codes mean errors previously grouped under `unhandled_exception` for a route open one new issue under their real code the first time they recur; intended |
| W6 | ⚠️ Accepted | Public GitHub issues will now show a route label; it is the scrubbed fixed-vocabulary label already visible in PostHog, with no tenant text |

## Standards injection
Domain tags `[web-ui]`: matched `.github/standards/web-ui/web-ui-patterns.md`. The agent must read it first.

## Oversight level
**Low** - error-reporting path only, no change to responses or data. No named sign-off required.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-16-error-issue-title/stories/eit-s1-error-issue-title.md
Test plan: artefacts/2026-11-16-error-issue-title/test-plans/eit-s1-test-plan.md
Contract: artefacts/2026-11-16-error-issue-title/dor/eit-s1-dor-contract.md
Goal: write tests/check-eit-s1-issue-title.js (T1 to T6) first and confirm T1 and T3 FAIL for the right reason (value is the bare code; known codes are rewritten); then implement. No scope beyond the 7 ACs.
Constraints:
- Change only scrubEvent's value expression and ALLOWED_CODES in error-capture.js. The value is built only from the allow-listed code, the allow-listed type (else Error) and the scrubbed route label. Allow-listed fixed messages keep their value. The fingerprint is unchanged.
- Update only the coha-s5 assertions that expect the bare code as the value; list each one in the evidence file. Do not edit the bridge, the incident script or the PostHog destination.
- Never add message text, ids, query values or any input-derived string to the value. Keep every existing canary test passing.
- Read .github/standards/web-ui/web-ui-patterns.md and .github/architecture-guardrails.md first. No new npm dependencies.
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges; no production deploy; do not change the PostHog destination.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No; W4, W5 and W6 advisory.
