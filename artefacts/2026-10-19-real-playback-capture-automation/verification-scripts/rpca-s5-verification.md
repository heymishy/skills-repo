# AC Verification Script: Playback capture triggers automatically when a feature reaches Definition of Done

**Story reference:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s5-automatic-capture-trigger-at-definition-of-done.md
**Technical test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s5-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open `scripts/playback-capture.js`, `skills/definition-of-done/SKILL.md`, and `skills/feature-playback/SKILL.md` in a text editor

**Reset between scenarios:** No reset needed — read-only review of document/code content, plus two small fixture-based checks.

---

## Scenarios

---

### Scenario 1: The gate works without the field nobody writes

**Covers:** AC1

**Steps:**
1. Make up a feature with 2 stories, both marked `dodStatus: "complete"`, but no top-level `feature.dodStatus` field anywhere
2. Check whether `checkDodGate` (read its code, or run the automated test) treats this feature as done

**Expected outcome:**
> It's treated as done — `{ ok: true }` — even though the old `feature.dodStatus` field was never set. The gate reads each story's own `dodStatus`, not a field nothing writes.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The error message actually tells you what's wrong

**Covers:** AC2

**Steps:**
1. Make up the same feature, but leave one of the 2 stories at `dodStatus: "in-progress"`
2. Check what error message `checkDodGate` produces

**Expected outcome:**
> The error names the specific story that's not done yet — not a generic "not complete" message with no story identified.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Reaching DoD on the last story now fires playback automatically

**Covers:** AC3

**Steps:**
1. Read `skills/definition-of-done/SKILL.md`'s own "Feature-completion trace check" section

**Expected outcome:**
> It now says that once every story in a feature is DoD-complete, the skill automatically runs `/feature-playback`'s own walkthrough-generation and screenshot-capture steps (Steps 1-3) — the operator does not have to separately say "make a playback package." It also still says Step 4's own editorial review stays a required human step, unchanged.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A capture failure doesn't sink the DoD sign-off

**Covers:** AC4

**Steps:**
1. Read the same section's own description of what happens if the automatic capture run fails (e.g. staging unreachable, secret not set)

**Expected outcome:**
> The story's own DoD verdict still comes through correctly (COMPLETE / COMPLETE WITH DEVIATIONS, based on that story's own ACs/tests/NFRs) — the capture failure does NOT downgrade it. A follow-up action naming the feature and the failure reason gets recorded instead, so it's visible later, not silently lost.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Saying "make a playback package" still works the old way too

**Covers:** AC5

**Steps:**
1. Read `skills/feature-playback/SKILL.md`'s own `triggers` list and entry condition

**Expected outcome:**
> The same trigger phrases ("make a playback package", "generate a demo walkthrough", "package this feature for review", "feature playback") still work exactly as before — nothing about the manual path was removed or gated differently.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1 — gate works without the field) | | |
| Scenario 2 (AC2 — named error) | | |
| Scenario 3 (AC3 — auto-fires at DoD) | | |
| Scenario 4 (AC4 — failure doesn't sink DoD) | | |
| Scenario 5 (AC5 — manual path unchanged) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
