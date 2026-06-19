# IL-T1 — Payment Retry: Failure Classification (LOW difficulty)

**Feature:** 2026-06-13-payment-retry-processor
**Story:** retry.1
**Difficulty:** LOW
**Expected Phase A score:** ≥ 0.95

## Operator input

> You are running /implementation-plan on the following story in eval mode.
> Your FIRST line of output must be exactly: Save path: artefacts/2026-06-13-payment-retry-processor/plans/retry.1-plan.md
> You MUST follow TDD order: write the failing test first (RED),
> then write the implementation. Tests must appear BEFORE
> implementation code in your plan. Any task that shows
> implementation before its test is a protocol violation.

DoR artefact:

# IL-T1 DoR Artefact — retry.1

**Feature:** 2026-06-13-payment-retry-processor
**Story:** retry.1 — Classify and route failed payments
**DoR verdict:** Proceed: Yes
**Oversight level:** Low
**Hard blocks:** 13/13 passed

### Contract Proposal

**What will be built:**
A `classifyFailure(payment)` function exported from `src/payments/failure-classifier.js`. The function reads `payment.failureCode` and returns a modified payment object with:
- `payment.status = "retryable"` and `payment.retryCount = 0` for codes in the retryable set
- `payment.status = "permanent"` for codes in the permanent set or any unknown code
- A `console.warn` emitted for unknown codes

**What will NOT be built:**
- Retry scheduling or exponential backoff (retry.2)
- Any modification to the payments queue persistence layer
- Any network calls or external system integration

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — retryable code → retryable status | Unit test: `classifyFailure({ failureCode: 'TIMEOUT' })` returns `{ status: 'retryable', retryCount: 0 }` | Unit |
| AC2 — permanent code → permanent status | Unit test: `classifyFailure({ failureCode: 'INSUFFICIENT_FUNDS' })` returns `{ status: 'permanent' }` | Unit |
| AC3 — unknown code → permanent + warn | Unit test with `jest.spyOn(console, 'warn')`: unknown code returns `{ status: 'permanent' }` and triggers warn | Unit |

**Estimated touch points:**
- Create: `src/payments/failure-classifier.js`
- Create: `tests/payments/failure-classifier.test.js`

### Coding Agent Instructions

**Goal:** Implement the `classifyFailure` function that maps payment failure codes to retryable/permanent status.

**Branch:** `feature/retry.1`
**Test command:** `npm test`
**Oversight:** Low

**ACs to implement:**
1. AC1 — `{ failureCode: 'TIMEOUT' }` or `'ISSUER_TEMP_UNAVAIL'` → `{ status: 'retryable', retryCount: 0 }`
2. AC2 — `{ failureCode: 'INSUFFICIENT_FUNDS' }`, `'CARD_BLOCKED'`, `'FRAUD_DECLINE'` → `{ status: 'permanent' }`
3. AC3 — unknown code → `{ status: 'permanent' }` + `console.warn(unknownCode)`

**Files to touch:**
- Create: `src/payments/failure-classifier.js`
- Create: `tests/payments/failure-classifier.test.js`

**Scope boundary:** Do NOT implement retry scheduling, exponential backoff, queue persistence, or external integrations.

**Architecture Constraints:** None. Pure function — no external dependencies.

---

Definition artefact:

# IL-T1 Definition Artefact — Payment Retry: Failure Classification

**Feature:** 2026-06-13-payment-retry-processor
**Story slug:** retry.1

### Story: retry.1 — Classify and route failed payments

**AC1:** Given a failed payment with a retryable failure code (TIMEOUT, ISSUER_TEMP_UNAVAIL), when the classifier processes the payment, then the payment is marked `status: "retryable"` and `retryCount` is set to 0.

**AC2:** Given a failed payment with a permanent failure code (INSUFFICIENT_FUNDS, CARD_BLOCKED, FRAUD_DECLINE), when the classifier processes the payment, then the payment is marked `status: "permanent"`.

**AC3:** Given a failed payment with an unknown failure code, when the classifier processes the payment, then the payment is marked `status: "permanent"` and a `console.warn` is emitted with the unknown code.

**Out of Scope:** Exponential backoff scheduling, circuit breakers, merchant dashboard, fraud screening, upstream error handling.

**NFRs:** None confirmed. Pure synchronous function; no PCI-DSS scope.

**Architecture Constraints:** None. Stateless pure function with no external dependencies.

---

Test plan:

# IL-T1 Test Plan — retry.1 Failure Classification

| AC / NFR | Tests | Coverage |
|----------|-------|----------|
| AC1 — retryable code | T1: TIMEOUT maps to retryable; T2: ISSUER_TEMP_UNAVAIL maps to retryable | Full |
| AC2 — permanent code | T3: INSUFFICIENT_FUNDS; T4: CARD_BLOCKED; T5: FRAUD_DECLINE → permanent | Full |
| AC3 — unknown code | T6: unknown code → permanent; T7: console.warn emitted | Full |
| NFRs | None | N/A |

**T1:** `classifyFailure({ failureCode: 'TIMEOUT' })` → `{ status: 'retryable', retryCount: 0 }`
**T2:** `classifyFailure({ failureCode: 'ISSUER_TEMP_UNAVAIL' })` → `{ status: 'retryable', retryCount: 0 }`
**T3–T5:** Each permanent code → `{ status: 'permanent' }`
**T6:** Unknown code → `{ status: 'permanent' }`
**T7:** `jest.spyOn(console, 'warn')` — unknown code triggers warn with the code string

---

Codebase context:

```js
// src/payments/queue.js (existing module the implementation integrates with)
'use strict';

const QUEUE_STATUS = {
  PENDING: 'pending',
  RETRYABLE: 'retryable',
  PERMANENT: 'permanent',
  PROCESSING: 'processing',
};

class FailedPaymentsQueue {
  constructor() { this._entries = []; }

  enqueue(payment) {
    this._entries.push({ ...payment, status: QUEUE_STATUS.PENDING, retryCount: 0 });
  }

  processNext(classifyFn) {
    const next = this._entries.find(e => e.status === QUEUE_STATUS.PENDING);
    if (!next) return null;
    const classified = classifyFn(next);
    const idx = this._entries.indexOf(next);
    this._entries[idx] = classified;
    return classified;
  }

  getManualReviewQueue() {
    return this._entries.filter(e => e.status === QUEUE_STATUS.PERMANENT);
  }

  getRetryQueue() {
    return this._entries.filter(e => e.status === QUEUE_STATUS.RETRYABLE);
  }
}

module.exports = { FailedPaymentsQueue, QUEUE_STATUS };
```

Produce the implementation plan. Write it to artefacts/2026-06-13-payment-retry-processor/plans/retry.1-plan.md.

## Expected characteristics

# IL-T1 DoR Artefact — retry.1

**Feature:** 2026-06-13-payment-retry-processor
**Story:** retry.1 — Classify and route failed payments
**DoR verdict:** Proceed: Yes
**Oversight level:** Low

## Contract Proposal

**What will be built:**
A `classifyFailure(payment)` function exported from `src/payments/failure-classifier.js`.
- `payment.status = "retryable"` and `payment.retryCount = 0` for TIMEOUT, ISSUER_TEMP_UNAVAIL
- `payment.status = "permanent"` for INSUFFICIENT_FUNDS, CARD_BLOCKED, FRAUD_DECLINE, and unknown codes
- `console.warn` emitted for unknown codes

**What will NOT be built:**
- Retry scheduling or exponential backoff (retry.2)
- Any modification to the payments queue persistence layer
- Any network calls or external system integration

**ACs:**
- AC1: retryable code → `{ status: 'retryable', retryCount: 0 }`
- AC2: permanent code → `{ status: 'permanent' }`
- AC3: unknown code → `{ status: 'permanent' }` + `console.warn`

**Files to touch:**
- Create: `src/payments/failure-classifier.js`
- Create: `tests/payments/failure-classifier.test.js`

**Architecture Constraints:** None. Pure function.
