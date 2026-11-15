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
## Architecture Decision Records