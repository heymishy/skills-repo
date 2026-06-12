Here’s a discovery summary for the proposed Dynamics 365 call transcription feature.

## 1) Feature overview
You want to build an agent-assist capability in Dynamics 365 that:

- listens to / receives the relevant portion of a customer call in real time
- transcribes speech using Azure AI Speech
- uses an LLM to extract updated customer details
- shows suggested field values to the agent in a side panel
- allows the agent to review, edit, and confirm before saving

The feature is **decision-support only**. The agent remains the final decision-maker and must confirm before any update is saved.

---

## 2) Current problem
Agents currently manually type customer-provided updates such as:

- address
- phone number
- email
- employment status

This creates transcription / data entry errors, contributing to approximately **340 customer data quality incidents per month**.

---

## 3) Proposed future state
The intended future state is:

1. customer provides updated details during the call
2. speech is transcribed in real time
3. extracted text is processed by an LLM into field-value suggestions
4. suggested values are displayed to the agent
5. agent reviews, edits if required, and confirms
6. only then are CRM updates saved

---

## 4) Key users and scale
- Approximately **280 contact centre staff** will use the feature
- Rollout approach is **not yet defined**
  - could be big-bang
  - or phased / pilot first

This means user training, support, and operational readiness should be planned for both scenarios.

---

## 5) Important privacy and data considerations
A major discovery item is the transcription itself.

### Transcription as a new data type
You stated that customer calls are already recorded under the existing call recording policy, but the **transcription text** is a new kind of data for the organisation.

Open questions:
- Does the transcription count as personal information under the Privacy Act 2020?
- What is the lawful retention period for transcripts?
- Will the transcript contain sensitive information beyond the intended update fields?
- Will the transcript be stored, logged, cached, or passed to downstream systems?

This needs privacy and legal review before build decisions are finalised.

### Practical risk
Even if only a small part of the call is used, transcription can capture:
- names
- contact details
- financial hardship indicators
- vulnerability indicators
- incidental personal information

So the feature likely needs a clear data minimisation approach.

---

## 6) Vulnerable customers / hardship handling
You’ve said the organisation handles customers in financial hardship or who are vulnerable, and the policy requires additional care.

Important constraint:
- the transcription feature must **not automate decisions** for vulnerable customers

That means:
- no automated classification that determines treatment
- no automatic case routing or prioritisation based solely on transcription output
- no automated approval/denial of updates based on vulnerability indicators

If the feature surfaces vulnerability-related information at all, it should only support the agent, not drive decisions.

---

## 7) Key risks identified
### Operational risk
- transcription errors could create incorrect suggested values
- LLM extraction could mis-identify field-value pairs
- agents may over-trust suggestions

### Privacy / compliance risk
- transcript retention and reuse may breach privacy expectations if not assessed
- call transcripts may include sensitive or unexpected information
- unclear consent/notice implications may exist depending on current call disclosures

### Fairness / customer care risk
- vulnerability-related content must not trigger automated decisions
- the design must avoid creating a “silent scoring” effect

### Delivery risk
- rollout approach not defined
- no pilot / phased deployment plan yet
- operational support model not yet confirmed

---

## 8) Discovery questions to answer next
These are the most important questions to resolve before design and build:

### Data and privacy
1. Will transcripts be stored, and if so, where?
2. What is the retention period for transcripts?
3. Are transcripts searchable or reportable?
4. Will transcript content be used for any purpose beyond suggesting field updates?
5. Does current customer notice / consent language cover real-time transcription?
6. Are there restrictions on sending call content to Azure AI Speech and the LLM service?

### Process
7. Which call segments will be transcribed?
   - full call
   - only the part relevant to updates
   - agent-selected segment
8. What happens when transcription confidence is low?
9. Can agents reject all suggestions and continue with manual entry?
10. What fields are in scope for pre-population?
11. Do some fields require extra validation before save?

### Vulnerability / hardship handling
12. How will vulnerable customer cases be flagged in the workflow?
13. Should the feature be disabled or limited for certain cases?
14. Are there any policy controls for using AI assistance in hardship/vulnerable interactions?

### Release readiness
15. Will rollout be pilot first?
16. What training is needed for agents and supervisors?
17. What monitoring is required for error rates, adoption, and privacy incidents?

---

## 9) Suggested discovery conclusion
This is a promising agent-assist feature with a clear business problem:
- reduce manual transcription errors
- improve CRM data quality
- reduce rework and customer impact

However, there are two major dependency areas that must be resolved before delivery:
1. **privacy / retention assessment for transcripts**
2. **policy alignment for vulnerable customers**

A safe design direction is:
- transcription and extraction are used only as suggestions
- the agent remains fully in control
- no automated decisions are made from transcript content
- transcript storage and retention are tightly governed

---

If you want, I can turn this into a **discovery template output** with sections like:
- Problem statement
- Current state
- Future state
- Assumptions
- Risks
- Open questions
- Recommended next steps