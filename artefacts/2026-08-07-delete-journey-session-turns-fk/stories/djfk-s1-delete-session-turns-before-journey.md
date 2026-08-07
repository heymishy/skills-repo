## Story: Delete a journey's session_turns rows before the journey row, alongside artefacts

**Epic reference:** None — short-track (bounded bug fix)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [data]

## User Story

As an **operator deleting a journey that has real conversation turns recorded**,
I want to **have the delete actually succeed**,
So that **I don't hit an unhandled 500 error when trying to clean up a journey**.

## Benefit Linkage

**Metric moved:** Direct correctness defect fix (short-track, no formal benefit-metric artefact) — confirmed live on staging (2026-08-07): `handleDeleteJourney` (`journey.js:511`) threw an unhandled error — `update or delete on table "journeys" violates foreign key constraint "session_turns_journey_id_fkey" on table "session_turns"` — whenever the journey being deleted had any recorded turns.

**How:** Direct source inspection of `journey-store-pg.js`'s `deleteJourney(journeyId)` (added by story `alrf-s10`) confirms it explicitly deletes `artefacts` rows before the `journeys` row, with a comment noting `artefacts.journey_id` has a plain FK with no `ON DELETE` clause. `scripts/migrate-schema-pg.js` confirms `session_turns` has the exact same kind of FK (`journey_id VARCHAR NOT NULL REFERENCES journeys(journey_id)`, no `ON DELETE` clause) — but `alrf-s10`'s original story and implementation never mention or account for `session_turns` at all, and no dedicated unit test exists for `journey-store-pg.js`'s actual SQL statements (the existing `check-alrf-s10-delete-journey.js` only tests the higher-level `journey-store.js`, which mocks the pg adapter's `deleteJourney` entirely rather than exercising its real SQL) — so this gap was never caught.

## Architecture Constraints

- **Match the existing pattern exactly:** `deleteJourney` already deletes `artefacts` before `journeys` for the identical reason (a plain FK, no `ON DELETE` clause) — this story adds one more `DELETE FROM session_turns WHERE journey_id = $1` statement, in the same explicit, assertable-DELETE style (not a cascade), matching this repo's own established "assertable DELETE, not cascade-reliance-alone" convention (per `alrf-s10`'s own story text, citing `routes/products.js`'s `handleDeleteProduct`).
- **No D37/adapter concern:** this is a fix inside an existing function, not a new adapter.

## Dependencies

- **Upstream:** None (fixes already-shipped code from `alrf-s10`, a separate, already-merged feature).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a journey with both `artefacts` rows and `session_turns` rows recorded, When `deleteJourney(journeyId)` is called, Then all three deletes succeed in order (`session_turns`, then `artefacts`, then `journeys`) with no foreign key violation, and the function returns `{ deleted: true }`.

**AC2:** Given a journey with zero `session_turns` rows (the common case for a journey deleted before any turn was recorded), When `deleteJourney(journeyId)` is called, Then the delete still succeeds exactly as it does today — the new `DELETE FROM session_turns` statement is a no-op (zero rows affected), not an error.

**AC3:** Given `deleteJourney` is called for a `journeyId` that doesn't exist at all, When the function runs, Then it behaves exactly as it does today (`{ deleted: false }`, `journeys` DELETE affects zero rows) — this story does not change that existing behaviour.

## Out of Scope

- `session_turns_archive` — confirmed via direct schema inspection to have no foreign key constraint to `journeys` at all (a plain, unconstrained `journey_id` column), so it cannot cause this specific violation and is not touched by this fix.
- Any broader review of every table with a FK to `journeys` beyond `session_turns` and `artefacts` (the two confirmed via direct grep of every `REFERENCES journeys(journey_id)` in the codebase) — if a future migration adds a new FK-constrained table, that is a separate concern for whichever story introduces it.
- Any change to the `git: not found` warning also visible in the same staging log window — unrelated, unconfirmed, unscoped; not investigated as part of this story.

## NFRs

- **Performance:** One additional `DELETE` statement per journey deletion — negligible, deletion is not a hot path.
- **Security:** None identified — no new user input handling, parameterized query matching existing convention.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 1 — a single, well-understood SQL-ordering fix matching an existing established pattern in the same function.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
