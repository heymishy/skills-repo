# Verification script: inc-s2 (incident recorded in the fix PR, not a bot PR per issue)

Steps 1 to 8 are covered by `node tests/check-inc-s2-record-incident-locally.js`, `node tests/check-coha-s7-error-issue-incident.js` and the full suite; step 9 happens on the next natural production error.

1. T1: the workflow's only trigger is `workflow_dispatch` with its three inputs.
2. T2: its header explains the retirement and the two alternatives.
3. T3: the local script records one incident from a recognised bridge issue.
4. T4: running it again records nothing.
5. T5: unrecognised issues and a missing author leave the file unchanged and exit 1.
6. T6: no git, no PR, one read API call, only the incident file changes.
7. The coha-s7 tests pass with only W1 changed.
8. Full suite: only the known local-environment failures.
9. **Live (next natural production error):** when the bridge opens the next `production-error` issue, confirm no incident PR appears (list open PRs with "Incident record" in the title). To record an incident you are acting on: `node scripts/record-incident-from-issue.js <issue number> --author <bridge login>` (or set `ERROR_BRIDGE_AUTHOR`), then commit `workspace/incidents.json` in the fix PR.
