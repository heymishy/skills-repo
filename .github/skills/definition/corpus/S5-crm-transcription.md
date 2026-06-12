# Corpus Case S5 — AI-Assisted Customer Data Update (EXP-019 pipeline fidelity)

**Case ID:** S5-crm-transcription
**Experiment:** EXP-019-pipeline-fidelity
**Test purpose:** Pipeline fidelity pass 2 — feeds real discovery output (S5) into /definition to verify format compatibility
**Note:** This is not a quality evaluation. No judge scoring expected. Format compatibility only.

---

## Operator input

> Discovery artefact: AI-Assisted Customer Data Update — Dynamics 365 CRM
> Status: Approved
> Approved By: Contact Centre Product Lead
> Date: 2026-06-12
>
> PROBLEM
> Contact centre agents manually transcribe customer-provided updates to address, phone number,
> email, and employment status during live calls. This produces approximately 340 data quality
> incidents per month attributable to transcription error. The proposed feature uses Azure AI
> Speech for real-time call transcription and an LLM to extract field-value pairs, pre-populating
> a Dynamics 365 side panel for agent review. The agent always confirms explicitly before any
> data is saved — the AI output is a suggestion only.
>
> PERSONAS
> - Contact centre agents (~280): Primary users; daily workflow impact
> - Privacy team: Must complete PIA — currently unengaged on transcription as new data type
> - Legal / Compliance: Consent notice update required; Privacy Act 2020 obligations
> - Customer vulnerability policy owner: Sign-off required on vulnerable customer scope
> - CRM platform team: Technical delivery, Dynamics 365 customisation
> - Azure platform team: Speech, LLM, data residency
> - Contact centre operations / team leads: Rollout, training, quality monitoring
>
> MVP SCOPE
> 1. Real-time transcription of the relevant call portion via Azure AI Speech
> 2. LLM extraction of field-value pairs for four fields: address, phone number, email, employment status
> 3. Pre-population of Dynamics 365 side panel for agent review
> 4. Agent review, optional edit, and explicit confirm before any CRM write
> 5. Graceful degradation if transcription or LLM service is unavailable
> 6. Pilot rollout to a defined group before full deployment to all 280 agents
>
> OUT OF SCOPE
> - Any automated update — agent confirmation is always required
> - Transcription feature for calls with vulnerable customers (pending C2 policy decision)
> - Additional CRM fields beyond the four named
> - Full deployment to all 280 agents before pilot completes
>
> ASSUMPTIONS
> - Privacy Impact Assessment can complete before development data processing begins
>   (6-week queue risk — likely critical path)
> - Azure OpenAI (within-tenant) is the LLM — not an external API
> - Telephony platform can expose real-time audio stream to Azure AI Speech
> - Pilot rollout approach is viable before full deployment
>
> CONSTRAINTS
> C1 (Privacy Act 2020): Transcription likely constitutes personal information. PIA required before
>     go-live. Retention period, consent notice adequacy, data minimisation unassessed.
> C2 (Customer vulnerability policy): No automated decisions or suggestions for vulnerable customers.
>     Policy scope interpretation requires owner sign-off before build.
> C3 (Azure DPA): Azure OpenAI DPA coverage for customer PII unconfirmed. Legal to confirm.
> C4 (Agent confirmation): Agent confirmation always required — no auto-save. Non-negotiable.
>
> SUCCESS INDICATORS
> - Data quality incidents from transcription error: 340/month baseline → target ≤ 85/month (75%)
> - Privacy Act compliance: PIA completed before go-live
> - Agent adoption: ≥ 80% of pilot agents using panel within 4 weeks of launch
> - AI extraction accuracy: < 5% agent-corrected extractions on pilot calls

---

## Expected output characteristics (format fidelity check only)

A format-compatible definition output should:
- Produce named stories with Given/When/Then acceptance criteria
- Surface C1 and C2 as story-level NFRs or constraint notes (not as fabricated process gate ACs)
- Not fabricate approval gates not in the discovery (e.g. "Privacy Officer sign-off required as an AC")
- Use a structure that could be assembled into a DoD bundle (story title, ACs, NFRs, complexity)

**This case has no D1-D7 scoring targets.** Judge output will be incomplete — that is expected.
