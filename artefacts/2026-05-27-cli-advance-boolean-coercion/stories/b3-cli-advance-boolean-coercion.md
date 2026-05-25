# Story: Fix cli-advance Boolean Coercion for Schema-Typed Fields

**Story ID:** b3
**Feature slug:** 2026-05-27-cli-advance-boolean-coercion
**Type:** Short-track defect fix
**Epic reference:** N/A — short-track
**Discovery reference:** N/A — short-track (originated from workspace/capture-log.md B3 entry)
**Benefit-metric reference:** CDG M4 — schema validation reliability; recurring schema failures caused by this defect

## User Story

As a **pipeline operator**,
I want **the `skills advance` CLI to coerce `"true"`/`"false"` strings to boolean values when writing to pipeline-state fields that the schema defines as `type: boolean`**,
So that **pipeline-state.json passes `check-pipeline-state-integrity.js` schema validation after every advance command invocation, without requiring manual JSON fixes**.

## Benefit Linkage

**Metric moved:** CDG M4 — pipeline-state schema validation reliability (zero post-advance schema violations)
**How:** The defect causes every `skills advance releaseReady=true` invocation to write a string `"true"` instead of boolean `true`, which immediately fails schema validation. Fixing the coercion eliminates a whole class of recurring schema violations that have appeared across multiple features (cdg, gpa, ougl).

## Acceptance Criteria

### AC1 — Boolean `true` coercion

Given `releaseReady=true` is passed as a field argument to `skills advance`,
When `advance()` writes the value to pipeline-state.json,
Then the stored value is the JavaScript boolean `true` (not the string `"true"`), and `typeof story.releaseReady === 'boolean'`.

### AC2 — Boolean `false` coercion

Given `releaseReady=false` is passed as a field argument to `skills advance`,
When `advance()` writes the value to pipeline-state.json,
Then the stored value is the JavaScript boolean `false` (not the string `"false"`), and `typeof story.releaseReady === 'boolean'`.

### AC3 — Non-coercible value rejected for boolean field

Given a non-coercible string (not `"true"` or `"false"`) is passed for a field the schema defines as `type: boolean` (e.g. `releaseReady=maybe`),
When `advance()` is called,
Then advance returns exit code 8, stderr contains the field name and indicates acceptable values (`true`/`false`), and the pipeline-state.json file is not modified.

### AC4 — Non-boolean-schema string fields unaffected

Given a string-typed field is advanced with a string value (e.g. `stage=implementation`, `health=green`),
When `advance()` writes the value,
Then the value is stored as a string — no unexpected coercion occurs.

### AC5 — Integer coercion regression: cdg.6 digit-string coercion not broken

Given a field is advanced with an all-digit string (e.g. `acVerified=4`),
When `advance()` processes the value,
Then the integer coercion introduced in cdg.6 (`/^\d+$/` → `Number()`) still applies and the value is stored as the number `4`.

### AC6 — Schema validation passes after boolean field written via advance

Given a boolean schema field has been written via `skills advance` (with value `true` or `false`),
When `check-pipeline-state-integrity.js` runs against the updated pipeline-state.json,
Then schema validation exits with code 0 and produces no `schema_valid: FAILED` output.

## Out of Scope

- Feature-level boolean fields (e.g. `features[].regulated`) — this story covers story-level fields only.
- Dot-notation boolean sub-fields (e.g. nested objects within `testPlan.*`) — covered only if the schema's flat story-level definition applies.
- Case variants `"TRUE"` / `"FALSE"` — the CLI contract requires lowercase; uppercase strings are not coerced and pass through as strings.
- Adding new boolean fields to the schema — the registry is populated from existing schema boolean fields only.
- `skills gate-advance` — that command delegates to `advance()` after validation; boolean coercion at the `advance()` layer automatically covers gate-advance invocations.

## Architecture Constraints

- Extend the existing `ENUM_FIELDS` static registry pattern in `cli-advance.js` with a `BOOLEAN_FIELDS` array — no live schema parsing at runtime.
- The prototype pollution guard (`PROTO_BLOCKED`) must remain intact and is not modified by this story.
- ADR-H7.1: no `child_process` spawning introduced.
- Atomic write pattern (temp-file + `fs.renameSync`) must remain unchanged.
- All fields in `BOOLEAN_FIELDS` must be verifiable against `.github/pipeline-state.schema.json` at PR review time.

## Dependencies

None

## NFRs

None — reviewed 2026-05-27. This is a pure in-process coercion fix; no I/O, network, or security surface changes.

## Complexity

1 — Well understood, clear path. The fix is a small addition to the existing `ENUM_FIELDS` pattern in a single function.

## Scope Stability

Stable
