# AC Verification Script: Wire the real CLI into skills/feature-playback/SKILL.md's own documented steps

**Story reference:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s4-wire-cli-into-feature-playback-skill.md
**Technical test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s4-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open `skills/feature-playback/SKILL.md` and `artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/decisions.md` in a text editor

**Reset between scenarios:** No reset needed — read-only review of document content.

---

## Scenarios

---

### Scenario 1: The skill's own instructions match what actually happens

**Covers:** AC1

**Steps:**
1. Read `skills/feature-playback/SKILL.md`'s own Step 2 and Step 3

**Expected outcome:**
> The text describes running `node scripts/playback-capture.js [feature-slug]` and accurately explains that it authenticates against staging and captures real screenshots/video — not a description that sounds aspirational or doesn't match what the code in `rpca-s1`-`rpca-s3` actually built.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: What's still manual is stated accurately

**Covers:** AC2

**Steps:**
1. Read the same file's own "What this skill does NOT do" section

**Expected outcome:**
> It correctly says production capture and bulk retrofitting across existing features remain manual/out of scope — it does not claim the whole mechanism is still manual.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The old RISK-ACCEPT entries are closed, not left dangling

**Covers:** AC3

**Steps:**
1. Read `artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/decisions.md`
2. Look for a new entry near the end of the file

**Expected outcome:**
> A new entry explicitly names `fpd-s1`, `fpd-s2`, `fpd-s3`, `fpd-s4`, and `fpd-s5`'s own RISK-ACCEPT entries as superseded by this epic's real mechanism — the original 5 entries are still present and unedited (the audit trail isn't rewritten), just explicitly closed out by the new entry.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1 — SKILL.md accuracy) | | |
| Scenario 2 (AC2 — scoping accuracy) | | |
| Scenario 3 (AC3 — decisions.md closure) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
