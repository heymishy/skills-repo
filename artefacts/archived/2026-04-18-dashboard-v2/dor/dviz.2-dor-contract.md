# DoR Contract — dviz.2-pages-workflow

**Feature:** `2026-04-18-dashboard-v2`
**Story:** `dviz.2`
**Status:** Signed-off ✅

---

## File touchpoints

| # | File | Action | Justification |
|---|------|--------|---------------|
| 1 | `.github/workflows/pages.yml` | CREATE | GitHub Actions workflow deploying dashboards/ to GitHub Pages |
| 2 | `tests/check-dviz2-pages-workflow.js` | CREATE | Automated governance check — T1-T8 from dviz.2-test-plan.md |
| 3 | `package.json` | MODIFY | Add check-dviz2-pages-workflow.js to test chain |

---

## Out-of-scope constraints (do NOT touch)

- Existing workflow files under `.github/workflows/` — do not modify any existing file
- `dashboards/` files — no changes; this story only creates the deployment workflow
- `pipeline-state.json` — input file referenced by trigger; do not modify
- `artefacts/`, `.github/skills/`, `.github/templates/` — protected; do not modify

---

## Schema dependencies

None. This story creates a deploy workflow; it does not read or transform `pipeline-state.json`.

---

## Security constraints

- Use only `GITHUB_TOKEN` (implicit via `permissions:` block)
- `permissions.contents` must be `read` not `write`
- No PAT, no Action secrets referenced
- `id-token: write` required for OIDC deploy — this is expected and required by `deploy-pages`

---

## Environment configuration note

GitHub Pages must be enabled for the repository with source set to GitHub Actions (not branch-based). This is an operator prerequisite, not a code change. If Pages is not yet enabled, the workflow will exist but the deploy step will fail until the repository setting is configured.

---

## Dependency on other dviz stories

- dviz.2 is fully independent — no dependency on dviz.1 or dviz.3.
- dviz.1 (adapter) and dviz.2 (deploy) can proceed in any order or in parallel.
