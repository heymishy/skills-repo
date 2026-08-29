# Decision Log: diagram-validation-and-types

**Feature:** Diagram Validation, Drift Accuracy, and Archify-Inspired Diagram Types
**Discovery reference:** artefacts/2026-08-29-diagram-validation-and-types/discovery.md
**Last updated:** 2026-08-29

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-08-29 | SCOPE | discovery/clarify**
**Decision:** Cut workflow and lifecycle diagram types from this feature's MVP scope; keep sequence.
**Alternatives considered:** (1) Ship all three new types (workflow, sequence, lifecycle) as originally scoped at discovery. (2) Rescope workflow/lifecycle away from the meta-pipeline (to "a process/entity the feature itself introduces") and keep them, conditionally emitted.
**Rationale:** Originally scoped workflow ("DoR→DoD sequence") and lifecycle ("a story's journey through pipeline-state.json phases") were meta-pipeline concepts already covered live by the existing kanban board — genuinely redundant, caught by the operator during `/clarify`. Rescoping them onto "the feature being built" (matching System Architecture/Program Design/Data Model's own convention) removed the redundancy, but exposed that emission would be conditional and rare, and no concrete anticipated use case could be named for either. Sequence was kept because it maps to a concept the platform's own architecture already frequently involves (SSE turns, auth, cache fallback), not a speculative one.
**Made by:** Hamish King — Platform Owner
**Revisit trigger:** If a future feature's own design genuinely introduces a multi-step process or a stateful domain entity worth diagramming, revisit adding workflow/lifecycle at that point, scoped to that concrete case — not speculatively ahead of one.
---

---

## Architecture Decision Records

<!-- None recorded for this feature yet. -->
