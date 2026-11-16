# ure-s1 Definition of Done

Date: 2026-11-16. Story: A broken percent-escape in a URL answers 404 instead of 500 and is not reported as a server error. PR #1115, merged to master as `ccd6ec522` (2026-11-15). Evidence: `reference/ure-s1-verify-completion-evidence.md` in the story folder, plus the live observations below.

## Result: COMPLETE

7 of 7 acceptance criteria (AC) met.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | T1 | automated | none |
| AC2 | ✅ | T2 | automated | none |
| AC3 | ✅ | T3a, T3b | automated | none |
| AC4 | ✅ | T4a, T4b | automated | none |
| AC5 | ✅ | T5 | automated | none |
| AC6 | ✅ | T6a, T6b | automated | none |
| AC7 | ✅ | production GET /journey/<zero id>/stage/%E0%A4%A and /products/<zero id>/playback-evidence/%E0%A4%A answered 404 {"error":"not found"} (sweep 3, 2026-11-16 04:05 UTC); no new issue | production-observed | none |

## Observations and follow-ups

- Tests ran red first for each story; the full local suite shows only the known local-environment failures (this Windows machine has no working bash) plus the C3 baseline item; CI on the PR was green.
- Live observations were agent-run with the operator's approval, read-only or a single status-only request, signed-in browser tab.
