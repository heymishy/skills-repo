# tvl-s1 Definition of Done

Date: 2026-11-16. Story: Malformed, empty and oversized skill turns are refused before the model call. PR #1123, merged to master as `0a825d5e3` (2026-11-16). Evidence: `reference/tvl-s1-verify-completion-evidence.md` in the story folder, plus the live observations below.

## Result: COMPLETE

8 of 8 acceptance criteria (AC) met.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | T1 | automated | none |
| AC2 | ✅ | T2 | automated | none |
| AC3 | ✅ | T3a, T3b | automated | none |
| AC4 | ✅ | T4 | automated | none |
| AC5 | ✅ | T5 | automated | none |
| AC6 | ✅ | T6 | automated | none |
| AC7 | ✅ | T7 | automated | none |
| AC8 | ✅ | staging 2026-11-16 (build 4dfe7d6, mock model): 16 requests replayed against a fresh session, all refused as specified (400 INVALID_BODY, 400 INVALID_ANSWER, 413 ANSWER_TOO_LARGE, 404), normal answer 200; production not replayed because garbage turns there are real model calls | staging-observed | none |

## Observations and follow-ups

- Tests ran red first for each story; the full local suite shows only the known local-environment failures (this Windows machine has no working bash) plus the C3 baseline item; CI on the PR was green.
- Live observations were agent-run with the operator's approval, read-only or a single status-only request, signed-in browser tab.
