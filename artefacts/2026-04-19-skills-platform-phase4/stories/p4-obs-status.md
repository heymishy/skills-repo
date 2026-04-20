## Story: Generate pipeline status report (daily/weekly) from pipeline state

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e5-platform-observability.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **platform operator or delivery lead**,
I want to **generate a structured daily or weekly pipeline status report from `pipeline-state.json` with a single CLI command**,
So that **I can communicate risk, progress, and key delivery measures to stakeholders without manually extracting data from the pipeline state, moving M2 (Consumer confidence) by reducing the overhead of operating the pipeline**.

## Benefit Linkage

**Metric moved:** M2 — Consumer confidence
**How:** A team member onboarding to the platform needs to understand at a glance what is in-flight, what is blocked, and whether delivery is on track. Without structured reporting, this requires reading raw JSON state — a friction point that reduces confidence in the platform as a daily-use tool. This story eliminates that friction by generating a human-readable report from the same state file the pipeline already maintains.

## Architecture Constraints

- ADR-001: CommonJS modules (`require`/`module.exports`) — no ESM, no TypeScript, no transpilation
- Read-only: `generate-status-report.js` must not write to `pipeline-state.json` or `pipeline-state-archive.json`; it reads only
- ADR-004 equivalent: no hardcoded org names, feature slugs, or operator names in report output — all data sourced from state file content
- Reads both `pipeline-state.json` and `pipeline-state-archive.json` (via `archive-completed-features.js` `mergeState()`) to include archived stories in weekly completed counts
- Output format: Markdown only — no HTML, no external rendering dependencies
- MC-SEC-02: no credentials, tokens, or API keys in any output path (stdout or file write)

## Dependencies

- **Upstream:** psa.1 (archive-completed-features.js) must be present — weekly report reads merged state via `mergeState()`; psa.1 is DoD-complete ✅
- **Downstream:** p4-obs-benefit — weekly report summary row for latest benefit experiment data point; can ship independently; benefit row is omitted if no comparison data exists

## Acceptance Criteria

**AC1:** Given `node scripts/generate-status-report.js --daily`, When the script runs against a `pipeline-state.json` with at least one in-flight story, Then the output markdown contains all five required sections: `## In-Flight Stories`, `## Blocked Items`, `## Pending Human Actions`, `## Recent Activity`, and `## Test Count`; and each in-flight story appears in the In-Flight Stories section with its ID, current phase, and days-in-phase value.

**AC2:** Given `node scripts/generate-status-report.js --weekly`, When the script runs against a pipeline state with at least one DoD-complete story and at least one active metric signal, Then the output markdown contains all five required sections: `## This Week`, `## Pipeline Funnel`, `## Metric Signal Health`, `## Cycle Time`, and `## Risk Flags`; and the Metric Signal Health table includes one row per metric signal present in the state, with status (on-track / at-risk / exceeded) and current-vs-target values.

**AC3:** Given either `--daily` or `--weekly` mode, When `--output <filepath>` is supplied, Then the report is written to the specified path and nothing is printed to stdout; when `--output` is omitted, the full report is printed to stdout and no file is written.

**AC4:** Given `pipeline-state-archive.json` exists alongside `pipeline-state.json`, When a weekly report is generated, Then stories in the archive whose `dodAt` date falls within the current reporting week (Monday–Sunday) are counted in the "Stories completed this week" figure; stories outside the window are not counted.

**AC5:** Given any pipeline state, When the daily or weekly report is generated, Then no line in the output contains a hardcoded string matching the pattern `heymishy`, `skills-repo`, or any operator personal name — all labels and identifiers come from the state file content.

## Out of Scope

- Automated scheduling or CI-triggered report generation — operator-triggered only
- Report delivery (email, Slack, Teams notifications)
- Cross-repository aggregation
- Interactive or real-time dashboard updates
- Parsing `workspace/estimation-norms.md` for actuals integration (that is p4-obs-benefit scope)

## NFRs

- **Security:** No credentials, tokens, API keys, or session identifiers in any report output (MC-SEC-02)
- **Correctness:** All five daily sections and all five weekly sections must be present and non-empty when the corresponding data exists in state; sections with no data render with a "None" placeholder, not an error
- **Performance:** Report generation for a pipeline state of up to 100 stories completes within 3 seconds

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable — reads existing state format; no new schema fields required

## Definition of Ready Pre-check

See: artefacts/2026-04-19-skills-platform-phase4/dor/p4-obs-status-dor.md
