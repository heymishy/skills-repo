## Test Plan: Fix missing position_x/position_y migration breaking the journey canvas in deployed environments

**Story reference:** short-track bug fix (production incident) — `canvas-replacement-for-journey-stages` epic
**Epic reference:** artefacts/2026-10-10-infinite-canvas/epics/canvas-replacement-for-journey-stages.md
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-11

---

## Bug summary

`ic-s2` added `position_x`/`position_y` columns to `customer_journey_stages` via `scripts/migrate-schema-journeys.js`'s own `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements. That script is never copied into the deployed Docker image (confirmed: `Dockerfile`'s `COPY` allowlist includes `src/`, `skills/`, `product/`, `artefacts/`, `.github/`, specific version files, and one `tests/e2e/fixtures/llm-gateway/` path — never `scripts/`). `src/web-ui/server.js`'s own inline startup migration block for `customer_journey_stages` (the only thing that actually runs against a deployed database — see the `customer_journeys`/`customer_journey_stages` migration comments immediately above it, which document this exact pattern for every other column in this area) was never updated to also add these two columns.

**Live impact (confirmed on staging, 2026-10-11, reported by the operator):** `GET /journeys/:id` (`handleGetJourneyCanvas`) unconditionally `SELECT`s `position_x, position_y` — every journey canvas page view 500s with `error: column "position_x" does not exist` on any deployed environment whose `customer_journey_stages` table predates this fix (staging and, once promoted, production). Confirmed via `flyctl logs -a wuce-staging`, not assumed.

---

## AC Coverage

| AC | Description | Unit | Integration | Risk |
|----|-------------|------|-------------|------|
| AC1 | `server.js`'s own startup migration adds `position_x`/`position_y` (nullable `DOUBLE PRECISION`) to `customer_journey_stages`, idempotently, matching `scripts/migrate-schema-journeys.js`'s own column definition exactly | — | 1 test | 🟢 |
| AC2 | A fresh deploy to an already-existing `customer_journey_stages` table (pre-dating this fix, i.e. without these columns) ends up with both columns present after startup, with zero data loss on existing rows | — | 1 test | 🟢 |
| AC3 | `handleGetJourneyCanvas` no longer throws against a table migrated only via `server.js`'s own inline path (not `scripts/migrate-schema-journeys.js`) | — | 1 test | 🟢 |

---

## Integration Tests

### `server.js`'s own startup migration adds position_x/position_y

- **Verifies:** AC1, AC2
- **Precondition:** A real, disposable Postgres instance with `customer_journey_stages` already created via the OLD (pre-fix) inline schema (no `position_x`/`position_y`) — reproducing exactly the real staging/production starting state
- **Action:** Run the exact inline migration SQL `server.js` will execute on startup (extracted and run directly against the disposable instance, not a full server boot, to isolate the fix)
- **Expected result:** Both `position_x`/`position_y` columns exist afterward, nullable `DOUBLE PRECISION`, matching `scripts/migrate-schema-journeys.js`'s own column definitions exactly; running the same migration a second time does not error (idempotent); any pre-existing row's data is untouched

### `handleGetJourneyCanvas` works against a table migrated only via server.js's own path

- **Verifies:** AC3
- **Precondition:** Same disposable instance as above, post-migration
- **Action:** Call the real `handleGetJourneyCanvas` handler against a real pool connected to this instance, for a journey with 1+ stages
- **Expected result:** No error; the response includes the stage's `position_x`/`position_y` (`null` for a never-dragged stage, matching `ic-s2`'s own AC2 auto-layout-fallback behaviour)

---

## Out of Scope

- Fixing `scripts/migrate-schema-journeys.js` itself, or changing the Dockerfile's own `COPY` allowlist to include `scripts/` — the established pattern in this codebase (per the surrounding comments in `server.js`) is that `scripts/*.js` migration files are reference/manual-run copies, and the real deployed migration path is always the inline duplicate in `server.js`. This fix follows that existing convention, not a new one.
- The separate, already-logged-as-follow-up `journey-store-pg.js` SSL pool config gap and the dashboard-missing-CSRF-token gap (`decisions.md`, `ic-s4`'s own DoD RISK-ACCEPT entry, 2026-10-11) — unrelated to this bug.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| No automated test exercises a REAL Fly.io deploy | Out of reach for a unit/integration test | Manually confirm staging via `flyctl logs` + a real authenticated page load after deploy, before closing this out |
