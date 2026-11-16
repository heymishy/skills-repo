# Verification script: sub-s1 (the /answer route is retired)

Steps 1 to 6 are covered by `node tests/check-sub-s1-answer-route-retired.js`, the wuce.24 tests and the full suite; step 7 needs a signed-in production session after deploy.

1. T1: a signed-in POST to `/answer` answers 410 with the chat link.
2. T2: no model call, no credits, no error report, no "Adapter not wired" text.
3. T3: ids in the URL are escaped.
4. T4: an unauthenticated POST gets the same answer as before.
5. T5: the legacy handler behaves as before when called directly.
6. T6 and the full suite: the handler never throws; the wuce.24 tests and the rest pass except the known local-environment failures.
7. **Live (one operator-approved request):** from a signed-in production tab, POST an empty JSON body to `/api/skills/discovery/sessions/00000000-0000-0000-0000-000000000000/answer`; expect 410 and no new GitHub issue within a few minutes. The earlier request that produced issue #1121 (and incident PR #1122) can then be closed by the operator.
