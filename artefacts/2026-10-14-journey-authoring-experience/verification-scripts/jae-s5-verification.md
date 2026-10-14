# AC Verification Script: Restructure the Delivery view from a per-stage card stack into a swimlane grid

**Story reference:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s5.md
**Technical test plan:** artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s5-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a journey with at least 3 stages (if you don't have one, create a new journey and add 3 stages first).
2. Make sure at least one stage has a mapped feature or a placeholder, and at least one stage has none — you'll need both for the scenarios below.
3. You'll need to click the "Delivery" button near the top of the journey page to switch views.

**Reset between scenarios:** No reset needed — all scenarios can be checked on the same journey, one after another.

---

## Scenarios

### Scenario 1: Delivery view shows one column per stage, with coverage status and mapped features lined up underneath

**Covers:** AC1

**Steps:**
1. Open the journey and click "Delivery".
2. Look at the stages across the top.

**Expected outcome:**
> Each stage appears as its own column, side by side, in the same left-to-right order they appear in on the Canvas and Customer experience views. Underneath the stage names, you see two rows: "Coverage status" and "Mapped features". Each stage's coverage status and mapped features sit directly underneath that stage's own column header — not shifted or misaligned.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A stage with no mapped features shows a plain "No features mapped" message

**Covers:** AC2

**Steps:**
1. In Delivery view, find a stage column that has no mapped feature or placeholder.
2. Look at its "Mapped features" cell.

**Expected outcome:**
> The cell shows the text "No features mapped", shown in a lighter, muted colour than stages that do have something mapped — not bold or highlighted as if it were an error.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: "Map feature" still works from inside the new column layout

**Covers:** AC3

**Steps:**
1. In Delivery view, click "Map feature" underneath any stage.
2. Pick a feature from the list that opens.

**Expected outcome:**
> The same feature-picker list opens as before. After picking a feature, it appears listed in that stage's own "Mapped features" cell, with its name and any metrics — exactly as mapping a feature already worked before this change.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: "Add placeholder" still works from inside the new column layout

**Covers:** AC4

**Steps:**
1. In Delivery view, click "Add placeholder" underneath a stage with no mapped features.
2. Type a name and click "Create".

**Expected outcome:**
> A small form appears right there in the same cell, you type the name and submit it, and the new placeholder shows up in that same cell — exactly as adding a placeholder already worked before this change.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Reordering stages still works from the Delivery view

**Covers:** AC5

**Steps:**
1. In Delivery view, find the up/down arrow buttons at the top of a stage's column.
2. Click the "move left" (up) arrow on a stage that isn't already first.

**Expected outcome:**
> That stage's column moves one position to the left (earlier), and every row's columns stay lined up with their own stage. The behaviour is identical to how reordering worked before — only its location (inside the column header instead of a card) has changed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: A brand-new journey with no stages shows the usual empty message, not a blank grid

**Covers:** AC6

**Steps:**
1. Create a brand-new journey with no stages yet.
2. Click "Delivery".

**Expected outcome:**
> You see the message "No stages yet. Add your first stage." — the same message you'd see on the other two views for a 0-stage journey. You do not see an empty-looking grid with no columns.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 7: Screen-reader users get one clear summary of the whole Delivery view

**Covers:** AC7

**Steps:**
1. Turn on a screen reader (or use your browser's accessibility inspector) and navigate to the Delivery view.
2. Listen for (or inspect) a hidden summary list.

**Expected outcome:**
> There is one list, not shown visually, that reads out every stage's name, its coverage status, and what's mapped to it, one stage after another in the same left-to-right order they appear on screen.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 8: The grid scrolls sideways for a long journey, without losing the row labels

**Covers:** AC8

**Steps:**
1. Open (or create) a journey with 8 or more stages.
2. Click "Delivery".
3. Scroll the stage columns sideways using your trackpad, mouse wheel, or the scrollbar.

**Expected outcome:**
> The stage columns scroll sideways smoothly. The "Coverage status" and "Mapped features" row labels on the left stay in place the whole time — they do not scroll away with the columns. You can also reach the scrolling area with the Tab key and scroll it using your keyboard.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Edge case: Journey with exactly one stage (no reorder arrows)

**Covers:** AC5's own documented edge case

**Steps:**
1. Open a journey with exactly one stage.
2. Click "Delivery".

**Expected outcome:**
> No up/down reorder arrows appear at all for that single stage — there's nothing to reorder it against. Everything else (coverage status, mapped features) still shows normally.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
