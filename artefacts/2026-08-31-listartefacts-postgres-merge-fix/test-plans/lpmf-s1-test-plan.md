## Test Plan: Merge local-disk and Postgres artefact lists instead of local-wins-if-nonempty

**Story reference:** artefacts/2026-08-31-listartefacts-postgres-merge-fix/stories/lpmf-s1-merge-local-and-postgres-artefact-lists.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-31

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Partial local + fuller Postgres -> union of all distinct paths | 1 test | — | — | — | — | 🟢 |
| AC2 | Overlapping path -> local item wins | 1 test | — | — | — | — | 🟢 |
| AC3 | Empty local + Postgres rows -> pg rows returned (regression) | 1 test (existing, alrf-s4 AC3) | — | — | — | — | 🟢 |
| AC4 | Local only, no pg rows -> local returned (regression) | 1 test (existing, alrf-s4 AC2) | — | — | — | — | 🟢 |
| AC5 | Merged list groups correctly via groupArtefactsByStage | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. The merge is pure in-memory array logic, directly testable with the existing `listArtefacts(featureSlug, token, repoRoot, pgArtefactRows)` signature and temp-directory fixtures already used by `tests/check-alrf-s4-postgres-artefact-fallback.js`.

---

## Unit Tests

### partialLocalPlusFullerPostgresReturnsUnion

- **Verifies:** AC1
- **Precondition:** A temp repo root with a feature dir containing 3 `.md` files (local). `pgArtefactRows` has 8 rows for the same feature, including the same 3 paths plus 5 more distinct paths.
- **Action:** Call `listArtefacts(slug, token, root, pgRows)`.
- **Expected result:** `result.artefacts.length === 8`; every one of the 8 distinct paths present exactly once.
- **Edge case:** Yes — this is the actual gap the story closes (the live 3-vs-8 bug).

### overlappingPathPrefersLocalItem

- **Verifies:** AC2
- **Precondition:** Local has 1 file at a known path with real content (`sha: null`, local-derived `type`). `pgArtefactRows` has 1 row at the exact same path with different `type`-implying content.
- **Action:** Call `listArtefacts`.
- **Expected result:** The single returned artefact for that path has the local-derived fields (matches what `listLocalArtefacts`/`deriveTypeFromPath` on the local file would produce), not the Postgres row's derived type.
- **Edge case:** Yes.

### emptyLocalDirUsesPostgresRows (regression, mirrors alrf-s4 AC3)

- **Verifies:** AC3
- **Precondition:** Local feature dir exists but is empty. 2 pg rows.
- **Action:** Call `listArtefacts`.
- **Expected result:** `noArtefacts === false`, `artefacts.length === 2`.
- **Edge case:** No — regression guard.

### localOnlyNoPgRowsReturnsLocal (regression, mirrors alrf-s4 AC2)

- **Verifies:** AC4
- **Precondition:** Local has 1 real file, `pgArtefactRows` empty array.
- **Action:** Call `listArtefacts`.
- **Expected result:** `artefacts.length === 1`, no duplication.
- **Edge case:** No — regression guard.

### mergedListGroupsCorrectlyByStage

- **Verifies:** AC5
- **Precondition:** Same union scenario as AC1 (3 local + 5 pg-only paths spanning at least 2 different stage subdirectories, e.g. `dor/` and `test-plans/`).
- **Action:** Call `listArtefacts`, inspect `result.grouped`.
- **Expected result:** Every path appears in exactly one stage group; group membership matches `deriveTypeFromPath`'s existing logic for each path — no path duplicated across groups, none dropped.
- **Edge case:** No.

### fullSuiteRegressionUnaffected

- **Verifies:** Implicit regression coverage for all existing `alrf-s4`/`alrf-s1`/`wuce6`/`wuce20` tests.
- **Precondition:** None — full suite.
- **Action:** `node scripts/run-all-tests.js`.
- **Expected result:** Same pass count as pre-change baseline plus the new tests above; zero new failures, especially `tests/check-alrf-s4-postgres-artefact-fallback.js` and its siblings.
- **Edge case:** No.

---

## Integration Tests

None beyond the unit-level coverage above — `handleGetFeatureArtefacts`'s own wiring (AC5/AC6 of `alrf-s4`) is unaffected by this story (signature and call site unchanged).

---

## NFR Tests

None applicable — pure in-memory merge logic, no measurable performance/security surface at the artefact-list scale involved (single feature, small lists).

---

## Out of Scope for This Test Plan

- The GitHub-API fallback path — untouched by this story, no new tests needed.
- Any live-staging verification — this is a pure logic fix, fully covered by unit tests against the real `listArtefacts` function.

---

## Test Gaps and Risks

None.
