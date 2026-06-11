### Discovery assessment: likely **not yet ready for full build/deploy; subject to MRM gate**
Based on what you’ve described, this looks like a **significant model change** to an existing decisioning model, but **not a new product** and likely **not a materially new use case**. The key gating item is your internal **MRM committee review**, which is still pending and appears to be the principal approval step before production.

### What this means for discovery
The item is appropriate for discovery as a **model refresh / retraining change request** with known scope and manageable risk:
- Existing use case remains the same
- No product/threshold changes
- Performance degradation has been identified and addressed
- Fairness assessment shows no regression versus production
- Offline results suggest performance recovery

### Main risks / dependencies
1. **MRM approval is still outstanding**
   - This is the primary production dependency.
   - Even if approval is expected, it is not yet a certainty.

2. **Timing is tight but feasible**
   - Next MRM slot is ~8 weeks away
   - Committee cycle takes ~1 meeting cycle
   - You want production in 12 weeks
   - That leaves only a small buffer for staging/integration, remediation, or resubmission if requested

3. **No regulatory approval anticipated**
   - That lowers complexity
   - But internal governance still governs the release path

4. **Model drift is the rationale for change**
   - The business justification is strong
   - Documenting the post-COVID behavioral shift and the Gini decline will be important for the committee

### Likely discovery outcome
I would classify this as:

- **Ready to proceed to MRM submission**
- **Not yet ready for production**
- **Potentially on track for 12 weeks, but only if the MRM review is straightforward**

### Recommended next actions
- Prepare MRM package now, including:
  - retraining methodology
  - holdout evaluation
  - comparison to current production model
  - fairness / disparity assessment
  - monitoring plan
  - rollback plan
- Confirm staging/integration requirements and schedule them to begin immediately after MRM approval
- Identify whether any additional operational sign-offs are required beyond MRM
- Build contingency time in case the committee requests revisions

### Bottom line
This is a **well-justified model refresh with no obvious fairness regression**, but it is **still gated by internal governance**. So the right discovery conclusion is: **approved for progression to MRM review, not yet approved for production deployment**.

If you want, I can convert this into a formal **/discovery output template** with fields like *status, rationale, key risks, dependencies, and next decision gate*.