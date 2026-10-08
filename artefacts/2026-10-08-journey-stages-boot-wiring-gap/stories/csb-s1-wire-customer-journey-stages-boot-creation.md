# Story: Wire customer_journey_stages boot-time table creation

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the real gap found below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator of this platform's production deployment**,
I want **`customer_journey_stages` to be created automatically on server boot, matching every other table this feature depends on**,
So that **`POST /journeys/:id/stages` (shipped in `ep1-s2`) works correctly in a genuinely fresh deployment, not only in environments that happened to receive a one-off manual migration script run**.

## Benefit Linkage

**Metric moved:** None formally tracked — short-track correctness fix, not a metric-bearing feature. Direct benefit: closes a real deployability gap on a live, merged, already-consumed table.
**How:** Found by direct code read while grounding `ep1-s3`'s own schema dependency (2026-10-08) — `grep -n "CREATE TABLE IF NOT EXISTS customer_journey_stages" src/web-ui/server.js` returns zero results. `ep1-s1` correctly wired `customer_journeys`' own boot-time creation into `server.js` (D37), but `ep1-s2` — the first and only consumer of `customer_journey_stages` — did not do the same for that table, and its own DoR incorrectly marked the D37 wiring check N/A on the reasoning "no new adapter introduced," conflating "no new injectable adapter function" with "no new table dependency needing boot-wiring." The table exists today only because `ep5-s3`'s one-time manual script run created it directly against `wuce-staging` and `skills-framework` (production) Postgres — a genuinely fresh environment (a new Fly machine, a new Postgres instance, a local dev database) would have `POST /journeys/:id/stages` fail with `relation "customer_journey_stages" does not exist` on its very first real use, exactly the deployability class of defect `ep5-s3` fixed for `customer_journeys` itself.

## Architecture Constraints

**Root cause:** `server.js`'s boot-time inline migration block (the one `ep1-s1` added `customer_journeys`' own `CREATE TABLE IF NOT EXISTS` statement to, alongside `credits`/`stripe_events`/`tenant_plan`) does not include `customer_journey_stages`. The real, proven SQL already exists verbatim in `scripts/migrate-schema-journeys.js` (lines 46–64) — that script itself is never run automatically in any real deployment (confirmed by the `Dockerfile`'s own explicit `COPY` allowlist, which excludes `scripts/` entirely), so copying its SQL into the inline boot block is the only way this table gets created in a genuinely fresh environment, exactly matching `ep1-s1`'s own precedent for `customer_journeys`.

**Fix shape:**
1. Add `customer_journey_stages`' `CREATE TABLE IF NOT EXISTS` (and its two indexes) to `server.js`'s existing boot-time inline migration block, immediately after the `customer_journeys` block `ep1-s1` added — copying the exact SQL from `scripts/migrate-schema-journeys.js` verbatim, not re-deriving it.
2. `feature_customer_journey_stage_mappings` (the third table in that same migration script) is explicitly OUT of scope here — it has no consumer yet (`ep2-s2` is its first planned consumer); wiring it now would be speculative ahead of any real need. This story fixes only the table a currently-merged, currently-shipped route (`ep1-s2`) actually depends on.
3. A new boot-wiring test (mirroring `ep1-s1`'s own `"(boot) customer_journeys table creation is wired into server.js"` test exactly) asserts the real `CREATE TABLE IF NOT EXISTS customer_journey_stages` statement is present in `server.js`'s source.

## Dependencies

- **Upstream:** `ep1-s2` (merged, PR #958) — this story wires the boot-time creation of the table that story's own handler already depends on.
- **Downstream:** `ep1-s3` (about to start) — also writes to `customer_journey_stages` (via `PATCH`); this fix must land first so `ep1-s3` isn't building on the same unwired foundation.

## Acceptance Criteria

**AC1:** Given `server.js`'s source, When read directly, Then it contains a `CREATE TABLE IF NOT EXISTS customer_journey_stages` statement in the boot-time inline migration block, with the same columns as `scripts/migrate-schema-journeys.js`'s own proven SQL (`id`, `journey_id`, `tenant_id`, `name`, `position`, `description`, `customer_actions`, `touchpoints`, `channel`, `emotion`, `pain_points`, `opportunities`, `moment_of_truth`, `created_at`, `updated_at`).

**AC2:** Given the existing `ep1-s1`/`ep1-s2` test suites (`check-ep1-s1-journey-create.js`, `check-ep1-s2-journey-stage-create.js`), When this fix lands, Then both continue to pass unmodified — this is a purely additive boot-sequence change with no behavioural change to any route handler.

## Out of Scope

`feature_customer_journey_stage_mappings`'s own boot-wiring (no consumer yet; `ep2-s2`'s own DoR must address this when that story starts). Any change to `scripts/migrate-schema-journeys.js` itself (its SQL is only being copied, not modified).

## NFRs

- **Reliability:** This IS the reliability fix — a genuinely fresh deployment of this application would otherwise fail the first time any operator tries to add a stage to a journey.
- **Security:** None — purely additive idempotent DDL (`CREATE TABLE IF NOT EXISTS`), no new input surface.
- **Performance:** Negligible — one additional idempotent `CREATE TABLE IF NOT EXISTS`/`CREATE INDEX IF NOT EXISTS` pair at boot, identical cost class to the existing `customer_journeys` block.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
