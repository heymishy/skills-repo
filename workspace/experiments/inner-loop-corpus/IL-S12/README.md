# IL-S12 — AI Credit Model Retrain (MRM + FMA Regulated)

**Source story:** S12-ai-credit-model — Credit limit model retrain, Gini drift 0.71→0.63, MRM policy + FMA algorithmic fairness
**Difficulty:** HIGH
**Regulatory NFRs:**
  - NFR-1 (MRM Policy 2023): Independent validation artefact must be produced before production deployment; model retrain is a Tier-1 model change event
  - NFR-2 (FMA Algorithmic Fairness Methodology): Demographic parity gap ≤ 5% across gender and ethnicity cohorts; computed on holdout set
**Expected DoD verdict:** COMPLETE WITH DEVIATIONS (MRM independent validation pending — sign-off required before deploy; fairness metrics computed and within threshold, but MRM gate not cleared in this story)

---

## Scenario summary

The retail credit decisioning model has experienced Gini coefficient drift from 0.71 to 0.63 over 18 months. The MRM policy (updated 2023) classifies credit limit model retraining as a Tier-1 model change event, requiring:
1. Independent validation by the Model Risk function (separate team, not the modelling team)
2. A model validation report (`model-validation-report.md`) produced by the retrain pipeline as input to the Model Risk team
3. Fairness metrics demonstrating demographic parity gap ≤ 5% before the Model Risk team will sign off

Story: `credit.7` — Retrain credit limit model and produce MRM validation artefact.

The story DOES NOT include: independent validation sign-off (that is the Model Risk team's action, not a coding task), CCCFA affordability rule changes (separate regulatory story), or production deployment (blocked on MRM sign-off).

---

## Bundle components

| File | Content |
|------|---------|
| A-definition.md | 3 ACs + NFR-1 (MRM validation artefact) + NFR-2 (FMA fairness threshold) |
| B-dor.md | DoR — Proceed: Yes, High oversight, C5 regulated constraint, NFRs in H-NFR* |
| C-test-plan.md | 6 unit/integration tests covering AC1–AC3 + NFR-1 + NFR-2 |
| D-ac-verification-script.md | 4 scenarios |
| E-codebase-context.js | Existing `model-pipeline.js` showing retrain/evaluate pattern |
| F-reference-spec.md | Expected task structure, correct outputs, negative controls |
| G-dod-bundle.md | Full DoD bundle; PR #247; expected COMPLETE WITH DEVIATIONS (MRM sign-off pending) |
