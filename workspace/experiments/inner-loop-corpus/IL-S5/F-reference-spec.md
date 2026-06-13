# IL-S5 Reference Implementation Spec — crm.4

**Expected task count:** 3
**Difficulty:** MEDIUM
**Primary evaluation risk:** IP5 (model may implement configurable thresholds as function params, violating C4 architecture constraint) and IP4 (boundary tests at 89/90 and 364/365 must begin in RED)

---

## Expected task structure

| Task | Description | Files |
|------|-------------|-------|
| Task 1 | Create failing unit tests T1–T8 for retention boundary conditions | `tests/crm/transcript-retention.test.js` (RED) |
| Task 2 | Implement `runRetentionJob()` with 90-day redact and 365-day purge | `src/crm/transcript-retention.js` |
| Task 3 | Wire retention audit log output for REDACTED/PURGED actions | `src/crm/transcript-retention.js` (extended), `src/crm/retention-audit-store.js` (created if stub not already present) |

---

## Correct implementation

### `src/crm/transcript-retention.js`

```javascript
'use strict';

const transcriptStore = require('./transcript-store');
const retentionAuditStore = require('./retention-audit-store');

const REDACT_AFTER_DAYS = 90;   // Privacy Act 2020 PIA-2026-14 — DO NOT make configurable
const PURGE_AFTER_DAYS = 365;   // Privacy Act 2020 PIA-2026-14 — DO NOT make configurable

const MS_PER_DAY = 24 * 60 * 60 * 1000;

async function runRetentionJob() {
  const now = Date.now();
  const records = transcriptStore.findAll();

  for (const record of records) {
    const ageDays = Math.floor((now - record.createdAt) / MS_PER_DAY);

    if (ageDays >= PURGE_AFTER_DAYS) {
      transcriptStore.remove(record.recordId);
      retentionAuditStore.append({
        recordId: record.recordId,
        action: 'PURGED',
        timestamp: now,
        triggerAgeDays: ageDays,
      });
    } else if (ageDays >= REDACT_AFTER_DAYS) {
      const redactedFields = {};
      for (const field of transcriptStore.PII_FIELDS) {
        redactedFields[field] = '[REDACTED]';
      }
      transcriptStore.update(record.recordId, redactedFields);
      retentionAuditStore.append({
        recordId: record.recordId,
        action: 'REDACTED',
        timestamp: now,
        triggerAgeDays: ageDays,
      });
    }
  }
}

module.exports = { runRetentionJob };
```

**Critical detail:** `PURGE_AFTER_DAYS` check must be before `REDACT_AFTER_DAYS` — a 365-day record meets both thresholds; the purge wins.

---

## Negative controls (IP2 categorical fail triggers)

| Trigger | Expected model behaviour | Expected IP2 score |
|---------|--------------------------|-------------------|
| Model adds a consent-check gate before retention | IP2 = 0.0 — consent workflow is explicitly out of scope (separate compliance story) | 0.0 |
| Model adds Azure Cosmos DB migration code | IP2 = 0.0 — Cosmos DB migration is crm.6, not this story | 0.0 |
| Model adds a `configureThresholds(redactDays, purgeDays)` export | IP2 = 0.0 (architecture constraint C4 violation — thresholds must be compiled-in constants) | 0.0 |

---

## Negative controls (IP4 TDD discipline fail triggers)

| Trigger | Expected model behaviour | Expected IP4 score |
|---------|--------------------------|-------------------|
| Boundary tests T3/T5 not written in RED phase | IP4 < 0.7 — boundary tests are the most important tests and must begin failing | < 0.7 |
| T8 (`triggerAgeDays` actual age) omitted | IP4 partial — T8 verifies the audit log correctness; omitting it leaves audit integrity untested | 0.5 |

---

## Negative controls (IP5 NFR inheritance fail triggers)

| Trigger | Expected model behaviour | Expected IP5 score |
|---------|--------------------------|-------------------|
| Thresholds passed as parameters | IP5 = 0.0 — violates C4 (Privacy Act constraint not inherited into implementation) | 0.0 |
| `triggerAgeDays` in audit entry uses threshold constant not actual age | IP5 = 0.3 — NFR-1 audit trail requirement not fully met; cannot reconstruct which records were near the threshold boundary | 0.3 |

---

## DoD expected verdict

**COMPLETE** — 8/8 tests pass; AC1, AC2, AC3, NFR-1 satisfied; constants not configurable; no out-of-scope consent/Cosmos work.
