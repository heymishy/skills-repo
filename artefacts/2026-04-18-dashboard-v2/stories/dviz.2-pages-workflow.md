# Story: dviz.2 — GitHub Pages deployment workflow

**Feature:** `2026-04-18-dashboard-v2`
**Story ID:** `dviz.2`
**Epic:** Dashboard v2 — live data wiring
**Type:** Feature
**Complexity:** 1
**Oversight level:** Low

---

## User story

As a platform maintainer,
I want `dashboards/` to be automatically published to GitHub Pages on every push to `master`,
So that the live dashboard URL is always up-to-date with the latest pipeline state and design without any manual deployment step.

---

## Background / context

`dashboards/README.md` already documents the intended GitHub Pages deployment. The workflow file `.github/workflows/pages.yml` is referenced but does not exist. This story creates it.

The workflow must:
- Use the `actions/deploy-pages` / `actions/upload-pages-artifact` pattern for the GitHub Actions Pages deployment (not the legacy `gh-pages` branch approach, which requires a PAT)
- Trigger on push to `master` for any file under `dashboards/`
- Also trigger on push to `master` for `.github/pipeline-state.json` so the published dashboard reflects state updates
- Serve the `dashboards/` folder as the site root (so `https://<org>.github.io/<repo>/` resolves to `dashboards/index.html`)
- Not require any build step — the folder is served as static files

---

## Acceptance criteria

**AC1:** A file `.github/workflows/pages.yml` exists and is valid GitHub Actions YAML. It triggers on `push` to `master` when changes affect `dashboards/**` or `.github/pipeline-state.json`.

**AC2:** The workflow uses `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages` (current Pages deployment pattern — no PAT, no `gh-pages` branch).

**AC3:** The workflow sets correct `permissions`: `contents: read`, `pages: write`, `id-token: write`.

**AC4:** The `upload-pages-artifact` step uses `path: dashboards` (not the repo root), so only the `dashboards/` folder is served.

**AC5:** The workflow does NOT embed any secrets, PATs, or credentials directly in the YAML file (MC-SEC-02). It uses the `GITHUB_TOKEN` provided automatically by Actions.

---

## Out of scope

- Authentication or branch-protection bypass for Pages.
- Custom domains.
- Any changes to `dashboards/` HTML/JS files.

---

## Technical notes

- The one-time repo admin action (Settings → Pages → Source: GitHub Actions) is documented in `dashboards/README.md` and is NOT part of this story's ACs — it is an operator action.
- Workflow must NOT use `actions/checkout` with `persist-credentials: true` beyond what is needed.
