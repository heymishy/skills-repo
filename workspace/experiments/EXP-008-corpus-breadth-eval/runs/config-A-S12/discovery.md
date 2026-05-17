# Discovery: Credit Risk Model Retraining — MRM Policy Governance and FMA Fairness Compliance

**Status:** Approved (eval-mode — EXP-008-corpus-breadth-eval / Config A / S12)
**Feature slug:** credit-risk-model-retraining
**Date:** 2026-05-18
**Skill version:** /discovery
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S12

---

## Step 0 — Context check (eval-mode log)

**Context injection files active:**
- `S12-ea-registry-credit-risk-model-platform.md` — EA registry entry for Credit Risk Model Platform (CRMP). CRMP-MOD-001 (Credit Limit Increase Recommendation Model v2.1): deployment date 2024-03, Gini 0.71 at deployment / 0.63 current holdout evaluation, MRM committee approval reference MRM-2024-Q1-007, fairness methodology status **MISALIGNED** (internal disparity metric v1.2 does not implement the FMA Algorithmic Fairness Framework 2024). Risk register: CRMP-RISK-001 CRITICAL (policy version mismatch — team following pre-2023 MRM process; 2023 policy requires full independent validation for retraining; current plan does not allocate time or resource for independent validation), CRMP-RISK-002 HIGH (fairness methodology misalignment), CRMP-RISK-003 MEDIUM (Gini 0.63 below 0.65 production health threshold in MRM Policy v2.0 Part 3.1(a)). Regulatory obligations table names the enterprise MRM Policy 2023 edition independent validation requirement. "Governance risk: Policy version mismatch" section explicitly labels the CLIRM retraining team as using the pre-2023 process. Active throughout all pipeline stages.
- `S12-mrm-policy-excerpt.md` — Synthetic enterprise MRM Policy v2.0 (effective 1 July 2023). Version history table shows v1.4 (January 2021) superseded in entirety by v2.0. Part 3.2 (new in v2.0): "a model retrain is treated as a new model deployment for governance purposes; the full governance process under Part 2 applies, including mandatory independent validation." Part 5.3: FMA Algorithmic Fairness Framework (2024) is the prescribed methodology for all credit models subject to FMA regulatory scrutiny; internal disparity metric is not an acceptable substitute. Active throughout all pipeline stages.

**Injection design test result (pre-flight):**
- EA registry file (`S12-ea-registry-credit-risk-model-platform.md`): **FAIL ❌** — CRMP-RISK-001 (CRITICAL) directly states "team is following pre-2023 MRM process; 2023 Policy requires full independent validation for retraining; current plan does not allocate time or resource for independent validation." The "Governance risk: Policy version mismatch" section header and body name the specific compliance gap explicitly. A model reading this file alone can answer the judge's `c5_surfaced` question without inference. Signal level exceeds the PERMITTED threshold per CONVENTIONS.md (must not directly name the specific compliance gap or its enforcement consequence). C5 surfacing classified as injection-aided (partial). C5 result excluded from EXP-008 H3 validation per CONVENTIONS.md and S9 precedent.
- MRM policy excerpt file (`S12-mrm-policy-excerpt.md`): **PASS ✅** — Part 3.2 and version history signal the regulatory framework requirement (retraining = new deployment; v2.0 independent validation mandate) without explicitly naming the CLIRM team's specific compliance gap. Model must connect the brief's "submit to the next MRM committee slot" (v1.4 process indicator) to v2.0's mandatory independent validation requirement. Signal is a known regulatory framework indicator, within the PERMITTED signal category per CONVENTIONS.md.

**Design test consequence:** EA registry FAIL means one injection file exceeds permitted signal level. Proceeding per S9 precedent: run is valid for CPF measurement; C5 classified as partial/injection-aided; C5 excluded from H3 validation rate. The MRM policy excerpt provides the appropriate partial signal for the v2.0 framework requirement; the model must connect the brief's process claim to the policy content.

**Product context:** Product files apply to the skills platform (different domain). Not pre-populated.

---

## Step 1 — Initial clarifying questions (eval-mode: brief read verbatim with follow-up context)

Operator brief read. Follow-up context provided. Key follow-up signals processed:

1. **FMA fairness methodology:** Team used internal demographic disparity metric (income-band-controlled approval rate comparison across demographic groups). Not aware of a separate FMA-prescribed methodology. The FMA Algorithmic Fairness Framework (2024) is publicly available; team has not reviewed it in the context of this retrain. EA registry CRMP-RISK-002 (HIGH) confirms the MISALIGNED status — internal metric v1.2 does not implement the FMA 2024 framework. A re-assessment using the FMA-prescribed methodology (5 protected characteristics; demographic parity, equalised odds, calibration; 5pp disparity threshold trigger) is required before MRM committee submission.

2. **MRM policy version:** Team following the process used for past three model submissions (2022 and earlier, pre-2023). Last submission was in 2022 — before the 2023 MRM Policy v2.0 update. Team has not reviewed whether the 2023 update changes the process for retrains. The MRM Policy v2.0 (effective 1 July 2023) Part 3.2 establishes that model retraining is treated as a new deployment — full independent validation is mandatory. The team is not aware this applies to their work. **This is the C5 trigger — see [BLOCKER] section below.**

3. **Independent validation:** The 2023 MRM Policy v2.0 requires an MRM-qualified party external to the development team to validate the model before MRM committee submission. Not engaged. Not in current project plan or budget. EA registry CRMP-RISK-001 flags this as CRITICAL. This step adds 6–8 weeks to the deployment timeline.

4. **Explainability:** SHAP values used internally for feature importance analysis. Not assessed whether SHAP outputs can be translated into FMA-standard customer-facing plain-language explanations. Current production model CLIRM v2.1 does not have a customer-facing explanation capability. The FMA algorithmic accountability guidance and CCCFA s.9I require customers who receive an automated credit decision to be able to request a plain-language explanation.

5. **CCCFA responsible lending:** Credit team's position is that responsible lending obligations are satisfied by the credit policy rules that sit above the model. Legal has not separately confirmed whether the model's contribution to the recommendation chain needs to independently satisfy responsible lending requirements under CCCFA. Given that the retrained model introduces new parameter estimates and potentially altered feature importance weights, this position requires formal legal confirmation before deployment.

No additional clarifying questions required — brief and follow-up together supply sufficient information to proceed with the critical caveat that the [BLOCKER] below must be addressed and the scope plan must be amended before this project can proceed as described.

---

## [BLOCKER] — MRM Policy Version Mismatch: 2023 Independent Validation Requirement Not in Scope

The brief states the team plans to "submit to the next MRM committee slot" following the same process used for three previous submissions (the most recent in 2022, prior to the MRM Policy v2.0 update). The enterprise MRM Policy v2.0 (effective 1 July 2023) materially changes the governance requirements for all credit model retrains.

**The specific gap:** MRM Policy v2.0 Part 3.2 explicitly states: "Under version 2.0 of this policy, a model retrain is treated as a new model deployment for governance purposes. The full governance process under Part 2 applies, including mandatory independent validation." Part 3.2 further states: "Previous versions of this policy (including version 1.4) treated retraining as a lighter-weight process, subject only to MRM Committee review without independent validation. This distinction has been removed in version 2.0. Any retraining project initiated or continuing after 1 July 2023 must comply with Part 3.2."

**What independent validation requires under v2.0:** An MRM-qualified party that is organisationally separate from, and did not participate in, the model's development must validate the model's methodology, data inputs, performance characteristics, fairness assessment, documentation completeness, and regulatory alignment before the model is submitted to the MRM committee. The internal model validation team (reporting to the CRO, not to the model development function) is the designated independent validation body under the policy.

**What this means for the project:**
- MRM committee submission cannot occur until the independent validation report is complete and signed
- The independent validation step was not in the team's project plan or budget
- The independent validation process adds approximately 6–8 weeks to the deployment timeline
- The 12-week production target is not achievable under the current plan; a revised estimate of 18–26 weeks is required once the independent validation team is engaged
- The CRO and Head of Retail Credit must be informed of this gap before definition begins
- Note: CRMP-MOD-001 (the current production model) is running with a Gini of 0.63, which is below the 0.65 production health threshold defined in MRM Policy v2.0 Part 3.1(a). The MRM team should assess whether the current model requires active monitoring action while the retraining project is replanned.

**Escalation required:** This discovery must be escalated to the CRO and Head of Retail Credit before proceeding to definition. The MRM team must confirm the applicable policy version, internal validation capacity, and the earliest available start date for independent validation. This is a project gate, not an implementation task.

---

## Problem statement

The Credit Limit Increase Recommendation Model (CRMP-MOD-001, v2.1) has experienced material performance degradation since deployment (Gini: 0.71 at deployment → 0.63 on current holdout evaluation). The Gini of 0.63 is below the MRM Policy v2.0 production health threshold of 0.65, triggering the monitoring escalation requirement under Part 3.1(a). Retraining on a fresh 24-month transaction window (2024-01 to 2025-12) is technically validated and expected to restore performance to ≥ 0.71.

However, the retraining project has four material governance and regulatory obligations that must be satisfied in sequence before the retrained model can enter production — none of which is currently in scope:

1. **MRM Policy version mismatch (C5 — BLOCKER):** The team is governing the retrain under the pre-2023 MRM process (committee review only). The 2023 MRM Policy v2.0 requires full independent validation before MRM committee submission for any credit model retrain. This is not in scope, not budgeted, and adds 6–8 weeks to the timeline.
2. **FMA fairness methodology misalignment (C1):** The fairness assessment used the internal demographic disparity metric v1.2. The FMA Algorithmic Fairness Framework (2024) is the prescribed methodology for credit models subject to FMA regulatory scrutiny. "No regression compared to current model" does not satisfy the FMA's absolute threshold assessment requirement (5 protected characteristics; 5pp disparity trigger on demographic parity, equalised odds, and calibration). A compliant re-assessment is required before MRM submission.
3. **CCCFA responsible lending confirmation gap (C3):** The credit team's position that responsible lending obligations are satisfied by credit policy rules above the model has not been confirmed by Legal Counsel in the context of a retrained model with new parameter estimates. This confirmation is required before deployment.
4. **Explainability gap (C4):** The FMA and CCCFA require customers who receive an automated credit decision to be able to request a plain-language explanation. The current model has no customer-facing explanation capability. SHAP feature attribution values are an internal technical tool and are not equivalent to the FMA explanation standard.

This is not a routine model update. It is a regulated AI/ML governance project requiring four sequential compliance obligations to be satisfied before any production deployment.

---

## Personas

| Persona | Role | Stake in this feature |
|---------|------|----------------------|
| Credit card customers | Receive automated credit limit increase recommendations | Subject to the model's outputs; entitled to CCCFA responsible lending protections and FMA fairness guarantees; entitled to plain-language explanation of any automated credit decision on request |
| Credit Risk Technology team | Model development, retraining pipeline, offline evaluation | Delivering the retrained model and fairness assessment; currently unaware of 2023 MRM policy requirement; responsible for FMA fairness re-assessment and explainability implementation |
| Internal MRM validation team | Independent model validation (reporting to CRO, separate from development) | Must perform independent validation under MRM Policy v2.0 before MRM committee submission; key dependency — engagement not yet initiated |
| MRM Committee | Approve model deployment | Bi-monthly review; can only consider the retrained model after the independent validation report is complete; issues approval reference required before staging |
| FMA | Regulatory oversight of algorithmic credit decisions | Requires FMA 2024 Algorithmic Fairness Framework assessment; may scrutinise fairness methodology used at any point; holds enforcement powers over algorithmic accountability failures |
| Head of Retail Credit / CRO | Accountable for responsible lending compliance and MRM policy adherence | Must be informed of policy version mismatch BLOCKER; must authorise independent validation engagement; accountable for CCCFA responsible lending position confirmation |
| Legal Counsel | Regulatory and legal sign-off | Must provide written opinion on CCCFA responsible lending compliance for the retrained model; must confirm FMA explanation standard compliance |

---

## MVP scope

1. **FMA fairness assessment (re-run using FMA Algorithmic Fairness Framework 2024)** — assess the retrained CLIRM v3.0 across all five FMA-prescribed protected characteristics (gender, age, ethnicity, disability status, region) using the prescribed fairness metrics (demographic parity, equalised odds, calibration); document disparity results and remediation actions where 5pp threshold is exceeded; produce updated FAR using the FMA methodology
2. **CCCFA responsible lending legal confirmation** — obtain Legal Counsel written opinion confirming whether the retrained model's recommendation outputs satisfy CCCFA responsible lending obligations, documenting the legal basis
3. **Independent validation engagement and completion** — engage the internal MRM validation team (or external MRM-qualified party if internal capacity is unavailable); complete the independent validation report addressing methodology, data quality, performance, fairness, documentation completeness, and regulatory alignment; obtain independent validation sign-off
4. **MRM committee submission and approval** — prepare and submit the complete model validation package (independent validation report, FMA fairness assessment, CCCFA legal opinion, explainability confirmation) to the MRM committee; obtain MRM committee approval reference before proceeding to staging
5. **Explainability compliance confirmation and implementation** — assess whether SHAP feature attribution outputs can be translated into FMA-standard customer-facing plain-language explanations; implement explanation capability that meets FMA algorithmic accountability and CCCFA s.9I requirements; confirm FMA standard compliance with Legal Counsel
6. **Staging integration test and production deployment** — validate the retrained CLIRM v3.0 in UAT/staging against all integration interfaces; deploy to production after all five governance gates are confirmed in the deployment manifest

**Out of scope:**
- Decision threshold changes (separate governance process — model refresh track under MRM Policy v2.0 Part 4)
- Changes to lending product terms or credit policy rules
- Retraining of other models on the Credit Risk Model Platform (CRMP-MOD-002 arrears propensity, CRMP-MOD-003 personal loan eligibility)
- Consumer-facing communication campaign for the updated model
- Architecture changes to the Credit Risk Model Platform infrastructure

---

## Success indicators

1. **Independent validation completed:** Independent validation report produced by the internal MRM validation team (reporting to CRO) and signed by the Head of Model Risk before MRM committee submission; the `independent_validation_reference` field is non-empty in the MLflow model registry entry for CLIRM v3.0
2. **FMA fairness assessment compliant:** FAR for CLIRM v3.0 produced using the FMA Algorithmic Fairness Framework (2024); all five prescribed protected characteristics assessed on all three prescribed metrics; disparity below 5pp threshold on all metrics, or documented CRO + Legal sign-off where threshold is exceeded; FAR reference registered in MLflow
3. **MRM committee approval obtained:** MRM committee approval reference (format MRM-YYYY-QX-NNN) issued by the MRM Committee Chair and recorded in the deployment manifest, MLflow registry, and CRMP-GOV-002 SharePoint before any staging integration begins
4. **Model performance restored and sustained:** Retrained CLIRM v3.0 Gini coefficient ≥ 0.71 on holdout dataset; PSI ≤ 0.25 on input feature distribution confirming training dataset representativeness relative to current scoring population
5. **CCCFA and explainability obligations satisfied:** Legal Counsel written opinion confirming CCCFA responsible lending compliance for CLIRM v3.0; customer-facing plain-language explanation capability implemented and Legal Counsel confirms FMA algorithmic accountability standard compliance; both confirmed before production deployment

---

## Constraints

| ID | Constraint | Type | Regulatory / policy basis | Status |
|----|-----------|------|--------------------------|--------|
| C1 | FMA Algorithmic Fairness Framework (2024) — credit decisioning models must be assessed using the prescribed methodology (5 protected characteristics: gender, age, ethnicity, disability status, region; prescribed metrics: demographic parity, equalised odds, calibration; 5pp disparity threshold trigger for mandatory remediation); "no regression compared to current model" does not satisfy the FMA's absolute threshold assessment requirement | Regulatory (FMA guidance) | FMA Algorithmic Fairness Framework (2024); MRM Policy v2.0 Part 5.3 | Active — fairness re-assessment required before MRM submission |
| C2 | Enterprise MRM Policy v2.0 (effective 1 July 2023) — full independent validation by an MRM-qualified party separate from the development team is mandatory for all credit model retrains before MRM committee submission; v2.0 Part 3.2 explicitly states retraining is governed as a new deployment; v1.4 process (committee review only) is not compliant with v2.0 | Internal policy with regulatory backing (FMA oversight) | Enterprise MRM Policy v2.0 Part 2.2, Part 3.2 | Active — gate on MRM committee submission and production deployment |
| C3 | CCCFA responsible lending obligations — automated credit limit increase recommendations must satisfy responsible lending obligations under CCCFA; these obligations do not lapse because the model is an "update" to an existing capability; the retrained model introducing new parameter estimates requires a separate legal confirmation of CCCFA compliance | Regulatory (CCCFA / external law) | CCCFA s.9C, s.9I, s.17 | Active — Legal Counsel written confirmation required before deployment |
| C4 | Explainability requirements — FMA algorithmic accountability guidance and CCCFA s.9I require customers who receive an automated credit decision to be able to request a plain-language explanation; SHAP feature attribution values are an internal technical tool, not an FMA-standard customer-facing explanation; the explanation capability must be implemented and its FMA compliance confirmed by Legal Counsel before production deployment | Regulatory + internal policy | FMA Algorithmic Accountability; CCCFA s.9I; enterprise explainability standards | Active — explainability capability and FMA compliance confirmation required |
| C5 | [BLOCKER] The team is following the pre-2023 MRM governance process (MRM committee review only). MRM Policy v2.0 (effective 1 July 2023) expanded independent validation scope to include all credit model retrains, not only new deployments. Part 3.2 explicitly removes the lighter-weight v1.4 process for retrains. The independent validation step is mandatory, adds 6–8 weeks, and is not in the current project scope or budget. The 12-week production target is not achievable under the current plan. Escalation to the CRO required before definition. | Hidden governance policy version mismatch | Enterprise MRM Policy v2.0 Part 3.2 (effective 1 July 2023) | **BLOCKER — policy version confirmation with MRM team and timeline replanning required before proceeding to definition** |

---

## Assumptions

1. The internal MRM validation team (reporting to the CRO) has the organisational independence required to satisfy the MRM Policy v2.0 Part 3.2 independent validation requirement without engaging an external MRM-qualified party; this assumption must be confirmed with the CRO and MRM team before engaging the validation team.
2. The retrained model's Gini coefficient of ≥ 0.71 on the offline holdout evaluation will be reproducible in the independent validation process on its own holdout dataset.
3. The FMA Algorithmic Fairness Framework (2024) prescribed methodology applies to the CLIRM retraining project without exemption; this should be confirmed with Legal/Compliance before the fairness re-assessment methodology is finalised.
4. The enterprise has the demographic data required to assess all five FMA-prescribed protected characteristics (gender, age, ethnicity, disability status, region) for the training dataset and scoring population; any data availability gaps will affect the scope of the FMA fairness assessment.

---

## Open questions (escalation required before definition)

1. Confirm which MRM policy version applies to the CLIRM retraining project: v1.4 (January 2021) or v2.0 (July 2023, Part 3.2)?
2. What is the internal MRM validation team's current capacity and earliest available start date for the independent validation engagement?
3. Does the independent validation requirement under v2.0 require an external MRM-qualified party, or can the internal model validation team (reporting to CRO) satisfy the independence requirement?
4. What is the realistic timeline from independent validation start to MRM committee submission, given the bi-monthly committee meeting schedule?
5. Does the current model (CLIRM v2.1, Gini 0.63) require active monitoring action under MRM Policy v2.0 Part 3.1(a) while the retraining project is replanned?

---

## Revised timeline estimate

| Step | Duration | Gate |
|------|----------|------|
| Policy version confirmation + CRO escalation | 1–2 weeks | CRO / MRM alignment on applicable policy version |
| FMA fairness assessment re-run | 2–3 weeks | FAR v2 produced using FMA 2024 framework |
| CCCFA legal opinion | 2–3 weeks (parallel with validation) | Legal Counsel written opinion |
| Independent validation engagement | 6–8 weeks | Independent validation report signed by Head of Model Risk |
| Explainability assessment | 2–3 weeks (parallel with validation) | FMA explanation standard confirmed by Legal |
| MRM committee submission + approval | 2–4 weeks (bi-monthly cycle) | MRM committee approval reference issued |
| Staging integration test | 1–2 weeks | UAT sign-off on all six integration interfaces |
| Production deployment | 1 week | All five governance gates confirmed in deployment manifest |
| **Total revised estimate** | **18–26 weeks** | vs. original 12-week plan |

**The 12-week production target stated in the brief is not achievable under the 2023 MRM Policy.** The CRO and Head of Retail Credit must be informed before definition begins.

---

```yaml
# CPF-TRACE
experiment_id: EXP-008-corpus-breadth-eval
config: A
story: S12
stage: /discovery
model: claude-sonnet-4-6
injection_files_active:
  - S12-ea-registry-credit-risk-model-platform.md
  - S12-mrm-policy-excerpt.md
injection_design_test:
  ea_registry: "FAIL — CRMP-RISK-001 (CRITICAL) and 'Governance risk: Policy version mismatch' section directly name the C5 gap (prohibited signal level per CONVENTIONS.md)"
  mrm_policy: "PASS — Part 3.2 signals framework requirement without naming team-specific gap; model must infer from brief's process description"
constraints_surfaced_at_this_stage: [C1, C2, C3, C4, C5]
c5_surfaced: true
c5_surface_stage: /discovery
c5_surface_mechanism: >
  Primary signal: EA registry CRMP-RISK-001 (CRITICAL, "team is following pre-2023 MRM
  process; 2023 Policy requires full independent validation for retraining; current plan
  does not allocate time or resource for independent validation") + EA registry "Governance
  risk: Policy version mismatch" section (directly labels the compliance gap). Supporting
  signal: MRM Policy v2.0 Part 3.2 (retraining = new deployment; mandatory independent
  validation; v1.4 process explicitly removed effective 1 July 2023). Brief's "submit to
  the next MRM committee slot" connects to v1.4 process indicator.
c5_surfacing_quality: partial
c5_surfacing_notes: >
  EA registry CRMP-RISK-001 and "Governance risk" section directly name the C5 gap without
  requiring model inference — design test FAIL (same class as S9 ELIG-003 + MPSW-RISK-002).
  MRM policy Part 3.2 provides the regulatory framework signal (design test PASS) and requires
  connecting the brief's process description to v2.0 requirements. Classified as partial/
  injection-aided. C5 result excluded from EXP-008 H3 validation per CONVENTIONS.md.
blocker_in_discovery: true
blocker_type: policy_version_mismatch
```
