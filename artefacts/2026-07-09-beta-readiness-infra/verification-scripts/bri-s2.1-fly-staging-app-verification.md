# AC Verification Script: Provision the wuce-staging Fly app

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.1-fly-staging-app.md
**Technical test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.1-fly-staging-app-test-plan.md
**Script version:** 1 (update version if ACs change post-implementation)
**Verified by:** ______________ | **Date:** ______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Get access to the Fly.io dashboard (fly.io/dashboard) for the account this project is deployed under, or ask Hamish for a screen-share if you don't have direct access.
2. Confirm you (or Hamish) can run `fly` commands from a terminal with `flyctl` installed and authenticated (`fly auth whoami` should show a logged-in account).
3. Have the repository open so you can view `fly.toml` and `fly.staging.toml` side by side.

**Reset between scenarios:** No reset needed — each scenario is a read-only check against Fly.io or the repo files.

---

## Scenarios

### Scenario 1: A distinct wuce-staging app builds and starts successfully on Fly.io

**Covers:** AC1

**Steps:**
1. From the repository root, run: `fly deploy --config fly.staging.toml --app wuce-staging`
2. Wait for the command to finish.
3. Open the Fly.io dashboard and look for an app named `wuce-staging`.

**Expected outcome:**
> The deploy command finishes without an error. On the Fly.io dashboard, an app named `wuce-staging` appears, separate from the existing `wuce-prod`/`skills-framework` app, showing a status of "running" (or "suspended" if idle) with at least one successful deploy in its release history.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: wuce-staging and wuce-prod use the same Dockerfile and runtime shape, differing only in name/secrets/env

**Covers:** AC2

**Steps:**
1. Open `fly.toml` and `fly.staging.toml` side by side in an editor.
2. Compare the `[build]`, `[http_service]`, and `[[vm]]` sections line by line.
3. Compare the `app = '...'` line at the top of each file.

**Expected outcome:**
> The `app` name is different in each file (`skills-framework`/`wuce-prod` vs `wuce-staging`). Every other section — build configuration, HTTP service settings (port, concurrency limits, auto-stop/auto-start), and VM size (memory, CPU) — is identical between the two files. Any difference in the `[env]` block is limited to a documented staging-specific setting, not a change to how the app builds or runs.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: wuce-staging costs near-zero when idle

**Covers:** AC3

**Steps:**
1. Wait approximately one week after the first successful `wuce-staging` deploy, during which no deliberate traffic is sent to it.
2. Open the Fly.io dashboard's billing/usage page for the account.
3. Find the compute usage line item attributable to `wuce-staging`.

**Expected outcome:**
> The `wuce-staging` compute line item shows a near-zero cost for the week — consistent with the app auto-suspending when idle rather than running continuously like an always-on production service. It should not show a cost comparable to `wuce-prod`'s always-on usage.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Edge case: fly.staging.toml is missing entirely

**Covers:** AC1 (precondition failure)

**Steps:**
1. Check that `fly.staging.toml` exists in the repository root.

**Expected outcome:**
> The file exists. If it doesn't, none of the scenarios above can proceed — this is a blocking finding, not a soft gap.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — distinct app builds/starts | | |
| Scenario 2 — config parity except name/secrets/env | | |
| Scenario 3 — near-zero idle cost | | |
| Edge case — fly.staging.toml exists | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
