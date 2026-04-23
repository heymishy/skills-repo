# AC Verification Script: `context.yml` opt-in gate and `ci_platform` adapter routing

**Story reference:** artefacts/2026-04-23-ci-artefact-attachment/stories/caa.3-context-yml-config.md
**Technical test plan:** artefacts/2026-04-23-ci-artefact-attachment/test-plans/caa.3-context-yml-config-test-plan.md
**Script version:** 1
**Verified by:** _______________ | **Date:** _______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Check out the branch implementing caa.3 and ensure `npm test` passes.
2. You need a terminal at the repo root.
3. No GitHub credentials are required for any scenario in this script.

**Reset between scenarios:** No state is shared across scenarios. Each test uses temporary fixtures.

---

## Scenarios

---

### Scenario 1: Steps are skipped when `ci_attachment` is false or absent

**Covers:** AC1

**Steps:**
1. Open a terminal at the repo root.
2. Run: `node tests/check-caa3-config.js`
3. Look for the tests covering the `ci_attachment: false` and "audit block absent" cases.

**Expected outcome:**
> Both tests pass:
> - When `context.yml` has `audit.ci_attachment: false`, the config reader returns a result signalling that attachment steps should be skipped.
> - When `context.yml` has no `audit:` block at all, the same skip signal is returned.
> No staging directory is created in either case.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Full pipeline runs when `ci_attachment: true` and `ci_platform: github-actions`

**Covers:** AC2

**Steps:**
1. In the same terminal, confirm the test output from `node tests/check-caa3-config.js` includes the enabled-path test.

**Expected outcome:**
> The test named `"readCiAttachmentConfig returns enabled state when ci_attachment true and ci_platform github-actions"` (or similar) passes. The integration test confirms the collect step runs and the mock upload is called. Exit code for the integration test is 0.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Unknown `ci_platform` exits with code 1 and a named error message

**Covers:** AC3

**Steps:**
1. In the test output from `node tests/check-caa3-config.js`, locate the test for an unimplemented platform (e.g. `gitlab-ci`).
2. Alternatively, run manually: `node scripts/trace-report.js --upload --platform=gitlab-ci` (or the equivalent entry point) with a valid staging dir present.

**Expected outcome (via test):**
> Test passes confirming the error message is exactly: `[ci-artefact-attachment] Adapter 'gitlab-ci' is not yet implemented. Available adapters: github-actions.`

**Expected outcome (manual run):**
> Exit code 1. Stderr shows the message above. No crash. The process exits cleanly.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: `contexts/personal.yml` contains the audit block with all fields and inline comments

**Covers:** AC4

**Steps:**
1. Open `contexts/personal.yml` in any text editor.
2. Find the `audit:` section.

**Expected outcome:**
> The file contains all three fields under `audit:`:
> - `ci_attachment` — with an inline `#` comment explaining it is a boolean opt-in (e.g. `# set to true to enable CI artefact attachment`)
> - `ci_platform` — with an inline `#` comment listing valid values (e.g. `# github-actions | gitlab-ci | azure-devops`)
> - `artifact_retention_days` — with an inline `#` comment explaining the default
>
> No field is present without an explanatory comment.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: All 4 existing npm test suites still pass

**Covers:** AC5

**Steps:**
1. In a terminal at the repo root, run: `npm test`
2. Read the full output.

**Expected outcome:**
> All 4 existing test suites produce `PASS` or equivalent. Exit code is 0. The test count for caa.3 has increased (new tests added), but no previously-passing test has changed to `FAIL`.

> Note: if there are pre-existing failures on master (visible before this branch was created), those are not regressions — confirm they existed before by checking `git stash; npm test; git stash pop`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: Malformed `context.yml` exits with code 1 and the exact error message

**Covers:** AC6

**Steps:**
1. Create a temporary file at a path of your choice containing invalid YAML, for example:
   ```
   audit:
     ci_attachment: [this bracket is not closed
   ```
2. Either:
   - Run: `node tests/check-caa3-config.js` and confirm the malformed-YAML test passes, OR
   - Point the config reader at your temp file directly (if a `--config` flag is available) and capture the output.

**Expected outcome:**
> Exit code 1. Stderr or error output contains exactly: `[ci-artefact-attachment] context.yml could not be parsed — check YAML syntax.`
>
> The governance gate portion of the process is unaffected — the overall workflow does not fail with an unhandled exception or an exit code that would mask the governance gate result.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
