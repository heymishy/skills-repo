# ecg-s1 Definition of Done

Date: 2026-11-16. Story: report every server 5xx (not only caught exceptions) to the error chain. PR #1106, merged to master as `181b8f16d`. Its own Staging Deploy (run 43699590989) was never promoted; the change reached production inside the later uid-s1 deploy, which is built from master.

## Result: COMPLETE, with AC8 not observed live

AC1 to AC7 (Acceptance Criteria 1 to 7) were verified by 12 automated tests before merge (see `reference/ecg-s1-verify-completion-evidence.md`).

AC8 (a live production request opens exactly one GitHub issue and one incident-record PR, and a repeat opens none) was NOT observed. The planned trigger was `/products/not-a-uuid`, which returned 500. uid-s1 (PR #1107) now answers that request with 404 and no report, so it can no longer trigger the chain, and no other known-bad production URL was triggered because that would open a real issue and PR. Production is on both changes.

## Decision needed from the operator

Accept AC8 as covered by the automated tests (a recording PostHog client proves each 5xx path produces exactly one report), or ask for a live check using a different real 5xx. Until the operator confirms, this is recorded as an unobserved AC, not a pass.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | ecg-s1 automated tests | automated | none |
| AC2 | ✅ | ecg-s1 automated tests | automated | none |
| AC3 | ✅ | ecg-s1 automated tests | automated | none |
| AC4 | ✅ | ecg-s1 automated tests | automated | none |
| AC5 | ✅ | ecg-s1 automated tests | automated | none |
| AC6 | ✅ | ecg-s1 automated tests | automated | none |
| AC7 | ✅ | ecg-s1 automated tests | automated | none |
| AC8 | ⚠️ | not observed live | production-observed (not obtained) | trigger URL now answers 404 after uid-s1; covered by tests; operator to accept or request another live check |

## Observations and follow-ups

- Browser-side JavaScript errors are still not confirmed as reported (the earlier sweep saw no console errors); candidate follow-up.
- The ecg-s1 Staging Deploy run remains in "waiting" and can be cancelled; it is superseded by later deploys.
