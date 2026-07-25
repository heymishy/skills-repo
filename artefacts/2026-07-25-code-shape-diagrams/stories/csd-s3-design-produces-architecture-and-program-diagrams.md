# Story: `/design`/`/definition` produce System Architecture + Program Design diagrams

**Epic reference:** artefacts/2026-07-25-code-shape-diagrams/epics/csd-e1-code-shape-diagrams.md
**Discovery reference:** artefacts/2026-07-25-code-shape-diagrams/discovery.md
**Benefit-metric reference:** artefacts/2026-07-25-code-shape-diagrams/benefit-metric.md

## User Story

As a **Developer/engineer**,
I want **`/design` and/or `/definition` to generate a System Architecture (sequence/component) and a Program Design (file-tree/call-stack) diagram as part of the artefact, using the new canvas block type**,
So that **I, or a Second-look reviewer, can visually inspect the intended shape before implementation starts, instead of relying on prose alone**.

## Benefit Linkage

**Metric moved:** P1 — Time-to-drift-determination (establishes the "as-designed" half of the comparison); P2 — Diagram completion rate.
**How:** Making diagram generation part of the standard `/design`/`/definition` flow — not an optional extra — is what makes 100% completion achievable, and gives csd-s6's drift check something to compare the as-built diagram against.

## Architecture Constraints

- ADR-027: diagram generation here is skill-governed work (invoked in an operator-run pipeline session), distinct from csd-s2's app-code rendering.
- Uses csd-s2's rendering mechanism — does not introduce a second rendering path.

## Dependencies

- **Upstream:** csd-s2 (rendering mechanism must exist before a skill can produce content for it).
- **Downstream:** csd-s6 (drift check needs an as-designed diagram to compare against).

## Acceptance Criteria

**AC1:** Given a `/design` or `/definition` session for a real feature, When the operator completes the System Architecture section, Then a diagram content-block (type `system-architecture`) is generated and saved as part of the DoR artefact, alongside the existing prose.

**AC2:** Given the same session, When the operator completes the Program Design section, Then a diagram content-block (type `program-design`, showing file-tree/call-stack shape) is generated and saved similarly.

**AC3:** Given a feature with multiple stories, When diagrams are generated at feature granularity (per discovery's resolved default), Then one diagram set covers the whole feature, refreshed as stories complete — not per-story unless the operator explicitly decides otherwise for that feature at `/definition` time.

## Out of Scope

- Data Model diagrams — that is csd-s4, separated because of its distinct ground-truth-source decision (static migration-file parsing) and its higher priority per discovery.
- As-built diagrams — that is csd-s5; this story only produces as-designed diagrams.

## NFRs

- **Performance:** None identified beyond the general context-window consideration below.
- **Security:** None identified.
- **Accessibility:** Inherits csd-s2's accessibility properties — no new requirement.
- **Audit:** None identified.
- **Context window management:** Diagram generation happens inside the existing `/design`/`/definition` skill sessions. Diagram content adds to context size within those sessions; this should be considered against the existing 55%/75% checkpoint thresholds (`CLAUDE.md`'s Session conventions) as an operating consideration, not a hard automated gate — flagged here as an informal operating note rather than a testable AC, since it depends on session-specific context usage that varies per feature.

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
