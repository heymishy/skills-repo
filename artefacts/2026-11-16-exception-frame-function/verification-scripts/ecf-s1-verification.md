# Verification script: ecf-s1 (every stack frame carries a function name)

Steps 1 to 6 are covered by `node tests/check-ecf-s1-frame-function.js`, `node tests/check-coha-s5-error-capture.js` and the full suite; step 7 needs the operator's session.

1. T1: an anonymous frame gets the placeholder `<anonymous>` and keeps its other fields.
2. T2: identifier-shaped names are kept.
3. T3: other names become the placeholder and the original text never appears.
4. T4: frames of any shape never throw and always yield string `filename` and `function`.
5. T5: the real captured shapes pass the check; the previous logic fails it.
6. Full suite: only the known baseline failures; coha-s5 passes with its one edited expectation.
7. **Live (opens one real GitHub issue and one incident-record PR; approved by the operator for this work; run before `scr-s1` merges):** signed in on skills-framework.fly.dev, request `/skills/discovery/sessions/00000000-0000-0000-0000-000000000000/result` once. Within a few minutes expect: the PostHog event has `stacktrace.type` `resolved`, no `$cymbal_errors` and an issue id; one new GitHub issue for the route `/skills/:p/:p/:p/:p`; one incident-record draft PR. A second identical request opens nothing new.
