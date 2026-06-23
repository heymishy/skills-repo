# Definition: NZ Real-Time Payments (RTP) — Inbound Payment Integration

**Status:** Approved (mock — EXP-008 S3)
**Feature slug:** rtp-receiving-integration
**Date:** 2026-06-21
**Skill version:** /definition

---

## Slicing strategy

**Sequential dependency chain with certification gate.** Epic 3 (certification) must run in parallel from day one. Story 2.2 is gated on AML spike. Story 2.3 is gated on fraud ADR. Story 3.2 is the final integration gate.

---

### Epic 1 — RTP Receiving Platform Integration

| Story | Title | Complexity | Scope stability | Depends on |
|-------|-------|-----------|----------------|------------|
| 1.1 | Inbound RTP payment message processing (ISO 20022 pacs.008) | 2 | Stable | Story 3.1 gap assessment started |
| 1.2 | Scheme acknowledgement — pacs.004 within 10-second timeout | 1 | Stable | Story 1.1 complete |

---

**Story 1.1 — Inbound RTP payment message processing**

*As a payment operations platform / I want to receive, parse, and validate inbound ISO 20022 pacs.008 messages / So that valid inbound payments are routed to the real-time processing layer*

**ACs:**
- AC1: Platform receives inbound pacs.008 messages from Payments NZ RTP Central Infrastructure
- AC2: Each pacs.008 is parsed and validated against the ISO 20022 schema; invalid messages are rejected
- AC3: Beneficiary account resolved from CdtrAcct; unknown accounts rejected with pacs.004 negative
- AC4: Duplicate pacs.008 detection — already-processed IDs are rejected without account credit
- AC5: Valid, non-duplicate pacs.008 messages routed to real-time processing layer within budget
- AC6: All messages logged to audit trail with receipt timestamp and routing decision
- AC7: Malformed messages discarded with error log and scheme error response

**NFRs:** Message receipt to processing-layer handoff P99 ≤ 500ms at 40,000 tph.

---

**Story 1.2 — Scheme acknowledgement**

*As a Payments NZ scheme participant / I want to send a pacs.004 within 10 seconds of each valid pacs.008 / So that the enterprise complies with scheme participation rules*

**ACs:**
- AC1: Successfully processed payment triggers pacs.004 positive sent within 10 seconds of pacs.008 receipt
- AC2: Processing timeout → pacs.004 negative (processing timeout reason); payment escalated for manual review
- AC3: Unknown/closed account → pacs.004 negative with appropriate scheme reason code
- AC4: AML hold → pacs.004 with hold reason code within scheme timeout
- AC5: Acknowledgement send time logged; any send at 9.5–10s triggers alert
- AC6: No pacs.008 may receive both positive and negative acknowledgement

**NFRs:** Scheme acknowledgement P99 ≤ 10 seconds from pacs.008 receipt at 40,000 tph.

---

### Epic 2 — Real-Time Processing Layer

| Story | Title | Complexity | Scope stability | Depends on |
|-------|-------|-----------|----------------|------------|
| 2.1 | Real-time account crediting — in-memory ledger and reconciliation | 3 | Stable (enterprise first) | Operations team reconciliation review |
| 2.2 | AML/CFT and sanctions screening at RTP scale | 3 | Stable (subject to AML spike) | T-AML-LOAD gate cleared |
| 2.3 | Real-time fraud pre-screening (rule-based) | 2 | Stable (subject to ADR) | Fraud architecture ADR approved |

---

### Epic 3 — Scheme Compliance and Performance Validation

| Story | Title | Complexity | Scope stability | Depends on |
|-------|-------|-----------|----------------|------------|
| 3.1 | Payments NZ Technical Compliance Certification gap remediation | 3 | Unstable (16 items unknown) | Begins day 1 — parallel workstream |
| 3.2 | End-to-end performance validation and scheme testing | 2 | Stable | All Epic 1 and 2 stories complete |

---

## Open questions

1. Applicable AML/CFT threshold for domestic RTP payments — Financial Crime Compliance to confirm
2. AML Screening Service scaling capacity at 40,000 tph — spike required
3. Content of 16 outstanding certification items — Story 3.1 gap assessment
4. Payments NZ timeline to confirm certification once submitted

---