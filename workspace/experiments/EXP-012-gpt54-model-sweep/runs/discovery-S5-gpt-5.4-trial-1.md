Below is the **/discovery output** for the proposed Dynamics 365 real-time transcription and AI-assisted customer detail update feature.

---

# /discovery

## 1) Problem statement

Contact centre agents currently manually transcribe customer-provided updates during calls into Dynamics 365 CRM. This creates an estimated **340 customer data quality incidents per month** due to transcription errors.

The proposed feature would:

- transcribe the relevant part of the call in real time using **Azure AI Speech**
- send transcript content to an **LLM** to extract updated customer information
- pre-populate CRM fields such as:
  - address
  - phone number
  - email
  - employment status
- present extracted values to the **agent for review and confirmation**
- require the **agent to confirm before saving**; no automatic updates

Primary goal: **reduce manual transcription error while preserving human review and control**.

---

## 2) Business outcome sought

### Expected outcomes
- Reduce customer data quality incidents caused by manual transcription
- Improve agent efficiency when updating customer records
- Improve consistency of captured customer data
- Reduce rework and downstream impacts from incorrect customer details
- Maintain human-in-the-loop controls for CRM updates

### Likely measures of success
These are not yet defined, but should likely include:
- reduction in monthly transcription-related data quality incidents
- extraction accuracy by field type
- percentage of AI suggestions accepted without edit
- percentage of AI suggestions edited by agents
- average handling time impact
- agent satisfaction / usability
- error rate for vulnerable customer interactions
- privacy and compliance sign-off before production

---

## 3) In-scope capability as currently described

### Functional scope
- Real-time or near-real-time transcription of relevant portions of customer calls
- AI extraction of field-value pairs from transcript text
- Pre-population of CRM update fields in Dynamics 365
- Agent side panel for review and editing
- Manual confirmation before save

### Candidate fields mentioned
- Address
- Phone number
- Email
- Employment status

### Users
- Approximately **280 contact centre staff**

### Systems / services
- **Dynamics 365 CRM**
- **Azure AI Speech**
- **LLM-based extraction component**
- Telephony / call audio source integration
- Possibly call recording platform, depending on architecture

---

## 4) Key facts and assumptions explicitly stated

- Current process is manual and error-prone
- Approx. **340 incidents/month** are attributable to manual transcription errors
- AI output is a **suggestion only**
- Agents **always confirm before saving**
- Calls are already recorded and retained under existing policy
- **Call transcription text is a new data type**
- Privacy team has **not assessed** whether transcription is personal information under the **Privacy Act 2020**
- Privacy team has **not assessed retention requirements** for transcripts
- Calls may include customers in **financial hardship** or who are **vulnerable**
- The feature **must not automate decisions for vulnerable customers**
- Rollout approach is **not yet defined**
- Could be a **big-bang** or **phased/pilot** rollout

---

## 5) Discovery interpretation

This is best understood as an **AI-assisted data capture feature**, not an automated decisioning solution.

The core control is that:
- AI proposes
- agent reviews
- agent confirms
- only then is customer data updated

However, there are still meaningful discovery concerns in:
- **privacy**
- **information management**
- **AI accuracy**
- **vulnerable customer handling**
- **operational rollout**
- **integration architecture**
- **model governance**

---

## 6) Likely stakeholders

### Business / operations
- Contact centre operations lead
- Contact centre team leaders
- Frontline agents
- Customer data quality / operations excellence team

### Technology
- Dynamics 365 product owner / platform owner
- Solution architect
- Integration architect
- Azure platform / cloud engineering
- Telephony / call recording platform owner
- Security architecture

### Risk / governance
- Privacy team
- Legal / compliance
- Information management / records management
- Risk team
- AI governance / model risk function, if present
- Vulnerable customer / hardship policy owner

### Delivery
- Change manager
- Training lead
- Service desk / support
- Release manager

---

## 7) Discovery questions that must be answered

## A. Business and process questions
1. What exact customer update journeys are in scope initially?
   - Only profile maintenance?
   - Only inbound calls?
   - Will it include authenticated and unauthenticated callers?

2. Are all four fields equally important at launch?
   - Address
   - Phone
   - Email
   - Employment status

3. What is the baseline process today?
   - How does the agent confirm identity?
   - At what point in the call are updates captured?
   - Are there scripts or standard phrases that improve extraction?

4. What is the target outcome?
   - Reduced incidents only?
   - Faster average handle time?
   - Better agent experience?
   - Reduced after-call work?

5. How are transcription-related incidents currently measured?
   - What qualifies as a data quality incident?
   - How are incidents attributed to transcription error?

---

## B. Data and privacy questions
1. Does a call transcript constitute **personal information** under the Privacy Act 2020 in this context?
2. Is the transcript a new official business record, or an ephemeral processing artefact?
3. What transcript retention period is permitted or required?
4. Can transcript snippets be stored in Dynamics, logs, prompts, audit records, or only transiently processed?
5. Are we allowed to send transcript content containing personal information to the selected LLM service?
6. Will the LLM run:
   - within Azure tenant controls?
   - with data residency constraints?
   - with no training on customer data?
7. What minimisation controls are required?
   - only send relevant utterances?
   - redact unrelated content?
8. What notice, consent, or script changes are required, if any, for customers?
9. How will subject access, correction, and deletion requests apply to transcripts?
10. Are hardship/vulnerability disclosures considered sensitive or specially handled information in policy terms?

---

## C. AI / model questions
1. What extraction approach will be used?
   - prompt-based LLM only?
   - rules + LLM?
   - confidence scoring per field?
2. How will the system handle ambiguity?
   - “Did customer say 15 or 50?”
   - spelling of names in email addresses
   - apartment/unit details in addresses
3. Should low-confidence fields be left blank rather than suggested?
4. How will the model distinguish between:
   - existing details read back by the agent
   - new details supplied by the customer
   - hypothetical or corrected statements
5. How will the system handle multiple updates in one call?
6. Will the LLM extract only the defined fields or infer additional information?
7. How will prompt/output guardrails prevent over-extraction?
8. How will quality be tested before release?
9. What are acceptable precision/recall thresholds by field?
10. How will drift, quality degradation, and error monitoring be managed?

---

## D. Vulnerable customer and decisioning questions
1. What exactly counts as an “automated decision” under internal policy in this context?
2. Could pre-populating fields for vulnerable customers be seen as influencing decisions or handling?
3. Should transcription/extraction be disabled or constrained when a vulnerability flag is present?
4. Should vulnerability-related content be excluded from prompts and storage?
5. What if vulnerability is disclosed during the same call before the update is completed?
6. What additional controls are needed to ensure the feature does not alter hardship/vulnerability outcomes?
7. Is special agent guidance needed when AI suggestions appear during vulnerable customer interactions?

---

## E. UX and operations questions
1. What does the side panel experience look like?
2. Can the agent see source transcript snippets supporting each suggested field?
3. Must agents explicitly confirm each field, or can they confirm all together?
4. Are edits audited separately from original AI suggestions?
5. How much latency is acceptable?
6. What happens if transcription fails mid-call?
7. What happens if extraction returns conflicting values?
8. How are corrections handled when the customer changes their mind during the call?
9. Will this operate during the live call only, or also after-call from recording playback?

---

## F. Architecture and integration questions
1. What is the source audio stream for Azure AI Speech?
2. Is real-time streaming integration technically available from the telephony platform?
3. Where will transcript text be stored, if at all?
4. Where will extracted field suggestions be stored before confirmation?
5. How are prompts, outputs, and logs secured?
6. What audit trail is required for:
   - transcript snippet used
   - extracted values
   - agent edits
   - final saved value
7. What identity and access controls apply?
8. What is the expected call volume and concurrent usage?
9. Are there performance or cost constraints for real-time processing?
10. What resiliency and fallback mechanisms are required?

---

## G. Rollout and change questions
1. Will rollout be pilot-first or big-bang?
2. Which teams or call types should be in pilot?
3. What training is required for agents?
4. How will we measure success during pilot?
5. What support model is needed for early rollout?
6. What communications are needed for privacy, compliance, and staff confidence?
7. What exit criteria determine broader release?

---

## 8) Initial risks identified

## 1. Privacy classification risk
**Risk:** Transcript text is a new data type and may be personal information, but this has not been assessed.  
**Impact:** Non-compliant collection, use, storage, retention, or disclosure of personal information.  
**Mitigation needed:** Privacy impact assessment / legal review before design is finalised.

## 2. Retention and records management risk
**Risk:** It is unclear whether transcripts are transient artefacts or records subject to retention obligations.  
**Impact:** Over-retention, under-retention, inability to respond to information requests.  
**Mitigation needed:** Records management decision and technical retention controls.

## 3. AI extraction accuracy risk
**Risk:** Incorrect extraction may still bias agent decisions even with human review.  
**Impact:** Wrong customer data entered; possible persistence of current issue in a different form.  
**Mitigation needed:** confidence thresholds, explicit review UX, quality testing, auditability.

## 4. Vulnerable customer handling risk
**Risk:** Vulnerability or hardship content may be transcribed and processed in ways that conflict with policy.  
**Impact:** Harm to vulnerable customers, policy breach, reputational risk.  
**Mitigation needed:** clear design rules for vulnerable interactions and exclusions.

## 5. Functional creep / unintended inference risk
**Risk:** LLM may infer or extract more than intended from free-text call content.  
**Impact:** Capture of unnecessary or sensitive information; privacy and trust issues.  
**Mitigation needed:** constrained prompts, schema-bound outputs, minimisation.

## 6. Operational rollout risk
**Risk:** No rollout model has been defined.  
**Impact:** Poor adoption, unmanaged defects, insufficient support readiness.  
**Mitigation needed:** pilot-based rollout and controlled release plan.

## 7. Logging and prompt leakage risk
**Risk:** Personal information could end up in application logs, telemetry, or prompt history.  
**Impact:** Secondary data exposure.  
**Mitigation needed:** secure logging design, redaction, least-privilege access.

## 8. Overreliance / automation bias risk
**Risk:** Agents may trust suggested values too readily.  
**Impact:** Incorrect updates despite human confirmation control.  
**Mitigation needed:** UX patterns that require active review and training.

## 9. Architecture feasibility risk
**Risk:** Real-time call streaming, latency, and integration with Dynamics may be more complex than assumed.  
**Impact:** delivery delay, performance issues, degraded agent experience.  
**Mitigation needed:** technical spike / proof of concept.

---

## 9) Initial non-functional considerations

### Security
- Encryption in transit and at rest
- Access controls for transcripts and suggestions
- Restricted logging of personal data
- Audit trail for changes and user actions

### Performance
- Real-time or near-real-time latency expectations need definition
- Side panel updates must not disrupt call handling

### Reliability
- Graceful degradation if transcription or extraction service is unavailable
- Manual entry fallback must remain available

### Auditability
- Ability to show:
  - what was suggested
  - what the agent edited
  - what was saved
  - who confirmed it
  - when it occurred

### Data minimisation
- Process only the relevant call segment if possible
- Avoid storing full transcript unless clearly justified

### Usability
- Agent must be able to quickly verify suggestions
- Confidence and supporting evidence may need to be visible

---

## 10) Likely assumptions to validate

- Human confirmation is sufficient to avoid classification as automated decision-making
- Existing call recording permissions/controls extend to transcript text
- Azure AI Speech and chosen LLM services can be used within organisational privacy and security requirements
- Real-time transcription accuracy is adequate for the target fields
- Agents can review suggestions without increasing handling time
- Vulnerable customer safeguards can be designed without removing most of the business value

---

## 11) Recommended discovery outputs to produce next

1. **Current-state process map**
   - how customer updates are captured today
   - pain points and error sources

2. **Future-state service design**
   - call flow
   - transcript flow
   - extraction flow
   - confirmation and save flow
   - fallback path

3. **Privacy impact assessment**
   - transcript classification
   - lawful use
   - retention
   - disclosure boundaries
   - customer notice implications

4. **AI risk assessment**
   - intended use
   - failure modes
   - human oversight design
   - vulnerable customer controls

5. **Architecture options paper**
   - real-time vs near-real-time
   - transient vs stored transcript
   - rules+LLM vs LLM-only extraction

6. **Pilot design**
   - pilot cohort
   - success metrics
   - monitoring and support plan

7. **Data governance decision record**
   - what is stored
   - where
   - for how long
   - who can access it

---

## 12) Recommended next steps

### Immediate
1. Run a **privacy/legal/data governance review** focused on transcript text as a new data type.
2. Confirm whether transcript handling is permissible under current customer notices and policies.
3. Conduct a **technical spike** for:
   - real-time Azure AI Speech integration
   - LLM field extraction
   - latency and accuracy
4. Define **field-level scope for MVP**.
5. Engage vulnerable customer policy owner to define explicit **guardrails**.

### Short term
6. Design a **human-in-the-loop UX** that minimises automation bias.
7. Define **quality metrics** and test datasets.
8. Decide whether transcript data is:
   - not stored
   - partially stored
   - fully stored with retention control
9. Create a **pilot rollout plan** rather than defaulting to big-bang.

---

## 13) Suggested MVP framing

A prudent MVP would likely be:

- limited to a small pilot group
- limited to a narrow set of fields:
  - phone number
  - email
  - possibly address
- no automatic save
- clear field-level review and confirmation
- transcript minimised to relevant update segment only
- vulnerable customer interactions subject to explicit policy handling
- strong audit trail
- privacy sign-off before production use

Employment status may require additional care because it can be more context-sensitive and may intersect with hardship/vulnerability conversations.

---

## 14) Discovery summary

This initiative has a clear operational problem and a plausible AI-assisted solution. The strongest value case is reducing manual transcription errors while keeping agents in control.

However, the discovery is **not yet sufficient for implementation commitment** because several critical questions remain unresolved, especially around:

- **privacy classification of transcripts**
- **retention and records management**
- **vulnerable customer safeguards**
- **AI accuracy and agent overreliance**
- **rollout approach**

---

## 15) Overall discovery status

**Status: Needs further discovery before solution shaping can be considered complete.**

### Gating items
- Privacy assessment of transcript text
- Data retention decision
- Vulnerable customer control design
- Technical feasibility spike
- MVP scope and rollout decision

If you want, I can next turn this into one of the following:

1. a **RAID log**  
2. a **discovery workshop agenda**  
3. a **set of epics/features/user stories**  
4. a **privacy-by-design checklist**  
5. an **assumptions and open questions register**