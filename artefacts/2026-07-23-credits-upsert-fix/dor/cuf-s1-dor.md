# Definition of Ready Checklist

## Definition of Ready: Fix credits.js UPDATE-only balance adjustment silently dropping a brand-new tenant's first credit provisioning

**Story reference:** artefacts/2026-07-23-credits-upsert-fix/stories/cuf-s1.md
**Test plan reference:** artefacts/2026-07-23-credits-upsert-fix/test-plans/cuf-s1-test-plan.md
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
| H5 | Benefit linkage field references a named metric | ✅ | Regression-prevention / production correctness, explicitly stated as not a formal benefit-metric artefact |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | No schema change — table already has `tenant_id` as primary key, confirmed against `scripts/migrate-schema-credits.js` |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Schema confirmed, full-repo grep for existing `INSERT INTO credits` performed, residual `getValidTenantIds()` gap flagged transparently |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No UI/layout-dependent ACs |
| H-NFR | NFR profile exists | ⚠️ RISK-ACCEPT | No dedicated `nfr-profile.md` — NFRs stated inline in story, same precedent as `scsf-s1`/`pcr-s1` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal (tenant credit balances) |
| H-NFR-profile | NFR profile presence | ⚠️ RISK-ACCEPT | Same as H-NFR |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry precedent** | No discovery artefact — short-track skips /discovery by design |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No new injectable adapter introduced — reuses existing `setCreditsAdapter` |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | No schema migration required — `ON CONFLICT (tenant_id)` targets the existing primary key |

**All hard blocks pass — with the H-NFR, H-NFR-profile, and H-GOV notes recorded transparently as RISK-ACCEPTs.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Short-track skips /review | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Root cause independently confirmed against the real schema file, a full-repo grep, and the actual current SQL text before writing the fix. Same rationale as prior short-track precedent (`scsf-s1`, `pcr-s1`). |
| W5 | No UNCERTAIN items in test plan gap table | ⚠️ | Real-staging E2E confirmation is deploy-dependent; the admin-UI path's residual `getValidTenantIds()` gap means even a successful deploy may still show a 400 for a genuinely brand-new tenant via the admin UI specifically | **Acknowledged — proceed.** Unit/integration coverage (including a real, non-mocked-through `handlePostStripeWebhook` call) fully verifies the actual production defect (the Stripe webhook path) independent of deploy outcome or the admin-UI's separate gap. Both are reported honestly regardless of outcome. |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix credits.js UPDATE-only balance adjustment silently dropping a brand-new tenant's first credit provisioning — artefacts/2026-07-23-credits-upsert-fix/stories/cuf-s1.md
Test plan: artefacts/2026-07-23-credits-upsert-fix/test-plans/cuf-s1-test-plan.md
DoR contract: artefacts/2026-07-23-credits-upsert-fix/dor/cuf-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Change adjustBalance and adjustBalanceWithAudit in
  src/web-ui/modules/credits.js from UPDATE-only statements to
  INSERT ... ON CONFLICT (tenant_id) DO UPDATE ... atomic upserts,
  preserving the additive semantics (balance = credits.balance +
  EXCLUDED.balance, never overwrite) and the existing [delta, tenantId]
  param order.
- Preserve both functions' signatures and return shapes exactly.
- Do not touch admin-credits.js's getValidTenantIds() allowlist logic,
  Stripe signature verification, webhook idempotency, or checkout-session
  creation.
- New test file tests/check-cuf-s1-credits-upsert-fix.js covering
  UT1-UT4 and IT1 from the test plan, using a stateful fake DB that
  proves RED against the current code and GREEN against the fix.
- Update the 5 existing test files whose mocks pattern-match the old
  literal UPDATE credits SQL string (check-lab-s3.1-credits-model.js,
  check-lab-s3.4-stripe-webhook.js, check-arl-s5-credit-audit-log.js,
  check-bri-s3.4-cross-tenant-isolation.js,
  check-bri-s3.5-billing-webhook.js) to recognise the new upsert shape,
  without weakening their existing behavioural assertions.
- Run npm test in full; confirm no new regressions vs
  tests/known-baseline-failures.json.
- Attempt a real flyctl deploy to wuce-staging; if successful, verify the
  actual production fix (Stripe webhook path) and honestly report whether
  the admin-UI top-up path is still blocked by the separate, documented
  getValidTenantIds() gap.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- Reference tests/e2e/fixtures/admin-credits-topup.js's header comment
  and this fix's own artefacts in the PR description.
- Update .github/pipeline-state.json for this story (flat
  feature.stories[] entry).
- Add a workspace/capture-log.md entry (source: agent-auto).

Oversight level: High
```

---

## Sign-off

**Oversight level:** High — this repo's default posture per its solo-operator Operating Posture in `.github/architecture-guardrails.md`, and appropriate here because the change touches revenue-affecting credit provisioning logic even though narrowly scoped.
**Sign-off required:** No — matches established short-track precedent for a well-evidenced, narrowly-scoped bug fix (`scsf-s1`, `pcr-s1`, `jrf-s1`).
**Signed off by:** Claude (agent, autonomous, short-track) — 2026-07-23, dispatched to fix a real, code-verified production defect documented in `tests/e2e/fixtures/admin-credits-topup.js`.
