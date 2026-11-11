## Story: Skip already-applied schema migrations on server boot via a tracking table

**Epic reference:** None — short-track (bounded backend fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery; scope stated directly below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui, data]

## User Story

As **a platform maintainer operating the wuce web-ui in production**,
I want **the server boot sequence to skip a migration's DDL statements once they have already been applied, instead of re-running all 14 migrations' `CREATE TABLE`/`ALTER TABLE` statements on every single boot**,
So that **boot time does not keep paying a redundant, ever-growing Postgres round-trip cost, and the codebase has one authoritative place recording which schema changes have actually been applied**.

## Benefit Linkage

**Metric moved:** None formal — reliability/maintainability fix, per this story's own short-track Benefit Linkage convention.
**How:** Directly closes Cluster 1 from `artefacts/2026-11-11-web-ui-platform-fit/research/ideation.md`: 14 confirmed `migrate*Schema`/`migrate*Columns` functions currently re-run their full DDL on every boot with no central record of what has already been applied. This removes the redundant round-trips and, more importantly, lays the groundwork for any future migration that genuinely cannot be made idempotent by construction (a column rename, a destructive one-time transform) — today's "`CREATE TABLE IF NOT EXISTS` forever" convention has no mechanism to support that at all.

## Architecture Constraints

- **Not tenant-scoped.** The new `schema_migrations` table holds migration names and an applied-at timestamp only — no `tenant_id` column, no per-tenant rows. It is platform-level bookkeeping, not tenant data, and is explicitly out of scope for ADR-025's tenant-isolation requirements (confirmed by reading `.github/architecture-guardrails.md`'s ADR-025 entry: it governs tenant-scoped *data*, which this table does not hold).
- **Preserve existing chain order and side effects exactly.** Several of the 14 call sites chain a backfill or pool-wiring step after the schema migration itself (e.g. `migrateOrganisationsSchema` → `backfillStandaloneOrganisations` → `setOrganisationsPool`/`setEmailOrganisationsPool`). Those chained steps are **not** one-time migrations — `backfillStandaloneOrganisations` is confirmed (read directly, `src/web-ui/modules/organisations.js`) to do its own row-level `SELECT 1 ... WHERE org_id = $1` existence check per tenant, and is meant to keep running on every boot to catch newly-created tenants. This story gates only the schema-migration DDL call itself; every chained backfill/wiring step must continue running on every boot, unaffected.
- **Fail open, matching the existing convention exactly.** Every one of the 14 call sites already wraps its migration in a `.catch(function(err) { console.error(...) })` that logs and continues rather than crashing boot. The new tracker must preserve this: if the `schema_migrations` table itself can't be reached, the affected migration's own existing catch-and-continue behaviour must fire — a tracker failure must never be allowed to crash startup or block an unrelated migration/route.
- **Zero new npm dependencies.** Implemented as a small hand-rolled module (`pool.query(...)` calls only), consistent with this codebase's own stated "no vendor dependency in the critical path" architecture (`product/tech-stack.md`) and `skill-turn-executor.js`'s own precedent comment, "No new npm dependencies."

## Dependencies

- **Upstream:** None — reuses whatever Postgres pool(s) are already passed into each of the 14 existing `migrate*Schema`/`migrate*Columns` call sites; no new infrastructure provisioning required.
- **Downstream:** None known yet. Lays groundwork for any future non-idempotent migration, but no such migration is currently blocked on this story.

## Acceptance Criteria

**AC1:** Given the `schema_migrations` table does not yet exist in a given pool's database, When any of the 14 existing `migrate*Schema`/`migrate*Columns` functions is invoked for the first time via the new shared helper, Then the tracking table is created, that migration's own DDL runs exactly as it does today, and a row recording that migration's name and an applied-at timestamp is written.

**AC2:** Given a migration's row already exists in `schema_migrations` for a given pool (a warm boot), When the server reaches that migration's call site again, Then the migration's own DDL function is **not** invoked a second time, and no `CREATE TABLE`/`ALTER TABLE` round-trip for that migration occurs.

**AC3:** Given the 14 `migrate*Schema`/`migrate*Columns` functions actually invoked in `src/web-ui/server.js`'s boot sequence today (`migrateTeamSchema`, `migrateIdentityLinksSchema`, `migrateOrganisationsSchema`, `migrateTenantAdminBootstrapSchema`, `migratePodsSchema`, `migratePodAssignmentsSchema`, `migrateFeatureCollaboratorsSchema`, `migrateFeatureCollaboratorRemovalsSchema`, `migrateAgencyClientGrantsSchema`, `migrateArtefactCommentsSchema`, `migrateClientInvitationsSchema`, `migrateClientLoginTokensSchema`, `migrateProductRepoColumns`, `migrateTeamInvitationsSchema`), When each is updated to call through the new shared helper, Then every one of the 14 is covered — none are left calling the old, always-run pattern directly (verified by a repo-wide grep showing zero direct, unwrapped calls to these 14 function names remaining in `server.js`). *(Corrected 2026-11-11 from an initial count of 16 — `migrateCommentsSchema` and `migrateFeatureEditsSchema` are real, defined migrations that are never actually invoked anywhere in `server.js`'s boot sequence; see Out of Scope and `workspace/capture-log.md`.)*

**AC4:** Given a migration with a chained backfill or pool-wiring step (e.g. `migrateOrganisationsSchema` → `backfillStandaloneOrganisations` → `setOrganisationsPool`), When the schema migration itself is skipped on a warm boot because it already ran, Then the chained backfill and pool-wiring steps still execute exactly as they do today, on every boot, unaffected by the skip.

**AC5:** Given the `schema_migrations` table cannot be reached (e.g. a simulated transient Postgres connection error), When server boot proceeds, Then the affected migration call site's existing `.catch(...)` handler fires exactly as it does today, logging the error and continuing — a tracker failure never crashes startup or blocks an unrelated migration.

**AC6:** Given the `schema_migrations` table's own schema, When inspected, Then it contains no `tenant_id` column and holds no per-tenant rows.

## Out of Scope

- Changing the actual DDL content (`CREATE TABLE`/`ALTER TABLE` statement bodies) inside any of the 14 `migrate*` functions — this story only adds a skip-if-already-applied gate around the existing calls, it does not touch what they create.
- Backfill functions (e.g. `backfillStandaloneOrganisations`) and pool/adapter-wiring steps chained after a migration — these are intentionally **not** gated (see AC4); they are ongoing, not one-time.
- Rollback / down-migration support — this remains a forward-only tracker, matching the existing forward-only `CREATE TABLE IF NOT EXISTS` convention.
- Clusters 2 (adapter-wiring boilerplate), 3 (`products.js` size), and 4 (whether a real SSR framework or BaaS fits the web-ui at all) from `artefacts/2026-11-11-web-ui-platform-fit/research/ideation.md` — explicitly separate, undecided questions, not part of this story.
- Adopting any third-party migration framework or ORM (Prisma, Drizzle, etc.) — this is a hand-rolled, zero-new-dependency fix by design.
- **Wiring up `migrateCommentsSchema` (`agency-client-comments.js`) or `migrateFeatureEditsSchema` (`feature-edits.js`)** — both are real, defined, exported migrations following the same convention as the other 14, but neither is ever invoked anywhere in `server.js`'s boot sequence today (confirmed by grep; `migrateFeatureEditsSchema` is only called from a test file). This is a separate, real, latent finding (logged in `workspace/capture-log.md`, 2026-11-11) — possibly a genuine missed-wiring bug, possibly intentional — and needs its own investigation before any fix, not a mechanical tracking-table addition. This story only adds tracking to call sites that already exist; it does not decide whether these two should be added.

## NFRs

- **Performance:** Boot-time Postgres round-trips are reduced on every boot after the first for each of the 14 migrations — each previously-unconditional DDL call becomes a single cheap existence check (`SELECT 1 FROM schema_migrations WHERE name = $1`) once already applied, instead of re-issuing the full `CREATE TABLE`/`ALTER TABLE` statement(s).
- **Security:** No change to tenant-data handling or credential flow. The new table holds no PII, no tenant identifiers, and no secrets (see Architecture Constraints).
- **Availability:** Directly preserves the existing fail-open behaviour (AC5) — a tracker-layer failure must never introduce a new way for boot to crash or for an unrelated migration to be blocked. No new single point of failure is introduced relative to today's per-migration `.catch(...)` pattern.

## Complexity Rating

**Rating:** 2 — mechanical once the shared helper exists, but touches 14 live call sites in the production boot sequence of a real app with tenant data; the exact Postgres pool used by each of the 14 call sites needs confirming per-site during implementation (several share `_userRolesPool`, confirmed directly; the remainder not yet individually confirmed).
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
