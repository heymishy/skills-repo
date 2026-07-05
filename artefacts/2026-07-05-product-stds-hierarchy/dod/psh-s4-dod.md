# Definition of Done: psh-s4 — Product-aware dashboard and navigation

**PR:** https://github.com/heymishy/skills-repo/pull/441 | **Merged:** 2026-07-05
**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s4.md
**Test plan:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s4-test-plan.md
**DoR artefact:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s4-dor.md
**Assessed by:** Claude Code (Sonnet 4.6) / Hamish King
**Date:** 2026-07-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (dashboard product cards — name, feature count, last updated) | ✅ | T1: product cards rendered with correct name, featureCount, lastUpdated fields from DB | `tests/check-psh-s4-navigation.js` T1 — automated test, CI pass | None |
| AC2 (product view lists features with stage and health) | ✅ | T2: product view returns all journeys for product_id with stage and health | `tests/check-psh-s4-navigation.js` T2 — automated test, CI pass | None |
| AC3 (new feature — journey INSERT with product_id + journey_created PostHog event) | ✅ | T3: POST /products/:id/features inserts journey with product_id and tenant_id from session; journey_created event emitted with productId, tenantId, journeyId | `tests/check-psh-s4-navigation.js` T3 — automated test, CI pass | None |
| AC4 (no products CTA for new accounts) | ✅ | T4: dashboard for tenant with no products renders CTA, not empty feature list | `tests/check-psh-s4-navigation.js` T4 — automated test, CI pass | None |
| AC5 (accurate feature count — no stale cache) | ✅ | T5: feature count reads from DB each request, reflected immediately after creation | `tests/check-psh-s4-navigation.js` T5 — automated test, CI pass | None — deletion path noted as out-of-scope in test plan gap table |

**5 / 5 ACs satisfied. No deviations.**

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 (6 integration tests + 1 Playwright E2E spec written)
**Tests passing in CI (node runner):** 6 / 6

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1: Product card data | ✅ | ✅ | |
| T2: Product view feature list | ✅ | ✅ | |
| T3: New feature journey creation + PostHog | ✅ | ✅ | |
| T4: No-products CTA | ✅ | ✅ | |
| T5: Accurate feature count | ✅ | ✅ | |
| T6: ADR-024 journey GET shape preserved | ✅ | ✅ | |
| T7 (E2E): Dashboard layout Playwright screenshot comparison | ✅ written | ⚠️ pending live server | `tests/e2e/psh-s4-dashboard-layout.spec.js` — requires running app server |

**Gaps:** T7 Playwright E2E requires a live server. Spec is implemented and committed. Pending post-deploy smoke test execution.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: dashboard < 2s for ≤ 20 products | ✅ | DB query uses indexed tenant_id; no N+1 queries |
| Security: product name HTML-escaped | ✅ | Code review — DOM insertion uses text-safe method |
| ADR-024: journey GET shape preserved | ✅ | T6 asserts turns, stages, completedStages, stage, ownerId, activeSkill remain in response |
| No new npm dependencies | ✅ | Code review |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1: Product setup completion rate | ✅ | Immediately post-deploy | journey_created with productId (AC3) completes the M1 measurement path — PostHog can now compute product_created → journey_created within same session |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Deviations:**
1. T7 Playwright E2E (dashboard layout) written and committed but pending live server execution. Spec: `tests/e2e/psh-s4-dashboard-layout.spec.js`. Not a functional AC gap — AC1–AC5 are satisfied by integration tests. CSS-layout verification is the only outstanding item.

**Follow-up actions:**
1. Run `npx playwright test tests/e2e/psh-s4-dashboard-layout.spec.js` against live server after deploy and confirm pass. Owner: Hamish King.

---

## DoD Observations

None.
