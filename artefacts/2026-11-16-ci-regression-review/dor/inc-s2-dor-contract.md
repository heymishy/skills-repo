# Contract Proposal - Stop opening an incident PR per production error issue; record the incident in the fix PR instead

**What will be built:**
- `.github/workflows/error-issue-incident-record.yml`: the `issues: types: [opened]` trigger removed; `workflow_dispatch` and its three inputs kept; the header comment extended (retired 2026-11-16, story inc-s2, operator decision, how to start by hand, how to record locally); everything below `on:` and the concurrency expression unchanged.
- `scripts/record-incident-from-issue.js` (new): arguments `<issue number>` or `--event <file>`, `--author <login>` (or `ERROR_BRIDGE_AUTHOR`), `--incidents <file>` (default `workspace/incidents.json`); runs the existing `scripts/error-issue-incident.js` `plan` then `build` as child processes against a temporary facts file and plan file; prints the result and which file to commit; exits 0 for recorded or already-recorded and 1 for anything else.
- `tests/check-inc-s2-record-incident-locally.js` (new, T1 to T6).
- `tests/check-coha-s7-error-issue-incident.js`: test W1 changed to assert the retired trigger list `['workflow_dispatch']` and the three inputs; every other test unchanged.

**What will NOT be built:**
- No change to the bridge, `scripts/error-issue-incident.js`, `scripts/lib/error-issue-incident.js`, `src/modules/incident-recorder.js`, or the record contents; no deletion; no auto-merge; no new npm dependency; no change to any other workflow.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | unit (file text) |
| AC2 | T2 | unit |
| AC3 | T3 | integration (child process, fixture) |
| AC4 | T4 | integration |
| AC5 | T5 | integration |
| AC6 | T6 | unit and integration |
| AC7 | full suite | integration |
| AC8 | Scenario 9 | live |

**Assumptions:** the CLI's `plan` accepts `--event` (a bare REST issue object is normalised by `normaliseEvent`), `--author`, `--facts`, `--incidents`, `--out` and `build` takes the plan from an environment variable named by `--plan-env` (read at `scripts/error-issue-incident.js` lines 7 to 56 and 97 to 140); the bridge author for this repo is in the repository variable `ERROR_BRIDGE_AUTHOR`, which the script does not read from GitHub (the operator passes `--author` or sets the environment variable); `tests/check-coha-s7-error-issue-incident.js` W1 is the only test that pins the trigger list (read at lines 798 to 805); W3 pins the concurrency group expression, which is unchanged.

`schemaDepends: []`. **Estimated touch points:** Files: the workflow, one new script, one new test, one edited test. Services: none. APIs: none.
