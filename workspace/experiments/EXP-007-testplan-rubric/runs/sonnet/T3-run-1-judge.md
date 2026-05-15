# Judge — T3-run-1 (Sonnet Trial 1)

**Story:** BL-2.4 — Reorder backlog items by drag-and-drop
**Model:** claude-sonnet-4-6
**Trial:** 1
**Judge date:** 2026-05-16
**Experiment:** EXP-007-testplan-rubric

---

## Scores

```json
{
  "D1_ac_coverage": 1.0,
  "D1_ac_coverage_notes": "All 3 ACs covered with runnable test bodies. AC1: Playwright E2E — page.dragAndDrop() to move story-s1t3-003 above story-s1t3-001, then allTextContents() asserts Story C index < Story A index with C = A-1. AC2: 2 integration tests — apiClient.patchStoryOrder() call + GET /api/backlog/stories confirms new order persists (story-s1t3-003 first); second integration test navigates away and back. AC3: Playwright E2E — same dragAndDrop, then verifies Story C at pos 1, Story A at pos 2, Story B at pos 3 (all three positions explicitly asserted).",
  "D2_test_type_classification": 1.0,
  "D2_classification_notes": "AC1 and AC3 correctly classified as Playwright E2E with a full pre-test rationale block explaining why jsdom cannot verify visual position (CSS layout, rendered DOM order). The block explicitly names fireEvent.dragStart as a technique that would produce a false positive. Playwright's page.dragAndDrop() API used in both AC1 and AC3 tests. No fireEvent anywhere in the test output. D2 categorical fail definitively avoided.",
  "D3_hallucination_suppression": 1.0,
  "D3_hallucination_notes": "All assertions grounded in observable AC outcomes. AC1 asserts rendered DOM order via allTextContents(). AC2 asserts API persistence via GET response order. AC3 asserts all three final rendered positions. No assertion on drag animation, DOM event payload, browser-internal coordinates, or network call internals.",
  "D4_nfr_coverage": "N/A",
  "D4_nfr_notes": "No NFRs defined in BL-2.4. D4 weight redistributed to D1, D2, D3, D5.",
  "D5_dual_output": 1.0,
  "D5_dual_output_notes": "Both outputs present. Technical test plan with 4 test bodies (2 Playwright E2E + 2 integration). Verification script uses plain-language scenarios with explicit browser step indicators (🔴 BROWSER STEP) for E2E tests, distinguishing which scenarios require a running browser from which can be verified via API alone.",
  "categorical_fail": false,
  "categorical_fail_reason": "None. No jsdom/fireEvent usage for AC1 or AC3. Playwright used exclusively for browser-layout ACs.",
  "compliant": true,
  "weighted_score": 1.00,
  "routing_recommendation": "APPROVE",
  "routing_notes": "Perfect score on all applicable dimensions. D2 categorical fail definitively avoided — Playwright used for both layout-dependent ACs with explicit documented rationale rejecting jsdom. Distinct fixture IDs (s1t3 prefix, Story A/B/C/D/E naming)."
}
```

---

## Dimension detail

### D1 — AC Coverage: 1.0

| AC | Test type | Test count | Notes |
|----|-----------|------------|-------|
| AC1 | E2E (Playwright) | 1 | `page.dragAndDrop()` Story C → Story A; rendered order confirmed |
| AC2 | Integration | 2 | Order persisted after PATCH; confirmed after navigate away + back |
| AC3 | E2E (Playwright) | 1 | Story C → pos 1; Story A → pos 2; Story B → pos 3 (all 3 shifts asserted) |

### D2 — Test type classification: 1.0

**Critical trap check: D2 categorical fail criteria — jsdom/fireEvent for AC1 or AC3.**

The run includes a dedicated "⚠️ Browser-layout detection" section at the top stating:
> "The drag-and-drop reorder verification for AC1 and AC3 requires reading rendered DOM order after a physical drag operation. jsdom does not implement CSS layout or compute element positions. A `fireEvent.dragStart` / `fireEvent.drop` test would pass even when the visual reordering is broken."

`fireEvent.dragStart` is mentioned only in this explanatory rejection — it does not appear as a test assertion anywhere. Playwright `page.dragAndDrop()` is used exclusively for AC1 and AC3.

**Categorical fail: NOT triggered.**

### D3 — Hallucination suppression: 1.0

No assertion on drag event internals, animation state, intermediate DOM state during drag, browser-specific event properties, or API implementation details beyond the observable order response. AC2 integration test uses `apiClient.patchStoryOrder()` and GET verification — both grounded in AC2 ("navigate away and back → sequence preserved").

### D4 — NFR coverage: N/A

No NFRs in BL-2.4.

Redistributed weights:
- D1: 0.389 × 1.0 = 0.389
- D2: 0.278 × 1.0 = 0.278
- D3: 0.222 × 1.0 = 0.222
- D5: 0.111 × 1.0 = 0.111
- **Weighted total: 1.00**

### D5 — Dual output: 1.0

Technical plan: 4 test bodies with setup/teardown hooks.
Verification script: plain-language with browser step indicators differentiating E2E from API verification steps.

---

## TCF

TCF = 3/3 = **1.00**

---

## Verdict

**PASS.** Weighted 1.00. TCF 1.00. Compliant = true. No categorical fails. D2 critical trap definitively avoided.
