# Discovery Output: Digital Personal Loan Origination

## 1. Executive Summary

The initiative digitises personal loan origination for existing customers, replacing a 3–5 day manual contact-centre process with an automated flow (auto-decision ≤ $30k, analyst review above). The commercial case is sound — competitive parity with ASB/ANZ same-day decisioning and reduced attrition at application stage.

**However, this discovery has identified two critical blockers that must be resolved before build commitment, and one of them requires escalation independent of this project.** The known, unescalated bias finding in the decisioning model is not a project risk to be managed inside this initiative — it is an existing governance and regulatory exposure that this project would materially amplify by scaling the model's decision volume.

**Recommendation: Conditional proceed.** Discovery and design can continue in parallel, but build commitment and the Q3 date must be gated on Blockers B1 and B2 below.

---

## 2. Problem Statement

- Manual origination takes 3–5 days end-to-end vs. same-day decisions at competitors.
- Customer attrition at application stage to ASB and ANZ digital flows.
- Agent data entry into Dynamics is a manual bottleneck and an error source.
- Credit analyst capacity is consumed by applications that could be auto-decided.

**Success looks like:** same-day (target: minutes) automated decisions for loans ≤ $30k, materially reduced application abandonment, analyst capacity focused on >$30k and edge cases.

---

## 3. Proposed Solution (as briefed)

| Stage | Component |
|---|---|
| Channel | Mobile app + web application form (purpose, amount, term) |
| Data enrichment | Core banking transaction history (internal) |
| Bureau | Centrix credit report (external API) |
| Decisioning | Internal risk scorecard → automated decision ≤ $30k |
| Manual path | >$30k routes to credit analyst queue (presumably Dynamics) |

---

## 4. Critical Blockers — Must Resolve Before Build Commitment

### B1 — Unvalidated decisioning model with known, unescalated demographic disparity 🔴

**This is the most serious finding in this discovery, and it exists independently of the project.**

- The model produces statistically different approval rates across demographic groups. This was identified **8 months ago** and not escalated beyond the reviewing team, and not disclosed to the FMA.
- The current manual process at least interposes human judgment per application. The proposed flow **removes the human from all decisions ≤ $30k and dramatically increases decision volume**, scaling any disparate impact.
- Exposure spans multiple regimes: FMA conduct obligations (including CoFI fair conduct programme requirements), potential Human Rights Act 1993 discrimination issues in the provision of credit, and CCCFA lender responsibility principles.
- The non-escalation itself is a governance failure that senior risk/compliance leadership and likely the board risk committee need to know about **now**, regardless of whether this project proceeds.

**Required before build:**
1. Immediate escalation of the 8-month-old finding through the bank's risk governance channels (CRO / compliance / board risk committee). This should not wait for the project.
2. Legal/compliance assessment of FMA disclosure obligations.
3. Independent model validation including fairness/bias testing, with documented remediation or a defensible explanation of the disparity (e.g., whether it's attributable to legitimate credit factors vs. proxy discrimination).
4. Defined ongoing model monitoring and governance for the automated context (decision auditability, periodic fairness re-testing, override/appeal path).

**Project implication:** automated decisioning cannot go live on this model in its current state. The launch-blocking question is not technical delivery — it is model remediation and validation lead time.

### B2 — CCCFA responsible lending compliance for the automated flow 🔴

- The "reasonable inquiries" obligation (CCCFA s 9C and the affordability/suitability requirements) is currently satisfied via agent interview. The brief explicitly states legal has **not confirmed** how the automated flow satisfies it.
- Transaction history + bureau data may support affordability assessment, but suitability inquiries (loan purpose, customer objectives, whether the product meets their needs) and the adequacy of automated inquiries need legal sign-off. Record-keeping and disclosure requirements also change in a digital channel.
- This is a **design-shaping dependency**, not a pre-launch checkbox: the answer determines the application form's content, what data we must collect vs. infer, and possibly whether some segments still require a conversation.

**Required:** legal opinion on the automated inquiry/affordability/suitability approach **before UX and decisioning design are finalised**.

---

## 5. Key Risks (beyond blockers)

| # | Risk | Impact | Notes / Mitigation |
|---|---|---|---|
| R1 | Q3 deadline drives teams to compress B1/B2 resolution | Regulatory breach at scale | Make go-live formally gated on validation + legal sign-off; communicate revised timeline early |
| R2 | Core banking integration complexity (real-time transaction history retrieval) | Schedule | Early spike; confirm whether real-time API exists or batch extract required |
| R3 | Centrix API availability, latency, cost-per-pull, and consent requirements | Schedule, CX | Confirm contract terms support digital-volume pulls; customer consent flow for bureau check |
| R4 | $30k threshold creates gaming/anchoring behaviour (customers split or cap applications) | Credit risk | Decisioning rules for repeat/split applications |
| R5 | Decline handling in a digital channel — adverse action communication, hardship signposting | Conduct risk | CCCFA/Centrix obligations on communicating bureau-based declines; design decline UX deliberately |
| R6 | Analyst queue for >$30k still runs through Dynamics manual workflow | Benefits dilution | In-scope decision needed: do we improve the analyst workbench too? |
| R7 | Fraud/identity risk increases in unattended digital channel | Financial loss | Existing-customer authentication via app helps; define step-up auth and fraud rules |
| R8 | Model explainability — customers and regulators may require reasons for automated declines | Conduct/legal | Ensure scorecard outputs reason codes |

---

## 6. Stakeholders

- **Sponsor:** Personal Lending product owner
- **Must be engaged immediately:** Chief Risk Officer / model risk function, Compliance, Legal (CCCFA + FMA disclosure), internal review team that produced the bias finding
- **Delivery:** Mobile/web channel teams, core banking integration team, Dynamics/CRM team, credit decisioning/scorecard owners
- **External:** Centrix (contract/API), potentially FMA (disclosure), independent model validator
- **Operational:** Contact centre (changed role), credit analysts (>$30k workflow), fraud team

---

## 7. Open Questions

1. Who owns the risk scorecard, and what is realistic lead time for independent validation and remediation?
2. What did the internal review 8 months ago actually find — is documentation available to accelerate the validation work?
3. Does the core banking system expose transaction history via real-time API?
4. What is the current Centrix integration (batch via analysts?) and does the contract cover digital-volume soft/hard pulls?
5. Is the $30k auto-decision threshold a risk-appetite decision with credit committee approval, or an assumption?
6. What happens to declined applicants — referral to manual review, hard decline, or invitation to call?
7. Are joint applications in scope? (Materially complicates affordability assessment and consent.)
8. Volume forecast — needed for Centrix costs, fraud modelling, and analyst queue sizing.

---

## 8. Scope Recommendation

**MVP (post-blocker resolution):**
- Single-applicant, existing-customer, app + web application
- Auto-decision ≤ $30k on validated model; >$30k to analyst queue
- Centrix + transaction history enrichment; reason-coded decisions; full decision audit log

**Explicitly out of scope (recommend):** new-to-bank customers, joint applications, top-ups/restructures, analyst workbench redesign (phase 2).

---

## 9. Timeline Assessment

**End of Q3 is not credible as currently framed.** Independent model validation plus remediation of a known disparity, plus a legal position on CCCFA compliance, are sequential prerequisites with lead times largely outside the delivery team's control. Options:

- **Option A (recommended):** Resolve B1/B2 now; in parallel, build channel UX, integrations, and the >$30k analyst-routed flow. Launch a **"digital application, human decision"** interim release for Q3 — customers apply digitally, all decisions go to analysts with enriched data. This captures most of the CX and abandonment benefit, cuts the 3–5 days substantially, and defers automated decisioning until the model is validated.
- **Option B:** Hold launch entirely until full auto-decisioning is cleared. Lower interim value, simpler scope.
- **Not an option:** launching automated decisioning on the current model to hit the winter season. The bank would be knowingly scaling a documented, undisclosed fairness defect — the regulatory and reputational downside dwarfs one season's lending volume.

---

## 10. Immediate Next Steps

1. **This week:** Escalate the model bias finding to CRO/Compliance with the original review documentation. This is required regardless of project outcome.
2. Commission legal opinions: (a) FMA disclosure obligation re: the bias finding, (b) CCCFA reasonable-inquiries design for the automated flow.
3. Initiate procurement/scoping for independent model validation.
4.