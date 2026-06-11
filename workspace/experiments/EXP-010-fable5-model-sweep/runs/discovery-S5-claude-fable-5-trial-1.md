# Discovery Brief — AI-Assisted Customer Detail Updates in Dynamics 365

**Status:** Discovery — multiple critical unknowns identified
**Risk profile:** Elevated (AI processing of personal information, vulnerable customers, new data type, unassessed privacy position)

---

## 1. Problem Statement

Contact centre agents manually transcribe customer-provided details (address, phone, email, employment status) during live calls. This produces **~340 data quality incidents per month** attributable to transcription errors.

**Quantified pain:** ~4,080 incidents/year. *Open question: what is the cost per incident (rework, downstream failures, customer harm, complaints)? This baseline is needed to define success and justify investment.*

---

## 2. Proposed Solution (as described)

1. **Azure AI Speech** transcribes the relevant portion of the call in real time.
2. An **LLM extracts field-value pairs** (address, phone, email, employment status).
3. Extracted values **pre-populate a side panel in Dynamics 365**.
4. **Agent reviews, edits, and confirms** before any save — AI is suggestive, never autonomous.

**Key design strength:** Human-in-the-loop is explicit and non-negotiable. No automated decision-making. This materially reduces (but does not eliminate) regulatory and ethical risk.

**Scale:** ~280 contact centre staff.

---

## 3. What We Know

| Area | Position |
|---|---|
| Architecture | Azure AI Speech + LLM extraction + D365 side panel |
| Human oversight | Agent confirms every save; AI is advisory only |
| Call recording | Covered by existing recording policy |
| Vulnerable customers | Existing policy requires flagging + additional care; feature must not automate decisions for these customers |
| User base | ~280 agents |
| Baseline metric | 340 incidents/month from manual transcription |

---

## 4. Critical Unknowns (blockers and gaps)

### 4.1 Privacy — **BLOCKER**
- **The transcription is a new data type** never handled before. The privacy team has not assessed:
  - Whether the transcript constitutes personal information under the **Privacy Act 2020** (it almost certainly will — it is a text record of an identifiable individual's statements, likely including the very PII being extracted).
  - **Retention period** — the existing call recording policy does not automatically extend to transcripts. IPP 9 (retention no longer than necessary) requires a defined purpose and lifecycle.
- Additional unassessed questions:
  - **Collection notice (IPP 3):** Does the existing call-recording disclosure ("calls may be recorded...") cover AI transcription and LLM processing? Likely needs updating.
  - **Transcript scope:** "Relevant portion" only, or full call? Is the transcript persisted at all, or processed transiently and discarded post-confirmation? *Transient processing with no retention is the lowest-risk design and should be evaluated first.*
  - **LLM data handling:** Which LLM? Where is it hosted (data residency)? Is customer data used for model training? Are prompts/outputs logged by the provider?
  - **Health/financial hardship disclosures:** Vulnerable customers may disclose sensitive information mid-call (health, hardship). If the transcript captures it, the privacy and ethical stakes rise sharply.

**Required action:** A **Privacy Impact Assessment (PIA)** must be initiated now — it is on the critical path and will shape architecture (retention, transcript scope, LLM choice).

### 4.2 Vulnerable Customers — needs design definition
The requirement "must not in any way automate decisions for vulnerable customers" is stated but not operationalised:
- Does the feature **disable entirely** for flagged customers, or operate identically (since it's advisory for everyone)?
- How does the system know a customer is vulnerable — pre-existing flag in CRM, or only identified mid-call?
- Could AI pre-population create **automation bias** — agents rubber-stamping suggestions — which is a higher harm risk for vulnerable customers? Mitigation may include enhanced confirmation UX or feature suppression for flagged records.
- Should hardship/vulnerability statements be **excluded from transcription scope** by design?

### 4.3 Rollout — undefined
- Big-bang vs. phased is undecided. **Recommendation: phased with pilot.** Rationale:
  - New AI capability with unvalidated extraction accuracy in production conditions (accents, line quality, te reo Māori names and place names, address formats).
  - Pilot enables measurement of extraction accuracy, agent override rates, handle-time impact, and incident-rate movement before scaling to 280 staff.
- No defined pilot group, success gates, or rollback plan.

### 4.4 Other gaps
- **Accuracy targets:** What extraction accuracy is acceptable? What is the failure mode when extraction is wrong and the agent doesn't catch it (the original problem in new clothing)?
- **Te reo Māori / accent performance:** Azure AI Speech accuracy on NZ accents, Māori names, and Māori place-name addresses must be tested — a known failure class with material equity implications.
- **Audit trail:** Is the AI-suggested value vs. agent-confirmed value logged? (Needed for accuracy measurement and incident investigation.)
- **Agent consent/consultation:** 280 staff having their calls transcribed in a new way — employment/union consultation may be required.
- **AI governance:** Does the organisation have an AI use policy / does this require internal AI risk review or alignment with the NZ Algorithm Charter (if public sector) or FMA/RBNZ guidance (if financial services — implied by "financial hardship")?
- **Latency:** Real-time extraction must keep pace with the call or agents will revert to typing.

---

## 5. Risk Register (top items)

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Transcript retained without lawful basis / defined retention → Privacy Act breach | High (currently unassessed) | High | PIA before build; prefer transient processing |
| R2 | LLM provider processes/stores PII offshore or for training | Medium | High | Contractual + technical controls; Azure-hosted model with data residency commitments |
| R3 | Automation bias — agents confirm wrong extractions | Medium | Medium–High | UX design (diff highlighting), accuracy monitoring, pilot measurement |
| R4 | Poor accuracy on NZ accents / Māori names → systematic errors for specific customer groups | Medium | High (equity + reputational) | Targeted accuracy testing pre-pilot |
| R5 | Vulnerable customer requirement undefined → policy breach | Medium | High | Design workshop with vulnerability policy owners |
| R6 | Big-bang rollout amplifies any defect across 280 agents | Medium | Medium | Phased rollout with gated pilot |
| R7 | Collection notice doesn't cover AI processing | High | Medium | Update IVR/disclosure scripts as part of PIA actions |

---

## 6. Stakeholders to Engage

- **Privacy team** (PIA — critical path)
- **Customer vulnerability policy owner**
- **Contact centre operations + agent representatives** (workflow, consultation, pilot group)
- **Data quality / incident owners** (baseline + success measurement)
- **Security/architecture** (LLM selection, data residency, logging)
- **Legal/compliance** (sector-specific obligations — financial hardship handling suggests CCCFA/financial services context)
- **AI governance function** (if one exists)

---

## 7. Success Measures (proposed, to be validated)

- Reduction in transcription-attributable data quality incidents (baseline: 340/month; target TBD)
- Extraction accuracy rate (field-level, measured via agent edit rate)
- Agent override/edit rate (proxy for trust + accuracy)
- Average handle time — should not increase
- Zero privacy incidents attributable to the feature
- Vulnerable customer handling compliance maintained at 100%

---

## 8. Recommended Next Steps (sequenced)

1. **Initiate PIA immediately** — it determines transcript retention, scope, and LLM constraints. Architecture decisions should not be locked before this.
2. **Design decision: transient vs. persisted transcripts.** Strong recommendation to evaluate transient-only processing first.
3. **Workshop the vulnerable customer behaviour** with policy owners — define explicit feature behaviour for flagged customers.
4. **Select and contract-review the LLM** (data residency, no-training clauses, logging) — prefer Azure OpenAI in-region for alignment with existing Azure AI Speech footprint.
5. **Accuracy spike:** test Azure AI Speech + extraction against representative NZ call audio, including Māori names/addresses and diverse accents.
6. **Define the rollout:** recommend a pilot of 15–25 agents with defined success gates (accuracy ≥ target, no privacy issues, incident-rate trend) before phased expansion to 280.
7. **Update collection notices/scripts** per PIA outcomes.
8. **Define audit logging** of suggested vs. confirmed values to enable ongoing accuracy measurement.

---

**Discovery verdict:** The concept is sound and the human-in-the-loop design is the right foundation. However, **the initiative is not ready to proceed to build**: the privacy assessment of the transcript data type is a hard blocker, the vulnerable customer requirement is unoperationalised, and the rollout strategy is undefined. Items 1–3 above are the critical path.