# sps-s1 Definition of Done

Date: 2026-11-16. Story: The login token is stored encrypted in Redis so sessions survive a deploy or restart. PR #1116, merged to master as `084b2b538` (2026-11-15). Evidence: `reference/sps-s1-verify-completion-evidence.md` in the story folder, plus the live observations below.

## Result: COMPLETE

9 of 9 acceptance criteria (AC) met.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | T1 | automated | none |
| AC2 | ✅ | T2 | automated | none |
| AC3 | ✅ | T3 | automated | none |
| AC4 | ✅ | T4 | automated | none |
| AC5 | ✅ | T5 | automated | none |
| AC6 | ✅ | T6a, T6b | automated | none |
| AC7 | ✅ | T7 | automated | none |
| AC8 | ✅ | existing tests: existing tests p3.2 AC2, srf-s1 AC4, others from the audit edited (full suite) | automated | none |
| AC9 | ✅ | staging then production 2026-11-16: operator set SESSION_ENCRYPTION_KEY, signed in, restarted the app (production 04:03 UTC); the agent reloaded and was still signed in; before the key a restart signed everyone out | production-observed | none |

## Observations and follow-ups

- Tests ran red first for each story; the full local suite shows only the known local-environment failures (this Windows machine has no working bash) plus the C3 baseline item; CI on the PR was green.
- Live observations were agent-run with the operator's approval, read-only or a single status-only request, signed-in browser tab.
- Follow-up: add a repo-level ADR note on the token-at-rest rule to `.github/architecture-guardrails.md` (recorded in the story decisions).
