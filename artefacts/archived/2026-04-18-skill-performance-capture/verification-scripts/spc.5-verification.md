# AC Verification Script: Governance check script for capture block completeness

**Story reference:** artefacts/2026-04-18-skill-performance-capture/stories/spc.5-governance-check-script.md
**Technical test plan:** artefacts/2026-04-18-skill-performance-capture/test-plans/spc.5-test-plan.md
**Script version:** 1
**Verified by:** _______________ | **Date:** _______________ | **Pre-code** [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal at the repository root.
2. Confirm Node.js is available: `node --version` (should return v14 or higher).
3. Create three test artefact files (or use a temporary folder):
   - `test-complete.md` — a Markdown file that contains a `## Capture Block` section with all 6 required fields filled in.
   - `test-incomplete.md` — a Markdown file that contains a `## Capture Block` section but is missing 2 of the 6 fields.
   - `test-missing.md` — a Markdown file with no `## Capture Block` section at all.
4. Have `contexts/personal.yml` (or `.github/context.yml`) available to toggle `instrumentation.enabled`.

**Tip:** You can create minimal test files with a text editor. The captured fields the script checks are: `experiment_id`, `model_label`, `cost_tier`, `skill_name`, `story_id`, `run_date`.

**Reset between scenarios:** Restore `.github/context.yml` to enabled state between scenarios 1–4; disable for scenario 5.

---

## Scenarios

---

### Scenario 1: Script file exists

**Covers:** AC1

**Steps:**
1. In the terminal, run:
   ```
   node -e "require('fs').accessSync('scripts/check-capture-completeness.js')"
   ```
   Or simply check whether the file exists at `scripts/check-capture-completeness.js`.

**Expected outcome:**
> The file exists. No error is thrown.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Script detects missing capture blocks and reports file paths

**Covers:** AC2, AC3

**Steps:**
1. Enable instrumentation in `.github/context.yml` (`instrumentation.enabled: true`).
2. Run the script against a directory containing `test-missing.md` (a file with no capture block):
   ```
   node scripts/check-capture-completeness.js --artefacts <path-to-test-dir>
   ```
3. Read the terminal output.

**Expected outcome:**
> The script reports `test-missing.md` as missing a capture block. The output includes the relative path to the file. The exit code is non-zero (or the script reports a completeness warning). No crash or unhandled error occurs.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Script reports specific missing fields in incomplete blocks

**Covers:** AC2 (field-level reporting)

**Steps:**
1. Enable instrumentation in `.github/context.yml`.
2. Run the script against a directory containing `test-incomplete.md` (a file with a capture block missing 2 fields):
   ```
   node scripts/check-capture-completeness.js --artefacts <path-to-test-dir>
   ```
3. Read the terminal output.

**Expected outcome:**
> The script identifies the two missing fields by name. The output tells you which fields are absent, not just that the block is "incomplete". No crash or unhandled error occurs.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Script exits 0 (or skips) when instrumentation is disabled

**Covers:** AC4

**Steps:**
1. Set `instrumentation.enabled: false` in `.github/context.yml` (or comment out the block).
2. Run the script:
   ```
   node scripts/check-capture-completeness.js --artefacts <path-to-test-dir>
   ```
3. Check the exit code: `echo $?` (Unix/macOS) or `echo %ERRORLEVEL%` (Windows).

**Expected outcome:**
> The script outputs a message indicating it is skipping the check because instrumentation is disabled (e.g. "Instrumentation disabled — skipping capture block check"). The exit code is `0`. The script does not error or report any files as failing.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Script is NOT in `npm test` chain

**Covers:** AC5

**Steps:**
1. Open `package.json` at the repository root.
2. Find the `"test"` script value.
3. Check whether `check-capture-completeness` or `capture` appears anywhere in the test script string.

**Expected outcome:**
> `check-capture-completeness.js` does not appear in the `"test"` script. Running `npm test` does not execute the capture completeness check. The script is an optional, operator-invoked tool only.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
