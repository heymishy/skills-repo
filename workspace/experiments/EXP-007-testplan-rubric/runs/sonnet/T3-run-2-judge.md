# Judge — T3-run-2 (Sonnet Trial 2)

**Story:** BL-2.4 — Reorder backlog items by drag-and-drop
**Model:** claude-sonnet-4-6
**Trial:** 2
**Judge date:** 2026-05-16
**Experiment:** EXP-007-testplan-rubric

---

## Scores

```json
{
  "D1_ac_coverage": 1.0,
  "D1_ac_coverage_notes": "All 3 ACs covered with runnable test bodies. Distinct fixture data from Trial 1 confirmed (s2t3 prefix, Story P/Q/R/S/T naming vs Trial 1's s1t3 prefix, Story A/B/C/D/E naming). AC1: Playwright E2E — page.dragAndDrop() to move story-s2t3-003 (Story R) above story-s2t3-001 (Story P); allTextContents() asserts Story R index < Story P index. AC2: 2 integration tests — PATCH order + GET confirms persistence; navigate away and back preserves order. AC3: Playwright E2E — drag Story R (pos 3) to pos 1; assert Story R at 1, Story P at 2, Story Q at 3. 4 tests total.",
  "D2_test_type_classification": 1.0,
  "D2_classification_notes": "AC1 and AC3 correctly classified as Playwright E2E with explicit ⚠️ pre-test classification block: 'AC1 and AC3 MUST use Playwright E2E tests — NOT jsdom or fireEvent simulation.' Full rationale provided: CSS layout dependency, jsdom limitation, false positive risk of fireEvent. page.dragAndDrop() used exclusively. No fireEvent anywhere.",
  "D3_hallucination_suppression": 1.0,
  "D3_hallucination_notes": "All assertions grounded in observable AC outcomes. No drag event internals, animation state, or DOM event payload assertions. AC2 integration correctly uses PATCH + GET pattern. AC1 and AC3 use rendered DOM order via allTextContents() — observable visual state.",
  "D4_nfr_coverage": "N/A",
  "D4_nfr_notes": "No NFRs in BL-2.4. D4 weight redistributed to D1, D2, D3, D5.",
  "D5_dual_output": 1.0,
  "D5_dual_output_notes": "Both outputs present. Technical test plan with 4 test bodies (2 Playwright + 2 integration). Verification script with plain-language scenarios. Story P/Q/R fixture naming used consistently. Browser scenarios clearly distinguished.",
  "categorical_fail": false,
  "categorical_fail_reason": "None. No jsdom/fireEvent for AC1 or AC3. Playwright used exclusively for layout-dependent ACs.",
  "compliant": true,
  "weighted_score": 1.00,
  "routing_recommendation": "APPROVE",
  "routing_notes": "Perfect score on all applicable dimensions. D2 critical trap definitively avoided — stronger explicit warning block than Trial 1 ('MUST use Playwright... NOT jsdom or fireEvent simulation'). Fixture independence confirmed (s2t3 prefix, Story P/Q/R naming). Consistent approach to AC3 triple-position assertion."
}
```

---

## Dimension detail

### D1 — AC Coverage: 1.0

| AC | Test type | Test count | Notes |
|----|-----------|------------|-------|
| AC1 | E2E (Playwright) | 1 | `page.dragAndDrop()` Story R → Story P; rendered order confirmed |
| AC2 | Integration | 2 | Order persisted after PATCH + GET; confirmed after navigate away |
| AC3 | E2E (Playwright) | 1 | Story R → pos 1; Story P → pos 2; Story Q → pos 3 (all 3 shifts) |

### D2 — Test type classification: 1.0

**Critical trap check: D2 categorical fail criteria.**

The run includes a dedicated "⚠️ Browser-layout detection" section:
> "AC1 and AC3 MUST use Playwright E2E tests — NOT jsdom or fireEvent simulation."
> "A `fireEvent.dragStart` / `fireEvent.drop` test would pass regardless of whether the visual reordering works correctly."

`page.dragAndDrop()` used in both AC1 and AC3 tests. `fireEvent` appears only in the explanatory rejection — not as a test assertion.

**Categorical fail: NOT triggered.** Stronger framing than Trial 1 — explicit MUST NOT language.

### D3 — Hallucination suppression: 1.0

No assertions beyond observable DOM order and API persistence state.

### D4 — NFR coverage: N/A

Redistributed weights:
- D1: 0.389 × 1.0 = 0.389
- D2: 0.278 × 1.0 = 0.278
- D3: 0.222 × 1.0 = 0.222
- D5: 0.111 × 1.0 = 0.111
- **Weighted total: 1.00**

### D5 — Dual output: 1.0

Technical plan: 4 tests. Verification script: plain-language, Story P/Q/R fixture naming.

---

## TCF

TCF = 3/3 = **1.00**

---

## Verdict

**PASS.** Weighted 1.00. TCF 1.00. Compliant = true. No categorical fails. D2 critical trap avoided with even more explicit language than Trial 1.
