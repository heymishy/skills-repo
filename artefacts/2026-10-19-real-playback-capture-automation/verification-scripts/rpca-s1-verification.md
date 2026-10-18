# AC Verification Script: CLI entrypoint authenticates against staging and captures one real screenshot end to end

**Story reference:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s1-cli-entrypoint-and-first-real-capture.md
**Technical test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. You'll need the real `E2E_STAGING_AUTH_STUB_SECRET` value for Scenarios 1 and 2 (not needed for 3/4) — retrieve it the same way any other staging secret is retrieved for this repo (e.g. `fly ssh console -a wuce-staging` then read it from the running environment)
2. Set it as an environment variable: `export E2E_STAGING_AUTH_STUB_SECRET=<value>` (bash) or `$env:E2E_STAGING_AUTH_STUB_SECRET = "<value>"` (PowerShell)
3. Pick a real DoD-complete feature slug that exists in this repo's own `.github/pipeline-state.json`

**Reset between scenarios:** No reset needed — each scenario is a separate CLI invocation.

---

## Scenarios

---

### Scenario 1: CLI authenticates against real staging with no browser login

**Covers:** AC1

**Steps:**
1. With the secret set, run `node scripts/playback-capture.js [a-real-feature-slug]`
2. Watch the CLI's own output

**Expected outcome:**
> The CLI reports a successful authentication (e.g. "Authenticated against wuce-staging" or equivalent) with no browser window opening for a login prompt, and no error about missing credentials.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A real screenshot is captured and saved

**Covers:** AC2

**Steps:**
1. Continuing from Scenario 1's own run (or a fresh run), let the CLI complete
2. Check `artefacts/[feature-slug]/playback/[story-slug]/screenshots/` for a new file

**Expected outcome:**
> A real `.png` file exists at the expected path, and opening it shows an actual screenshot of the real page — not a blank or broken image.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Missing secret fails loudly, not silently

**Covers:** AC3

**Steps:**
1. Unset `E2E_STAGING_AUTH_STUB_SECRET` (e.g. `unset E2E_STAGING_AUTH_STUB_SECRET`)
2. Run `node scripts/playback-capture.js [any-feature-slug]`

**Expected outcome:**
> The CLI exits immediately with an error message that names `E2E_STAGING_AUTH_STUB_SECRET` specifically — not a generic "authentication failed" message, and not a silent hang.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The secret value never appears in any output

**Covers:** AC4

**Steps:**
1. With the secret set, run `node scripts/playback-capture.js [a-real-feature-slug]` and capture its full output to a file (e.g. `> output.log 2>&1`)
2. Search `output.log` for the literal secret value

**Expected outcome:**
> The secret value does not appear anywhere in `output.log`, regardless of whether the run succeeded or failed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1 — real auth) | | |
| Scenario 2 (AC2 — real screenshot) | | |
| Scenario 3 (AC3 — missing-secret error) | | |
| Scenario 4 (AC4 — no secret leak) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
