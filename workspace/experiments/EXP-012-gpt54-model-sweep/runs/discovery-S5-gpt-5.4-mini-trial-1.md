## /discovery output

### 1) Problem statement
Contact centre agents currently manually transcribe customer-provided updates during calls into Dynamics 365 CRM. This creates avoidable errors, contributing to about **340 customer data quality incidents per month**. You want a feature that:

- transcribes the relevant part of a call in real time using **Azure AI Speech**
- uses an **LLM** to extract field-value pairs for customer updates
- shows those extracted values to the agent in a side panel
- allows the agent to edit and **confirm before saving**
- does **not** auto-update records

### 2) Intended outcome
Reduce manual transcription errors and improve data quality while preserving agent oversight and avoiding any automated decision-making.

### 3) Users / scale
- ~**280 contact centre staff**
- Rollout approach unknown: **pilot or big-bang not yet defined**

### 4) Key workflow
1. Customer speaks during call
2. Relevant call segment is transcribed in near real time
3. LLM extracts likely updates such as:
   - address
   - phone number
   - email
   - employment status
4. Extracted values appear in a review panel
5. Agent edits if needed
6. Agent confirms
7. Only then are values saved to Dynamics 365

### 5) Data involved
Known:
- call audio already recorded under existing policy
- transcript text will be a **new data type**
- extracted field-value pairs will likely be stored as part of the CRM update process

Unknown / needs confirmation:
- whether transcripts are stored, and if so where
- retention period for transcripts
- whether transcripts are included in call recordings or stored separately
- whether AI prompts/responses are logged
- whether any metadata identifies vulnerable customers

### 6) Privacy / regulatory considerations
#### Privacy Act 2020
A key open question is whether the **transcript itself counts as personal information**. It likely may, because it can contain identifiable customer data and sensitive content, but this needs formal privacy assessment.

Actions required:
- assess whether transcripts are personal information
- determine lawful basis / purpose limitation
- define retention period for transcripts
- determine whether transcript access needs restriction or masking
- confirm whether the LLM or Speech service processes data outside approved jurisdictions

#### Vulnerable customers
The customer vulnerability policy says vulnerable customers must be handled with extra care and **the feature must not automate decisions for them**.

This means:
- the AI must only assist with extraction/suggestion
- no automated vulnerability detection or routing decisions should be introduced unless separately approved
- no adverse actions should depend on the transcript or AI output
- agents must remain the decision-maker at all times

### 7) Delivery risks / dependencies
#### Major unknowns
- rollout strategy not defined
- transcript retention not defined
- privacy classification not assessed
- integration details with Dynamics 365 not fully specified
- scope of “relevant portion” of the call not defined
- quality thresholds for extraction not defined
- handling of partial/conflicting values not defined

#### Product/operational risks
- transcription errors could still propagate into suggested values
- LLM may extract incorrect field-value pairs
- real-time latency may affect agent experience
- transcript storage may create new compliance burden
- vulnerable customer handling must not be compromised

### 8) Recommended discovery questions
#### Privacy / legal
1. Does the transcript contain personal information under the Privacy Act 2020?
2. Is a transcript considered part of the call record or a separate record?
3. What is the required retention period for transcripts?
4. Who can access transcripts?
5. Are Azure Speech and the LLM approved processors for this data?
6. Are there any cross-border data transfer constraints?

#### Customer vulnerability
1. How is vulnerability currently flagged in Dynamics?
2. Should the side panel behave differently for vulnerable customers?
3. Should AI output be suppressed, limited, or marked more prominently in those cases?
4. Are there any policy constraints on using transcripts for customers in hardship?

#### Product scope
1. Which fields are in scope for extraction in v1?
2. Is “employment status” a fixed set of values or free text?
3. Should the feature support partial updates only?
4. What should happen if the transcript and agent input conflict?
5. Is real-time transcription required, or is near-real-time acceptable?

#### Operations / rollout
1. Pilot first or full rollout?
2. Which agent group should be in the pilot?
3. What is the fallback if transcription or extraction fails?
4. What accuracy / confidence threshold is acceptable before showing suggestions?

### 9) Initial requirements summary
#### Functional
- Transcribe relevant call segment in real time using Azure AI Speech
- Extract candidate update fields using LLM
- Present extracted fields in Dynamics 365 side panel
- Allow agent review and edit
- Save only on explicit agent confirmation

#### Non-functional
- Low-latency enough for live calls
- High accuracy with clear agent review
- Auditable agent confirmation
- Secure handling of transcripts and extracted data
- Compliant retention and access controls

#### Constraints
- No automatic updates
- No automated decisions for vulnerable customers
- Must align with existing call recording policy
- Transcript retention and privacy treatment must be assessed before build

### 10) Discovery recommendation
Before implementation, complete a short discovery phase covering:
1. **Privacy assessment** for transcripts and AI processing
2. **Policy review** for vulnerable customers
3. **Scope definition** for fields and call segments
4. **Technical feasibility** for Dynamics 365 + Azure Speech + LLM integration
5. **Rollout plan** recommendation: pilot vs phased vs full release

If you want, I can turn this into a **discovery brief template**, **user story set**, or **risk register** next.