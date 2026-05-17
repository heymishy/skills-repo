# Definition: Trans-Tasman Payment Corridor — Proprietary Intra-Group Routing Channel

**Feature:** trans-tasman-payment-corridor
**Discovery status:** Approved (eval-mode — read from disk: `runs/config-A-S13/discovery.md`)
**Benefit-metric:** NOT PRESENT — experimental simplification for EXP-008 CPF measurement
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Date:** 2026-05-17
**Run:** EXP-008 Config A S13

---

## Step 0 — Entry condition check (eval-mode)

- Discovery artefact: ✅ read from disk (`runs/config-A-S13/discovery.md`, status: Approved, eval-mode)
- Context injection files: ✅ S13-ea-registry-trans-tasman-payments.md, S13-aml-austrac-payment-services-policy.md, S13-architecture-guardrails-excerpt.md — active
- Benefit-metric artefact: ⚠️ NOT PRESENT — experimental simplification. Success indicators from discovery carried into stories.

**Constraints carried in from discovery:**
- C1 (NZ leg) — RBNZ AML/CFT Act 2009: enterprise retains primary AML/CFT liability regardless of routing channel; sanctions screening obligation attaches to the payment instruction, not the transmission channel; RBNZ threshold transaction reporting (payments above NZD $10,000) applies regardless of routing; "our compliance team is comfortable" was not validated for the intra-group channel; written compliance confirmation required before channel activation
- C2 (AU leg) — AUSTRAC AML/CTF Act 2006 (Cth): enterprise has a direct originator-information-provision obligation to the enterprise's Australian counterpart for each credit instruction; minimum fields: full legal name, account number, NZ address, purpose; the enterprise's Australian counterpart AML/CTF Programme must document the intra-group arrangement as a correspondent banking relationship; group ownership does not exempt from AUSTRAC's programme requirements; "enterprise's Australian counterpart handles AU compliance" framing explicitly contradicted
- C3 (NZ leg) — RBNZ FX Transaction Reporting: end-of-day NZD/AUD net settlement = FX transaction; reporting obligations not assessed for the intra-group net settlement model; existing FX reporting designed for SWIFT per-transaction reporting, not net settlement
- C4 (NZ leg) — Payment Services Regulations 2021 (DIA): new proprietary channel with novel settlement model may constitute a new payment service type requiring DIA registration before retail launch; status not confirmed
- C5 (cross-border contractual) — SWIFT correspondent bank agreement with JPMorgan Chase: JPMorgan Chase is the active SWIFT correspondent for NZD/AUD international payments; architecture guardrail ADR-CB-002 requires review of all active correspondent bank agreements before any routing change; ADR-CB-002 notes that correspondent bank agreements may contain notification obligations for routing changes; impact of proprietary channel on correspondent relationship not assessed; surfaced as RISK R1 in discovery (escalate to BLOCKER if notification obligation confirmed)

**Slicing strategy:** Risk-first (Strategy 4) — five pre-launch blocking pre-conditions from discovery (B1–B4 as BLOCKERs, B5/C5 as escalating RISK) create a mandatory critical path. Epic 1 (Regulatory and Contractual Pre-conditions Gate) must be fully complete and all five channel activation flags set to `true` before the intra-group channel handles any live customer transactions. Epic 1 stories are compliance, legal, and governance delivery items — they carry explicit ACs and owner accountability because they gate the channel. Engineering teams may build Epic 2 and Epic 3 stories in dev and UAT environments in parallel with Epic 1 completion. The channel's production activation is blocked on all five Epic 1 stories completing and all five deployment configuration flags being set by their respective authorised owners.

**Architecture constraints scan (ADR-CB-002 routing change review — conducted before story decomposition):** The introduction of the intra-group payment channel constitutes a change to international payment routing for the NZD/AUD corridor and requires an Architecture Review Board review before implementation. Key guardrails active across this feature: ADR-CB-003/004 (mandatory synchronous sanctions screening; fail-closed fallback); ADR-CB-005 (dual-jurisdiction AML/CFT obligation mapping); ADR-CB-006 (AUSTRAC originator information standard for AU-leg payments); ADR-CB-007 (DIA payment service type assessment before retail launch); ADR-CB-002 Note (correspondent bank agreement review required; correspondent bank agreements may contain routing notification obligations). EA registry active constraints: TTPS-RISK-001 (JPMorgan Chase correspondent relationship not assessed), TTPS-RISK-002 (DIA classification not confirmed), TTPS-RISK-003 (FX reporting for net settlement not confirmed). All five constraints (C1–C5) have active architecture guardrail or EA registry signals and must appear in story Architecture Constraints sections wherever the relevant payment processing path is touched.

---

## Step 4a — Regulated Constraint Audit

### Regulated constraints by jurisdiction leg

| Constraint | Jurisdiction leg | Regulatory source | Type |
|-----------|-----------------|-------------------|------|
| C1 — RBNZ AML/CFT Act 2009: enterprise retains primary AML/CFT liability regardless of routing channel; sanctions screening obligation is channel-independent; RBNZ threshold transaction reporting applies to all payments above NZD $10,000 regardless of how they settle; channel-independent obligations apply equally to SWIFT-routed and intra-group-routed instructions | NZ leg | RBNZ AML/CFT Act 2009; policy doc s.A.1, s.A.3.2, s.A.4.2 | Regulatory (external law — NZ) |
| C2 — AUSTRAC AML/CTF Act 2006 (Cth): enterprise must provide complete originator information bundle (name, account number, address, purpose) with each credit instruction to the enterprise's Australian counterpart; the enterprise's Australian counterpart AML/CTF Programme must document the intra-group arrangement; due diligence on the enterprise required; group ownership does not exempt from programme requirements | AU leg | AUSTRAC AML/CTF Act 2006 (Cth); policy doc s.B.1, s.B.2; ADR-CB-006 | Regulatory (external law — AU) |
| C3 — RBNZ FX Transaction Reporting: end-of-day NZD/AUD net settlement positions are foreign exchange transactions; RBNZ FX reporting obligations must be confirmed for the net settlement model; existing SWIFT per-transaction FX reporting infrastructure may not cover intra-group net positions | NZ leg | RBNZ FX Transaction Reporting Rules; EA registry TTPS-SET-001, TTPS-RISK-003 | Regulatory (external law — NZ) |
| C4 — Payment Services Regulations 2021 (NZ): DIA registration may be required for the new payment service type before retail launch; existing licence coverage not confirmed; ADR-CB-007 requires written Regulatory Affairs confirmation before any new payment channel is offered to retail customers | NZ leg | Payment Services Regulations 2021 (NZ); ADR-CB-007; EA registry TTPS-RISK-002 | Regulatory (external law — NZ) |
| C5 — Correspondent bank agreement (JPMorgan Chase): routing change from SWIFT to proprietary channel for NZD/AUD transactions requires review of the bilateral correspondent bank agreement; agreement may contain notification obligation for routing changes; bypassing SWIFT correspondent without satisfying notification obligation creates contractual and credit relationship risk | Cross-border (contractual) | ADR-CB-002; EA registry TTPS-RISK-001, TTPS-SWIFT-001, TTPS-ROUTE-001 | Contractual (hidden — surfaced via architecture guardrail reasoning) |

### Story-to-constraint mapping (jurisdiction-labelled)

| Story | C1 (NZ — RBNZ AML/CFT) | C2 (AU — AUSTRAC) | C3 (NZ — RBNZ FX) | C4 (NZ — DIA) | C5 (cross-border — JPMorgan Chase) |
|-------|------------------------|-------------------|-------------------|---------------|-------------------------------------|
| 1.1 — RBNZ AML/CFT Channel Validation | ✅ PRIMARY | — | ✅ (threshold reporting coverage validation) | — | — |
| 1.2 — AUSTRAC Originator Information Confirmation | — | ✅ PRIMARY | — | — | — |
| 1.3 — RBNZ FX Reporting Confirmation | ✅ (threshold reporting co-located) | — | ✅ PRIMARY | — | — |
| 1.4 — DIA Payment Service Type Assessment | — | — | — | ✅ PRIMARY | — |
| 1.5 — Correspondent Agreement Review (JPMorgan Chase) | — | — | — | — | ✅ PRIMARY |
| 2.1 — Payment Intake and Threshold Routing | ✅ (gate flag enforcement — AMLCFT_CHANNEL_VALIDATED) | ✅ (gate flag enforcement — AUSTRAC_CONFIRMATION_RECEIVED) | ✅ (gate flag enforcement — FX_REPORTING_VALIDATED) | ✅ PRIMARY enforcement (DIA_REGISTRATION_CLEARED gate) | ✅ (gate flag enforcement — CORRESPONDENT_AGREEMENT_CLEARED) |
| 2.2 — AML/CFT Sanctions Screening Integration | ✅ PRIMARY (synchronous pre-commitment screening; fail-closed; all mandatory lists) | ✅ (DFAT list for AU beneficiary; channel-independent obligation) | — | — | — |
| 2.3 — Originator Information Data Model | ✅ (RBNZ AML/CFT record-keeping — originator name/account) | ✅ PRIMARY (AUSTRAC originator fields carried end-to-end; validation at intake; completeness gate before transmission) | — | — | — |
| 2.4 — Intra-Group Credit Instruction Transmission | ✅ (AMLCFT_CHANNEL_VALIDATED gate enforced before transmission) | ✅ (originator information bundle included in credit instruction to enterprise's Australian counterpart) | — | — | ✅ (CORRESPONDENT_AGREEMENT_CLEARED gate; channel activation blocked without clearance) |
| 2.5 — RBNZ Threshold Transaction Reporting | ✅ PRIMARY (threshold reports for intra-group instructions ≥ NZD $10,000) | — | ✅ (RBNZ FX reporting context — threshold instrument separate from net FX settlement reporting) | — | — |
| 3.1 — Net Settlement and RBNZ FX Reporting | ✅ (screening records referenced in settlement record) | — | ✅ PRIMARY (RBNZ FX Transaction Reporting for net settlement positions; FX_REPORTING_VALIDATED gate) | — | — |
| 3.2 — Customer Confirmation and Settlement Status | ✅ (confirmation issued only after screening passed and commitment recorded) | ✅ (confirmation gated on credit instruction acknowledgement from enterprise's Australian counterpart) | — | — | — |

---

## Epic 1 — Regulatory and Contractual Pre-conditions Gate

**Purpose:** Establish the five mandatory pre-conditions that gate the intra-group channel's live activation. Epic 1 stories are compliance, legal, and governance delivery items — not engineering features. They each produce a deployment configuration flag that defaults to `false`. The intra-group channel MUST NOT process any live customer payment instructions until all five flags are set to `true` by their respective authorised owners. Engineering teams may build Epic 2 and Epic 3 stories in dev/UAT environments in parallel. No Epic 2 or Epic 3 story may be activated in the production environment for live customer transactions before all five Epic 1 stories are complete.

---

### Story 1.1 — RBNZ AML/CFT Channel Coverage Validation and Written Compliance Confirmation

**As a** RBNZ AML/CFT Compliance Officer
**I want** to produce and file a written confirmation that the existing AML/CFT Sanctions Screening Service and threshold transaction reporting infrastructure cover the intra-group payment channel on equivalent terms to the SWIFT channel
**So that** the enterprise meets its primary AML/CFT liability obligations under the RBNZ AML/CFT Act 2009 before any customer payment instruction is routed via the intra-group channel, and the channel activation is gated by a documented compliance assessment rather than an untested assertion

**Acceptance Criteria:**

AC1: The RBNZ AML/CFT Compliance Officer produces a written confirmation that the existing AML/CFT Sanctions Screening Service (TTPS-SCR-001) covers intra-group-routed payment instructions on equivalent terms to SWIFT-routed instructions. The confirmation explicitly addresses all of the following: (a) RBNZ-designated persons list coverage for intra-group channel instructions; (b) OFAC SDN list coverage; (c) DFAT consolidated list coverage (for AU beneficiary transactions); (d) that screening is enforced synchronously — the payment instruction is not committed to the intra-group channel until a non-match screening result is returned; (e) fail-closed fallback behaviour — an instruction is declined if the screening service is unavailable. If the existing screening service has channel-specific configuration tied to the SWIFT flow that does not cover intra-group instructions, the remediation work required to extend coverage is documented in this story and must be completed before this written confirmation is issued.

AC2: The RBNZ AML/CFT Compliance Officer produces a written confirmation that the RBNZ threshold transaction reporting infrastructure (TTPS-REP-001) covers intra-group-routed transactions above NZD $10,000 on the same terms as SWIFT-routed transactions. If the reporting module has channel-specific logic tied to the SWIFT flow, the confirmation documents the gap and the remediation scope. Remediation work arising from this gap analysis is in-scope for Story 2.5 and must be completed before this written confirmation is issued. The confirmation states the reporting format (individual transaction report or batch) and confirms the expected submission pathway to RBNZ is operational for intra-group transactions.

AC3: A deployment configuration field `AMLCFT_CHANNEL_VALIDATED` is established in the intra-group channel production deployment configuration and defaults to `false`. The payment instruction intake component (Story 2.1) and the AML/CFT screening integration (Story 2.2) MUST reject all payment submissions with a "channel not activated" error when this flag is `false`. The flag may only be set to `true` by the RBNZ AML/CFT Compliance Officer, and only after both written confirmations required by AC1 and AC2 are filed in the Payments Compliance SharePoint folder with their document IDs recorded in the deployment configuration. Automated tests verify: (a) flag=false → intake returns "channel not activated" for all payment submission attempts; (b) flag=true → intake proceeds to screening step normally.

AC4: A BS11 Technology Change notification is filed with RBNZ no fewer than 30 business days before the planned production go-live date. The notification describes: (a) the new intra-group payment channel and its relationship to the existing SWIFT international payment service; (b) confirmation that the existing AML/CFT Sanctions Screening Service is extended to cover the intra-group channel on equivalent terms; (c) the threshold transaction reporting coverage confirmation; (d) planned go-live date; (e) rollback plan. A deployment configuration field `BS11_NOTIFICATION_DATE` is set by the Compliance Officer on the date the notification is filed. The CI/CD production deployment pipeline includes a gate that verifies the deployment date is ≥30 business days after `BS11_NOTIFICATION_DATE`. If this gate fails, the production deployment is blocked with an error stating the earliest allowable deployment date. Automated tests verify: (a) gate blocks deployment when fewer than 30 business days have elapsed since `BS11_NOTIFICATION_DATE`; (b) gate passes when the 30-business-day minimum is satisfied.

AC5: Integration tests for the AML/CFT screening integration (to be run in the staging environment before production go-live) verify: (a) a payment instruction routed via the intra-group channel receives synchronous pre-commitment sanctions screening; (b) a payment instruction that returns a screening match is declined and does not proceed to intra-group commitment — a decline record is created with the instruction ID, screening list versions, match status, and timestamp; (c) a payment instruction submitted while the screening service is unavailable is declined with a fail-closed response (not deferred, not queued without screening); (d) a screening record per instruction is retained with the instruction ID, screening list versions used, overall match status (clear/match/error), and timestamp.

**Architecture constraints:**
- C1 (NZ leg — RBNZ AML/CFT Act 2009, PRIMARY): s.A.1 enterprise retains primary reporting entity obligations regardless of routing channel; s.A.3.2 screening obligation attaches to payment instruction, not transmission channel; s.A.4.2 threshold reporting applies regardless of routing; BS11 technology change notification requirement.
- C3 (NZ leg — RBNZ threshold reporting): threshold reporting coverage for intra-group channel validated as part of this story (AC2).
**Oversight level:** HIGH — RBNZ AML/CFT Compliance Officer sign-off on written confirmations; direct RBNZ engagement for BS11 notification.

---

### Story 1.2 — AUSTRAC Originator Information Confirmation and Enterprise's Australian Counterpart AML/CTF Programme Documentation

**As a** Payments Compliance Officer and Enterprise's Australian Counterpart Liaison
**I want** to obtain written confirmation of the AUSTRAC originator information requirements from the enterprise's Australian counterpart compliance team, and to confirm their AML/CTF Programme has been updated to document the intra-group arrangement
**So that** the enterprise satisfies its direct AUSTRAC originator information provision obligation before transmitting any credit instruction, and the enterprise's Australian counterpart's AUSTRAC programme covers the arrangement before the first inbound instruction is processed on the AU leg

**Acceptance Criteria:**

AC1: The enterprise's Australian counterpart compliance team provides a written confirmation specifying the minimum originator information fields required by their AUSTRAC AML/CTF Programme for inbound credit instructions from the enterprise. The confirmation specifies, for each required field: (a) exact field name; (b) format requirements (e.g., full legal name — abbreviated names not acceptable); (c) minimum data quality standard (e.g., residential or registered address required — PO box not acceptable); (d) whether field requirements differ for individual customers vs. business/entity customers; (e) character encoding, maximum field length, and any structured format requirements for the credit instruction. This confirmation is a signed document filed in the Payments Compliance SharePoint folder.

AC2: The enterprise's Australian counterpart compliance team provides a written confirmation that the intra-group payment arrangement has been documented in their AUSTRAC AML/CTF Programme as a correspondent banking arrangement. The confirmation states: (a) the section of the AML/CTF Programme that documents the arrangement; (b) that due diligence on the enterprise (as the originating entity) has been completed; (c) the date the AML/CTF Programme update was completed. This document is filed in the Payments Compliance SharePoint folder alongside AC1, and the effective date of the Programme update is confirmed as predating the channel's first live customer transaction.

AC3: The enterprise's Payments Compliance team conducts a self-assessment of the originator information fields currently held in customer records against the confirmed AUSTRAC requirements from AC1. The self-assessment documents: (a) which required fields are held in customer records and can be automatically included in the credit instruction; (b) which required fields (if any) are not held or are held in a format incompatible with the AUSTRAC requirements; (c) the remediation approach for any identified gap (enhanced customer intake data capture or a confirmed acceptable field substitution). Gaps and remediations identified by this self-assessment are in-scope for Story 2.3 (originator information data model) and must be reflected in Story 2.3's implementation before the channel is activated.

AC4: A deployment configuration flag `AUSTRAC_CONFIRMATION_RECEIVED` is established in the intra-group channel production deployment configuration and defaults to `false`. The credit instruction transmission step (Story 2.4) MUST NOT transmit any credit instruction to the enterprise's Australian counterpart when this flag is `false`. The flag may only be set to `true` after the written confirmations required by AC1 and AC2 are both filed, with their SharePoint document IDs recorded in the deployment configuration. Automated tests verify: (a) flag=false → credit instruction transmission step is blocked with a "AUSTRAC confirmation not yet received" gate error; (b) flag=true → credit instruction transmission proceeds normally through Story 2.4.

**Architecture constraints:**
- C2 (AU leg — AUSTRAC AML/CTF Act 2006 (Cth), PRIMARY): policy doc s.B.1 — enterprise responsible for ensuring originator information meets AUSTRAC minimum requirements; inadequate information may cause enterprise's Australian counterpart to delay settlement; s.B.2 — intra-group payment arrangement is a correspondent banking arrangement regardless of group ownership; AML/CTF Programme documentation and due diligence on the enterprise required. ADR-CB-006 — AUSTRAC originator information standards for AU-leg payments.
**Oversight level:** HIGH — Payments Compliance Officer and Enterprise's Australian Counterpart Compliance team sign-off; external cross-entity compliance engagement.

---

### Story 1.3 — RBNZ FX Transaction Reporting Confirmation for Net Settlement Model

**As a** Enterprise Treasury Manager
**I want** to produce and file a written analysis of the RBNZ FX Transaction Reporting obligations for the end-of-day NZD/AUD net settlement model, confirmed by the Regulatory Affairs team
**So that** the enterprise is clear on its RBNZ FX reporting obligations before the net settlement flow is activated, and any extension to the existing FX reporting infrastructure is identified and scoped before go-live

**Acceptance Criteria:**

AC1: The enterprise treasury team produces a written analysis of the RBNZ FX Transaction Reporting obligations applicable to the end-of-day NZD/AUD net settlement model. The analysis addresses: (a) whether intra-group net settlement positions are reportable FX transactions under current RBNZ FX Transaction Reporting Rules; (b) the appropriate reporting frequency and format — net position per settlement cycle vs. per-transaction-level breakdown of underlying payments; (c) whether the enterprise's existing FX reporting infrastructure (designed for SWIFT per-payment transaction reporting via TTPS-SET-001) covers intra-group net settlement positions or requires extension. The analysis is reviewed by the Regulatory Affairs team.

AC2: The Regulatory Affairs team produces a written confirmation of one of the following determinations: (a) RBNZ FX Transaction Reporting obligations apply to the net settlement model in the form confirmed by the treasury team analysis (AC1), and the existing FX reporting infrastructure is confirmed as covering net positions without extension — the channel may proceed with no additional FX reporting development; or (b) RBNZ FX Transaction Reporting obligations apply, and the existing reporting infrastructure does not cover intra-group net settlement positions — specific extension work is documented, and that work is in-scope for Story 3.1. If determination (b) applies, the Story 3.1 scope is updated before Story 3.1 is estimated or planned.

AC3: A deployment configuration flag `FX_REPORTING_VALIDATED` is established in the intra-group channel production deployment configuration and defaults to `false`. The net settlement position management step (Story 3.1) MUST NOT transmit any net settlement position to TTPS-SET-001 when this flag is `false`. The flag may only be set to `true` by the Regulatory Affairs team lead or Enterprise Treasury Manager after the written confirmation required by AC2 is filed in the Payments Compliance SharePoint folder with its document ID recorded in the deployment configuration. Automated tests verify: (a) flag=false → net settlement position transmission is blocked with a "FX reporting validation not yet completed" gate error; (b) flag=true → net settlement proceeds normally through Story 3.1.

**Architecture constraints:**
- C3 (NZ leg — RBNZ FX Transaction Reporting, PRIMARY): EA registry TTPS-SET-001 — RBNZ FX transaction reporting obligation noted for end-of-day net settlement; TTPS-RISK-003 — FX reporting not assessed for intra-group channel; existing FX reporting designed for SWIFT transactions.
- C1 (NZ leg — RBNZ AML/CFT): RBNZ threshold transaction reporting (Story 2.5) and RBNZ FX reporting (Story 3.1) are distinct obligations both anchored in RBNZ's remit; confirmation of one does not substitute for the other.
**Oversight level:** MEDIUM — Enterprise Treasury Manager and Regulatory Affairs team lead sign-off; RBNZ regulatory relationship team may be engaged for formal interpretation.

---

### Story 1.4 — DIA Payment Service Type Assessment and Registration Gate

**As a** Regulatory Affairs Manager
**I want** to obtain written confirmation from DIA of whether the new intra-group payment channel constitutes a new payment service type requiring additional DIA registration before retail launch
**So that** the enterprise does not offer the service to retail customers before confirming its regulatory licence status under the Payment Services Regulations 2021, satisfying architecture guardrail ADR-CB-007

**Acceptance Criteria:**

AC1: The Regulatory Affairs team prepares and submits a formal written request to DIA seeking a payment service type determination for the proposed intra-group payment channel. The request describes: (a) the proposed channel mechanics — intra-group routing, NZD/AUD net settlement model, sub-$10,000 transaction threshold, 2-hour settlement SLA, NZ-to-AU direction only; (b) the enterprise's existing payment service licence type(s) held; (c) a request for DIA's written determination of whether the proposed channel constitutes a new payment service type requiring additional registration under the Payment Services Regulations 2021, or whether it is covered under the enterprise's existing licence.

AC2: If DIA confirms existing licence coverage: the written DIA determination is filed in the Payments Regulatory Affairs SharePoint folder and its document ID recorded in the deployment configuration as `DIA_ASSESSMENT_ID`. The channel may proceed to retail launch subject to all other Epic 1 gates being cleared.
If DIA determines new registration is required: the Regulatory Affairs team initiates the DIA registration process. The channel MUST NOT be offered to retail customers until the DIA registration is approved and the DIA registration reference number is recorded in the deployment configuration as `DIA_REGISTRATION_ID`.

AC3: A deployment configuration flag `DIA_REGISTRATION_CLEARED` is established in the intra-group channel production deployment configuration and defaults to `false`. The payment instruction intake component (Story 2.1) MUST return a "service not yet available" response for all payment submission attempts when this flag is `false`. The flag may only be set to `true` by the Regulatory Affairs Manager after either: (a) the DIA written determination confirming existing licence coverage is filed (AC2 option a), with `DIA_ASSESSMENT_ID` recorded; or (b) the DIA registration approval is received and `DIA_REGISTRATION_ID` is recorded in the deployment configuration (AC2 option b). Automated tests verify: (a) flag=false → intake returns "service not yet available" for all submission attempts; (b) flag=true → intake proceeds to eligibility determination normally.

AC4: If DIA registration is required (AC2 option b), the Regulatory Affairs Manager tracks the registration application status and provides a weekly update to the Payments product team until determination is received. If the DIA registration approval timeline extends beyond the engineering go-live readiness date, the retail launch date is formally deferred and the deferral is documented in the project's risk register alongside the expected DIA determination date.

**Architecture constraints:**
- C4 (NZ leg — Payment Services Regulations 2021, PRIMARY): ADR-CB-007 — written Regulatory Affairs team assessment of payment service type classification is mandatory before any new payment channel is offered to retail customers; EA registry TTPS-REG-001 — DIA registration status not confirmed; TTPS-RISK-002 — DIA registration may be required before launch.
**Oversight level:** HIGH — Regulatory Affairs Manager sign-off; direct DIA engagement; retail launch blocked on DIA written determination.

---

### Story 1.5 — Correspondent Bank Agreement Review: JPMorgan Chase SWIFT Correspondent

**As a** Treasury Legal Counsel
**I want** to review the bilateral correspondent banking agreement with JPMorgan Chase to determine whether the intra-group channel's routing change requires prior notification or consent under the agreement
**So that** the enterprise satisfies architecture guardrail ADR-CB-002's mandatory correspondent agreement review before the routing change is implemented, and the channel is not activated in a way that creates contractual or credit relationship risk with JPMorgan Chase

**Acceptance Criteria:**

AC1: Treasury Legal reviews the bilateral correspondent banking agreement currently in place between the enterprise and JPMorgan Chase for NZD/AUD international payments. The review specifically determines: (a) whether the agreement contains any term restricting the enterprise from routing NZD/AUD payment transactions outside the agreed SWIFT channel without prior notification or written consent from JPMorgan Chase; (b) if such a restriction exists: the exact form of the notification or consent required (written notice only, prior written consent required, notice period); (c) if such a restriction exists: whether there is a minimum volume threshold below which the restriction does not apply. The review is documented in a written legal memorandum filed in the Treasury Legal SharePoint folder. This review must be completed before the intra-group channel architecture design is finalised, in accordance with ADR-CB-002.

AC2: Based on the AC1 review, Treasury Legal reaches one of two determinations:
(a) No notification or consent obligation: Treasury Legal issues a written clearance memorandum confirming the routing change is clear of correspondent agreement restrictions. The clearance memorandum is filed in Treasury Legal SharePoint and its document ID recorded in the deployment configuration as `CORRESPONDENT_AGREEMENT_CLEARANCE_ID`.
(b) Notification or consent obligation confirmed: Treasury Legal prepares and submits the required written notification to JPMorgan Chase (or initiates the consent process). The channel MUST NOT be activated before JPMorgan Chase provides written acknowledgement of the notification (or written consent for consent-requiring obligations). JPMorgan Chase's response is filed in Treasury Legal SharePoint and its document ID recorded in the deployment configuration as `CORRESPONDENT_NOTIFICATION_ACK_ID`. If this determination is reached, it is formally logged as a project BLOCKER until acknowledgement is received.

AC3: A deployment configuration flag `CORRESPONDENT_AGREEMENT_CLEARED` is established in the intra-group channel production deployment configuration and defaults to `false`. The intra-group credit instruction transmission step (Story 2.4) MUST NOT transmit any credit instruction to the enterprise's Australian counterpart via the intra-group channel when this flag is `false`. The flag may only be set to `true` by Treasury Legal after either: (a) the clearance memorandum (AC2 determination a) is filed with its `CORRESPONDENT_AGREEMENT_CLEARANCE_ID` recorded; or (b) JPMorgan Chase's written acknowledgement or consent (AC2 determination b) is filed with its `CORRESPONDENT_NOTIFICATION_ACK_ID` recorded. Automated tests verify: (a) flag=false → intra-group routing returns a "channel not authorised" error without transmitting to the enterprise's Australian counterpart; (b) flag=true → credit instruction transmission proceeds normally.

AC4: If the agreement review reveals a consent obligation (AC2 determination b), the Treasury Legal timeline for obtaining JPMorgan Chase's consent is provided to the Payments product team. If the consent timeline extends beyond the engineering go-live readiness date, the channel activation timeline is formally updated and the timeline risk is documented in the project's risk register. The obligation to notify JPMorgan Chase — regardless of whether notification or consent is required — must not be deferred until after engineering build commences.

**Architecture constraints:**
- C5 (cross-border contractual — SWIFT correspondent agreement, PRIMARY): ADR-CB-002 — mandatory review of all active correspondent bank agreements for affected corridors before any routing change; ADR-CB-002 Note — correspondent bank agreements may contain notification obligations for routing changes; routing changes that bypass a SWIFT correspondent without satisfying notification obligations create contractual and credit relationship risk; EA registry TTPS-RISK-001 — JPMorgan Chase correspondent relationship impact not assessed (severity: HIGH); TTPS-SWIFT-001 — JPMorgan Chase is the active SWIFT correspondent for NZD/AUD payments.
**Oversight level:** HIGH — Treasury Legal Counsel sign-off; potential direct engagement with JPMorgan Chase; channel activation blocked without legal clearance or notification acknowledgement.

---

## Epic 2 — Intra-Group Payment Channel Core

**Purpose:** Build the payment instruction intake, AML/CFT screening, originator information data model, credit instruction transmission, and threshold transaction reporting components. Stories 2.1–2.5 may be built and tested in dev and UAT environments before Epic 1 completes. No story in this epic may be activated for live customer transactions in production before all five Epic 1 deployment flags are `true`. Each story includes enforcement of the relevant Epic 1 flags in its AC gating logic. The intra-group channel routing logic in Story 2.4 is additionally gated at the architecture level by `CORRESPONDENT_AGREEMENT_CLEARED` — the proprietary channel MUST NOT transmit to the enterprise's Australian counterpart until Treasury Legal has cleared the correspondent agreement.

---

### Story 2.1 — Payment Instruction Intake, Eligibility Determination, and Threshold Routing

**As a** retail banking customer
**I want** to submit a NZ-to-AU payment instruction through the Retail Digital Banking Platform or Phone Banking System and have it automatically routed through the most appropriate channel based on the instruction amount
**So that** eligible payments (≤NZD $10,000, AU beneficiary) are processed via the intra-group channel with sub-$5 pricing and 2-hour settlement, and ineligible payments (>NZD $10,000, non-AU beneficiary) continue via the standard SWIFT channel at existing terms

**Acceptance Criteria:**

AC1: The payment instruction intake component accepts instructions from TTPS-IN-001 (Retail Digital Banking Platform) and TTPS-IN-002 (Phone Banking System). At intake, the component enforces all five channel activation flags as a pre-flight gate before any processing occurs. If any flag is `false`, the intake returns a structured "service not yet available" response identifying the unmet activation condition. The flags checked at intake are: `AMLCFT_CHANNEL_VALIDATED`, `AUSTRAC_CONFIRMATION_RECEIVED`, `FX_REPORTING_VALIDATED`, `DIA_REGISTRATION_CLEARED`, `CORRESPONDENT_AGREEMENT_CLEARED`. Automated tests verify: (a) any single flag=false causes intake to return the appropriate error; (b) all flags=true causes intake to proceed to eligibility determination.

AC2: Eligibility determination logic routes payment instructions as follows: AU beneficiary account and amount ≤NZD $10,000 → intra-group channel path; amount >NZD $10,000 (regardless of beneficiary jurisdiction) → SWIFT gateway (TTPS-SWIFT-001) with standard pricing; non-AU beneficiary (regardless of amount) → SWIFT gateway with standard pricing. The routing decision and the threshold used are logged per instruction with the instruction ID, amount, beneficiary jurisdiction code, routing outcome (intra-group or SWIFT), and timestamp. Routing to the SWIFT gateway preserves all existing SWIFT processing behaviour — this story does not modify the SWIFT path.

AC3: For instructions routed to the intra-group channel path, the intake component validates that the originator information bundle required by Story 2.3 is present and populated before the instruction proceeds to the AML/CFT screening step. Missing or incomplete originator information fields (as defined by Story 2.3 based on the AUSTRAC confirmation from Story 1.2) cause intake to return a structured validation error identifying the missing fields. An instruction with incomplete originator information MUST NOT proceed to the AML/CFT screening step.

AC4: The intake component produces a structured intake record for each instruction, logged before any further processing: instruction ID (system-generated, unique), submission timestamp (ISO 8601 with timezone), source channel (TTPS-IN-001 or TTPS-IN-002), instruction amount (NZD), beneficiary jurisdiction code, routing outcome, and originator information completeness status. This intake record is the first entry in the instruction's processing audit trail.

**Architecture constraints:**
- C1 (NZ leg — RBNZ AML/CFT): `AMLCFT_CHANNEL_VALIDATED` gate check at intake (AC1) enforces that channel coverage validation has been completed before any instruction is processed; originator information completeness gate (AC3) supports RBNZ AML/CFT record-keeping.
- C2 (AU leg — AUSTRAC): `AUSTRAC_CONFIRMATION_RECEIVED` gate check at intake (AC1); originator information completeness gate (AC3) enforces AUSTRAC field requirements confirmed in Story 1.2.
- C3 (NZ leg — RBNZ FX reporting): `FX_REPORTING_VALIDATED` gate check at intake (AC1) enforces that FX reporting obligations for the net settlement model have been confirmed before the channel processes any instruction that will contribute to a net settlement position.
- C4 (NZ leg — DIA, PRIMARY enforcement point): `DIA_REGISTRATION_CLEARED` gate check at intake (AC1); "service not yet available" response when DIA confirmation is absent (AC1) is the primary retail-facing enforcement of the DIA pre-condition.
- C5 (cross-border — JPMorgan Chase): `CORRESPONDENT_AGREEMENT_CLEARED` gate check at intake (AC1) enforces that the correspondent agreement review has been completed before any instruction enters the intra-group channel path.

---

### Story 2.2 — AML/CFT Sanctions Screening Integration — Intra-Group Channel

**As a** RBNZ AML/CFT Compliance Officer
**I want** every payment instruction routed to the intra-group channel to pass through synchronous sanctions screening before the instruction is committed to the channel
**So that** the enterprise's primary AML/CFT liability obligations under the RBNZ AML/CFT Act 2009 are met for the intra-group channel on equivalent terms to the SWIFT channel, per architecture guardrail ADR-CB-003/004

**Acceptance Criteria:**

AC1: The AML/CFT screening integration calls the AML/CFT Sanctions Screening Service (TTPS-SCR-001) synchronously for every payment instruction routed to the intra-group channel path. The screening call is made after originator information completeness validation (Story 2.1 AC3) and before the instruction is committed to the intra-group channel. An instruction MUST NOT be committed to the intra-group channel before a non-match screening response is received. Screening list coverage must include: RBNZ-designated persons list, OFAC SDN, and DFAT consolidated list (for AU beneficiary instructions).

AC2: If the screening service returns a match result for any instruction: the instruction is declined; a structured decline record is written to the instruction's audit trail with: instruction ID, screening timestamp, screening lists checked, match indicator, list that returned a match (without exposing the specific matched entity name in any customer-facing response); the customer is notified that the payment cannot be processed; the instruction does not proceed to the intra-group channel commitment step. No match-declined instruction may be re-submitted through any automated retry mechanism.

AC3: If the screening service is unavailable (timeout or service error): the instruction is declined with a fail-closed response (per ADR-CB-004). The instruction MUST NOT be deferred, queued for later screening, or committed to the intra-group channel without a completed screening result. A structured service-unavailable record is written to the audit trail with: instruction ID, screening attempt timestamp, failure type (timeout/service-error), and a declined outcome. The customer is notified that the payment cannot be processed at this time.

AC4: A screening record is retained per instruction in the instruction audit trail regardless of outcome. Each record contains: instruction ID, screening service call timestamp (ISO 8601 with timezone), screening list versions used (RBNZ-designated list version, OFAC SDN version, DFAT list version), overall outcome (clear/match/error), and — where outcome is match — the list identifier that produced the match. The screening record is immutable after it is written.

AC5: Integration tests against the AML/CFT screening service staging environment verify, for the intra-group channel path specifically: (a) a clear result allows the instruction to proceed to the intra-group commitment step; (b) a match result declines the instruction without commitment; (c) a service unavailability response declines the instruction without commitment (fail-closed, not fail-open); (d) all four required screening record fields are populated after each screening call; (e) screening list version identifiers in the screening record reflect the versions active at the time of each call.

**Architecture constraints:**
- C1 (NZ leg — RBNZ AML/CFT Act 2009, PRIMARY): s.A.3.2 — screening obligation attaches to the payment instruction, not the transmission channel; identical obligations for SWIFT and intra-group-routed instructions; ADR-CB-003/004 — mandatory synchronous sanctions screening for all international payment channels; fail-closed fallback mandatory.
- C2 (AU leg — AUSTRAC): DFAT consolidated list (AU beneficiary) is required screening list component; screening coverage for AU beneficiary instructions is part of the dual-jurisdiction AML/CFT obligation mapping required by ADR-CB-005.

---

### Story 2.3 — AUSTRAC Originator Information Bundle — Payment Instruction Data Model

**As a** Payments product engineer
**I want** the payment instruction data model to carry the complete AUSTRAC originator information bundle from customer intake through to the credit instruction transmitted to the enterprise's Australian counterpart
**So that** the enterprise meets its direct originator-information-provision obligation to the enterprise's Australian counterpart for every credit instruction, and the enterprise's Australian counterpart can satisfy their AUSTRAC KYC and record retention obligations without needing to request supplemental information

**Acceptance Criteria:**

AC1: The payment instruction data model includes the following AUSTRAC originator information fields, with types and validation rules derived from the confirmed requirements of Story 1.2 AC1: (a) originator full legal name (string; abbreviated names not accepted at validation; minimum and maximum length enforced); (b) originator account number or BSB equivalent identifier (string; format validated against NZ account number format); (c) originator registered address (string components: street address line 1, street address line 2 optional, town/city, post code, country — "NZ" required; PO box not accepted as street address line 1 if Story 1.2 AC1 excludes it); (d) purpose of payment (string; free-text or controlled vocabulary — to be confirmed per Story 1.2 AC1 and documented in the data dictionary). For individual customers, all four fields are mandatory. For business/entity customers, the originator name is the registered entity name; address is the registered office address.

AC2: At intake (Story 2.1 AC3), the originator information fields are validated against the completeness and format rules defined in AC1. Instructions with missing, blank, or format-invalid originator information fields are rejected before proceeding to AML/CFT screening. The validation error response identifies the specific failing field(s) and the validation rule violated. No instruction with incomplete originator information may proceed to the AML/CFT screening step.

AC3: The credit instruction produced for transmission to the enterprise's Australian counterpart (Story 2.4) includes all four originator information fields in the format confirmed by Story 1.2 AC1. No originator information field may be omitted, truncated, or substituted with a placeholder in the credit instruction transmitted to the enterprise's Australian counterpart. A test suite verifies: (a) for a complete instruction, all four originator information fields appear in the credit instruction with their full values; (b) for an instruction with a missing field, the intake rejection (AC2) prevents the instruction from ever reaching the credit instruction transmission step.

AC4: Originator information fields are included in the instruction's audit trail record (alongside the instruction ID, screening result, routing decision, and settlement outcome) and retained for the period required by RBNZ AML/CFT record retention rules (7 years per policy doc s.A.5, measured from the date of the transaction).

**Architecture constraints:**
- C2 (AU leg — AUSTRAC AML/CTF Act 2006, PRIMARY): policy doc s.B.1 — enterprise responsible for ensuring originator information meets AUSTRAC minimum requirements; ADR-CB-006 — AUSTRAC originator information standards for AU-leg payments (full name, account, address); field completeness at intake (AC2) is the primary technical enforcement of the AUSTRAC information provision obligation.
- C1 (NZ leg — RBNZ AML/CFT): policy doc s.A.5 — originator information (name, account) is required for wire transfer record-keeping under RBNZ AML/CFT; 7-year retention (AC4) satisfies both RBNZ AML/CFT and AUSTRAC record retention requirements.

---

### Story 2.4 — Intra-Group Credit Instruction Transmission

**As a** Payments product engineer
**I want** the intra-group payment channel to transmit a well-formed credit instruction — including the complete AUSTRAC originator information bundle — to the enterprise's Australian counterpart via TTPS-ROUTE-001 after AML/CFT screening has cleared the instruction
**So that** eligible payment instructions are forwarded to the enterprise's Australian counterpart for AU-leg crediting within the 2-hour settlement SLA window, with all AUSTRAC originator information requirements satisfied in the credit instruction itself

**Acceptance Criteria:**

AC1: Before any credit instruction is transmitted to the enterprise's Australian counterpart via TTPS-ROUTE-001, the transmission step checks the `CORRESPONDENT_AGREEMENT_CLEARED` and `AUSTRAC_CONFIRMATION_RECEIVED` flags. If either flag is `false`, the transmission step returns a "channel not authorised" error without transmitting. The `AMLCFT_CHANNEL_VALIDATED` flag is additionally checked to confirm AML/CFT validation has been completed. Automated tests verify that the transmission step is blocked when any of these three flags is `false`.

AC2: The credit instruction transmitted to the enterprise's Australian counterpart via TTPS-ROUTE-001 includes: (a) instruction ID (the system-generated ID from intake — Story 2.1 AC4); (b) instruction amount (NZD); (c) AU beneficiary account details (BSB and account number); (d) originator full legal name (from Story 2.3 AC1); (e) originator account number (from Story 2.3 AC1); (f) originator registered address (from Story 2.3 AC1); (g) purpose of payment (from Story 2.3 AC1); (h) AML/CFT screening reference (the screening record ID from Story 2.2 AC4, confirming the instruction cleared screening). All fields in (d)–(g) must carry the full values from the payment instruction data model — no truncation or omission.

AC3: The transmission component handles acknowledgement from the enterprise's Australian counterpart via TTPS-ROUTE-001. A successful acknowledgement (indicating the enterprise's Australian counterpart has accepted the credit instruction) triggers: (a) the instruction's audit trail record is updated with the enterprise's Australian counterpart acknowledgement timestamp and reference ID; (b) the instruction status transitions to "accepted-by-au-counterpart" — this is the trigger for the customer confirmation step (Story 3.2). If the enterprise's Australian counterpart returns a rejection (invalid originator information, beneficiary account not found, or other rejection code): the instruction status transitions to "rejected-by-au-counterpart", the rejection reason is logged in the audit trail, and the customer is notified that the payment could not be processed with the reason where it can be disclosed.

AC4: Transmission retry behaviour: transient connectivity failures to TTPS-ROUTE-001 are retried at most 3 times with exponential backoff (initial delay: 5 seconds; maximum delay: 60 seconds). After 3 consecutive failures, the instruction status transitions to "transmission-failed", a structured failure record is written to the audit trail, and an alert is sent to the Payments operations team. No instruction may be retried after a "rejected-by-au-counterpart" response — rejections are not retriable without human review.

**Architecture constraints:**
- C2 (AU leg — AUSTRAC): originator information bundle (AC2 items d–g) must be included in full in every credit instruction; this is the point of AUSTRAC originator information delivery to the enterprise's Australian counterpart; ADR-CB-006 — AUSTRAC information standards for AU-leg payments.
- C5 (cross-border — JPMorgan Chase correspondent agreement): `CORRESPONDENT_AGREEMENT_CLEARED` gate check (AC1) enforces that Treasury Legal has reviewed the JPMorgan Chase agreement and confirmed (or obtained notification acknowledgement) before any instruction is routed through the intra-group channel; this is the architectural enforcement point for the ADR-CB-002 correspondent agreement review requirement.
- C1 (NZ leg — RBNZ AML/CFT): `AMLCFT_CHANNEL_VALIDATED` gate check (AC1) enforces that channel coverage validation has been completed; AML/CFT screening reference in the credit instruction (AC2 item h) confirms to the enterprise's Australian counterpart that the instruction passed pre-transmission screening.

---

### Story 2.5 — RBNZ Threshold Transaction Reporting — Intra-Group Channel

**As a** RBNZ AML/CFT Compliance Officer
**I want** every intra-group channel payment instruction above NZD $10,000 to trigger a threshold transaction report submitted to the RBNZ threshold transaction reporting module
**So that** the enterprise satisfies its RBNZ AML/CFT Act 2009 threshold transaction reporting obligations for intra-group-routed payments, on equivalent terms to the reporting already applied to SWIFT-routed payments

**Acceptance Criteria:**

AC1: The threshold transaction reporting component evaluates the instruction amount for each payment instruction that has successfully cleared AML/CFT screening (Story 2.2) and is committed to the intra-group channel. Instructions with an amount ≥NZD $10,000 trigger a threshold transaction report. Threshold evaluation is applied to the full instruction amount — it MUST NOT be split across multiple settlement sub-periods or net settlement batches to bring the apparent transaction amount below the reporting threshold.

AC2: Each threshold transaction report includes the fields required by the RBNZ threshold transaction reporting module (TTPS-REP-001) for intra-group-routed transactions as confirmed by Story 1.1 AC2. At minimum: originator full legal name, originator account number, originator address, originator NZ country code, beneficiary name, beneficiary AU account details, instruction amount (NZD), instruction timestamp (ISO 8601), the channel identifier for the intra-group channel (distinct from the SWIFT channel identifier in existing reports), and the instruction ID.

AC3: The threshold transaction report is submitted to TTPS-REP-001 within the reporting window confirmed by Story 1.1 AC2. If the submission to TTPS-REP-001 fails: the instruction status is updated to reflect a pending threshold report, an alert is sent to the Payments Compliance Officer, and the report is queued for resubmission. An instruction with a pending threshold report (where the report submission has failed) MUST NOT be included in the net settlement transmission (Story 3.1) until the report is successfully acknowledged by TTPS-REP-001.

AC4: A threshold reporting record is created per report submitted, linked to the instruction ID, and retained in the instruction's audit trail. The record includes: instruction ID, instruction amount, report submission timestamp, TTPS-REP-001 acknowledgement reference (once received), and report status (submitted/acknowledged/failed). Integration tests verify: (a) an instruction of NZD $9,999 does not trigger a threshold report; (b) an instruction of NZD $10,000 triggers a threshold report; (c) a threshold report submission failure sets the instruction status to "pending-threshold-report" and triggers an alert.

**Architecture constraints:**
- C1 (NZ leg — RBNZ AML/CFT Act 2009, PRIMARY): s.A.4.2 — threshold transaction reporting applies regardless of routing channel; reporting obligation not waived because settlement occurs through internal group books; TTPS-REP-001 coverage confirmed by Story 1.1 AC2.
- C3 (NZ leg — RBNZ FX Transaction Reporting): threshold transaction reporting (this story) and RBNZ FX Transaction Reporting for net settlement (Story 3.1) are distinct RBNZ obligations; both must be active for the intra-group channel to operate compliantly.

---

## Epic 3 — Net Settlement, FX Reporting, and Customer Confirmation

**Purpose:** Build the end-of-day net settlement position management, RBNZ FX Transaction Reporting, and customer settlement confirmation components. Story 3.1 is gated on `FX_REPORTING_VALIDATED` — the net settlement step MUST NOT transmit net positions to TTPS-SET-001 in production before the treasury team and Regulatory Affairs confirm FX reporting obligations. Story 3.2 may be built and tested independently; it is gated on the credit instruction acknowledgement from the enterprise's Australian counterpart (Story 2.4 AC3), which depends on all Epic 1 flags being `true`.

---

### Story 3.1 — Net Settlement Position Management and RBNZ FX Transaction Reporting

**As a** Enterprise Treasury Manager
**I want** the intra-group payment channel to accumulate NZD/AUD payment obligations through the day and transmit an end-of-day net settlement position to the enterprise group Treasury Net Settlement service, with RBNZ FX Transaction Reporting generated for the net settlement position
**So that** the intra-group settlement model operates within the treasury's daily FX position management framework and satisfies RBNZ FX Transaction Reporting obligations confirmed by Story 1.3

**Acceptance Criteria:**

AC1: At end-of-day (a configurable settlement cut-off time, defaulting to 17:00 NZST), the net settlement component calculates the net NZD/AUD position across all successfully accepted intra-group channel instructions for the settlement day — i.e., instructions where a "accepted-by-au-counterpart" acknowledgement has been received (Story 2.4 AC3) and all pending threshold transaction reports have been acknowledged by TTPS-REP-001 (Story 2.5 AC3). Instructions with a pending threshold transaction report that has not yet been acknowledged are excluded from the net settlement calculation and carried forward to the next settlement cycle.

AC2: The `FX_REPORTING_VALIDATED` flag is checked before the net settlement position is transmitted to TTPS-SET-001. If `FX_REPORTING_VALIDATED` is `false`, the net settlement transmission is blocked and an alert is sent to the Enterprise Treasury Manager. Automated tests verify: (a) flag=false → net settlement transmission blocked; (b) flag=true → net settlement proceeds.

AC3: If Story 1.3 AC2 determination (b) applies (FX reporting infrastructure extension required), this story includes the extension work specified in that determination. The RBNZ FX Transaction Report is generated from the net settlement position in the format and at the frequency confirmed by Story 1.3 AC1/AC2. The report is submitted to the RBNZ FX reporting channel before or alongside the net settlement position transmission to TTPS-SET-001. If the FX report submission fails: the net settlement transmission to TTPS-SET-001 is blocked; an alert is sent to the Enterprise Treasury Manager; the FX report is queued for resubmission.

AC4: A net settlement record is written to the settlement audit trail per settlement cycle, including: settlement cycle date, net NZD/AUD position (NZD amount), count of instructions included in the cycle, TTPS-SET-001 transmission timestamp, TTPS-SET-001 acknowledgement reference, RBNZ FX report submission timestamp (if applicable), and RBNZ FX report acknowledgement reference (if applicable). The record links to the instruction IDs included in the settlement cycle.

**Architecture constraints:**
- C3 (NZ leg — RBNZ FX Transaction Reporting, PRIMARY): EA registry TTPS-SET-001 — RBNZ FX transaction reporting obligation for end-of-day net settlement; TTPS-RISK-003 — FX reporting for intra-group net settlement not assessed in prior infrastructure design; `FX_REPORTING_VALIDATED` gate (AC2) enforces the Story 1.3 pre-condition.
- C1 (NZ leg — RBNZ AML/CFT): threshold transaction reporting must be acknowledged before an instruction is included in net settlement (AC1); this ensures RBNZ AML/CFT threshold reporting obligations are not deferred into a subsequent settlement cycle.

---

### Story 3.2 — Customer Payment Confirmation and Settlement Status

**As a** retail banking customer
**I want** to receive confirmation that my NZ-to-AU payment has been accepted for intra-group settlement, within the 2-hour SLA window from instruction submission
**So that** I have certainty that my payment has been received and will be credited to the Australian beneficiary account, and I can identify the instruction if I need to follow up

**Acceptance Criteria:**

AC1: A settlement confirmation message is sent to the originating customer via TTPS-CONF-001 within 2 hours of the instruction submission timestamp (Story 2.1 AC4) for instructions where the enterprise's Australian counterpart has returned a successful credit instruction acknowledgement (Story 2.4 AC3, status: "accepted-by-au-counterpart"). The confirmation message includes: instruction ID, submission timestamp (ISO 8601), beneficiary name (or masked beneficiary account), instruction amount (NZD), expected credit timeline to the AU beneficiary account, and a reference number for customer follow-up. The 2-hour SLA is measured from instruction submission to confirmation dispatch, not to AU beneficiary account crediting (the AU crediting timeline is the enterprise's Australian counterpart's obligation).

AC2: If the enterprise's Australian counterpart returns a rejection for a credit instruction (Story 2.4 AC3, status: "rejected-by-au-counterpart"), a rejection notification is sent to the originating customer via TTPS-CONF-001 within 2 hours of the rejection response. The notification includes: instruction ID, rejection timestamp, a customer-appropriate explanation (where the rejection reason can be disclosed: e.g., "the payment could not be processed — please contact us to resubmit"), and instructions for how to retry or contact customer support. No specifics of the originator information validation failure or AML/CFT screening outcome are disclosed in customer-facing messages.

AC3: The confirmation dispatch record is written to the instruction's audit trail: instruction ID, confirmation type (accepted/rejected), confirmation dispatch timestamp (ISO 8601), dispatch channel (TTPS-CONF-001), and delivery status. The 2-hour SLA compliance status (within-SLA or outside-SLA, measured from instruction submission to confirmation dispatch) is recorded in this entry. Automated monitoring checks SLA compliance and generates an alert to the Payments operations team when SLA breaches occur.

**Architecture constraints:**
- C1 (NZ leg — RBNZ AML/CFT): confirmation is sent only after the instruction has completed AML/CFT screening (clear result — Story 2.2) and been committed to the intra-group channel; no confirmation may be sent for an instruction that was declined by AML/CFT screening.
- C2 (AU leg — AUSTRAC): confirmation of the accepted state is gated on the enterprise's Australian counterpart's credit instruction acknowledgement (Story 2.4 AC3); the acknowledgement confirms the enterprise's Australian counterpart received the full originator information bundle and accepted the instruction under their AUSTRAC programme; rejected instructions due to incomplete originator information (AC2) are customer-facing enforcement of the AUSTRAC information provision obligation.

---

<!-- CPF-TRACE
stage: /definition
model: claude-sonnet-4-6
config: A

constraints_in:
- C1 (NZ leg — RBNZ AML/CFT Act 2009): enterprise retains primary AML/CFT liability regardless of routing channel; channel-independent screening and threshold reporting obligations
- C2 (AU leg — AUSTRAC AML/CTF Act 2006): enterprise direct originator information provision obligation; enterprise's Australian counterpart AML/CTF Programme documentation required
- C3 (NZ leg — RBNZ FX Transaction Reporting): net settlement = FX transaction; reporting obligations not assessed for intra-group model
- C4 (NZ leg — Payment Services Regulations 2021/DIA): new payment service type registration status not confirmed
- C5 (cross-border contractual — JPMorgan Chase SWIFT correspondent agreement): routing change requires correspondent agreement review; notification obligation may exist

story_constraint_propagation:
- Story 1.1: C1 ✅ PRIMARY (written AML/CFT channel coverage confirmation AC1-AC2; BS11 notification AC4; AMLCFT_CHANNEL_VALIDATED flag AC3; integration tests AC5); C3 ✅ (threshold transaction reporting coverage validated as part of AML/CFT channel confirmation AC2)
- Story 1.2: C2 ✅ PRIMARY (AUSTRAC originator information field confirmation AC1; AML/CTF Programme documentation confirmation AC2; AUSTRAC_CONFIRMATION_RECEIVED flag AC4; self-assessment of field gaps AC3)
- Story 1.3: C3 ✅ PRIMARY (treasury analysis of net settlement FX reporting obligations AC1; Regulatory Affairs written confirmation AC2; FX_REPORTING_VALIDATED flag AC3); C1 ✅ (distinction between RBNZ AML/CFT threshold reporting and RBNZ FX reporting explicitly noted in Architecture Constraints)
- Story 1.4: C4 ✅ PRIMARY (DIA formal written determination AC1-AC2; DIA_REGISTRATION_CLEARED flag AC3; deferral protocol if registration timeline extends AC4)
- Story 1.5: C5 ✅ PRIMARY (Treasury Legal bilateral agreement review AC1; clearance memorandum or JPMorgan Chase notification acknowledgement AC2; CORRESPONDENT_AGREEMENT_CLEARED flag AC3; BLOCKER escalation condition AC2; pre-architecture-finalisation review requirement AC4)
- Story 2.1: C1 ✅ (AMLCFT_CHANNEL_VALIDATED gate check AC1; originator information completeness gate supporting RBNZ AML/CFT records AC3); C2 ✅ (AUSTRAC_CONFIRMATION_RECEIVED gate check AC1; originator information completeness gate supporting AUSTRAC provision obligation AC3); C3 ✅ (FX_REPORTING_VALIDATED gate check AC1); C4 ✅ PRIMARY enforcement (DIA_REGISTRATION_CLEARED gate check and "service not yet available" response AC1); C5 ✅ (CORRESPONDENT_AGREEMENT_CLEARED gate check AC1)
- Story 2.2: C1 ✅ PRIMARY (synchronous pre-commitment screening AC1; fail-closed fallback AC3; immutable screening record AC4; integration tests for intra-group path specifically AC5); C2 ✅ (DFAT consolidated list for AU beneficiary is required screening component under dual-jurisdiction AML/CFT mapping ADR-CB-005)
- Story 2.3: C2 ✅ PRIMARY (AUSTRAC originator field data model AC1; completeness validation at intake before screening AC2; originator information in credit instruction AC3; ADR-CB-006 compliance); C1 ✅ (RBNZ AML/CFT originator record-keeping and 7-year retention AC4)
- Story 2.4: C2 ✅ (full originator information bundle in credit instruction AC2; ADR-CB-006); C5 ✅ (CORRESPONDENT_AGREEMENT_CLEARED gate check AC1 — primary architectural enforcement point for ADR-CB-002 correspondent agreement review requirement); C1 ✅ (AMLCFT_CHANNEL_VALIDATED gate check AC1; AML/CFT screening reference in credit instruction AC2)
- Story 2.5: C1 ✅ PRIMARY (threshold transaction reporting for intra-group instructions ≥NZD $10,000 AC1-AC2; reporting window and resubmission handling AC3; threshold report linked to instruction audit trail AC4); C3 ✅ (distinction from net settlement FX reporting noted in Architecture Constraints; pending threshold report blocks net settlement inclusion AC1)
- Story 3.1: C3 ✅ PRIMARY (RBNZ FX Transaction Report from net settlement position AC3; FX_REPORTING_VALIDATED gate check AC2; FX report must be acknowledged before net settlement transmission unblocked AC3); C1 ✅ (threshold transaction report acknowledgement required before instruction included in net settlement AC1 — RBNZ AML/CFT threshold reporting obligations are complete before settlement closes)
- Story 3.2: C1 ✅ (confirmation only after AML/CFT screening cleared and instruction committed — no confirmation for screening-declined instructions AC1); C2 ✅ (confirmation gated on enterprise's Australian counterpart credit instruction acknowledgement, confirming originator information was accepted under AUSTRAC programme AC1-AC2)

constraints_not_propagated: none — all five constraints (C1, C2, C3, C4, C5) propagated to at least one story with explicit ACs and appear in Architecture Constraints of every story touching the relevant payment processing path

jurisdiction_mapping_verified:
- NZ leg (C1, C3, C4): C1 appears in Stories 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2; C3 appears in Stories 1.3, 2.5, 3.1; C4 appears in Stories 1.4, 2.1 — all NZ-leg constraints present in every story touching NZ-side regulatory obligations
- AU leg (C2): C2 appears in Stories 1.2, 2.1, 2.2, 2.3, 2.4, 3.2 — AU-leg constraint present in every story touching the AU payment processing path (originator information data model, credit instruction transmission, AUSTRAC gate enforcement)
- Cross-border (C5): C5 appears in Stories 1.5, 2.1, 2.4 — correspondent agreement constraint present at the gate-enforcement story (1.5), the intake-level gate check (2.1), and the architectural enforcement point (2.4 credit instruction transmission); absent from stories that do not touch the routing decision or channel activation (correct: C5 does not apply to threshold reporting, net settlement calculation, or customer confirmation independently)
-->
