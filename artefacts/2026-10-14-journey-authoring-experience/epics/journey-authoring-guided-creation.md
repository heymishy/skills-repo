## Epic: Operators can go from a blank journey to a usably-complete first stage without hunting for the edit panel or starting from nothing

**Discovery reference:** artefacts/2026-10-14-journey-authoring-experience/discovery.md
**Benefit-metric reference:** artefacts/2026-10-14-journey-authoring-experience/benefit-metric.md
**Slicing strategy:** User journey

## Goal

When this epic is complete, an operator creating a new customer journey starts from a recognizable default shape (not a blank list), adds a stage through one guided action instead of two separate, undiscoverable steps, and sees smart-default field suggestions drawn from a linked feature's own discovery artefact (where one exists) while filling it in — without the save mechanism, empty-state styling, or swimlane-grid rendering changing at all (those are already correct, closed by the parent `journey-cx-redesign` epic).

---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    ROUTE[routes/journeys.js]\n    SCANNER[adapters/persona-scanner.js]\n    ROUTE -->|handlePostJourneys: seed default skeleton| ROUTE\n    ROUTE -->|addBtn click handler: guided creation, open panel in same flow| ROUTE\n    ROUTE -->|getFieldSuggestions: extend scanForPersonas pattern| SCANNER\n    SCANNER -->|extractProblemStatement, new sibling to extractWhoItAffects| SCANNER"}}---

## Out of Scope

- **Real LLM/AI-generated field content** — explicitly sequenced as a separate fast-follow story once this epic's deterministic mechanism has real usage data (per discovery.md's own confirmed `/clarify` decision); not built in this epic.
- **A selectable template library** — this epic ships exactly one default starting skeleton; template selection/customization UI is a deferred extension, not built here.
- **Inline-in-grid editing (replacing the side panel)** — this epic keeps the existing side-panel editing model and only collapses the two-step add-then-find-edit-panel flow into one guided action; the bigger redesign stays deliberately deferred per `decisions.md`.
- **Any change to the swimlane grid's own rendering, save-feedback mechanism, or empty-state/spacing treatment** — already closed by the parent epic's `jcx-s6`/`jcx-s7`; this epic is scoped entirely to the pre-first-save authoring experience.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — Time-to-first-complete stage | Not yet established (to be measured pre-release) | ≥40% reduction from measured baseline | `jae-s2`'s guided-creation flow removes the separate edit-panel-discovery step |
| M2 — Fields populated without manual prompting | `[UNKNOWN BASELINE]` | ≥40% of new stages reach ≥3 populated fields at first save | `jae-s1`'s starting template + `jae-s3`'s field suggestions both increase initial field population without the operator manually prompting themselves |
| M3 — Operator CX judgment of the authoring flow itself | Operator-stated gap, 2026-10-14 | Operator judges the flow as no longer "clunky" | All 3 stories together are the complete authoring-flow redesign this metric judges |

## Stories in This Epic

- [ ] Seed a new journey with a default starting-skeleton template — `jae-s1`
- [ ] Collapse stage creation into one guided action (name + fields in the same flow) — `jae-s2`
- [ ] Extend the discovery-artefact-scan suggestion pattern to stage-level fields — `jae-s3`

## Human Oversight Level

**Oversight:** Low
**Rationale:** All 3 stories reuse already-established patterns in this codebase (template-seeding is a simple INSERT sequence, guided creation is a client-side flow change, field suggestions extend `jcx-s4`'s own already-shipped scanner) — no new architecture, no new third-party dependency, no regulated data.

## Complexity Rating

**Rating:** 2
**Scope Stability:** Stable
