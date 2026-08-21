## Test Plan: Postgres artefact-content fallback for listArtefacts

**Story reference:** artefacts/2026-07-26-canvas-render-and-story-extraction-fix/stories/alrf-s4-postgres-artefact-fallback.md
**Epic reference:** csd-e1-code-shape-diagrams
**Test plan author:** Claude (agent) — retrospective backfill, 2026-08-21
**Date:** 2026-08-21

**Backfill note:** reconstructed after the fact — implementation and its test file (`tests/check-alrf-s4-postgres-artefact-fallback.js`) already existed and were merged (2026-07-26); documents existing coverage per `templates/retrospective-story.md`'s convention.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Postgres rows used when local disk and GitHub API both find nothing | 1 test | — | — | — | — | 🟢 |
| AC2 | Local disk still wins over Postgres when local has real content | 1 test | — | — | — | — | 🟢 |
| AC3 | An existing-but-empty local directory still checks Postgres before giving up | 1 test | — | — | — | — | 🟢 |
| AC4 | No regression when `pgArtefactRows` is omitted or empty | 2 sub-tests | — | — | — | — | 🟢 |
| AC5 | `handleGetFeatureArtefacts` resolves the journey once and fetches Postgres rows via its `journeyId` | 1 test | — | — | — | — | 🟢 |
| AC6 | A Postgres error degrades gracefully (no crash, empty rows, not a 500) | 1 test | — | — | — | — | 🟢 |
| AC7 | No regression to existing suites | — | 6 regression suites | — | — | — | 🟢 |

---

## Coverage gaps

None. All 7 ACs have direct test coverage.

---

## Test Data Strategy

**Source:** Synthetic — in-memory pre-fetched `{skill_name, artefact_path, content}` row fixtures, plus temp fixture directories for the local-disk-priority cases.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained.

---

## Unit Tests

Tests live in `tests/check-alrf-s4-postgres-artefact-fallback.js` (14 assertions total):

- **AC1:** Postgres rows used when local disk empty/absent and GitHub API finds nothing.
- **AC2:** Local disk content wins over Postgres rows (no duplication) when local has real content.
- **AC3:** An existing-but-empty local directory checks Postgres before giving up (changes `alrf-s1`'s original short-circuit).
- **AC4 (2 sub-assertions):** `pgArtefactRows` omitted, and empty array — both no-regression.
- **AC5:** `handleGetFeatureArtefacts` resolves the journey once via the existing `journeyForPage` lookup, fetches rows via `getArtefactsForJourney(journeyId)`.
- **AC6:** A Postgres error is caught and degrades to `[]`, not a crash or 500.

---

## Integration Tests

**AC7 (regression):** `check-wuce6-feature-navigation.js` (57/57), `check-wuce20-artefact-index-html.js` (40/40), `check-kfd1-...` (42/42), `check-alrf-s1-...` (8/8), `check-p3.1-pg-journey-adapter.js` (13/13), `check-p3.3-persistence-survival.js` (18/18) — all unchanged.

---

## E2E Tests

None.

---

## NFR Tests

None named.

---

## Out of Scope for This Test Plan

- Migrating artefact *writes* to a GitHub-commit-based path (story's own Out of Scope — Postgres write side already exists via `saveArtefact()`).
- `workspace/ideas.json` / `workspace/estimation-norms.md` — tracked separately under `2026-07-26-storage-drift-audit`.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
