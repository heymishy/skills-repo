# Pipeline Corpus — S2 through S7

**Purpose:** Controlled input briefs for end-to-end pipeline CPF (Constraint Propagation Fidelity) evaluation runs. Each story is a synthetic discovery input with known constraints — including at least one regulatory/compliance constraint and one hidden constraint — designed for precise, countable CPF measurement across the full pipeline (discovery → definition → review → test-plan → definition-of-ready).

**Pattern:** Each brief follows the S1 structure. Constraints are numbered (C1, C2, ...) so propagation can be tracked exactly. A `[HIDDEN]` marker identifies constraints that appear only in narrative prose, not the Constraints section, to test proactive surfacing.

**How to use:** Paste the brief as the /discovery input. Run the full pipeline. Score CPF = (constraints appearing in test-plan NFR section and DoR contract) / (all constraints in canonical inventory). Regulated CPF uses only the C-marked regulatory constraints.

**Canonical inventory note:** The hidden constraint is listed here for scoring purposes only. It must NOT be pre-fed to the model. The model's discovery output should surface it independently.

---

## S2 — Healthcare data integration (HIPAA)

**Domain:** Healthcare IT — patient record migration to cloud EHR
**Regulatory regime:** US HIPAA (Health Insurance Portability and Accountability Act)
**Constraint count:** C1–C4 (known) + C5 (hidden)
**Regulated constraints:** C1, C2, C5 (hidden regulatory)

### Input brief

**Title:** Cloud EHR migration — patient record data integration

**Background:** A 12-hospital regional health network in the US Pacific Northwest is replacing its on-premises electronic health record (EHR) system (Epic on-prem, hosted in a single Providence, RI data centre) with a cloud-based EHR. The migration covers 3.4 million patient records, 18 years of imaging data, and active inpatient ADT (Admit/Discharge/Transfer) feeds from all 12 hospitals. The programme is scheduled to complete within 18 months. The network has a shared IT services team of 42 people. Clinical operations cannot be interrupted.

**Problem:** The existing EHR feeds 14 downstream systems via HL7 v2.x messages. Some of these systems (pharmacy, radiology, billing) have no cloud-native equivalent and will remain on-premises throughout the migration window. The integration layer is not documented — the team discovered 7 undocumented HL7 feeds when auditing last quarter. The cloud EHR vendor requires a formal cutover plan and a Business Associate Agreement (BAA) signed before any patient data is moved to their cloud environment.

**Goals:**
1. Migrate all active patient records to the cloud EHR within 12 months of go-live
2. Maintain uninterrupted HL7 feeds to all 14 downstream systems throughout migration
3. Achieve full imaging archive accessibility in the cloud EHR within 18 months

**Known constraints:**
C1. All Protected Health Information (PHI) must remain within US jurisdiction at all times — no data to be processed or stored by infrastructure hosted outside US borders.
C2. The cloud EHR vendor must sign a Business Associate Agreement (BAA) before any patient data is moved to their environment. BAA review is conducted by the network's General Counsel and takes 6–8 weeks minimum.
C3. The existing HL7 v2.x integration layer must remain fully operational for all 14 downstream systems throughout the migration — no feed interruption of more than 15 minutes for any downstream system.
C4. There is no staging environment — all testing must be performed in a de-identified production replica built specifically for this programme.

**[HIDDEN — for CPF scoring only, do not include in model input]:**
C5. Under 42 CFR Part 2, substance use disorder (SUD) treatment records have stricter re-disclosure restrictions than standard HIPAA PHI. The network includes one specialty addiction treatment centre whose records are in the same EHR. Any consent or disclosure workflow changes to the main EHR system must separately address Part 2 compliance for this subset of records — this is not mentioned in the brief but is a known gap identified in a separate compliance audit.

**Canonical constraint inventory (for CPF scoring):**
- C1: HIPAA PHI US-jurisdiction constraint (regulatory)
- C2: BAA vendor sign-off gate (regulatory process gate)
- C3: HL7 integration continuity (technical SLA)
- C4: No staging environment (technical baseline)
- C5: 42 CFR Part 2 SUD records sub-regime (hidden regulatory)

---

## S3 — Government tax platform (data residency)

**Domain:** Government / revenue authority — legacy tax processing replacement
**Regulatory regime:** Government ICT data residency policy + security assurance framework
**Constraint count:** C1–C4 (known) + C5 (hidden)
**Regulated constraints:** C1, C2, C5 (hidden)

### Input brief

**Title:** Tax return processing platform — legacy replacement

**Background:** A national revenue authority is replacing its COBOL-based tax return processing system, which has been in production since 1991. The system processes 400,000 individual and corporate tax returns annually. The busiest period is April (lodgement window) when daily submission volumes reach 10× the annual average. The system currently runs on a mainframe at a government-owned data centre. A new cloud-hosted platform has been selected, subject to completing a government security assurance review.

**Problem:** The COBOL batch jobs that process returns are undocumented and the only engineer who wrote them retired in 2019. The system must continue processing returns without a gap — the authority cannot suspend returns processing for any year. The cloud vendor is a foreign-headquartered company, which raises questions about where the tax data is hosted. The security assurance process has not been started.

**Goals:**
1. Replace the mainframe COBOL batch processing with a cloud-native equivalent by end of next financial year
2. Ensure zero gap in returns processing capability — all returns accepted and acknowledged within 5 business days regardless of lodgement channel
3. Pass the government security assurance review before any taxpayer data is migrated

**Known constraints:**
C1. Taxpayer data must be stored exclusively on domestic soil — government ICT policy prohibits any taxpayer data from being processed or stored on infrastructure hosted outside the country.
C2. The cloud platform must pass the government security assurance framework (the domestic equivalent of ISO 27001 with additional controls for personal financial data) before go-live. The framework review is conducted by a government-appointed auditor and takes a minimum of 3 months.
C3. The existing COBOL batch jobs process all 400,000 annual returns via fixed-format flat files. The new platform must accept the same flat-file format during the transition period — no format change until all downstream consumers have been migrated.
C4. Peak lodgement load is approximately 10× the annual daily average. The new platform must be provisioned to handle this load without manual intervention.

**[HIDDEN — for CPF scoring only, do not include in model input]:**
C5. There is a specific code path in the COBOL system for Māori land trust ownership structures (approximately 6,000 entities) that applies a different taxation basis. This is handled by an undocumented subroutine and is not mentioned in any specification document. The new platform must replicate this behaviour without breaking the edge case, but the brief does not mention it.

**Canonical constraint inventory (for CPF scoring):**
- C1: Taxpayer data domestic residency (regulatory)
- C2: Government security assurance framework sign-off (regulatory process gate)
- C3: COBOL flat-file format compatibility (technical baseline)
- C4: Peak lodgement load capacity (technical SLA)
- C5: Māori land trust tax code path (hidden regulatory / compliance)

---

## S4 — Cloud migration with SOX controls (financial reporting)

**Domain:** Public company — financial consolidation system cloud migration
**Regulatory regime:** US Sarbanes-Oxley Act (SOX) Sections 302 and 404
**Constraint count:** C1–C4 (known) + C5 (hidden)
**Regulated constraints:** C1, C2, C5 (hidden)

### Input brief

**Title:** Financial consolidation system — cloud migration

**Background:** A NASDAQ-listed manufacturing company (annual revenue $3.4B) is migrating its on-premises financial consolidation system (Oracle Hyperion) to a cloud-based financial planning platform. The consolidation system is used to aggregate the general ledger outputs of 34 subsidiary entities across 12 countries and produce the consolidated financial statements that are filed with the SEC quarterly. The CFO owns the project. External auditors (a Big Four firm) have been engaged to advise.

**Problem:** Hyperion is being decommissioned by Oracle in 18 months. The replacement must be production-ready before that date. Any change to financial reporting systems in a SOX-regulated company requires formal change management documentation signed off by the CEO and CFO before go-live, per the company's SOX 302 certification procedures. Additionally, SOX 404 requires that the external auditor assess the control environment of any system that processes financial data used in annual reports. Month-end close currently completes within a 4-hour window — this SLA is written into the company's audit committee charter.

**Goals:**
1. Replace Hyperion with a cloud-based consolidation platform before decommission date
2. Maintain 4-hour month-end close SLA throughout migration and post go-live
3. Obtain all required SOX sign-offs before migrating any production financial data

**Known constraints:**
C1. SOX 404 compliance: the external auditor must assess and sign off on the control environment of the replacement system before it is used to produce any financial statement filed with the SEC. Assessment typically takes 8–12 weeks and requires a complete system design document.
C2. SOX 302: the CEO and CFO must formally certify that all material changes to financial reporting controls have been assessed and documented. A change management package (scope, risk, controls mapping) must be approved before go-live.
C3. The ERP integration uses fixed-format flat files from the company's 1994-era payroll system in 7 of the 34 subsidiaries. This system cannot be changed within the migration timeline.
C4. Month-end close must complete within a 4-hour window. This is an audit committee charter requirement and cannot be waived for any migration phase.

**[HIDDEN — for CPF scoring only, do not include in model input]:**
C5. One subsidiary (a recently acquired German GmbH) uses a non-standard revenue recognition journal entry format for certain long-term contracts under HGB (German Commercial Code). This format differs from IFRS/GAAP and is processed by a legacy customisation in Hyperion. The customisation is not documented and its failure post-migration would create a restatement risk. This is not mentioned in the brief.

**Canonical constraint inventory (for CPF scoring):**
- C1: SOX 404 external auditor sign-off (regulatory process gate)
- C2: SOX 302 CEO/CFO change management sign-off (regulatory process gate)
- C3: Legacy flat-file ERP format compatibility (technical baseline)
- C4: 4-hour month-end close SLA (technical SLA)
- C5: German subsidiary HGB non-standard revenue recognition (hidden regulatory / compliance)

---

## S5 — Open banking API (Consumer Data Right / PSD2)

**Domain:** Banking / financial services — open banking API implementation
**Regulatory regime:** Consumer Data Right (CDR) Rules (Australia/NZ equivalent) or PSD2 (EU)
**Constraint count:** C1–C4 (known) + C5 (hidden)
**Regulated constraints:** C1, C2, C4 (regulatory SLA), C5 (hidden)

### Input brief

**Title:** Open banking consumer data API — CDR compliance implementation

**Background:** A mid-size retail bank (2.1 million customers) is required to implement a Consumer Data Right (CDR) compliant data sharing API by a regulatory deadline in 8 months. The CDR scheme requires the bank to expose standardised APIs that allow customers to share their account, transaction, and product data with accredited third parties. The bank is an "accredited data holder" under the CDR Rules and must comply with the ACCC (Australian Competition and Consumer Commission) Data Standards as published. This is a mandated regulatory programme — non-compliance results in regulatory enforcement action.

**Problem:** The bank's core banking system is a mid-tier legacy platform with an average API latency of 150ms for account balance queries. The CDR Data Standards require data holders to respond to consumer data requests within 3.5 seconds end-to-end. The bank has no existing consent management infrastructure. The CDR Rules require consent records to be auditable — the ACCC may request an audit of consent logs at any time. The bank's mobile banking app currently uses a proprietary authentication flow that does not align with the CDR's required OAuth 2.0 / FAPI (Financial-grade API) profile.

**Goals:**
1. Deliver CDR-compliant data sharing APIs for accounts and transactions by the regulatory deadline
2. Build consent management infrastructure that is ACCC-auditable
3. Meet all CDR Data Standards performance requirements without replacing the core banking system

**Known constraints:**
C1. The CDR Rules require consent management to be auditable by the ACCC. All consent grants, revocations, and data access events must be logged in an immutable audit trail that can be produced within 5 business days of an ACCC request.
C2. CDR Data Standards: data holders must respond to data requests within 3.5 seconds end-to-end at the 95th percentile. This is an enforceable regulatory SLA.
C3. The core banking platform API latency is 150ms average for account queries. Downstream architecture must absorb this and still meet the 3.5s total response budget.
C4. CDR Rules: consent revocation must be honoured — all data sharing sessions must be terminated within 24 hours of a customer revoking consent. Downstream consumers must be notified.

**[HIDDEN — for CPF scoring only, do not include in model input]:**
C5. The bank's existing mobile banking app uses a deprecated authentication flow (OAuth 2.0 implicit grant) that was grandfathered under the bank's existing digital banking licence. The CDR FAPI profile mandates PKCE and prohibits the implicit grant. Updating the mobile app to FAPI-compliant auth will invalidate all existing mobile sessions and require a forced re-authentication — a significant customer experience event that is not mentioned in the brief.

**Canonical constraint inventory (for CPF scoring):**
- C1: ACCC audit trail requirement (regulatory)
- C2: CDR 3.5s response SLA (regulatory SLA)
- C3: Core banking 150ms latency budget (technical baseline)
- C4: 24-hour consent revocation propagation (regulatory SLA)
- C5: Mobile app deprecated implicit grant — FAPI incompatibility (hidden regulatory / breaking change)

---

## S6 — Insurance claims processing (APRA CPS 234 / ICA)

**Domain:** Insurance — claims management system replacement
**Regulatory regime:** APRA CPS 234 (information security) + Insurance Contracts Act (ICA) claim explainability
**Constraint count:** C1–C4 (known) + C5 (hidden)
**Regulated constraints:** C1, C2, C5 (hidden)

### Input brief

**Title:** Claims management system replacement

**Background:** A mid-sized general insurer (600,000 policies) is replacing its legacy claims management system, which runs on a COBOL/Java hybrid platform deployed on-premises. The existing system has a direct integration with the Lloyd's of London claims platform using a proprietary message format. The replacement system is a cloud-hosted SaaS platform from a New Zealand vendor. The insurer's fraud scoring model is a proprietary statistical model that runs on internal infrastructure — the fraud team has made clear it cannot be exposed to a SaaS vendor's environment.

**Problem:** APRA CPS 234 requires that any third-party system handling the insurer's information assets meets APRA's information security requirements. The new SaaS vendor has not previously been assessed under APRA's framework. The Insurance Contracts Act requires all claim decisions (accept, decline, partial settlement) to be explainable to the claimant on request and retained in an auditable form for 7 years. The Lloyd's integration uses a proprietary ACORD-variant message schema that the new platform does not natively support.

**Goals:**
1. Replace the legacy claims management system with the SaaS platform within 12 months
2. Maintain Lloyd's integration throughout migration and post go-live
3. Retain 7-year claim decision audit trail in accessible form

**Known constraints:**
C1. APRA CPS 234: the SaaS vendor must meet APRA's information security assurance requirements before the insurer transfers any policyholder or claim data to their environment. APRA vendor assurance typically takes 4–6 months for a first-time assessment.
C2. Insurance Contracts Act: all claim decisions must be explainable and the explanation must be retained in an auditable log for 7 years, accessible within 5 business days of a claimant or regulator request.
C3. The Lloyd's integration uses a proprietary ACORD-variant schema not natively supported by the new platform. A custom adapter must be built and maintained.
C4. The fraud scoring model is proprietary and cannot be hosted in, or have its inputs/outputs exposed to, any SaaS vendor environment. The integration architecture must keep fraud scoring on-premises and interface with the SaaS platform via a secure API boundary.

**[HIDDEN — for CPF scoring only, do not include in model input]:**
C5. A small book of Lloyd's facultative business (approximately 180 reinsurance claims per year) has different settlement rules that are handled by an undocumented stored procedure in the legacy system. These rules differ from the standard claims workflow and produce different reserve calculations. The stored procedure was written in 2003 and has no author documentation. Migrating without replicating this logic would cause financial reporting errors for the facultative book.

**Canonical constraint inventory (for CPF scoring):**
- C1: APRA CPS 234 vendor assurance (regulatory process gate)
- C2: ICA 7-year explainable claim decision retention (regulatory)
- C3: Lloyd's proprietary ACORD-variant adapter (technical baseline)
- C4: Fraud model on-premises constraint (technical / security constraint)
- C5: Facultative claims undocumented stored procedure (hidden regulatory / financial accuracy)

---

## S7 — Retail GDPR consent platform

**Domain:** UK retail — customer consent and marketing data management
**Regulatory regime:** UK GDPR (retained EU law, post-Brexit) + ICO enforcement practice
**Constraint count:** C1–C4 (known) + C5 (hidden)
**Regulated constraints:** C1, C2, C5 (hidden)

### Input brief

**Title:** Customer marketing consent management — GDPR compliance remediation

**Background:** A UK-based omnichannel retailer (4.2 million loyalty programme members) needs to replace its legacy email marketing consent management system. The existing system records consent as a single Y/N flag with no timestamp, making it impossible to demonstrate when or how consent was obtained. The ICO (Information Commissioner's Office) has issued guidance following a recent enforcement action against a competitor citing inadequate consent record-keeping. The retailer's DPO (Data Protection Officer) has assessed the current system as non-compliant and recommends immediate remediation.

**Problem:** UK GDPR Article 7 requires that consent be freely given, specific, informed, and unambiguous, and that the controller be able to demonstrate consent. The retailer cannot currently demonstrate the consent basis for 4.2M records. The existing marketing platform uses a US-based third-party Email Service Provider (ESP) that stores its own copy of consent state — any consent change must propagate to the ESP or the ESP's copy can diverge and trigger illegal sends. The ICO precedent requires consent records to be retrievable within 72 hours of a Subject Access Request (SAR).

**Goals:**
1. Replace the consent management system with one that captures timestamped, channel-aware consent records compliant with UK GDPR Article 7
2. Enable retrieval of any customer's full consent history within 72 hours of a SAR
3. Synchronise consent state with the ESP in near-real-time to prevent illegal sends

**Known constraints:**
C1. UK GDPR Article 7 — consent must be demonstrably recorded. The system must capture: consent timestamp, channel of capture, specific marketing categories consented to, version of privacy notice shown at time of consent, and whether consent was affirmative (opt-in) or pre-populated. A consent record without all five elements is non-compliant.
C2. ICO precedent: consent records must be retrievable and presentable in human-readable form within 72 hours of a Subject Access Request. The system must support an SAR workflow that produces a consolidated consent history report.
C3. The ESP stores its own consent copy. Any consent revocation must propagate to the ESP within 15 minutes to prevent any marketing send occurring after revocation.
C4. The loyalty programme database uses a legacy schema where consent is stored as a Y/N flag with no timestamp. The migration must map each existing record to a compliant consent record — or mark it as unverifiable and require fresh consent from that customer.

**[HIDDEN — for CPF scoring only, do not include in model input]:**
C5. Approximately 180,000 customers joined via a co-branded credit card partner. Their original T&Cs bundled marketing consent with service consent in a single opt-in checkbox — a practice now explicitly prohibited under ICO guidance (consent must be granular and purpose-specific). The bundled consent is invalid under UK GDPR. These 180K records require consent withdrawal and fresh re-consent before they can be used for marketing. This is not mentioned in the brief but is a known compliance gap documented in a separate internal legal review.

**Canonical constraint inventory (for CPF scoring):**
- C1: UK GDPR Article 7 five-element consent record (regulatory)
- C2: ICO 72-hour SAR retrievability (regulatory SLA)
- C3: ESP consent propagation within 15 minutes (technical SLA)
- C4: Legacy Y/N flag migration mapping (technical baseline / data quality)
- C5: Co-branded card partner bundled consent invalidity — 180K records require re-consent (hidden regulatory / compliance gap)

---

## Scoring reference

Use this table for CPF scoring across S2–S7 runs:

| Story | Regulated constraints (known) | Regulated constraints (hidden) | Total constraints |
|-------|-------------------------------|-------------------------------|-------------------|
| S2 | C1 (HIPAA PHI), C2 (BAA sign-off) | C5 (42 CFR Part 2) | 5 |
| S3 | C1 (data residency), C2 (security framework) | C5 (Māori land trust code path) | 5 |
| S4 | C1 (SOX 404 auditor), C2 (SOX 302 CEO/CFO) | C5 (German HGB revenue recognition) | 5 |
| S5 | C1 (ACCC audit trail), C2 (3.5s SLA), C4 (revocation SLA) | C5 (mobile implicit grant / FAPI) | 5 |
| S6 | C1 (APRA CPS 234), C2 (ICA 7-year) | C5 (facultative stored procedure) | 5 |
| S7 | C1 (GDPR Art.7 five-element), C2 (ICO 72h SAR) | C5 (co-branded card bundled consent) | 5 |

**CPF formula:** For each story, General CPF = (constraints appearing in test-plan NFR section + DoR contract) / total constraints. Regulated CPF = (regulatory constraints appearing in test-plan NFR + DoR contract) / total regulatory constraints (including hidden C5 if surfaced).

**Hidden constraint surfacing:** C5 is counted in the denominator only if the model's /discovery output explicitly mentions it (not if it appears because the model was given C5 as part of the input). A model that surfaces C5 independently adds it to the CPF denominator for scoring purposes.
