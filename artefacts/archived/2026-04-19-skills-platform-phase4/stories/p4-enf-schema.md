## Story: Structured output schema validation — enforcement mechanism 4 of 5

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e3-structural-enforcement.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **platform maintainer (heymishy)**,
I want to **implement structured output schema validation as a per-step enforcement gate for skills that declare an `expected-output-shape` in their workflow declaration**,
So that **enforcement is available as a standalone mechanism for surface classes where CLI and MCP cannot be structurally applied, and all surface classes have at minimum output-shape validation as a baseline governance property**.

## Benefit Linkage

**Metric moved:** M2 — Consumer confidence
**How:** Schema validation is mechanism 4 of 5 in the enforcement stack. For surface classes where CLI and MCP cannot be structurally enforced (e.g. a consumer using a third-party agent framework), output schema validation provides a minimum baseline governance property: the produced artefact must conform to the declared output shape before `advance` is permitted. This extends the consumer confidence claim beyond the two primary mechanisms and avoids a coverage gap for edge-case surfaces.

## Architecture Constraints

- C5: schema validation uses the same hash-verified skill declaration as other mechanisms — the `expected-output-shape` field in the workflow declaration is part of the hash-verified skill content; a consumer cannot substitute a different schema without the hash changing
- MC-CORRECT-02: schema validation errors must conform to the platform's error schema (a structured JSON object with `error`, `field`, `expected`, and `actual` keys) — plain text error messages that do not follow the schema are not acceptable
- Spike A output: the `expected-output-shape` field syntax and validation protocol are defined in the Spike A package interface specification; this story implements that specification for schema validation specifically
- ADR-004: if schema validation is enabled or disabled per skill via context.yml, the configuration key follows the standard `distribution.*` or `enforcement.*` namespace — no command-line flag bypass

## Dependencies

- **Upstream:** p4.enf-decision must be committed; p4.enf-package must be complete (provides the governance package that schema validation calls `evaluateGate` and `advanceState` through)
- **Downstream:** p4.enf-second-line — schema validation failures are relevant inputs to the second-line evidence chain (a step with schema violations is a governance signal)

## Acceptance Criteria

**AC1:** Given a workflow declaration where a specific node has an `expected-output-shape` field (a JSON Schema object), When an agent produces output at that step, Then the enforcement mechanism validates the output against the declared schema before `advanceState` is called — a schema violation returns a structured error `{error: "OUTPUT_SHAPE_VIOLATION", field: "<failing_field>", expected: "<schema_type>", actual: "<actual_value>"}` and blocks the state transition.

**AC2:** Given a schema validation failure, When the structured error is surfaced to the operator (via CLI output, MCP tool response, or CI log), Then the error identifies the failing field by its JSON path (e.g. `.stories[0].ac_count`), the expected type or constraint (e.g. `"integer, minimum: 3"`), and the actual value (or null if the field is missing) — the operator can act without reading the schema declaration file.

**AC3:** Given a skill that does not declare an `expected-output-shape` at a node, When the enforcement mechanism processes that node's output, Then schema validation is skipped and the step proceeds without error — schema validation is opt-in per node, not a mandatory gate for all nodes.

**AC4:** Given two enforcement runs on the same output against the same schema, When both runs complete, Then both produce identical results — schema validation is deterministic for identical input/schema combinations (no non-deterministic validation, no timestamp-dependent evaluation).

## Out of Scope

- Defining the `expected-output-shape` syntax for individual skills — that is a skill authoring concern and is covered by the platform's standards files; this story implements the validation engine, not the schema authoring guidelines
- Runtime type-checking of agent reasoning or intermediate thoughts — schema validation covers the final output shape only, not the reasoning process
- Fuzzing or property-based testing of the schema validator — Phase 4 coverage is unit tests for the happy path and defined error paths; fuzzing is Phase 5

## NFRs

- **Security:** No operator output content is logged to external services during schema validation (MC-SEC-02)
- **Correctness:** Schema validation errors follow the platform error schema (MC-CORRECT-02); validated by a unit test that asserts the error object structure
- **Performance:** Schema validation completes within 100 milliseconds for a typical artefact output (up to 10,000 characters)

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable — the `expected-output-shape` syntax depends on the Spike A package interface specification; if Spike A uses a different schema validation library or syntax, this story may need to update its implementation approach

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-schema.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 4 |
| intermediates_prescribed | 4 |
| intermediates_produced | 18 |
