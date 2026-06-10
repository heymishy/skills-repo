# Discovery Report: AI-Assisted Customer Data Update Feature
### Dynamics 365 CRM — Real-Time Transcription & Field Extraction

---

## 1. Executive Summary

This discovery covers a proposed feature to reduce manual transcription errors in customer data updates across the contact centre. The concept is sound and the problem is well-defined — **340 data quality incidents per month** represents a meaningful operational burden with downstream effects on customer experience and data integrity.

However, discovery has surfaced **four areas that must be resolved before build can begin**: a privacy assessment gap on call transcriptions, an undefined rollout strategy, outstanding design questions around vulnerable customer handling, and LLM pipeline decisions that have architectural and compliance implications.

This report documents what is understood, what is not yet decided, and the recommended next steps to move toward a build-ready state.

---

## 2. Problem Statement

Contact centre agents manually type customer-provided updates to address, phone number, email, and employment status during live calls. This process:

- Produces approximately **340 data quality incidents per month** attributable to transcription errors
- Splits agent attention between listening to the customer and typing accurately
- Creates downstream costs in data remediation, failed communications, and customer friction

The proposed solution keeps the agent in control — AI extracts and suggests, the agent reviews and confirms. No automated writes to the customer record.

---

## 3. What Is Understood and Agreed

### 3.1 Functional Scope

| Element | Status |
|---|---|
| Fields in scope | Address, phone number, email, employment status |
| Trigger | Agent-initiated during a live call |
| Transcription technology | Azure AI Speech (real-time) |
| Extraction technology | LLM — identifies field-value pairs from transcript segment |
| Agent interaction | Side panel in Dynamics 365 — review, edit if needed, confirm |
| Write behaviour | Agent confirmation required before any CRM field is updated |
| Automated decisions | None — AI output is a suggestion only |
| User base | ~280 contact centre agents |

### 3.2 What the Feature Does Not Do

- It does not automatically update any customer record
- It does not make decisions about customers
- It does not replace the agent — it assists with a specific transcription and extraction task
- It does not process the entire call — only the relevant portion (though the boundary of "relevant portion" needs to be defined — see Section 5)

---

## 4. Architecture Overview (As Understood)

```
Live Call Audio
      │
      ▼
Azure AI Speech ──► Real-Time Transcript (text)
      │
      ▼
LLM Processing ──► Extracted field-value pairs
      │              e.g. { address: "14 Rata St...", email: "..." }
      ▼
Dynamics 365 Side Panel ──► Agent reviews / edits
      │
      ▼
Agent Confirms ──► CRM record updated
```

**Open architectural questions are captured in Section 5.**

---

## 5. Open Questions and Gaps

The following items are unresolved. Each one is a blocker or a risk that must be addressed before the feature is build-ready. They are grouped by domain.

---

### 5.1 Privacy and Data Governance — BLOCKER

> *"Our privacy team has not assessed whether the transcription constitutes personal information under the Privacy Act 2020 and how long it can be retained."*

This is the most significant unresolved item. Call transcriptions are a **new data type** for the organisation. Under the **Privacy Act 2020 (NZ)**, personal information is broadly defined as information about an identifiable individual. A verbatim transcript of a customer describing their address, employment status, and contact details almost certainly meets that threshold — but this must be formally assessed, not assumed.

**Questions that must go to the privacy team:**

| Question | Why It Matters |
|---|---|
| Does the call transcript constitute personal information under the Privacy Act 2020? | Determines whether Privacy Act obligations (collection, storage, access, correction, disposal) formally apply |
| What is the lawful basis and purpose for creating and retaining the transcript? | Collection limitation principle — collect only what is needed for a stated purpose |
| How long can the transcript be retained? | Existing call recording retention policy may not automatically extend to transcripts — these are a different artefact |
| Where will transcripts be stored, and who can access them? | Storage location, access controls, and audit logging requirements |
| Does the transcript need to be disclosed to the customer on request? | Subject access rights under the Privacy Act |
| Does creating a transcript require a change to the organisation's privacy notice or collection statement? | Customers may not currently be told their call will be transcribed into a text artefact |
| Is there any obligation to notify customers that AI is processing their speech? | Emerging best practice, and potentially relevant to organisational trust obligations |
| Does the transcript retention period need to differ from the audio recording retention period? | Likely yes — text is more searchable and portable, increasing privacy risk at scale |

**Recommendation:** A formal Privacy Impact Assessment (PIA) or equivalent review should be initiated now, in parallel with design work. Build should not commence until retention policy and storage requirements are confirmed. The privacy team should be given a clear brief that includes the full data flow — audio → transcript → LLM processing → CRM field population — not just the transcript storage question in isolation.

> ⚠️ **Note on LLM processing:** The privacy team should also be asked to assess whether sending transcript content to an LLM — depending on whether it is a cloud-hosted third-party model or an internally hosted model — constitutes a disclosure of personal information, and whether any data processing agreements or model usage terms need to be reviewed.

---

### 5.2 Vulnerable Customer Handling — DESIGN REQUIREMENT

> *"The transcription feature should not in any way automate decisions for vulnerable customers."*

This requirement is stated and is correctly scoped — the feature as designed (agent confirms before save) does not automate decisions for anyone. However, there are design details that need to be resolved to ensure the feature does not create unintended risk for vulnerable customers.

**Questions to resolve:**

| Question | Why It Matters |
|---|---|
| When a customer is flagged as vulnerable in CRM, does the feature behave differently, or does it behave identically (assist only, agent confirms)? | If the behaviour is identical, that is fine — but it should be a conscious decision, not an oversight |
| Should the side panel surface the vulnerability flag visually so the agent is reminded of the customer's status during the update workflow? | Reduces the risk of an agent rushing through a confirmation during a sensitive call |
| If the LLM extracts employment status from the transcript of a hardship customer, is there any risk of that extracted value being misused? | Employment status is sensitive for hardship customers — the review-before-save design mitigates this, but the data handling of the extracted (but not yet saved) value should be considered |
| Does the vulnerability policy require any specific agent training or workflow steps that the feature design should accommodate or not disrupt? | Feature design should not create new friction that makes vulnerable customer handling harder |
| Should transcription be disabled or opt-out-able for vulnerable customers? | Some organisations choose to treat vulnerable customer calls with additional data minimisation — worth a policy discussion |

**Recommendation:** Brief the customer vulnerability policy owner on the feature design and get explicit sign-off that the proposed design (AI suggests, agent confirms, no automation) is consistent with the policy. Document that sign-off. Discuss whether surfacing the vulnerability flag in the confirmation panel is required or recommended.

---

### 5.3 LLM Pipeline — ARCHITECTURAL DECISIONS NEEDED

The LLM component is described at a high level. Several decisions remain open that have cost, latency, accuracy, and compliance implications.

**Questions to resolve:**

| Question | Options / Considerations |
|---|---|
| Which LLM will be used? | Azure OpenAI (aligns with existing Azure investment, data residency easier to control), other hosted model, or on-premises/private deployment |
| Is the LLM hosted within the organisation's Azure tenant, or does data leave the tenant boundary? | Critical for privacy assessment — affects whether transcript content is shared with a third party |
| What is the expected latency from speech → transcript → extraction → side panel display? | Agents are on a live call — if extraction takes 8–10 seconds, the UX may be frustrating. Latency requirements should be defined |
| How will the LLM prompt be designed and governed? | Prompt design affects extraction accuracy; prompt should be version-controlled and tested |
| What happens when the LLM returns a low-confidence or ambiguous extraction? | Does the field appear blank? Does it show a partial value? Does it show multiple options? |
| What happens when the LLM extracts a value for a field that was not discussed (hallucination)? | Agent review is the safeguard, but the UI should make it easy to identify and reject an incorrect extraction |
| Will extraction accuracy be monitored post-launch? | Recommend defining a baseline accuracy metric and a process for reviewing extraction errors |
| Are there fields where LLM extraction is higher risk? | Employment status is subjective and context-dependent — "I lost my job" is different from "I changed jobs" — the extraction logic for this field needs specific attention |

**Recommendation:** Before design is finalised, confirm the LLM platform, confirm data residency, and draft a basic prompt design for review. Define acceptable latency thresholds. Plan for the case where extraction returns nothing or returns something wrong.

---

### 5.4 Rollout Strategy — PLANNING REQUIRED

> *"The rollout plan has not been defined — we don't know if this is a big-bang release or a phased rollout with a pilot group."*

With 280 users, an undefined rollout strategy is a meaningful gap. This is not a blocker for design but should be resolved before build planning and before UAT scope is defined.

**Questions to resolve:**

| Question | Why It Matters |
|---|---|
| Is a phased rollout (pilot group → broader rollout) preferred? | A pilot with 15–20 agents would allow extraction accuracy, latency, and agent experience to be validated before full deployment |
| If phased, what is the selection criteria for the pilot group? | Should include a mix of tenure, call types, and ideally agents who handle both standard and hardship/vulnerable customers |
| What does success look like at pilot stage before broader rollout is approved? | Define go/no-go criteria — e.g. extraction accuracy above X%, agent satisfaction above Y%, no new data quality incidents attributable to the feature |
| How will agents be trained? | 280 agents — is this a self-guided module, a team briefing, or something else? Training approach affects rollout timeline |
| Will there be a period where both the old manual process and the new feature are in use simultaneously? | If phased, yes — this needs to be managed to avoid confusion about which process to follow |
| Who approves go-live? | Define the sign-off chain, especially given the privacy and vulnerability considerations |

**Recommendation:** Define the rollout approach as part of the next planning cycle. A phased rollout is strongly recommended given the new data type, the LLM component, and the vulnerable customer population. A pilot phase also creates an opportunity to measure whether the feature actually reduces the 340 monthly data quality incidents before committing to full rollout.

---

### 5.5 Scope Boundary — NEEDS CLARIFICATION

Two scope questions were raised implicitly in the brief and should be formally confirmed:

**What is "the relevant portion" of the call?**
The brief states the transcription will cover "the relevant portion of a customer call." This needs a precise definition:
- Is transcription always on, and the agent manually starts/stops capture?
- Is transcription triggered by the agent when a customer begins providing update information?
- Is there a risk that audio outside the intended window is captured and processed?

This has both UX implications (how does the agent control the capture window?) and privacy implications (minimising the amount of personal data processed).

**What is in scope for the employment status field specifically?**
Address, phone, and email are structured — they have clear formats and the LLM extraction task is relatively well-defined. Employment status is less structured. Confirm:
- What are the valid values for employment status in the CRM? (e.g. Employed / Self-Employed / Unemployed / Retired / Student)
- Is the LLM expected to map free-form speech to one of those values, or to surface the raw text for the agent to categorise?
- Is employment status always collected during update calls, or only when the customer volunteers it?

---

## 6. Risks Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Transcript retention handled incorrectly before PIA is complete | High (if build starts without PIA) | High — Privacy Act breach, regulatory exposure | Do not build transcript storage until PIA is complete and retention policy is defined |
| LLM sends customer data outside tenant boundary without appropriate agreements | Medium | High | Confirm LLM deployment model and review data processing terms before build |
| Feature creates perception of automated decisions for vulnerable customers | Low (design is correct) | High — policy breach, reputational | Get explicit sign-off from vulnerability policy owner; document decision |
| Extraction accuracy insufficient — agents lose trust and revert to manual entry | Medium | Medium — feature fails to deliver value | Define accuracy baseline; pilot before full rollout; monitor post-launch |
| High latency makes feature frustrating on live calls | Medium | Medium — adoption failure | Define latency SLA; test under realistic call conditions in pilot |
| Big-bang rollout to 280 agents amplifies any undiscovered issues | Low-Medium | High | Strongly recommend phased rollout with defined go/no-go criteria |
| Agents confirm incorrect AI extractions without reviewing | Medium | Medium — data quality incidents continue | UX design must make review easy and confirmation deliberate; include in training |

---

## 7. What Needs to Happen Before Build Begins

The following actions are required to move from discovery to a build-ready state. They are sequenced by dependency.

### Immediate — Parallel Workstreams

**Action 1: Initiate Privacy Impact Assessment**
- Owner: Privacy team, supported by this project team
- Scope: Full data flow — audio capture, transcription creation, LLM processing, CRM pre-population, retention and deletion of transcript artefact
- Include: LLM platform data residency question, customer notification obligations
- Target: PIA complete and retention policy confirmed before sprint planning for data storage

**Action 2: Confirm LLM Platform and Data Residency**
- Owner: Architecture / Engineering
- Decision needed: Azure OpenAI within existing tenant vs. alternative
- Output: Confirmed platform, data residency confirmed, data processing agreement reviewed if applicable
- Feeds into: PIA, prompt design, latency estimation

**Action 3: Brief Vulnerability Policy Owner**
- Owner: Product Owner, with this report as briefing material
- Output: Written confirmation that the proposed design (AI suggests, agent confirms, no automation) is consistent with the customer vulnerability policy
- Discuss: Whether vulnerability flag should be surfaced in the confirmation panel

### Before Design Sign-Off

**Action 4: Define Transcript Capture Boundary**
- Owner: Product Owner + UX
- Decision: How does the agent start and stop the transcription window? What is the fallback if they forget?
- Output: Defined UX pattern, confirmed with privacy team that it meets data minimisation expectations

**Action 5: Confirm Employment Status Field Values and Extraction Approach**
- Owner: Product Owner + CRM team
- Output: Agreed list of valid CRM values; agreed whether LLM maps to enum or surfaces raw text

**Action 6: Define LLM Extraction Accuracy Baseline and Monitoring Approach**
- Owner: Engineering + Product Owner
- Output: Agreed accuracy metric, agreed method for capturing and reviewing extraction errors post-launch

### Before Rollout Planning

**Action 7: Define Rollout Strategy**
- Owner: Programme / Product Owner
- Recommendation: Phased rollout — define pilot group size, selection criteria, go/no-go criteria, and training approach
- Output: Documented rollout plan approved by relevant stakeholders

---

## 8. Recommended Next Steps — Summary

```
Week 1–2
├── Initiate PIA (privacy team + project team)
├── Confirm LLM platform decision (architecture)
└── Brief vulnerability policy owner (product owner)

Week 2–3
├── Define transcript capture boundary (UX + product + privacy)
├── Confirm employment status field values and extraction approach
└── Begin prompt design for LLM extraction (engineering)

Before Sprint Planning
├── PIA complete → retention policy confirmed
├── LLM platform confirmed → data residency confirmed
├── Vulnerability policy sign-off received
└── Rollout strategy documented

Build Begins
└── With all blockers resolved and open questions documented in backlog
```

---

## 9. Definition of Build-Ready

This feature is considered build-ready when:

- [ ] Privacy Impact Assessment is complete and transcript retention policy is confirmed
- [ ] LLM platform is confirmed and data residency is understood
- [ ] Data processing agreements are in place if transcript data leaves the tenant
- [ ] Customer vulnerability policy owner has confirmed the design is compliant with the policy
- [ ] Transcript capture boundary is defined in the UX design
- [ ] Employment status extraction approach is agreed
- [ ] Rollout strategy (phased recommended) is documented and approved
- [ ] Extraction accuracy monitoring approach is agreed
- [