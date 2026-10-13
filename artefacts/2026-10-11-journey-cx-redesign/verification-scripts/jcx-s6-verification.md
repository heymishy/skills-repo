# AC Verification Script: Restructure the Customer experience tab into a real timeline + swimlane grid

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s6.md
**Technical test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s6-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a journey with 3+ stages, each with emotion, pain points, opportunities, customer actions, and touchpoints all set.

**Reset between scenarios:** Reload the page.

---

## Scenarios

---

### 🔴 Scenario 1: Stages read left to right, like a timeline — not stacked top to bottom

**Covers:** AC1

**Steps:**
1. Open the Customer experience tab.

**Expected outcome:**
> You see the 3 stages side by side across the page, in order, like a timeline — not as 3 separate boxes stacked one under the other that you have to scroll through.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### 🔴 Scenario 2: Each kind of data has its own row, lined up under each stage

**Covers:** AC2

**Steps:**
1. Look at the data under each stage — emotion, pain points, opportunities, customer actions, touchpoints.

**Expected outcome:**
> Each kind of data (emotion, pain points, opportunities, actions, touchpoints) has its own labeled row running across the whole page, and each stage's value for that row lines up directly under that stage's own column — not all bundled together inside one box per stage.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### 🔴 Scenario 3: The emotion curve shows which point belongs to which stage, and doesn't look sparse

**Covers:** AC3

**Steps:**
1. Look at the emotion curve row specifically.

**Expected outcome:**
> Each point on the curve has the stage's own name right next to it — you don't have to scroll down and count to figure out which point is which. The curve also stretches to use most of its own row's width, rather than being squeezed into a small area with lots of empty space next to it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Customer actions and touchpoints are now visible (previously missing)

**Covers:** AC4

**Steps:**
1. Look for a "Customer actions" row and a "Touchpoints" row.

**Expected outcome:**
> Both rows are present and show the data you'd expect for each stage — this data existed before but wasn't shown on this tab; now it is.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: You can still get the full story read out loud, stage by stage

**Covers:** AC5

**Steps:**
1. Use a screen reader (or browser's accessibility inspector) on the Customer experience tab.

**Expected outcome:**
> Every stage's full set of data (emotion, pain points, opportunities, actions, touchpoints) is readable in order, stage by stage — not just a jumble of rows and columns with no reading order.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: The Customer experience tab looks different from the Delivery tab

**Covers:** AC6

**Steps:**
1. Open the Customer experience tab, note its look.
2. Open the Delivery tab on the same journey.

**Expected outcome:**
> The two tabs are visibly different — not two copies of the same layout with only the text inside changed. (Exactly how they differ — background, text size, or how the pipeline buttons are shown — is an implementation choice; the only requirement is that you can tell them apart at a glance.)

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### 🔴 Scenario 7: A journey with many stages scrolls sideways, without losing the row labels

**Covers:** AC7

**Steps:**
1. Open a journey with 8 or more stages on the Customer experience tab.
2. Scroll the stage area sideways.
3. Try scrolling it using only the keyboard (Tab to it, then arrow keys or Page Down/Up).

**Expected outcome:**
> The stages scroll sideways so you can see them all. The row labels on the left (Emotion, Customer actions, Touchpoints, Pain points, Opportunities) stay in place while you scroll — they don't disappear off-screen. You can also scroll sideways using only the keyboard, not just a mouse or trackpad.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — left-to-right timeline 🔴 | | |
| Scenario 2 — swimlane rows aligned under stages 🔴 | | |
| Scenario 3 — curve has stage labels, fills its row 🔴 | | |
| Scenario 4 — actions/touchpoints now visible | | |
| Scenario 5 — accessible stage-by-stage reading order | | |
| Scenario 6 — visually distinct from Delivery tab | | |
| Scenario 7 — many-stage scroll, pinned labels, keyboard-operable 🔴 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
