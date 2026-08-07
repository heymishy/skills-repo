## Test Plan: Give admins a real control to lift a tenant's journey cap, separate from credits

**Story reference:** artefacts/2026-08-06-tenant-plan-admin-control/stories/tpac-s1-admin-plan-state-control.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-06

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Admin credits page shows plan+status distinct from credits balance | 1 test | — | — | — | — | 🟢 |
| AC2 | Setting plan paid/active via new control lifts the journey cap | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | Credits-only adjustment does NOT lift the cap (regression guard) | 1 test | — | — | — | — | 🟢 |
| AC4 | "Journey limit reached" page text distinguishes plan from credits | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All 4 ACs are server-side logic/text assertions, testable without a browser — no CSS-layout dependence.

---

## Test Data Strategy

**Source:** Mocked Postgres pool (matching this repo's existing `check-*` test convention — a fake pool object recording queries, not a real DB connection)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Fixture tenant with a known plan/status and credits balance | Synthetic (mocked pool rows) | None | |
| AC2 | Fixture tenant starting at cap; journey count at cap | Synthetic | None | |
| AC3 | Fixture tenant, credits-only adjustment call | Synthetic | None | |
| AC4 | Rendered error page HTML | N/A — string assertion on rendered output | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### adminCreditsPage_showsPlanAndStatusDistinctFromCredits

- **Verifies:** AC1
- **Precondition:** Fixture tenant with `plan: 'trial', status: 'active'` and a known credits balance
- **Action:** Render the `/admin/credits` page for that tenant
- **Expected result:** The rendered HTML contains both the plan/status fields and the credits balance, as visually and structurally distinct elements — not merged into one field
- **Edge case:** No

### settingPlanPaidActive_liftsJourneyCap

- **Verifies:** AC2
- **Precondition:** Fixture tenant at their existing journey cap (`trial`, count = cap)
- **Action:** Call the new plan-state-setting function/route for that tenant with `plan: 'paid', status: 'active'`, then call `checkJourneyCap` for the same tenant
- **Expected result:** `checkJourneyCap` returns `{allowed: true, cap: null}` — matching the exact behavior a real paid Stripe customer already gets
- **Edge case:** No

### creditsOnlyAdjustment_doesNotLiftCap

- **Verifies:** AC3
- **Precondition:** Fixture tenant at their existing journey cap, still `plan: 'trial'`
- **Action:** Call `adjustBalanceWithAudit` (the existing credits-adjustment path) for that tenant, then call `checkJourneyCap`
- **Expected result:** `checkJourneyCap` still returns `{allowed: false, cap: <existing cap>}` — confirming credits and plan remain genuinely independent
- **Edge case:** Yes — regression guard against future accidental conflation

### journeyLimitErrorPage_distinguishesPlanFromCredits

- **Verifies:** AC4
- **Precondition:** Fixture tenant at cap, `plan: 'trial'`
- **Action:** Trigger the "Journey limit reached" error page render (`routes/journey.js` and `routes/products.js` code paths)
- **Expected result:** The rendered page body contains the word "plan" in the limit explanation, and does not phrase the limit as being about credits
- **Edge case:** No

---

## Integration Tests

### adminSetsPlan_thenTenantCreatesJourneySuccessfully

- **Verifies:** AC2
- **Components involved:** New admin plan-state route, `tenant-plan.js`'s `setPlanState`/`checkJourneyCap`, journey-creation gate in `routes/journey.js`
- **Precondition:** Fixture tenant at cap
- **Action:** POST to the new admin plan-state route setting `paid`/`active`, then POST to create a new journey for that tenant
- **Expected result:** The journey-creation request succeeds (no "Journey limit reached" page), end-to-end through the real gate-check code path

---

## NFR Tests

### planStateWrite_singleRowQuery

- **NFR addressed:** Performance
- **Measurement method:** Assert the mocked pool records exactly one query for the plan-state write (no N+1)
- **Pass threshold:** Exactly 1 query per plan-state change
- **Tool:** Mocked pool call-count assertion

### planStateRoute_requiresAdmin

- **NFR addressed:** Security
- **Measurement method:** Call the new route with a non-admin session; assert rejection matching `/admin/credits`'s existing `requireAdmin` behavior
- **Pass threshold:** Non-admin requests are rejected identically to existing admin-only routes
- **Tool:** Direct route-handler invocation with a non-admin session fixture

---

## Out of Scope for This Test Plan

- Testing a real Stripe checkout flow — this story's control is admin-only, separate from the Stripe webhook path (`billing.js`), which is already tested elsewhere.
- Testing `adjustBalanceWithAudit`'s own correctness — unchanged by this story, already covered by existing tests.

---

## Test Gaps and Risks

None — all ACs have automated coverage; no manual-only scenarios required.
