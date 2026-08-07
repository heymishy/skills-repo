# AC Verification Script: Offer the formed-idea/rough-idea choice when creating a new feature from a product's page

**Story reference:** artefacts/2026-07-24-product-new-feature-idea-choice/stories/pnfc-s1.md
**Technical test plan:** artefacts/2026-07-24-product-new-feature-idea-choice/test-plans/pnfc-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Log in and open a product's page.

**Reset between scenarios:** Start a fresh "New feature" click each time.

---

## Scenarios

### Scenario 1: Creating a new feature asks how formed your idea is

**Covers:** AC1

**Steps:**
1. Click "New feature" on a product's page.

**Expected outcome:** You're asked to choose between "Rough idea" and "Formed idea" — not sent straight into a discovery session.

**Pass / Fail:** ___

---

### Scenario 2: Choosing "Rough idea" takes you to the idea-exploration flow

**Covers:** AC2

**Steps:**
1. Click "New feature", choose "Rough idea", confirm.

**Expected outcome:** You land in the rough-idea (`/ideate`) conversation, not discovery.

**Pass / Fail:** ___

---

### Scenario 3: Choosing "Formed idea" still works exactly as before

**Covers:** AC3

**Steps:**
1. Click "New feature", choose "Formed idea", confirm.

**Expected outcome:** You land in the discovery conversation, same as today.

**Pass / Fail:** ___

---

### Scenario 4: A rough-idea feature still shows up on the product's page

**Covers:** AC4

**Steps:**
1. After Scenario 2, go back to the product's page.

**Expected outcome:** The new feature you just started appears in the product's feature list.

**Pass / Fail:** ___

---

## Summary

Total scenarios: 4 | Manual gap scenarios: 0
