## Story: Extract cli-advance.js's mutation core into a reusable, state-object-based function

**Epic reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/epics/web-ui-pipeline-state-durability.md
**Discovery reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/discovery.md
**Benefit-metric reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/benefit-metric.md
**Domain:** software-engineering

## User Story

As **the future GitHub-API-backed pipeline-state writer (wsd-s2)**,
I want **cli-advance.js's story-field validation, enum-checking, prototype-pollution-guard, and mutation logic available as a function that operates on an already-in-memory state object, not only on a local file**,
So that **wsd-s2 can apply the exact same, already-proven validation rules to a state object fetched from the GitHub API, instead of re-implementing (and risking drift from) that logic a second time**.

## Benefit Linkage

Pipeline-state accuracy for web-UI-originated features — this story is the prerequisite foundation; it makes no user-visible change on its own but removes the only real blocker (validation logic being hard-coupled to `fs.readFileSync`/`writeFileSync`) to building wsd-s2 without duplicating cli-advance.js's rules.

## Architecture Constraints

`src/enforcement/cli-advance.js`'s current `advance(featureSlug, storyId, rawFields, repoRoot)` (lines 47-253) interleaves three concerns: (1) field parsing + validation (enum checks, prototype-pollution guard, dot-notation depth, boolean coercion) — lines 53-117; (2) file read + traversal guard — lines 112-126; (3) mutation of the in-memory `state` object (feature-scoped and story-scoped field application, including epic-nested story lookup and the `storyWasCreated` visibility fix from `acv-s1`) — lines 128-222; (4) file write — lines 224-232. Extract (1)+(3) into a new exported function, e.g. `applyAdvance(state, featureSlug, storyId, rawFields)`, returning `{ exitCode, stdout, stderr, state, storyWasCreated }` — the SAME return shape semantics `advance()` already has, minus the file I/O. The existing `advance()` becomes a thin wrapper: resolve/validate `repoRoot` + read the file (unchanged, lines 112-126) → call `applyAdvance()` → on success, write the file (unchanged, lines 224-232) → return. ADR-026 (reuse existing entity/pattern shape — this is exactly that: the validation/mutation rules are reused verbatim by a second caller, not reimplemented).

## Dependencies

- **Upstream:** None.
- **Downstream:** wsd-s2 (the GitHub-API writer) depends on this story's `applyAdvance()` export.

## Acceptance Criteria

**AC1:** Given the existing tests covering `cli-advance.js`'s `advance()` function — `tests/check-pcr-s1-pipeline-state-scope.js` and `tests/check-shr1-schema-harness.js` (confirmed by direct search: both `require` `cli-advance.js` directly) — When this refactor is applied, Then both files pass unchanged — `advance()`'s external behaviour, signature, and return shape are provably identical to before this story.

**AC2:** Given a plain JavaScript object matching pipeline-state.json's shape (no file on disk involved at all), When `applyAdvance(state, featureSlug, storyId, rawFields)` is called directly, Then it applies the same field validation (enum checks, prototype-pollution guard, boolean coercion, single-level dot-notation) and the same mutation logic (feature-scoped vs story-scoped field splitting, epic-nested story lookup, auto-stamped `updatedAt`) as `advance()` does today against a real file — verified by constructing the same test scenarios `cli-advance.js`'s existing tests use, but calling `applyAdvance()` directly against an in-memory fixture instead of a real file.

**AC3:** Given a `stateUpdate` that would trigger `acv-s1`'s "story not found, new record created" warning path, When `applyAdvance()` is called directly, Then `storyWasCreated: true` is present in its return value (not just embedded in a human-readable `stderr` string) — so a caller like wsd-s2 can programmatically detect this case without string-parsing.

## Out of Scope

- Any change to `bin/skills`'s CLI entry point or its argument parsing — unaffected, still calls the unchanged `advance()`.
- Any change to the actual validation RULES (enum values, boolean fields, etc.) — this is a pure structural extraction, zero rule changes.
- wsd-s2's own GitHub API mechanics — that's the next story.

## NFRs

- **Backward compatibility:** the single most important NFR for this story — `advance()`'s existing callers (the CLI, and `pipeline-state-writer.js`'s own existing local-fs path) must see zero behavioural difference.
- **Performance:** negligible — same synchronous, in-process logic, just called from one more place.

## Complexity Rating

**Rating:** 1 — a well-scoped, mechanical extraction with a clear correctness bar (existing tests must still pass unchanged).
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic — Medium (epic-level)
