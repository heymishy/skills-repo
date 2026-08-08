# AC Verification Script: Self-improving harness hero card

**Story reference:** artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s4-self-improving-harness-hero-card.md
**Technical test plan:** artefacts/2026-08-08-landing-page-hero-features/test-plans/lphf-s4-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Load the landing page at `/` in a browser.
2. Scroll to the self-improving-harness hero card.
3. Have a copy of `workspace/learnings.md` open so you can count its entries.

**Reset between scenarios:** Reload the page between scenarios.

---

## Scenarios

---

### Scenario 1: The card shows a real, current number — not a stale or made-up one

**Covers:** AC1, AC2

**Steps:**
1. Read the number shown on the card (e.g. "246 learnings captured").
2. Count the actual number of entries in `workspace/learnings.md`.
3. Compare the two.

**Expected outcome:**
> The number on the card matches the real count in `workspace/learnings.md` as of the last time the page content was updated (it does not need to update itself live as you watch, but it should not be an obviously old or invented number).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The card explains that a human checks every change

**Covers:** AC3

**Steps:**
1. Read the hero card's text.

**Expected outcome:**
> The text explicitly says a person reviews and approves changes before they're applied — not just that the system "improves itself" with no mention of human oversight.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The card reads correctly on a small phone screen and a wide desktop screen

**Covers:** AC4

**Steps:**
1. Resize the browser window to about 320 pixels wide. Check for cut-off text or a horizontal scrollbar.
2. Resize to about 1280 pixels wide and check again.

**Expected outcome:**
> At both sizes, all of the card's text remains fully visible without needing to scroll sideways.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
