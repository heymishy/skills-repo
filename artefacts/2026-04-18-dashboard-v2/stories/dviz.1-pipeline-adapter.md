# Story: dviz.1 — Pipeline data adapter

**Feature:** `2026-04-18-dashboard-v2`
**Story ID:** `dviz.1`
**Epic:** Dashboard v2 — live data wiring
**Type:** Feature
**Complexity:** 2
**Oversight level:** Low

---

## User story

As a developer or tech lead running the skills pipeline,
I want `dashboards/index.html` to load and render the actual features, epics, and stories from `.github/pipeline-state.json`,
So that I no longer need to maintain mock data in the HTML and the dashboard reflects real delivery state at all times.

---

## Background / context

`dashboards/index.html` was designed against hardcoded `CYCLES`, `EPICS`, and `STORIES` mock constants embedded at line ~1027. `pipeline-state.json` stores the same data under `features[].epics[].stories[]` with different field names and a stage-based state machine rather than the explicit `state` / `phase` fields the dashboard expects.

The adapter is a new `dashboards/pipeline-adapter.js` file that:
1. Loads `.github/pipeline-state.json` relative to the repo root (resolved at page-load via `fetch` when served via GitHub Pages, or via a pre-baked `window.__PIPELINE_STATE__` injection for local use)
2. Transforms the data into the shapes `CYCLES`, `EPICS`, `PHASES` the dashboard's React components expect
3. Exposes these as `window.CYCLES`, `window.EPICS`, `window.PHASES`
4. The `<script src="pipeline-adapter.js">` tag is inserted in `index.html` before the `<script type="text/babel">` block; the Babel block replaces its inline mock arrays with reads from `window.CYCLES` etc.

**Stage → phase-index mapping (12-step pipeline):**

| pipeline-state stage | phase key | phase index (1-12) |
|---|---|---|
| discovery | discovery | 1 |
| benefit-metric | benefit | 2 |
| definition | definition | 3 |
| review | review | 4 |
| test-plan | testplan | 5 |
| definition-of-ready | dor | 6 |
| issue-dispatch / dispatched | dispatch | 7 |
| subagent-execution / implementation | inner | 8 |
| ci-assurance | assurance | 9 |
| definition-of-done | dod | 10 |
| trace | trace | 11 |
| improve | improve | 12 |

**Health + dodStatus → story state mapping:**

| Conditions | Dashboard state |
|---|---|
| `dodStatus: "complete"` | `done` |
| `health: "red"` | `blocked` |
| `stage` in [review, test-plan, definition-of-ready] | `review` |
| `health: "green"` and stage is current active | `current` |
| Otherwise | `queued` |

---

## Acceptance criteria

**AC1:** Given `dashboards/index.html` is loaded in a browser with `pipeline-adapter.js` present, when `pipeline-state.json` is available at the expected path, then all features in `features[]` are rendered as CYCLES in the swimlane view with correct names and phase-focus indicators.

**AC2:** Given a feature in `pipeline-state.json` with epics, when the dashboard renders, then each epic appears as a row in the correct cycle group with its stories placed in the correct phase columns (verified against the stage→phase-index mapping table above).

**AC3:** Given a story with `dodStatus: "complete"`, when rendered, its chip shows the `done` (green) state. Given a story with `health: "red"`, its chip shows the `blocked` (fail) state.

**AC4:** Given `pipeline-state.json` is not available (offline / missing file), when the dashboard loads, it falls back gracefully to the hardcoded mock data (i.e. shows something useful rather than a blank page or uncaught error) and logs a warning to the console.

**AC5:** `dashboards/pipeline-adapter.js` contains no credentials, API keys, or hardcoded user identifiers. All data sourced from `pipeline-state.json` only (MC-SEC-02).

---

## Out of scope

- Wiring the six secondary tab views (Outcomes, Governance, Guardrails, Storymap, Benefits, Fleet) to real data — they continue to load from `extra-data.js` mock.
- Modifying `pipeline-state.json` schema.
- Modifying `pipeline.html` (per-cycle feature dashboard).

---

## Technical notes

- The adapter must work without a build step: plain ES5/ES2015 `<script>` tag.
- `fetch` is used when `window.location.protocol !== 'file:'`; on `file:` protocol (local open), fall through to the mock.
- The `window.__PIPELINE_STATE__` escape hatch allows a build script to inject pre-loaded state as a bundled constant (for environments where `fetch` won't work).
- OWASP: all rendering is via React's virtual DOM, not `innerHTML`. Values from `pipeline-state.json` are plain strings/numbers — no HTML is embedded in the state file, so XSS risk is negligible.
