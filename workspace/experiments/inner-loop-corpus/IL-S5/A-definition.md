# IL-S5 Definition Artefact — CRM Transcript Retention

**Feature:** 2026-08-01-crm-transcription-rollout
**Epic:** CRM Privacy Compliance
**Story slug:** crm.4
**Slicing strategy:** Compliance slice (crm.1–crm.3 built the transcription pipeline; crm.4 adds the retention enforcement layer required by Privacy Act 2020)

---

## Story: crm.4 — Enforce transcript PII retention policy

**As a** compliance team,
**I want** the CRM transcript store to automatically redact PII fields after 90 days and purge transcript records after 12 months,
**So that** the enterprise meets its obligations under the Privacy Act 2020 (NZ) minimum necessary retention principle.

### Acceptance Criteria

**AC1:** Given a transcript record in the store, when the record's creation date is more than 90 days ago, then a scheduled retention job redacts the following PII fields: `customerName`, `accountNumber`, `rawTranscript` — replacing them with the string `[REDACTED]` — while preserving `caseId`, `agentId`, `callDate`, `durationSeconds`, and `sentimentScore`.

**AC2:** Given a transcript record in the store, when the record's creation date is more than 365 days ago, then the retention job purges (deletes) the record entirely from the store.

**AC3:** Given the retention job runs, when it completes, then a retention audit entry is written for every record acted upon, recording: `recordId`, `action` (`REDACTED` or `PURGED`), `timestamp`, and `triggerAgedays`.

### Out of Scope

- Real-time transcription of live calls (crm.1–crm.3)
- Privacy Commissioner consent framework (separate compliance story — assessment pending)
- CRM attachment redaction (attachments are handled by the document management story)
- Agent performance reporting (no change to sentiment or duration fields — preserved through retention lifecycle)

### NFRs

**NFR-1 (Privacy Act 2020 — minimum necessary retention):** PII fields (`customerName`, `accountNumber`, `rawTranscript`) must not be retained beyond 90 days. The retention job must process all records exceeding the threshold within 24 hours of the threshold being crossed. Verified by unit boundary tests (89-day record untouched, 90-day record redacted, 91-day record redacted).

### Architecture Constraints

**C4 (Privacy Act 2020 — confirmed by Legal):** The 90-day redaction threshold and 365-day purge threshold are hard legal requirements confirmed by Legal in the privacy impact assessment (PIA-2026-14). These thresholds are NOT configurable at runtime — they must be compiled-in constants. Any deviation requires a new PIA sign-off.

### Complexity

2 — data lifecycle logic with boundary conditions; no real-time constraint; retention job is scheduled (cron-like), not event-driven.
