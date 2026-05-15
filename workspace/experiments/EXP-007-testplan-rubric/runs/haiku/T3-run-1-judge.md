# Judge Report — T3 Backlog drag-and-drop (Run 1)

**Model:** claude-haiku-4-5
**Judge:** claude-sonnet-4-6
**Date:** 2026-05-16
**Corpus case:** T3 — BL-2.4 Reorder backlog items by drag-and-drop

---

## Evidence Summary

**Coverage table:** AC1 E2E browser ✓, AC2 Integration ✓, AC3 E2E browser ✓. All Covered.

**Test bodies:**
- Test 1 (AC2 — Integration): `mockApi.patchStoriesOrder(newOrder)` → `mockApi.getBacklog()` returns in new order. Grounded in AC2 (persistence after navigation).
- Test 2 (AC1 — Playwright E2E): `page.goto('/backlog')`, `cardToDrag.dragTo(cardToDropAbove)`, DOM order verified via `data-story-id` attributes after drag. Grounded in AC1 (visual position change).
- Test 3 (AC3 — Playwright E2E): Drag position-3 card to position-1, then verify `reorderedOrder[0]='story-003'`, `[1]='story-001'`, `[2]='story-002'`, `[3]='story-004'`, `[4]='story-005'`. Grounded in AC3 (cascading shift).

**D2 critical check — jsdom/fireEvent:**
- `fireEvent.dragStart` appears **only in an explanatory note**: "A unit test using `fireEvent.dragStart(card, { ... })` would not verify that the dragged card visually appears above the target."
- The note is used to justify WHY Playwright is required. It is NOT a test assertion.
- No jsdom test framework is used for AC1 or AC3. Both use Playwright's `dragTo()` with a real browser context.

**Verification script:** Both outputs present. AC1 and AC3 marked 🔴 (browser required). AC2 plain-language scenario. All 3 ACs covered.

**No NFRs** in this story.

---

## Scores

| Dimension | Weight | Score | Notes |
|-----------|--------|-------|-------|
| D1 — AC Coverage Completeness | 0.389* | 1.0 | All 3 ACs covered with runnable test bodies (Playwright + integration) |
| D2 — Test Type Classification | 0.278* | 1.0 | AC1/AC3 correctly as Playwright E2E; AC2 as integration; explicit CSS layout rationale given |
| D3 — Hallucination Suppression | 0.222* | 1.0 | All assertions grounded in observable DOM outcomes; mockApi.patchCallCount assertion grounded in AC2 |
| D4 — NFR Coverage | N/A | N/A | No NFRs in story |
| D5 — Dual Output Completeness | 0.111* | 1.0 | Both outputs present; verification script uses 🔴 browser markers for E2E steps |

*Weight redistributed from standard 0.35/0.25/0.20/0.10/0.10 due to D4=N/A.

**Weighted score:** 1.00
**TCF (Total Coverage Fraction):** 1.00 — no AC omitted
**Categorical fails:** None

---

## D2 Focus — Browser-Layout Classification (Critical)

The model correctly identified AC1 and AC3 as browser-layout-dependent and assigned them to Playwright E2E. The explanation is explicit:

> "Drag-and-drop positioning depends on CSS layout. The DOM simulation environment (jsdom) does not compute: which CSS element is at rendered position (x, y); whether a drop target is 'above' or 'below' another element in visual space; CSS stacking context and z-index ordering. Playwright's real browser context resolves these via actual CSS layout computation."

The `fireEvent.dragStart` mention is a **cautionary note explaining the alternative rejected**, not a test assertion. This is the correct pattern for D2 compliance.

**No D2 categorical fail. No uncaveated dragStart assertion.**

---

## JSON Score Block

```json
{
  "model": "claude-haiku-4-5",
  "judge": "claude-sonnet-4-6",
  "corpus_case": "T3",
  "trial": 1,
  "D1_ac_coverage": 1.0,
  "D1_ac_coverage_notes": "All 3 ACs covered: AC2 as integration test, AC1 and AC3 as Playwright E2E tests. Coverage table present and correct.",
  "D2_test_type_classification": 1.0,
  "D2_classification_notes": "AC1 and AC3 correctly classified as E2E browser tests (Playwright). Explicit rationale given: jsdom cannot compute CSS layout for drag-and-drop. fireEvent.dragStart mentioned only in explanatory note (not a test assertion). No categorical fail.",
  "D3_hallucination_suppression": 1.0,
  "D3_hallucination_notes": "All assertions grounded in observable DOM outcomes (data-story-id attributes, card order). mockApi.patchCallCount assertion grounded in AC2's persistence requirement.",
  "D4_nfr_coverage": null,
  "D4_nfr_notes": "N/A — story has no NFRs. Weight redistributed across D1/D2/D3/D5.",
  "D5_dual_output": 1.0,
  "D5_dual_output_notes": "Both technical plan and verification script present. Verification script uses browser-required markers (🔴) for E2E steps and plain language for AC2.",
  "categorical_fail": false,
  "categorical_fail_reason": null,
  "compliant": true,
  "weighted_score": 1.00,
  "routing_recommendation": "APPROVE",
  "routing_notes": "Exemplary browser-layout classification. Model explicitly explained why jsdom cannot substitute for Playwright and rejected the inferior approach. No uncaveated dragStart assertions found anywhere in test bodies."
}
```
