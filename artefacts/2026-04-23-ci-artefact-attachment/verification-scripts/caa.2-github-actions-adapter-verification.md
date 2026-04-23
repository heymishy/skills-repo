# AC Verification Script: GitHub Actions adapter — upload and PR comment

**Story reference:** artefacts/2026-04-23-ci-artefact-attachment/stories/caa.2-github-actions-adapter.md
**Technical test plan:** artefacts/2026-04-23-ci-artefact-attachment/test-plans/caa.2-github-actions-adapter-test-plan.md
**Script version:** 1
**Verified by:** _______________ | **Date:** _______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Check out the branch implementing caa.2 and ensure `npm test` passes.
2. You need a terminal at the repo root.
3. For Scenarios 1–4 (automated checks) no GitHub credentials are needed.
4. For Scenario 5 (live PR comment) you need: a pull request open against this repo and `GITHUB_TOKEN` set to a PAT with `pull-requests: write` scope.

**Reset between scenarios:** No persistent state left between unit scenarios. Live scenarios (5) leave a comment on the PR — that is expected.

---

## Scenarios

---

### Scenario 1: Adapter artifact name matches the required pattern

**Covers:** AC1

**Steps:**
1. Open a terminal at the repo root.
2. Run: `node tests/check-caa2-adapter.js`
3. Look for the line that reports the artifact naming test.

**Expected outcome:**
> The test output shows `PASS` for the test named `"upload calls artifact name governed-artefacts-[slug]-[run-id]"` (or similar). No failures.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: PR comment body contains the required strings

**Covers:** AC2

**Steps:**
1. In the same terminal, confirm the test output from `node tests/check-caa2-adapter.js` includes the comment-body test.

**Expected outcome:**
> The test output shows `PASS` for the test verifying that `postComment` produces a body containing `"Governed artefact chain"`, the artifact URL, and the feature slug or PR reference. No failures.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Adding a second adapter requires no changes to core files

**Covers:** AC3

**Steps:**
1. Open `scripts/ci-adapters/` in the file explorer or run: `ls scripts/ci-adapters/`
2. Check the files present. At minimum you should see `github-actions.js` and `README.md`.
3. Run: `git diff --name-only HEAD` (or compare against the main branch)

**Expected outcome:**
> The diff shows changes only under `scripts/ci-adapters/` and `tests/check-caa2-adapter.js` (and related test wiring). No changes to `scripts/trace-report.js`, `.github/workflows/assurance-gate.yml`, or any file outside `scripts/ci-adapters/` are required in order to support the second adapter.

> To double-check: read `scripts/ci-adapters/README.md` — it should describe the two methods (`upload` and `postComment`) required of every adapter, confirming that adding a new platform adapter means creating one new file only.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Workflow file uses `contents: read` — not `contents: write`

**Covers:** AC5

**Steps:**
1. Open `.github/workflows/assurance-gate.yml` in any text editor.
2. Search the file for the word `write`.

**Expected outcome:**
> The permissions block contains `pull-requests: write` (needed to post comments) but does NOT contain `contents: write` anywhere in the file. The `contents` permission is either absent (defaulting to read) or explicitly set to `contents: read`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Live CI run — artifact uploaded and PR comment appears

**Covers:** AC1, AC2 (end-to-end)

**Prerequisites:** A pull request is open on this repo; CI has run the `assurance-gate` workflow on that PR; the workflow includes the new `upload-artefacts` step added in caa.2.

**Steps:**
1. Go to the GitHub Actions run for the PR's `assurance-gate` workflow.
2. Look at the run summary or the artifact list.
3. Open the pull request page on GitHub.

**Expected outcome (step 2 — artifact):**
> An artifact named `governed-artefacts-[feature-slug]-[run-id]` is listed under the workflow run's artifacts. Clicking it downloads a zip file containing the staged artefact files and `manifest.json`.

**Expected outcome (step 3 — PR comment):**
> A comment has been posted by the CI bot (or `github-actions[bot]`) on the pull request. The comment body contains the text `Governed artefact chain` and a link to the artifact download URL.

**Result (artifact):** [ ] Pass  [ ] Fail
**Result (PR comment):** [ ] Pass  [ ] Fail
**Notes:**
