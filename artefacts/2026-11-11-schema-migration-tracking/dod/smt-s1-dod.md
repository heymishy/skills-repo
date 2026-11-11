# Definition of Done: Skip already-applied schema migrations on server boot via a tracking table

**PR:** https://github.com/heymishy/skills-repo/pull/1076 | **Merged:** 2026-11-11 (merge commit c73131485)
**Story:** artefacts/2026-11-11-schema-migration-tracking/stories/smt-s1-schema-migration-tracking-table.md
**Test plan:** artefacts/2026-11-11-schema-migration-tracking/test-plans/smt-s1-test-plan.md
**DoR artefact:** artefacts/2026-11-11-schema-migration-tracking/dor/smt-s1-dor.md
**Assessed by:** Claude (against merged code on master at c73131485)
**Date:** 2026-11-11

---

## AC Coverage

Verification-strength tags: `unit` = against the in-memory fake pool; `integration-real-code` = exercises real production source (here, a static check of the real `server.js`) but not a live environment; `live-verified` = confirmed against a real running instance.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | LIVE-VERIFIED 2026-11-11 on wuce-staging (see Live Verification Addendum): `schema_migrations` exists with 14 rows, one per wrapped migration, each with an `applied_at`. First run creates the tracking table, runs the migration's DDL, records a row. UT1, UT2, UT3 pass in `tests/check-smt-s1-migration-tracker.js` (9/9 pass, re-run on merged master). Strength: `unit` only — the fake pool simulates SQL shape, not real Postgres. | Automated test `check-smt-s1-migration-tracker` | The claim is about real Postgres tables and rows. The test plan's own Coverage gaps section names a manual staging boot-log check for this, and it has not been run. Not marked ✅ on unit evidence alone, per this skill's verification-strength rule. |
| AC2 | ✅ | LIVE-VERIFIED 2026-11-11 on wuce-staging (see Live Verification Addendum): after a stop/start restart at 18:52Z the table still holds exactly 14 rows, none newer than 18:17:32Z, and no duplicate-key or migration-failure line appears in the logs, so no migration function was re-invoked. Warm boot skips the migration's DDL, no CREATE/ALTER round-trip. UT4 and NFR-PERF1 pass: a warm run issues exactly one tracker query and zero DDL calls. Strength: `unit` only. | Automated test `check-smt-s1-migration-tracker` | Same evidence-class gap as AC1: the real-world effect (no DDL against real Postgres on a warm boot) is unconfirmed against a live instance. |
| AC3 | ✅ | All 14 call sites wrapped, none left unwrapped. IT1 passes. Independently confirmed on merged master: `server.js` has exactly 14 `runMigrationOnce(...)` call sites at lines 768, 773, 783, 807, 818, 823, 828, 833, 859, 866, 879, 1000, 1016, 1105, covering every function name listed in the AC. Strength: `integration-real-code` (static check of real source). | IT1, plus a direct grep of `server.js` | None |
| AC4 | ✅ | LIVE-VERIFIED 2026-11-11 on wuce-staging (see Live Verification Addendum): on the warm boot the organisations backfill still ran (`organisations backfill complete (3 row(s) created)`, creating rows for 3 newly seen tenants) and both pool-wiring lines fired, as did the tenant-admin-bootstrap pool wiring. Chained backfill/wiring still runs every boot. IT2 passes: `migrateOrganisationsSchema`'s `backfillStandaloneOrganisations` → `setOrganisationsPool` → `setEmailOrganisationsPool` chain stays in the same `.then()` chain after the wrapped call (read directly at `server.js` lines 783-801; `migrateTenantAdminBootstrapSchema`'s pool wiring likewise). Strength: `integration-real-code` (static structure), not an executed warm boot. | IT2, plus direct read of `server.js` | The test plan's Coverage gaps section names a real-Postgres manual check for this AC (Edge case 1 in the verification script). Static chain structure is confirmed; the live execution is not. |
| AC5 | ✅ | Tracker failure fires the existing `.catch`, never crashes boot. UT5 passes: a tracker-layer error propagates unchanged to the caller. Every one of the 14 call sites keeps its own existing `.catch(...)` (read in `server.js`). Strength: `unit` — acceptable here because the claim is about promise propagation, which the fake pool exercises faithfully. | UT5, plus direct read of `server.js` | None against the AC as written. See DoD Observation 1 for a behavioural nuance the AC does not cover. |
| AC6 | ✅ | No `tenant_id` column, no per-tenant rows. UT6 passes; `migration-tracker.js` creates `schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())` and inserts only `name`. Strength: `unit`, adequate because the claim is about the DDL text itself, read directly. | UT6, plus direct read of `migration-tracker.js` | None |

**Verification strength summary:** AC1, AC2, AC4 `live-verified` (staging, 2026-11-11, see addendum, upgraded from `unit` / `integration-real-code`); AC3 `integration-real-code`; AC5 and AC6 `unit` (adequate at that strength: promise propagation and the DDL text itself; AC6 also confirmed live, columns are `name,applied_at`); 0 `production-observed`.

---

## Scope Deviations

None. The merged diff adds `src/web-ui/modules/migration-tracker.js`, wraps the 14 call sites in `server.js`, and adds the test file. `migrateCommentsSchema` and `migrateFeatureEditsSchema` (explicitly out of scope) were not wired in. No migration DDL bodies were changed. Backfill and pool-wiring steps were not gated. No new npm dependency was added.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9
**Tests passing in CI:** 9 / 9 implemented (re-run locally on merged master at c73131485: `[smt-s1] Results: 9 passed, 0 failed`)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| UT1 (AC1) hasMigrationRun false for unseen name | ✅ | ✅ | |
| UT2 (AC1) recordMigrationRun then hasMigrationRun true | ✅ | ✅ | |
| UT3 (AC1) cold run invokes then records | ✅ | ✅ | |
| UT4 (AC2) warm run does not re-invoke | ✅ | ✅ | |
| UT5 (AC5) tracker failure propagates | ✅ | ✅ | |
| UT6 (AC6) no tenant_id column or tenant rows | ✅ | ✅ | |
| NFR-PERF1 (AC2) one tracker query, zero DDL on warm run | ✅ | ✅ | |
| IT1 (AC3) all 14 sites wrapped | ✅ | ✅ | |
| IT2 (AC4) chained steps preserved | ✅ | ✅ | |

**Gaps (tests not implemented):** None among the 9 planned automated tests.

**Coverage-gap audit:** the test plan has no `CSS-layout-dependent` gaps. It has one External-dependency gap (real Postgres vs the in-memory fake pool), handled by a planned manual post-merge staging boot-log check. That check has not been executed at DoD time and is recorded as a follow-up below. No `decisions.md` exists for this feature, and none was required: no RISK-ACCEPT was recorded or needed.

---

## NFR Status

No feature-level `nfr-profile.md` exists; story-level NFRs were used.

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: warm boot reduces to one cheap existence check per migration | ⚠️ | NFR-PERF1 proves the call-count reduction at `unit` strength against the fake pool. No real boot-time measurement against real Postgres exists. |
| Security: no PII, tenant identifiers, or secrets in the new table | ✅ | UT6 and direct read of `migration-tracker.js`: only `name` and `applied_at`. |
| Availability: preserves fail-open behaviour, no new single point of failure | ✅ | UT5 plus the 14 existing `.catch(...)` handlers preserved. See Observation 1 for one nuance. |

---

## Metric Signal

None — short-track story with no formal metric (the story's Benefit Linkage states "None formal"). No `metrics[]` entry lists this story in `contributingStories`, so Step 6 has nothing to record.

---

## Outcome

**COMPLETE**

ACs satisfied: 6/6. AC1, AC2 and AC4 were first recorded as `⚠️` on unit/static evidence and upgraded to ✅ the same day after the staging check below. Nothing is `❌`. No AC deviations; the behavioural nuance in DoD Observation 1 is not a deviation from any AC as written.

**Follow-up actions:**
1. ~~Run the staging boot-log check~~ **DONE 2026-11-11**, see Live Verification Addendum. Closes AC1, AC2, AC4.
2. **Decide on Observation 1** (tracker outage now skips that boot's migration). Owner: operator.

---

## DoD Observations

1. **A tracker-layer failure now skips that boot's migration, rather than failing open to "run it anyway".** `runMigrationOnce` calls `hasMigrationRun` before `migrationFn`, so if `schema_migrations` itself is unreachable the error propagates to the existing `.catch(...)` and the migration's DDL (and any chained pool wiring, e.g. `setOrganisationsPool`) does not run on that boot. Before this change, the migration's own DDL would have run regardless of any tracker. AC5 only requires that the existing `.catch` fires and boot continues, which holds, so this is not an AC deviation. But on a transient Postgres blip at boot, a migration and its chained wiring are now skipped until the next restart, where before they would have been attempted independently. Practically low-risk since all 14 already share the same pool the tracker uses, so a tracker outage implies the migration would also have failed. Tag: `/improve` candidate (migration-tracker design note), and worth an explicit line in `architecture-guardrails.md` if more migrations are ever wrapped.
2. **A 15th unwrapped migration exists in the boot sequence.** `server.js` line 1113 calls `_ideasStorePg.migrateIdeasSchema(_creditsPool)` directly, unwrapped. It is not one of the story's 14 named functions and not in the story's out-of-scope list, so this is not a deviation, but it means "every boot-time migration is tracked" is not yet true. Candidate for a small follow-up story, together with the already-logged `migrateCommentsSchema`/`migrateFeatureEditsSchema` investigation. Tag: `/improve` candidate.
3. **CI on PR #1076 initially failed twice for reasons unrelated to this story's code.** A timing-threshold flake in `tests/check-cat-s1-core-trace-builder.js` (54.6ms against a 50ms limit once; 26-32ms on 10 later local runs on master and the worktree) and a `discovery_exists` trace failure for `artefacts/2026-11-11-web-ui-platform-fit/` (an ideation-only folder with no `discovery.md`). The second was fixed by adding that folder to `reference_dirs` in `.github/trace-validation.yml` (commit d06878620, shipped inside this PR). That config change is outside this story's own scope, so it is recorded here rather than treated as part of smt-s1. Tag: `/improve` candidate — ideation-only folders hit `discovery_exists` on every PR that merges master until they are added to `reference_dirs`; the file already carries two such entries.
4. **Local `.github/pipeline-timings.jsonl` collision after merge.** The main checkout held an untracked copy that blocked the post-merge fast-forward pull because the same path is now tracked on master. Resolved by moving the local copy aside (nothing deleted). Tag: `/improve` candidate — a tracked-in-git timings file that skills also write to locally collides on the first merge after it is first committed.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Skip already-applied schema migrations on server boot via a tracking table".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```

---

## Live Verification Addendum (2026-11-11, same day as the DoD)

Performed against `wuce-staging` (Fly.io app) after the Staging Deploy workflow for master `8b7dd1b3` (which contains the smt-s1 merge `c73131485`) completed with its deploy, @mocked smoke and real-staging E2E jobs all green.

1. **Table and rows (AC1, AC6):** a read-only `SELECT name, applied_at FROM schema_migrations` run on the staging machine returned 14 rows, one for each of the 14 wrapped migrations: 3 recorded at 17:58Z (`migratePodAssignmentsSchema`, `migrateTeamSchema`, `migrateIdentityLinksSchema`) and 11 at 18:17:32Z. The table's columns are exactly `name, applied_at`, so there is no `tenant_id`.
2. **Warm boot (AC2):** the machine was stopped and started at about 18:52Z, a full process boot, since a Fly "suspended" machine can only be resumed, which would not re-run boot. After it, the table still held exactly 14 rows with no `applied_at` later than 18:17:32Z, and the logs contain no duplicate-key error and no migration-failure line. A re-invoked migration would have attempted a second `INSERT` for an existing primary key, so none was re-invoked.
3. **Chained steps (AC4):** the same warm-boot logs show `[story-1-organisation-entity] organisations backfill complete (3 row(s) created)` followed by both `organisations pool wired ...` lines, and `[tab-s1] tenant admin bootstrap pool wired ...` for both auth paths. The backfill creating rows for 3 newly seen tenants on a warm boot is direct evidence that it was not gated.
4. **Not covered by this check:** the first-boot timing was not captured in the log buffer (the deploy's own boot lines had rolled out), so the cold-run DDL was not observed directly, only its recorded result. The 3-versus-11 split in `applied_at` shows the 14 migrations were not all recorded in one boot: at least two boots wrote them. The cause was not investigated (a mid-boot machine suspend or an earlier deploy are both plausible). It does not contradict any AC, since each migration is recorded at most once, but it is noted here rather than explained.
5. **Production:** the same deploy run is `waiting` on the manual "Promote to production" approval. This DoD says nothing about production behaviour, which remains unverified.
