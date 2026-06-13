# IL-S5 Test Plan — crm.4 Transcript Retention

**Framework:** Jest (`npm test`)
**Test data strategy:** Synthetic — in-memory transcript record fixtures with `createdAt` dates set to known ages via `Date.now() - (days * 86400 * 1000)`

---

## AC coverage table

| AC / NFR | Tests | Coverage | Notes |
|----------|-------|----------|-------|
| AC1 — Redact PII at 90 days | T1: 90-day record → PII fields `[REDACTED]`; T2: non-PII fields preserved; T3: 89-day record untouched | Full | Boundary |
| AC2 — Purge at 365 days | T4: 365-day record deleted; T5: 364-day record only redacted (not deleted) | Full | Boundary |
| AC3 — Audit log written | T6: REDACTED action logged; T7: PURGED action logged; T8: `triggerAgeDays` correct | Full | — |
| NFR-1 — Boundary exactness | T3 (89-day boundary), T5 (364-day boundary), implied by T1/T4 | Full | |

No test plan gaps.

---

## Unit tests (T1–T8)

### T1 — PII fields redacted for 90-day record (AC1)

**AC:** AC1
**Precondition:** Record with `createdAt` = `Date.now() - (90 * 86400 * 1000)`
**Expected:** After `runRetentionJob()`, the record's `customerName`, `accountNumber`, `rawTranscript` all equal `[REDACTED]`

### T2 — Non-PII fields preserved after redaction (AC1)

**AC:** AC1
**Precondition:** Same 90-day record as T1
**Expected:** `caseId`, `agentId`, `callDate`, `durationSeconds`, `sentimentScore` retain their original values after redaction

### T3 — 89-day record untouched (AC1 / NFR-1 boundary)

**AC:** AC1, NFR-1
**Precondition:** Record with `createdAt` = `Date.now() - (89 * 86400 * 1000)`
**Expected:** No change to any field after `runRetentionJob()`

### T4 — 365-day record purged (AC2)

**AC:** AC2
**Precondition:** Record with `createdAt` = `Date.now() - (365 * 86400 * 1000)`
**Expected:** After `runRetentionJob()`, the record is no longer present in the store

### T5 — 364-day record redacted but not purged (AC2 / NFR-1 boundary)

**AC:** AC2, NFR-1
**Precondition:** Record with `createdAt` = `Date.now() - (364 * 86400 * 1000)`
**Expected:** Record still present in store; PII fields are `[REDACTED]` (already past 90-day threshold)

### T6 — REDACTED audit entry written (AC3)

**AC:** AC3
**Precondition:** 90-day record processed
**Expected:** Retention audit store contains entry with `{ recordId, action: 'REDACTED', timestamp, triggerAgeDays: 90 }`

### T7 — PURGED audit entry written (AC3)

**AC:** AC3
**Precondition:** 365-day record processed
**Expected:** Retention audit store contains entry with `{ recordId, action: 'PURGED', timestamp, triggerAgeDays: 365 }`

### T8 — `triggerAgeDays` reflects actual age (AC3)

**AC:** AC3
**Precondition:** Record aged 120 days (well past 90-day threshold)
**Expected:** Audit entry `triggerAgeDays` = 120 (actual age of the record at processing time, not the threshold constant)

---

## Gap table

No gaps.
