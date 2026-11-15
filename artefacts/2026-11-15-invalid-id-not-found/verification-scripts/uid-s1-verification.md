# Verification script: uid-s1 (malformed id answers 404)

Steps 1 to 7 are covered by `node tests/check-uid-s1-invalid-id-404.js`, the gated `tests/check-uid-s1-real-postgres.js` and the full suite; step 8 needs the operator.

1. T1, T2: a uuid-syntax error caused by the url answers 404 `{"error":"not found"}` on guarded and unguarded routes and sends no report.
2. T3a, T3b: a uuid error whose value is not in the url stays 500 and is reported.
3. T4a, T4b: every other failure is unchanged.
4. T5: nothing is written twice and nothing throws if the response has started.
5. T6a, T6b: the real product page and journey page handlers answer 404 for malformed ids.
6. P1 (needs Docker and `UID_TEST_DATABASE_URL`): the real Postgres error is `22P02` with the message form the classifier parses.
7. Full suite: only the known baseline failures.
8. **Live (read-only requests; no approval needed beyond the usual, but run after ecg-s1's live check so any old issue is closed first):** signed in on skills-framework.fly.dev, request `/products/not-a-uuid` and `/journeys/not-a-uuid`; expect 404 for both and no new GitHub issue within a few minutes.
