# Story: Add ADR-014 (Dual-Scope Artefact Model) to `architecture-guardrails.md`

**Epic reference:** artefacts/2026-04-22-modernisation-decompose/epics/e1-modernisation-pipeline-bridging.md
**Discovery reference:** artefacts/2026-04-22-modernisation-decompose/discovery.md
**Benefit-metric reference:** artefacts/2026-04-22-modernisation-decompose/benefit-metric.md

## User Story

As a **platform maintainer**,
I want a repo-level ADR formalising the two-tier artefact scope model (system-level corpus scope and feature-level delivery scope), and the `/modernisation-decompose` bridging mechanism that connects them,
So that future contributors understand the intentional separation, avoid conflating the two scopes, and know the governed bridging path — supporting M2 (outer-loop entry rate) by making the conceptual framework explicit and durable.

## Benefit Linkage

**Metric moved:** M2 — Outer-loop entry rate
**How:** Without an ADR, future contributors working on enterprise modernisation programmes may create ad-hoc bridging approaches that diverge from the governed path, reducing consistent use of `/modernisation-decompose`. An explicit ADR preserves the conceptual contract and points new contributors to the correct skill.

## Architecture Constraints

- `architecture-guardrails.md` is governed — changes require a PR with tech lead review (per the file's own header note: "To evolve: update this file, open a PR, tag tech lead for review").
- The new ADR must be numbered ADR-014 (next available after ADR-013 in the current Active ADRs table).
- The ADR must follow the established table row format for the Active ADRs table, and include a full ADR write-up section in the body of the file following the existing `### ADR-0XX:` pattern.
- No existing ADR entries or guardrail sections are to be modified — append only.

## Dependencies

- **Upstream:** md-1 (the dual-scope model is shaped by the SKILL.md design decisions; the ADR should reflect the settled scope). This story can be written in parallel with md-2 once md-1 is committed.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `architecture-guardrails.md` has been updated, when a contributor reads the Active ADRs table, then ADR-014 appears as a row with title "Two-tier artefact scope model: system corpus vs feature delivery", status "Active", and constrains-field "All contributors working on modernisation programmes; `/modernisation-decompose` skill invocations".

**AC2:** Given the ADR-014 entry exists, when a contributor reads the full ADR-014 write-up section, then it contains: (1) Context — the two scopes and the problem they create without a governed bridging mechanism, (2) Decision — `/modernisation-decompose` as the canonical bridge between system corpus artefacts and feature delivery artefacts, (3) Consequences — expected benefits and the constraint that ad-hoc cross-scope bridging is a violation of this ADR.

**AC3:** Given `architecture-guardrails.md` has been updated, when `npm test` runs, then all governance checks pass with 0 failures — the file update does not break any existing check.

## Out of Scope

- Changes to any other ADR entries or existing guardrail sections.
- New governance check scripts to enforce the ADR programmatically — enforcement is by convention and code review in this cycle.

## NFRs

- **Audit:** The ADR write-up must include a `**Decided:** YYYY-MM-DD` field for traceability.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable — this is a documentation append following an established format.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
