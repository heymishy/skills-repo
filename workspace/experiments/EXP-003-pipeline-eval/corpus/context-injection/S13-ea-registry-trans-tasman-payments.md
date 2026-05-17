# Synthetic EA Registry Entry
# Application: Trans-Tasman Payment Routing Service (the enterprise)
# Registry version: 2026-Q1
# Status: PLANNED — no existing implementation; this entry models the proposed architecture
# Entry type: New Internal Application (payments programme)

---

## Application Profile

**Name:** Trans-Tasman Payment Routing Service
**Owner:** Payments Technology, the enterprise
**Domain:** Retail Payments / Cross-Border Payments
**Classification:** Regulated — RBNZ AML/CFT Act 2009, Payment Services Regulations 2021, AUSTRAC (Australian leg), RBNZ FX Transaction Reporting
**Criticality:** HIGH — handles retail customer funds; failure results in lost customer payments
**Data classification:** Restricted — customer payment instructions, account identifiers, beneficiary information, AML/CFT screening results

**Description:**
New intra-group payment routing service that routes NZ retail customer payment instructions to Australian beneficiary accounts via a proprietary the enterprise group channel, bypassing the standard SWIFT international payment flow. Positions between the enterprise and the enterprise's Australian counterpart are settled in the group treasury books at end-of-day. Customer-facing settlement time: 2 hours. Target pricing: under $5 for payments up to $10,000 (standard SWIFT route applies above $10,000).

**Hosting:** Azure (shared with existing digital banking platform)
**Technology stack:** Node.js routing service, Azure Service Bus (payment instruction queue), integration with the enterprise AML/CFT screening service, integration with the enterprise group Treasury API (position management)
**Environments:** Production (planned), UAT, Development

---

## Interface Map

### Inbound (customer instruction source)

| Interface ID | Application | Interface type | Data transferred | Notes |
|-------------|-------------|---------------|-----------------|-------|
| TTPS-IN-001 | Retail Digital Banking Platform | Internal API | Payment instruction: originator account, amount, currency, beneficiary name + Australian BSB + account number | Instruction acceptance; amount threshold routing logic here |
| TTPS-IN-002 | Phone Banking System | Internal API | Same payment instruction fields | Phone banking channel — lower volume |

### Compliance/screening interfaces

| Interface ID | Application | Interface type | Data transferred | Notes |
|-------------|-------------|---------------|-----------------|-------|
| TTPS-SCR-001 | AML/CFT Sanctions Screening Service | Internal — synchronous | Payment instruction details → screening decision (pass/block/review) | RBNZ and OFAC lists; existing service re-used from SWIFT flow |
| TTPS-REP-001 | RBNZ Threshold Transaction Reporting Module | Internal — batch | Payments above NZD $10,000 → transaction report record | Existing reporting infrastructure; must confirm coverage for intra-group channel |

### Routing interfaces

| Interface ID | Application | Interface type | Data transferred | Notes |
|-------------|-------------|---------------|-----------------|-------|
| TTPS-ROUTE-001 | the enterprise group Treasury Intra-Group API | Internal — cross-entity | Screened payment instruction → AU credit instruction + NZD/AUD settlement position update | Proprietary channel — replaces SWIFT for eligible transactions. Correspondent banking relationship implications to be assessed before activation. |
| TTPS-SWIFT-001 | SWIFT International Payment Gateway | External (via correspondent bank JPMorgan Chase) | Payment instruction + originator data → SWIFT MT103 | Standard SWIFT channel — used for payments above $10,000 and for any country outside Australia |

### Settlement and confirmation

| Interface ID | Application | Interface type | Data transferred | Notes |
|-------------|-------------|---------------|-----------------|-------|
| TTPS-SET-001 | the enterprise group Treasury — Net Settlement | Internal — end-of-day batch | NZD/AUD net positions from all intra-group transactions that day | RBNZ FX transaction reporting obligation — see TTPS-RISK-003 |
| TTPS-CONF-001 | Customer Notification Service | Internal | Payment confirmation message to originating customer | 2-hour settlement confirmation |

### Regulatory and licensing interfaces

| Interface ID | Application | Interface type | Data transferred | Notes |
|-------------|-------------|---------------|-----------------|-------|
| TTPS-REG-001 | DIA Payment Services Register | External — DIA | New payment service registration (if required) | See TTPS-RISK-002 — DIA registration status not confirmed |
| TTPS-REG-002 | AUSTRAC Correspondent Banking — the enterprise's Australian counterpart | External (via the enterprise's Australian counterpart compliance) | Originator information bundle: name, NZ account number, NZ address, amount, purpose | Required for the enterprise's Australian counterpart to satisfy AUSTRAC correspondent banking obligations; format and content requirements must be confirmed with the enterprise's Australian counterpart compliance team |

---

## Regulatory obligations

| Obligation | Regulator | NZ or AU | Detail |
|-----------|-----------|---------|--------|
| RBNZ AML/CFT Act 2009 — sanctions screening on all outbound international payments | RBNZ | NZ | Applies regardless of routing channel; the enterprise retains primary AML/CFT liability |
| RBNZ AML/CFT Act 2009 — threshold transaction reporting (payments above NZD $10,000) | RBNZ | NZ | Reporting obligation survives change of routing channel |
| Payment Services Regulations 2021 — DIA registration for new payment service types | DIA | NZ | New proprietary channel may constitute a new payment service requiring DIA registration before launch |
| RBNZ FX Transaction Reporting — end-of-day net settlement of NZD/AUD position is an FX transaction | RBNZ | NZ | Net settlement model must be reviewed for FX transaction reporting obligations |
| AUSTRAC — correspondent banking rules — originator information requirements | AUSTRAC | AU | the enterprise must provide complete originator information with each credit instruction to the enterprise's Australian counterpart to satisfy AUSTRAC's correspondent banking obligations on the Australian leg |

---

## Correspondent banking relationship

**TTPS-RISK-001 — Correspondent banking relationship: JPMorgan Chase (NZD/AUD international payments)**

The enterprise uses JPMorgan Chase as its SWIFT correspondent for NZD/AUD international payments. Changes to international payment routing that affect transaction volumes flowing through correspondent banking relationships should be reviewed against the enterprise's active correspondent banking agreements before implementation.

---

## Known constraints and risks

| ID | Description | Severity |
|----|-------------|---------|
| TTPS-RISK-001 | SWIFT correspondent banking relationship — JPMorgan Chase is the active correspondent for NZD/AUD international payments; impact of proprietary channel on correspondent relationship not assessed | HIGH |
| TTPS-RISK-002 | DIA Payment Services Regulations — new payment service type classification not confirmed; DIA registration may be required before launch; timeline unknown | HIGH |
| TTPS-RISK-003 | RBNZ FX Transaction Reporting — end-of-day net settlement position reporting obligation not assessed for the intra-group channel; existing FX reporting was designed for SWIFT transactions, not intra-group net settlement | HIGH |
| TTPS-RISK-004 | AUSTRAC originator information format — the required format and fields for the enterprise's Australian counterpart to satisfy its AUSTRAC correspondent banking obligations on the AU leg have not been confirmed with the enterprise's Australian counterpart compliance | MEDIUM |
| TTPS-RISK-005 | Channel routing cut-off — for payments submitted after the intra-group channel's intraday processing cut-off, fallback to SWIFT must preserve the customer's 2-hour SLA commitment or the customer must be notified of the delay | MEDIUM |
