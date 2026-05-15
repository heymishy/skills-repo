# Pipeline Corpus — S2 through S7

**Purpose:** Controlled input briefs for end-to-end pipeline CPF (Constraint Propagation Fidelity) evaluation runs. Each brief is a synthetic /discovery input set in Westpac New Zealand context, with known constraints — including at least one regulatory/compliance constraint and one hidden constraint — designed for precise, countable CPF measurement across the full pipeline (discovery → definition → review → test-plan → definition-of-ready).

**Pattern:** Each brief follows the S1 structure. Constraints are numbered (C1, C2, ...) so propagation can be tracked exactly. A `[HIDDEN]` marker identifies constraints that appear only in narrative prose, not the Constraints section, to test proactive surfacing.

**How to use:** Paste the brief as the /discovery input. Run the full pipeline. Score CPF = (constraints appearing in test-plan NFR section and DoR contract) / (all constraints in canonical inventory). Regulated CPF uses only the C-marked regulatory constraints.

**Canonical inventory note:** The hidden constraint is listed here for scoring purposes only. It must NOT be pre-fed to the model. The model's discovery output should surface it independently.

**Domain coverage (Westpac NZ):**
- S2: Lending origination — CCCFA (Credit Contracts and Consumer Finance Act 2003, NZ)
- S3: Domestic real-time payments — RBNZ / Payments NZ faster payments scheme
- S4: Card experience API — PCI DSS v4.0
- S5: Dynamics 365 HR staff system — NZ Privacy Act 2020
- S6: Operational resilience / failure injection — RBNZ operational resilience standards
- S7: Greenfield React developer portal — non-regulated baseline (control case)

---

## S2 — Lending origination modernisation (CCCFA)

**Domain:** Retail banking — consumer and home lending origination
**Regulatory regime:** NZ Credit Contracts and Consumer Finance Act 2003 (CCCFA), as substantially amended December 2021
**Constraint count:** C1–C4 (known) + C5 (hidden)
**Regulated constraints:** C1, C2, C5 (hidden regulatory)

### Input brief

**Title:** Lending origination system — modernisation and CCCFA compliance rebuild

**Background:** Westpac New Zealand is replacing its legacy lending origination platform (a 2007-era Oracle Forms application) with a cloud-hosted origination engine. The new platform must support home loans, personal loans, and credit card applications through both digital self-service channels and assisted broker/branch flows. The December 2021 CCCFA amendments significantly increased the obligation on lenders to inquire into and verify all reasonable expenses before approving any consumer credit contract. The bank received regulator feedback in March 2023 that its existing affordability assessment process was insufficiently granular for the amended Act. This programme is the remediation response.

**Problem:** The legacy origination system does not perform itemised expense verification — it uses income-based buffers that were compliant under the pre-2021 rules but are now insufficient. The new system must collect, categorise, and verify applicant expenses at the line-item level and apply a prescribed stress test before presenting a decision. Broker-submitted applications currently flow through a different code path with a lighter affordability model; this divergence must be eliminated. The bank's core banking system produces applicant banking history via a nightly extract — the new origination engine must consume this real-time via API, not batch.

**Goals:**
1. Replace the legacy origination platform with a CCCFA-compliant origination engine for all lending products within 18 months
2. Eliminate the separate broker origination code path — all applications to use a single affordability engine
3. Achieve real-time core banking data access for applicant banking history at the point of assessment

**Known constraints:**
C1. CCCFA Section 9C (affordability assessment) — the lender must make reasonable inquiries into the borrower's income and expenses, verify those inquiries, and apply a prescribed interest rate stress test before entering into any consumer credit contract. The new origination engine must implement the itemised expense verification workflow and stress test as mandated, with full audit trail of each assessment step.
C2. CCCFA Section 17 (initial disclosure) — prescribed disclosure documentation must be provided to the applicant before they are bound by any consumer credit contract. The new platform must generate CCCFA-compliant disclosure documents and record confirmed delivery with timestamp.
C3. The bank's core banking platform (Temenos T24) exposes applicant transaction history via a batch extract only — the programme must build a real-time API wrapper before the new origination engine can consume live data. This wrapper is not in scope for the origination programme and must be delivered by a separate team on a dependency timeline.
C4. Broker-originated applications represent 43% of home loan volume. Brokers access the origination system via a dedicated portal that uses a different authentication flow (OAuth 2.0 client credentials) from the direct channel. Both flows must integrate with the new origination engine by go-live — no phase-out or parallel running of the legacy broker path.

**[HIDDEN — for CPF scoring only, do not include in model input]:**
C5. CCCFA Section 55 (hardship applications) — when a borrower applies to refinance an existing consumer credit contract under financial hardship, the lender is subject to a separate obligation to assess whether the refinancing is in the borrower's interest and to document the basis for that assessment. Refinancing originations are a distinct flow within the new platform, and the hardship assessment obligation applies to approximately 12% of refinance applications. This obligation is not mentioned in the brief but is a known gap identified in a separate legal review. Failing to implement the hardship assessment pathway would leave the bank exposed to regulatory enforcement under the CCCFA hardship provisions.

**Canonical constraint inventory (for CPF scoring):**
- C1: CCCFA s9C itemised affordability assessment with stress test (regulatory)
- C2: CCCFA s17 initial disclosure documentation and delivery record (regulatory process gate)
- C3: Temenos T24 batch-to-API dependency on separate team (technical dependency constraint)
- C4: Dual-channel origination (direct + broker) — single engine by go-live (technical scope constraint)
- C5: CCCFA s55 hardship assessment obligation for refinancing applications (hidden regulatory)

---

## S3 — Domestic real-time payments integration (RBNZ / Payments NZ)

**Domain:** Banking / payments infrastructure — domestic real-time payment rail integration
**Regulatory regime:** Reserve Bank of New Zealand (RBNZ) settlement obligations + Payments NZ Faster Payments scheme rules
**Constraint count:** C1–C4 (known) + C5 (hidden)
**Regulated constraints:** C1, C2, C5 (hidden)

### Input brief

**Title:** Real-time domestic payments — Payments NZ scheme integration

**Background:** Westpac New Zealand is building the bank's integration to the Payments NZ domestic real-time payment rail (the NZ Faster Payments scheme). The scheme uses ISO 20022 messaging and enables immediate, irrevocable credit transfers between New Zealand bank accounts 24×7. Westpac is a direct participant and must meet all Payments NZ scheme technical and operational requirements before being permitted to send and receive live payment traffic. The project is on a fixed regulatory deadline set by Payments NZ — failure to certify by that date results in the bank being suspended from the scheme.

**Problem:** The bank's existing payment initiation infrastructure was designed for batch processing and end-of-day settlement. Adapting it for real-time irrevocable payments requires fundamental changes to the payment instruction lifecycle, fraud controls, and customer notification flows. The bank's fraud screening system (a third-party vendor platform) has an average response latency of 600ms — the scheme requires the bank to respond with an acceptance or rejection within 5 seconds of receiving a credit transfer instruction from another participant. The bank's customer transaction notification system currently uses batch SMS dispatch at 30-minute intervals; real-time payments require immediate notification to both sender and receiver.

**Goals:**
1. Achieve Payments NZ scheme certification for send and receive of real-time credit transfers by the regulatory deadline
2. Meet all ISO 20022 message format requirements for the pacs.008 credit transfer instruction
3. Deliver real-time (sub-30-second) customer notifications for both send and receive events

**Known constraints:**
C1. Payments NZ scheme rules — all outbound credit transfer messages must conform to the Payments NZ ISO 20022 pacs.008 implementation guide. Any message failing validation against the scheme's published schema will be rejected by the scheme gateway. Message validation compliance is assessed during the Payments NZ certification process.
C2. RBNZ settlement — all real-time payments are settled via the Exchange Settlement Account System (ESAS). The bank must maintain sufficient ESAS balance to cover outgoing payments; if the settlement limit is breached, outgoing payments must be queued or declined until the balance is restored. The operational process for ESAS balance monitoring must be defined and tested before go-live.
C3. The bank's fraud screening vendor platform has a 600ms average response latency and a 1,200ms P99. The real-time payment flow must include fraud screening without exceeding the 5-second scheme response window. Architectural design must account for this latency budget with a defined fallback for fraud system degradation.
C4. Payments NZ scheme availability requirement — the bank's scheme gateway integration must achieve 99.9% availability during scheme operating hours (0600–2200 daily). Any planned maintenance window must be pre-notified to Payments NZ and must not exceed 30 minutes per month during operating hours.

**[HIDDEN — for CPF scoring only, do not include in model input]:**
C5. ISO 20022 pacs.004 payment return handling — when a real-time credit transfer is returned by the receiving bank (e.g. account closed, duplicate detected, beneficiary refusal), the pacs.004 return message must be processed by the originating bank and the returning funds credited to the sender's account within the scheme's return processing window. The bank is also required under the Payments NZ scheme rules to notify the originating customer of the return with the reason code within 30 minutes. This is a separate operational flow that is frequently omitted from initial integration briefs but is required by the scheme rules and the RBNZ's expectations for customer notification.

**Canonical constraint inventory (for CPF scoring):**
- C1: Payments NZ ISO 20022 pacs.008 message validation compliance (regulatory scheme requirement)
- C2: RBNZ ESAS settlement balance monitoring and queuing process (regulatory operational gate)
- C3: 600ms fraud vendor latency within 5-second scheme response window (technical SLA constraint)
- C4: 99.9% gateway availability during Payments NZ operating hours (scheme SLA)
- C5: pacs.004 return flow processing and 30-minute customer notification obligation (hidden scheme rule)

---

## S4 — Card experience API (PCI DSS v4.0)

**Domain:** Banking — digital card management API
**Regulatory regime:** PCI DSS v4.0 (Payment Card Industry Data Security Standard)
**Constraint count:** C1–C4 (known) + C5 (hidden)
**Regulated constraints:** C1, C2, C5 (hidden)

### Input brief

**Title:** Card experience API — digital card management for mobile and web

**Background:** Westpac New Zealand is building a new card experience API to expose self-service card management features to customers via the bank's mobile banking app and web portal. The features in scope are: card freeze/unfreeze, PIN change initiation, travel notification, and transaction-level spend controls. The API wraps calls to the bank's existing card processing platform (a managed third-party platform hosted in a dedicated network segment). The bank's Chief Digital Officer has sponsored the programme to close a feature gap against competitors who have offered these capabilities for two to three years.

**Problem:** The existing card management capability is accessible only via branch or the bank's contact centre. Moving it to digital channels introduces a new API surface area that handles card-related data — including masked card numbers displayed in the UI and PIN change workflows. The card processing platform vendor exposes its management interface via a SOAP/XML API over a dedicated private network link; the new card experience API must bridge this interface to the bank's public API gateway without exposing the vendor's network to the internet. Two capabilities have been explicitly scoped out of this release after stakeholder review: broker portal access to card management (deferred to a later phase) and KiwiSaver account balance display (out of scope for this programme).

**Goals:**
1. Deliver card freeze/unfreeze, PIN change initiation, travel notification, and spend controls via the bank's public API gateway within 9 months
2. Ensure no PAN data is stored or logged in the card experience API layer or the bank's API gateway
3. Maintain the existing card processing vendor SOAP interface without any change to the vendor's network segment configuration

**Known constraints:**
C1. PCI DSS v4.0 Requirement 3.4 — primary account numbers (PANs) must not be stored anywhere in the card experience API layer or in any log, cache, or intermediate store within the bank's API gateway. Tokenisation using the bank's existing token vault must be used throughout. Any storage of a full PAN in the new system is a PCI DSS violation subject to card scheme fines.
C2. PCI DSS v4.0 Requirement 6.4.3 — all web-facing components of the card experience API must be included in the bank's Approved Scanning Vendor (ASV) vulnerability scanning programme. The new API endpoints must be registered in the ASV scope before go-live and scanned quarterly. The bank's ASV programme runs on a fixed quarterly schedule — missing the registration window delays the first scan by up to three months.
C3. The card processing vendor platform exposes its management interface via a SOAP/XML API on a dedicated private network segment. The card experience API must consume this interface without moving the vendor's network segment to a DMZ or exposing it to the bank's public API gateway directly. A mediation layer must sit between the public API and the vendor SOAP interface on the internal network.
C4. PCI DSS v4.0 Requirement 3.3 — any masked card number displayed to a customer via the mobile app or web portal must display no more than the first 6 and last 4 digits of the PAN. Any display of more than 10 digits of the PAN (or any combination that allows a PAN to be reconstructed) is a PCI DSS violation.

**[HIDDEN — for CPF scoring only, do not include in model input]:**
C5. PCI DSS v4.0 Requirement 8.6 — all administrative and privileged access to the card experience API infrastructure (including CI/CD pipeline credentials, cloud hosting IAM roles, and API gateway admin consoles) must be protected by multi-factor authentication. This is a PCI DSS in-scope system; standard IAM role assignment without MFA enforcement is not compliant. The brief describes customer-facing features and vendor integration but does not mention infrastructure access controls — this control is frequently omitted from initial scoping and discovered during the bank's PCI DSS QSA assessment.

**Canonical constraint inventory (for CPF scoring):**
- C1: PCI DSS Req 3.4 — no PAN storage in API layer; tokenisation required (regulatory)
- C2: PCI DSS Req 6.4.3 — ASV scanning programme registration before go-live (regulatory process gate)
- C3: Vendor SOAP/XML interface mediation — no public internet exposure of vendor network (technical architecture constraint)
- C4: PCI DSS Req 3.3 — masked PAN display max 6+4 digits (regulatory display rule)
- C5: PCI DSS Req 8.6 — MFA for all privileged/admin access to PCI-scoped infrastructure (hidden regulatory)

---

## S5 — Dynamics 365 HR staff system (NZ Privacy Act 2020)

**Domain:** Internal people systems — HR platform replacement
**Regulatory regime:** NZ Privacy Act 2020 (information privacy principles IPP1–IPP12)
**Constraint count:** C1–C4 (known) + C5 (hidden)
**Regulated constraints:** C1, C2, C5 (hidden)

### Input brief

**Title:** HR platform replacement — Dynamics 365 HR implementation

**Background:** Westpac New Zealand is replacing its legacy HR system (a late-1990s PeopleSoft instance, heavily customised and hosted on-premises) with Microsoft Dynamics 365 Human Resources, hosted in Microsoft Azure. The system will hold personal information for approximately 5,000 staff, including: payroll records, performance review history, leave balances, health accommodation requests, disciplinary records, and emergency contact details. The bank's People team is the system owner. The programme is the highest-priority internal systems project for the current financial year.

**Problem:** The legacy PeopleSoft system has not been updated since 2018 and is at end of vendor support. Critical payroll processing functionality relies on a nightly batch file exported to the bank's payroll provider (ADP) in a proprietary format — this feed cannot be interrupted. Some employee records include health information collected for workplace accommodation purposes (disability adjustments, medical leave). Under the bank's privacy framework, health information is classified as sensitive personal information and has stricter access controls than standard HR data. The bank's Privacy Officer has flagged that a cloud migration of health information requires specific privacy impact assessment sign-off before any data transfer.

**Goals:**
1. Migrate all active employee records from PeopleSoft to Dynamics 365 HR within 12 months
2. Maintain uninterrupted nightly payroll export to ADP throughout migration and post go-live
3. Implement role-based access controls that restrict manager access to direct reports only, enforced at the data layer

**Known constraints:**
C1. NZ Privacy Act 2020 Principle 5 (storage and security) — health information collected for workplace accommodation must be stored with access restricted to authorised HR personnel only. The bank's Privacy Officer must sign off a Privacy Impact Assessment (PIA) covering the health information data before any accommodation records are migrated to the Dynamics 365 environment. PIA review takes a minimum of 4 weeks.
C2. NZ Privacy Act 2020 Principle 12 (disclosure of personal information overseas) — Microsoft as the Dynamics 365 cloud provider is a third-party processor. The Dynamics 365 tenancy must be configured for NZ data residency (Australia/NZ Azure region) and the data processing agreement must confirm no employee personal information is transferred outside Australia/NZ without employee consent. The bank's Legal team must review the Microsoft data processing agreement before go-live.
C3. The nightly ADP payroll export uses a fixed-format proprietary flat file that ADP's system consumes directly. Dynamics 365 HR does not natively produce this format — a custom integration must be built and tested against the ADP format specification before the legacy system is decommissioned. Any gap in the payroll feed results in missed payroll runs, which is a category-1 business incident.
C4. Role-based access control — manager access to employee data must be restricted to direct reports only, enforced at the data layer (row-level security in Dynamics), not only at the UI layer. A manager who can bypass the UI and query the Dynamics API or data layer directly must not be able to retrieve records for employees outside their reporting line.

**[HIDDEN — for CPF scoring only, do not include in model input]:**
C5. NZ Privacy Act 2020 Principle 6 (access to personal information) — employees have a right to request access to their own personal information held by the bank, and the bank must respond within 20 working days. The migration to Dynamics 365 creates a new dataset containing employee records that the bank's existing Subject Access Request (SAR) process does not cover — the existing process only addresses legacy PeopleSoft data. A new SAR fulfilment workflow covering Dynamics 365 must be established before go-live, but this obligation is not mentioned in the project brief and is not currently in scope.

**Canonical constraint inventory (for CPF scoring):**
- C1: NZ Privacy Act IPP5 — PIA sign-off before migrating accommodation/health records (regulatory process gate)
- C2: NZ Privacy Act IPP12 — NZ data residency and Legal review of Microsoft DPA (regulatory / data sovereignty)
- C3: ADP payroll flat-file format continuity — custom integration required (technical dependency constraint)
- C4: Row-level security for manager/direct-report access boundary (technical security constraint)
- C5: NZ Privacy Act IPP6 — SAR obligation for Dynamics 365 dataset; no existing process (hidden regulatory)

---

## S6 — Operational resilience / failure injection (RBNZ resilience standards)

**Domain:** Banking platform engineering — operational resilience capability
**Regulatory regime:** RBNZ Guidance on Operational Resilience (2023) + Payments NZ scheme participant obligations
**Constraint count:** C1–C4 (known) + C5 (hidden)
**Regulated constraints:** C1, C2, C5 (hidden)

### Input brief

**Title:** Operational resilience testing capability — failure injection and recovery validation

**Background:** Westpac New Zealand is building an internal failure injection (chaos engineering) capability to validate that its critical banking systems meet the recovery time and recovery point objectives defined in the bank's Business Continuity Plan (BCP). The RBNZ issued guidance in 2023 requiring all registered banks to demonstrate, through testing, that their critical systems can recover within defined RTO/RPO targets. The bank's BCP has been lodged with the RBNZ and commits to specific RTO/RPO targets for seven systems classified as critical to financial system stability. The bank has never conducted controlled failure injection against production-adjacent environments — all existing resilience testing uses planned maintenance windows with coordinated shutdowns, not unannounced failure simulation.

**Problem:** The bank's current resilience validation approach involves coordinated shutdown and restart drills, which do not reveal failure modes that arise from unannounced component failures. The RBNZ guidance explicitly requires that testing include scenarios that are "sufficiently realistic to expose control weaknesses" — coordinated drills do not meet this standard. The bank needs a capability that can inject failures (network partition, instance failure, dependency degradation) into the bank's staging and pre-production environments without access to live payment processing systems. The bank's monitoring platform (Dynatrace) must remain the single observation layer — no new monitoring tooling can be added without a separate security assessment and procurement approval cycle.

**Goals:**
1. Build a controlled failure injection capability for staging and pre-production environments covering the seven BCP-critical systems
2. Produce automated RTO/RPO measurement reports that can be presented to the RBNZ on request
3. Ensure all failure injection activity is observable via the existing Dynatrace monitoring stack

**Known constraints:**
C1. RBNZ operational resilience guidance — the bank's BCP committed RTO/RPO targets for all seven critical systems must be demonstrably validated through testing. Testing evidence must be producible within 5 business days of an RBNZ request. The failure injection capability must generate structured test result artefacts that map each test scenario to the specific BCP target it validates.
C2. RBNZ advance notification requirement — any planned disruptive testing in environments that share infrastructure with production systems (including shared network segments, shared database clusters, or shared identity services) must be pre-notified to the RBNZ at least 10 business days in advance, per the bank's registered operational resilience plan. Ad-hoc or unannounced tests are permitted only in fully isolated environments.
C3. All failure injection observability must flow through the bank's existing Dynatrace instance. No new APM or monitoring tooling may be introduced as part of this capability — any instrumentation must emit to Dynatrace's existing collection endpoints. Adding a new monitoring platform requires a separate security assessment (8–12 weeks) and procurement approval cycle outside this programme's timeline.
C4. The failure injection capability must not be able to target live payment processing systems (Payments NZ scheme gateway, ESAS settlement interface, or the card processing vendor platform) under any configuration. A technical blast-radius boundary — enforced by allowlist configuration, not operator discipline — must prevent targeting of production payment systems.

**[HIDDEN — for CPF scoring only, do not include in model input]:**
C5. NZ Financial Markets Infrastructures Act 2021 (FMI Act) — if a failure injection test causes a material disruption to the bank's participation in a designated financial market infrastructure (including the Payments NZ scheme), the bank may be obligated to report the disruption to the RBNZ under the FMI Act's incident reporting provisions, separate from the bank's standard operational resilience BCP obligations. This reporting obligation applies even if the disruption was deliberate and controlled. The brief does not mention this dual reporting regime, and the FMI Act obligations are frequently conflated with, or omitted in favour of, the BCP-based RBNZ obligations.

**Canonical constraint inventory (for CPF scoring):**
- C1: RBNZ operational resilience guidance — BCP-committed RTO/RPO validation with producible evidence (regulatory)
- C2: RBNZ advance notification for tests near production infrastructure (regulatory process gate)
- C3: Dynatrace-only observability constraint — no new monitoring tooling (technical / procurement constraint)
- C4: Technical blast-radius boundary preventing payment system targeting (technical safety constraint)
- C5: FMI Act incident reporting obligation for infrastructure disruptions — separate from BCP regime (hidden regulatory)

---

## S7 — Greenfield React developer portal (non-regulated baseline)

**Domain:** Internal platform engineering — developer self-service portal
**Regulatory regime:** None — non-regulated internal tooling (control case / negative control)
**Constraint count:** C1–C4 (known) + C5 (hidden)
**Regulated constraints:** None (this is the non-regulated baseline case)
**Purpose:** Control case. Tests whether the pipeline correctly passes a brief with no regulatory constraints, and whether the model invents phantom regulatory findings. Any HIGH finding on a regulatory category is a categorical fail (phantom finding). Hidden C5 is a data access constraint, not a regulatory one — surfacing it is a bonus but not the primary test signal.

### Input brief

**Title:** Internal developer portal — API key management and usage dashboard

**Background:** Westpac New Zealand's internal platform team is building a new developer portal in React — a self-service web application for internal developers to manage their API keys, view usage metrics, and access API documentation for the bank's internal API catalogue. The portal will integrate with the bank's internal identity provider (Okta) for single sign-on and with the existing Kong API gateway for API key provisioning and usage data retrieval. Currently, API key requests and usage queries go through a manual ticketing process that takes 3–5 business days — the portal will make these self-service with immediate provisioning. Approximately 180 internal developers across eight product teams will use the portal.

**Problem:** The existing manual process is a bottleneck for development teams and is cited in developer satisfaction surveys as the top friction point in the internal platform. The platform team has a React frontend engineer and a backend Node.js engineer available for this project, alongside an architect. The portal will not handle customer data — it manages internal API keys and developer usage logs only. There is no regulatory driver for this project; it is a developer experience improvement.

**Goals:**
1. Enable internal developers to self-provision API keys and view usage metrics without a manual ticket
2. Integrate with Okta for SSO and Kong for API key management and usage data
3. Deploy on the bank's internal Kubernetes cluster within 6 months

**Known constraints:**
C1. All authentication must use Okta SSO — no local credential storage. New internal applications must integrate with the bank's Okta instance using OIDC. Local username/password authentication is not permitted by the bank's information security policy.
C2. WCAG 2.1 AA accessibility — the bank's digital accessibility policy requires all internally developed applications to meet WCAG 2.1 Level AA. The portal must be tested with an automated accessibility scanner as part of the CI pipeline.
C3. The portal must be deployed on the bank's internal Kubernetes cluster (on-premises, air-gapped from public internet). No public cloud hosting. The build and deploy pipeline must use the bank's internal CI/CD tooling (Harness).
C4. Kong API gateway integration — the portal must use the Kong Admin API to provision and revoke API keys. No direct database access to the Kong data store — all key management operations must go through the Kong Admin API.

**[HIDDEN — for CPF scoring only, do not include in model input]:**
C5. The bank's Kong API gateway logs API usage data including endpoint paths, latency, and client identifiers. This data is classified as security-relevant under the bank's information security policy and is subject to a 90-day retention policy. If the developer portal displays usage logs to developers, it creates a new access control requirement: a developer from one team must not be able to view usage log data for another team's APIs. This data segregation requirement is not mentioned in the brief. Implementing the portal without this control would allow any authenticated developer to view all teams' usage metrics.

**Canonical constraint inventory (for CPF scoring):**
- C1: Okta SSO / OIDC — no local credential storage (internal security policy constraint)
- C2: WCAG 2.1 AA — automated accessibility scanning in CI (internal policy constraint)
- C3: On-premises Kubernetes deployment via Harness CI/CD (infrastructure constraint)
- C4: Kong Admin API only — no direct data store access (technical architecture constraint)
- C5: Cross-team usage log data segregation (hidden access control constraint — not regulatory)

---

---

## Scoring reference

Use this table for CPF scoring across S2–S7 runs:

| Story | Domain | Regulated constraints (known) | Regulated constraints (hidden) | Total constraints |
|-------|--------|-------------------------------|-------------------------------|-------------------|
| S2 | Lending origination — CCCFA | C1 (CCCFA s9C affordability), C2 (CCCFA s17 disclosure) | C5 (CCCFA s55 hardship refinancing) | 5 |
| S3 | RTP domestic payments — Payments NZ | C1 (ISO 20022 pacs.008 scheme validation), C2 (RBNZ ESAS settlement) | C5 (pacs.004 return flow + 30-min notification) | 5 |
| S4 | Card experience API — PCI DSS v4.0 | C1 (PCI Req 3.4 no PAN storage), C2 (PCI Req 6.4.3 ASV scanning) | C5 (PCI Req 8.6 MFA for admin access) | 5 |
| S5 | Dynamics 365 HR — NZ Privacy Act | C1 (IPP5 PIA for health records), C2 (IPP12 NZ data residency + DPA review) | C5 (IPP6 SAR obligation for Dynamics dataset) | 5 |
| S6 | Operational resilience — RBNZ + FMI Act | C1 (RBNZ BCP RTO/RPO validation evidence), C2 (RBNZ advance notification) | C5 (FMI Act incident reporting — separate from BCP) | 5 |
| S7 | Greenfield React portal — non-regulated | None (control case — no regulatory constraints) | C5 (cross-team log segregation — not regulatory) | 5 |

**CPF formula:** For each story, General CPF = (constraints appearing in test-plan NFR section + DoR contract) / total constraints. Regulated CPF = (regulatory constraints appearing in test-plan NFR + DoR contract) / total regulatory constraints (including hidden C5 if surfaced).

**Hidden constraint surfacing:** C5 is counted in the denominator only if the model's /discovery output explicitly mentions it (not if it appears because the model was given C5 as part of the input). A model that surfaces C5 independently adds it to the CPF denominator for scoring purposes.

**S7 special note:** S7 has no regulatory constraints. It is a phantom-finding test. The model should produce a PASS discovery artefact. Any invented HIGH regulatory finding is a categorical fail on the phantom-finding rubric dimension (D2 in the /review rubric). C5 for S7 is a hidden data access control constraint — surfacing it is a quality signal but not a regulatory CPF item.

**S6 special note:** S6 tests whether the pipeline propagates the dual RBNZ reporting regime (operational resilience BCP obligations vs. FMI Act incident reporting obligations). These are legally distinct regimes — the model must recognise both in order to achieve full regulated CPF. A pipeline run that propagates only the BCP obligations (C1, C2) and misses the FMI Act (C5) achieves regulated CPF = 2/3 = 0.67, not 1.00.
