# AC Verification Script: Fix Mobile-Responsiveness Gaps on the Already-Shipped Artefact Viewer and Dashboard

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s6.md
**Technical test plan:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s6-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Log in — you'll need at least one real product to see the dashboard's normal (non-onboarding) content.
2. Know how to open your browser's device-emulation mode or resize to a narrow width (~375-390px), or use a real phone.

**Reset between scenarios:** No reset needed.

---

## Scenarios

---

### Scenario 1: Dashboard doesn't scroll sideways on a phone

**Covers:** AC1

**Steps:**
1. Open the dashboard (`/dashboard`) on a real phone, or in your browser's narrow-width mode (~375px).
2. Try to scroll left/right.

**Expected outcome:**
> The page does not scroll sideways at all — everything fits within the screen width.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Dashboard's skill grid and columns are readable on a phone

**Covers:** AC2

**Steps:**
1. Same narrow view as Scenario 1.
2. Look at the "Run a skill" cards and the "Waiting on you"/"Recent sessions" sections.

**Expected outcome:**
> Everything stacks into one single column, top to bottom. No card is squeezed so narrow that its title breaks awkwardly mid-word (e.g. you should never see "Definition" on one line and "of ready" on the next for what should be one title, "Definition of ready").

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Artefact viewer's actual content is visible on a phone (not squeezed away)

**Covers:** AC3

**Steps:**
1. Open any artefact page (e.g. a discovery or story document) on a real phone, or narrow browser mode.
2. Look for the main document text.

**Expected outcome:**
> You can actually see and read the document's real content — it should take up most of the screen width. This is the specific bug being fixed: today, the document text is squeezed down to almost nothing (practically invisible) while the Sign-off/Comments panel on the side takes up the whole screen instead.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Artefact viewer stacks with the document first, sidebar below

**Covers:** AC4

**Steps:**
1. Same narrow view as Scenario 3.
2. Scroll down the page.

**Expected outcome:**
> The document content appears first (at the top), and the Sign-off/Comments sidebar appears below it once you scroll down — not squeezed side-by-side.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Nothing that worked before is now broken

**Covers:** AC5

**Steps:**
1. On a normal desktop-width screen, open both the dashboard and an artefact page.
2. Confirm the dashboard looks the same as before (skill grid, waiting-on-you, recent sessions all in their normal multi-column layout).
3. Confirm the artefact page looks the same as before (document + sidebar side by side).
4. Try clicking a skill card on the dashboard, and posting a comment or clicking Sign Off on the artefact page.

**Expected outcome:**
> At normal desktop width, everything looks and works exactly as it did before this story — only the narrow-phone-width behavior changed. All existing buttons/links/actions still work.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (Dashboard no sideways scroll) | | |
| Scenario 2 (Dashboard readable, single column) | | |
| Scenario 3 (Artefact content visible, not squeezed) | | |
| Scenario 4 (Artefact stacks, document first) | | |
| Scenario 5 (No regression) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
