# AC Verification Script: Fix missing CSRF token on dashboard "Run a skill" start forms

**Story reference:** artefacts/2026-10-24-dashboard-skill-start-csrf/stories/dssc-s1-fix-missing-csrf-on-dashboard-skill-start-forms.md
**Technical test plan:** artefacts/2026-10-24-dashboard-skill-start-csrf/test-plans/dssc-s1-test-plan.md
**Script version:** 1
**Verified by:** Claude (session), with Hamish King | **Date:** 2026-10-24 | **Context:** [ ] Pre-code  [x] Post-merge  [ ] Demo

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

**Result:** [x] Pass [ ] Fail
**Notes:** Pre-fix baseline (2026-10-24): 3/3 attempts produced `403 Forbidden`, confirmed via `fly logs` showing `csrf_guard_check` with `submittedPrefix: "(empty)"` against a correctly-generated `expectedPrefix`. Post-fix live re-verification (2026-10-24, same day, after PR #1017 merged and deployed): signed in to `wuce-staging.fly.dev` via existing GitHub session, clicked "Start →" on the Discovery skill card on `/dashboard`. Browser navigated to a real skill session page (`/skills/discovery/sessions/a5b52fef-2052-42be-87d2-4d083b78a2a9/chat`) with context loaded (8 files) and an artefact draft rendering — no `403 Forbidden`. Fix confirmed working live.

---

### Scenario 2: No regression to the existing, already-working CSRF-protected forms

**Covers:** AC4

**Steps:**
1. Run the existing dashboard-related test files directly: `node tests/check-dsa-s2-dashboard-wiring.js`, `node tests/check-dsa-s2-product-dashboard-wiring.js`, `node tests/check-dsa-s2-pending-actions-mapping.js`, `node tests/check-npwe-s1-skills-nav-wiring.js`, `node tests/check-wuce18-html-shell.js`, `node tests/check-wuce23-skill-launcher-landing.js`, `node tests/check-d2-banner-exit-permission-visibility.js`.
2. Confirm each file's pass count is unchanged from its pre-fix baseline.

**Expected outcome:**
> Every pre-existing test in these files still passes — the fix only adds a field, nothing existing broke.

**Result:** [x] Pass [ ] Fail
**Notes:** Confirmed via PR #1017 CI (`Lint, typecheck, test, build` check, SUCCESS) prior to merge — all pre-existing dashboard test files passed unchanged.

---

### Scenario 3: Full automated suite

**Covers:** AC5

**Steps:**
1. Run `node scripts/run-all-tests.js`.

**Expected outcome:**
> 0 failures.

**Result:** [x] Pass [ ] Fail
**Notes:** Confirmed via PR #1017 CI (`Lint, typecheck, test, build` check, SUCCESS) prior to merge. Post-merge staging deploy's `Staging smoke test (@mocked)` job initially failed with a `502` on an unrelated route (`/admin/credits`, `bri-s3.3`'s own pre-existing, previously-documented flake — confirmed unrelated: that route is untouched by this fix). Re-ran just that job (`gh run rerun 40063540546 --job 120782142364`) and it passed clean (run 40063540546, job 120783583033, SUCCESS), confirming the original failure was the known flake, not a regression.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | Pass | Live-verified on staging post-deploy: "Start →" reaches a real skill session, no 403 |
| Scenario 2 | Pass | PR #1017 CI, pre-existing dashboard tests unchanged |
| Scenario 3 | Pass | PR #1017 CI full suite; post-merge smoke-test flake re-run confirmed unrelated |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
