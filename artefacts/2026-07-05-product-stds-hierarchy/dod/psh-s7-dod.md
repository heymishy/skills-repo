# Definition of Done: psh-s7 — Org-level kanban with product grouping and filter

**PR:** https://github.com/heymishy/skills-repo/pull/441 | **Merged:** 2026-07-05
**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s7.md
**Test plan:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s7-test-plan.md
**DoR artefact:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s7-dor.md
**Assessed by:** Claude Code (Sonnet 4.6) / Hamish King
**Date:** 2026-07-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (all features across products, grouped by product and stage, "All products" default) | ✅ | T1: org kanban response shows all tenant features grouped by product and stage; default filter is All products | `tests/check-psh-s7-org-kanban.js` T1 — automated test, CI pass | None |
| AC2 (product filter hides other products) | ✅ | T2: filter to specific product shows only that product's features | `tests/check-psh-s7-org-kanban.js` T2 — automated test, CI pass | None |
| AC3 (filter reset restores all products) | ✅ | T3: All products filter restores all products and features | `tests/check-psh-s7-org-kanban.js` T3 — automated test, CI pass | None |
| AC4 (feature card navigates to active stage) | ✅ | T4: feature card link resolves to correct active stage URL for that journey | `tests/check-psh-s7-org-kanban.js` T4 — automated test, CI pass | None |
| AC5 (kanban_viewed PostHog event with view='org', productCount, featureCount) | ✅ | T5: kanban_viewed event emitted with view:'org', tenantId, productCount, featureCount on load | `tests/check-psh-s7-org-kanban.js` T5 — automated test, CI pass | None |
| AC6 (CSS-layout — Playwright E2E screenshot comparison) | ⚠️ | Playwright E2E spec written and committed (`tests/e2e/psh-s7-org-kanban.spec.js`); not yet executed against live server | `tests/e2e/psh-s7-org-kanban.spec.js` — pending post-deploy run | Pending live server execution only |

**5 / 6 ACs fully verified in CI. AC6 spec committed, pending live server smoke test.**

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8 (7 integration tests + 1 Playwright E2E spec)
**Tests passing in CI (node runner):** 7 / 7

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1: All-products view grouped by product and stage | ✅ | ✅ | |
| T2: Product filter | ✅ | ✅ | |
| T3: Filter reset | ✅ | ✅ | |
| T4: Feature card navigation | ✅ | ✅ | |
| T5: PostHog kanban_viewed with view='org' | ✅ | ✅ | |
| T6: Product and feature name HTML-escaped | ✅ | ✅ | MC-SEC-01 |
| T7: Filter dropdown keyboard-accessible | ✅ | ✅ | MC-A11Y-01 |
| T8 (E2E): CSS column/group layout screenshot | ✅ written | ⚠️ pending live server | `tests/e2e/psh-s7-org-kanban.spec.js` |

**Gaps:** T8 Playwright E2E requires running app server. All functional ACs (AC1–AC5) verified by integration tests.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: render < 3s for ≤ 10 products, ≤ 100 features | ✅ | DB query joins products + journeys by tenantId; single round-trip |
| Accessibility: MC-A11Y-01 filter dropdown keyboard-accessible | ✅ | T7 asserts keyboard navigation |
| Accessibility: MC-A11Y-02 health indicators use icon/text | ✅ | Inherits psh-s6 rendering pattern; health indicator implementation confirmed |
| Security: MC-SEC-01 product and feature names HTML-escaped | ✅ | T6 asserts XSS escaped |
| No cross-tenant data | ✅ | All queries scoped to req.session.tenantId |
| No new npm dependencies | ✅ | Code review |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M3a: Kanban render correctness | ✅ | Immediately post-deploy | T1 asserts correct org-level grouping on every deploy |
| M3b: Kanban weekly view rate | ✅ | 30 days post-deploy | kanban_viewed with view:'org' contributes to weekly view rate alongside psh-s6 product views |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Deviations:**
1. AC6 (CSS-layout) Playwright E2E spec implemented and committed, pending live server execution. All 5 functional ACs satisfied.

**Follow-up actions:**
1. Run `npx playwright test tests/e2e/psh-s7-org-kanban.spec.js` against live server and confirm pass. Owner: Hamish King.

---

## DoD Observations

None.
