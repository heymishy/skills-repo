# Definition of Ready Checklist

## Definition of Ready: Fix admin credits top-up rejecting a genuinely brand-new tenant via a circular "known tenant" definition

**Story reference:** artefacts/2026-07-23-credits-admin-topup-tenant-check-fix/stories/catc-s1.md
**Test plan reference:** artefacts/2026-07-23-credits-admin-topup-tenant-check-fix/test-plans/catc-s1-test-plan.md
**Assessed by:** Claude (agent, autonomous, short-track)
**Date:** 2026-07-23

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | m1 (Meta-metric 1 — E2E ACs actually run and report real pass/fail, not skip), explicitly stated as not a formal benefit-metric artefact of its own |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | No schema change — `users` and `team_memberships` already exist and are already migrated at startup; confirmed against `scripts/migrate-schema-users.js` and `src/web-ui/modules/user-roles.js`'s `migrateTeamSchema` |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Real intent of `getValidTenantIds()` investigated and stated; all real candidate source-of-truth tables investigated against actual schema files; residual gap (GitHub/Google-OAuth-only tenants) flagged transparently |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No UI/layout-dependent ACs |
| H-NFR | NFR profile exists | ⚠️ RISK-ACCEPT | No dedicated `nfr-profile.md` — NFRs stated inline in story, same precedent as `cuf-s1` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal (tenant/account identifiers) |
| H-NFR-profile | NFR profile presence | ⚠️ RISK-ACCEPT | Same as H-NFR |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md precedent (cuf-s1)** | No discovery artefact — short-track skips /discovery by design |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No new injectable adapter introduced — reuses existing `setCreditsAdapter` (same pool, additional tables queried) |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | No schema migration required — `users` and `team_memberships` already exist |

**All hard blocks pass — with the H-NFR, H-NFR-profile, and H-GOV notes recorded transparently as RISK-ACCEPTs, matching this repo's established short-track precedent (`cuf-s1`).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Short-track skips /review | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Root cause and all three candidate source-of-truth tables independently confirmed against the actual schema files (`migrate-schema-users.js`, `migrate-schema-credits.js`, `user-roles.js`) and actual session-assignment code (`auth-email.js`, `auth.js`) before writing the fix. Same rationale as prior short-track precedent (`cuf-s1`, `scsf-s1`, `pcr-s1`). |
| W5 | No UNCERTAIN items in test plan gap table | ⚠️ | Real-staging E2E confirmation is deploy-dependent AND depends on a separate, already-documented admin-role-provisioning precondition outside this story's scope; GitHub/Google-OAuth-only brand-new tenants remain a residual, un-closed gap | **Acknowledged — proceed.** Unit coverage (UT1-UT5) fully verifies the actual fix (the allowlist source-of-truth broadening) independent of deploy outcome or the separate admin-role precondition. Both are reported honestly regardless of outcome; the residual OAuth-only gap is a pre-existing limitation, not a regression, and is documented in `decisions.md`. |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix admin credits top-up rejecting a genuinely brand-new tenant via a circular "known tenant" definition — artefacts/2026-07-23-credits-admin-topup-tenant-check-fix/stories/catc-s1.md
Test plan: artefacts/2026-07-23-credits-admin-topup-tenant-check-fix/test-plans/catc-s1-test-plan.md
DoR contract: artefacts/2026-07-23-credits-admin-topup-tenant-check-fix/dor/catc-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Change getValidTenantIds() in src/web-ui/modules/credits.js to query
  users.email, team_memberships.tenant_id, and credits.tenant_id
  (concurrently, via Promise.all against the existing adapter wired by
  setCreditsAdapter) and return the de-duplicated union as an array of
  strings, instead of credits.tenant_id alone.
- Do not change adjustBalance, adjustBalanceWithAudit, getAllTenantBalances,
  or getAuditLog.
- Do not change adminCreditsPost's validation order, CSRF guard, or
  requireAdmin wiring.
- Do not weaken the check to accept any syntactically-valid string — a
  tenantId with no matching row in any of the 3 tables must still be
  rejected with HTTP 400 "unknown tenantId".
- New test file tests/check-catc-s1-admin-topup-tenant-check-fix.js
  covering UT1-UT5 from the test plan, using a fake DB that dispatches on
  exact SQL string shape per table, proving RED against the current code
  and GREEN against the fix.
- Confirm tests/check-arl-s3-admin-credits.js and
  tests/check-arl-s5-credit-audit-log.js still pass unchanged (their
  mocks only match the credits-table query shape; do not edit these
  files unless a real regression is found).
- Run npm test in full; confirm no new regressions vs
  tests/known-baseline-failures.json.
- If flyctl is available and authenticated, check flyctl releases
  --app wuce-staging for very recent deploy activity before deploying
  (avoid clobbering concurrent work), then attempt a real flyctl deploy
  and re-run the E2E flow underlying admin-credits-topup.js (or the a3/
  a4/b1 specs) against real wuce-staging. Report the real pass/fail/skip
  status of a3 AC3, a4 AC2/AC3, and b1 AC1-AC3 honestly — do not claim
  they pass if they still skip or fail for an unrelated reason.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- Reference cuf-s1's decisions.md GAP entry and this fix's own artefacts
  in the PR description.
- Update .github/pipeline-state.json for this story (flat
  feature.stories[] entry).
- Add a workspace/capture-log.md entry (source: agent-auto).
- After pushing, run gh pr checks <pr-number> and paste the actual,
  current output before reporting success. If the PR-object-desync issue
  is hit (git ls-remote vs gh api pulls/<number> head sha mismatch),
  close and reopen a fresh PR from the same branch.

Oversight level: High
```

---

## Sign-off

**Oversight level:** High — this repo's default posture per its solo-operator Operating Posture in `.github/architecture-guardrails.md`, and appropriate here because the change touches the admin endpoint that grants credit balances even though narrowly scoped and strictly additive.
**Sign-off required:** No — matches established short-track precedent for a well-evidenced, narrowly-scoped bug fix (`cuf-s1`, `scsf-s1`, `pcr-s1`).
**Signed off by:** Claude (agent, autonomous, short-track) — 2026-07-23, dispatched to fix a real, code-verified gap discovered while verifying `cuf-s1`'s own fix against real `wuce-staging`.
