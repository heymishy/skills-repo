# Synthetic EA Registry Entry
# Application: Credit Risk Model Platform (the enterprise)
# Registry version: 2026-Q1
# Status: ACTIVE — production system; retraining project in planning
# Entry type: Internal Application (AI/ML model)

---

## Application Profile

**Name:** Credit Risk Model Platform
**Owner:** Credit Risk Technology, the enterprise
**Domain:** Credit Risk / Retail Lending
**Classification:** Regulated — CCCFA (credit decisions), FMA fairness obligations, the enterprise MRM Policy (2023 edition)
**Criticality:** HIGH — drives automated credit limit increase decisions for ~400,000 credit card accounts
**Data classification:** Restricted — customer credit risk scores, model input features, decision outputs

**Description:**
Internal AI/ML platform hosting the models used for automated credit product decisions. Currently hosts: credit limit increase recommendation model (credit cards), arrears propensity model (early collections targeting), and a pre-approved personal loan eligibility model. Models are registered in the model registry with associated metadata: training date, training dataset version, validation report reference, MRM committee approval record, deployment approval record, and fairness assessment report.

**Hosting:** Internal (on-premises GPU infrastructure)
**Technology stack:** Python (scikit-learn, XGBoost), Jupyter notebooks for development, MLflow (model registry and experiment tracking), internal batch scoring pipeline (daily scoring run for credit card portfolio)
**Environments:** Production, Model Development (isolated), UAT (model validation environment)

---

## Model registry

### Credit Limit Increase Recommendation Model (CLIRM)

| Field | Value |
|-------|-------|
| Model ID | CRMP-MOD-001 |
| Version in production | v2.1 |
| Training dataset | 2021-01 to 2022-12 transaction history |
| Deployment date | 2024-03 |
| Gini coefficient (at deployment) | 0.71 |
| Gini coefficient (latest holdout evaluation) | 0.63 |
| MRM committee approval reference | MRM-2024-Q1-007 |
| Fairness assessment reference | FAR-2024-Q1-007 |
| Fairness methodology used | the enterprise Internal Disparity Metric v1.2 |
| FMA prescribed fairness methodology | **FMA Algorithmic Fairness Framework (2024)** — applied to all models making credit decisions on individuals |
| Fairness methodology alignment status | **MISALIGNED — internal metric does not implement the FMA 2024 framework; a re-assessment using the FMA methodology is required before retraining** |

**Retraining project status:** Project being taken to discovery. Target: retrain on 2024-01 to 2025-12 transaction history. New training window expected to restore Gini to ~0.71. Fairness re-assessment required.

---

## Interface map

### Inputs to model scoring

| Interface ID | Application | Interface type | Data transferred |
|-------------|-------------|---------------|-----------------|
| CRMP-IN-001 | Core Banking Transaction API | Internal batch (daily) | 24-month transaction history, repayment history, utilisation patterns |
| CRMP-IN-002 | Credit Arrears System | Internal batch (daily) | Arrears flags, days-past-due |
| CRMP-IN-003 | Loan Origination System | Internal batch (weekly) | Bureau credit score at origination (for comparison baseline) |

### Outputs from model scoring

| Interface ID | Application | Interface type | Data transferred |
|-------------|-------------|---------------|-----------------|
| CRMP-OUT-001 | Credit Decisioning Engine | Internal API | Credit limit increase recommendation + confidence score per account |
| CRMP-OUT-002 | Customer Offers Platform | Internal batch | Eligible accounts flagged for proactive credit limit offer |
| CRMP-OUT-003 | Model Audit Log | Internal write | All model inputs/outputs logged for regulatory auditability; 7-year retention |

### Governance interfaces

| Interface ID | Application | Interface type | Purpose |
|-------------|-------------|---------------|---------|
| CRMP-GOV-001 | MLflow Model Registry | Internal | Register trained models, store experiment metadata, version artifacts |
| CRMP-GOV-002 | MRM Committee SharePoint | Internal (manual) | Submit model validation reports for MRM committee review |
| CRMP-GOV-003 | Model Risk Dashboard | Internal (read) | Executive view of model health indicators across the portfolio |

---

## Regulatory obligations

| Obligation | Regulator | Detail |
|-----------|-----------|--------|
| CCCFA — algorithmic credit decisions must be explainable on request | MBIE / Financial Commerce Commission (FCA) | Each credit decision must be explainable in plain terms if the customer requests a reason for a declined or reduced offer |
| FMA Algorithmic Fairness Framework (2024) — models making lending decisions on individuals must be assessed for demographic disparity using the FMA prescribed methodology | FMA | Applies to new model deployment AND to retraining of existing models under 2023 MRM Policy update (see MRM Policy excerpt) |
| the enterprise Model Risk Management Policy (2023 edition) — full independent validation required for credit model retraining | Internal (risk policy) | The 2023 MRM Policy update expanded "full independent validation" scope from new deployments only to include retraining of credit models; pre-2023 process (MRM committee review only) is no longer sufficient |

---

## Governance risk: Policy version mismatch

**Flag:** MRM governance process version applicable to this retrain has not been confirmed with the MRM team — the 2023 policy update introduced changes to the retraining governance requirements; project team should confirm which version applies before submitting.

**Status of FMA fairness methodology alignment:** The model's current FAR (Fairness Assessment Report FAR-2024-Q1-007) was produced using the internal the enterprise disparity metric v1.2, not the FMA Algorithmic Fairness Framework published in 2024. For the retrained model, a fairness assessment using the FMA-prescribed methodology is required before deployment approval. If the retraining project does not update the fairness methodology, the fairness report will not satisfy regulatory scrutiny.

---

## Known constraints and risks

| ID | Description | Severity |
|----|-------------|---------|
| CRMP-RISK-001 | MRM governance process version applicable to this retrain has not been confirmed with the MRM team — the 2023 policy update introduced changes to the retraining governance requirements; project team should confirm which version applies before submitting | HIGH |
| CRMP-RISK-002 | Fairness methodology misalignment — internal disparity metric does not implement FMA 2024 Algorithmic Fairness Framework; retraining fairness assessment must use FMA methodology | HIGH |
| CRMP-RISK-003 | Gini drift monitoring — current 0.63 holdout Gini is below the 0.65 internal threshold for production model health; daily batch scoring output should be flagged until retraining is complete | MEDIUM |

---

## Dependencies

**This application depends on:**
- Core Banking Transaction API (input features)
- Credit Arrears System (arrears flags)
- Loan Origination System (origination bureau scores)
- MLflow Model Registry (model versioning)
- MRM Committee governance process

**Applications that depend on this application:**
- Credit Decisioning Engine (real-time recommendation consumption)
- Customer Offers Platform (proactive offer targeting)
- Model Audit Log (regulatory retention)
