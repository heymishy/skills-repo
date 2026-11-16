# ecg-s1 Definition of Done

Date: 2026-11-16. Story: report every server 5xx (not only caught exceptions) to the error chain. PR #1106, merged to master as `181b8f16d`. Its own Staging Deploy (run 43699590989) was never promoted; the change reached production inside the later uid-s1 deploy, which is built from master.

## Result: COMPLETE

AC1 to AC7 (Acceptance Criteria 1 to 7) were verified by 12 automated tests before merge (see `reference/ecg-s1-verify-completion-evidence.md`).

AC8 (a live production request opens exactly one GitHub issue and one incident-record PR, and a repeat opens none) was first not observable: the planned trigger `/products/not-a-uuid` was fixed by uid-s1 to answer 404. It was observed later, on 2026-11-16, with a different real 5xx. One operator-approved POST at 04:40:38 UTC to the dead route `/api/skills/discovery/sessions/00000000-0000-0000-0000-000000000000/answer` (500 "Adapter not wired: submitAnswer", fixed afterwards by sub-s1) produced exactly one PostHog `http_5xx` exception (resolved, one issue id), exactly one GitHub issue (#1121, titled `http_5xx: Error at /api/:p/:p/:p/:p/:p`, created at 04:40:52 UTC, 13 seconds later) and, at that time, exactly one incident-record PR (#1122; that PR step was retired later the same day by inc-s2, on the operator's decision, and #1122 was closed). The "a repeat opens none" half was shown on staging (20 identical `http_5xx` events on 2026-11-16 grouped into one PostHog issue id) and by the automated tests, not by a second production request, which would have risked a second real issue.

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
| AC8 | ✅ | production request 2026-11-16 04:40 UTC: one `http_5xx` event, issue #1121 (and incident PR #1122, retired later by inc-s2); repeat-opens-none: 20 staging events grouped into one issue id, plus tests | production-observed | repeat on production not sent; the incident PR half of the criterion was retired by inc-s2 |

## Observations and follow-ups

- Browser-side JavaScript errors are still not confirmed as reported (the earlier sweep saw no console errors); candidate follow-up.
- The ecg-s1 Staging Deploy run remains in "waiting" and can be cancelled; it is superseded by later deploys.
