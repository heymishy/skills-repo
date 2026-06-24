# AC Verification Script: inf.4 — Add H-INF hard block to `/definition-of-ready` SKILL.md

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.4.md
**Technical test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.4-test-plan.md
**Script version:** 1
**Verified by:** ________ | **Date:** ________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open `.github/skills/definition-of-ready/SKILL.md` in a text editor

---

## Scenarios

---

### Scenario 1: H-INF appears in DoR checklist when `hasInfraTrack: true`

**Covers:** AC1

**Steps:**
1. Read `.github/skills/definition-of-ready/SKILL.md`
2. Search for the string "H-INF" in the file
3. Confirm H-INF is listed as a hard-block check item (not just a comment or footnote)
4. Confirm the H-INF entry references `hasInfraTrack` as its trigger condition

**Expected outcome:**
> "H-INF" appears as a named hard-block check in the DoR checklist. The entry states that H-INF is conditional on `hasInfraTrack: true` — it only appears for stories with the infra track flag set.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: H-INF shows FAIL when `infraPlanPath` is absent

**Covers:** AC2

**Steps:**
1. Find the H-INF block in the DoR SKILL.md
2. Check that the instructions state H-INF evaluates to FAIL when `infraPlanPath` is not set on the story entry
3. Confirm the FAIL output names the expected path (or explains that the path is missing) so the operator knows what to create

**Expected outcome:**
> The H-INF block explicitly states the FAIL condition when `infraPlanPath` is absent. The FAIL output identifies the missing path so the operator can act.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: H-INF shows FAIL when artefact exists but does not contain status PASS

**Covers:** AC2

**Steps:**
1. Find the H-INF block in the DoR SKILL.md
2. Check that the instructions state H-INF evaluates to FAIL when the file at `infraPlanPath` exists but does not contain a PASS status marker
3. Confirm the block overall prevents DoR sign-off when H-INF is FAIL

**Expected outcome:**
> The H-INF block states that even if the file exists, H-INF is FAIL unless the artefact contains a PASS status. The block prevents DoR from reaching sign-off when H-INF is FAIL.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: H-INF shows PASS when artefact contains status PASS

**Covers:** AC3

**Steps:**
1. Find the H-INF PASS condition in the DoR SKILL.md
2. Confirm the instructions state H-INF passes when `infraPlanPath` points to a file containing status PASS
3. Confirm the PASS output names the artefact path that was checked

**Expected outcome:**
> The H-INF PASS condition is described: `infraPlanPath` must point to an artefact containing status PASS. The PASS output names the checked path so the audit trail is clear.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: H-INF absent when `hasInfraTrack` is false or missing

**Covers:** AC4

**Steps:**
1. Find the H-INF conditional trigger in the DoR SKILL.md
2. Confirm that H-INF only appears when `hasInfraTrack: true` — not when it is `false` or absent
3. Confirm no mention of H-INF appears in the H1-H9 standard block descriptions (they are unmodified)

**Expected outcome:**
> The H-INF block is guarded by `hasInfraTrack: true`. When the flag is false or absent, H-INF is completely skipped. The H1-H9 blocks are unchanged and make no reference to H-INF.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — H-INF appears, references `hasInfraTrack` | | |
| Scenario 2a — H-INF FAIL when `infraPlanPath` absent | | |
| Scenario 2b — H-INF FAIL when artefact lacks PASS status | | |
| Scenario 3 — H-INF PASS when artefact has PASS status, path named | | |
| Scenario 4 — H-INF absent when `hasInfraTrack` false or missing | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | | |
