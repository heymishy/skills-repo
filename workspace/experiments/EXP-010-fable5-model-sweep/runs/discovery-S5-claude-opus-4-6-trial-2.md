

# Discovery Report: AI-Assisted Customer Information Update Feature

## 1. Problem Statement & Opportunity

**Current State:** Contact centre agents manually transcribe customer-provided information (address, phone number, email, employment status) during live calls into Dynamics 365 CRM. This manual process generates approximately **340 data quality incidents per month** attributable to transcription errors.

**Proposed Solution:** A real-time AI-assisted feature within Dynamics 365 CRM that:
1. Transcribes the relevant portion of the customer call using Azure AI Speech
2. Extracts field-value pairs (address, phone, email, employment status) via an LLM
3. Pre-populates update fields in a side panel for agent review
4. Requires explicit agent confirmation before any data is saved

**Desired Outcome:** Significant reduction in the 340 monthly data quality incidents while maintaining agent control over all updates.

---

## 2. What Is Reasonably Clear

The following aspects are sufficiently well-defined to support downstream design work:

| Area | Detail |
|---|---|
| **Core workflow** | Transcribe → Extract → Suggest → Agent reviews → Agent confirms → Save. The AI is advisory only; the agent is the decision-maker. |
| **Data fields in scope** | Address, phone number, email, employment status. These are bounded and enumerable. |
| **Technology stack** | Azure AI Speech for transcription; an LLM for entity extraction; Dynamics 365 CRM as the host application. |
| **Human-in-the-loop control** | The agent always reviews and confirms before saving. There is no automatic update path. This is stated as a firm design constraint. |
| **User population** | Approximately 280 contact centre staff. |
| **Baseline for success measurement** | 340 data quality incidents/month provides a quantifiable baseline against which to measure improvement. |
| **Call recording policy** | An existing policy governs call recordings and their retention. Audio recordings are not a new data type. |

---

## 3. Open Questions, Risks & Gaps

### 3.1 Privacy & Data Governance

| # | Issue | Why It Matters | Recommended Action |
|---|---|---|---|
| **P1** | **Transcription as a new personal information type.** The privacy team has not assessed whether the call transcription (the text artefact) constitutes personal information under the Privacy Act 2020 (NZ) or how it interacts with existing Information Privacy Principles (IPPs), particularly IPP 9 (retention) and IPP 11 (disclosure). | If the transcription is personal information — and it almost certainly is, given it will contain identifiers and potentially sensitive context — then collection, use, storage, retention, and disposal all require a defined lawful basis and policy. Proceeding without this assessment creates regulatory and reputational risk. | Commission a Privacy Impact Assessment (PIA) from the privacy team **before** detailed design begins. The PIA should determine: (a) classification of the transcription under the Act, (b) permissible retention period, (c) whether the transcription must be deletable independently of the call recording, (d) whether customer notification/consent obligations arise, and (e) whether the transcription can be used for any secondary purpose (e.g., model training, QA). |
| **P2** | **Retention and disposal of transcriptions.** No retention period or disposal mechanism has been defined for transcription text. | Without a retention policy, transcriptions could accumulate indefinitely, increasing breach surface area and potentially violating IPP 9. | The PIA (P1) should produce a transcription retention and disposal schedule. Engineering must design for automated deletion at the defined retention boundary. |
| **P3** | **Scope of data captured in transcription.** A real-time transcription will capture everything said during the transcribed portion of the call — not just the four target fields. Customers may disclose health information, financial hardship details, family circumstances, or other sensitive information. | The transcription will inevitably contain data beyond what is needed for the update, raising questions under IPP 1 (purpose of collection) and IPP 12 (use only for purpose of collection). Sensitive data in the transcript also elevates the consequence of any data breach. | Define whether the transcription is stored at all post-confirmation, or whether only the extracted field-value pairs and the agent's confirmed values are persisted. If the full transcript must be stored (e.g., for audit), apply the retention limits from P1 and consider whether sensitive content can be redacted after the interaction concludes. |
| **P4** | **LLM data processing location and third-party exposure.** The LLM used for extraction may be a cloud-hosted service. If the transcription text is sent to an external API, this constitutes disclosure of personal information to a third party / cross-border transfer. | Potential IPP 11 and IPP 12 issues, plus contractual and information security considerations. | Confirm whether the LLM will be Azure OpenAI Service (data stays within the Azure tenant and is not used for model training) or another provider. Document the data processing agreement and confirm no training-on-input clauses apply. |

### 3.2 Vulnerable Customers

| # | Issue | Why It Matters | Recommended Action |
|---|---|---|---|
| **V1** | **Definition of "not automate decisions for vulnerable customers."** The brief states the transcription feature must not automate decisions for vulnerable customers, but the feature as described does not automate decisions for *any* customer — the agent always confirms. It is unclear what additional safeguard is intended for vulnerable customers specifically. | Without clarifying the intended protection, there is a risk of either (a) building the wrong safeguard, or (b) building nothing and later discovering that the business expected specific behaviour. | Workshop with the customer vulnerability policy owner to define the specific risk. Possible interpretations include: the feature should be **disabled** when a customer is flagged as vulnerable; the feature should operate normally but the LLM should **not attempt to extract or suggest employment status** for vulnerable customers (as this may relate to hardship); or the feature should function identically but an **additional confirmation step or supervisor review** is required. The correct answer is a policy decision, not a technology decision. |
| **V2** | **Transcription content for vulnerable callers.** Vulnerable customers may disclose distressing or highly sensitive information during calls. This content will appear in the transcription. | If transcriptions are stored or visible in the side panel, sensitive disclosures could be exposed to broader data access than intended. There is also a risk that the LLM could surface or highlight sensitive content in a way that is not appropriate. | Ensure the extraction prompt is tightly scoped to the four target fields only and does not summarise, categorise, or surface any other content. Consider whether transcriptions involving flagged vulnerable customers should have a shorter retention period or be excluded from any secondary use. |

### 3.3 Rollout Strategy

| # | Issue | Why It Matters | Recommended Action |
|---|---|---|---|
| **R1** | **No rollout plan defined.** It is unknown whether this will be a big-bang release to all 280 agents or a phased rollout with a pilot group. | This decision affects test planning, training, support capacity, change management, risk exposure, and the ability to measure effectiveness before full commitment. A big-bang release of a new AI-assisted feature to 280 agents carries significant operational risk. | **Strongly recommend a phased rollout.** Start with a pilot group (suggest 15–25 agents across representative teams) for a defined period (e.g., 4 weeks). Use the pilot to measure: reduction in data quality incidents, agent trust and usability feedback, transcription accuracy, extraction accuracy, false positive / false negative rates on field extraction, and any unexpected behaviours with vulnerable customer calls. Define go/no-go criteria for each subsequent phase. |
| **R2** | **Training and change management.** No mention of agent training, updated operating procedures, or communications. | Agents need to understand: what the feature does and does not do, that they remain accountable for the data they confirm, how to correct extraction errors, and how to handle situations where the transcription is clearly wrong or captures something unexpected. | Develop training materials and updated SOPs before pilot launch. Include guidance on what to do if the AI suggests obviously wrong values, and reinforce that the agent — not the AI — owns the data quality outcome. |

### 3.4 Accuracy, Performance & Edge Cases

| # | Issue | Why It Matters | Recommended Action |
|---|---|---|---|
| **A1** | **Transcription accuracy for NZ English, accents, and te reo Māori.** Azure AI Speech accuracy varies by accent, background noise, and language. New Zealand place names, suburb names, and street names may be mis-transcribed. Customers may use te reo Māori words or place names. | If the transcription is inaccurate, the LLM extraction will inherit those errors, and the feature may not reduce data quality incidents as expected — or could introduce a different class of error (agent over-trusts the AI suggestion). | Benchmark Azure AI Speech accuracy against a representative sample of actual call recordings (with appropriate consent/privacy controls). Assess whether a custom speech model trained on NZ English and common NZ place names is required. Define an accuracy threshold below which the feature should not be shipped. |
| **A2** | **LLM extraction reliability.** The LLM must reliably distinguish between the customer's *current* information and their *new/updated* information within the conversation. It must also handle partial updates (e.g., customer updates phone number but not address). | If the LLM extracts the old value instead of the new value, or hallucinates a value not spoken, the agent may not catch the error — especially under time pressure. | Design evaluation test sets covering: new vs. old value disambiguation, partial updates, corrections mid-sentence, spelled-out values (e.g., customer spells their street name), and ambiguous utterances. Measure precision and recall per field type. |
| **A3** | **Agent over-reliance on AI suggestions (automation bias).** The feature is designed to reduce errors, but if agents begin to trust and confirm suggestions without genuine review, it could introduce a new error mode. | This is a well-documented risk with human-in-the-loop AI systems. The 340 incidents/month could decrease initially but plateau or shift to a different error type. | Track post-deployment metrics: time agents spend on the review screen, rate at which agents edit suggested values, and data quality incidents specifically attributable to incorrect AI suggestions that were confirmed without correction. If edit rates are near zero, investigate whether this reflects high accuracy or low scrutiny. |
| **A4** | **Real-time latency.** Transcription and extraction must keep pace with the live conversation. If the side panel lags significantly behind the call, it loses utility. | Poor performance will reduce agent adoption and trust. | Define a latency target (e.g., suggested fields populated within N seconds of the relevant utterance). Validate against Azure AI Speech streaming latency and LLM inference time during the pilot. |

### 3.5 Integration & Technical

| # | Issue | Why It Matters | Recommended Action |
|---|---|---|---|
| **T1** | **Dynamics 365 side panel integration approach.** The UX is described as a side panel, but the integration pattern (embedded app, custom PCF control, Copilot Studio, etc.) is not defined. | Affects development effort, maintainability, and user experience. | Define during design phase. Confirm whether this aligns with existing Dynamics 365 customisation patterns used by the organisation. |
| **T2** | **Audit trail.** When the agent confirms a change, what is recorded? Is the original AI suggestion logged alongside the agent's confirmed value? Is the source transcription segment linked? | For data quality investigation, dispute resolution, and continuous improvement of the AI, an audit trail is important. It also supports accountability — if a confirmed value is later found to be wrong, the organisation can determine whether the error originated in transcription, extraction, or agent review. | Design an audit log that captures: timestamp, agent ID, original field values, AI-suggested values, agent-confirmed values, and (if retained) the relevant transcription segment. Retention of this log should align with the PIA outcomes (P1). |
| **T3** | **Call recording integration.** How does the feature know when to start and stop transcribing? Is it the full call, or does the agent trigger transcription for a specific segment? | Affects how much extraneous content is transcribed (and therefore stored), which connects to privacy concerns (P3). | Define whether transcription is always-on during the call or agent-activated. Agent-activated transcription reduces privacy exposure but adds a manual step and risks missing relevant content if the agent activates too late. |

---

## 4. Dependencies & Sequencing

The following items are **blocking or strongly recommended before detailed design**:

```
[P1] Privacy Impact Assessment
 ├── Must complete before decisions on transcription storage, retention, and LLM data processing
 ├── Feeds into: P2 (retention policy), P3 (scope of stored data), P4 (LLM processing location)
 │
[V1] Vulnerable Customer Policy Workshop
 ├── Must complete before UX and business logic design for vulnerable customer handling
 │
[R1] Rollout Strategy Decision
 ├── Must complete before test planning, training development, and release scheduling
 │
[A1] Transcription Accuracy Benchmarking
 ├── Should complete before committing to Azure AI Speech without customisation
 └── Can run in parallel with PIA and policy workshops
```

---

## 5. Suggested Next Steps

| # | Action | Owner (suggested) | Timing |
|---|---|---|---|
| 1 | Commission Privacy Impact Assessment for call transcription data type | Privacy Team / Product Owner | Immediate — this is on the critical path |
| 2 | Workshop with vulnerability policy owner to define specific requirements for vulnerable customer calls | Product Owner / Policy Owner | Within 2 weeks |
| 3 | Decide rollout strategy (recommend phased with pilot) and define pilot group criteria | Product Owner / Delivery Lead | Within 2 weeks |
| 4 | Benchmark Azure AI Speech transcription accuracy against representative NZ call samples | Engineering / Data Science | Within 3 weeks |
| 5 | Define LLM processing location and confirm data handling terms (Azure OpenAI or alternative) | Engineering / Security / Privacy | Alongside PIA |
| 6 | Design evaluation test sets for LLM extraction accuracy (new vs. old values, partial updates, edge cases) | Engineering / QA | During design phase |
| 7 | Define audit trail requirements | Product Owner / Compliance | During design phase |

---

## 6. Summary

The proposed feature addresses a genuine, measurable problem (340 monthly data quality incidents) with a well-structured human-in-the-loop design. The core workflow — transcribe, extract, suggest, confirm — is sound and appropriately keeps the agent as the decision-maker.

However, **the feature cannot responsibly proceed to detailed design until the Privacy Impact Assessment is completed**. The call transcription is a new data type that almost certainly constitutes personal information, and decisions about storage, retention, processing location, and scope depend on that assessment. The vulnerable customer policy interpretation and rollout strategy are also prerequisite decisions that will materially shape the solution.

With those dependencies resolved, this feature is well-positioned for a phased pilot that can validate transcription accuracy, extraction reliability, and agent trust before broader rollout.