# Corpus Case S5 — Contact Centre Transcription Feature (Dynamics 365)

## Case metadata

```json
{
  "case_id": "S5",
  "label": "Contact centre AI transcription — Privacy Act + Azure DPA gap",
  "difficulty": "medium-high",
  "domain": "Privacy Act / CRM",
  "regulated_constraint_count": 2,
  "hidden_constraint": "Privacy Act assessment unscheduled and backlogged (6-week queue)",
  "source": "workspace/handoffs/pipeline-corpus-S2-S7.md"
}
```

## Operator input

> /discovery — Our contact centre agents currently update customer information (address,
> phone number, email, employment status) by manually typing what the customer tells
> them during a call. The process is error-prone — we see approximately 340 customer
> data quality incidents per month attributable to manual transcription errors.
>
> We want to build a feature in our Dynamics 365 CRM that transcribes the relevant
> portion of a customer call in real time, extracts the updated information using AI,
> and pre-populates the update fields for the agent to review and confirm before saving.
>
> The agent always confirms before saving — the AI extraction is a suggestion, not
> an automatic update.
>
> The call transcription will use Azure AI Speech. The extracted information will be
> processed by an LLM to identify field-value pairs. The agent reviews the extracted
> values in a side panel, edits if needed, and clicks confirm.
>
> Customer calls are recorded and retained per our existing call recording policy.
> The transcription of the call — a text representation — is a new data type we have
> not handled before. Our privacy team has not assessed whether the transcription
> constitutes personal information under the Privacy Act 2020 and how long it can
> be retained.
>
> We also handle calls from customers who are in financial hardship or who are
> vulnerable — our customer vulnerability policy requires that agents flag these
> customers and handle them with additional care. The transcription feature should
> not in any way automate decisions for vulnerable customers.
>
> The Dynamics feature will be used by approximately 280 contact centre staff.
> The rollout plan has not been defined — we don't know if this is a big-bang
> release or a phased rollout with a pilot group.

## Expected discovery artefact characteristics

A high-quality output from this input should:

- **Problem statement** — frame the problem as contact centre data quality improvement bounded by Privacy Act obligations for a new data type and firm customer vulnerability policy constraints; NOT "build an AI transcription feature"
- **Personas** — contact centre agents (who currently own manual transcription), customers (subject to privacy obligations), vulnerable customers (additional care required — transcription must not affect their treatment), privacy team (unassessed new data type), contact centre manager (rollout owner)
- **MVP scope** — bounded to: real-time transcription suggestion, agent review-and-confirm workflow for standard (non-vulnerable) calls; explicitly excludes: any automated update, any vulnerability status suggestion, rollout to all 280 agents before pilot confirms approach
- **Constraints** — C1 (Privacy Act 2020 — transcription as new personal information type; retention unassessed), C2 (customer vulnerability policy — no automated decisions or suggestions for vulnerable customers), C3 (Azure OpenAI DPA coverage unconfirmed for customer PII), C4 (agent confirmation always required — no auto-save)
- **Assumptions** — must flag: Privacy Act assessment unscheduled (6-week backlog) as potential go-live blocker; Azure DPA coverage for Azure OpenAI specifically unconfirmed; rollout scope and change management undefined
- **Success indicators** — baseline (340 data quality incidents/month) + target reduction, privacy assessment completed before go-live, pilot rollout before full deployment

## Known failure modes for this case

- **Privacy assessment treated as low-risk**: model notes the privacy team review without flagging the 6-week backlog as a go-live timing dependency
- **DPA coverage assumed**: model includes Azure OpenAI as the LLM without noting that DPA coverage is unconfirmed for this specific service
- **Vulnerability policy scope too narrow**: model mentions vulnerability policy but doesn't carry it into every workflow that touches transcription output
- **Rollout plan assumed**: model proceeds to full deployment assumptions without flagging the undefined rollout strategy
