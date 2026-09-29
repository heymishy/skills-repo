## Epic: Signal seeding & `/improve` loop closure

**Discovery reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/benefit-metric.md
**Slicing strategy:** walking-skeleton

## Goal

Operators can click a signal's CTA, seed a skill session with that signal as context, and run the full `/improve` skill execution path from the web UI to completion, producing improvement proposals. The improvement loop (signal → seed → session → proposal) is fully accessible end-to-end without CLI or IDE access.

## Out of Scope

- Signal filtering, sorting, dismissal, or bulk actions (deferred to Phase 5 UX enhancements)
- Automated scheduling or CI-triggered `/improve` runs (MVP is operator-triggered only)
- Cross-repo or cross-team signal aggregation (single-repo only; Phase 6 enterprise federation)
- Caching or performance optimization beyond the walking skeleton (Phase 5 performance story)
- Multi-tenant per-tenant signal isolation (deferred; MVP assumes single workspace per deployment)

## Benefit Metrics Addressed

[See benefit-metric artefact: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/benefit-metric.md]

## Stories in This Epic

- [Not specified by the definition session]

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Signal seeding requires correct injection of signal context into the skill session model (ADR-023 artefact-content injection); `/improve` execution may have multi-turn or multi-file-read patterns not yet tested in the web UI. Medium oversight ensures the session model handles signal seeds correctly before full closure.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Unstable (depends on `/improve` skill's actual execution model in web UI, which is unconfirmed)
