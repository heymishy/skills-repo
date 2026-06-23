# Corpus Case T1 — Payment webhook delivery: performance SLA AC unverified

## Case metadata

```json
{
  "case_id": "T1",
  "label": "Payment webhook delivery — performance SLA AC not evidenced in PR",
  "difficulty": "adversarial",
  "expected_verdict": "INCOMPLETE",
  "expected_gap": "AC4 (P99 delivery latency ≤ 500ms under load) — no load test evidence in PR description",
  "adversarial_pattern": "Story has 4 ACs. AC1–AC3 are verified by named unit/integration tests in the PR description. AC4 requires a performance SLA under load — the PR description mentions 'all tests pass' but no load test exists, no latency measurement is cited, and the test plan shows a GAP for AC4. A model that reads 'all tests pass' and marks all ACs ✅ without checking per-AC evidence will false-positive.",
  "failure_modes_to_watch": [
    "Bulk AC pass: 'all tests pass' treated as evidence for every AC including performance",
    "Test plan gap ignored: GAP-1 in test plan not surfaced as AC risk",
    "Verdict COMPLETE or COMPLETE WITH DEVIATIONS instead of INCOMPLETE"
  ]
}
```

---

## Operator input

> **Operator instruction:** Please run /definition-of-done for the story and supporting artefacts below. PR #214 has been merged.

---

### Story artefact

**Story ID:** ham.9
**Feature:** Hamilton Core Banking — Webhook Notifications
**Epic:** Notification and Reporting

---

### Story: Payment status webhook delivery

**As a** Hamilton integration partner,
**I want** webhook notifications delivered to my registered endpoint when a payment changes status,
**So that** my downstream systems react to payment events without polling.

### Acceptance Criteria

**AC1:** Given a payment transitions to "settled", when the webhook dispatcher fires, then an HTTPS POST is sent to the subscriber within 500ms of the transition event, with body `{ paymentRef, status, timestamp }` and header `X-Hamilton-Signature` correctly computed from HMAC-SHA256.

**AC2:** Given a webhook delivery fails (non-2xx or timeout), when the dispatcher retries, then it retries up to 3 times with exponential backoff (1s, 2s, 4s) and writes the event to `logs/webhook-dead-letter.jsonl` after the third failure.

**AC3:** Given a subscriber has `statusFilter: ["settled"]`, when a payment transitions to "refunded", then the subscriber does NOT receive a webhook for that transition.

**AC4:** Given 100 concurrent payment status transitions under normal load, when all are dispatched, then P99 delivery latency to registered subscribers is ≤ 500ms as measured by a load test against the integration environment.

### Out of Scope

- Persistent subscriber registry (database-backed) — in-memory Map for MVP.
- Replay of historical events for newly registered subscribers.
- Webhook signature verification on the subscriber side.

### NFRs

NFRs: None — reviewed 2026-05-09

### Complexity

Complexity: 2

---

### Test plan summary

**Test plan artefact:** artefacts/hamilton-webhooks/test-plans/ham.9-test-plan.md

| AC | Tests | Coverage | Notes |
|----|-------|----------|-------|
| AC1 | T1: settled transition triggers HTTPS POST; T2: HMAC header present and valid | Full | — |
| AC2 | T3: third failure writes dead-letter entry; T4: exponential backoff spy confirms 1s/2s/4s delays | Full | — |
| AC3 | T5: filtered subscriber does not receive non-matching status | Full | — |
| AC4 | _none_ | None | **GAP-1 (HIGH RISK):** No load test implemented. AC4 requires P99 latency measurement under 100 concurrent transitions. Performance SLA is untested. |

**GAP-1 status:** Open — deferred by engineer before DoR, not RISK-ACCEPTed in /decisions.

---

### DoR artefact summary

**DoR artefact:** artefacts/hamilton-webhooks/dor/ham.9-dor.md
**DoR verdict:** PROCEED
**Warnings acknowledged:** W1 (GAP-1 in test plan for AC4 — operator acknowledged with intent to add load test before DoD)
**Oversight level:** Low

---

### PR description — PR #214 (merged 2026-05-14)

```
## Summary
Implements the payment status webhook dispatcher per ham.9.

## Changes
- src/payments/webhook-dispatcher.js — new module; HTTPS outbound delivery with HMAC-SHA256 signing
- src/payments/subscriber-registry.js — in-memory Map subscriber store
- tests/webhook-dispatcher.test.js — unit + integration tests

## Test results
All tests pass (5/5). Unit tests cover delivery, retry, backoff, and subscriber filtering.

## Notes
Implemented per the story spec. HMAC signing uses process.env.WEBHOOK_SECRET read at dispatch time for rotation safety.
```

---

## Expected verdict

**Verdict:** INCOMPLETE

**Gap that fires:** AC4 — P99 delivery latency ≤ 500ms under load — no evidence in PR, no load test exists, and GAP-1 in the test plan was never resolved.

**Reason:** "All tests pass (5/5)" refers to T1–T5 from the test plan. There is no T6 for load testing — AC4 has no test at all. The PR description does not mention load testing, latency measurement, or any integration environment run under load. The test plan explicitly flags GAP-1 as HIGH RISK and open. The DoR warning (W1) noted intent to add the load test before DoD — that intent was not fulfilled.

**What a correct model output looks like:**
> ❌ **AC4 not satisfied — no evidence**
>
> AC4 requires P99 delivery latency ≤ 500ms under 100 concurrent transitions. The PR description confirms 5 unit/integration tests pass but does not include any load test results. Test plan GAP-1 (AC4 performance SLA) was open at DoR and has not been resolved. No load test file is referenced. AC4 cannot be marked satisfied.
>
> **Verdict: INCOMPLETE**
> Follow-up required: Implement load test for AC4 and verify P99 ≤ 500ms before re-running DoD.

**What a failing model output looks like (false positive):**
> AC1 ✅ — HTTPS POST with HMAC signature: T1+T2 pass
> AC2 ✅ — Retry + dead-letter: T3+T4 pass
> AC3 ✅ — Subscriber filtering: T5 pass
> AC4 ✅ — All tests pass (5/5)
> **Verdict: COMPLETE**

## Adversarial signal

The phrase "all tests pass (5/5)" is the trap. A model that counts tests without checking whether each AC has a corresponding test will assume AC4 is covered because "all tests pass." The test plan gap table makes clear there is no test for AC4 — but only a model that cross-references the test plan against the AC list will catch it. A DoD run that only reads the PR description will miss this completely.
