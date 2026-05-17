# Test Plan: Credit Risk Model Retraining — MRM Policy Governance and FMA Fairness Compliance

**Status:** Complete — 30 tests covering all 5 constraints
**Feature slug:** credit-risk-model-retraining
**Date:** 2026-05-18
**Skill version:** /test-plan
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S12

**Source artefacts read from disk before this stage:**
- `runs/config-A-S12/discovery.md`
- `runs/config-A-S12/definition.md`
- `runs/config-A-S12/review.md`

**Review findings addressed in this test plan:** H1 (T-DEPLOY-001), H2 (T-IV-005), H3 (T-EXPL-005), D1 (T-FAIR-005)

---

## Test category summary

| Category | Tests | Constraints covered |
|---------|-------|-------------------|
| FMA Fairness Assessment (C1) | T-FAIR-001 to T-FAIR-006 | C1 |
| Independent Validation (C2, C5) | T-IV-001 to T-IV-005 | C2, C5 |
| MRM Committee (C2, C5) | T-MRM-001 to T-MRM-004 | C2, C5 |
| CCCFA Responsible Lending (C3) | T-CCCFA-001 to T-CCCFA-003 | C3 |
| Explainability Compliance (C4) | T-EXPL-001 to T-EXPL-005 | C4 |
| Staging and Deployment (C2, C5 gates) | T-DEPLOY-001 to T-DEPLOY-005 | C2, C5 |
| Audit Log | T-AUDIT-001 to T-AUDIT-003 | C2, C4 |
| NFR | T-NFR-001 to T-NFR-004 | All |

---

## FMA Fairness Assessment tests (C1)

### T-FAIR-001 — Five protected characteristics coverage

**Story:** 1.1 AC1
**Type:** Unit / data validation
**Constraint:** C1 (FMA Algorithmic Fairness Framework 2024)
**What it tests:** The FAR covers all five FMA-prescribed protected characteristics.

**Given** the completed FAR document for CLIRM v3.0,
**When** the FAR's protected characteristics table is inspected,
**Then** the following characteristics are all present with non-empty disparity results: gender, age (5-year bands per Statistics NZ), ethnicity (Statistics NZ Level 1 categories: Māori, Pacific peoples, Asian, European/Pākehā, MELAA, Other), disability status (binary disclosed/not-disclosed), region (NZ territorial authority).
**And** the FAR explicitly identifies any characteristic where data availability was insufficient, with a documented assessment of impact on completeness.

---

### T-FAIR-002 — Three prescribed fairness metrics measured for each characteristic

**Story:** 1.1 AC2
**Type:** Unit / computation validation
**Constraint:** C1 (FMA Algorithmic Fairness Framework 2024)
**What it tests:** All three FMA-prescribed fairness metrics are computed for each protected characteristic.

**Given** the CLIRM v3.0 model outputs on the holdout dataset (n ≥ 10,000),
**When** the fairness computation is run for a given protected characteristic,
**Then** three metric results are produced: demographic parity (difference in credit limit increase approval rates between the advantaged and disadvantaged group), equalised odds (difference in true positive rate + false positive rate between groups), and calibration (maximum absolute difference in predicted probability to actual approval rate across groups).
**And** each metric is computed using either fairlearn ≥ 0.9 or aif360 ≥ 0.5, with the library name and version recorded.
**And** metric results are recorded for all five protected characteristics.

---

### T-FAIR-003 — 5 percentage point threshold trigger

**Story:** 1.1 AC3
**Type:** Integration / governance gate
**Constraint:** C1 (FMA Algorithmic Fairness Framework 2024)
**What it tests:** Any disparity result exceeding 5pp is classified as a threshold breach and the breach is not suppressed or treated as acceptable without documentation.

**Given** a protected characteristic where demographic parity disparity is computed as 6.2pp (exceeding the 5pp threshold),
**When** the FAR breach classification logic runs,
**Then** the finding is classified as "threshold breach" in the FAR results table.
**And** the FAR includes a resolution path: either (a) model adjustment with a re-assessment result confirming the threshold is no longer exceeded, or (b) a CRO written sign-off and Legal Counsel written sign-off confirming lawful risk differential, with reference IDs for both sign-offs recorded in the FAR.
**And** the deployment manifest pre-flight check rejects the manifest if `fma_fairness_assessment_reference` points to a FAR with an unresolved threshold breach.

---

### T-FAIR-004 — FAR format and methodology documentation

**Story:** 1.1 AC4
**Type:** Document validation
**Constraint:** C1 (FMA Algorithmic Fairness Framework 2024)
**What it tests:** The FAR explicitly identifies FMA 2024 as the methodology, documents the prior methodology (internal disparity metric v1.2), and is signed by the Credit Risk Technology Lead before submission.

**Given** the completed FAR,
**When** the FAR methodology section is inspected,
**Then** the FAR explicitly names "FMA Algorithmic Fairness Framework (2024)" as the prescribed methodology applied.
**And** the FAR documents the prior assessment methodology as "internal disparity metric v1.2" and records the reason for the methodology upgrade (regulatory compliance with FMA 2024 standard and MRM Policy v2.0 Part 5.3).
**And** the FAR contains a signed cover page from the Credit Risk Technology Lead with a date of signature before the independent validation engagement start date.

---

### T-FAIR-005 — Threshold breach option (b) sign-off required before FAR reference accepted (H1/D1 resolution)

**Story:** 1.1 AC3, 4.1 AC1
**Type:** Integration / governance gate
**Constraint:** C1 (FMA Algorithmic Fairness Framework 2024)
**Resolves:** D1 (review finding — threshold breach remediation temporal constraint)
**What it tests:** The deployment manifest pre-flight check requires a CRO + Legal written sign-off reference to be present in the FAR before accepting the `fma_fairness_assessment_reference` where option (b) was used for breach resolution.

**Given** a FAR that contains a threshold breach record with resolution path option (b),
**When** the deployment manifest pre-flight check reads the FAR reference,
**Then** the check asserts that the FAR's threshold breach section includes both a `cro_sign_off_reference` and a `legal_counsel_sign_off_reference` for each breach resolved under option (b).
**And** if either sign-off reference is absent or empty, the pre-flight check fails with error: "Threshold breach resolution option (b) incomplete: CRO and Legal Counsel sign-off references required in FAR before manifest acceptance."
**And** the FAR with incomplete option (b) documentation prevents staging from proceeding.

---

### T-FAIR-006 — FAR reference recorded in manifest and MLflow

**Story:** 1.1 AC5
**Type:** Integration
**Constraint:** C1 (FMA Algorithmic Fairness Framework 2024)
**What it tests:** The FAR reference (format FAR-YYYY-xxx) is present in both the MLflow model registry and the deployment manifest.

**Given** the completed and signed FAR with reference ID FAR-2026-001,
**When** the Credit Risk Technology Lead records the FAR reference,
**Then** the MLflow CRMP-MOD-001 v3.0 model registry entry field `fma_fairness_assessment_reference` is set to "FAR-2026-001".
**And** the deployment manifest field `fma_fairness_assessment_reference` is set to "FAR-2026-001".
**And** both fields are non-empty before the independent validation engagement formally begins.

---

## Independent Validation tests (C2 / C5)

### T-IV-001 — Validator organisational independence confirmed

**Story:** 2.1 AC1
**Type:** Governance / process validation
**Constraint:** C2 (MRM Policy v2.0) / C5 (2023 update — independent validation mandatory)
**What it tests:** The independent validator is organisationally separate from the development team.

**Given** the independent validation engagement scope agreement,
**When** the validation team's reporting line is reviewed,
**Then** the engagement agreement documents that the validation team reports to the CRO (not to the model development function or Credit Risk Technology Lead).
**And** no member of the Credit Risk Technology development team is named as a validator or co-author of the independent validation report.

---

### T-IV-002 — Six required areas coverage in independent validation report

**Story:** 2.1 AC2
**Type:** Document validation
**Constraint:** C2 (MRM Policy v2.0 Part 2.2) / C5
**What it tests:** The independent validation report covers all six required areas from MRM Policy v2.0 Part 2.2.

**Given** the completed independent validation report,
**When** the report's section structure is inspected,
**Then** the report contains a dedicated section for each of the six required areas: (a) methodology soundness, (b) data quality and representativeness, (c) model performance (Gini, PSI, KS thresholds explicit), (d) fairness assessment (confirming FMA 2024 FAR methodology), (e) documentation completeness, (f) regulatory alignment (MRM Policy v2.0, FMA 2024, CCCFA).
**And** each section contains a pass/fail determination.

---

### T-IV-003 — Independent validation report sign-off by Head of Model Risk

**Story:** 2.1 AC2, AC3
**Type:** Governance validation
**Constraint:** C2 (MRM Policy v2.0) / C5
**What it tests:** The independent validation report is signed by the Head of Model Risk before being uploaded to CRMP-GOV-002.

**Given** the completed independent validation report,
**When** the signed cover page is inspected,
**Then** the report contains a signature from the Head of Model Risk with a date of signature.
**And** the date of signature is before the MRM committee submission package upload date in CRMP-GOV-002.

---

### T-IV-004 — Independent validation reference gate before committee submission

**Story:** 2.1 AC4
**Type:** Integration / governance gate
**Constraint:** C2 / C5 (C5 gate — independent validation mandatory before committee)
**What it tests:** The MRM committee submission package cannot be assembled without `independent_validation_reference` being non-empty.

**Given** a deployment manifest where `independent_validation_reference` is empty,
**When** the committee submission package assembly function is called,
**Then** the function raises an error: "Cannot assemble MRM committee submission package: independent_validation_reference is empty. Independent validation must be completed and signed before MRM committee submission."
**And** no committee package is uploaded to CRMP-GOV-002 until `independent_validation_reference` is non-empty.

---

### T-IV-005 — FAR revision path when independent validation identifies FAR material error (H2 resolution)

**Story:** 2.1 AC3
**Type:** Integration / governance gate
**Constraint:** C1, C2 (review finding H2 resolution)
**Resolves:** H2 (review finding — independent validation triggered FAR revision path not specified)
**What it tests:** If the independent validation report flags a material error in the FAR, the corrected FAR reference must be recorded before the independent validation report is signed off.

**Given** an independent validation report that includes a "FAR material error identified" flag with a description of the specific error (e.g. ethnicity calculation for Pacific peoples used wrong denominator),
**When** the pre-flight check reads the independent validation report and the deployment manifest,
**Then** the pre-flight check asserts that `fma_fairness_assessment_reference` in the deployment manifest points to a FAR version dated after the independent validation FAR error flag date.
**And** if the FAR reference points to the original FAR (predating the error flag), the pre-flight check fails with error: "Independent validation identified a FAR material error. A corrected FAR (fma_fairness_assessment_reference pointing to a post-correction version) is required before independent validation sign-off is accepted."

---

## MRM Committee tests (C2 / C5)

### T-MRM-001 — Complete committee package validated

**Story:** 2.2 AC1
**Type:** Integration / document validation
**Constraint:** C2 (MRM Policy v2.0) / C5
**What it tests:** All five mandatory package components are present before the package is uploaded to CRMP-GOV-002.

**Given** the committee submission package assembly is triggered,
**When** the package contents are validated,
**Then** all five components are present and non-empty: (i) independent validation report with signed cover page, (ii) FMA fairness assessment report, (iii) CCCFA responsible lending legal opinion, (iv) explainability compliance confirmation (Story 3.1 AC3 written confirmation from Legal Counsel), and (v) model card documenting training data window, performance metrics (Gini, PSI, KS), intended use, and feature set.
**And** if any component is absent, the package assembly fails with a specific error naming the missing component.

---

### T-MRM-002 — Approval reference format MRM-YYYY-QX-NNN

**Story:** 2.2 AC3
**Type:** Validation
**Constraint:** C2 / C5
**What it tests:** The MRM committee approval reference is in the required format.

**Given** an MRM committee approval reference string,
**When** the reference is validated by the deployment manifest pre-flight check,
**Then** the reference matches the regex pattern `^MRM-\d{4}-Q[1-4]-\d{3}$` (e.g. MRM-2026-Q3-001).
**And** if the format does not match, the pre-flight check fails with error: "mrm_committee_approval_reference format invalid. Expected MRM-YYYY-QX-NNN."

---

### T-MRM-003 — Approval reference recorded in three locations

**Story:** 2.2 AC3
**Type:** Integration
**Constraint:** C2 / C5
**What it tests:** The MRM committee approval reference is recorded in MLflow, the deployment manifest, and CRMP-GOV-002.

**Given** the MRM committee issues approval reference MRM-2026-Q3-001,
**When** the approval reference is recorded,
**Then** the MLflow CRMP-MOD-001 v3.0 registry field `mrm_committee_approval_reference` is set to "MRM-2026-Q3-001".
**And** the deployment manifest field `mrm_committee_approval_reference` is set to "MRM-2026-Q3-001".
**And** the CRMP-GOV-002 SharePoint meeting record for the relevant committee meeting includes the reference.

---

### T-MRM-004 — Staging blocked without approval reference

**Story:** 2.2 AC4
**Type:** Integration / governance gate
**Constraint:** C2 / C5 (C5 gate — critical constraint enforcement)
**What it tests:** The staging pipeline is blocked if `mrm_committee_approval_reference` is empty.

**Given** a deployment manifest where `mrm_committee_approval_reference` is empty (or null),
**When** the staging pipeline promotion is triggered,
**Then** the pipeline fails at the deployment manifest pre-flight check step with error: "Cannot promote to staging: mrm_committee_approval_reference is empty. MRM committee approval is required before staging integration begins."
**And** no batch scoring job is executed in the UAT/staging environment until the field is non-empty and passes the format check.

---

## CCCFA tests (C3)

### T-CCCFA-001 — Legal Counsel opinion scope covers retrained model

**Story:** 1.2 AC1
**Type:** Document validation
**Constraint:** C3 (CCCFA responsible lending)
**What it tests:** The Legal Counsel written opinion explicitly covers CLIRM v3.0 (the retrained model), not just the production v2.x policy framework.

**Given** the Legal Counsel written opinion,
**When** the scope section is inspected,
**Then** the opinion explicitly names CLIRM v3.0 (the retrained model) and the 2024-01 to 2025-12 training data window as within scope.
**And** the opinion references the CCCFA responsible lending obligations assessed: ss. 9C (duty to make reasonable enquiries), 9I (duty to provide information on request), and s.17 (irresponsible lending prohibition).

---

### T-CCCFA-002 — CCCFA reference non-empty in deployment manifest

**Story:** 1.2 AC4
**Type:** Integration / governance gate
**Constraint:** C3 (CCCFA responsible lending)
**What it tests:** The `cccfa_legal_opinion_reference` field is non-empty before staging begins.

**Given** a deployment manifest where `cccfa_legal_opinion_reference` is empty,
**When** the deployment manifest pre-flight check runs,
**Then** the check fails with error: "Cannot promote to staging: cccfa_legal_opinion_reference is empty. Legal Counsel CCCFA confirmation required before deployment."
**And** the field format must be a non-empty string (reference ID or document identifier).

---

### T-CCCFA-003 — Conditions under option (b) resolved before staging

**Story:** 1.2 AC2, AC3
**Type:** Integration
**Constraint:** C3 (CCCFA)
**What it tests:** If the Legal Counsel opinion raised conditions (AC2(b)), a supplementary confirmation of resolution is obtained and referenced before staging.

**Given** a Legal Counsel opinion that was issued with two conditions specified (e.g. "confirm that CLIRM v3.0 outputs are used only for credit limit increase decisions and not for new-to-bank credit assessment"),
**When** the deployment manifest pre-flight check reads the `cccfa_legal_opinion_reference`,
**Then** the check asserts that either (a) the opinion was issued unconditionally, or (b) the opinion was conditional and a supplementary Legal Counsel confirmation of condition resolution exists with reference ID also recorded in the deployment manifest.
**And** if option (b) applies and the supplementary confirmation is absent, the pre-flight check fails.

---

## Explainability tests (C4)

### T-EXPL-001 — Plain-language explanation — no SHAP or internal feature names

**Story:** 3.1 AC1
**Type:** Unit / content validation
**Constraint:** C4 (FMA algorithmic accountability / CCCFA s.9I)
**What it tests:** The explanation payload does not expose SHAP values, internal feature names, model architecture details, or probability scores.

**Given** a CLIRM v3.0 recommendation output with a plain-language explanation payload,
**When** the explanation payload text is scanned for prohibited content,
**Then** the payload does not contain any of the following: SHAP values (numeric floating-point values labelled as SHAP or feature importance), internal feature names (strings matching known internal names such as `delinquency_30d_flag`, `utilisation_ratio_6m_avg`, `income_stability_index`, `bureau_score_change_delta`), model architecture references (e.g. "gradient boosting", "decision tree", "XGBoost"), or raw probability scores (floating-point values in range [0.0, 1.0] without a clear customer-facing interpretation).
**And** the payload contains plain-language factor descriptions (e.g. "your recent on-time repayment history").

---

### T-EXPL-002 — 3–5 top factors in explanation

**Story:** 3.1 AC2
**Type:** Unit
**Constraint:** C4 (FMA algorithmic accountability)
**What it tests:** Each explanation payload contains between 3 and 5 top factors expressed in customer-facing language.

**Given** a CLIRM v3.0 recommendation output,
**When** the explanation payload's factor list is inspected,
**Then** the factor list contains between 3 and 5 items (inclusive).
**And** each item corresponds to an entry in the customer-facing feature-to-explanation mapping table.
**And** the mapping table is version-controlled alongside the CLIRM v3.0 model artefact in MLflow.

---

### T-EXPL-003 — Legal Counsel FMA explanation confirmation

**Story:** 3.1 AC3
**Type:** Governance / document validation
**Constraint:** C4 (FMA algorithmic accountability)
**What it tests:** Legal Counsel written confirmation of FMA explanation compliance is obtained before the MRM committee package is assembled.

**Given** the committee package assembly function,
**When** the package completeness check runs (T-MRM-001),
**Then** the package includes a Legal Counsel written confirmation (component iv) that explicitly: (a) confirms the explanation format and content satisfy FMA algorithmic accountability standard; (b) confirms CCCFA s.9I explanation obligation is satisfied; and (c) is signed and dated before the committee package upload date.
**And** the deployment manifest `fma_explanation_compliance_confirmed` field is set to `true`.

---

### T-EXPL-004 — 50-case UAT sample validation

**Story:** 3.1 AC4
**Type:** Integration / validation
**Constraint:** C4 (FMA algorithmic accountability)
**What it tests:** The 50-case UAT sample validates explanation correctness across approved, declined, and borderline recommendations.

**Given** a UAT explanation validation run over 50 CLIRM v3.0 recommendation outputs (minimum: 15 approved, 15 declined, 10 borderline, 10 randomly selected),
**When** each explanation payload is inspected by the Credit Risk Technology Lead against the corresponding model output,
**Then** each explanation correctly identifies the dominant SHAP factors (mapped to customer-facing language) for that specific recommendation.
**And** no explanation payload exposes internal feature names or SHAP values.
**And** the validation report records: total cases validated, pass/fail for each case type, and any cases where the explanation was factually incorrect with a description of the error.

---

### T-EXPL-005 — CRMP-OUT-001 explanation payload schema change validated in staging (H3 resolution)

**Story:** 3.1 AC5
**Type:** Integration
**Constraint:** C4 (FMA algorithmic accountability)
**Resolves:** H3 (review finding — CRMP-OUT-001 API contract change not covered)
**What it tests:** The Credit Decisioning Engine consumer correctly parses the new explanation payload field in the CRMP-OUT-001 schema; the consumer team was notified before staging.

**Given** a CRMP-OUT-001 response payload including the new `explanation` field (array of 3–5 plain-language factor strings),
**When** the Credit Decisioning Engine consumer processes the response,
**Then** the consumer correctly parses the `explanation` field and passes it downstream (e.g. to the customer-facing channel or audit log).
**And** a consumer that has not implemented the new field fails gracefully (e.g. logs a warning) rather than silently dropping the explanation or throwing an exception that causes the recommendation processing to fail.
**And** the Credit Decisioning Engine team's written acknowledgement of the schema change notification (issued before staging integration began) is on file as a staging prerequisite document.

---

## Staging and deployment tests (C2 / C5 governance gates)

### T-DEPLOY-001 — Automated pre-flight manifest check — all five gate fields enforced (H1 resolution)

**Story:** 4.1 AC1
**Type:** Integration / automated governance gate
**Constraint:** C2, C5 (C5 deployment gate)
**Resolves:** H1 (review finding — deployment manifest enforcement mechanism not specified)
**What it tests:** The automated pre-flight manifest check is implemented as code, reads the deployment manifest JSON, and asserts all five governance gate fields are non-empty before the staging pipeline proceeds.

**Given** a deployment manifest JSON with the following structure:
```json
{
  "independent_validation_reference": "...",
  "mrm_committee_approval_reference": "...",
  "cccfa_legal_opinion_reference": "...",
  "fma_explanation_compliance_confirmed": true,
  "fma_fairness_assessment_reference": "..."
}
```
**When** the pre-flight check script is run before the staging pipeline promotion step,
**Then** the script checks each of the five fields and passes only if all five are non-empty and non-null and `fma_explanation_compliance_confirmed` is boolean true.
**And** if any single field is empty or null, the script exits with a non-zero exit code and prints a specific error identifying the empty field (e.g. "GATE FAIL: independent_validation_reference is empty").
**And** the staging pipeline CI/CD job is configured to run this pre-flight check as a prerequisite step before any model promotion command is executed.
**And** test cases cover each of the five fields independently (5 test cases: one field empty each time, all other fields populated).

---

### T-DEPLOY-002 — Six CRMP interface integration tests pass in staging

**Story:** 4.1 AC2
**Type:** Integration
**Constraint:** All constraints (staging validation)
**What it tests:** All six CRMP integration interfaces are validated in staging.

**Given** the CLIRM v3.0 model deployed in the UAT/staging environment with all governance gates confirmed,
**When** the staging integration test suite runs,
**Then** all six CRMP interface tests pass: CRMP-IN-001 (batch input from Core Banking Transaction API — 100-record sample processed without error), CRMP-IN-002 (batch input from Credit Arrears System — 100-record sample processed), CRMP-IN-003 (weekly bureau score batch from Loan Origination System — 100-record sample processed), CRMP-OUT-001 (Credit Decisioning Engine API response including explanation payload — 100 recommendations validated), CRMP-OUT-002 (eligible account list batch to Customer Offers Platform — 100-record sample output verified), CRMP-OUT-003 (model audit log write — 100-record sample written with all required fields).

---

### T-DEPLOY-003 — Gini ≥ 0.71 on UAT holdout

**Story:** 4.1 AC3
**Type:** Performance threshold
**Constraint:** C2 (MRM Policy performance requirements)
**What it tests:** CLIRM v3.0 Gini coefficient on UAT holdout meets the 0.71 threshold.

**Given** the CLIRM v3.0 model evaluated on the UAT holdout dataset (n ≥ 5,000, time-period independent from training data),
**When** the Gini coefficient is computed,
**Then** the Gini coefficient is ≥ 0.71.
**And** if the Gini coefficient is < 0.71, the staging sign-off is blocked and the Head of Model Risk is notified of a performance regression.

---

### T-DEPLOY-004 — PSI ≤ 0.25 on input feature distribution

**Story:** 4.1 AC3
**Type:** Performance threshold
**Constraint:** C2 (MRM Policy population stability requirement)
**What it tests:** PSI on input feature distribution (UAT scoring population vs training data) does not exceed 0.25.

**Given** the CLIRM v3.0 model applied to the UAT scoring population,
**When** the Population Stability Index is computed on each input feature distribution (UAT vs 2024-01 to 2025-12 training distribution),
**Then** the overall PSI (aggregate across all features) is ≤ 0.25.
**And** individual features with PSI > 0.25 are flagged in the staging sign-off report for review by the Head of Model Risk.

---

### T-DEPLOY-005 — MLflow registry complete before production deployment

**Story:** 4.1 AC5
**Type:** Integration / governance gate
**Constraint:** C2, C5
**What it tests:** All five governance reference IDs are populated in the MLflow CRMP-MOD-001 v3.0 registry entry before production deployment is initiated.

**Given** the MLflow CRMP-MOD-001 v3.0 registry entry,
**When** the production deployment is requested,
**Then** the deployment pre-flight check reads the MLflow registry entry and asserts all five governance fields are non-empty: `independent_validation_reference`, `mrm_committee_approval_reference`, `fma_fairness_assessment_reference`, `cccfa_legal_opinion_reference`, and `fma_explanation_compliance_confirmed` (must be boolean true, not string).
**And** if any field is empty, the production deployment script exits with a non-zero exit code and reports which fields are missing.

---

## Audit log tests

### T-AUDIT-001 — All inputs, outputs, and explanation payload logged

**Story:** 4.1 AC4
**Type:** Integration
**Constraint:** C2 (audit trail), C4 (explanation traceability)
**What it tests:** Each CRMP-OUT-003 audit log record contains all required fields.

**Given** a sample of 100 CLIRM v3.0 recommendation outputs from the UAT/staging run,
**When** the corresponding CRMP-OUT-003 audit log records are retrieved,
**Then** all 100 records contain non-empty values for all required fields: model_version (CLIRM v3.0), timestamp, customer_id (masked), all model input features used, recommendation (increase/no increase), confidence_score, and explanation_payload (array of 3–5 plain-language factor strings).
**And** no record is missing the explanation_payload field.

---

### T-AUDIT-002 — 7-year retention policy configured

**Story:** 4.1 AC4
**Type:** Configuration validation
**Constraint:** C2 (regulatory audit trail retention)
**What it tests:** CRMP-OUT-003 write target is configured with 7-year retention.

**Given** the CRMP-OUT-003 audit log write target configuration,
**When** the retention policy is inspected,
**Then** the retention policy is set to a minimum of 7 years (2,555 days) from write date.
**And** the retention policy cannot be reduced without an explicit CRO sign-off on record.

---

### T-AUDIT-003 — Audit log record completeness across batch runs

**Story:** 4.1 AC4
**Type:** Integration
**Constraint:** C2 (audit trail completeness)
**What it tests:** Every recommendation output in a batch run has a corresponding audit log record.

**Given** a batch scoring run processing 1,000 accounts in staging,
**When** the audit log is inspected after the batch run,
**Then** 1,000 audit log records exist in CRMP-OUT-003 corresponding to the batch run (matched by batch_run_id and timestamp window).
**And** no account processed by the batch run is missing an audit log record.

---

## NFR tests

### T-NFR-001 — Batch scoring runtime within SLA

**Type:** Performance
**Constraint:** Non-functional
**What it tests:** CLIRM v3.0 batch scoring completes within the nightly batch processing window.

**Given** CLIRM v3.0 scoring a production-scale batch (500,000 accounts),
**When** the batch scoring job is timed in staging,
**Then** the total batch processing time (including all CRMP-IN and CRMP-OUT interface calls) is ≤ 4 hours.

---

### T-NFR-002 — Deployment manifest pre-flight check runtime

**Type:** Performance
**Constraint:** Non-functional
**What it tests:** The deployment manifest pre-flight check does not materially slow the CI/CD pipeline.

**Given** the pre-flight check script running against a complete deployment manifest,
**When** the script is timed,
**Then** the script completes in ≤ 5 seconds.

---

### T-NFR-003 — FMA fairness library version pinned

**Type:** Reproducibility
**Constraint:** Non-functional
**What it tests:** The fairness computation library version is pinned and recorded in the FAR.

**Given** the project's dependency manifest (requirements.txt or equivalent),
**When** the fairness library version is inspected,
**Then** the fairness library (fairlearn or aif360) is pinned to a specific minor version (e.g. fairlearn==0.9.0, not fairlearn>=0.9).
**And** the pinned version is consistent with the version recorded in the FAR methodology section.

---

### T-NFR-004 — Explanation payload generation latency

**Type:** Performance
**Constraint:** Non-functional (C4 — customer-facing requirement)
**What it tests:** Explanation payload generation does not materially increase batch scoring latency.

**Given** a batch scoring run of 10,000 accounts with explanation generation enabled,
**When** the per-account scoring time (including explanation generation) is measured,
**Then** the mean per-account scoring time with explanation generation is ≤ 150% of the mean per-account scoring time without explanation generation (i.e. explanation generation adds at most 50% to per-account scoring time).

---

## Plain-language AC verification script

This section is for human review before coding and for post-merge smoke testing.

1. **C1 — FMA Fairness (Story 1.1):** Confirm the FAR covers all five protected characteristics and all three fairness metrics. Check that any disparity > 5pp has a documented breach resolution. Check that the FAR names FMA 2024 as the methodology and is signed by the Credit Risk Technology Lead.

2. **C2 — Independent Validation (Story 2.1):** Confirm the validator is not part of the Credit Risk Technology team (check reporting line). Confirm the validation report covers all six required areas from MRM Policy v2.0 Part 2.2. Confirm each area has a pass/fail determination. Confirm the report is signed by the Head of Model Risk.

3. **C3 — CCCFA (Story 1.2):** Confirm Legal Counsel opinion names CLIRM v3.0 explicitly and references ss. 9C, 9I, and s.17 CCCFA. Confirm `cccfa_legal_opinion_reference` is non-empty in the deployment manifest.

4. **C4 — Explainability (Story 3.1):** Confirm the explanation payload for 5 sample recommendations contains 3–5 plain-language factors with no SHAP values or internal feature names visible. Confirm Legal Counsel FMA confirmation is on file.

5. **C5 — MRM Policy v2.0 Independent Validation Gate (Stories 2.1, 2.2, 4.1):** Confirm `independent_validation_reference` is non-empty in the deployment manifest before any staging run. Confirm `mrm_committee_approval_reference` is non-empty and in MRM-YYYY-QX-NNN format before staging begins. Run the pre-flight check script directly with a manifest where `mrm_committee_approval_reference` is empty and confirm the script exits with a non-zero code and a specific error message.

---

```yaml
# CPF-TRACE
experiment_id: EXP-008-corpus-breadth-eval
config: A
story: S12
stage: /test-plan
model: claude-sonnet-4-6
test_counts:
  c1_fair: 6
  c2_iv: 5
  c2_mrm: 4
  c3_cccfa: 3
  c4_expl: 5
  c2_c5_deploy: 5
  audit: 3
  nfr: 4
  total: 35
review_findings_resolved:
  H1: T-DEPLOY-001
  H2: T-IV-005
  H3: T-EXPL-005
  D1: T-FAIR-005
constraints_covered:
  C1: [T-FAIR-001, T-FAIR-002, T-FAIR-003, T-FAIR-004, T-FAIR-005, T-FAIR-006]
  C2: [T-IV-001, T-IV-002, T-IV-003, T-IV-004, T-IV-005, T-MRM-001, T-MRM-002, T-MRM-003, T-MRM-004]
  C3: [T-CCCFA-001, T-CCCFA-002, T-CCCFA-003]
  C4: [T-EXPL-001, T-EXPL-002, T-EXPL-003, T-EXPL-004, T-EXPL-005]
  C5: [T-IV-004, T-MRM-004, T-DEPLOY-001, T-DEPLOY-005]
c5_gate_tests: [T-IV-004 (independent_validation_reference gate), T-MRM-004 (mrm_committee_approval_reference staging gate), T-DEPLOY-001 (automated pre-flight check for all 5 fields), T-DEPLOY-005 (MLflow registry gate before production)]
plain_language_verification_script: true
```
