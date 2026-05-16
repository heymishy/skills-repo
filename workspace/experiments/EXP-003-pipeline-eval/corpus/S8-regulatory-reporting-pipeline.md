# S8 — Regulatory Reporting Pipeline: Change Control Gap

**File type:** Controlled input brief — NOT a produced artefact
**Experiment:** EXP-003-pipeline-eval
**Purpose:** This is the brief sent to `/discovery` for each Config A/B/C run. Tests CPF for a regulated reporting pipeline automation with a hidden governance gap: the normalisation logic that the team wants to encode into the pipeline has never been under change control, has not been reviewed by a second person, and its embedding in a regulated return pipeline would create an indefensible position in a supervisory review.

---

## Operator input — paste verbatim to start each Config run

```
/discovery — Our finance operations team produces Westpac NZ's monthly RBNZ prudential returns and quarterly FMA regulatory reports manually. Three senior analysts extract data from three separate source systems — core banking, treasury, and card platforms — reconcile the figures in Excel, and upload the completed returns via the RBNZ Reporting Portal and the FMA's online submission gateway.

The process consumes 6–8 business days per monthly cycle. We miss our internal sign-off deadline on average once per quarter, which creates pressure on the compliance team and has twice required us to request informal extensions from our RBNZ relationship manager. Senior analysts estimate they spend roughly 40% of their time on extraction and reconciliation steps they believe could be automated.

We want to build an automated regulatory reporting pipeline. The pipeline would connect to the three source systems via read-only APIs, extract the required data fields, and run reconciliation logic automatically. The output is a pre-populated return file that analysts review and approve before submission. Analysts retain sign-off authority — the pipeline does not submit directly to regulators without human review and approval.

One of the reconciliation steps the team currently performs manually is a normalisation process. Several source system fields carry legacy artefacts — rounding differences and timing mismatches introduced when the systems were migrated in 2019. The normalisation step corrects these before the return is populated. We want to formalise this normalisation logic into the pipeline as a permanent data transformation layer, which will eliminate the manual correction step and reduce the risk of analyst error.

The pipeline must produce a complete audit trail of every transformation applied to source data before the return is generated. Both the RBNZ and FMA require that we can trace any submitted figure back to its source data and explain any adjustments made. Our compliance team has flagged this as a non-negotiable requirement.

Our regulatory calendar requires RBNZ prudential returns to be submitted by the 20th of each month for the prior month. Missing a submission deadline attracts a formal notice from RBNZ and can trigger an unscheduled supervisory review.
```

---

## Follow-up context (provide if model asks clarifying questions)

> **Normalisation rules:** The normalisation step was written by one senior analyst in 2019 during the source system migration. It is an Excel macro in a shared finance team file. It has not been modified since. No formal review has occurred. The analyst who wrote it is still with the team and is the only person who fully understands the correction rules.
>
> **RBNZ prior approval for figure changes:** For the monthly prudential return, RBNZ expects that any change to how a reported figure is derived is disclosed in the accompanying submission cover note. We have not disclosed the normalisation step to RBNZ — they have been receiving normalised figures without knowing the figures have been adjusted from raw source values.
>
> **Audit trail depth:** The FMA expects that we hold a log of every transformation applied to source data, including the logic used, the version of that logic, who approved it, and when. This log must be producible within 5 business days on request. Our current Excel-based process has no equivalent log.
>
> **Source system API availability:** Core banking and card platforms have documented read-only REST APIs used by other internal consumers. Treasury data currently requires a manual CSV extract — the treasury system vendor does not offer a regulatory-data API in their standard offering.

---

## Constraint inventory (evaluator only — NOT shown to model)

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | RBNZ Prudential Reporting — prescribed formats, submission deadlines (20th of month), field definitions legally binding; changes to figure derivation require prior RBNZ approval before affecting a submitted return | Regulatory (external law) | Partial — deadline explicit; prior-approval element implicit |
| C2 | FMA Financial Reporting Act 2013 — full audit trail required; every transformation step must be logged with its logic, version, and approver; producible within 5 business days on request | Regulatory (external law) | No — explicit |
| C3 | Human sign-off required before submission — analyst approval is mandatory; no auto-submission to regulators | Regulatory/operational | No — explicit |
| C4 | Normalisation changes reported figures — embedding a correction layer into a regulated return pipeline is a material figure-derivation change requiring RBNZ assessment and disclosure before the pipeline goes live | Regulatory constraint | No — but easy to miss |
| C5 | [Hidden] Normalisation logic lives in an unreviewed Excel macro written by one analyst in 2019 with no change control history, no test suite, and no second-reviewer verification — encoding this into a regulated return pipeline creates an indefensible position in a supervisory review | Hidden governance gap | **Yes — hidden** |

**Regulated constraints:** C1 (RBNZ Prudential Reporting), C2 (FMA audit trail)
**Regulated CPF threshold:** 0.80 (failure threshold for C1 and C2)

---

## Expected artefact characteristics (for judge scoring)

1. **Problem statement** — operational inefficiency in a regulated reporting process, bounded by the regulatory accuracy and audit trail obligations; not "build a data pipeline".
2. **Personas** — finance operations analysts, compliance officer (sign-off obligation), RBNZ relationship manager, CFO/head of finance (designated signatory).
3. **MVP scope** — automated extraction + analyst review workflow + audit trail logging + human approval gate. Normalisation layer explicitly gated behind change-control governance investigation before it can be in scope.
4. **Constraints** — C1 through C4 all named. C5 surfaced: "the existing normalisation logic must be independently reviewed and placed under change control before it can be embedded in a regulated return pipeline — its governance status is unknown and must be confirmed."
5. **Assumptions** — at minimum: normalisation logic governance status (must be confirmed before scoping the transformation layer), RBNZ prior-approval requirement (must be confirmed with compliance team), treasury read-only API (not available from vendor — extraction approach must be confirmed).

---

## CPF measurement notes for evaluator

- C4 is the hardest explicit constraint — the brief frames normalisation positively. Count as propagated only if the model treats it as a figure-derivation change requiring RBNZ assessment, not as a neutral technical step.
- C5 — count as propagated only if the model surfaces that the normalisation logic requires governance review and change-control establishment before it can be used in a regulated pipeline. "The pipeline will have an audit trail" does not count.
- C2 has a depth element — FMA producibility requirement (5 business days) is in the follow-up context. Count as above-average if the model carries the specific time bound as a testable NFR.

---

## Context injection spec (Config C only)

| Injected item | Description | Estimated size |
|--------------|-------------|----------------|
| `context.yml` | Standard toolchain context | ~2 KB |
| `architecture-guardrails.md` excerpt | Data pipeline standards, audit trail requirements for regulated systems, change control standards for transformation logic | ~8 KB |
| Synthetic EA registry entry | Regulatory Reporting Pipeline entry with source system dependencies (CoreBanking-GL, TreasuryLedger, CardPlatform) and regulatory submission interfaces (RBNZ Reporting Portal, FMA Submission Gateway) | ~4 KB |
| Synthetic policy doc | RBNZ Prudential Reporting Standards excerpts (deadline, format compliance, prior approval for figure changes) + FMA Regulatory Returns Guide 2022 (audit trail standards, 5-business-day producibility) | ~14 KB |
| **Estimated total** | | **~28 KB** |
| **Bulk injection risk** | Below 50 KB threshold | None |
