# AC Verification Script: NFR-security review and hardening pass for Admin User Impersonation

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/d4-nfr-security-review-and-hardening.md`
**Technical test plan:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/d4-test-plan.md`
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:** D1, D2, and D3 must all be implemented and merged (or at least implemented on a branch you can inspect). This is a code-review activity, not a click-through — you'll need to read the actual implementation alongside clicking through the app.

---

## Scenarios

### 🔴 Scenario 1 — Every admin surface is checked, not just the obvious ones (AC1)
1. Run `grep -rn "requireAdmin" src/web-ui/` yourself and list every result.
2. For each one, impersonate a non-admin test user and try to reach that surface directly (URL or button).

**Expected:** Every single one is inaccessible while impersonating a non-admin — including any admin surface you didn't already know about before running the grep.

### 🔴 Scenario 2 — Nothing lingers after exiting (AC2)
1. Impersonate a user, exit, then impersonate a *different* user.

**Expected:** The second impersonation shows exactly that second user's data — nothing from the first session appears mixed in.

### 🔴 Scenario 3 — Rapid actions during start-up don't cause confusion (AC3)
1. Start an impersonation session and immediately (within the same second) click something else — refresh, or click a nav item — before the page fully settles.

**Expected:** You never see a broken mix — e.g. your own name with the target's permissions, or vice versa. Worst case, one action briefly shows a loading state, but it never shows an inconsistent identity.

### 🔴 Scenario 4 — Audit log matches what was agreed (AC4)
1. Confirm with whoever built this: is the audit log visible to every admin (not a subset)? Kept forever (no auto-delete)? Never emails or notifies the impersonated user?

**Expected:** All three match exactly what was decided — no surprises.

### 🔴 Scenario 5 — Any problem found above gets fixed, not just noted (AC5)

**Expected:** If any of scenarios 1–4 revealed a real gap, it's been fixed and re-verified before this story is marked done — not left as a "known issue" to ship anyway.

---

## Summary

| Scenario | Pass/Fail | Notes |
|----------|-----------|-------|
| 1 — Every admin surface checked 🔴 | | |
| 2 — No residual state 🔴 | | |
| 3 — Concurrent-action safety 🔴 | | |
| 4 — Audit log matches agreement 🔴 | | |
| 5 — Gaps fixed, not just noted 🔴 | | |
