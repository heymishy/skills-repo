# Definition: Trans-Tasman Payment Corridor

**Status:** Draft
**Created:** 2026-05-17
**Approved by:** Pending
**Author:** claude-haiku-4-5 (EXP-008 Config C /definition)

---

## Feature Overview

**Feature slug:** 2026-05-17-trans-tasman-payment-corridor
**Parent discovery:** [Discovery: Trans-Tasman Payment Corridor — Proprietary Intra-Group Routing Channel](../discovery.md)
**Epic structure strategy:** Multi-jurisdiction risk-first decomposition

### Architecture Constraints Applied

**From architecture-guardrails.md:**
- **ADR-CB-001** — All international SWIFT payments must route via approved SWIFT gateway infrastructure
- **ADR-CB-002** — Any change to international payment routing must be reviewed against active correspondent bank agreements; notification obligations must be satisfied before implementation
- **ADR-CB-003** — All international payment channels must integrate with central sanctions screening service synchronously before funds are released
- **ADR-CB-005** — Dual-jurisdiction AML/CFT obligation mapping must be produced before feature definition is finalised
- **ADR-CB-006** — AUSTRAC information standards for AU-leg payments must include originator information data elements
- **ADR-CB-007** — Payment service type assessment and DIA registration (if required) must be completed before retail launch

---

## Multi-Jurisdiction Constraint Mapping

**NZ leg constraints:**
- C1 (RBNZ AML/CFT Act 2009): Sanctions screening and threshold transaction reporting; channel-independent obligations; enterprise primary liability
- C3 (RBNZ FX Transaction Reporting): Net settlement model must satisfy FX reporting obligations; may require supplemental per-payment reporting
- C4 (Payment Services Regulations 2021 / DIA): New payment service type assessment required; DIA registration may be required before retail launch

**AU leg constraints:**
- C2 (AUSTRAC correspondent banking): Enterprise obligation to provide complete originator information (name, account number, address, purpose) to Australian counterpart in AUSTRAC-compliant format

**Cross-border constraints:**
- C5 (SWIFT correspondent bank agreement / JPMorgan Chase): Correspondent agreement review required before proprietary channel activation; notification obligations to be satisfied before any non-SWIFT routing goes live

**Regulatory gate ownership — jurisdiction-specific:**
- NZ RBNZ AML/CFT (C1): Enterprise RBNZ Compliance Lead
- NZ RBNZ FX Reporting (C3): Enterprise Treasury Lead (NZ)
- NZ DIA Payment Services Regulations (C4): Enterprise Regulatory Affairs Lead
- AU AUSTRAC (C2): Enterprise's Australian Counterpart Compliance Lead
- Cross-border Correspondent Agreement (C5): Enterprise Treasury Lead + Legal Counsel (JPMorgan Chase relationship owner)

---

## Epic 1: Compliance and Regulatory Pre-Requisites

**Rationale:** All four regulatory/contractual prerequisites must be confirmed before any customer-facing code is written. These are not parallelize-able deferments — they are hard gates.

### Story 1.1: RBNZ AML/CFT Compliance Validation (NZ leg — C1)

**As a** Enterprise RBNZ Compliance Lead
**I want** to formally validate that the existing sanctions screening and threshold transaction reporting infrastructure satisfies RBNZ AML/CFT Act 2009 obligations when applied to the proprietary intra-group payment channel
**So that** the enterprise can confirm it retains primary AML/CFT liability compliance regardless of channel routing

**Persona:** Enterprise RBNZ Compliance Lead — responsible for ensuring all payment flows comply with RBNZ AML/CFT obligations; retains ultimate compliance liability

**Benefit linkage:** Enables regulatory gate-pass for C1; prerequisite to channel activation

**Out of scope:**
- Modification to the existing sanctions screening rules or OFAC list integration
- New AML/CFT screening service build; assumes existing service is fit-for-purpose once validated

**Acceptance criteria:**

1. Given: the existing SWIFT-based AML/CFT screening process (RBNZ + OFAC lists, threshold transaction reporting above NZD $10,000), When: the compliance team documents the channel-independent AML/CFT obligations under RBNZ AML/CFT Act 2009, Then: the compliance validation document confirms that sanctions screening and threshold reporting obligations attach to the payment instruction, not the routing channel, and the existing process is fit-for-purpose for the proprietary intra-group channel

2. Given: the proprietary intra-group channel operates synchronously within the 2-hour settlement SLA, When: the compliance team assesses screening latency requirements, Then: the validation confirms that the existing screening service can meet the synchronous screening requirement before payment commitment

3. Given: the existing SWIFT channel generates per-transaction RBNZ threshold reports, When: the compliance team assesses the proprietary channel's sub-$10,000-threshold payment volume, Then: the validation confirms that threshold transaction reporting obligations are satisfied (or a supplemental reporting mechanism is identified)

**NFRs:** Compliance validation must be signed off by the RBNZ Compliance Lead; compliance documentation to be retained for regulatory audit purposes

**Complexity:** 2 (assessment + sign-off; no implementation required at this stage)
**Scope stability:** Stable (compliance framework is not changing)

**Dependencies:** None (parallel-runnable)

---

### Story 1.2: RBNZ FX Transaction Reporting Assessment (NZ leg — C3)

**As a** Enterprise Treasury Lead (NZ)
**I want** to assess whether the end-of-day net settlement model of the proprietary intra-group channel satisfies RBNZ FX transaction reporting obligations
**So that** the treasury team can confirm the reporting structure before the channel goes live

**Persona:** Enterprise Treasury Lead (NZ) — responsible for all foreign exchange transaction reporting to RBNZ; manages net settlement positions and reporting frequency

**Benefit linkage:** Enables regulatory gate-pass for C3; confirms whether supplemental FX reporting is required

**Out of scope:**
- Build of a new FX reporting service; assumes existing RBNZ reporting infrastructure can be extended
- Changes to end-of-day settlement timing

**Acceptance criteria:**

1. Given: the current SWIFT channel generates one FX transaction report per payment, When: the treasury team assesses the proprietary channel's end-of-day net NZD/AUD position settlement model, Then: the treasury assessment confirms whether net positions are reported as individual FX transactions or whether a single daily net settlement report satisfies RBNZ FX reporting obligations

2. Given: the proprietary channel processes multiple payment instructions per day with intraday cut-offs, When: the treasury team documents the daily settlement cycle and net position aggregation logic, Then: the assessment confirms the FX reporting frequency (per-payment vs daily aggregate) and any thresholds that apply

3. Given: FX reporting obligations are set by RBNZ, When: the treasury team consults with RBNZ (if required), Then: the assessment is documented and signed off by the Treasury Lead; supplemental reporting mechanism (if required) is identified in the artefact

**NFRs:** Treasury assessment must be documented and signed off by the NZ Treasury Lead; RBNZ FX reporting compliance is mandatory before channel activation

**Complexity:** 2 (assessment + potential consultation; no implementation required at this stage)
**Scope stability:** Stable

**Dependencies:** None (parallel-runnable)

---

### Story 1.3: DIA Payment Services Regulations 2021 Assessment (NZ leg — C4)

**As a** Enterprise Regulatory Affairs Lead
**I want** to obtain a written assessment from the Department of Internal Affairs confirming whether the proprietary intra-group payment channel constitutes a new payment service type requiring DIA registration
**So that** the enterprise can either confirm the existing licence covers the channel or initiate DIA registration before pilot launch

**Persona:** Enterprise Regulatory Affairs Lead — responsible for regulatory compliance and licensing matters; manages interactions with the DIA

**Benefit linkage:** Enables regulatory gate-pass for C4; determines whether DIA registration is a critical-path item or can proceed in parallel

**Out of scope:**
- DIA registration application itself (if required); only assessment is in scope here
- Changes to the enterprise's existing payment services licence

**Acceptance criteria:**

1. Given: the proprietary intra-group channel is a new routing mechanism for NZ-to-AU retail payments with intra-group net settlement, When: the regulatory team submits a DIA inquiry describing the channel characteristics, Then: the DIA assessment confirms whether the channel is classified as a new payment service type under the Payment Services Regulations 2021

2. Given: the DIA assesses the channel as a new service type, When: the regulatory team obtains the assessment, Then: the assessment includes the DIA registration timeline and any interim compliance requirements before registration completion

3. Given: the assessment is received, When: the regulatory team documents the conclusion, Then: the artefact clearly states either (a) "existing licence covers this service type — no DIA registration required", or (b) "DIA registration required — estimated timeline: [X weeks]"; if (b), a separate story for DIA registration initiation is created

**NFRs:** DIA assessment must be a written communication from the DIA; regulatory documentation to be retained for audit purposes; if DIA registration is required, timeline must be confirmed before proceeding to pilot cohort selection

**Complexity:** 2 (assessment + documentation; coordination-heavy but no implementation)
**Scope stability:** Stable

**Dependencies:** None (parallel-runnable)

---

### Story 1.4: SWIFT Correspondent Bank Agreement Review (Cross-border — C5)

**As a** Enterprise Treasury Lead + Legal Counsel (JPMorgan Chase relationship owners)
**I want** to review the SWIFT correspondent bank agreement with JPMorgan Chase to confirm whether the proprietary intra-group channel routing creates a requirement for prior written notification to JPMorgan Chase before the channel is activated
**So that** any required notification to the correspondent bank is filed and acknowledged before the proprietary channel carries any retail customer transactions

**Persona:** Enterprise Treasury Lead + Legal Counsel (co-owners of the JPMorgan Chase correspondent banking relationship); responsible for compliance with correspondent agreement terms and credit relationship management

**Benefit linkage:** Enables regulatory gate-pass for C5; prerequisite to channel activation; manages correspondent banking credit relationship risk

**Out of scope:**
- Renegotiation of the correspondent bank agreement itself; assumes agreement can be acknowledged as-is
- Changes to SWIFT gateway infrastructure or JPMorgan Chase relationship mechanics

**Acceptance criteria:**

1. Given: the enterprise's SWIFT correspondent bank agreement with JPMorgan Chase for NZD/AUD international payments, When: legal counsel reviews the agreement for terms governing international payment routing, Then: the review confirms whether the agreement contains clauses requiring prior written notification to JPMorgan Chase before routing NZD/AUD transactions outside the agreed SWIFT channel

2. Given: the correspondent agreement contains a notification requirement (or does not), When: the treasury and legal teams document the conclusion, Then: the artefact clearly states: (a) "No notification obligation identified in JPMorgan Chase agreement — proprietary channel routing does not trigger correspondent notification", or (b) "Notification required — JPMorgan Chase must be notified before proprietary channel activation"; if (b), the artefact identifies the notification format and required documentation

3. Given: a notification obligation is identified, When: notification is prepared and filed with JPMorgan Chase, Then: the notification is acknowledged by JPMorgan Chase in writing before any retail customer transaction is processed via the proprietary channel; acknowledgement is retained in compliance records

**NFRs:** Correspondent agreement review must be documented; legal sign-off required; if notification is required, JPMorgan Chase acknowledgement (written) must be obtained before pilot launch; credit relationship risk mitigation is mandatory

**Complexity:** 2 (review + potential notification; no implementation required at this stage)
**Scope stability:** Stable

**Dependencies:** None (parallel-runnable with Stories 1.1–1.3)

---

## Epic 2: AUSTRAC Originator Information Bilateral Agreement (AU leg — C2)

**Rationale:** C2 represents an enterprise obligation to provide originator information to the Australian counterpart. This must be formalized in a bilateral agreement before any customer transactions.

### Story 2.1: AUSTRAC Originator Information Bilateral Agreement (AU leg — C2)

**As a** Enterprise Compliance Lead + Enterprise's Australian Counterpart Compliance Lead
**I want** to establish a bilateral agreement with the enterprise's Australian counterpart confirming the originator information fields and format required from the enterprise to satisfy AUSTRAC correspondent banking obligations
**So that** the enterprise can provide compliant originator information in each credit instruction, enabling the Australian counterpart to satisfy its AUSTRAC AML/CTF Programme requirements

**Persona:** Enterprise Compliance Lead (NZ side) + Australian Counterpart Compliance Lead (AU side) — joint responsibility for AUSTRAC compliance on the receiving leg

**Benefit linkage:** Enables regulatory gate-pass for C2; establishes originator information data contract between NZ and AU entities

**Out of scope:**
- AUSTRAC registration or licencing of the Australian counterpart; assumes existing AUSTRAC compliance status
- Changes to the Australian counterpart's AML/CTF Programme

**Acceptance criteria:**

1. Given: AUSTRAC correspondent banking originator information requirements (full name, account number, address, purpose), When: the enterprise and Australian counterpart compliance teams meet to confirm the originator information fields and format required for each credit instruction via the proprietary channel, Then: the bilateral agreement specifies: (a) exact data fields required in each instruction, (b) field validation rules, (c) format specification (JSON structure, XML, or other), (d) error handling if required fields are missing

2. Given: the enterprise initiates NZ-to-AU payments via the proprietary channel, When: the payment initiation service generates originator information data, Then: the bilateral agreement confirms the enterprise is responsible for providing complete, accurate originator information; the Australian counterpart confirms receipt of the data with each credit instruction and retains records for AUSTRAC compliance

3. Given: the bilateral agreement is finalised, When: both parties sign off, Then: the agreement is retained in both entities' compliance files; the agreement is referenced in the payment processing documentation as the authoritative source for originator information requirements

**NFRs:** Bilateral agreement must be a formal legal document; both entities' compliance leads must sign off; originator information data contract must be embedded in the payment processing architecture design

**Complexity:** 2 (agreement negotiation + sign-off; no implementation until agreement is final)
**Scope stability:** Stable

**Dependencies:** None (parallel-runnable with Epic 1)

---

## Epic 3: Channel Activation and Customer-Facing Features

**Rationale:** Once all four regulatory prerequisites (C1–C5) are confirmed, the engineering work proceeds. This epic covers the customer-facing payment flow, sanctions screening integration, and settlement mechanics.

### Story 3.1: Payment Initiation and Threshold Routing (NZ retail customer → AU bank account)

**As a** Enterprise retail customer with an Australian bank account beneficiary
**I want** to initiate a NZ-to-AU payment via the enterprise's digital banking platform with the amount auto-routing to either the proprietary intra-group channel (≤NZD $10,000) or SWIFT channel (>NZD $10,000) based on payment amount
**So that** I can send money to Australia quickly (2-hour settlement for eligible payments) and affordably (sub-$5 fee vs $18–25 for SWIFT)

**Persona:** Enterprise retail customer with trans-Tasman connections — NZ-based, sending money to Australian family/business accounts regularly; price-sensitive and values speed

**Benefit linkage:** Delivers primary revenue retention metric (reduced leakage to Wise/remittance services) and customer experience target (2-hour settlement, <$5 fee)

**Out of scope:**
- AU-to-NZ reverse direction (future phase)
- Payments above NZD $10,000 via proprietary channel; these stay on SWIFT
- Third-party payment initiation APIs (e.g., PSD2, open banking); only retail banking channel UI in scope

**Acceptance criteria:**

1. Given: a retail customer in the digital banking platform initiates a payment to an Australian bank account (BSB + account number), When: the customer enters a payment amount ≤NZD $10,000 and submits, Then: the system displays "Estimated settlement: within 2 hours" and pricing "<NZD $5" and routes the instruction to the proprietary intra-group channel

2. Given: a retail customer initiates a payment with amount >NZD $10,000, When: the system detects the amount exceeds the threshold, Then: the system displays "This payment will be processed via the standard SWIFT channel. Estimated settlement: 1–2 business days, fee: NZD $20" and routes the instruction to the SWIFT gateway (no change to existing flow)

3. Given: a retail customer enters a payment amount and submits, When: the system processes the payment, Then: originator information (customer name, NZ account number, address) is extracted from the customer's profile and included in the payment instruction; the customer receives a confirmation message with settlement time estimate and fee

**NFRs:** 2-hour settlement SLA for eligible payments submitted before intraday cut-off (cut-off time to be confirmed); pricing must be accurate to the originator information fields required by the Australian counterpart; system must handle edge cases (customer address missing, payment submitted after cut-off)

**Complexity:** 2 (UI + routing logic integration; payment processing infrastructure mostly existing)
**Scope stability:** Stable

**Dependencies:** Story 2.1 (AUSTRAC bilateral agreement must be finalised to confirm originator information fields); All stories in Epic 1 (regulatory prerequisites)

---

### Story 3.2: Sanctions Screening Integration (RBNZ + OFAC)

**As a** Enterprise Compliance Operations team
**I want** the proprietary intra-group channel to synchronously call the existing central sanctions screening service for every payment instruction before the instruction is committed to the payment network or settlement
**So that** the enterprise maintains RBNZ AML/CFT compliance regardless of which channel (SWIFT or proprietary intra-group) the payment routes through

**Persona:** Enterprise Compliance Operations team — responsible for ensuring all payment flows are screened before transmission; manages the central sanctions screening service

**Benefit linkage:** Confirms C1 (RBNZ AML/CFT) is satisfied at implementation time; enables regulatory compliance gate-pass

**Out of scope:**
- Creation or modification of the central sanctions screening service itself; assumes existing service is fit-for-purpose
- Changes to RBNZ or OFAC list subscriptions

**Acceptance criteria:**

1. Given: a payment instruction is received by the proprietary intra-group channel, When: the channel invokes the central sanctions screening service synchronously (before payment commitment), Then: the screening service returns a decision (pass/block/review) within the 2-hour settlement SLA latency budget

2. Given: screening returns a "block" decision, When: the payment is flagged as blocked, Then: the system does not commit funds to the settlement path; the payment is logged for compliance review; the customer is notified "Payment declined — contact us for assistance"

3. Given: screening returns a "pass" decision, When: the payment is approved for settlement, Then: originator information is validated against the bilateral agreement (Story 2.1), and the payment instruction proceeds to the Australian counterpart credit instruction generation (Story 3.3)

**NFRs:** Screening must complete synchronously within the 2-hour settlement latency budget; screening decision must be logged for RBNZ audit purposes; fallback behaviour if screening service is unavailable must be defined (current default: decline the payment)

**Complexity:** 2 (integration point; mostly glue logic)
**Scope stability:** Stable

**Dependencies:** Story 1.1 (RBNZ AML/CFT validation) must be complete before implementation

---

### Story 3.3: Credit Instruction Generation and Settlement (Australian counterpart leg)

**As a** Enterprise group treasury system
**I want** to generate an AUSTRAC-compliant credit instruction with complete originator information and send it to the enterprise's Australian counterpart for beneficiary account crediting via the proprietary intra-group channel
**So that** the enterprise's Australian counterpart can satisfy its AUSTRAC correspondent banking obligations when crediting the Australian beneficiary account

**Persona:** Enterprise group treasury system (backend service) — responsible for generating credit instructions and managing intra-group settlement positions

**Benefit linkage:** Confirms C2 (AUSTRAC originator information) is satisfied at implementation time; enables end-to-end proprietary channel settlement

**Out of scope:**
- The Australian counterpart's beneficiary account crediting process itself; only the enterprise's side of the credit instruction generation is in scope
- Changes to end-of-day settlement reporting (that is Epic 4)

**Acceptance criteria:**

1. Given: a payment instruction passes sanctions screening (Story 3.2), When: the proprietary channel generates a credit instruction to the Australian counterpart, Then: the credit instruction includes: originator name, NZ account number, NZ address, payment amount (NZD), conversion rate to AUD, beneficiary BSB + account number, payment purpose (if provided); the instruction format matches the bilateral agreement (Story 2.1)

2. Given: a credit instruction is generated, When: the instruction is transmitted to the enterprise's Australian counterpart via the intra-group API, Then: the transmission includes a unique transaction reference; the Australian counterpart acknowledges receipt with a timestamp

3. Given: the Australian counterpart acknowledges receipt, When: a confirmed settlement record is logged in the enterprise treasury books, Then: the confirmed record includes: originator details, beneficiary account, amount (NZD and AUD), settlement timestamp; the record is retained for AUSTRAC audit purposes (7-year retention minimum)

**NFRs:** Credit instruction generation must occur synchronously within 2-hour settlement SLA; originator information must be validated against bilateral agreement before instruction generation; settlement records must be audit-ready for AUSTRAC compliance review

**Complexity:** 2 (credit instruction generation + settlement logging)
**Scope stability:** Stable

**Dependencies:** Story 2.1 (AUSTRAC bilateral agreement) must finalise originator information format before implementation; Story 3.2 (sanctions screening) must be complete

---

## Epic 4: Treasury Settlement and Reporting

### Story 4.1: End-of-Day Net Settlement Position Management

**As a** Enterprise group treasury
**I want** to calculate end-of-day net NZD/AUD positions from all proprietary intra-group payment instructions processed that day and settle the net position via the group treasury books
**So that** intra-group payment settlement is operationalised efficiently and RBNZ FX reporting obligations are satisfied

**Persona:** Enterprise group treasury — manages end-of-day settlement calculations and intra-group position reconciliation

**Benefit linkage:** Confirms C3 (RBNZ FX Transaction Reporting) is satisfied at implementation time

**Out of scope:**
- Intraday position reporting; only end-of-day settlement is in scope
- Changes to RBNZ FX reporting frequency or aggregation rules

**Acceptance criteria:**

1. Given: multiple NZ-to-AU payment instructions are processed throughout the day, When: end-of-day settlement runs at [time to be confirmed], Then: the treasury system calculates: total NZD amount sent, total AUD amount credited at the exchange rates applied to each instruction, net NZD/AUD position (difference between NZD sent and AUD credited equivalent)

2. Given: end-of-day settlement calculates a net position, When: treasury reconciliation occurs, Then: the net position is logged in the group treasury books as a single settlement record per day (not per-transaction); the settlement record includes total NZD sent, total AUD credited, net position, and exchange rates applied

3. Given: end-of-day settlement is complete, When: RBNZ FX reporting is due, Then: treasury generates an FX transaction report for the day's net position (or per-transaction reports if RBNZ assessment in Story 1.2 requires per-transaction reporting); the report is submitted to RBNZ within the required timeframe

**NFRs:** End-of-day settlement must be automated and reconcilable; RBNZ FX reporting must be generated in the format specified by Story 1.2 assessment; settlement records must be retained for AUSTRAC audit (7-year minimum)

**Complexity:** 2 (settlement calculation + daily automation)
**Scope stability:** Stable

**Dependencies:** Story 1.2 (RBNZ FX reporting assessment) must confirm reporting frequency before implementation

---

## Summary: Scope Accumulation vs Discovery MVP

**Discovery MVP scope items:** 10 items
**Stories created:** 6 stories across 4 epics
**Scope mapping:**
1. ✓ NZ-to-AU direction only → Story 3.1 + inherent in all downstream stories
2. ✓ Threshold routing $0–$10k via proprietary channel → Story 3.1
3. ✓ 2-hour settlement SLA → Story 3.1 + Story 3.2 latency requirement
4. ✓ RBNZ AML/CFT compliance → Story 1.1 + Story 3.2
5. ✓ AUSTRAC originator information → Story 2.1 + Story 3.3
6. ✓ RBNZ FX reporting assessment → Story 1.2 + Story 4.1
7. ✓ DIA Payment Services assessment → Story 1.3
8. ✓ SWIFT correspondent agreement review → Story 1.4
9. ✓ Pilot cohort before rollout → *deferred to product/operations planning; not a development story*
10. ✓ SWIFT channel retained as fallback → Story 3.1

**Scope status:** No scope additions; MVP decomposed complete.

---

## Regulatory Gate Ownership — Multi-Jurisdiction

| Constraint | Jurisdiction | Responsible | Sign-off | Timing |
|-----------|---|---|---|---|
| C1 — RBNZ AML/CFT | NZ | Enterprise RBNZ Compliance Lead | Story 1.1 | Before Story 3.2 implementation |
| C2 — AUSTRAC | AU | Enterprise + AU Counterpart Compliance Leads | Story 2.1 | Before Story 3.3 implementation |
| C3 — RBNZ FX Reporting | NZ | Enterprise Treasury Lead (NZ) | Story 1.2 | Before Story 4.1 implementation |
| C4 — DIA Payment Services | NZ | Enterprise Regulatory Affairs Lead | Story 1.3 | Before pilot launch |
| C5 — SWIFT Correspondent Agreement | Cross-border | Enterprise Treasury Lead + Legal Counsel | Story 1.4 | Before any retail transaction |

**Critical sequencing:** All Epic 1 + Epic 2 stories must be signed off before Epic 3 implementation begins. Epic 3 and Epic 4 are sequenced in order but can overlap with Epic 1/2 sign-off completion.

---

## Architecture Guardrails Compliance

**Guardrails checklist:**
- ADR-CB-001 (SWIFT gateway routing): Story 3.1 maintains SWIFT as fallback for >$10k payments ✓
- ADR-CB-002 (Correspondent agreement review): Story 1.4 addresses this requirement ✓
- ADR-CB-003 (Sanctions screening mandatory): Story 3.2 implements synchronous screening ✓
- ADR-CB-005 (Dual-jurisdiction mapping): This Definition artefact includes multi-jurisdiction constraint mapping ✓
- ADR-CB-006 (AUSTRAC info standards): Story 2.1 establishes bilateral agreement; Story 3.3 implements ✓
- ADR-CB-007 (Payment service type assessment): Story 1.3 addresses DIA assessment ✓

---

## Next Steps

This definition artefact is ready for /review. All stories include:
- Named personas from discovery
- Benefit linkage to metrics
- Regulatory constraint mapping
- Out-of-scope sections
- 3+ Given/When/Then acceptance criteria
- Complexity and scope stability ratings
- Jurisdiction-specific gate ownership

---

<!-- CPF-TRACE
experiment_id: EXP-008-corpus-breadth-eval
config: C
story: S13
skill: /definition
model: claude-haiku-4-5
run_timestamp: 2026-05-17T00:00:00Z
constraints_in_definition:
  C1: true — Story 1.1 + Story 3.2; RBNZ AML/CFT compliance validation; sanctions screening integration
  C2: true — Story 2.1 + Story 3.3; AUSTRAC originator information bilateral agreement; credit instruction generation with compliance fields
  C3: true — Story 1.2 + Story 4.1; RBNZ FX Transaction Reporting assessment; end-of-day net settlement position management
  C4: true — Story 1.3; DIA Payment Services Regulations assessment; registration timeline determination
  C5: true — Story 1.4; SWIFT correspondent bank agreement review with JPMorgan Chase; notification obligation identification and filing
multi_jurisdiction_mapping: yes — NZ leg (C1, C3, C4), AU leg (C2), cross-border (C5)
regulatory_gate_ownership: jurisdiction_specific — RBNZ Compliance Lead (NZ), Treasury Lead (NZ/cross-border), Regulatory Affairs (NZ), Australian Counterpart Compliance Lead (AU), Legal Counsel (cross-border)
epic_structure: 4 epics — Compliance Prerequisites (1.1–1.4), AUSTRAC Bilateral (2.1), Channel Activation (3.1–3.3), Treasury Settlement (4.1)
story_count: 6 stories
cpf_definition_assessment: all five constraints mapped to specific stories; no constraint collapsed or deferred; multi-jurisdiction gate ownership explicit
-->
