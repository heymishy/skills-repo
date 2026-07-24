# AC Verification Script: Let an admin toggle the mock LLM gateway on/off from an in-app admin page

**Story reference:** artefacts/2026-07-24-admin-mock-gateway-toggle/stories/amgt-s1.md
**Technical test plan:** artefacts/2026-07-24-admin-mock-gateway-toggle/test-plans/amgt-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Log in as an admin user on a non-production (staging or local test) environment.

**Reset between scenarios:** Reload the admin toggle page between scenarios.

---

## Scenarios

### Scenario 1: You can see whether mock or real model calls are currently active

**Covers:** AC1

**Steps:**
1. Open the admin toggle page.

**Expected outcome:** It clearly shows whether mock responses or real model calls are currently in effect.

**Pass / Fail:** ___

---

### Scenario 2: Flipping the toggle works immediately

**Covers:** AC2

**Steps:**
1. Flip the toggle to the opposite state.
2. Drive a real skill turn right after (e.g. start a discovery session and send a message).

**Expected outcome:** The turn behaves according to the NEW toggle state — no need to wait, restart, or redeploy anything.

**Pass / Fail:** ___

---

### Scenario 3: The toggle honestly explains what happens on restart

**Covers:** AC3

**Steps:**
1. Read the text on the toggle page.

**Expected outcome:** It clearly says the setting will reset back to the configured default if the server restarts — it doesn't claim to be permanent if it isn't.

**Pass / Fail:** ___

---

### Scenario 4: Production is never affected by this toggle

**Covers:** AC4

**Steps:**
1. (With engineering help) confirm that on the real production environment, flipping this toggle has no effect — real model calls still can't be swapped for mocked ones there.

**Expected outcome:** Production behaviour is completely unaffected, regardless of the toggle's state.

**Pass / Fail:** ___

---

### Scenario 5: Only an admin can use this

**Covers:** AC5

**Steps:**
1. Try to reach the toggle page while logged in as a non-admin user, or logged out entirely.

**Expected outcome:** Access is denied, the same way it already is for the admin credits page.

**Pass / Fail:** ___

---

## Summary

Total scenarios: 5 | Manual gap scenarios: 0
