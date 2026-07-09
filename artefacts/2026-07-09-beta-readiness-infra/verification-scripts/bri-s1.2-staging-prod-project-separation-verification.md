# AC Verification Script: Separate staging and prod PostHog projects with isolated API keys

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.2-staging-prod-project-separation.md
**Technical test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.2-staging-prod-project-separation-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Ask the developer to prepare two made-up connection codes — one labelled "staging" and one labelled "production" — neither needs to be a real PostHog account key.
2. Ask the developer to show you how to start the app pretending to be in the "staging" setting, and separately pretending to be in the "production" setting.
3. No real PostHog dashboard access is needed for this script — everything is demonstrated with placeholder codes.

**Reset between scenarios:** Ask the developer to restart the app fresh (or reset its configuration) between scenarios so one scenario's setting doesn't carry over into the next.

---

## Scenarios

---

### Scenario 1: Staging uses the staging connection code only

**Covers:** AC1

**Steps:**
1. Ask the developer to start the app set to "staging."
2. Ask the developer to show you which connection code the app is using when it talks to PostHog.

**Expected outcome:**
> The app is using the staging connection code — not the production one.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Production uses the production connection code only

**Covers:** AC2

**Steps:**
1. Ask the developer to start the app set to "production."
2. Ask the developer to show you which connection code the app is using when it talks to PostHog.

**Expected outcome:**
> The app is using the production connection code — not the staging one.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: When both codes exist at once, staging still picks the staging one

**Covers:** AC3

**Steps:**
1. Ask the developer to set up the app so that both the staging code and the production code are present in its configuration at the same time.
2. Ask the developer to start the app set to "staging."
3. Ask the developer to show you which code it picked.

**Expected outcome:**
> Even though both codes were available, the app picked the staging code, not the production one.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A missing staging code produces a clear message, not a silent switch to production

**Covers:** AC4

**Steps:**
1. Ask the developer to set up the app for "staging" but deliberately leave out the staging connection code.
2. Ask the developer to start the app and show you what appears in the startup messages.

**Expected outcome:**
> The startup messages clearly say the staging connection code is missing (naming it specifically). The app does not quietly start using the production code instead.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The startup message never reveals the actual connection code

**Covers:** Audit NFR

**Steps:**
1. Ask the developer to start the app in either setting and show you the full startup message text.

**Expected outcome:**
> The message says which project (staging or production) is active, but never prints the actual connection code value itself.

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

---

**Note for the reviewer:** this story's epic also names a live check — confirming that test activity generated on the real staging site never shows up in the real production PostHog project. That check cannot be run yet because the real staging site does not exist. It is deliberately deferred and tracked separately, not silently skipped.
