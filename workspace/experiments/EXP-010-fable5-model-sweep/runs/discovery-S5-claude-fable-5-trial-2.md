# Discovery Pipeline: AI-Assisted Customer Data Update (Dynamics 365)

---

## 1. Initiative Summary

**Problem:** Manual transcription of customer detail changes (address, phone, email, employment status) during calls causes ~340 data quality incidents/month.

**Proposed solution:** Real-time transcription (Azure AI Speech) → LLM extraction of field-value pairs → pre-populated side panel in Dynamics 365 → **agent reviews, edits, and confirms before any save**.

**Scale:** ~280 contact centre staff. Rollout approach undefined.

**Classification:** Human-in-the-loop AI assistance (suggestion engine). No autonomous decisions or writes. This classification must be preserved through design — it materially lowers the risk profile, but only if the confirmation step is genuine (see Risk R3).

---

## 2. Value Hypothesis & Baseline

| Metric | Baseline | Target (to be validated) |
|---|---|---|
| Data quality incidents from transcription errors | ~340/month | TBD — set during discovery |
| Average handle time for detail-update calls | **Unknown — capture before pilot** | TBD |
| Agent correction rate of AI suggestions | N/A | TBD — key extraction-quality signal |
| Agent confirmation-without-edit rate | N/A | Monitor for automation bias |

**Discovery action:** Establish the baseline measurement methodology *now*, before any pilot, or you cannot prove the feature works.

---

## 3. Key Unknowns (Blocking)

### U1 — Privacy status of transcriptions ⛔ **Hard blocker**
- Privacy team has not assessed transcription under the **Privacy Act 2020**. Spoiler: a text transcript of an identified customer's call will almost certainly be personal information — but the formal assessment, retention rule, and handling controls must exist before build.
- A **Privacy Impact Assessment (PIA)** is required covering at minimum:
  - **IPP 1/3** — purpose of collection and what customers are told. Does the existing call-recording disclosure ("this call may be recorded") cover transcription *and LLM processing*? Likely needs updating.
  - **IPP 5** — security of transcripts in transit and at rest.
  - **IPP 9** — retention: is the transcript ephemeral (discarded after extraction) or persisted? **Strong recommendation: design for ephemeral transcripts** — extract, present, discard. This dramatically simplifies the privacy position.
  - **IPP 11/12** — disclosure and cross-border: where do Azure AI Speech and the LLM endpoint physically process data? Data residency must be confirmed (Azure region, Azure OpenAI data handling terms, no training on customer data).

### U2 — LLM service specifics
- Which LLM, hosted where, under what data processing terms? Prompt/response logging? Abuse monitoring retention (Azure OpenAI retains data up to 30 days by default unless exempted)?

### U3 — Rollout strategy
- Undefined. For a 280-seat deployment of a novel AI feature, **a phased rollout with a pilot group is strongly recommended** — big-bang removes your ability to measure extraction quality and agent behaviour safely. Treat pilot design as a discovery deliverable.

### U4 — Vulnerable customer interaction
- Requirement stated: "no automated decisions for vulnerable customers." Open questions:
  - Does the feature *operate identically* for flagged customers, or is it disabled/modified?
  - Does the transcript or LLM extraction ever touch the vulnerability flag itself? (It must not infer, set, or suggest vulnerability/hardship status.)
  - Could the LLM incidentally extract hardship-related statements ("I lost my job") into the *employment status* field? This is a genuine edge case: employment status is in scope, and hardship disclosures often contain it. Needs explicit design treatment.

---

## 4. Risk Register

| ID | Risk | Severity | Mitigation direction |
|---|---|---|---|
| R1 | Transcript is personal info with no assessed retention/handling basis | **High** | PIA before build; prefer ephemeral transcripts |
| R2 | LLM extracts hardship/health/vulnerability content into fields | High | Constrain extraction to whitelisted fields; filter; test with vulnerable-customer call scripts |
| R3 | **Automation bias** — agents rubber-stamp suggestions, errors shift from typos to confirmed wrong AI values | High | UX must force genuine review (e.g., show source snippet, highlight low-confidence values); monitor confirm-without-edit rate |
| R4 | Transcription accuracy degrades for accents, names, NZ place names, te reo Māori words in addresses | Medium-High | Accuracy testing across representative speech; Azure custom speech models if needed |
| R5 | Disclosure to customers inadequate (consent/notice gap) | High | Update call disclosure scripts/IVR message; legal sign-off |
| R6 | Data residency / third-party processing breach | Medium | Confirm Azure region, opt out of abuse-monitoring retention where eligible, contractual review |
| R7 | New error mode: AI mis-extracts field pairing (right value, wrong field) | Medium | Field-level confidence scores; mandatory edit-mode for low confidence |
| R8 | Latency: extraction not ready before agent needs it → feature ignored or trusted blindly later | Medium | Real-time performance targets in NFRs; pilot measurement |
| R9 | Big-bang rollout amplifies any of the above to 280 agents at once | Medium | Phased pilot (see §6) |

---

## 5. Scope Boundaries (Proposed — confirm with stakeholders)

**In scope:**
- Real-time transcription of the call segment, LLM extraction of the four field types, side-panel review UX, confirm/save flow, audit logging of suggestion-vs-saved values.

**Out of scope (explicitly):**
- Automatic field saves of any kind.
- Inferring, setting, or suggesting vulnerability/hardship flags.
- Sentiment analysis, QA scoring, agent performance monitoring from transcripts (scope-creep magnet — name it now).
- Retention of transcripts beyond the live session (recommended position, pending PIA).

---

## 6. Recommended Discovery Backlog (sequenced)

1. **PIA kickoff with privacy team** — transcription classification, retention rule, disclosure wording. *Gates everything.*
2. **Data flow architecture spike** — exact path: audio → Azure Speech → LLM → Dynamics panel; identify every point where transcript text persists or leaves NZ-controlled processing.
3. **Vulnerable customer design workshop** — with the owners of the vulnerability policy; define behaviour for flagged customers and the employment-status/hardship edge case.
4. **Baseline measurement** — instrument current incident categorisation; capture handle-time for update calls.
5. **Extraction accuracy proof-of-concept** — offline, on recorded calls (subject to privacy approval), measuring field-level precision/recall before building UI.
6. **Agent UX research** — 5–8 agents; review-panel design that resists rubber-stamping.
7. **Pilot design** — recommend: 15–25 agents, 4–6 weeks, success criteria defined in advance (incident reduction, correction rate, latency, agent satisfaction), with kill/iterate/scale decision gate.

---

## 7. Stakeholders to Engage

| Role | Why |
|---|---|
| Privacy Officer / privacy team | PIA, retention, disclosure (blocking) |
| Legal | Privacy Act 2020, call recording policy amendment |
| Customer vulnerability policy owner | R2, U4 |
| Contact centre operations lead | Rollout, agent training, baseline data |
| Frontline agents (sample) | UX research, pilot |
| Security architecture | Azure data flows, residency |
| Dynamics 365 platform owner | Integration, audit logging |

---

## 8. Discovery Exit Criteria

Discovery is complete when:
- [ ] PIA approved, transcript retention rule defined
- [ ] Customer disclosure wording approved
- [ ] Vulnerable-customer behaviour specified and signed off by policy owner
- [ ] Extraction accuracy PoC meets threshold (define threshold first)
- [ ] Rollout strategy decided (recommendation: phased pilot)
- [ ] Baseline metrics instrumented
- [ ] Success criteria and kill criteria for pilot agreed

**Biggest single recommendation:** Do not write production code until U1 (privacy assessment) is resolved — it determines the architecture (ephemeral vs. persisted transcripts), and retrofitting that decision is expensive.