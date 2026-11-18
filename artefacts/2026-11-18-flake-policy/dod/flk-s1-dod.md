# flk-s1 Definition of Done

Date: 2026-11-18. Story: a flake is a tracked, owned, time-limited entry in one ledger, and a rerun that passes is not a result until it is recorded. Pull request #1155 merged 2026-11-18 (`1f8ecf358`). No issue.

## Result: COMPLETE

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 (policy states the definition, rerun rule, 14-day limit, quarantine, single ledger) | ✅ | T1 in `tests/check-flk-s1-flake-policy.js` reads `tests/FLAKE-POLICY.md` by key phrase | automated | none |
| AC2 (incomplete or over-long entries named) | ✅ | T2a (missing owner and issue), T2b (review date past 14 days; exactly 14 allowed) | automated | none |
| AC3 (overdue entry reported; check exits 1) | ✅ | T3 with an injected date | automated | none |
| AC4 (flaky tests listed as file > title) | ✅ | T4 on a fixture report | automated | none |
| AC5 (strict mode names an untracked flake and exits 1; tracked exits 0) | ✅ | T5a and T5b | automated | none |
| AC6 (committed ledger and policy valid on master) | ✅ | T6 on the real files; `node scripts/flake-check.js --check`: `0 entries, all complete and in date` | automated + live | none |

Red first: the test file failed at `require` before the script existed.

## Observations and follow-ups

- **Not enforced in CI.** No step runs `--strict` on pull requests. Adding it needs a decision about CI reruns (recorded in the story's `decisions.md`).
- **No real flake has reached the reader.** Playwright's retry setting is zero, so no run marks a test flaky. The reader has only been exercised on a fixture. The first real flake recorded will be the first real test of the report path.
- **The ledger starts empty**, and the repository's history of reruns is not reconstructed.

## Scope Deviations

- None.
