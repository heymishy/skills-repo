# Synthetic EA Registry Entries
# Applications: Payments NZ RTP Infrastructure (External) + AML Screening Service (Internal) + Fraud Detection Platform (Internal)
# Registry version: 2026-Q1
# Entry type: External scheme (1) + Internal applications (2)
# SYNTHETIC DOCUMENT — for EXP-003-pipeline-eval evaluation only
# Note: Payments NZ scheme rules are embedded in this entry. No separate policy doc required for S3 runs.

---

## Application Profile 1 — Payments NZ Real-Time Payments (RTP) Central Infrastructure

**Name:** Payments NZ RTP Central Infrastructure
**Owner:** Payments NZ (external scheme operator)
**Domain:** Payments / Real-Time Payments Scheme
**Classification:** External — regulated payment scheme; mandatory participation standards apply
**Criticality:** CRITICAL — scheme infrastructure; all participant payment submissions route through this
**Data classification:** Confidential — payment instructions, ISO 20022 message content, participant settlement data

**Description:**
The national real-time payments infrastructure operated by Payments NZ. Participants connect via a standardised ISO 20022 messaging interface. Payments are settled with a 10-second end-to-end acknowledgement commitment — the scheme guarantees the receiving participant will acknowledge within this window. The enterprise is applying for full participant status. Full participant status requires completing a Payments NZ Technical Compliance Certification, covering 47 technical and operational compliance items, before production access is granted.

**Hosting:** Payments NZ-managed
**Message standard:** ISO 20022 (pacs.008, pacs.004, camt.056, camt.029)
**Scheme rules version:** RTP Participation Rules v2.4 (current)

---

## Interface Map — Payments NZ RTP

### Inbound (messages received by the enterprise from Payments NZ RTP)

| Interface ID | Message type | Description | Notes |
|-------------|-------------|-------------|-------|
| RTP-IN-001 | pacs.008 | Inbound credit transfer instruction | Received for payments sent to the enterprise's customers |
| RTP-IN-002 | camt.056 | Payment recall request | Counterparty requesting recall of a sent payment |
| RTP-IN-003 | pacs.004 | Return of funds | Settlement return from Payments NZ |

### Outbound (messages sent by the enterprise to Payments NZ RTP)

| Interface ID | Message type | Description | Notes |
|-------------|-------------|-------------|-------|
| RTP-OUT-001 | pacs.008 | Outbound credit transfer instruction | Customer-initiated payment to another participant |
| RTP-OUT-002 | camt.056 | Payment recall initiation | The enterprise initiating a recall of a sent payment |

### Compliance certification requirements

| Item | Description | Status (as of registry date) |
|------|-------------|------------------------------|
| Technical Compliance Certification | 47-item checklist covering message schema validation, end-to-end latency, error handling, settlement reconciliation, sanctions screening, recall processing | **31 items self-assessed complete; 16 items not yet assessed or in progress** |
| Scheme admission | Full participant status; requires signed Participation Agreement + completed certification | NOT YET GRANTED |
| Production access | Granted by Payments NZ only after successful certification | PENDING CERTIFICATION |

### Regulatory obligations affecting integration

| Obligation | Regulator | Relevant provision |
|-----------|-----------|------------------|
| AML/CFT — must not transmit payment instructions without completing AML/CFT screening obligations | DIA / RBNZ | Anti-Money Laundering and Countering Financing of Terrorism Act 2009 |
| Sanctions screening — must screen payment beneficiaries and originators against applicable sanctions lists before payment release | RBNZ / MFaT | Financial Sanctions (Russia — Invasion of Ukraine) Regulations and standing sanctions obligations |
| RTP scheme rules — participants must meet all technical and operational requirements before scheme admission | Payments NZ | RTP Participation Rules v2.4 |

### Known constraints and risks

| ID | Description | Severity |
|----|-------------|---------|
| RTP-RISK-001 | Certification status: Multiple items in the Payments NZ Technical Compliance Certification have not yet been fully self-assessed or confirmed as complete. Areas with incomplete coverage include message handling scenarios, end-to-end performance under peak load, and AML/CFT screening evidence. Full certification status has not been confirmed with Payments NZ. | HIGH |
| RTP-RISK-002 | 10-second acknowledgement: scheme requires end-to-end acknowledgement within 10 seconds. Any upstream dependency (AML screening, fraud platform, core banking) that adds latency must complete within this window. Integration design must budget for realistic latency at peak load. | HIGH — design constraint |
| RTP-RISK-003 | Scheme rule changes: Payments NZ publishes scheme rule updates periodically. Participants are required to implement rule changes within specified timeframes. A version governance process must be in place. | MEDIUM |

---

## Application Profile 2 — AML Screening Service

**Name:** AML Screening Service
**Owner:** Financial Crime Compliance, the enterprise
**Domain:** Financial Crime / AML/CFT
**Classification:** Internal — regulated service (AML/CFT Act compliance)
**Criticality:** CRITICAL — mandatory for payment release; failure to screen is a regulatory breach
**Data classification:** Restricted — customer identity data, sanctions lists, screening results

**Description:**
Internal real-time API service that screens payment instructions against AML/CFT watchlists, PEP lists, and applicable financial sanctions lists before payment release. Currently integrated with the domestic payments infrastructure (BECS, internet banking). The service is a mandatory dependency for any new payment channel. Current performance: P99 latency 8 seconds at 10,000 transactions per hour (tph). Has not been load-tested at volumes above 10,000 tph.

**Hosting:** On-premises
**Technology stack:** Java API, internal sanctions list management, third-party watchlist feed (World-Check)
**Environments:** Production, UAT, Development

---

## Interface Map — AML Screening Service

### Upstream (inputs to screening service)

| Interface ID | Source | Data type | Notes |
|-------------|--------|-----------|-------|
| AML-IN-001 | Any payment initiation platform | Payment instruction: originator details, beneficiary details, amount, currency, reference | Call made before payment is committed or transmitted |

### Downstream (outputs from screening service)

| Interface ID | Consumer | Output | Notes |
|-------------|---------|--------|-------|
| AML-OUT-001 | Payment initiation platform | Screen result: CLEAR / MATCH / REFER; match details if applicable | CLEAR = proceed; MATCH = hold for compliance team; REFER = hold for analyst review |

### Regulatory obligations

| Obligation | Regulator | Relevant provision |
|-----------|-----------|------------------|
| AML/CFT pre-release screening — payments above $1,000 threshold must be screened against AML/CFT watchlists before release | DIA | AML/CFT Act 2009, s.26 (ongoing customer due diligence); s.46 (suspicious transaction reporting) |
| Financial sanctions — all payment parties must be screened against financial sanctions lists | RBNZ / MFaT | Financial Sanctions regulations |

### Known constraints and risks

| ID | Description | Severity |
|----|-------------|---------|
| AML-RISK-001 | Peak volume performance: current P99 latency is 8 seconds at 10,000 tph. RTP peak volume is estimated at 40,000 tph. The AML Screening Service has not been load-tested at this volume. At 8s P99 and 40,000 tph, many calls will exceed the 10-second RTP acknowledgement window even before other integration components are counted. Performance testing at RTP peak volume is required before production go-live. | CRITICAL — potential scheme compliance failure |
| AML-RISK-002 | Synchronous call in RTP flow: the AML service must be called synchronously (scheme rules require screening before release). Any AML service degradation during peak RTP volume will directly affect RTP payment success rates. A resilience and fallback design is required. | HIGH |
| AML-RISK-003 | AML/CFT Act threshold: the $1,000 threshold applies to international payments. For domestic RTP payments, the applicable threshold and monitoring obligations should be confirmed with Financial Crime Compliance before go-live. | MEDIUM |

---

## Application Profile 3 — Fraud Detection Platform

**Name:** Fraud Detection Platform
**Owner:** Financial Crime Compliance, the enterprise
**Domain:** Financial Crime / Fraud
**Classification:** Internal
**Criticality:** HIGH — key fraud loss prevention control
**Data classification:** Restricted — customer transaction data, fraud signals, model scores

**Description:**
Internal fraud detection system. Currently operates in batch mode: processes transaction files nightly to identify fraud patterns and flags for next-day investigation. A vendor beta real-time scoring API has been offered by the fraud platform vendor, but this API has not been formally adopted, tested at volume, or integrated into any production payment flow. All production fraud detection is currently batch mode.

**Hosting:** On-premises (batch); vendor-hosted (real-time API — beta)
**Technology stack:** Batch: internal ETL pipeline + vendor fraud model; Real-time: vendor REST API (beta)
**Environments:** Production (batch), Development (real-time integration — not started)

---

## Interface Map — Fraud Detection Platform

| Interface ID | Application | Interface type | Notes |
|-------------|-------------|---------------|-------|
| FDP-BATCH-001 | Core banking transaction data | Internal — nightly file extract | Batch mode only; not suitable for real-time payment flow |
| FDP-RT-001 | (Proposed) Payment initiation platform | External — vendor REST API (beta) | Not tested at production volumes; not adopted for any live integration; beta status from vendor |

### Known constraints and risks

| ID | Description | Severity |
|----|-------------|---------|
| FDP-RISK-001 | No real-time production integration: the real-time API is vendor beta. It has not been tested at RTP-equivalent volumes, has no SLA, and has not been through the enterprise's security assessment process. It cannot be relied upon as a production control for real-time payment fraud detection without completing these steps. | HIGH |
| FDP-RISK-002 | Batch mode incompatibility: the current batch fraud detection cannot operate within the RTP 10-second window. If the real-time API cannot be made production-ready, an alternative fraud detection approach must be designed for the RTP integration. | HIGH — design gap |

---

## Dependencies

**RTP integration depends on:**
- AML Screening Service — mandatory synchronous call before payment release (scheme rules)
- Fraud Detection Platform — real-time integration required for RTP channel (real-time API not yet production-ready)
- Core Banking — payment origination and account validation

**AML Screening Service capacity dependency:**
- Current infrastructure supports 10,000 tph at P99 ≤8s
- RTP peak load (~40,000 tph) requires capacity assessment and potential infrastructure scaling before go-live
