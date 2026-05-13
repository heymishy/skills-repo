# AC Verification Script: Register `/modernisation-decompose` in `check-skill-contracts.js`

**Story reference:** artefacts/2026-04-22-modernisation-decompose/stories/md-2-skill-contracts.md
**Technical test plan:** artefacts/2026-04-22-modernisation-decompose/test-plans/md-2-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Clone or pull the latest version of the skills repo (post-merge only — this script is for post-merge smoke test and pre-code spec review).
2. Confirm that both `check-skill-contracts.js` and `.github/skills/modernisation-decompose/SKILL.md` are present.
3. Open a terminal at the repo root.

**Reset between scenarios:** Each scenario is independent. No state carry-over.

---

## Scenarios

### Scenario 1 — AC1: npm test passes with the new skill registered

**Steps:**
1. In the terminal, run: `npm test`
2. Wait for the output to complete.
3. Look at the line starting with `[skill-contracts]`.

**Expected outcome:** The `[skill-contracts]` line shows at least 38 skills and ends with `OK ✓`. No line in the output says "contract failed" or "FAIL" for the modernisation-decompose skill. The overall test run exits with success (no error summary at the bottom).

**Pass / Fail:** _____ | Notes: _____

---

### Scenario 2 — AC2: Removing the State update section causes a named failure message

**Steps:**
1. Make a backup copy of `.github/skills/modernisation-decompose/SKILL.md`.
2. Open the SKILL.md and delete the entire `## State update — mandatory final step` section (the heading and all text under it until the next `##` heading or end of file).
3. Save the file.
4. Run `npm test` in the terminal.
5. Read the error output.
6. Restore the SKILL.md from your backup.

**Expected outcome:** The test run fails (exits with a non-zero code or shows FAIL). The error output includes the skill name "modernisation-decompose" and the name of the missing section (something like "State update" or "mandatory final step"). The message is specific — not just "contract failed" or "1 failure".

**Pass / Fail:** _____ | Notes: _____

---

### Scenario 3 — AC3: No regressions — all pre-existing skills still pass

**Steps:**
1. Run `npm test` in the terminal (on the unmodified repo, after restoring any changes from Scenario 2).
2. Read the `[skill-contracts]` output line carefully.

**Expected outcome:** The line reports all contracts OK. If you know the previous count was 37 skills and 156 contracts, the new output should show 38 skills and the contract count should be higher (one new skill's contracts added). No existing skill name appears in a failure line.

**Pass / Fail:** _____ | Notes: _____

---

## Summary

| Scenario | AC | Pass / Fail | Notes |
|----------|-----|-------------|-------|
| 1 — npm test passes for new skill | AC1 | | |
| 2 — Named failure for missing section | AC2 | | |
| 3 — No regressions to 37 existing skills | AC3 | | |

**Overall: PASS / FAIL** (circle one) | **Verified by:** _________ | **Date:** _________
