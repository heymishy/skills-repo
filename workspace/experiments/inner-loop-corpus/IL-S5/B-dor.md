# IL-S5 DoR Artefact — crm.4

**Feature:** 2026-08-01-crm-transcription-rollout
**Story:** crm.4 — Enforce transcript PII retention policy
**DoR verdict:** Proceed: Yes
**Oversight level:** Medium (Privacy Act compliance story — compliance officer review on PR)
**Hard blocks:** 13/13 passed
**H-ADAPTER check:** H-ADAPTER passed — Dynamics 365 CRM adapter (`src/crm/crm-adapter.js`) is out-of-scope for this story; retention logic operates on the transcript store directly, not via the CRM adapter
**Warnings:** W1 acknowledged (Privacy Commissioner assessment ongoing; Azure DPA status unconfirmed; however, the 90-day and 365-day thresholds are legally certain per PIA-2026-14 and are not contingent on the Azure DPA outcome)

---

## Contract Proposal

**What will be built:**
A retention enforcement job for the transcript store. The job:
- Queries all transcript records from `src/crm/transcript-store.js`
- For records > 90 days old: redacts `customerName`, `accountNumber`, `rawTranscript` fields (sets to `[REDACTED]`); preserves non-PII fields
- For records > 365 days old: deletes the record entirely
- Writes a retention audit entry (`recordId`, `action`, `timestamp`, `triggerAgeDays`) for every record acted upon

Scheduling (cron wiring) is out of scope for this story — the job is exported as a callable function; the scheduling story (crm.5) will wire it into the job runner.

**What will NOT be built:**
- Privacy Commissioner consent form workflow
- CRM attachment redaction
- Configurable retention periods (thresholds are compiled-in constants per C4)
- Azure DPA integration
- Real-time transcription changes

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — Redact at 90 days | Unit: 89-day record untouched; 90-day record has PII fields = `[REDACTED]`; non-PII fields preserved | Unit |
| AC2 — Purge at 365 days | Unit: 364-day record only redacted; 365-day record deleted | Unit |
| AC3 — Audit log written | Unit: retention audit entry written per acted-upon record with correct fields | Unit |
| NFR-1 — Boundary conditions | Unit: 89 / 90 / 91 / 364 / 365 / 366 day boundary tests | Unit |

**Estimated touch points:**
- Create: `src/crm/transcript-retention.js` (retention job)
- Create: `tests/crm/transcript-retention.test.js`
- No changes to existing modules

---

## Coding Agent Instructions

**Goal:** Create a retention enforcement function that redacts PII after 90 days and purges records after 365 days. Write failing tests first.

**Branch:** `feature/crm.4`
**Test command:** `npm test`
**Oversight:** Medium

**Architecture Constraint (C4 — PRIVACY ACT 2020):** The 90-day and 365-day thresholds are HARD LEGAL CONSTANTS. Do NOT make them configurable parameters — they must be compiled-in as `const REDACT_AFTER_DAYS = 90` and `const PURGE_AFTER_DAYS = 365`. Configuring these as options would allow accidental bypass of the legal requirement.

**NFR-1:** Boundary test at 89/90/91/364/365/366 days is required to verify that the threshold logic is correct. A test that only checks "old records" without verifying the exact boundary is insufficient.

**Files to touch:**
- Create: `src/crm/transcript-retention.js`
- Create: `tests/crm/transcript-retention.test.js`

**Out of scope:** Scheduling/cron, attachment redaction, Azure DPA, consent workflow.
