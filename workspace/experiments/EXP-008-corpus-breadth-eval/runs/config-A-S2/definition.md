# Definition: Digital Personal Loan Origination — Regulated Credit Advance Flow

**Feature:** lending-origination-digital-flow
**Discovery status:** Approved (eval-mode — read from disk: `runs/config-A-S2/discovery.md`)
**Benefit-metric:** NOT PRESENT — experimental simplification for EXP-008 CPF measurement
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Date:** 2026-05-17
**Run:** EXP-008 Config A S2

---

## Step 0 — Entry condition check (eval-mode)

- Discovery artefact: ✅ read from disk (`runs/config-A-S2/discovery.md`, status: Approved, eval-mode)
- Context injection files: ✅ S2-ea-registry-lending-origination.md, S2-cccfa-fma-policy-excerpt.md — active
- Benefit-metric artefact: ⚠️ NOT PRESENT — experimental simplification. Success indicators from discovery carried into stories.

**Constraints carried in from discovery:**
- C1 — CCCFA s.9C reasonable inquiry obligation: automated methodology requires legal sign-off (go-live blocker)
- C2 — FMA algorithmic fairness: independent model validation + demographic bias assessment required before automated deployment (go-live blocker)
- C3 — Centrix DSA: existing agreement covers mortgage applications only; personal lending requires amendment (go-live blocker)
- C4 — Automated decision threshold: ≤$30,000 automated; above routes to credit analyst
- C5 — FMA enforcement risk: demographic disparity finding (12% Māori/Pākehā gap) not disclosed to FMA; go-live with undisclosed finding creates regulatory enforcement risk under FMA Act 2011

**Slicing strategy:** Risk-first (Strategy 4) — all three go-live blockers (C1, C2/C5, C3) are on the critical path. The compliance gate stories (Epic 1) must complete before the digital origination flow (Epic 2) can go live. Epic 1 is non-engineering work but must be tracked as delivery items with acceptance criteria and owner accountability; they gate the Epic 2 and Epic 3 engineering stories.

**Architecture constraints scan:** `.github/architecture-guardrails.md` reviewed — governs skills platform conventions, not the lending origination domain. No platform-level guardrails applicable. Constraints for this feature are drawn from EA registry entries and CCCFA/FMA policy injection files.

---

## Step 4a — Regulated Constraint Audit

### Regulated constraints identified in discovery

| Constraint | Type | Regulatory source |
|-----------|------|-------------------|
| C1 — CCCFA s.9C reasonable inquiry obligation: automated methodology legal sign-off not obtained | Regulatory (external law) | CCCFA 2003 s.9C; Responsible Lending Code 7.6 |
| C2 — FMA algorithmic fairness: independent model validation + fairness testing required before automated deployment | Regulatory (FMA expectation) | FMA Algorithmic Accountability Principles 2 and 3 |
| C5 — FMA Act 2011 enforcement risk: demographic disparity finding not disclosed to FMA | Regulatory (hidden enforcement risk) | FMA Act 2011 s.9; FMA Algorithmic Accountability Principle 3(c)(d) |

Non-regulated constraints (tracked but lower CPF threshold):
- C3 — Centrix DSA amendment required (technical/legal — data sharing agreement scope)
- C4 — $30,000 automated decision threshold (operational/technical constraint)

### Story-to-regulated-constraint mapping

| Story | Triggers C1 | Triggers C2 | Triggers C5 |
|-------|------------|------------|------------|
| 1.1 — CCCFA Methodology Sign-Off | ✅ PRIMARY | — | — |
| 1.2 — FMA Disclosure and Model Validation Gate | — | ✅ PRIMARY | ✅ PRIMARY |
| 1.3 — Centrix DSA Amendment | — | — | — |
| 2.1 — Customer Digital Application Interface | ✅ secondary (methodology must exist before go-live) | — | — |
| 2.2 — Automated Affordability Assessment Engine | ✅ secondary (s.9C audit trail requirement) | — | — |
| 2.3 — Automated Credit Decision Integration | ✅ secondary (go-live gated on C1 clearance) | ✅ secondary (go-live gated on C2 clearance) | ✅ secondary (go-live gated on C5 resolution) |
| 3.1 — Analyst Escalation Pathway | — | — | — |
| 3.2 — Application Audit Trail and Decision Record | ✅ secondary (CCCFA audit trail obligation) | — | — |

### Architecture Constraints section verification

Each (regulated constraint, triggering story) pair verified below. Gaps flagged.

| Pair | C1 in Architecture Constraints? | C2 in Architecture Constraints? | C5 in Architecture Constraints? | Gap? |
|------|--------------------------------|--------------------------------|--------------------------------|------|
| Story 1.1 / C1 | ✅ C1 PRIMARY — see story below | N/A | N/A | None |
| Story 1.2 / C2 | N/A | ✅ C2 PRIMARY — see story below | ✅ C5 PRIMARY — see story below | None |
| Story 2.1 / C1 | ✅ C1 secondary — see story below | N/A | N/A | None |
| Story 2.2 / C1 | ✅ C1 secondary (audit trail) — see story below | N/A | N/A | None |
| Story 2.3 / C1 | ✅ C1 secondary — see story below | ✅ C2 secondary — see story below | ✅ C5 secondary — see story below | None |
| Story 3.2 / C1 | ✅ C1 secondary (7-year audit trail) — see story below | N/A | N/A | None |

**Step 4a result: No gaps detected.** All (regulated constraint, triggering story) pairs have the constraint explicitly referenced in the Architecture Constraints section of the corresponding story. C5 is carried into Story 1.2 (primary) and Story 2.3 (go-live gate). C1 is carried into Story 1.1 (primary), 2.1, 2.2, 2.3, and 3.2. C2 is carried into Story 1.2 (primary) and 2.3.

---

## Epic Structure

**Epic 1: Regulatory Compliance Gate Clearance** — 3 stories — addresses all three go-live blockers; non-engineering work packages with delivery accountability. Completion gates Epic 2 and Epic 3 go-live.

**Epic 2: Digital Origination Flow** — 3 stories — customer-facing digital loan application; automated assessment and decision for ≤$30,000 loans.

**Epic 3: Analyst Queue and Audit Infrastructure** — 2 stories — analyst escalation pathway for above-threshold applications; CCCFA-compliant audit trail for all applications.

**Total: 8 stories** covering all MVP scope items from the discovery artefact.

---

## Epic 1: Regulatory Compliance Gate Clearance

### Story 1.1 — CCCFA Automated Reasonable Inquiry Methodology Sign-Off

**As a** compliance and legal officer,
**I want** a documented automated reasonable inquiry methodology approved by legal and compliance before the digital origination flow goes live,
**So that** the bank can demonstrate it has satisfied the CCCFA s.9C responsible lending obligation when using automated transaction analysis and customer-declared expense declaration as the substitute for a manual agent interview.

**Context:** CCCFA Responsible Lending Code clause 7.6 requires legal and compliance sign-off on the automated methodology before the system is used for credit decisions. EA registry entry PLO-RISK-001 confirms this sign-off has not been obtained. This story produces the methodology document and obtains sign-off. Go-live of Epic 2 stories is blocked until this story is complete.

**Out of scope:** Building the automated affordability assessment system itself (Story 2.2). Model validation (Story 1.2). Centrix DSA (Story 1.3).

**Acceptance Criteria:**

AC1: Given the proposed automated origination methodology (automated 12-month transaction analysis + mandatory customer-declared expenses declaration), when the legal team reviews it against CCCFA s.9C and Responsible Lending Code 7.6, then a written legal opinion is produced confirming whether the methodology satisfies (or does not satisfy) the reasonable inquiry obligation.

AC2: Given the legal opinion confirms the methodology satisfies s.9C (or proposes specific modifications to achieve compliance), when compliance review is completed, then a signed methodology sign-off document is produced, naming the responsible compliance officer and the date of sign-off, and stored in the compliance record.

AC3: Given the signed methodology sign-off, when the methodology document is reviewed, then it specifies: (a) the information sources used in the automated inquiry (transaction history, bureau data, declared expenses), (b) the conditions under which the system must escalate to manual review rather than issue an automated decision (e.g., insufficient transaction history, incomplete declared expenses), and (c) the audit trail requirements the system must satisfy to evidence the inquiry.

AC4: Given that this story is not complete (sign-off not obtained), when Epic 2 stories are reviewed for go-live readiness, then they are blocked and cannot proceed to production.

**Architecture Constraints:**
- **C1 (CCCFA s.9C):** This story is the primary delivery vehicle for the C1 constraint. The methodology document produced here defines the compliance envelope within which all automated credit decision stories (2.1, 2.2, 2.3) must operate. No automated credit decision story can go live without the signed methodology document from this story. If legal cannot confirm the methodology, the digital origination MVP as scoped may not be technically achievable without architectural changes to information gathering.

**NFR:**
- Compliance record retention: The signed methodology sign-off document must be retained as a permanent compliance record, retrievable on FMA request within 5 business days.
- Owner: Compliance and Legal team. Not an engineering story — delivery is a governance action, tracked as a project dependency.

---

### Story 1.2 — FMA Demographic Disparity Disclosure and Independent Model Validation Gate

**As a** head of credit risk and legal counsel,
**I want** the demographic disparity finding formally disclosed to the FMA and the Credit Decisioning Model independently validated (including demographic fairness testing) before the model is used in any automated personal lending decision,
**So that** the bank eliminates its regulatory enforcement risk under the FMA Act 2011 and satisfies FMA Algorithmic Accountability Principle 3 (demographic fairness) and Principle 2 (independent validation) before the digital origination flow goes live.

**Context:** The internal model review conducted 8 months ago found a 12% approval rate difference between Māori and Pākehā applicants at the same income band (EA registry CDM-RISK-001, severity: CRITICAL). This finding has not been disclosed to the FMA. FMA Algorithmic Accountability Principle 3 requires: (a) document the disparity, (b) investigate source, (c) determine whether legitimate risk factors explain it, (d) if not, remediate before or alongside deployment. Principle 2 requires independent validation before deployment. Proceeding to production without completing both obligations is a regulatory enforcement risk, not merely a reputational one.

**Out of scope:** The model retraining or bias remediation work itself (separate initiative). Building the automated decision integration (Story 2.3). CCCFA methodology sign-off (Story 1.1).

**Acceptance Criteria:**

AC1: Given the demographic disparity finding (12% Māori/Pākehā approval rate difference at same income band), when legal counsel reviews the FMA disclosure obligation under FMA Act 2011 s.9 and FMA Algorithmic Accountability Principle 3, then a written legal opinion is produced confirming: (a) whether a disclosure obligation exists, (b) the form and timing of required disclosure, and (c) whether remediation prior to disclosure is required or disclosure can accompany a remediation plan.

AC2: Given the legal opinion on disclosure, when the Head of Credit Risk and Legal Counsel formally decide on the disclosure path (notify FMA now / notify FMA with remediation plan / legal basis for non-disclosure), then that decision is documented and stored in the compliance record with names, dates, and rationale — regardless of which option is chosen.

AC3: Given that the disclosure decision has been made (or a legally defensible decision not to disclose has been documented), when an independent model validator is engaged, then the validation scope includes: (a) model methodology and appropriateness for automated personal lending, (b) performance on a holdout dataset from the current customer population, (c) demographic fairness testing with explicit assessment of the Māori/Pākehā approval rate difference, and (d) model documentation adequacy (FMA Principle 4).

AC4: Given the independent validation is complete, when the validation report is reviewed, then either: (a) the report confirms the demographic disparity is explained by legitimate risk factors and the model is validated for automated personal lending use, OR (b) the report identifies remediation actions required before the model can be used — and those actions are completed and re-validated before go-live.

AC5: Given that this story is not complete (FMA disclosure unresolved and/or independent validation not complete), when Story 2.3 (Automated Credit Decision Integration) is reviewed for go-live readiness, then it is blocked and cannot proceed to production.

**Architecture Constraints:**
- **C2 (FMA algorithmic fairness — independent model validation):** This story is the primary delivery vehicle for the C2 constraint. FMA Algorithmic Accountability Principle 2 requires independent validation before deployment. No production traffic may be routed through the Credit Decisioning Model in automated personal lending until the validation report (AC4) is complete and any remediation items are resolved.
- **C5 (FMA Act 2011 enforcement risk — undisclosed demographic disparity):** This story is the primary delivery vehicle for the C5 constraint. The 12% Māori/Pākehā approval rate disparity has not been disclosed to the FMA. This constitutes a pre-existing regulatory compliance gap — not a design gap in the proposed system. The go-live decision for the digital origination flow is conditioned on this gap being formally addressed at the governance level (disclosure decision documented, legal opinion obtained). Any deployment decision taken before this story is complete accepts an unquantified regulatory enforcement risk.

**NFR:**
- Regulatory evidence trail: All documents produced by this story (legal opinion, disclosure decision record, validation report, FMA correspondence) must be stored in the compliance record, retrievable on FMA request within 5 business days.
- Owner: Head of Credit Risk and Legal Counsel. Not an engineering story — tracked as a project governance dependency with go-live gate authority.

---

### Story 1.3 — Centrix Data-Sharing Agreement Amendment for Personal Lending

**As a** compliance officer and product owner,
**I want** the Centrix data-sharing agreement confirmed or amended to explicitly cover personal lending bureau queries before the digital origination flow uses Centrix bureau data,
**So that** the bank's use of Centrix credit data for personal loan decisions is legally authorised and Privacy Act-compliant.

**Context:** EA registry CBA-RISK-001 and PLO-RISK-002 confirm the existing Centrix DSA covers mortgage applications only. Personal lending is a materially different use case. Legal confirmation or DSA amendment is required before PLO-UP-002 (Centrix Bureau API) can be used for personal loan queries.

**Out of scope:** Building the Centrix API integration itself (Story 2.2). Negotiating commercial pricing for personal lending bureau queries (commercial, not compliance scope).

**Acceptance Criteria:**

AC1: Given the existing Centrix data-sharing agreement, when legal reviews it against the proposed personal lending use case, then a written legal opinion confirms whether: (a) personal lending bureau queries are in scope under the current agreement, or (b) a new or amended DSA is required.

AC2: Given that a new or amended DSA is required (expected case per EA registry), when the DSA amendment is negotiated and executed, then the signed DSA document explicitly names personal loan applications as a covered use case and specifies the data elements permitted to be requested (credit report: score, defaults, existing credit facilities, repayment history — per PLO-UP-002 interface definition).

AC3: Given the DSA is confirmed or amended, when the Privacy Act compliance review is conducted, then the personal lending application flow is confirmed to include appropriate customer consent and disclosure (customers informed of bureau query at point of application, purpose of query is personal lending assessment, basis of consent is CCCFA lending obligation).

AC4: Given that this story is not complete (DSA not confirmed), when Story 2.2 (Automated Affordability Assessment Engine) is reviewed for bureau query activation, then bureau queries via PLO-UP-002 must be disabled and the story cannot proceed to production with bureau queries enabled.

**Architecture Constraints:**
- **C3 (Centrix DSA scope):** This story is the primary delivery vehicle for the C3 constraint. The PLO-UP-002 Centrix integration must be conditional on DSA confirmation. The Story 2.2 technical design must include a feature flag or configuration gate that disables bureau queries until this story produces a signed DSA amendment or legal confirmation of in-scope coverage.

**NFR:**
- Data classification: Bureau data is Restricted. The DSA must specify data retention and deletion obligations for credit bureau data held by the bank post-decision.
- Privacy Act: Customer consent for bureau queries must be collected at the point of application submission. The consent mechanism is an engineering requirement in Story 2.1.

---

## Epic 2: Digital Origination Flow

### Story 2.1 — Customer Digital Application Interface (Mobile + Web)

**As an** existing the enterprise customer,
**I want** to apply for a personal loan through the mobile app or web browser without calling the contact centre,
**So that** I can submit a loan application, declare my income and expenses, and receive an automated decision without waiting 3–5 days.

**Context:** The customer-facing entry point for the digital origination flow. Loan purpose, amount, term, and a mandatory customer-declared expense declaration (required by CCCFA s.9C methodology — Story 1.1 defines what must be collected). Customer consent for bureau query (required by Story 1.3) is also collected at this point.

**Out of scope:** The automated decisioning logic itself (Story 2.3). Centrix integration (Story 2.2). Marketing landing pages and acquisition flows.

**Acceptance Criteria:**

AC1: Given an authenticated the enterprise customer (existing customer, authentication via existing mobile app or web session), when they navigate to the personal loan application flow, then they can enter: (a) loan purpose (from predefined list), (b) requested loan amount ($1,000–$100,000 with $1,000 increments), (c) loan term (12, 24, 36, 48, or 60 months), and (d) a mandatory customer-declared expenses declaration (monthly rent/mortgage, estimated living expenses, existing loan repayments — fields required by CCCFA methodology from Story 1.1).

AC2: Given the customer has completed the application form, when they submit, then they are presented with a clear disclosure statement that: (a) the bank will request a credit bureau report from Centrix as part of the assessment, (b) the bank will assess their transaction history held by the bank, (c) an automated credit decision will be produced for amounts ≤$30,000, (d) amounts above $30,000 will be reviewed by a credit analyst, and (e) they can decline to proceed if they do not consent to the bureau query.

AC3: Given the customer consents and submits the application, when the submission is processed, then: (a) the application is assigned a unique Application Reference ID, (b) the customer receives an email/SMS confirmation with the Application Reference ID and estimated next steps, and (c) the application state is persisted to the database.

AC4: Given the application submission fails (network error, validation failure, system unavailability), when the customer retries, then: (a) previously entered data is not lost (draft persistence), and (b) duplicate submissions for the same Application Reference ID are rejected with an appropriate error message.

AC5: Given an application is submitted, when the application amount is ≤$30,000 and all compliance gates (C1, C2/C5, C3) are cleared, then the customer receives an automated decision notification within 2 minutes of submission during business hours.

**Architecture Constraints:**
- **C1 (CCCFA s.9C):** The mandatory customer-declared expense declaration (AC1d) must match the fields specified in the approved CCCFA methodology document produced in Story 1.1. If the methodology document is not yet signed off (C1 gate not cleared), this story can be built and tested but cannot receive production traffic.
- **C3 (Centrix DSA):** The bureau query consent disclosure (AC2b) must be present and accurate. The consent mechanism must be implemented before bureau queries are enabled in Story 2.2. This is an engineering pre-condition for DSA compliance.

**NFR:**
- Accessibility: Application flow must meet WCAG 2.1 AA for web. Mobile app must meet iOS/Android accessibility standards.
- Availability: Application submission must be available 99.5% of business hours.
- Security: Application data in transit must use TLS 1.2+. Customer-declared financial data and application data classified Restricted.
- Performance: Application page load time ≤ 2 seconds on 4G mobile. Form submission response time ≤ 3 seconds.

---

### Story 2.2 — Automated Affordability Assessment Engine

**As a** credit operations engineer,
**I want** the digital origination platform to automatically pull 12 months of transaction history from Core Banking and a credit bureau report from Centrix, and feed these into the affordability calculation,
**So that** the automated credit decision (Story 2.3) has sufficient financial information to satisfy the CCCFA s.9C reasonable inquiry standard.

**Context:** Implements PLO-UP-001 (Core Banking Transaction API) and PLO-UP-002 (Centrix Bureau API) integrations. Bureau queries via PLO-UP-002 must be gated behind DSA confirmation (Story 1.3 C3 gate). Transaction history must be assessed against the CCCFA s.9C methodology (Story 1.1 C1 requirement). The Responsible Lending Code 7.6(d) requires escalation to human review when transaction history is insufficient or unreliable.

**Out of scope:** The credit decisioning model call itself (Story 2.3). Customer-facing UI (Story 2.1). Centrix DSA negotiation (Story 1.3).

**Acceptance Criteria:**

AC1: Given an application in submitted state, when the affordability engine is triggered, then it calls PLO-UP-001 (Core Banking Transaction API) and retrieves at least 12 months of transaction history for the customer, including account balances, income credits, and recurring expense debits.

AC2: Given the transaction history retrieval, when the history covers fewer than 12 months (new-to-bank customer or account opened recently), then the application is automatically escalated to the analyst queue (REFER) rather than proceeding to automated decision, and the reason "Insufficient transaction history for automated assessment" is recorded in the application audit log.

AC3: Given the DSA confirmation from Story 1.3 is in place and bureau queries are enabled, when the affordability engine calls PLO-UP-002 (Centrix Bureau API), then it retrieves the customer credit bureau report (credit score, defaults, existing credit facilities, repayment history) and attaches it to the application record.

AC4: Given the bureau query returns an error or timeout, when the fallback is evaluated, then the application is automatically escalated to the analyst queue (REFER) rather than issuing an automated decision without bureau data, and the reason is recorded in the application audit log.

AC5: Given the affordability inputs (transaction history + bureau report + customer-declared expenses), when the affordability assessment is assembled, then it produces a structured affordability summary: net monthly income (inferred from transaction history), declared monthly expenses, existing credit obligations (bureau), net disposable income, and a debt-service coverage ratio for the requested loan repayment amount.

AC6: Given that bureau queries are disabled (Story 1.3 C3 gate not yet cleared), when the affordability engine runs, then it operates in transaction-only mode (no bureau call), and all applications are escalated to analyst queue with reason "Bureau query disabled pending DSA confirmation" — no automated approvals are issued without bureau data.

**Architecture Constraints:**
- **C1 (CCCFA s.9C):** The affordability inputs assembled by this engine (AC5) must satisfy the information-gathering requirements of the approved CCCFA methodology document (Story 1.1). The engine must implement the escalation rule (AC2) as required by Responsible Lending Code 7.6(d). The affordability summary produced (AC5) must be stored per-application in the audit log (Story 3.2 interface) to evidence the reasonable inquiry.
- **C3 (Centrix DSA):** Bureau queries via PLO-UP-002 must be feature-flagged and configurable. The flag must default to disabled in all environments until Story 1.3 produces a signed DSA amendment. Enabling bureau queries in production requires an explicit configuration change that references the DSA amendment document.

**NFR:**
- Performance: Transaction history retrieval from Core Banking API must complete within 5 seconds. Bureau API call must complete within 8 seconds. Total affordability assessment assembly must complete within 15 seconds of application submission.
- Resilience: Both PLO-UP-001 and PLO-UP-002 calls must implement retry-with-backoff (max 3 retries, exponential). On persistent failure, fallback to analyst escalation (AC2, AC4).
- Security: Credit bureau data (Restricted) must not be logged in application log files. Only the bureau query reference ID and result code are logged. Full bureau report is stored only in the application record (Restricted storage tier).

---

### Story 2.3 — Automated Credit Decision Integration (Loans ≤$30,000)

**As a** digital lending customer,
**I want** to receive an automated credit decision (Approve, Refer, or Decline) for loan applications up to $30,000 within minutes of submitting my application,
**So that** I can act on the lending decision the same day rather than waiting 3–5 business days.

**Context:** Calls PLO-UP-003 (Credit Decisioning Model service — CDM-OUT-001). The Credit Decisioning Model must not be used in production for automated personal lending until Story 1.2 gates are cleared (FMA disclosure decision documented; independent validation completed with fairness sign-off). This story can be built and tested against a stub decision service; it cannot be pointed at the live Credit Decisioning Model until Story 1.2 is complete.

**Out of scope:** The Credit Decisioning Model itself (in-scope for Story 1.2 validation gate). Manual analyst review (Story 3.1). Applications above $30,000 (routed to analyst in this story). Model retraining or bias remediation.

**Acceptance Criteria:**

AC1: Given an application with a completed affordability assessment (Story 2.2) and a loan amount ≤$30,000, when the decision integration calls PLO-UP-003 (Credit Decisioning Model), then it passes: (a) loan amount, purpose, and term, (b) the affordability summary from Story 2.2, and (c) the customer income declaration from Story 2.1.

AC2: Given the Credit Decisioning Model returns a decision (APPROVE/REFER/DECLINE with risk score and decision rationale), when the decision is processed, then: (a) APPROVE — the customer is notified and the approved loan terms are written to PLO-DN-002 (Core Banking Loan Origination) for account setup; (b) REFER — the application is written to PLO-DN-001 (Dynamics 365 CRM analyst queue) with full application data, affordability summary, and model output; (c) DECLINE — the customer is notified with a reason (at the level permitted by CCCFA disclosure obligations — not the raw model output).

AC3: Given any application with a loan amount above $30,000, when the application reaches the decision integration, then it is automatically routed to REFER without calling the Credit Decisioning Model, and is written to the analyst queue (PLO-DN-001) with reason "Above automated decision threshold — analyst review required".

AC4: Given the Credit Decisioning Model service returns an error or is unavailable, when the fallback is evaluated, then the application is routed to REFER (analyst queue) and the system does not issue a decision based on incomplete data.

AC5: Given the decision is produced (APPROVE, REFER, or DECLINE), when the decision is written, then the full decision record — inputs passed to the model, model output, decision outcome, timestamp, and Application Reference ID — is written to the application audit log (Story 3.2) within the same transaction as the decision itself.

AC6: Given that Story 1.2 is not complete (FMA disclosure unresolved, independent validation not done), when Story 2.3 is reviewed for production routing of live traffic to the Credit Decisioning Model, then this story is blocked. The integration may be built and tested against a stub decision service; no production decision traffic may be routed to the live Credit Decisioning Model until Story 1.2 is complete.

**Architecture Constraints:**
- **C1 (CCCFA s.9C — go-live gate):** Production go-live requires the CCCFA methodology sign-off from Story 1.1. This story's AC5 audit log write is a direct requirement of the CCCFA audit trail obligation (Responsible Lending Code requirement that a record of the reasonable inquiry be kept per application).
- **C2 (FMA algorithmic fairness — go-live gate):** The Credit Decisioning Model must not receive live production traffic until Story 1.2 confirms: (a) independent validation completed, (b) demographic fairness testing completed, (c) disparity finding remediated or FMA-disclosed. This is a hard gate — not a warning. Building and testing against a stub is permitted; live model calls are not.
- **C5 (FMA Act 2011 enforcement risk — go-live gate):** The demographic disparity finding (12% Māori/Pākehā approval rate gap) has not been disclosed to the FMA. Using the Credit Decisioning Model in production before FMA disclosure or formal resolution of the disparity constitutes a live enforcement risk. This story must not be deployed to production until Story 1.2 AC2 and AC4 are satisfied. The enforcement risk under FMA Act 2011 is a regulatory constraint on this story's production readiness, not a design constraint on its technical implementation.

**NFR:**
- Performance: End-to-end application submission to decision notification ≤ 2 minutes for automated decisions during business hours.
- Resilience: Credit Decisioning Model service unavailability must not cause application loss — REFER fallback is always available.
- Auditability: Decision record retention per AC5 must support 7-year retention (CCCFA audit trail obligation). Record format must be defined by Story 3.2.
- CCCFA decline notice: DECLINE notifications must comply with CCCFA credit decision disclosure requirements — reason given at the level permitted by law, not raw model scores.

---

## Epic 3: Analyst Queue and Audit Infrastructure

### Story 3.1 — Analyst Escalation Pathway and Queue Management

**As a** credit analyst,
**I want** to receive REFER applications from the digital origination flow in my Dynamics 365 queue with the full application data, affordability summary, and model output,
**So that** I can make the final credit decision on above-threshold and model-referred applications efficiently, using the same information the automated system assessed.

**Context:** Implements PLO-DN-001 — write REFER applications to Dynamics 365 CRM analyst queue. Analysts retain final decision authority on all REFER applications (EA registry interface PLO-DN-001 note). This story does not change the analyst's review methodology — it changes the intake channel.

**Out of scope:** Changes to the analyst review workflow within Dynamics 365 (out of scope per discovery). Changing how analysts make decisions. Analyst tooling upgrades.

**Acceptance Criteria:**

AC1: Given an application routed to REFER (by automated decision, analyst threshold, or escalation fallback), when it is written to Dynamics 365 via PLO-DN-001, then the analyst receives: (a) full application data (customer ID, loan purpose, amount, term), (b) customer-declared income and expenses declaration, (c) affordability summary from Story 2.2 (transaction history summary, bureau data reference, debt-service ratio), (d) model output if available (REFER reason, risk score, decision rationale from CDM-OUT-001), and (e) escalation reason (automated threshold, system fallback, insufficient history, bureau error, or above-$30k threshold).

AC2: Given the REFER application is in the analyst queue, when an analyst retrieves and reviews it, then they can record their decision (APPROVE with terms / DECLINE with reason) within Dynamics 365, and that decision is written to the application record and triggers Core Banking loan origination for approvals (PLO-DN-002) or a decline notification to the customer.

AC3: Given the digital origination flow is live, when all REFER applications are monitored over a 30-day post-launch window, then the analyst queue load is verifiably bounded to applications meeting REFER criteria (above-threshold, system escalation, insufficient history) — no applications are being incorrectly routed to the analyst queue due to system defects.

**Architecture Constraints:**
None that directly trigger C1/C2/C5. Analyst review pathway for all amounts above $30,000 (C4 threshold) is the primary constraint carried here.

**NFR:**
- SLA: REFER applications must appear in the analyst queue within 60 seconds of the REFER decision being recorded.
- Data classification: Application data and bureau data written to Dynamics 365 is Restricted.

---

### Story 3.2 — Application Audit Trail and Decision Record Logging

**As a** compliance officer,
**I want** a per-application audit log recording all inputs considered, the affordability assessment, the credit decision outcome, and the decision timestamp to be produced and retained for every loan application processed by the digital origination flow,
**So that** the bank can satisfy its CCCFA audit trail obligation (demonstrating reasonable inquiry was conducted) and respond to any FMA request for decision records within 5 business days.

**Context:** CCCFA audit trail obligation: Responsible Lending Code requires that a record of the reasonable inquiry is kept, retrievable for audit, dispute resolution, or regulatory review. The FMA Algorithmic Accountability Principle 4 (model documentation) and the 7-year retention requirement (CCCFA) govern this story. Stories 2.2 and 2.3 both write to this audit log as part of their own ACs.

**Out of scope:** Analyst decision records in Dynamics 365 (those are stored in PLO-DN-001 system). Real-time monitoring dashboards. Reporting to regulators (a separate workflow not in scope for this MVP).

**Acceptance Criteria:**

AC1: Given any loan application submitted through the digital origination flow, when the application progresses through the pipeline, then a structured audit record is created per application containing: (a) Application Reference ID, (b) timestamp of each pipeline stage (submission, affordability assessment start/end, decision), (c) transaction history inputs summary (date range covered, number of transactions, income/expense totals), (d) bureau query reference ID and result code (not full bureau data — restricted to reference), (e) declared expenses declaration (verbatim as submitted by customer), (f) Credit Decisioning Model inputs (loan parameters, affordability summary), (g) Credit Decisioning Model output (decision, risk score, rationale text), and (h) final decision outcome (APPROVE/REFER/DECLINE) with decision source (automated / analyst / system fallback).

AC2: Given an APPROVE or DECLINE automated decision, when the audit record is produced, then it is stored in the Restricted audit log storage (not application log files) within the same database transaction as the decision itself — the audit record and the decision are atomic (both succeed or both fail).

AC3: Given any audit record, when it is queried by a compliance officer using the Application Reference ID, then the full audit record is retrievable within 10 seconds.

AC4: Given audit records are produced, when the retention policy is applied, then all application audit records are retained for a minimum of 7 years from the application date, with no automated deletion before the retention window expires.

AC5: Given an FMA audit or regulatory review request, when the compliance team retrieves the audit records, then all records for the requested period are exportable in machine-readable format (JSON or CSV) within 1 business day of the request.

**Architecture Constraints:**
- **C1 (CCCFA s.9C audit trail):** This story is the direct implementation of the CCCFA audit trail requirement. Responsible Lending Code 7.6 requires that the bank be able to demonstrate the automated inquiry was adequate. The audit record defined in AC1 is the evidentiary basis for that demonstration. 7-year retention (AC4) is a mandatory CCCFA / CCCFA audit requirement. The record schema in AC1 must be reviewed against the CCCFA methodology document from Story 1.1 to confirm it captures all inputs the methodology identifies as part of the reasonable inquiry.

**NFR:**
- Retention: 7 years minimum (CCCFA obligation).
- Security: Audit records are Restricted. Access limited to compliance officers and legal team. No write access after initial creation (append-only, tamper-evident).
- Integrity: Audit records must be tamper-evident — any modification attempt must be detectable and logged.
- Performance: Audit record write must not add more than 100ms latency to the decision workflow.

---

<!-- CPF-TRACE
stage: /definition
model: claude-sonnet-4-6
config: A

constraints_identified_from_discovery_artefact:
- C1: CCCFA s.9C reasonable inquiry obligation — legal sign-off not obtained [named in discovery problem statement, assumptions A1, success indicator 2, MVP scope prerequisites]
- C2: FMA algorithmic fairness — independent model validation + fairness testing required [named in discovery problem statement, assumptions B1/A4, success indicator 2]
- C3: Centrix DSA scope — existing agreement covers mortgage only; personal lending requires amendment [named in discovery problem statement, assumptions A2, success indicator 2]
- C4: Automated decision threshold ≤$30,000; above requires analyst [named in discovery MVP scope, out of scope section]
- C5: FMA enforcement risk — demographic disparity finding not disclosed to FMA [named as [BLOCKER B1] in discovery assumptions, success indicator 2]

constraints_carried_forward:
- C1: Carried into Story 1.1 (PRIMARY Architecture Constraint), Story 2.1 (go-live gate), Story 2.2 (s.9C methodology + audit trail), Story 2.3 (go-live gate + audit trail), Story 3.2 (PRIMARY — CCCFA audit trail obligation)
- C2: Carried into Story 1.2 (PRIMARY Architecture Constraint — independent validation gate), Story 2.3 (go-live gate Architecture Constraint)
- C3: Carried into Story 1.3 (PRIMARY Architecture Constraint), Story 2.2 (PLO-UP-002 feature flag gate Architecture Constraint)
- C4: Carried into Story 2.3 (≤$30k automated, >$30k REFER), Story 3.1 (above-threshold analyst queue)
- C5: Carried into Story 1.2 (PRIMARY Architecture Constraint — FMA enforcement risk, go-live gate), Story 2.3 (go-live gate Architecture Constraint — named explicitly as enforcement risk)

constraints_not_carried: none

Step4a_result: PASS — No gaps. All (regulated constraint, triggering story) pairs verified with explicit constraint references in Architecture Constraints sections.
-->
