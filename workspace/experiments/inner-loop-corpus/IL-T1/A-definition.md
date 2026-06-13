# IL-T1 Definition Artefact — Payment Retry: Failure Classification

**Feature:** 2026-06-13-payment-retry-processor
**Epic:** Payment Reliability — Automated Retry
**Story slug:** retry.1
**Slicing strategy:** Vertical slice (each story independently demo-able)

---

## Epic: Payment Reliability — Automated Retry

**Strategy:** Vertical slice
**Stories:** retry.1 (this), retry.2 (scheduling with exponential backoff — deferred)

---

## Story: retry.1 — Classify and route failed payments

**As a** payment operations engineer,
**I want** the system to automatically classify failed payments as retryable or permanent based on the failure code,
**So that** the triage queue shows only genuinely unresolvable failures and the operations team triage time drops from 2–3 hours/day to under 30 minutes.

### Acceptance Criteria

**AC1:** Given a failed payment with a retryable failure code (network timeout = `TIMEOUT`, temporary issuer decline = `ISSUER_TEMP_UNAVAIL`), when the classifier processes the payment, then the payment is marked `status: "retryable"` and the `retryCount` is set to 0.

**AC2:** Given a failed payment with a permanent failure code (insufficient funds = `INSUFFICIENT_FUNDS`, card blocked = `CARD_BLOCKED`, fraud decline = `FRAUD_DECLINE`), when the classifier processes the payment, then the payment is marked `status: "permanent"` and remains in the manual review queue unchanged.

**AC3:** Given a failed payment with an unknown failure code not in either list, when the classifier processes the payment, then the payment is marked `status: "permanent"` (fail-safe: unknown codes default to manual review) and a `console.warn` is emitted with the unknown code.

### Out of Scope

- Exponential backoff scheduling — retry.2
- Circuit breaker logic — explicitly deferred in discovery (separate concern)
- Merchant-facing retry status dashboard — deferred in discovery
- Fraud screening on retried payments — deferred in discovery
- Upstream error handling changes — out of scope

### NFRs

NFRs: None — confirmed. The classifier is a pure synchronous function operating on an in-memory payment object. No PCI-DSS scope change for the classifier itself (payment card data is not processed in this step — only failure codes).

### Benefit linkage

Contributes to M1: operations team triage time reduction (from 2–3 hours/day to under 30 minutes/day). This story implements the classification that eliminates auto-resolvable failures from the manual queue.

### Architecture Constraints

None identified for this story. The classifier is a stateless pure function with no external dependencies.

### Complexity

1 — well understood; the retryable/permanent code set is finite and given in the discovery input.

### Scope stability

Stable — the AC set is derived directly from the T1 discovery MVP scope. No scope additions.

### Dependencies

None.
