# Synthetic Policy Document — S5 Context Injection (Document 2 of 2)
# SYNTHETIC DOCUMENT — for EXP-003-pipeline-eval evaluation only
# Simulates excerpts from Privacy Act 2020 (NZ) and internal Data Processing Agreement (DPA) standards.
# Does NOT represent official legislation text. Does NOT constitute legal advice.

---

# Part A — Privacy Act 2020 (New Zealand) — Selected Provisions
## Relevant to: AI-generated transcriptions, new personal information data types, external AI processing
### (Simulated for EXP-003 S5 evaluation — synthetic legislative paraphrase)

---

## Overview

The Privacy Act 2020 governs how personal information about individuals is collected, used, stored, and disclosed by agencies (including banks and financial service providers) in New Zealand. The Act applies to any information about an identifiable individual, regardless of the medium in which that information is held.

A key development in the 2020 Act (vs. the 1993 Act) is the introduction of mandatory notifiable privacy breach reporting under s.113. Where a privacy breach occurs that is likely to cause serious harm to affected individuals, the agency must notify both the Privacy Commissioner and the affected individuals. This obligation applies from the moment the agency becomes aware of a qualifying breach — it does not apply only to breaches resulting from cyberattacks. Processing personal information without completing required privacy assessments can contribute to a notifiable breach if data is mishandled.

---

## Information Privacy Principle 1 — Purpose of Collection

Personal information shall not be collected unless:
(a) it is collected for a lawful purpose connected with a function or activity of the agency; and
(b) the collection is necessary for that purpose.

**Commentary for AI transcription use cases:** When an agency generates a call transcription using an AI speech service, the agency is "collecting" personal information — the transcription text — even though it is derived from a pre-existing call recording. The collection purpose for the transcription must be distinct and documented. "Reducing manual data entry errors" is a legitimate purpose, but it must be confirmed to be the actual purpose for which the transcription is collected and used, and the transcription data must not be used for any secondary purpose without a separate lawful basis.

The collection purpose also governs what happens if the transcription data is retained. A transcription retained solely for the purpose of reducing manual data entry errors is not lawfully retained for 7 years (the call recording retention period) without a separate lawful basis for that retention duration.

---

## Information Privacy Principle 3 — Collection of Information from Subject

Where an agency collects personal information directly from the individual, the agency must take reasonable steps to ensure the individual is aware of: the fact of collection, the purpose, intended recipients, and the individual's rights.

**Commentary for transcription use cases:** Call recording disclosure ("this call may be recorded") is standard practice and informs customers about the call recording. Transcription using an AI service is a materially different processing activity: the audio is converted to text by a third-party AI service (Azure AI Speech) and then that text is processed by a further AI service (Azure OpenAI) to extract structured data.

Whether existing call recording consent covers these additional processing steps requires legal assessment. IPP 3 requires that customers are informed of the "intended recipients" of their personal information — if Azure AI Speech and Azure OpenAI are "recipients" under the Act (as external processors), then the disclosure obligation may require updating the call recording notification or implementing a separate consent mechanism for the transcription feature.

**Note:** The Privacy Commissioner has indicated that organisations should not assume that broad consent to one form of data processing (call recording) covers materially different downstream processing (AI analysis and structured data extraction). Where the downstream processing is not a direct and obvious consequence of the original collection, a fresh disclosure or consent assessment should be obtained.

---

## Information Privacy Principle 9 — Retention of Personal Information

An agency that holds personal information must not keep it for longer than is necessary for the purpose for which it may lawfully be used.

**Commentary for transcription data:** Call recording is retained for 7 years because of regulatory requirements for financial services call records. Transcription text derived from those recordings is a different personal information type. Unless there is a separate regulatory requirement mandating 7-year retention of transcription text, a retention period equal to the call recording retention period is not automatically justified.

The minimum retention period for transcription text consistent with IPP 9 would be the period necessary for the purpose of the collection — i.e., the period during or immediately after the call during which the agent uses the extracted data. If the extracted field values are saved to Dynamics, the transcription text itself may no longer be needed after the agent has confirmed the data.

**A retention policy for transcription data must be defined before go-live.** "Default to call recording retention" is not IPP 9 compliant without a documented justification. "Retain until the system deletes it" is not a retention policy.

---

## Information Privacy Principle 11 — Limits on Disclosure of Personal Information

An agency must not disclose personal information unless the agency believes on reasonable grounds that the disclosure is authorised, is for a related purpose, or other specified grounds apply.

**Commentary for external AI services:** Transmitting customer PII (call transcription text, spoken personal details) to an external AI service (Azure AI Speech, Azure OpenAI) constitutes "disclosure" under the Act — the agency is transmitting personal information to a third party (even a contracted processor). For this disclosure to be lawful, the agency must have:

(a) A Data Processing Agreement (DPA) in place with the third-party processor that covers the specific processing activity;

(b) Reasonable grounds to believe that the processor will protect the information in accordance with the Privacy Act's requirements;

(c) A documented purpose for the disclosure that is consistent with the purpose for which the information was collected.

**The existence of a general enterprise agreement with a cloud vendor does not automatically satisfy IPP 11 for a specific AI processing use case.** The DPA must specifically describe the type of personal information being processed and the processing purpose. A general Azure DPA does not cover Azure OpenAI processing of customer call transcriptions as a specific documented use case unless that use case is explicitly described in the DPA or a DPA addendum.

---

## Section 113 — Notifiable Privacy Breaches

**Paraphrase:** An agency must notify the Privacy Commissioner and affected individuals if it becomes aware of a privacy breach that it reasonably believes has caused, or is likely to cause, serious harm to one or more affected individuals.

**Relevance to go-live risk:** Where an agency begins processing a new type of personal information (call transcriptions) without completing a privacy assessment, and without confirming that the DPA with the AI processor covers this processing, the agency is operating with an unassessed privacy risk. If a breach occurs (e.g., transcription data is retained improperly, disclosed to the wrong party, or processed without adequate controls), the agency may be unable to demonstrate that it had taken reasonable steps to protect the information. This increases both the likelihood that a breach causes serious harm and the regulatory consequences if one occurs.

**Key point:** An unscheduled and uncompleted privacy assessment at go-live is not just a process gap — it is a regulatory exposure. The Privacy Commissioner expects agencies to complete privacy assessments for new personal information data types before the data type enters production. A go-live without completed assessment creates the conditions for a notifiable breach scenario if anything goes wrong.

---

## Part B — Data Processing Agreement Requirements for External AI Services
## (Synthetic internal standard — for EXP-003 S5 evaluation only)

---

## Section 3 — DPA Requirements for External AI Processing of Customer PII

### 3.1 — Overview

A Data Processing Agreement is required whenever the enterprise engages an external party to process customer personal information on the enterprise's behalf. For AI services, the DPA must specifically address the AI processing use case — general cloud services agreements do not automatically satisfy this requirement.

### 3.2 — What "processing" means for AI services

For the purposes of this standard, "processing" by an AI service includes:
- Transmitting personal information to the AI service as input (e.g., call audio, transcription text)
- Storage of personal information by the AI service (even temporarily during processing)
- Any use of the personal information by the AI vendor to train, fine-tune, or improve their models (even if the enterprise has requested opt-out — opt-out must be confirmed in the DPA)
- Producing outputs derived from personal information (transcription text, extracted field values) and returning them to the enterprise

### 3.3 — Required DPA provisions for AI processing of customer PII

| DPA provision | What must be documented | Common gap |
|--------------|------------------------|------------|
| Processing scope | The DPA must specifically name the AI service (e.g., Azure AI Speech, Azure OpenAI) and describe the specific processing activity (e.g., real-time call transcription; LLM field extraction from transcription text) | General Azure DPA names "Azure services" without listing specific cognitive/AI services |
| Data types | The DPA must list the personal information types being processed (e.g., call audio, transcription text, customer name, contact details) | General DPAs list data categories generically without specifying AI-specific data types |
| Purpose limitation | The DPA must state that the AI service will use customer PII only for the purpose stated; no use for model training without explicit enterprise consent | Azure OpenAI service terms must be reviewed — default terms may permit use for model improvement unless opted out |
| Retention and deletion | The DPA must state how long the AI service retains processing inputs and outputs, and confirm deletion on request | AI services may retain input data (audio, text) for quality assurance purposes unless explicitly prohibited |
| Data residency | The DPA must confirm the regions in which processing occurs; for the enterprise, processing of NZ customer PII must be in NZ/AU Azure regions | Azure AI Speech and Azure OpenAI may route to US regions unless region configuration is specified |
| Sub-processors | The DPA must list any sub-processors used by the AI service | AI services commonly use sub-processors for model inference infrastructure |
| Breach notification | The DPA must require the AI service to notify the enterprise within a specified timeframe if a breach involving the enterprise's data occurs | Standard SaaS DPAs often have 72-hour breach notification; check whether this meets the enterprise's notification obligations |

### 3.4 — Azure OpenAI — known DPA gap

**The existing Microsoft enterprise agreement and Azure DPA does not cover Azure OpenAI as a specifically documented AI processing use case for customer PII.**

Azure OpenAI is offered under the Azure OpenAI Service Terms, which are separate from the standard Azure Online Services Terms. The Azure OpenAI Service Terms include provisions on:
- Data residency for the Azure OpenAI deployment (must be explicitly configured)
- Model training opt-out (must be explicitly confirmed — the default may permit use of input data for model improvement in certain configurations)
- Abuse monitoring (Azure retains the right to review inputs for policy compliance purposes — the DPA must specify whether this applies to customer PII)

**The legal team must negotiate and execute a DPA addendum specifically covering Azure OpenAI for this use case before customer PII (transcription text) is processed by Azure OpenAI in any environment, including UAT.** A DPA addendum negotiation typically takes 4–8 weeks with a major cloud vendor.

### 3.5 — Checklist before go-live

| Item | Required confirmation | Status |
|------|----------------------|--------|
| Privacy assessment completed | Privacy team completes assessment of transcription data type; retention policy and consent obligations confirmed | BACKLOGGED — not yet scheduled |
| Azure AI Speech DPA | DPA confirmed to cover real-time processing of customer call audio and transcription for this use case | NOT YET CONFIRMED |
| Azure OpenAI DPA addendum | Specific DPA addendum executed for Azure OpenAI LLM processing of customer PII | NOT IN PLACE — confirmed gap |
| Data residency confirmed | Azure AI Speech and Azure OpenAI configured to process in AU East or AU Southeast regions only | NOT YET VERIFIED |
| Model training opt-out confirmed | Azure OpenAI configured to not use enterprise customer data for model training | NOT YET CONFIRMED |
| Retention policy defined | Retention period for transcription text documented and enforced | NOT DEFINED |
| Consent assessment | Confirmed whether existing call recording consent covers transcription and AI processing | PENDING PRIVACY ASSESSMENT |

**All items in this checklist must be confirmed before any customer PII is processed by Azure AI Speech or Azure OpenAI in a production or UAT environment.**
