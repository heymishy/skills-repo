# AC Verification Script: Build the isEnabled() flag helper shared by API and UI

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.1-isenabled-helper.md
**Technical test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.1-isenabled-helper-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Ask the developer to give you a small test page or command they can run that shows the result of asking "is this feature switched on?" for a made-up feature name and a made-up customer name. You don't need to see any real customer data — a placeholder name like "acme" is fine.
2. Ask the developer to show you two different places in the running app that would ask this same question (for example, one part that decides what an API request returns, and one part that decides what appears on screen). You are checking that both places give the same answer, not testing PostHog itself.
3. No PostHog account access or browser is required for this script — everything can be demonstrated with test doubles ("pretend" PostHog responses) that the developer sets up in advance.

**Reset between scenarios:** Ask the developer to reset the "pretend PostHog" answer back to its default between each scenario, so one scenario's setup doesn't leak into the next.

---

## Scenarios

---

### Scenario 1: The helper reports a feature as "on" when PostHog says it's on

**Covers:** AC1

**Steps:**
1. Ask the developer to set the pretend PostHog answer to "on" for a feature called "wizard-ui" for a customer called "acme".
2. Ask the developer to run the check for "is wizard-ui on for acme?"

**Expected outcome:**
> The answer comes back as "on" (true) — matching exactly what the pretend PostHog was set to say.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The helper refuses to guess if it hasn't been connected to PostHog yet

**Covers:** AC2

**Steps:**
1. Ask the developer to run the check for "is wizard-ui on for acme?" using a version of the app that has not yet been told how to talk to PostHog (nothing has been "wired up").

**Expected outcome:**
> The app does not quietly answer "off" as if nothing were wrong. Instead, it stops and shows this exact message: "Adapter not wired: posthogFlagsAdapter. Call setPostHogFlagsAdapter() before use." This is a deliberate safety check — it means a real misconfiguration is visible immediately rather than silently treating every feature as switched off.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Two different parts of the app agree on the same answer

**Covers:** AC3

**Steps:**
1. Ask the developer to set the pretend PostHog answer to "on" for "wizard-ui" for "acme".
2. Ask the developer to show you the answer as reported by the part of the app that handles API requests.
3. Ask the developer to show you the answer as reported by the part of the app that decides what to display on screen.

**Expected outcome:**
> Both parts report exactly the same answer ("on"). Ask the developer to confirm both parts are using the same underlying check, not two separate copies that happen to agree today but could disagree later.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A PostHog outage does not break the app

**Covers:** AC4

**Steps:**
1. Ask the developer to simulate PostHog being unreachable (a network failure or timeout) when the check for "is wizard-ui on for acme?" is made.

**Expected outcome:**
> The app does not crash and does not show an error page. It quietly treats the feature as "off" (the documented safe fallback) and continues normally.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: No customer secrets are sent to PostHog when checking a flag

**Covers:** Security NFR

**Steps:**
1. Ask the developer to run the "is this feature on?" check while including a fake login token in the information passed along.
2. Ask the developer to show you exactly what information was sent to (or would be sent to) PostHog.

**Expected outcome:**
> The login token does not appear anywhere in the information sent to PostHog.

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
