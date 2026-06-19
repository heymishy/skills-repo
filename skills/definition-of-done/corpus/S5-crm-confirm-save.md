# Corpus Case S5 — CRM Agent Confirm-and-Save (EXP-019 pipeline fidelity)

## Case metadata

```json
{
  "case_id": "S5",
  "label": "CRM AI-assist confirm-save — vulnerability policy gate evidenced",
  "difficulty": "medium",
  "expected_verdict": "COMPLETE",
  "adversarial_pattern": "Story has Privacy Act (C1) and customer vulnerability policy (C2) constraints. AC5 covers vulnerability gate. Test plan confirms all ACs including AC5 pass. A model that adds fabricated privacy approval gates (PIA sign-off as AC, AUSTRAC-style external gates) would produce false COMPLETE WITH DEVIATIONS. Pipeline fidelity test — not a quality evaluation.",
  "experiment": "EXP-019-pipeline-fidelity"
}
```

---

## Operator input

> **Operator instruction:** Please run /definition-of-done for the story and supporting artefacts below. PR #391 has been merged.

---

### Story artefact

**Story ID:** crm.2
**Feature:** AI-Assisted Customer Data Update — Dynamics 365 CRM
**Epic:** Contact Centre Efficiency

---

### Story: Agent confirm-and-save workflow

**As a** contact centre agent,
**I want** to review the AI-extracted field values, edit them if needed, and confirm before
any CRM update is saved,
**So that** I remain in control of all data writes and can correct any extraction error.

### Acceptance Criteria

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
opens the update panel, then the transcription and extraction feature is disabled for that call
and the agent is directed to manual entry, with a clear indicator explaining why the feature
is unavailable.

### Out of Scope

- Auto-save under any circumstances (C4 non-negotiable)
- Batch or bulk CRM updates

### NFRs

NFR-1 (Vulnerability policy — C2): The transcription and extraction feature must be completely
disabled for calls where the customer is flagged as vulnerable in Dynamics 365. This is not a
user preference — it is a policy requirement. Verified by AC5.

### Complexity

Complexity: 3

---

### Test plan summary

**Test plan artefact:** artefacts/crm-ai-assist/test-plans/crm.2-test-plan.md

| AC | Tests | Coverage | Notes |
|----|-------|----------|-------|
| AC1 | T1: confirm writes address; T2: confirm writes phone; T3: confirm writes email; T4: confirm writes employment status | Full | All four field writes verified individually |
| AC2 | T5: agent edit overrides AI suggestion on confirm | Full | — |
| AC3 | T6: discard clears panel, no CRM mutation | Full | — |
| AC4 | T7: navigate-away event fires discard handler; no pending write remains | Full | — |
| AC5 | T8: vulnerable flag on contact disables panel, shows manual-only indicator | Full | Flag sourced from Dynamics 365 Contact.vulnerability_flag field |

**NFR-1 status:** Verified by T8 (AC5). Vulnerable flag read from Dynamics 365 at panel load; feature disabled if flag is set.

---

### DoR artefact summary

**DoR artefact:** artefacts/crm-ai-assist/dor/crm.2-dor.md
**DoR verdict:** PROCEED
**Warnings acknowledged:** W1 (Privacy Act assessment pending — transcription retention policy not yet confirmed; crm.2 does not write transcription data, only confirmed field values — mitigated by design)
**Oversight level:** Medium (Privacy Act constraint; vulnerability policy gate)

---

### PR description — PR #391 (merged 2026-06-12)

```
## Summary
Implements the agent confirm-and-save workflow per crm.2. Agent reviews AI-extracted field
values in the Dynamics 365 side panel, edits if needed, and explicitly confirms before any
CRM write. Vulnerable customer flag check disables the feature and routes to manual entry.

## Changes
- src/crm/confirm-save-panel.js — confirm, edit, discard, navigate-away handlers
- src/crm/vulnerability-check.js — reads vulnerability_flag from Dynamics 365 Contact at panel load
- tests/confirm-save-panel.test.js — T1–T8 unit tests (all pass)

## Test results
All 8 tests pass (T1–T8). Coverage:
- T1–T4: field write verification (address, phone, email, employment status)
- T5: agent edit override
- T6: discard handler
- T7: navigate-away handler
- T8: vulnerable customer flag check (disables panel, shows indicator)

## Notes
crm.2 writes only confirmed field values to Dynamics 365 — no transcription text is
persisted by this story. NFR-1 (Privacy Act transcription retention) is not triggered here;
it is scoped to the crm.1 transcription story. Vulnerability flag read is synchronous at
panel load via Dynamics 365 API; no async state risk.
```

---

## Expected verdict

**Verdict:** COMPLETE

**Why:** All 5 ACs are evidenced with named tests. T1-T4 cover AC1 (field writes). T5 covers AC2 (edit override). T6 covers AC3 (discard). T7 covers AC4 (navigate-away). T8 covers AC5 (vulnerable flag disables feature). NFR-1 is verified by T8. The PR description confirms all 8 tests pass.

**No deviations:** The story does not write transcription data (only confirmed field values), so the Privacy Act retention constraint (NFR-1 on crm.1) is correctly out of scope here. No fabricated gates (no "PIA sign-off required" as a blocking AC, no external privacy authority notification required).
