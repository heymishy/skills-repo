# AC Verification Script: `skills validate` CLI — entry point, exit code framework, and governance check

**Story reference:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.1.md
**Technical test plan:** artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.1-test-plan.md
**Script version:** 1 (update version if ACs change post-implementation)
**Verified by:** ______________ | **Date:** ______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**

1. Open a terminal in the repository root (`c:\Users\Hamis\code\skills repo` on Windows, or the equivalent checkout directory on Linux/CI).
2. Confirm Node.js is available: run `node --version`. You should see a version number (v18+ recommended).
3. Confirm you are on the branch that includes the cdg.1 implementation (or on master after the PR is merged).
4. No server needs to be running. No environment variables are required. All scenarios use the local filesystem only.

**Reset between scenarios:** Each scenario is independent. No state persists between runs.

---

## Scenarios

### Scenario 1 — Clean artefact exits with code 0 and a success message (AC1)

**What this checks:** When the CLI is given a valid artefact file and a known gate name with no violations, it should exit cleanly and report success.

**Steps:**

1. In your terminal, run:
   ```
   node bin/skills validate artefacts/2026-05-19-cli-deterministic-governance/discovery.md definition-of-ready
   ```
   (Or substitute any other existing markdown file in the `artefacts/` folder that does not reference a missing story slug.)

2. Observe the terminal output.

**Expected outcome:**
- The command finishes without hanging.
- The exit code is `0`. To check: run `echo $?` (bash/Linux) or `echo $LASTEXITCODE` (PowerShell). You should see `0`.
- The terminal prints a single line to standard output that includes all three of: `validate OK`, the gate name `definition-of-ready`, and `0 violations` (or equivalent wording confirming zero violations found).

**Record:**
- [ ] Pass
- [ ] Fail — notes: _______________

---

### Scenario 2 — Unsupported gate name exits with code 8 and names the error (AC2)

**What this checks:** When the CLI receives a gate name it does not recognise, it should reject the request immediately and tell the user which gate names are valid.

**Steps:**

1. In your terminal, run:
   ```
   node bin/skills validate artefacts/2026-05-19-cli-deterministic-governance/discovery.md unknown-gate
   ```

2. Observe the terminal output.

**Expected outcome:**
- The exit code is `8`. Check with `echo $?` (bash) or `echo $LASTEXITCODE` (PowerShell).
- An error message is printed to standard error (your terminal screen). The message contains the exact text `UNSUPPORTED_GATE`.
- The error message also lists at least one supported gate name, including `definition-of-ready`.
- Nothing is printed to standard output (no "validate OK" line).

**Record:**
- [ ] Pass
- [ ] Fail — notes: _______________

---

### Scenario 3a — Too few arguments (no gate name) exits non-zero with usage instructions (AC3)

**What this checks:** If the user forgets to type the gate name, the CLI should refuse to run and explain the correct usage.

**Steps:**

1. In your terminal, run:
   ```
   node bin/skills validate artefacts/2026-05-19-cli-deterministic-governance/discovery.md
   ```
   (Intentionally omit the gate name — only 1 argument instead of 2.)

2. Observe the terminal output.

**Expected outcome:**
- The exit code is non-zero (not `0`). Check with `echo $?` (bash) or `echo $LASTEXITCODE` (PowerShell).
- An error message is printed to standard error containing: `Usage: skills validate <artefact-path> <gate-name>`
- The command exits immediately — it does not attempt to read the artefact file.

**Record:**
- [ ] Pass
- [ ] Fail — notes: _______________

---

### Scenario 3b — No arguments at all exits non-zero with usage instructions (AC3)

**What this checks:** If the user runs the validate subcommand with no arguments whatsoever, the CLI should show usage instructions.

**Steps:**

1. In your terminal, run:
   ```
   node bin/skills validate
   ```
   (No artefact path, no gate name.)

2. Observe the terminal output.

**Expected outcome:**
- The exit code is non-zero.
- An error message is printed to standard error containing: `Usage: skills validate <artefact-path> <gate-name>`

**Record:**
- [ ] Pass
- [ ] Fail — notes: _______________

---

### Scenario 4 — H1 violation: missing story file exits with a numbered error in range 1–7 (AC4)

**What this checks:** When the CLI checks a `definition-of-ready` gate and finds that a story artefact file is missing, it should report an H1 check failure with an exit code between 1 and 7.

**Steps:**

1. Create a temporary test file. In PowerShell:
   ```powershell
   "# Test artefact`n`nStory ref: artefacts/2026-05-19-cli-deterministic-governance/stories/nonexistent-story-cdg1-test.md" | Out-File -FilePath artefacts/test-h1-fixture.md -Encoding utf8
   ```
   Or in bash:
   ```bash
   echo -e "# Test artefact\n\nStory ref: artefacts/2026-05-19-cli-deterministic-governance/stories/nonexistent-story-cdg1-test.md" > artefacts/test-h1-fixture.md
   ```

2. Run:
   ```
   node bin/skills validate artefacts/test-h1-fixture.md definition-of-ready
   ```

3. Observe the terminal output.

4. Delete the test file afterwards:
   - PowerShell: `Remove-Item artefacts/test-h1-fixture.md`
   - bash: `rm artefacts/test-h1-fixture.md`

**Expected outcome:**
- The exit code is between 1 and 7 (inclusive). Check with `echo $?` (bash) or `echo $LASTEXITCODE` (PowerShell). A value of `0` is a failure.
- An error message is printed to standard error containing `H1 FAIL`.
- The error message also includes the story path that was not found: something containing `nonexistent-story-cdg1-test`.

**Record:**
- [ ] Pass
- [ ] Fail — notes: _______________

---

### Scenario 5 — Path traversal attempt exits with code 8 and does not log the system path (AC6)

**What this checks:** If someone passes a path designed to escape the repository (e.g. `../../etc/passwd`), the CLI should refuse and not reveal the resolved system path in its output.

**Steps:**

1. In your terminal, run:
   ```
   node bin/skills validate ../../etc/passwd definition-of-ready
   ```

2. Observe the terminal output.

**Expected outcome:**
- The exit code is `8`. Check with `echo $?` (bash) or `echo $LASTEXITCODE` (PowerShell).
- An error message is printed to standard error. The message describes the error (e.g. "path outside repository root" or similar).
- The message does **not** contain the resolved absolute system path (e.g. it should not print `/etc/passwd` or `C:\etc\passwd` or any fully-resolved path to a system directory). The error message is generic — it does not reveal the path that was attempted.
- No file outside the repository root is read or modified.

**Record:**
- [ ] Pass
- [ ] Fail — notes: _______________

---

### Scenario 6 — Governance check: npm test passes with structure in place (AC5)

**What this checks:** The `tests/check-cli-governance.js` file exists, is included in `npm test`, and passes when the required files and exports are present.

**Steps:**

1. Run the full test suite:
   ```
   npm test
   ```

2. Watch the output for the governance check section. Look for lines containing `check-cli-governance`.

3. Alternatively, run just the governance check in isolation:
   ```
   node tests/check-cli-governance.js
   ```

**Expected outcome (post-implementation):**
- `node tests/check-cli-governance.js` exits with code `0`.
- Three check lines are printed, each starting with `✓`:
  - `✓` `bin/skills exists`
  - `✓` `src/enforcement/cli-outer-loop.js exists`
  - `✓` `cli-outer-loop.js exports a validate function`
- `npm test` does not fail on this check.

**Expected outcome (pre-implementation — confirming TDD red state):**
- `node tests/check-cli-governance.js` exits with code `1` (non-zero).
- At least one line starting with `✗` is printed, naming which condition failed.

**Record:**
- [ ] Pass (post-implementation)
- [ ] Confirmed failing pre-implementation (pre-code sign-off)
- [ ] Fail — notes: _______________

---

## Edge case scenarios

### Edge case 1 — Artefact file does not exist at all

**Steps:** Run `node bin/skills validate artefacts/this-file-does-not-exist.md definition-of-ready`

**Expected outcome:** The command exits with a non-zero code and an error message explaining that the artefact file was not found. It does not crash with an unhandled exception or stack trace visible to the user.

**Record:** [ ] Pass  [ ] Fail — notes: _______________

---

### Edge case 2 — Absolute path to a file inside the repository

**Steps:** Run the command with an absolute path to an existing artefact file inside the repo:
- PowerShell: `node bin/skills validate $PWD\artefacts\2026-05-19-cli-deterministic-governance\discovery.md definition-of-ready`
- bash: `node bin/skills validate $PWD/artefacts/2026-05-19-cli-deterministic-governance/discovery.md definition-of-ready`

**Expected outcome:** The command behaves the same as Scenario 1 — exits with code `0` and prints the success message. Absolute paths inside the repository root are valid.

**Record:** [ ] Pass  [ ] Fail — notes: _______________
