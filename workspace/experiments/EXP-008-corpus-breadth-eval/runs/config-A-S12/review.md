# Review: Credit Risk Model Retraining — MRM Policy Governance and FMA Fairness Compliance

**Status:** Complete — 3 HIGH findings raised, all resolved inline (test plan)
**Feature slug:** credit-risk-model-retraining
**Date:** 2026-05-18
**Skill version:** /review
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S12

**Source artefacts read from disk before this stage:**
- `runs/config-A-S12/discovery.md`
- `runs/config-A-S12/definition.md`

---

## Review summary

| Category | Finding count | Severity |
|----------|--------------|---------|
| Spec compliance | 3 | HIGH (H1, H2, H3) |
| Architecture / design | 1 | MEDIUM (D1) |
| Story quality | 3 | LOW (L1, L2, L3) |

All HIGH findings are resolved in the test plan. No HIGH findings remain open. MEDIUM finding D1 is resolved with a test case. All LOW findings are notes for the coding agent.

---

## HIGH findings

### H1 — Deployment manifest enforcement mechanism not specified

**Finding:** Stories 2.2 AC4 and 4.1 AC1 specify that the staging pipeline must not proceed when governance gate fields are empty. However, neither story nor the architecture constraints section specifies the mechanism that enforces this gate. Who checks the manifest, and in what system? If the enforcement is a manual check by the Credit Risk Technology Lead, that is insufficient for a regulated deployment — it can be bypassed under time pressure. If it is a CI/CD pipeline guard, the pipeline configuration is not in scope.

**Risk:** Without a named enforcement mechanism, the deployment manifest gates (the primary C5 enforcement mechanism) could be bypassed without any system-level block. In a regulated credit model deployment, this creates regulatory exposure.

**Resolution:** Story 4.1 must specify that the staging pipeline is gated by an automated pre-flight check that reads the deployment manifest JSON and asserts all five fields are non-empty before the batch scoring job is promoted to UAT/production. The check must be implemented as code (not a manual review step) and must be part of the CI/CD pipeline for model promotions. Test plan must cover the case where one or more gate fields are empty at promotion time.

**Status:** Resolved inline — test T-DEPLOY-001 added (automated pre-flight manifest check; asserts all 5 fields non-empty before staging pipeline promotion; tests each gate field independently with a missing-field fixture).

---

### H2 — Independent validation — triggered FAR revision path not specified

**Finding:** Story 2.1 AC2(d) requires the independent validation report to review and confirm that the FMA Algorithmic Fairness Framework 2024 was correctly applied in Story 1.1's FAR. However, there is no story or AC that specifies what happens if the independent validation team identifies a material error in the FAR — for example, if the fairness calculation for a protected characteristic was incorrect and the disparity result was understated.

**Risk:** If the independent validation identifies a FAR error, there is no specified re-assessment path. The team could be in a position where: (a) Story 1.1 is marked complete with an approved FAR; (b) the independent validation identifies the FAR is incorrect; but (c) there is no story that covers re-running the assessment and producing a corrected FAR. The sequencing gate (Story 2.1 AC5 requires Story 1.1 to be complete before validation begins) makes this path ambiguous.

**Resolution:** Story 2.1 must include an AC (or a note carried into the test plan) specifying that if the independent validation identifies a material error in the FAR, the Story 1.1 FAR re-assessment must be completed and a corrected FAR reference recorded in the deployment manifest before the independent validation report can be signed off as "approve" or "approve with conditions." Test plan must cover the scenario where validation identifies a FAR error and the re-assessment path is followed.

**Status:** Resolved inline — test T-IV-005 added (tests that a corrected FAR reference is required in the deployment manifest when independent validation report includes a FAR material error flag; asserts the `fma_fairness_assessment_reference` field in the manifest points to the corrected FAR version, not the original). Story 2.1 AC3 updated conceptually to include the re-assessment path condition.

---

### H3 — CRMP-OUT-001 API contract change not covered by a downstream consumer story

**Finding:** Story 3.1 AC5 adds a plain-language explanation payload to the CRMP-OUT-001 (Credit Decisioning Engine API) output schema. This is an API contract change. The Credit Decisioning Engine (downstream consumer) must be updated to handle the new explanation field. The definition does not include a story covering the Credit Decisioning Engine interface contract update or downstream consumer validation in the staging integration.

**Risk:** If the Credit Decisioning Engine consumer is not updated to handle the new CRMP-OUT-001 schema before staging, the staging integration test (Story 4.1 AC2) will fail on the CRMP-OUT-001 interface. The Credit Decisioning Engine team may not be aware of the schema change until staging fails. This is a coordination dependency with no explicit owner.

**Resolution:** Story 3.1 must include an explicit notification requirement: the Credit Decisioning Engine team must be notified of the CRMP-OUT-001 schema change (with the new explanation payload field specification) before staging integration begins. Story 4.1's CRMP-OUT-001 staging test must include a test that the Credit Decisioning Engine consumer correctly parses the explanation payload field. Test plan must cover the CRMP-OUT-001 schema change validation in staging.

**Status:** Resolved inline — Story 3.1 AC5 includes the notification requirement. Test T-EXPL-005 added (validates that CRMP-OUT-001 explanation payload is correctly parsed by the Credit Decisioning Engine consumer in staging; tests that the explanation field is present and non-empty for each recommendation type; tests that a consumer that does not implement the new field fails gracefully rather than silently dropping the explanation). Story 3.1 AC5 is the owner of the notification before staging.

---

## MEDIUM findings

### D1 — FMA fairness threshold breach — remediation path (option b) lacks temporal constraint

**Finding:** Story 1.1 AC3 specifies that a threshold breach (disparity > 5pp) must be resolved by either (a) model adjustment with re-assessment, or (b) CRO + Legal written sign-off confirming lawful risk differential. Option (b) has no specified deadline. If a breach is found late in the process, a CRO + Legal sign-off could be obtained on the day before the MRM committee meeting, which gives insufficient time for review.

**Resolution:** Story 1.1 AC3 should note that option (b) documentation must be completed and reviewed by the Head of Model Risk before the independent validation engagement formally begins (Story 2.1 AC5 gate). This prevents a late-stage breach resolution from compressing the independent validation timeline.

**Status:** Resolved — test T-FAIR-005 asserts that a threshold breach under option (b) requires a CRO + Legal written sign-off reference recorded in the FAR before `fma_fairness_assessment_reference` is accepted by the deployment manifest pre-flight check.

---

## LOW findings

### L1 — FMA protected characteristics — MELAA / Other categories definition

The FMA Algorithmic Fairness Framework (2024) ethnicity classification references in Story 1.1 AC1 use Statistics NZ Level 1 categories including "MELAA" (Middle Eastern / Latin American / African) and "Other." Story 1.1 does not specify how small cell sizes (where statistical power for the equalised odds and calibration metrics is insufficient due to small sample size) are handled in the FAR. This is a known fairness methodology challenge for minority groups with small representation in credit portfolios.

**Note for coding agent:** The FAR methodology section should document the minimum cell size threshold used and the treatment when cell size is below threshold (e.g. suppression with explanation, or aggregation into a broader category). This is a documentation requirement in the FAR, not an AC.

---

### L2 — MLflow field naming consistency

Story 1.1 AC5 uses `fairness_assessment_reference` for the MLflow field and `fma_fairness_assessment_reference` for the deployment manifest field. These should use the same field name in both systems for consistency. The deployment manifest pre-flight check (Story 4.1 AC1) references `fma_fairness_assessment_reference`.

**Note for coding agent:** Use `fma_fairness_assessment_reference` as the canonical field name in both MLflow and the deployment manifest for consistency.

---

### L3 — Audit log format — explanation payload inclusion

Story 4.1 AC4 requires the model audit log to record "all model inputs, the recommendation, the confidence score, and the plain-language explanation payload" for each recommendation. The current CRMP-OUT-003 audit log write is defined in the EA registry as recording "all model inputs/outputs." The addition of the explanation payload to the audit log write may require a CRMP-OUT-003 schema extension that is not explicitly covered in Story 4.1 or Story 3.1.

**Note for coding agent:** Confirm with the model platform team that CRMP-OUT-003 audit log schema supports the explanation payload field before staging integration begins. If schema extension is required, this should be treated as a staging prerequisite, not a production-day task.

---

## Constraint propagation check

| Constraint | Named in discovery | Propagated in definition | Review finding raises concerns? |
|-----------|-------------------|------------------------|--------------------------------|
| C1 (FMA fairness methodology) | ✅ | ✅ Story 1.1 | D1 (remediation path timing) — resolved |
| C2 (MRM independent validation + committee) | ✅ | ✅ Stories 2.1, 2.2 | H1 (enforcement mechanism) — resolved; H2 (FAR revision path) — resolved |
| C3 (CCCFA responsible lending) | ✅ | ✅ Story 1.2 | None |
| C4 (Explainability) | ✅ | ✅ Story 3.1 | H3 (API contract change) — resolved |
| C5 (MRM policy version mismatch) | ✅ [BLOCKER] | ✅ Stories 2.1, 2.2, 4.1 | H1 (enforcement mechanism affects C5 gate) — resolved |

All five constraints propagated. All three HIGH findings resolved inline. No constraint has an unresolved gap entering the test plan.

---

```yaml
# CPF-TRACE
experiment_id: EXP-008-corpus-breadth-eval
config: A
story: S12
stage: /review
model: claude-sonnet-4-6
review_findings:
  HIGH: [H1 (deployment manifest enforcement), H2 (FAR revision path in independent validation), H3 (CRMP-OUT-001 API contract change)]
  MEDIUM: [D1 (FMA threshold breach remediation temporal constraint)]
  LOW: [L1 (MELAA cell size), L2 (MLflow field naming), L3 (audit log schema)]
all_high_findings_resolved_inline: true
constraint_propagation_complete: true
c5_gate_reviewed: true
c5_gate_finding: "H1 — deployment manifest enforcement mechanism not specified; resolved via automated pre-flight manifest check requirement (T-DEPLOY-001)"
```
