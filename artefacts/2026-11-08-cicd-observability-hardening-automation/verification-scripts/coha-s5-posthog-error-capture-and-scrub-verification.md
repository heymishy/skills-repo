# AC Verification Script: Production error capture to PostHog with tenant text scrubbed

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s5-posthog-error-capture-and-scrub.md
**Technical test plan:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s5-posthog-error-capture-and-scrub-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

This story has no screens. It changes what the server does when a request fails. Scenarios 1 to 9 are checked by running the test file and reading its output, and scenario 10 is a short check on the deployed staging site after merge. Before coding, a reviewer can read scenarios 1 to 9 only to confirm the behaviour described is the behaviour wanted.

---

## Setup

**Before you start:**
1. Open a terminal in the project folder.
2. The tests use a pretend PostHog (a small local program that just records what it receives) and made-up keys. They send nothing to the real PostHog and need no real keys.
3. Run the check with: `node tests/check-coha-s5-error-capture.js`. It prints one line per check and a total at the end, and shows a failure count of 0 when everything is as described below.

**Reset between scenarios:** not needed; each check starts its own clean server.

---

## Scenarios

### Scenario 1: A failing page is reported once, and the visitor still sees an error page

**Covers:** AC1

**Steps:**
1. Run the check file.
2. Find the line starting "throwingRequest_producesExactlyOneEvent".

**Expected outcome:**
> The line shows a pass. It reports that the visitor got an "Internal Server Error" response (status 500), that the pretend PostHog received exactly one error report, and that the report contains only the allowed fields: the error type, the error level, the stack frames, the environment name, the route and the code.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: An error nobody handled is also reported, and the server keeps running

**Covers:** AC2

**Steps:**
1. In the check output, find the line starting "unhandledRejection_isCaptured".

**Expected outcome:**
> The line shows a pass: one error report was received, and a normal page request afterwards still worked.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: No customer information leaves the server

**Covers:** AC3

**Steps:**
1. Find the lines starting "scrubEvent_removesTenantShapes", "urlWithTenantSlug" and "scrubEvent_removesSourceContextLines".
2. Find the line mentioning the test seed.

**Expected outcome:**
> All pass. A made-up customer name, a made-up email address, a made-up database error containing an identifier, and random identifiers made up fresh for this run were put into error messages, extra details and the page address. None of them appear anywhere in what the pretend PostHog received, including the route and the sender id. The route is shown as a pattern such as "/products/:id", never the real address. Each error report shows only the error type and a fixed code, and the code lines around each stack frame are missing. If any line fails, it prints the seed so the failure can be repeated.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The known failing case, tenant admin setup, is reported by name only

**Covers:** AC4

**Steps:**
1. Find the two lines starting "bootstrapFailure_authJs" and "bootstrapFailure_authEmailJs".

**Expected outcome:**
> Both pass. For each, one error report with the code `tenant_admin_bootstrap_failed` was received, with no customer identifier and no reason text. The existing behaviour is unchanged: the setup step still reports failure to its caller and the old warning line is still written.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Test visitors are never reported

**Covers:** AC5

**Steps:**
1. Find the line starting "e2eIdentityRequest_sendsNothing".

**Expected outcome:**
> The line passes: a failing request by a test user whose name starts with "e2e-test-" produced an error page but no error report.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: A missing key stops reporting quietly without breaking the site

**Covers:** AC6

**Steps:**
1. Find the line starting "unsetKey_startupLogsClearly".

**Expected outcome:**
> The line passes: when the key is missing, the server writes a startup message naming which setting is missing (never its value), a failing request still shows the error page, and nothing is reported.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 7: Staging errors are labelled staging

**Covers:** AC7

**Steps:**
1. Find the line starting "stagingRun_labelsStaging".

**Expected outcome:**
> The line passes: every error report from a staging run is labelled "staging" and never "production", and when the staging and production keys differ, the staging key is used.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 8: A broken or slow PostHog does not break the site

**Covers:** AC8

**Steps:**
1. Find the line starting "unreachableOrSlowEndpoint".

**Expected outcome:**
> The line passes: when the pretend PostHog never answers, or answers after 2 seconds, visitors still get their error page within 200 milliseconds of the normal time, a message is logged without any key, and the server is still running afterwards.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 9: Reporting is switched on when the server starts, and a missing switch is loud

**Covers:** AC9

**Steps:**
1. Find the lines starting "realStartup_wiresCapture" and "unwiredStartup_containedAndLoggedLoudly".

**Expected outcome:**
> Both pass. Starting the server the normal way is enough for errors to be reported with the right key and environment name. If reporting was never switched on, visitors still get their error page, the log says `Adapter not wired: error-capture`, and the server keeps running.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 10: After merge, on the staging site, a deliberate error appears in PostHog

**Covers:** AC1, AC3, AC7 against the real service (post-merge smoke test; needs the operator)

**Steps:**
1. After the change is deployed to the staging site, cause one failing page on staging. The method will be named in the implementation plan (for example a staging-only test route). Note the time.
2. In PostHog, open Error Tracking and find the newest issue.
3. Open it and read the event details.

**Expected outcome:**
> One new issue appears within a few minutes. It shows the error type and a fixed code, the stack frames without code lines, the environment "staging", and the route as a pattern. It shows no customer name, email address or identifier anywhere in the details. A matching event for "production" does not appear.
>
> What broken looks like: a real address with an identifier in the route, a customer name in the message, code lines in the stack frames, the environment missing or reading "production" for a staging error, or two issues for one error.
>
> Note: the operator recalls that staging and production share one PostHog key, so this issue appears in the same list as production issues. The "environment" label is how to tell them apart.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
