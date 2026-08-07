## Test Plan: Delete a journey's session_turns rows before the journey row, alongside artefacts

**Story reference:** artefacts/2026-08-07-delete-journey-session-turns-fk/stories/djfk-s1-delete-session-turns-before-journey.md
**Epic reference:** None — short-track
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Journey with turns + artefacts: all 3 deletes succeed in correct order | 2 tests | — | — | — | — | 🟢 |
| AC2 | Journey with zero turns: delete still succeeds, new statement is a no-op | 1 test | — | — | — | — | 🟢 |
| AC3 | Nonexistent journeyId: unchanged existing behaviour | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. This is also the first dedicated unit test file for `journey-store-pg.js`'s actual SQL behavior — the existing `check-alrf-s10-delete-journey.js` only tests the higher-level `journey-store.js` wrapper with the pg adapter fully mocked out, which is why this bug was never caught.

---

## Test Data Strategy

**Source:** Synthetic — a hand-rolled mock `pg`-Pool-shaped object recording every `query(sql, params)` call, mirroring the established `createMockPool` pattern already used in `tests/check-das-s1-commit-artefact-git-fallback.js` and `tests/check-das-s2-require-connected-repo.js`.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A mock pool that records the SQL statement text and params for every `query()` call | Synthetic mock | None | Assert both the ORDER of statements and that all 3 target the correct `journeyId` |
| AC2 | Same mock, no special setup needed — the function's own behaviour must not branch on whether turns exist | Synthetic mock | None | |
| AC3 | Same mock, configured so the `journeys` DELETE returns `rowCount: 0` | Synthetic mock | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### deleteJourney_deletesSessionTurnsArtefactsAndJourney_inCorrectOrder

- **Verifies:** AC1
- **Precondition:** A mock pool recording every `query()` call's SQL text and params
- **Action:** Call `deleteJourney('journey-1')`
- **Expected result:** Exactly 3 `query()` calls occur, in this order: (1) `DELETE FROM session_turns WHERE journey_id = $1` with `['journey-1']`, (2) `DELETE FROM artefacts WHERE journey_id = $1` with `['journey-1']`, (3) `DELETE FROM journeys WHERE journey_id = $1` with `['journey-1']` — the new statement must come first (or at minimum, before the `journeys` DELETE), matching the same FK-ordering requirement as the existing `artefacts` statement
- **Edge case:** No

### deleteJourney_returnsDeletedTrue_whenJourneyRowRemoved

- **Verifies:** AC1
- **Precondition:** Mock pool's `journeys` DELETE returns `rowCount: 1`
- **Action:** Call `deleteJourney('journey-1')`
- **Expected result:** Returns `{ deleted: true }`
- **Edge case:** No

### deleteJourney_succeedsWithZeroSessionTurns_asANoOp

- **Verifies:** AC2
- **Precondition:** Mock pool's `session_turns` DELETE returns `rowCount: 0` (nothing to delete)
- **Action:** Call `deleteJourney('journey-1')`
- **Expected result:** No error is thrown; the function proceeds to delete `artefacts` and `journeys` exactly as before; returns `{ deleted: true }`
- **Edge case:** Yes — the common case (most journeys never accumulate turns before being deleted)

### deleteJourney_returnsDeletedFalse_forNonexistentJourney

- **Verifies:** AC3
- **Precondition:** Mock pool's `journeys` DELETE returns `rowCount: 0` for a journeyId that was never created
- **Action:** Call `deleteJourney('nonexistent-journey')`
- **Expected result:** Returns `{ deleted: false }` — identical to today's existing behaviour, unchanged by this fix
- **Edge case:** Yes — boundary/regression guard

---

## Integration Tests

None new — this is a pure data-access-layer fix with no new integration surface. The existing `check-alrf-s10-delete-journey.js`'s higher-level tests (mocking the pg adapter's `deleteJourney` entirely) continue to pass unmodified, since this fix doesn't change `deleteJourney`'s signature or return shape.

---

## NFR Tests

None — "None identified" per the story's own NFR section; this is a correctness fix with no new performance, security, or audit surface.

---

## Out of Scope for This Test Plan

- `session_turns_archive` — confirmed to have no FK constraint, cannot cause this violation, not tested here.
- Any live/integration test against a real Postgres instance — the existing convention in this codebase for this class of fix is a mocked-pool unit test (see `das-s1`/`das-s2`/`das-s3`'s own test files), not a real-DB integration test.

---

## Test Gaps and Risks

None identified.
