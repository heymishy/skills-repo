# Synthetic EA Registry Entries
# Applications: Personal Lending Origination Platform + Credit Decisioning Model + Centrix Bureau API
# Registry version: 2026-Q1
# Entry type: Internal Applications (2) + External Integration (1)
# SYNTHETIC DOCUMENT — for EXP-003-pipeline-eval evaluation only

---

## Application Profile 1 — Personal Lending Origination Platform

**Name:** Personal Lending Origination Platform
**Owner:** Consumer Lending, the enterprise
**Domain:** Lending / Credit Products
**Classification:** Regulated — CCCFA, FMA oversight
**Criticality:** HIGH — directly originates credit advances to retail customers
**Data classification:** Restricted — customer financial data, credit bureau data, credit decisions

**Description:**
Platform supporting the end-to-end personal loan origination journey for existing the enterprise customers. Currently a manual process (contact centre intake → Dynamics entry → analyst review). Proposed digital origination flow: customer self-service via mobile/web, automated bureau pull, automated credit decisioning for loans ≤$30,000, analyst escalation for amounts above threshold.

**Hosting:** On-premises (current manual flow); Azure (proposed digital flow)
**Technology stack (proposed):** React (customer UI), Node.js API layer, integration with Centrix Bureau API, integration with Credit Decisioning Model service, Dynamics 365 CRM (analyst queue)
**Environment:** Production (current manual), Development (proposed digital)

---

## Interface Map — Personal Lending Origination Platform

### Upstream sources

| Interface ID | Application | Interface type | Data transferred | Notes |
|-------------|-------------|---------------|-----------------|-------|
| PLO-UP-001 | Core Banking Transaction API | Internal — read only | 12 months transaction history, account balances, existing the enterprise products | Used for affordability assessment |
| PLO-UP-002 | Centrix Bureau API | External — Centrix managed | Credit bureau report: credit history, defaults, existing credit obligations, credit score | See Centrix entry below — separate DSA required for personal lending use case |
| PLO-UP-003 | Credit Decisioning Model service | Internal — read only | Automated credit decision: APPROVE/REFER/DECLINE, decision rationale, risk score | See Credit Decisioning Model entry below |

### Downstream

| Interface ID | Application | Interface type | Data transferred | Notes |
|-------------|-------------|---------------|-----------------|-------|
| PLO-DN-001 | Dynamics 365 CRM | Internal — write | REFER applications for analyst review; full application data and model output | Analyst retains final decision authority for all escalated applications |
| PLO-DN-002 | Core Banking Loan Origination | Internal — write | Approved loan terms for account setup (loan amount, term, rate, repayment schedule) | Triggered only on APPROVE decision confirmed by agent or analyst |

### Regulatory obligations affecting this application

| Obligation | Regulator | Relevant provision |
|-----------|-----------|------------------|
| CCCFA — responsible lending obligations: reasonable inquiries about borrower's financial situation before advancing credit | FMA / MBIE | Credit Contracts and Consumer Finance Act 2003, s.9C |
| CCCFA — automated credit decisions must satisfy the same reasonable inquiry obligation as manual decisions | FMA / MBIE | CCCFA responsible lending principles; see also FMA Responsible Lending Guide |
| CCCFA — disclosure of credit terms before credit is advanced | FMA / MBIE | CCCFA s.17 |
| FMA algorithmic fairness — models used in credit decisions must be assessed for demographic bias before deployment | FMA | FMA guidance on algorithmic decision-making; FMA Act 2011 s.9 (fair dealing) |

### Known constraints and risks

| ID | Description | Severity |
|----|-------------|---------|
| PLO-RISK-001 | CCCFA reasonable inquiry: automated transaction analysis proposed as substitute for agent interview. Legal sign-off on whether this satisfies s.9C not yet obtained. | HIGH — go-live blocker |
| PLO-RISK-002 | Centrix DSA coverage: existing Centrix agreement covers mortgage applications only. Personal lending use case may require a new or amended DSA before bureau queries can be made. Legal confirmation required. | HIGH — go-live blocker |
| PLO-RISK-003 | Automated decision boundary: $30,000 threshold set operationally — not reviewed against CCCFA obligations or FMA expectations for automated credit decision scope. | MEDIUM |

---

## Application Profile 2 — Credit Decisioning Model

**Name:** Credit Decisioning Model
**Owner:** Credit Risk, the enterprise
**Domain:** Lending / Credit Risk
**Classification:** Regulated — FMA algorithmic fairness oversight
**Criticality:** HIGH — determines credit access for retail customers
**Data classification:** Restricted — model inputs include customer PII and bureau data; outputs are credit decisions

**Description:**
Internal logistic regression model built 3 years ago on 5 years of historical lending data. Produces APPROVE/REFER/DECLINE outputs with a risk score for personal loan applications. Has not been retrained since original build. Has not been validated by an independent model validator. An internal model performance review conducted 8 months ago identified statistically different approval rates across demographic groups (12% difference between Māori and Pākehā applicants at the same income band). The finding was documented internally and not escalated or disclosed externally.

**Hosting:** On-premises model serving infrastructure
**Technology stack:** Python (scikit-learn logistic regression), REST API wrapper, internal model registry
**Environments:** Production, Development

---

## Interface Map — Credit Decisioning Model

### Inputs (consumed by model)

| Interface ID | Source | Data type | Notes |
|-------------|--------|-----------|-------|
| CDM-IN-001 | Personal Lending Origination Platform | Application data: loan amount, purpose, term, customer income declaration | |
| CDM-IN-002 | Core Banking Transaction API (via PLO) | 12-month transaction history for affordability scoring | |
| CDM-IN-003 | Centrix Bureau API (via PLO) | Credit bureau data: score, defaults, existing obligations | |

### Outputs

| Interface ID | Consumer | Output | Notes |
|-------------|---------|--------|-------|
| CDM-OUT-001 | Personal Lending Origination Platform | Decision: APPROVE/REFER/DECLINE; risk score (0–1000); decision rationale text | |

### Regulatory obligations affecting this application

| Obligation | Regulator | Relevant provision |
|-----------|-----------|------------------|
| FMA algorithmic fairness — model must not produce materially different outcomes across demographic groups; independent validation expected before use in automated decisions | FMA | FMA Algorithmic Accountability Guidance (2023); Fair Trading Act 1986 |
| CCCFA — model outputs must represent a genuine assessment of the customer's creditworthiness and not be discriminatory | FMA / MBIE | CCCFA responsible lending principles |
| Model governance — changes to model logic or retraining require credit risk committee sign-off and regulatory disclosure where material | Internal policy / FMA expectation | Model Risk Management Policy |

### Known constraints and risks

| ID | Description | Severity |
|----|-------------|---------|
| CDM-RISK-001 | Demographic disparity: internal review (8 months ago) found 12% approval rate difference between Māori and Pākehā applicants at same income band. Finding not escalated. Model has not been remediated or independently validated since finding. | CRITICAL — regulatory and reputational risk |
| CDM-RISK-002 | No independent validation: model has not been validated by an independent model validator since original build 3 years ago. FMA expects independent validation for models used in automated credit decisions. | HIGH |
| CDM-RISK-003 | Model staleness: model trained on data from 3–8 years ago. No retraining cycle defined. Performance on current customer population unknown. | HIGH |

---

## Application Profile 3 — Centrix Bureau API (External Integration)

**Name:** Centrix Bureau API
**Owner:** Centrix (external provider)
**Domain:** Credit Bureaux / External Data
**Classification:** External — regulated data provider
**Criticality:** HIGH (for credit decisions that depend on bureau data)
**Data classification:** Restricted — customer credit history, defaults, credit obligations (third-party data)

**Description:**
New Zealand credit bureau API providing credit reports for individual customers. The enterprise has an existing commercial and data-sharing agreement with Centrix covering mortgage applications. That agreement does not currently cover personal lending use cases. A new or amended DSA is required before bureau queries can be made for personal loan applications.

**Hosting:** Centrix-managed (external SaaS)
**Environments:** Production (mortgage use case active), Development (personal lending not yet provisioned)

---

## Interface Map — Centrix Bureau API

| Interface ID | Application | Interface type | Data returned | Access control |
|-------------|-------------|---------------|--------------|----------------|
| CBA-EXT-001 | Personal Lending Origination Platform | External REST API — pull | Credit report: credit score, defaults, judgments, existing credit facilities, repayment history | Existing API key (mortgage DSA scope); personal lending scope requires DSA amendment |

### Known constraints and risks

| ID | Description | Severity |
|----|-------------|---------|
| CBA-RISK-001 | DSA scope: current data-sharing agreement covers mortgage applications. Personal lending is a materially different use case. Legal must confirm whether personal lending queries are in scope, or a DSA amendment/new agreement is required before bureau queries for personal loans can begin. | HIGH — go-live blocker |
| CBA-RISK-002 | Privacy Act compliance: bureau data constitutes sensitive personal information. Use of bureau data for personal lending requires that customers are informed of this at the time of application and that the use is proportionate to the lending decision purpose. | MEDIUM |

---

## Dependencies

**Personal Lending Origination Platform depends on:**
- Core Banking Transaction API — for transaction history
- Centrix Bureau API — for credit bureau data (DSA amendment required)
- Credit Decisioning Model — for automated decision output
- Dynamics 365 CRM — for analyst queue (REFER pathway)

**Credit Decisioning Model depends on:**
- Data provided by the Personal Lending Origination Platform (bureau + transaction data)
