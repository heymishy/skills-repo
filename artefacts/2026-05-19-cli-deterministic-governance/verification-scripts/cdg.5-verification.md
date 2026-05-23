# AC Verification Script: Chain-hash trace emission on gate-confirm

**Story reference:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.5.md
**Technical test plan:** artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.5-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repository root.
2. Start the web UI server (with `.env` loaded):
   ```powershell
   # PowerShell
   Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
   node src/web-ui/server.js
   ```
   ```bash
   # bash/zsh
   export $(grep -v '^#' .env | xargs) && node src/web-ui/server.js
   ```
3. Identify a feature slug you will use for the trace test (e.g. `2026-05-19-cli-deterministic-governance`).
4. Note the location of trace files: `workspace/traces/<feature-slug>.trace.jsonl`. This file will be created (or appended to) by Scenario 1.

**Reset between scenarios:** Delete any trace file created during testing: `Remove-Item workspace\traces\*` (PowerShell) or `rm workspace/traces/*` (bash). This will not affect the pipeline — trace files are gitignored.

---

## Scenarios

---

### Scenario 1: A successful gate-confirm creates a trace file with required fields

**Covers:** AC1

**Steps:**
1. Delete any existing trace file for your test feature: `Remove-Item workspace\traces\2026-05-19-cli-deterministic-governance.trace.jsonl` (if it exists).
2. In the web UI, navigate to a journey at the `definition-of-ready` stage with a passing DoR artefact, and trigger the gate-confirm action.
3. In your terminal, open the trace file: `Get-Content workspace\traces\2026-05-19-cli-deterministic-governance.trace.jsonl` (PowerShell) or `cat workspace/traces/2026-05-19-cli-deterministic-governance.trace.jsonl` (bash).
4. Read the single JSON line.

**Expected outcome:**
> The file exists and contains exactly one line of JSON. That JSON object has all of these fields: `timestamp` (an ISO date string like `"2026-05-24T10:30:00.000Z"`), `featureSlug` (the feature slug you used), `storyId` (the story id from the gate-confirm), `stage` (`"definition-of-ready"`), `exitCode` (the number `0`), and `chainHash` (a long hex string like `"a3f2..."`). The `operatorEmail` field is present (may be an empty string if git user.email is not configured locally).

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 2: A second gate-confirm appends a new line with a correct chain hash

**Covers:** AC2

**Steps:**
1. Note the `chainHash` value from the first entry (from Scenario 1 — do NOT delete the trace file).
2. In the web UI, trigger a second gate-confirm for the same feature (or a different story in the same feature). Wait for the response.
3. Open the trace file again: `Get-Content workspace\traces\2026-05-19-cli-deterministic-governance.trace.jsonl`
4. Count the lines. Read the second line. Note its `chainHash`.
5. (Optional, technical verification): In a Node.js REPL, re-compute the expected chain hash:
   ```js
   const crypto = require('crypto');
   const line2 = JSON.parse(/* paste the second line here */);
   const { chainHash, ...withoutHash } = line2;
   const prevHash = /* paste the first line's chainHash */;
   const expected = crypto.createHash('sha256').update(JSON.stringify(withoutHash) + prevHash).digest('hex');
   console.log(expected === chainHash); // should print true
   ```

**Expected outcome:**
> The file now has exactly 2 lines. The second line is a new JSON object with its own `chainHash`. If you run the optional re-computation, `console.log` prints `true` — the chain hash is correct.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 3: The first entry ever for a feature uses an empty string as the starting hash

**Covers:** AC3

**Steps:**
1. Delete any existing trace file: `Remove-Item workspace\traces\2026-05-19-cli-deterministic-governance.trace.jsonl` (PowerShell) or `rm workspace/traces/2026-05-19-cli-deterministic-governance.trace.jsonl` (bash).
2. Trigger a single gate-confirm for a passing DoR artefact (as in Scenario 1).
3. Open the trace file and read the `chainHash` from the single entry.
4. (Optional, technical verification): Re-compute with an empty prior hash:
   ```js
   const crypto = require('crypto');
   const line1 = JSON.parse(/* paste the first line */);
   const { chainHash, ...withoutHash } = line1;
   const expected = crypto.createHash('sha256').update(JSON.stringify(withoutHash) + '').digest('hex');
   console.log(expected === chainHash); // should print true
   ```

**Expected outcome:**
> The trace file has exactly one line. If you run the optional verification, `console.log` prints `true` — the chain hash was computed against an empty prior hash (empty string `""`), as specified.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 4: A failed gate-confirm (validation failure) does NOT write a trace entry

**Covers:** AC4

**Steps:**
1. Note the current number of lines in the trace file (or confirm it does not exist).
2. Trigger a gate-confirm with a DoR artefact that FAILS validation (e.g. a minimal file with just `# Empty` as content). Confirm the response is 422.
3. Check the trace file: count the lines.

**Expected outcome:**
> The trace file has the same number of lines as before the failed gate-confirm (zero new entries). The 422 response was returned without writing any trace entry. The file is unmodified (or still absent if it did not exist).

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 5: The trace writer can be swapped without touching server.js

**Covers:** AC5

> This scenario is primarily verified by automated test T5. The manual confirmation is reading the code:

**Steps:**
1. Open `src/web-ui/routes/journey.js`.
2. Look for an exported function named `setWriteTrace`.
3. Look for a line in `src/web-ui/server.js` that calls `setWriteTrace(require('../enforcement/governance-package').writeTrace)` (or equivalent).

**Expected outcome:**
> `journey.js` exports `setWriteTrace` as a function. `server.js` calls it to wire in the real trace writer during server startup. Tests can call `setWriteTrace(stub)` independently without modifying `server.js`.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 6: Loading journey.js without wiring setWriteTrace causes an explicit error

**Covers:** AC6

> This scenario is primarily verified by automated test T6. The manual verification is reading the code:

**Steps:**
1. Open `src/web-ui/routes/journey.js`.
2. Find the default value for the trace writer adapter.
3. Read the default function body.

**Expected outcome:**
> The default function body throws an error with a message containing the words "Adapter not wired: writeTrace" and the name of the setup call (`setWriteTrace`). It does NOT return silently or return a safe-looking default. This is the D37 rule applied to the trace writer.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 7: Trace files do not show up as untracked in git

**Covers:** AC7

**Steps:**
1. Ensure a trace file exists at `workspace/traces/<feature-slug>.trace.jsonl` (if one was created during Scenario 1).
2. Run: `git status` in the repository root.
3. Look at the "Untracked files" section.

**Expected outcome:**
> `workspace/traces/` does NOT appear in the "Untracked files" or "Changes not staged for commit" section. Git ignores the trace files entirely. If you run `git status --short`, no entry starting with `workspace/traces/` appears.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

## Sign-off

**Overall result:** [ ] All pass — ready for next pipeline stage  [ ] One or more failures — record below

**Failures and findings:**

**Verified by:** ________________________  **Date:** ________________
