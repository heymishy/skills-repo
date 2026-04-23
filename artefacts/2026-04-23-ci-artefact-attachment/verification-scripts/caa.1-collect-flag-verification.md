# AC Verification Script: Add `--collect` flag to `trace-report.js`

**Story reference:** artefacts/2026-04-23-ci-artefact-attachment/stories/caa.1-collect-flag.md
**Technical test plan:** artefacts/2026-04-23-ci-artefact-attachment/test-plans/caa.1-collect-flag-test-plan.md
**Script version:** 1
**Verified by:** _______________ | **Date:** _______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Clone or check out this repository locally — you need a terminal at the repo root.
2. Confirm `pipeline-state.json` in the repo root is present (it lists all pipeline features).
3. Confirm the `artefacts/` directory is present and contains at least one feature folder.
4. You do NOT need `node_modules` installed for scenarios 1–5. Scenario 6 confirms this.

**Reset between scenarios:** After each scenario, delete the `.ci-artefact-staging/` directory at the repo root if it was created.
```
rm -rf .ci-artefact-staging
```

---

## Scenarios

---

### Scenario 1: Running `--collect` creates a staging folder with numbered files

**Covers:** AC1

**Steps:**
1. Open a terminal at the repo root.
2. Run: `node scripts/trace-report.js --collect --feature=2026-04-23-ci-artefact-attachment`
3. Look at the folder `.ci-artefact-staging/2026-04-23-ci-artefact-attachment/`.

**Expected outcome:**
> The folder exists and contains files with names like `01-discovery.md`, `02-benefit-metric.md`, `03-caa.1-collect-flag.md`, etc. Every file is a copy of a file from the `artefacts/2026-04-23-ci-artefact-attachment/` tree. No file from outside that tree (e.g. `pipeline-state.json`, `context.yml`) is present.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The staging folder contains a `manifest.json` with the right fields

**Covers:** AC2

**Steps:**
1. If you just completed Scenario 1, the staging folder already exists.
2. Open `.ci-artefact-staging/2026-04-23-ci-artefact-attachment/manifest.json` in any text editor or run: `cat .ci-artefact-staging/2026-04-23-ci-artefact-attachment/manifest.json`

**Expected outcome:**
> The file is valid JSON containing:
> - `"featureSlug": "2026-04-23-ci-artefact-attachment"`
> - `"collectedAt"`: a date-time string like `"2026-04-23T14:05:33.000Z"`
> - `"fileCount"`: an integer matching the number of `.md` files in the staging folder (not counting `manifest.json` itself)
> - `"files"`: an array where each entry has a `filename` (the staged filename, e.g. `"01-discovery.md"`) and a `sourcePath` (the original path relative to the repo root, e.g. `"artefacts/2026-04-23-ci-artefact-attachment/discovery.md"`)

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Running `--collect` without `--feature` auto-picks the active feature

**Covers:** AC3

**Steps:**
1. Delete `.ci-artefact-staging/` if it exists.
2. Run: `node scripts/trace-report.js --collect`
3. Check what was created under `.ci-artefact-staging/`.

**Expected outcome:**
> A staging folder is created for the single active feature currently in `pipeline-state.json`. The folder name matches the feature slug. The folder contains numbered files and `manifest.json` as described in Scenarios 1–2.
> If multiple active features exist, the command should exit with an error (see Scenario 4).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Passing an unknown feature slug exits with a clear error

**Covers:** AC4

**Steps:**
1. Delete `.ci-artefact-staging/` if it exists.
2. Run: `node scripts/trace-report.js --collect --feature=this-slug-does-not-exist`
3. Check the terminal output and the exit code (on Unix/Mac: `echo $?`; on Windows: `echo %errorlevel%`).

**Expected outcome:**
> The command exits with code `1`. The terminal shows an error message that includes the phrase `[trace-report --collect] No feature resolved` and mentions either `--feature=<slug>` or `pipeline-state.json`. No `.ci-artefact-staging/` folder is created.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Running collect twice removes stale files from the first run

**Covers:** AC5

**Steps:**
1. Run: `node scripts/trace-report.js --collect --feature=2026-04-23-ci-artefact-attachment`
2. Create a fake stale file: copy any file into the staging folder and name it `99-stale-file.md`.
3. Run collect again: `node scripts/trace-report.js --collect --feature=2026-04-23-ci-artefact-attachment`
4. Check whether `99-stale-file.md` is still in the staging folder.

**Expected outcome:**
> `99-stale-file.md` is gone. The staging folder contains only the current artefact files and `manifest.json` — an exact reflection of the current `artefacts/` tree. No files from the previous run survive.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: `--collect` runs without needing `node_modules`

**Covers:** AC6

**Steps:**
1. Create a fresh temporary directory somewhere on your machine (outside the repo).
2. Copy `scripts/trace-report.js` and `package.json` into it.
3. Do NOT run `npm install`.
4. Create a minimal `pipeline-state.json` (a file containing `{ "features": [] }`) and an empty `artefacts/` folder.
5. Run: `node scripts/trace-report.js --collect`

**Expected outcome:**
> The command either exits cleanly with an error about no active feature (expected — there are none) OR succeeds if a feature is set up. In either case, the process does NOT fail with `Cannot find module` or any npm-dependency-related error. The only error, if any, is about missing pipeline data — not missing node packages.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
