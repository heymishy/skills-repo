# AC Verification Script: Incident record pull request opened for each bridge-opened production error GitHub issue

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s7-incident-record-from-production-error-issue.md
**Technical test plan:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s7-incident-record-from-production-error-issue-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

When the error bridge (coha-s6) opens a GitHub issue for a new production error, this story makes GitHub itself prepare an incident record for it: a small automatic change, offered as a pull request that you review and merge, that adds one entry to the incidents list so the triage tools have something real to work from. It never changes the main branch by itself. There are no screens to build. Scenarios 1 to 7 are checked by running the test file and reading what it prints. Scenario 8 happens on GitHub after the change is merged and it creates nothing. Scenario 9 also happens on GitHub after the change is merged, is required, and does create a real pull request in the public repository, which you then close without merging. Before coding, a reviewer can read this script to confirm the behaviour described is the behaviour wanted.

---

## Setup

**Before you start:**
1. Open a terminal in the project folder.
2. The checks use made-up issues, made-up names and temporary copies of the incidents list in a temporary folder. They never read or change the real incidents list, and they send nothing to GitHub.
3. Run the checks with: `node tests/check-coha-s7-error-issue-incident.js`. It prints one line per check and a total at the end. The failure count is 0 when everything is as described below. The checks use `git`, so `git` must work in your terminal (it does if you can run `git --version`).
4. For scenarios 8 and 9 (after the change is merged): the error bridge must already be live, the label `production-error` must exist in `heymishy/skills-repo`, the repository setting that lets GitHub Actions create pull requests must be on, and the workflow variable naming the bridge's GitHub account (the name of the variable is in the pull request description) must be set to your exact GitHub login, with the same capital and small letters GitHub shows.

**Reset between scenarios:** not needed for the test file (each check starts clean). After scenario 9, close the test pull request without merging it and delete its branch, and close the test issue.

---

## Scenarios

### Scenario 1: A recognised error issue gives exactly one prepared record

**Covers:** AC1

**Steps:**
1. Run the test file.
2. Find the lines whose names mention "fixed fields are read from the real issue", "branch name", "record plan", "trigger names the issue link", "pull request text", "real record creation" and "full script flow".

**Expected outcome:**
> All lines show a pass. For an issue made the way the real bridge makes it (the title is the error code; the body has the time first seen, the environment, the PostHog link and a line reading `PostHog issue id:` followed by the id), exactly one change is prepared on a branch named `incident/posthog-` followed by that id. It adds exactly one new entry to the incidents list and leaves every existing entry exactly as it was. The entry's summary is the error code. Its tags include `production-error` and `posthog:` followed by the id. Its trigger text names the GitHub issue link and the PostHog id. The pull request's title and text contain only the error code and the issue number; nothing from the first-seen time, the environment or the PostHog link appears in them.

**Broken behaviour looks like:** more than one entry added, an existing entry changed, an entry whose summary is an error message or part of the body, or a pull request whose text holds the body of the issue.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The same error never gets a second pull request

**Covers:** AC2

**Steps:**
1. Run the test file.
2. Find the lines for "idempotency decision", "closed pull requests" and "full script flow".

**Expected outcome:**
> All pass. If the incidents list on the main branch already has an entry for that PostHog id, or a branch for it already exists, or an open pull request for it exists, the run stops and says which of these three reasons applied (three different messages). A branch name that merely contains the id as part of a longer id does not count as a match. If the only earlier pull request was closed without merging and its branch is gone, a new one is allowed.

**Broken behaviour looks like:** a second branch or pull request for the same error, or a skip with a vague message that does not say why.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Issues from anyone else are ignored

**Covers:** AC3

**Steps:**
1. Run the test file.
2. Find the lines for "other author", "unset or empty bridge author" and "login comparison is exact".

**Expected outcome:**
> All pass. An issue opened by any account other than the bridge's is declined with the reason `author`, even when its title, label and body look exactly right. If the bridge's account name has not been set at all, every issue is declined. The account name must match exactly: a login written with different capital letters or a trailing space does not match.

**Broken behaviour looks like:** a perfectly formatted issue from a stranger producing a pull request.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: An issue without the label or the id line is ignored

**Covers:** AC4

**Steps:**
1. Run the test file.
2. Find the lines for "label is required at the moment of opening", "marker must be a whole line", "two different markers" and "trigger is issue opened only".

**Expected outcome:**
> All pass. An issue without the label `production-error` at the moment it is opened, or with a look-alike such as `production-errors` or `Production-Error`, is declined with the reason `label`. An issue whose body lacks the line `PostHog issue id: <id>` on a line of its own (for example the text inside a sentence, or after a `> ` quote mark) is declined with the reason `marker`. Two different ids in one body are declined as ambiguous. The workflow starts only when an issue is opened, never when one is edited or labelled afterwards.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: The prepared record is accepted by the existing checks and shows on the product page

**Covers:** AC5

**Steps:**
1. Run the test file.
2. Find the lines for "product page renders it", "store loads it" and "real record creation".

**Expected outcome:**
> All pass. The record passes the incident store's own validity check and loads with the existing loader. The product page shows one item per entry (the two older ones and the new one), the new one showing the error code and a status of open. A code containing angle brackets, such as `<b>x</b>`, appears as plain characters, not as formatting.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: Hostile text is harmless, and a bad id creates nothing

**Covers:** AC6

**Steps:**
1. Run the test file.
2. Find the lines for "non-UUID", "hostile text stays inert", "hostile event run as a real child process" and "untrusted text never reaches a shell or an expression".

**Expected outcome:**
> All pass. A title made of shell tricks (backticks, `$(...)`, `; touch ...`, a GitHub expression like `${{ secrets.X }}`, angle brackets, an `@everyone`) ends up stored as plain text and nothing is run: a test file the tricks try to create does not appear. The pull request text shows the error code only inside a code format with any backtick neutralised, so `@everyone` cannot notify anyone. An id that is not a proper lowercase id (for example one containing `../`, a space, capital letters, or the wrong length) is declined with the reason `id`, no branch name is made, and the reason never repeats the bad id back. The workflow file itself never places the issue's title or body into a command.

**Broken behaviour looks like:** a created file, a notification to `@everyone`, a branch with an odd name, or a log line repeating the issue's text.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 7: Two errors at once each get their own pull request, and a clash is rebuilt

**Covers:** AC7

**Steps:**
1. Run the test file.
2. Find the lines for "two branches from one base conflict, and a rebuild fixes it", "hand-started run applies the same recognition", "concurrency does not drop runs" and "branch is rebuilt from the current master".

**Expected outcome:**
> All pass. Two records prepared from the same starting point do clash when both are merged (the test shows this so you can see the rebuild is needed). Rebuilding the second from the current main branch (what starting the workflow by hand with the rebuild box ticked does: the existing pull request is updated in place, not duplicated) then merges cleanly, and the incidents list ends with both entries, each exactly once. A run started by hand gets the same checks as an automatic one, so it cannot be used to make an entry for an issue that would be declined. The workflow's queueing uses a separate slot per issue number and never cancels another waiting run, so three simultaneous errors cannot lose one.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 8: A dry run on a real issue prints the plan and creates nothing (after merge, on GitHub)

**Covers:** AC8

**Steps:**
1. After the change is merged, open a test issue in `heymishy/skills-repo` by hand while logged in as the bridge's account (your own account). Give it the title `coha_s7_live_test_error` and this body. Use exactly this obviously fake id, so it can never match a real PostHog issue. **Do not add the label when you submit the issue**: an issue opened with the label fires the automatic run straight away, which would make the real pull request before you can try the dry run.
   ```
   First seen: 2026-11-14T00:00:00.000Z
   Environment: production
   PostHog: https://us.posthog.com/project/10908/error-tracking/00000000-0000-4000-8000-000000000009

   PostHog issue id: 00000000-0000-4000-8000-000000000009
   ```
2. Look at the Actions tab: the automatic run for your new issue should have finished and said it declined because the label is missing. Then add the label `production-error` to the issue (adding a label does not start the workflow).
3. On GitHub, open the Actions tab, pick the workflow named in the pull request description, click Run workflow, type the issue number, tick the dry run box and start it.
4. Open the finished run and read its log.

**Expected outcome:**
> The automatic run that started when you opened the issue declined it with a clear reason about the missing label, and created nothing. The dry run then succeeds. Its log shows that the issue was recognised and prints the entry it would add (summary `coha_s7_live_test_error`, tags including `production-error` and `posthog:00000000-0000-4000-8000-000000000009`) and the pull request it would open. No new branch appears under Branches, no new pull request appears, and the incidents list on the main branch is unchanged. This is `live-verified` evidence and is recorded in the definition of done.

**Broken behaviour looks like:** a new branch or pull request, a run that fails with a permissions error, or a log that prints text from the issue body.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 9: A real, non-dry run opens one pull request (after merge, outward-facing)

**Covers:** AC9 (the part no automatic test can reach: the real branch push and pull request creation by GitHub)

**Steps:**
1. Tell the agent "yes, run the live pull request check once". The agent asks again immediately before, because it creates a real branch and a real pull request in a public repository.
2. Start the same workflow by hand for the issue from scenario 8 with the dry run box left unticked.
3. Look at Branches and Pull requests in `heymishy/skills-repo`. Open the new pull request and look at its checks: write down whether GitHub shows the required checks as not run, or as waiting for someone to approve them (the agent records which in `decisions.md`).
4. Start the workflow by hand once more for the same issue, again with the dry run box left unticked and the rebuild box left unticked, and read its log.
5. Close the pull request without merging it, delete its branch, and close the test issue. Then look at Branches and Pull requests again.

**Expected outcome:**
> The run succeeds. Exactly one branch named `incident/posthog-` followed by your id appears, and exactly one pull request from it into the main branch, containing the error code and the issue number and changing only the incidents list by one added entry. The required checks may not run on it (GitHub does not start them for a pull request made by a workflow); that is expected and accepted. Starting the workflow a second time for the same issue (step 4) creates nothing more and the log says why. After step 5 no `incident/posthog-` branch for the test id and no open pull request for it remains.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## What the safety checks must show

Across all scenarios the test file also checks that the workflow file gives each job only the permissions it needs (reading for the recognising step; writing contents and pull requests for the recording step; no issue or workflow permissions), never pushes to or merges into the main branch, never approves or marks a pull request ready, uses no outside actions beyond the standard checkout, sets time limits on both jobs, takes the bridge's account name from a workflow variable and not from the file itself, and contains nothing that looks like a password or token. It also checks that every outcome prints exactly one line with a fixed reason and the issue number and never repeats text from the issue, and that a run which fails (an unreadable or damaged incidents list) leaves the list exactly as it found it. These appear as the lines starting with "NFR" and the lines about the workflow file.
