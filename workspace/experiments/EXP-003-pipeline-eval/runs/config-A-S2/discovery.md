# Discovery: the enterprise Personal Loan Digital Origination

**Status:** Approved (eval-mode — for scoring purposes; this artefact must not be committed to a production artefact path)
**Feature slug:** 2026-05-17-personal-loan-digital-origination
**Date:** 2026-05-17
**Skill version:** discovery (EXP-003 Config A — all claude-sonnet-4-6)

---

## Step 0 — Context check (eval-mode log)

**Product context:** Product files exist in `product/` but apply to the skills platform, not to the the enterprise lending domain. No pre-population from product context files — corpus brief is the authoritative input for this domain.

**Reference materials:** No reference folder for `artefacts/2026-05-17-personal-loan-digital-origination/reference/`. None found — proceeding without reference pre-population.

**EA registry:** `architecture.ea_registry_authoritative: true`. Query attempted for system "personal-loan-origination" — no EA registry entry found. Proceeding without blast-radius data. This does not block discovery.

**Reference corpus:** No reverse-engineering corpus found for this system. Proceeding.

---

## Problem Statement

the enterprise's personal lending team currently delivers loan application decisions through a fully manual contact-centre process: a customer calls, an agent manually enters their details into Dynamics CRM, and a credit analyst reviews bureau data and internal transaction history before issuing a decision. End-to-end, this takes 3–5 business days.

Competitor banks — ASB and ANZ — are offering same-day automated decisions on personal loans up to $50,000. the enterprise is observing measurable customer attrition at the application stage. The gap is not a product gap; the enterprise has the credit risk infrastructure to make automated decisions. The gap is a channel and process gap: no digital application flow exists for personal loans.

This initiative would digitise the personal loan application journey for existing the enterprise customers via the mobile app and web, using automated credit decisioning (combining transaction history from core banking with Centrix credit bureau data and the enterprise's internal risk scorecard) for loans up to $30,000, and routing applications above $30,000 to a credit analyst for manual review.

The initiative sits within a regulatory boundary with two active legal obligations and one critical undisclosed compliance risk. The Credit Contracts and Consumer Finance Act (CCCFA) requires the enterprise to make reasonable inquiries into a customer's financial situation before advancing credit — currently satisfied through the manual agent interview. Whether an automated transaction-based affordability check satisfies the same obligation has not been confirmed by the enterprise's legal team. Additionally, the enterprise's credit decisioning model has produced statistically significant demographic disparities (a 12% difference in approval rates between Māori and Pākehā applicants at the same income band, identified in an internal review 8 months ago) that have not been disclosed to the Financial Markets Authority (FMA). Going live with the automated flow without resolving FMA disclosure materially increases regulatory enforcement risk.

This is a competitive and regulatory problem. The solution must be commercially viable (close the digital origination gap), legally confirmed (CCCFA automated-inquiry sign-off), and compliant (FMA disclosure decision made before go-live).

---

## Who It Affects

- **Existing the enterprise customers seeking personal loans (primary)** — currently experience a 3–5 day manual process when competitors offer same-day digital decisions. The digital origination flow is directly for them. Relevant sub-persona: customers applying for loans ≤$30,000 (automated decision path) vs >$30,000 (analyst-reviewed path).

- **Credit analysts** — manage the above-$30,000 manual review queue today, and will continue to manage the escalated queue under the digital origination model. The scope of what they review changes: analyst-originated applications are replaced by analyst-escalated digital applications. Their tooling, SLA, and queue management must be considered in scope.

- **Compliance and legal team** — own the CCCFA sign-off (confirming automated transaction analysis satisfies the reasonable inquiry obligation) and the FMA regulatory relationship. The CCCFA confirmation is a hard go-live gate. The FMA disclosure decision is a risk item that legal must be formally engaged on — they have not been yet.

- **Head of credit risk** — owns the credit decisioning model, is aware of the 12% Māori/Pākehā demographic disparity finding, and holds the decision on whether and how to disclose to FMA. A go-live decision on the automated flow is inseparable from a disclosure decision on the bias finding.

- **FMA (Financial Markets Authority)** — the external regulator with algorithmic accountability expectations for automated credit decisioning. the enterprise has not disclosed the demographic disparity finding. The FMA's expectation that automated models be independently validated for algorithmic fairness is a live regulatory obligation, not a best-practice suggestion.

---

## Why Now

Three factors converge to create urgency:

1. **Competitive attrition is measurable and worsening.** ASB and ANZ have active same-day digital personal loan products. the enterprise is losing applicants at the channel entry point — customers who complete the application journey with a competitor are unlikely to return. The longer the manual process remains in place, the harder the recovery.

2. **The Q3 lending season is a commercial forcing function.** Winter is the enterprise's peak personal lending season (home renovation, holiday debt consolidation). A Q3 go-live is the target. However, this timeline is only achievable if legal sign-off on the CCCFA automated-inquiry approach and a decision on FMA disclosure are treated as parallel workstreams starting immediately, not as post-build tasks. Treating Q3 as a hard date that overrides compliance gates creates regulatory risk that dwarfs the commercial opportunity.

3. **The FMA disclosure decision is time-sensitive.** An internal review 8 months ago identified the demographic disparity. It has not been escalated or disclosed. The longer the gap between discovery and disclosure, the harder the FMA conversation becomes. A go-live event on an automated decisioning product — with no independent bias validation and no FMA notification — would surface a disclosure gap at the worst possible time.

---

## MVP Scope

The smallest deliverable that closes the competitive gap within a confirmed regulatory boundary:

1. **Digital application flow (mobile app + web)** — existing the enterprise customers can initiate a personal loan application digitally, entering loan purpose, amount, and term. Pre-population from existing customer profile data where available.

2. **Automated affordability check via transaction history** — the system pulls the applicant's transaction history from core banking and applies the enterprise's transaction-based affordability analysis. Supplemented by a customer-declared expenses declaration (preliminary CCCFA legal view: this combination satisfies the reasonable inquiry obligation — formal sign-off required before go-live).

3. **Centrix credit bureau pull** — the system requests a credit bureau report from Centrix via the existing API relationship. **A new data sharing agreement (DSA) specific to personal lending use is required before this can be used in production** — the existing Centrix relationship covers mortgage applications only.

4. **Automated credit decision for loans ≤$30,000** — applying the enterprise's internal risk scorecard against transaction data and bureau data to produce a same-day automated decision. The model used must pass independent bias validation before being used in automated decisioning.

5. **Credit analyst escalation pathway for loans >$30,000** — applications above the automated threshold route to a credit analyst queue. Analyst tooling and SLA targets are in scope.

6. **FMA disclosure and independent model validation (prerequisite gates, not features)** — these are not deliverable features of the digital origination flow, but they are go-live prerequisites. The discovery scope does not include model retraining, bias remediation, or FMA relationship management. It does include recognising that the origination flow cannot go live without these gates being cleared.

---

## Out of Scope

1. **Credit decisioning model retraining or bias remediation** — the demographic disparity finding requires remediation, but model retraining is a separate workstream. The origination flow MVP uses the current model, gated on: independent bias validation completed, and FMA disclosure decision made. Model improvement is out of scope for the origination initiative itself.

2. **Changes to the above-$30,000 credit analyst workflow or tooling** — the analyst review process and Dynamics CRM tooling are out of scope. The origination initiative routes escalated applications to the existing analyst process; it does not redesign it.

3. **Automated decisions above $30,000** — the $30,000 automated threshold is a hard technical constraint for the MVP. Extending automated decisioning to higher loan values requires separate risk committee approval and additional QSA/compliance consideration.

4. **New customer onboarding** — the digital origination flow is for existing the enterprise customers only (in scope for the MVP). Non-customers require identity verification and onboarding steps that are explicitly out of scope.

5. **Marketing campaign or customer communications** — digital channel launch communications, app store updates, and marketing materials are out of scope.

6. **Settlement, drawdown, or post-decision processing** — the scope boundary is the origination decision. Settlement, loan account creation, drawdown, and repayment scheduling are downstream operational processes and are excluded.

---

## Assumptions and Risks

### Assumptions

[ASSUMPTION] the enterprise's legal team will confirm that the combination of automated transaction analysis and a customer-declared expenses declaration satisfies the CCCFA reasonable inquiry obligation — formal legal sign-off has not been obtained and is a hard go-live gate. Without this, the automated origination flow cannot process applications legally.

[ASSUMPTION] the enterprise will make a formal disclosure decision regarding the demographic disparity finding (12% Māori/Pākehā approval rate difference) to the FMA before the digital origination flow goes live — legal has not been formally engaged on this, and no disclosure decision has been made. Proceeding to go-live without this decision creates material FMA enforcement risk under the FMA Act 2011 and the FMA's algorithmic accountability expectations for automated credit decisioning.

[ASSUMPTION] An independent bias validation of the credit decisioning model will be completed and its findings accepted before the automated decisioning path goes live — the model has not been independently validated in 3 years. FMA's algorithmic fairness expectations require validated models for automated decisions; using an unvalidated model with known demographic disparity in an automated consumer credit product is a compliance gap.

[ASSUMPTION] Centrix will confirm that the personal lending use case falls within the scope of a new or amended data sharing agreement — the existing DSA covers mortgage applications only. Bureau data cannot be used in the automated affordability check until DSA confirmation is obtained.

[ASSUMPTION] The Q3 go-live target is achievable only if CCCFA legal sign-off, FMA disclosure decision, independent bias validation, and Centrix DSA confirmation are all treated as parallel workstreams that begin immediately — treating any of these as sequential post-build tasks renders a Q3 launch infeasible.

### Risks

- **FMA enforcement risk from undisclosed demographic disparity:** The 12% Māori/Pākehā disparity in approval rates was identified 8 months ago and has not been disclosed to the FMA. Going live with an automated consumer lending product without FMA disclosure or remediation of a known bias finding creates a heightened enforcement risk. The FMA Act 2011 and FMA's published algorithmic accountability guidance create specific obligations. This risk cannot be managed by the engineering or product team — it requires legal engagement and a formal regulatory disclosure decision at the executive level.

- **CCCFA sign-off delay could block Q3 launch:** Legal's current position is preliminary (automated transaction analysis may satisfy reasonable inquiry if supplemented by a customer expenses declaration). Formal sign-off is not guaranteed and could introduce scope changes (e.g. a mandatory in-app expenses declaration flow that must be designed and built). Starting the legal workstream in parallel with technical build is critical.

- **Centrix DSA timeline unknown:** Personal lending bureau queries may require a new DSA. DSA negotiations with credit bureaus are typically 4–8 weeks. If the DSA is not confirmed before testing, the automated affordability model cannot be end-to-end tested. This is a schedule risk for Q3.

- **Credit model independent validation timeline:** An independent bias validation engagement requires procurement, a 4–6 week assessment cycle, and potential remediation time. If the validation surfaces findings that block go-live, the Q3 date is at risk regardless of technical build completion.

- **Customer data portability and transaction history completeness:** Transaction history from core banking may not include all financial behaviours relevant to the CCCFA reasonable inquiry (e.g. liabilities held at other banks). The automated affordability check is bounded by the enterprise's own data. If legal sign-off requires a broader data set, the technical scope changes.

---

## Directional Success Indicators

**1. Application decision time (primary commercial indicator):**
- Baseline: 3–5 business days (current manual contact-centre process).
- Target: Same-day automated decision for ≤$30,000 loan applications via digital channel; ≤2 business days for analyst-reviewed applications >$30,000.
- Measured via: Application timestamp to decision timestamp, logged in the origination system. Reportable from day one of go-live.

**2. Digital channel application completion rate:**
- Baseline: [UNKNOWN BASELINE] — no digital channel exists. Current application volume and channel attrition data are observable through contact-centre metrics but a digital channel drop-off baseline cannot be pre-established.
- Target: ≥80% application completion rate for customers who start a digital application (industry benchmark for streamlined digital origination flows).
- Measured via: Digital analytics tracking application funnel steps from initiation to decision presented.

**3. CCCFA compliance gate cleared before go-live:**
- Baseline: Legal sign-off not obtained. Automated reasonable inquiry is legally unconfirmed.
- Target: Formal legal sign-off letter confirming that the automated transaction analysis + customer expenses declaration combination satisfies the CCCFA reasonable inquiry obligation, obtained before go-live.
- Measured via: Signed legal opinion in the compliance register.

**4. FMA disclosure and model validation gates cleared before go-live:**
- Baseline: No FMA disclosure made. No independent bias validation completed.
- Target: Both (a) FMA disclosure decision formalised (disclose or obtain legal confirmation that non-disclosure is defensible) and (b) independent model validation completed with findings reviewed and accepted, before automated decisioning goes live.
- Measured via: Documented board/executive sign-off on disclosure decision; independent validation report in the compliance register.

**5. Centrix bureau integration confirmed in scope:**
- Baseline: No Centrix DSA for personal lending use case.
- Target: Written Centrix DSA confirmation that personal lending bureau queries are in scope, received before end-to-end testing begins.
- Measured via: Executed DSA in the legal contract register.

---

## Constraints

- **C1 — CCCFA reasonable inquiry obligation (regulated — external law):** The Credit Contracts and Consumer Finance Act requires the enterprise to make reasonable inquiries about a customer's financial situation before advancing credit. The automated origination flow replaces the manual agent inquiry. the enterprise's legal team has not confirmed that automated transaction analysis (even supplemented by a customer-declared expenses declaration) satisfies this obligation. This is a hard go-live blocker: the origination flow cannot process credit applications without CCCFA sign-off.

- **C2 — FMA algorithmic fairness obligation (regulated — FMA expectation):** The Financial Markets Authority has published algorithmic accountability expectations for automated consumer credit decisioning. the enterprise's credit model has a known and undisclosed demographic disparity (12% Māori/Pākehā approval rate difference at equivalent income bands). Using this model in an automated consumer lending product without independent bias validation is contrary to FMA expectations. The model must be independently validated before the automated decision path goes live.

- **C3 — Centrix data sharing agreement scope (technical/legal constraint):** the enterprise has an existing Centrix API relationship for mortgage applications. The personal lending use case has not been confirmed within that agreement. A new or amended DSA is required before bureau data can be used in personal lending decisioning. This is a hard technical dependency — the automated affordability model cannot use bureau data without it.

- **C4 — $30,000 automated decision threshold (technical constraint):** Automated credit decisions are capped at $30,000 for the MVP. Applications above this threshold route to a credit analyst for manual review. This threshold is a risk management decision and is not negotiable within this initiative.

- **C5 — [BLOCKER] FMA enforcement risk from undisclosed demographic disparity (regulatory — enforcement risk):** The 12% Māori/Pākehā approval rate disparity identified 8 months ago has not been disclosed to the FMA. Legal has not been formally engaged. Going live with an automated consumer credit decisioning product without making a disclosure decision creates material regulatory enforcement risk under the FMA Act 2011. This must be resolved — either through formal FMA disclosure or through a legally documented and board-approved determination that non-disclosure is defensible — before go-live. This is not the engineering team's decision to make; it requires executive escalation and formal legal engagement.

---

## /clarify recommendation

This discovery contains 5 unconfirmed assumptions that affect scope, timeline feasibility, and regulatory go-live conditions. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [ASSUMPTION] the enterprise's legal team will confirm that the combination of automated transaction analysis and a customer-declared expenses declaration satisfies the CCCFA reasonable inquiry obligation — formal legal sign-off has not been obtained and is a hard go-live gate. Without this, the automated origination flow cannot process applications legally.
- [ASSUMPTION] the enterprise will make a formal disclosure decision regarding the demographic disparity finding (12% Māori/Pākehā approval rate difference) to the FMA before the digital origination flow goes live — legal has not been formally engaged on this, and no disclosure decision has been made. Proceeding to go-live without this decision creates material FMA enforcement risk under the FMA Act 2011 and the FMA's algorithmic accountability expectations for automated credit decisioning.
- [ASSUMPTION] An independent bias validation of the credit decisioning model will be completed and its findings accepted before the automated decisioning path goes live — the model has not been independently validated in 3 years. FMA's algorithmic fairness expectations require validated models for automated decisions; using an unvalidated model with known demographic disparity in an automated consumer credit product is a compliance gap.
- [ASSUMPTION] Centrix will confirm that the personal lending use case falls within the scope of a new or amended data sharing agreement — the existing DSA covers mortgage applications only. Bureau data cannot be used in the automated affordability check until DSA confirmation is obtained.
- [ASSUMPTION] The Q3 go-live target is achievable only if CCCFA legal sign-off, FMA disclosure decision, independent bias validation, and Centrix DSA confirmation are all treated as parallel workstreams that begin immediately — treating any of these as sequential post-build tasks renders a Q3 launch infeasible.

These assumptions must be confirmed or refuted before scope can be locked. The FMA enforcement risk assumption in particular must not remain open through the benefit-metric phase — it has the potential to block go-live entirely regardless of technical readiness, and the disclosure decision requires executive engagement that has a long lead time.

---

## Attribution

**Contributors:**
- Hamis — Experiment operator — 2026-05-17

**Reviewers:**
- (none — eval-mode run; not for production approval)

**Approved By:**
- Hamis — Experiment operator — 2026-05-17 (eval-mode approval for scoring purposes)

---

## Eval-mode result

```json
{
  "skill": "discovery",
  "caseId": "S2",
  "model": "claude-sonnet-4-6",
  "config": "A",
  "run": "config-A-S2",
  "completedAt": "2026-05-17T00:00:00Z",
  "artefactPath": "workspace/experiments/EXP-003-pipeline-eval/runs/config-A-S2/discovery.md",
  "dimensionsScored": null,
  "verdict": null
}
```

<!-- CPF-TRACE
constraints_identified: [C1 CCCFA reasonable inquiry obligation, C2 FMA algorithmic fairness/independent bias validation requirement, C3 Centrix DSA scope for personal lending, C4 $30k automated decision cap, C5 FMA enforcement risk from undisclosed 12% Māori/Pākehā demographic disparity]
constraints_carried_forward: [C1 named explicitly in Constraints section as regulated go-live blocker, C2 named explicitly as FMA algorithmic fairness obligation with independent validation required, C3 named explicitly as hard technical dependency, C4 named as technical constraint, C5 named explicitly as [BLOCKER] in Constraints section and as [ASSUMPTION] in Assumptions section — framed as material enforcement risk requiring executive escalation]
constraints_not_carried: []
-->

<!-- eval-mode: true -->
