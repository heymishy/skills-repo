# IL-S3 Definition Artefact — RTP Acknowledgement Timer

**Feature:** 2026-09-01-rtp-inbound-integration
**Epic:** RTP Core Processing
**Story slug:** rtp.3
**Slicing strategy:** Walking skeleton (rtp.1 established the thin e2e path; rtp.3 adds the SLA enforcement layer)

---

## Story: rtp.3 — Enforce 10-second acknowledgement SLA

**As a** payments engineering team,
**I want** the inbound RTP message handler to enforce the 10-second Payments NZ acknowledgement SLA,
**So that** the enterprise meets the scheme rule that requires acknowledgement within 10 seconds of receipt and avoids scheme penalties.

### Acceptance Criteria

**AC1:** Given an inbound ISO 20022 `pacs.008` payment message received by the handler, when all processing steps (fraud pre-screen + AML check + account crediting) complete within the window, then an acknowledgement message (`pacs.002` positive response) is sent to the Payments NZ central infrastructure within 10 seconds of message receipt.

**AC2:** Given an inbound message is received, when the processing pipeline exceeds 9.5 seconds (the SLA trigger threshold, providing 500ms buffer before the 10-second hard deadline), then the handler sends a `pacs.002` negative acknowledgement (reject) to the scheme before the 10-second deadline and logs a `SCHEME_SLA_EXCEEDED` event.

**AC3:** Given the handler sends an acknowledgement (positive or negative), when the acknowledgement is dispatched, then the message receipt timestamp, acknowledgement timestamp, and elapsed time are written to the processing log for each payment.

### Out of Scope

- Full fraud screening integration (fraud vendor real-time API is unconfirmed — out of scope per discovery assumptions; a stub pre-screen runs in this story)
- Outbound RTP payments — deferred to future phase
- Real-time AML load testing at 40,000 tph — separate infrastructure story
- Batch reconciliation with core banking — separate story

### NFRs

**NFR-1 (Payments NZ Scheme Rule — 10-second acknowledgement SLA):** The handler must send an acknowledgement (positive or negative) within 10 seconds of message receipt for ≥ 99.9% of inbound payments at 40,000 transactions per hour peak load. Performance test must verify the P99 elapsed time at 40 tps sustained throughput (representative of 40,000 tph).

### Architecture Constraints

**C3 (Payments NZ scheme rule — 10-second acknowledgement):** This story's implementation scope falls within the scheme SLA enforcement window. Every processing step in the handler must complete or be aborted before the 10-second threshold. The timer enforcement (AC2) is a hard scheme requirement — the bank incurs scheme penalties for late acknowledgements regardless of processing state.

### Complexity

3 — real-time constraint (async pipeline with hard deadline); SLA enforcement requires timer injection into the existing message handler.
