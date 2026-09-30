## Epic: Signal seeding & `/improve` loop closure

**Discovery reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/benefit-metric.md
**Slicing strategy:** walking-skeleton

## Goal

Operators can see a real improvement signal in a web UI page, click its CTA, and land in a pre-populated new skill session with that signal injected as context — fully accessible without CLI or IDE access. **Scope correction (2026-10-01):** this Goal previously said the epic also runs the full `/improve` execution path "to completion, producing improvement proposals" — confirmed, on cross-checking against `discovery.md`'s own MVP scope and `benefit-metric.md`'s own Metric 3 target, to be scope creep beyond both. `discovery.md`'s Out of Scope section explicitly excludes "Full `/improve` skill execution via the web UI... the MVP seeds a new session; it does not execute the full improvement agent loop from the browser," and Metric 3's own target is "land in a pre-populated new skill session," not confirmed completion. See `decisions.md` 2026-10-01 entry.

## Out of Scope

- Signal filtering, sorting, dismissal, or bulk actions (deferred to Phase 5 UX enhancements)
- Automated scheduling or CI-triggered `/improve` runs (MVP is operator-triggered only)
- Cross-repo or cross-team signal aggregation (single-repo only; Phase 6 enterprise federation)
- Caching or performance optimization beyond the walking skeleton (Phase 5 performance story)
- Multi-tenant per-tenant signal isolation (deferred; MVP assumes single workspace per deployment)

## Benefit Metrics Addressed

[See benefit-metric artefact: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/benefit-metric.md]

## Stories in This Epic

- [ ] Signals panel: render real signals in a web UI page — artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s1.md
- [ ] Signal-to-session seeding bridge: CTA creates a seeded skill session — artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s2.md

**Removed (2026-10-01):** a 3rd story confirming `/improve`'s full execution through to a completed proposal was drafted, then removed after cross-checking the epic's own Goal against `discovery.md`'s MVP scope and `benefit-metric.md`'s Metric 3 target — both stop at "land in a pre-populated session," not confirmed completion. See `decisions.md` 2026-10-01 entry.

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Signal seeding requires correct injection of signal context into the skill session model (ADR-023 artefact-content injection); `/improve` execution may have multi-turn or multi-file-read patterns not yet tested in the web UI. Medium oversight ensures the session model handles signal seeds correctly before full closure.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Unstable (depends on `/improve` skill's actual execution model in web UI, which is unconfirmed)
