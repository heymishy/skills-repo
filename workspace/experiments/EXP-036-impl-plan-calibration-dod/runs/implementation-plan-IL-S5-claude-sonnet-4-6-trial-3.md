Save path: artefacts/2026-08-01-crm-transcription-rollout/plans/crm.4-plan.md

```markdown
# Implementation Plan — crm.4: Enforce Transcript PII Retention Policy

**Feature:** 2026-08-01-crm-transcription-rollout
**Story:** crm.4
**Branch:** `feature/crm.4`
**Oversight level:** Medium (compliance officer review required on PR)
**Test command:** `npm test`
**DoR verdict:** Proceed

---

## Overview

Implement a callable retention enforcement function that:
1. Redacts PII fields (`customerName`, `accountNumber`, `rawTranscript`) on records older than 90 days
2. Purges (deletes) records older than 365 days
3. Writes a retention audit entry for every acted-upon record

Scheduling/cron wiring is **out of scope** (deferred to crm.5).

Architecture constraint C4 mandates that `REDACT_AFTER_DAYS = 90` and `PURGE_AFTER_DAYS = 365` are compiled-in constants — they must NOT be parameters or config values.

---

## Files to Create

| File | Role |
|------|------|
| `tests/crm/transcript-retention.test.js` | All unit tests (written first — RED phase) |
| `src/crm/transcript-retention.js` | Retention enforcement function (GREEN phase) |

**Files touched but not modified:** `src/crm/transcript-store.js`, `src/crm/retention-audit-store.js`

---

## Task Sequence

---

### TASK 1 — Write failing tests (RED)

**File:** `tests/crm/transcript-retention.test.js`

Write all tests before any implementation exists. Every test must fail at this point because `src/crm/transcript-retention.js` does not yet exist.

```js
'use strict';

const transcriptStore = require('../../src/crm/transcript-store');
const retentionAuditStore = require('../../src/crm/retention-audit-store');
const { enforceRetention } = require('../../src/crm/transcript-retention');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a Date.now()-compatible timestamp representing `days` days ago.
 */
function daysAgo(days) {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

/**
 * Builds a minimal transcript record with deterministic PII and non-PII fields.
 */
function makeRecord(recordId, ageDays) {
  return {
    recordId,
    createdAt: daysAgo(ageDays),
    customerName: 'Alice Nguyen',
    accountNumber: 'ACC-00123',
    rawTranscript: 'Hello, I need help with my account.',
    caseId: `CASE-${recordId}`,
    agentId: `AGENT-${recordId}`,
    callDate: '2026-06-01',
    durationSeconds: 180,
    sentimentScore: 0.72,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Clear stores between tests via their internal state.
  // transcript-store exposes findAll/remove; we drain it.
  transcriptStore.findAll().forEach(r => transcriptStore.remove(r.recordId));

  // retention-audit-store: clear via its own mechanism.
  retentionAuditStore.findAll().forEach(() => {}); // length check below
  // We rely on the stub's findAll() reflecting appended entries since last clear.
  // Assume the stub supports a reset; if not, we capture length before each test.
});

// ---------------------------------------------------------------------------
// AC1 — Redact PII at exactly 90 days
// ---------------------------------------------------------------------------

describe('AC1 — PII redaction at 90-day boundary', () => {
  test('T1: record aged exactly 90 days has PII fields set to [REDACTED]', async () => {
    transcriptStore.save(makeRecord('rec-90', 90));

    await enforceRetention();

    const record = transcriptStore.findById('rec-90');
    expect(record).not.toBeNull();
    expect(record.customerName).toBe('[REDACTED]');
    expect(record.accountNumber).toBe('[REDACTED]');
    expect(record.rawTranscript).toBe('[REDACTED]');
  });

  test('T2: record aged exactly 90 days retains all non-PII fields unchanged', async () => {
    const original = makeRecord('rec-90-nonpii', 90);
    transcriptStore.save(original);

    await enforceRetention();

    const record = transcriptStore.findById('rec-90-nonpii');
    expect(record.caseId).toBe(original.caseId);
    expect(record.agentId).toBe(original.agentId);
    expect(record.callDate).toBe(original.callDate);
    expect(record.durationSeconds).toBe(original.durationSeconds);
    expect(record.sentimentScore).toBe(original.sentimentScore);
  });

  test('T3 (NFR-1 boundary): record aged 91 days has PII fields set to [REDACTED]', async () => {
    transcriptStore.save(makeRecord('rec-91', 91));

    await enforceRetention();

    const record = transcriptStore.findById('rec-91');
    expect(record).not.toBeNull();
    expect(record.customerName).toBe('[REDACTED]');
    expect(record.accountNumber).toBe('[REDACTED]');
    expect(record.rawTranscript).toBe('[REDACTED]');
  });
});

// ---------------------------------------------------------------------------
// NFR-1 — 89-day boundary: record must NOT be touched
// ---------------------------------------------------------------------------

describe('NFR-1 — 89-day boundary: no action taken', () => {
  test('T4 (NFR-1 boundary): record aged exactly 89 days is not modified', async () => {
    const original = makeRecord('rec-89', 89);
    transcriptStore.save(original);

    await enforceRetention();

    const record = transcriptStore.findById('rec-89');
    expect(record).not.toBeNull();
    expect(record.customerName).toBe(original.customerName);
    expect(record.accountNumber).toBe(original.accountNumber);
    expect(record.rawTranscript).toBe(original.rawTranscript);
  });

  test('NFR-1 boundary: 89-day record does not produce an audit entry', async () => {
    transcriptStore.save(makeRecord('rec-89-audit', 89));
    const auditsBefore = retentionAuditStore.findAll().length;

    await enforceRetention();

    const auditsAfter = retentionAuditStore.findAll().length;
    expect(auditsAfter).toBe(auditsBefore);
  });
});

// ---------------------------------------------------------------------------
// AC2 — Purge at 365 days
// ---------------------------------------------------------------------------

describe('AC2 — Full purge at 365-day boundary', () => {
  test('T5 (NFR-1 boundary): record aged exactly 365 days is deleted from the store', async () => {
    transcriptStore.save(makeRecord('rec-365', 365));

    await enforceRetention();

    expect(transcriptStore.findById('rec-365')).toBeNull();
  });

  test('T6 (NFR-1 boundary): record aged 366 days is deleted from the store', async () => {
    transcriptStore.save(makeRecord('rec-366', 366));

    await enforceRetention();

    expect(transcriptStore.findById('rec-366')).toBeNull();
  });

  test('T7 (NFR-1 boundary): record aged exactly 364 days is redacted, NOT deleted', async () => {
    transcriptStore.save(makeRecord('rec-364', 364));

    await enforceRetention();

    const record = transcriptStore.findById('rec-364');
    expect(record).not.toBeNull();           // still present
    expect(record.customerName).toBe('[REDACTED]');
    expect(record.accountNumber).toBe('[REDACTED]');
    expect(record.rawTranscript).toBe('[REDACTED]');
  });
});

// ---------------------------------------------------------------------------
// AC3 — Audit log entries
// ---------------------------------------------------------------------------

describe('AC3 — Retention audit entries', () => {
  test('T8: REDACTED action is logged for a 90-day record', async () => {
    transcriptStore.save(makeRecord('rec-audit-redact', 90));
    const auditsBefore = retentionAuditStore.findAll().length;

    await enforceRetention();

    const newEntries = retentionAuditStore.findAll().slice(auditsBefore);
    const entry = newEntries.find(e => e.recordId === 'rec-audit-redact');
    expect(entry).toBeDefined();
    expect(entry.action).toBe('REDACTED');
  });

  test('T9: PURGED action is logged for a 365-day record', async () => {
    transcriptStore.save(makeRecord('rec-audit-purge', 365));
    const auditsBefore = retentionAuditStore.findAll().length;

    await enforceRetention();

    const newEntries = retentionAuditStore.findAll().slice(auditsBefore);
    const entry = newEntries.find(e => e.recordId === 'rec-audit-purge');
    expect(entry).toBeDefined();
    expect(entry.action).toBe('PURGED');
  });

  test('T10: audit entry contains recordId, action, timestamp, triggerAgeDays', async () => {
    transcriptStore.save(makeRecord('rec-audit-fields', 90));
    const auditsBefore = retentionAuditStore.findAll().length;

    await enforceRetention();

    const newEntries = retentionAuditStore.findAll().slice(auditsBefore);
    const entry = newEntries.find(e => e.recordId === 'rec-audit-fields');
    expect(entry).toBeDefined();
    expect(typeof entry.recordId).toBe('string');
    expect(typeof entry.action).toBe('string');
    expect(typeof entry.timestamp).toBe('number');   // epoch ms
    expect(typeof entry.triggerAgeDays).toBe('number');
  });

  test('T11: triggerAgeDays reflects actual age in whole days for a 90-day record', async () => {
    transcriptStore.save(makeRecord('rec-audit-age', 90));
    const auditsBefore = retentionAuditStore.findAll().length;

    await enforceRetention();

    const newEntries = retentionAuditStore.findAll().slice(auditsBefore);
    const entry = newEntries.find(e => e.recordId === 'rec-audit-age');
    // Allow ±1 day tolerance for floating-point/timing jitter
    expect(entry.triggerAgeDays).toBeGreaterThanOrEqual(90);
    expect(entry.triggerAgeDays).toBeLessThan(92);
  });

  test('T12: no audit entry is written for an 89-day (untouched) record', async () => {
    transcriptStore.save(makeRecord('rec-audit-none', 89));
    const auditsBefore = retentionAuditStore.findAll().length;

    await enforceRetention();

    const auditsAfter = retentionAuditStore.findAll().length;
    expect(auditsAfter).toBe(auditsBefore);
  });

  test('T13: exactly one audit entry per acted-upon record (no duplicates)', async () => {
    transcriptStore.save(makeRecord('rec-dedup', 90));
    const auditsBefore = retentionAuditStore.findAll().length;

    await enforceRetention();

    const newEntries = retentionAuditStore.findAll().slice(auditsBefore);
    const forRecord = newEntries.filter(e => e.recordId === 'rec-dedup');
    expect(forRecord).toHaveLength(1);
  });

  test('T14: multiple records in one run each produce their own audit entry', async () => {
    transcriptStore.save(makeRecord('rec-multi-redact', 90));
    transcriptStore.save(makeRecord('rec-multi-purge', 365));
    transcriptStore.save(makeRecord('rec-multi-skip', 89));
    const auditsBefore = retentionAuditStore.findAll().length;

    await enforceRetention();

    const newEntries = retentionAuditStore.findAll().slice(auditsBefore);
    expect(newEntries.some(e => e.recordId === 'rec-multi-redact' && e.action === 'REDACTED')).toBe(true);
    expect(newEntries.some(e => e.recordId === 'rec-multi-purge'  && e.action === 'PURGED')).toBe(true);
    expect(newEntries.some(e => e.recordId === 'rec-multi-skip')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Additional NFR-1 boundary completeness
// ---------------------------------------------------------------------------

describe('NFR-1 — full boundary matrix', () => {
  const cases = [
    { days: 89,  expectRedact: false, expectPurge: false, label: '89-day — no action' },
    { days: 90,  expectRedact: true,  expectPurge: false, label: '90-day — redact only' },
    { days: 91,  expectRedact: true,  expectPurge: false, label: '91-day — redact only' },
    { days: 364, expectRedact: true,  expectPurge: false, label: '364-day — redact only' },
    { days: 365, expectRedact: false, expectPurge: true,  label: '365-day — purge' },
    { days: 366, expectRedact: false, expectPurge: true,  label: '366-day — purge' },
  ];

  cases.forEach(({ days, expectRedact, expectPurge, label }) => {
    test(`boundary: ${label}`, async () => {
      const id = `rec-boundary-${days}`;
      transcriptStore.save(makeRecord(id, days));

      await enforceRetention();

      const record = transcriptStore.findById(id);

      if (expectPurge) {
        expect(record).toBeNull();
      } else if (expectRedact) {
        expect(record).not.toBeNull();
        expect(record.customerName).toBe('[REDACTED]');
        expect(record.accountNumber).toBe('[REDACTED]');
        expect(record.rawTranscript).toBe('[REDACTED]');
      } else {
        expect(record).not.toBeNull();
        expect(record.customerName).not.toBe('[REDACTED]');
        expect(record.accountNumber).not.toBe('[REDACTED]');
        expect(record.rawTranscript).not.toBe('[REDACTED]');
      }
    });
  });
});
```

**Expected result at this point:** All tests fail with `Cannot find module '../../src/crm/transcript-retention'`. ✅ RED confirmed.

---

### TASK 2 — Create `src/crm/retention-audit-store.js` stub (if not present)

> The codebase context shows this file exists as a stub. Verify it exports `append` and `findAll`. If the real file is not yet on disk, create it now so the test module can be required. This is infrastructure — not implementation of the retention logic.

```js
'use strict';

const auditEntries = [];

function append(entry) {
  auditEntries.push({ ...entry });
}

function findAll() {
  return [...auditEntries];
}

module.exports = { append, findAll };
```

> **Note:** If this file already exists with the same surface, skip creation. Do not add any retention logic here.

---

### TASK 3 — Implement `src/crm/transcript-retention.js` (GREEN)

Only write this file after Task 1 tests are committed and confirmed RED.

```js
'use strict';

// ---------------------------------------------------------------------------
// C4 — Privacy Act 2020 / PIA-2026-14
// These thresholds are HARD LEGAL CONSTANTS. Do NOT extract to config or
// accept as parameters. Any change requires new PIA sign-off from Legal.
// ---------------------------------------------------------------------------
const REDACT_AFTER_DAYS = 90;
const PURGE_AFTER_DAYS  = 365;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const transcriptStore    = require('./transcript-store');
const retentionAuditStore = require('./retention-audit-store');

/**
 * Calculates the age of a record in whole days (floor) from its `createdAt`
 * timestamp to the current wall-clock time.
 *
 * @param {number} createdAt  — epoch milliseconds
 * @returns {number}          — age in whole days (floor)
 */
function ageInDays(createdAt) {
  return Math.floor((Date.now() - createdAt) / MS_PER_DAY);
}

/**
 * Enforce the transcript PII retention policy across all records in the
 * transcript store.
 *
 * - Records >= PURGE_AFTER_DAYS  → deleted; audit action = 'PURGED'
 * - Records >= REDACT_AFTER_DAYS → PII fields set to '[REDACTED]';
 *                                  audit action = 'REDACTED'
 * - Records < REDACT_AFTER_DAYS  → no action, no audit entry
 *
 * Purge check is evaluated BEFORE redact so that a 365-day record is purged
 * rather than redacted-then-purged.
 *
 * This function is intentionally async to allow future I/O-backed store
 * implementations without requiring a signature change.
 *
 * @returns {Promise<void>}
 */
async function enforceRetention() {
  const records = transcriptStore.findAll();
  const now = Date.now();

  for (const record of records) {
    const days = ageInDays(record.createdAt);

    if (days >= PURGE_AFTER_DAYS) {
      transcriptStore.remove(record.recordId);

      retentionAuditStore.append({
        recordId:      record.recordId,
        action:        'PURGED',
        timestamp:     now,
        triggerAgeDays: days,
      });

    } else if (days >= REDACT_AFTER_DAYS) {
      transcriptStore.update(record.recordId, {
        customerName:  '[REDACTED]',
        accountNumber: '[REDACTED]',
        rawTranscript: '[REDACTED]',
      });

      retentionAuditStore.append({
        recordId:      record.recordId,
        action:        'REDACTED',
        timestamp:     now,
        triggerAgeDays: days,
      });
    }
    // days < REDACT_AFTER_DAYS — no action, no audit entry
  }
}

module.exports = { enforceRetention };
```

---

## Implementation Notes

### Why purge is checked before redact

A record aged ≥ 365 days satisfies both the ≥ 90-day and the ≥ 365-day conditions. The purge branch is evaluated first so such a record is deleted outright and produces a single `PURGED` audit entry rather than a `REDACTED` entry followed by a `PURGED` entry.

### Why `Math.floor` for age

Using `Math.floor` ensures that a record must have completed a full calendar day to trigger the threshold. A record that is 89.9 days old will compute to 89 days and will not be redacted — correctly matching the "strictly less than 90 days" safety margin.

### Why `enforceRetention` is async

The transcript store is currently in-memory synchronous. Making the function `async` costs nothing here but means crm.5's job runner can `await enforceRetention()` without a signature change if the store is later backed by a database.

### Constants are not exported

`REDACT_AFTER_DAYS` and `PURGE_AFTER_DAYS` are intentionally `const`-local and not exported. Exporting them would invite call-sites to pass them back as arguments, creating a de facto configuration path that violates C4.

---

## Acceptance Checklist

| # | Check | How verified |
|---|-------|-------------|
| 1 | Tests written before implementation | Task 1 committed, RED confirmed before Task 3 starts |
| 2 | `REDACT_AFTER_DAYS = 90` compiled-in constant | Code review: no config file, no parameter |
| 3 | `PURGE_AFTER_DAYS = 365` compiled-in constant | Code review: no config file, no parameter |
| 4 | AC1 — PII fields redacted at 90 days | T1, T2, boundary matrix |
| 5 | AC1 — non-PII fields preserved | T2 |
| 6 | AC1 — 89-day record untouched | T4, boundary matrix |
| 7 | AC2 — 365-day record purged | T5, T6, boundary matrix |
| 8 | AC2 — 364-day record redacted not purged | T7, boundary matrix |
| 9 | AC3 — audit entry written per acted-upon record | T8–T14 |
| 10 | AC3 — audit entry has all four required fields | T10 |
| 11 | NFR-1 — full 89/90/91/364/365/366 boundary matrix | Parameterised boundary suite |
| 12 | No scheduling/cron code | File contains only `enforceRetention` export |
| 13 | `npm test` passes green | CI run |
| 14 | Compliance officer review on PR | PR description flags Medium oversight |

---

## Out of Scope (confirmed)

- Cron/schedule wiring (crm.5)
- Privacy Commissioner consent workflow
- CRM attachment redaction
- Azure DPA integration
- Configurable retention periods
- Real-time transcription changes
```