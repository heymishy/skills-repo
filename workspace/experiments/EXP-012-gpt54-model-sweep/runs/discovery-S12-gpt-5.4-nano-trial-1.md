Here’s how I would run the **/discovery** pipeline for this proposed **retrained credit-limit increase model**, based on what you’ve provided. (I’m assuming the intent of “/discovery” is to surface risks, dependencies, stakeholders, evidence, and a likely delivery plan.)

---

## 1) Summary of the proposed change
- **What**: Retrain the existing credit limit increase recommendation model (enterprise credit card accounts).
- **Why**: **Model performance drift** since deployment:
  - Gini: **0.71 at deployment → 0.63** on recent holdout.
  - Expected recovery: **~0.71 or better** with a new **24-month** transaction window.
- **Scope**: Update the scoring/prediction model only; **no change** to:
  - credit limit recommendation *capability* (already exists)
  - **decision thresholds**
  - **product terms / lending policy**
- **Status**:
  - Retraining + offline evaluation: **complete**
  - Demographic disparity/fairness assessment: **complete** and shows no regression vs production on internal metric.

---

## 2) Key evidence and what to include for discovery
You already have the most critical artifacts. For the discovery record, ensure the following are explicitly captured/available:

1. **Performance evidence**
   - Current production model holdout metrics: include **Gini=0.63** (and dataset definition/version).
   - Retrained model offline metrics showing expected return to **~0.71+**.
   - Include: scoring date range, sample period, data window definition, and evaluation protocol.

2. **Fairness / disparity assessment**
   - Document the **exact internal disparity metric** used.
   - Confirm “no regression” means:
     - approval-rate differences remain within the same range as current production
     - which demographic group definitions and comparisons were used
   - Include evaluation set details (same holdout / comparable cohorts).

3. **Change summary for governance**
   - Confirmation that **thresholds/product terms are unchanged**.
   - Model versioning: training code version, feature set version, and model artifact hash/version.

---

## 3) Governance pathway and schedule realism (12-week target)
### Governance dependency
- **MRM committee review** required before production.
- Committee cadence: **bi-monthly**.
- Submission: next slot in **~8 weeks**.
- Review typically takes **one meeting cycle** → likely **~+1 meeting window**.

### Delivery estimate risk
- If your next MRM slot is **8 weeks away**, then (roughly):
  - Submit now-ish → **at week ~8**
  - Committee decision after **one cycle** → could land around **week ~10–12** depending on meeting date timing and how long between submission and decision.
  - Remaining steps after MRM:
    - staging integration test (typically days to ~1–2 weeks)
    - deployment (typically days)
- Therefore, **12 weeks is plausible but tight**, and the schedule hinges on:
  - no deferrals / no requests for additional analyses
  - fast turnaround after MRM decision
  - staging integration not uncovering feature/schema/version mismatches

**Discovery outcome**: The critical path is the **MRM committee timing** plus any governance-driven iteration.

---

## 4) Integration & technical risks to surface early
Even with retraining complete, model updates often fail late due to integration issues. Discovery should flag:

1. **Feature consistency**
   - Retrained model feature list and preprocessing must match production exactly.
   - Verify:
     - schema compatibility
     - categorical encoding maps (if any)
     - missing-value handling
     - time-window logic consistency

2. **Model artifact/version wiring**
   - Ensure staging uses the same:
     - model artifact (correct version)
     - parameterization
     - feature engineering code version
   - Ensure config management supports side-by-side evaluation if needed.

3. **Scoring latency / capacity**
   - Check if retraining changed model complexity (e.g., tree count, network size).
   - Confirm inference SLA in staging.

4. **Data leakage / windowing**
   - Since you used a 24-month window, confirm training data generation is production-faithful and does not include post-observation signals.

---

## 5) Decision-threshold / product-term constraints (important)
You stated:
- No changes to **decision thresholds**
- No changes to **product terms**
- Only the model powering the recommendation is updated

Discovery should explicitly confirm that the integration will:
- keep the same threshold parameters and business rules as production
- feed the recommendation output into the same downstream policy engine unchanged

This reduces both regulatory and operational risk.

---

## 6) Regulatory / external approval
You indicated:
- No regulatory approval anticipated (model update, not a new product)
- Discovery should still verify:
  - whether any jurisdiction has special model-change notification requirements even for internal updates
  - whether there’s an internal regulatory-policy checklist that must be completed for documentation

(Usually this is a lightweight “no regulatory impact” sign-off, but it should be part of the discovery record.)

---

## 7) Stakeholders and approvals likely needed (beyond MRM)
Discovery typically identifies who else may be involved even if not stated:

- **MRM committee** (required gate)
- **Credit risk model owner** (accountable)
- **Model Risk Management / Validation** (often provides sign-off or the fairness/performance evidence package)
- **Platform/ML engineering** (staging integration + deployment)
- **Business policy / underwriting operations** (verify thresholds unchanged)
- **Compliance** (if there’s a standard change-control workflow even without regulatory approval)

Make sure “who signs off” is mapped.

---

## 8) Pre-flight items to complete before the MRM submission (high leverage)
To avoid last-minute committee friction, discovery should recommend completing these before the ~8-week submission point:

1. **Final MRM pack**
   - Model summary, purpose, training data window (24 months), evaluation dataset
   - Metrics: Gini (current vs retrained), plus any stability notes
   - Fairness/disparity assessment evidence (and method)
   - Change summary: thresholds unchanged, policy unchanged

2. **Rollout plan**
   - Intended deployment date window
   - Monitoring plan (see next section)

3. **Monitoring & rollback plan**
   - What metrics will be monitored post-deploy:
     - Gini proxy / performance monitoring (where possible)
     - approval/offer rate trends
     - repayment/utilisation drift
     - fairness monitoring triggers (e.g., if approval differences widen)
   - Rollback criteria (e.g., if performance proxy drops or operational KPIs deteriorate)

---

## 9) Post-deployment monitoring (recommended discovery outputs)
Even if MRM approves based on offline evidence, discovery should define how you’ll prove safety in production:

- **Performance monitoring**: acceptance/recall proxies, default-rate proxies (as data accumulates), or calibration monitoring
- **Policy monitoring**: confirmation that downstream business processes behave identically
- **Fairness monitoring**: approval-rate disparity within expected band; alert if divergence exceeds a set threshold
- **Data drift monitoring**: spending/repayment behaviour shifts (given post-COVID changes were suspected)

---

## 10) Discovery “gaps” / open questions to resolve
Based strictly on your text, these are the main items discovery would request to reduce uncertainty:

1. **Evaluation details**  
   - Is the retrained Gini measured on the same holdout definition/time period as production’s 0.63?
   - Provide confidence intervals / variance if available.

2. **Fairness methodology**  
   - Which demographic attributes/groups are used?
   - What is the “standard internal disparity metric” exact definition and baseline comparison?

3. **Operational integration checklist**  
   - Any known feature engineering changes vs the 2-year-old build?
   - Is preprocessing code identical or versioned?

4. **Model explainability / documentation**  
   - Any required interpretability artifacts for MRM (e.g., feature importance, segment analysis)?

If you can answer these quickly, you greatly reduce the chance of an MRM deferral.

---

## 11) Likely critical path and plan-to-12-weeks feasibility
**Critical path**:
1. MRM submission timing (~8 weeks)
2. MRM review decision (one meeting cycle)
3. Staging integration test
4. Production deployment

**Feasibility**:
- **Plausible but tight**; success depends on avoiding rework triggered by MRM (fairness/performance questions) and ensuring staging integration is straightforward.

**Discovery recommendation**:
- Start staging integration test prep **before** MRM approval if allowed (e.g., validate schema/model loading, run a dry-run in staging) while keeping deployment gated by MRM.

---

If you want, I can turn this into a **formal /discovery output template** (sections + checklist + required evidence + timeline) that you can paste directly into your workflow system.