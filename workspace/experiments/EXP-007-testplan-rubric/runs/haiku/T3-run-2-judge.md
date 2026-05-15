# Judge Report — T3 Backlog drag-and-drop (Run 2)

**Model:** claude-haiku-4-5
**Judge:** claude-sonnet-4-6
**Date:** 2026-05-16
**Corpus case:** T3 — BL-2.4 Reorder backlog items by drag-and-drop

---

## Evidence Summary

**Coverage table:** AC1 E2E browser ✓, AC2 Integration ✓, AC3 E2E browser ✓. All Covered.

**Test bodies:**
- Test 1 (AC2 — Integration): `mockApi.updateStoriesOrder(newOrder)` → `mockApi.getBacklog()` returns in new order, IDs verified. Grounded in AC2 (persistence after navigation away and return).
- Test 2 (AC1 — Playwright E2E): `page.goto('/backlog')`, `cardToDrag.dragTo(targetCard)`, DOM order verified via `data-story-id` attributes. `expect(reorderedIds[0]).toBe('story-003')`, etc. Grounded in AC1 (card appears above target in visual order).
- Test 3 (AC3 — Playwright E2E): Drag position-3 card to position-1, verify cascading shift: `reorderedIds[0]='story-003'`, `[1]='story-001'`, `[2]='story-002'`, `[3]='story-004'`, `[4]='story-005'`. Grounded in AC3.

**D2 critical check — jsdom/fireEvent:**
- `fireEvent.dragStart()` appears **only in a rationale note**: "A jsdom test using `fireEvent.dragStart()` would pass regardless of visual layout — it doesn't verify the AC's observable outcome ('appears immediately above the target card')."
- The note explicitly rejects jsdom as insufficient. It is NOT a test assertion.
- Both E2E tests use Playwright's `dragTo()` with real browser context.

**Verification script:** Both outputs present. AC1 🔴 (browser required), AC2 plain-language, AC3 🔴 (browser required). All 3 ACs covered.

**No NFRs** in this story. Distinct fixture data from Trial 1 (different story titles: "Login flow", "Dashboard" vs "Payment system", "Auth flow").

---

## Scores

| Dimension | Weight | Score | Notes |
|-----------|--------|-------|-------|
| D1 — AC Coverage Completeness | 0.389* | 1.0 | All 3 ACs covered with runnable test bodies |
| D2 — Test Type Classification | 0.278* | 1.0 | AC1/AC3 Playwright E2E; AC2 integration; explicit CSS layout rationale |
| D3 — Hallucination Suppression | 0.222* | 1.0 | All assertions grounded in observable DOM outcomes |
| D4 — NFR Coverage | N/A | N/A | No NFRs in story |
| D5 — Dual Output Completeness | 0.111* | 1.0 | Both outputs present; 🔴 browser markers in verification script |

*Weight redistributed from standard 0.35/0.25/0.20/0.10/0.10 due to D4=N/A.

**Weighted score:** 1.00
**TCF (Total Coverage Fraction):** 1.00 — no AC omitted
**Categorical fails:** None

---

## D2 Focus — Browser-Layout Classification (Critical)

Identical correct pattern to Trial 1. The model rejects jsdom explicitly:

> "Why Playwright (not jsdom): AC1 requires verifying the dragged card 'appears immediately above the target card in the displayed backlog order' ... Both depend on CSS layout computation, which jsdom does not support. Playwright uses a real browser, which computes layout correctly."

`fireEvent.dragStart` appears only in a note explaining why it is NOT used — not in any test assertion. 

**No D2 categorical fail. Consistent across both trials.**

---

## JSON Score Block

```json
{
  "model": "claude-haiku-4-5",
  "judge": "claude-sonnet-4-6",
  "corpus_case": "T3",
  "trial": 2,
  "D1_ac_coverage": 1.0,
  "D1_ac_coverage_notes": "All 3 ACs covered with complete test bodies. Coverage table present and correct.",
  "D2_test_type_classification": 1.0,
  "D2_classification_notes": "AC1 and AC3 correctly as Playwright E2E. AC2 as integration. fireEvent.dragStart() mentioned only in a note rejecting it — not used as a test assertion. No categorical fail.",
  "D3_hallucination_suppression": 1.0,
  "D3_hallucination_notes": "All assertions grounded in observable DOM state. mockApi.lastPatchedOrder assertion grounded in AC2's API persistence requirement.",
  "D4_nfr_coverage": null,
  "D4_nfr_notes": "N/A — story has no NFRs. Weight redistributed.",
  "D5_dual_output": 1.0,
  "D5_dual_output_notes": "Both technical plan and verification script present. Browser-required markers (🔴) used correctly for E2E steps.",
  "categorical_fail": false,
  "categorical_fail_reason": null,
  "compliant": true,
  "weighted_score": 1.00,
  "routing_recommendation": "APPROVE",
  "routing_notes": "Correct browser-layout classification, consistent with Trial 1. Uses distinct backlog fixture data. Explicitly rejects jsdom with rationale. No uncaveated dragStart assertions."
}
```
