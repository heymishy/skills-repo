# Test Plan: Classify every divergence case the audit found, not just the common one

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s3-divergence-classification.md
**Epic reference:** artefacts/2026-09-06-canonical-artefact-trace/epics/canonical-artefact-trace.md
**Test plan author:** Copilot (Claude)
**Date:** 2026-09-06

**Target module:** `src/web-ui/adapters/artefact-trace.js`, extended with `classifyDivergence(traceResult, pipelineState)` (runs as part of `buildArtefactTrace`'s single-pass walk, per the story's own NFR)
**Test runner:** `node scripts/run-all-tests.js`
**Test file:** `tests/check-cat-s3-divergence-classification.js`

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Unregistered disk document marked `unregistered`, attached to inferred grouping when a pattern match exists | 3 | — | — | — | — | 🟢 |
| AC2 | Registered slug with no matching file marked `orphaned-registration`, distinct from `unregistered` | 2 | — | — | — | — | 🟢 |
| AC3 | Not-yet-synced feature marks every document `not-yet-synced` at feature level, takes precedence over per-document states | 2 | 1 | — | — | — | 🟢 |
| AC4 | Correctly-matched document marked `registered`, no flag downstream | 1 | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All 4 ACs are pure classification-logic behaviour on structured input, fully testable with synthetic fixtures.

---

## Test Data Strategy

**Source:** Mixed
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A trace result with a document present on disk but absent from `pipeline-state.json`, both with and without an inferrable filename pattern | Fixture: real `phase4` trace output (zero registration) plus a synthetic single-document trace with no pattern match | None | Two sub-cases: pattern-matches-something vs. genuinely no pattern |
| AC2 | A `pipeline-state.json` fixture entry with a story slug that has zero corresponding files in the trace's artefact list | Synthetic: constructed in-memory `pipelineState` object with one story entry, empty artefact list for that slug | None | Mirrors the real `ougl` dot/dash-mismatch case and the one fully-orphaned feature registration found in the audit, without needing to reproduce those exact repo states |
| AC3 | A trace result carrying `cat-s1`'s own `not-yet-synced` status at the feature level | Synthetic: `buildArtefactTrace`'s AC5 fixture (unsynced tenant path) piped into `classifyDivergence` | None | Directly reuses `cat-s1`'s own AC5 test fixture — same synthetic nonexistent-directory technique |
| AC4 | A fully-registered fixture feature with one clean, correctly-matched document | Fixture: this repo's own `2026-09-06-feature-artefact-document-matrix` | None | Real, on-disk, no synthetic construction needed |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### unregistered document with a matching inferred pattern attaches to that grouping (AC1)

- **Verifies:** AC1
- **Precondition:** Synthetic trace with a document `phase4-story-3-notes.md` alongside other documents already inferred into a `phase4-story-3` grouping
- **Action:** Call `classifyDivergence(trace, emptyPipelineState)`
- **Expected result:** The document's classification is `unregistered`, AND its `inferredGroup` field equals `phase4-story-3` — both conditions checked in the same test
- **Edge case:** No

### unregistered document with no matching pattern is still marked unregistered, not silently dropped (AC1)

- **Verifies:** AC1
- **Precondition:** Synthetic trace with a single isolated document, no other documents to pattern-match against
- **Action:** Call `classifyDivergence`
- **Expected result:** Classification is `unregistered`; `inferredGroup` is `null`/absent (not fabricated) — the document itself is still present in the output, not omitted
- **Edge case:** Yes — the "never left fully ungrouped when a reasonable inference exists" vs. "no reasonable inference exists" boundary

### phase4's real files are all classified unregistered (AC1, real-fixture regression guard)

- **Verifies:** AC1
- **Precondition:** Real `phase4` trace output (from `cat-s1`), empty `pipelineState` (confirmed zero registration this session)
- **Action:** Call `classifyDivergence`
- **Expected result:** Every one of the 205 documents has classification `unregistered`
- **Edge case:** No

### registered slug with zero matching files is marked orphaned-registration (AC2)

- **Verifies:** AC2
- **Precondition:** Synthetic `pipelineState` with story slug `ghost-s1` registered, trace's artefact list contains zero files matching that slug
- **Action:** Call `classifyDivergence`
- **Expected result:** The story-level classification for `ghost-s1` is `orphaned-registration`
- **Edge case:** No

### orphaned-registration and unregistered are never the same classification value (AC2, explicit non-conflation check)

- **Verifies:** AC2
- **Precondition:** Both the AC1 unregistered-document fixture and the AC2 orphaned-registration fixture, evaluated together
- **Action:** Compare the two classification string values
- **Expected result:** `assert.notStrictEqual('unregistered', 'orphaned-registration')` — trivially true as literals, but the real assertion is that the classifier never emits `unregistered` for the orphaned-registration fixture or vice versa
- **Edge case:** Yes — this is the AC's own explicit "never the same state value" requirement

### not-yet-synced status overrides all per-document classification for the feature (AC3)

- **Verifies:** AC3
- **Precondition:** A trace result with `status: 'not-yet-synced'` at the feature level, containing (hypothetically, since the walk didn't actually complete) zero real per-document data
- **Action:** Call `classifyDivergence`
- **Expected result:** Every document classification the function would attempt to produce instead returns/short-circuits to `not-yet-synced` at the feature level — no per-document `unregistered`/`orphaned-registration` value is computed or returned
- **Edge case:** No

### not-yet-synced precedence holds even when the trace also contains data suggesting divergence (AC3)

- **Verifies:** AC3
- **Precondition:** A contrived trace that is simultaneously flagged `not-yet-synced` at feature level AND contains a document that would otherwise classify as `orphaned-registration`
- **Action:** Call `classifyDivergence`
- **Expected result:** Feature-level `not-yet-synced` wins — no document-level classification is emitted alongside it
- **Edge case:** Yes — directly tests the AC's own "takes precedence" language against a constructed conflict case

### correctly-matched document is marked registered with no flag (AC4)

- **Verifies:** AC4
- **Precondition:** Real `2026-09-06-feature-artefact-document-matrix` trace + its own real `pipelineState` (both fully aligned, ~65% common case)
- **Action:** Call `classifyDivergence`
- **Expected result:** The matched document's classification is `registered`; no `unregistered`/`orphaned-registration`/`not-yet-synced` value present anywhere in its record
- **Edge case:** No

---

## Integration Tests

### classification runs within cat-s1's own single-pass walk, no second directory traversal (AC3 / NFR)

- **Verifies:** AC3 and the story's own Performance NFR ("no additional directory traversal")
- **Components involved:** `artefact-trace.js`'s `buildArtefactTrace` and `classifyDivergence`
- **Precondition:** Instrument `fs.readdirSync`/`fs.readdir` call count (or equivalent) during a full `buildArtefactTrace` call against the `phase4` fixture
- **Action:** Compare call count before and after `classifyDivergence` is wired into the same pass
- **Expected result:** No increase in filesystem read calls attributable to classification — it operates on the already-walked in-memory structure
- **Edge case:** No

---

## NFR Tests

### classification adds no additional directory traversal

- **NFR addressed:** Performance
- **Measurement method:** Same instrumentation as the integration test above — filesystem call count comparison
- **Pass threshold:** Zero additional `fs.readdir`/`fs.readdirSync` calls introduced by `classifyDivergence`
- **Tool:** Node's built-in `fs` module wrapped/spied in the test file (no external mocking library configured in this repo's plain-`assert` test convention — a simple manual monkey-patch-and-restore is used)

---

## Out of Scope for This Test Plan

- Any rendering of these classification states — `cat-s4`'s own test plan covers the UI flag.
- Auto-correction/write-back for `orphaned-registration` — explicitly out of scope per the story; no test exists for a write action because none should occur.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None identified | — | — |
