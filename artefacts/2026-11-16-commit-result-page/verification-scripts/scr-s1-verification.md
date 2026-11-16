# Verification script: scr-s1 (commit result page)

Steps 1 to 8 are covered by `node tests/check-scr-s1-commit-result-page.js`, `node tests/check-wuce25-session-commit-result.js` and the full suite; step 9 needs the operator's session and writes a real commit.

1. T1: the real wiring returns a committed session's own artefact data.
2. T2: the path derivation gives the right slug and type for nested and root-level artefacts.
3. T3: the result page answers 200 with "Committed.", the path and the artefact link; two sessions give two different results.
4. T4: an unknown, uncommitted or pathless session answers 404 "Commit result not found" and never "Committed.".
5. T5: commit POST then the redirect ends on the 200 result page.
6. T6: an unwired adapter still throws.
7. T7: the derivation never throws an unexpected error.
8. Full suite: only the known baseline failures.
9. **Live (operator-performed, after the ecf-s1 live check is complete and this is deployed):** commit one skill session from the web UI (or open the result URL of one already committed in the same server run); expect the "Committed." page with the file link, no 500, and no new GitHub issue.
