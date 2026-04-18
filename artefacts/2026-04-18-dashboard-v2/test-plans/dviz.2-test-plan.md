# Test Plan: dviz.2 — GitHub Pages deployment workflow

**Feature:** `2026-04-18-dashboard-v2`
**Story:** `dviz.2-pages-workflow`
**Status:** Failing (tests written to fail — TDD discipline)

---

## Test file

`tests/check-dviz2-pages-workflow.js`

---

## Automated tests

### T1 — pages.yml exists

**Type:** Static existence check
**Assertion:** `.github/workflows/pages.yml` exists.
**Fails now:** yes

---

### T2 — pages.yml is valid YAML

**Type:** YAML parse check
**Assertion:** `js-yaml.load(fs.readFileSync('.github/workflows/pages.yml', 'utf8'))` does not throw.
**Fails now:** yes (file doesn't exist)

---

### T3 — trigger includes dashboards/** push

**Type:** Static analysis of YAML
**Assertion:** The `on.push.paths` array includes `dashboards/**`.
**Fails now:** yes

---

### T4 — trigger includes pipeline-state.json push

**Type:** Static analysis of YAML
**Assertion:** The `on.push.paths` array includes `.github/pipeline-state.json`.
**Fails now:** yes

---

### T5 — correct permissions block present

**Type:** Static analysis of YAML
**Assertion:** The workflow `permissions` block includes `pages: write` and `id-token: write`.
**Fails now:** yes

---

### T6 — upload-pages-artifact uses path: dashboards

**Type:** Static analysis of YAML
**Assertion:** A step using `actions/upload-pages-artifact` has `with.path` set to `dashboards` or `./dashboards`.
**Fails now:** yes

---

### T7 — no PAT or hardcoded secrets in workflow

**Type:** Static analysis (security — MC-SEC-02)
**Assertion:** `pages.yml` does not contain any string matching `/ghp_|github_pat|[A-Za-z0-9]{40}|\$\{\{.*secrets\.(PAT|TOKEN|KEY)/i` (other than `GITHUB_TOKEN` which is auto-injected and safe).
**Fails now:** yes (file doesn't exist — will pass once file created correctly)

---

### T8 — deploy-pages step present

**Type:** Static analysis of YAML
**Assertion:** A step using `actions/deploy-pages` exists in the workflow.
**Fails now:** yes

---

## Manual / acceptance verification

**MVS-1 (post-merge):** After merging to `master`, navigate to the repository's GitHub Actions tab. Confirm the `pages.yml` workflow runs and shows a green checkmark.

**MVS-2 (post-merge):** Navigate to `https://heymishy.github.io/skills-repo/`. Confirm the dashboard renders (requires the one-time repo admin Pages source configuration described in `dashboards/README.md`).

---

## Test data strategy

`js-yaml` is already present as a dependency (used by `scripts/validate-trace.sh`). The test script requires `js-yaml` and `fs` only — no external network calls.
