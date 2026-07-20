# AC Verification Script: Settings page shell with Profile tab

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/c1-settings-shell-and-profile-tab.md`
**Technical test plan:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/c1-test-plan.md`
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:** Sign in with an account that only has GitHub linked (not Google).

---

## Scenarios

### Scenario 1 — Settings looks like the rest of the app (AC1)
1. Click "Settings" in the sidebar.

**Expected:** The page has the same header, sidebar, and overall look as every other page in the app — not a plain, unstyled page.

### Scenario 2 — Profile shows your identity and linked methods (AC2)
1. Look at the Profile tab.

**Expected:** You see your name/avatar and "GitHub: Linked", "Google: Not linked".

🟡 **Manual scenario — AC3 (real OAuth round-trip):**
1. Click "Link Google account".
2. Complete the Google sign-in prompt with a real test Google account.
3. Return to the Settings page.

**Expected:** Google now shows as "Linked" without a "Link" button.

### Scenario 4 — Fully linked account shows no dead-end button (AC4)
1. Using an account with both GitHub and Google linked, look at the Profile tab.

**Expected:** Both show "Linked" — no "Link" button appears for either.

---

## Summary

| Scenario | Pass/Fail | Notes |
|----------|-----------|-------|
| 1 — Shared shell | | |
| 2 — Identity + linked methods | | |
| 3 — Real Google link round-trip | | |
| 4 — No dead-end control | | |
