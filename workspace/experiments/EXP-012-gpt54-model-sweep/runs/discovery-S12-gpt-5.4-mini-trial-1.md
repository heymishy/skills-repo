## /discovery assessment

This request appears to be a **model change / retraining of an existing credit decisioning model**, not a greenfield product. Based on what you’ve provided, it looks like a **managed internal model update** with no expected regulatory approval, but it still sits in a **regulated lending context** and therefore needs governance and timing validation.

### What I’m hearing
- **Use case:** credit limit increase recommendations for existing enterprise credit card accounts
- **Change type:** retrain existing model on a fresh 24-month transaction window
- **Reason:** performance drift since original training
- **Observed performance:** Gini declined from **0.71 to 0.63**
- **Expected after retrain:** back to **~0.71 or better**
- **Fairness/disparity:** internal assessment shows **no regression vs production**, using your standard demographic disparity metric
- **Governance:** MRM committee review required before production
- **Timing:** next MRM slot in ~8 weeks, then one meeting cycle, then staging integration test and deployment
- **Target production date:** within **12 weeks**
- **Regulatory approval:** not anticipated
- **Product / threshold changes:** none

### Initial discovery conclusion
This is likely a **straightforward model modification**, but it is still a **material model change** because:
- it affects **credit decision recommendations**
- it involves **retraining on newer data**
- it is in a **consumer/commercial lending-adjacent domain** where model governance is usually strict
- it will need **MRM approval** before release

### Key dependencies / risk to timeline
The main schedule risk is whether the **MRM review and any required follow-up questions/remediation fit inside the 12-week window**. Based on your description, it seems feasible, but tight.

### Preliminary readiness view
From a discovery standpoint, this looks **ready to proceed to governance review**, assuming the following are already prepared:
- model documentation / updated model card
- training data window and sample selection details
- offline validation results, including Gini comparison
- fairness / disparity assessment summary
- implementation/integration plan for staging and deployment
- rollback plan and monitoring plan for production

### Potential flags to confirm
Before moving forward, I’d want to verify:
1. **Is this model used to make or materially influence adverse/beneficial credit decisions?**
2. **Does the retraining change any feature set, feature definitions, or data sources?**
3. **Are there any thresholding, segmentation, or policy-rule changes bundled with the retrain?**
4. **Does “enterprise credit card accounts” include any consumer-facing credit exposures subject to stricter regulatory review?**
5. **Is there an explicit production monitoring plan for drift, fairness, and performance post-deployment?**

### Suggested status
**Discovery outcome:** *Proceed to MRM review pathway; no obvious blocker identified from the information provided.*

If you want, I can also convert this into a more formal **discovery intake summary** with:
- **change classification**
- **risk rating**
- **go/no-go recommendation**
- **open questions for the committee**