# Corpus Case P2 — EXP-019 Pass 2 (definition input from real discovery output)

**Case ID:** P2
**Experiment:** EXP-019-pipeline-fidelity
**Source:** Pass 1 discovery output (S5-crm-transcription, claude-sonnet-4-6)
**Note:** This is a pipeline fidelity test — evaluating format compatibility, not definition quality.

---

## Bundle — paste this into the /definition session

```
Discovery artefact: AI-Assisted Customer Data Update — Dynamics 365 CRM
Status: Approved
Approved By: Contact Centre Product Lead
Date: 2026-06-12

PROBLEM
Contact centre agents manually transcribe customer-provided updates to four data fields (address,
phone number, email, employment status) during live calls. This process generates approximately
340 data quality incidents per month, with root cause attributed to manual transcription error.
The incidents represent downstream risk: incorrect contact details, failed communications, and
potential compliance exposure if customer records are materially wrong.

The problem is well-scoped and the baseline metric is clearly established. The proposed solution
is appropriate in kind — human-in-the-loop AI assistance, not automation.

PERSONAS
- Contact centre agents (~280): Primary users; workflow impact
- Contact centre operations / team leads: Rollout, training, quality monitoring
- Privacy team: PIA — currently unengaged on transcription
- Legal / Compliance: Consent notices, Privacy Act 2020 obligations
- Customer vulnerability policy owner: Vulnerable customer handling requirements
- Dynamics 365 / CRM platform team: Technical delivery, customisation
- Azure platform / cloud team: Speech, LLM, data residency

MVP SCOPE
1. Real-time transcription of the relevant call segment via Azure AI Speech
2. LLM extraction of field-value pairs for four fields: address, phone number, email, employment status
3. Pre-population of those four fields in a Dynamics 365 side panel for agent review
4. Agent review, optional edit, and explicit confirm before any CRM write
5. Graceful degradation if transcription or LLM service is unavailable (agent falls back to manual
   entry without disruption)
6. Pilot rollout to a defined group of agents before full deployment

OUT OF SCOPE
- Any automated update — agent confirmation is always required
- Transcription feature for calls flagged as involving a vulnerable customer (pending C2 policy decision)
- Additional CRM fields beyond the four named
- Transcription storage beyond the immediate session (pending Privacy Act assessment)
- Full deployment to all 280 agents before pilot completes

ASSUMPTIONS
- Privacy Impact Assessment can be completed before the development timeline requires data processing
  to begin (6-week queue risk — likely critical path)
- Azure OpenAI (within-tenant) is the selected LLM — not an external API
- Telephony platform can expose a real-time audio stream to Azure AI Speech during a call
- A pilot rollout approach is viable before full deployment to all 280 agents

CONSTRAINTS
C1 (Privacy Act 2020): Transcription likely constitutes personal information; retention period,
    consent notice adequacy, and data minimisation obligations unassessed. PIA required before go-live.
C2 (Customer vulnerability policy): No automated decisions or suggestions for vulnerable customers;
    policy scope interpretation pending owner sign-off. Policy call required before build.
C3 (Azure DPA): Azure OpenAI DPA coverage for customer PII unconfirmed. Legal/procurement to confirm.
C4 (Agent confirmation): Agent confirmation always required — no auto-save under any circumstances.

SUCCESS INDICATORS
- Data quality incidents from manual transcription: 340/month baseline → ≤ 85/month target (75% reduction)
- Agent adoption rate: ≥ 80% of pilot agents using panel within 4 weeks of pilot launch
- Privacy Act compliance: PIA completed and no blocking findings before go-live
- AI extraction accuracy: < 5% agent-corrected extractions on pilot calls
```

---

## What to look for in the output (EXP-019 format fidelity check)

For this pipeline fidelity test, the primary check is structural:
- Does the definition skill produce stories with Given/When/Then ACs?
- Does it surface C1 and C2 constraints as story-level NFRs or explicit constraint ACs?
- Does it avoid fabricating approval gates not present in the discovery (C2 says "no automated decisions" — not "requires vulnerability assessment sign-off" as a story AC)?
- Is the output structured in a way that could be assembled into a DoD bundle?

Quality is not being scored — this is format and pipeline compatibility validation only.
