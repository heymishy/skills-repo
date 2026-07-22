# AC Verification Script: Stand up a staging-safe GitHub OAuth/email auth stub for real-staging E2E

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/a1-staging-safe-auth-stub.md
**Technical test plan:** artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/a1-staging-safe-auth-stub-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to `wuce-staging` (`https://wuce-staging.fly.dev`) in a browser.
2. Have the staging-safe auth stub's enabling credential available (ask the operator — it is a CI secret, not committed anywhere).
3. Have access to the staging database or admin view to confirm a user record was created.

**Reset between scenarios:** Each scenario creates its own fresh, uniquely-tagged (`e2e-test-`) identity — no reset needed between scenarios.

---

## Scenarios

---

### Scenario 1: Signing up via the staging auth stub creates a real account and logs you in

**Covers:** AC1

**Steps:**
1. Go to `https://wuce-staging.fly.dev`.
2. Click the sign-up option that uses the staging-only test identity (the stub flow — ask the operator which button this is if not obvious).
3. Complete the flow.

**Expected outcome:**
> You land on a signed-in page (not the sign-up page). If you check the staging user list (or ask an engineer to query the database), a new user record exists with an email or identity starting with `e2e-test-`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Signing up with email and password creates a real account, separately from the stub path

**Covers:** AC2

**Steps:**
1. Go to `https://wuce-staging.fly.dev`.
2. Click "Sign up with email."
3. Type a new email address starting with `e2e-test-` and a password.
4. Click "Sign up."

**Expected outcome:**
> You land on a signed-in page. A new user record exists for this exact email address, separate from any account created in Scenario 1.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The staging-only stub credential does not exist on the real production app

**Covers:** AC3

**Steps:**
1. Open the repo's `fly.toml` file (the production config — not `fly.staging.toml`).
2. Search the file (Ctrl+F) for the name of the staging stub's enabling credential (ask the operator for the exact variable name once implemented).

**Expected outcome:**
> The variable name does not appear anywhere in `fly.toml`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The architecture guardrails document explains the new staging auth mechanism

**Covers:** AC4

**Steps:**
1. Open `.github/architecture-guardrails.md`.
2. Find the ADR-018 section.
3. Look for an addendum immediately after it, dated 2026-07-23 or later.

**Expected outcome:**
> An addendum is present explaining the staging-only auth stub mechanism, confirming it is scoped to staging only and does not weaken production authentication.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The stub credential is never visible in plain text in CI logs

**Covers:** NFR — Security (test gap — manual only, see technical test plan)

**Steps:**
1. After a real CI run of this story's E2E job, open the CI job's log output (GitHub Actions run log).
2. Search (Ctrl+F) for the literal credential value.

**Expected outcome:**
> The credential value does not appear anywhere in the log output — it should show as masked (e.g. `***`) wherever GitHub Actions redacts registered secrets.

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
