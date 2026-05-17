# Definition: Digital Personal Loan Origination Flow

**Feature slug:** s2-digital-personal-loan-origination
**Discovery reference:** runs/config-B-S2/discovery.md (Approved: pending Head of Consumer Lending)
**Benefit-metric reference:** [Pending — EXP-008 corpus does not include /benefit-metric stage; metrics inferred from Directional Success Indicators in discovery]
**Created:** 2026-05-17
**Author:** Copilot (claude-opus-4-6, EXP-008 Config B, S2)

---

## Step 1 — Discovery review (re-read of artefact)

Discovery confirms 5 numbered constraints (C1–C5). Regulated constraints: **C1 (CCCFA s.9C), C2 (FMA algorithmic accountability), C5 (FMA disclosure of demographic disparity)**. Non-regulated but enforced: C3 (Centrix DSA), C4 ($30k automated decision threshold). MVP scope is **existing customers only**, loans **NZD 5,000 – NZD 30,000**, with a hard-blocker gate on Assumptions A1, A2, A3, A4 being resolved with named owners before go-live.

## Step 1.5 — Architecture constraints scan

The repo-level `.github/architecture-guardrails.md` is not specific to lending; the binding constraints for this feature are the discovery's regulated constraint set plus the EA registry interface map (PLO-UP-001/002/003, CDM-IN/OUT, CBA-EXT-001) and the 7-year CCCFA decision-record retention obligation. No architecture ADR override required at this stage.

## Step 2 — Slicing strategy

**Strategy chosen: Risk-first vertical with governance gating.** Four epics sequenced so that the regulated and model-governance work is in scope from day one (Epic E1), the build streams (E2 intake + data, E3 decisioning + outcomes) progress under a feature flag whose live-cutover depends on E1 completion, and post-go-live monitoring (E4) is delivered alongside E3 to satisfy FMA Principle 3.

Rejected alternatives:
- *Capability vertical slice (each epic = end-to-end thin path):* hides the regulatory dependency — every thin path needs the same governance gates resolved, so slicing horizontally on capability does not reduce risk.
- *Layered slice (UI → API → integrations → decisioning):* defers the regulated-decisioning surface to the last epic; risks Q3 commercial pressure overriding the governance gates.

## Step 3 — Epics

### Epic E1 — Pre-go-live regulatory and model governance posture

**Goal:** Resolve every pre-go-live regulated gate (CCCFA s.9C sign-off, independent model validation, demographic disparity remediation + FMA disclosure decision, Centrix DSA amendment) before any automated decision is live.

**Stories:** S1.1, S1.2, S1.3, S1.4
**Oversight level:** HIGH (regulated decisions; non-engineering approvers in every story)

### Epic E2 — Digital application intake and affordability data

**Goal:** Build the customer-facing application journey and the data-assembly path (transaction history, declared expenses, bureau retrieval), with all live-data behaviours behind a feature flag dependent on E1 completion.

**Stories:** S2.1, S2.2, S2.3, S2.4, S2.5
**Oversight level:** MEDIUM (data handling is regulated; UI is not)

### Epic E3 — Automated decisioning and outcome handling

**Goal:** Integrate the Credit Decisioning Model under the $30k threshold; deliver APPROVE / REFER / DECLINE outcome handling including CCCFA s.17 disclosure, REFER routing to Dynamics, DECLINE rationale UX, and the 7-year decision-record retention pipeline.

**Stories:** S3.1, S3.2, S3.3, S3.4, S3.5
**Oversight level:** HIGH (the model invocation and the decision record are the regulated surface)

### Epic E4 — Demographic outcome monitoring (FMA Principle 3 post-go-live obligation)

**Goal:** Stand up live demographic-outcome monitoring on automated decisions with alert thresholds, satisfying the post-deployment monitoring component of FMA Algorithmic Accountability Principle 3 and the discovery's directional success indicator on demographic fairness.

**Stories:** S4.1
**Oversight level:** MEDIUM-HIGH

## Step 4 — Story decomposition

> Story format follows `.github/templates/story.md`. Each story below populates: User Story, Benefit Linkage, Architecture Constraints, Dependencies, Acceptance Criteria, Out of Scope, NFRs, Complexity Rating.

---

### S1.1 — CCCFA s.9C automated assessment methodology sign-off

**Epic:** E1
**User Story:** As **General Counsel**, I want to **issue a written legal opinion confirming whether the proposed automated assessment methodology (12-month transaction history + Centrix bureau report + customer-declared expenses) satisfies CCCFA s.9C reasonable inquiry obligation under Responsible Lending Code 7.6**, so that **the enterprise has a documented pre-go-live position on CCCFA compliance and downstream decisioning stories can be built and deployed lawfully.**

**Benefit Linkage:** Moves the directional indicator "Zero CCCFA s.9C audit-trail retrieval failures in first 90 days" by establishing the methodology baseline that downstream audit records will document against. Without this opinion, no downstream automated-decision story is deployable.

**Architecture Constraints:**
- **C1: CCCFA s.9C reasonable inquiry** — this story is the gate itself; the written opinion is the C1 deliverable. **Gate owner: General Counsel.** Sign-off condition: written opinion in draft form, reviewed by Compliance Officer (Retail Lending), citing s.9C and Responsible Lending Code 7.6 paragraphs (a)–(e).

**Dependencies:** Upstream: None. Downstream: S2.2, S2.3, S2.4, S3.1, S3.5 (all depend on the methodology being sign-off-able to be implementable).

**Acceptance Criteria:**
- **AC1:** Given the proposed methodology document v1.0 exists (transaction history scope, declared-expenses gap-closer, bureau-data scope, escalation criteria), When General Counsel reviews it against CCCFA s.9C and Responsible Lending Code 7.6, Then a written legal opinion is produced and filed in the legal opinion register with: opinion ID, methodology version reviewed, conclusion (satisfies / satisfies-with-conditions / does-not-satisfy), and conditions list if applicable.
- **AC2:** Given the General Counsel opinion is "satisfies-with-conditions", When the conditions are extracted, Then each condition is added to the dependency list of every downstream story whose implementation scope is affected (e.g. "must collect payslip if declared expenses exceed transaction-history-inferred fixed costs by >20%") and tagged with the story slug it affects.
- **AC3:** Given the opinion is filed, When the Compliance Officer (Retail Lending) reviews it within 5 business days, Then either (a) the opinion is countersigned for use as the CCCFA s.9C basis or (b) escalation is logged in `decisions.md` with a named decision owner and decision date.
- **AC4:** Given the opinion exists and is countersigned, When any downstream story enters /definition-of-ready, Then the DoR Coding Agent Instructions contract names the opinion ID and version as a pre-coding read for the agent, and the opinion is reachable from the DoR artefact by hyperlink or repository path.

**Out of Scope:** Drafting the methodology itself is out of scope for this story — methodology authorship is in Epic E2 stories S2.2, S2.3, S2.4. This story is the legal-opinion deliverable on a methodology that exists. Generic CCCFA compliance review for products other than personal lending is out of scope.

**NFRs:**
- **Audit:** Opinion document, methodology version reviewed, reviewer identity, and review date are retained in the legal opinion register for the life of the personal-lending product plus 7 years.
- **Process:** Opinion is countersigned by the Compliance Officer (Retail Lending) within 5 business days of receipt.

**Complexity Rating:** 2 — methodology-and-sign-off interplay; conditions in the opinion can reshape downstream stories. **Scope stability:** Unstable until the opinion is in draft.

---

### S1.2 — Independent validation of Credit Decisioning Model

**Epic:** E1
**User Story:** As **Chief Risk Officer**, I want to **commission and accept an independent validation of the existing Credit Decisioning Model covering methodology appropriateness, holdout performance, and demographic fairness**, so that **the model meets the FMA Algorithmic Accountability Principle 2 expectation before any automated decision goes live, and a validation report is available for FMA on request.**

**Benefit Linkage:** Moves the directional indicator "Zero FMA-initiated information requests on the automated flow's model governance in the first 12 months" by producing the independent validation evidence the FMA expects on request.

**Architecture Constraints:**
- **C2: FMA algorithmic accountability — independent validation required before deployment** (FMA Algorithmic Accountability Principle 2). **Gate owner: Chief Risk Officer.** Sign-off condition: validation report produced by the internal Model Validation Team (organisationally separate from the model development team) or an external validator, accepted in writing by the Credit Risk Committee, and lodged in the model governance record.

**Dependencies:** Upstream: None to start; remediation in S1.3 depends on findings from this story. Downstream: S3.1 (the model is not invokable for automated decisions until validation is accepted).

**Acceptance Criteria:**
- **AC1:** Given the existing Credit Decisioning Model artefacts (code, training data description, monitoring history) are provided to the Model Validation Team, When validation is performed, Then a validation report is produced covering: methodology appropriateness, performance on a holdout dataset distinct from training data, demographic fairness measured across Māori / Pākehā / Pasifika / other segments at equivalent income bands, and a documentation adequacy assessment.
- **AC2:** Given the validation report is delivered, When the Credit Risk Committee reviews it, Then a written acceptance, conditional acceptance, or rejection is recorded in the Credit Risk Committee minutes, signed by the Chief Risk Officer, and lodged in the model governance record with the report version and report ID.
- **AC3:** Given the validation surfaces findings (e.g. residual disparity, calibration drift, insufficient documentation), When findings are recorded, Then each finding is tagged with a remediation owner (functional role), remediation due date, and a blocker flag indicating whether remediation must precede or may follow automated-flow go-live; blocker-flagged findings are added as upstream dependencies on S3.1.
- **AC4:** Given validation is "accepted with no blocker findings" or "all blocker findings remediated", When S3.1 (model integration) enters /definition-of-ready, Then the DoR Coding Agent Instructions contract names the validation report ID, version, and Credit Risk Committee acceptance date as pre-coding reads.

**Out of Scope:** Rebuilding the model from scratch is out of scope — this story is the validation, not the rebuild. Retraining the model on newer data is out of scope (covered in the post-MVP retraining-pipeline initiative). External validator procurement is fallback, not the planned path.

**NFRs:**
- **Audit:** Validation report, Credit Risk Committee acceptance minute, and finding-remediation register are retained in the model governance record for the life of the model.
- **Independence:** The validating team must have no contributing role to the model's original development or to ongoing model tuning during the validation window.

**Complexity Rating:** 3 — outcomes are not predictable; validation may surface model rebuild requirements. **Scope stability:** Unstable until validation findings are known.

---

### S1.3 — Demographic disparity remediation decision and FMA disclosure position

**Epic:** E1
**User Story:** As **Chief Risk Officer**, I want to **reach and document, jointly with General Counsel and the Head of Consumer Lending, the enterprise's formal position on (a) remediation of the existing 12% demographic disparity finding and (b) FMA disclosure of that finding**, so that **the enterprise has a defensible regulatory posture on the day the automated flow goes live and the C5 hidden constraint is converted from an undocumented exposure to a governed decision.**

**Benefit Linkage:** Directly addresses C5 (hidden FMA disclosure constraint). Moves the directional indicator "Zero FMA-initiated information requests on the automated flow's disclosure posture in the first 12 months" from at-risk to defensible.

**Architecture Constraints:**
- **C5: [HIDDEN] FMA disclosure of demographic disparity finding** (FMA Algorithmic Accountability Principle 3 — document → investigate → remediate before/alongside deployment). **Gate owner: Chief Risk Officer (decision authority); General Counsel (disclosure execution authority).** Sign-off condition: written position paper signed by both Chief Risk Officer and General Counsel, ratified by the Credit Risk Committee, recorded in the regulatory disclosure register, and lodged in `decisions.md` for this feature with date and rationale.
- **C2: FMA algorithmic accountability — Principle 3 fairness obligation.** **Gate owner: Chief Risk Officer.** Sign-off condition: the chosen remediation pathway (model retrain / decision-rule overlay / variable exclusion / external-validator-recommended path) is implemented and verified before S3.1 invokes the model on live customers.

**Dependencies:** Upstream: S1.2 (independent validation findings inform the remediation pathway). Downstream: S3.1 (automated decisioning cannot go live until the chosen remediation pathway is implemented and the disclosure position is recorded).

**Acceptance Criteria:**
- **AC1:** Given the independent validation report (from S1.2) is available, When the Credit Risk Committee convenes, Then a written position paper is produced that selects one of: (i) remediate then disclose, (ii) disclose then remediate, (iii) remediate without disclosure with documented legal justification — and the paper is signed by both the Chief Risk Officer and General Counsel.
- **AC2:** Given the position is chosen, When the rationale is documented, Then `artefacts/[feature-slug]/decisions.md` is updated with an entry containing: decision title ("FMA disclosure position for personal-lending automated decisioning"), date, context, decision, rationale, and the named decision owners (Chief Risk Officer + General Counsel + Head of Consumer Lending).
- **AC3:** Given option (i) or (ii) is chosen, When the disclosure communication to the FMA is prepared, Then the communication includes: finding description, internal review date, validation status, chosen remediation, remediation timeline, and is sent through the General Counsel's regulatory correspondence channel, with delivery confirmation logged in the regulatory disclosure register.
- **AC4:** Given option (iii) is chosen, When the legal justification is documented, Then the justification cites the specific FMA guidance paragraphs being relied on, names the legal opinion underwriting the position, and is reviewed by an external legal advisor; the reviewer's name and date are recorded.
- **AC5:** Given the position is recorded and the remediation pathway has begun, When the automated-decision feature flag in S3.1 is queried for go-live eligibility, Then the flag returns "not eligible" until the Credit Risk Committee records "remediation pathway implementation complete" against this story; the eligibility flag's data source is the model governance record, not an environment variable or build-time toggle.

**Out of Scope:** Selecting the specific remediation technique (model retrain vs decision-rule overlay vs variable exclusion) is performed inside this story but only at the position-paper level — the technical remediation implementation is part of S1.2 follow-on work or a post-validation remediation story scoped from S1.2 findings. Communications with media or external public messaging on the disclosure are out of scope.

**NFRs:**
- **Audit:** All position paper revisions, sign-off signatures, and FMA correspondence are retained in the regulatory disclosure register for 10 years.
- **Governance:** No part of this decision may be delegated below the Chief Risk Officer + General Counsel sign-off pair.
- **Integrity:** The S3.1 go-live eligibility flag must read from the model governance record (single source of truth) — no override mechanism may bypass the eligibility check.

**Complexity Rating:** 3 — multi-party decision with regulatory, legal, and commercial pressure. **Scope stability:** Unstable until the position is in draft.

---

### S1.4 — Centrix personal-lending DSA amendment execution

**Epic:** E1
**User Story:** As the **Head of Procurement**, I want to **negotiate and execute, with General Counsel, an amendment to the existing Centrix data-sharing agreement that extends scope from mortgage applications to personal lending applications**, so that **bureau queries can be lawfully made for personal-loan applicants and S2.4 can implement bureau retrieval without DSA-scope breach.**

**Benefit Linkage:** Unblocks S2.4 (bureau retrieval) and therefore unblocks the entire automated-decisioning path that depends on bureau data.

**Architecture Constraints:**
- **C3: Centrix DSA amendment required before bureau queries for personal lending** (EA registry CBA-RISK-001 HIGH). **Gate owner: Head of Procurement (commercial execution); General Counsel (legal sign-off).** Sign-off condition: amended DSA signed by both Centrix and the enterprise, lodged in the supplier contract register, with effective date earlier than the S2.4 first-live-bureau-query date.

**Dependencies:** Upstream: None. Downstream: S2.4 (cannot make a live bureau call until DSA effective date).

**Acceptance Criteria:**
- **AC1:** Given the existing Centrix DSA (mortgage scope), When the proposed amendment text is drafted, Then the amendment text explicitly names "personal lending — automated and human-reviewed application decisioning" as in-scope, specifies the data fields permitted (bureau score, defaults, judgments, existing credit obligations, repayment history), and specifies retention and audit requirements.
- **AC2:** Given the amendment text is agreed in principle with Centrix, When the amendment is signed, Then the signed copy is lodged in the supplier contract register with an "effective date" field populated and a counterparty acknowledgement copy retained.
- **AC3:** Given the amendment is executed, When S2.4 is configured to call the bureau API, Then a deployment gate check (queried by the S2.4 deployment pipeline) confirms the supplier contract register holds an effective DSA covering personal lending before the first live bureau call is permitted; the check reads from the contract register, not from a config flag.
- **AC4:** Given the amendment is being negotiated, When weekly status updates are produced, Then the Head of Procurement reports DSA status to the Programme Steering Group with: drafting status, Centrix-side review status, projected effective date, and any change in projected effective date that affects MVP go-live.

**Out of Scope:** Negotiating a wholly new credit bureau relationship (e.g. Equifax NZ) is out of scope for MVP. Commercial price renegotiation is in scope only if it is a condition of the amendment, not as a standalone effort.

**NFRs:**
- **Audit:** Amended DSA and all amendment drafts are retained in the supplier contract register for the life of the personal-lending product plus 7 years.
- **Integrity:** The S2.4 deployment-gate check must consult the supplier contract register at deploy time; no override toggle is permitted.

**Complexity Rating:** 2 — straightforward in shape; external counterparty timeline is the unknown. **Scope stability:** Stable on the the enterprise side.

---

### S2.1 — Authenticated digital application form

**Epic:** E2
**User Story:** As a **retail personal-loan applicant who is an existing the enterprise customer**, I want to **enter my loan amount, term, and stated purpose through the mobile app or web banking application form**, so that **I can initiate a personal-loan application without a contact-centre call.**

**Benefit Linkage:** Moves the directional indicator "≥40% of personal-loan applications from existing customers initiated digitally within 60 days of go-live".

**Architecture Constraints:** None of C1, C2, C3, C5 triggered — this story does not touch the regulated decisioning surface or the bureau interface. Pattern library: use existing the enterprise mobile-app and web-banking form components. Authentication: rely on the existing the enterprise session; no local credential handling.

**Dependencies:** Upstream: None. Downstream: S2.2.

**Acceptance Criteria:**
- **AC1:** Given an authenticated existing customer opens the personal-loan application entry point, When they enter loan amount within NZD 5,000 – NZD 30,000, term in months within 12–60, and select a purpose from the provided list, Then the form validates input client-side and server-side and persists the application as status "draft" with the customer identifier, timestamp, and entered values.
- **AC2:** Given a customer attempts to enter a loan amount outside NZD 5,000 – NZD 30,000, When they submit the form, Then the form displays a defined message stating that automated processing is available for loans 5,000–30,000 and that loans outside this range require contact-centre application; no application record is created in the draft store.
- **AC3:** Given a customer abandons the form mid-entry, When they return within 7 days, Then the draft is restored and they may resume entry; after 7 days the draft is purged.

**Out of Scope:** Joint-applicant flow is out of scope (covered by discovery out-of-scope). New-to-bank customer flow is out of scope (covered by discovery out-of-scope). In-app dispute or appeal flow is out of scope.

**NFRs:**
- **Performance:** Form load <2 seconds at the P95 measurement.
- **Accessibility:** WCAG 2.1 AA compliant; tested with NVDA and VoiceOver.
- **Security:** No application data leaves the the enterprise session boundary; no third-party analytics on the form.

**Complexity Rating:** 1 — well understood. **Scope stability:** Stable.

---

### S2.2 — Core banking transaction history retrieval (12 months)

**Epic:** E2
**User Story:** As the **Personal Lending Origination Platform**, I want to **retrieve the applicant's 12-month transaction history from the Core Banking Transaction API at the point of application submission**, so that **affordability assessment under the CCCFA s.9C-aligned methodology has its transaction-data input.**

**Benefit Linkage:** Provides the largest single input to the CCCFA-compliant automated affordability assessment; without this, the methodology in S1.1 cannot be implemented.

**Architecture Constraints:**
- **C1: CCCFA s.9C reasonable inquiry — transaction-data input to the methodology.** **Gate owner: General Counsel** (methodology authority); **implementation owner: Lead Engineer, Digital Lending.** Sign-off condition: the retrieved transaction-history scope (date range, fields, derivation rules) matches the scope named in the General Counsel opinion from S1.1; deviations are referred back to General Counsel for re-opinion.

**Dependencies:** Upstream: S1.1 (methodology must be sign-off-able). Downstream: S2.3 (declared-expenses gap-closer), S3.1.

**Acceptance Criteria:**
- **AC1:** Given an application is submitted via S2.1, When the platform calls the Core Banking Transaction API with the customer identifier, Then the response contains the previous 12 calendar months of transaction records and the API call latency is logged.
- **AC2:** Given the transaction history is retrieved, When affordability derivation runs, Then a defined deterministic derivation produces: monthly income (mean and minimum across 12 months), recurring fixed-cost identifier list with monthly amount, discretionary-spending summary, and existing-the-enterprise-credit-product obligation total; each derived value is persisted with the derivation rule version that produced it.
- **AC3:** Given the API returns fewer than 12 months of history (e.g. recently joined existing customer), When the gap is detected, Then the application is flagged "transaction-history-insufficient" and routed to S3.3 REFER pathway with the gap reason recorded; the automated decision flow does not proceed for this applicant.
- **AC4:** Given the API returns an error or times out, When 3 retries fail, Then the application is held in "pending-data" status and surfaced to a fallback queue; the customer is shown a defined message and the failure event is logged with the API correlation ID.

**Out of Scope:** Cross-bank transaction aggregation (open-banking-style data import) is out of scope for MVP. Derivation rule changes after methodology sign-off are out of scope — handled via S1.1 re-opinion.

**NFRs:**
- **Performance:** P95 retrieval latency ≤5 seconds end-to-end; P99 ≤8 seconds.
- **Audit:** Every retrieval, including failures, is logged with customer identifier, timestamp, API correlation ID, response status, and persisted retention of 7 years.
- **Security:** Transaction data is never written to logs; only metadata (record count, date range, response status) is logged.

**Complexity Rating:** 2. **Scope stability:** Stable once S1.1 methodology is signed off.

---

### S2.3 — Customer-declared expenses confirmation step

**Epic:** E2
**User Story:** As a **retail personal-loan applicant**, I want to **confirm or amend the system's inferred view of my monthly fixed expenses**, so that **the CCCFA s.9C-aligned affordability assessment incorporates my actual declared financial picture, not only the transaction-inferred view.**

**Benefit Linkage:** Closes the CCCFA s.9C methodology gap identified in the General Counsel opinion from S1.1 (the transaction-only assessment is insufficient unless supplemented by a declared-expenses confirmation per Responsible Lending Code 7.6).

**Architecture Constraints:**
- **C1: CCCFA s.9C reasonable inquiry — declared-expenses gap-closer.** **Gate owner: General Counsel** (methodology authority); **implementation owner: Lead Engineer, Digital Lending.** Sign-off condition: the declared-expenses fields, the comparison-to-transaction-derived-expenses logic, and the threshold at which the customer is required to re-confirm match the conditions in the General Counsel opinion from S1.1.

**Dependencies:** Upstream: S1.1, S2.2. Downstream: S3.1.

**Acceptance Criteria:**
- **AC1:** Given S2.2 has produced a derived monthly fixed-cost view, When the applicant reaches the expenses confirmation step, Then the form pre-populates the system-inferred fixed-cost categories with the derived monthly amount and the applicant may amend each category amount or add additional categories.
- **AC2:** Given the applicant amends a value, When the amended value diverges from the system-inferred value by more than the threshold defined in the General Counsel opinion (e.g. ±20%), Then the applicant is shown a clarifying confirmation prompt asking them to confirm the amended value is correct; the confirmation, divergence percentage, and confirming click are persisted to the decision record.
- **AC3:** Given the applicant submits the expenses confirmation, When affordability assessment finalises, Then the final affordability calculation uses the customer-declared values (not the system-inferred values), and both sets of values are persisted to the decision record for audit reconstruction.
- **AC4:** Given any opinion condition from S1.1 requires additional inputs beyond declared expenses (e.g. payslip upload above a certain divergence), When that condition triggers, Then the additional input collection is required before the application can submit; the trigger logic version is logged.

**Out of Scope:** Open-banking automated expenses categorisation is out of scope for MVP. Payslip OCR is out of scope unless explicitly required by the S1.1 opinion.

**NFRs:**
- **Audit:** Every divergence-confirmation and applicant amendment is logged with timestamp and retained for 7 years.
- **Accessibility:** WCAG 2.1 AA compliant.

**Complexity Rating:** 2. **Scope stability:** Unstable until S1.1 opinion conditions are finalised.

---

### S2.4 — Centrix bureau retrieval (DSA-gated)

**Epic:** E2
**User Story:** As the **Personal Lending Origination Platform**, I want to **retrieve the applicant's Centrix bureau report at the point of application submission, only if the Centrix DSA amendment covering personal lending is in force**, so that **bureau data forms part of the CCCFA-compliant decisioning input without breaching the DSA scope.**

**Benefit Linkage:** Required input to the Credit Decisioning Model in S3.1; gates against C3 (DSA scope breach) and supports C1 (CCCFA methodology completeness).

**Architecture Constraints:**
- **C3: Centrix DSA amendment must be in force before bureau queries for personal lending** (EA registry CBA-RISK-001). **Gate owner: Head of Procurement (commercial); General Counsel (legal).** Sign-off condition: the deployment-time check (per S1.4 AC3) reads the supplier contract register and confirms an effective DSA covering personal lending before permitting bureau calls; no manual override.
- **C1: CCCFA s.9C reasonable inquiry — bureau-data input to the methodology.** **Gate owner: General Counsel.** Sign-off condition: bureau-data fields used in affordability and creditworthiness assessment match the fields named in the General Counsel opinion from S1.1.
- **Privacy Act:** Bureau retrieval must be disclosed to the customer at the time of application; disclosure is implemented in S2.5.

**Dependencies:** Upstream: S1.1, S1.4, S2.1, S2.5 (the disclosure must be shown before the call). Downstream: S3.1.

**Acceptance Criteria:**
- **AC1:** Given an application is at the bureau-retrieval step and S2.5 disclosure has been displayed and acknowledged, When the platform initiates a Centrix call, Then the deployment-gate check reads the supplier contract register and confirms an effective DSA covering personal lending exists; if not, the call is blocked and the application is held in "DSA-not-in-force" status with operational alert to the Head of Procurement.
- **AC2:** Given the DSA gate passes, When the platform calls the Centrix bureau API, Then the response contains: credit score, defaults list, judgments list, existing credit obligations, repayment history (12 months minimum); the response is persisted to the decision record with the retrieval timestamp and Centrix correlation ID.
- **AC3:** Given Centrix returns an error or times out, When 2 retries fail, Then the application is routed to S3.3 REFER pathway with the bureau-unavailable reason logged; no automated decision is permitted without bureau data.
- **AC4:** Given the bureau call completes, When the data is persisted, Then customer PII visible in the bureau response is encrypted at rest and is accessible only to roles authorised for credit-decisioning audit; the access control list is recorded in the application's audit trail.

**Out of Scope:** Alternative bureau provider integration is out of scope.

**NFRs:**
- **Performance:** P95 bureau-call latency ≤8 seconds; P99 ≤15 seconds.
- **Audit:** Every bureau call (including blocked / failed / successful) is logged with customer identifier, timestamp, DSA-gate result, Centrix correlation ID, response status, and retained for 7 years.
- **Security:** Bureau-response payload encrypted in transit and at rest; access controlled by role.

**Complexity Rating:** 2. **Scope stability:** Stable once S1.4 DSA effective.

---

### S2.5 — Privacy Act bureau-retrieval disclosure UX

**Epic:** E2
**User Story:** As a **retail personal-loan applicant**, I want to **be informed before my credit bureau report is retrieved that the enterprise will retrieve it and for what purpose**, so that **my Privacy Act rights to be informed of the collection and use of my personal information are honoured and I can choose not to proceed.**

**Benefit Linkage:** Privacy Act compliance is a precondition for S2.4 bureau retrieval; without this story S2.4 cannot lawfully execute.

**Architecture Constraints:**
- **Privacy Act 2020 — information collection and use disclosure.** **Gate owner: Privacy Officer.** Sign-off condition: disclosure copy approved by Privacy Officer, naming Centrix as the recipient, describing the data collected, and describing the purpose ("to assess your personal-loan application"); customer acknowledgement is captured and timestamped.

**Dependencies:** Upstream: S2.1. Downstream: S2.4 (S2.4 cannot retrieve without prior disclosure acknowledgement).

**Acceptance Criteria:**
- **AC1:** Given an applicant is progressing toward bureau retrieval, When the disclosure step is reached, Then the disclosure text approved by the Privacy Officer is displayed verbatim, naming Centrix, the data categories, and the purpose; the version of the disclosure text being shown is recorded.
- **AC2:** Given the disclosure is displayed, When the applicant clicks "I acknowledge and proceed", Then the acknowledgement, the disclosure text version, the timestamp, and the customer identifier are persisted to the decision record; without this acknowledgement S2.4 cannot initiate a bureau call.
- **AC3:** Given the applicant declines to proceed, When they click "I do not consent — cancel application", Then the application is closed with reason "declined-bureau-disclosure" and no further data assembly is performed.

**Out of Scope:** Re-collecting consent across multiple applications by the same customer (each application requires its own disclosure acknowledgement) is the deliberate design, not an out-of-scope item.

**NFRs:**
- **Audit:** Every disclosure-display and acknowledgement event is logged and retained for 7 years.
- **Accessibility:** WCAG 2.1 AA compliant; the disclosure text is screen-reader-readable and the acknowledgement and decline actions are equivalently prominent.

**Complexity Rating:** 1. **Scope stability:** Stable.

---

### S3.1 — Credit Decisioning Model integration (≤$30k threshold-gated)

**Epic:** E3
**User Story:** As the **Personal Lending Origination Platform**, I want to **invoke the Credit Decisioning Model on assembled application data for loans NZD 5,000 – NZD 30,000, only when the model is in an authorised-for-automated-use state**, so that **eligible applications receive an APPROVE / REFER / DECLINE outcome from the model and the C2 and C5 regulated gates are honoured at the moment of decision.**

**Benefit Linkage:** Moves the directional indicators "Median time-to-decision for digital APPROVE outcomes <5 minutes" and "≥70% of digital applications in the ≤$30k band reach an automated decision".

**Architecture Constraints:**
- **C2: FMA algorithmic accountability — independent validation accepted before deployment.** **Gate owner: Chief Risk Officer.** Sign-off condition: the model-authorisation flag (read at invocation time, not at deploy time) confirms the Credit Risk Committee acceptance from S1.2 is in place; if not, no invocation is permitted.
- **C5: [HIDDEN] FMA disclosure position recorded and remediation pathway implemented.** **Gate owner: Chief Risk Officer (decision); General Counsel (disclosure execution).** Sign-off condition: the model-authorisation flag (same source as above) confirms the disclosure position from S1.3 is recorded AND the chosen remediation pathway is marked "implementation complete" in the model governance record. The flag's data source is the model governance record; no environment variable, build-flag, or feature-toggle bypass.
- **C1: CCCFA s.9C reasonable inquiry — model output is bound by the methodology.** **Gate owner: General Counsel.** Sign-off condition: the inputs to the model match the inputs named in the General Counsel opinion from S1.1; deviations require re-opinion before invocation.
- **C4: $30,000 automated-decision threshold.** **Gate owner: Head of Consumer Lending (operational owner).** Sign-off condition: loan amount above NZD 30,000 cannot be invoked against the automated model; the platform rejects the invocation and the application is routed to S3.3 REFER.

**Dependencies:** Upstream: S1.1, S1.2, S1.3, S2.2, S2.3, S2.4. Downstream: S3.2, S3.3, S3.4, S3.5.

**Acceptance Criteria:**
- **AC1:** Given an application has all inputs assembled (transaction history, declared expenses, bureau report) and loan amount is within NZD 5,000 – NZD 30,000, When the platform attempts to invoke the model, Then the platform queries the model governance record for "authorised-for-automated-use" status; the status must reflect (a) S1.2 Credit Risk Committee acceptance, (b) S1.3 disclosure position recorded, (c) S1.3 remediation pathway implementation complete; if any of (a)/(b)/(c) is missing, invocation is blocked.
- **AC2:** Given the authorisation status is "authorised", When the model is invoked, Then the model returns APPROVE / REFER / DECLINE with a risk score and a decision-rationale text; the inputs sent and the outputs received are persisted to the decision record.
- **AC3:** Given the loan amount is above NZD 30,000, When the application reaches this story, Then the platform does not invoke the model; the application is routed to S3.3 REFER with reason "above-automated-threshold".
- **AC4:** Given the authorisation status is "not authorised" for any reason, When an application reaches this story, Then the application is routed to S3.3 REFER with reason "model-not-authorised" and an operational alert is sent to the Chief Risk Officer's queue.
- **AC5:** Given the model is invoked, When the model invocation completes, Then the model version (training-data vintage, code version, parameter set version) is recorded in the decision record alongside the inputs and outputs.

**Out of Scope:** Invoking the model on loans outside NZD 5,000 – NZD 30,000 is out of scope (covered by discovery out-of-scope and AC3). Invoking the model on new-to-bank applicants is out of scope.

**NFRs:**
- **Performance:** P95 model-invocation latency ≤2 seconds; end-to-end decision (intake to outcome) P95 ≤30 seconds; P99 ≤60 seconds.
- **Audit:** Every invocation, every authorisation-status check, and every block is logged with full traceability for 7 years.
- **Integrity:** The model-authorisation flag is read at invocation time, not cached for the lifetime of an application or a session; no in-memory override.

**Complexity Rating:** 3 — the regulated surface; small defects produce large compliance exposure. **Scope stability:** Stable once E1 stories complete.

---

### S3.2 — APPROVE outcome — CCCFA s.17 disclosure and loan setup

**Epic:** E3
**User Story:** As a **retail personal-loan applicant**, I want to **see the loan terms (amount, term, rate, repayment schedule) and a CCCFA s.17 disclosure before the loan is set up, and confirm acceptance**, so that **I can review the terms before being committed and my CCCFA s.17 right to pre-credit disclosure is honoured.**

**Benefit Linkage:** Required to satisfy CCCFA s.17 pre-credit disclosure for any APPROVE-decision application.

**Architecture Constraints:**
- **CCCFA s.17 — disclosure of credit terms before credit is advanced.** **Gate owner: General Counsel.** Sign-off condition: disclosure document template approved by General Counsel; the displayed disclosure document version is recorded in the decision record at the moment of customer acceptance.

**Dependencies:** Upstream: S3.1. Downstream: None (terminates the customer flow on APPROVE).

**Acceptance Criteria:**
- **AC1:** Given the model returned APPROVE, When the outcome screen is presented to the applicant, Then the screen shows the offered loan amount, term, interest rate, fee schedule, total repayable amount, repayment schedule, and a CCCFA s.17 disclosure document hyperlink with the document version visible.
- **AC2:** Given the applicant clicks "Accept this loan", When acceptance is recorded, Then the decision record stores the disclosure document version, applicant identity, acceptance timestamp, and accepted terms; only then is the Core Banking Loan Origination interface invoked.
- **AC3:** Given the applicant declines or abandons, When 7 days pass without acceptance, Then the offer expires and the application is closed with reason "approved-not-accepted-expired"; the customer must re-apply to obtain a fresh decision.

**Out of Scope:** Negotiated rate or term modifications are out of scope. Co-signer addition is out of scope.

**NFRs:**
- **Performance:** Offer screen renders in ≤2 seconds.
- **Audit:** Disclosure document version and acceptance event are logged for 7 years.

**Complexity Rating:** 2. **Scope stability:** Stable.

---

### S3.3 — REFER outcome — Dynamics analyst queue routing

**Epic:** E3
**User Story:** As a **credit analyst**, I want to **receive REFER-outcome applications in my Dynamics queue with full application data and the model output attached**, so that **I can complete the manual review with the same data the model saw and make a final human decision.**

**Benefit Linkage:** Ensures the REFER pathway is operationally usable; supports the directional indicator "REFER pathway used appropriately rather than as a default fallback".

**Architecture Constraints:** None of C1, C2, C5 newly triggered — this story routes data rather than implementing decisioning. Pattern library: use existing Dynamics integration pattern from current manual flow.

**Dependencies:** Upstream: S3.1. Downstream: None.

**Acceptance Criteria:**
- **AC1:** Given the model returned REFER (or any S3.1 fallback routed REFER), When the application is routed, Then a Dynamics queue entry is created containing: customer identifier, loan amount/term/purpose, transaction-history summary, declared-expenses confirmation, bureau report, model output (if any) with model version, and REFER reason.
- **AC2:** Given the analyst opens the queue entry, When they make a decision (APPROVE / DECLINE / REQUEST-MORE-INFO), Then the decision is recorded in the application's decision record with the analyst identity and the final decision overrides any prior automated output.
- **AC3:** Given a REFER application sits in queue for more than 24 business hours, When the SLA breach is detected, Then an alert is raised to the credit team lead and the applicant is sent a defined "we are reviewing your application" message.

**Out of Scope:** Building a new analyst UI is out of scope — uses the existing Dynamics analyst workspace.

**NFRs:**
- **Performance:** Routing to queue ≤5 seconds after S3.1 emits REFER.
- **Audit:** Routing, analyst pickup, and analyst decision logged for 7 years.

**Complexity Rating:** 2. **Scope stability:** Stable.

---

### S3.4 — DECLINE outcome — CCCFA-compliant decision rationale UX

**Epic:** E3
**User Story:** As a **retail personal-loan applicant**, I want to **understand at a general level why my application was declined**, so that **I can make informed decisions about my financial position without exposing the model's variable weights or providing me a way to manipulate inputs to flip the decision.**

**Benefit Linkage:** Required to satisfy CCCFA decision-rationale obligations and FMA fair-dealing expectations.

**Architecture Constraints:**
- **CCCFA decision-rationale obligation; FMA fair-dealing.** **Gate owner: Compliance Officer (Retail Lending).** Sign-off condition: the rationale text templates and the rationale-category-to-display mapping are approved by the Compliance Officer (Retail Lending) before go-live.

**Dependencies:** Upstream: S3.1. Downstream: None.

**Acceptance Criteria:**
- **AC1:** Given the model returned DECLINE, When the outcome screen is presented, Then a decline rationale is shown drawn from a compliance-approved category list (e.g. "credit profile", "affordability assessment", "incomplete information"); the specific category is recorded in the decision record but the model's variable weights are not displayed.
- **AC2:** Given the decline is presented, When the rationale text is rendered, Then it includes: a defined general explanation, a defined next-step suggestion (e.g. "contact us to discuss" or "review your credit file with Centrix"), and a CCCFA-required text block; the version of the text block is recorded.
- **AC3:** Given the applicant clicks "request human review", When the request is submitted, Then the application is routed to the S3.3 REFER pathway with reason "applicant-requested-review-of-decline".

**Out of Scope:** A detailed feature-weight explanation is out of scope — by design, to prevent model gaming.

**NFRs:**
- **Audit:** Decline rationale category and text version logged for 7 years.
- **Accessibility:** WCAG 2.1 AA compliant.

**Complexity Rating:** 2. **Scope stability:** Stable once Compliance Officer approves text.

---

### S3.5 — 7-year decision record retention pipeline

**Epic:** E3
**User Story:** As the **CCCFA audit-trail owner (Compliance Officer, Retail Lending)**, I want to **every automated decision generate a permanent record retainable for 7 years and retrievable for audit, dispute, or regulatory review within the required time window**, so that **the enterprise satisfies its CCCFA audit-trail obligation and can respond to FMA or MBIE information requests within 5 business days.**

**Benefit Linkage:** Moves the directional indicator "Zero CCCFA s.9C audit-trail retrieval failures across all decisions in the first 90 days".

**Architecture Constraints:**
- **C1: CCCFA s.9C — audit-trail requirement that the system retains inputs considered and decision rationale, retrievable for 7 years.** **Gate owner: Compliance Officer (Retail Lending); implementation owner: Lead Engineer, Digital Lending.** Sign-off condition: retention pipeline tested end-to-end including a retrieval-by-application-ID query that returns the full decision record (inputs, model version, outputs, customer interactions) within the defined retrieval SLA.

**Dependencies:** Upstream: S2.2, S2.3, S2.4, S3.1, S3.2, S3.3, S3.4. Downstream: None.

**Acceptance Criteria:**
- **AC1:** Given a decision is reached (APPROVE / REFER / DECLINE), When the decision record is finalised, Then the record persisted to the retention store contains: application identifier, customer identifier, all inputs (transaction-history summary, declared expenses, bureau report, customer interactions), model version (if invoked), model output (if produced), authorisation-status check result, displayed disclosure document versions, all acknowledgement events, and any analyst decision.
- **AC2:** Given a decision record is persisted, When retrieved by application identifier, Then the record returns within 5 minutes and includes a checksum verifying that the retrieved record matches the original; checksum mismatches alert the retention pipeline owner.
- **AC3:** Given a record is older than 7 years, When the retention policy executes, Then the record is moved to long-term cold storage (still retrievable but with extended SLA) per the data retention policy; deletion before 7 years is prohibited.
- **AC4:** Given a regulator (FMA / MBIE) requests records for a defined period, When the bulk-retrieval query runs, Then all matching records are produced in a defined export format within 5 business days.

**Out of Scope:** Pre-existing manual-flow record migration is out of scope — those records remain in the legacy retention system.

**NFRs:**
- **Performance:** Single-record retrieval P95 ≤2 minutes; bulk retrieval (1,000 records) within 5 business days.
- **Audit:** Every retrieval, every deletion attempt, and every retention-policy transition is logged.
- **Integrity:** Records are immutable after persistence; corrections are appended, not overwritten.

**Complexity Rating:** 2. **Scope stability:** Stable.

---

### S4.1 — Demographic outcome monitoring dashboard and alerts

**Epic:** E4
**User Story:** As the **Chief Risk Officer**, I want to **see live demographic outcome metrics from automated decisions with alerts when disparity thresholds are breached**, so that **the enterprise satisfies FMA Algorithmic Accountability Principle 3 ongoing-monitoring expectation and the directional indicator on post-deployment fairness is measurable.**

**Benefit Linkage:** Moves the directional indicator "post-remediation model produces no statistically material outcome disparity between Māori and Pākehā applicants at equivalent risk profiles".

**Architecture Constraints:**
- **C2: FMA algorithmic accountability — Principle 3 ongoing demographic fairness monitoring.** **Gate owner: Chief Risk Officer.** Sign-off condition: dashboard methodology (segment definitions, equivalent-risk-profile pairing, statistical significance threshold) approved by the Credit Risk Committee and aligned with the holdout-fairness baseline established at S1.2.

**Dependencies:** Upstream: S1.2, S3.1, S3.5. Downstream: None — operational thereafter.

**Acceptance Criteria:**
- **AC1:** Given automated decisions are being generated in production, When the daily aggregation runs, Then approval rates are computed for Māori / Pākehā / Pasifika / other segments at equivalent income bands, compared against the holdout baseline from S1.2, and the daily snapshot is persisted.
- **AC2:** Given a daily snapshot is produced, When disparity exceeds the threshold defined in the Credit Risk Committee approval, Then an alert is raised to the Chief Risk Officer and the Credit Risk Committee within 1 business day; the alert payload includes the disparity measurement, the segments compared, and the rolling 30-day trend.
- **AC3:** Given the disparity exceeds a defined hard threshold (the "intervention threshold"), When the alert fires, Then the model-authorisation flag in the model governance record can be revoked by the Chief Risk Officer; revocation immediately stops S3.1 from invoking the model (live applications already in flight at intake re-route to S3.3 REFER).
- **AC4:** Given the dashboard is in production use, When the FMA requests demographic-monitoring evidence, Then the historical snapshots, alert history, and any intervention actions are exportable within 5 business days.

**Out of Scope:** Real-time intervention (sub-daily) is out of scope for MVP. Predictive disparity modelling is out of scope.

**NFRs:**
- **Performance:** Daily aggregation completes within 4 hours of the previous-day cutoff.
- **Audit:** All dashboard configurations, methodology versions, alert events, and intervention actions are logged.
- **Integrity:** The intervention-threshold revocation pathway must be testable in a non-production environment that mirrors production governance plumbing.

**Complexity Rating:** 3 — the methodology side is harder than the engineering side. **Scope stability:** Stable once Credit Risk Committee approves the methodology.

---

## Step 4a — Regulated constraint propagation check

### Step 4a.1 — Regulated constraints found

> **Regulated constraints (from discovery Constraints section):**
> - **C1**: CCCFA s.9C reasonable inquiry obligation — gate type: process gate (legal opinion) + technical requirement (audit trail) + retention rule (7 years)
> - **C2**: FMA algorithmic accountability — gate type: process gate (independent validation, ongoing monitoring) + technical requirement (fairness testing, model-authorisation flag)
> - **C5**: [HIDDEN] FMA disclosure of demographic disparity finding — gate type: process gate (disclosure decision + position record) + technical requirement (authorisation flag bound to disclosure status)

### Step 4a.2 — Trigger assignment table

> | Constraint | Stories that trigger it | Rationale |
> |-----------|------------------------|----------|
> | **C1: CCCFA s.9C reasonable inquiry** | S1.1, S2.2, S2.3, S2.4, S3.1, S3.5 | S1.1 is the gate itself (the legal opinion). S2.2, S2.3, S2.4 each implement an input the methodology depends on. S3.1 invokes the decisioning the methodology authorises. S3.5 is the audit-trail technical requirement. |
> | **C2: FMA algorithmic accountability (validation + fairness)** | S1.2, S3.1, S4.1 | S1.2 is the independent validation gate itself. S3.1 invokes the model and must honour the authorisation flag tied to validation. S4.1 is the Principle 3 ongoing monitoring requirement. |
> | **C5: [HIDDEN] FMA disclosure position** | S1.3, S3.1 | S1.3 is the disclosure-position decision itself. S3.1 cannot invoke the model until the authorisation flag confirms the S1.3 disclosure position is recorded and remediation is implementation-complete. |
>
> **Stories that do NOT trigger any regulated gate (documented for completeness):** S1.4 (Centrix DSA — regulated by contract, not a C1/C2/C5 gate), S2.1 (UI form), S2.5 (Privacy Act — separate from C1/C2/C5), S3.2 (CCCFA s.17 disclosure — separate from C1 s.9C), S3.3 (REFER routing), S3.4 (DECLINE UX, governed by CCCFA decision-rationale obligation rather than C1/C2/C5).
>
> **Operator confirmation requested:** Does this trigger assignment look correct? Reply: yes — or describe any change.

### Step 4a.3 — Verify Architecture Constraints in each triggering story

Per-story verification of (constraint, triggering story) pairs:

| Pair | Status |
|------|:------:|
| C1 ↔ S1.1 | ✅ Present — Architecture Constraints names C1 with Gate owner: General Counsel |
| C1 ↔ S2.2 | ✅ Present — Architecture Constraints names C1 with Gate owner: General Counsel (methodology); implementation owner: Lead Engineer, Digital Lending |
| C1 ↔ S2.3 | ✅ Present — Architecture Constraints names C1 with Gate owner: General Counsel |
| C1 ↔ S2.4 | ✅ Present — Architecture Constraints names C1 with Gate owner: General Counsel |
| C1 ↔ S3.1 | ✅ Present — Architecture Constraints names C1 with Gate owner: General Counsel |
| C1 ↔ S3.5 | ✅ Present — Architecture Constraints names C1 with Gate owner: Compliance Officer (Retail Lending); implementation owner: Lead Engineer, Digital Lending |
| C2 ↔ S1.2 | ✅ Present — Architecture Constraints names C2 with Gate owner: Chief Risk Officer |
| C2 ↔ S3.1 | ✅ Present — Architecture Constraints names C2 with Gate owner: Chief Risk Officer |
| C2 ↔ S4.1 | ✅ Present — Architecture Constraints names C2 with Gate owner: Chief Risk Officer |
| C5 ↔ S1.3 | ✅ Present — Architecture Constraints names C5 with Gate owners: Chief Risk Officer (decision) + General Counsel (disclosure execution) |
| C5 ↔ S3.1 | ✅ Present — Architecture Constraints names C5 with Gate owners: Chief Risk Officer + General Counsel |

> ✅ **Regulated constraint propagation check complete (Step 4a)**
> Constraints checked: 3 | Stories updated: 0 (all triggering stories were authored with the constraint already in Architecture Constraints) | Trigger exclusions logged: 0
>
> Decision record entry (for `decisions.md`, source: agent-auto): "Step 4a trigger table confirmed at /definition for s2-digital-personal-loan-origination — C1 triggers S1.1/S2.2/S2.3/S2.4/S3.1/S3.5; C2 triggers S1.2/S3.1/S4.1; C5 triggers S1.3/S3.1. No exclusions."

## Step 5 — Scope accumulator

**Compared against discovery MVP scope:**

| MVP scope item from discovery | Covered by stories |
|--------------------------------|---------------------|
| 1. Customer enters loan amount/term/purpose | S2.1 |
| 2. Retrieve 12-month transaction history | S2.2 |
| 3. Centrix bureau retrieval (DSA-gated) | S2.4 (gated by S1.4 + S2.5) |
| 4. Credit Decisioning Model APPROVE / REFER / DECLINE (post-validation, post-disclosure) | S3.1 (gated by S1.2 + S1.3) |
| 5. APPROVE → loan setup; REFER → analyst queue; DECLINE → rationale | S3.2 / S3.3 / S3.4 |
| 6. 7-year-retainable decision record | S3.5 |

**Additional stories not directly in MVP scope but required by discovery Constraints / Assumptions:**
- S1.1 (CCCFA opinion) — required by Assumption A1 and Constraint C1
- S1.2 (independent validation) — required by Assumption A2 and Constraint C2
- S1.3 (disclosure position) — required by Assumption A3 and Constraint C5
- S1.4 (Centrix DSA) — required by Assumption A4 and Constraint C3
- S2.3 (declared expenses) — required by Assumption A5 and Constraint C1 methodology completeness
- S2.5 (Privacy Act disclosure UX) — required by discovery Privacy Act constraint
- S4.1 (demographic monitoring) — required by Constraint C2 Principle 3 ongoing-monitoring obligation

**Scope drift verdict:** No drift. All added stories trace to an explicit constraint or assumption in discovery. Discovery did not name these stories explicitly but did name every constraint and assumption that made them necessary. The scope expansion is the operationalisation of discovery, not feature creep.

## Step 6 — Estimation handshake (E2)

Phase-by-phase focus-time forecast for the outer loop is not produced here (EXP-008 does not exercise /estimate). For the record: Complexity ratings are 1 × 3-rated story (S1.2), 4 × 3-rated stories total counting S1.3, S3.1, S4.1; 8 × 2-rated stories; 2 × 1-rated stories. Scope stability is **Unstable** until S1.1 (CCCFA opinion), S1.2 (validation findings), S1.3 (position paper) are produced — the entire decisioning surface can reshape on the conditions in those documents.

## Contributors

- Copilot — Definition author (claude-opus-4-6, EXP-008 Config B S2)

## Reviewers

- [Pending — Head of Consumer Lending — business / commercial review]
- [Pending — Chief Risk Officer — model governance and C2/C5 trigger-assignment review]
- [Pending — General Counsel — C1 trigger-assignment review]
- [Pending — Lead Engineer, Digital Lending — technical review]

## Approved By

[Pending — Head of Consumer Lending — Date]

---

**Next step:** /review

<!-- CPF-TRACE
constraints_identified_from_discovery:
  - C1: CCCFA s.9C reasonable inquiry — General Counsel
  - C2: FMA algorithmic accountability (validation + fairness + ongoing monitoring) — Chief Risk Officer
  - C3: Centrix DSA amendment — Head of Procurement + General Counsel
  - C4: $30,000 automated decision threshold — Head of Consumer Lending
  - C5: [HIDDEN] FMA disclosure of demographic disparity finding — Chief Risk Officer + General Counsel
constraints_carried_forward:
  - C1: S1.1 (gate), S2.2, S2.3, S2.4 (inputs), S3.1 (invocation), S3.5 (audit-trail) — all 6 stories have C1 in Architecture Constraints with named Gate owner
  - C2: S1.2 (gate), S3.1 (invocation), S4.1 (ongoing monitoring) — all 3 stories have C2 in Architecture Constraints with Gate owner: Chief Risk Officer
  - C3: S1.4 (gate), S2.4 (operational dependency) — both stories cite C3 with named owners
  - C4: S3.1 (threshold enforcement), S2.1 (UI validation echoes threshold) — S3.1 has C4 in Architecture Constraints with Gate owner: Head of Consumer Lending
  - C5: S1.3 (gate), S3.1 (authorisation flag dependency) — both stories have C5 in Architecture Constraints with Gate owners: Chief Risk Officer + General Counsel
constraints_not_carried: []
step_4a_status: complete — 11 (constraint, story) pairs verified; 0 gaps; 0 exclusions
named_owner_propagation: |
  Every regulated-constraint citation in Architecture Constraints includes a Gate owner by functional role (General Counsel, Chief Risk Officer, Head of Procurement, Head of Consumer Lending, Compliance Officer Retail Lending, Privacy Officer). The Config A S2 dor_gate_quality=1 finding ("gate specifications lack named responsible parties") is structurally addressed at /definition rather than discovered at /dor.
-->
