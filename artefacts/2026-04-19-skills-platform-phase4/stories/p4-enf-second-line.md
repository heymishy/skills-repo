## Story: Theme F second-line evidence chain inputs

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e3-structural-enforcement.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **platform maintainer (heymishy)**,
I want to **produce the `theme-f-inputs.md` artefact that specifies what Phase 4's enforcement mechanisms contribute to the second-line evidence chain**,
So that **a second-line reviewer (or risk officer) has a single document that explains what Phase 4 produced, how it relates to Theme F's governance deliverables, and what the boundary is between Phase 4 and Theme F — without needing to read all Phase 4 stories**.

## Benefit Linkage

**Metric moved:** M2 — Consumer confidence (regulated consumer segment)
**How:** Consumer confidence in regulated contexts depends not only on structural enforcement at runtime but also on a second-line reviewer being able to independently verify that enforcement ran correctly. `theme-f-inputs.md` is the document that makes this possible: it maps Phase 4's enforcement outputs (CLI trace schema, workflow declaration structure, optional `executorIdentity` field) to the inputs that Theme F's governance deliverables require. Without this document, the second-line review process would need to reconstruct the Phase 4 architecture from individual story artefacts — `theme-f-inputs.md` reduces that burden.

## Architecture Constraints

- C4: Theme F's governance controls (dual-authority approval routing, RBNZ-ready documentation) require human approval; this story delivers the inputs to those controls, not the controls themselves; the document must explicitly state this boundary
- MC-SEC-02: no credentials, API keys, or operator-identifiable information in `theme-f-inputs.md`; the `executorIdentity` field is described as an optional trace field with type and purpose only — no example identity values
- Craig's ADR-003 (Q6 decision): `executorIdentity` is optional in the trace schema; `theme-f-inputs.md` must record this explicitly so second-line reviewers know they cannot require its presence for trace acceptance

## Dependencies

- **Upstream:** p4.enf-package, p4.enf-mcp, p4.enf-cli must all be complete — the document describes what those three implementations collectively contribute; it cannot be finalised until the mechanism implementations are in a state where their trace outputs and contract shapes are known
- **No downstream dependencies within Phase 4** — this is a terminal story for E3

## Acceptance Criteria

**AC1:** Given all three enforcement mechanism implementations (p4.enf-package, p4.enf-mcp, p4.enf-cli) are complete, When `theme-f-inputs.md` is produced at `artefacts/2026-04-19-skills-platform-phase4/theme-f-inputs.md`, Then the document contains three sections: (1) CLI verification contract — the per-node fields emitted by `emit-trace` including `skillHash`, `inputHash`, `outputRef`, `transitionTaken`, `surfaceType`, `timestamp`, and `executorIdentity` (optional); (2) workflow declaration structure — the required and optional fields in the workflow graph declaration as consumed by the Phase 4 CLI; (3) MCP trace contract — the equivalent fields emitted by the MCP adapter.

**AC2:** Given `executorIdentity` is an optional trace field per Craig's Q6 decision, When the assurance gate re-verifies a CLI-emitted trace, Then the gate accepts the trace whether or not `executorIdentity` is present — the gate's JSON Schema for trace artefacts marks `executorIdentity` as optional (not required), and the schema change is validated by `scripts/validate-trace.sh --ci`.

**AC3:** Given `theme-f-inputs.md` is written, When a second-line reviewer reads it, Then the document explicitly distinguishes (in its own section): (a) what Phase 4's enforcement mechanisms produce and deliver — traceability, hash verification, schema validation, state enforcement; and (b) what Theme F's deliverables are and are not included in Phase 4 — dual-authority approval routing, RBNZ-ready audit documentation, second-line governance model — referencing Craig's Q4 clarification log decision that deferred Theme F deliverables out of Phase 4 scope.

## Out of Scope

- Implementing Theme F's governance controls — this story delivers inputs; Theme F itself is a future discovery and definition cycle
- Designing the dual-authority approval routing mechanism — that is Theme F's definition scope
- Producing RBNZ-ready documentation — that is Theme F's deliverable; this story documents the boundary only

## NFRs

- **Security:** No credentials or operator-identifiable values in `theme-f-inputs.md` (MC-SEC-02)
- **Correctness:** `executorIdentity` schema change (optional field) validated by `scripts/validate-trace.sh --ci`
- **Audit:** Document explicitly states the Phase 4 / Theme F boundary; no ambiguity about what Phase 4 does and does not deliver to regulated consumers

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — the document's content follows directly from the three mechanism implementations; the structure is well-defined; the main risk is that the mechanism implementations reveal an unexpected trace field that requires updating the second-line contract

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

---

## Capture Block

### Metadata

| Field | Value |
|-------|-------|
| experiment_id | exp-phase4-sonnet-vs-opus-20260419 |
| model_label | claude-sonnet-4-6 |
| cost_tier | fast |
| skill_name | definition |
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-second-line.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 3 |
| intermediates_prescribed | 4 |
| intermediates_produced | 19 |
