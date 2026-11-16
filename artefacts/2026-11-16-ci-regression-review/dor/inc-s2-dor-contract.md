# Contract Proposal - Stop the incident-record pull request: the GitHub issue is the record, and the fix is a short-track story and PR

**What will be built (as removals and one new test):**
- Delete `.github/workflows/error-issue-incident-record.yml`.
- `tests/check-coha-s7-error-issue-incident.js`: remove the workflow-reading block (`cwt_UT1`, `cwt_UT2`, `W1` to `W13`, the helpers only they use, and the `WORKFLOW` constant); keep `W12`'s credential scan as a test over the script, library and this test file (renamed to name only what it scans); every other test unchanged.
- `tests/check-inc-s2-no-incident-pr.js` (new, T1 to T5).

**What will NOT be built:**
- No change to the error bridge, the PostHog destination, `scripts/error-issue-incident.js`, `scripts/lib/error-issue-incident.js`, `scripts/run-all-tests.js`, `tests/check-eit-s1-issue-title.js`, `tests/check-coha-s6-error-bridge.js`, `workspace/incidents.json` or any skill; no replacement workflow or local script; no new npm dependency.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | unit (file system and text) |
| AC2 | T2 and the edited coha-s7 test | unit, full suite |
| AC3 | T3 and `check-coha-s6-error-bridge` | unit, full suite |
| AC4 | T4 | unit (repository walk) |
| AC5 | T5 and `check-eit-s1-issue-title` | unit, full suite |
| AC6 | Scenario 7 | live |

**Assumptions:** the workflow's only readers are the coha-s7 test (read at lines 18 and 731 to 909) and itself, found by searching the repository for `error-issue-incident` outside artefacts and workspace (five files: the workflow, the script, `run-all-tests.js`, the coha-s7 test and `check-eit-s1-issue-title.js`); the last two of those use the library or the test file, not the workflow; the bridge's issue format does not depend on the workflow.

`schemaDepends: []`. **Estimated touch points:** Files: one workflow deleted, one test edited, one test added. Services: none. APIs: none.
