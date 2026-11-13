# AC Verification Script: Alert-to-GitHub-issue bridge for new production error issues

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s6-alert-to-github-issue-bridge.md
**Technical test plan:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s6-alert-to-github-issue-bridge-test-plan.md
**Script version:** 2 (replaces the version written for the abandoned PostHog GitHub destination; that one is in git history)
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

This story adds a small address on the running app that PostHog calls when a new production error appears. The app then opens one GitHub issue for it, once. There are no screens. Scenarios 1 to 5, 7 and 8 are checked by running the test file and reading its output. Scenarios 6 and 9 happen against the real deployed app and PostHog after merge, and scenario 6 opens a real issue in a public repository. Before coding, a reviewer can read this script to confirm the behaviour described is the behaviour wanted.

---

## Setup

**Before you start:**
1. Open a terminal in the project folder.
2. The checks use a pretend GitHub (a small local program that records what it is sent) and made-up secrets and tokens. They send nothing to the real GitHub or PostHog.
3. Run the always-on checks with: `node tests/check-coha-s6-error-bridge.js`. It prints one line per check and a total at the end. The failure count is 0 when everything is as described below.
4. Some checks need a real database. To run them, start a throwaway Postgres container (for example `docker run --rm -d -p 55432:5432 -e POSTGRES_PASSWORD=test postgres:16`), then in PowerShell set `$env:COHA_S6_TEST_DATABASE_URL = 'postgres://postgres:test@localhost:55432/postgres'` and run the same command again. Without that variable those checks print "SKIPPED"; a SKIPPED line is not a pass. Close the container and clear the variable afterwards (`Remove-Item Env:COHA_S6_TEST_DATABASE_URL`).
5. For scenario 6 (after merge and deploy to staging) you also need the label `production-error` to exist in `heymishy/skills-repo` (create it in GitHub's Issues, Labels page if it is missing; it was missing on 2026-11-13), the shared secret and the narrowly scoped GitHub token set as Fly secrets on the staging app, and a PostHog destination pointing at the staging app's address with the secret header.

**Reset between scenarios:** not needed for the test file (each check starts clean). After scenario 6, close the test issue it opens.

---

## Scenarios

### Scenario 1: A new production error opens exactly one issue with the right content

**Covers:** AC1

**Steps:**
1. Run the test file.
2. Find the lines for the checks named "valid production body creates one issue", "issue body has only the fixed fields", "title is the code only" and "link is checked".

**Expected outcome:**
> All four lines show a pass. The issue the pretend GitHub receives has the label `production-error`, a title equal to the error code (for example `tenant_admin_bootstrap_failed`), and a body holding only the time the error was first seen, the environment, a link to PostHog and a line carrying the PostHog issue number. A made-up extra word placed in the request never appears in the issue. A link that does not start with `https://us.posthog.com/project/` is refused.

**Broken behaviour looks like:** an issue whose body contains an error message, a stack trace, a file path or the made-up extra word.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The same error never opens a second issue

**Covers:** AC2

**Steps:**
1. Run the test file, then run it again with the real database set up (Setup step 4).
2. Find the lines for "created duplicate", "in-flight duplicate", "stuck pending, issue not on GitHub", "stuck pending, issue already on GitHub", "two concurrent takeovers", and, with the database, "two simultaneous deliveries", "restart between deliveries" and "stuck pending taken over once".

**Expected outcome:**
> Every line shows a pass. Sending the same error twice, or at the same moment from two places, or again after the app restarted, leaves exactly one issue. A delivery that was interrupted halfway (the app stopped after noting it but before finishing) is picked up after two minutes and produces exactly one issue, whether or not GitHub had already received the first attempt. With the database set up, the database checks run rather than print SKIPPED.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Callers without the secret are turned away

**Covers:** AC3

**Steps:**
1. Run the test file.
2. Find the lines for "missing secret", "wrong secret", "wrong length secret", "non-POST", "body over 16 KB" and "malformed body" (one line per kind of malformed body).

**Expected outcome:**
> A missing or wrong secret gets the answer 401 and nothing is stored or opened. Any request that is not a POST gets 405. A request larger than 16 KB gets 413 and is not even read. A body that is not valid, is the wrong shape, or has a value that is not text gets 400. The reply never says which part of the secret was wrong.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Staging and unlabelled errors are ignored on purpose

**Covers:** AC4

**Steps:**
1. Run the test file.
2. Find the lines for "environment is staging", "environment is empty" and "environment has an unexpected value".

**Expected outcome:**
> All three show a pass. In each case the answer is 200 (so PostHog does not retry), no issue is opened and nothing is stored. The log line for a staging error reads `error-bridge: ignored staging` and the line for a missing environment reads `error-bridge: ignored environment missing`, so the two can be told apart.

**Broken behaviour looks like:** a staging error opening an issue, or both situations producing the same log line so that a silent loss of real production errors cannot be spotted.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: If GitHub is down, the error is not lost

**Covers:** AC5

**Steps:**
1. Run the test file.
2. Find the lines for "GitHub returns 500", "GitHub does not answer", "later delivery opens exactly one issue" and, with the real database, "failed call leaves the row recoverable".

**Expected outcome:**
> The app answers 503 (so PostHog can try again) within a short time, the record is not left marked as done, and a later delivery of the same error opens exactly one issue.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: The real PostHog sends a request the real bridge accepts (after merge, opens a real public issue)

**Covers:** AC6

**Steps:**
1. After the change is deployed to staging and the Setup step 5 items are done, tell the agent "yes, run the live test once". The agent asks again immediately before, because this opens a real issue in a public repository.
2. The agent runs the PostHog destination's test function once with the outgoing request switched on.
3. Look at the issues list of `heymishy/skills-repo`, then close the test issue.

**Expected outcome:**
> The staging app's log shows one request arriving with the secret header present and accepted. Exactly one new issue appears, with the label `production-error`, a title equal to the sample error code, and a body holding only the first-seen time, the environment, the PostHog link and the PostHog issue number. No second issue appears a few minutes later. If the label does not appear, record that (the label may not have been allowed) and tell the agent.

**Broken behaviour looks like:** a refused request (401), an issue without the label, or more than one issue.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 7: The real app startup wires everything up correctly

**Covers:** AC7

**Steps:**
1. Run the test file with the real database set up (Setup step 4).
2. Find the lines "real startup path" and "wired behaviour is correct".

**Expected outcome:**
> Both show a pass, not SKIPPED. Starting the app the way it really starts, then sending it a valid error, makes the pretend GitHub receive one request with the right address, the token in the Authorization header, and the expected title, body and label. Sending two different errors produces two different issues, each with its own title and PostHog number.

**Result:** [ ] Pass  [ ] Fail  [ ] Skipped (no database; the story is not verified until this runs)
**Notes:**

---

### Scenario 8: A half-set-up app fails safely

**Covers:** AC8

**Steps:**
1. Run the test file.
2. Find the lines "unwired adapter stub throws the exact message" and "handler with the stub returns 503".

**Expected outcome:**
> Both pass. The built-in placeholder for the GitHub step refuses to work with the message `Adapter not wired: error-bridge-github. Call setGithubIssueAdapter() with a real implementation before use.` If the app is somehow started without the real GitHub step, a delivery gets the answer 503 and a log line that says "Adapter not wired"; the app keeps running and nothing is marked as done.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 9: The first real production error opens one issue (cannot be done on demand)

**Covers:** AC9

**Steps:**
1. This is checked the first time a real error appears in production after the bridge is live. Until then it is recorded as waiting, not passed.
2. When PostHog shows a new production error, look at the issues list of `heymishy/skills-repo`, then look again after the same error happens again.
3. If no issue appears, read the app's log for the lines `error-bridge: ignored environment missing` or a line naming empty fields.

**Expected outcome:**
> Exactly one issue exists for that error and still one after it happens again. This is also the only proof that a real error from PostHog fills in every field, including the environment.

**Result:** [ ] Pass  [ ] Fail  [ ] Waiting for a real production error
**Notes:**

---

## What the checks on secrets and logs must show

Across all scenarios the test file also checks that the made-up shared secret, the made-up token and a made-up word in the payload never appear in any log line, that every kind of outcome logs one distinct line carrying only the PostHog issue number, that an answer takes under 2 seconds with the pretend services, and that a body with empty fields is refused with a log naming the empty fields (never their values). These appear as the four lines starting with "NFR".
