# AC Verification Script: Extend CSRF token protection to the remaining server-rendered POST forms

**Story reference:** artefacts/2026-08-17-remaining-csrf-form-coverage/stories/rcfc-s1-extend-csrf-to-remaining-forms.md
**Technical test plan:** artefacts/2026-08-17-remaining-csrf-form-coverage/test-plans/rcfc-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a logged-in test account ready, with at least one active feature/journey started and one product created.
2. Have your browser's developer tools open to the Network tab, or a tool like `curl`/Postman, so you can replay a request without its CSRF field.
3. This script covers 5 route groups (AC1–AC5). Each scenario below demonstrates the pattern on 1–2 representative routes from that group — the technical test plan covers every route in the group automatically; this script confirms the pattern itself is correct, not every individual route by hand.

**Reset between scenarios:** No shared state — each scenario is independent.

---

## Scenarios

---

### Scenario 1: Starting a new feature without a valid security token is rejected

**Covers:** AC1 (representative route: the "Start a new feature" form on the journey wizard page)

**Steps:**
1. Open the journey wizard page and start filling in the "Start a new feature" form.
2. Using your browser's dev tools (or a request-replay tool), resubmit the same form POST but remove or corrupt the hidden security field before sending.

**Expected outcome:**
> You see a blocked/denied response — the page does not show a new feature being started, and the exact text "Forbidden" is returned.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Starting a new feature normally still works exactly as before

**Covers:** AC1, AC5 (same representative route as Scenario 1)

**Steps:**
1. Open the journey wizard page normally (do not tamper with anything) and submit "Start a new feature" with a real feature name.

**Expected outcome:**
> The feature starts normally and you land on the discovery chat page — no difference from how this worked before.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Starting a new skill session without a valid security token is rejected

**Covers:** AC2 (representative route: the "Start" button on the skills list page — updated 2026-08-24; the original scenario named the artefact-annotation form, which was removed from AC2's scope after investigation found it is a JSON/fetch-only API with no live server-rendered `<form>` target — see `decisions.md`)

**Steps:**
1. Open the skills list page.
2. Using dev tools, resubmit the "Start" form's POST but remove or corrupt the hidden security field before sending.

**Expected outcome:**
> You see a blocked/denied response — no new skill session starts, and the exact text "Forbidden" is returned.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Starting a new skill session normally still works exactly as before

**Covers:** AC2, AC5 (same route as Scenario 3)

**Steps:**
1. Open the skills list page normally and click "Start" on any skill.

**Expected outcome:**
> A new skill session starts and you land on its chat page — no difference from how this worked before.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Creating a product without a valid security token is rejected

**Covers:** AC3 (representative route: product confirmation form)

**Steps:**
1. Start creating a new product and reach the "Confirm" step.
2. Using dev tools, resubmit the confirm request with the hidden security field removed.

**Expected outcome:**
> "Forbidden" is returned, and no new product appears in your product list.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: Creating a product normally still works exactly as before

**Covers:** AC3, AC5 (same route as Scenario 5)

**Steps:**
1. Repeat product creation without tampering with anything.

**Expected outcome:**
> The product is created and you land on the new product's page, exactly as before this change.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The old sign-in fallback page (shown to logged-out users on an unrecognised link) is also protected — and now actually works

**Covers:** AC4, AC5

**Steps:**
1. Log out.
2. Visit any URL on the site that doesn't correspond to a real page (e.g. a made-up path) — this should show a basic sign-in page rather than the polished landing page.
3. Enter valid sign-in credentials in that basic page's form and submit normally.

**Expected outcome:**
> You are signed in successfully. (Before this fix, this specific fallback page's sign-in form was actually broken — it would always fail with "Forbidden" no matter what credentials you entered, because the page was missing a required hidden field. This scenario confirms that's now fixed, not just theoretically protected.)

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — journey form rejected without token | | |
| Scenario 2 — journey form works normally | | |
| Scenario 3 — skill session start rejected without token | | |
| Scenario 4 — skill session start works normally | | |
| Scenario 5 — product creation rejected without token | | |
| Scenario 6 — product creation works normally | | |
| Edge case — legacy sign-in shell protected and working | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
