# Synthetic Policy Document — S12 Context Injection
# SYNTHETIC DOCUMENT — for EXP-003-pipeline-eval evaluation only
# Simulates excerpts from the enterprise Model Risk Management Policy (2023 edition).
# Does NOT represent any real organisation's policy. Version mismatch is the C5 hidden constraint signal.

---

# the enterprise Model Risk Management Policy
## Version: 2.0 — Effective 1 July 2023
## Policy Owner: Chief Risk Officer
## Previous version: 1.4 (January 2021) — superseded by this version

---

## Version history and key changes in version 2.0

| Version | Date | Key changes |
|---------|------|-------------|
| 1.0 | March 2018 | Initial policy — new model deployment validation requirements |
| 1.2 | June 2019 | Added fairness assessment requirement for consumer-facing models |
| 1.4 | January 2021 | Added quantitative monitoring thresholds; expanded ongoing monitoring section |
| **2.0** | **July 2023** | **Expanded independent validation scope to include model retraining; introduced FMA Algorithmic Fairness Framework alignment requirement for credit models; added retraining trigger thresholds; added third-party model obligation section** |

> **Important:** Version 1.4 (January 2021) is superseded in its entirety by this version. All validation processes and governance procedures must conform to version 2.0 as of 1 July 2023. Version 1.4 references in project documentation or model submissions are not compliant with this policy. Project teams should confirm which policy version applies to their model before initiating any governance process.

---

## Part 1 — Scope and Definitions

**1.1 Scope**
This policy applies to all models developed, procured, or operated by the enterprise that are used in:
(a) automated or assisted credit decisions affecting customers;
(b) regulatory capital calculations;
(c) pricing of financial products for individual customers;
(d) AML transaction monitoring and risk scoring;
(e) operational risk and fraud risk scoring.

"Model" includes any quantitative method, system, or approach that applies statistical, economic, financial, or mathematical theory, techniques, or assumptions to process inputs and derive outputs that inform business decisions.

**1.2 Definitions**

*New model deployment:* First production deployment of a model that was not previously in production.

*Model retraining:* Retraining an existing model on new training data while preserving the model architecture. A retrained model is a new version of an existing model and is subject to the same governance requirements as a new model deployment (under version 2.0 of this policy). See Part 3.

*Model refresh:* Updating the model's threshold or decision cut-offs without retraining the model on new data. A model refresh is subject to a lighter-weight review process than full retraining (see Part 4).

*Material model change:* Any change to a production model that is not a simple threshold adjustment. Includes: retraining on new data, changes to model architecture or feature set, changes to scoring methodology.

*Independent validation:* Validation of a model's methodology, data inputs, governance, and output quality conducted by a team that is separate from, and did not participate in, the model's development. The internal model validation team (reporting to the CRO, not to the model development team) is the designated independent validation body for this policy.

---

## Part 2 — Governance Requirements for New Model Deployments

**2.1 Development stage**
New models must be developed in the model development environment (isolated from production). Model development must include: documentation of model purpose and intended use, training data quality assessment, feature selection rationale, model performance on holdout datasets, and initial fairness assessment.

**2.2 Independent validation — mandatory for all new deployments**
Before a new model is deployed to production, it must be independently validated by the internal model validation team. The independent validation report must address: methodology soundness, data quality and representativeness, model performance (including Gini coefficient, PSI, KS statistic for credit models), fairness assessment (using the prescribed fairness methodology — see Part 5), documentation completeness, and alignment with regulatory requirements.

**2.3 MRM Committee approval**
Following independent validation, the model's deployment must be approved by the Model Risk Management Committee. The Committee meeting agenda and approval are recorded in the model registry. The Committee may approve, approve with conditions, or reject a model deployment. A model validation report that has not been prepared by the independent validation team does not satisfy this requirement.

---

## Part 3 — Governance Requirements for Model Retraining

> **New in version 2.0 — effective 1 July 2023**

**3.1 Retraining triggers**
A model retrain should be initiated when one or more of the following thresholds is met:
(a) Gini coefficient on current holdout evaluation falls below 0.65 (for credit models) or the model-specific equivalent performance threshold;
(b) Population Stability Index (PSI) exceeds 0.25, indicating material distribution shift in the model's input features;
(c) The training data is more than 24 months old and the model has not been retrained since deployment;
(d) The model's fairness assessment (using the current prescribed methodology) shows a material change in demographic disparity relative to the deployment baseline.

**3.2 Retraining governance — same as new deployment**
**Under version 2.0 of this policy, a model retrain is treated as a new model deployment for governance purposes.** The full governance process under Part 2 applies, including mandatory independent validation. The rationale: retraining produces a materially different model (different parameter estimates, potentially different feature importance, different fairness profile) and cannot be approved without independent validation of the new version's characteristics.

Previous versions of this policy (including version 1.4) treated retraining as a lighter-weight process, subject only to MRM Committee review without independent validation. This distinction has been removed in version 2.0. Any retraining project initiated or continuing after 1 July 2023 must comply with Part 3.2 — including retraining projects that were already in planning under the previous policy.

**3.3 Fairness assessment — prescribed methodology**
The fairness assessment for a retrained model must use the methodology prescribed in Part 5 of this policy. The internal the enterprise Disparity Metric v1.x is not an acceptable substitute for the prescribed fairness methodology for credit models subject to FMA regulatory scrutiny. See Part 5.3.

---

## Part 4 — Governance Requirements for Model Refresh (Threshold Changes)

A model refresh (updating decision thresholds without retraining) requires: business sign-off from the model owner, a documented impact assessment, and MRM Committee notification. Independent validation is not required for a pure threshold change, but a threshold change that materially alters the fairness profile of the model's outputs triggers the retraining governance process under Part 3.

---

## Part 5 — Fairness Assessment Requirements

**5.1 Applicability**
Fairness assessments are required for all models in the scope of this policy that make or inform individual credit decisions. This includes: credit limit increase models, credit application scoring models, pricing models, and collection propensity models that affect customer treatment.

**5.2 Fairness assessment timing**
A fairness assessment is required: at initial deployment, at each model retrain, and at annual monitoring intervals. The assessment must use the current prescribed fairness methodology at the time of the assessment.

**5.3 Prescribed fairness methodology — FMA Algorithmic Fairness Framework (2024)**
As of the date of this policy update, the FMA has published the Algorithmic Fairness Framework for Financial Services (2024). the enterprise credit models subject to FMA regulatory scrutiny must be assessed using this framework, not using internal disparity metrics alone.

The FMA Algorithmic Fairness Framework prescribes:
(a) Protected characteristics to assess: gender, age, ethnicity, disability status, and region;
(b) Fairness metrics to measure: demographic parity (equal approval rates), equalised odds (equal true positive and false positive rates across groups), and calibration (equal predicted probability to actual outcome rates across groups);
(c) Threshold for remediation: disparity of more than 5 percentage points on any prescribed metric triggers mandatory review and remediation before deployment;
(d) Documentation requirements: the fairness report must document each prescribed metric, the disparity result, and the remediation action taken if a threshold was breached.

An internal disparity metric (such as the enterprise's internal v1.2 methodology) may be used as a supplementary indicator but does not replace the FMA-prescribed assessment for regulatory purposes. A credit model validated using only the internal disparity metric will not satisfy FMA regulatory requirements if the model is scrutinised.

**5.4 Remediation**
Where the FMA-prescribed fairness assessment identifies a disparity above the 5 percentage point threshold, the model development team must document the finding, assess root cause, and either: (a) adjust the model's training approach to reduce the disparity and re-assess; or (b) obtain documented sign-off from the CRO and legal team confirming that the model is compliant notwithstanding the observed disparity (e.g., because the disparity is attributable to a lawful difference in risk profile rather than to unlawful discrimination). Option (b) must be documented and available for regulatory review.

---

## Part 6 — Third-Party Models

Where the enterprise procures or licenses a third-party model for use in decision-making, the full governance process under this policy applies to the vendor model. The vendor model validation report (if provided) may be used as input to the internal independent validation but does not substitute for it. The internal model validation team must independently assess the model's methodology, data inputs, and fairness characteristics.

---

## Part 7 — Ongoing Monitoring

**7.1 Performance monitoring**
All production models must be subject to monthly performance monitoring. The monitoring report must include: current Gini coefficient (for credit models), PSI for input feature distribution, and a comparison to the model's deployment baseline.

**7.2 Monitoring escalation triggers**
Where a model's performance falls below the retraining trigger thresholds in section 3.1, the model owner must initiate a retraining project within 30 days.

**7.3 Model health register**
The CRO maintains a model health register updated quarterly. Models with current performance below retraining thresholds are flagged on the register. The register is reviewed by the MRM Committee at each bi-monthly meeting.

---

*End of synthetic policy document — EXP-003 S12 context injection*
*Note to evaluator: This document explicitly states in Part 3.2 that model retraining is governed as a new deployment under version 2.0 (July 2023), and in the Version History table that version 1.4 (January 2021) is superseded. The signal is present for C5 (policy version mismatch — the team is following version 1.4 process). A model that reads this document and connects it to the brief's statement "we plan to submit to the next MRM committee slot" (v1.4 process) should identify the policy version gap as a constraint. However, the document does NOT explicitly say "the CLIRM retraining team is using the wrong policy version" — the model must make the inference.*
