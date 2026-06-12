Below is the structured **/discovery** output.

---

## 1) Initiative summary
Retrain the existing model used for **automatic credit limit increase recommendations** on enterprise credit card accounts.  
The model currently analyzes:

- transaction behaviour
- repayment history
- utilisation patterns

and recommends:

- whether to offer a credit limit increase
- if yes, how much

The existing model was built about **2 years ago** and has experienced performance drift. The team has already completed retraining and offline evaluation using a fresh **24-month transaction window** and now wants to move the updated model through governance and into production.

Target production timeline: **within 12 weeks**.

---

## 2) Business driver
Primary driver: **model performance deterioration** due to behavior shift.

Evidence provided:

- Gini at deployment: **0.71**
- Recent holdout Gini: **0.63**
- Suspected cause: **post-COVID changes in spending and repayment behaviour**

Expected outcome from retraining:

- restore model performance to approximately **0.71 or better**

This is a **performance optimization / model refresh** for an existing capability, not a new business product or new decision type.

---

## 3) What is changing
### In scope
- Retrained version of the existing credit limit increase recommendation model
- New training data window: **fresh 24 months**
- Updated model artifact for the same operational use case
- Staging integration test
- Production deployment after governance approval

### Not changing
- No new product
- No change to decision thresholds
- No change to lending product terms
- No expected regulatory approval process
- No expansion of use case beyond current credit limit recommendation capability

---

## 4) Current stage / maturity
The initiative appears to be in **late pre-production**.

Completed:
- retraining
- offline evaluation
- demographic disparity assessment

Remaining:
- Model Risk Management committee review
- staging integration test
- production deployment

This is not a research-stage model; it is an update to an established production system.

---

## 5) Performance / impact evidence
### Performance drift identified
- Existing production model has degraded from **0.71 to 0.63 Gini**

### Expected benefit
- Retrained model expected to recover to **~0.71+ Gini** based on offline evaluation

### Practical business implication
Improved ranking/calibration of customers for credit limit increase recommendations should improve recommendation quality and reduce performance loss caused by concept drift, while keeping the current product and policy framework intact.

---

## 6) Fairness / responsible AI considerations
The team has already completed a **demographic disparity assessment**.

Findings:
- Retrained model shows **no regression relative to current production model**
- Approval rate differences across demographic groups are **within the same range** as the current model
- Team considers fairness profile **comparable**

Discovery interpretation:
- This suggests the update is **not introducing a new known fairness deterioration**
- However, “comparable to current production” does not necessarily mean “optimal” or “risk-free”; it means **no worsening by internal metric**
- Because this is a credit-related use case, fairness and governance remain important, but based on the information provided there is **no flagged fairness blocker**

---

## 7) Governance / approvals
### Required
- **Model Risk Management (MRM) committee review** before production

### Timing
- Committee meets **bi-monthly**
- Next submission slot: **~8 weeks away**
- Review typically takes **one meeting cycle**

### Confidence
- Team anticipates no issues
- Similar models have passed this process **three times in the past two years**

### Regulatory
- **No external regulatory approval anticipated**

Discovery interpretation:
- The main gating dependency is **internal model governance**
- This is the critical path item for timeline feasibility

---

## 8) Delivery timeline assessment
### Desired production date
- **within 12 weeks**

### Remaining work
- MRM review
- brief staging integration test
- deployment

### Feasibility
This looks **feasible but schedule-tight**, with the MRM committee as the primary determinant.

Reasoning:
- If submission to the next MRM slot occurs on time and approval happens in one cycle, there should be enough remaining time for:
  - staging integration testing
  - deployment prep
  - production release
- If the committee slips, requests remediation, or the submission misses the next slot, the 12-week target becomes at risk quickly

### Delivery risk level
- **Moderate schedule risk**
- **Low implementation risk**
- **Low regulatory risk**
- **Moderate governance dependency risk**

---

## 9) Key risks and dependencies
### Key dependency
- **MRM committee approval** is mandatory and on the critical path

### Risks
1. **Committee timing risk**
   - Next slot is 8 weeks away, leaving limited buffer inside a 12-week target

2. **Governance feedback risk**
   - Even if issues are not expected, any request for additional analysis or documentation could push timeline beyond target

3. **Integration / deployment risk**
   - Described as brief, but still needs validation in staging and production rollout coordination

4. **Model drift recurrence risk**
   - Retraining addresses current drift, but post-COVID behavior shifts suggest ongoing monitoring should remain important after deployment

---

## 10) Likely discovery classification
This appears to be a **low-to-moderate complexity model change** with an established precedent.

Most likely classification:
- **Existing model refresh / retraining**
- **Material enough for governance review**
- **Not a new AI product or novel deployment**
- **Not externally regulated as a new approval event**

If your discovery process distinguishes between:
- new use case
- significant model change
- routine retraining

this would fit best under **significant update to an existing production model**, rather than a routine unattended refresh, because:
- performance has materially drifted
- governance approval is required
- deployment changes a production model artifact in a credit decision-support context

---

## 11) Recommended discovery outcome
### Suggested outcome
**Proceed to governance and delivery planning**, with discovery likely able to conclude that:

- business need is clear
- technical work is largely complete
- fairness review has been completed with no regression flagged
- no external regulatory approval is expected
- primary remaining blocker is internal MRM approval

### Suggested discovery decision
**Proceed, subject to MRM approval and standard pre-production validation**

---

## 12) Suggested next-step actions
1. **Lock MRM submission package immediately**
   - maximize chance of hitting the next committee slot
   - ensure documentation is complete to avoid avoidable deferrals

2. **Pre-book staging and deployment windows**
   - reduce post-approval delay

3. **Prepare rollback and monitoring plan**
   - especially tracking post-deployment Gini/performance drift
   - confirm fairness monitoring continues after release

4. **Confirm no policy threshold changes are being introduced indirectly**
   - since thresholds are stated as unchanged, document this clearly for governance

5. **Maintain contingency against committee slippage**
   - if 12-week target is business-critical, define fallback options now

---

## 13) Concise discovery readout
A retrained credit limit increase recommendation model is ready for production progression after performance drift reduced Gini from 0.71 to 0.63. Offline testing indicates retraining on a fresh 24-month dataset should restore performance to ~0.71+. Fairness assessment shows no regression versus the current model. No external regulatory approval is expected, but internal MRM committee approval is required and is the main schedule dependency. With MRM submission in the next slot, the requested 12-week production target appears achievable but with limited buffer.

If you want, I can also convert this into a stricter **discovery template** with fields like:
- **Use case**
- **Materiality**
- **Regulatory impact**
- **RAI/Fairness**
- **Dependencies**
- **Go/No-Go recommendation**