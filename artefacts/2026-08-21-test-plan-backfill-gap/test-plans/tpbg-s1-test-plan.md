## Test Plan: Backfill missing test-plan artefacts for 11 already-shipped stories

**Story reference:** artefacts/2026-08-21-test-plan-backfill-gap/stories/tpbg-s1-backfill-missing-test-plan-artefacts.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-21

**Note on this story's own test shape:** this story's deliverable IS test-plan authorship for 11 other stories — there is no application code under test. Its own verification method is `/trace`'s `test_plan_coverage` check itself (a meta-check over the artefact tree), not a unit/integration/E2E test in the usual sense.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Each of the 11 stories reviewed, real coverage reconstructed or gap flagged | — | — | — | 1 (direct review) | — | 🟢 |
| AC2 | `/trace`'s `test_plan_coverage` reports 0 MISSING for these 11 | — | 1 (meta-check) | — | — | — | 🟢 |
| AC3 | `pipeline-state.json`'s `testPlan.artefact` updated for all 11 | — | 1 (integrity check) | — | — | — | 🟢 |

---

## Coverage gaps

None for this story's own 3 ACs. (One genuine gap was found IN the underlying work — `r-canvas-render-and-story-extraction-fix`'s AC3 — but that is correctly out of this story's scope and already tracked separately as F3/`csgc-s1`; see the story's own Out of Scope section.)

---

## Test Data Strategy

**Source:** Fixtures — this repo's own real, already-existing 11 story/dod artefacts and test files are the "test data" (nothing synthetic; the work is reading and cross-referencing real, already-shipped state).
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained.

---

## Unit Tests

None — no application code.

---

## Integration Tests

### AC2: `/trace`'s `test_plan_coverage` check

- **Verifies:** AC2.
- **Action:** `bash scripts/validate-trace.sh --ci` (or the CI job "Validate traceability chain").
- **Expected result:** `test_plan_coverage` passes with 0 `MISSING` entries for the 11 stories in scope.

### AC3: `pipeline-state.json` integrity

- **Verifies:** AC3.
- **Action:** `node scripts/check-pipeline-state-integrity.js`.
- **Expected result:** Only the same 3 known, pre-existing C3 failures (`wucp.1`, `lab-s3.1`, `rb-s5`) — no new failures introduced.

---

## E2E Tests

None.

---

## NFR Tests

None named — documentation/traceability backfill only.

---

## Out of Scope for This Test Plan

- Testing the underlying, already-shipped features described by the 11 backfilled stories — confirmed already correct via their own existing, real test suites (cited in each new test-plan.md).
- The genuine test-coverage gap found during review (`r-canvas-render-and-story-extraction-fix` AC3) — tracked separately as F3/`csgc-s1`.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
