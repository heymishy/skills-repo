Below is a structured **/discovery output** for the proposed Dynamics 365 contact-centre transcription and AI-assisted field update feature.

---

# /discovery

## 1) Problem statement

Contact centre agents currently update customer information during calls by manually typing customer-provided details such as address, phone number, email, and employment status into Dynamics 365 CRM. This manual transcription process is causing approximately **340 customer data quality incidents per month**.

The proposed feature would:
- transcribe the relevant part of the call in real time using **Azure AI Speech**
- use an **LLM** to extract structured field/value updates
- pre-populate CRM update fields for the **agent to review, edit, and confirm**
- ensure **no automatic update occurs without agent confirmation**

The opportunity is to reduce transcription-related errors and improve agent efficiency while maintaining human oversight.

However, there are important discovery gaps and risks, especially around:
- whether call **transcripts** are personal information under the **Privacy Act 2020**
- how long transcripts can be retained
- handling of **vulnerable customers** and customers in **financial hardship**
- ensuring the feature does not create unintended automated decision-making
- rollout approach and change management for ~**280 staff**

---

## 2) Desired outcomes

### Primary outcomes
- Reduce customer data quality incidents caused by manual transcription
- Improve accuracy of customer profile updates
- Reduce agent effort and cognitive load during update interactions
- Preserve agent control through review-and-confirm workflow

### Secondary outcomes
- Improve consistency of data capture
- Potentially reduce average handling time for update-related calls
- Increase confidence in CRM customer data quality

### Guardrail outcomes
- No automatic update without explicit agent confirmation
- No automated decisioning for vulnerable customers
- Privacy, retention, and lawful handling of transcripts clarified before implementation
- Security and access controls appropriate for a new class of potentially sensitive data

---

## 3) In scope / out of scope

### In scope
- Real-time transcription of relevant call segments
- AI extraction of customer update details:
  - address
  - phone number
  - email
  - employment status
- Pre-population of Dynamics 365 fields for agent review
- Agent editing and confirmation workflow
- Side-panel UX in Dynamics 365
- Consideration of privacy, security, retention, and vulnerable customer handling
- Rollout considerations for contact centre staff

### Out of scope / not yet defined
- Fully automated updates to CRM
- Automated decisions or workflow branching based on transcript content
- Use of transcripts for broader analytics, QA, model training, or monitoring
- Retrospective batch processing of historical call recordings
- Detailed rollout model (pilot vs big bang not yet decided)
- Formal legal/privacy determination on transcript status
- Full operating model for transcript retention and deletion

---

## 4) Current state

- Agents manually listen to customers and type updates into CRM.
- Errors from manual transcription are materially impacting data quality.
- Call recordings already exist and are retained under an existing call recording policy.
- **Transcripts are new** and have not yet been assessed by privacy/legal teams.
- Vulnerable customer handling exists as a policy obligation.
- No defined rollout plan yet.

---

## 5) Proposed future state

During a customer call:
1. The relevant call segment is transcribed in real time using Azure AI Speech.
2. The transcript text is passed to an LLM.
3. The LLM extracts candidate field/value pairs.
4. Dynamics 365 displays suggested updates in a side panel.
5. The agent reviews, edits if required, and explicitly confirms.
6. Only after confirmation are values saved to CRM.

Key principle: **AI assists data entry; the human remains the decision-maker.**

---

## 6) Users and stakeholders

### Primary users
- Contact centre agents (~280 staff)

### Secondary users / operational stakeholders
- Team leaders / supervisors
- Contact centre operations
- CRM product owner / business owner
- Customer data quality / remediation teams

### Governance / assurance stakeholders
- Privacy team
- Legal/compliance
- Information security
- Records management / information governance
- Risk team
- Customer vulnerability / conduct team
- Enterprise architecture
- AI governance / model risk (if applicable)
- Change and training teams

### Technical stakeholders
- Dynamics 365 engineering team
- Azure platform / cloud team
- Telephony / call recording team
- Integration team
- Data / AI engineering team

---

## 7) Key assumptions

These appear to be current assumptions and should be tested:

- Azure AI Speech can reliably transcribe the relevant portions of calls with sufficient accuracy.
- The LLM can accurately extract structured values for the targeted fields.
- Human review is sufficient to mitigate extraction errors.
- Agent confirmation means the feature is not considered automated decision-making.
- Existing call recording notices/consents may or may not cover transcription.
- Transcript retention may be able to align with existing recording retention, but this is not yet confirmed.
- Vulnerable customers can be supported by maintaining human review and avoiding automated actions.
- Dynamics 365 can support the side-panel suggestion workflow with acceptable latency.

---

## 8) Business value hypothesis

If the feature reduces manual transcription errors, it could:
- materially reduce the current **340 monthly data quality incidents**
- improve downstream customer servicing by maintaining more accurate contact details
- reduce remediation effort caused by incorrect updates
- improve agent productivity and experience

This hypothesis needs baseline and target measures.

---

## 9) Measures of success

### Outcome metrics
- Reduction in monthly customer data quality incidents attributable to manual transcription
- Accuracy rate of AI-suggested field/value pairs
- Agent acceptance/edit rate for AI suggestions
- Reduction in rework caused by incorrect updates
- Reduction in average handling time for eligible update interactions, if targeted

### Guardrail metrics
- % of updates saved without agent confirmation: target **0%**
- Incidents involving vulnerable customer mishandling: target **0**
- Privacy/security incidents related to transcript handling: target **0**
- Hallucination / incorrect extraction rate above threshold
- Transcripts retained outside approved policy: target **0**

### Adoption metrics
- % of eligible calls where feature is used
- Agent satisfaction/confidence
- Frequency of manual override/editing

---

## 10) Process and user journey considerations

### Likely future workflow
- Agent identifies customer wants to update details
- Transcript captures customer utterance
- AI parses likely values
- Agent sees proposed values in side panel
- Agent compares proposal with conversation/context
- Agent edits any incorrect fields
- Agent confirms save

### Important UX questions
- How is the “relevant portion” of the call determined?
- Does the agent manually trigger extraction, or is it always-on?
- How are low-confidence suggestions shown?
- Can the agent see transcript snippets supporting each field?
- How do we avoid over-trust/automation bias?
- How do we distinguish “customer said old value” vs “customer said new value”?
- How are partial updates handled?
- What happens if multiple values are mentioned?
- How are corrections such as “sorry, not 15, 50 Queen Street” handled?

---

## 11) Data considerations

### Data inputs
- Live call audio
- Customer spoken statements
- Potential existing CRM record values for comparison
- Vulnerability flags/status already in CRM, if available

### Data outputs
- Real-time transcript
- Extracted field-value pairs
- Confidence indicators / supporting evidence
- Audit trail of agent confirmation and edits

### Data classes likely involved
Potentially sensitive personal information may appear in transcripts, including:
- address
- phone
- email
- employment status
- potentially incidental sensitive information, including hardship/vulnerability context

### Important data questions
- Is the **transcript** personal information under the Privacy Act 2020?
- Is employment status handled as standard personal info or subject to additional sensitivity handling?
- Can the transcript contain more information than is needed for the field update?
- Will transcripts be stored, cached, logged, or only processed transiently?
- Where are prompts, outputs, and telemetry stored?
- Will transcript text be visible in Dynamics, or only extracted suggestions?
- What audit evidence must be retained?

---

## 12) Privacy considerations

This is a major discovery area.

### Known privacy concerns
- Transcript text is a **new data type**
- Privacy team has not yet determined:
  - whether transcripts are personal information
  - the lawful basis / purpose framing
  - appropriate retention period
  - whether current customer notices cover transcription in addition to recording

### Key privacy topics to assess
- Purpose limitation: transcription used only to assist updates?
- Data minimisation: only transcribe relevant segment vs full call?
- Storage limitation: whether transcript needs to be stored at all
- Retention and deletion rules
- Access controls to transcript text
- Logging of prompts and model outputs
- Cross-border processing/data residency implications
- Whether vendors/processors use data for model training
- Customer notice/consent wording for recording vs transcription
- Handling of special or sensitive content incidentally captured in transcript

### Privacy-by-design opportunities
- Process transcript ephemerally where possible
- Store structured final field changes and audit trail, not full transcript, unless required
- Mask/redact non-required content
- Restrict transcript access
- Minimise prompt content sent to LLM
- Disable model training on customer data where applicable

---

## 13) Vulnerable customers and conduct considerations

This is another critical discovery area.

### Known requirement
- Customers in financial hardship or who are vulnerable require additional care.
- The feature must **not automate decisions** for vulnerable customers.

### Implications
- AI output must remain advisory only.
- The feature should not trigger approvals/declines, risk scoring, prioritisation, or treatment changes.
- Vulnerability content may appear in transcripts even when the customer is only updating details.
- There is a risk that the model infers or surfaces sensitive vulnerability-related content unnecessarily.

### Questions to resolve
- Should the feature behave differently when a customer is already flagged as vulnerable?
- Should transcription/extraction be disabled, limited, or specially handled in hardship/vulnerability calls?
- Should prompts explicitly instruct the model to extract only the target update fields and ignore hardship/vulnerability narrative?
- What controls ensure the transcript is not reused for vulnerability profiling or other decisions?
- Are there conduct obligations requiring explicit operational safeguards or script changes?

---

## 14) AI/ML considerations

### AI components
- Speech-to-text via Azure AI Speech
- LLM for information extraction

### AI risks
- Mis-transcription due to accent, noise, speech pace, or cross-talk
- Hallucinated or inferred values
- Extraction of the wrong “new” value
- Bias/performance variation across customer cohorts
- Automation bias by agents over-trusting suggestions
- Leakage of unnecessary personal information in prompts/outputs

### Controls likely needed
- Human confirmation required
- Confidence thresholds and low-confidence handling
- Display source transcript snippet/evidence for each suggestion
- Restrict output to specific target fields
- Prompting that forbids inference where value not explicitly stated
- Evaluation against representative call samples
- Monitoring for accuracy by field and customer segment
- Fallback to manual entry when confidence is low or transcription fails

### Important model questions
- Which LLM will be used?
- Where is it hosted?
- Is data retained by the service?
- Can prompts/outputs be excluded from vendor training?
- How will model quality be tested pre-production?
- How will prompt changes be governed?

---

## 15) Security considerations

- Transcript text may expose more customer information than structured CRM fields.
- Need role-based access control for transcripts, suggestions, logs, and audit trails.
- Need secure transmission between telephony, speech service, LLM, and Dynamics.
- Need assurance on encryption at rest/in transit.
- Need logging and monitoring without overexposing transcript content.
- Need secrets/key management for integrations.
- Need assessment of whether transcript data appears in support logs, debugging traces, or analytics tools.

---

## 16) Records management / retention considerations

This area is currently unresolved.

Questions:
- Is the transcript a business record?
- Must it be retained, and for how long?
- Can it be treated as ephemeral processing data?
- If retained, does its retention align with call recording retention?
- If only extracted values are saved, what audit artefact proves the update was appropriately reviewed?
- Is the agent confirmation event sufficient, or is transcript evidence required?

Potential options to assess:
1. **No transcript retention** beyond transient processing
2. **Short-lived retention** for troubleshooting
3. **Retention aligned to call recording policy**
4. **Selective retention** only of extracted field/value suggestions and confirmation metadata

---

## 17) Compliance / legal considerations

Needs formal assessment, but likely topics include:
- Privacy Act 2020 applicability to transcripts
- Notification/consent for recording vs transcription
- Fairness and transparency in AI-assisted processing
- Obligations concerning vulnerable customers and hardship handling
- Records retention requirements
- Contractual/vendor terms for Azure AI services
- Cross-border/data residency considerations
- Whether the feature triggers internal AI governance review

---

## 18) Technical considerations and dependencies

### Likely dependencies
- Telephony/call audio stream access
- Azure AI Speech integration
- LLM integration
- Dynamics 365 side-panel/custom UI capability
- Identity and access management
- Logging/monitoring
- Data storage design for transcript/output/audit
- Existing customer vulnerability flag in CRM

### Non-functional considerations
- Real-time latency acceptable during live calls
- Reliability and graceful degradation
- Scalability for ~280 agents
- Accuracy thresholds by field
- Fail-safe behaviour when services are unavailable
- Cost of real-time speech + LLM processing

### Failure modes to design for
- No transcription returned
- Delayed transcription
- Wrong speaker attribution
- Multiple possible values
- LLM output malformed/unusable
- Integration timeout
- Agent saves manually instead

---

## 19) Delivery and rollout considerations

Current rollout approach is undefined.

### Options to assess
- Pilot with small agent cohort
- Phased rollout by team or call type
- Big-bang release

### Discovery view
A **pilot/phased rollout** appears lower risk because of:
- privacy/legal uncertainty
- vulnerable customer considerations
- need to measure extraction accuracy in production-like conditions
- need to validate agent trust and behaviour
- need to refine prompts/UX

### Change impacts
- Agent training on reviewing AI suggestions
- Training to avoid over-reliance
- Guidance for vulnerable customer scenarios
- Supervisor coaching
- Updated scripts/processes if customer notice changes are required

---

## 20) Risks

### High/critical risks
1. **Privacy non-compliance**
   - Transcript is new personal information and may be mishandled without approved policy.

2. **Retention uncertainty**
   - No decision yet on whether/how long transcripts can be kept.

3. **Vulnerable customer harm**
   - Feature could inadvertently influence treatment or create perceived automation in sensitive cases.

4. **Incorrect AI extraction**
   - Wrong values may be suggested and accepted by agents, causing customer harm.

5. **Automation bias**
   - Agents may over-trust pre-populated values.

6. **Notice/consent gap**
   - Existing recording disclosures may not adequately cover transcription/AI extraction.

### Medium risks
7. Inconsistent model performance across accents/noisy calls
8. Security/logging exposes transcript content more broadly than intended
9. Rollout without pilot creates operational and conduct risk
10. Cost/latency may reduce usability
11. Scope creep into analytics or decisioning uses

---

## 21) Open questions

### Business/process
- Which call types are in scope initially?
- Is extraction always-on or triggered by agent action?
- What exact fields are phase 1?
- Is employment status free text or controlled vocabulary?
- What baseline cost/impact do the 340 monthly incidents create?

### Privacy/legal
- Is transcript personal information?
- What retention period is permissible?
- Do current recording notices cover transcription and AI-assisted extraction?
- Can transcript be processed ephemerally only?
- Are there constraints on using cloud AI services for this data?

### Vulnerability/conduct
- What is the required behaviour for hardship/vulnerable calls?
- Should the feature be disabled or limited in these scenarios?
- Is there a need for explicit exclusion rules?

### Technical
- How will “relevant portion of the call” be identified?
- Can Azure AI Speech support needed accuracy and latency?
- What LLM is proposed?
- How are confidence and provenance surfaced to agents?
- What audit trail is required?

### Delivery
- Pilot or big bang?
- What success thresholds must be met before wider rollout?
- What training/support model is needed?

---

## 22) Discovery recommendations

### Immediate next steps
1. **Run privacy/legal assessment**
   - Determine transcript classification, lawful use, retention, notice, and vendor/data residency implications.

2. **Run vulnerability/conduct assessment**
   - Define explicit guardrails for hardship/vulnerable customer interactions.

3. **Define minimal viable scope**
   - Limit to specific update fields and perhaps a subset of call types.

4. **Design for data minimisation**
   - Prefer extraction from the smallest relevant transcript segment.
   - Avoid retaining full transcripts unless justified.

5. **Prototype and evaluate**
   - Test transcription + extraction on representative call samples.
   - Measure accuracy by field, accent/noise conditions, and vulnerable-call scenarios.

6. **Plan a pilot rollout**
   - Small cohort, supervised, with monitoring and feedback loops.

7. **Establish AI governance**
   - Prompt design, evaluation criteria, change control, incident handling, and monitoring.

---

## 23) Suggested MVP guardrails

For an MVP, I would recommend:
- Human confirmation mandatory before any save
- Extraction limited to:
  - address
  - phone
  - email
  - employment status
- No automated decisions or workflow changes
- No use for vulnerable customer decisioning or profiling
- Confidence/provenance shown for each suggested field
- Manual fallback always available
- Transcript retention disabled or minimised until privacy decision is made
- Pilot rollout only until privacy, conduct, and model performance are proven

---

## 24) Initial discovery assessment

### Overall
This appears to be a **promising AI-assist use case** with clear business value, because:
- the problem is concrete and measurable
- human review remains in place
- the target task is narrow and structured

### But
It is **not ready for implementation without further discovery** due to unresolved issues in:
- privacy classification and retention of transcripts
- vulnerable customer safeguards
- notice/consent implications
- operational rollout strategy

### Current recommendation
Proceed to **targeted discovery / assessment phase**, not full delivery yet.

---

## 25) Likely classification summary

### Use case type
- AI-assisted data entry / decision support
- Human-in-the-loop
- Narrow extraction task

### Delivery readiness
- **Amber**
  - Strong use case
  - Significant governance/privacy questions unresolved

### Major gating items
- Privacy assessment of transcripts
- Retention decision
- Vulnerability/conduct guardrails
- Pilot plan and evaluation criteria

---

If you want, I can also convert this into one of these formats:
1. **Discovery workshop question set**
2. **RAID log**
3. **One-page initiative summary**
4. **Decision paper with go/no-go recommendations**
5. **Requirements catalogue (functional + non-functional + compliance)**