# AC Verification Script: Restructure account-level nav items and add a dangling-link regression test

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/b2-account-nav-restructure-and-dangling-link-test.md`
**Technical test plan:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/b2-test-plan.md`
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:** You'll need to sign in once as a regular (non-admin) account and once as an admin account.

---

## Scenarios

### Scenario 1 — Regular user's sidebar (AC1)
1. Sign in as a non-admin user. Look at the bottom of the sidebar.

**Expected:** You see "Settings" and your identity/sign-out, but no "Admin credits" link anywhere.

### Scenario 2 — Admin's sidebar (AC2)
1. Sign in as an admin. Look at the bottom of the sidebar.

**Expected:** You see "Admin credits" in addition to Settings and your identity.

---

## Summary

| Scenario | Pass/Fail | Notes |
|----------|-----------|-------|
| 1 — Non-admin sidebar | | |
| 2 — Admin sidebar | | |
