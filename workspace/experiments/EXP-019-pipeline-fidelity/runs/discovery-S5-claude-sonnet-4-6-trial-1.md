# Discovery Output: AI-Assisted Customer Data Update — Dynamics 365 CRM

---

## 1. Problem Statement

Contact centre agents manually transcribe customer-provided updates to address, phone number, email, and employment status during live calls. This produces approximately **340 data quality incidents per month** attributable to transcription error. The proposed feature uses Azure AI Speech for real-time call transcription and an LLM to extract field-value pairs, pre-populating a Dynamics 365 side panel for agent review. The agent always confirms explicitly before any data is saved — the AI output is a suggestion only.

---

## 2. Scope

### In Scope
- Real-time transcription of the relevant call portion via Azure AI Speech
- LLM extraction of field-value pairs from the transcription
- Pre-population of Dynamics 365 update fields: address, phone number, email, employment status
- Agent review-and-confirm side panel within Dynamics 365
- Approximately 280 contact centre agents

### Explicitly Out of Scope (Per Requirements)
- Automated saving of extracted data without agent confirmation
- Automated decisions of any kind for vulnerable customers

### Scope Unknowns — Need Resolution
- Whether the live transcript itself is displayed to the agent, or only the extracted field values
- Whether the feature applies to all call types or is scoped to update-related calls only
- Whether inbound and outbound calls are both in scope
- Multi-language or dialect support requirements
- Whether the feature applies to all 280 agents uniformly or differs by team/role

---

## 3. What We Know

| # | Confirmed Fact |
|---|---|
| K1 | ~340 data quality incidents/month from manual transcription errors — this is the baseline |
| K2 | Fields in scope: address, phone number, email, employment status |
| K3 | Azure AI Speech is the selected transcription technology |
| K4 | An LLM will extract field-value pairs from the transcription |
| K5 | Agent reviews and confirms before saving — AI is a suggestion, not an action |
| K6 | Dynamics 365 is the CRM; the UI is a side panel |
| K7 | ~280 contact centre agents will use this feature |
| K8 | Calls are already recorded under an existing call recording policy |
| K9 | Transcription (text representation of a call) is a new data type not previously handled by the organisation |
| K10 | Privacy team has not assessed whether transcriptions constitute personal information under the Privacy Act 2020, nor defined retention |
| K11 | No retention period for transcriptions has been defined |
| K12 | A customer vulnerability policy exists; flagged customers require additional care |
| K13 | The feature must not automate decisions for vulnerable customers |
| K14 | Rollout strategy is undefined — big-bang vs. phased pilot is an open decision |

---

## 4. Open Questions

### 4.1 Privacy & Data Governance

**OQ-P1 — Is a Privacy Impact Assessment scoped and underway?**
Call transcriptions will almost certainly constitute personal information under section 6 of the Privacy Act 2020 — they will contain the customer's name, address, phone, email, employment details, and potentially financial circumstances or health disclosures. This is not a borderline case. A PIA is required before build begins, not during or after. Has the privacy team been formally engaged to scope one?

**OQ-P2 — What is the retention period for transcriptions,