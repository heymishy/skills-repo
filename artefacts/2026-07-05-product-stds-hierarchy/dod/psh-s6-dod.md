# Definition of Done: psh-s6 — Per-product kanban board

**PR:** https://github.com/heymishy/skills-repo/pull/441 | **Merged:** 2026-07-05
**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s6.md
**Test plan:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s6-test-plan.md
**DoR artefact:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s6-dor.md
**Assessed by:** Claude Code (Sonnet 4.6) / Hamish King
**Date:** 2026-07-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (features shown in 8 stage columns for product) | ✅ | T1: kanban response groups all product features into correct stage columns; all 8 columns present | `tests/check-psh-s6-product-kanban.js` T1 — automated test, CI pass | None |
| AC2 (stage accuracy — feature moves to updated column on refresh) | ✅ | T2: after stage update, feature appears in new column only | `tests/check-psh-s6-product-kanban.js` T2 — automated test, CI pass | None |
| AC3 (health indicator — icon/text alongside colour, never colour-only) | ✅ | T3: health:red card renders ⚠ or "Blocked" text label; colour-only health is not present | `tests/check-psh-s6-product-kanban.js` T3 — automated test, CI pass | None |
| AC4 (empty stage column visible with empty-state label) | ✅ | T4: column with no features shows empty-state label; column not hidden | `tests/check-psh-s6-product-kanban.js` T4 — automated test, CI pass | None |
| AC5 (kanban_viewed PostHog event with view='product', productId, tenantId, featureCount) | ✅ | T5: kanban_viewed event emitted with all required properties on page load | `tests/check-psh-s6-product-kanban.js` T5 — automated test, CI pass | None |
| AC6 (CSS-layout — Playwright E2E screenshot comparison) | ⚠️ | Playwright E2E spec written and committed (`tests/e2e/psh-s6-product-kanban.spec.js`); not yet executed against live server | `tests/e2e/psh-s6-product-kanban.spec.js` — pending post-deploy run | Pending live server execution only |

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
| T1: Stage column grouping | ✅ | ✅ | |
| T2: Stage accuracy on update | ✅ | ✅ | |
| T3: Health indicator icon/text | ✅ | ✅ | |
| T4: Empty stage column visible | ✅ | ✅ | |
| T5: PostHog kanban_viewed event | ✅ | ✅ | |
| T6: Feature name HTML-escaped | ✅ | ✅ | MC-SEC-01 |
| T7: Keyboard accessibility | ✅ | ✅ | MC-A11Y-01 |
| T8 (E2E): CSS column layout screenshot | ✅ written | ⚠️ pending live server | `tests/e2e/psh-s6-product-kanban.spec.js` |

**Gaps:** T8 Playwright E2E requires running app server. Not a functional gap — all functional ACs (AC1–AC5) verified by integration tests. CSS layout is the only outstanding item.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: render < 2s for ≤ 50 features | ✅ | Single DB query with product_id scope; no N+1 |
| Accessibility: MC-A11Y-01 keyboard-accessible | ✅ | T7 asserts keyboard navigation on stage columns |
| Accessibility: MC-A11Y-02 colour not sole health indicator | ✅ | T3 asserts icon/text alongside colour |
| Security: MC-SEC-01 feature names HTML-escaped | ✅ | T6 asserts XSS in feature name is rendered as escaped text |
| ADR-003: no new pipeline-state.json fields | ✅ | Code review — kanban renders from existing stage field |
| No new npm dependencies | ✅ | Code review |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M3a: Kanban render correctness | ✅ | Immediately post-deploy | T1 CI test asserts all features in correct columns on every deploy |
| M3b: Kanban weekly view rate | ✅ | 30 days post-deploy | kanban_viewed PostHog event with view:'product' (AC5) enables weekly view rate computation |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Deviations:**
1. AC6 (CSS-layout) Playwright E2E spec is implemented and committed but pending execution against a live server. All 5 functional ACs satisfied by integration tests. This is a verification gap on the CSS-layout AC only.

**Follow-up actions:**
1. Run `npx playwright test tests/e2e/psh-s6-product-kanban.spec.js` against live server and confirm pass. Owner: Hamish King.

---

## DoD Observations

None.
