# Story: Prove the canvas diagram mechanism with a real data-model example

**Epic reference:** artefacts/2026-07-25-code-shape-diagrams/epics/csd-e1-code-shape-diagrams.md
**Discovery reference:** artefacts/2026-07-25-code-shape-diagrams/discovery.md
**Benefit-metric reference:** artefacts/2026-07-25-code-shape-diagrams/benefit-metric.md

## User Story

As a **Developer/engineer**,
I want to **see a real, hand-authored Data Model diagram rendered as a new content-block type in the `/ideate` canvas**,
So that **I have concrete evidence — a real rendered diagram in my own canvas — to decide whether investing in the rest of this epic is justified, rather than committing to five more stories on an unproven mechanism**.

## Benefit Linkage

**Metric moved:** P2 — Diagram completion rate
**How:** This story is honestly foundational, not operator-value-delivering on its own beyond the go/no-go decision point above — flagged as such rather than dressed up as direct value (per `/review` finding 1-M1). It contributes to P2 indirectly, as the proven mechanism every later diagram-producing story (csd-s2 through csd-s6) depends on. Its direct, standalone value is the decision evidence named in the User Story above: without this proof, the operator would be committing to the rest of the epic on an unproven assumption.

## Architecture Constraints

- ADR-026: extend the `/ideate` canvas's existing content-block mechanism (clusters/tables/paragraphs) — do not build a parallel rendering path.
- ADR-027: canvas rendering is ordinary application code in `src/web-ui/`, not a governed SKILL.md skill.
- `MC-SEC-01` (mandatory constraint, guardrails registry): "No user-supplied content in innerHTML without sanitisation" — directly applicable, since diagram content is effectively agent/skill-authored text rendered client-side; the NFR below (mermaid security-level configuration) is this story's compliance mechanism for this constraint.

## Dependencies

- **Upstream:** None.
- **Downstream:** All other stories in this epic depend on this story proving the mechanism works.

## Acceptance Criteria

**AC1:** Given a diagram content-block object with type `data-model` and mermaid syntax content, When the `/ideate` canvas renders a canvas payload containing it, Then the diagram displays as a rendered mermaid diagram (not raw text) alongside existing block types (clusters/tables/paragraphs) in the same view.

**AC2:** Given a realistic example data-model diagram (at least 5 entities, with relationships) authored by hand as fixture content, When rendered in canvas, Then all entities and relationships are legible and distinguishable, verified via visual/screenshot review.

**AC3:** Given the canvas already renders cluster/table/paragraph block types, When a diagram block type is added, Then existing block types continue to render unchanged — no regression.

**AC4:** Given the new content-block mechanism, When inspected against the existing block-type dispatch code, Then it follows the same dispatch pattern as clusters/tables/paragraphs (ADR-026 compliance).

## Out of Scope

- Generating diagram content from a skill (that is csd-s3/csd-s4) — this story only proves rendering works, using hand-authored fixture content.
- Other diagram types (System Architecture, Program Design) — only Data Model is proven here since it is the highest-risk/most-worried-about type per discovery; the other two follow the same mechanism in later stories without needing separate de-risking.

## NFRs

- **Performance:** No perceptible added page-load latency versus existing block types (no fixed numeric target — no baseline exists yet).
- **Security:** Mermaid's rendering configuration must disable any HTML-injection-capable features (mermaid supports an explicit security level setting) — diagram content is effectively user/agent-authored text rendered client-side, and must not be a script-injection vector.
- **Accessibility:** Rendered diagram has a text-alternative fallback (e.g. the raw mermaid source available, or an alt-text summary) for screen-reader users, consistent with the canvas's existing accessibility posture for other block types.
- **Audit:** None identified.

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
