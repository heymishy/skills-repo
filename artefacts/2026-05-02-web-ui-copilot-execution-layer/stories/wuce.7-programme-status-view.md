## Story: Programme manager pipeline status view

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e2-phase1-full-surface.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **programme manager**,
I want to see a consolidated status view showing the current pipeline phase, health, and any blockers for every feature across my portfolio,
So that I can report on delivery progress to a steering committee directly from the web UI — without needing an engineer to prepare a status update.

## Benefit Linkage

**Metric moved:** P4 — Status self-service rate
**How:** This story directly delivers the self-service status view that P4 measures — a programme manager who can open a URL and answer "what is blocked and why?" without engineering involvement has activated the metric.

## Architecture Constraints

- ADR-012: status data must be read from `pipeline-state.json` via the SCM adapter pattern — `getPipelineStatus(featureSlug, token)` — not by parsing artefact markdown files
- ADR-003: no new `pipeline-state.json` fields introduced in this story — the status view uses existing fields (`stage`, `prStatus`, `dorStatus`, `traceStatus`)
- Mandatory security constraint: status data must only be served for repositories the authenticated user has read access to

## Dependencies

- **Upstream:** wuce.6 (feature navigation provides the feature list this view builds on)
- **Downstream:** None — this is a read-only view; no story depends on the status view being present

## Acceptance Criteria

**AC1:** Given an authenticated user navigates to `/status`, When the page loads, Then they see a portfolio status board with one row per feature showing: feature name, current pipeline stage, last-activity date, blocker indicator (if any stage gate is failing), and a link to the feature's artefact index.

**AC2:** Given a feature has `traceStatus: "has-findings"` in `pipeline-state.json`, When the status board renders that feature, Then the row displays a visible amber warning indicator and a "Trace findings" label — not a generic "blocked" message.

**AC3:** Given a feature has a story with `dorStatus: "signed-off"` and `prStatus: "none"`, When the status board renders, Then the feature row indicates "Awaiting implementation dispatch" — a clear actionable status label.

**AC4:** Given a programme manager views the status board and clicks "Export as Markdown", When the download is generated, Then a `.md` file is produced with a pipeline status summary table that can be pasted directly into a steering committee report.

**AC5:** Given a feature has all stories with `prStatus: "merged"` and a `dodStatus: "complete"` entry, When the status board renders, Then the feature is shown in a "Done" group, visually separated from in-progress features.

## Out of Scope

- Editing pipeline-state.json values from the status view — read-only
- Custom dashboard configuration or widget personalisation — post-MVP
- Real-time live-updating (WebSocket push) — acceptable as polling with a 60-second interval for v1
- Gantt or timeline view — post-MVP
- Historical status trend chart — post-MVP

## NFRs

- **Security:** Only repositories the user can read are included. No cross-org data exposure.
- **Performance:** Status board for up to 30 features loads in under 5 seconds.
- **Accessibility:** Status board table meets WCAG 2.1 AA — colour is not the sole indicator of status (icon or text label used alongside colour), keyboard-navigable rows, screen reader row descriptions.
- **Audit:** Status board access logged with user ID and feature count surfaced.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
