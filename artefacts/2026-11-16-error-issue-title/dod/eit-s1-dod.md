# eit-s1 Definition of Done

Date: 2026-11-16. Story: The issue title says what failed and where (error type and route), and keeps the real error code. PR #1117, merged to master as `3623e5842` (2026-11-15). Evidence: `reference/eit-s1-verify-completion-evidence.md` in the story folder, plus the live observations below.

## Result: COMPLETE

7 of 7 acceptance criteria (AC) met.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | T1 | automated | none |
| AC2 | ✅ | T2 | automated | none |
| AC3 | ✅ | T3 | automated | none |
| AC4 | ✅ | T4 | automated | none |
| AC5 | ✅ | T5 | automated | none |
| AC6 | ✅ | T6 | automated | none |
| AC7 | ✅ | production issue #1121 (2026-11-16 04:40 UTC) titled `http_5xx: Error at /api/:p/:p/:p/:p/:p`, with the real code http_5xx kept | production-observed | none |

## Observations and follow-ups

- Tests ran red first for each story; the full local suite shows only the known local-environment failures (this Windows machine has no working bash) plus the C3 baseline item; CI on the PR was green.
- Live observations were agent-run with the operator's approval, read-only or a single status-only request, signed-in browser tab.
