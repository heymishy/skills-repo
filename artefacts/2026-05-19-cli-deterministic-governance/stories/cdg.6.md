# Story cdg.6 — `skills advance` epic-nested lookup, dot-notation field writes, integer coercion, and harness wiring rule

**Feature slug:** 2026-05-19-cli-deterministic-governance
**Story ID:** cdg.6
**Epic:** cdg-phase2-advance-and-trace
**Short-track:** Yes — bounded enhancements to existing CLI + coding standard
**Created:** 2026-05-24
**Priority:** High — blocks deterministic harness integration for all future stories
**Complexity:** 1 — Well understood. Three isolated gaps in `cli-advance.js` plus one copilot-instructions.md rule. No new external dependencies.
**Scope stability:** Stable
**Benefit linkage:** M4 — Schema violation rate on CLI-written state writes; M2 — Deterministic state write rate (stories using `skills advance` for post-merge updates)

---

## User story

As a platform maintainer,
I want `skills advance` to reliably find and update stories regardless of whether they live in flat `feature.stories[]` or epic-nested `feature.epics[].stories[]`, write nested fields via dot-notation, and coerce integer values — and I want the agent harness mandated to use this CLI for all post-merge state writes,
So that every pipeline-state update is deterministic, schema-correct, and auditable with no silent phantom duplicates or type mismatches.

---

## Background

cdg.3 delivered the `skills advance` CLI with atomic writes and typed exit codes. Three gaps were discovered post-delivery that block harness integration:

1. **Epic-nested lookup gap**: The CLI searches `feature.stories[]` only. For features using epics (like cdg itself), the story lives in `feature.epics[].stories[]`. If not found in flat, the CLI silently creates a phantom flat entry — the real epic-nested story is never updated.

2. **Nested field write gap**: `testPlan.status` and `testPlan.artefact` are nested fields. The CLI writes them as flat string keys (`story["testPlan.status"]`), producing invalid schema output.

3. **Integer coercion gap**: `acVerified`, `passing`, and `totalTests` are integers in the schema. The CLI writes all values as strings, causing schema divergence.

Additionally, without a mandate in `copilot-instructions.md`, agent sessions continue using ad-hoc inline Node scripts for post-merge state updates — bypassing the CLI and the determinism guarantees it provides.

---

## Acceptance criteria

### AC1 — Epic-nested story is found and updated in place
Given a feature where the target story exists in `feature.epics[N].stories[M]` and not in `feature.stories[]`,
When `skills advance <feature-slug> <story-id> <field>=<value>` is called,
Then the epic-nested story object is updated in place and exit code is 0,
And no new phantom entry is created in `feature.stories[]`.

### AC2 — Flat story lookup is unchanged (non-regression)
Given a feature where the target story exists in `feature.stories[]`,
When `skills advance` is called for that story,
Then the flat entry is updated as before and exit code is 0.

### AC3 — Story not found anywhere creates flat entry (preserve existing behaviour)
Given a feature where the target story does not exist in either `feature.stories[]` or any `feature.epics[].stories[]`,
When `skills advance` is called for that story,
Then a new entry is created in `feature.stories[]` and exit code is 0.

### AC4 — Dot-notation single-level field write
Given a field argument of the form `parent.child=value` (exactly one dot),
When `skills advance` writes the field,
Then `story[parent][child]` is set to `value`,
And if `story[parent]` did not previously exist it is created as an empty object before the assignment,
And if `story[parent]` already exists its other keys are preserved (merge, not replace).

### AC5 — Integer-valued fields are coerced to number type
Given field arguments whose value strings consist entirely of decimal digits (e.g. `acVerified=8`, `passing=23`),
When `skills advance` writes them,
Then the JSON output contains integer values (not string values) for those fields.

### AC6 — Prototype pollution guard
Given a field argument whose name or whose dot-notation parent/child segment is `__proto__`, `constructor`, or `prototype`,
When `skills advance` is called with that argument,
Then exit code is 8 and an error message naming the rejected field is written to stderr,
And pipeline-state.json is not modified.

### AC7 — copilot-instructions.md mandates `skills advance` for post-merge state writes
Given the cdg.6 implementation is merged,
When reading `.github/copilot-instructions.md`,
Then it contains a rule in the Coding Standards section stating that all agent post-merge pipeline-state story field updates MUST use `node bin/skills advance <feature-slug> <story-id> <field>=<value>...` and MUST NOT use ad-hoc inline Node scripts for that purpose.

---

## Out of scope

- Dot-notation deeper than 1 level (`a.b.c`) — not supported; exit 8 if 2+ dots in a field name
- Negative numbers or floating-point coercion (only non-negative integers matching `/^\d+$/`)
- Modifying `bin/skills`, `cli-validate.js`, or `pipeline-state-writer.js`
- Changes to `.github/pipeline-state.schema.json`
- Backfilling of existing stale fields in pipeline-state.json (cdg.1 `acVerified: 0` etc.)
- GitHub Actions workflow changes
- A separate `NUMERIC_FIELDS` allowlist — coercion applies to any value matching `/^\d+$/`

---

## Notes

The prototype pollution guard (AC6) is required per OWASP A03 (Injection). Any `__proto__` or `constructor` field assignment would silently mutate Object.prototype and is classified as HIGH severity — it is a hard implementation requirement, not optional.

The copilot-instructions.md change (AC7) requires a story artefact per the artefact-first rule. This story is that artefact.
