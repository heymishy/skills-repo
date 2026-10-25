# AC Verification Script: Dashboard-shell UX/CX parity and scope/benefit summary

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s6-dashboard-shell-parity.md
**Technical test plan:** artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s6-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Log in to the product as a tenant Product Owner with at least one product and one DoD-complete feature with captured evidence.
2. Make sure that feature's connected repo has both a `discovery.md` and a `benefit-metric.md` file, for the main scenarios.
3. A modern browser — resizing the window is required for the last scenario.

**Reset between scenarios:** No reset needed for Scenarios 1–3 and 5 (same page, same feature). Scenario 4 needs a *different* feature whose repo is missing one or both of those files — use an older feature if one's available, or ask the engineer running this session to point you at one.

---

## Scenarios

---

### Scenario 1: The page looks like the rest of the product, not a separate tool

**Covers:** AC1

**Steps:**
1. Open the capture-evidence page for your feature.
2. Look at the top and left side of the page.

**Expected outcome:**
> You see the same navigation bar and left-hand Products sidebar (your list of products, "+ New product") as every other page in the product — not a plain, unstyled page with nothing around it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: You can see what the feature was supposed to do and why, before looking at evidence

**Covers:** AC2

**Steps:**
1. On the same page, look above the list of acceptance criteria.

**Expected outcome:**
> You see a "Scope" section describing the problem the feature solves, and a "Benefit" section listing the metric targets it was meant to move — pulled from that feature's own written discovery and benefit docs, not generic text.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: You can tell at a glance how much evidence has been captured

**Covers:** AC3

**Steps:**
1. Look just above the individual AC list.

**Expected outcome:**
> You see a single line telling you how many of the ACs have captured evidence — e.g. "5 of 7 ACs have captured evidence" — worded clearly, not just a colored bar with no text.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A feature missing its scope/benefit docs still shows a working page

**Covers:** AC4

**Steps:**
1. Open the capture-evidence page for a feature whose connected repo is missing `discovery.md` and/or `benefit-metric.md`.

**Expected outcome:**
> Instead of a blank section or an error, you see a message that specifically names which file is missing — e.g. "discovery.md not found in the connected repo" — not a generic "not available" message. The rest of the page (AC list, capture buttons) still works normally.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: The existing capture buttons still work after the redesign

**Covers:** AC5

**Steps:**
1. Click "Capture evidence" on any AC that hasn't been captured yet.

**Expected outcome:**
> It works exactly as before — the capture runs and the result appears. Nothing about the new look has broken the button.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The page still works on a narrow (phone-width) screen

**Covers:** AC6

**Steps:**
1. Make your browser window narrow (or use your browser's device-emulation mode set to a phone width, around 375px).
2. Reload the page and look at the Scope/Benefit sections.

**Expected outcome:**
> The Scope and Benefit sections stack one above the other (not squeezed side-by-side). There's no horizontal scrollbar, and nothing is cut off or overlapping.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1) | | |
| Scenario 2 (AC2) | | |
| Scenario 3 (AC3) | | |
| Scenario 4 (AC4) | | |
| Scenario 5 (AC5) | | |
| Edge case (AC6) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
