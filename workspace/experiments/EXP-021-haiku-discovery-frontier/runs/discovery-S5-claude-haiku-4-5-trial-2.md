# /discovery Pipeline Output: Call Transcription & AI Extraction Feature

## 1. CRITICAL BLOCKERS (Must Resolve Before Proceeding)

### Privacy & Legal Framework
- **Action Required**: Halt development pending privacy team assessment
  - Does transcription constitute personal information under Privacy Act 2020? (Almost certainly yes – it's a verbatim record of customer speech containing personal details)
  - What retention period is lawful? (Current call recording policy may not apply; transcriptions are a different data type)
  - Do you have a lawful basis for processing transcriptions? (Purpose creep risk if original recording consent doesn't cover AI extraction)
  - Are customers informed that their calls will be transcribed AND processed by AI?
  - **Recommendation**: Brief privacy team before any technical implementation. Budget 4-6 weeks for assessment.

### Vulnerable Customer Safeguard
- **Critical Policy Conflict**: Feature must not automate decisions for vulnerable customers, but you haven't defined what "not automate" means operationally
  - **Questions to resolve**:
    - Should vulnerable customers' calls bypass transcription entirely?
    - Or should vulnerable calls be transcribed but with agent **mandatory manual entry** (no AI suggestions)?
    - Who flags vulnerability – agent, system, or both?
    - What prevents an agent from confirming AI suggestions for vulnerable customers without genuine review?
  - **Recommendation**: Co-design this with your vulnerability team and test with real agents before pilot. This is a compliance and harm-prevention issue, not just a UX one.

---

## 2. RISKS & MITIGATION REQUIREMENTS

| Risk Category | Specific Risk | Mitigation Strategy |
|---|---|---|
| **Data Security** | Transcriptions stored in new locations (Speech service, LLM processing pipeline, CRM side panel state) | Inventory all data flows; implement encryption in transit/at rest; audit access logs; ensure no transcription caching in LLM. Clarify who can access transcriptions and for how long. |
| **AI Accuracy** | LLM extraction errors become CRM "suggestions" but may anchor agent bias ("the AI said it, so it must be right") | Establish accuracy baseline before pilot; measure agent override rates; A/B test UI (e.g., highlighting confidence scores); monitor post-save data quality. |
| **Consent** | Existing call recording consent ≠ AI transcription/extraction consent | Obtain explicit opt-in for the new transcription feature; consider consent revocation mechanism. |
| **Operational** | 280 staff, unclear rollout strategy = high variance in adoption and error reporting | Define rollout first (see Section 3). Pilot group should be diverse: experienced agents, newer staff, and agents handling vulnerable customers. |
| **Audit & Accountability** | If an extraction error leads to a customer complaint, can you trace the decision path? | Log: transcription timestamps, extraction confidence, agent edits, confirmation. Design audit trail now. |

---

## 3. ROLLOUT STRATEGY – DECISION REQUIRED

### Current State
You have **no rollout plan**. This is a material gap because:
- A 280-person big-bang release amplifies any privacy/vulnerable customer safeguard gaps
- A phased pilot allows you to iterate on privacy controls and test vulnerable customer workflows

### Recommended Approach: Phased Pilot

**Phase 0 – Proof of Concept (4-6 weeks)**
- Scope: 10–15 volunteer agents from **one team**, handling **non-vulnerable customers only**
- Goals:
  - Validate transcription + LLM accuracy
  - Test vulnerable customer safeguard in practice
  - Measure agent time savings
  - Collect privacy/audit requirements
- Success criteria: <5% post-save data quality errors; >80% agent satisfaction; zero vulnerable customer escalations

**Phase 1 – Controlled Rollout (8–12 weeks)**
- Expand to 50–80 agents across multiple teams
- Include 1–2 teams that regularly handle vulnerable customers (test safeguard at scale)
- Refine UI, training, and exception handling

**Phase 2 – Full Rollout (ongoing)**
- Roll out to all 280 staff with refreshed training and post-go-live support

---

## 4. KEY OPEN QUESTIONS FOR STAKEHOLDERS

### Privacy Team
1. Is call transcription lawful under our existing call recording consent and Privacy Act 2020?
2. What's the minimum retention period for transcriptions? (Separate from call recordings)
3. Do we need customer opt-in or is opt-out sufficient?
4. Who can access transcriptions and under what circumstances?

### Vulnerability & Safeguarding Team
5. Should vulnerable customer calls bypass AI extraction entirely, or should they have a different workflow?
6. How do agents currently identify vulnerable customers during calls?
7. What does "additional care" mean operationally for this feature?

### Operations & Contact Centre Leadership
8. What's the priority: reducing transcription errors (data quality) or reducing agent effort (time)?
9. Which team(s) should pilot this?
10. Do agents have the time/training to review AI suggestions during calls, or is post-call review expected?

### Technology
11. Does Azure AI Speech meet your data residency requirements (Privacy Act, NZ data localization)?
12. Which LLM will extract field-value pairs, and what's your data governance for that?
13. How will you handle transcription failures (poor audio, accents, background noise)?

---

## 5. DISCOVERY OUTPUTS & NEXT STEPS

### Deliverables Required Before Technical Build
- [ ] Privacy impact assessment (transcription data type, retention, consent)
- [ ] Vulnerable customer safeguard workflow design (documented process + UI mocks)
- [ ] Rollout strategy (pilot scope, success metrics, timeline)
- [ ] Audit trail requirements (what must be logged, for how long, who accesses)
- [ ] Agent training plan (how to review AI suggestions; when to override; vulnerability flags)

### Recommended Next Workshop
**Facilitation Meeting** (2 hours)
- Attendees: Privacy lead, vulnerability/safeguarding lead, contact centre operations manager, product owner, CRM architect
- Agenda:
  1. Privacy assessment timeline and blockers
  2. Vulnerable customer safeguard workflow (decision)
  3. Rollout strategy sign-off
  4. Define pilot team and success metrics

### Timeline Estimate
- Discovery → Decision: **2 weeks**
- Privacy assessment: **4–6 weeks** (parallel to design)
- Pilot build & test: **6–8 weeks**
- **Total to pilot launch: ~12 weeks** (assuming no major blockers)

---

## Summary
This feature has **high potential value** (340 errors/month is significant), but **three critical gates** must be cleared: privacy law compliance, vulnerable customer safeguards, and a credible rollout plan. Do not begin development until the privacy team confirms lawfulness and the vulnerability team co-designs the safeguard workflow. A phased pilot is strongly recommended.