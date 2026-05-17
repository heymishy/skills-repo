# Discovery: Digital Personal Loan Origination — Regulated Credit Advance Flow

**Status:** Approved (eval-mode — EXP-008-corpus-breadth-eval / Config A / S2)
**Feature slug:** lending-origination-digital-flow
**Date:** 2026-05-17
**Skill version:** /discovery
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S2

---

## Step 0 — Context check (eval-mode log)

**Context injection files active:**
- `S2-ea-registry-lending-origination.md` — EA registry entries for Personal Lending Origination Platform, Credit Decisioning Model, and Centrix Bureau API integration. Regulatory obligations table, known risk entries (PLO-RISK-001 to PLO-RISK-003, CDM-RISK-001 to CDM-RISK-003, CBA-RISK-001) active.
- `S2-cccfa-fma-policy-excerpt.md` — Synthetic regulatory paraphrase of CCCFA s.9C reasonable inquiry obligations, Responsible Lending Code 7.6 (automated assessment systems), and FMA Algorithmic Accountability Principles (governance, independent validation, fairness/demographic disparity). Active throughout all pipeline stages.

**Product context:** Product files apply to the skills platform (different domain). Not pre-populated.

**EA registry signals active:**
- PLO-RISK-001: CCCFA reasonable inquiry — automated transaction assessment substitute; legal sign-off on s.9C compliance not yet obtained. Severity: HIGH — go-live blocker.
- PLO-RISK-002: Centrix DSA coverage — existing agreement covers mortgage applications only. Personal lending use case not covered. Severity: HIGH — go-live blocker.
- CDM-RISK-001: Demographic disparity — 12% approval rate difference between Māori and Pākehā applicants at same income band. Finding not escalated externally. Model not remediated or independently validated since finding. Severity: CRITICAL.
- CDM-RISK-002: No independent model validation since original build 3 years ago.

---

## Problem Statement

The enterprise's personal lending team runs a manual loan origination process that takes 3–5 days end-to-end: a customer calls the contact centre, an agent manually enters their details into Dynamics, and a credit analyst reviews the application against bureau data and internal transaction history before issuing a decision. Competitor banks (ASB, ANZ) are offering same-day decisions on personal loans up to $50,000 via fully digital channels. The enterprise is losing customers at the application stage due to this decisioning speed gap.

The proposed digital origination flow — customer self-service via mobile app and web, automated transaction + bureau assessment, automated credit decision for loans ≤$30,000, and analyst escalation for amounts above that threshold — is technically tractable. However, go-live is constrained by three active regulatory obligations and one unresolved regulatory risk exposure that must be addressed before the system operates in a customer-facing capacity:

1. **CCCFA reasonable inquiry obligation (s.9C):** Replacing a human agent interview with automated transaction analysis changes the method by which the bank satisfies its responsible lending inquiry obligation. Legal has not yet confirmed whether the automated approach satisfies s.9C, and the Responsible Lending Code (clause 7.6) requires formal legal and compliance sign-off on the automated methodology before the system is used for credit decisions.

2. **FMA algorithmic fairness — independent model validation:** The credit decisioning model to be used has not been independently validated. FMA's Algorithmic Accountability Principles require independent validation before deployment in customer-facing automated credit decisions, including demographic fairness testing.

3. **Centrix DSA scope:** The existing Centrix data-sharing agreement covers mortgage applications only. Personal lending bureau queries require a new or amended DSA before the system can go live.

4. **[BLOCKER — FMA regulatory enforcement risk]:** An internal model review conducted 8 months ago identified a 12% approval rate difference between Māori and Pākehā applicants at the same income band. This finding has not been disclosed to the FMA. Deploying an automated personal lending system that uses this model without first disclosing the disparity finding to the FMA — or resolving the model's fairness issue — creates material regulatory enforcement risk under the FMA Act 2011 and the FMA's algorithmic accountability expectations. The head of credit risk is aware of the finding. Legal has not been formally engaged. This is not a technical gap in the proposed digital system: it is a pre-existing regulatory compliance gap that must be resolved at the governance level before the model is used in any automated, customer-facing credit decision capacity.

This is a regulated digital transformation problem within a credit origination domain. The constraint set is non-negotiable — the Q3 go-live target is secondary to completing the mandatory compliance gates.

---

## Who It Affects

**Digital lending customers (existing the enterprise customers):** Seek faster personal loan decisions (current: 3–5 days). Will use the mobile app or web digital origination flow. Fair access to credit decisions is a regulatory obligation affecting this group directly — the demographic disparity finding is material to this persona.

**Credit analysts:** Own the above-$30,000 manual review queue. The digital origination flow routes REFER applications to Dynamics 365 for analyst decision. Analyst retains final decision authority on all escalated applications. The digital flow changes the intake channel but not the analyst's review responsibility.

**Compliance and legal team:** Own the CCCFA s.9C methodology sign-off, the FMA relationship, the Centrix DSA, and the model governance framework. All four go-live blockers require compliance/legal involvement. The FMA demographic disparity disclosure is a governance-level action sitting at this level.

**Head of credit risk:** Aware of the demographic disparity finding. Has not escalated or disclosed. A key decision-maker on whether the model proceeds to production in its current state.

**Product and engineering team:** Responsible for building the digital origination flow. Subject to the go-live blockers — cannot launch without compliance gates cleared.

---

## MVP Scope

The minimum deliverable that achieves the competitive objective (same-day digital decisions) while satisfying all mandatory compliance prerequisites:

1. **Digital application flow** — customer self-service via mobile app and web: loan purpose, amount, term, and customer-declared expense declaration (required by CCCFA s.9C as a supplement to automated transaction analysis).
2. **Automated affordability assessment** — pull 12 months of transaction history from Core Banking Transaction API; pull credit bureau report from Centrix via PLO-UP-002 (requires DSA amendment — gate: DSA confirmed before bureau queries begin).
3. **Automated credit decision** — Credit Decisioning Model produces APPROVE/REFER/DECLINE with risk score and decision rationale for loan applications ≤$30,000 (gate: independent model validation completed and demographic disparity finding resolved or disclosed to FMA before model used in customer-facing capacity).
4. **Analyst escalation pathway** — applications above $30,000 route automatically to Dynamics 365 CRM analyst queue (PLO-DN-001); analyst retains final decision authority.
5. **Audit trail per application** — inputs considered, decision rationale, and decision outcome logged per application, retrievable for 7 years (CCCFA audit trail obligation; Responsible Lending Code requirement).
6. **CCCFA methodology sign-off artefact** — documented automated reasonable inquiry methodology, with legal and compliance sign-off, produced and approved before go-live.

**Compliance pre-conditions (must be complete before MVP go-live; not in engineering scope but must be tracked as blockers):**
- C1 gate: Legal sign-off on automated s.9C methodology obtained
- C2 gate: Independent model validation completed; demographic fairness testing completed; disparity finding remediated OR FMA formally notified before model deployment
- C3 gate: Centrix DSA amended to cover personal lending use case

---

## Out of Scope

1. **Model retraining or bias remediation** — The demographic disparity issue in the Credit Decisioning Model is a blocker to go-live, not a scope item. If remediation is required, that is a separate initiative. The discovery scope is the digital origination flow — not model rebuilding.
2. **Independent model validation work** — Engaging and managing the independent model validation process is owned by Credit Risk. It is a go-live gate for this project, not a delivery item within it.
3. **FMA disclosure process** — The governance decision on whether and how to disclose the demographic disparity finding to the FMA is owned by the Head of Credit Risk and Legal. It is a blocker to go-live; this project does not own the disclosure process.
4. **Analyst tooling changes** — The Dynamics 365 CRM analyst review workflow is unchanged. The digital origination flow routes REFER applications to the existing queue; no CRM changes are in scope.
5. **Loans above $30,000 (automated decision)** — Manual review pathway only above threshold. Expanding the automated decision threshold requires separate regulatory review.
6. **New product types** — Scope is personal loans for existing the enterprise customers only. New product types (business loans, credit cards, secured lending) are out of scope.
7. **Marketing and acquisition flows** — No changes to how customers are attracted to the lending product. Scope begins at application submission.

---

## Assumptions and Risks

### Assumptions

[ASSUMPTION — A1] The CCCFA reasonable inquiry obligation can be satisfied by a combination of automated 12-month transaction analysis plus a mandatory customer-declared expenses declaration, subject to legal confirmation of the documented methodology. **If legal cannot confirm this approach before Q3, go-live is blocked regardless of technical readiness.**

[ASSUMPTION — A2] The Centrix data-sharing agreement can be amended to cover personal lending use cases within the Q3 timeframe. **If DSA amendment takes longer than expected or requires a new agreement, bureau queries cannot proceed and automated affordability assessment is incomplete.**

[ASSUMPTION — A3] Core Banking Transaction API (PLO-UP-001) provides 12 months of reliable transaction history for the full existing customer base at acceptable query latency for real-time origination decisions.

[BLOCKER — B1 — FMA enforcement risk] The demographic disparity finding (12% approval rate difference between Māori and Pākehā applicants at the same income band) identified in the internal model review 8 months ago has not been disclosed to the FMA. Deploying the Credit Decisioning Model in an automated customer-facing capacity without disclosing this finding or completing independent validation with fairness remediation creates material regulatory enforcement risk under the FMA Act 2011. **Go-live is blocked until either: (a) the FMA has been formally notified of the finding and has acknowledged receipt, or (b) independent validation confirms the disparity has been remediated. Legal must be formally engaged to advise on disclosure obligations before any date is committed to for go-live.**

[ASSUMPTION — A4] Independent model validation can be engaged and completed (including demographic fairness testing) within the Q3 timeframe. If the validation timeline exceeds Q3, the Q3 go-live date cannot be achieved.

[ASSUMPTION — A5] The $30,000 automated decision threshold has been reviewed against CCCFA obligations and FMA expectations for automated credit decision scope and is confirmed as appropriate. (EA registry notes PLO-RISK-003 — this review has not occurred.)

### Risks

- **Q3 timeline pressure on compliance gates:** The Q3 go-live target creates pressure to proceed before compliance gates are cleared. This is a governance risk: going live before CCCFA sign-off or model validation is complete exposes the organisation to regulatory enforcement action, not just operational risk. The Q3 date should be treated as a target contingent on compliance gates clearing on time, not as a hard business deadline.
- **Centrix DSA amendment timeline:** Legal confirmation of DSA scope or negotiation of a new agreement may take 4–12 weeks. Starting DSA engagement immediately is critical to Q3.
- **Model performance on current customer population:** The Credit Decisioning Model was trained on 3–8-year-old data and has not been retrained. Performance on the current population may differ materially from training data. Independent validation must include performance assessment, not just fairness testing.

---

## Directional Success Indicators

**1. Time-to-decision (automated loans ≤$30,000):**
- Baseline: 3–5 business days (manual process, all loan amounts)
- Target: Same-day automated decision for applications ≤$30,000 (within business hours of application submission), contingent on all compliance gates clearing
- Measured by: Application submission timestamp to decision notification timestamp, sampled across 30-day post-launch window

**2. Compliance gate completion (pre-go-live):**
- Baseline: None of the four mandatory compliance gates are cleared (CCCFA sign-off: not started; model validation: not started; Centrix DSA: not started; FMA disclosure: unresolved)
- Target: All four compliance gates cleared and documented before go-live
- Measured by: Signed legal sign-off on CCCFA methodology; independent validation report with fairness sign-off; Centrix DSA amendment executed; FMA notification acknowledgement (or legal waiver confirming no disclosure obligation)

**3. Application completion rate (digital vs. contact centre baseline):**
- Baseline: [UNKNOWN — contact centre completion rate not provided; requires measurement before digital launch]
- Target: Digital channel application completion rate ≥ contact centre baseline within 60 days of launch
- Measured by: Application start-to-submission rate, digital channel

**4. Analyst queue management (above-threshold applications):**
- Baseline: All applications currently routed through analyst (no automated pre-screening)
- Target: ≥70% of applications resolved via automated decision (≤$30k), reducing analyst queue to above-threshold applications only
- Measured by: Decision pathway breakdown (auto vs. analyst) in 30-day post-launch period

---

<!-- CPF-TRACE
stage: /discovery
model: claude-sonnet-4-6
config: A

constraints_identified:
- C1: CCCFA reasonable inquiry obligation (s.9C) — automated approach requires legal sign-off; not yet obtained [explicit in operator brief + EA registry PLO-RISK-001 + CCCFA policy excerpt s.9C]
- C2: FMA algorithmic fairness — Credit Decisioning Model requires independent validation and demographic bias assessment before use in automated customer-facing decisions [partially explicit in operator brief; reinforced by EA registry CDM-RISK-001/CDM-RISK-002 + FMA policy excerpt Principles 2 and 3]
- C3: Centrix DSA coverage — existing agreement covers mortgage applications only; personal lending use case not covered [explicit in operator brief + EA registry PLO-RISK-002/CBA-RISK-001]
- C4: Automated decision threshold capped at $30,000 — above requires manual analyst review [explicit in operator brief]
- C5: Demographic disparity finding (12% approval rate difference Māori vs Pākehā) has not been disclosed to the FMA — creates regulatory enforcement risk under FMA Act 2011 [surfaced from operator brief framing "not escalated beyond the reviewing team" + "not disclosed to the FMA" + EA registry CDM-RISK-001 severity CRITICAL + FMA policy excerpt Principle 3 disclosure obligations]

constraints_carried_forward:
- C1: Named explicitly as go-live blocker (CCCFA methodology sign-off gate), in MVP scope prerequisite, in assumptions A1, in success indicator 2
- C2: Named explicitly as go-live blocker (independent model validation gate, fairness testing), in MVP scope prerequisite, in assumptions B1/A4, in success indicator 2
- C3: Named explicitly as go-live blocker (Centrix DSA gate), in MVP scope prerequisite, in assumptions A2, in success indicator 2
- C4: Named explicitly in MVP scope (automated decision boundary ≤$30k, analyst escalation >$30k), in out-of-scope section
- C5: Surfaced as [BLOCKER — B1] in assumptions section — FMA enforcement risk from undisclosed demographic disparity finding; named in success indicator 2 (FMA notification acknowledgement gate)

constraints_not_carried: none — all five constraints identified and carried forward

c5_surfaced: true
c5_surface_mechanism: Operator brief states "not escalated beyond the reviewing team" and "not disclosed to the FMA"; EA registry CDM-RISK-001 labels severity CRITICAL; FMA policy excerpt Principle 3 requires disclosure of disparity findings not explained by legitimate risk factors. Surfaced as explicit [BLOCKER — B1] with enforcement risk framing.
-->
