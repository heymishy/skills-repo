# Definition of Ready — dviz.2-pages-workflow

**Feature:** `2026-04-18-dashboard-v2`
**Story:** `dviz.2` — GitHub Pages deployment workflow
**Date:** 2026-04-18
**Status:** Proceed ✅

---

## Contract Proposal

**What the coding agent will build:** A new GitHub Actions workflow file `.github/workflows/pages.yml` that deploys the `dashboards/` directory to GitHub Pages on every push to `master` that touches `dashboards/**` or `.github/pipeline-state.json`. Uses the `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages` action sequence. No PAT or secrets used — only `github.token` via `permissions:`. Adds a test file `tests/check-dviz2-pages-workflow.js` covering T1–T8.

**Files touched:**
- NEW: `.github/workflows/pages.yml`
- NEW: `tests/check-dviz2-pages-workflow.js`
- MODIFY: `package.json` (add to test chain)

**Out of scope per contract:** dviz.1 adapter, dviz.3 governance check, any other workflow files.

**Schema dependencies:** None.

**Contract review:** ✅ All ACs mappable to the proposed implementation.

---

## Hard blocks

| # | Check | Result |
|---|-------|--------|
| H1 | User story in As/Want/So format with named persona | ✅ PASS — "platform maintainer" persona |
| H2 | At least 3 ACs in Given/When/Then format | ✅ PASS — 5 ACs, GWT format |
| H3 | Every AC has at least one test in test plan | ✅ PASS — AC1→T1+T2, AC2→T3+T4, AC3→T5, AC4→T6, AC5→T7+T8 |
| H4 | Out-of-scope section populated | ✅ PASS — 3 explicit OOS items |
| H5 | Benefit linkage references a named metric | ✅ PASS — MM2 (GitHub Pages deployment health) |
| H6 | Complexity rated | ✅ PASS — Complexity 1 |
| H7 | No unresolved HIGH review findings | ✅ PASS — review conducted inline; no HIGH findings |
| H8 | No uncovered ACs in test plan | ✅ PASS — all 5 ACs covered by T1–T8 |
| H8-ext | Cross-story schema dependency check | ✅ PASS — no schema dependencies for this story |
| H9 | Architecture constraints populated; no Category E HIGH | ✅ PASS — constraints in story technical notes |
| H-E2E | CSS-layout-dependent ACs without E2E tooling | ✅ PASS — no CSS-layout-dependent ACs |
| H-NFR | NFR profile exists at artefacts/2026-04-18-dashboard-v2/nfr-profile.md | ✅ PASS |
| H-NFR2 | Compliance NFRs with regulatory clause have human sign-off | ✅ PASS — no compliance NFRs |
| H-NFR3 | Data classification field in NFR profile not blank | ✅ PASS — "Internal / non-sensitive" |

**Hard blocks result: 14/14 PASS**

---

## Warnings

| # | Check | Result |
|---|-------|--------|
| W1 | NFRs populated or explicitly "None - confirmed" | ✅ NFR profile exists |
| W2 | Scope stability declared | ✅ Stable — GitHub Pages Actions pattern is mature |
| W3 | MEDIUM review findings acknowledged | ✅ No MEDIUM findings |
| W4 | Verification script requires domain expert review | ✅ No domain-expert dependency; all checks are mechanical YAML + file presence |
| W5 | No UNCERTAIN items in test plan gap table | ✅ T5–T8 are straightforward content checks |

---

## Oversight level

**Low** — standard CI/CD plumbing, non-regulated repo, single operator.

---

## Coding Agent Instructions

**Story:** dviz.2 — GitHub Pages deployment workflow
**Feature slug:** `2026-04-18-dashboard-v2`

### Objective
Create `.github/workflows/pages.yml` to automatically deploy the `dashboards/` directory to GitHub Pages whenever `dashboards/**` or `.github/pipeline-state.json` changes on the `master` branch.

### Scope contract
**Files to create:**
- `.github/workflows/pages.yml`
- `tests/check-dviz2-pages-workflow.js`

**Files to modify:**
- `package.json` — add `node tests/check-dviz2-pages-workflow.js` to the test chain

**Do NOT touch:** Any existing workflow file, `dashboards/*.js`, `dashboards/index.html`, `pipeline-state.json`.

### pages.yml structure
```yaml
name: Deploy dashboards to GitHub Pages

on:
  push:
    branches: [master]
    paths:
      - 'dashboards/**'
      - '.github/pipeline-state.json'

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dashboards
      - id: deploy
        uses: actions/deploy-pages@v4
```

### TDD order
1. Write `tests/check-dviz2-pages-workflow.js` — all T1–T8 failing
2. Create `.github/workflows/pages.yml` — all tests pass
3. Add to package.json — confirm `npm test` passes

### Security requirement
- No GitHub Personal Access Token; use only `GITHUB_TOKEN` via the `permissions:` block
- `permissions.contents` must be `read` (not `write`)
- No secrets referenced anywhere in the file

### Verification command
```
npm test
```
Expected: all existing suites + new `[dviz2-pages-workflow]` suite, 0 failures.
