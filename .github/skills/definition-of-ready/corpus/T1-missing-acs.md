# Corpus Case T1 — Payment webhook handler: missing ACs

## Case metadata

```json
{
  "case_id": "T1",
  "label": "Payment webhook handler — missing ACs (H2 FAIL)",
  "difficulty": "adversarial",
  "expected_verdict": "BLOCKED",
  "expected_h_blocks": ["H2"],
  "adversarial_pattern": "Story looks complete: correct As/Want/So, test plan present, review clean, discovery approved. Hidden gap: only 1 AC is in Given/When/Then format. The remaining requirements are written as prose/bullets. A model that reads the story quickly will see 'acceptance criteria' and count items rather than checking format.",
  "failure_modes_to_watch": ["AC-count-only check (counts 4 bullet items, misses that only 1 is GWT)", "H2-pass-through (assumes well-written story implies GWT)", "Skipping hard block checklist entirely after seeing clean review"]
}
```

---

## Input bundle

> **Operator instruction:** Please run /definition-of-ready for the story and supporting artefacts below.

---

### Story artefact

**Story ID:** ham.9
**Feature:** Hamilton Core Banking DR Failover
**Epic reference:** artefacts/2026-04-15-hamilton-dr-failover/epics/ham-epic-2-notification-and-reporting.md

---

## Story: Payment status webhook notification handler

**As a** Hamilton platform integration partner,
**I want** a webhook notification sent to registered subscriber endpoints whenever a payment changes status,
**So that** downstream systems can react to payment state changes without polling the Hamilton payments API.

## Benefit Linkage

**Metric moved:** M3 (Downstream integration latency ≤ 200ms from status change to notification delivery)
**How:** Without push notifications, integration partners poll every 30 seconds — mean notification latency is 15 seconds. This story replaces polling with event-driven delivery.

## Architecture Constraints

- New handler module at `src/payments/webhook-dispatcher.js` — no external HTTP libraries; use Node's built-in `https` module for outbound calls.
- Subscriber registry stored in `src/payments/subscriber-registry.js` — a simple in-memory Map; no database persistence for MVP.
- ADR-011 (Artefact-first): this module's creation requires this story artefact to be committed before the implementation is merged.
- Outbound calls must include an HMAC-SHA256 signature header (`X-Hamilton-Signature`) computed from the payload and a shared secret. The shared secret is stored in `process.env.WEBHOOK_SECRET` — never logged, never exposed in response bodies.

## Dependencies

- **Upstream:** ham.7 (payment status state machine) must be complete. The webhook dispatcher subscribes to status change events emitted by the state machine.
- **Downstream:** None within this feature.

## Acceptance Criteria

**AC1:** Given a payment transitions to status "settled", when the webhook dispatcher processes the event, then an HTTPS POST is sent to each registered subscriber endpoint within 500ms, with the request body containing `{ paymentRef: string, status: "settled", timestamp: ISO8601 }` and the `X-Hamilton-Signature` header present and correctly computed.

**The webhook dispatcher must also handle the following requirements:**

- **Retry behaviour:** Failed webhook deliveries (non-2xx response or connection timeout) are retried up to 3 times with exponential backoff (1s, 2s, 4s). After 3 failures the event is written to a dead-letter log at `logs/webhook-dead-letter.jsonl`.
- **Subscriber filtering:** Each subscriber entry in the registry specifies a `statusFilter` array. The dispatcher only delivers events to subscribers whose `statusFilter` includes the new status. Subscribers with an empty `statusFilter` receive all events.
- **Secret rotation safety:** When `WEBHOOK_SECRET` is rotated, in-flight deliveries using the old secret must complete before the new secret takes effect. The dispatcher reads the secret at dispatch time (not at startup) to support zero-downtime rotation.

## Out of Scope

- Persistent subscriber registry (database-backed) — in-memory Map for MVP.
- Webhook delivery rate limiting per subscriber — not required for MVP volume.
- Replay of historical events for newly registered subscribers.
- Webhook signature verification on the subscriber side — that is the subscriber's responsibility.

## NFRs

NFRs: None — reviewed 2026-05-10

## Complexity

Complexity: 2 (some ambiguity around retry timing and secret rotation)

## Scope Stability

Stable

---

### Test plan summary

**Test plan artefact:** artefacts/2026-04-15-hamilton-dr-failover/test-plans/ham.9-test-plan.md

| AC | Tests | Coverage | Notes |
|----|-------|----------|-------|
| AC1 | T1: settled payment triggers POST within 500ms; T2: HMAC signature header present and valid | Full | — |
| Retry behaviour (prose req) | T3: third failure writes to dead-letter log | Partial | Tests cover final state only; exponential backoff timing not verified |
| Subscriber filtering (prose req) | T4: subscriber with matching filter receives event; subscriber with non-matching filter does not | Full | — |
| Secret rotation (prose req) | T5: secret read at dispatch time (spy confirms) | Full | — |

**Test plan gap table:**
- GAP-1 (UNCERTAIN): Backoff timing not asserted — T3 only verifies dead-letter log entry after 3 failures, not the 1s/2s/4s intervals. Accepted: real-time timing assertions are brittle in unit tests; integration test coverage deferred.

---

### Review report summary

**Review artefact:** artefacts/2026-04-15-hamilton-dr-failover/review/ham.9-review.md

| Finding | Category | Severity | Status |
|---------|---------|---------|--------|
| R1: HMAC secret rotation wording ("in-flight deliveries must complete") is ambiguous — does not define the coordination mechanism (e.g. drain timeout, atomic pointer swap). | B — AC completeness | MEDIUM | Open — acknowledged in /decisions |
| R2: Dead-letter log path `logs/webhook-dead-letter.jsonl` is hardcoded. Should be configurable via env var for production deployment flexibility. | D — Implementation approach | LOW | Deferred to post-MVP |

**No HIGH findings.**

---

### Discovery artefact — approval section

**Discovery artefact:** artefacts/2026-04-15-hamilton-dr-failover/discovery.md

```
## Approved By

Priya Sharma — Head of Platform Partnerships — 2026-04-15
```

---

## Expected verdict

**Verdict:** BLOCKED

**Hard block that fires:** H2

**Reason:** The story has only 1 AC written in Given / When / Then format (AC1). The remaining three requirements — retry behaviour, subscriber filtering, and secret rotation safety — are written as prose bullets under a sub-heading ("The webhook dispatcher must also handle the following requirements:"). They are not in GWT format and do not carry AC identifiers. H2 requires ≥3 ACs in Given / When / Then format.

**What a correct model output looks like:**
> ❌ **BLOCKED — 1 hard block failed**
>
> H2 AC format check: Only 1 acceptance criterion (AC1) is written in Given / When / Then format. The retry behaviour, subscriber filtering, and secret rotation requirements are written as prose bullets — not as testable GWT acceptance criteria. H2 requires ≥3 ACs in GWT format.
> Fix: Rewrite retry behaviour, subscriber filtering, and secret rotation as numbered AC2, AC3, AC4 in Given / When / Then format.

**What a failing model output looks like (false positive):**
> The story has 4 acceptance criteria covering the key functional requirements...
> H2 ✅ — ACs present covering webhook delivery, retry, filtering, and secret rotation.

## Adversarial signal

The story is well-written in every other respect: correct As/Want/So format (H1 ✓), clean review with no HIGH findings (H7 ✓), approved discovery with named non-engineer (H-GOV ✓), NFRs explicitly "None — reviewed" (H-NFR ✓), complexity rated (H6 ✓). A model that processes the bundle quickly and looks for "does this story look ready" rather than mechanically checking each H-block criterion will almost certainly miss H2.
