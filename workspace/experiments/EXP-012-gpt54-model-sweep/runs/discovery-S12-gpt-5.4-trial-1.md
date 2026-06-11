Below is a structured **/discovery output** for this model retraining change.

---

# /discovery assessment

## 1) Request summary
The credit risk team wants to **retrain an existing production model** used for **automatic credit limit increase recommendations** on existing enterprise credit card accounts.

The model currently evaluates:
- transaction behaviour
- repayment history
- utilisation patterns

It outputs:
- whether to offer a credit limit increase
- if yes, the recommended increase amount

The current production model was trained about two years ago. Performance has drifted:
- **Gini at deployment:** 0.71
- **Recent holdout evaluation:** 0.63

Team view is that drift is driven by post-COVID changes in spending and repayment behaviour. Retraining on a fresh 24-month transaction window is expected to restore performance to around **0.71+** based on offline evaluation.

The team states:
- fairness/disparity assessment completed
- no regression versus current production model on internal disparity metric
- approval rate differences across demographic groups remain within the same range as current model
- no regulatory approval expected
- MRM committee review required before production
- next MRM slot in ~8 weeks, typically cleared in one cycle
- target production timeline: **within 12 weeks**

Remaining work:
- MRM review
- staging / integration test
- deployment

---

## 2) Change classification
This appears to be a:

**Material model update to an existing decisioning capability**, not a new product launch.

Why:
- existing production capability already in place
- same use case and business process
- no stated change to product terms
- no stated change to decision thresholds
- no new regulatory approval path anticipated
- core change is retraining / refresh of model inputs and parameters

However, because the model influences **credit decisions / lending exposure**, this should still be treated as **high-governance** even if not net-new.

---

## 3) Objective and business rationale
### Objective
Restore degraded model performance by retraining on more recent data so recommendations better reflect current customer behaviour.

### Business rationale
- production performance has deteriorated materially (Gini 0.71 → 0.63)
- drift is plausibly explained by behavioural changes in spending/repayment patterns
- refreshed model is expected to recover predictive power
- improved ranking/recommendation quality should improve credit limit increase targeting

### Expected benefit
- stronger predictive performance
- better alignment to current customer behaviour
- improved recommendation quality for CLI offers
- likely reduction in missed opportunities / poorly targeted offers versus current model

---

## 4) Discovery view on scope
### In scope
- retrained model
- updated model artefact and associated documentation
- MRM submission and approval
- staging/integration testing
- production deployment

### Out of scope based on current description
- new lending product
- policy / threshold changes
- product terms changes
- regulatory approval process
- redesign of the surrounding decision flow

---

## 5) Key discovery findings

### A. Performance drift is well-articulated
The team provides a clear trigger for the change:
- measurable decline in Gini
- plausible behavioural explanation
- offline evaluation showing expected recovery

This is generally sufficient at discovery to justify why the update is needed.

### B. Fairness review has already been considered
The team has completed a disparity assessment and reports:
- no regression vs current model
- fairness profile is comparable

That is helpful and reduces discovery uncertainty. At implementation/governance stage, supporting evidence will still need to be available for review.

### C. Primary delivery dependency is internal governance, not engineering
The critical path appears to be:
- **MRM committee timing (~8 weeks)**
rather than retraining work itself.

Since deployment target is 12 weeks and committee review consumes most of the window, schedule confidence depends heavily on:
- hitting the next committee slot
- avoiding deferral
- not receiving material remediation actions from MRM

### D. External approval dependency appears low
No external regulatory approval is anticipated. Based on the facts presented, that seems reasonable for a retrain of an existing model without changes to product or thresholds.

### E. Implementation complexity appears moderate-to-low
Because:
- model training and offline evaluation are complete
- only limited staging/integration work remains
- no broader process redesign is described

This does not sound like a large platform change, assuming feature pipelines and scoring interfaces are materially unchanged.

---

## 6) Risks and assumptions

## Key risks
### 1. MRM timing / approval risk
Although the team expects no issues, this is still the main schedule risk.
Potential failure modes:
- missing submission pack deadline for next committee
- committee requests further evidence or validation
- review slips by one cycle, which could jeopardize the 12-week target

### 2. Offline-to-production performance gap
Offline evaluation suggests performance recovery, but production uplift may differ due to:
- population shift
- data pipeline differences
- operational scoring effects
- implementation issues in staging/prod

### 3. Fairness comparability may not be the full approval standard
The team states “no regression” on internal disparity metric. MRM or compliance stakeholders may still request:
- broader fairness slices
- stability by segment
- explanation of feature behaviour changes
- monitoring plan post-deployment

### 4. Integration risk
Even “brief” staging tests can surface issues if:
- feature definitions changed
- data freshness differs
- scoring service contract changed
- recommendation amount logic interacts with downstream systems

### 5. Model monitoring / rollback readiness
Given prior drift, the production rollout should have clear monitoring and rollback criteria. If not already prepared, this may become a gating item.

---

## Assumptions
This discovery view assumes:
- no change to decision thresholds
- no change to credit policy rules outside the model
- no materially new data sources requiring separate approval
- no architecture change to the scoring/inference path
- existing production controls and monitoring framework can support the refreshed model
- MRM treats this as a model change under the normal update pathway rather than a full re-approval equivalent to a new model launch

---

## 7) Dependencies
### Internal dependencies
- Model Risk Management committee review and approval
- preparation of governance documentation / validation pack
- staging environment availability
- deployment support from engineering / platform teams
- business owner sign-off from credit risk / credit operations as applicable

### External dependencies
- none explicitly identified

---

## 8) Timeline assessment
### Team target
Production within **12 weeks**

### Plausibility
This is **plausible but governance-critical**.

Indicative timeline from the information provided:
- Weeks 1–2: finalize MRM pack / readiness
- Week ~8: next MRM committee slot
- Weeks 9–10: address any committee actions / approval finalization
- Weeks 10–11: staging/integration testing
- Weeks 11–12: deployment

### Schedule confidence
**Medium**, not high.

Reason:
- there is limited slack relative to the 12-week target
- one missed committee cycle likely pushes delivery beyond target
- any non-trivial MRM follow-up or staging issue could consume the remaining margin

---

## 9) Discovery recommendation
### Recommendation
**Proceed to next phase**, with the change treated as a **governed model refresh / material model update**.

The use case is established, rationale is clear, offline work is complete, and no obvious external approval blocker is identified. The main focus should be on governance readiness and controlled rollout planning.

---

## 10) Conditions / actions to carry forward
Before committing the delivery date, the following should be confirmed:

### Governance
- confirm exact submission deadline for the next MRM meeting
- confirm required artefacts for committee pack are complete
- confirm whether independent validation, challenger analysis, or additional fairness documentation is required
- identify owner for responding quickly to MRM actions

### Implementation
- confirm whether feature schema / transformations changed between current and retrained model
- confirm staging test scope, test data, and entry/exit criteria
- confirm deployment path is standard and low-risk

### Production readiness
- define post-deployment monitoring metrics:
  - model performance
  - approval / recommendation rates
  - segment stability
  - fairness/disparity monitoring
- define rollback criteria and rollback owner
- confirm whether rollout will be full cutover or phased/canary

### Delivery management
- build plan around MRM as critical path
- include contingency for one round of governance feedback
- reserve deployment window in advance

---

## 11) Suggested discovery outcome statement
You could summarize the discovery decision as:

> This proposal is a retraining of an existing production credit limit increase recommendation model to address documented performance drift. The change does not introduce a new product, new approval flow, or changed lending terms, and no external regulatory approval is expected. Discovery supports proceeding, subject to standard model governance approval through MRM, completion of staging/integration testing, and establishment of production monitoring and rollback controls. The target of production within 12 weeks is achievable but depends heavily on timely clearance at the next MRM committee.

---

## 12) Delivery RAG
### Overall discovery status: **Amber-Green**
- **Green** on business rationale
- **Green** on technical concept
- **Green** on external approvals
- **Amber** on schedule due to MRM timing
- **Amber** on governance dependency concentration

---

If you want, I can also convert this into a more formal **discovery template** with sections like:
- problem
- scope
- impact
- dependencies
- risks
- recommendation
- delivery confidence

or into a **one-line /discovery decision** output if your pipeline expects a compact format.