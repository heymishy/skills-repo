# Verification script: ure-s1 (broken percent-escape answers 404)

Steps 1 to 7 are covered by `node tests/check-ure-s1-malformed-escape-404.js`, `node tests/check-uid-s1-invalid-id-404.js` and the full suite; step 8 needs the operator's session.

1. T1, T2: a URIError caused by an undecodable url answers 404 `{"error":"not found"}` on guarded routes and in the router, and sends no report.
2. T3a, T3b: a URIError while the url decodes fine stays 500 and is reported.
3. T4a, T4b: every other failure is unchanged, including the uid-s1 malformed-id case.
4. T5: nothing is written twice and nothing throws if the response has started.
5. T6a, T6b: the real route table answers 404 for the two reported urls and one more; well-formed escapes (`%20`, `%2F`) still route.
6. T7: the classifier never throws.
7. Full suite: only the known baseline failures.
8. **Live (read-only requests):** signed in on skills-framework.fly.dev, request `/journey/00000000-0000-0000-0000-000000000000/stage/%E0%A4%A` and `/products/00000000-0000-0000-0000-000000000000/playback-evidence/%E0%A4%A`; expect 404 for both and no new GitHub issue within a few minutes.
