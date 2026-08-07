## Test Plan: Backfill already-completed stage artefacts to a repo at the moment it's connected

**Story reference:** artefacts/2026-08-06-durable-artefact-storage/stories/das-s3-backfill-artefacts-on-repo-connection.md
**Epic reference:** artefacts/2026-08-06-durable-artefact-storage
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Already-completed stages with local content get committed on repo connection | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | A stage whose local file no longer exists is skipped, others still proceed | 1 test | — | — | — | — | 🟢 |
| AC3 | `backfill` field present in the response from all 3 entry points | 1 test per entry point (3 tests) | — | — | — | — | 🟢 |
| AC4 | Zero-completed-stages case does no backfill work at all | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic (extends `_applyRepoChange`'s existing test conventions in `tests/check-prc-s4.1-edit-product.js`: a mocked pool, a mocked `_repoAdapterModule.getRepoAdapter()` for the access check, real temp-directory local files to simulate "already-completed stage content still on disk")
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A journey's `completedStages` entries (from `journey-store.js`) referencing real local files in a temp artefact root; a mocked commit adapter (reusing `das-s1`'s `artefact-commit-writer.js` mock pattern) | Synthetic fixture + mock | None | |
| AC2 | Same, but one stage's local file deleted before the backfill runs | Synthetic fixture | None | |
| AC3 | Three separate test invocations, one per entry point (`handlePutProductEdit`, `handlePostConnectRepo`, `handlePostProductRepoCreate`) | Synthetic fixture + mocks | None | |
| AC4 | A journey with zero `completedStages` | Synthetic fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### backfillCompletedStages_commitsEachStageWithLocalContent

- **Verifies:** AC1
- **Precondition:** A journey with 3 completed stages, each with a real local file present in a temp artefact root; no prior repo connected
- **Action:** Call the new backfill function directly (name TBD by implementation, e.g. `backfillCompletedStagesToRepo(journey, owner, repo, accessToken)`)
- **Expected result:** The mocked commit adapter receives exactly 3 calls, one per stage, each with the correct artefact path and content
- **Edge case:** No

### backfillCompletedStages_reusesArtefactCommitWriter

- **Verifies:** AC1 (architecture constraint — reuse, not reimplementation)
- **Precondition:** Same as above
- **Action:** Inspect which module the backfill function calls to perform the actual commit
- **Expected result:** It calls `das-s1`'s existing `artefact-commit-writer.js`'s `commitArtefact` — not a new, separate commit implementation
- **Edge case:** No

### backfillCompletedStages_skipsStageWithMissingLocalFile

- **Verifies:** AC2
- **Precondition:** A journey with 3 completed stages; one stage's local file deleted before the backfill runs
- **Action:** Call the backfill function
- **Expected result:** The mocked commit adapter receives exactly 2 calls (the 2 stages with content still present); the missing stage produces no error that stops the other 2 from being attempted
- **Edge case:** Yes — this is the core best-effort guarantee AC2 exists to prove

### backfillCompletedStages_noOpsForZeroCompletedStages

- **Verifies:** AC4
- **Precondition:** A journey with zero completed stages
- **Action:** Call `_applyRepoChange` (or the relevant entry point) for this journey's product
- **Expected result:** The backfill function makes zero commit-adapter calls and zero local-file-existence checks beyond confirming the completed-stages list is empty — no wasted work for the common case
- **Edge case:** Yes — the common-case negative control

### applyRepoChange_responseIncludesBackfillField

- **Verifies:** AC3 (via `_applyRepoChange` directly, since all 3 entry points call it)
- **Precondition:** A journey with 2 completed stages, one with content present, one missing
- **Action:** Call `_applyRepoChange`
- **Expected result:** The returned object includes `backfill: { attempted: 2, succeeded: 1, skipped: ['<stageName>'] }`, matching AC3's exact shape
- **Edge case:** No

---

## Integration Tests

### handlePostProductRepoCreate_migratedToUseApplyRepoChange_includesBackfill

- **Verifies:** AC1, AC3 (the migration this story requires)
- **Components involved:** `handlePostProductRepoCreate` (`products.js`), `_applyRepoChange` (`product-repo.js`), the new backfill function
- **Precondition:** A product with a journey that has 1 completed stage with local content, connecting a brand-new repo via this handler
- **Action:** Call `handlePostProductRepoCreate`
- **Expected result:** The response JSON includes the `backfill` field (proving the migration to `_applyRepoChange` happened — today, before this story, this handler has no way to produce this field since it doesn't call `_applyRepoChange` at all), and the stage's content is committed to the newly-created repo

### handlePutProductEdit_and_handlePostConnectRepo_bothIncludeBackfillField

- **Verifies:** AC3 (the two entry points that already share `_applyRepoChange`)
- **Components involved:** `handlePutProductEdit`, `handlePostConnectRepo`, `_applyRepoChange`
- **Precondition:** Same fixture as above, exercised through both existing entry points
- **Action:** Call both handlers separately
- **Expected result:** Both responses include an identical-shaped `backfill` field — proving the single consolidation point (`_applyRepoChange`) delivers the feature to both without any handler-specific code

---

## NFR Tests

### backfillLatency_addsBoundedDelayToRepoConnection

- **NFR addressed:** Performance
- **Measurement method:** Time `_applyRepoChange` with 5 completed stages needing backfill (mocked commit adapter with realistic ~200ms latency per commit) versus zero stages
- **Pass threshold:** Reported honestly — no invented pass/fail threshold, since this NFR's own story text says "a brief added delay is acceptable and should be reported honestly if measured," not a specific number
- **Tool:** `scripts/run-all-tests.js` timing assertion, informational only

### backfillTenantScoping_neverCrossesTenantBoundary

- **NFR addressed:** Security (ADR-025)
- **Measurement method:** Two products in different tenants, each with completed stages needing backfill; connect a repo to one; assert the other tenant's stages are never touched
- **Pass threshold:** Zero cross-tenant commit-adapter calls
- **Tool:** `scripts/run-all-tests.js` assertion

### backfillLog_recordsEveryAttempt

- **NFR addressed:** Audit
- **Measurement method:** Assert a log entry exists for both the AC1 success case and the AC2 skip case, each naming the feature slug and stage name
- **Pass threshold:** Exactly one log entry per attempt
- **Tool:** `scripts/run-all-tests.js` assertion on a mocked logger

---

## Out of Scope for This Test Plan

- Any test of `handlePostProductRepoCreate`'s pre-existing behavior beyond the migration itself (repo creation success/failure, name-taken conflicts) — already covered by existing tests for that handler, unmodified by this story.
- Any UI rendering of the `backfill` response field — this story adds the field, it does not require or test any frontend consumption of it (per the story's own Out of Scope and Accessibility NFR).

---

## Test Gaps and Risks

None identified.
