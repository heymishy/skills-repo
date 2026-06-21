# Discovery: NZ Real-Time Payments (RTP) — Inbound Payment Integration

**Status:** Approved (mock — EXP-008 S3)
**Feature slug:** rtp-receiving-integration
**Date:** 2026-06-21
**Skill version:** /discovery

---

## Problem statement

Payments NZ is launching the national real-time payments scheme. The enterprise is a signed scheme participant required to be live as a receiving participant by 2026-09-01 — a hard contractual commitment backed by a $50,000/day financial penalty and potential scheme suspension.

The enterprise's current payment infrastructure uses batch processing with same-day settlement. The RTP scheme requires inbound payments to be received, processed, and acknowledged within 10 seconds, 24 hours a day, 7 days a week.

Three unresolved architectural risks must be addressed before the integration design can be committed:

1. **AML latency at RTP peak load:** The AML Screening Service has a P99 of 8s at 10,000 tph. RTP peak is 40,000 tph. A spike is required before the architecture can be finalised.
2. **Fraud screening real-time capability:** The fraud system operates in batch mode. A vendor real-time API is in beta with no SLA and no security assessment. Architecture decision required.
3. **Scheme certification completion (C5 — PRECONDITION):** 16 of 47 Payments NZ Technical Compliance Certification items have not been reviewed. Scheme admission — required for production access — is not yet granted.

---

## Personas

| Persona | Role | Stake |
|---------|------|-------|
| Enterprise customers | Recipients of inbound real-time payments | Expect immediate 24/7 account credit |
| Payments NZ scheme operations | Govern the national RTP scheme | Grant or revoke scheme admission; impose penalties |
| Enterprise payment operations | Operate the real-time processing layer | Own operational model; accountable for reconciliation |
| Financial Crime Compliance | Own AML/CFT obligation | Must confirm real-time AML design satisfies AML/CFT Act 2009 |

---

## MVP scope

1. Inbound RTP payment message processing — receive, parse, and validate ISO 20022 pacs.008 messages
2. Real-time account crediting — credit beneficiary accounts immediately via in-memory ledger; reconcile with batch core at end of day
3. AML/CFT and sanctions screening — synchronous integration within the 10-second acknowledgement budget
4. Fraud pre-screening — rule-based pre-screen within 10-second window; vendor beta API out of scope
5. Scheme acknowledgement — pacs.004 response within 10-second scheme timeout
6. Payments NZ Technical Compliance Certification gap remediation — complete all 16 outstanding items before go-live

**Out of scope:** Outbound (sending) RTP, core banking batch changes, AML infrastructure scaling, recall processing (Phase 2), customer notifications.

---

## Constraints

| ID | Constraint | Type | Status |
|----|-----------|------|--------|
| C1 | Scheme participation — live by 2026-09-01; $50k/day penalty | Regulatory | Active — hard deadline |
| C2 | AML/CFT Act 2009 — screening mandatory before account credit | Regulatory | Active |
| C3 | 10-second acknowledgement window — hard scheme rule | Technical/scheme | Active |
| C4 | Fraud screening required; batch-only system; fraud ADR required | Technical | Active |
| C5 | [PRECONDITION] 16 of 47 certification items outstanding; scheme admission not yet granted | Scheme certification | **PRECONDITION** |

---

## Success indicators

1. Scheme go-live achieved by 2026-09-01 with no penalty incurred
2. All 47 Payments NZ Technical Compliance Certification items confirmed complete; scheme admission reference received
3. End-to-end P99 ≤ 10 seconds at 40,000 tph validated by load test
4. AML/CFT Act 2009 obligations confirmed satisfied by Financial Crime Compliance
5. End-of-day reconciliation completes within settlement window with zero unresolved discrepancies

---

## Assumptions

1. AML Screening Service can scale to 40,000 tph at P99 ≤ 6 seconds — **unconfirmed; spike required**
2. Rule-based fraud pre-screen can execute within 1 second at peak — **to be validated**
3. 16 outstanding certification items do not contain blocking architectural requirements — **unconfirmed**
4. In-memory ledger + end-of-day reconciliation can be implemented without unacceptable settlement risk — **operations team review required**