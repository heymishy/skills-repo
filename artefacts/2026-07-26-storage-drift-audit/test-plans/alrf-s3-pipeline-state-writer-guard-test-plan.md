## Test Plan: pipeline-state-writer refuses to fabricate state on a missing file

**Story reference:** artefacts/2026-07-26-storage-drift-audit/stories/alrf-s3-pipeline-state-writer-guard.md
**Epic reference:** None — found via storage-drift audit
**Test plan author:** Claude (agent) — retrospective backfill, 2026-08-21
**Date:** 2026-08-21

**Backfill note:** reconstructed after the fact — implementation and its tests (3 new cases in the existing `tests/check-cdg7-gate-advance.js`) already existed and were merged (2026-07-26); documents existing coverage per `templates/retrospective-story.md`'s convention.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Writer throws when `.github/pipeline-state.json` does not already exist at repoRoot | 1 test | — | — | — | — | 🔴 |
| AC2 | A refused write does not create a bogus file | 1 test | — | — | — | — | 🟢 |
| AC3 | The normal path (file already exists) is completely unaffected | 1 test | 2 regression suites | — | — | — | 🟢 |
| AC4 | The gate-confirm route degrades correctly on a thrown write (no crash, trace emission correctly skipped) | — | — | — | 1 (code inspection) | — | 🟢 |

---

## Coverage gaps

**AC4** — verified by direct code inspection (`journey.js`'s pre-existing try/catch + `stateWriteSucceeded` gating, predating this change under `cdg.5`/ADR-023), not by a dedicated automated test — the existing gating logic was confirmed correct by reading it, not by a new test exercising the thrown-write path through the full route handler. Low risk: the gating mechanism itself already has its own coverage from the stories that introduced it.

---

## Test Data Strategy

**Source:** Seeded fixture (a real, pre-seeded `pipeline-state.json` for the normal-path cases) plus a deliberately unseeded temp directory for the missing-file case.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained.

---

## Unit Tests

Tests live in `tests/check-cdg7-gate-advance.js` (3 new named cases, within a 40/40 total suite):

- **AC1 (`T-alrf-s3a-missing-file-throws`):** the writer throws when `.github/pipeline-state.json` doesn't exist at `repoRoot`, against a deliberately unseeded temp dir.
- **AC2 (`T-alrf-s3b-missing-file-no-file-created`):** `fs.existsSync(statePath)` is false after the throw is caught — no bogus file created.
- **AC3 (`T-alrf-s3c-existing-file-unaffected`):** a normal write against a pre-seeded fixture still updates `prStatus` correctly.

---

## Integration Tests

**AC3 (regression):** full `check-cdg7-gate-advance.js` (40/40 total, including the 3 new cases above) and `check-owle6-pipeline-state-auto-write.js` (20/20) — both passing unchanged. None of the pre-existing tests relied on the fabricate-on-missing fallback (each pre-seeds a real fixture).

---

## E2E Tests

None.

---

## NFR Tests

None named — this is a governance-integrity fix (data-corruption prevention), not a formally-tracked NFR.

---

## Out of Scope for This Test Plan

- The other storage-drift audit findings (`workspace/ideas.json`, `workspace/estimation-norms.md`, artefact content) — story's own Out of Scope.
- Making pipeline-state writes actually succeed on staging (the durable-store fix) — story's own Out of Scope, tracked in `decisions.md` D1.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC4 verified by inspection only, not a dedicated automated test | The gating logic predates this story and already has its own coverage from the stories that introduced it (`cdg.5`/ADR-023) | Low risk — flag for a future session if `journey.js`'s gate-confirm handler is ever refactored, to confirm the gating still holds |
