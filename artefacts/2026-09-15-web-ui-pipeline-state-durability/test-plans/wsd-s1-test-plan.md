# Test Plan: Extract cli-advance.js's mutation core into a reusable, state-object-based function (wsd-s1)

**Story:** artefacts/2026-09-15-web-ui-pipeline-state-durability/stories/wsd-s1.md
**Track:** Standard-track

---

## Test Cases

New test file `tests/check-wsd-s1-advance-core-extraction.js`, plus re-running the two existing files that already cover `cli-advance.js`.

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Regression | `tests/check-pcr-s1-pipeline-state-scope.js` re-run fresh against the refactored `cli-advance.js` — passes unchanged |
| T2 | AC1 | Regression | `tests/check-shr1-schema-harness.js` re-run fresh against the refactored `cli-advance.js` — passes unchanged |
| T3 | AC2 | Behavioural | `applyAdvance(state, featureSlug, storyId, ['dorStatus=signed-off'])` against an in-memory fixture object (no file) — mutates `state.features[].stories[].dorStatus` correctly, returns `{ exitCode: 0, state, ... }` |
| T4 | AC2 | Behavioural | `applyAdvance()` rejects an invalid enum value (e.g. `dorStatus=not-a-real-status`) — returns `exitCode: 8` with a descriptive `stderr`, and does NOT mutate the passed-in `state` object |
| T5 | AC2 | Behavioural | `applyAdvance()` correctly resolves an epic-nested story (a fixture where the target story lives under `feature.epics[].stories[]`, not `feature.stories[]`) |
| T6 | AC2 | Behavioural | `applyAdvance()`'s prototype-pollution guard rejects a `__proto__`/`constructor`/`prototype` field name, matching `advance()`'s existing behaviour |
| T7 | AC2 | Behavioural | `applyAdvance()`'s boolean coercion (`releaseReady=true` → `true`, not the string `"true"`) matches `advance()`'s existing behaviour |
| T8 | AC3 | Behavioural | `applyAdvance()` called with a `storyId` that matches no existing story — returns `storyWasCreated: true` in the result object (not only embedded in `stderr` text) |
| T9 | — | Regression | `advance()` itself (the file-based wrapper) still works end-to-end against a real temp file — read, mutate, atomic write, matching its pre-refactor behaviour exactly (covers the "thin wrapper" half of the refactor, not just the extracted core) |

## Regression coverage

- `tests/check-pcr-s1-pipeline-state-scope.js` and `tests/check-shr1-schema-harness.js` (T1/T2) are the full existing regression surface for `cli-advance.js` — both re-run clean is the primary correctness bar for this story.

## Out of Scope (per story)

- `bin/skills`'s CLI argument parsing.
- Any validation RULE change (enum values, boolean fields).
- wsd-s2's own GitHub API mechanics.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
