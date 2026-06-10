

# Discovery Output

## 1. Problem Statement

Contact centre agents manually transcribe customer-provided updates (address, phone, email, employment status) into Dynamics 365 CRM during live calls. This manual process produces approximately **340 data quality incidents per month** attributable to transcription errors, degrading downstream data integrity and likely driving rework, customer dissatisfaction, and compliance exposure.

---

## 2. Proposed Solution (as understood)

A real-time AI-assisted data capture feature embedded in Dynamics 365 CRM:

| Layer | Technology | Function |
|-------|-----------|----------|
| Speech-to-Text | Azure AI Speech | Transcribes the relevant portion of the live call in real time |
| Entity Extraction | LLM (model TBD) | Parses the transcript to identify field-value pairs (address, phone, email, employment status) |
| Agent Review UI | Dynamics 365 side panel | Presents extracted values for the agent to review, edit, and explicitly confirm before the CRM record is saved |

**Key design constraint:** The AI output is a *suggestion only*. No CRM write occurs without agent confirmation. The agent remains the decision-maker.

---

## 3. Actors & Stakeholders

| Actor / Stakeholder | Role in this feature |
|---|---|
| Contact centre agents (~280) | Primary users — review, correct, and confirm AI-suggested field values |
| Customers (callers) | Data subjects — their voice is transcribed and their personal information is extracted |
| Contact centre team leaders / QA | Oversight of agent behaviour, error rates, and call quality |
| Privacy / Legal team | Must assess transcription as a new personal data type under the Privacy Act 2020 |
| Vulnerability / Hardship team | Owns the customer vulnerability policy; must define constraints for this feature's interaction with vulnerable customers |
| CRM / Dynamics 365 platform team | Build, configure, and maintain the side-panel feature |
| Azure / AI engineering team | Owns the speech-to-text pipeline, LLM extraction layer, and integration |
| Data governance / Information management | Retention, storage, classification, and lineage of the new transcription data type |
| Change management / L&D | Agent training, rollout communications, and adoption support |
| Product owner / Sponsor | Accountable for the business case, prioritisation, and success metrics |

---

## 4. What Is Clear

| # | Item | Detail |
|---|------|--------|
| 1 | Problem is quantified | ~340 data quality incidents/month from manual transcription errors — this is the primary metric to reduce |
| 2 | Scope of fields | Four field categories: address, phone number, email, employment status |
| 3 | Human-in-the-loop design | Agent always reviews and confirms before any CRM save — AI is advisory only |
| 4 | Core technology choices | Azure AI Speech for transcription; an LLM for entity extraction; Dynamics 365 as the CRM surface |
| 5 | User population | ~280 contact centre agents |
| 6 | Existing call recording | Calls are already recorded and retained under an existing policy — the audio pipeline exists |
| 7 | Vulnerability constraint | The feature must not automate any decision for vulnerable or hardship customers |

---

## 5. Assumptions (to be validated)

| # | Assumption | Why it matters | Suggested validation |
|---|-----------|---------------|---------------------|
| A1 | The existing Azure AI Speech service can transcribe NZ-accented English (and te reo Māori names, place names, and loanwords) with sufficient accuracy for structured field extraction | If transcription accuracy is poor for NZ-specific speech, the LLM extraction will inherit those errors and agent trust will erode — potentially producing *more* errors rather than fewer | Run a proof-of-concept with a representative sample of recorded calls measuring WER (Word Error Rate) on NZ names, addresses, and accented speech; define an acceptable accuracy threshold before proceeding |
| A2 | The ~340 incidents/month are predominantly caused by *hearing-and-typing* errors rather than by customers providing incorrect information or by system/process issues | If the root cause is customers giving wrong details (e.g., misspelling their own email), real-time transcription will faithfully reproduce the same wrong input and will not reduce incidents | Conduct a root-cause analysis on a sample of the 340 incidents to classify error source (agent mishearing, agent mistyping, customer-provided error, system lag, etc.) |
| A3 | Agents will trust and use the AI suggestions rather than reverting to manual typing | If agents ignore the side panel and keep typing manually, the feature delivers no benefit despite its cost | Include agent usability research / ride-alongs in discovery; design the pilot to explicitly measure adoption rate and override frequency |
| A4 | The LLM can reliably distinguish between the customer's *current* information and the *new* information they are providing, and map it to the correct CRM field | Calls are conversational — a customer may say their old address and new address in the same sentence; misattribution would cause a data quality incident of a different kind | Test with realistic conversational transcripts (including corrections, hesitations, and multiple values) and measure field-mapping precision and recall |
| A5 | The Dynamics 365 environment supports a real-time side-panel integration that can receive streamed data during a live call without unacceptable latency or UX disruption | If the side panel lags behind the conversation or disrupts the agent's primary workflow, agents will abandon it | Validate the Dynamics 365 extensibility model (e.g., Channel Integration Framework or custom PCF control) and measure end-to-end latency from utterance to side-panel display |
| A6 | The existing call recording consent mechanism (and any IVR notification) legally and ethically covers AI transcription and entity extraction — not just recording for quality purposes | Consent obtained for "call recording" may not extend to AI processing of the transcript; this is a distinct purpose under the Privacy Act 2020 | Engage the privacy team immediately (see Open Question 1) |
| A7 | Vulnerable / hardship customers can be reliably identified *before or at the point* the transcription feature is active, so that the feature's behaviour can be constrained appropriately | If identification only happens mid-call, the transcript may already have been generated and processed before the vulnerability flag is set | Map the current vulnerability identification process end-to-end and determine at what point in the call the flag is typically applied |

---

## 6. Open Questions

### Privacy, Legal & Compliance

| # | Question | Context | Who should answer |
|---|----------|---------|-------------------|
| Q1 | **Does the call transcript constitute personal information under the Privacy Act 2020, and what is the lawful basis for its collection and processing?** | The brief explicitly states the privacy team has not assessed this. The transcript is a new data type. This is a blocker — the answer shapes retention, access control, consent, and architecture decisions. | Privacy / Legal team |
| Q2 | **What is the permissible retention period for the transcript, and must it differ from the audio recording retention period?** | A text transcript may be easier to search and aggregate than audio, creating a different risk profile even if content is equivalent. | Privacy / Legal team + Information Management |
| Q3 | **Does the existing customer consent / IVR notification need to be updated to cover AI-powered transcription and extraction as a distinct processing purpose?** | Current consent likely covers "recording for quality and training." AI extraction is a new purpose. Under the Privacy Act 2020 (IPP 1–3), the purpose must be specified. | Privacy / Legal team |
| Q4 | **Will transcript data be processed or stored outside New Zealand (e.g., in Azure regions or by the LLM provider)?** | Cross-border data transfer of personal information triggers IPP 12 obligations. Azure AI Speech and the LLM may route to Australian or US datacentres. | Azure / AI engineering + Privacy team |
| Q5 | **What regulatory obligations apply to the four data fields being updated (e.g., AML/CFT address verification, credit reporting)?** | If address or employment status changes trigger regulated processes, pre-populating them via AI extraction may have compliance implications beyond data quality. | Compliance / Legal |

### Vulnerability & Hardship

| # | Question | Context | Who should answer |
|---|----------|---------|-------------------|
| Q6 | **What specifically should the feature do (or not do) when a customer is flagged as vulnerable or in hardship?** | The brief says "should not automate decisions" but does not define the boundary. Options range from disabling the feature entirely, to still showing suggestions but adding a warning, to suppressing only employment status extraction. | Vulnerability policy owner + Product owner |
| Q7 | **At what point in the call journey is a vulnerability flag typically set, and is it set before the transcription feature would activate?** | If the flag is set after the feature has already extracted data, we need a design for retroactive handling (e.g., purging the transcript, suppressing the suggestions). | Contact centre operations + Vulnerability team |

### Product & Design

| # | Question | Context | Who should answer |
|---|----------|---------|-------------------|
| Q8 | **What is the rollout strategy — phased pilot or big-bang to all 280 agents?** | The brief explicitly states this is undefined. A pilot is strongly advisable given the novel data type, privacy uncertainty, and the need to measure accuracy before scaling. | Product owner + Change management |
| Q9 | **What does "relevant portion of the call" mean — who or what determines when transcription starts and stops?** | Options: always-on during the call, agent-triggered (presses a button), or automatically triggered when the conversation topic is detected. Each has different UX, privacy, and cost implications. | Product owner + UX + Privacy |
| Q10 | **What is the minimum acceptable extraction accuracy (precision and recall by field type) that justifies shipping the feature?** | Without a threshold, there is no go/no-go criterion. If accuracy is below a threshold, agents will waste time correcting suggestions and the feature becomes a net negative. | Product owner + QA |
| Q11 | **How will success be measured post-launch?** | The 340 incidents/month is the lagging indicator. Leading indicators (e.g., agent override rate, time-to-update, extraction accuracy) need to be defined now so instrumentation is built in. | Product owner + Data/Analytics |
| Q12 | **What happens if the transcription or LLM service is unavailable during a call?** | Agents need a graceful fallback — presumably the current manual process — but the UX must handle the transition without confusion or lost data. | Engineering + UX |

### Technical & Architecture

| # | Question | Context | Who should answer |
|---|----------|---------|-------------------|
| Q13 | **Which LLM will be used for entity extraction, and where is it hosted?** | Determines latency, cost, data residency, and whether the model can be fine-tuned on NZ-specific data (e.g., NZ address formats, Māori place names). | AI engineering |
| Q14 | **How will the transcription text and extracted entities be stored, access-controlled, and audited within Dynamics 365?** | Transcript data needs different access controls than standard CRM fields — not every CRM user should see raw transcripts. | CRM platform team + Security |
| Q15 | **Is the audio-to-text transcription full-duplex (both agent and customer) or customer-only?** | If the agent's voice is transcribed too, the LLM may confuse agent-read-back of old data with customer-provided new data. | AI engineering + UX |

---

## 7. Risks Identified (Pre-Analysis)

| # | Risk | Likelihood | Impact | Notes |
|---|------|-----------|--------|-------|
| R1 | **Privacy Act non-compliance** — transcription is collected/retained without proper assessment, lawful basis, or customer notification | High (assessment has not started) | High | This is a potential blocker. Should be escalated to the privacy team as a dependency before build begins. |
| R2 | **Extraction errors create a new category of data quality incident** — the AI confidently suggests a wrong value and the agent confirms without scrutiny | Medium | High | "Automation bias" — agents may over-trust the AI. UX design must make review friction intentional, not minimal. |
| R3 | **Vulnerable customer handling is inadequately defined**, leading to inappropriate AI-driven suggestions or transcript retention for sensitive cohorts | High (policy gap) | High | Requires collaboration with the vulnerability team before design is finalised. |
| R4 | **Transcription accuracy is insufficient for NZ English**, Māori names, and Pacific language speakers, causing low agent trust and poor adoption | Medium | High | Mitigate with early PoC / accuracy benchmarking on representative call recordings. |
| R5 | **Cross-border data transfer** — transcript or LLM inference data leaves NZ without appropriate safeguards | Medium | High | Depends on Azure region configuration and LLM hosting — must be confirmed. |
| R6 | **Agent adoption failure** — agents bypass the side panel and continue typing manually, negating the investment | Medium | Medium | Mitigate with pilot, training, UX co-design, and adoption metrics. |
| R7 | **Scope creep into automated decisioning** — future pressure to remove the "agent confirms" step for efficiency, converting advisory AI into automated processing | Low (now) | High (later) | Document the human-in-the-loop requirement as a firm design principle and ensure governance is in place to prevent silent erosion. |

---

## 8. Recommended Next Steps

| # | Action | Owner (suggested) | Priority |
|---|--------|-------------------|----------|
| 1 | **Commission the Privacy Impact Assessment (PIA)** for the transcription data type — assess lawful basis, retention, consent, cross-border transfer, and vulnerable customer considerations. This is a gating dependency. | Privacy / Legal team | **Immediate — blocker** |
| 2 | **Conduct root-cause analysis** on a sample of the 340 monthly incidents to validate that transcription error is the dominant cause and to size the addressable opportunity. | QA / Operations | High |
| 3 | **Run a transcription accuracy PoC** using recorded calls (with appropriate consent) to benchmark Azure AI Speech WER on NZ-accented English, Māori place names, and realistic conversational patterns. | AI engineering | High |
| 4 | **Define the vulnerability handling design** with the vulnerability policy owner — what the feature does and does not do when a vulnerability flag is present or is set mid-call. | Product owner + Vulnerability team | High |
| 5 | **Define the rollout strategy** — recommend a phased pilot with a small agent group (~20–30) to measure accuracy, adoption, and incident reduction before scaling. | Product owner + Change management | High |
| 6 | **Clarify data residency** — confirm Azure AI Speech and LLM inference occur within NZ (or an approved jurisdiction) and that no transcript data is persisted outside approved boundaries. | AI engineering + Security | High |
| 7 | **Define success metrics and thresholds** — extraction accuracy per field, agent override rate, incident reduction rate, and the go/no-go criteria for scaling beyond pilot. | Product owner + Data/Analytics | Medium |
| 8 | **Design the agent review UX** with intentional review friction — avoid "one-click confirm all" patterns that encourage automation bias. Co-design with agents. | UX + Product owner | Medium |

---

*This discovery output is based solely on the information provided in the brief. Items marked as blockers should be resolved before detailed design or build begins.*