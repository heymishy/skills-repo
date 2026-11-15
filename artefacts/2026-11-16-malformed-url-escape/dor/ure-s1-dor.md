## Definition of Ready: Answer 404 Not Found, not 500, when the URL contains a broken percent-escape

**Story reference:** artefacts/2026-11-16-malformed-url-escape/stories/ure-s1-malformed-url-escape.md
**Test plan reference:** artefacts/2026-11-16-malformed-url-escape/test-plans/ure-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Track:** short

## Contract Proposal
See `artefacts/2026-11-16-malformed-url-escape/dor/ure-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** One helper extended and one new test file; all 7 acceptance criteria (AC) map to a named test or a named live scenario. The contract's exclusion list (changes to `authGuard` or the router catch, wrapping individual decode calls, the artefact route, existing 404 or 400 answers, new dependencies) has zero test assertions against it, and the touched files are exactly the ones the tests need (B1/D1 check: no touched file appears in the exclusion list).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied, as for the earlier short-track stories in this repo.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "a person following a mistyped, truncated or hand-edited link" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 7 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2, AC3 T3a and T3b, AC4 T4a and T4b, AC5 T5, AC6 T6a and T6b, AC7 live scenario 8 |
| H4 | Out of scope populated | ✅ | 4 exclusions |
| H5 | Benefit linkage | ✅ (short-track) | Removes false server errors and the issues and incident PRs they open |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | No review ran |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC7 live-only, acknowledged |
| H9 | Architecture Constraints populated | ✅ | Names ADR-011, records ADR-025 not engaged |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | No AC depends on CSS layout |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | Security, reliability, performance in the story |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | None introduced |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | No UI markup changes; `hasDesignSystemTrack` not set |

**Hard blocks: 19/19 passed** (3 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W1, W2, W3 | ✅ | |
| W4 | ⚠️ Pending operator | Scenario 8 (live) needs a signed-in production session after deploy |
| W5 | ⚠️ Accepted | A genuine server bug that raises `URIError: URI malformed` while the request url also happens to be undecodable would be answered 404 and not reported; the "url really cannot be decoded" rule makes this very unlikely, and the default for every other case stays 500 plus a report |

## Standards injection
Domain tags `[web-ui]`: matched `.github/standards/web-ui/web-ui-patterns.md`. The agent must read it first.

## Oversight level
**Low** - failure-path only, no data writes, responses change only from 500 to 404 for broken escapes. No named sign-off required.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-16-malformed-url-escape/stories/ure-s1-malformed-url-escape.md
Test plan: artefacts/2026-11-16-malformed-url-escape/test-plans/ure-s1-test-plan.md
Contract: artefacts/2026-11-16-malformed-url-escape/dor/ure-s1-dor-contract.md
Goal: write tests/check-ure-s1-malformed-escape-404.js (T1 to T7) first and confirm T1, T2, T3a (the true cases) and T6a FAIL for the right reason (500 today); then extend isInvalidIdError. No scope beyond the 7 ACs.
Constraints:
- Classifier is narrow on purpose: err.name URIError AND message "URI malformed" AND the request url really cannot be decoded (decodeURIComponent of the path, a segment or the query throws). Anything else keeps today's behaviour. It must never throw. Keep the uuid case exactly as uid-s1 left it.
- Produce the error in tests by calling decodeURIComponent('%E0%A4%A'), not by constructing an imitation.
- Do not edit authGuard, the router catch, or individual routes. Same 404 body and no report; never write twice.
- Read .github/standards/web-ui/web-ui-patterns.md and .github/architecture-guardrails.md first. No new npm dependencies.
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges; no production deploy.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No; W4 and W5 advisory.
