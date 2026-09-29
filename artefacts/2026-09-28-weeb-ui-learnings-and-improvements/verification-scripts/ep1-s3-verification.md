# AC Verification Script: Skill launcher redesign — show 5 primary CTAs, hide chained skills

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s3.md
**Technical test plan:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep1-s3-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open the web UI dashboard in a browser, signed in.
2. Clear your browser's localStorage for this site first, so you're seeing a genuinely fresh launcher (no prior session state affecting it).

**Reset between scenarios:** Reload the page fresh between scenarios; clear localStorage again if you've triggered any session-history behavior.

---

## Scenarios

---

### Scenario 1: Only 5 skills are shown up front, and they're the big, obvious buttons

**Covers:** AC1

**Steps:**
1. Load the dashboard's skill launcher.
2. Count the large, prominent buttons at the top.

**Expected outcome:**
> Exactly 5 buttons: Discovery, Ideate, Reverse-engineer, Spike, Improve. They're visibly bigger/more prominent than anything below them.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The other 36+ skills are nowhere to be seen by default

**Covers:** AC2

**Steps:**
1. On the same loaded page, look at everything visible without clicking anything.

**Expected outcome:**
> You don't see `/definition`, `/test-plan`, `/dor`, `/clarify`, `/estimate`, or any other chained skill listed as a button anywhere in the main view.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: You can still get to every skill if you need to

**Covers:** AC3

**Steps:**
1. Find and click whatever link, button, or toggle gives access to "all skills" or "advanced".

**Expected outcome:**
> A full list appears with all 41+ skills, including the 5 primary ones and every chained one, all readable and clickable.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The "advanced" area looks clearly secondary

**Covers:** AC4

**Steps:**
1. Compare the visual weight of the primary 5 buttons versus the advanced section (before and after expanding it).

**Expected outcome:**
> The advanced section is smaller text, lower contrast, or starts collapsed — something makes it obviously not the main focus of the page. You shouldn't have to squint to tell which 5 are "the real options."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Clicking an advanced skill actually works

**Covers:** AC5

**Steps:**
1. Open the advanced section.
2. Click on a chained skill you wouldn't normally see up front — e.g. `/clarify`.

**Expected outcome:**
> A new session for that exact skill starts, same as if it were a primary button. Nothing is blocked or broken.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The 5 primary skills never change based on what you did before

**Covers:** AC6

**Steps:**
1. Use the launcher for a bit — click into a session, come back to the launcher.
2. Reload the page.

**Expected outcome:**
> The same 5 primary buttons (Discovery, Ideate, Reverse-engineer, Spike, Improve) are still there, same order, regardless of what you just did.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — 5 prominent primary CTAs | | |
| Scenario 2 — Chained skills hidden by default | | |
| Scenario 3 — Advanced access reaches everything | | |
| Scenario 4 — Advanced section visually secondary | | |
| Scenario 5 — Advanced skills actually work | | |
| Edge case — List is stable | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
