# ecf-s1 Definition of Done

Date: 2026-11-16. Story: Exception frames always carry a function name so PostHog groups server errors into issues. PR #1114, merged to master as `d5bf8f680` (2026-11-15). Evidence: `reference/ecf-s1-verify-completion-evidence.md` in the story folder, plus the live observations below.

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
| AC6 | ✅ | existing tests: existing coha-s5 suite, 89 tests, with the one edit (full suite) | automated | none |
| AC7 | ✅ | real production 5xx of 2026-11-16 04:40 UTC (issue #1121): PostHog event stacktrace.type resolved, issue id assigned, no processing errors; before the fix such events were never grouped | production-observed | none |

## Observations and follow-ups

- Tests ran red first for each story; the full local suite shows only the known local-environment failures (this Windows machine has no working bash) plus the C3 baseline item; CI on the PR was green.
- Live observations were agent-run with the operator's approval, read-only or a single status-only request, signed-in browser tab.
