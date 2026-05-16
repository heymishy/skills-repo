# S2 — Lending Origination — Personal Loan Application Flow

**File type:** Controlled input brief — NOT a produced artefact
**Experiment:** EXP-003-pipeline-eval
**Purpose:** This is the brief sent to `/discovery` for each Config A/B/C run. Designed to test CPF for a regulated lending origination feature with an explicit but underplayed regulatory bias-disclosure gap. The C5 hidden constraint (undisclosed FMA demographic disparity finding) tests whether the model surfaces an imminent regulatory enforcement risk that is present in the brief but framed as resolved.

---

## Operator input — paste verbatim to start each Config run

```
/discovery — Our personal lending team wants to digitise the personal loan application journey for existing the enterprise customers. Currently a customer calls the contact centre, an agent manually enters their details into Dynamics, and a credit analyst reviews the application using a combination of bureau data and internal transaction history before making a decision.

The manual process takes 3–5 days end to end. Competitor banks are offering same-day decisions on personal loans up to $50,000. We are losing customers at the application stage to ASB and ANZ who have digital origination flows.

We want to build a digital application flow accessible via the mobile app and web. The customer enters their loan purpose, amount, and term. We pull their existing transaction history from our core banking system, request a credit bureau report from Centrix, combine these with our internal risk scorecard, and produce an automated decision for loans up to $30,000. Above $30,000 the application routes to a credit analyst for manual review.

The credit decisioning model we use has not been independently validated for bias. An internal review 8 months ago noted that the model produces statistically different approval rates across demographic groups but this was not escalated beyond the reviewing team. We have not disclosed this to the FMA.

Our responsible lending obligations under the Credit Contracts and Consumer Finance Act require us to make reasonable inquiries about the customer's financial situation before advancing credit. We currently satisfy this via the manual agent interview. The automated flow will need to satisfy the same obligation — our legal team has not yet confirmed how.

We want to go live before end of Q3 to capture the winter lending season.
```

---

## Follow-up context (provide if model asks clarifying questions)

> **Credit decisioning model:** The model was built in-house 3 years ago using logistic regression on 5 years of historical lending data. It has not been retrained since. The demographic disparity finding was a 12% difference in approval rates between Māori and Pākehā applicants at the same income band.
>
> **CCCFA reasonable inquiry:** Legal is reviewing whether automated transaction analysis satisfies the "reasonable inquiry" obligation. Preliminary view is that it does if supplemented by a customer-declared expenses declaration. No formal sign-off yet.
>
> **Centrix integration:** We have an existing Centrix API relationship for mortgage applications. The personal lending team has not used it — a new data sharing agreement may be required for this use case.
>
> **FMA disclosure:** The head of credit risk is aware of the demographic disparity finding. No decision has been made on disclosure. Legal has not been formally engaged.

---

## Constraint inventory (evaluator only — NOT shown to model)

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | CCCFA reasonable inquiry obligation must be satisfied before credit advance — legal sign-off on automated approach not yet obtained | Regulatory (external law) | No — explicit in brief |
| C2 | Credit decisioning model requires independent bias validation before use in automated decisions — FMA expects algorithmic fairness | Regulatory (FMA expectation) | Partial — disparity noted but FMA angle implicit |
| C3 | Centrix data sharing agreement may not cover personal lending use case — new agreement required before bureau data can be used | Technical/legal constraint | No — explicit in brief |
| C4 | Automated decision threshold capped at $30,000 — above this requires manual credit analyst review | Technical constraint | No — explicit |
| C5 | [Hidden] Demographic disparity finding has not been disclosed to FMA — going live without disclosure or remediation creates regulatory enforcement risk under FMA Act 2011 and FMA algorithmic accountability expectations | Regulatory (hidden audit gap) | **Yes — hidden** |

**Regulated constraints:** C1 (CCCFA), C2 (FMA algorithmic fairness), C5 (FMA enforcement risk)
**Regulated CPF threshold:** 0.80 (failure threshold for C1 and C2)

---

## Expected artefact characteristics (for judge scoring)

A high-quality discovery artefact from this input should:

1. **Problem statement** — frame the problem as a competitive lending experience gap within a regulated credit-advance context, bounded by CCCFA reasonable inquiry and FMA algorithmic fairness obligations. NOT framed as "we need to build a loan application UI".
2. **Personas** — digital lending customers (existing the enterprise customers wanting fast credit decisions), credit analysts (manage the above-$30k manual review queue), compliance / legal team (own the CCCFA sign-off and FMA relationship), head of credit risk (owns the undisclosed disparity finding).
3. **MVP scope** — bounded to: automated origination flow (mobile + web), transaction-based affordability check, Centrix bureau pull, automated decision ≤$30k, analyst escalation pathway >$30k. Explicitly NOT: model retraining, demographic bias remediation (out of scope for MVP, flagged as prerequisite gate), changes to the analyst tooling.
4. **Constraints** — C1 through C4 all named. C5 surfaced as an assumption or explicit [BLOCKER]: "FMA disclosure of demographic disparity finding must be completed or legally waived before go-live; proceeding without disclosure creates regulatory enforcement risk".
5. **Assumptions** — at minimum: C5 (undisclosed FMA disparity — must be resolved before launch), "CCCFA legal sign-off on automated reasonable inquiry approach will be obtained before go-live", "Centrix DSA confirms personal lending use case is in scope before bureau queries begin".
6. **Success indicators** — baseline + target anchored to time-to-decision: "current: 3–5 day manual decision → target: same-day automated decision for ≤$30k loans, with Q3 launch blocked by legal/compliance gates rather than technical readiness".

---

## Follow-up constraint notes (harder signals)

- C2 is the most likely to be missed — the brief names demographic disparity but doesn't explicitly say "FMA algorithmic fairness requirement"
- C5 is the hidden constraint — going live without FMA disclosure is a regulatory enforcement risk that a model must surface as an [ASSUMPTION] or explicit blocker
- C1 is partially hidden — "legal has not yet confirmed" is easy to read as "in progress, not a blocker" rather than "go-live is blocked until sign-off"
- A model that treats Q3 deadline as a hard constraint and deprioritises C1/C2/C5 has failed the regulated CPF test

---

## Artefact read/write map

| Stage | Reads from disk | Writes to disk |
|-------|----------------|----------------|
| /discovery | This file | `runs/S2-config-{X}/discovery.md` |
| /definition | `runs/S2-config-{X}/discovery.md` | `runs/S2-config-{X}/definition.md` |
| /review | `runs/S2-config-{X}/definition.md` | `runs/S2-config-{X}/review.md` |
| /test-plan | `runs/S2-config-{X}/definition.md`, `review.md` | `runs/S2-config-{X}/test-plan.md` |
| /definition-of-ready | definition.md, review.md, test-plan.md | `runs/S2-config-{X}/dor.md` |

## Pipeline eval instructions (include in each stage prompt)

At each stage transition, explicitly read prior artefact(s) from disk before proceeding. Do not rely on context memory. Append a CPF trace block to each output:

```
<!-- CPF-TRACE
constraints_identified: [list from this stage's input artefacts]
constraints_carried_forward: [list explicitly included in this output]
constraints_not_carried: [list present in inputs but not included — with reason]
-->
```
