# AC Verification Script: Wire tenant-level flag targeting via PostHog group analytics

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.4-tenant-level-targeting.md
**Technical test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.4-tenant-level-targeting-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Ask the developer to set up two made-up companies (teams) — for example "Acme" and "Globex" — each with at least one made-up person.
2. Ask the developer to show you how to check "is this feature on?" for any one of those made-up people.
3. No real PostHog dashboard access is required — everything is demonstrated with a test double.

**Reset between scenarios:** Ask the developer to reset the made-up feature-switch targeting back to its default between scenarios.

---

## Scenarios

---

### Scenario 1: Everyone on the same team sees the same answer

**Covers:** AC1

**Steps:**
1. Ask the developer to check "is this feature on?" for Person A at Acme.
2. Ask the developer to check "is this feature on?" for Person B, also at Acme.

**Expected outcome:**
> Both Person A and Person B get exactly the same answer.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Turning a feature on for one team doesn't turn it on for another

**Covers:** AC2

**Steps:**
1. Ask the developer to set a made-up feature to "on" for Acme only.
2. Check "is this feature on?" for a person at Acme.
3. Check the same question for a person at Globex (a different company).

**Expected outcome:**
> The person at Acme gets "on." The person at Globex gets "off."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The app copes if a company is being set up for the very first time

**Covers:** AC3

**Steps:**
1. Ask the developer to simulate a brand-new company being registered with PostHog for the first time, where the registration step is deliberately made to fail or run late.
2. Ask the developer to check "is this feature on?" for a person at that brand-new company right after.

**Expected outcome:**
> The app does not crash or show an error. It answers with the safe default ("off") and continues working normally.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A company of exactly one person works the same way as a bigger company

**Covers:** AC4

**Steps:**
1. Ask the developer to set up a made-up company with only one person in it.
2. Ask the developer to toggle a feature for that one-person company.

**Expected outcome:**
> The toggle works the same way it would for a bigger company — there is no special extra step or different behaviour just because there's only one person.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A person can't pretend to belong to a different company to get a feature turned on

**Covers:** Security NFR

**Steps:**
1. Ask the developer to simulate a request where the person's real company (from their login session) is Acme, but the request itself claims to be from Globex.
2. Ask the developer to show you which company's setting was actually used.

**Expected outcome:**
> The person's real company (Acme, from their login session) is used — the claimed company in the request is ignored.

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
