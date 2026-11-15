# Verification script: ecg-s1 (capture every 5xx)

Steps 1 to 8 are covered by `node tests/check-ecg-s1-capture-all-5xx.js` and the full suite; step 9 needs the operator.

1. T1, T2: a failing guarded handler is reported once and still answers the same 500.
2. T3a, T3b, T3c: any 5xx written without a throw (500, 503, a status set before `end`) is reported once as `http_5xx`.
3. T4a, T4b: no double report.
4. T5: 200, 302 and 404 are not reported.
5. T6a, T6b: unwired or throwing capture never changes the response.
6. T7: an unhandled rejection is reported and the process does not exit.
7. T8: the scrubber still applies.
8. Full suite: only the known baseline failures.
9. **Live (needs the operator's approval first; it opens one real GitHub issue and one incident-record PR):** after promotion, signed in on skills-framework.fly.dev, request `/products/not-a-uuid` once. Within a few minutes expect one new GitHub issue for the error group and one incident-record PR. Request the same URL again; expect no second issue. Close the issue and PR afterwards, with the operator.
