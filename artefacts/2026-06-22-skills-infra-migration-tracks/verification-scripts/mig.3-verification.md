# AC Verification Script: mig.3 — Add H-MIG hard block to `/definition-of-ready` SKILL.md

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.3.md
**Technical test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.3-test-plan.md
**Script version:** 1
**Verified by:** ________ | **Date:** ________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open `.github/skills/definition-of-ready/SKILL.md` in a text editor

---

## Scenarios

---

### Scenario 1: H-MIG appears in DoR checklist when `hasMigrationTrack: true`

**Covers:** AC1

**Steps:**
1. Read `.github/skills/definition-of-ready/SKILL.md`
2. Search for the string "H-MIG" in the file
3. Confirm H-MIG is listed as a hard-block check item (not just a comment or footnote)
4. Confirm the H-MIG entry references `hasMigrationTrack` as its trigger condition

**Expected outcome:**
> "H-MIG" appears as a named hard-block check in the DoR checklist. The entry states that H-MIG is conditional on `hasMigrationTrack: true`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: H-MIG shows FAIL when `migrationReviewPath` is absent

**Covers:** AC2

**Steps:**
1. Find the H-MIG block in the DoR SKILL.md
2. Check that the instructions state H-MIG evaluates to FAIL when `migrationReviewPath` is not set on the story entry
3. Confirm the FAIL output names the expected path and explains what is missing

**Expected outcome:**
> H-MIG FAIL is documented when `migrationReviewPath` is absent. The FAIL output identifies the missing path and which fields are required.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: H-MIG shows FAIL when artefact lacks status PASS

**Covers:** AC2

**Steps:**
1. Find the H-MIG block conditions for an existing file without PASS status
2. Confirm H-MIG evaluates to FAIL if the artefact at `migrationReviewPath` exists but does not contain a PASS status
3. Confirm the FAIL output names the path and the missing/incorrect status

**Expected outcome:**
> H-MIG is FAIL for an artefact that exists but lacks PASS status. The output names the path and the issue.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: H-MIG shows PASS when artefact contains status PASS

**Covers:** AC3

**Steps:**
1. Find the H-MIG PASS condition in the DoR SKILL.md
2. Confirm H-MIG passes when `migrationReviewPath` points to an artefact with status PASS
3. Confirm the PASS output names the artefact path and lists the fields that were checked

**Expected outcome:**
> H-MIG PASS requires a PASS artefact at `migrationReviewPath`. The output names the path and checked fields.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: H-MIG absent when `hasMigrationTrack` is false or missing; existing blocks unaffected

**Covers:** AC4

**Steps:**
1. Find the H-MIG conditional trigger in the DoR SKILL.md
2. Confirm H-MIG only appears when `hasMigrationTrack: true`
3. Confirm no mention of H-MIG appears in the H1-H9, H-E2E, H-NFR, or H-INF block descriptions

**Expected outcome:**
> H-MIG is guarded by `hasMigrationTrack: true`. All other hard-block checks are unchanged and make no reference to H-MIG.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: H-MIG FAIL for breaking migration without CI-tier rollback evidence

**Covers:** AC5

**Steps:**
1. Find the H-MIG breaking-migration check in the DoR SKILL.md
2. Confirm the instructions state that for a breaking migration, H-MIG requires CI-tier rollback execution evidence in the review artefact — not just a declaration
3. Confirm H-MIG evaluates to FAIL if the review artefact has `classification: breaking` but no rollback execution evidence field

**Expected outcome:**
> H-MIG checks for rollback evidence when classification is breaking. Absence of rollback evidence on a breaking migration produces FAIL — even if the artefact has PASS status.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — H-MIG appears, references `hasMigrationTrack` | | |
| Scenario 2 — H-MIG FAIL when `migrationReviewPath` absent | | |
| Scenario 3 — H-MIG FAIL when artefact lacks PASS status | | |
| Scenario 4 — H-MIG PASS when artefact has PASS, path + fields named | | |
| Scenario 5 — H-MIG absent when flag false/missing; existing blocks unaffected | | |
| Scenario 6 — H-MIG FAIL for breaking migration without rollback evidence | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | | |
