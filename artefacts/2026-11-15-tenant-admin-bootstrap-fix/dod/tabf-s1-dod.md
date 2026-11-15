# Definition of Done: Make the tenant-admin bootstrap statement valid on a real Postgres so a new tenant's first user can be granted admin

**PR:** https://github.com/heymishy/skills-repo/pull/1103 (merge commit f67b7b2cf) | **Merged:** 2026-11-15 (07:02 UTC)
**Story:** artefacts/2026-11-15-tenant-admin-bootstrap-fix/stories/tabf-s1-valid-bootstrap-statement.md
**Test plan:** artefacts/2026-11-15-tenant-admin-bootstrap-fix/test-plans/tabf-s1-test-plan.md
**DoR artefact:** artefacts/2026-11-15-tenant-admin-bootstrap-fix/dor/tabf-s1-dor.md (Medium oversight)
**Verification evidence:** artefacts/2026-11-15-tenant-admin-bootstrap-fix/reference/tabf-s1-verify-completion-evidence.md
**Assessed by:** Claude (Sonnet 5.5), with the merge confirmed by the operator
**Date:** 2026-11-15

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Criterion: a real Postgres rejects the old statement with the exact error. Evidence: P1 against a throwaway Postgres 16 (passes before and after; it pins the root cause) | `integration-real-code` (real Postgres) | None |
| AC2 | ✅ | Criterion: a fresh tenant's first user is granted admin and both rows are written. Evidence: P2, red first (it threw the production error before the fix), green after; also live on staging: two `admin_bootstrap_granted` log lines at 07:09 UTC after the v1307 deploy, the first ever in any environment | `integration-real-code` and `live-verified` (staging) | None |
| AC3 | ✅ | Criterion: an already-bootstrapped tenant is a no-op. Evidence: P3 | `integration-real-code` | None |
| AC4 | ✅ | Criterion: a tenant that already has an admin is never overridden and gets no bootstrap row. Evidence: P4 | `integration-real-code` | None |
| AC5 | ✅ | Criterion: tenant scoping is not widened. Evidence: P5, plus P6 (two simultaneous first logins produce exactly one admin) | `integration-real-code` | None |
| AC6 | ✅ | Criterion: existing tests and the suite are unchanged. Evidence: the existing tab-s1 file 14 of 14; full suite 854 files with 4 failures, all on the acknowledged baseline; PR checks all green | `unit` and CI | None |
| AC7 | ✅ | Criterion: a production login logs no `tenant_admin_bootstrap_failed` and sends no error event. Evidence: after promotion to production (v188, 07:13 UTC) the operator logged in at 07:17:11 UTC; the production log shows the `[auth] login` line with zero `tenant_admin_bootstrap_failed` and zero `admin_bootstrap_granted` lines (correct: the tenant already has an admin, so the bootstrap is a no-op), PostHog received no new `$exception` events since 07:13 UTC, and no new GitHub issue opened | `production-observed` | None |

---

## Scope Deviations
None against the story's Out of Scope list (no change to roles, who may be admin, the login flow, migrations, a backfill or CI Postgres).

## Test Plan Coverage
**Tests implemented:** 7 planned, 7 implemented (U1 always runs; P1 to P6 need `TAB_TEST_DATABASE_URL`). **Passing:** 7 of 7 with a real Postgres; 1 passed and 6 skipped without one (CI has no Postgres, so P1 to P6 do not run in CI). **Gaps:** none against the plan; the CI Postgres service is an optional follow-up.

## NFR Status
| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security: nothing widened; existing admin never overridden; tenants isolated | ✅ | P4, P5; independent review of the callers; read-only production check before promotion (1 tenant, with an admin, 0 without) |
| Performance: unchanged query count | ✅ | existing tab-s1 NFR test still passes |
| Correctness: the real-database proof cannot pass vacuously | ✅ | red run: P2 to P6 failed with the exact production error before the fix |

## Metric Signal
No metric lists this story as a contributor; no signal recorded.

---

## Outcome

**COMPLETE**

All seven acceptance criteria are satisfied, with AC2 also proven live on staging and AC7 observed on production.

**Follow-up actions:**
1. Operator: close GitHub issue #1101 (the bug is fixed and live), and merge or approve the held checks on record pull request #1102 (the incident record for it).
2. Optional: add a Postgres service to CI so P1 to P6 run on every pull request (also useful for the seven coha-s6 real-database tests).
3. Optional: a P-test for "members present but no admin row" to document that case (the reviewer's suggestion); not needed now, since production has no such tenant.
4. Noted, not fixed: a GitHub username of digits only could collide with a Google `sub` as a tenant id (reviewer's observation, unverified); not a present risk with one person in the system.

## DoD Observations
1. **A caught-and-logged failure hid a feature that never worked.** tab-s1 shipped and passed its pool-double tests, but the claim statement failed on every real Postgres from the start; only error monitoring (the coha chain built this session) revealed it. Tag: /improve candidate and learning: any SQL a story adds should be run once against a real database in its own tests, and a "never throws, only logs" wrapper needs a metric or alert on its failure count.
2. **Activating a dormant path is a change.** The fix was one line of SQL but its effect (granting admin) had never run in production; the story, DoR and a read-only production check handled that before promotion. Tag: /improve candidate: the DoR for any fix that revives never-run code should name what the code will now do and require a check of the existing data.
3. **The local-database guard in the test helper and the read-only, rolled-back production query kept the verification safe.**