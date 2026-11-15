# Verification script: eit-s1 (issue title says what failed and where)

Steps 1 to 7 are covered by `node tests/check-eit-s1-issue-title.js`, `node tests/check-coha-s5-error-capture.js`, the bridge tests and the full suite; step 8 needs the operator's session.

1. T1: the value reads `<code>: <Type> at <route>`.
2. T2: the allow-listed fixed message is unchanged.
3. T3: `http_5xx` and `unhandled_rejection` survive; unknown codes are still rewritten.
4. T4: no canary text anywhere; a malformed event is dropped without throwing.
5. T5: the longest title is accepted by the bridge and the incident script.
6. T6: the fingerprint is unchanged.
7. Full suite: only the known baseline failures; coha-s5 passes with its edited assertions.
8. **Live (opens one real GitHub issue and incident PR; approved for this work):** signed in on skills-framework.fly.dev after this change is deployed, request `/skills/discovery/sessions/00000000-0000-0000-0000-000000000000/result` once. Expect one new GitHub issue titled `http_5xx: Error at /skills/:p/:p/:p/:p`, one incident-record draft PR, and a second identical request opens nothing. (This is the same request as the ecf-s1 live check; run the two together if both are deployed.)
