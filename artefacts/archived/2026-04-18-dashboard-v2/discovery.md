# Discovery: Dashboard v2 — pipeline-state.json-driven portfolio visualiser

**Feature slug:** `2026-04-18-dashboard-v2`
**Date:** 2026-04-18
**Status:** Approved
**Approved by:** Hamish, 2026-04-18

---

## Product context (extracted)

**Target users:** Developer/engineer (primary), Tech lead/squad lead (primary), Platform maintainer (primary) — all consume the pipeline visualiser as their primary window into delivery state.
**Known constraints:** file-system-native, no proprietary runtime, no hosted service, no vendor lock-in; `regulated: false`; personal-scope repo.
**Tech stack:** JavaScript/Node.js runtime; React 18/Babel (CDN-pinned) for dashboard UI; GitHub Actions CI; GitHub Pages for hosting.

**EA registry check (authoritative: true):** No EA registry entry found for `pipeline-viz` or `dashboard`. Proceeding without blast-radius data — internal tooling, no downstream consumers in the registry.

---

## 1. Problem statement

The current `pipeline-viz.html` (`.github/pipeline-viz.html`) is a single-file, monolithic HTML visualiser that has grown incrementally over many sprints into a ~2 000-line file with inline CSS, JS, and Go-template-style data wiring. It is difficult to extend, test, or audit. A significantly richer replacement has been designed and placed in `dashboards/` — a React-based multi-view portfolio dashboard (`index.html`) with light/dark theming, swimlane and kanban layout modes, outcome tracking, governance visibility, guardrail compliance, story mapping, benefits, and fleet panels. The new design has been built against mock data. It is not yet wired to the real `pipeline-state.json`, is not published (no GitHub Pages workflow), and governance checks do not yet cover the new files. Until this work is done, the new dashboard cannot replace `pipeline-viz.html` as the operational live-delivery view.

## 2. Who it affects

**Developer/engineer:** Currently opens pipeline-viz.html locally or via the GitHub Pages preview. Will switch to `dashboards/index.html` for all delivery-state reads once wired to real data.

**Tech lead/squad lead:** Uses the visualiser to monitor story flow, spot blockers, and track which stories are waiting for DoR sign-off. The new design surfaces governance status, blocker details, and outcome signals in a single view — increasing the signal per minute spent reviewing state.

**Platform maintainer:** Responsible for keeping the visualiser in sync with the pipeline schema. Currently maintains a parallel governance sync check (`check-viz-syntax.js`, `check-governance-sync.js`) against the old file. Needs the same governance coverage extended to the new dashboard.

## 3. Why now

The `skill-performance-capture` feature (completed 2026-04-18) brought the pipeline to a stable-enough state that a second-generation visualiser is justified. The new design has been built. The only reason it is not live is the three discrete plumbing items identified above (data wiring, Pages, governance). Deferring this is low-risk as an isolated change, but the longer it sits as a mock-only prototype, the more the design drifts from the live schema.

## 4. MVP scope

The smallest useful state is: `dashboards/index.html` loads and renders the actual features, epics, and stories from `.github/pipeline-state.json` at page load — no backend, no build step, no extra network call beyond the CDN script pins already in the file. Specifically:

1. A `dashboards/pipeline-adapter.js` script translates `pipeline-state.json` shape (`features[].epics[].stories[]`) into the `CYCLES`, `EPICS`, `STORIES` constants the dashboard expects. Story `stage` + `health` → dashboard `state` (done / current / blocked / review / queued). Feature `stage` → `focus` (pipeline phase key).
2. A `.github/workflows/pages.yml` GitHub Actions workflow that publishes `dashboards/` to GitHub Pages on push to `master`.
3. Governance: `viz-check` syntax validation extended to cover `dashboards/` JS files (not only `pipeline-viz.html`); `npm test` chain updated.

The six secondary views (Outcomes, Governance, Guardrails, Story Map, Benefits, Fleet) are loaded from `extra-data.js` and remain mock/demonstration data for this version — they are not wired to real data in this MVP.

## 5. Out of scope

- **Deleting `pipeline-viz.html`:** The old visualiser is kept alongside the new one for the duration of this feature. Deprecation/deletion is a separate story once the new dashboard is confirmed stable in production.
- **Wiring secondary views (Outcomes, Governance, Guardrails, Storymap, Benefits) to real data:** These views are demonstration-quality in the current design and stay mock. Real-data wiring for these is a follow-on feature.
- **Fleet view real-data wiring:** `fleet-state.json` integration for the Fleet panel is deferred to a follow-on feature.
- **The `pipeline.html` per-cycle dashboard:** The single-cycle/per-feature deeper-dive view is out of scope. It can remain mock or be addressed in a follow-on story.
- **Authentication or access control:** The GitHub Pages deployment is public (or protected at the repository level only). No per-user access control is in scope.
- **Schema migration:** No fields are being added to `pipeline-state.json` for this feature. The adapter works with the existing schema as-is.

## 6. Assumptions and risks

- **Assumption A1:** The browser `fetch` API (or a bundled JSON import via a generated JS file) can load `pipeline-state.json` from the same origin when served via GitHub Pages. If cross-origin restrictions apply, the adapter will need to bundle the state as a JS constant at deploy time.
- **Assumption A2:** The stage → phase-index and health → state mappings defined in the adapter are consistent with how the existing `viz-functions.js` models these transitions. Risk: if the mappings diverge, stories will appear in the wrong column.
- **Risk R1:** The dashboard's mock `CYCLES` / `EPICS` / `STORIES` structure is a superset of what pipeline-state.json provides today (e.g. it includes a `note` field on each cycle, a `risk` field on each epic). The adapter will need to synthesise or omit these fields gracefully.
- **Risk R2:** The `pages.yml` workflow needs the GitHub Pages source set to "GitHub Actions" (not the legacy "Deploy from a branch" mode) — this is a one-time repo-admin action outside the scope of the code change.

## 7. Directional success indicators

- Opening `dashboards/index.html` from the GitHub Pages URL renders the correct features and stories from the live `pipeline-state.json` without any manual editing of the HTML.
- The `npm test` suite passes with `viz-check` covering `dashboards/` JS files alongside `pipeline-viz.html`.
- The CI `pages.yml` workflow completes without error on a push to `master`.

## 8. Constraints

- No build step: the adapter must be a plain `.js` file loaded via `<script src>` in the HTML, or a generated file produced by a lightweight Node script — no webpack, Parcel, or bundler.
- CDN pins (React 18.3.1, Babel 7.29.0, fonts) already in `index.html` must not change (integrity hashes are set).
- OWASP: no user-supplied content is rendered via `innerHTML` without sanitisation; the dashboard renders only from controlled pipeline-state.json content.
- Must not break the existing `npm test` suite or pre-commit hooks.

---

## E1 estimate (rough — at discovery)

**Focus time:** ~3–5 hours operator focus across 3 stories.
**Complexity:** 2 (Some ambiguity — the `fetch` vs bundled-JS loading approach needs a spike-lite to confirm.)
**Scope stability:** Stable.
