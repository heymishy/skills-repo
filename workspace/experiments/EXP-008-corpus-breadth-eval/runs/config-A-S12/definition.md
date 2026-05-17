# Definition: Credit Risk Model Retraining — MRM Policy Governance and FMA Fairness Compliance

**Status:** Complete (eval-mode — EXP-008-corpus-breadth-eval / Config A / S12)
**Feature slug:** credit-risk-model-retraining
**Date:** 2026-05-18
**Skill version:** /definition
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S12

**Source discovery:** `runs/config-A-S12/discovery.md` (read from disk before this stage)

---

## Slicing strategy

**Chosen: Regulatory gate sequencing.** The retraining project has five governance gates that must be satisfied in a defined sequential order before production deployment can proceed. Slicing by regulatory gate ensures that each story enforces a hard dependency — no story is "completable" in isolation without its predecessor gate being cleared. This mirrors the mandatory sequential structure of the MRM Policy v2.0 governance process and ensures the C5 independent validation requirement is enforced as an explicit dependency on the MRM committee submission story.

Gate sequence:
1. FMA fairness assessment (must precede independent validation package)
2. CCCFA responsible lending legal confirmation (can run parallel with independent validation)
3. Explainability compliance confirmation (can run parallel with independent validation)
4. Independent validation (must precede MRM committee submission)
5. MRM committee submission and approval (must precede staging)
6. Staging integration test (must precede production deployment)

---

## Architecture constraints (for propagation into story ACs and DoR gates)

| ID | Constraint | Responsible party | Enforcement mechanism |
|----|-----------|------------------|----------------------|
| AC-MRM-001 | Independent validation report from the internal MRM validation team (reporting to CRO, organisationally separate from development) must be signed and referenced before any MRM committee submission | CRO / Head of Model Risk | `independent_validation_reference` field non-empty in MLflow CRMP-MOD-001 v3.0 registry entry before committee package upload to CRMP-GOV-002 |
| AC-MRM-002 | FMA Algorithmic Fairness Framework (2024) is the prescribed fairness methodology; internal disparity metric v1.2 is not an acceptable substitute for regulatory purposes under MRM Policy v2.0 Part 5.3 | Head of Model Risk / Credit Risk Technology Lead | FAR must document FMA 2024 methodology, all 5 protected characteristics, all 3 prescribed metrics, disparity results, and any remediation actions; FAR-reference field populated in deployment manifest |
| AC-CCCFA-001 | Legal Counsel written opinion confirming CCCFA responsible lending compliance for CLIRM v3.0 required before production deployment | Legal Counsel | `cccfa_legal_opinion_reference` field non-empty in deployment manifest before production deployment |
| AC-EXPL-001 | FMA-standard customer-facing plain-language explanation capability for credit decisions must be implemented and Legal Counsel must confirm FMA algorithmic accountability compliance before production deployment | Legal Counsel / Head of Customer Experience | `fma_explanation_compliance_confirmed` boolean true in deployment manifest before production deployment |
| AC-PROD-001 | MRM committee approval reference (format MRM-YYYY-QX-NNN) required before staging integration tests begin | MRM Committee Chair | `mrm_committee_approval_reference` field non-empty in deployment manifest before staging environment pipeline starts |

---

## Epic 1 — FMA Fairness Compliance

**Goal:** Produce a fairness assessment for CLIRM v3.0 using the FMA Algorithmic Fairness Framework (2024) prescribed methodology, replacing the non-compliant internal disparity metric v1.2 assessment, satisfying C1 (FMA fairness methodology) and the MRM Policy v2.0 Part 5.3 requirement.

### Story 1.1 — FMA Algorithmic Fairness Assessment for CLIRM v3.0

**As a** Credit Risk Technology team,
**I want** to re-assess the retrained CLIRM v3.0 for demographic disparity using the FMA Algorithmic Fairness Framework (2024) prescribed methodology,
**So that** the Fairness Assessment Report (FAR) satisfies FMA regulatory requirements and MRM Policy v2.0 Part 5.3, replacing the non-compliant internal disparity metric v1.2 assessment.

**Acceptance criteria:**
AC1: The fairness assessment covers all five FMA-prescribed protected characteristics: gender, age (using 5-year age bands consistent with Statistics New Zealand classification), ethnicity (using Statistics New Zealand Level 1 ethnicity categories: Māori, Pacific peoples, Asian, European/Pākehā, MELAA, Other), disability status (binary disclosed/not-disclosed field), and region (using NZ territorial authority). Any data availability gaps are documented in the FAR with assessment of impact on completeness.
AC2: The assessment measures all three FMA-prescribed fairness metrics for each protected characteristic: demographic parity (equal credit limit increase approval rates across groups), equalised odds (equal true positive rate and equal false positive rate across groups), and calibration (equal predicted probability to actual credit behaviour rates across groups). Metric calculations are implemented using a validated Python fairness library (e.g. fairlearn ≥ 0.9 or aif360 ≥ 0.5) with library name and version recorded in the FAR methodology section.
AC3: Disparity results are recorded for each combination of protected characteristic and fairness metric. Where disparity exceeds 5 percentage points on any prescribed metric for any protected characteristic, the finding is classified as a threshold breach and one of the following must be documented: (a) model adjustment to reduce disparity with a re-assessment confirming the threshold is no longer exceeded; or (b) CRO written sign-off and Legal Counsel written sign-off confirming the disparity is attributable to a lawful risk differential rather than unlawful discrimination, with the documentation retained for regulatory review. No deployment proceeds with an unresolved threshold breach.
AC4: The FAR is produced in the format required by MRM Policy v2.0 Part 5.4, explicitly identifies the FMA Algorithmic Fairness Framework (2024) as the prescribed methodology applied, records the prior assessment methodology (internal disparity metric v1.2) and the reason for the methodology upgrade, and is reviewed and signed by the Credit Risk Technology Lead before submission to the MRM validation team.
AC5: The completed FAR is registered in the MLflow experiment record for CRMP-MOD-001 v3.0. The FAR reference ID (format FAR-YYYY-xxx) is recorded in both the MLflow model registry field `fairness_assessment_reference` and the deployment manifest field `fma_fairness_assessment_reference`.

---

### Story 1.2 — CCCFA Responsible Lending Legal Confirmation

**As a** Head of Retail Credit,
**I want** to obtain a Legal Counsel written opinion confirming whether the retrained CLIRM v3.0's recommendation outputs satisfy CCCFA responsible lending obligations,
**So that** the enterprise has documented legal basis for deploying the retrained model and the C3 (CCCFA) constraint identified at discovery is formally resolved before MRM committee submission.

**Acceptance criteria:**
AC1: Legal Counsel reviews the retrained CLIRM v3.0's recommendation outputs, the credit policy rules that sit above the model, and the credit team's position that responsible lending obligations are satisfied by those policy rules. The scope of the review is documented in the written opinion.
AC2: The Legal Counsel written opinion either: (a) confirms that CLIRM v3.0's recommendation outputs are consistent with CCCFA responsible lending obligations (ss. 9C, 9I, and 17), specifying the legal basis for the conclusion and any conditions relied upon; or (b) identifies specific conditions or model changes required before the conclusion can be given, with those conditions specified in writing.
AC3: If AC2(b) applies, each identified condition is resolved and a supplementary Legal Counsel confirmation of resolution is obtained before the condition is marked resolved. No MRM committee submission package is assembled without the supplementary confirmation where conditions were raised.
AC4: The written opinion (and any supplementary confirmations under AC3) is retained as a governance artefact. The reference ID is recorded as `cccfa_legal_opinion_reference` in the deployment manifest. The reference ID is non-empty before staging integration begins.

---

## Epic 2 — MRM Governance: Independent Validation and Committee Approval

**Goal:** Satisfy the 2023 MRM Policy v2.0 governance requirements for credit model retraining — complete independent validation (C2 / C5) and obtain MRM committee approval (C2) — before staging begins.

### Story 2.1 — Independent Validation Engagement and Completion

**As a** CRO,
**I want** to engage the internal MRM validation team to perform an independent validation of CLIRM v3.0 before MRM committee submission,
**So that** the project satisfies the mandatory independent validation requirement introduced in MRM Policy v2.0 Part 3.2 (effective 1 July 2023) — the specific governance gap identified as the [BLOCKER] at discovery — and the retrained model is not submitted to the MRM committee without the required sign-off.

**Acceptance criteria:**
AC1: The independent validation is conducted by a team organisationally separate from the Credit Risk Technology development team (reporting to CRO, not to the model development function), satisfying the MRM Policy v2.0 Part 1.2 definition of independent validation. The engagement scope is formalised in writing by the Head of Model Risk before validation commences. No validation proceeds without a written scope agreement.
AC2: The independent validation report addresses all six required areas from MRM Policy v2.0 Part 2.2: (a) methodology soundness — algorithm selection rationale, training data representativeness for the 2024-01 to 2025-12 window, feature selection justification; (b) data quality and representativeness — training dataset completeness, feature distribution consistency, post-COVID population shift assessment; (c) model performance — Gini coefficient on independent holdout dataset, PSI on input feature distribution (threshold 0.25), KS statistic; (d) fairness assessment — review of FAR from Story 1.1, confirmation that FMA Algorithmic Fairness Framework 2024 methodology was applied correctly; (e) documentation completeness — model card, feature engineering documentation, training pipeline documentation, data lineage; (f) regulatory alignment — MRM Policy v2.0, FMA Algorithmic Fairness Framework 2024, CCCFA responsible lending.
AC3: The independent validation report contains a pass/fail determination on each of the six required areas and an overall recommendation: approve, approve with conditions, or reject. Where conditions are imposed, the conditions are specified in writing with resolution criteria and a deadline. No model proceeds to MRM committee submission with an unresolved fail determination or unresolved condition past its deadline.
AC4: The completed and signed independent validation report is uploaded to CRMP-GOV-002 (MRM Committee SharePoint) by the Head of Model Risk. The reference ID (`independent_validation_reference`) is recorded in the MLflow CRMP-MOD-001 v3.0 registry entry and the deployment manifest. The `independent_validation_reference` field is non-empty before the MRM committee submission package is assembled.
AC5: The FMA fairness assessment (Story 1.1 — FAR reference) and CCCFA legal opinion (Story 1.2) are both completed and their reference IDs are recorded in the deployment manifest before the independent validation engagement formally begins. This sequencing ensures the independent validation report can reference both documents as pre-existing governance artefacts.

---

### Story 2.2 — MRM Committee Submission and Approval

**As a** Credit Risk Technology team,
**I want** to submit the complete model validation package to the MRM committee and obtain formal approval before staging begins,
**So that** the CLIRM v3.0 deployment satisfies the MRM Policy v2.0 governance requirement (C2) and the model does not enter production without the committee approval gate being cleared.

**Acceptance criteria:**
AC1: The model validation package submitted to the MRM committee is complete and includes all five mandatory components: (i) the independent validation report with signed cover page (Story 2.1); (ii) the FMA Algorithmic Fairness Framework 2024 fairness assessment report (Story 1.1); (iii) the CCCFA responsible lending legal opinion (Story 1.2); (iv) the explainability compliance confirmation (Story 3.1 AC3); and (v) the model card documenting CLIRM v3.0 training data window, performance metrics (Gini, PSI, KS), intended use, and feature set. The committee package is uploaded to CRMP-GOV-002 before the committee meeting at which the model is to be reviewed.
AC2: The MRM committee reviews the package at a scheduled meeting and issues one of three outcomes: approval, approval with conditions, or rejection. The outcome and its rationale are documented in the MRM committee meeting minutes. No outcome other than these three is valid.
AC3: An MRM committee approval reference (format MRM-YYYY-QX-NNN) is issued by the MRM Committee Chair upon approval. The reference is recorded in: (a) the MLflow model registry under CRMP-MOD-001 v3.0 in field `mrm_committee_approval_reference`; (b) the deployment manifest field `mrm_committee_approval_reference`; and (c) the CRMP-GOV-002 SharePoint meeting record.
AC4: No staging integration test begins until the `mrm_committee_approval_reference` field is non-empty in the deployment manifest. This is a hard sequencing gate.
AC5: If the committee issues approval with conditions, all conditions are resolved and the MRM Committee Chair issues written confirmation of condition resolution before the `mrm_committee_approval_reference` is recorded and staging begins.

---

## Epic 3 — Explainability Compliance

**Goal:** Implement a customer-facing plain-language explanation capability for CLIRM v3.0 credit limit increase recommendations that satisfies C4 (FMA algorithmic accountability and CCCFA s.9I explanation requirements).

### Story 3.1 — FMA-Compliant Customer-Facing Explanation Capability

**As a** credit card customer,
**I want** to be able to request a plain-language explanation of why I received (or did not receive) a credit limit increase recommendation,
**So that** the enterprise satisfies its FMA algorithmic accountability obligation and CCCFA s.9I obligation to provide explanations of automated credit decisions on request.

**Acceptance criteria:**
AC1: For each CLIRM v3.0 credit limit increase recommendation output, an explanation payload is generated alongside the recommendation. The explanation is expressed in plain language (language understandable by a customer without financial or technical expertise) and does not expose SHAP values, internal feature names (e.g. `delinquency_30d_flag`, `utilisation_ratio_6m_avg`), model architecture details, or probability scores directly.
AC2: The explanation identifies the top 3–5 factors that influenced the recommendation, expressed using customer-facing language (e.g. "your recent on-time repayment history", "how much of your current credit limit you are using", "changes in your spending activity over the past 6 months"). The mapping from internal SHAP feature names to customer-facing language descriptions is documented in a maintained feature-to-explanation mapping table, version-controlled alongside the model artefact.
AC3: Legal Counsel confirms in writing that the explanation format and content satisfy the FMA algorithmic accountability standard and CCCFA s.9I explanation obligation. The written confirmation is retained as a governance artefact and recorded as `fma_explanation_compliance_confirmed: true` in the deployment manifest. This confirmation must be obtained before the MRM committee submission package is assembled (Story 2.2 AC1(iv)).
AC4: The explanation capability is validated against a sample of 50 CLIRM v3.0 recommendation outputs in the model development environment (UAT phase), covering: approved recommendations (credit limit increase offered), declined recommendations (no increase offered), and borderline cases (recommendations near the decision threshold). The validation report confirms that each explanation correctly identifies the dominant factors for each case type and that no explanation exposes internal feature names or SHAP values.
AC5: The explanation payload is integrated into CRMP-OUT-001 (Credit Decisioning Engine API output schema) so that the plain-language explanation is returned alongside the recommendation and confidence score when CRMP-OUT-001 is consumed by downstream systems. The CRMP-OUT-001 API contract change is documented and the Credit Decisioning Engine consumer team is notified of the schema change before staging integration begins.

---

## Epic 4 — Staging Integration Test and Production Deployment

**Goal:** Validate CLIRM v3.0 in UAT/staging against all integration interfaces with all governance gates confirmed, then deploy to production.

### Story 4.1 — Staging Integration Test and Production Deployment

**As a** Credit Risk Technology team,
**I want** to validate CLIRM v3.0 in UAT/staging against all integration interfaces and deploy to production with all five governance gates confirmed in the deployment manifest,
**So that** the retrained model enters production with documented compliance against all MRM Policy v2.0, FMA, CCCFA, and explainability obligations (C1–C5).

**Acceptance criteria:**
AC1: The deployment manifest is completed with all five governance gate fields non-empty before staging integration begins: `independent_validation_reference` (Story 2.1), `mrm_committee_approval_reference` (format MRM-YYYY-QX-NNN; Story 2.2), `cccfa_legal_opinion_reference` (Story 1.2), `fma_explanation_compliance_confirmed: true` (Story 3.1), and `fma_fairness_assessment_reference` (format FAR-YYYY-xxx; Story 1.1). Any gate field that is empty at the time staging is requested must block the staging pipeline from proceeding.
AC2: Staging integration tests validate all six CRMP interfaces: CRMP-IN-001 (Core Banking Transaction API — batch input), CRMP-IN-002 (Credit Arrears System — batch input), CRMP-IN-003 (Loan Origination System — weekly batch bureau scores), CRMP-OUT-001 (Credit Decisioning Engine API — including plain-language explanation payload from Story 3.1), CRMP-OUT-002 (Customer Offers Platform — batch eligible account list), and CRMP-OUT-003 (Model Audit Log — all model inputs and outputs written with 7-year retention confirmed).
AC3: CLIRM v3.0 Gini coefficient on the UAT holdout dataset is ≥ 0.71. PSI on input feature distribution (comparing the UAT scoring population distribution to the 2024-01 to 2025-12 training data distribution) is ≤ 0.25. Both thresholds are confirmed before staging sign-off.
AC4: Model Audit Log (CRMP-OUT-003) records are verified for completeness: a sample of 100 UAT recommendation outputs is inspected to confirm all model inputs, the recommendation, the confidence score, and the plain-language explanation payload are present in each audit record. The 7-year retention policy is confirmed as configured for the CRMP-OUT-003 write target.
AC5: CLIRM v3.0 is registered in MLflow as version 3.0 with all five governance reference IDs populated (`independent_validation_reference`, `mrm_committee_approval_reference`, `fma_fairness_assessment_reference`, `cccfa_legal_opinion_reference`, `fma_explanation_compliance_confirmed`) before production deployment is initiated. The deployment is executed only after the MLflow registry record is complete.

---

## Step 4a — Scope accumulator

| MVP scope item (from discovery) | Covered by | Status |
|-------------------------------|-----------|--------|
| 1. FMA fairness assessment (FMA 2024 methodology) | Story 1.1 (AC1–AC5) | Covered |
| 2. CCCFA responsible lending legal confirmation | Story 1.2 (AC1–AC4) | Covered |
| 3. Independent validation engagement and completion | Story 2.1 (AC1–AC5) | Covered |
| 4. MRM committee submission and approval | Story 2.2 (AC1–AC5) | Covered |
| 5. Explainability compliance confirmation and implementation | Story 3.1 (AC1–AC5) | Covered |
| 6. Staging integration test and production deployment | Story 4.1 (AC1–AC5) | Covered |

**Out of scope (confirmed throughout definition):** Decision threshold changes, lending product term changes, retraining of CRMP-MOD-002/003, consumer-facing communications, CRMP infrastructure architecture changes. No story was added that extends beyond the discovery MVP. No scope drift detected.

**Sequencing gate enforced:** Story 2.1 AC5 requires Stories 1.1 and 1.2 to be complete before independent validation begins. Story 2.2 AC4 requires Story 2.1 to be complete before staging. Story 4.1 AC1 requires all five governance gate fields to be non-empty before staging pipeline runs.

---

```yaml
# CPF-TRACE
experiment_id: EXP-008-corpus-breadth-eval
config: A
story: S12
stage: /definition
model: claude-sonnet-4-6
constraints_propagated_to_stories:
  C1: ["Story 1.1 AC1-AC5 — FMA fairness methodology; 5 protected characteristics; 3 prescribed metrics; 5pp threshold; FAR reference in manifest"]
  C2: ["Story 2.1 AC1-AC5 — independent validation; organisational separation; 6 required areas; sign-off gate; Story 2.2 AC1-AC5 — MRM committee submission; approval reference format; staging gate"]
  C3: ["Story 1.2 AC1-AC4 — CCCFA responsible lending Legal Counsel written opinion; conditions resolution path; reference in manifest"]
  C4: ["Story 3.1 AC1-AC5 — explainability capability; plain-language; no SHAP exposure; Legal Counsel confirmation; CRMP-OUT-001 integration"]
  C5: ["Story 2.1 AC1 — organisational independence confirmed; Story 2.1 AC4 — independent_validation_reference gate; Story 2.2 AC4 — staging blocked on approval reference; Story 4.1 AC1 — all 5 gate fields required"]
c5_propagated: true
scope_accumulator_pass: true
step_4a_complete: true
architecture_constraints_named: true
responsible_parties_in_stories: true
deployment_manifest_gates_defined: true
```
