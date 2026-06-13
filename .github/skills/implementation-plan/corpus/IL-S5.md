# IL-S5 — CRM Transcript Retention (MEDIUM difficulty)

**Feature:** 2026-08-01-crm-transcription-rollout
**Story:** crm.4
**Difficulty:** MEDIUM
**Expected Phase A score:** ~0.83

## Operator input

> You are running /implementation-plan on the following story in eval mode.

DoR artefact:

# IL-S5 DoR Artefact — crm.4

**Feature:** 2026-08-01-crm-transcription-rollout
**Story:** crm.4 — Enforce transcript PII retention policy
**DoR verdict:** Proceed: Yes
**Oversight level:** Medium (Privacy Act compliance story — compliance officer review on PR)
**H-ADAPTER check:** PASS — retention logic operates on the transcript store directly, not via the CRM adapter
**Warnings:** W1 acknowledged (Privacy Commissioner assessment ongoing; Azure DPA status unconfirmed; however, 90-day and 365-day thresholds are legally certain per PIA-2026-14)

## Contract Proposal

**What will be built:**
A retention enforcement job for the transcript store:
- Queries all transcript records from `src/crm/transcript-store.js`
- For records > 90 days old: redacts `customerName`, `accountNumber`, `rawTranscript` fields (sets to `[REDACTED]`); preserves non-PII fields
- For records > 365 days old: deletes the record entirely
- Writes a retention audit entry (`recordId`, `action`, `timestamp`, `triggerAgeDays`) for every record acted upon

Scheduling (cron wiring) is out of scope — the job is exported as a callable function; crm.5 will wire it into the job runner.

**What will NOT be built:**
- Privacy Commissioner consent form workflow
- CRM attachment redaction
- Configurable retention periods (thresholds are compiled-in constants per C4)
- Azure DPA integration
- Real-time transcription changes

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — Redact at 90 days | Unit: 89-day record untouched; 90-day record has PII = `[REDACTED]`; non-PII preserved | Unit |
| AC2 — Purge at 365 days | Unit: 364-day record only redacted; 365-day record deleted | Unit |
| AC3 — Audit log written | Unit: retention audit entry written per acted-upon record with correct fields | Unit |
| NFR-1 — Boundary conditions | Unit: 89 / 90 / 91 / 364 / 365 / 366 day boundary tests | Unit |

**Estimated touch points:**
- Create: `src/crm/transcript-retention.js`
- Create: `tests/crm/transcript-retention.test.js`

## Coding Agent Instructions

**Goal:** Create a retention enforcement function. Redact PII after 90 days, purge records after 365 days. Write failing tests first.

**Branch:** `feature/crm.4`
**Test command:** `npm test`
**Oversight:** Medium

**Architecture Constraint (C4 — PRIVACY ACT 2020):** The 90-day and 365-day thresholds are HARD LEGAL CONSTANTS confirmed by Legal in PIA-2026-14. Do NOT make them configurable parameters — they MUST be compiled-in as `const REDACT_AFTER_DAYS = 90` and `const PURGE_AFTER_DAYS = 365`.

**NFR-1:** Boundary test at 89/90/91/364/365/366 days is required. A test that only checks "old records" without verifying the exact boundary is insufficient.

**Files to touch:**
- Create: `src/crm/transcript-retention.js`
- Create: `tests/crm/transcript-retention.test.js`

**Out of scope:** Scheduling/cron, attachment redaction, Azure DPA, consent workflow.

---

Definition artefact:

# IL-S5 Definition Artefact — CRM Transcript Retention

**Feature:** 2026-08-01-crm-transcription-rollout
**Story slug:** crm.4

## Story: crm.4 — Enforce transcript PII retention policy

**AC1:** Given a transcript record > 90 days old, when the retention job runs, then `customerName`, `accountNumber`, `rawTranscript` are set to `[REDACTED]`; non-PII fields (`caseId`, `agentId`, `callDate`, `durationSeconds`, `sentimentScore`) are preserved.

**AC2:** Given a transcript record > 365 days old, when the retention job runs, then the record is purged (deleted) entirely.

**AC3:** Given the retention job runs, when it completes, then a retention audit entry is written for every record acted upon: `recordId`, `action` (`REDACTED` or `PURGED`), `timestamp`, `triggerAgeDays`.

**Out of Scope:** Real-time transcription (crm.1–crm.3), Privacy Commissioner consent framework, CRM attachment redaction, agent performance reporting, configurable retention periods, Azure DPA, scheduling/cron.

**NFR-1 (Privacy Act 2020):** PII fields must not be retained beyond 90 days. Verified by boundary tests at 89/90/91 days and 364/365/366 days.

**Architecture Constraints:**
**C4 (Privacy Act 2020 — confirmed by Legal):** 90-day redaction and 365-day purge thresholds are NOT configurable. Compiled-in constants. Any deviation requires new PIA sign-off.

---

Test plan:

# IL-S5 Test Plan — crm.4 Transcript Retention

| AC / NFR | Tests | Coverage |
|----------|-------|----------|
| AC1 — Redact PII at 90 days | T1: 90-day record → PII `[REDACTED]`; T2: non-PII preserved; T3: 89-day untouched | Full |
| AC2 — Purge at 365 days | T4: 365-day record deleted; T5: 364-day only redacted | Full |
| AC3 — Audit log written | T6: REDACTED logged; T7: PURGED logged; T8: `triggerAgeDays` correct | Full |
| NFR-1 — Boundary | T3 (89-day), T5 (364-day) | Full |

**T1:** Record `createdAt = Date.now() - (90 * 86400 * 1000)` → `customerName`, `accountNumber`, `rawTranscript` all `[REDACTED]`
**T2:** Same record → `caseId`, `agentId`, `callDate`, `durationSeconds`, `sentimentScore` unchanged
**T3:** 89-day record → no changes
**T4:** 365-day record → deleted from store
**T5:** 364-day record → PII redacted, not deleted
**T6–T8:** Audit entries have `{ recordId, action, timestamp, triggerAgeDays }`

---

Codebase context:

```js
// src/crm/transcript-store.js (existing — crm.4 does NOT modify this)
'use strict';

const transcripts = new Map();

const PII_FIELDS = ['customerName', 'accountNumber', 'rawTranscript'];

function save(record) {
  transcripts.set(record.recordId, { ...record, createdAt: record.createdAt || Date.now() });
}
function findById(recordId) { return transcripts.get(recordId) || null; }
function findAll() { return Array.from(transcripts.values()); }
function update(recordId, fields) {
  const existing = transcripts.get(recordId);
  if (!existing) throw new Error(`Record not found: ${recordId}`);
  transcripts.set(recordId, { ...existing, ...fields });
}
function remove(recordId) { transcripts.delete(recordId); }

module.exports = { save, findById, findAll, update, remove, PII_FIELDS };

// Retention audit store (src/crm/retention-audit-store.js — existing stub):
// function append(entry) { /* entry: { recordId, action, timestamp, triggerAgeDays } */ }
// function findAll() { return [...auditEntries]; }
// module.exports = { append, findAll };
```

Produce the implementation plan. Write it to artefacts/2026-08-01-crm-transcription-rollout/plans/crm.4-plan.md.

## Expected characteristics

# IL-S5 DoR Artefact — crm.4

**Feature:** 2026-08-01-crm-transcription-rollout
**Story:** crm.4 — Enforce transcript PII retention policy

## Contract Proposal

**What will be built:** Retention enforcement job:
- Records > 90 days: redact `customerName`, `accountNumber`, `rawTranscript` → `[REDACTED]`; preserve non-PII fields
- Records > 365 days: delete entirely
- Audit entry per acted-upon record: `recordId`, `action`, `timestamp`, `triggerAgeDays`

**What will NOT be built:** Consent workflow, attachment redaction, configurable thresholds, Azure DPA, cron scheduling.

**ACs:**
- AC1: PII fields redacted at 90 days; non-PII preserved; 89-day record untouched
- AC2: Record deleted at 365 days; 364-day record only redacted
- AC3: Audit entry written for every REDACTED and PURGED action

**NFR-1:** Boundary tests at 89/90/91 and 364/365/366 days required.

**Architecture Constraint (C4):** `REDACT_AFTER_DAYS = 90` and `PURGE_AFTER_DAYS = 365` are COMPILED-IN CONSTANTS — NOT configurable parameters. Legal requirement per PIA-2026-14.

**Files to touch:**
- Create: `src/crm/transcript-retention.js`
- Create: `tests/crm/transcript-retention.test.js`
