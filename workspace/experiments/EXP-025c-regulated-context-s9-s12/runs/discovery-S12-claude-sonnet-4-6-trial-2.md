I'll read the product context and reference materials before proceeding.

No `product/` directory or `artefacts/` reference folder is present in this session. Proceeding from the operator brief directly.

The organisational context identifies this as a **registered NZ bank** operating under RBNZ supervision. Before I can write any artefact sections, I need to flag that the brief contains several statements I cannot accept at face value given the regulatory context injected into this session. I'll work through the clarification gate first, then produce the full artefact in eval mode as required.

---

**Clarification gate assessment:**

The input is substantive and names a specific problem, persona class (credit risk team / existing enterprise credit card customers), measurable baseline (Gini 0.71 → 0.63), and proposed scope. The gate condition for thin/ambiguous inputs does not apply. However, the input contains **material regulatory assumptions that conflict with the authoritative context** — these must be surfaced before sections are written, not buried in prose.

Specifically:

1. *"No regulatory approval is anticipated. This is a model update, not a new product."* — Under **CPG 220** (the current de facto RBNZ model risk standard per the injected context), independent model validation before production activation is a **hard go-live gate**, not a documentation preference. Internal MRM committee review may or may not satisfy this requirement depending on whether the committee constitutes "independent" validation under CPG 220's definition. This cannot be assumed away.

2. *"The retrained model shows no regression… We are satisfied that the fairness profile is comparable."* — A self-assessed demographic disparity check conducted by the credit risk team is not necessarily independent validation. CPG 220 requires independent sign-off at CRO level or above for material credit models. Whether this assessment satisfies that requirement is unconfirmed.

3. *"The MRM committee meets bi-monthly… we anticipate no issues."* — The 12-week timeline assumes a single MRM cycle with no issues. If CPG 220 requires independent (not self-assessed) validation and the MRM committee is not constituted to provide that, a second cycle or an external validation engagement would blow the timeline.

4. **CCCFA** — Enterprise credit card accounts are consumer credit products within scope of the Credit Contracts and Consumer Finance Act. The retrained model affects credit limit decisions, which are part of responsible lending obligations. The brief does not address whether retraining documentation and the new model's decision audit trail will be retained for 7 years from contract end.

These are surfaced as `[ASSUMPTION]` lines in the artefact below. I proceed to produce the full artefact now per the eval-mode directive.

---

# Discovery Artefact

**Feature:** Credit Risk Model Retrain — Enterprise Credit Card Limit Recommendations
**Slug:** `2025-07-15-credit-risk-model-retrain`
**Status:** Draft — Pending MRM Approval and CRO Sign-off
**Prepared:** Eval mode (single-turn)

---

## Problem Statement

The ML model currently powering automatic credit limit increase recommendations for enterprise credit card customers has experienced material performance drift since deployment approximately two years ago. The Gini coefficient has declined from 0.71 at deployment to 0.63 on a recent holdout evaluation — a drop of 0.08 Gini points, or approximately 11% relative degradation. The credit risk team attributes this to structural shifts in customer spending and repayment behaviour following COVID-19, which were not represented in the original training window.

At Gini 0.63, the model's discriminatory power is materially weaker than at deployment. This means the model is generating a higher proportion of sub-optimal recommendations than it would at its intended performance level — either under-recommending limit increases to creditworthy customers (revenue and customer experience cost) or over-recommending increases to customers whose risk profile has changed (credit loss exposure). The magnitude of each directional error is not quantified in the brief.

Retraining on a fresh 24-month transaction window has been completed offline and is expected to restore Gini to approximately 0.71 or better. The remaining work is governance, integration, and deployment.

---

## Personas

**1. Credit Risk Analyst / Model Owner (internal)**
- Responsible for model performance monitoring, retraining cycles, and MRM submissions
- Encounters the problem when holdout evaluation reveals performance below acceptable threshold
- Cost of inaction: continued exposure to sub-optimal limit decisions; regulatory risk from operating a degraded credit model without a documented remediation plan

**2. Enterprise Credit Card Customer (existing)**
- Does not interact with the model directly; receives or does not receive a credit limit increase offer based on the model's recommendation
- Encounters the problem when the degraded model generates an offer they should not receive (over-limit risk) or fails to generate an offer they qualify for (missed value)
- Cost of inaction: customers who would qualify under a well-calibrated model continue to be denied limit increases; customers with deteriorated risk profiles may receive increases the bank will later need to reverse

**3. MRM Committee Member**
- Reviews model change submissions against internal governance standards and, implicitly, CPG 220 requirements
- Encounters the problem when a model submission arrives without complete independent validation documentation
- Cost of poor artefact quality: committee cycle consumed without resolution; submission returned for additional work; timeline impact

**4. Chief Risk Officer (CRO)**
- Under CPG 220, material credit model sign-off cannot be delegated below CRO level
- Encounters the problem when a model reaches the sign-off gate without adequate independent validation documentation
- Cost of gap: hard governance block; potential regulatory exposure if the model is activated without CRO sign-off

---

## Why Now

The model's Gini coefficient has declined from 0.71 to 0.63 — a threshold the credit risk team has identified as material underperformance. The offline retraining work is complete, meaning the bank is now in a position where it holds a demonstrably better-performing model but cannot yet deploy it pending governance. Delay beyond the current timeline increases the period during which the degraded model continues to generate recommendations, extending both the credit quality exposure and the period of operating a model known to be underperforming without a deployed remediation.

The 12-week target is driven by the MRM committee meeting schedule (next slot approximately 8 weeks away) and a desire to minimise time-to-production once governance is cleared.

---

## MVP Scope

Deploy the retrained credit limit recommendation model for the enterprise credit card portfolio, replacing the current production model, subject to:

1. Completed MRM committee review and approval
2. Confirmed independent validation sign-off at CRO level (see Assumptions — this requirement is unconfirmed as met by the current process)
3. Successful integration test in staging with defined pass/fail criteria
4. No change to decision thresholds or lending product terms (scope boundary — any threshold change is a separate initiative)
5. CCCFA audit trail and 7-year retention confirmed on the destination system before decommission of the current model's decision logs

**Explicit deferrals:**
- Threshold recalibration: out of scope; any change to recommendation thresholds triggers a separate model change process
- New demographic disparity methodology: the brief confirms the current internal disparity metric is used; methodology review is deferred
- Real-time monitoring dashboard enhancements: any tooling improvements to support ongoing model monitoring are deferred to a separate initiative

---

## Out of Scope

1. **Decision threshold changes** — The brief explicitly states thresholds are not changing. Any proposal to recalibrate thresholds must go through a separate MRM submission and is not part of this initiative.
2. **Lending product term changes** — No changes to credit card terms, interest rates, fees, or credit limit ceiling/floor parameters.
3. **New model features or data sources** — The retrain uses the same feature set (transaction behaviour, repayment history, utilisation patterns) on a fresh data window. Adding new data sources or features is out of scope and would require a new MRM submission.
4. **Consumer (retail) credit card portfolio** — The brief specifies enterprise credit card accounts. Retail credit card models are not in scope.
5. **Fairness methodology redesign** — The existing internal disparity metric is used as-is. Any move to an alternative fairness framework (e.g. equalised odds, counterfactual fairness) is deferred.

---

## Assumptions and Constraints

### Confirmed constraints (from operator brief)
- Retraining and offline evaluation are complete
- MRM committee review is required before production
- No decision threshold changes
- No lending product term changes
- Demographic disparity assessment has been conducted using the current internal metric

### Unconfirmed assumptions — require /clarify before scope is locked

**[ASSUMPTION]** The MRM committee review constitutes "independent model risk validation" as required under CPG 220 — unconfirmed, requires /clarify before scope is locked.

> CPG 220 requires independent validation, with sign-off no lower than CRO level, before a material credit model is activated in production. "Independent" means the validators were not involved in model development or the retraining process. If MRM committee members include credit risk team staff who participated in the retraining, the committee review may not satisfy CPG 220's independence requirement. This must be confirmed with the CRO and, if necessary, with RBNZ before the model is activated.

**[ASSUMPTION]** The demographic disparity assessment conducted by the credit risk team satisfies CPG 220's independent validation requirement for fairness — unconfirmed, requires /clarify before scope is locked.

> A self-assessed fairness check (conducted by the team that built and retrained the model) is not independent validation under CPG 220. Whether an independent review of the disparity methodology and results is required — and whether the MRM committee provides that independence — is unconfirmed.

**[ASSUMPTION]** The 12-week timeline is achievable if MRM committee review requires only one cycle — unconfirmed, requires /clarify before scope is locked.

> The brief assumes a single MRM committee cycle with no issues. If CPG 220 independent validation requires work beyond what the MRM committee provides (e.g. external model validator engagement), the timeline is at risk. The three prior model submissions mentioned in the brief are noted, but prior approvals do not guarantee the same process applies if CPG 220 compliance has not previously been explicitly tested against the independence standard.

**[ASSUMPTION]** CCCFA 7-year retention of model decision records (recommendation outputs, input features, and responsible lending documentation) is confirmed as maintained through the model replacement — unconfirmed, requires /clarify before scope is locked.

> Enterprise credit card accounts are consumer credit products under CCCFA. Credit limit decisions are part of the responsible lending record and must be retained for 7 years from the date the contract ends. Replacing the production model must not sever access to historical decision records from the current model. The brief does not confirm that decision audit trail continuity has been assessed as part of the deployment plan.

**[ASSUMPTION]** "No regulatory approval is anticipated" is a complete characterisation of the bank's regulatory notification obligations — unconfirmed, requires /clarify before scope is locked.

> The brief's framing ("this is a model update, not a new product") may be correct for some notification purposes but does not address all obligations. In particular: (a) if RBNZ BS11 applies to the credit card platform as a core banking system component, a material change notification may be required even for a model update; (b) CPG 220 is a hard go-live gate regardless of notification — it is not a regulatory approval process, it is a governance requirement the bank carries as an operating obligation.

---

## Directional Success Indicators

**1. Gini coefficient — production model performance**
- Baseline: 0.63 (current production model, recent holdout evaluation)
- Target: ≥ 0.71 (pre-drift deployment level, confirmed in offline evaluation of retrained model)
- Measured via: holdout evaluation on live transaction data, conducted by model owner at 30 days and 90 days post-deployment

**2. Model governance cycle time**
- Baseline: [UNKNOWN BASELINE] — no prior cycle time for a model retrain of this type is stated in the brief
- Target: MRM committee review completed within one bi-monthly cycle (≤ 8 weeks from submission)
- Measured via: MRM committee submission date and approval date, tracked by model owner

**3. CCCFA decision record continuity**
- Baseline: [UNKNOWN BASELINE] — no current state of decision log retention infrastructure is described
- Target: 100% of historical credit limit recommendation records from the current model remain accessible and auditable after the new model is activated, for the full 7-year CCCFA retention period
- Measured via: pre-deployment audit of decision log storage, confirmed by compliance/legal before go-live

**4. Integration test pass rate**
- Baseline: N/A (new deployment gate)
- Target: All defined integration test cases pass in staging before production cutover; zero P1/P2 defects open at deployment
- Measured via: integration test report from staging environment

---

## Constraints

**Regulatory and governance (from injected organisational context — apply regardless of whether the brief mentions them):**

- **CPG 220 (APRA / RBNZ de facto standard):** Independent model validation before production activation is a hard go-live gate. Board-level accountability applies: sign-off for a material credit model cannot be delegated below CRO level. *Source: context-regulated.yml*
- **CCCFA:** Consumer credit decision records must be retained for 7 years from contract end. The model deployment plan must confirm audit trail continuity. *Source: context-regulated.yml*
- **MRM committee schedule:** Bi-monthly cadence creates a hard dependency. If the submission is not ready for the next slot (~8 weeks), the timeline extends by a full cycle (~10 weeks total delay from next slot).

**Timeline:**
- 12-week target to production is the stated driver
- Timeline is contingent on single MRM cycle with no issues and no CPG 220 independent validation gap being identified

**Scope boundary:**
- No threshold changes, no product term changes, no new data sources — any deviation triggers a new MRM submission and restarts the governance process

**Technical:**
- Retraining and offline evaluation are complete — no further model development is in scope
- Staging integration test is a go-live dependency; pass/fail criteria must be defined before the test begins (not stated in the brief — flagged as a gap)

---

## /clarify recommendation

This discovery contains **5 unconfirmed assumptions** that affect scope, go-live eligibility, and regulatory compliance. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

1. **[ASSUMPTION]** The MRM committee review constitutes "independent model risk validation" as required under CPG 220 — unconfirmed, requires /clarify before scope is locked.

2. **[ASSUMPTION]** The demographic disparity assessment conducted by the credit risk team satisfies CPG 220's independent validation requirement for fairness — unconfirmed, requires /clarify before scope is locked.

3. **[ASSUMPTION]** The 12-week timeline is achievable if MRM committee review requires only one cycle — unconfirmed, requires /clarify before scope is locked.

4. **[ASSUMPTION]** CCCFA 7-year retention of model decision records is confirmed as maintained through the model replacement — unconfirmed, requires /clarify before scope is locked.

5. **[ASSUMPTION]** "No regulatory approval is anticipated" is a complete characterisation of the bank's regulatory notification obligations — unconfirmed, requires /clarify before scope is locked.

Running `/benefit-metric` with these assumptions unresolved will produce a timeline and scope that may require material revision if CPG 220 independence or CCCFA retention gaps are identified at the MRM submission gate.

---

## Attribution

**Contributors:**
- [UNKNOWN — eval mode; operator did not provide contributor names]

**Reviewers:**
- Pending

**Approved By:**
- Pending — must be populated before Definition of Ready gate. A non-engineering approver (CRO or delegate) is expected given CPG 220 board-level accountability requirements.

---

## Approval gate

> **Discovery draft complete ✓**
>
> This artefact contains 5 unconfirmed assumptions, four of which have direct regulatory weight (CPG 220 independence, CCCFA retention, notification obligations, fairness validation). Running `/clarify` before `/benefit-metric` is strongly recommended — the timeline estimate is sensitive to whether a second MRM cycle or external validator engagement is required.
>
> How do you want to proceed?
> 1. Run `/clarify` now (recommended)
> 2. Review and approve without `/clarify` — skip to sign-off
>
> Reply: 1 or 2

---

*Before closing: run `/estimate` to record a rough focus-time forecast for this initiative, or reply `skip` to continue without an estimate.*

---

**Pipeline state update:** Feature entry `2025-07-15-credit-risk-model-retrain` to be written to `.github/pipeline-state.json` with `stage: "discovery"`, `health: "green"`, `regulated: true`, `complianceProfile: "regulated"`, `complianceFrameworks: ["CPG_220", "CCCFA"]`, `sensitiveDataCategories: ["credit_history", "transaction_behaviour", "demographic_data"]`. Guardrails seeded: `CF-CPG_220` (not-assessed), `CF-CCCFA` (not-assessed). Pipeline state updated ✓.

<!-- eval-mode: true -->