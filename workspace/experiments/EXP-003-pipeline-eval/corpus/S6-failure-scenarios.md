# S6 — Failure Scenarios Corpus

**File type:** Controlled input briefs — NOT produced artefacts
**Experiment:** EXP-003-pipeline-eval
**Purpose:** Three failure-mode scenarios testing pipeline behaviour under adversarial conditions: thin brief (S6a — clarification trigger), contradictory constraints (S6b — contradiction detection), and scope creep (S6c — scope discipline). These are behavioural tests, not CPF measurement runs.

---

# S6a — Partial Brief (Missing Regulatory Context)

## Operator input — paste verbatim to `/discovery`

```
/discovery — We need to add a new payment type to our internet banking platform. Customers should be able to pay their rates bill directly from internet banking using their council reference number. The council will provide a bulk file of reference numbers and amounts daily. We match against the customer's reference number and present the payment option. The customer confirms and we process via our existing bill payment infrastructure.
```

---

## Evaluator notes

This brief is intentionally thin. No regulatory constraints are stated. No AML/CFT context. No data security context. No biller relationship context.

**Expected behaviour:** Model emits a `/clarify` recommendation with 2–4 clarifying questions before attempting to produce a discovery artefact. Key questions the model should ask:
- Is this a new biller relationship or using an existing bill payment scheme? (New biller type affects AML/CFT risk tier.)
- Are there AML screening requirements on council payments? (Routine bill payments may be exempt, but this must be confirmed.)
- How is the bulk file transmitted from the council? What data security requirements apply to a bulk file with customer reference numbers and payment amounts?
- What happens if a customer's reference number does not match any record? Is there a fallback or rejection flow?

**CPF measurement:** Not applicable — this is a clarification trigger test. Score: did the model correctly identify this as insufficient input and ask for clarification? (Yes/No) + quality of clarifying questions (0–3).

**Failure mode:** A model that proceeds directly to a full discovery artefact without emitting any clarifying questions has failed the T2/T4 clarification trigger test. This indicates the model has over-fitted to "always produce an artefact" even when input is insufficient.

---

# S6b — Contradictory Constraints Brief

## Operator input — paste verbatim to `/discovery`

```
/discovery — Our fraud team wants to implement real-time transaction monitoring with automatic account suspension when fraud is detected. If the system detects a pattern consistent with account takeover, it should automatically freeze the customer's account and all linked cards without requiring agent intervention.

The feature should operate 24/7 with no human in the loop for the suspension decision. Our target is to reduce account takeover losses by 60%.

Our customer terms and conditions require 24 hours notice before account suspension except in cases of suspected fraud — so this is covered. Our Banking Ombudsman scheme membership requires that we have a documented process for customers to dispute automated decisions that affect their account access.
```

---

## Evaluator notes

This brief contains a direct contradiction between:
1. "No human in the loop for the suspension decision" — fully automated suspension
2. Banking Ombudsman requirement for a documented dispute process for automated decisions affecting account access

Additionally: the "24 hours notice except fraud" T&C carve-out needs legal confirmation that automated fraud detection meets the exception threshold. There is a difference between "suspected fraud" as defined in T&Cs (which may require human judgement) and an automated pattern match.

**Expected behaviour:** Model surfaces the contradiction explicitly as a conflict in the discovery artefact — names both constraints and states that they are in tension, and flags that the tension must be resolved before definition can proceed. A model that merely notes both as constraints without flagging the conflict has missed the contradiction detection requirement.

**Additional expected detections:**
- Banking Ombudsman dispute process is a hard constraint — must appear in constraints section
- The T&C exception "cases of suspected fraud" requires legal confirmation that automated triggers qualify
- "No human in the loop" is a design intent, not a constraint — the model should distinguish these

**CPF measurement:** Did the model identify the contradiction explicitly? (Yes/No) + Did it surface the Ombudsman dispute process as a constraint? (Yes/No) + Did it flag the T&C exception as requiring legal confirmation? (Yes/No)

---

# S6c — Scope Creep Brief

## Operator input — paste verbatim to `/discovery`

```
/discovery — Our mortgage team wants to build a customer-facing mortgage offset account management feature. Customers should be able to view their offset account balance, see how much interest they are saving, move money between offset and everyday accounts, and set up automatic sweeps.

While we're at it, the team has also asked if we could include:
- Mortgage repayment calculator with offset modelling
- Redraw facility management
- Rate lock requests
- Broker portal access to customer offset data
- Integration with our KiwiSaver provider to show combined savings position
```

---

## Evaluator notes

The brief has two sections:
1. **Bounded MVP** — offset account management with four clearly defined features
2. **Scope creep additions** — five additional items that span multiple delivery streams

**Expected behaviour:** Model defines a tight MVP around the original four features, explicitly names and excludes the five additional items with rationale, and does not include any of the additional items in the discovery artefact scope or in the success indicators.

**Quality differentiator:** A model operating above average will categorise the five additions:
- Repayment calculator: reasonable near-term addition (could follow in Sprint 2)
- Redraw facility management: separate feature, not an extension of offset management
- Rate lock requests: separate feature, different product team ownership
- Broker portal access: separate product (B2B channel), different personas and access controls
- KiwiSaver integration: separate product entirely (third-party data integration, different regulatory scope)

**CPF measurement:** Scope discipline — did the MVP stay bounded to the original four features? (Yes/No) + Were the five additional items explicitly excluded with rationale? (Yes/No) + Were any of the five incorrectly included in scope? (count of incorrectly included items)

---

## Cross-scenario S6 scoring table

| Scenario | Test type | Pass criterion |
|----------|-----------|----------------|
| S6a | Clarification trigger | ≥2 clarifying questions before artefact attempt |
| S6b | Contradiction detection | Explicit naming of the constraint conflict; Ombudsman requirement captured |
| S6c | Scope discipline | MVP bounded to 4 features; 5 additions explicitly excluded |
