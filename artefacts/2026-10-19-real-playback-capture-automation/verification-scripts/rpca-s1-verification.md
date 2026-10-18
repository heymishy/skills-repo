# AC Verification Script: CLI entrypoint authenticates against staging and captures one real screenshot end to end

**Story reference:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s1-cli-entrypoint-and-first-real-capture.md
**Technical test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s1-test-plan.md
**Script version:** 1
**Verified by:** Hamish King | **Date:** 2026-10-19 | **Context:** [x] Pre-code (verified against the implemented branch before merge)

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

**Result:** [x] Pass  [ ] Fail
**Notes:** Ran against the real `wuce-staging` instance (`2026-10-11-journey-cx-redesign`) using the real `E2E_STAGING_AUTH_STUB_SECRET` retrieved via `fly ssh console -a wuce-staging`. Completed in ~5-6 seconds (real browser launch + auth + navigation), no browser login prompt, no credential error. **Finding, not a failure:** the CLI prints nothing on success — no "Authenticated" message as the scenario's own expected-outcome text assumed. None of the 4 ACs actually require a success message, so this isn't an AC failure, but it's a real usability gap worth fixing in a follow-up (logged below).

---

### Scenario 2: A real screenshot is captured and saved

**Covers:** AC2

**Steps:**
1. Continuing from Scenario 1's own run (or a fresh run), let the CLI complete
2. Check `artefacts/[feature-slug]/playback/[story-slug]/screenshots/` for a new file

**Expected outcome:**
> A real `.png` file exists at the expected path, and opening it shows an actual screenshot of the real page — not a blank or broken image.

**Result:** [x] Pass  [ ] Fail
**Notes:** `artefacts/2026-10-11-journey-cx-redesign/playback/rpca-s1-proof/screenshots/AC1.png` created, 144670 bytes. Viewed directly — a real, legible, full-page screenshot showing the real sidebar nav, Scope/Benefit card, and `fpd-s6`'s own live coverage summary ("11 of 41 ACs have captured evidence."). Not blank, not broken.

---

### Scenario 3: Missing secret fails loudly, not silently

**Covers:** AC3

**Steps:**
1. Unset `E2E_STAGING_AUTH_STUB_SECRET` (e.g. `unset E2E_STAGING_AUTH_STUB_SECRET`)
2. Run `node scripts/playback-capture.js [any-feature-slug]`

**Expected outcome:**
> The CLI exits immediately with an error message that names `E2E_STAGING_AUTH_STUB_SECRET` specifically — not a generic "authentication failed" message, and not a silent hang.

**Result:** [x] Pass  [ ] Fail
**Notes:** Not re-run manually — already confirmed by the automated unit test (`AC3`, `tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js`), which asserts the exact same behaviour. No real secret/network needed for this AC, so the automated test is sufficient evidence on its own.

---

### Scenario 4: The secret value never appears in any output

**Covers:** AC4

**Steps:**
1. With the secret set, run `node scripts/playback-capture.js [a-real-feature-slug]` and capture its full output to a file (e.g. `> output.log 2>&1`)
2. Search `output.log` for the literal secret value

**Expected outcome:**
> The secret value does not appear anywhere in `output.log`, regardless of whether the run succeeded or failed.

**Result:** [x] Pass  [ ] Fail
**Notes:** Not re-run manually — already confirmed by the automated unit test (`AC4`), which asserts this on the failure path with a fixture secret. Also directly observable from Scenario 1/2's own real run: the CLI printed nothing at all on success, so the real secret trivially never appeared in any output.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1 — real auth) | Pass | Real run against `wuce-staging`, ~5-6s |
| Scenario 2 (AC2 — real screenshot) | Pass | Real 144670-byte PNG, viewed and confirmed legible |
| Scenario 3 (AC3 — missing-secret error) | Pass | Confirmed via automated unit test |
| Scenario 4 (AC4 — no secret leak) | Pass | Confirmed via automated unit test + direct observation |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| Scenario 1 | A success message prints (e.g. "Authenticated against wuce-staging") | The CLI prints nothing at all on success | LOW | Accept — no AC requires a success message; worth a follow-up polish item, not a blocker |
