Save path: artefacts/2026-08-01-crm-transcription-rollout/plans/crm.4-plan.md

```markdown
# Implementation Plan — crm.4: Enforce Transcript PII Retention Policy

**Feature:** 2026-08-01-crm-transcription-rollout  
**Story:** crm.4  
**Branch:** `feature/crm.4`  
**Oversight:** Medium (compliance officer review required on PR)  
**Test command:** `npm test`

---

## Overview

Build a callable retention enforcement function that:
1. Redacts PII fields (`customerName`, `accountNumber`, `rawTranscript`) on records ≥ 90 days old
2. Purges (deletes) records ≥ 365 days old entirely
3. Writes a retention audit entry for every record acted upon

Scheduling/cron wiring is **out of scope** (crm.5).  
Thresholds are **hard legal constants** per C4 / PIA-2026-14 — not configurable.

---

## Files to Create

| File | Role |
|------|------|
| `tests/crm/transcript-retention.test.js` | Failing tests (written first — RED) |
| `src/crm/transcript-retention.js` | Implementation |

---

## Task 1 — Write failing tests (RED)

**File:** `tests/crm/transcript-retention.test.js`

All tests must fail (functions not yet implemented) when this file is first committed.

```js
'use strict';

const transcriptStore    = require('../../src/crm/transcript-store');
const retentionAuditStore = require('../../src/crm/retention-audit-store');
const { runRetentionJob } = require('../../src/crm/transcript-retention');

// ─── helpers ────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000;

function makeRecord(recordId, daysAgo, overrides = {}) {
  return {
    recordId,
    customerName:    'Alice Tester',
    accountNumber:   'ACC-001',
    rawTranscript:   'Full transcript text',
    caseId:          `CASE-${recordId}`,
    agentId:         'AGENT-42',
    callDate:        '2026-01-01',
    durationSeconds: 300,
    sentimentScore:  0.75,
    createdAt:       Date.now() - daysAgo * MS_PER_DAY,
    ...overrides,
  };
}

// Clear stores before every test so state does not bleed between tests.
beforeEach(() => {
  // Remove all records written during the previous test.
  transcriptStore.findAll().forEach(r => transcriptStore.remove(r.recordId));
  // Reset audit log — retentionAuditStore exposes clear() which we add in the stub below.
  retentionAuditStore.clear();
});

// ─── AC1 — Redact PII at 90 days ────────────────────────────────────────────

describe('AC1 — PII redaction at 90-day boundary', () => {
  test('T1: record exactly 90 days old → PII fields set to [REDACTED]', async () => {
    transcriptStore.save(makeRecord('rec-90', 90));

    await runRetentionJob();

    const record = transcriptStore.findById('rec-90');
    expect(record.customerName).toBe('[REDACTED]');
    expect(record.accountNumber).toBe('[REDACTED]');
    expect(record.rawTranscript).toBe('[REDACTED]');
  });

  test('T2: record exactly 90 days old → non-PII fields preserved', async () => {
    transcriptStore.save(makeRecord('rec-90b', 90));

    await runRetentionJob();

    const record = transcriptStore.findById('rec-90b');
    expect(record.caseId).toBe('CASE-rec-90b');
    expect(record.agentId).toBe('AGENT-42');
    expect(record.callDate).toBe('2026-01-01');
    expect(record.durationSeconds).toBe(300);
    expect(record.sentimentScore).toBe(0.75);
  });

  test('T3 (NFR-1 boundary): record exactly 89 days old → untouched', async () => {
    transcriptStore.save(makeRecord('rec-89', 89));

    await runRetentionJob();

    const record = transcriptStore.findById('rec-89');
    expect(record.customerName).toBe('Alice Tester');
    expect(record.accountNumber).toBe('ACC-001');
    expect(record.rawTranscript).toBe('Full transcript text');
  });

  test('NFR-1 boundary: record exactly 91 days old → PII redacted', async () => {
    transcriptStore.save(makeRecord('rec-91', 91));

    await runRetentionJob();

    const record = transcriptStore.findById('rec-91');
    expect(record.customerName).toBe('[REDACTED]');
    expect(record.accountNumber).toBe('[REDACTED]');
    expect(record.rawTranscript).toBe('[REDACTED]');
  });
});

// ─── AC2 — Purge at 365 days ─────────────────────────────────────────────────

describe('AC2 — Record purge at 365-day boundary', () => {
  test('T4: record exactly 365 days old → deleted from store', async () => {
    transcriptStore.save(makeRecord('rec-365', 365));

    await runRetentionJob();

    expect(transcriptStore.findById('rec-365')).toBeNull();
  });

  test('T5 (NFR-1 boundary): record exactly 364 days old → PII redacted, NOT deleted', async () => {
    transcriptStore.save(makeRecord('rec-364', 364));

    await runRetentionJob();

    const record = transcriptStore.findById('rec-364');
    expect(record).not.toBeNull();                   // still exists
    expect(record.customerName).toBe('[REDACTED]');  // was redacted
  });

  test('NFR-1 boundary: record exactly 366 days old → deleted from store', async () => {
    transcriptStore.save(makeRecord('rec-366', 366));

    await runRetentionJob();

    expect(transcriptStore.findById('rec-366')).toBeNull();
  });
});

// ─── AC3 — Audit log ─────────────────────────────────────────────────────────

describe('AC3 — Retention audit entries', () => {
  test('T6: redacted record → audit entry with action REDACTED', async () => {
    transcriptStore.save(makeRecord('rec-audit-r', 90));

    await runRetentionJob();

    const entries = retentionAuditStore.findAll();
    const entry   = entries.find(e => e.recordId === 'rec-audit-r');
    expect(entry).toBeDefined();
    expect(entry.action).toBe('REDACTED');
  });

  test('T7: purged record → audit entry with action PURGED', async () => {
    transcriptStore.save(makeRecord('rec-audit-p', 365));

    await runRetentionJob();

    const entries = retentionAuditStore.findAll();
    const entry   = entries.find(e => e.recordId === 'rec-audit-p');
    expect(entry).toBeDefined();
    expect(entry.action).toBe('PURGED');
  });

  test('T8: audit entry contains recordId, action, timestamp, triggerAgeDays', async () => {
    transcriptStore.save(makeRecord('rec-audit-fields', 90));

    const before = Date.now();
    await runRetentionJob();
    const after  = Date.now();

    const entry = retentionAuditStore.findAll()
      .find(e => e.recordId === 'rec-audit-fields');

    expect(entry).toMatchObject({
      recordId:      'rec-audit-fields',
      action:        'REDACTED',
      triggerAgeDays: expect.any(Number),
    });
    expect(entry.timestamp).toBeGreaterThanOrEqual(before);
    expect(entry.timestamp).toBeLessThanOrEqual(after);
    // triggerAgeDays must be approximately 90 (allow ±1 for floating-point truncation)
    expect(entry.triggerAgeDays).toBeGreaterThanOrEqual(90);
    expect(entry.triggerAgeDays).toBeLessThan(92);
  });

  test('AC3 completeness: 89-day record → no audit entry written', async () => {
    transcriptStore.save(makeRecord('rec-no-audit', 89));

    await runRetentionJob();

    const entry = retentionAuditStore.findAll()
      .find(e => e.recordId === 'rec-no-audit');
    expect(entry).toBeUndefined();
  });

  test('AC3 completeness: multiple acted-upon records → one audit entry each', async () => {
    transcriptStore.save(makeRecord('rec-m1', 90));
    transcriptStore.save(makeRecord('rec-m2', 365));
    transcriptStore.save(makeRecord('rec-m3', 89)); // untouched

    await runRetentionJob();

    const entries = retentionAuditStore.findAll();
    const ids     = entries.map(e => e.recordId);
    expect(ids).toContain('rec-m1');
    expect(ids).toContain('rec-m2');
    expect(ids).not.toContain('rec-m3');
  });
});
```

> **Protocol checkpoint:** All tests above must be committed and confirmed **RED** before Task 2 begins.

---

## Task 2 — Create the retention-audit-store stub

The codebase context shows `retention-audit-store.js` as an existing stub that does not expose `clear()`. Tests require it. Extend the stub — this is a minimal addition, not a new feature module.

**File:** `src/crm/retention-audit-store.js`  
*(Create if absent; extend if already present)*

```js
'use strict';

let auditEntries = [];

function append(entry) {
  auditEntries.push({ ...entry });
}

function findAll() {
  return [...auditEntries];
}

/** Test-only: resets the in-memory log between test runs. */
function clear() {
  auditEntries = [];
}

module.exports = { append, findAll, clear };
```

> **Note:** `clear()` is needed by the test `beforeEach` hook. It is intentionally not exported as a public API in production documentation.

---

## Task 3 — Implement the retention job (GREEN)

**File:** `src/crm/transcript-retention.js`

```js
'use strict';

const transcriptStore     = require('./transcript-store');
const retentionAuditStore = require('./retention-audit-store');

// ─── Legal constants — C4 / PIA-2026-14 ─────────────────────────────────────
// DO NOT make these configurable. Any change requires a new PIA sign-off.
const REDACT_AFTER_DAYS = 90;
const PURGE_AFTER_DAYS  = 365;

const MS_PER_DAY = 86_400_000;

const PII_FIELDS = ['customerName', 'accountNumber', 'rawTranscript'];

/**
 * Calculates the age of a record in whole days (floor).
 *
 * @param {number} createdAt  — epoch ms
 * @param {number} now        — epoch ms (injected for testability; defaults to Date.now())
 * @returns {number}
 */
function ageInDays(createdAt, now) {
  return Math.floor((now - createdAt) / MS_PER_DAY);
}

/**
 * Runs the PII retention enforcement job against all records in the
 * transcript store.
 *
 * - Records ≥ PURGE_AFTER_DAYS  → deleted; audit action = 'PURGED'
 * - Records ≥ REDACT_AFTER_DAYS → PII redacted; audit action = 'REDACTED'
 * - Records < REDACT_AFTER_DAYS → no action taken; no audit entry written
 *
 * Scheduling is out of scope — call this function from the job runner (crm.5).
 *
 * @param {object} [options]
 * @param {number} [options.now=Date.now()]  Override the current timestamp
 *   (facilitates deterministic unit testing without real-clock dependency).
 * @returns {Promise<void>}
 */
async function runRetentionJob({ now = Date.now() } = {}) {
  const records = transcriptStore.findAll();

  for (const record of records) {
    const ageDays = ageInDays(record.createdAt, now);

    if (ageDays >= PURGE_AFTER_DAYS) {
      transcriptStore.remove(record.recordId);
      retentionAuditStore.append({
        recordId:       record.recordId,
        action:         'PURGED',
        timestamp:      Date.now(),
        triggerAgeDays: ageDays,
      });
      continue;
    }

    if (ageDays >= REDACT_AFTER_DAYS) {
      const redactedFields = {};
      for (const field of PII_FIELDS) {
        redactedFields[field] = '[REDACTED]';
      }
      transcriptStore.update(record.recordId, redactedFields);
      retentionAuditStore.append({
        recordId:       record.recordId,
        action:         'REDACTED',
        timestamp:      Date.now(),
        triggerAgeDays: ageDays,
      });
    }
    // ageDays < REDACT_AFTER_DAYS → no action, no audit entry
  }
}

module.exports = { runRetentionJob };
```

---

## Task 4 — Verify GREEN

Run the test suite and confirm all tests pass:

```bash
npm test -- --testPathPattern=tests/crm/transcript-retention
```

Expected output: all tests green, no skips.

---

## Boundary Verification Matrix

| Record age | Expected action | Audit written? | Test ID |
|-----------|----------------|----------------|---------|
| 89 days   | None           | No             | T3      |
| 90 days   | REDACTED       | Yes            | T1, T2  |
| 91 days   | REDACTED       | Yes            | NFR-1   |
| 364 days  | REDACTED       | Yes            | T5      |
| 365 days  | PURGED (deleted) | Yes          | T4      |
| 366 days  | PURGED (deleted) | Yes          | NFR-1   |

---

## Architecture Decisions & Constraints

| Decision | Rationale |
|----------|-----------|
| `REDACT_AFTER_DAYS = 90` is a compiled-in `const` | C4 / PIA-2026-14 — legal threshold, not configurable |
| `PURGE_AFTER_DAYS = 365` is a compiled-in `const` | C4 / PIA-2026-14 — legal threshold, not configurable |
| `runRetentionJob` is exported as a callable function, not scheduled | crm.5 owns scheduling; this story is scope-bounded |
| `now` parameter on `runRetentionJob` | Enables deterministic tests without `Date.now()` mocking; production callers omit it |
| `Math.floor` for age calculation | Consistent with "days old" semantics: a record is 90 days old when a full 90-day period has elapsed |
| Purge evaluated before redact | Prevents a redundant `update()` call on records that will be deleted anyway |
| PII_FIELDS sourced locally (not re-imported from `transcript-store`) | `transcript-store.PII_FIELDS` is an implementation detail of that module; retention logic owns its own field list per separation of concerns |

---

## Oversight Checklist (Medium)

- [ ] Compliance officer reviews PR before merge
- [ ] `REDACT_AFTER_DAYS` and `PURGE_AFTER_DAYS` constants unchanged from PIA-2026-14 values
- [ ] All six boundary tests (89 / 90 / 91 / 364 / 365 / 366) passing
- [ ] Audit entries verified for every acted-upon record
- [ ] No configurable retention period parameters introduced
- [ ] Scheduling/cron not added (crm.5 scope)
- [ ] W1 acknowledged in PR description: Azure DPA status unconfirmed; Privacy Commissioner assessment ongoing
```