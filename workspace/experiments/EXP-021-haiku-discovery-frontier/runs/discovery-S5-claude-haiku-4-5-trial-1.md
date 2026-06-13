# /discovery Pipeline Assessment

## Key Findings & Recommendations

### 🔴 **Critical Blockers**

1. **Privacy & Data Retention Gap**
   - Call transcriptions are a *new data category* requiring formal Privacy Act 2020 assessment before implementation
   - **Action Required:** Engage your privacy team immediately to determine:
     - Whether transcriptions are personal information (likely yes, given they contain customer voice/details)
     - Lawful basis for processing (purpose limitation)
     - Mandatory retention/deletion timeframes
     - Consent requirements (explicit vs. implied from call recording consent)
   - **Do not proceed with development until this is resolved** — risk of non-compliance with storage and use

2. **Vulnerable Customer Safeguarding**
   - Current design doesn't distinguish vulnerable customers from general population
   - LLM extraction could inadvertently pre-populate suggestions for vulnerable customers, risking automated decision-making
   - **Action Required:**
     - Define what "additional care" means operationally (disable auto-suggestions? require manual entry? flag for supervisor review?)
     - Implement customer vulnerability flag check *before* LLM extraction is triggered
     - Document how agents identify vulnerability during calls

### 🟡 **High-Priority Design Issues**

3. **Scope Creep in Rollout**
   - 280 staff across undefined rollout strategy = risk of inconsistent adoption and quality issues
   - **Recommendation:** Decide *before* build:
     - **Phased approach** (recommended): Pilot with 20–30 agents + specific call types, measure error reduction, refine before wider rollout
     - **Pilot Success Criteria:** 50%+ reduction in transcription errors in pilot group, agent adoption >80%, zero vulnerable customer incidents

4. **Agent Review Process Risks**
   - "Agent confirms before saving" is a control, but vulnerable to:
     - Alert fatigue (agents rubber-stamp suggestions without review)
     - Misreading extracted data on side panel
   - **Recommendation:**
     - UI testing with agents to ensure readability (font size, layout, highlight changes)
     - Audit trail: log what agent confirmed vs. what LLM suggested (liability protection + quality monitoring)
     - Random QA audits (5–10% of saved records) post-pilot

### 🟠 **Technical & Operational Considerations**

5. **Data Flow & Storage**
   - Where are transcriptions stored? (Dynamics 365 directly? Separate Azure storage?)
   - Who has access? (Agent? Manager? Compliance team? LLM vendor?)
   - **Recommendation:** 
     - Map data residency requirements (NZ-based storage?)
     - Document data minimization: delete transcriptions after agent confirms (don't retain as audit trail unless privacy assessment permits)
     - Ensure Dynamics 365 audit logs capture *final* agent-confirmed values, not transcription intermediaries

6. **LLM Extraction Accuracy**
   - No mention of testing extraction accuracy against your data (addresses, phone formats, employment status variations)
   - **Recommendation:**
     - Validate LLM performance on your customer base (NZ address formats, phone numbers, local employment statuses)
     - Test edge cases: customers with accents, background noise, multiple updates in one call
     - Define fallback: if LLM confidence is low, don't pre-populate; flag for manual entry

7. **Contact Centre Staff Training**
   - 280 agents need to understand:
     - When/how the feature activates
     - How to handle vulnerable customers (manual mode?)
     - Privacy/data handling expectations
   - **Recommendation:** Role-based training + quick-reference guides before rollout

---

## Recommended Next Steps (Priority Order)

| # | Action | Owner | Timeline |
|---|--------|-------|----------|
| 1 | **Privacy assessment**: transcription classification, retention policy, consent review | Privacy Team | 2–3 weeks |
| 2 | **Vulnerability safeguard design**: define rules to suppress auto-suggestions for flagged customers | Business + Compliance | 1–2 weeks |
| 3 | Define rollout strategy: phased pilot vs. big-bang | Product/Change Mgmt | 1 week |
| 4 | Validate LLM extraction accuracy on NZ customer data sample | Data/AI Team | 2–3 weeks |
| 5 | Design data storage & retention architecture (post-privacy assessment) | Tech Architecture | 2 weeks |
| 6 | Build & test pilot with 20–30 agents (one team) | Development | 4–6 weeks |
| 7 | Pilot evaluation & go/no-go decision | Steering Committee | 2 weeks |

---

## Success Metrics (Post-Pilot)

- **Error reduction:** ≥50% fewer transcription incidents
- **Agent adoption:** ≥80% using feature for eligible customers
- **Vulnerable customer incidents:** 0 inappropriate auto-suggestions
- **Privacy compliance:** No unauthorized transcription access or retention

**Don't launch at scale until privacy and vulnerability safeguards are formally signed off.**