# AC Verification Script: Build the agent-driven Playwright review and validate it against a seeded issue set

**Story reference:** artefacts/2026-08-09-rubber-duck-review-capture/stories/rdrc-s3-agent-driven-review-validation-set.md
**Technical test plan:** artefacts/2026-08-09-rubber-duck-review-capture/test-plans/rdrc-s3-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Check out a local build of this repo at the commit just before `gtcl-s1` merged (both golden-trace candidates still present) — this is fixture 1.
2. Separately, have a build ready at the commit just before `lcdf-s1` merged (learnings count shows 0) — this is fixture 2.
3. Have a build ready at current `master` (both fixed) — this is the clean fixture.
4. Make sure the mock LLM gateway is switched ON before running anything — this must never make a real, billed LLM call.

**Reset between scenarios:** Switch to the relevant fixture's commit before each scenario.

---

## Scenarios

---

### Scenario 1: The agent-driven review actually runs and says something

**Covers:** AC1

**Steps:**
1. With fixture 1 checked out, run the agent-driven review against the landing page.
2. Read the commentary it produces.

**Expected outcome:**
> You get back real, non-empty written commentary describing what the agent observed while looking at the page — not an empty result, not an error.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The commentary actually catches at least one real bug

**Covers:** AC2

**Steps:**
1. Run the review against fixture 1 (both golden-trace candidates visible) and separately against fixture 2 (learnings count shows 0).
2. Read both sets of commentary.

**Expected outcome:**
> For at least one of the two fixtures, the commentary specifically calls out the real issue — either noticing both a "kanban" and a "diagram" demo section when there should be one, or noticing the learnings count looks wrong/zero. It shouldn't be generic praise that misses the problem entirely.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The overall detection rate meets the bar

**Covers:** AC3

**Steps:**
1. Using the results from Scenario 2 (plus any additional known-gap fixtures you've added), count how many the agent correctly flagged out of the total tested.

**Expected outcome:**
> At least half (50%) of the known-gap fixtures are correctly flagged. Write down the actual count (e.g. "1 out of 2").

**Result:** [ ] Pass  [ ] Fail
**Notes:** Detected: _____ / Total: _____

---

### Scenario 4: The agent doesn't invent problems that aren't there

**Covers:** AC4

**Steps:**
1. Switch to the clean fixture (current `master`, both bugs already fixed).
2. Run the review against the landing page.
3. Read the commentary.

**Expected outcome:**
> The commentary does not claim there are two golden-trace demo candidates, and does not claim the learnings count shows zero or looks wrong — because neither is true anymore. The agent can still comment on other, real things it notices; it just shouldn't fabricate a bug that was already fixed.

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
