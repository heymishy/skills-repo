# uid-s1 Definition of Done

Date: 2026-11-16. Story: a malformed id in a URL (for example `/products/not-a-uuid`) answers 404 Not Found instead of 500, and is not reported as a server error. PR #1107, merged to master as `2204379fd`; its Staging Deploy (run 43742567773) succeeded and the operator promoted it to production.

## Result: COMPLETE

All 8 acceptance criteria (AC) met.

- AC1 to AC6: verified by 10 automated tests before merge (see `reference/uid-s1-verify-completion-evidence.md`).
- AC7 (the real Postgres error shape): `tests/check-uid-s1-real-postgres.js` run on 2026-11-16 against a throwaway local Postgres 16 container on port 25432. 4 passed, 0 failed, for `not-a-uuid`, `%00`, `%E0%A4%A` and `' OR 1=1 --`. The classifier's assumption (code `22P02`, message `invalid input syntax for type uuid: "<value>"`) holds against the real database. The container was removed afterwards.
- AC8 (live): observed on production, read-only, operator-approved, signed-in Chrome tab, GET navigation only.

## AC8 observation

| Request | Result |
|---|---|
| `/products/not-a-uuid` | page body `{"error":"not found"}` (the 404 body; a 500 would read `Internal Server Error`) |
| `/journeys/not-a-uuid` | page body `{"error":"not found"}` |
| `/products` (control) | normal list page, 5 products |
| Open GitHub issues afterwards | no new issue; newest open issue is still #1101, created before this work |

The browser tab does not display the HTTP status number, so the 404 status is inferred from the exact body the 404 path writes; the status itself is covered by the automated tests (T1, T2, T6a, T6b).

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | T1 | automated | none |
| AC2 | ✅ | T2 | automated | none |
| AC3 | ✅ | T3a, T3b | automated | none |
| AC4 | ✅ | T4a, T4b | automated | none |
| AC5 | ✅ | T5 | automated | none |
| AC6 | ✅ | T6a, T6b | automated | none |
| AC7 | ✅ | P1, 4 passed against Postgres 16 | real-database run | none |
| AC8 | ✅ | production GET checks 2026-11-16 | production-observed | none |

## Observations and follow-ups

- The first browser tab used for the checks stopped responding to scripted fetches (renderer timeout, cause not investigated); the checks were done in a fresh tab. Not related to this story.
- A real server bug that raises the same uuid error with a value that is not in the request url stays a reported 500 by design (test T3b).
- Slow artefact-not-found 404 (about 6 s) is unchanged and remains a candidate follow-up (`anf-s1`).
