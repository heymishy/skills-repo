# AC Verification Script: Impersonation audit log

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/d3-impersonation-audit-log.md`
**Technical test plan:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/d3-test-plan.md`
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:** Complete at least one impersonation session (start and exit) before checking the log.

---

## Scenarios

### Scenario 1 — Past sessions are fully visible (AC1)
1. Go to Settings → Impersonate. Scroll to "Recent impersonation sessions".

**Expected:** You see who impersonated whom, which tenant, the reason given, and when it started and ended, for every past session.

### Scenario 2 — An in-progress session shows as still open (AC2)
1. Start impersonating someone but don't exit yet. Open a new tab/session as admin and check the audit list (or check after exiting, looking at the entry).

**Expected:** The in-progress entry shows a start time but clearly shows it hasn't ended yet — not blank, not a made-up end time.

### Scenario 3 — Nobody else can see this (AC3)
1. Sign in as a non-admin. Try to reach the audit log directly (e.g. via its URL/API, not just checking it's hidden in the menu).

**Expected:** Access is refused.

### Scenario 4 — Empty state (AC4)
1. On a brand-new platform/tenant with zero impersonation history, check the audit list.

**Expected:** A clear "No impersonation sessions yet" message.

---

## Summary

| Scenario | Pass/Fail | Notes |
|----------|-----------|-------|
| 1 — Past sessions visible | | |
| 2 — In-progress state | | |
| 3 — Access restricted | | |
| 4 — Empty state | | |
