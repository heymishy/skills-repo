## Story: Add `workspace/state.schema.json` and document state file authority model as ADR-016/ADR-017

**Epic reference:** Platform tooling — state file reliability
**Discovery reference:** /improve extraction — `2026-04-30-governed-distribution-and-onboarding` (Category B, findings B2 and B3)
**Benefit-metric reference:** Platform maintainability — operator session continuity, skill reliability at scale

## User Story

As a **platform maintainer or contributor**,
I want the two pipeline state files to have a documented authority model and for `workspace/state.json` to be validated against a schema on write,
So that skills and tooling read consistent, well-shaped state and mismatches between `workspace/state.json`, `pipeline-state.json`, and the dashboard are caught before they cause silent errors at scale.

## Benefit Linkage

**Metric moved:** Platform reliability / contributor friction (no formal metric yet — this story creates the measurable baseline)
**How:** Skills currently write to `workspace/state.json` with no schema contract. Different skills produce different shapes. Downstream reads are defensive and error-prone. Adding a schema + authority model ADR eliminates the coordination gap and gives contributors a clear rule for which file to write to, validated automatically.

## Architecture Constraints

- ADR-003 (schema-first): any new state file with downstream readers must have a schema defined before or alongside first use. `workspace/state.json` has been in use without a schema since Phase 1. This story retroactively satisfies ADR-003 for it.
- ADR-004 (`context.yml` single config source): state files are not config — this story must not move any config values from `context.yml` to `workspace/state.json`.
- The schema must be a JSON Schema Draft 7 document (consistent with `pipeline-state.schema.json`).
- No new npm dependencies — schema validation uses the existing `jsonschema` Python call pattern or a Node.js built-in equivalent already in use.

## Dependencies

- **Upstream:** None — can start immediately.
- **Downstream:** Any future skill that writes `workspace/state.json` inherits the schema contract. `/checkpoint` skill should be updated to reference the schema path.

## Acceptance Criteria

**AC1 — Schema file exists and validates current state shape**
Given `workspace/state.schema.json` exists,
When the current `workspace/state.json` is validated against it,
Then validation passes with 0 errors.

**AC2 — Schema enforces required top-level fields**
Given `workspace/state.schema.json` declares `currentPhase`, `lastUpdated`, and `checkpoint` as required,
When a `workspace/state.json` is validated that is missing any of these fields,
Then validation fails with a specific error naming the missing field.

**AC3 — ADR-016 documents the two-file authority model**
Given `ADR-016` is written in `.github/architecture-guardrails.md`,
When a contributor asks "which state file should I write to?",
Then the ADR provides an unambiguous answer: `pipeline-state.json` is delivery evidence (schema-governed, skills write it, viz reads it); `workspace/state.json` is operator session state (schema-governed from this story onwards, written only by `/checkpoint` and operator-facing pipeline skills, not read by the viz).

**AC4 — ADR-017 documents the story-nesting migration path**
Given `ADR-017` is written in `.github/architecture-guardrails.md`,
When a new feature is added to `pipeline-state.json`,
Then the ADR provides an unambiguous rule: all new features use the flat `features[].stories[]` structure (Phase 3+ shape); no new epics-nested stories (`features[].epics[].stories[]`) are introduced. Existing Phase 1/2 nested stories are not migrated (cost vs benefit) but the ADR documents the dual-structure explicitly so tooling authors know to handle both.

**AC5 — Validation helper callable from `/checkpoint` skill**
Given `workspace/state.schema.json` exists,
When a skill writes `workspace/state.json`,
Then the `/checkpoint` SKILL.md references the schema path and instructs the operator/agent to validate with the standard command before committing.

## Non-Functional Requirements

- **NFR-SFA1-COMPATIBILITY:** The schema must not reject any `workspace/state.json` files produced by the current codebase. Any existing checkpoints committed to the repo must pass validation after this story ships.
- **NFR-SFA1-LIGHTWEIGHT:** The schema must cover only the required structural contract. It must not enumerate all valid values for `currentPhase` (those are an operational concern, not a schema concern) — use `"type": "string"` not an enum for phase names.

## Test Plan Hints (for /test-plan)

Suggested test IDs:
- `workspace-state-schema-file-exists`
- `workspace-state-schema-is-valid-json-schema`
- `workspace-state-schema-requires-current-phase`
- `workspace-state-schema-requires-last-updated`
- `workspace-state-schema-requires-checkpoint`
- `workspace-state-schema-rejects-missing-required-field`
- `workspace-state-schema-accepts-current-state-json`
- `architecture-guardrails-contains-adr-016`
- `adr-016-names-pipeline-state-as-delivery-evidence`
- `adr-016-names-workspace-state-as-session-state`
- `adr-016-states-viz-reads-pipeline-state-only`
- `architecture-guardrails-contains-adr-017`
- `adr-017-names-flat-structure-for-new-features`
- `adr-017-names-nested-as-legacy-not-migrated`
- `checkpoint-skill-references-schema-path`

## Out of Scope

- Migrating Phase 1/2 nested epic stories to flat structure — intentionally deferred (ADR-017 documents this)
- Adding `workspace/state.json` validation to CI (this story adds the schema and a validation pattern; CI hook is a follow-on story if needed)
- Moving any fields between `workspace/state.json` and `pipeline-state.json` — authority model is documentation + schema, not data migration
