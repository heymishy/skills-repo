# Discovery: Trans-Tasman Payment Corridor — Proprietary Intra-Group Routing Channel

**Status:** Draft — awaiting approval
**Created:** 2026-05-17
**Approved by:** Pending
**Author:** claude-sonnet-4-6 (EXP-008 Config C /discovery)

---

## Problem Statement

Enterprise retail customers who need to send money to Australian bank accounts are being systematically lost to alternative providers — Wise (formerly TransferWise) and third-party remittance services — because the enterprise's current SWIFT-based international payment offering is materially slower and more expensive than these alternatives. The current SWIFT channel takes 1–2 business days to settle and costs NZD $18–25 per transaction. Competing services offer near-instant settlement (hours, not days) at costs well below $10. The competitive gap is measurable: the enterprise loses approximately NZD $4.2M in annual payment revenue to alternative providers.

The enterprise has a group infrastructure relationship with its Australian counterpart — including a reciprocal payment routing agreement already in place for internal treasury flows — and proposes to use this proprietary intra-group channel to offer NZ retail customers a materially faster and cheaper trans-Tasman payment option. The NZ customer payment instruction would be processed at the NZ end, settled via group treasury books, and credited by the Australian counterpart to the Australian recipient's account. Customer-facing settlement target: within 2 hours.

This is not solely an engineering challenge. The proprietary intra-group channel bypasses the SWIFT infrastructure that has historically governed both the enterprise's international payment regulatory compliance posture and its correspondent banking arrangements. Before this channel can go live to retail customers, a multi-jurisdiction compliance assessment is required across NZ regulatory obligations (RBNZ AML/CFT Act 2009, Payment Services Regulations 2021, RBNZ FX Transaction Reporting), Australian regulatory obligations (AUSTRAC correspondent banking rules), and an assessment of the enterprise's existing SWIFT correspondent bank agreement to confirm that redirecting NZD/AUD transaction flow outside the agreed SWIFT channel does not create a contractual notification obligation or credit relationship risk.

---

## Who It Affects

**Enterprise retail customers with trans-Tasman connections** — primary beneficiaries. NZ-based customers who send money to Australian family members, business partners, or service providers and are currently using Wise, remittance services, or tolerating slow/expensive SWIFT transfers. For sub-$10,000 payments, the enterprise currently offers an uncompetitive product. This is the population generating NZD $4.2M of annual revenue leakage.

**Enterprise payments product team** — responsible for designing the channel, threshold routing logic ($0–$10,000 via proprietary channel; above $10,000 via SWIFT), and the customer-facing experience (payment initiation, 2-hour settlement confirmation, SLA commitment).

**Enterprise RBNZ AML/CFT compliance team** — must confirm that the existing sanctions screening and threshold transaction reporting infrastructure satisfies channel-independent AML/CFT obligations under the RBNZ AML/CFT Act 2009 when applied to the intra-group channel. The "existing process covers it" assumption must be formally validated; the channel change creates a new obligation chain even if the underlying screening logic is unchanged.

**Enterprise treasury team** — operates the intra-group net settlement model (NZD/AUD end-of-day net positions). Must confirm whether the net settlement structure satisfies RBNZ FX transaction reporting obligations or whether per-payment reporting or modified aggregation reporting is required. Current SWIFT payments generate individual FX transaction reports; the net settlement model generates a single end-of-day position — these are materially different reporting structures.

**Enterprise's Australian counterpart — compliance team** — is the receiving entity under AUSTRAC's correspondent banking rules. Must confirm the originator information fields and format required from the enterprise to satisfy AUSTRAC obligations on the Australian leg. The assumption that "the Australian counterpart handles their side" is insufficient — the enterprise has a positive obligation to provide sufficient originator information (name, account number, address, purpose) in a format the Australian counterpart can use to meet its AUSTRAC AML/CTF Programme requirements.

**Enterprise's Australian counterpart — treasury team** — operates the Australian end of the intra-group settlement: crediting Australian beneficiary accounts and managing the reciprocal net settlement position.

**RBNZ (Reserve Bank of New Zealand)** — regulator for AML/CFT compliance and FX transaction reporting. The enterprise retains primary AML/CFT reporting entity obligations regardless of channel. Any change to FX reporting structure (per-transaction vs net settlement) requires treasury confirmation before launch.

**DIA (Department of Internal Affairs, NZ)** — administers the Payment Services Regulations 2021 register. A new payment service type not covered under the enterprise's existing licence may require DIA registration before the proprietary channel can be offered to retail customers. The enterprise's regulatory team has not yet assessed whether this applies.

**AUSTRAC (Australian Transaction Reports and Analysis Centre)** — Australian regulator. While the enterprise is not directly subject to AUSTRAC jurisdiction, the enterprise's Australian counterpart is — and the enterprise's failure to provide compliant originator information to its Australian counterpart would make it impossible for the counterpart to satisfy its AUSTRAC obligations. The enterprise must treat AUSTRAC-compliant originator information provision as an enterprise obligation, not a counterpart obligation.

**JPMorgan Chase (SWIFT correspondent bank)** — the enterprise's SWIFT correspondent for NZD/AUD international payments. The architecture guardrails (ADR-CB-002) make clear that any change to international payment routing must include a review of active correspondent bank agreements. The EA registry flags this relationship (TTPS-RISK-001): JPMorgan Chase is the active correspondent for NZD/AUD payments, and the impact of the proprietary channel on this relationship has not been assessed. Correspondent bank agreements commonly contain terms restricting routing transactions outside the agreed SWIFT channel without prior notification. This must be reviewed and any notification obligation satisfied before the proprietary channel is activated.

---

## Why Now

Three converging pressures make this the right time to address the gap:

**Competitive revenue leakage is quantified and growing.** NZD $4.2M in annual payment revenue is being lost to Wise and third-party remittance services. The enterprise now has the measurement to make the business case for investment; continued inaction has a known annual cost.

**Group infrastructure is available.** The proprietary intra-group channel and reciprocal routing agreement with the Australian counterpart are already operational for internal treasury flows. This reduces the build complexity substantially compared to building an entirely new payment rail — the integration exists; what is required is to extend it to retail customer-facing use with the appropriate compliance and regulatory framework in place.

**Regulatory environment is stable.** The Payment Services Regulations 2021 framework is established; the enterprise's compliance team can now assess the DIA registration requirement with certainty rather than provisional guidance.

---

## MVP Scope

The MVP delivers a NZ-to-AU retail payment option via the proprietary intra-group channel, with all prerequisite compliance and contractual clearances completed before any customer goes live.

**Included in MVP:**

1. **NZ-to-AU direction only** — NZ retail customer initiates a payment to any Australian bank account (BSB + account number). Reverse direction (AU-to-NZ) is out of scope for this phase.

2. **Threshold routing: $0–$10,000 via proprietary channel** — payments up to and including NZD $10,000 are eligible for the proprietary channel. Payments above $10,000 route via the standard SWIFT channel with existing pricing. The routing decision is made at the payment initiation layer.

3. **Customer-facing settlement SLA: within 2 hours** — for eligible payments (up to $10,000, submitted within intraday processing cut-off). Payments submitted after cut-off are notified of next-business-day settlement or fallback to SWIFT.

4. **RBNZ AML/CFT compliance — channel-independent** — the enterprise's existing sanctions screening service (RBNZ + OFAC lists) must be applied synchronously to all proprietary channel payment instructions before funds are committed to the channel. Threshold transaction reporting (above NZD $10,000) remains in place, though at $10,000 threshold the proprietary channel primarily handles sub-threshold payments. Originator information retention obligations apply regardless of channel.

5. **AUSTRAC originator information provision** — each credit instruction sent to the Australian counterpart via the proprietary channel must include complete originator information (originator full name, NZ account number, NZ registered address, payment amount and currency, purpose where known) in the format confirmed with the Australian counterpart compliance team before channel activation. This is an enterprise obligation, not delegated to the counterpart.

6. **RBNZ FX transaction reporting — net settlement assessment completed** — the treasury team must confirm before launch whether the end-of-day net NZD/AUD settlement position satisfies RBNZ FX transaction reporting obligations, or whether supplemental per-payment reporting is required. Channel does not go live until this is confirmed and any required reporting mechanism is in place.

7. **DIA Payment Services Regulations 2021 assessment completed** — the regulatory team must obtain a written assessment confirming whether the proprietary channel constitutes a new payment service type requiring DIA registration, and if so, complete that registration before the channel is offered to retail customers.

8. **SWIFT correspondent bank agreement review completed** — pursuant to architecture guardrail ADR-CB-002 and EA registry risk TTPS-RISK-001, the enterprise's SWIFT correspondent agreement (JPMorgan Chase for NZD/AUD payments) must be reviewed to confirm whether the proprietary channel routing creates any notification obligation to the correspondent before the channel is activated. Any required notification must be filed and acknowledged before go-live. No retail customer goes live on the proprietary channel until this review is completed and any obligations discharged.

9. **Pilot cohort before full rollout** — initial availability to a small cohort of opted-in retail customers before full product rollout.

10. **SWIFT channel retained as the fallback and above-threshold channel** — no degradation to existing SWIFT payment capability for any customer.

---

## Out of Scope

- **AU-to-NZ direction** — excluded from MVP. Future phase contingent on pilot performance. The reverse direction introduces additional regulatory complexity on the Australian origination leg.

- **Payments above NZD $10,000 via the proprietary channel** — these continue to route via SWIFT with existing pricing. The threshold routing decision is a product choice as well as a regulatory simplification (above $10,000, both AML threshold reporting and SWIFT correspondent responsibilities are handled by the existing channel).

- **Third-party or non-Australian international payments** — the proprietary channel applies only to NZ-to-AU payments leveraging the group relationship with the Australian counterpart. No other corridors or currencies are in scope.

- **Open banking or third-party payment initiation** — customer payment instructions must be initiated through the enterprise's own retail banking channels (digital banking platform, phone banking). Third-party payment initiation (PSD2/API-based) is not in scope.

- **Replacement of the SWIFT gateway** — the SWIFT gateway and correspondent banking relationship remain in place and are not decommissioned. The proprietary channel routes a subset of eligible NZ-to-AU payments; SWIFT remains the channel for all other international payments.

- **Disbursement or remittance to non-bank Australian accounts** — MVP supports payments to standard Australian bank accounts (BSB + account number). Payments to e-wallets, prepaid accounts, or non-bank payment systems are out of scope.

---

## Assumptions and Risks

[ASSUMPTION] AUSTRAC originator information format and field requirements confirmed with the Australian counterpart compliance team before channel activation — the enterprise is currently operating on the assumption that the counterpart "handles their side"; this assumption must be replaced with a documented bilateral agreement on originator information standards before MVP go-live. Unconfirmed, requires resolution before scope is locked.

[ASSUMPTION] RBNZ FX Transaction Reporting obligations are satisfied under the net settlement model, or a supplemental per-payment reporting mechanism is agreed with the treasury team before channel activation — the current SWIFT model reports per-transaction; whether an end-of-day net position constitutes equivalent reporting under RBNZ FX rules has not been confirmed. Unconfirmed, requires treasury and legal review before scope is locked.

[ASSUMPTION] DIA Payment Services Regulations 2021 assessment confirms either (a) the enterprise's existing payment service licence covers the proprietary channel, or (b) a DIA registration timeline is compatible with the 6-month build target — the regulatory team has not yet assessed this. If a DIA registration is required and takes longer than the build, launch timing is at risk. Unconfirmed, requires regulatory assessment before scope is locked.

[ASSUMPTION] The SWIFT correspondent bank agreement with JPMorgan Chase (NZD/AUD) does not prohibit routing transactions outside the agreed SWIFT channel, or any required notification obligation can be satisfied before the channel activation date — consistent with ADR-CB-002 and EA registry TTPS-RISK-001, this agreement has not been reviewed in the context of the proprietary channel. Correspondent bank agreements commonly contain channel restriction and notification clauses. If a notification obligation exists and is not discharged before go-live, the enterprise is exposed to a contractual breach with credit relationship risk. Unconfirmed, requires legal and treasury review of the correspondent agreement before scope is locked.

[ASSUMPTION] The existing AML/CFT sanctions screening service is technically capable of handling the proprietary channel's payment throughput and SLA requirements (screening must complete synchronously within the 2-hour settlement window) — the current service is designed for SWIFT flow, not real-time intra-group routing. Capacity and latency have not been confirmed for the new channel. Unconfirmed, requires architecture review.

[RISK] Bilateral AML/CFT responsibility agreement with the Australian counterpart — for the SWIFT channel, the correspondent bank is contractually responsible for beneficiary-side AML/CFT checks. For the proprietary channel, this responsibility chain is different and must be documented in a bilateral data-sharing and AML/CFT responsibility agreement between the enterprise and the Australian counterpart before channel activation. Without this, the enterprise's AML/CFT liability coverage has an unresolved gap.

[RISK] 6-month build target — the DIA registration timeline (if required), the correspondent bank agreement review, the RBNZ FX reporting confirmation, and the AUSTRAC originator information bilateral agreement are all parallel prerequisites that must complete before any retail customer goes live. If any of these prerequisites takes longer than anticipated, the 6-month target is at risk. The build can proceed in parallel, but no customer launch until all prerequisites are confirmed.

[RISK] Pilot cohort definition — the size and selection criteria for the pilot cohort are not yet defined. The pilot must be large enough to generate meaningful payment volume data but small enough to limit exposure if a compliance gap is identified during the pilot period.

---

## Directional Success Indicators

**Transaction cost for NZ-to-AU payments up to $10,000:**
Baseline: NZD $18–25 per transaction (current SWIFT channel). Target: under NZD $5 per transaction via proprietary channel. Measured via: product pricing data, transaction cost reporting.

**Settlement time for eligible payments:**
Baseline: 1–2 business days (current SWIFT channel). Target: within 2 hours for payments submitted within intraday cut-off via proprietary channel. Measured via: payment instruction timestamp to beneficiary credit confirmation timestamp, averaged across the pilot cohort.

**Annual payment revenue retained (anti-leakage):**
Baseline: NZD $4.2M estimated annual revenue leakage to Wise and third-party remittance services. Target: measurable reduction in revenue leakage within 12 months of full rollout. Measured via: NZ-to-AU payment volume and revenue tracking (internal transaction data), comparison to pre-launch baseline.

**Dual-jurisdiction AML/CFT compliance — zero incidents:**
Baseline: No existing proprietary channel (metric is new at launch). Target: zero RBNZ AML/CFT enforcement findings, zero AUSTRAC information request failures, zero correspondent bank compliance incidents in first 12 months post-launch. Measured via: compliance team reporting, regulatory correspondence tracking.

**Prerequisite completion before launch:**
Baseline: All four regulatory/contractual prerequisites outstanding (DIA assessment, RBNZ FX confirmation, AUSTRAC bilateral agreement, correspondent bank agreement review). Target: all four confirmed complete before any retail customer goes live on the proprietary channel. Measured via: legal/regulatory sign-off records.

---

## Constraints

**C1 — RBNZ AML/CFT Act 2009 (NZ leg):** The enterprise is a reporting entity under the Act. Sanctions screening and threshold transaction reporting obligations are channel-independent — they attach to the payment instruction, not the transmission mechanism. The enterprise retains primary AML/CFT liability regardless of whether payments route via SWIFT or the proprietary intra-group channel. "Extending the same AML/CFT process" is necessary but not sufficient; the compliance team must formally confirm that the existing process is fit-for-purpose for the non-SWIFT channel architecture.

**C2 — AUSTRAC (AU leg):** The Australian counterpart bears primary AUSTRAC obligations on the receiving leg. However, the enterprise has a positive obligation to provide complete originator information (name, NZ account number, NZ address, purpose) in a format sufficient for the Australian counterpart to satisfy its AUSTRAC correspondent banking programme requirements. This is an enterprise-side constraint, not solely a counterpart-side compliance matter. The bilateral originator information format must be agreed with the Australian counterpart compliance team before the channel carries any real customer transactions.

**C3 — RBNZ FX Transaction Reporting:** End-of-day net settlement of NZD/AUD intra-group positions is a foreign exchange transaction for RBNZ reporting purposes. The current SWIFT model generates per-transaction FX reports; the net settlement model generates a single daily net position. Whether this satisfies RBNZ FX reporting obligations — or whether supplemental per-payment reporting or a different aggregation structure is required — must be confirmed with the treasury team and legal counsel before launch. This is a separate compliance question from AML/CFT reporting.

**C4 — Payment Services Regulations 2021 (DIA registration):** A new payment service type not covered under the enterprise's existing licence requires DIA registration before it can be offered to retail customers. The proprietary intra-group channel with net settlement may constitute a new payment service type under the Regulations. The enterprise's regulatory team must obtain a written assessment and, if required, complete DIA registration before go-live. "Standard regulatory notifications" does not satisfy this requirement if the channel is assessed as a new service type.

**C5 — SWIFT correspondent bank agreement review (JPMorgan Chase):** Architecture guardrail ADR-CB-002 requires a review of all active correspondent bank agreements before any change to international payment routing is implemented. EA registry entry TTPS-RISK-001 identifies JPMorgan Chase as the enterprise's active SWIFT correspondent for NZD/AUD international payments and flags that the impact of the proprietary channel on this correspondent relationship has not been assessed. Correspondent bank agreements commonly contain terms governing how transactions may be routed — including restrictions on routing transactions outside the agreed SWIFT channel without prior notification to the correspondent. If such a clause exists and the proprietary channel is activated without satisfying the notification obligation, the enterprise is exposed to a contractual breach with credit relationship risk. This review is a prerequisite to channel activation, not a parallel workstream — no retail customer goes live until the correspondent agreement has been reviewed and any obligations discharged.

**Technical:** The proposed 6-month build timeline must accommodate parallel compliance and legal prerequisites (DIA assessment, RBNZ FX confirmation, AUSTRAC bilateral agreement, correspondent agreement review) that are on the critical path to launch. The engineering work can proceed in parallel, but no customer can go live until all prerequisites are confirmed.

**Timeline:** 6-month build target with pilot before full rollout. Pilot scope and cohort definition to be confirmed.

---

## /clarify recommendation

This discovery contains 5 unconfirmed assumptions that affect scope, compliance posture, and launch viability. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [ASSUMPTION] AUSTRAC originator information format and field requirements confirmed with the Australian counterpart compliance team before channel activation — the enterprise is currently operating on the assumption that the counterpart "handles their side"; this must be replaced with a documented bilateral agreement on originator information standards before MVP go-live.
- [ASSUMPTION] RBNZ FX Transaction Reporting obligations are satisfied under the net settlement model, or a supplemental per-payment reporting mechanism is agreed with the treasury team before channel activation — whether an end-of-day net position constitutes equivalent reporting under RBNZ FX rules has not been confirmed.
- [ASSUMPTION] DIA Payment Services Regulations 2021 assessment confirms either (a) the enterprise's existing payment service licence covers the proprietary channel, or (b) a DIA registration timeline is compatible with the 6-month build target.
- [ASSUMPTION] The SWIFT correspondent bank agreement with JPMorgan Chase (NZD/AUD) does not prohibit routing transactions outside the agreed SWIFT channel, or any required notification obligation can be satisfied before the channel activation date — this agreement has not been reviewed in the context of the proprietary channel; correspondent bank agreements commonly contain channel restriction and notification clauses; unconfirmed breach risk is present.
- [ASSUMPTION] The existing AML/CFT sanctions screening service is technically capable of handling the proprietary channel's throughput and SLA requirements synchronously within the 2-hour settlement window.

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification. The correspondent agreement assumption (C5) is particularly high-risk: it is a blocking constraint to channel activation, not a parallel compliance task.

---

## Attribution

**Contributors:**
- Operator — Product / Business (trans-Tasman payments initiative brief, follow-up context)
- claude-sonnet-4-6 — AI discovery facilitation (EXP-008 Config C)

**Reviewers:**
- Pending

**Approved By:**
- Pending

---

<!-- CPF-TRACE
experiment_id: EXP-008-corpus-breadth-eval
config: C
story: S13
skill: /discovery
model: claude-sonnet-4-6
run_timestamp: 2026-05-17T00:00:00Z
constraints_surfaced:
  C1: true — RBNZ AML/CFT Act 2009 (NZ leg); channel-independent obligation; enterprise primary liability named; existing screening must be validated as fit-for-purpose for non-SWIFT channel
  C2: true — AUSTRAC (AU leg); enterprise obligation to provide originator information named; "counterpart handles their side" assumption explicitly rejected; bilateral originator information format named as prerequisite
  C3: true — RBNZ FX Transaction Reporting; net settlement vs per-transaction reporting distinction named; treasury confirmation required before launch
  C4: true — DIA Payment Services Regulations 2021; registration requirement named explicitly; "standard notifications" insufficient framing addressed
  C5: true (partial-to-full) — SWIFT correspondent bank agreement review surfaced via ADR-CB-002 + TTPS-RISK-001 signals; JPMorgan Chase named as active correspondent; correspondent agreement review named as prerequisite to channel activation; notification obligation risk named; contractual breach + credit relationship risk named; C5 is listed as an [ASSUMPTION] with explicit blocker language
c5_surfacing_signal_sources:
  - architecture-guardrails-excerpt: ADR-CB-002 (correspondent agreement review required before non-SWIFT routing; notification obligation risk stated)
  - ea-registry: TTPS-RISK-001 (JPMorgan Chase named; correspondent relationship unassessed; HIGH severity)
  - operator-brief-follow-up: "We have not reviewed the agreement in the context of this channel"
c5_jpmorgan_named: true — sourced from EA registry TTPS-RISK-001 and TTPS-SWIFT-001
c5_notification_obligation_named: true
c5_breach_risk_named: true
jurisdiction_coverage:
  NZ_leg: true (C1, C3, C4)
  AU_leg: true (C2)
  cross_border: true (C5)
cpf_self_assessment: all five constraints surfaced; C5 surfaced with full blocker framing; all three jurisdiction legs represented
-->
