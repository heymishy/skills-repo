# DoR Contract: caa.2 — GitHub Actions adapter

**Story:** artefacts/2026-04-23-ci-artefact-attachment/stories/caa.2-github-actions-adapter.md
**Approved by:** [tech lead — to be confirmed]
**Date:** 2026-04-23

---

## What will be built

1. `scripts/ci-adapters/github-actions.js` — implements the `CIAdapter` interface:
   - `upload(stagingDir, runId)` → uploads staging dir as GitHub Actions artifact named `governed-artefacts-[slug]-[runId]`; returns `{ artifactUrl: string }`
   - `postComment(issueRef, summaryLink)` → posts PR comment containing `"Governed artefact chain"`, the summary link, and the feature slug
2. `scripts/ci-adapters/README.md` — documents interface contract, method signatures, return types, how to add a new adapter, `ci_platform` mapping table.
3. Two new steps in `.github/workflows/assurance-gate.yml`:
   - Upload step: runs `actions/upload-artifact@v4` with name `governed-artefacts-[slug]-${{ github.run_id }}`
   - Comment step: runs `gh pr comment` with the required phrase + artifact URL
4. Permissions block in `assurance-gate.yml`: `contents: read`, `pull-requests: write` (no `contents: write`).

---

## What will NOT be built

- Adapters for any other CI platform.
- Long-term artifact archival or post-merge write-back.
- Issue comment support (PR comments only).
- Any changes to `scripts/trace-report.js` or any file outside the listed touch points.

---

## AC verification approach

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — artifact name `governed-artefacts-[slug]-[run-id]` | Unit: mock upload asserts name; Integration: inject mock | unit + integration |
| AC2 — PR comment with 3 required strings | Unit: mock postComment captures body, asserts 3 strings | unit |
| AC3 — second adapter is additive | Unit: load stub adapter via dispatch; assert no core file changes | unit |
| AC4 — README documents interface | Unit: string assertions on README content | unit |
| AC5 — no `contents: write` in workflow | Unit: read YAML file, assert absence | unit |

---

## Assumptions

- `GITHUB_RUN_ID` is available as env var in the workflow (it is — built-in GitHub Actions context).
- `gh` CLI is pre-installed on GitHub-hosted runners (it is — `github.com/cli/cli` is bundled).
- `actions/upload-artifact@v4` is available (it is — GitHub-managed action, no npm dep).

---

## Estimated touch points

| Category | Items |
|----------|-------|
| Files created | `scripts/ci-adapters/github-actions.js`, `scripts/ci-adapters/README.md`, `tests/check-caa2-adapter.js` |
| Files modified | `.github/workflows/assurance-gate.yml`, `package.json` (test chain only) |
| Files NOT touched | `scripts/trace-report.js`, all other files |

---

## schemaDepends

Not applicable — caa.2 introduces no new fields to `pipeline-state.json`.
