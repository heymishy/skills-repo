# AC Verification Script: Add a timezone and date-format preference to Settings

**Story reference:** artefacts/2026-08-17-settings-improvements/stories/si-s2-locale-preference.md
**Technical test plan:** artefacts/2026-08-17-settings-improvements/test-plans/si-s2-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in to the app (staging or local) as a user who has never set a locale preference before.
2. Go to Settings, Profile tab.

**Reset between scenarios:** Scenario 3 depends on Scenario 2's save having happened — run them in order.

---

## Scenarios

---

### Scenario 1: Locale form shows sensible defaults for a first-time visit

**Covers:** AC1

**Steps:**
1. Go to Settings, Profile tab, for a user who has never saved a locale preference.

**Expected outcome:**
> A timezone dropdown and a date-format dropdown are both visible, and both already show a sensible default selection (not blank/unselected).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Saving a locale preference shows a confirmation

**Covers:** AC2

**Steps:**
1. Change the timezone dropdown to a different value (e.g. "America/New_York").
2. Change the date-format dropdown to a different value.
3. Click Save.

**Expected outcome:**
> A confirmation message appears on the page (same visual style as the existing billing error/success banners). No error is shown.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Saved locale preference persists after reload

**Covers:** AC3

**Steps:**
1. Immediately after Scenario 2, reload the page (F5).
2. Look at the timezone and date-format dropdowns.

**Expected outcome:**
> Both dropdowns show the values you saved in Scenario 2, not the original defaults.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Submitting an invalid timezone is rejected with a clear message

**Covers:** AC4

**Steps:**
1. Use your browser's developer tools (or a request tool) to submit the locale form with an invalid timezone value, e.g. `"NotARealTimezone"`. (This step may require a developer's help — if you cannot simulate an invalid submission through the normal UI dropdown, note that and mark this scenario as "unable to test via UI".)

**Expected outcome:**
> The page shows an error message specifically naming the timezone as invalid (not a generic "something went wrong"). Reloading the page afterward shows your previous saved value is unchanged — nothing was partially saved.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: AC5 and AC6 are automated-only, not manual scenarios

**Covers:** AC5, AC6

AC5 (identity resolution returning no match) describes a session state that should not occur for a real signed-in user and cannot be reliably reproduced through the normal UI — it is covered entirely by the automated integration test `localePreferenceNullPersonResolutionRejectedCleanly` in the technical test plan. AC6 (the PostHog analytics event firing) has no visible on-screen effect for a human tester to check — it is covered by the automated unit test `localePreferenceSaveFiresPostHogEvent`. No manual step is required for either; this entry exists so both ACs are accounted for in this script rather than silently missing.

**Result:** N/A — covered by automated tests only
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 | | |
| Edge case (AC5/AC6) | N/A | Automated coverage only |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
