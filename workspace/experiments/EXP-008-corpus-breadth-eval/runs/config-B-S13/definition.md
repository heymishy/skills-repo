# Definition: Trans-Tasman Payment Corridor — Proprietary Intra-Group Routing Channel

**Feature:** trans-tasman-payment-corridor
**Discovery status:** Approved (eval-mode — read from disk: `runs/config-B-S13/discovery.md`)
**Benefit-metric:** NOT PRESENT — experimental simplification for EXP-008 CPF measurement
**Model:** claude-opus-4-6 (Config B — Opus front-loaded; /discovery and /definition only)
**Date:** 2026-05-17
**Run:** EXP-008 Config B S13

---

## Step 0 — Entry condition check (eval-mode)

- Discovery artefact: ✅ read from disk (`runs/config-B-S13/discovery.md`, status: Approved, eval-mode)
- Context injection files: ✅ S13-ea-registry-trans-tasman-payments.md, S13-aml-austrac-payment-services-policy.md, S13-architecture-guardrails-excerpt.md — active
- Benefit-metric artefact: ⚠️ NOT PRESENT — experimental simplification. Success indicators from discovery carried into stories.

**Constraints carried in from discovery:**

- **C1 (NZ leg) — RBNZ AML/CFT Act 2009:** the enterprise retains primary AML/CFT liability regardless of routing channel (policy s.A.1); sanctions screening obligation attaches to instruction, not transmission channel (s.A.3.2); RBNZ threshold transaction reporting applies regardless of channel (s.A.4.2); "compliance team comfortable" is unvalidated for intra-group channel; written compliance confirmations + BS11 Technology Change notification ≥30 business days before go-live.

- **C2 (AU leg) — AUSTRAC AML/CTF Act 2006 (Cth):** enterprise has direct originator information provision obligation to the enterprise's Australian counterpart (legal name, account number, address, purpose) per s.B.1; the enterprise's Australian counterpart's AML/CTF Programme must document the intra-group arrangement as a correspondent banking arrangement and conduct due diligence on the enterprise per s.B.2; group ownership does not exempt; "enterprise's Australian counterpart handles their side" framing explicitly contradicted by s.B.1.

- **C3 (NZ leg) — RBNZ FX Transaction Reporting:** end-of-day NZD/AUD net settlement is an FX transaction even with no external counterparty (policy s.D.1); NZD $100,000 reporting threshold (s.D.2); existing reporting infrastructure designed for SWIFT per-payment, not intra-group net settlement (TTPS-RISK-003 HIGH); Treasury Operations sign-off is DoR prerequisite per ADR-CB-008.

- **C4 (NZ leg) — Payment Services Regulations 2021 (DIA):** proprietary channel with novel intra-group settlement model + sub-$10,000 retail threshold may constitute a new payment service type; DIA written determination required (s.C.1); if new-type registration required, registration must complete before retail launch (typical 4–12 week timeline per s.C.2); ADR-CB-007 makes written Regulatory Affairs assessment mandatory.

- **C5 (cross-border contractual) — SWIFT correspondent bank agreement (JPMorgan Chase):** JPMorgan Chase is the active SWIFT correspondent for NZD/AUD payments (TTPS-SWIFT-001); ADR-CB-002 mandates review of all active correspondent bank agreements for affected corridors before routing change; ADR-CB-002 Note signals that agreements may contain notification or consent obligations and bypass creates contractual + credit relationship risk; surfaced as RISK R1 in discovery with explicit BLOCKER escalation on confirmation of obligation; non-delegable owner: Treasury Legal Counsel.

**Slicing strategy:** **Risk-first (Strategy 4).** Five pre-launch pre-conditions identified in discovery (B1–B4 as BLOCKERs, B5/C5 as escalating RISK) form a mandatory critical path. Each pre-condition produces a deployment configuration flag that defaults to `false`. The intra-group channel MUST NOT process live customer payment instructions until all five flags are set to `true` by their respective named, jurisdiction-appropriate, non-delegable owners. Epic 1 (Regulatory and Contractual Pre-conditions Gate) is decomposed into five stories — one per pre-condition — each owned by a named role with a documented non-delegable boundary. Engineering teams may build Epic 2 (channel core) and Epic 3 (settlement and confirmation) in dev and UAT environments in parallel with Epic 1; the gating is at production activation, not at the build pipeline. This slicing keeps the regulatory/legal critical path observable and individually accountable per gate owner.

**Architecture constraints scan (ADR-CB-002 routing change review — conducted before story decomposition):** The intra-group channel is a change to international payment routing for the NZD/AUD corridor and triggers a mandatory Architecture Review Board review before implementation. Key guardrails active across this feature: ADR-CB-002 (correspondent agreement review — C5); ADR-CB-003/004 (mandatory synchronous sanctions screening; fail-closed fallback — C1); ADR-CB-005 (dual-jurisdiction AML/CFT obligation mapping — C1+C2); ADR-CB-006 (AUSTRAC information standards for AU-leg — C2); ADR-CB-007 (DIA payment service type assessment before retail launch — C4); ADR-CB-008 (RBNZ FX reporting Treasury sign-off as DoR prerequisite — C3); ADR-CB-002 Note (correspondent agreement notification obligation — C5). EA registry active risks: TTPS-RISK-001 HIGH (JPMorgan Chase impact unassessed — C5); TTPS-RISK-002 HIGH (DIA classification unconfirmed — C4); TTPS-RISK-003 HIGH (FX reporting unassessed — C3); TTPS-RISK-004 MEDIUM (AUSTRAC originator format unconfirmed — C2). All five constraints (C1–C5) have active architecture-guardrail or EA-registry signals and MUST appear in story Architecture Constraints sections wherever the relevant payment processing path is touched.

---

## Step 4a — Regulated Constraint Audit

### Table 1 — Regulated constraints by jurisdiction leg

| Constraint | Jurisdiction leg | Regulatory / contractual source | Type |
|-----------|-----------------|--------------------------------|------|
| C1 — RBNZ AML/CFT Act 2009: enterprise retains primary AML/CFT liability regardless of routing channel; sanctions screening obligation is channel-independent; RBNZ threshold transaction reporting applies to all payments above NZD $10,000 regardless of routing; channel-independent obligations apply equally to SWIFT-routed and intra-group-routed instructions; BS11 Technology Change notification required ≥30 business days before go-live | NZ leg | RBNZ AML/CFT Act 2009; policy doc s.A.1, s.A.3.2, s.A.4.2 | Regulatory (external law — NZ) |
| C2 — AUSTRAC AML/CTF Act 2006 (Cth): enterprise must provide complete originator information bundle (name, account number, address, purpose) with each credit instruction to the enterprise's Australian counterpart; the enterprise's Australian counterpart AML/CTF Programme must document the intra-group arrangement as a correspondent banking arrangement; due diligence on the enterprise required; group ownership does not exempt | AU leg | AUSTRAC AML/CTF Act 2006 (Cth); policy doc s.B.1, s.B.2; ADR-CB-006 | Regulatory (external law — AU) |
| C3 — RBNZ FX Transaction Reporting: end-of-day NZD/AUD net settlement positions are foreign exchange transactions; RBNZ FX reporting obligations must be confirmed for the net settlement model; existing SWIFT per-transaction FX reporting infrastructure may not cover intra-group net positions; ADR-CB-008 mandates Treasury Operations sign-off as DoR prerequisite | NZ leg | RBNZ FX Transaction Reporting Rules; policy doc s.D.1, s.D.2; EA registry TTPS-SET-001, TTPS-RISK-003; ADR-CB-008 | Regulatory (external law — NZ) |
| C4 — Payment Services Regulations 2021 (NZ): DIA written determination required for the new payment service type; if new-type registration required, registration must complete before retail launch; ADR-CB-007 requires written Regulatory Affairs confirmation before any new payment channel is offered to retail customers | NZ leg | Payment Services Regulations 2021 (NZ); policy doc s.C.1, s.C.2; ADR-CB-007; EA registry TTPS-RISK-002 | Regulatory (external law — NZ) |
| C5 — Correspondent bank agreement (JPMorgan Chase): routing change from SWIFT to proprietary channel for NZD/AUD transactions requires review of the bilateral correspondent bank agreement; agreement may contain notification or consent obligation for routing changes; bypassing the SWIFT correspondent without satisfying any such obligation creates contractual and credit relationship risk; ADR-CB-002 mandates review of all active correspondent bank agreements for the affected corridors before routing change is implemented | Cross-border (contractual) | ADR-CB-002 + ADR-CB-002 Note; EA registry TTPS-RISK-001, TTPS-SWIFT-001, TTPS-ROUTE-001 | Contractual (cross-border bilateral — not regulatory) |

### Table 2 — Story-to-constraint mapping (jurisdiction-labelled)

| Story | C1 (NZ — RBNZ AML/CFT) | C2 (AU — AUSTRAC) | C3 (NZ — RBNZ FX) | C4 (NZ — DIA) | C5 (cross-border — JPMorgan Chase) |
|-------|------------------------|-------------------|-------------------|---------------|-------------------------------------|
| 1.1 — RBNZ AML/CFT Channel Validation | ✅ PRIMARY | — | ✅ (threshold reporting co-located) | — | — |
| 1.2 — AUSTRAC Originator Information Confirmation | — | ✅ PRIMARY | — | — | — |
| 1.3 — RBNZ FX Reporting Confirmation | ✅ (RBNZ remit shared; reporting types distinct) | — | ✅ PRIMARY | — | — |
| 1.4 — DIA Payment Service Type Assessment | — | — | — | ✅ PRIMARY | — |
| 1.5 — Correspondent Agreement Review (JPMorgan Chase) | — | — | — | — | ✅ PRIMARY |
| 2.1 — Payment Intake and Threshold Routing | ✅ (gate enforcement — AMLCFT_CHANNEL_VALIDATED) | ✅ (gate enforcement — AUSTRAC_CONFIRMATION_RECEIVED) | ✅ (gate enforcement — FX_REPORTING_VALIDATED) | ✅ (gate enforcement — DIA_REGISTRATION_CLEARED) | ✅ (gate enforcement — CORRESPONDENT_AGREEMENT_CLEARED) |
| 2.2 — AML/CFT Sanctions Screening Integration | ✅ PRIMARY (synchronous pre-commitment screening; fail-closed; all mandatory lists) | ✅ (DFAT list for AU beneficiary; channel-independent) | — | — | — |
| 2.3 — Originator Information Data Model | ✅ (RBNZ record-keeping — originator name/account retained 7 years per s.A.4.3) | ✅ PRIMARY (AUSTRAC originator fields end-to-end; intake validation; completeness gate before transmission) | — | — | — |
| 2.4 — Intra-Group Credit Instruction Transmission | ✅ (AMLCFT_CHANNEL_VALIDATED gate enforced before transmission) | ✅ (originator information bundle included in credit instruction) | — | — | ✅ PRIMARY enforcement (CORRESPONDENT_AGREEMENT_CLEARED gate; channel activation blocked without legal clearance) |
| 2.5 — RBNZ Threshold Transaction Reporting | ✅ PRIMARY (threshold reports for intra-group instructions ≥ NZD $10,000) | — | ✅ (RBNZ FX reporting context — threshold instrument distinct from net FX reporting) | — | — |
| 3.1 — Net Settlement and RBNZ FX Reporting | ✅ (screening records referenced in settlement record) | — | ✅ PRIMARY (RBNZ FX Transaction Reporting for net settlement positions; FX_REPORTING_VALIDATED gate) | — | — |
| 3.2 — Customer Confirmation and Settlement Status | ✅ (confirmation issued only after screening passed and commitment recorded) | ✅ (confirmation gated on credit instruction acknowledgement from enterprise's Australian counterpart) | — | — | — |

### Table 3 — Trigger assignment: named gate owners per (constraint, story) pair with non-delegable boundaries

This is the Config B trigger assignment table. Each (constraint, story) pair where the constraint is PRIMARY for that story has a named gate owner with explicit non-delegable boundary language. Each pair also names the deployment configuration flag the owner has sole authority to set, and the roles the gate is explicitly NOT delegable to.

| (Constraint, Story) | Jurisdiction | Named gate owner | Sole authority — flag | Non-delegable boundary | Trigger event (what causes the flag to be set) |
|---------------------|--------------|------------------|----------------------|------------------------|----------------------------------------------|
| (C1, Story 1.1) | NZ leg | **RBNZ AML/CFT Compliance Officer** (named individual of record at sign-off time) | `AMLCFT_CHANNEL_VALIDATED`; `BS11_NOTIFICATION_DATE` | MUST be performed by the designated RBNZ AML/CFT Compliance Officer of record. Non-delegable to: Payments product manager (functional jurisdiction mismatch — product accountability does not include AML/CFT obligations); engineering lead (functional jurisdiction mismatch); Treasury Legal Counsel (regulatory vs. contractual functional jurisdiction mismatch); general Regulatory Affairs Manager (RBNZ AML/CFT compliance is a distinct specialty within Regulatory Affairs and requires the named AML/CFT-designated officer); Payments Compliance Officer (Payments Compliance covers product compliance but is not the designated RBNZ AML/CFT reporting-entity officer of record). | Written confirmation filed in Payments Compliance SharePoint for (a) screening service coverage of intra-group channel + (b) RBNZ threshold reporting coverage of intra-group channel; BS11 Technology Change notification filed with RBNZ; document IDs recorded in deployment configuration. |
| (C2, Story 1.2) | AU leg | **Payments Compliance Officer (NZ-side coordinator)** + **Enterprise's Australian Counterpart Compliance Liaison (AU-side confirmer)** — joint sign-off | `AUSTRAC_CONFIRMATION_RECEIVED` | MUST be performed jointly by NZ-side Payments Compliance Officer (coordination + sign-off on the enterprise's posture) AND AU-side Enterprise's Australian Counterpart Compliance Liaison (confirmation of AU-side AML/CTF Programme update + originator information field requirements). Non-delegable to: RBNZ AML/CFT Compliance Officer (RBNZ jurisdiction does not extend to AUSTRAC obligations; functional jurisdiction mismatch); the enterprise's general Regulatory Affairs Manager (acting alone — AUSTRAC programme confirmation cannot be issued unilaterally from the NZ side); product manager (functional jurisdiction mismatch); Treasury Legal Counsel (regulatory vs. contractual). The AU-side confirmation is specifically non-delegable to any NZ-side role alone — the AUSTRAC AML/CTF Programme documentation update is the AU entity's act, attested by their compliance liaison. | Written confirmations filed in Payments Compliance SharePoint for (a) AUSTRAC originator information field requirements (from AU-side liaison) + (b) the enterprise's Australian counterpart AML/CTF Programme update documenting the intra-group arrangement (from AU-side liaison); the enterprise gap self-assessment for originator information fields (NZ-side); document IDs recorded. |
| (C3, Story 1.3) | NZ leg | **Enterprise Treasury Manager** (analysis owner) + **Regulatory Affairs team lead** (determination confirmer) — joint sign-off | `FX_REPORTING_VALIDATED` | MUST be performed jointly by Enterprise Treasury Manager (technical analysis of net settlement FX reporting treatment — Treasury owns the settlement model) AND Regulatory Affairs team lead (regulatory interpretation confirmation — Regulatory Affairs owns the RBNZ interpretation engagement). Non-delegable to: RBNZ AML/CFT Compliance Officer (FX transaction reporting is a distinct regulatory remit from AML/CFT; both anchored in RBNZ but procedurally separate); Treasury Operations analyst (sign-off must be at Treasury Manager level per ADR-CB-008); product manager (functional jurisdiction mismatch); Treasury Legal Counsel (regulatory vs. contractual). | Treasury Manager written analysis filed + Regulatory Affairs team lead written confirmation filed in Payments Compliance SharePoint; if existing FX reporting infrastructure does not cover net settlement, scope-extension confirmation for Story 3.1 documented before Story 3.1 estimation; document IDs recorded. |
| (C4, Story 1.4) | NZ leg | **Regulatory Affairs Manager** (named individual of record at sign-off time) | `DIA_REGISTRATION_CLEARED`; `DIA_ASSESSMENT_ID` or `DIA_REGISTRATION_ID` | MUST be performed by the named Regulatory Affairs Manager of record. Non-delegable to: RBNZ AML/CFT Compliance Officer (DIA is a separate regulator from RBNZ; functional jurisdiction mismatch); Payments Compliance Officer (DIA registration is a Regulatory Affairs Manager remit, not a Payments Compliance remit); Enterprise Treasury Manager (DIA registration covers payment service type classification, not settlement / treasury domain); Treasury Legal Counsel (regulatory engagement, not contractual); product manager (functional jurisdiction mismatch). DIA's written determination of payment service type must be addressed to and signed by the Regulatory Affairs Manager as the entity's regulatory-affairs point of record. | DIA written determination received — either (a) existing-licence-coverage confirmed with `DIA_ASSESSMENT_ID` recorded, or (b) DIA registration approval reference number recorded with `DIA_REGISTRATION_ID`; filed in Payments Regulatory Affairs SharePoint. |
| (C5, Story 1.5) | Cross-border (contractual) | **Treasury Legal Counsel** (named individual of record at sign-off time) | `CORRESPONDENT_AGREEMENT_CLEARED`; `CORRESPONDENT_AGREEMENT_CLEARANCE_ID` or `CORRESPONDENT_NOTIFICATION_ACK_ID` | MUST be performed by the named Treasury Legal Counsel of record. Non-delegable to: RBNZ AML/CFT Compliance Officer (regulatory remit, not contractual; functional jurisdiction mismatch); Payments Compliance Officer (regulatory remit, not contractual; functional jurisdiction mismatch); Enterprise Treasury Manager (treasury operations remit, not legal/contractual — the bilateral correspondent agreement is a legal instrument requiring legal counsel review and any required notification or consent is a legal act); Regulatory Affairs Manager (regulatory engagement remit, not contractual — the JPMorgan Chase agreement is a bilateral commercial contract, not a regulatory submission); product manager (functional jurisdiction mismatch); Architecture Review Board (governance verifier under ADR-CB-002, not the contractual reviewer of record). The non-delegable boundary is critical: the contractual obligation under C5 is categorically distinct from the four regulatory obligations C1–C4; mapping it to any regulatory function would mis-assign accountability and would not produce the bilateral-agreement clearance memorandum required by ADR-CB-002. | Treasury Legal review of JPMorgan Chase bilateral correspondent banking agreement completed, then either: (a) clearance memorandum issued (no notification obligation) filed with `CORRESPONDENT_AGREEMENT_CLEARANCE_ID` recorded, OR (b) required notification filed with JPMorgan Chase AND written acknowledgement received from JPMorgan Chase (notification obligation) filed with `CORRESPONDENT_NOTIFICATION_ACK_ID` recorded. If (b), R1 is logged as a BLOCKER until acknowledgement is received. |

**Cross-Epic gate-flag enforcement:** Stories 2.1 (intake), 2.2 (screening), 2.4 (transmission), 3.1 (settlement) each enforce a subset of the five gates as pre-flight checks. The named gate owners above are the *only* roles that may set the flags to `true`; engineering roles enforce the gates at runtime but cannot set them. Automated CI/CD tests verify both that engineering enforcement is correct (`flag=false` → blocked) and that flag-set authority is controlled (production deployment configuration changes to these flags require change-control evidence linking the change to the named owner's written confirmation document ID).

---

## Epic 1 — Regulatory and Contractual Pre-conditions Gate

**Purpose:** Establish the five mandatory pre-conditions that gate the intra-group channel's production activation. Epic 1 stories are compliance, legal, and regulatory delivery items — not engineering features. They each produce a deployment configuration flag that defaults to `false`. The intra-group channel MUST NOT process any live customer payment instructions until all five flags are set to `true` by their respective named, jurisdiction-appropriate, non-delegable owners (see Table 3). Engineering teams may build Epic 2 and Epic 3 stories in dev/UAT environments in parallel.

**Oversight level (epic):** HIGH — multi-jurisdiction regulatory engagement (RBNZ, AUSTRAC via the enterprise's Australian counterpart, DIA) + cross-border contractual review (JPMorgan Chase).

---

### Story 1.1 — RBNZ AML/CFT Channel Coverage Validation and Written Compliance Confirmation

**As a** RBNZ AML/CFT Compliance Officer (NZ — the named designated AML/CFT reporting-entity officer of record)
**I want** to produce and file written confirmations that the existing AML/CFT Sanctions Screening Service and RBNZ threshold transaction reporting infrastructure cover the intra-group payment channel on equivalent terms to the SWIFT channel, and to file the BS11 Technology Change notification with RBNZ
**So that** the enterprise meets its primary AML/CFT liability obligations under the RBNZ AML/CFT Act 2009 before any customer payment instruction is routed via the intra-group channel, and the channel activation is gated by a documented compliance assessment rather than an untested assertion

**Acceptance Criteria:**

AC1: The RBNZ AML/CFT Compliance Officer produces a written confirmation that the existing AML/CFT Sanctions Screening Service (TTPS-SCR-001) covers intra-group-routed payment instructions on equivalent terms to SWIFT-routed instructions. The confirmation explicitly addresses all of: (a) RBNZ-designated persons list coverage; (b) OFAC SDN list coverage; (c) DFAT consolidated list coverage (for AU beneficiary transactions); (d) synchronous pre-commitment screening enforcement (instruction not committed to intra-group channel until non-match result returned); (e) fail-closed fallback (instruction declined if screening service unavailable per ADR-CB-004). If existing screening service has SWIFT-channel-specific configuration that does not cover intra-group instructions, the remediation work is documented in this story and completed before the written confirmation is issued. The confirmation is filed in Payments Compliance SharePoint; document ID recorded.

AC2: The RBNZ AML/CFT Compliance Officer produces a written confirmation that the RBNZ threshold transaction reporting infrastructure (TTPS-REP-001) covers intra-group-routed transactions ≥ NZD $10,000 on the same terms as SWIFT-routed transactions. If the reporting module has SWIFT-channel-specific logic, the confirmation documents the gap and the remediation scope. Remediation arising is in-scope for Story 2.5 and completed before the written confirmation is issued. Confirmation states the reporting format and confirms the RBNZ submission pathway is operational for intra-group transactions. Filed in Payments Compliance SharePoint; document ID recorded.

AC3: A deployment configuration field `AMLCFT_CHANNEL_VALIDATED` is established and defaults to `false`. The payment instruction intake (Story 2.1) and AML/CFT screening integration (Story 2.2) MUST reject all payment submissions with a "channel not activated" error when this flag is `false`. The flag may only be set to `true` by the named RBNZ AML/CFT Compliance Officer of record, and only after both written confirmations (AC1 + AC2) are filed with document IDs recorded in the deployment configuration. **Non-delegable enforcement:** production deployment-configuration change records for this flag include the document IDs from AC1 and AC2 and the user identity of the Compliance Officer who authorised the change; change-control review rejects any flag change not linked to these document IDs and not authorised by the named Compliance Officer of record. Automated tests verify: (a) flag=false → intake returns "channel not activated"; (b) flag=true → intake proceeds to screening normally.

AC4: A BS11 Technology Change notification is filed with RBNZ no fewer than 30 business days before planned production go-live. The notification describes: (a) the new intra-group payment channel and its relationship to the existing SWIFT international payment service; (b) confirmation that the existing AML/CFT Sanctions Screening Service is extended to cover the intra-group channel on equivalent terms; (c) the threshold transaction reporting coverage confirmation; (d) planned go-live date; (e) rollback plan. Deployment configuration field `BS11_NOTIFICATION_DATE` is set by the Compliance Officer on filing date. CI/CD production deployment pipeline includes a gate verifying deployment date ≥30 business days after `BS11_NOTIFICATION_DATE`; if gate fails, deployment is blocked. Automated tests verify: (a) gate blocks deployment when fewer than 30 business days elapsed; (b) gate passes when minimum satisfied.

AC5: Integration tests for the AML/CFT screening integration (staging environment, before production go-live) verify: (a) intra-group instruction receives synchronous pre-commitment screening; (b) screening match → instruction declined, decline record created with instruction ID, screening list versions, match status, timestamp; (c) screening service unavailable → instruction declined with fail-closed response (not deferred, not queued without screening); (d) screening record per instruction retained with instruction ID, screening list versions, overall match status, timestamp.

**Architecture constraints:**
- C1 (NZ leg — RBNZ AML/CFT Act 2009, PRIMARY): s.A.1 enterprise retains primary reporting entity obligations regardless of routing channel; s.A.3.2 screening obligation attaches to payment instruction, not transmission channel; s.A.4.2 threshold reporting applies regardless of routing; BS11 Technology Change notification requirement; ADR-CB-003/004 mandatory synchronous screening + fail-closed fallback.
- C3 (NZ leg — RBNZ threshold reporting sub-obligation): threshold reporting coverage for intra-group channel validated as part of this story (AC2). Note: this is RBNZ threshold reporting (a transaction-level reporting instrument under RBNZ AML/CFT); it is distinct from RBNZ FX transaction reporting under C3 / Story 1.3 (a settlement-level FX reporting instrument). Both anchored in RBNZ remit; procedurally separate.

**Named gate owner (per Table 3):** RBNZ AML/CFT Compliance Officer. **Non-delegable to:** Payments product manager, engineering lead, Treasury Legal Counsel, general Regulatory Affairs Manager, Payments Compliance Officer.

**Oversight level:** HIGH — RBNZ AML/CFT Compliance Officer sign-off; direct RBNZ engagement for BS11 notification.

---

### Story 1.2 — AUSTRAC Originator Information Confirmation and Enterprise's Australian Counterpart AML/CTF Programme Documentation

**As a** Payments Compliance Officer (NZ-side coordinator) working jointly with the Enterprise's Australian Counterpart Compliance Liaison (AU-side confirmer)
**I want** to obtain written confirmation of the AUSTRAC originator information requirements from the enterprise's Australian counterpart compliance team, and confirmation that their AML/CTF Programme has been updated to document the intra-group arrangement as a correspondent banking arrangement
**So that** the enterprise satisfies its direct AUSTRAC originator information provision obligation before transmitting any credit instruction, and the enterprise's Australian counterpart's AUSTRAC programme covers the arrangement before the first inbound instruction is processed on the AU leg

**Acceptance Criteria:**

AC1: The Enterprise's Australian Counterpart Compliance Liaison provides written confirmation from the enterprise's Australian counterpart compliance team specifying the minimum originator information fields required by their AUSTRAC AML/CTF Programme for inbound credit instructions from the enterprise. The confirmation specifies, for each required field: (a) exact field name; (b) format requirements (full legal name — abbreviated names not acceptable); (c) minimum data quality standard (residential or registered address required — PO box not acceptable); (d) whether field requirements differ for individual vs. business/entity customers; (e) character encoding, maximum field length, structured format requirements for the credit instruction. Signed by the enterprise's Australian counterpart compliance authority of record; filed in Payments Compliance SharePoint; document ID recorded.

AC2: The Enterprise's Australian Counterpart Compliance Liaison provides written confirmation that the intra-group payment arrangement has been documented in the enterprise's Australian counterpart's AUSTRAC AML/CTF Programme as a correspondent banking arrangement. The confirmation states: (a) the section of the AML/CTF Programme that documents the arrangement; (b) that due diligence on the enterprise as originating entity has been completed; (c) the effective date of the Programme update — confirmed as predating the channel's first live customer transaction. Filed in Payments Compliance SharePoint alongside AC1; document ID recorded.

AC3: The enterprise's Payments Compliance Officer conducts a self-assessment of originator information fields currently held in customer records against AUSTRAC requirements from AC1. The self-assessment documents: (a) required fields held in customer records and includable in credit instruction automatically; (b) required fields not held or held in incompatible format; (c) remediation approach for any gap (enhanced customer intake data capture or confirmed acceptable substitution). Gaps identified are in-scope for Story 2.3 and reflected in Story 2.3 implementation before channel activation. Self-assessment document filed; document ID recorded.

AC4: A deployment configuration flag `AUSTRAC_CONFIRMATION_RECEIVED` is established and defaults to `false`. The credit instruction transmission step (Story 2.4) MUST NOT transmit any credit instruction to the enterprise's Australian counterpart when this flag is `false`. The flag may only be set to `true` after both written confirmations (AC1 + AC2) are filed AND the gap self-assessment (AC3) is filed, with all document IDs recorded in the deployment configuration. **Non-delegable enforcement:** the flag change record requires evidence of joint sign-off (NZ-side Payments Compliance Officer + AU-side Compliance Liaison) — change-control rejects any flag change not linked to both signatures. Automated tests verify: (a) flag=false → transmission blocked with "AUSTRAC confirmation not yet received" gate error; (b) flag=true → transmission proceeds normally through Story 2.4.

**Architecture constraints:**
- C2 (AU leg — AUSTRAC AML/CTF Act 2006 (Cth), PRIMARY): policy doc s.B.1 — enterprise responsible for originator information meeting AUSTRAC minimum requirements; inadequate information may cause enterprise's Australian counterpart to delay settlement (TTPS-RISK-004); s.B.2 — intra-group payment arrangement is a correspondent banking arrangement regardless of group ownership; AML/CTF Programme documentation and due diligence on the enterprise required. ADR-CB-006 — AUSTRAC originator information standards for AU-leg payments.

**Named gate owner (per Table 3):** Payments Compliance Officer (NZ-side coordinator) + Enterprise's Australian Counterpart Compliance Liaison (AU-side confirmer) — joint sign-off. **Non-delegable to:** RBNZ AML/CFT Compliance Officer, the enterprise's general Regulatory Affairs Manager acting alone, product manager, Treasury Legal Counsel. AU-side confirmation specifically non-delegable to any NZ-side role alone.

**Oversight level:** HIGH — joint NZ/AU-side compliance sign-off; cross-entity engagement with the enterprise's Australian counterpart's AUSTRAC programme owner.

---

### Story 1.3 — RBNZ FX Transaction Reporting Confirmation for Net Settlement Model

**As an** Enterprise Treasury Manager (analysis owner) working jointly with the Regulatory Affairs team lead (determination confirmer)
**I want** to produce and file a written analysis of the RBNZ FX Transaction Reporting obligations for the end-of-day NZD/AUD net settlement model, confirmed by Regulatory Affairs
**So that** the enterprise is clear on its RBNZ FX reporting obligations before the net settlement flow is activated, and any extension to existing FX reporting infrastructure is identified and scoped before go-live (per ADR-CB-008)

**Acceptance Criteria:**

AC1: Enterprise Treasury Manager produces a written analysis of the RBNZ FX Transaction Reporting obligations applicable to the end-of-day NZD/AUD net settlement model. The analysis addresses: (a) whether intra-group net settlement positions are reportable FX transactions under current RBNZ FX Transaction Reporting Rules (policy doc s.D.1; note that net settlement is an FX transaction even with no external counterparty); (b) appropriate reporting frequency and format — net position per settlement cycle vs. per-payment-level breakdown; (c) whether the existing FX reporting infrastructure (TTPS-SET-001, designed for SWIFT per-payment FX reporting) covers intra-group net settlement positions or requires extension; (d) whether the daily net position is expected to exceed the NZD $100,000 reporting threshold per s.D.2. The analysis is filed in Treasury SharePoint; document ID recorded.

AC2: The Regulatory Affairs team lead produces a written confirmation of one of: (a) RBNZ FX Transaction Reporting obligations apply to the net settlement model in the form confirmed by the Treasury analysis (AC1), and existing FX reporting infrastructure covers net positions without extension — the channel may proceed with no additional FX reporting development; or (b) RBNZ FX Transaction Reporting obligations apply and existing infrastructure does not cover intra-group net settlement positions — specific extension work documented, and that work is in-scope for Story 3.1. If (b), Story 3.1 scope is updated before Story 3.1 is estimated. Confirmation filed in Payments Compliance SharePoint; document ID recorded.

AC3: A deployment configuration flag `FX_REPORTING_VALIDATED` is established and defaults to `false`. The net settlement position management step (Story 3.1) MUST NOT transmit any net settlement position to TTPS-SET-001 when this flag is `false`. The flag may only be set to `true` by joint authority — Enterprise Treasury Manager (Treasury analysis owner) AND Regulatory Affairs team lead (regulatory determination confirmer) — after the written confirmation (AC2) is filed with document ID recorded. **Non-delegable enforcement:** flag change record requires both signatures. Automated tests verify: (a) flag=false → net settlement transmission blocked with "FX reporting validation not yet completed" gate error; (b) flag=true → settlement proceeds normally through Story 3.1.

**Architecture constraints:**
- C3 (NZ leg — RBNZ FX Transaction Reporting, PRIMARY): EA registry TTPS-SET-001 — RBNZ FX transaction reporting obligation noted for end-of-day net settlement; TTPS-RISK-003 HIGH — FX reporting not assessed for intra-group channel; existing FX reporting designed for SWIFT per-transaction; ADR-CB-008 — Treasury Operations sign-off documented as DoR prerequisite for any net settlement model affecting RBNZ FX reporting.
- C1 (NZ leg — RBNZ AML/CFT, secondary co-location): RBNZ threshold transaction reporting (Story 2.5) and RBNZ FX reporting (this story) are distinct instruments both anchored in RBNZ; confirmation of one does not substitute for the other.

**Named gate owner (per Table 3):** Enterprise Treasury Manager + Regulatory Affairs team lead — joint sign-off. **Non-delegable to:** RBNZ AML/CFT Compliance Officer (distinct regulatory remit even within RBNZ), Treasury Operations analyst (must be at Treasury Manager level per ADR-CB-008), product manager, Treasury Legal Counsel.

**Oversight level:** MEDIUM — joint Treasury Manager + Regulatory Affairs lead sign-off; RBNZ regulatory relationship team may be engaged for formal interpretation.

---

### Story 1.4 — DIA Payment Service Type Assessment and Registration Gate

**As a** Regulatory Affairs Manager (the named regulatory-affairs point of record)
**I want** to obtain written confirmation from DIA of whether the new intra-group payment channel constitutes a new payment service type requiring additional DIA registration before retail launch
**So that** the enterprise does not offer the service to retail customers before confirming its regulatory licence status under the Payment Services Regulations 2021, satisfying architecture guardrail ADR-CB-007

**Acceptance Criteria:**

AC1: Regulatory Affairs prepares and submits a formal written request to DIA seeking a payment service type determination for the proposed intra-group payment channel. The request describes: (a) the channel mechanics — intra-group routing, NZD/AUD net settlement model, sub-$10,000 transaction threshold, 2-hour settlement SLA, NZ-to-AU direction only; (b) the enterprise's existing payment service licence type(s); (c) request for DIA written determination of whether the proposed channel constitutes a new payment service type requiring additional registration under PSR 2021, or is covered under the existing licence. Submission tracked from filing date in the project risk register.

AC2: If DIA confirms existing licence coverage: written determination filed in Payments Regulatory Affairs SharePoint and document ID recorded in deployment configuration as `DIA_ASSESSMENT_ID`. Channel may proceed to retail launch subject to all other Epic 1 gates being cleared.
If DIA determines new registration required: Regulatory Affairs initiates the DIA registration process (typical 4–12 weeks per policy doc s.C.2). The channel MUST NOT be offered to retail customers until DIA registration is approved and registration reference number is recorded as `DIA_REGISTRATION_ID`.

AC3: A deployment configuration flag `DIA_REGISTRATION_CLEARED` is established and defaults to `false`. The payment instruction intake (Story 2.1) MUST return "service not yet available" for all submission attempts when this flag is `false`. The flag may only be set to `true` by the named Regulatory Affairs Manager of record after either: (a) DIA written determination of existing licence coverage filed with `DIA_ASSESSMENT_ID` recorded; or (b) DIA registration approval received with `DIA_REGISTRATION_ID` recorded. **Non-delegable enforcement:** flag change record requires evidence of the Regulatory Affairs Manager's authorisation linked to the relevant DIA document ID. Automated tests verify: (a) flag=false → intake returns "service not yet available"; (b) flag=true → intake proceeds to eligibility determination normally.

AC4: If DIA registration required (AC2 option b), Regulatory Affairs Manager tracks application status and provides weekly update to Payments product team until determination is received. If DIA registration approval timeline extends beyond engineering go-live readiness, retail launch is formally deferred and the deferral documented in the project risk register alongside expected DIA determination date.

**Architecture constraints:**
- C4 (NZ leg — Payment Services Regulations 2021, PRIMARY): ADR-CB-007 — written Regulatory Affairs assessment of payment service type classification mandatory before any new payment channel is offered to retail customers; EA registry TTPS-REG-001 — DIA registration status not confirmed; TTPS-RISK-002 HIGH — DIA registration may be required before launch; policy doc s.C.1 (definition of payment service; obligation to confirm before launch — "we already provide international payments" not sufficient basis); s.C.2 (DIA registration process timeline).

**Named gate owner (per Table 3):** Regulatory Affairs Manager. **Non-delegable to:** RBNZ AML/CFT Compliance Officer (DIA is separate regulator from RBNZ), Payments Compliance Officer (DIA registration is a Regulatory Affairs remit, not Payments Compliance), Enterprise Treasury Manager (settlement / treasury domain, not payment service type classification), Treasury Legal Counsel (regulatory engagement, not contractual), product manager.

**Oversight level:** HIGH — Regulatory Affairs Manager sign-off; direct DIA engagement; retail launch blocked on DIA written determination.

---

### Story 1.5 — Correspondent Bank Agreement Review: JPMorgan Chase SWIFT Correspondent

**As a** Treasury Legal Counsel (the named legal-counsel-of-record for the JPMorgan Chase bilateral correspondent agreement)
**I want** to review the bilateral correspondent banking agreement with JPMorgan Chase to determine whether the intra-group channel's routing change requires prior notification or consent under the agreement, and if required, to obtain JPMorgan Chase's written acknowledgement
**So that** the enterprise satisfies architecture guardrail ADR-CB-002's mandatory correspondent agreement review before the routing change is implemented, and the channel is not activated in a way that creates contractual or credit relationship risk with JPMorgan Chase

**Acceptance Criteria:**

AC1: Treasury Legal reviews the bilateral correspondent banking agreement currently in place between the enterprise and JPMorgan Chase for NZD/AUD international payments. The review specifically determines: (a) whether the agreement contains any term restricting the enterprise from routing NZD/AUD payment transactions outside the agreed SWIFT channel without prior notification or written consent from JPMorgan Chase; (b) if such restriction exists: the exact form of notification or consent required (written notice only, prior written consent required, notice period); (c) if such restriction exists: whether there is a minimum volume threshold below which the restriction does not apply. Documented in a written legal memorandum filed in Treasury Legal SharePoint. This review MUST be completed before the intra-group channel architecture design is finalised (per ADR-CB-002).

AC2: Based on AC1 review, Treasury Legal reaches one of two determinations:
(a) **No notification or consent obligation:** Treasury Legal issues a written clearance memorandum confirming the routing change is clear of correspondent agreement restrictions. Filed in Treasury Legal SharePoint; document ID recorded in deployment configuration as `CORRESPONDENT_AGREEMENT_CLEARANCE_ID`.
(b) **Notification or consent obligation confirmed:** Treasury Legal prepares and submits the required written notification to JPMorgan Chase (or initiates the consent process). The channel MUST NOT be activated before JPMorgan Chase provides written acknowledgement of the notification (or written consent for consent-requiring obligations). JPMorgan Chase's response is filed in Treasury Legal SharePoint; document ID recorded as `CORRESPONDENT_NOTIFICATION_ACK_ID`. If this determination is reached, **R1 is formally logged as a project BLOCKER** until acknowledgement is received (per discovery RISK R1 escalation condition).

AC3: A deployment configuration flag `CORRESPONDENT_AGREEMENT_CLEARED` is established and defaults to `false`. The intra-group credit instruction transmission step (Story 2.4) MUST NOT transmit any credit instruction to the enterprise's Australian counterpart via the intra-group channel when this flag is `false`. The flag may only be set to `true` by the named Treasury Legal Counsel of record after either: (a) clearance memorandum (AC2 determination a) filed with `CORRESPONDENT_AGREEMENT_CLEARANCE_ID` recorded; or (b) JPMorgan Chase's written acknowledgement or consent (AC2 determination b) filed with `CORRESPONDENT_NOTIFICATION_ACK_ID` recorded. **Non-delegable enforcement:** flag change record requires Treasury Legal Counsel signature linked to the relevant SharePoint document ID. Change-control explicitly rejects any flag change authorised by a regulatory function (RBNZ AML/CFT Compliance, Payments Compliance, Regulatory Affairs, AUSTRAC compliance) because the obligation under C5 is contractual rather than regulatory and is non-delegable across the regulatory/contractual functional boundary. Automated tests verify: (a) flag=false → intra-group routing returns "channel not authorised" error without transmitting; (b) flag=true → transmission proceeds normally.

AC4: If agreement review reveals a consent obligation (AC2 determination b), Treasury Legal provides the timeline for obtaining JPMorgan Chase's consent to the Payments product team. If the consent timeline extends beyond engineering go-live readiness, the channel activation timeline is formally updated and the timeline risk documented in the project risk register. The obligation to notify or seek consent from JPMorgan Chase — regardless of whether notification or consent is required — must not be deferred until after engineering build commences.

**Architecture constraints:**
- C5 (cross-border contractual — SWIFT correspondent agreement, PRIMARY): ADR-CB-002 — mandatory review of all active correspondent bank agreements for affected corridors before any routing change; ADR-CB-002 Note — correspondent bank agreements may contain notification obligations for routing changes; routing changes that bypass a SWIFT correspondent without satisfying notification obligation create contractual and credit relationship risk; EA registry TTPS-RISK-001 HIGH — JPMorgan Chase correspondent relationship impact not assessed; TTPS-SWIFT-001 — JPMorgan Chase is active SWIFT correspondent for NZD/AUD payments; TTPS-ROUTE-001 — "correspondent banking relationship implications to be assessed before activation."

**Named gate owner (per Table 3):** Treasury Legal Counsel — **non-delegable; specifically not delegable to any regulatory function** because the obligation is contractual (bilateral commercial agreement) rather than regulatory. **Non-delegable to:** RBNZ AML/CFT Compliance Officer, Payments Compliance Officer, Enterprise Treasury Manager (treasury operations remit, not legal), Regulatory Affairs Manager (regulatory engagement remit, not contractual), product manager, Architecture Review Board (verifier under ADR-CB-002, not contractual reviewer of record).

**Oversight level:** HIGH — Treasury Legal Counsel sign-off; potential direct engagement with JPMorgan Chase; channel activation blocked without legal clearance or notification acknowledgement.

---

## Epic 2 — Intra-Group Payment Channel Core

**Purpose:** Build the payment instruction intake, AML/CFT screening, originator information data model, credit instruction transmission, and threshold transaction reporting components. Stories 2.1–2.5 may be built and tested in dev/UAT before Epic 1 completes. No story in this epic may be activated for live customer transactions in production before all five Epic 1 deployment flags are `true`. Each story includes enforcement of the relevant Epic 1 flags in its AC gating logic.

**Oversight level (epic):** MEDIUM — engineering delivery with enforced compliance gates.

---

### Story 2.1 — Payment Instruction Intake, Eligibility Determination, and Threshold Routing

**As a** retail banking customer
**I want** to submit an NZ-to-AU payment instruction through the Retail Digital Banking Platform or Phone Banking System and have it routed through the most appropriate channel based on the instruction amount
**So that** eligible payments (≤NZD $10,000, AU beneficiary) are processed via the intra-group channel with sub-$5 pricing and 2-hour settlement, and ineligible payments continue via the standard SWIFT channel at existing terms

**Acceptance Criteria:**

AC1: Intake component accepts instructions from TTPS-IN-001 (Retail Digital Banking Platform) and TTPS-IN-002 (Phone Banking System). At intake, the component enforces all five channel activation flags as a pre-flight gate. If any flag is `false`, intake returns a structured "service not yet available" response identifying the unmet activation condition. Flags checked: `AMLCFT_CHANNEL_VALIDATED`, `AUSTRAC_CONFIRMATION_RECEIVED`, `FX_REPORTING_VALIDATED`, `DIA_REGISTRATION_CLEARED`, `CORRESPONDENT_AGREEMENT_CLEARED`. Automated tests verify: (a) any single flag=false causes appropriate error; (b) all flags=true → intake proceeds to eligibility determination.

AC2: Eligibility determination routes instructions: AU beneficiary + amount ≤NZD $10,000 → intra-group channel path; amount >NZD $10,000 (regardless of beneficiary jurisdiction) → SWIFT gateway (TTPS-SWIFT-001) with standard pricing; non-AU beneficiary (regardless of amount) → SWIFT gateway with standard pricing. Routing decision and threshold used logged per instruction with instruction ID, amount, beneficiary jurisdiction code, routing outcome, timestamp. SWIFT routing preserves all existing SWIFT processing — this story does not modify the SWIFT path.

AC3: Instruction passing intake and routed to intra-group is persisted with `intake_state = ACCEPTED_PENDING_SCREENING` and handed off to Story 2.2 (AML/CFT screening). State machine: ACCEPTED_PENDING_SCREENING → SCREENING_IN_PROGRESS → (SCREENING_PASSED | SCREENING_BLOCKED | SCREENING_ERROR_DECLINED). Each state transition logged with timestamp.

**Architecture constraints:**
- C1, C2, C3, C4, C5 (all PRIMARY for gate enforcement at intake): all five channel activation flags are pre-flight gates. The gate-flag-enforcement engineering work in this story is NOT the gate-setting authority — only the named gate owners in Stories 1.1–1.5 may set the flags to `true`.

**Oversight level:** MEDIUM — engineering delivery; gate enforcement testing is required.

---

### Story 2.2 — AML/CFT Sanctions Screening Integration for Intra-Group Channel

**As a** Payments engineering team
**I want** to integrate the intra-group channel with the existing AML/CFT Sanctions Screening Service (TTPS-SCR-001) with synchronous pre-commitment screening and fail-closed fallback
**So that** every intra-group instruction is screened on the same terms as SWIFT, satisfying RBNZ AML/CFT obligations and ADR-CB-003/004

**Acceptance Criteria:**

AC1: Screening service called synchronously with the instruction's originator + beneficiary identity payload before instruction is committed to the intra-group channel. Screening covers RBNZ-designated persons list, OFAC SDN list, DFAT consolidated list (for AU beneficiary). Screening result includes per-list match status, screening list versions used, overall result (CLEAR | MATCH | ERROR), screening reference number, timestamp.

AC2: CLEAR result → instruction proceeds to Story 2.3 (originator information validation). MATCH result → instruction declined; decline record created (instruction ID, screening list versions, match status, timestamp, decline reason = "sanctions screening match"); customer-facing decline message issued; no further processing. ERROR result (service unavailable, timeout) → instruction declined per fail-closed policy (ADR-CB-004); no fallback to "proceed without screening"; decline record created with reason = "screening service unavailable — fail-closed".

AC3: Story 2.2 enforces `AMLCFT_CHANNEL_VALIDATED` at the screening call boundary. If flag is `false`, screening is not invoked and intake returns "channel not activated" (this is redundant with Story 2.1 intake-time enforcement; the double-gate is intentional defence-in-depth and is required by ADR-CB-004 fail-closed posture).

AC4: Screening record retained per instruction for 7 years per RBNZ AML/CFT s.A.4.3 originator information retention requirement.

**Architecture constraints:**
- C1 (NZ leg — RBNZ AML/CFT, PRIMARY): s.A.3.2 channel-independent screening obligation; s.A.4.3 7-year retention; ADR-CB-003 mandatory synchronous screening; ADR-CB-004 fail-closed fallback (CISO RISK-ACCEPT required for any "proceed without screening" fallback — out of scope for this channel by design).
- C2 (AU leg — AUSTRAC, secondary): DFAT consolidated list coverage for AU beneficiary transactions; channel-independent obligation extends to AU-bound payments.

**Oversight level:** MEDIUM — engineering delivery; integration tests verify fail-closed behaviour explicitly.

---

### Story 2.3 — Originator Information Data Model for AUSTRAC Compliance

**As a** Payments engineering team
**I want** the payment instruction data model to carry the AUSTRAC-required originator fields (legal name, account number, NZ address, purpose) end-to-end from customer intake through to credit instruction transmission via TTPS-REG-002
**So that** the enterprise satisfies its direct AUSTRAC originator information provision obligation per s.B.1 and ADR-CB-006

**Acceptance Criteria:**

AC1: Payment instruction data model includes the AUSTRAC-required originator fields as defined by the written confirmation from Story 1.2 AC1: legal name (full, abbreviated names not acceptable), account number, address (residential or registered, not PO box), purpose, plus any additional fields confirmed by the enterprise's Australian counterpart compliance team. Field names, formats, encoding match exactly the AC1 confirmation document.

AC2: At intake, completeness validation runs: if any required field is missing or fails format requirements, instruction is rejected with structured error identifying missing/invalid fields. Customer-facing message guides the customer to update profile information where applicable.

AC3: Any remediation work identified by the Story 1.2 AC3 gap self-assessment is implemented in this story (intake data capture changes, format conversion logic, structured-format generation) before integration testing.

AC4: Originator information bundle is propagated unmodified to Story 2.4 (credit instruction transmission). Transmission step rejects any instruction missing required originator fields (double-gate; defence-in-depth).

**Architecture constraints:**
- C2 (AU leg — AUSTRAC AML/CTF Act 2006 (Cth), PRIMARY): policy doc s.B.1 originator information bundle requirement; ADR-CB-006 AUSTRAC information standards for AU-leg payments.
- C1 (NZ leg — RBNZ AML/CFT, secondary): s.A.4.3 originator information record retention (7 years) — the same originator information bundle is retained per RBNZ record-keeping rules.

**Oversight level:** MEDIUM — engineering delivery; completeness validation testing required.

---

### Story 2.4 — Intra-Group Credit Instruction Transmission to Enterprise's Australian Counterpart

**As a** Payments engineering team
**I want** to transmit the screened, originator-information-complete credit instruction to the enterprise's Australian counterpart via the intra-group routing API (TTPS-ROUTE-001) and record their acknowledgement
**So that** the AU-leg of the payment can proceed to credit at the AU beneficiary's account, subject to the AUSTRAC originator information obligation and the C5 correspondent agreement clearance

**Acceptance Criteria:**

AC1: Transmission step enforces `AUSTRAC_CONFIRMATION_RECEIVED` AND `CORRESPONDENT_AGREEMENT_CLEARED` as pre-flight gates. If either is `false`, transmission is blocked with appropriate gate error; no instruction is sent to the enterprise's Australian counterpart.

AC2: Credit instruction transmitted via TTPS-ROUTE-001 includes the full originator information bundle from Story 2.3. The bundle's fields match exactly the AUSTRAC confirmation (Story 1.2 AC1) field names and formats.

AC3: Acknowledgement from enterprise's Australian counterpart recorded against the instruction (acknowledgement reference, timestamp, status). If acknowledgement not received within configured timeout, the instruction is held in PENDING_ACKNOWLEDGEMENT state and an operations alert is raised. Customer-facing SLA messaging is updated where the timeout breaches the 2-hour settlement SLA.

AC4: Transmission failure (network error, the enterprise's Australian counterpart system unavailable) → instruction held in TRANSMISSION_FAILED state with structured error; retry policy per Treasury Operations runbook; customer notified per ADR-CB-002 routing-change-impact communication standards.

**Architecture constraints:**
- C5 (cross-border contractual — SWIFT correspondent agreement, PRIMARY for gate enforcement): `CORRESPONDENT_AGREEMENT_CLEARED` gate enforced at transmission boundary. Engineering MUST NOT bypass this gate — production deployment configuration changes to this flag require Treasury Legal Counsel authorisation per Story 1.5 AC3.
- C2 (AU leg — AUSTRAC, secondary): originator information bundle included in credit instruction.
- C1 (NZ leg — RBNZ AML/CFT, secondary): `AMLCFT_CHANNEL_VALIDATED` gate enforced (already screened at Story 2.2).

**Oversight level:** MEDIUM-HIGH — engineering delivery with cross-border contractual gate enforcement; production deployment configuration changes to `CORRESPONDENT_AGREEMENT_CLEARED` require change-control linked to Treasury Legal sign-off.

---

### Story 2.5 — RBNZ Threshold Transaction Reporting for Intra-Group Channel

**As a** Payments engineering team
**I want** to extend the RBNZ threshold transaction reporting module (TTPS-REP-001) to cover intra-group-routed transactions ≥ NZD $10,000 on the same terms as SWIFT-routed transactions
**So that** the enterprise satisfies its RBNZ threshold transaction reporting obligations under s.A.4 regardless of routing channel

**Acceptance Criteria:**

AC1: Reporting module configuration extended to include intra-group channel as a source of reportable transactions. Configuration change scope is exactly what was documented in Story 1.1 AC2 written confirmation gap analysis (if any).

AC2: Intra-group transactions ≥ NZD $10,000 (including amounts derived from structured-transaction surveillance aggregation per s.A.4.1) generate threshold transaction reports submitted to RBNZ within the 3-business-day filing window per s.A.4.

AC3: Reports include originator name and account number per s.A.5; the same originator information retained per s.A.4.3 7-year retention.

AC4: Note: intra-group channel is capped at ≤NZD $10,000 per Story 2.1 eligibility logic, so threshold reports for intra-group are rare and primarily arise from structured-transaction surveillance aggregation. Standard SWIFT threshold reporting remains the primary channel for above-threshold transactions.

**Architecture constraints:**
- C1 (NZ leg — RBNZ AML/CFT, PRIMARY): s.A.4 threshold transaction reporting; s.A.4.1 structured-transaction surveillance; s.A.4.2 channel independence; s.A.4.3 7-year originator information retention; s.A.5 originator information requirements for wire transfers.
- C3 (NZ leg — RBNZ FX reporting, secondary contextual): RBNZ FX reporting (Story 3.1) is a distinct reporting instrument; this story addresses threshold transaction reporting (transaction-level), Story 3.1 addresses FX reporting (settlement-level).

**Oversight level:** MEDIUM — engineering delivery; RBNZ submission pathway operability tested.

---

## Epic 3 — Settlement, FX Reporting, and Customer Confirmation

**Purpose:** Implement the end-of-day net settlement, RBNZ FX transaction reporting, and customer settlement confirmation flows. Stories may be built in dev/UAT before Epic 1 completes; production activation gated on Epic 1 flags.

**Oversight level (epic):** MEDIUM — engineering delivery with FX reporting gate enforcement.

---

### Story 3.1 — Net Settlement and RBNZ FX Transaction Reporting

**As a** Treasury Operations team
**I want** end-of-day NZD/AUD net positions between the enterprise and the enterprise's Australian counterpart to be calculated, transmitted to TTPS-SET-001, and reported to RBNZ per the FX Transaction Reporting determination produced under Story 1.3
**So that** the enterprise satisfies its RBNZ FX Transaction Reporting obligations for the net settlement model per policy doc s.D.1, s.D.2 and ADR-CB-008

**Acceptance Criteria:**

AC1: End-of-day net position calculation aggregates all settled intra-group instructions by direction and currency; produces NZD net position vs. enterprise's Australian counterpart for the settlement cycle.

AC2: Net settlement position transmission to TTPS-SET-001 enforces `FX_REPORTING_VALIDATED` as a pre-flight gate. If `false`, transmission blocked with appropriate gate error.

AC3: FX transaction reporting to RBNZ follows the determination produced under Story 1.3 AC2 — either (a) net-position reporting per settlement cycle, or (b) per-payment reporting if Story 1.3 AC2 determination (b) applies and extension work has been built per Story 1.3 AC2 scope update.

AC4: Settlement records include screening reference numbers from Story 2.2 for each instruction included in the net position (for cross-reference to AML/CFT records).

**Architecture constraints:**
- C3 (NZ leg — RBNZ FX Transaction Reporting, PRIMARY): policy s.D.1, s.D.2; EA registry TTPS-SET-001, TTPS-RISK-003; ADR-CB-008 Treasury Operations sign-off as DoR prerequisite.
- C1 (NZ leg — RBNZ AML/CFT, secondary): screening records cross-referenced in settlement records.

**Oversight level:** MEDIUM — engineering + Treasury Operations runbook.

---

### Story 3.2 — Customer Settlement Confirmation and 2-Hour SLA

**As a** retail banking customer
**I want** to receive a settlement confirmation when my intra-group payment is credited to the AU beneficiary's account, within the 2-hour SLA where business hours allow
**So that** the value proposition of the channel (sub-2-hour settlement) is delivered observably

**Acceptance Criteria:**

AC1: Customer confirmation issued via TTPS-CONF-001 only after credit instruction acknowledgement received from the enterprise's Australian counterpart (Story 2.4 AC3) AND AML/CFT screening passed (Story 2.2). Confirmation includes instruction ID, amount, AU beneficiary reference, settlement timestamp.

AC2: SLA timer starts at intake (Story 2.1) and stops at customer confirmation issuance. SLA breach detection: if confirmation is not issued within 2 hours, customer notified of expected delay per ADR-CB-002 routing-change-impact communication standards.

AC3: Cut-off / SWIFT fallback path (TTPS-RISK-005): for instructions submitted near or past the intra-group channel processing cut-off, fallback to SWIFT either preserves the 2-hour SLA or customer is notified of expected delay before instruction is committed.

AC4: Operations dashboard surfaces SLA achievement rate per settlement cycle; alerts on SLA breach rate above operational threshold.

**Architecture constraints:**
- C2 (AU leg — AUSTRAC, secondary): confirmation gated on credit instruction acknowledgement from enterprise's Australian counterpart, which in turn depends on AUSTRAC originator information completeness.
- C1 (NZ leg — RBNZ AML/CFT, secondary): confirmation issued only after screening passed and commitment recorded.

**Oversight level:** MEDIUM — engineering delivery; SLA pilot testing in UAT.

---

## Scope accumulator vs. discovery MVP

MVP scope from discovery covers (1) intake + threshold routing; (2) AML/CFT screening; (3) originator information data model; (4) intra-group credit instruction transmission; (5) RBNZ threshold transaction reporting; (6) net settlement + RBNZ FX reporting; (7) customer settlement confirmation; (8) SWIFT fallback path preserving SLA. Pre-launch pre-conditions B1/C1–B5/C5.

Stories 1.1–1.5 cover all five pre-launch pre-conditions (1:1). Stories 2.1–2.5 cover MVP items 1, 2, 3, 4, 5 (1:1). Stories 3.1–3.2 cover MVP items 6, 7, 8 (Story 3.1 = item 6; Story 3.2 = items 7 + 8). **No scope drift; no scope omissions.** Twelve stories total.

---

<!-- CPF-TRACE
stage: /definition
model: claude-opus-4-6
config: B
experiment: EXP-008-corpus-breadth-eval
run: config-B-S13
date: 2026-05-17
upstream_artefact: runs/config-B-S13/discovery.md (read from disk)

constraints_identified:
- C1 (NZ leg): RBNZ AML/CFT Act 2009 — primary AML/CFT liability retained; channel-independent screening + threshold reporting; BS11 notification ≥30 business days; ADR-CB-003/004 (synchronous screening, fail-closed)
- C2 (AU leg): AUSTRAC AML/CTF Act 2006 (Cth) — direct originator information obligation; enterprise's Australian counterpart AML/CTF Programme correspondent banking documentation; ADR-CB-006
- C3 (NZ leg): RBNZ FX Transaction Reporting — net settlement = FX transaction (s.D.1); NZD $100,000 reporting threshold (s.D.2); ADR-CB-008 Treasury sign-off as DoR prerequisite
- C4 (NZ leg): Payment Services Regulations 2021 — DIA written determination required; new-type registration possible (s.C.1, s.C.2); ADR-CB-007
- C5 (cross-border contractual): SWIFT correspondent bank agreement (JPMorgan Chase) — ADR-CB-002 mandatory review; ADR-CB-002 Note signals notification obligation possibility + contractual/credit consequence

constraints_carried_forward:
- C1: Step 0 (constraints carried in); Step 4a Table 1 (regulated constraints by jurisdiction leg — NZ); Step 4a Table 2 (story-to-constraint mapping — PRIMARY for Stories 1.1, 2.2, 2.5; gate enforcement for 2.1, 2.4); Step 4a Table 3 (named gate owner: RBNZ AML/CFT Compliance Officer with non-delegable boundary); Story 1.1 (PRIMARY constraint; named gate owner with non-delegable boundary listed in story); Story 2.2 PRIMARY; Story 2.5 PRIMARY; Stories 2.1, 2.4 gate enforcement
- C2: Step 0; Step 4a Table 1 (AU leg); Step 4a Table 2 (PRIMARY for Stories 1.2, 2.3; gate enforcement for 2.1, 2.4; secondary for 3.2); Step 4a Table 3 (named gate owners: Payments Compliance Officer NZ-side + Enterprise's Australian Counterpart Compliance Liaison AU-side joint sign-off, non-delegable to NZ-side alone); Story 1.2 PRIMARY with non-delegable joint-sign-off boundary; Story 2.3 PRIMARY; Stories 2.1, 2.4 gate enforcement
- C3: Step 0; Step 4a Table 1 (NZ leg); Step 4a Table 2 (PRIMARY for Stories 1.3, 3.1; gate enforcement for 2.1; secondary for 1.1, 2.5); Step 4a Table 3 (named gate owners: Enterprise Treasury Manager + Regulatory Affairs team lead joint sign-off, non-delegable); Story 1.3 PRIMARY with joint sign-off boundary; Story 3.1 PRIMARY
- C4: Step 0; Step 4a Table 1 (NZ leg); Step 4a Table 2 (PRIMARY for Story 1.4; gate enforcement for 2.1); Step 4a Table 3 (named gate owner: Regulatory Affairs Manager, non-delegable); Story 1.4 PRIMARY with non-delegable boundary
- C5: Step 0; Step 4a Table 1 (cross-border contractual); Step 4a Table 2 (PRIMARY for Stories 1.5, 2.4; gate enforcement for 2.1); Step 4a Table 3 (named gate owner: Treasury Legal Counsel, non-delegable — specifically not delegable to any regulatory function because the obligation is contractual rather than regulatory; explicit exclusion list); Story 1.5 PRIMARY with non-delegable boundary including explicit regulatory/contractual functional-boundary exclusion; Story 2.4 PRIMARY gate enforcement

constraints_not_carried: none — all five constraints carried with PRIMARY assignment to a named-owner Epic 1 story + gate-enforcement assignment to engineering stories

c5_surfaced: true
c5_surfacing_quality: full
c5_surface_stage_inherited: /discovery
c5_definition_treatment: |
  C5 is treated identically to C1–C4 in Step 4a: present in Table 1 (jurisdiction leg = cross-border contractual; type = contractual not regulatory); present in Table 2 (PRIMARY for Story 1.5 + Story 2.4 gate enforcement); present in Table 3 (named gate owner Treasury Legal Counsel with explicit non-delegable boundary — specifically not delegable to any regulatory function because the contractual/regulatory functional jurisdiction is non-fungible). Story 1.5 mirrors Stories 1.1–1.4 in structure: persona, AC1 (review), AC2 (determination — clearance OR notification/consent), AC3 (deployment flag + non-delegable enforcement, including change-control rejection of any regulatory-function-authorised flag change), AC4 (timeline communication). RISK R1 from discovery escalation condition (BLOCKER on confirmation of obligation) is preserved verbatim in Story 1.5 AC2 determination (b).

multi_jurisdiction_mapping:
  nz_leg:
    constraints: [C1, C3, C4]
    named_gate_owners:
      - C1: RBNZ AML/CFT Compliance Officer (sole authority — AMLCFT_CHANNEL_VALIDATED, BS11_NOTIFICATION_DATE)
      - C3: Enterprise Treasury Manager + Regulatory Affairs team lead (joint sign-off — FX_REPORTING_VALIDATED)
      - C4: Regulatory Affairs Manager (sole authority — DIA_REGISTRATION_CLEARED)
    all_nz_gates_owned_by_nz_compliance_or_regulatory_roles: true
  au_leg:
    constraints: [C2]
    named_gate_owners:
      - C2: Payments Compliance Officer NZ-side (coordinator) + Enterprise's Australian Counterpart Compliance Liaison AU-side (confirmer) — joint sign-off (AUSTRAC_CONFIRMATION_RECEIVED)
    au_side_confirmation_non_delegable_to_nz_side_alone: true
    reasoning: AUSTRAC AML/CTF Programme update is the AU entity's act; cannot be unilaterally attested by the enterprise's NZ-side roles.
  cross_border:
    constraints: [C5]
    named_gate_owners:
      - C5: Treasury Legal Counsel (sole authority — CORRESPONDENT_AGREEMENT_CLEARED, CORRESPONDENT_AGREEMENT_CLEARANCE_ID or CORRESPONDENT_NOTIFICATION_ACK_ID)
    cross_border_gate_owned_by_treasury_legal: true
    explicitly_not_delegable_to_regulatory_functions: true
    reasoning: |
      C5 is the only constraint of contractual rather than regulatory type. Treasury Legal Counsel is the correct functional owner because (a) the bilateral correspondent banking agreement is a commercial contract requiring legal review; (b) any required notification or consent is a legal act, not a regulatory submission; (c) the contractual-vs-regulatory functional boundary is non-fungible — assigning C5 to a regulatory function (RBNZ AML/CFT Compliance, AUSTRAC compliance, Regulatory Affairs) would mis-classify the work product (clearance memorandum, not a regulatory confirmation) and produce the wrong artefact for ADR-CB-002 compliance.

named_gate_owners_in_every_architecture_constraints_block: true
non_delegable_boundary_language_present_in_every_epic_1_story: true
oversight_levels:
  story_1.1: HIGH
  story_1.2: HIGH
  story_1.3: MEDIUM
  story_1.4: HIGH
  story_1.5: HIGH
  story_2.1: MEDIUM
  story_2.2: MEDIUM
  story_2.3: MEDIUM
  story_2.4: MEDIUM-HIGH (cross-border contractual gate enforcement at engineering boundary)
  story_2.5: MEDIUM
  story_3.1: MEDIUM
  story_3.2: MEDIUM
-->
