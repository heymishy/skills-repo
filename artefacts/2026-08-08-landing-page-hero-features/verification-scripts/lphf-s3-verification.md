# AC Verification Script: Cryptographic instruction-set verification hero card

**Story reference:** artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s3-cryptographic-verification-hero-card.md
**Technical test plan:** artefacts/2026-08-08-landing-page-hero-features/test-plans/lphf-s3-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Load the landing page at `/` in a browser.
2. Scroll to the cryptographic-verification hero card.

**Reset between scenarios:** Reload the page between scenarios.

---

## Scenarios

---

### Scenario 1: The hero card shows a real, checkable proof example — not just a claim

**Covers:** AC1, AC2

**Steps:**
1. Read the hero card's headline and one-sentence description.
2. Look at the example hash value shown alongside the file it corresponds to.

**Expected outcome:**
> The card shows a real-looking hash value paired with a named instruction-set file, and explains that this hash can be independently recomputed and checked — not just "trust us, it's secure." The words "recomputable" or "independently verifiable" appear somewhere in the card's text.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The card reads correctly on a small phone screen and a wide desktop screen

**Covers:** AC3

**Steps:**
1. Resize the browser window to about 320 pixels wide. Check for cut-off text or a horizontal scrollbar.
2. Resize to about 1280 pixels wide and check again.

**Expected outcome:**
> At both sizes, all of the card's text and the hash example remain fully visible without needing to scroll sideways.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
