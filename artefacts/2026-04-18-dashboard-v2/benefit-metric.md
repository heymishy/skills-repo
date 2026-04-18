# Benefit Metric: Dashboard v2

**Feature:** `2026-04-18-dashboard-v2`
**Discovery approved:** 2026-04-18
**Status:** Active

---

## Meta-benefit classification

This is a **tooling / developer-experience** feature within the skills platform itself (dogfood delivery). The primary beneficiary is the operator running the pipeline. Metrics are therefore focused on tooling fidelity and operator trust rather than product outcomes.

---

## M1 — Dashboard data fidelity

**Question:** Does the new dashboard accurately represent the live pipeline state?

**Metric:** Proportion of stories rendered in the correct pipeline phase column vs the corresponding `stage` field in `pipeline-state.json`.

**Baseline:** N/A (new dashboard — not yet live).

**Target:** 100% — every story in `pipeline-state.json` appears in its correct phase column when the dashboard loads.

**Measurement method:** Manual spot-check after deploying with real `pipeline-state.json`: compare rendered story positions against expected positions from a known state snapshot. Can be automated with a Playwright/Puppeteer test if coverage test is warranted.

**Signal:** `not-yet-measured`
**Evidence:** `null`
**Last measured:** `null`

---

## MM1 — CI governance coverage

**Question:** Does `npm test` catch a syntax error introduced in any `dashboards/` JS file?

**Metric:** Boolean — does the `viz-check` (or equivalent) governance check fail when a deliberate syntax error is injected into `dashboards/pipeline-adapter.js`?

**Baseline:** Currently `viz-check` only covers `pipeline-viz.html`; a syntax error in `dashboards/` goes undetected.

**Target:** Failure — a breakage in any `dashboards/*.js` file is caught by `npm test` before merge.

**Measurement method:** Integration test in `tests/check-dashboard-viz.js` (created by dviz.3).

**Signal:** `not-yet-measured`
**Evidence:** `null`
**Last measured:** `null`

---

## MM2 — GitHub Pages deployment health

**Question:** Does a push to master trigger a successful Pages deployment?

**Metric:** Boolean — `pages.yml` workflow completes without error on the first post-merge run.

**Baseline:** No Pages workflow; dashboard is not publicly accessible.

**Target:** Green — `pages.yml` runs to completion, dashboard accessible at `https://heymishy.github.io/skills-repo/`.

**Measurement method:** Check the Actions tab after merging dviz.2. Monitor the `pages build and deployment` workflow run.

**Signal:** `not-yet-measured`
**Evidence:** `null`
**Last measured:** `null`

---

## Out of scope (deferred metrics)

- Story rendering accuracy for secondary views (Outcomes, Governance, Fleet) — deferred pending real-data wiring.
- Load time / performance benchmarks — not justified for a single-operator tooling page.

---

## Capture block (instrumentation)

_Instrumentation is disabled for this session (`instrumentation.enabled` not set). No capture block appended._
