# AC Verification Script: Web UI gate-confirm CLI validation integration

**Story reference:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.4.md
**Technical test plan:** artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.4-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repository root.
2. Load environment variables and start the web UI server:
   ```powershell
   # PowerShell
   Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
   node src/web-ui/server.js
   ```
   ```bash
   # bash/zsh
   export $(grep -v '^#' .env | xargs) && node src/web-ui/server.js
   ```
3. Open a browser and navigate to the web UI (typically `http://localhost:3000` or the port shown in the server startup output).
4. You will need two DoR artefact test scenarios: one that **passes** the validate check and one that **fails** it. The easiest way is to use an existing signed-off DoR artefact from `artefacts/` for the passing case, and create a temporary text file with just the line `# Empty file` for the failing case.

**Reset between scenarios:** The pipeline state should not be permanently modified by these tests if using a story that has already passed DoR. Use a test feature slug or restore `pipeline-state.json` from backup before each scenario.

---

## Scenarios

---

### Scenario 1: Validate is called before the state is written on a successful gate-confirm

**Covers:** AC1

> This scenario requires access to server logs or test stubs — it is primarily verified by the automated test T1 in `check-cdg4-gate-confirm-validation.js`. The observable proxy is: if validate passes (Scenario 3), state is written; if validate fails (Scenario 2), state is not written. The ordering constraint is verified by the automated test suite.

**Steps:**
1. Run `npm test` and confirm `tests/check-cdg4-gate-confirm-validation.js` is present in the output and all its assertions pass.
2. Confirm in the test output that a test named something like "calls _validate before _pipelineStateWriter" passes.

**Expected outcome:**
> `npm test` exits 0. A test with "validate before" or "validate called first" in its name passes. This confirms the ordering constraint is enforced in the implementation.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 2: A failing DoR artefact gets a 422 response and the pipeline state is not updated

**Covers:** AC2

**Steps:**
1. In the web UI, navigate to a journey that is at the `definition-of-ready` stage (or use the API directly: `POST /journey/gate-confirm` with a session pointing to a DoR artefact that is known to fail validate — e.g. the `# Empty file` artefact from Setup step 4).
2. Trigger the gate-confirm action for that journey.
3. Look at the response in the browser network tab (or server output). Note the HTTP status code.
4. Open `.github/pipeline-state.json` and check the story's `stage` field.

**Expected outcome:**
> The HTTP response status is 422. The response body contains information about which check failed (e.g. "H3: AC section missing" or similar). The story's `stage` field in `pipeline-state.json` is NOT updated — it remains at `definition-of-ready` (not advanced to the next stage).

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 3: A passing DoR artefact gets a 200 response and the pipeline state is updated

**Covers:** AC3

**Steps:**
1. In the web UI, navigate to a journey at the `definition-of-ready` stage with a valid DoR artefact (one that passes `node bin/skills validate <artefact-path>` — verify this manually first).
2. Trigger the gate-confirm action.
3. Look at the response status code.
4. Open `.github/pipeline-state.json` and check the story's stage or relevant status fields.

**Expected outcome:**
> The HTTP response status is 200. The story's `stage` or status fields in `pipeline-state.json` are updated to reflect that the gate-confirm was accepted (the stage advances). The DoR artefact validation passed — no 422 error.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 4: A path traversal attempt gets a 400 response

**Covers:** AC4

> This scenario is a security boundary test. It is primarily verified by the automated test T4. The manual step below confirms the guard is active.

**Steps:**
1. Use a REST client (e.g. Postman, curl, or browser dev tools) to POST to the gate-confirm endpoint with a session `dorArtefactPath` value of `../../etc/passwd` (or any path that resolves outside the repository root).
2. Note the response status code.

**Expected outcome:**
> The response status is 400 (Bad Request). The server does not crash or return 500. No validate call is made — the request is rejected at the path guard step. `pipeline-state.json` is unchanged.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 5: The validate adapter can be swapped for a different function without touching server.js

**Covers:** AC5

> This scenario is primarily verified by automated test T5. The observable indicator is that the test file `check-cdg4-gate-confirm-validation.js` injects a stub via `setValidate(stub)` without modifying `server.js`, and the tests pass. Manual confirmation:

**Steps:**
1. Open `src/web-ui/routes/journey.js`.
2. Look for an exported function named `setValidate`.
3. Look for a line in `src/web-ui/server.js` that calls `setValidate(require('../enforcement/cli-outer-loop').validate)` (or equivalent).

**Expected outcome:**
> `journey.js` exports `setValidate` as a function. `server.js` calls it to wire in the real validate function during server startup. Tests can call `setValidate(stub)` independently — no changes needed in `server.js` for testing.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 6: Loading journey.js without wiring setValidate causes an explicit error

**Covers:** AC6

> This scenario is primarily verified by automated test T6. The manual verification is reading the code:

**Steps:**
1. Open `src/web-ui/routes/journey.js`.
2. Find the default value for the validate adapter (the variable that `setValidate` replaces).
3. Read the default function body.

**Expected outcome:**
> The default function body throws an error with a message containing the words "Adapter not wired: validate" and the name of the setup call (`setValidate`). It does NOT return a default value like `{ exitCode: 0 }` or `null` — it throws immediately. This is the D37 rule: silent stubs are forbidden.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 7: Gate-confirm for non-DoR stages works exactly as before (no regressions)

**Covers:** AC7

**Steps:**
1. In the web UI (or via API), trigger a gate-confirm for a journey that is at a stage OTHER than `definition-of-ready` — for example, the `review` stage or the `test-plan` stage.
2. Observe the response.
3. Run `npm test` and confirm no pre-existing gate-confirm tests have regressed.

**Expected outcome:**
> The gate-confirm for non-DoR stages completes normally (same 200 response as before). Validate is NOT called for these stages (you can confirm by checking server logs — no "validate called" log entry for the non-DoR confirm). `npm test` exits 0 with no regressions in the pre-existing test suite.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

## Sign-off

**Overall result:** [ ] All pass — ready for next pipeline stage  [ ] One or more failures — record below

**Failures and findings:**

**Verified by:** ________________________  **Date:** ________________
