## Epic: Platform Observability & Measurement — Status Reporting, Archive UX, and Benefit Comparison

**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md
**Slicing strategy:** Value-first — each story is independently deployable; p4-obs-status ships first as it has no UI dependency; p4-obs-archive extends existing archive infrastructure; p4-obs-benefit is standalone measurement tooling

## Goal

The platform produces structured visibility into its own operation. Operators can generate daily and weekly status reports without manually reading `pipeline-state.json`. The pipeline viz remains performant as story count grows by toggling and archiving completed epics/stories. Delivery performance with the Copilot+platform approach is measured against a counterfactual traditional SDLC baseline, producing evidence that the platform delivers its claimed benefit.

## Out of Scope

- Real-time dashboard updates or WebSocket live state (static report generation only)
- Automated report delivery (email, Slack, Teams) — report generation only; delivery is operator-triggered
- Comparative analysis across multiple repositories — single-repo scope
- Replacing the existing feature-level archive mechanism (psa.1) — story-level archive extends it, not replaces it
- A/B testing or controlled experiment infrastructure beyond structured comparison data collection

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|------------------------|
| M2: Consumer confidence | 0 unassisted onboardings | ≥1 team member completes outer loop unassisted | Status reporting and archive toggle reduce operator friction, contributing to unassisted outer-loop completion confidence |
| MM-A through MM-D: Experiment meta-metrics | EXP-001 framework committed | Sonnet vs Opus comparison complete | p4-obs-benefit creates the benefit comparison infrastructure that feeds operator-level delivery evidence back into platform improvement decisions |

## Stories in This Epic

- [ ] p4-obs-status — Generate pipeline status report (daily/weekly) from pipeline state
- [ ] p4-obs-archive — Story/epic archive toggle for viz and state file performance
- [ ] p4-obs-benefit — Benefit measurement expansion: platform vs traditional SDLC comparison

## Human Oversight Level

**Oversight:** Medium
**Rationale:** No governance enforcement changes. No schema changes required beyond extending the existing archive schema (psa.1 precedent). Status report and benefit comparison are new scripts with no pipeline-state write path. Viz changes are additive (toggle visibility only). Standard PR review process applies.

## Complexity Rating

**Rating:** 2 (aggregate)
- p4-obs-status: 1 — reads state, generates markdown, no new state writes
- p4-obs-archive: 2 — extends existing archive module + viz toggle UI change
- p4-obs-benefit: 2 — new script with structured data collection and comparison reporting

## Scope Stability

**Stability:** Stable — no upstream spike dependencies; all three stories have clear implementation paths from existing codebase patterns
