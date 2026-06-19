# Corpus Case IL-T1 — Payment retry classifier: genuinely complete

## Case metadata

```json
{
  "case_id": "IL-T1",
  "label": "Payment retry classifier — all ACs verified, no deviations (EXP-036/037 Phase B)",
  "difficulty": "LOW",
  "expected_verdict": "COMPLETE",
  "expected_gap": null,
  "adversarial_pattern": "Baseline COMPLETE case. All 3 ACs verified by named tests T1–T7. No NFRs. M1 not-yet-measurable (retry pipeline incomplete). The trap is over-triggering: a model that reflexively hedges may flag retry scheduling (retry.2), circuit breaker logic, or the merchant dashboard — all of which are explicitly out of scope — as deviations. A correct model returns COMPLETE with no invented gaps.",
  "failure_modes_to_watch": [
    "Phantom deviation: retry scheduling or circuit breaker flagged as missing from PR",
    "Metric step skipped: D4 docked for not confirming M1 is not-yet-measurable",
    "Verdict COMPLETE WITH DEVIATIONS when COMPLETE is correct"
  ]
}
```

---

## Operator input

> **Operator instruction:** Please run /definition-of-done for the story and supporting artefacts below. PR #142 has been merged.

---

### Story artefact

**Story ID:** retry.1
**Feature:** 2026-06-13-payment-retry-processor
**Epic:** Payment Reliability — Automated Retry

---

### Story: Classify and route failed payments

**As a** payment operations engineer,
**I want** the system to automatically classify failed payments as retryable or permanent based on the failure code,
**So that** the triage queue shows only genuinely unresolvable failures and the operations team triage time drops from 2–3 hours/day to under 30 minutes.

### Acceptance Criteria

**AC1:** Given a failed payment with a retryable failure code (TIMEOUT, ISSUER_TEMP_UNAVAIL), when the classifier processes the payment, then the payment is marked `status: "retryable"` and the `retryCount` is set to 0.

**AC2:** Given a failed payment with a permanent failure code (INSUFFICIENT_FUNDS, CARD_BLOCKED, FRAUD_DECLINE), when the classifier processes the payment, then the payment is marked `status: "permanent"` and remains in the manual review queue unchanged.

**AC3:** Given a failed payment with an unknown failure code, when the classifier processes the payment, then the payment is marked `status: "permanent"` and a `console.warn` is emitted with the unknown code.

### Out of Scope

- Exponential backoff scheduling (retry.2)
- Circuit breaker logic
- Merchant-facing retry status dashboard
- Fraud screening on retried payments
- Upstream error handling changes

### NFRs

NFRs: None — confirmed.

---

### Test plan summary

| AC / NFR | Tests | Coverage | Notes |
|----------|-------|----------|-------|
| AC1 | T1: TIMEOUT → retryable; T2: ISSUER_TEMP_UNAVAIL → retryable | Full | — |
| AC2 | T3: INSUFFICIENT_FUNDS → permanent; T4: CARD_BLOCKED → permanent; T5: FRAUD_DECLINE → permanent | Full | — |
| AC3 | T6: unknown code → permanent; T7: console.warn called with unknown code | Full | — |

No test plan gaps.

---

### DoR artefact summary

**DoR verdict:** PROCEED
**Warnings acknowledged:** None
**Oversight level:** Low

---

### Metric context

**Feature metric:** M1 — operations team triage time (target: under 30 minutes/day)
**retry.1 contribution:** Listed in M1 `contributingStories: ["retry.1"]`. Triage time reduction depends on the full retry pipeline (retry.1 + retry.2); M1 signal not measurable until both stories merge and the retry mechanism is live.
**Current M1 state:** `signal: "not-yet-measured"` — feature not yet in production.

---

### PR description — PR #142 (merged 2026-06-13)

```
## Summary
Implements payment failure classifier (retry.1).

## Changes
- src/payments/failure-classifier.js — failure code classification logic
- tests/payments/failure-classifier.test.js — T1–T7 (7 tests)

## Test results
7/7 tests pass. All ACs verified. T6+T7 cover the fail-safe unknown code path
including the console.warn emission.

## Notes
RETRYABLE_CODES and PERMANENT_CODES defined as Sets for O(1) lookup.
Unknown codes default to permanent (fail-safe). console.warn includes
the unknown code string for operational visibility.
```
