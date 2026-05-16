# S5 — Staff-Facing Dynamics Feature — Customer Info Update from Transcribed Call

**File type:** Controlled input brief — NOT a produced artefact
**Experiment:** EXP-003-pipeline-eval
**Purpose:** This is the brief sent to `/discovery` for each Config A/B/C run. Tests CPF for a Privacy Act–regulated AI-assisted staff tool where the privacy assessment is pending and the hidden constraint is that the backlogged assessment is a go-live blocker.

---

## Operator input — paste verbatim to start each Config run

```
/discovery — Our contact centre agents currently update customer information (address, phone number, email, employment status) by manually typing what the customer tells them during a call. The process is error-prone — we see approximately 340 customer data quality incidents per month attributable to manual transcription errors.

We want to build a feature in our Dynamics 365 CRM that transcribes the relevant portion of a customer call in real time, extracts the updated information using AI, and pre-populates the update fields for the agent to review and confirm before saving.

The agent always confirms before saving — the AI extraction is a suggestion, not an automatic update.

The call transcription will use Azure AI Speech. The extracted information will be processed by an LLM to identify field-value pairs. The agent reviews the extracted values in a side panel, edits if needed, and clicks confirm.

Customer calls are recorded and retained per our existing call recording policy. The transcription of the call — a text representation — is a new data type we have not handled before. Our privacy team has not assessed whether the transcription constitutes personal information under the Privacy Act 2020 and how long it can be retained.

We also handle calls from customers who are in financial hardship or who are vulnerable — our customer vulnerability policy requires that agents flag these customers and handle them with additional care. The transcription feature should not in any way automate decisions for vulnerable customers.

The Dynamics feature will be used by approximately 280 contact centre staff. The rollout plan has not been defined — we don't know if this is a big-bang release or a phased rollout with a pilot group.
```

---

## Follow-up context (provide if model asks clarifying questions)

> **Privacy Act assessment:** Our privacy team has a backlog of 6 weeks. The assessment has been requested but not scheduled. Preliminary view from a privacy team member (informal) is that the transcription is personal information and retention should match call recording policy (7 years) — but this is not confirmed.
>
> **Vulnerable customer detection:** The current vulnerability flag in Dynamics is set manually by the agent. There is no automated detection. The transcription feature must not add any automated vulnerability assessment — even a suggestion.
>
> **LLM data handling:** The LLM processing will use Azure OpenAI. Our data classification policy requires that customer PII processed by external AI services is covered by a Data Processing Agreement. We have a DPA with Microsoft for Azure services generally — our legal team has not confirmed whether this covers Azure OpenAI specifically.
>
> **Rollout:** The contact centre manager wants all 280 agents live within 2 weeks of go-live. Change management and training plan not yet developed.

---

## Constraint inventory (evaluator only — NOT shown to model)

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | Privacy Act 2020 — call transcription is likely personal information; retention period and handling rules not yet assessed or confirmed | Regulatory (external law) | Partial — brief mentions privacy team hasn't assessed |
| C2 | Customer vulnerability policy — transcription feature must not automate or suggest vulnerability status in any form; firm requirement from Customer Vulnerability team | Internal policy (firm) | No — explicit |
| C3 | Azure OpenAI DPA coverage — existing Microsoft DPA may not cover Azure OpenAI specifically for customer PII processing | Legal/data constraint | No — explicit in follow-up |
| C4 | Agent confirmation required before any data save — no automated data updates; agent must review and confirm every extracted field | Technical constraint (firm) | No — explicit |
| C5 | [Hidden] Privacy Act assessment is backlogged and unscheduled — go-live without completed Privacy Act assessment creates regulatory exposure; under Privacy Act 2020 s.69, an unassessed new personal information data type creates a notifiable breach risk if the data is mishandled | Hidden regulatory gap | **Yes — hidden** |

**Regulated constraints:** C1 (Privacy Act), C3 (data processing agreement)
**Regulated CPF threshold:** 0.80 (failure threshold for C1)

---

## Expected artefact characteristics (for judge scoring)

1. **Problem statement** — AI-assisted contact centre tooling in a Privacy Act–regulated environment where transcription constitutes a new personal data type with an unresolved retention and handling obligation; not "build a transcription widget in Dynamics".
2. **Personas** — contact centre agents (280 users, use the transcription assist feature), customers (who have not consented to transcription specifically — call recording consent is in place, transcription may be distinct), Customer Vulnerability team (own the vulnerability policy constraint), privacy team (own the assessment backlog and Privacy Act compliance), legal team (own the Azure OpenAI DPA review).
3. **MVP scope** — transcription + field extraction + agent review/confirm UI in Dynamics 365; Azure AI Speech + Azure OpenAI pipeline; DPA confirmation before PII flows to Azure OpenAI; privacy assessment completed before go-live; vulnerability flag excluded from transcription scope.
4. **Constraints** — C1 through C4 all named. C5 surfaced explicitly: "privacy assessment is backlogged — go-live before assessment is complete creates Privacy Act compliance risk; assessment must be scheduled and completed before any production rollout."
5. **Assumptions** — at minimum: Privacy Act assessment will confirm transcription handling requirements in time for go-live (confirm scheduling with privacy team), Azure OpenAI DPA covers customer PII processing (confirm with legal before pipeline design is committed), existing call recording consent covers transcription (confirm with privacy team — may require consent update).

---

## CPF measurement notes for evaluator

- C1 and C5 are related but distinct: C1 is the Privacy Act obligation (transcription = personal information, retention rules apply), C5 is the unresolved gap (assessment not scheduled = go-live blocker). A model that captures C1 but not C5 has identified the obligation but missed the timing risk.
- C2 is a firm policy constraint — the test is whether the model carries it into every story that involves transcription output, not just the feature-level description. An AC in the UI story: "transcription display must not include any vulnerability indicator or score, even as a UI suggestion".
- C5 — count as propagated only if the model explicitly flags that the unscheduled privacy assessment is a go-live dependency, not just "we'll need a privacy assessment at some point". Framing it as "a post-launch action" does not count.

---

## Context injection spec

| Injected item | Description | Estimated size |
|--------------|-------------|----------------|
| `context.yml` | Standard toolchain context | ~2 KB |
| `architecture-guardrails.md` excerpt | AI/ML integration standards, data classification requirements for AI services, DPA requirements for external AI processing, Azure OpenAI integration pattern | ~8 KB |
| Synthetic EA registry entry | Dynamics 365 CRM (existing), Azure AI Speech (new dependency), Azure OpenAI (new dependency — DPA status unknown), Call Recording Platform (existing — DPA confirmed) | ~4 KB |
| **Estimated total** | | **~14 KB** |
| **Bulk injection risk** | Below 50 KB threshold | None |
