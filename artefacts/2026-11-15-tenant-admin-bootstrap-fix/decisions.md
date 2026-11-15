# Decisions - tabf-s1 (tenant-admin bootstrap statement)

---
**2026-11-15 | RISK-ACCEPT | branch-setup baseline: the same acknowledged pre-existing failing files**
**Decision:** A full `npm test` in the new worktree (853 files, 324 s) failed five files, all already acknowledged by the operator earlier today: `scripts/check-pipeline-state-integrity.js` (tfhc-s1), `tests/check-cat-s1-core-trace-builder.js` (50 ms timing assertion; passes alone), `tests/check-pcr-s1-test-runner.js` (machine-specific timing), `tests/check-p3.5-validate-trace.js` (PowerShell 5), `tests/check-rtvap-s1-archived-test-plan-coverage.js` (no WSL bash). None touch `tenant-admin-bootstrap.js`. Proceeding under the same acknowledgement; `/verify-completion` compares against this list.
**Made by:** recorded by Claude Sonnet 5.5, 2026-11-15; operator acknowledgement of the same set given in chat for sff-s1.
---

---
**2026-11-15 | RISK | HIGH | activating tenant-admin bootstrap: check shared tenants for a missing admin before production promotion**
**Context:** the fix makes `bootstrapTenantAdminIfNeeded` work for the first time on a real database (red-then-green proven against a real Postgres).
**Finding:** production has `TENANT_ORG_ALLOWLIST` set, so its tenants are shared GitHub organisations, and no tenant has ever had a bootstrap row. Any existing tenant with members but no admin row would make its first member to log in after the deploy the admin. An independent reviewer reached the same conclusion from the code (callers auth.js:398 and :541, auth-email.js:346).
**Decision:** the pull request may be opened and merged (it changes nothing live by itself, and staging has no allowlist), but PRODUCTION PROMOTION WAITS for the operator-approved read-only query of tenants with members and no admin row, and for each such tenant either a hand-inserted correct admin or a `tenant_admin_bootstrap` row to block the grant. No production read has been run; none will be without the operator's explicit approval each time.
**Made by:** Claude Sonnet 5.5, 2026-11-15; operator to approve the query and the promotion.
---
---
**2026-11-15 | VERIFICATION | production tenants-without-admin check run (operator-approved, read-only): result clean, promotion hold released**
**Decision:** with the operator's explicit approval in chat ("yes for production query while CI runs"), exactly one read-only query was run once inside the production app container (`fly ssh console`, `BEGIN READ ONLY`, 10 s statement timeout, rolled back; the database credential never left the container and nothing was written).
**Result:** `tenants_with_members: 1, with_admin: 1, solo_no_admin: 0, shared_no_admin: 0`; `tenant_admin_bootstrap` rows: 0 (bootstrap has never succeeded); `people`: 1. No tenant names or personal data were printed (the shared-no-admin list was empty).
**Consequence:** no existing tenant has members without an admin, so deploying tabf-s1 cannot grant admin over any existing tenant. The only effect is the designed one: the first user of a brand-new tenant (their own tenant, or a newly allowlisted organisation that has no members yet) becomes its admin. The hold on production promotion that this feature's activation-risk entry set is RELEASED for this reason; the operator still approves the promotion in the workflow, and AC7 (clean production login, issue #1101 closed) is checked after the deploy.
**Residual (LOW, unverified):** a GitHub username of digits only colliding with a Google sub (reviewer's observation); with one person in the system this is not a present risk.
**Made by:** Claude Sonnet 5.5 under the operator's approval, 2026-11-15.
---
---
**2026-11-15 | VERIFICATION | tabf-s1 live on staging: bootstrap works for the first time**
**Evidence:** PR 1103 merged (f67b7b2cf, 07:02 UTC); staging deployed (v1307); after the deploy the staging log shows two `admin_bootstrap_granted` lines (07:09:34Z and 07:09:40Z) and ZERO `tenant_admin_bootstrap_failed` lines in the same window, and PostHog received no new `$exception` events since 06:55 UTC (before the fix every staging E2E login produced one). The post-deploy real-staging E2E confirmation passed. This is the first `admin_bootstrap_granted` ever logged in any environment.
**Status:** production promotion is waiting for the operator's approval of the Staging Deploy "Promote to production" step (run 43688125681); AC7 (a clean production login) follows it.
**Made by:** Claude Sonnet 5.5, 2026-11-15.
---
## Architecture Decision Records