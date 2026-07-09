# AC Verification Script: Bootstrap flags server-side on session start to avoid UI flicker

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.3-server-side-bootstrap.md
**Technical test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.3-server-side-bootstrap-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Ask the developer to set a made-up feature switch to "on" or "off" before loading the page (so you can control what you expect to see).
2. Have a way to view the very first version of the page the server sends back, before any extra scripts run — the developer can show you this using their browser's "view page source" option or an equivalent developer tool.
3. No PostHog account access is required — everything is demonstrated with a test double standing in for PostHog.

**Reset between scenarios:** Ask the developer to start a brand new browser session (or clear cookies) between scenarios, since this feature is about what happens once, at the start of a session.

---

## Scenarios

---

### Scenario 1: The page loads already showing the right thing — no flash

**Covers:** AC1

**Steps:**
1. Ask the developer to set the made-up feature switch to "on."
2. Load the page for the first time in a fresh browser session.
3. Immediately view the page's source (before doing anything else on the page).

**Expected outcome:**
> The gated part of the page is already present in that very first source view. You should not see it appear a moment after the page loads — it is there from the start.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Toggling the switch mid-session does not change the current page

**Covers:** AC2

**Steps:**
1. Load the page with the switch set to "on."
2. Without reloading the page, ask the developer to flip the switch to "off" behind the scenes.
3. Look at the page you already have open — do not reload it.

**Expected outcome:**
> The page you already have open still shows the gated part as it was when you first loaded it. The change only takes effect the next time you start a new session (for example, reloading the page).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A slow PostHog response doesn't freeze the page

**Covers:** AC3

**Steps:**
1. Ask the developer to simulate PostHog being slow or unreachable while the page is loading.
2. Load the page.

**Expected outcome:**
> The page still loads within a reasonable time — it does not hang or spin forever waiting on PostHog. The gated part falls back to its safe "off" state.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The first response already matches the switch, with a real automated check

**Covers:** AC4

**Steps:**
1. Ask the developer to run the automated Playwright check with the switch forced "on," then again with it forced "off."

**Expected outcome:**
> In both runs, the automated check confirms the gated part's presence or absence matches the switch, and that this is true of the very first page response — not something that changes a moment later.

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
