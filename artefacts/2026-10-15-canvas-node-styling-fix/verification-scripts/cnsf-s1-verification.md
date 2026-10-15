# AC Verification Script: Override drawflow's vendor-default node/port/connector colours with the app's own design tokens

**Story reference:** artefacts/2026-10-15-canvas-node-styling-fix/stories/cnsf-s1-canvas-node-token-styling.md
**Technical test plan:** artefacts/2026-10-15-canvas-node-styling-fix/test-plans/cnsf-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open any journey with at least one stage and switch to the "Canvas" view.
2. If you have access to the app's dark-mode toggle (system preference or an in-app switch), you'll need to check both light and dark for Scenario 5.

**Reset between scenarios:** No reset needed — all scenarios can be checked on the same stage node, one after another.

---

## Scenarios

### Scenario 1: A stage node looks like the rest of the app, not a bright cyan box

**Covers:** AC1

**Steps:**
1. Look at any stage's box on the Canvas view.

**Expected outcome:**
> The box has a plain white/light background (or dark background in dark mode) matching the panels elsewhere on the page, a thin grey border, and rounded corners — not a bright, saturated cyan fill with a thick black border.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Clicking a stage node to select it doesn't turn it solid red

**Covers:** AC2

**Steps:**
1. Click directly on a stage box (not on any of its buttons or links) to select it.

**Expected outcome:**
> The box takes on a light accent-tinted background with an accent-coloured border — the same accent colour used for buttons/links elsewhere in the app. It does not turn solid red.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The connection dots on a stage node match the app's palette, not yellow

**Covers:** AC3

**Steps:**
1. Look closely at the small round dots on the left and right edges of a stage box (these are the connection points).

**Expected outcome:**
> Both dots look the same as each other — a light background with a thin grey border. Neither dot is bright yellow.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The lines connecting stages are thin and grey, not thick steel-blue

**Covers:** AC4

**Steps:**
1. Look at the line connecting one stage box to the next.

**Expected outcome:**
> The connecting line is a thin, muted grey line — the same grey used for borders and dividers elsewhere in the app. It is not a thick, bright steel-blue line.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Switching to dark mode changes the node colours too, not just the rest of the page

**Covers:** AC5

**Steps:**
1. Switch the app (or your system) to dark mode.
2. Look at the stage boxes on the Canvas view again.

**Expected outcome:**
> The stage boxes, their borders, and the connecting lines all switch to their own dark-mode colours — matching the rest of the page's dark-mode look. Nothing on the Canvas view still shows the old bright light-mode colours.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
