# AC Verification Script: Audit-log promotion request, approval, and rejection events

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s10-audit-log-promotion-events.md
**Technical test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s10-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to this platform's PostHog project dashboard (or equivalent event log viewer).

**Reset between scenarios:** Not needed.

---

## Scenarios

---

### Scenario 1: Requesting, approving, and rejecting a promotion each show up as separate events

**Covers:** AC1, AC2, AC3

**Steps:**
1. Submit a promotion request.
2. Check the PostHog event log for a `guardrail_promotion_requested` event.
3. Approve that request; check for `guardrail_promotion_approved`.
4. Submit and reject a second request; check for `guardrail_promotion_rejected`.

**Expected outcome:**
> Three distinct events appear in the log, each named correctly, each with the tenant/request details attached.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
