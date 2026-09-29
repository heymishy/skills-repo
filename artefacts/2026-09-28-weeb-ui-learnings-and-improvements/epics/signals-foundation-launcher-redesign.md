## Epic: Signals foundation & launcher redesign

**Discovery reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/benefit-metric.md
**Slicing strategy:** walking-skeleton

## Goal

Operators can see improvement signals surfaced from 12 workspace/framework sources in the web UI dashboard, navigate to them, and the skill launcher shows only 5 valid entry-point skills (discovery, ideate, reverse-engineer, spike, improve) as primary CTAs, with all 27+ chained skills hidden from the primary launcher view. The walking skeleton establishes end-to-end signal visibility and rationalized entry points; subsequent epics will add signal seeding and `/improve` execution.

## Out of Scope

- Per-source parsing robustness (capture-log YAML, proposals directory, DoD markdown details) — deferred to Epic 2
- Signal-to-session seeding bridge (CTA → skill launch with signal injected as priorArtefacts) — deferred to Epic 2
- `/improve` skill execution via web UI — deferred to Epic 2
- Signal filtering, sorting, dismissal, or bulk actions — deferred to Phase 5 enhancements
- Multi-tenant signal isolation or cross-repo aggregation — out of scope; MVP assumes single workspace per deployment
- Caching or performance optimization (acceptable <200ms for solo operator scale) — deferred to Phase 5 performance story

## Benefit Metrics Addressed

[See benefit-metric artefact: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/benefit-metric.md]

## Stories in This Epic

- [ ] Signals aggregator module: read all 12 sources and normalize to Signal shape — artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s1.md
- [ ] Signals panel route handler: `/api/signals` endpoint — artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s2.md
- [ ] Skill launcher redesign: show 5 primary CTAs, hide chained skills — artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s3.md

## Human Oversight Level

**Oversight:** Medium
**Rationale:** The signals aggregator touches 12 different file types and formats across the workspace, requiring robust parsing and error handling. The launcher redesign is high-visibility (operator's first interaction with the web UI). Medium oversight ensures parsing fidelity and launcher clarity before seeding logic depends on it.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
