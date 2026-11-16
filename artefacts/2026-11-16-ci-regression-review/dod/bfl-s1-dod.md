# bfl-s1 Definition of Done

Date: 2026-11-16. Story: The CI known-failures baseline lists only the 3 files that really fail, and a stale entry fails the check. PR #1125, merged to master as `9bcafa21d` (2026-11-16). Evidence: `reference/bfl-s1-verify-completion-evidence.md` in the story folder, plus the live observations below.

## Result: COMPLETE

6 of 6 acceptance criteria (AC) met.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | T1 | automated | none |
| AC2 | ✅ | T2 | automated | none |
| AC3 | ✅ | T3 | automated | none |
| AC4 | ✅ | T4 | automated | none |
| AC5 | ✅ | T5 | automated | none |
| AC6 | ✅ | CI run 43813566096 (PR #1125) and run 43815532677 (PR #1126) logs: "3 file(s) currently failing, 3 in known baseline (recorded 2026-11-16)" and "no new regressions" | ci-observed | none |

## Observations and follow-ups

- Tests ran red first for each story; the full local suite shows only the known local-environment failures (this Windows machine has no working bash) plus the C3 baseline item; CI on the PR was green.
- Live observations were agent-run with the operator's approval, read-only or a single status-only request, signed-in browser tab.
