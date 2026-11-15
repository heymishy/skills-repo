## Definition of Ready: Answer 404 Not Found, not 500, when a malformed id is in the URL

**Story reference:** artefacts/2026-11-15-invalid-id-not-found/stories/uid-s1-invalid-id-not-found.md
**Test plan reference:** artefacts/2026-11-15-invalid-id-not-found/test-plans/uid-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-15
**Track:** short

## Contract Proposal
See `artefacts/2026-11-15-invalid-id-not-found/dor/uid-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** One small helper module, two call sites and two new test files; all 8 acceptance criteria (AC) map to a named test or a named live scenario. The contract's exclusion list (per-route validation, existing 404/400 answers, non-uuid malformed input, the slow artefact 404, error reporting beyond skipping it for a matched request) has zero test assertions against it, and the touched files are exactly the ones the tests need (B1/D1 check: no touched file appears in the exclusion list).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied, as for the earlier short-track stories in this repo.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "a person following a mistyped, stale or hand-edited link" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 8 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2, AC3 T3a and T3b, AC4 T4a and T4b, AC5 T5, AC6 T6a and T6b, AC7 P1 (gated), AC8 live scenario 8 |
| H4 | Out of scope populated | ✅ | 4 exclusions |
| H5 | Benefit linkage | ✅ (short-track) | Removes false server errors; one central translation instead of per-route edits |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | No review ran |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC7 gated and AC8 live-only, both acknowledged |
| H9 | Architecture Constraints populated | ✅ | Names ADR-011 and records that ADR-025 is not engaged |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | No AC depends on CSS layout |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | Security, reliability and performance NFRs in the story |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | No injectable adapter introduced |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | No UI markup changes; `hasDesignSystemTrack` not set |

**Hard blocks: 19/19 passed** (3 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W1, W2, W3 | ✅ | |
| W4 | ⚠️ Pending operator | Scenario 8 (live) needs a signed-in production session; P1 needs Docker running locally |
| W5 | ⚠️ Accepted | A genuine server bug that produces a uuid error with a value that happens to appear in the URL would be answered as 404 and not reported; the classifier's value-in-url rule makes this very unlikely, and the default for every other case stays 500 plus a report |

## Standards injection
Domain tags `[web-ui]`: matched `.github/standards/web-ui/web-ui-patterns.md`. The agent must read it first.

## Oversight level
**Low** - failure-path only, no data writes, responses change only from 500 to 404 for malformed ids. No named sign-off required.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-15-invalid-id-not-found/stories/uid-s1-invalid-id-not-found.md
Test plan: artefacts/2026-11-15-invalid-id-not-found/test-plans/uid-s1-test-plan.md
Contract: artefacts/2026-11-15-invalid-id-not-found/dor/uid-s1-dor-contract.md
Goal: write tests/check-uid-s1-invalid-id-404.js (T1 to T7) and the gated tests/check-uid-s1-real-postgres.js (P1) first and confirm T1, T2, T6a and T6b FAIL for the right reason (500 today, helper missing); then implement. No scope beyond the 8 ACs.
Constraints:
- The classifier is narrow on purpose: code 22P02 AND message "invalid input syntax for type uuid: "<value>"" AND a non-empty value present in req.url (raw or percent-encoded). Anything else keeps today's behaviour. It must never throw.
- Answer 404 with {"error":"not found"} as application/json; do not echo the value or any database text; do not report a matched request; never write twice if the response has started.
- Do not edit individual routes; call the helper only from authGuard's error handler and the router catch in createApp (and keep the ecg-s1 reporting behaviour for everything that does not match).
- P1 must refuse any database URL whose host is not localhost, 127.0.0.1 or ::1, and print SKIPPED when UID_TEST_DATABASE_URL is unset (copy the pattern from tests/check-tabf-s1-bootstrap-real-postgres.js).
- Read .github/standards/web-ui/web-ui-patterns.md and .github/architecture-guardrails.md first. No new npm dependencies.
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges; no production deploy.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No; W4 and W5 advisory.
