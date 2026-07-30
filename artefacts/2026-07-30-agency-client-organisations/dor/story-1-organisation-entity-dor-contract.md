# Contract Proposal — Organisation exists as a first-class entity with an org_type

**What will be built:**
A new `organisations` table (migration: `org_id` PK, `name`, `org_type`, `created_at`), created via this codebase's existing `CREATE TABLE IF NOT EXISTS` migration convention (mirroring `migrateTeamSchema`'s pattern). A resolution step invoked at OAuth callback that looks up (or creates, with `org_type = 'standalone'`) an `organisations` row for the session's `tenant_id`. A backfill step that runs once to create `standalone` rows for pre-existing tenants that have no `organisations` row yet.

**What will NOT be built:**
No UI for viewing or editing organisation details — this story is data-model and resolution-step only. No route or page is added. Setting `org_type = 'agency'` or `'client'` is Story 3's responsibility, not this one.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|----------------|------|
| AC1 | Unit test asserting migration creates the table with correct columns, idempotent on re-run | Unit |
| AC2 | Unit + integration test: pre-existing tenant fixture gets backfilled `standalone` row, no prompt shown | Unit, Integration |
| AC3 | Unit + integration test: new-signup fixture resolves/creates `standalone` row at OAuth callback | Unit, Integration |
| AC4 | Integration test: existing route/session fixtures behave identically pre/post this story | Integration |

**Assumptions:**
`tenant_id` remains the value trusted from `req.session` — no change to how sessions are established, only an additive lookup keyed on that existing trusted value. The backfill step is safe to run against production data because it only ever creates rows, never mutates or deletes existing tenant data.

**Estimated touch points:**
Files: a new migration/adapter module (e.g. `adapters/organisations-pg.js`), `server.js` (wiring the resolution step at OAuth callback), `tests/check-story1-organisation-entity.js`.
Services: none new.
APIs: none new — additive DB table only.
