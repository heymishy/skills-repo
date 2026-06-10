# /discovery Pipeline Report
## AI-Assisted Customer Data Update — Dynamics 365 CRM Feature

---

## 1. EXECUTIVE SUMMARY

This discovery surfaces what is known, what is unknown, and what needs resolution before this feature can be safely designed, built, and deployed. The core concept is sound and the problem is well-defined. However, there are **four areas that require resolution before development begins**: privacy compliance for call transcriptions, vulnerable customer safeguards, rollout strategy, and LLM data handling boundaries. None of these are blockers to discovery or early design work, but they are blockers to committing a development timeline.

---

## 2. PROBLEM STATEMENT

### What We Know
- Contact centre agents manually type customer-provided updates to four fields: **address, phone number, email, and employment status**
- This process generates approximately **340 data quality incidents per month** attributable to transcription error
- The fix is not to remove the agent — the agent always reviews and confirms before saving
- The intended stack is: **Azure AI Speech** (transcription) → **LLM** (field extraction) → **Dynamics 365 side panel** (agent review and confirm)
- Approximately **280 agents** will use this feature

### What This Feature Is Not
It is worth being explicit about scope boundaries surfaced during discovery:

| This feature IS | This feature IS NOT |
|---|---|
| A transcription-assisted data entry aid | An automated customer record updater |
| A suggestion layer for agent review | A decision-making system |
| Scoped to four specific fields | A general-purpose call summariser |
| Agent-confirmed before any save | Active for any action during a call without agent review |

---

## 3. REQUIREMENTS ANALYSIS

### 3.1 Confirmed Functional Requirements

| # | Requirement | Source | Status |
|---|---|---|---|
| FR-01 | Real-time transcription of the relevant call segment using Azure AI Speech | Brief | Confirmed |
| FR-02 | LLM extracts field-value pairs: address, phone, email, employment status | Brief | Confirmed |
| FR-03 | Extracted values pre-populate a side panel within Dynamics 365 | Brief | Confirmed |
| FR-04 | Agent can edit any extracted value before confirming | Brief | Confirmed |
| FR-05 | Agent must explicitly confirm before any record is saved | Brief | Confirmed — this is a hard requirement, not a preference |
| FR-06 | Feature must not automate any decisions for flagged vulnerable customers | Brief | Confirmed — see Section 5.2 |

### 3.2 Confirmed Non-Functional Requirements

| # | Requirement | Notes |
|---|---|---|
| NFR-01 | Feature used by ~280 concurrent contact centre staff | Informs load and licensing considerations |
| NFR-02 | Transcription latency must support real-time or near-real-time use | "Real-time" needs a latency SLA to be defined — see open questions |
| NFR-03 | Existing call recording retention policy applies to audio | Transcription retention is **not yet defined** — see Section 5.1 |
| NFR-04 | LLM extraction is a suggestion only — confidence thresholds or ambiguity handling TBD | Needs design decision |

---

## 4. ASSUMPTIONS MADE IN THIS DISCOVERY

The following assumptions are being made explicitly. Each should be validated with the relevant owner before design is finalised.

| # | Assumption | Owner to Validate |
|---|---|---|
| A-01 | Azure AI Speech is already licensed or procurement is approved | Technology / Procurement |
| A-02 | The LLM used for extraction will be an Azure-hosted model (e.g. Azure OpenAI), keeping data within the existing cloud boundary | Architecture / Security |
| A-03 | Dynamics 365 extensibility (custom side panel via PCF control or model-driven app customisation) is technically feasible within the current tenant configuration | CRM Platform team |
| A-04 | "Relevant portion" of the call means the agent will trigger transcription manually — not that the entire call is always transcribed | UX / Product — **needs decision** |
| A-05 | Employment status is a structured field with defined values (e.g. employed, self-employed, unemployed, retired) — not a free-text field | CRM / Data team |
| A-06 | The 340 monthly incidents figure is measured and attributable, not estimated | Data Quality / Operations |
| A-07 | Agents currently have a defined process for flagging vulnerable customers in Dynamics before or during a call | Operations / CRM team |

---

## 5. OPEN ISSUES — MUST BE RESOLVED BEFORE DEVELOPMENT

These are not risks to be monitored. They are **gaps that will produce incorrect design decisions if left unresolved**.

---

### 5.1 🔴 PRIVACY — Transcription as a New Personal Information Type

**What we know:** Call audio is recorded and retained under an existing policy. The transcription is a text rendering of the same content and is a new data type not previously handled.

**What we do not know:**
- Whether the Privacy Act 2020 treats the transcription as personal information (it almost certainly does, but this requires a formal assessment)
- Whether the transcription must be subject to the same retention schedule as the audio, a shorter schedule, or whether it may not be retained at all
- Whether customers are currently notified at the start of calls that their calls may be transcribed (notification of recording is not the same as notification of transcription and AI processing)
- Whether a Privacy Impact Assessment (PIA) is required before go-live
- Whether the LLM processing of transcription content constitutes automated processing of personal information with any notification or consent obligations

**Why this matters to the build:**
- If transcriptions cannot be retained, the architecture must treat them as ephemeral — extracted field values only are saved, the transcription text is discarded after the session
- If transcriptions are retained, a storage location, access control model, and retention/deletion pipeline must be built
- Customer-facing privacy notices may need updating before launch

**Action required:** Privacy team to conduct formal assessment. Development cannot finalise the data architecture until retention posture is known. A binary outcome is needed: **retain with defined schedule** or **ephemeral — discard after session**.

---

### 5.2 🔴 VULNERABLE CUSTOMERS — Feature Behaviour Must Be Explicitly Designed

**What we know:** A customer vulnerability policy exists. Agents are required to flag vulnerable customers and handle them with additional care. The brief states the transcription feature must not automate decisions for vulnerable customers.

**What we do not know:**
- How vulnerable customer status is currently flagged in Dynamics (field, flag, indicator type)
- Whether the requirement means the feature should be **disabled entirely** for flagged customers, or whether it means the feature can still assist but with additional friction or a stronger confirmation step
- Whether the LLM must not process transcription content for vulnerable customers at all, or whether extraction can occur but with a heightened review requirement
- Whether "vulnerable customer" is determined before the call starts (flag already on record) or can be identified during the call (agent flags mid-call)

**Why this matters to the build:**
The feature must have a defined state machine for vulnerable customers. The two most likely design options have meaningfully different implementation complexity:

| Option | Description | Implication |
|---|---|---|
| **Option A — Full disable** | When vulnerable flag is active, transcription and extraction do not activate | Simpler, cleaner, lower risk |
| **Option B — Heightened review** | Feature activates but with additional confirmation steps and no extraction of sensitive indicators | More complex, requires policy alignment |

**Action required:** Operations and Customer Vulnerability policy owner to define the required behaviour. Without this, the feature cannot be designed for approximately the most sensitive segment of the customer base.

> ⚠️ **Discovery note:** There is a secondary risk here. The LLM processes call transcription content. If a customer discloses vulnerability, hardship, or sensitive personal circumstances during the call — even on a non-flagged account — that content will be present in the transcription. The LLM prompt design must explicitly constrain the model to extract only the four target fields and must not surface, flag, or act on any other content in the transcript. This is a prompt design and model governance requirement, not just a policy question.

---

### 5.3 🟡 ROLLOUT STRATEGY — Unknown

**What we know:** ~280 agents will use the feature. No rollout plan exists.

**What we do not know:**
- Whether this is a big-bang release or a phased pilot
- Whether a pilot group has been identified
- What success metrics will be used to gate progression from pilot to full rollout
- Whether training or change management resources have been scoped

**Why this matters to the build:**
- A phased rollout requires feature flagging or tenant-level toggle capability to be built — this is not complex but must be intentional
- A pilot requires a feedback mechanism — how will agents report errors in extraction, missed values, or incorrect field mappings? This may be as simple as a "flag an issue" button in the side panel, but it needs to be designed
- Success metrics affect what telemetry must be instrumented from day one (e.g. extraction acceptance rate, agent edit rate, incidents per agent per week)

**Action required:** Product owner and operations lead to define rollout approach and agree pilot scope. Recommend phased rollout given the scale and the privacy/vulnerability considerations still being resolved.

---

### 5.4 🟡 LLM SCOPE AND PROMPT GOVERNANCE

**What we know:** An LLM will process transcription content to extract field-value pairs.

**What we do not know:**
- Which LLM / which deployment (Azure OpenAI GPT-4o, GPT-4, other)
- Whether the LLM deployment is within the organisation's Azure tenant (assumed yes — see A-02)
- Whether prompt design has been started or whether this is greenfield
- How the system will handle ambiguity (e.g. customer states two addresses, or contradicts themselves)
- Whether confidence scoring will be surfaced to the agent or suppressed
- What happens when the LLM cannot extract a value — does the field remain blank, show a low-confidence indicator, or show the raw transcript segment?

**Action required:** Architecture decision on LLM deployment to be confirmed and documented. Prompt design must be treated as a governed artefact — reviewed, version-controlled, and tested — not an ad hoc string. Recommend a defined prompt review process involving at minimum the product owner and a privacy/legal reviewer.

---

## 6. TECHNICAL DISCOVERY NOTES

These are observations for the development and architecture team. They are not blockers but should inform the technical design.

### 6.1 Transcription Trigger — A Critical UX Decision

The brief references transcribing "the relevant portion" of the call. This implies the entire call is not transcribed by default. Two patterns are possible:

- **Agent-triggered:** Agent clicks a "capture update" button when the customer begins providing changed details. Transcription runs for that segment only.
- **Always-on with segment detection:** Full call is transcribed; the LLM identifies segments containing update-relevant content.

Agent-triggered is strongly recommended. It minimises the volume of personal information processed, reduces LLM prompt context size, and is more consistent with a minimal data processing posture that will be easier to defend in a privacy assessment.

### 6.2 Dynamics 365 Side Panel Implementation

A Dynamics 365 model-driven app side panel (using the app side pane API or a PCF component) is the appropriate pattern. Key considerations:

- The panel must be non-blocking — the agent must be able to continue working in the main form while the panel populates
- Each extracted field should show: extracted value, an editable input, and ideally a short excerpt of the transcript segment that produced it (supports agent validation)
- The confirm action should write all confirmed fields in a single save operation — not field by field

### 6.3 Ephemeral vs. Retained Transcription — Architecture Branches

This is the single biggest architectural branch point, pending privacy resolution:

```
IF transcription is ephemeral:
  → Transcription text lives in session memory only
  → LLM call is made server-side; only extracted field-value pairs are persisted
  → No transcription storage layer required
  → Simpler architecture, lower privacy surface

IF transcription is retained:
  → Dedicated storage required (Azure Blob or Dataverse attachment with access control)
  → Retention/deletion pipeline required
  → Access logging required
  → Subject access request (SAR) process must include transcription records
```

The team should not design storage architecture until this is resolved.

### 6.4 Error and Ambiguity Handling — Needs Design

The LLM will sometimes extract incorrectly, partially, or not at all. The side panel must handle these states explicitly:

| State | Example | Recommended UI behaviour |
|---|---|---|
| Clean extraction | "My new address is 14 Smith Street" | Pre-populate field, highlight for review |
| Ambiguous extraction | Customer states two phone numbers | Show both, require agent to select |
| No extraction possible | Audio unclear, topic not discussed | Field remains blank, no false suggestion |
| Low confidence | Partial address captured | Show extracted value with visual indicator that agent should verify carefully |

---

## 7. SUCCESS METRICS — PROPOSED

These should be agreed with the product owner and instrumented from day one of any pilot. They directly answer whether the feature is working and safe.

| Metric | What it measures | Target direction |
|---|---|---|
| Data quality incidents per month | Primary problem metric — is the 340/month figure reducing? | Decrease |
| Extraction acceptance rate | How often does the agent accept the LLM suggestion without editing? | Directional — very high may indicate agents are rubber-stamping; very low may indicate poor extraction quality |
| Agent edit rate per field | Which fields are most frequently corrected by agents? | Informs model improvement priorities |
| Time to confirm update | Is the feature saving agent time or adding friction? | Decrease vs. baseline |
| Vulnerable customer incidents | Are there any incidents related to the feature and vulnerable customer calls? | Zero tolerance for increase |
| Agent-reported extraction errors | Errors flagged via in-panel feedback mechanism | Decrease over time as model improves |

---

## 8. DISCOVERY SUMMARY — DECISIONS REQUIRED

| # | Decision | Owner | Urgency |
|---|---|---|---|
| D-01 | Privacy assessment of call transcription as personal information under Privacy Act 2020 — retain or ephemeral? | Privacy team | 🔴 Blocks architecture |
| D-02 | Vulnerable customer feature behaviour — full disable or heightened review? | Operations / Vulnerability policy owner | 🔴 Blocks feature design |
| D-03 | LLM deployment — confirm Azure-hosted model within tenant boundary | Architecture | 🔴 Blocks security review |
| D-04 | Rollout approach — big-bang or phased pilot? | Product owner / Operations | 🟡 Blocks delivery planning |
| D-05 | Transcription trigger model — agent-triggered segment or always-on? | Product owner / UX | 🟡 Influences architecture and privacy posture |
| D-06 | Customer notification — does existing call recording notice cover AI transcription and LLM processing? | Privacy / Legal | 🟡 May require notice update before go-live |
| D-07 | Employment status field values — confirm structured list | CRM / Data team | 🟢 Low urgency, needed before LLM prompt design |

---

## 9. RECOMMENDED NEXT STEPS

1. **Privacy team** to begin assessment of call transcription under Privacy Act 2020 — specifically retention, notification, and whether a PIA is required. Target: decision on D-01 within two weeks.

2. **Operations and vulnerability policy owner** to convene and define the required feature behaviour for vulnerable customers (D-02). This is a policy decision, not a technology decision.

3. **Architecture** to confirm LLM deployment model and document the data flow from call audio through to Dynamics field write — including where transcription text exists at each stage and for how long. This document will be an input to the privacy assessment.

4. **Product owner** to define rollout approach and, if phased, identify pilot group and success criteria for progression.

5. **Discovery does not need to wait** for all of the above. UX design of the side panel interaction, Dynamics platform feasibility spike, and Azure AI Speech integration proof of concept can proceed in parallel.

---

*Discovery conducted against brief provided. All open items and assumptions are recorded above. This document should be reviewed and signed off by the product owner, privacy team representative, and technical lead before development scope is committed.*