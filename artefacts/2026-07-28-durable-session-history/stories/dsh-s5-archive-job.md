## Story: Archive turns older than 60 days out of the hot table

**Epic reference:** artefacts/2026-07-28-durable-session-history/epics/dsh-e1-durable-session-history.md
**Discovery reference:** artefacts/2026-07-28-durable-session-history/discovery.md
**Benefit-metric reference:** artefacts/2026-07-28-durable-session-history/benefit-metric.md

## User Story

As a **platform owner responsible for this repo's operating cost**,
I want to **turns older than 60 days moved out of the hot `session_turns` table automatically**,
So that **storage stays bounded even as more stages complete over time, without ever permanently losing conversation history**.

## Benefit Linkage

**Metric moved:** Turn storage stays bounded
**How:** This story directly implements the archival mechanism the metric measures — a scheduled job that keeps the hot table's row-age distribution bounded at 60 days, moving older rows to a separate archive table rather than deleting them.

## Architecture Constraints

- **`product/constraints.md` #11 (no persistent agent runtime dependency):** this job must run on standard CI/cron infrastructure — a scheduled GitHub Actions workflow, matching this repo's existing scheduled-job precedent — not a bespoke long-running service.
- **CLAUDE.md D37 injectable adapter rule:** follows the exact CLI-entrypoint pattern already established by `scripts/purge-e2e-tenants.js` (stub throws, real Postgres wiring only in the CLI entrypoint block, never throws out of the main archival loop — logs and continues instead, matching that script's own non-fatal per-row error handling).
- **ADR-025** (multi-tenancy): archived rows retain their `tenant_id` — archiving must never strip or alter tenant scoping.

## Dependencies

- **Upstream:** dsh-s1 (the `session_turns` table this job reads from must exist)
- **Downstream:** dsh-s6 (rehydration reads from the `session_turns_archive` table this story creates and populates)

## Acceptance Criteria

**AC1:** Given a `session_turns` row with `created_at` older than 60 days, When the archive job runs, Then that row is inserted into a new `session_turns_archive` table (same shape as `session_turns`) and deleted from the hot table.

**AC2:** Given a `session_turns` row with `created_at` within the last 60 days, When the archive job runs, Then that row remains untouched in the hot table.

**AC3:** Given the archive job is deployed, When it executes, Then it runs as a scheduled GitHub Actions workflow (cron trigger) — not a persistent process, matching the "no persistent agent runtime dependency" constraint.

**AC4:** Given the job encounters a transient error moving one row (e.g. a single insert fails), When it processes its batch, Then it logs the failure and continues archiving the remaining eligible rows — matching `purge-e2e-tenants.js`'s existing per-row non-fatal error handling — rather than aborting the entire run.

**AC5 (edge case):** Given zero rows are eligible for archival on a given run, When the job executes, Then it completes successfully and logs "0 rows archived" — not an error or a no-op silent failure.

## Out of Scope

- Rehydrating an archived row back into an active/readable state — that's dsh-s6.
- Any change to the 60-day threshold being configurable per-tenant — a single global threshold for this MVP.
- Deleting archived data permanently after any further period — this story only moves data out of the hot table, it never deletes archived data.

## NFRs

- **Performance:** The job must complete within the scheduled window without holding long-running locks on the hot table (batch the move in reasonably-sized chunks if the row count is large).
- **Security:** Archived data retains the same tenant-scoping and access-control properties as hot data — archiving must not create a route that bypasses tenant isolation.
- **Accessibility:** None identified — this is a backend-only scheduled job with no UI surface.
- **Audit:** The job logs a summary (rows archived, run timestamp) on every run, consistent with `purge-e2e-tenants.js`'s existing summary-logging convention.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
