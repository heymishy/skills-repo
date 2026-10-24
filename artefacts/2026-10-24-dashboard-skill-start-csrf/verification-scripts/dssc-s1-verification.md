# AC Verification Script: Fix missing CSRF token on dashboard "Run a skill" start forms

**Story reference:** artefacts/2026-10-24-dashboard-skill-start-csrf/stories/dssc-s1-fix-missing-csrf-on-dashboard-skill-start-forms.md
**Technical test plan:** artefacts/2026-10-24-dashboard-skill-start-csrf/test-plans/dssc-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Scenarios

---

### Scenario 1: A real click on "Start →" on any dashboard skill card actually works

**Covers:** AC1, AC2, AC3

**Steps:**
1. Sign in to `wuce-staging.fly.dev` with a real GitHub account.
2. On the dashboard, click "Start →" on the Discovery skill card (or any other card).

**Expected outcome:**
> The browser lands on a real skill session page — not a `403 Forbidden` plain-text response.

**Result:** [ ] Pass [ ] Fail
**Notes:** Pre-fix baseline (2026-10-24): 3/3 attempts produced `403 Forbidden`, confirmed via `fly logs` showing `csrf_guard_check` with `submittedPrefix: "(empty)"` against a correctly-generated `expectedPrefix` — this is the bug this story fixes. Not yet re-verified live against a real deploy (automated test coverage above confirms the mechanism directly: AC3's `skillStartForm_withCorrectCsrfToken_passesGuard` proves a correctly-rendered form passes the real, unmocked `csrfGuard`). Re-run this scenario live on `wuce-staging.fly.dev` once this story's PR is merged and deployed, before closing out `/definition-of-done`.

---

### Scenario 2: No regression to the existing, already-working CSRF-protected forms

**Covers:** AC4

**Steps:**
1. Run the existing dashboard-related test files directly: `node tests/check-dsa-s2-dashboard-wiring.js`, `node tests/check-dsa-s2-product-dashboard-wiring.js`, `node tests/check-dsa-s2-pending-actions-mapping.js`, `node tests/check-npwe-s1-skills-nav-wiring.js`, `node tests/check-wuce18-html-shell.js`, `node tests/check-wuce23-skill-launcher-landing.js`, `node tests/check-d2-banner-exit-permission-visibility.js`.
2. Confirm each file's pass count is unchanged from its pre-fix baseline.

**Expected outcome:**
> Every pre-existing test in these files still passes — the fix only adds a field, nothing existing broke.

**Result:** [x] Pass
**Notes:** All 7 files exit 0, 0 failures each (dashboard-wiring: all `ok`; product-dashboard-wiring: all `ok`; pending-actions-mapping: all `ok`; skills-nav-wiring: 20/20; html-shell: 42/42; skill-launcher-landing: 35/35; banner-exit-permission: 24/24).

---

### Scenario 3: Full automated suite

**Covers:** AC5

**Steps:**
1. Run `node scripts/run-all-tests.js`.

**Expected outcome:**
> 0 failures.

**Result:** [x] Pass
**Notes:** `784 file(s) run, 0 failed` (783 baseline + 1 new test file for this story).

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
