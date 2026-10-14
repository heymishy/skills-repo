# Review Report: jae-s5 — Restructure the Delivery view from a per-stage card stack into a swimlane grid

**Run:** 1
**Date:** 2026-10-15
**Story:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s5.md
**Epic:** artefacts/2026-10-14-journey-authoring-experience/epics/journey-authoring-delivery-view-grid.md

---

## FINDINGS

### 1-H1 (Category B — Scope discipline) — HIGH

The parent discovery artefact (`artefacts/2026-10-14-journey-authoring-experience/discovery.md`, Out of Scope, line 39) states: *"Any change to the swimlane grid's own rendering, the save-feedback mechanism, or the empty-state/spacing treatment — `jcx-s6`/`jcx-s7` already closed these; this discovery is scoped entirely to the pre-first-save authoring experience, not the already-fixed display/mechanics layer."*

`jae-s5` introduces a new swimlane-grid rendering path for the Delivery view — squarely "the display/mechanics layer" this discovery names as out of scope, and a concern (reviewing delivery coverage) distinct from the discovery's own stated focus ("the pre-first-save authoring experience"). This is the same shape of gap already found and resolved once this session for `jae-s4` (whose AI-generation mechanism was also explicitly named out of scope in this same discovery, line 35) — that expansion was resolved with an explicit, logged operator override in `decisions.md`. No equivalent override exists yet for `jae-s5`'s own scope expansion.

**Required action:** Log an explicit scope-override decision in `decisions.md`, naming the discovery boundary being crossed and the operator's authorization for it — matching the precedent already set for `jae-s4`. Do not proceed to `/test-plan` without it.

### 1-H2 (Category E — Architecture compliance) — HIGH

`jae-s5`'s Architecture Constraints section currently describes building `buildDeliverySwimlaneGrid` by copying the Customer-experience grid's own mechanics a second time: *"same `gridTemplateColumns` formula, same `buildDataRow(rowClass, label, cellsHtml)` helper shape, same header-cell pattern... all three copied verbatim from the CX grid's own header cell."*

This is a direct instance of the pattern **ADR-028** (*"A derived structure needs exactly one canonical builder — every consumer reads from it, none re-derive it"*) was written to prevent. `buildCustomerExperienceSwimlaneGrid` is the first consumer of "render an N-stage-column swimlane grid with a shared column template, header row, and per-field data rows." `jae-s5` is about to become the second consumer, independently re-deriving the same column-template/data-row/track-wrapper/accessible-list mechanics rather than extracting them into one canonical builder both grids call. ADR-028's own decision text is explicit: *"If it doesn't [exist], and a second consumer of the same derived answer is now being written, extract the existing ad hoc logic into one canonical builder before adding the second copy — do not let a second independent derivation reach master."*

**Required action:** Refactor the story's Architecture Constraints (and the epic's own Out of Scope wording, which currently reads as if `buildCustomerExperienceSwimlaneGrid` cannot be touched at all) to extract a shared grid-shell builder used by both the existing CX grid and the new Delivery grid — a behaviour-preserving refactor of `buildCustomerExperienceSwimlaneGrid`'s internals (existing CX tests must still pass unchanged), not a second independent copy of its mechanics.

---

## SCORE

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS — epic/discovery/benefit-metric references present; benefit linkage connects to M3 with an explicit, named broadening rationale; coverage matrix already updated. |
| Scope integrity | 2 | **FAIL** — 1-H1: implements a concern the parent discovery explicitly names out of scope, with no logged override yet (unlike the equivalent `jae-s4` expansion, which has one). |
| AC quality | 5 | PASS — 8 ACs, all Given/When/Then, each independently testable, edge cases (AC2, AC6) have their own AC, no "should" language. |
| Completeness | 5 | PASS — named persona, benefit linkage, out-of-scope (5 items), NFRs (4 categories), complexity and scope stability both rated. |
| Architecture compliance (Cat. E) | 2 | **FAIL** — 1-H2: Architecture Constraints as written re-derives `buildCustomerExperienceSwimlaneGrid`'s own mechanics a second time, violating ADR-028. |

## VERDICT

**FAIL** — 2 criteria below threshold (Scope integrity, Architecture compliance), both HIGH findings. Must be resolved before `/test-plan`.
