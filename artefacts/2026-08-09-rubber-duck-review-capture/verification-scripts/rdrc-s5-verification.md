# AC Verification Script: Suggest rubber-duck review for eligible hero/customer-facing stories

**Story reference:** artefacts/2026-08-09-rubber-duck-review-capture/stories/rdrc-s5-suggest-review-for-eligible-stories.md
**Technical test plan:** artefacts/2026-08-09-rubber-duck-review-capture/test-plans/rdrc-s5-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have two example stories ready to run `/definition-of-done` (or `/branch-complete`, whichever this ships against) on: one that's clearly hero/customer-facing (e.g. a web-ui landing-page feature), one that's clearly internal tooling.

**Reset between scenarios:** Not needed.

---

## Scenarios

---

### Scenario 1: An eligible story gets nudged

**Covers:** AC1

**Steps:**
1. Run the completion skill on the hero/customer-facing story.
2. Read the output.

**Expected outcome:**
> Somewhere in the output, you see a suggestion to run a rubber-duck review, naming which mode to use (the human-narrated tool, and the agent-driven mode too, once that exists).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A non-eligible story doesn't get nudged

**Covers:** AC2

**Steps:**
1. Run the same completion skill on the internal-tooling story.
2. Read the output.

**Expected outcome:**
> No rubber-duck-review suggestion appears anywhere — the output looks exactly like it would have before this feature existed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Ignoring the suggestion doesn't break anything

**Covers:** AC3

**Steps:**
1. Run the completion skill on the eligible story again.
2. When the suggestion appears, ignore it and let the skill finish normally.

**Expected outcome:**
> The skill completes exactly as normal — same pass/fail result, same fields recorded, nothing missing or blocked because you didn't act on the suggestion.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The eligibility rule is easy to change without editing skill files

**Covers:** AC4

**Steps:**
1. Find where the eligibility rule (which domains/tags count) actually lives.

**Expected outcome:**
> It's a clearly-named, separate list or setting — not buried in the middle of a skill's instruction text. You could add a new eligible domain by editing that one place.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
