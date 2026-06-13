# IL-S3 — RTP Acknowledgement Timer (MEDIUM difficulty)

## Scenario origin

Derived from discovery corpus case **S3** (NZ RTP integration). The inner loop story selected is the **acknowledgement timer** story — implementing the 10-second SLA enforcement for inbound RTP payment messages. The scheme rule requires the bank to acknowledge an inbound payment within 10 seconds of receipt.

## Inner loop difficulty classification

**MEDIUM** — one real-time performance NFR (10-second SLA), NZ domain context (Payments NZ scheme), integration with existing ISO 20022 message handler.

- **Constraint type:** NFR-only — 10-second SLA is a scheme rule, not a regulatory sign-off gate
- **DoD expected verdict:** COMPLETE

## Why this case (MEDIUM difficulty)

- Performance NFR requires an explicit NFR test (latency measurement under load)
- Multi-file integration: the timer must hook into the existing message handler
- NZ domain context: Payments NZ scheme rules, ISO 20022 message format
- The "MEDIUM" difficulty manifests in IP3 (task executability): the implementing agent needs to understand how to hook a timer into an existing async message processing chain

## What a weak model will miss

1. **NFR-1 (10-second SLA) missing from implementation plan** — a weak plan implements the acknowledgement message builder but has no performance test or SLA enforcement step. IP5 = 0.0 for this case.
2. **IP3 coarse task** — "implement acknowledgement" as a single task without showing the timer hook into the existing `handleInboundMessage()` function
3. **IP2 scope creep** — adding the full fraud screening integration (explicitly deferred in discovery) because the model knows it's mentioned in the scheme rules
4. **DoD D3 (NFR verification)** — model marks story COMPLETE without checking whether T_NFR_1 (latency test) evidence is in the PR

## Expected DoD verdict: COMPLETE

All 3 ACs + NFR-1 (latency) implemented and evidenced. No fraud screening integration (deferred). 10-second SLA verified by named performance test.
