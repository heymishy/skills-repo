# Definition of Done: Backfill admin for every existing real tenant that has members but no admin

**PR:** https://github.com/heymishy/skills-repo/pull/926 (implementation) + https://github.com/heymishy/skills-repo/pull/927 (fix-forward: CLI runner entrypoint) | **Merged:** 2026-09-29T06:12:25Z / 2026-09-29T06:49:14Z
**Story:** artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s2.md
**Test plan:** artefacts/2026-09-26-tenant-admin-bootstrap/test-plans/tab-s2-test-plan.md
**DoR artefact:** artefacts/2026-09-26-tenant-admin-bootstrap/dor/tab-s2-dor.md
**Verification script:** artefacts/2026-09-26-tenant-admin-bootstrap/verification-scripts/tab-s2-verification.md
**Assessed by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-29

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification strength | Deviation |
|----|-----------|----------|------------------------|-----------|
| AC1 | ✅ | Fake-pool test (`earliest member (min created_at) is promoted to admin`) + **live run on `wuce-staging`**: reconciliation count `adminless_tenants` 2 → 0 (real `team_memberships` data, real Postgres) | `live-verified` | None |
| AC2 | ✅ | Fake-pool tie-break test + **live query on `wuce-staging`**: for both promoted tenants (`heymishy`, `tenant-demo-2`), the promoted `person_id` matches the tenant's own minimum-`created_at` row exactly (`MATCH=true` both) | `live-verified` | None |
| AC3 | ✅ | Fake-pool tests (already-admin'd / zero-member untouched) + **live observation**: only the 2 tenants that were genuinely adminless before the run were touched; `total_tenants_with_members` stayed at 4 throughout (no new row created, no already-admin'd tenant modified) | `live-verified` | None |
| AC4 | ✅ | Fake-pool idempotency test + **live rerun on `wuce-staging`**: second execution logged `no adminless tenants with members found -- nothing to backfill`, `{processed:0, promoted:0, errors:0}` | `live-verified` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found.

**Evidence-strength note:** this story's ACs are explicitly about a real-world effect (real tenant rows in real Postgres). Per this repo's own DoD evidence-strength rule, `integration-real-code` (fake-pool) evidence alone would NOT have been sufficient to mark these ✅ — a live run was required and performed, on `wuce-staging`, with the operator's explicit authorization (see decisions.md). All 4 ACs now carry `live-verified` evidence, the strongest tier.

---

## Live migration run — `wuce-staging` (2026-09-29T07:45Z)

**Authorization:** Explicit operator choice ("Run on staging only, now") via AskUserQuestion, 2026-09-29. Production was NOT touched in this run — covered separately below.

**Pre-run state:** `adminless_tenants=2, total_tenants_with_members=4` (direct reconciliation query, matching the verification script's own Scenario 1 design).

**Run result:** `{"processed":2,"promoted":2,"errors":0,"stopped":false}`
- `tenant=heymishy person=1 previousRole=engineer` — promoted
- `tenant=tenant-demo-2 person=4 previousRole=user` — promoted

**Post-run state:** `adminless_tenants=0, total_tenants_with_members=4` — matches the verification script's own Scenario 1 expected outcome exactly ("before" > 0, "after" = 0).

**AC2 direct check:** for both promoted tenants, `admin_person_id` equals the tenant's own `MIN(created_at)` row's `person_id` (`MATCH=true` for both) — matches Scenario 2's expected outcome exactly.

**Idempotency rerun (AC4):** immediately re-run against the same, now-migrated `wuce-staging` data — `{"processed":0,"promoted":0,"errors":0,"stopped":false}`, zero further changes. Matches Scenario 4's expected outcome exactly.

**Method:** the merged script (`scripts/backfill-tenant-admin.js`, PR #926 + #927's CLI entrypoint fix) was uploaded via `fly ssh sftp put` to `/tmp/` on the running `wuce-staging` machine (the deployed Docker image excludes `scripts/` entirely — a separate finding, logged below) and executed there via `fly ssh console`, using the real `DATABASE_URL` already present in that environment. No credential was read, displayed, or handled directly by the operator or this session at any point — the connection string never left the Fly machine's own environment.

**Diagnostic note:** the first 2 direct invocations of the script's own CLI entrypoint via `fly ssh console -C` produced zero output despite exiting 0, with no discernible cause after investigation (not a DATABASE_URL issue, not a crash — Node's stdout-truncation-before-`process.exit()` behavior on non-TTY pipes is the leading candidate, though not conclusively confirmed). **Critically, the database was independently confirmed unchanged after each silent attempt** (direct reconciliation re-query, `adminless_tenants=2` both before and after) before any further action was taken — no write was ever left unverified. Root cause not required for this story's own completion; logged below as a `/improve` candidate for anyone running one-off scripts this way again.

---

## Live migration run — production (`skills-framework`, 2026-09-29T08:12Z)

**Authorization:** Explicit operator approval ("1", "Yes I approve") after the Claude Code auto-mode permission classifier independently gated both the `fly ssh sftp put` upload and the `fly ssh console` execution steps against production — a stricter, separate gate from the same actions against `wuce-staging`, cleared only after direct operator confirmation for each blocked step.

**Pre-run state:** `adminless_tenants=0, total_tenants_with_members=1` — production has only 1 real tenant with members, and it already has an admin. Nothing to backfill.

**Run result:** `{"processed":0,"promoted":0,"errors":0,"stopped":false}` — a clean, correct no-op. Log: `[tab-s2] no adminless tenants with members found -- nothing to backfill`.

**Post-run state:** `adminless_tenants=0, total_tenants_with_members=1` — confirmed unchanged via a direct re-query after the run.

**Method:** identical procedure to the `wuce-staging` run above (upload via `fly ssh sftp put`, run via `fly ssh console` using the file-marker diagnostic wrapper directly, since it's the already-proven-reliable pattern from staging). No credential was read, displayed, or handled directly at any point.

**Conclusion:** production required no data change — it was already in the correct end-state. This run's value is as a genuine, real-environment execution proof (the script ran successfully against production's real database and made exactly the correct decision: zero writes, because zero writes were needed), not a state change. Both environments now have direct, live-verified confirmation of this story's own correctness.

---

## Scope Deviations

None for the migration itself. The `require.main === module` CLI entrypoint gap (PR #927) is a fix-forward completing already-approved DoR-contract scope, not new scope — see `decisions.md`.

---

## Test Plan Coverage

**Tests from plan implemented:** 10 / 10
**Tests passing in CI (fresh run against merged master):** 11 / 11 (10 planned + 1 wiring-guard test added in the PR #927 fix-forward, confirming the real CLI entrypoint exists — not just that the module loads)
**Full repo suite:** 705 files, 2 pre-existing/environmental failures (`check-p3.5-validate-trace.js`, `check-pcr-s1-test-runner.js`), unchanged from branch-setup baseline, 0 new failures.

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — well under 1 minute at realistic scale | ✅ | Fake-pool 100-tenant proxy test (<10s) + **live run completed in under 1 second for the real 4-tenant/2-candidate dataset** — far inside the story's own 1-minute NFR |
| Security — tenant isolation (ADR-025) | ✅ | Every operation inherently scoped by `tenant_id`; live run touched exactly the 2 genuinely-adminless tenants, no cross-tenant effect observed |
| Audit — pre-migration role logged before overwrite | ✅ | Live log lines show `previousRole=engineer`/`previousRole=user` logged before each `UPDATE`, enabling direct rollback per the story's own Rollback procedure |
| Accessibility — N/A | ✅ N/A | Backend-only, no rendered UI |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable |
|--------|--------------------|-----------------------|
| Metric 2 — % of real tenants with at least one working admin (`benefit-metric.md`) | ✅ — `wuce-staging`: 2/4 tenants (50%) lacked an admin before this run; production: already 1/1 (100%) before this run | **on-track** — both `wuce-staging` and production now at 100% (`wuce-staging`: 4/4 after the run; production: 1/1, unchanged since it was already correct) |

**Evidence note:** this is the first metric in this feature with a REAL post-run signal (not `not-yet-measured`) — the live runs themselves are the measurement events, on both real environments.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. The deployed Docker image for both `wuce-staging` and production excludes `scripts/` entirely, meaning no one-off ops script in that directory can be run via a straightforward `fly ssh console` without first `sftp put`-ing it onto the machine manually, as done here on both environments. Worth a `/improve` look at whether `scripts/` (or at least migration/ops scripts specifically) should be included in the deploy image, or whether a documented "how to run a one-off ops script against a live environment" runbook should exist — this workaround was improvised, not previously documented anywhere in this repo.
2. The silent-output attempts on `wuce-staging` (no root cause conclusively identified, though DB was independently confirmed unchanged both times before proceeding) are worth a `/improve` note for anyone else running Node scripts via `fly ssh console -C` on Windows — logged in decisions.md and capture-log.md.
3. The Claude Code auto-mode permission classifier gated `fly ssh sftp put`/`fly ssh console` against production (`skills-framework`) more strictly than the identical commands against staging (`wuce-staging`) — each step required a fresh explicit operator approval. This is expected/appropriate behavior for production-touching actions, noted here only as a process observation, not a gap.

---

## DoD Observations

1. **Same finding as `tab-s1`'s own DoD:** `m1`/`m2`/`m3` (the feature-level metrics)'s `contributingStories` arrays still don't list `tab-s2` despite this story directly moving Metric 2 — see `tab-s1-dod.md`'s own DoD Observation 1, still open, not fixed here (feature-level bookkeeping concern).
2. **`scripts/` is excluded from the deployed Docker image.** Confirmed directly (`ls /app` on the running `wuce-staging` machine shows no `scripts/` directory at all). This is very likely intentional (ops/dev-time scripts shouldn't ship in a production image), but it means this story's own migration script — despite being merged and "done" from a code-review perspective — could not actually be run on a live environment without a manual file-upload workaround. No prior story in this repo's history that shipped a `scripts/*.js` migration appears to have hit this (or if they did, it wasn't documented) — worth checking whether `tab-s2` is the first migration-story to actually reach a real live-run attempt post-merge, or whether this gap has been silently worked around before.
3. **`fly ssh console -C` intermittently produces zero stdout/stderr for a Node script despite a real exit code, no clearly identified root cause.** Not deployment-blocking (independently verified via direct DB re-queries both times), but wasted real time and could confuse a future operator into wrongly assuming a script did nothing when Node's own async-stdout-vs-process.exit() race is the more likely explanation. Worked around here via explicit synchronous file-marker logging (`fs.appendFileSync`) instead of relying on `console.log` + `process.exit()`. Worth documenting as a known gotcha for anyone else running one-off scripts this way.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for tab-s2 (real backfill migration, live-run on both wuce-staging and production).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is each live migration run's evidence directly traceable to real before/after database state, not just a script's own self-report?
3. Is it clear that production required no data change (already correct), distinct from a run that was skipped or not attempted?
4. Are the "silent output" diagnostic incidents on wuce-staging adequately explained, and was the database genuinely confirmed unchanged before further action was taken both times?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows, now that both environments are confirmed?
Report findings as HIGH / MEDIUM / LOW.
```
