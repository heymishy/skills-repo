# AC Verification Script: GitHub issue opened by PostHog for each new production error issue

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s6-alert-to-github-issue-bridge.md
**Technical test plan:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s6-alert-to-github-issue-bridge-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

This story has no screens and no code. It sets up one alert in PostHog that opens a GitHub issue the first time a new production error appears. Before any setup, a reviewer can read this script to confirm the described behaviour is the behaviour wanted. Scenarios 2, 3 and 4 open real issues in a public repository, so each one needs your say-so right before it happens.

---

## Setup

**Before you start:**
1. In PostHog (project 10908), open the project settings, find the integrations section and connect GitHub.
2. When GitHub asks where to install the PostHog App, choose the one repository `heymishy/skills-repo` only, and allow it to write issues and nothing else.
3. Tell the agent when this is done. You do not need to give the agent any key or password.

**Reset between scenarios:** close any test issue that a scenario opened, and leave the alert as it is.

---

## Scenarios

### Scenario 1: PostHog is connected to GitHub for one repository only

**Covers:** AC1

**Steps:**
1. Ask the agent to list the project's connections to GitHub.
2. On GitHub, open the PostHog App's installation page for the repository and read the list of permissions.

**Expected outcome:**
> There is one GitHub connection. The only repository it can reach is `heymishy/skills-repo`. The permissions page shows write access for issues and nothing broader (no access to code, workflows or settings). You tell the agent in writing what the permissions page showed; the agent cannot see that page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The alert is set up as intended

**Covers:** AC2

**Steps:**
1. Ask the agent to create the alert, then read it back from PostHog and show you what PostHog stored.

**Expected outcome:**
> The alert is switched on. It fires only when a new error issue is created (not when one reopens or spikes). It only applies to errors where the environment is `production`. It opens issues in `heymishy/skills-repo`. The read-back is saved in `reference/coha-s6-alert-configuration.md` and contains no keys, tokens or installation numbers.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A test run opens exactly one issue of the expected shape

**Covers:** AC3

**Steps:**
1. Tell the agent "yes, run the test once". The agent asks you again immediately before, because this opens a real public issue.
2. Look at the issues list of `heymishy/skills-repo` a few minutes later.
3. Close the test issue.

**Expected outcome:**
> Exactly one new issue appears. Its title reads like `Error: <a fixed error code>`. Its body shows the error message in a code block, up to 5 lines saying where in the code it happened, and a "View in PostHog" link. No second issue appears. The agent records who opened it (the account name), the title style and the link style, so the later story that adds a label can recognise these issues.

**Broken behaviour looks like:** two or more issues, an issue with a title that is a long sentence or contains a person, tenant or file contents, or no issue at all (in that case the agent looks in PostHog's record for the alert to see whether delivery failed).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A real cleaned-up error shows no tenant text (only if scenario 3 was not enough)

**Covers:** AC4

**Steps:**
1. The agent writes down why the test run in scenario 3 could not show that tenant text is excluded. If it could, this scenario is skipped and the reason is recorded.
2. Tell the agent "yes, open one extra issue". The agent asks again immediately before.
3. The agent routes one real staging error through a temporary copy of the alert that has no environment condition.
4. Read the issue. Then confirm the agent has deleted the temporary alert, and close the issue.

**Expected outcome:**
> The issue contains only the fixed error code and at most 5 code locations, each inside the `src/` or `node_modules/` folders, with no lines of source code. No customer or tenant name, email or text appears anywhere. The temporary alert no longer appears when the alerts are listed.

**Result:** [ ] Pass  [ ] Fail  [ ] Skipped (reason written)
**Notes:**

---

### Scenario 5: A staging error opens no issue

**Covers:** AC5

**Steps:**
1. Do this after the coha-s5 follow-ups are done (the capture keys exist on staging). Run scenario 10 of the coha-s5 verification script to cause one deliberate error on staging.
2. In PostHog Error Tracking for this project, find the new event and read its environment.
3. Wait about 10 minutes, then look at the issues list of `heymishy/skills-repo`.

**Expected outcome:**
> The event is visible in this PostHog project and shows the environment `staging`. No new issue exists in the repository for it. If the event does not show up in this project at all, this scenario fails and the assumption that staging and production share one PostHog project has to be re-checked before anything else.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: The first real production error opens one issue (cannot be done on demand)

**Covers:** AC6

**Steps:**
1. This is done the first time a real error occurs in production. Until then it is recorded as waiting, not passed.
2. When PostHog shows the new error, look at the issues list of `heymishy/skills-repo`.
3. After the same error happens again, look at the issues list again.

**Expected outcome:**
> Exactly one issue exists for that error, and there is still only one after it happens again.

**Result:** [ ] Pass  [ ] Fail  [ ] Waiting for a real production error
**Notes:**

---

### Scenario 7: Nothing but documents was changed, and no password or key was saved

**Covers:** AC7

**Steps:**
1. Ask the agent to list every file this story changed.
2. Ask the agent to scan those files for anything shaped like a key, token, installation number or secret, reporting only file names and never the values.

**Expected outcome:**
> Every changed file is under `artefacts/` or `workspace/`, or is one of the two pipeline bookkeeping files. Nothing is under `src/`, `scripts/` or `.github/workflows/`. The scan reports nothing.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## If a delivery does not happen

PostHog keeps a record of each time the alert tried to open an issue, including failures (for example if the GitHub App was removed). Open the alert in PostHog and read its logs. This is the only place a failed delivery shows up; nothing in our app watches it.
