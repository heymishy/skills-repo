# Test Plan: Build the canonical artefact trace from real disk structure for any feature

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s1-core-trace-builder.md
**Epic reference:** artefacts/2026-09-06-canonical-artefact-trace/epics/canonical-artefact-trace.md
**Test plan author:** Copilot (Claude)
**Date:** 2026-09-06

**Target module (new):** `src/web-ui/adapters/artefact-trace.js`, exporting `buildArtefactTrace(repoRoot, featureSlug)`
**Test runner:** `node scripts/run-all-tests.js` (dynamic glob of `tests/check-*.js`, each run standalone via `node <file>`, plain `assert` + custom `test(name, fn)` PASS/FAIL harness — per `tests/check-fadm-s1-document-matrix.js`'s established convention)
**Test file:** `tests/check-cat-s1-core-trace-builder.js`

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Fully-registered feature returns structure matching existing `getFeatureStoryStructure`/`groupArtefactsByStory` output | 2 | 1 | — | — | — | 🟢 |
| AC2 | Zero-registration feature (`phase4`, 205 files) returns all files, none dropped | 2 | — | — | — | — | 🟢 |
| AC3 | Archived-path fallback resolves automatically, one implementation | 2 | — | — | — | — | 🟢 |
| AC4 | Genuinely nonexistent slug returns typed "not found", not null/empty/throw | 2 | — | — | — | — | 🟢 |
| AC5 | Unsynced tenant checkout returns distinct "not yet synced", never conflated with AC4 | 2 | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All 5 ACs are pure data-layer function behaviour, fully testable via `assert` against the function's return value using real and synthetic on-disk fixtures.

---

## Test Data Strategy

**Source:** Mixed
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — tests generate their own fixtures in setup/teardown

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A fully-registered feature with epics/stories/artefacts | Fixture: this repo's own `2026-09-06-feature-artefact-document-matrix` (real, on disk, already fully registered) | None | Diff against live `getFeatureStoryStructure(...)` output for the same slug — the AC's own comparison basis |
| AC2 | A zero-registration feature with a known file count | Fixture: `2026-04-19-skills-platform-phase4` (real, on disk, 205 files, confirmed zero `pipeline-state.json` entries this session) | None | Assert returned artefact count === 205 |
| AC3 | A feature directory present only under `artefacts/archived/<slug>/` | Synthetic: `workspace/test-tmp-cat-s1-archived/` seeded with a fake `artefacts/archived/<slug>/discovery.md`, passed as `repoRoot` override | None | Follows this repo's own `workspace/test-tmp-*` convention (seen in-repo: `test-tmp-inf5`, `test-tmp-mig4`) |
| AC4 | A slug that exists under neither `artefacts/<slug>/` nor `artefacts/archived/<slug>/` | Synthetic: a random non-existent slug string | None | No disk fixture needed |
| AC5 | A `WUCE_TENANT_ROOT_BASE`-scoped repo root pointing at a directory that does not yet exist | Synthetic: `path.join(os.tmpdir(), 'wuce-unsynced-' + Date.now())` — never created on disk | None | Simulates the confirmed no-populator gap logged in `decisions.md`'s Q1 ASSUMPTION entry |

### PCI / sensitivity constraints

None — all fixtures are feature-slug/file-path/document-content data, no personal or financial fields anywhere in this story's data.

### Gaps

None — all 5 ACs' fixtures are available now, either as real on-disk repo state or synthetic temp directories the test itself creates and tears down.

---

## Unit Tests

### returns structure matching getFeatureStoryStructure for a fully-registered feature (AC1)

- **Verifies:** AC1
- **Precondition:** `2026-09-06-feature-artefact-document-matrix` exists on disk with full `pipeline-state.json` registration (real, current repo state)
- **Action:** Call `buildArtefactTrace(repoRoot, '2026-09-06-feature-artefact-document-matrix')` and separately call the existing `getFeatureStoryStructure(...)` for the same slug
- **Expected result:** Every epic slug, story slug, and artefact path present in the existing function's output is also present in `buildArtefactTrace`'s output (attribution match, not necessarily identical object shape — 1-L1 from `cat-s1`'s review flags exact field-naming as pinned during implementation, not test-plan time)
- **Edge case:** No

### does not attribute a document to the wrong story when two stories share a filename prefix (AC1)

- **Verifies:** AC1
- **Precondition:** Fixture feature with two stories `cat-s1` and `cat-s10` (prefix-colliding slugs)
- **Action:** Call `buildArtefactTrace` against the fixture
- **Expected result:** A document at `stories/cat-s10-foo.md` attributes to `cat-s10`, never `cat-s1`
- **Edge case:** Yes — guards a plausible off-by-substring bug in slug matching

### returns every one of phase4's 205 files, none dropped (AC2)

- **Verifies:** AC2
- **Precondition:** `2026-04-19-skills-platform-phase4` exists on disk, zero `pipeline-state.json` registration (confirmed this session)
- **Action:** Call `buildArtefactTrace(repoRoot, '2026-04-19-skills-platform-phase4')`
- **Expected result:** `result.artefacts.length === 205`; no exception thrown despite zero registration
- **Edge case:** No

### does not crash when pipeline-state.json has zero entries for the feature (AC2)

- **Verifies:** AC2
- **Precondition:** Same `phase4` fixture
- **Action:** Call `buildArtefactTrace`
- **Expected result:** Function completes without throwing; return value is a well-formed object (not `undefined`)
- **Edge case:** Yes — the "no reliance on any pipeline-state.json entry existing" clause in the AC text

### resolves a feature present only under artefacts/archived/ (AC3)

- **Verifies:** AC3
- **Precondition:** Synthetic fixture directory with a slug present under `artefacts/archived/<slug>/` only, absent under `artefacts/<slug>/`
- **Action:** Call `buildArtefactTrace(fixtureRepoRoot, slug)`
- **Expected result:** Returned artefacts include the file(s) under the archived path; `result.found === true`
- **Edge case:** No

### uses exactly one fallback code path for archived resolution, not three (AC3)

- **Verifies:** AC3
- **Precondition:** Source inspection combined with the archived-fixture test above
- **Action:** Grep `src/web-ui/adapters/artefact-trace.js` for archived-path resolution logic
- **Expected result:** Exactly one function/branch implements the `artefacts/` → `artefacts/archived/` fallback; `artefact-list.js`, `artefact-fetcher.js`, and `validate-trace.ps1`'s own three separate implementations are not duplicated a fourth time inside this new module
- **Edge case:** Yes — this is a structural/architectural assertion, not a behavioural one; verified via source read at test-authorship time and re-checked at `cat-s6`'s regression pass

### returns a typed not-found result for a genuinely nonexistent slug (AC4)

- **Verifies:** AC4
- **Precondition:** A random slug string guaranteed not to exist under either `artefacts/<slug>/` or `artefacts/archived/<slug>/`
- **Action:** Call `buildArtefactTrace(repoRoot, 'definitely-does-not-exist-9f3a')`
- **Expected result:** Return value is a distinctly-typed result (e.g. `{ status: 'not-found' }`), not `null`, not `{ artefacts: [] }`, and no exception is thrown
- **Edge case:** No

### does not throw for a nonexistent slug (AC4)

- **Verifies:** AC4
- **Precondition:** Same as above
- **Action:** Wrap the call in `assert.doesNotThrow(...)`
- **Expected result:** No exception propagates
- **Edge case:** Yes — negative/defensive case

### returns a distinct not-yet-synced result for an unpopulated tenant checkout (AC5)

- **Verifies:** AC5
- **Precondition:** `repoRoot` points at a synthetic path that does not exist on disk at all (simulating an unsynced `WUCE_TENANT_ROOT_BASE` checkout)
- **Action:** Call `buildArtefactTrace(unsyncedRepoRoot, anySlug)`
- **Expected result:** Return value's status is distinctly `not-yet-synced` — a different value than the `not-found` status from the AC4 test
- **Edge case:** No

### does not conflate not-yet-synced with not-found (AC5)

- **Verifies:** AC5
- **Precondition:** Both fixtures from the AC4 and AC5 tests above, run in the same test
- **Action:** Compare `result.status` from both calls
- **Expected result:** `assert.notStrictEqual(notFoundResult.status, notYetSyncedResult.status)`
- **Edge case:** Yes — this is the AC's own explicit non-conflation requirement, testable only by direct comparison

---

## Integration Tests

### builder's output feeds features.js's existing rendering without modification (AC1 seam)

- **Verifies:** AC1 — seam between the new builder and the existing render path it will eventually replace (in `cat-s4`)
- **Components involved:** `artefact-trace.js` (new), `feature-story-structure.js` (existing, being superseded)
- **Precondition:** Fully-registered fixture feature
- **Action:** Feed `buildArtefactTrace`'s output through a shape-compatibility check against what `renderGroupedArtefactIndexHtml` currently expects from `feature-story-structure.js`
- **Expected result:** No missing field causes a rendering crash when the two are wired together in `cat-s4` — this test exists to catch a shape mismatch early, before `cat-s4`'s own integration work begins
- **Edge case:** No

---

## NFR Tests

### Directory walk completes within 50ms for a 300-file feature

- **NFR addressed:** Performance
- **Measurement method:** `process.hrtime()` wrapped around the `buildArtefactTrace` call against the `phase4` fixture (205 files, closest real fixture to the 300-file target)
- **Pass threshold:** < 50ms (empirically measured this session at 6ms for the same fixture via a plain directory walk — this threshold keeps wide headroom, not a tight ceiling)
- **Tool:** Node `process.hrtime()`, asserted inline in the test file

### No new input surface is introduced

- **NFR addressed:** Security
- **Measurement method:** Source read — confirm `featureSlug` is never used to construct a filesystem path without going through the existing validated slug parameter already sanitised upstream in route handlers
- **Pass threshold:** No new unvalidated user-input-to-filesystem-path construction exists in `artefact-trace.js`
- **Tool:** Manual source review at test-authorship time (no automated scanner configured for this class of check in this repo)

---

## Out of Scope for This Test Plan

- Rendering/UI output — `buildArtefactTrace` is a pure data function; its consumers' rendering is tested in `cat-s4`'s own test plan.
- The shared label/subdirectory table — tested separately in `cat-s2`'s own test plan; this story's builder is tested with raw type strings only.
- Divergence classification (`unregistered`/`orphaned-registration`/`not-yet-synced` labels beyond the bare not-found/not-yet-synced status codes needed for AC4/AC5) — `cat-s3`'s own test plan covers the full classification taxonomy.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real multi-tenant `WUCE_TENANT_ROOT_BASE` unsynced behaviour is simulated, not exercised against a real tenant checkout | No real multi-tenant SaaS environment is available in this test context; the design's own AC5 is satisfied by the function's contract, not a live tenant | Synthetic fixture (nonexistent directory) is a faithful simulation of "not yet synced" per `decisions.md`'s own ASSUMPTION log entry describing this exact gap |
