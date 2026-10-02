## Story: `/workflow` silent-skip warning signal
**Epic reference:** artefacts/2026-09-30-refactoring-and-product-health/epics/receipt-readers.md
**Discovery reference:** artefacts/2026-09-30-refactoring-and-product-health/discovery.md
**Benefit-metric reference:** artefacts/2026-09-30-refactoring-and-product-health/benefit-metric.md
**Domain:** software-engineering
## User Story
As a **Platform maintainer**,
I want **`/workflow` to surface a warning when it detects tasks in the active feature that have a `tddState` record but no `refactorReceipt` entry**,
So that **silent skips (tasks with `tddState` but no `refactorReceipt`) are visible during active delivery and not discovered only at DoD**.
## Benefit Linkage
Skipped-without-reason rate (Metric 2 — percentage of tasks with neither a receipt nor an explicit skip reason) — `/workflow` is the live signal during delivery; DoD and `/improve` are the retrospective signals.
## Architecture Constraints
ADR-011 (artefact-first: SKILL.md behavioural change requires story chain); Platform change policy; PAT-07 (the silent-skip check is a single addition at `/workflow`'s health-check exit point — grouped as one story).
## Dependencies
ep1-s1 (schema must declare `refactorReceipt` so its absence is detectable); ep1-s2 (protocol establishes what a silent skip means)
## Acceptance Criteria
Given `/workflow` is run on a feature where at least one task has a `tddState` record in `pipeline-state.json` but no `refactorReceipt` field,
When `/workflow` produces its health summary,
Then it surfaces a warning: "⚠️ Silent skip detected: [task-id] has a tddState record but no refactorReceipt. Add a receipt or an explicit skip reason via `bin/skills advance`."

Given `/workflow` is run on a feature where all tasks with `tddState` also have a `refactorReceipt` (either completed or skip),
When `/workflow` produces its health summary,
Then no silent-skip warning appears in the output.

Given `/workflow` is run on a feature with no tasks that have any `tddState` record (e.g. a feature not yet in the inner loop),
When `/workflow` produces its health summary,
Then no silent-skip warning appears and no error is raised.
## Out of Scope
- Automated enforcement or blocking of task completion on silent skips (warning only)
- Any changes to `/improve` or DoD (those are ep2-s2)
## NFRs
All existing `/workflow` health checks and pipeline state reporting are unchanged; the silent-skip warning is purely additive.
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
