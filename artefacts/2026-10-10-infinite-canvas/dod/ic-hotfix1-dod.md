# Definition of Done: Fix missing position_x/position_y and feature_customer_journey_stage_mappings migration breaking the journey canvas in deployed environments

**PR:** https://github.com/heymishy/skills-repo/pull/975 | **Merged:** 2026-10-11T06:14:54Z
**Story:** short-track bug fix (production incident) — no discovery/definition chain, matching CLAUDE.md's own short-track criteria
**Test plan:** artefacts/2026-10-10-infinite-canvas/test-plans/ic-hotfix1-test-plan.md
**DoR artefact:** artefacts/2026-10-10-infinite-canvas/dor/ic-hotfix1-dor.md
**Assessed by:** Claude (session definition-of-done pass)
**Date:** 2026-10-11

---

## Incident timeline

- **2026-10-11T00:09:28Z** — production (`skills-framework`) begins 500ing every `GET /journeys/:id` canvas page view, via `ic-s2`'s own already-approved "Promote to production" step (the gap had been present since that promotion; this is the first confirmed error timestamp found in logs).
- **2026-10-11, ~05:44Z** — operator reports `https://wuce-staging.fly.dev/journeys/862d52d7-ff98-4176-bd9f-81f0f417f8df` shows "Internal Server Error."
- **~05:44-06:10Z** — investigated via `flyctl logs -a wuce-staging`; root-caused to `scripts/migrate-schema-journeys.js`'s own `ALTER TABLE`/`CREATE TABLE` statements never being mirrored into `server.js`'s own inline startup migration (the only thing that runs against a deployed database, since `scripts/` is excluded from the Docker image). Separately confirmed production was *also* already affected, independent of the operator's own staging report, by checking `flyctl logs -a skills-framework` directly.
- **06:14:54Z** — PR #975 merged (operator-approved, confirmed via `gh pr view`).
- **~06:15-06:23Z** — staging redeploy completed; confirmed fixed via `flyctl logs` (zero `position_x` errors despite real user login/navigation activity) and the CI-run "Post-deploy real-staging E2E confirmation" job passing.
- **~07:38Z** — "Promote to production" gate approved (operator go-ahead via `AskUserQuestion`, executed via `gh api .../pending_deployments`); production redeployed, confirmed fixed via `flyctl logs -a skills-framework` (both `customer_journey_stages table ready` and `feature_customer_journey_stage_mappings table ready` printed cleanly, zero `position_x`/`does not exist`/`unhandled error` lines since).
- **Total outage duration:** ~7.5 hours, from first confirmed production error to confirmed-fixed production redeploy.

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Criterion: `server.js`'s own startup migration adds `position_x`/`position_y` (nullable `DOUBLE PRECISION`) to `customer_journey_stages`, idempotently. Integration test against a real, disposable Postgres instance reproducing staging's exact pre-fix state: both columns created, correct type/nullability, running twice does not error | `integration-real-code` + `live-verified` (confirmed on real staging and production via `flyctl logs`) | None |
| AC2 | ✅ | Criterion: a fresh deploy to an already-existing table (pre-dating this fix) ends up with both columns present, zero data loss on existing rows. Integration test: a pre-existing row's `name`/`position_x`/`position_y` confirmed untouched (`NULL`, no backfill) after migration | `integration-real-code` + `live-verified` | None |
| AC3 | ✅ | Criterion: `handleGetJourneyCanvas` no longer throws against a table migrated only via `server.js`'s own inline path. Integration test: real handler call against the real migrated table succeeds, renders the stage. Live: zero `position_x`/`Internal Server`/`unhandled error` log lines on either environment since deploy, despite real traffic | `integration-real-code` + `live-verified` | None |
| AC4 | ✅ | Criterion (added during implementation, same root cause): `feature_customer_journey_stage_mappings` (`ep2-s3`) has the identical gap — also only ever created in the excluded script. Integration test: a genuinely fresh environment (zero pre-existing tables) migrates cleanly end to end via `server.js`'s own inline path alone, `handleGetJourneyCanvas` succeeds | `integration-real-code` + `live-verified` (confirmed via production's own `feature_customer_journey_stage_mappings table ready` log line on this exact deploy) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded against the merged code.

---

## Scope Deviations

One deliberate, disclosed scope addition: AC4 (the `feature_customer_journey_stage_mappings` fix) was not in the original test plan's first draft — found during implementation while reproducing the real pre-fix staging state for AC1-AC3's own test fixture. Added in the same PR rather than filed separately, since it is the exact same root cause, same fix pattern, same file, and leaving it out would have left a confirmed, reproducible path to the next identical-class incident (most plausibly on production, which — unlike staging — had no known history of the manual migration script ever being run against it independently).

---

## Test Plan Coverage

**Tests from plan implemented:** 3 / 3 (test plan originally scoped AC1-AC3; AC4 added during implementation per the Scope Deviations note above, now 4 ACs / 3 test blocks — AC1/AC2 share one test block)
**Tests passing:** 3 / 3 genuinely executed against a real, disposable Postgres instance. `DATABASE_URL`-gated like every other migration test in this repo (`ic-s2`'s own AC4 precedent) — correctly SKIPs in the standard local/CI harness with no `DATABASE_URL` configured, by design.

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1/AC2 — migration idempotent, no data loss | ✅ | ✅ | Real disposable Postgres, reproducing staging's exact pre-fix state |
| AC3 — handleGetJourneyCanvas succeeds | ✅ | ✅ | Real handler call against the real migrated table |
| AC4 — genuinely fresh environment | ✅ | ✅ | Zero pre-existing tables, full inline migration chain exercised |

Full suite at merge (CI, PR #975): all 8 required checks passed, confirmed via `gh pr checks 975` — not self-report. Full local suite: 738/738.

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Availability — this fix's entire purpose | ✅ | Confirmed live on both environments: zero errors since deploy, despite real traffic (operator's own login/navigation on staging; production redeployed and swept clean) |
| Security | ✅ N/A | No new input surface, no new persisted data — purely a schema-completeness fix for an already-shipped, already-reviewed data model |
| Performance | ✅ N/A | `ADD COLUMN IF NOT EXISTS`/`CREATE TABLE IF NOT EXISTS` on an already-small table; no measurable migration-time impact observed on either deploy |
| Audit | ✅ N/A | None required |

---

## Metric Signal

Not applicable — this is an infrastructure/availability bug fix, not a feature with its own benefit metric. It restores `ic-s2`'s own M1 ("spatial layout actually used") and `ic-s4`'s own M1 contribution to actual measurability in production — both were structurally unmeasurable in production from `ic-s2`'s own promotion until this fix, since the feature itself 500'd before any real operator could ever persist a position.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None blocking. Both production and staging confirmed fixed and stable post-deploy.

**Retrospective note (process gap, not a code gap):** the established convention in this codebase — inline-duplicate any `scripts/*.js` migration into `server.js`'s own startup path, since `scripts/` is deliberately excluded from the deployed image — is documented only in code comments at the point of use, not in a checked, enforced way. `ic-s2`'s own implementation (this session, this feature) added a real migration to `scripts/migrate-schema-journeys.js` without following that established pattern, and the gap was not caught by `/review`, `/definition-of-ready`, or `/verify-completion` for that story — all of which ran clean. A follow-up worth considering: a CI check that diffs `scripts/migrate-schema-journeys.js` (and siblings) against `server.js`'s own inline migration block, or a DoR/DoD checklist item specifically asking "does every `ALTER`/`CREATE TABLE` in a new `scripts/migrate-*.js` file have a matching inline statement in `server.js`?" — this exact convention already exists for `customer_journeys`/`customer_journey_stages`'s own table creation (both correctly duplicated inline from day one), which is precisely why the *columns and second table* added later were the gap, not the tables themselves.

---

## DoD Observations

1. **A live production incident, found by the operator mid-session, was root-caused, fixed, verified on real disposable infrastructure, merged, and deployed to both staging and production within roughly 2.5 hours of the report** (and the underlying outage — which had been silently live for ~5 hours before the report — closed within the same window). The short-track process (`/test-plan → /definition-of-ready → coding agent`, skipping discovery/definition/review) was the right fit: bounded, well-understood, root-cause-confirmed-before-coding.
2. **Root-causing before fixing paid off twice.** The first hypothesis (a race condition in async startup migrations) was wrong — direct log evidence (15+ second wait, still broken) ruled it out before any fix was attempted. The real cause (`scripts/` excluded from the Docker image) was found by reading the `Dockerfile`'s own `COPY` allowlist directly, not assumed. This is the same discipline already established this session for `ic-s4`'s own infra investigation (RISK-ACCEPT vs. Docker-evidence memory entry) — applied under real time pressure this time, with a materially better outcome (a confirmed, shippable fix, not a RISK-ACCEPT).
3. **Checking production's actual state, not just staging, changed the whole shape of the response.** The operator's own report was staging-only; checking `flyctl logs -a skills-framework` directly (prompted by the operator's own "Need to ensure prod is OK too") revealed production had been silently broken for ~5.5 hours already, which correctly escalated this from "fix at normal urgency" to "fix and deploy immediately, to both environments." Worth generalizing: any staging bug report on this codebase should trigger an equivalent production check before concluding scope, since this repo's own CI auto-promotes to production on every merge (gated only by a single manual approval click, not a time delay or soak period).
