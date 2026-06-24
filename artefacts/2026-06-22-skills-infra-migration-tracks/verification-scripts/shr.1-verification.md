# AC Verification Script: shr.1 — Extend pipeline-state schema and harness for infra and migration track flags

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/shr.1.md
**Technical test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/shr.1-test-plan.md
**Script version:** 1
**Verified by:** ________ | **Date:** ________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Clone the repo and check out the branch containing this story's changes
2. Ensure Node.js is installed: `node --version` should print a version number
3. From the repo root, run `node scripts/check-pipeline-state-integrity.js` to confirm the script runs without error on the current state

**Reset between scenarios:** No state is shared between scenarios — each uses its own temporary data

---

## Scenarios

---

### Scenario 1: Schema file recognises the four new fields

**Covers:** AC1, AC2, AC5

**Steps:**
1. Open `.github/pipeline-state.schema.json` in a text editor
2. Search for the word `hasInfraTrack`
3. Search for the word `hasMigrationTrack`
4. Search for the word `infraPlanPath`
5. Search for the word `migrationReviewPath`

**Expected outcome:**
> All four terms are found in the schema file. Each appears inside the section that defines properties of a story object. `hasInfraTrack` and `hasMigrationTrack` are listed as boolean fields. `infraPlanPath` and `migrationReviewPath` are listed as string fields.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Integrity check accepts a story flagged as an infra track

**Covers:** AC1

**Steps:**
1. Create a temporary file called `test-state.json` anywhere on your computer with this content:
   ```json
   { "features": [{ "id": "test-feat", "stage": "definition", "stories": [{ "id": "s1", "stage": "definition", "hasInfraTrack": true }] }] }
   ```
2. Run: `node scripts/check-pipeline-state-integrity.js` (pointing it at your test file, or temporarily substitute the content into the real file)
3. Note the output

**Expected outcome:**
> The script completes and prints a line ending in `0 fail ✓` (or equivalent). No error messages mention `hasInfraTrack` being an unrecognised field.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Integrity check accepts a story with migration track path

**Covers:** AC2

**Steps:**
1. Create a story entry with `hasMigrationTrack: true` and `migrationReviewPath: "artefacts/feat/migrations/s1-migration-review.md"`
2. Run the integrity check against state containing this entry

**Expected outcome:**
> The script completes without error. Both `hasMigrationTrack` and `migrationReviewPath` are accepted as valid fields.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: `skills advance` writes infra track fields to a story

**Covers:** AC3

**Steps:**
1. From the repo root, run: `node bin/skills advance --help` or `node bin/skills advance` to confirm the command exists
2. Run: `node bin/skills advance skills-infra-migration-tracks shr.1 hasInfraTrack=true infraPlanPath="artefacts/2026-06-22-skills-infra-migration-tracks/infra/shr.1-infra-plan.md"`
3. Open `.github/pipeline-state.json` and find the `shr.1` story entry

**Expected outcome:**
> The `shr.1` story entry contains `"hasInfraTrack": true` and `"infraPlanPath": "artefacts/2026-06-22-skills-infra-migration-tracks/infra/shr.1-infra-plan.md"`. The value is written as a boolean (not the string "true").

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Absence of flags causes no error

**Covers:** AC4

**Steps:**
1. Run `node scripts/check-pipeline-state-integrity.js` on the real `.github/pipeline-state.json` (which has stories without the new flags)

**Expected outcome:**
> The script completes with `0 fail ✓`. No errors appear about missing `hasInfraTrack` or `hasMigrationTrack` — the fields are optional.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: Schema and harness updated together (not in separate commits)

**Covers:** AC5

**Steps:**
1. Run `git log --oneline --all | head -30`
2. Find the commit that added `hasInfraTrack` to `pipeline-state.schema.json`
3. Run `git show <commit-sha> --name-only` to see which files were changed in that commit

**Expected outcome:**
> The commit that changes `pipeline-state.schema.json` also changes `scripts/check-pipeline-state-integrity.js` (or both the schema and the harness extension file). There is no commit that adds the schema fields without the harness, or vice versa.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — schema contains four new fields | | |
| Scenario 2 — integrity check accepts hasInfraTrack | | |
| Scenario 3 — integrity check accepts hasMigrationTrack + path | | |
| Scenario 4 — skills advance writes infra track fields | | |
| Scenario 5 — absence of flags causes no error | | |
| Scenario 6 — schema and harness in same commit | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | | |
