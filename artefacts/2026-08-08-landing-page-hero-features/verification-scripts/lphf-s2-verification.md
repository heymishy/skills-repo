# AC Verification Script: Scope-contract enforcement hero card

**Story reference:** artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s2-scope-contract-enforcement-hero-card.md
**Technical test plan:** artefacts/2026-08-08-landing-page-hero-features/test-plans/lphf-s2-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Load the landing page at `/` in a browser.
2. Scroll to the scope-contract-enforcement hero card.

**Reset between scenarios:** Reload the page between scenarios.

---

## Scenarios

---

### Scenario 1: The hero card explains how the platform stops an AI agent from doing more than asked

**Covers:** AC1, AC2

**Steps:**
1. Read the hero card's headline and one-sentence description.
2. Look at the accompanying example visual.

**Expected outcome:**
> The card names a real, specific mechanism — a locked list of files an AI agent is allowed to touch, checked against what actually changed before anything is merged. It does not use vague phrases like "safe AI" or "guardrails" without explaining what those words actually mean here.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The card reads correctly on a small phone screen and a wide desktop screen

**Covers:** AC3

**Steps:**
1. Resize the browser window to a narrow phone width (about 320 pixels wide).
2. Check the hero card — is any text or the example cut off, or does a horizontal scrollbar appear?
3. Resize back to a wide desktop width (about 1280 pixels wide) and check again.

**Expected outcome:**
> At both sizes, all of the card's text and its example are fully visible without needing to scroll sideways.

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
