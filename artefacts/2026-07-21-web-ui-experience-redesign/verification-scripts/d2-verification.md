# AC Verification Script: Persistent viewing-as banner, exit flow, and permission-scoped visibility

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/d2-banner-exit-and-permission-scoped-visibility.md`
**Technical test plan:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/d2-test-plan.md`
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:** You need a real admin account and at least two other test accounts to impersonate — one a regular user, one another admin (if available).

---

## Scenarios

### 🔴 Scenario 1 — Banner is impossible to miss and follows you everywhere (AC1)
1. Start impersonating a test user.
2. Visit at least 3 different pages (e.g. Home, a product, Settings).

**Expected:** A striped, clearly-worded banner ("Viewing as [user]...") stays visible at the very top of every single page. There is no way to close or hide it except by exiting impersonation.

### 🔴 Scenario 2 — Impersonating a regular user hides your own admin powers (AC2)
1. Impersonate a non-admin test user.
2. Look at the sidebar and Settings page.

**Expected:** No "Admin credits" link, no "Credits" or "Impersonate" tab in Settings — even though you (the real admin) are the one driving the browser.

### 🔴 Scenario 3 — Impersonating another admin shows their real access (AC3)
1. Impersonate a test account that IS an admin.
2. Look at the sidebar and Settings page.

**Expected:** Admin items ARE visible this time — because the person you're viewing as really does have that access.

### 🔴 Scenario 4 — Exit fully restores you (AC4)
1. While impersonating, click "Exit impersonation".
2. Check the sidebar and Settings again.

**Expected:** The banner disappears immediately. You're back to your own real admin identity with your own real permissions — nothing from the impersonated session lingers.

---

## Summary

| Scenario | Pass/Fail | Notes |
|----------|-----------|-------|
| 1 — Persistent banner 🔴 | | |
| 2 — Non-admin visibility scoping 🔴 | | |
| 3 — Admin-target visibility accuracy 🔴 | | |
| 4 — Exit fully restores 🔴 | | |
