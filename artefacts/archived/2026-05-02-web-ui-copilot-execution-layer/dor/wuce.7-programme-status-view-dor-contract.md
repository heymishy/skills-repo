# Contract Proposal: Programme manager pipeline status view

**Story:** wuce.7
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-02

---

## Components built by this story

- Express route handler: `GET /status` — returns portfolio status board with one row per feature
- Pipeline status adapter: `src/adapters/pipeline-status.js` — `getPipelineStatus(featureSlug, token)` — reads `pipeline-state.json` from GitHub Contents API; reads only existing fields (`stage`, `prStatus`, `dorStatus`, `traceStatus`)
- Status board rendering: feature name, pipeline stage, last-activity date, blocker indicator, link to artefact index
- Amber warning indicator for `traceStatus: "has-findings"` → "Trace findings" label (not generic "blocked")
- "Awaiting implementation dispatch" label for `dorStatus: "signed-off"` + `prStatus: "none"` combination
- "Done" group: features where all stories have `prStatus: "merged"` AND `traceStatus: "passed"` — visually separated from in-progress features
- "Export as Markdown" handler: `GET /status/export` — returns `.md` file with pipeline status summary table
- Test fixtures: reuses `tests/fixtures/github/pipeline-state-feature.json`

## Components NOT built by this story

- Editing pipeline-state.json values — read-only
- WebSocket/real-time updates — v1 is request/response only
- Gantt or timeline view
- Historical status trend chart
- Custom dashboard widget configuration

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | Portfolio board with stage/date/blocker/link | `GET /status returns rows for each feature`, `each row contains stage, last-activity, blocker indicator, link`, `read access validated before serving` |
| AC2 | `traceStatus: "has-findings"` → amber warning + "Trace findings" | `feature with has-findings → amber indicator rendered`, `label text is "Trace findings" not "blocked"`, `amber indicator has text label not just colour` |
| AC3 | `dorStatus: "signed-off"` + `prStatus: "none"` → "Awaiting implementation dispatch" | `feature with signed-off dor and no PR → "Awaiting implementation dispatch" label`, `other combinations do not show this label` |
| AC4 | "Export as Markdown" → .md download | `GET /status/export returns markdown content type`, `exported file contains status summary table`, `table can be pasted into markdown document` |
| AC5 | All merged+traced → "Done" group | `feature with all prStatus merged and traceStatus passed → in Done group`, `Done group visually separated from in-progress`, `done condition uses only existing pipeline-state fields` |

## Assumptions

- `pipeline-state.json` is present in the configured repository at `.github/pipeline-state.json`
- The adapter reads this file via the GitHub Contents API using the user's token
- Status board displays features from the configured repositories (reuses repository list from wuce.5/wuce.6)

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/routes/status.js` | Create | Status board and export route handlers |
| `src/adapters/pipeline-status.js` | Create | `getPipelineStatus` adapter |
| `src/utils/status-export.js` | Create | Markdown export generator |
| `src/app.js` | Extend | Mount status routes |
| `tests/programme-status-view.test.js` | Create | 21 Jest tests for wuce.7 |
| `tests/fixtures/github/pipeline-state-feature.json` | Reuse | Already created by wuce.5 |

## Contract review

**APPROVED** — all components are within story scope, AC → test mapping is complete, no new pipeline-state.json fields introduced, no scope boundary violations identified.
