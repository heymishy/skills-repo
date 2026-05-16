# Synthetic EA Registry Entries
# Applications: Dynamics 365 CRM + Azure AI Speech + Azure OpenAI + Call Recording Platform
# Registry version: 2026-Q1
# Entry type: Existing application (1) + New dependencies (2) + Existing application (1)
# SYNTHETIC DOCUMENT — for EXP-003-pipeline-eval evaluation only

---

## Application Profile 1 — Dynamics 365 CRM

**Name:** Dynamics 365 CRM
**Owner:** Contact Centre Technology, the enterprise
**Domain:** CRM / Contact Centre
**Classification:** Internal — Privacy Act 2020 in scope
**Criticality:** HIGH — primary customer information system for contact centre operations
**Data classification:** Restricted — customer PII (identity, contact details, financial hardship status, vulnerability flags)

**Description:**
The enterprise's primary CRM for contact centre operations. Used by approximately 280 contact centre agents. Holds customer identity and contact information, call history, case records, agent notes, and customer vulnerability flags. The vulnerability flag is a manually-set field — set by the agent during or after a call when the customer discloses financial hardship or other vulnerability indicators. The flag triggers special handling processes as defined by the Customer Vulnerability Policy.

**Hosting:** Microsoft-managed SaaS (Dynamics 365 online)
**Technology stack:** Microsoft Dynamics 365 Customer Service
**Data Processing Agreement:** In place with Microsoft for Dynamics 365 tenant; covers Dynamics 365 data residency and processing
**Environments:** Production, UAT, Development

---

## Interface Map — Dynamics 365 CRM

### Data sources (inbound to Dynamics)

| Interface ID | Application | Interface type | Data type | Notes |
|-------------|-------------|---------------|-----------|-------|
| D365-IN-001 | Core Banking API | Internal — read only | Customer financial product summary (accounts, loans) | Read-only display in contact centre agent UI |
| D365-IN-002 | Call Recording Platform | Event-driven | Call metadata (call ID, agent, duration, call disposition) | Not call content — metadata only |
| D365-IN-003 | (Proposed) AI Transcription Service | New dependency | Call transcription text — customer-identifiable personal information | **New data type: not currently received by Dynamics. DPA coverage for this specific data type requires confirmation** |
| D365-IN-004 | (Proposed) Azure OpenAI extraction output | New dependency | Extracted field-value pairs (name, address, phone, email, employment status) | Derived from transcription; output of LLM processing of customer PII |

### Downstream consumers

| Interface ID | Application | Interface type | Purpose | Notes |
|-------------|-------------|---------------|---------|-------|
| D365-OUT-001 | Analytics Platform | Internal — daily extract | Aggregated call and case data for reporting | No individual-level customer PII in analytics extract |
| D365-OUT-002 | Core Banking Customer Information | Internal — write (agent action) | Customer information updates confirmed by agent | Update triggered only by agent confirmation action — no automated updates |

### Regulatory obligations

| Obligation | Regulator | Relevant provision |
|-----------|-----------|------------------|
| Privacy Act 2020 — Dynamics holds personal information about customers; collection, use, and retention obligations apply | Privacy Commissioner | Privacy Act 2020 Information Privacy Principles 1–12 |
| Customer Vulnerability Policy — Dynamics is the system of record for customer vulnerability flags; policy governs handling of flagged customers | Internal policy | Customer Vulnerability Policy v2.1 |
| Data retention — customer records in Dynamics must be retained in accordance with the enterprise's data retention schedule; no Dynamics-specific retention policy has been defined for transcription data | Internal policy / Privacy Act 2020 IPP 9 | |

### Known constraints and risks

| ID | Description | Severity |
|----|-------------|---------|
| D365-RISK-001 | New personal information data type: call transcriptions constitute personal information (see S5-privacy-act-dpa-policy-excerpt.md — Privacy Act 2020 definition). Dynamics has not previously received call transcription content. A retention schedule for transcription data must be defined before go-live. | HIGH |
| D365-RISK-002 | DPA for Dynamics transcription data: the existing DPA with Microsoft covers Dynamics 365 data. It is not certain that this DPA covers the flow of AI-transcribed customer call content into Dynamics as a new data type. Legal should confirm DPA adequacy for this use case. | MEDIUM |

---

## Application Profile 2 — Azure AI Speech (New Dependency)

**Name:** Azure AI Speech
**Owner:** Technology (new service dependency, not yet provisioned for this use case)
**Domain:** AI / Speech Processing
**Classification:** New external AI service dependency — Privacy Act 2020 in scope
**Criticality:** HIGH — core dependency of the transcription feature
**Data classification:** RESTRICTED — processes audio content of customer calls; produces transcription text containing personal information

**Description:**
Microsoft Azure cognitive services offering for real-time speech-to-text transcription. The proposed integration transcribes the relevant portion of a customer call in real time, producing a text representation of what was said during the call. The transcription text contains personal information (customer name, contact details, financial details as stated by the customer). This is a new data type that the enterprise has not previously generated or processed via an AI service.

**Hosting:** Microsoft Azure-managed (cloud service)
**Data Processing Agreement:** The existing Microsoft enterprise agreement and Azure DPA covers Azure services generally. Whether Azure AI Speech specifically is covered for processing customer PII from call audio requires legal confirmation.
**Environments:** Not yet provisioned for this use case

---

## Interface Map — Azure AI Speech

| Interface ID | Source | Data in | Output | Notes |
|-------------|--------|---------|--------|-------|
| SPEECH-INT-001 | Call Recording Platform (audio stream or clip) | Audio segment containing customer statements | Transcription text (real-time) | Audio must be segmented to the relevant portions only — full call audio must not be transmitted; audio is not retained by Azure AI Speech beyond the transcription session by default |

### Regulatory obligations

| Obligation | Regulator | Relevant provision |
|-----------|-----------|------------------|
| Privacy Act 2020 — transcription text constitutes personal information; collection of transcription data must be for a lawful purpose; retention and use must comply with information privacy principles | Privacy Commissioner | Privacy Act 2020 IPP 1 (purpose), IPP 9 (retention), IPP 11 (disclosure) |
| Data Processing Agreement — customer PII flowing to Azure AI Speech for processing requires a DPA that covers this specific processing activity | Privacy Commissioner / internal policy | Privacy Act 2020 IPP 5 (storage security); data processing agreement requirements |

### Known constraints and risks

| ID | Description | Severity |
|----|-------------|---------|
| SPEECH-RISK-001 | DPA coverage for call audio processing: the existing Microsoft enterprise agreement and Azure DPA covers Azure services for standard cloud computing. Azure AI Speech is a distinct cognitive services offering. Legal must confirm whether the existing DPA covers customer PII (call audio and transcription) flowing through Azure AI Speech, or whether a specific DPA addendum is required for this processing activity. | HIGH — potential go-live blocker |
| SPEECH-RISK-002 | Privacy Act — new personal information type: call transcription text is a new personal information type the enterprise has not handled. The privacy assessment covering how this data is collected, retained, and handled has been requested but not yet completed or scheduled. | HIGH — go-live blocker if assessment is not completed before production |
| SPEECH-RISK-003 | Audio transmission scope: only the relevant portions of the call should be transcribed. Technical controls are required to ensure the full call audio is not transmitted to Azure AI Speech. | MEDIUM — design requirement |

---

## Application Profile 3 — Azure OpenAI (New Dependency)

**Name:** Azure OpenAI
**Owner:** Technology (new service dependency, not yet provisioned for this use case)
**Domain:** AI / Large Language Models
**Classification:** New external AI service dependency — Privacy Act 2020 in scope
**Criticality:** HIGH — core dependency of the field extraction feature
**Data classification:** RESTRICTED — processes transcription text containing customer PII; produces structured field-value output

**Description:**
Microsoft Azure-managed LLM service. Proposed use: process call transcription text to extract field-value pairs (customer name, address, phone number, email, employment status) for agent review and confirmation before saving to Dynamics 365. Customer PII (from the transcription) flows into the LLM as input. This is a new AI processing use case for customer PII that has not been assessed for Privacy Act compliance or DPA coverage.

**Hosting:** Microsoft Azure-managed (cloud service)
**Data Processing Agreement:** The existing Microsoft enterprise agreement and Azure DPA covers Azure services generally. Azure OpenAI is offered as a separate, distinct service from Azure infrastructure. **The legal team has not confirmed whether the existing DPA covers Azure OpenAI for this specific use case involving customer PII.** This is an open risk item.
**Environments:** Not yet provisioned for this use case

---

## Interface Map — Azure OpenAI

| Interface ID | Source | Data in | Output | Notes |
|-------------|--------|---------|--------|-------|
| AOAI-INT-001 | Azure AI Speech (via Experience API / Dynamics plugin) | Transcription text containing customer-stated personal information | Structured extraction: field → value pairs for Dynamics pre-population | Customer PII (name, contact details, employment status) is the primary input to the LLM |

### Regulatory obligations

| Obligation | Regulator | Relevant provision |
|-----------|-----------|------------------|
| Privacy Act 2020 — customer PII is being transmitted to and processed by an external AI service; this constitutes disclosure of personal information to a third-party processor; a DPA must be in place and must cover this specific processing activity | Privacy Commissioner | Privacy Act 2020 IPP 11 (limits on disclosure); s.113 (notifiable breach) |
| DPA requirement — any external AI service processing customer PII must be covered by a DPA that specifically describes the processing purpose, data types, retention period, and deletion obligations | Internal policy | Data Processing Policy v2 |

### Known constraints and risks

| ID | Description | Severity |
|----|-------------|---------|
| AOAI-RISK-001 | DPA coverage unconfirmed: the legal team has confirmed that the existing Microsoft enterprise agreement and Azure DPA does NOT automatically cover Azure OpenAI for customer PII processing. The Azure OpenAI service has its own service terms and data handling commitments that differ from the standard Azure infrastructure DPA. A specific DPA or DPA addendum covering Azure OpenAI for this use case is required. This is an open risk and a potential go-live blocker. | CRITICAL — potential go-live blocker |
| AOAI-RISK-002 | Privacy Act assessment dependency: the privacy team's assessment (pending, backlogged) must cover both the transcription step (Azure AI Speech) and the LLM processing step (Azure OpenAI). The assessment cannot be completed piecemeal. Both services must be assessed together. | HIGH |
| AOAI-RISK-003 | No automated customer decisions: the LLM output must be presented as a suggestion for agent review only. No data must be saved without explicit agent confirmation. This is a technical design requirement — the integration must not write to Dynamics from the LLM output without passing through the agent review UI. | HIGH — design requirement |
| AOAI-RISK-004 | Customer vulnerability field exclusion: the LLM must not be permitted to extract or suggest values for the customer vulnerability flag in Dynamics. The vulnerability flag is a manual-only field governed by the Customer Vulnerability Policy. Any extraction attempt must be rejected at the API layer. | HIGH — policy requirement |

---

## Application Profile 4 — Call Recording Platform

**Name:** Call Recording Platform
**Owner:** Contact Centre Technology, the enterprise
**Domain:** Contact Centre / Compliance
**Classification:** Internal — Privacy Act 2020 in scope; DPA confirmed
**Criticality:** HIGH — regulatory obligation (call recording for financial services compliance)
**Data classification:** RESTRICTED — call audio content; personally identifiable

**Description:**
Existing platform recording all contact centre calls for regulatory compliance and dispute resolution purposes. DPA with call recording platform vendor is in place and covers this specific use case. Retention period: 7 years per financial services call recording requirements. The call recording platform does not currently produce transcriptions — this is proposed as a new integration with Azure AI Speech.

**Hosting:** On-premises (vendor-managed)
**Technology stack:** Vendor proprietary call recording infrastructure
**Data Processing Agreement:** In place and confirmed for call recording use case

---

## Interface Map — Call Recording Platform

| Interface ID | Application | Interface type | Data | Notes |
|-------------|-------------|---------------|------|-------|
| CRP-INT-001 | Contact Centre Infrastructure | Internal — continuous | Live call audio capture | All contact centre calls recorded |
| CRP-INT-002 | (Proposed) Azure AI Speech | New — outbound | Audio segment (relevant portions of call) | **New integration: does not currently exist; audio segment scope must be technically constrained** |
| CRP-INT-003 | Compliance and Legal archive | Internal — read | Call audio retrieval for dispute/regulatory purposes | 7-year retention |

### Known constraints and risks

| ID | Description | Severity |
|----|-------------|---------|
| CRP-RISK-001 | Call recording consent vs. transcription consent: customers are informed that calls are recorded at the start of each call. They may not be informed that call audio will be transcribed and processed by an AI service. Privacy Act 2020 IPP 3 requires that customers are informed of the purpose of collection and processing. The privacy assessment must determine whether existing call recording consent covers transcription and AI processing, or whether a consent update is required. | HIGH |

---

## Dependencies

**Dynamics transcription feature depends on:**
- Azure AI Speech — for real-time transcription (DPA coverage unconfirmed for this use case)
- Azure OpenAI — for field extraction (DPA coverage confirmed as NOT covered by existing Microsoft DPA)
- Call Recording Platform — for audio input to Azure AI Speech
- Privacy Act assessment — backlogged and unscheduled; must be completed before production go-live
