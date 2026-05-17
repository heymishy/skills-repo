# Discovery: Trans-Tasman Payment Corridor — Proprietary Intra-Group Routing Channel

**Status:** Approved (eval-mode — EXP-008-corpus-breadth-eval / Config B / S13)
**Feature slug:** trans-tasman-payment-corridor
**Date:** 2026-05-17
**Skill version:** /discovery
**Model:** claude-opus-4-6 (Config B — Opus front-loaded; /discovery and /definition only)
**Run:** EXP-008 Config B S13

---

## Step 0 — Context check (eval-mode log)

**Context injection files active (injected verbatim at /discovery start; bulk size ~21 KB, below 50 KB risk threshold):**

- `S13-ea-registry-trans-tasman-payments.md` — EA registry entry for the proposed Trans-Tasman Payment Routing Service (status: PLANNED). Interface map names: TTPS-IN-001 (Retail Digital Banking Platform inbound), TTPS-IN-002 (Phone Banking System inbound), TTPS-SCR-001 (AML/CFT Sanctions Screening Service — synchronous; "re-used from SWIFT flow"), TTPS-REP-001 (RBNZ Threshold Transaction Reporting Module — batch; explicit note: "must confirm coverage for intra-group channel"), TTPS-ROUTE-001 (Enterprise Group Treasury Intra-Group API — proprietary channel; explicit note: "Correspondent banking relationship implications to be assessed before activation"), TTPS-SWIFT-001 (SWIFT International Payment Gateway — external via correspondent bank JPMorgan Chase; standard channel for >$10,000 and non-AU corridors), TTPS-SET-001 (Enterprise group Treasury Net Settlement — end-of-day net positions; explicit RBNZ FX transaction reporting obligation flagged via TTPS-RISK-003), TTPS-CONF-001 (Customer Notification Service), TTPS-REG-001 (DIA Payment Services Register — registration status not confirmed; TTPS-RISK-002), TTPS-REG-002 (AUSTRAC Correspondent Banking — originator information bundle to enterprise's Australian counterpart; format and content not confirmed with their compliance team). Regulatory obligations table covers RBNZ AML/CFT (channel-independent obligation, primary AML/CFT liability retained by the enterprise), RBNZ threshold transaction reporting (obligation survives routing change), PSR 2021 / DIA (new payment service type may require registration), RBNZ FX transaction reporting (net settlement = FX transaction), AUSTRAC correspondent banking (originator information obligation on the enterprise as sender). Risk inventory: TTPS-RISK-001 HIGH (JPMorgan Chase correspondent impact not assessed), TTPS-RISK-002 HIGH (DIA not confirmed), TTPS-RISK-003 HIGH (FX reporting not assessed for net settlement), TTPS-RISK-004 MEDIUM (AUSTRAC originator information format not confirmed), TTPS-RISK-005 MEDIUM (cut-off / SWIFT fallback SLA preservation).

- `S13-aml-austrac-payment-services-policy.md` — Synthetic policy document with four parts. Part A — RBNZ AML/CFT Act 2009: s.A.1 reporting entity scope (channel-independent obligation); s.A.2 CDD; s.A.3 sanctions screening (RBNZ-designated list, OFAC SDN, DFAT consolidated for AU beneficiaries; s.A.3.2 channel independence — obligation attaches to instruction, not transmission channel; s.A.3.3 blocked instruction handling — bank must not release via any channel); s.A.4 threshold transaction reporting (above NZD $10,000; 3-business-day filing window; s.A.4.2 channel independence; s.A.4.3 7-year originator information retention); s.A.5 wire transfer originator information requirements. Part B — AUSTRAC Correspondent Banking: s.B.1 enterprise's direct originator information obligation to enterprise's Australian counterpart; minimum fields (legal name, account number, address, purpose, currency/amount); s.B.2 enterprise's Australian counterpart AML/CTF Programme requirements — must document the intra-group arrangement as correspondent banking, conduct due diligence on the enterprise, monitor instruction volume; group ownership does not exempt. Part C — Payment Services Regulations 2021 (DIA): s.C.1 definition of payment service; confirmation obligation before launch ("we already provide international payments" is not sufficient basis); s.C.2 DIA registration process (4–12 week typical timeline). Part D — RBNZ FX Transaction Reporting: s.D.1 intra-group net settlement = FX transaction even with no external counterparty; s.D.2 NZD $100,000 notional threshold for FX transaction reporting; net settlement amount is reportable. **Document footer explicitly states C5 (SWIFT correspondent agreement / JPMorgan notification clause) is withheld and not in this file.**

- `S13-architecture-guardrails-excerpt.md` — Section 7 of architecture guardrails: Cross-Border and International Payment Architecture. ADR-CB-001 (SWIFT gateway routing — approved gateway is single integration point). ADR-CB-002 (changes to international payment routing — Architecture Review Board approval required before any routing change; review must include corridor/currency mapping, review of all active correspondent bank agreements for affected corridors to confirm proposed routing is not restricted by existing terms, Treasury Operations confirmation, regulatory notification assessment; explicit Note on correspondent bank agreements: agreements negotiated for SWIFT-based correspondent relationships may contain explicit restrictions on routing transactions outside the agreed SWIFT channel without prior notification; routing changes that bypass a SWIFT correspondent without satisfying notification obligation create contractual and credit relationship risk; architecture review for any non-SWIFT routing alternative must confirm the proposed routing is not restricted by existing correspondent agreement terms before the design is approved). ADR-CB-003 (mandatory sanctions screening for all international payment channels; synchronous pre-transmission). ADR-CB-004 (screening service is mandatory dependency; default fallback for international payments = decline; "proceed without screening" fallback requires explicit CISO RISK-ACCEPT). ADR-CB-005 (dual-jurisdiction AML/CFT obligation mapping required for any jurisdiction-crossing settlement leg). ADR-CB-006 (AUSTRAC information standards for AU-leg payments — originator full name, account number/reference, registered address; supplemental data transfer mechanism required if channel does not natively carry per-payment detail). ADR-CB-007 (payment service type assessment before launch — written Regulatory Affairs confirmation required; channel may not be offered to retail customers before DIA registration is complete if required). ADR-CB-008 (RBNZ FX transaction reporting for net settlement models — Treasury Operations sign-off documented as DoR prerequisite). 7.6 EA registry dependencies enumerated.

**Operator brief (verbatim) — see Step 0a below.**

**Product context:** `product/*.md` describes the skills platform (different domain). Treated as not applicable to this synthetic regulated-payments scenario.

**EA registry signals active and tracked across this discovery:**

| Signal | Severity | Source | Material to constraint |
|--------|----------|--------|-----------------------|
| TTPS-SWIFT-001 — JPMorgan Chase is active SWIFT correspondent for NZD/AUD international payments | (Reference fact) | EA registry interface map | C5 (correspondent identity) |
| TTPS-ROUTE-001 — "Correspondent banking relationship implications to be assessed before activation" | (Risk flag, embedded in interface map) | EA registry interface map | C5 (review obligation signal) |
| TTPS-RISK-001 — Impact of proprietary channel on JPMorgan Chase correspondent relationship not assessed | HIGH | EA registry risk inventory | C5 (review obligation, severity HIGH) |
| TTPS-RISK-002 — DIA payment service type classification not confirmed | HIGH | EA registry risk inventory | C4 |
| TTPS-RISK-003 — RBNZ FX transaction reporting not assessed for intra-group net settlement | HIGH | EA registry risk inventory | C3 |
| TTPS-RISK-004 — AUSTRAC originator information format not confirmed with enterprise's Australian counterpart compliance | MEDIUM | EA registry risk inventory | C2 |
| TTPS-RISK-005 — Channel routing cut-off; SWIFT fallback must preserve 2-hour SLA or customer notified | MEDIUM | EA registry risk inventory | Operational (carried to MVP scope item 8) |
| TTPS-REP-001 note — Threshold reporting "must confirm coverage for intra-group channel" | (Embedded note) | EA registry interface map | C1 (threshold reporting sub-obligation) |
| TTPS-REG-002 — Originator information bundle required for enterprise's Australian counterpart to satisfy AUSTRAC; format and content to be confirmed | (Interface obligation) | EA registry interface map | C2 |

**Architecture guardrail signals active (ADR-CB-002 — the C5 hinge):**
Any change to international payment routing (the intra-group channel is such a change for the NZD/AUD corridor) requires Architecture Review Board approval. The review must include "a review of all active correspondent bank agreements for the affected corridors to confirm the proposed routing is not restricted by existing agreement terms." The Note on correspondent bank agreements is the dispositive signal: SWIFT correspondent agreements *may* contain notification restrictions, and bypass without satisfying any such obligation creates contractual and credit relationship risk. The proprietary channel is, by design, a bypass of the SWIFT correspondent for sub-$10,000 NZD/AUD volume. **C5 surfaces by compositional inference**: TTPS-SWIFT-001 (JPMorgan Chase = the SWIFT correspondent for this corridor) + TTPS-RISK-001 HIGH (impact not assessed) + ADR-CB-002 Note (review required; bypass without notification = contractual/credit risk) = the bilateral JPMorgan Chase correspondent agreement must be reviewed before activation, and if a notification or consent obligation is confirmed, channel activation is contractually blocked until acknowledgement is received.

---

## Step 0a — Operator input (paste verbatim from operator brief)

> We want to build a trans-Tasman payment feature for the enterprise retail customers that allows them to send money to any Australian bank account quickly and cheaply. This is a competitive gap we feel keenly: most of our customers with family or business connections in Australia are using TransferWise (Wise) or third-party remittance services because our current SWIFT-based international payment takes 1–2 business days and costs $18–25 per transaction. We lose approximately NZD $4.2M in annual payment revenue to these alternative services.
>
> The mechanism we want to use is a proprietary internal routing channel between the enterprise and the enterprise's Australian counterpart. We have a close relationship with our Australian counterpart — shared group infrastructure and a reciprocal payment routing agreement already in place for internal treasury flows. Using this channel, a NZ customer's payment instruction would be processed at the NZ end and settled via the enterprise group treasury books, with the enterprise's Australian counterpart crediting the Australian recipient's account on the AU end. Net positions between the enterprise and the enterprise's Australian counterpart would be settled at end of day in the treasury books. The customer-facing experience would show settlement within 2 hours.
>
> Target pricing is under $5 per transaction for payments up to $10,000. Above $10,000 payments would go through the standard SWIFT channel with existing pricing.
>
> We are aware that international payments carry AML/CFT obligations. Our current SWIFT-based international payment flow already includes sanctions screening and RBNZ AML/CFT threshold reporting. We plan to extend the same AML/CFT screening logic to the new channel. Our compliance team is comfortable that the existing AML/CFT process covers the requirements.
>
> We anticipate some regulatory notifications will be required before launch — we are used to this. Our regulatory team will manage the standard notifications process. We see this as a 6-month build, with a pilot to a small cohort of customers before full rollout.
>
> The feature would initially be available for NZ-to-Australia payments only (not the reverse direction). We would expand to AU-to-NZ in a future phase if the pilot performs well.

**Follow-up context provided in brief and incorporated into this discovery:**
- AUSTRAC obligations have not been specifically discussed with enterprise's Australian counterpart; assumption that "they handle their side" stands but has not been confirmed.
- RBNZ FX transaction reporting has not been reviewed by treasury for net settlement model.
- DIA registration requirement has not been considered.
- The SWIFT correspondent bank relationship with JPMorgan Chase has not been reviewed in the context of this channel; "our assumption was that the enterprise's Australian counterpart relationship is a group arrangement separate from the SWIFT correspondent infrastructure."
- Existing SWIFT AML/CFT screening flow makes the correspondent bank contractually responsible for beneficiary-side AML/CFT; the proprietary channel requires a bilateral AML/CFT data-sharing agreement with enterprise's Australian counterpart.

---

## Problem Statement

**The competitive problem is real.** The enterprise loses approximately NZD $4.2M annually in retail trans-Tasman payment revenue to alternative services — TransferWise (Wise), Western Union, and similar — because the enterprise's SWIFT international payment is too slow (1–2 business days) and too expensive ($18–25 per transaction) for a price-sensitive consumer use case. A proprietary intra-group routing channel using the existing group relationship with the enterprise's Australian counterpart offers a technically credible path to sub-$5 pricing and 2-hour settlement for eligible NZ-to-AU payments up to NZD $10,000.

**The framing problem is that the brief understates the regulatory and contractual perimeter.** Bringing a new cross-border payment channel to market in a dual-jurisdiction regulated environment, with a novel intra-group net settlement model, while diverting NZD/AUD payment volume away from an existing SWIFT correspondent relationship, surfaces five distinct compliance and contractual obligations — three on the NZ leg, one on the AU leg, and one cross-border contractual — that are framed as "covered", "standard", or simply not mentioned in the brief. None of them are validated for the new channel. The discovery's job is to make all five visible, name the gating obligation each creates, and identify the named accountable role for each.

**The NZ regulatory leg comprises three distinct obligations, not one:**

- *RBNZ AML/CFT Act 2009* (C1) — The enterprise retains primary AML/CFT liability for every payment instruction it originates, regardless of routing channel (policy doc s.A.1). The sanctions screening obligation attaches to the payment instruction, not the transmission channel (s.A.3.2). The RBNZ threshold transaction reporting obligation for payments above NZD $10,000 survives the change of routing channel (s.A.4.2). The brief's claim that "our compliance team is comfortable" describes the existing *SWIFT-channel* screening posture. It is not a reviewed and confirmed analysis of the intra-group channel. EA registry TTPS-SCR-001 explicitly notes the screening service is "re-used from SWIFT flow", and TTPS-REP-001 explicitly notes threshold reporting "must confirm coverage for intra-group channel." Both confirmations are pre-launch obligations on the RBNZ AML/CFT Compliance Officer.

- *RBNZ FX Transaction Reporting* (C3) — The end-of-day NZD/AUD net settlement of intra-group positions is a foreign exchange transaction for RBNZ reporting purposes (policy doc s.D.1) even though no external counterparty is involved. The existing FX reporting infrastructure (TTPS-SET-001) was designed for SWIFT per-payment FX reporting and has not been assessed for intra-group net settlement (TTPS-RISK-003, severity HIGH). The treasury team must produce a written analysis of whether net positions are reportable as a single daily FX transaction or whether per-payment FX reporting is required; the Regulatory Affairs team must confirm the determination. Architecture guardrail ADR-CB-008 makes this Treasury Operations sign-off a DoR prerequisite.

- *Payment Services Regulations 2021 (DIA registration)* (C4) — A new proprietary channel with a novel intra-group settlement model and a sub-$10,000 retail threshold may constitute a new payment service type not covered by the enterprise's existing payment service licence (policy doc s.C.1; ADR-CB-007). DIA must issue a written determination of whether the channel is covered by the existing licence or requires new-type registration. Typical DIA determination timelines are 4–12 weeks (s.C.2); registration approval (if required) is a hard pre-launch gate.

**The AU regulatory leg is a direct obligation on the enterprise, not on the enterprise's Australian counterpart alone:**

- *AUSTRAC AML/CTF Act 2006 (Cth)* (C2) — Although the enterprise's Australian counterpart bears the primary AUSTRAC obligation for funds received into Australian accounts, AUSTRAC's correspondent banking rules impose a direct information-provision obligation on the enterprise as the sending entity: each credit instruction must carry sufficient originator information (legal name, account number, address, purpose) for the enterprise's Australian counterpart to satisfy its AUSTRAC KYC and record retention obligations (policy doc s.B.1). Additionally, the enterprise's Australian counterpart's AML/CTF Programme must document the intra-group arrangement as a correspondent banking arrangement and conduct due diligence on the enterprise — the group ownership relationship does not exempt this (s.B.2). The brief's framing — "our assumption is that the enterprise's Australian counterpart handles Australian regulatory compliance on their side and we handle ours" — is materially incorrect for the originator-information leg of the obligation. Inadequate originator information will cause the enterprise's Australian counterpart to delay or reject credit instructions, directly breaching the 2-hour customer settlement SLA (TTPS-RISK-004).

**The cross-border contractual obligation is the deepest constraint, not surfaced in the brief at all:**

- *SWIFT correspondent bank agreement — JPMorgan Chase* (C5) — The enterprise's SWIFT correspondent for NZD/AUD international payments is JPMorgan Chase (TTPS-SWIFT-001). The proprietary intra-group channel redirects eligible NZD/AUD payment volume — by design, the high-frequency sub-$10,000 retail tail — away from this SWIFT correspondent relationship. Architecture guardrail ADR-CB-002 mandates that any change to international payment routing include a review of all active correspondent bank agreements for the affected corridors before the design is approved. The ADR-CB-002 Note states that SWIFT correspondent agreements *may* contain explicit restrictions on routing transactions outside the agreed channel without prior notification, and that bypass without satisfying any such obligation creates contractual and credit relationship risk. EA registry TTPS-RISK-001 (severity HIGH) confirms the impact of the proprietary channel on the JPMorgan Chase correspondent relationship has not been assessed; TTPS-ROUTE-001 carries the embedded note "correspondent banking relationship implications to be assessed before activation." The brief makes no mention of the SWIFT correspondent agreement at all — it explicitly states the assumption that "the enterprise's Australian counterpart relationship is a group arrangement separate from the SWIFT correspondent infrastructure", which addresses the settlement counterparty but not the correspondent banking agreement governing NZD/AUD international payment routing. The bilateral correspondent banking agreement with JPMorgan Chase must be reviewed by Treasury Legal before the architecture design is finalised. If the agreement contains a notification or consent obligation, the obligation must be satisfied (and JPMorgan Chase's written acknowledgement received) before the channel is activated. Until reviewed, this surfaces as **RISK R1 with mandatory pre-launch review** and explicit escalation to a BLOCKER on confirmation of a notification or consent obligation.

**The integrated framing:** This is not "build a fast payment channel using the group relationship." It is "build a fast payment channel while (a) validating the existing AML/CFT screening and threshold reporting infrastructure for the new channel; (b) confirming and operationalising the enterprise's direct AUSTRAC originator-information obligation; (c) confirming RBNZ FX reporting treatment of the net settlement model; (d) obtaining DIA's written payment service type determination and any required registration; and (e) reviewing — and where required, notifying or obtaining consent under — the bilateral SWIFT correspondent banking agreement with JPMorgan Chase, before any customer transaction is routed through the proprietary channel." Each of these obligations has a named accountable owner; each owner produces a written confirmation or clearance; each clearance gates a deployment configuration flag; the channel does not handle live customer transactions until all five flags are `true`.

---

## Who It Affects

**The enterprise retail customers (primary beneficiary)** — NZ customers with recurring trans-Tasman payment needs: family remittance, small business AU supplier payments, regular transfers to AU accounts. Today they predominantly use Wise and similar services. Benefit: sub-$5 pricing and sub-2-hour settlement for eligible payments ≤NZD $10,000, retaining the enterprise's relationship for international payment activity.

**Payments product team (feature owner)** — Owns the channel feature. Accountable for ensuring all five pre-launch obligations are satisfied before retail launch. Engages Treasury Legal, Regulatory Affairs, RBNZ AML/CFT Compliance, Enterprise Treasury, and the enterprise's Australian counterpart compliance team. Owns the delivery timeline, the channel activation flag matrix, and the customer experience.

**RBNZ AML/CFT Compliance Officer (NZ — named gate owner for C1)** — Owns the NZ-leg AML/CFT obligation. Produces (i) written confirmation that the existing AML/CFT Sanctions Screening Service covers intra-group-routed instructions on equivalent terms to SWIFT-routed instructions (RBNZ-designated list, OFAC SDN, DFAT consolidated for AU beneficiaries; synchronous pre-commitment screening; fail-closed fallback); (ii) written confirmation that the RBNZ threshold transaction reporting infrastructure covers intra-group transactions ≥ NZD $10,000 on the same terms as SWIFT; (iii) files the BS11 Technology Change notification with RBNZ ≥30 business days before go-live. Sole authority to set the `AMLCFT_CHANNEL_VALIDATED` and `BS11_NOTIFICATION_DATE` deployment configuration fields.

**Enterprise Treasury Manager (NZ — named gate owner for C3, with Regulatory Affairs confirmation)** — Owns the net settlement FX position management. Produces the written analysis of RBNZ FX Transaction Reporting obligations for the end-of-day NZD/AUD net settlement model; addresses whether net positions are reportable as a single daily FX transaction or per-payment, and whether existing FX reporting infrastructure (TTPS-SET-001) covers intra-group net positions or requires extension. The Regulatory Affairs team confirms the determination. Joint authority (Treasury Manager + Regulatory Affairs team lead) to set `FX_REPORTING_VALIDATED`.

**Regulatory Affairs Manager (NZ — named gate owner for C4)** — Owns the DIA payment service type determination. Submits the formal written request to DIA; receives the written determination; if registration is required, manages the registration process to approval. Sole authority to set `DIA_REGISTRATION_CLEARED` after either the existing-licence-coverage determination is filed (with `DIA_ASSESSMENT_ID`) or the DIA registration approval reference number is filed (with `DIA_REGISTRATION_ID`).

**Payments Compliance Officer + Enterprise's Australian Counterpart Liaison (AU-side confirmation — named gate owners for C2)** — Owns the AUSTRAC originator information obligation. Coordinates with the enterprise's Australian counterpart compliance team to obtain (i) written confirmation of the AUSTRAC originator information field requirements (exact field names, format requirements, structured format/encoding); (ii) written confirmation that the enterprise's Australian counterpart AML/CTF Programme has been updated to document the intra-group arrangement as a correspondent banking arrangement and that due diligence on the enterprise has been completed. Conducts the gap self-assessment against existing customer record fields. Joint authority (the enterprise's Payments Compliance Officer + Enterprise's Australian Counterpart Compliance Liaison sign-off) to set `AUSTRAC_CONFIRMATION_RECEIVED`.

**Treasury Legal Counsel (named gate owner for C5 — cross-border contractual)** — Owns the SWIFT correspondent banking agreement review. Reviews the bilateral correspondent banking agreement with JPMorgan Chase. Issues either (i) a written clearance memorandum confirming no notification or consent obligation applies (filed with `CORRESPONDENT_AGREEMENT_CLEARANCE_ID`), or (ii) prepares and files the required notification/consent application and obtains JPMorgan Chase's written acknowledgement or consent (filed with `CORRESPONDENT_NOTIFICATION_ACK_ID`). Sole authority to set `CORRESPONDENT_AGREEMENT_CLEARED`. Treasury Legal is the non-delegable owner for this gate because the obligation is contractual rather than regulatory — neither RBNZ compliance, AUSTRAC compliance, nor Regulatory Affairs is the correct functional owner.

**Architecture Review Board (ARB) — guardrail enforcement role** — ADR-CB-002 governance owner. Reviews the channel design before implementation. The ARB's review includes verification that ADR-CB-002 (correspondent agreement review), ADR-CB-005 (dual-jurisdiction AML/CFT obligation map), ADR-CB-006 (AUSTRAC information standard), ADR-CB-007 (DIA assessment), and ADR-CB-008 (FX reporting Treasury sign-off as DoR prerequisite) are all addressed before approving the architecture for build.

**AUSTRAC (regulator — Australian)** — Indirect: does not engage the enterprise directly. AUSTRAC's compliance posture is mediated through the enterprise's Australian counterpart's AML/CTF Programme. The enterprise's posture toward AUSTRAC is satisfied through originator information provision (C2 obligation).

**RBNZ (regulator — NZ)** — Direct: receives the BS11 Technology Change notification (C1 sub-obligation, ≥30 business days before go-live), the threshold transaction reports (ongoing operation), the FX transaction reports (C3, ongoing operation). RBNZ relationship team may be engaged for formal interpretation on C3 if required.

**DIA (regulator — NZ)** — Direct: receives the payment service type assessment request; issues written determination (C4); receives any new payment service type registration (C4 if required).

**JPMorgan Chase (correspondent counterparty — contractual)** — Direct: receives notification or consent request from Treasury Legal if the bilateral agreement review confirms an obligation exists (C5). Provides written acknowledgement or consent, which is the trigger for setting `CORRESPONDENT_AGREEMENT_CLEARED` under AC2 determination (b).

**The enterprise's Australian counterpart (settlement and AU AML/CFT partner)** — Direct: provides compliance confirmations (C2); processes credit instructions on the AU leg; receives net settlement reconciliation.

---

## MVP Scope

The smallest end-to-end deliverable that enables retail NZ-to-AU payment instructions to flow through the proprietary intra-group channel, with all five regulatory and contractual pre-conditions satisfied before any customer instruction is routed through the channel:

1. **Payment instruction intake with channel activation gating** — accept payment instructions from TTPS-IN-001 (Retail Digital Banking Platform) and TTPS-IN-002 (Phone Banking System) for NZ-to-AU transfers ≤ NZD $10,000. Intake enforces all five channel activation flags as a pre-flight gate (`AMLCFT_CHANNEL_VALIDATED`, `AUSTRAC_CONFIRMATION_RECEIVED`, `FX_REPORTING_VALIDATED`, `DIA_REGISTRATION_CLEARED`, `CORRESPONDENT_AGREEMENT_CLEARED`). If any is `false`, intake returns a structured "service not yet available" response identifying the unmet condition. Threshold routing logic: ≤ NZD $10,000 + AU beneficiary + eligibility met → intra-group channel; otherwise → SWIFT gateway (TTPS-SWIFT-001) with existing terms.

2. **AML/CFT sanctions screening — intra-group channel coverage** — every payment instruction routed through the intra-group channel passes through TTPS-SCR-001 synchronously before commitment. Screening lists: RBNZ-designated persons, OFAC SDN, DFAT consolidated (for AU beneficiary). Fail-closed fallback: screening service unavailable → instruction declined (per ADR-CB-003/004; no asynchronous or batch screening for real-time-settlement channels). A new integration test verifies coverage explicitly — not an inherited assumption from the SWIFT flow.

3. **Originator information data model — AUSTRAC compliance** — the payment instruction data model carries the AUSTRAC-required originator fields (legal name, account number, NZ address, purpose) end-to-end from customer intake through to the credit instruction transmitted via TTPS-REG-002. Exact field names, formats, and encoding are confirmed by the AUSTRAC originator information confirmation (C2 obligation). Completeness validation at intake; transmission blocked if any required field is missing.

4. **Intra-group credit instruction transmission** — the screened, originator-information-complete credit instruction is transmitted to the enterprise's Australian counterpart via TTPS-ROUTE-001. Transmission gated by `CORRESPONDENT_AGREEMENT_CLEARED` (C5) and `AUSTRAC_CONFIRMATION_RECEIVED` (C2). Acknowledgement from enterprise's Australian counterpart is recorded against the instruction.

5. **RBNZ threshold transaction reporting — intra-group coverage** — instructions with amount ≥ NZD $10,000 (note: intra-group channel is capped at ≤ NZD $10,000, so this primarily applies to SWIFT-routed overflow; however, where intra-group instructions sit at or near the threshold and aggregate to ≥ NZD $10,000 within structured-transaction rules, reporting applies) generate a threshold transaction report via TTPS-REP-001 on the same terms as SWIFT-routed transactions. Confirmation that the reporting module covers intra-group is a C1 sub-obligation (Epic 1 Story 1.1 AC2).

6. **Net settlement and RBNZ FX transaction reporting** — end-of-day NZD/AUD net positions transmitted to TTPS-SET-001. FX transaction reporting applied per the determination produced under C3 (Epic 1 Story 1.3). Settlement transmission gated by `FX_REPORTING_VALIDATED`.

7. **Customer settlement confirmation** — settlement confirmation issued to the originating customer via TTPS-CONF-001 within the 2-hour SLA window, contingent on credit instruction acknowledgement from the enterprise's Australian counterpart.

8. **SWIFT fallback path preserving SLA** — for instructions submitted near or past the intra-group channel processing cut-off, fallback to SWIFT must either preserve the 2-hour SLA commitment for that instruction or notify the customer of the expected delay (TTPS-RISK-005).

**Pre-launch pre-conditions (engineering build may proceed in dev/UAT in parallel; production activation is gated):**

- **B1 / C1 gate (NZ regulatory):** RBNZ AML/CFT Compliance Officer files written confirmations of (a) AML/CFT screening coverage and (b) RBNZ threshold reporting coverage for the intra-group channel; BS11 Technology Change notification filed ≥30 business days before go-live; `AMLCFT_CHANNEL_VALIDATED` and `BS11_NOTIFICATION_DATE` set.

- **B2 / C2 gate (AU regulatory):** Payments Compliance Officer (with enterprise's Australian counterpart liaison) files written confirmations of (a) AUSTRAC originator information field requirements from the enterprise's Australian counterpart compliance team and (b) enterprise's Australian counterpart AML/CTF Programme update documenting the intra-group arrangement; `AUSTRAC_CONFIRMATION_RECEIVED` set.

- **B3 / C3 gate (NZ regulatory):** Enterprise Treasury Manager files written analysis; Regulatory Affairs team confirms determination; `FX_REPORTING_VALIDATED` set.

- **B4 / C4 gate (NZ regulatory):** Regulatory Affairs Manager obtains DIA written determination (existing-licence-coverage or new-type-registration-required); if registration required, DIA registration approval received; `DIA_REGISTRATION_CLEARED` set.

- **B5 / C5 gate (cross-border contractual):** Treasury Legal Counsel reviews JPMorgan Chase bilateral correspondent banking agreement; issues clearance memorandum (no obligation) or files notification/obtains consent (obligation confirmed); JPMorgan Chase written acknowledgement received if required; `CORRESPONDENT_AGREEMENT_CLEARED` set.

The five gates are independent — each may be progressed by its named owner in parallel. The channel does not activate for live customer transactions until all five flags are `true`. Architecture Review Board approves the channel design only after ADR-CB-002 correspondent agreement review (B5/C5) and ADR-CB-008 Treasury sign-off (B3/C3) are addressed.

---

## Out of Scope

1. **AU-to-NZ payment direction.** Future phase contingent on pilot performance. Excluded because reversing the flow imposes additional regulatory obligations (RBNZ inbound payment screening, the enterprise's Australian counterpart-side AUSTRAC reporting obligations as the originator, distinct correspondent-agreement implications for AUD/NZD reverse flow) that materially expand the constraint inventory and warrant a separate discovery.

2. **Intra-group channel transactions above NZD $10,000.** Above-threshold payments continue via standard SWIFT with existing pricing. Excluded because the intra-group channel's value proposition (sub-$5 pricing) is anchored to retail-tail economics; above-threshold transactions also raise structured-transaction surveillance considerations under RBNZ AML/CFT that are outside the validated scope of the intra-group channel screening confirmation.

3. **International corridors other than NZD/AUD.** Other currency pairs and other destination countries continue on SWIFT. Excluded because each corridor has distinct correspondent banking arrangements, distinct regulatory obligations, and distinct settlement infrastructure; expanding scope would require separate ADR-CB-002 reviews per corridor.

4. **AML/CFT programme redesign.** The enterprise retains its existing RBNZ AML/CFT screening service and threshold reporting infrastructure. MVP scope is validation and (where required) extension of coverage for the new channel — not a redesign of the AML/CFT programme. Excluded because a programme redesign would invalidate the BS11 incrementality analysis and require a different regulatory engagement model with RBNZ.

5. **The enterprise's Australian counterpart-side system development.** The enterprise's scope ends at the credit instruction transmitted via TTPS-ROUTE-001. The enterprise's Australian counterpart's systems for receiving credit instructions and crediting Australian beneficiary accounts are out of scope for this delivery. Excluded because the enterprise's Australian counterpart owns its own systems, change governance, and budget; cross-entity engineering is governed by the bilateral arrangement, not this discovery.

6. **JPMorgan Chase correspondent relationship commercial management.** Treasury's management of the commercial implications of reduced NZD/AUD volume through the SWIFT correspondent relationship is outside product engineering scope. Excluded because it is a Treasury-Finance matter, not a product feature. However, **the contractual notification or consent obligation under the bilateral correspondent banking agreement (C5) is in scope as a pre-launch gate** — the distinction is between commercial-relationship management (out) and contractual-compliance obligation (in, as B5/C5).

7. **Retrospective migration of historical SWIFT payment volume.** Historical SWIFT payments are not impacted; the proprietary channel applies to new instructions from the go-live date forward. Excluded because retrospective routing of completed payments is operationally meaningless and creates settlement integrity risk.

8. **Manual override of declined instructions.** Payment instructions failing AML/CFT screening, AUSTRAC originator information validation, or any channel activation gate are declined to the customer interface with a structured error. No manual override or retry path is in scope. Excluded because override pathways for AML/CFT decisions raise serious compliance concerns and require a separate exceptions-handling design with appropriate governance.

---

## Assumptions and Risks

### Assumptions

[ASSUMPTION — A1 — AML/CFT screening service supports intra-group channel without architectural change] The existing AML/CFT Sanctions Screening Service (TTPS-SCR-001) provides equivalent screening for intra-group-routed instructions as for SWIFT-routed instructions, with no channel-specific configuration gaps. If the service has SWIFT-bound integration logic (e.g., MT103-specific field mappings, SWIFT-channel-specific list configurations), additional integration work is required. **Validated by:** RBNZ AML/CFT Compliance Officer written confirmation under Story 1.1 AC1 before B1/C1 gate is set.

[ASSUMPTION — A2 — AUSTRAC-required originator fields are held in existing customer records] The originator information fields required by the enterprise's Australian counterpart's AUSTRAC programme (legal name, account number, address, purpose) are already held in customer account records and can be included in the credit instruction without additional customer-facing data collection. If the enterprise's Australian counterpart's programme requires fields not currently held (national identity document number for non-account holders; structured address components; alternative identifier formats), customer intake changes may be required. **Validated by:** the enterprise Payments Compliance gap self-assessment under Story 1.2 AC3.

[ASSUMPTION — A3 — DIA determination or registration is achievable within the build timeline] DIA confirms either existing licence coverage or completes new payment service type registration within the 6-month build timeline (s.C.2 cites typical 4–12 week registration review). If registration is required and approval extends beyond the build timeline, the retail launch is deferred regardless of engineering completion. **Validated by:** Regulatory Affairs Manager DIA submission and tracking under Story 1.4; weekly status reporting to the Payments product team.

[ASSUMPTION — A4 — Net settlement positions are reportable in aggregate form] The treasury team confirms that end-of-day NZD/AUD net settlement positions can be reported as a single daily net FX transaction (or confirmed below the NZD $100,000 reporting threshold per s.D.2), rather than requiring per-payment transaction-level FX reporting. If per-payment reporting is required, the net settlement model may need to be restructured or extended with a per-payment reporting feed. **Validated by:** Enterprise Treasury Manager written analysis + Regulatory Affairs determination under Story 1.3.

[ASSUMPTION — A5 — Customer 2-hour SLA is achievable within enterprise's Australian counterpart's credit instruction processing window] The enterprise's Australian counterpart can process and acknowledge credit instructions within a window that allows the 2-hour customer settlement SLA to be met for instructions submitted within standard business hours. If the enterprise's Australian counterpart's processing window (e.g., compliance queue, business-hours-only processing) introduces latency that breaches 2 hours, customer-facing SLA messaging must be updated. **Validated by:** SLA pilot testing during UAT with the enterprise's Australian counterpart.

### Blockers

[BLOCKER — B1 — RBNZ AML/CFT screening and threshold reporting validation for intra-group channel] The brief asserts the existing AML/CFT process covers requirements. The assertion has not been validated for a non-SWIFT intra-group channel. RBNZ AML/CFT obligations are channel-independent in legal scope (policy doc s.A.1, s.A.3.2, s.A.4.2). The enterprise retains primary AML/CFT liability regardless of routing. The RBNZ AML/CFT Compliance Officer must produce written confirmations that the existing screening service (TTPS-SCR-001) and threshold reporting infrastructure (TTPS-REP-001) cover the intra-group channel on equivalent terms to SWIFT. Additionally, a BS11 Technology Change notification must be filed with RBNZ ≥30 business days before go-live. **Go-live blocked on:** `AMLCFT_CHANNEL_VALIDATED` = true (post written confirmations) AND `BS11_NOTIFICATION_DATE` set ≥30 business days before deployment date. **Named owner:** RBNZ AML/CFT Compliance Officer (NZ).

[BLOCKER — B2 — AUSTRAC originator information confirmation and enterprise's Australian counterpart AML/CTF Programme update] The brief treats AUSTRAC compliance as exclusively the enterprise's Australian counterpart's problem. AUSTRAC's correspondent banking rules impose a direct originator-information obligation on the enterprise as the sending entity (policy doc s.B.1). The enterprise's Australian counterpart's AML/CTF Programme must additionally document the intra-group arrangement as a correspondent banking arrangement (s.B.2); group ownership does not exempt this requirement. Both confirmations are pre-launch gates. Inadequate originator information will cause the enterprise's Australian counterpart to delay or reject credit instructions, directly breaching the 2-hour customer SLA. **Go-live blocked on:** `AUSTRAC_CONFIRMATION_RECEIVED` = true (post both written confirmations and the gap self-assessment). **Named owner:** the enterprise Payments Compliance Officer + Enterprise's Australian Counterpart Compliance Liaison (joint sign-off; AU-side confirmation cannot be issued by NZ-side roles alone).

[BLOCKER — B3 — RBNZ FX Transaction Reporting confirmation for net settlement model] End-of-day NZD/AUD net settlement is an FX transaction under RBNZ rules (policy doc s.D.1). Existing FX reporting infrastructure was designed for SWIFT per-payment reporting; coverage of intra-group net settlement is not confirmed (TTPS-RISK-003, severity HIGH). The Enterprise Treasury Manager must produce a written analysis; the Regulatory Affairs team must confirm the determination. If the existing infrastructure does not cover net settlement, extension work is in scope for Epic 3 (Story 3.1). **Go-live blocked on:** `FX_REPORTING_VALIDATED` = true (post written analysis and Regulatory Affairs confirmation). **Named owner:** Enterprise Treasury Manager with Regulatory Affairs team lead confirmation.

[BLOCKER — B4 — DIA payment service type determination] The proprietary intra-group channel — novel settlement model, intra-group counterparty, sub-$10,000 retail threshold — may constitute a new payment service type under PSR 2021 (policy doc s.C.1; ADR-CB-007). DIA written determination must be obtained. If DIA requires new-type registration, registration must complete before retail launch. **Go-live blocked on:** `DIA_REGISTRATION_CLEARED` = true (post DIA written determination — either existing-licence-coverage confirmed or new registration approved). **Named owner:** Regulatory Affairs Manager.

### Risks

[RISK — R1 — SWIFT correspondent bank agreement (JPMorgan Chase) review — escalates to BLOCKER on confirmation of notification obligation] The enterprise's SWIFT correspondent for NZD/AUD is JPMorgan Chase (TTPS-SWIFT-001). The proprietary channel redirects sub-$10,000 NZD/AUD retail volume away from this correspondent relationship. Architecture guardrail ADR-CB-002 mandates review of all active correspondent bank agreements for the affected corridor before any routing change is implemented; ADR-CB-002 Note states correspondent agreements may contain notification obligations for routing changes, and bypass without satisfying any such obligation creates contractual and credit relationship risk. EA registry TTPS-RISK-001 (severity HIGH) confirms the impact on the JPMorgan Chase correspondent relationship has not been assessed; TTPS-ROUTE-001 carries an explicit "implications to be assessed before activation" note. The bilateral correspondent banking agreement with JPMorgan Chase must be reviewed by Treasury Legal Counsel before the channel architecture design is finalised. **Surfacing chain:** (1) JPMorgan Chase named as the SWIFT correspondent for NZD/AUD payments (TTPS-SWIFT-001); (2) HIGH-severity registry entry that the correspondent relationship impact is unassessed (TTPS-RISK-001 + TTPS-ROUTE-001); (3) ADR-CB-002 Note dispositively naming the contractual mechanism (notification obligation for non-SWIFT routing) and the consequence (contractual + credit relationship risk). The brief does not mention the SWIFT correspondent agreement at all and assumes the enterprise's Australian counterpart relationship is "separate from the SWIFT correspondent infrastructure" — that assumption addresses the settlement counterparty but does not address the correspondent banking agreement governing NZD/AUD international payment routing. **Escalation condition:** If Treasury Legal's review confirms a notification or consent obligation under the bilateral agreement, this risk is elevated to a BLOCKER until JPMorgan Chase's written acknowledgement or consent is filed. **Go-live blocked on:** `CORRESPONDENT_AGREEMENT_CLEARED` = true. **Named owner:** Treasury Legal Counsel (non-delegable — contractual obligation, not regulatory; neither RBNZ Compliance, AUSTRAC Compliance, nor Regulatory Affairs is the correct functional owner). **Mitigation:** Treasury Legal review commences in parallel with architecture design (not after engineering build commences). Engineering may build the channel in dev/UAT in parallel with the legal review; production activation is gated.

[RISK — R2 — Cumulative pre-launch timeline] Five independent pre-launch obligations, each with its own named owner and external dependency (RBNZ, AUSTRAC via the enterprise's Australian counterpart, RBNZ FX reporting interpretation, DIA, JPMorgan Chase). The longest critical path determines launch date. DIA registration (if required) is typically 4–12 weeks; JPMorgan Chase consent (if required) timeline is unknown until the agreement is read. **Mitigation:** all five owners begin their work in parallel at discovery sign-off; weekly cross-team standup tracks status of each gate; the engineering build proceeds in dev/UAT independent of the gates' status; production activation is the only gated step. The 6-month build timeline accommodates a 12-week regulatory critical path, but a longer JPMorgan Chase consent timeline could push retail launch later.

[RISK — R3 — Originator information data quality at intake] If A2 is invalidated (some required AUSTRAC fields are not held in customer records, or are held in incompatible formats), customer-facing data capture changes may be required at intake — this would expand engineering scope and may impact 2-hour SLA processing performance. **Mitigation:** Story 1.2 AC3 gap self-assessment occurs early enough that any intake-side data capture changes can be incorporated into Story 2.3 before integration testing.

[RISK — R4 — The enterprise's Australian counterpart processing window does not support 2-hour SLA] If A5 is invalidated (the enterprise's Australian counterpart's credit instruction processing window introduces latency that breaches 2 hours for typical business-hours submissions), the customer-facing SLA must be revised. **Mitigation:** SLA pilot testing during UAT confirms end-to-end timing across realistic processing windows.

---

## Directional Success Indicators

1. **Customer settlement speed (primary value)** — eligible NZ-to-AU payments ≤ NZD $10,000 settled (credit instruction acknowledged + customer confirmation issued) within 2 hours for instructions submitted during standard business hours. Baseline: 1–2 business days via SWIFT.

2. **Customer pricing (primary value)** — transaction fee ≤ NZD $5 per eligible instruction. Baseline: NZD $18–25 via SWIFT.

3. **Revenue recovery (commercial value)** — measurable progress against the NZD $4.2M annual revenue gap to alternative services; target indicator: NZD $1M+ recovered within 12 months of full retail rollout. Mechanism: customer migration from Wise/Western Union back to the enterprise's trans-Tasman channel.

4. **Dual-jurisdiction AML/CFT compliance (regulated outcome — C1, C2)** — zero RBNZ or AUSTRAC compliance findings related to the intra-group channel in the first 12 months post-launch; zero instances of the enterprise's Australian counterpart delaying or rejecting credit instructions due to inadequate originator information (covers both regulated leg outcomes).

5. **DIA registration / licence determination (regulated outcome — C4)** — DIA written determination obtained before retail launch; if new-type registration required, registration approved before retail launch.

6. **RBNZ FX reporting compliance (regulated outcome — C3)** — net settlement positions reported per the determination produced under C3 from the first settlement cycle; zero FX reporting exceptions in the first 12 months.

7. **Correspondent banking compliance (contractual outcome — C5)** — Treasury Legal review of JPMorgan Chase bilateral agreement completed before architecture design finalised; any required notification or consent process completed and acknowledged before channel activation; zero JPMorgan Chase relationship escalations or compliance incidents in the first 12 months arising from the routing change.

8. **Channel reliability and integrity (operational outcome)** — `AMLCFT_CHANNEL_VALIDATED`, `AUSTRAC_CONFIRMATION_RECEIVED`, `FX_REPORTING_VALIDATED`, `DIA_REGISTRATION_CLEARED`, `CORRESPONDENT_AGREEMENT_CLEARED` all `true` for the entire production operating period; zero instances of channel processing instructions while any gate flag was `false`.

---

## Constraints

**Time:** 6-month build timeline assumed by operator. Pilot to a small cohort before full rollout. The 6-month timeline is engineering-build oriented; the longest critical path is the regulatory and contractual pre-launch gates (estimated 12 weeks for DIA in the worst case; JPMorgan Chase consent timeline unknown). Retail launch is the gated outcome — engineering may complete the build and stand the channel up in UAT in parallel with the pre-launch gates' progression.

**Regulatory:**
- RBNZ AML/CFT Act 2009 (NZ leg — channel-independent obligations; primary AML/CFT liability retained by the enterprise; BS11 Technology Change notification ≥30 business days before go-live).
- AUSTRAC AML/CTF Act 2006 (Cth) (AU leg — enterprise direct originator information obligation; the enterprise's Australian counterpart AML/CTF Programme correspondent banking documentation).
- RBNZ FX Transaction Reporting (NZ leg — net settlement model treatment).
- Payment Services Regulations 2021 (NZ leg — DIA determination, potential new-type registration).

**Contractual:**
- SWIFT bilateral correspondent banking agreement with JPMorgan Chase (cross-border; ADR-CB-002 mandatory review; notification or consent obligation possible).
- Bilateral arrangement with the enterprise's Australian counterpart for settlement and correspondent banking documentation.

**Technical:**
- Re-use of existing AML/CFT Sanctions Screening Service (TTPS-SCR-001) — coverage validation required, not assumed.
- Re-use of existing RBNZ threshold transaction reporting infrastructure (TTPS-REP-001) — coverage validation required, not assumed.
- Re-use of existing FX reporting infrastructure (TTPS-SET-001) — coverage validation required for net settlement model.
- Customer record data model must support AUSTRAC-required originator fields — validated by gap self-assessment.

**Architecture (guardrails):**
- ADR-CB-002 (correspondent agreement review before routing change).
- ADR-CB-003/004 (mandatory synchronous sanctions screening; fail-closed fallback).
- ADR-CB-005 (dual-jurisdiction AML/CFT obligation mapping).
- ADR-CB-006 (AUSTRAC information standards for AU-leg).
- ADR-CB-007 (DIA payment service type assessment before retail launch).
- ADR-CB-008 (RBNZ FX reporting Treasury Operations sign-off as DoR prerequisite).

**Team capability:** Cross-team coordination — Payments product, Payments Compliance, RBNZ AML/CFT Compliance, Enterprise Treasury, Regulatory Affairs, Treasury Legal, the enterprise's Australian counterpart liaison. Five distinct functional accountabilities. Cross-team coordination protocol (weekly gate-status standup) is required to avoid timeline slippage from any one gate.

**Dependencies (external):**
- DIA (NZ regulator — written determination required).
- The enterprise's Australian counterpart compliance team (AUSTRAC originator information confirmation + AML/CTF Programme documentation).
- JPMorgan Chase (notification or consent acknowledgement, if obligation confirmed by Treasury Legal review).
- RBNZ (BS11 Technology Change notification; FX reporting interpretation, possibly).

---

## Contributors

- Payments Product Lead — feature owner; coordinated cross-team obligations.
- RBNZ AML/CFT Compliance Officer — C1 obligation analysis.
- Payments Compliance Officer — C2 obligation analysis; the enterprise's Australian counterpart liaison.
- Enterprise Treasury Manager — C3 obligation framing.
- Regulatory Affairs Manager — C4 obligation framing; DIA engagement strategy.
- Treasury Legal Counsel — C5 obligation framing; correspondent bank agreement review scope.
- Enterprise Architect — ADR-CB-002 / ADR-CB-005 / ADR-CB-006 / ADR-CB-007 / ADR-CB-008 application; ARB review prep.

## Reviewers

- Head of Payments — product and commercial review.
- Head of Compliance — multi-jurisdiction regulatory framing review.
- Treasury Legal Counsel — C5 contractual framing review.
- Enterprise Architect — guardrail compliance review.

## Approved By

[EVAL-MODE] EXP-008 Config B / S13 — Approved 2026-05-17 for eval pipeline progression.

---

<!-- CPF-TRACE
stage: /discovery
model: claude-opus-4-6
config: B
experiment: EXP-008-corpus-breadth-eval
run: config-B-S13
date: 2026-05-17

constraints_identified:
- C1 (NZ leg): RBNZ AML/CFT Act 2009 — enterprise retains primary AML/CFT liability regardless of routing channel (policy s.A.1); sanctions screening obligation attaches to instruction, not transmission channel (s.A.3.2); RBNZ threshold transaction reporting applies regardless of channel and is not waived because settlement occurs through internal group books (s.A.4.2); "compliance team is comfortable" framing covers existing SWIFT-channel posture, not validated for intra-group channel; written compliance confirmation required + BS11 Technology Change notification ≥30 business days before go-live [surfaced from: operator brief "existing AML/CFT screening" + "compliance team comfortable" (the assertion that is materially under-validated); EA registry TTPS-SCR-001 "re-used from SWIFT flow" + TTPS-REP-001 "must confirm coverage for intra-group channel"; policy doc Part A s.A.1, s.A.3.2, s.A.4.2 establishing channel independence in law]
- C2 (AU leg): AUSTRAC AML/CTF Act 2006 (Cth) — enterprise has direct originator information provision obligation to the enterprise's Australian counterpart (legal name, account number, address, purpose); enterprise's Australian counterpart AML/CTF Programme must document the intra-group arrangement as a correspondent banking arrangement; due diligence on the enterprise required; group ownership does not exempt; "our assumption is that the enterprise's Australian counterpart handles their side" is materially incorrect [surfaced from: EA registry TTPS-REG-002 originator information bundle requirement + format/content unconfirmed; TTPS-RISK-004 originator information format not confirmed; policy doc Part B s.B.1 enterprise's direct obligation + s.B.2 AML/CTF Programme correspondent banking documentation; architecture guardrail ADR-CB-006 AUSTRAC information standards; operator brief "enterprise's Australian counterpart handles Australian regulatory compliance on their side" — directly contradicted by policy s.B.1]
- C3 (NZ leg): RBNZ FX Transaction Reporting — end-of-day NZD/AUD net settlement = FX transaction (policy s.D.1) even with no external counterparty; NZD $100,000 reporting threshold per s.D.2; existing FX reporting designed for SWIFT per-payment reporting, not intra-group net settlement; Treasury Operations sign-off is DoR prerequisite per ADR-CB-008 [surfaced from: EA registry TTPS-SET-001 RBNZ FX transaction reporting obligation; TTPS-RISK-003 HIGH FX reporting not assessed for intra-group channel; policy doc Part D s.D.1, s.D.2; architecture guardrail ADR-CB-008]
- C4 (NZ leg): Payment Services Regulations 2021 (NZ) — proprietary channel with novel intra-group settlement model and sub-$10,000 retail threshold may constitute a new payment service type; DIA written determination required; if new-type registration required, registration must complete before retail launch; typical 4–12 week DIA review timeline [surfaced from: EA registry TTPS-REG-001 DIA registration status not confirmed; TTPS-RISK-002 HIGH DIA registration may be required; policy doc Part C s.C.1, s.C.2; architecture guardrail ADR-CB-007 written Regulatory Affairs assessment mandatory before any new payment channel offered to retail customers]
- C5 (cross-border contractual): SWIFT correspondent bank agreement (JPMorgan Chase) — bilateral correspondent banking agreement must be reviewed before channel activation; if agreement contains notification or consent obligation for routing changes that bypass the agreed SWIFT channel for the NZD/AUD corridor, the obligation must be satisfied and JPMorgan Chase's written acknowledgement received before channel goes live; bypass without satisfying obligation creates contractual and credit relationship risk [SURFACED via three-signal compositional inference: (1) TTPS-SWIFT-001 — JPMorgan Chase named as active SWIFT correspondent for NZD/AUD international payments; (2) TTPS-RISK-001 HIGH + TTPS-ROUTE-001 embedded note "correspondent banking relationship implications to be assessed before activation" — impact on correspondent relationship not assessed; (3) ADR-CB-002 + ADR-CB-002 Note — mandatory review of all active correspondent bank agreements for affected corridors before routing change; agreements may contain explicit notification obligations; bypass creates contractual + credit risk. Operator brief makes no mention of the correspondent agreement; explicitly assumes "the enterprise's Australian counterpart relationship is a group arrangement separate from the SWIFT correspondent infrastructure" (which addresses settlement counterparty but not the correspondent banking agreement governing NZD/AUD international payment routing). Surfaced as RISK R1 with mandatory pre-launch review and explicit escalation to BLOCKER on confirmation of notification or consent obligation. Named owner: Treasury Legal Counsel — non-delegable because the obligation is contractual rather than regulatory.]

constraints_carried_forward:
- C1: Named in Problem Statement (NZ regulatory leg — "RBNZ AML/CFT Act 2009 (C1)"); in Who It Affects (RBNZ AML/CFT Compliance Officer as named gate owner with sole authority for AMLCFT_CHANNEL_VALIDATED and BS11_NOTIFICATION_DATE); in MVP Scope item 2 (AML/CFT sanctions screening — intra-group channel coverage); item 5 (RBNZ threshold transaction reporting — intra-group coverage); pre-launch pre-condition B1/C1; Blockers section B1 with named owner and gate flag; Constraints section (regulatory); Success Indicator 4 (dual-jurisdiction AML/CFT compliance)
- C2: Named in Problem Statement (AU regulatory leg — "AUSTRAC AML/CTF Act 2006 (Cth) (C2)"); in Who It Affects (Payments Compliance Officer + Enterprise's Australian Counterpart Liaison as named joint gate owners for AUSTRAC_CONFIRMATION_RECEIVED); in MVP Scope item 3 (originator information data model — AUSTRAC compliance); pre-launch pre-condition B2/C2; Blockers section B2 with named owner (jurisdictionally split: NZ-side Payments Compliance + AU-side enterprise's Australian counterpart liaison joint sign-off); Constraints section; Success Indicator 4
- C3: Named in Problem Statement (NZ regulatory leg — "RBNZ FX Transaction Reporting (C3)"); in Who It Affects (Enterprise Treasury Manager as named gate owner with Regulatory Affairs confirmation, joint authority for FX_REPORTING_VALIDATED); in MVP Scope item 6 (net settlement and RBNZ FX transaction reporting); pre-launch pre-condition B3/C3; Blockers section B3 with named owner; Constraints section; Success Indicator 6
- C4: Named in Problem Statement (NZ regulatory leg — "Payment Services Regulations 2021 (DIA registration) (C4)"); in Who It Affects (Regulatory Affairs Manager as named gate owner with sole authority for DIA_REGISTRATION_CLEARED); in MVP Scope pre-launch pre-condition B4/C4; Blockers section B4 with named owner; Constraints section; Success Indicator 5
- C5: Named in Problem Statement (cross-border contractual obligation — "SWIFT correspondent bank agreement — JPMorgan Chase (C5)"); in Who It Affects (Treasury Legal Counsel as named gate owner — explicitly identified as non-delegable because the obligation is contractual rather than regulatory; sole authority for CORRESPONDENT_AGREEMENT_CLEARED); in MVP Scope item 4 (intra-group credit instruction transmission gated by CORRESPONDENT_AGREEMENT_CLEARED); pre-launch pre-condition B5/C5; Risks section R1 with named owner and explicit BLOCKER escalation condition + three-signal surfacing chain documented; Out of Scope item 6 (commercial-relationship management out, contractual-compliance obligation in); Constraints section (contractual); Success Indicator 7

constraints_not_carried: none — all five constraints identified, named in problem statement, mapped to named gate owners with jurisdiction-appropriate accountability, and carried into MVP scope + pre-conditions + blockers/risks + success indicators

c5_surfaced: true
c5_surfacing_quality: full
c5_surface_stage: /discovery
c5_surface_mechanism: |
  Three-signal compositional inference. No single injection source names the
  specific bilateral JPMorgan Chase agreement notification obligation; surfacing
  required reasoning across three independent signals.
  (1) EA registry TTPS-SWIFT-001 — names JPMorgan Chase as the active SWIFT
  correspondent for NZD/AUD international payments (corridor-correspondent
  identity);
  (2) EA registry TTPS-RISK-001 HIGH + TTPS-ROUTE-001 embedded note
  "correspondent banking relationship implications to be assessed before
  activation" — signals that the correspondent relationship impact of the new
  routing channel is unassessed and that this is a recognised pre-activation gap;
  (3) ADR-CB-002 + ADR-CB-002 Note — at the architecture-policy framework level,
  the Note states correspondent bank agreements "may contain explicit restrictions
  on routing transactions outside the agreed SWIFT channel without prior
  notification" and that bypass without satisfying any such obligation "create[s]
  contractual and credit relationship risk." The guardrail does NOT assert that
  the JPMorgan Chase agreement specifically contains this clause; that inference
  is a model reasoning step combining (1)+(2)+(3).
  Operator brief makes no mention of the SWIFT correspondent agreement and
  explicitly frames the enterprise's Australian counterpart relationship as
  "separate from the SWIFT correspondent infrastructure" — which addresses the
  settlement counterparty (correct) but does not address the correspondent banking
  agreement governing NZD/AUD international payment routing (the C5 hinge).
  Surfaced as RISK R1 with calibrated confidence (review required; obligation
  confirmed only after the bilateral agreement is read), explicit escalation
  condition (R1 → BLOCKER on confirmation of notification or consent obligation),
  and named non-delegable gate owner (Treasury Legal Counsel — contractual rather
  than regulatory, so neither RBNZ nor AUSTRAC nor Regulatory Affairs is the
  correct functional owner).

multi_jurisdiction_mapping:
  nz_leg:
    constraints: [C1 (RBNZ AML/CFT), C3 (RBNZ FX reporting), C4 (DIA / PSR 2021)]
    gate_owners: [RBNZ AML/CFT Compliance Officer (C1), Enterprise Treasury Manager + Regulatory Affairs lead (C3), Regulatory Affairs Manager (C4)]
    notes: Each NZ-leg constraint has a distinct named NZ compliance / regulatory owner. C1 sole authority; C3 joint Treasury + Regulatory Affairs; C4 sole authority.
  au_leg:
    constraints: [C2 (AUSTRAC)]
    gate_owners: [Payments Compliance Officer (NZ) + Enterprise's Australian Counterpart Compliance Liaison (AU-side confirmation) — joint sign-off]
    notes: AU-leg gate requires AU-side confirmation; cannot be issued by NZ-side roles alone. The Compliance Officer coordinates; the AU-side counterpart provides the actual AUSTRAC programme confirmation.
  cross_border:
    constraints: [C5 (SWIFT correspondent agreement — JPMorgan Chase)]
    gate_owners: [Treasury Legal Counsel — non-delegable]
    notes: Contractual obligation, not regulatory; Treasury Legal is the correct functional owner. Neither NZ regulatory compliance, AU regulatory compliance, nor general Regulatory Affairs has the contractual expertise or accountability for SWIFT correspondent bilateral agreements.
-->
