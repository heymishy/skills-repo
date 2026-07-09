# AC Verification Script: Signup → onboarding → first feature journey spec

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.2-signup-onboarding-journey.md
**Technical test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.2-signup-onboarding-journey-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Make sure the app is running with the mock LLM gateway active (`NODE_ENV=test` or the equivalent explicit test flag) so no real AI calls happen during this walkthrough.
2. Have a fresh, never-used email address ready for signup (do not reuse a seeded staging tenant's email).
3. Open the app in a browser at the signup page.

**Reset between scenarios:** Use a new, never-used email address for each fresh signup attempt (Scenario 1). Scenarios 2–4 can continue from the same account created in Scenario 1.

---

## Scenarios

---

### Scenario 1: Signing up leads to a dashboard with a way to start your first product

**Covers:** AC1

**Steps:**
1. Go to the signup page and create an account with a new email and password.
2. Complete whatever onboarding steps appear.

**Expected outcome:**
> After onboarding finishes, you land on a dashboard screen, and there is a clearly visible button or link to create your first product.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The whole outer loop can be driven from the browser, stage by stage

**Covers:** AC2

**Steps:**
1. From the dashboard, click through to create your first product.
2. Start your first feature and work through each stage in order: discovery, benefit-metric, definition, test-plan, definition-of-ready — using only the browser, no other tools.

**Expected outcome:**
> Each stage completes and automatically moves you on to the next one. You never have to leave the browser or manually intervene to advance a stage.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A passing readiness check lets the build stage go ahead

**Covers:** AC3

**Steps:**
1. Continue the same journey from Scenario 2 until it reaches the definition-of-ready check, filling it in so it is complete and passing.
2. Let the inner-loop build stage run.

**Expected outcome:**
> The screen shows a clear "gate pass" result — for example a green tick or "Passed" label — and the build stage proceeds.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A failing readiness check is shown clearly, and looks different from a pass

**Covers:** AC4

**Steps:**
1. Start a new journey the same way, but this time leave one stage deliberately incomplete (for example, an unresolved hard block at the definition-of-ready check).
2. Let the gate evaluate.

**Expected outcome:**
> The screen shows a clear "gate fail" result, visibly and textually different from the pass result seen in Scenario 3 — for example a red cross or "Failed" label with a reason, not the same green "Passed" indicator.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: This whole walkthrough never calls the real AI service

**Covers:** AC5

**Steps:**
1. While repeating Scenarios 1–4 with the mock gateway active, watch for any outgoing calls to the real GitHub Copilot Chat Completions API (for example, via network monitoring).

**Expected outcome:**
> Zero real calls to the AI service are made at any point in the walkthrough — every stage response comes from the mock gateway's canned fixtures, and the whole thing completes quickly and identically every time it's run.

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
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
