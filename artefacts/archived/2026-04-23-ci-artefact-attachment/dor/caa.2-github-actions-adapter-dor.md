# Definition of Ready: caa.2 — GitHub Actions adapter

**Story:** artefacts/2026-04-23-ci-artefact-attachment/stories/caa.2-github-actions-adapter.md
**Feature:** 2026-04-23-ci-artefact-attachment
**Date:** 2026-04-23
**Run:** 1

---

## Entry Conditions

| Condition | Status |
|-----------|--------|
| Story artefact | ✅ exists |
| Review report (PASS, 0 HIGH) | ✅ PASS — caa.2-review-1.md, 0 HIGH, 2 MEDIUM resolved |
| Test plan | ✅ exists — 10 tests, 5 ACs |
| AC verification script | ✅ exists — 5 scenarios |

---

## Hard Block Checklist

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS — 5 ACs |
| H3 | Every AC has ≥1 test | ✅ PASS |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage references named metric | ✅ PASS — M1-evidence-reach |
| H6 | Complexity rated | ✅ PASS — Complexity 2 |
| H7 | No unresolved HIGH findings | ✅ PASS — 0 HIGH |
| H8 | No uncovered ACs | ✅ PASS — coverage gaps documented + manual scenarios provided |
| H8-ext | Schema dependency check | ✅ PASS — upstream caa.1 introduces no pipeline-state.json schema fields; schemaDepends not required |
| H9 | Architecture Constraints populated; no Cat-E HIGH | ✅ PASS — PAT-08, ADR-009, ADR-010 cited |
| H-E2E | CSS-layout-dependent ACs | ✅ PASS — none |
| H-NFR | NFR profile exists | ✅ PASS |
| H-NFR2 | Compliance NFRs with regulatory clauses | ✅ PASS — none |
| H-NFR3 | Data classification not blank | ✅ PASS |
| H-NFR-profile | NFRs declared → profile exists | ✅ PASS |

**Hard blocks: 15/15 PASS**

---

## Warnings

| # | Check | Disposition |
|---|-------|-------------|
| W1 | NFRs populated | ✅ Populated |
| W2 | Scope stability | ✅ Stable |
| W3 | MEDIUM findings acknowledged | ⚠️ RISK-ACCEPT — F-A1 and F-C1 resolved in story; /decisions entry to be logged |
| W4 | Verification script reviewed | ⚠️ RISK-ACCEPT — solo repo; human review at PR |
| W5 | UNCERTAIN test gaps | ⚠️ RISK-ACCEPT — AC1/AC2 live GitHub runtime gaps covered by manual scenarios |

---

## Oversight Level

**Medium** — share this DoR artefact with the tech lead before starting the inner coding loop.

---

## Verdict

✅ **PROCEED**

---

## Coding Agent Instructions

### Scope

Implement the GitHub Actions CI adapter. This story adds two new files and extends the workflow YAML. The collect logic (caa.1) must be DoD-complete before this story is implemented.

### Files you may touch

| File | Action |
|------|--------|
| `scripts/ci-adapters/github-actions.js` | Create — implements `{ upload, postComment }` interface |
| `scripts/ci-adapters/README.md` | Create — documents interface contract and adapter addition process |
| `.github/workflows/assurance-gate.yml` | Modify — add upload and comment steps |
| `tests/check-caa2-adapter.js` | Create — new test file |
| `package.json` | Add `tests/check-caa2-adapter.js` to test chain only — zero new `dependencies` or `devDependencies` |

### Files you must NOT touch

`scripts/trace-report.js`, `dashboards/`, `src/`, `artefacts/`, `standards/`, `.github/skills/`, `.github/templates/`, any file outside the above list.

### Acceptance Criteria to implement

**AC1:** Workflow step uploads `.ci-artefact-staging/[slug]/` as artifact named `governed-artefacts-[slug]-[GITHUB_RUN_ID]`. Accessible from the workflow run's Artifacts section.

**AC2:** A PR comment is posted containing: the phrase `"Governed artefact chain"`, the artifact download URL, and the feature slug.

**AC3:** The adapter dispatch mechanism (loading adapter by `ci_platform` value) is purely additive — a second adapter file can be added with no changes to `trace-report.js`, `assurance-gate.yml`, or any other file.

**AC4:** `scripts/ci-adapters/README.md` documents: the `upload(stagingDir, runId)` and `postComment(issueRef, summaryLink)` method signatures, expected return types, how to add a new adapter, and which `ci_platform` value maps to which adapter file.

**AC5:** `assurance-gate.yml` permissions block does NOT include `contents: write`. Maximum permissions: `contents: read`, `pull-requests: write`.

### NFR constraints — CRITICAL

- Security: workflow comment step must use `${{ github.token }}` only. No PAT or stored secret.
- Permissions: `contents: write` is FORBIDDEN in `assurance-gate.yml`. This is an ADR-009/PAT-08 constraint.
- Idempotency: if the workflow runs twice on the same PR, the adapter must either update the existing comment in-place or post a new one. Silent skip or silent failure is a failing outcome.
- Zero new npm deps. The `actions/upload-artifact` action is a GitHub-managed action, not an npm package — it is acceptable. The `gh` CLI is available on GitHub-hosted runners — its use does not introduce npm deps.

### Test file

Create `tests/check-caa2-adapter.js`. Mock the upload call and `gh` CLI invocation — do not make real GitHub API calls in tests. Assert on artifact name pattern and comment body contents. Test count target: 10 (7 unit + 1 integration + 2 NFR).

### Commit message format

`feat(caa.2): github-actions adapter — upload artifact + PR comment`

### Definition of done for this story

`npm test` passes. AC verification script Scenarios 1–4 PASS. Scenario 5 (live CI) is confirmed on a real PR. Open a draft PR — do not mark ready for review. Do not merge.

### Dependency note

caa.3 wraps this story's steps behind a `context.yml` condition gate. Implement caa.2 fully first; caa.3 adds the condition layer on top.
