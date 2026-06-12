# Definition Output: AI-Assisted Customer Data Update — Dynamics 365 CRM

**Pipeline:** `/definition` | **Status:** Stories defined — go-live prerequisites flagged
**Source discovery:** AI-Assisted Customer Data Update — Dynamics 365 CRM (Approved 2026-06-12)

---

## C2 Constraint Check

**C1 (Privacy Act 2020):** Present — transcription as new personal information type; PIA unscheduled.
Propagated to all transcription-related stories as NFR-1.

**C2 (Customer vulnerability policy):** Present — no automated decisions or suggestions for
vulnerable customers. Propagated as explicit out-of-scope AC in applicable stories.

**C3 (Azure DPA):** Present — Azure OpenAI DPA coverage for customer PII unconfirmed.
Propagated as NFR-2 on story crm.1 (data processing story).

**C4 (Agent confirmation):** Present — hard constraint; propagated as AC in every story that
involves CRM write.

---

## Stories

---

### Story crm.1 — Real-time transcription and field extraction

**As a** contact centre agent,
**I want** the relevant portion of a customer call transcribed in real time and the updated
field values extracted by AI,
**So that** I can review pre-populated update fields rather than manually typing what the
customer said.

**Acceptance Criteria**

**AC1:** Given an agent is on an active call with a customer who provides an address update,
when the customer speaks the new address, then Azure AI Speech transcribes the relevant
call segment within 3 seconds and the LLM identifies and extracts the address field-value pair,
pre-populating the address field in the Dynamics 365 side panel.

**AC2:** Given the LLM has extracted one or more field values from the transcription, when
the side panel is displayed, then each extracted field shows the suggested value and the
current CRM value side-by-side, and all fields are editable before confirmation.

**AC3:** Given the transcription or LLM service is unavailable during an active call, when
the agent accesses the update panel, then the panel loads with all fields empty and a visible
service-unavailable indicator, allowing the agent to proceed with manual entry without
workflow interruption.

**AC4:** Given a customer updates only one of the four fields (e.g., email only), when the
LLM processes the transcription, then only the identified field is pre-populated;
the remaining three fields are shown blank rather than pre-populated with current CRM values.

**Out of Scope**
- Transcription or extraction for customers flagged as vulnerable (separate story or deferred)
- Storage of transcription text beyond the active session (pending Privacy Act assessment)
- Extraction of fields other than address, phone number, email, employment status

**NFRs**
NFR-1 (Privacy Act 2020 — C1): Transcription text must not be persisted to any data store
until the Privacy Impact Assessment is complete and retention obligations are confirmed.
Current design: transcription is ephemeral — used only to populate the panel, then discarded.
This must be verified at architecture review. **Go-live prerequisite.**

NFR-2 (Azure DPA — C3): Azure OpenAI must be deployed within the organisation's Azure tenant
(not external OpenAI API) to satisfy DPA coverage. Legal/procurement confirmation required
before data processing begins. **Go-live prerequisite.**

NFR-3 (Performance): Side panel must pre-populate within 5 seconds of the customer completing
the relevant statement, to remain within natural call flow. SLA not yet formally defined —
target requires validation in pilot.

**Complexity:** 5

---

### Story crm.2 — Agent confirm-and-save workflow

**As a** contact centre agent,
**I want** to review the AI-extracted field values, edit them if needed, and confirm before
any CRM update is saved,
**So that** I remain in control of all data writes and can correct any extraction error.

**Acceptance Criteria**

**AC1:** Given the side panel shows extracted field values, when the agent clicks Confirm,
then the confirmed field values are written to the Dynamics 365 Contact record and a success
notification is shown.

**AC2:** Given the side panel shows extracted values, when the agent edits one or more fields
before confirming, then the edited values (not the AI-suggested values) are written to the
Contact record.

**AC3:** Given the side panel shows extracted values, when the agent clicks Discard, then no
CRM update is made and the panel closes without any data change.

**AC4:** Given the agent closes the call or navigates away without confirming, when the session
ends, then no CRM update is made and no partial data is persisted.

**AC5:** Given a customer flagged as vulnerable in Dynamics 365 is on the call, when the agent
opens the update panel, then the transcription and extraction feature is disabled for that
call and the agent is directed to manual entry, with a clear indicator explaining why the
feature is unavailable.

**Out of Scope**
- Auto-save under any circumstances (C4 non-negotiable)
- Batch or bulk CRM updates

**NFRs**
NFR-1 (Vulnerability policy — C2): The transcription and extraction feature must be completely
disabled for calls where the customer is flagged as vulnerable in Dynamics 365. This is not
a user preference — it is a policy requirement. Verified by AC5. **Build blocker pending
policy owner sign-off on scope interpretation.**

**Complexity:** 3

---

## Go-live Prerequisites

These are not delivery blockers for the build, but are blockers for production deployment:

| # | Prerequisite | Owner | Status |
|---|-------------|-------|--------|
| P1 | Privacy Impact Assessment completed — confirms transcription retention obligations | Privacy team | Not started (6-week queue) |
| P2 | Consent notice updated to cover AI transcription and LLM processing | Legal | Not started |
| P3 | Azure OpenAI DPA coverage confirmed for customer PII | Legal / Procurement | Not started |
| P4 | Customer vulnerability policy scope confirmed (AC5 crm.2) | Policy owner | Not started |
| P5 | Pilot rollout scope and agent selection defined | Contact centre ops | Not started |

---

<!-- eval-mode: true -->
