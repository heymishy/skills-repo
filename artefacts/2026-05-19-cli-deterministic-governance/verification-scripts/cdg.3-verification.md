# AC Verification Script: `skills advance` CLI command

**Story reference:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.3.md
**Technical test plan:** artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.3-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repository root (where `package.json` lives).
2. Confirm `node bin/skills validate` works: `node bin/skills validate --help` or run it against any artefact — it should not error out.
3. Create a scratch copy of `pipeline-state.json` to restore after manual testing:
   `copy .github\pipeline-state.json .github\pipeline-state.json.bak`
4. Identify a real feature slug and story id from `.github/pipeline-state.json` to use in Scenario 1 and 6. Open `.github/pipeline-state.json` in a text editor and note down: a feature slug (e.g. `2026-05-19-cli-deterministic-governance`) and a story id (e.g. `cdg.3`).

**Reset between scenarios:** Restore the backup: `copy .github\pipeline-state.json.bak .github\pipeline-state.json`

---

## Scenarios

---

### Scenario 1: Running the command with valid arguments updates the file and exits cleanly

**Covers:** AC1

**Steps:**
1. In your terminal, run: `node bin/skills advance <feature-slug> <story-id> dorStatus=signed-off` replacing `<feature-slug>` and `<story-id>` with the values you noted in Setup step 4.
2. Look at the terminal output.
3. Open `.github/pipeline-state.json` and find the story entry for `<story-id>`.

**Expected outcome:**
> The command exits with no error (you return to the command prompt with no error message). The terminal output includes one line mentioning the feature slug and story id you used — something like "Advanced test-feature / test-story: dorStatus = signed-off". When you open `pipeline-state.json`, the `dorStatus` field for that story is now `"signed-off"`.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 2: Unknown feature slug prints an error and does not change the file

**Covers:** AC2

**Steps:**
1. Run: `node bin/skills advance this-feature-does-not-exist some-story dorStatus=signed-off`
2. Look at the terminal output — specifically any error message.
3. Open `.github/pipeline-state.json` and confirm it is unchanged (same as before you ran the command).

**Expected outcome:**
> The terminal shows an error message in the error output (stderr) that names the unknown feature slug `this-feature-does-not-exist`. The command exits with an error (exit code 8). `pipeline-state.json` is byte-for-byte identical to before you ran the command — no fields have changed.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 3: An invalid field value prints an error with allowed values listed

**Covers:** AC3

**Steps:**
1. Run: `node bin/skills advance <feature-slug> <story-id> prStatus=this-is-not-a-valid-status`
2. Look at the error output.

**Expected outcome:**
> The terminal shows an error message (in stderr) that names the invalid value `this-is-not-a-valid-status` and either lists the allowed values for `prStatus` (which are `none`, `draft`, `open`, `merged`) or clearly says the value is not accepted. The command exits with an error (non-zero exit code). `pipeline-state.json` is unchanged.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 4: Running with no arguments shows usage instructions

**Covers:** AC4 (no arguments case)

**Steps:**
1. Run: `node bin/skills advance` (no additional arguments).
2. Look at the output.

**Expected outcome:**
> The terminal shows usage instructions explaining how to call the command — something describing that it expects `<feature-slug>`, `<story-id>`, and at least one `field=value` pair. The command exits with an error (exit code 8). `pipeline-state.json` is unchanged.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 5: Running with only a feature slug (missing story id) shows usage instructions

**Covers:** AC4 (partial arguments case)

**Steps:**
1. Run: `node bin/skills advance <feature-slug>` (feature slug only, no story id or field arguments).
2. Look at the output.

**Expected outcome:**
> The terminal shows usage instructions. The command exits with an error (exit code 8). `pipeline-state.json` is unchanged.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 6: A malformed argument (missing = sign) prints an error naming that argument

**Covers:** AC5

**Steps:**
1. Run: `node bin/skills advance <feature-slug> <story-id> justasingleword` — where `justasingleword` has no `=` sign.
2. Look at the error output.

**Expected outcome:**
> The terminal shows an error message that names `justasingleword` as the problem — it is not a valid `field=value` argument. The command exits with error code 8. `pipeline-state.json` is unchanged.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 7: Multiple field=value pairs are all written in one command

**Covers:** AC6

**Steps:**
1. Run: `node bin/skills advance <feature-slug> <story-id> dorStatus=signed-off reviewStatus=passed`
2. Open `.github/pipeline-state.json` and find the story entry.

**Expected outcome:**
> The command exits cleanly (exit code 0). When you open `pipeline-state.json`, the story entry has BOTH `"dorStatus": "signed-off"` AND `"reviewStatus": "passed"` set. The file is valid JSON (no corruption or partial write). Both fields were set in a single command run.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

### Scenario 8: The existing `skills validate` command still works after `advance` is added

**Covers:** AC8

**Steps:**
1. Run: `node bin/skills validate artefacts/2026-05-19-cli-deterministic-governance/discovery.md`
2. Note the exit code and output.

**Expected outcome:**
> The `validate` command runs normally — same output as before the `advance` subcommand was added. It does not error out or print unexpected output. Adding `advance` to `bin/skills` has not broken the existing `validate` routing.

**Result:** [ ] Pass  [ ] Fail
**Notes:** 

---

## Sign-off

**Overall result:** [ ] All pass — ready for next pipeline stage  [ ] One or more failures — record below

**Failures and findings:**

**Verified by:** ________________________  **Date:** ________________
