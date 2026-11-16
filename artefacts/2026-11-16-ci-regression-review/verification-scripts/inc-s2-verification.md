# Verification script: inc-s2 (no incident PR; the issue is the record)

Steps 1 to 6 are covered by `node tests/check-inc-s2-no-incident-pr.js`, the edited `check-coha-s7-error-issue-incident`, `check-coha-s6-error-bridge`, `check-eit-s1-issue-title` and the full suite; step 7 happens on the next natural production error.

1. T1: the workflow file is gone and no workflow has an `issues` trigger.
2. T2: the coha-s7 test no longer reads the workflow; its logic tests and credential scan remain.
3. T3: the error bridge is present and its tests pass unchanged.
4. T4: nothing outside artefacts, workspace and worktrees refers to the removed workflow.
5. T5: the recogniser library still works and the title-length check holds at 120 characters.
6. Full suite: only the known local-environment failures.
7. **Live (next natural production error):** when the bridge opens the next `production-error` issue, confirm no pull request titled "Incident record for ..." appears. Resolve the issue as a short-track story and a fix PR that says `Fixes #<issue>`.
