# anf-s1 Definition of Done

Date: 2026-11-16. Story: The artefact route answers 404 fast, and never 503, for a link that cannot name an artefact. PR #1118, merged to master as `f9d443d0f` (2026-11-16). Evidence: `reference/anf-s1-verify-completion-evidence.md` in the story folder, plus the live observations below.

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
| AC8 | ✅ | production GETs 2026-11-16: /artefact/%00/%00 404 in 53 ms, /artefact/%E0%A4%A/discovery 404 in 89 ms, an unknown artefact name 404 in 983 ms (was about 6 s); no new issue | production-observed | none |

## Observations and follow-ups

- Tests ran red first for each story; the full local suite shows only the known local-environment failures (this Windows machine has no working bash) plus the C3 baseline item; CI on the PR was green.
- Live observations were agent-run with the operator's approval, read-only or a single status-only request, signed-in browser tab.
