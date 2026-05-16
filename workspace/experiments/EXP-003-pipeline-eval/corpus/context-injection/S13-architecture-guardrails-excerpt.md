# Architecture Guardrails — Cross-Border Payment Architecture Patterns
## Synthetic excerpt for EXP-003-pipeline-eval context injection — S13

**Document type:** Synthetic context injection artefact — NOT a real architecture-guardrails.md file
**Experiment:** EXP-003-pipeline-eval
**Scenario:** S13 — Trans-Tasman Payment Corridor
**Purpose:** Injected as context for Config C runs. Provides architectural guardrails for cross-border and international payment channels. Partially signals C5 (SWIFT correspondent bank agreement review obligation) but does NOT name JPMorgan Chase or the specific clause. The C5 signal is architectural-level guidance, not the specific contractual obligation.

---

## Section 7 — Cross-Border and International Payment Architecture

### 7.1 Overview

All cross-border and international payment features must comply with the following architectural guardrails. These guardrails apply regardless of the payment channel used (SWIFT, intra-group routing, third-party settlement, real-time payment scheme, or hybrid).

Non-compliant architectures identified at design review will be returned for remediation before technical implementation may begin.

---

### 7.2 SWIFT Integration Standards

**ADR-CB-001 — SWIFT Gateway Routing**

All international SWIFT payments processed by the enterprise must route via the approved SWIFT gateway infrastructure. The approved SWIFT gateway is the single integration point for SWIFT message generation, transmission, and receipt.

**Permitted:** Using the approved SWIFT gateway for all message types (MT103, MT202, MT199, FIN, MX/ISO20022).

**Not permitted:** Bypassing the approved SWIFT gateway to route SWIFT messages via a directly-connected SWIFT service bureau or alternative FIN connection without Architecture Review Board approval.

**ADR-CB-002 — Changes to International Payment Routing**

Any change to how international payment instructions are routed — including introduction of a new routing channel, introduction of a routing preference rule, or addition of a secondary/fallback routing path — must be reviewed by the Architecture Review Board before implementation.

The review must include:
1. A mapping of which payment corridors and currencies are affected by the routing change.
2. A review of all active correspondent bank agreements for the affected corridors to confirm the proposed routing is not restricted by existing agreement terms.
3. Confirmation from the Treasury Operations team that the routing change is consistent with the bank's current correspondent banking relationships.
4. An assessment of whether the change constitutes a material change to payment infrastructure that requires regulatory notification (see Section 7.5 — Regulatory Notification Requirements for Payment Infrastructure Changes).

**Note on correspondent bank agreements:** Correspondent bank agreements commonly contain terms governing the routing of transactions through the correspondent. Agreements negotiated for SWIFT-based correspondent relationships may contain explicit restrictions on routing transactions outside the agreed SWIFT channel without prior notification to the correspondent. Routing changes that bypass a SWIFT correspondent without satisfying any notification obligation in the relevant agreement create contractual and credit relationship risk. The architecture review for any non-SWIFT routing alternative must confirm that the proposed routing is not restricted by existing correspondent agreement terms before the design is approved.

---

### 7.3 Sanctions Screening Architecture

**ADR-CB-003 — Mandatory Sanctions Screening for International Payments**

All international payment channels, regardless of routing mechanism, must integrate with the enterprise's central sanctions screening service before funds are released or committed to the payment network.

**Integration requirement:** The sanctions screening service must be called synchronously in the payment processing flow before the payment instruction is transmitted, committed to the treasury books, or settled with a correspondent or counterparty. Asynchronous or batch-mode screening is not permitted for real-time or same-day settlement payment channels.

**What "international payment" covers for sanctions screening purposes:**
- Any payment instruction where the beneficiary account is held at a non-NZ financial institution.
- Any payment instruction that traverses an inter-bank settlement mechanism outside the NZ domestic payment network (including intra-group channels that settle across NZ/AU jurisdiction boundaries).
- Any payment instruction denominated in a foreign currency, regardless of beneficiary location.

**Not covered:** Intra-account transfers within the enterprise-held accounts, NZ domestic payments settled within the NZ clearing systems (RealMe, EFTPOS NZ, Payments NZ BECS), and internal the enterprise book transfers that do not cross a jurisdiction or currency boundary.

**ADR-CB-004 — Screening Service Integration and Fallback**

The central sanctions screening service is a mandatory dependency for any payment channel that meets the criteria in ADR-CB-003. Feature teams must:
1. Register a dependency on the central sanctions screening service in the EA registry before the feature's architecture review.
2. Define a fallback behaviour in the event the screening service is unavailable — by default, the fallback for an international payment channel is "decline the payment instruction; do not proceed to settlement". A "proceed without screening" fallback is not an acceptable default and requires explicit CISO approval as a RISK-ACCEPT in the feature's DoR.
3. Include an integration test in the test plan that validates the fallback behaviour (screening service unavailable → payment declined).

---

### 7.4 Multi-Jurisdiction Payment Compliance

**ADR-CB-005 — Dual-Jurisdiction AML/CFT Obligation Mapping**

For any payment feature that involves a jurisdiction-crossing settlement leg, the architecture team must produce a jurisdiction obligation map before the feature's definition is finalised. The obligation map must identify:
1. **Originating jurisdiction obligations** — AML/CFT screening, threshold reporting, originator information requirements that apply to the NZ end of the payment.
2. **Receiving jurisdiction obligations** — AML/CFT obligations that the receiving financial institution (or its correspondent) must satisfy on the AU/US/GB/other end of the payment.
3. **Information provision obligations** — what originator information the enterprise is required to provide to the receiving institution to enable the receiving institution to satisfy its own jurisdiction's AML/CFT obligations.
4. **Settlement channel obligations** — FX transaction reporting, end-of-day net position reporting, or other treasury-level reporting obligations that arise from the settlement mechanism used.

**ADR-CB-006 — AUSTRAC Information Standards for AU-Leg Payments**

For any payment feature where funds are received into an Australian bank account, the architecture must include an originator information data element that satisfies AUSTRAC's correspondent banking information requirements. The required fields are:
- Originator full name (as registered with the sending financial institution)
- Originator account number or reference identifier
- Originator registered address

Where the payment channel does not natively carry these fields (e.g., a treasury settlement that carries only a net position without per-payment detail), the architecture must define a supplemental data transfer mechanism to convey per-payment originator information to the AU counterpart.

---

### 7.5 Regulatory Notification Requirements for Payment Infrastructure Changes

**ADR-CB-007 — Payment Service Type Assessment**

Before implementing any new payment channel or materially changing the characteristics of an existing payment channel (routing mechanism, settlement model, participant eligibility criteria, pricing structure), the product team must obtain a written assessment from the Regulatory Affairs team confirming:
1. Whether the channel constitutes a new payment service type under the Payment Services Regulations 2021.
2. If a new payment service type is identified: whether the enterprise's existing payment service licence covers the new type or whether a DIA registration for the new type is required.
3. The estimated timeline for registration if required.

A feature that is identified as a new payment service type may not be offered to retail customers before the DIA registration is complete.

**ADR-CB-008 — RBNZ FX Transaction Reporting — Net Settlement Models**

Intra-group net settlement of cross-currency positions is a foreign exchange transaction for RBNZ FX Transaction Reporting purposes, even where settlement is internal to the the enterprise group and does not involve an external counterparty.

Before implementing a net settlement model for a cross-border payment feature, the Treasury Operations team must confirm:
1. Whether the net settlement positions will be reported as aggregate FX transactions or as individual per-payment FX transactions.
2. Whether the settlement frequency (e.g., end-of-day) is consistent with RBNZ's reporting frequency expectations for FX transactions in the relevant currency pair.
3. Whether any threshold exemptions apply to intra-group settlement positions.

The Treasury Operations sign-off on FX reporting must be documented as a DoR prerequisite for any payment feature that uses a net settlement model.

---

### 7.6 EA Registry Dependencies for Cross-Border Payment Features

All cross-border and international payment features must register the following dependencies in the EA registry before the architecture review is approved:

- Central Sanctions Screening Service (mandatory — see ADR-CB-003)
- SWIFT Gateway (if SWIFT message generation is in scope — mandatory)
- Correspondent Bank API or integration point (if correspondent bank interactions are in scope)
- AUSTRAC Information Provision Data Store or API (if AU-leg payments are in scope — see ADR-CB-006)
- FX Transaction Reporting Service (if net settlement model is used — see ADR-CB-008)
- DIA Payment Service Registration System (if new payment service type assessment is required — see ADR-CB-007)

Unregistered dependencies flagged in a post-launch EA audit will result in an architecture non-compliance finding against the feature.

---

*This excerpt covers Section 7 (Cross-Border and International Payment Architecture) only. Adjacent sections referenced but not shown here include Section 5 (Domestic Payment Architecture Standards), Section 6 (Real-Time Payments Integration), Section 8 (Treasury Settlement Architecture), and Section 9 (Regulatory Reporting Architecture for Payment Systems).*
