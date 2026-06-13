Save path: artefacts/2026-08-01-crm-transcription-rollout/plans/crm.4-plan.md

```markdown
# Implementation Plan — crm.4: Enforce Transcript PII Retention Policy

**Feature:** 2026-08-01-crm-transcription-rollout
**Story:** crm.4
**Branch:** `feature/crm.4`
**Oversight:** Medium (compliance officer review required on PR)
**DoR verdict:** Proceed: Yes
**H-ADAPTER check:** PASS

---

## Overview

Create a retention enforcement function that:
- Redacts PII fields (`customerName`, `accountNumber`, `rawTranscript`) for records older than 90 days
- Purges records entirely for records older than 365 days
- Writes a retention audit entry for every record acted upon

Scheduling/cron wiring is explicitly out of scope (deferred to crm.5).

---

## Files to Create

| File | Purpose |
|------|---------|
| `tests/crm/transcript-retention.test.js` | All unit tests (written first — RED) |
| `src/crm/transcript-retention.js` | Retention enforcement implementation |

**Files NOT modified:** `src/crm/transcript-store.js`, `src/crm/retention-audit-store.js`

---

## Architecture Constants (C4 — Privacy Act 2020, confirmed by Legal via PIA-2026-14)

```
const REDACT_AFTER_DAYS = 90   // HARD LEGAL CONSTANT — not configurable
const PURGE_AFTER_DAYS  = 365  // HARD LEGAL CONSTANT — not configurable
```

These MUST be compiled-in constants. Making them configurable parameters is a
protocol violation of C4. Any change requires new PIA sign-off.

---

## Task Sequence

### TASK 1 — RED: Write failing tests

**File:** `tests/crm/transcript-retention.test.js`

Write all tests before any implementation exists. All tests must fail (RED) at
this point because `src/crm/transcript-retention.js` does not yet exist.

```js
'use strict';

const transcriptStore     = require('../../src/crm/transcript-store');
const retentionAuditStore = require('../../src/crm/retention-audit-store');
const { enforceRetention } = require('../../src/crm/transcript-retention');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns a Date.now()-style timestamp representing `days` days ago. */
function daysAgo(days) {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

/** Builds a complete transcript record with realistic defaults. */
function makeRecord(overrides = {}) {
  const base = {
    recordId:        overrides.recordId        ?? 'rec-001',
    createdAt:       overrides.createdAt       ?? daysAgo(0),
    customerName:    'Jane Smith',
    accountNumber:   'ACC-9876',
    rawTranscript:   'Full call transcript text.',
    caseId:          'CASE-001',
    agentId:         'AGENT-42',
    callDate:        '2026-04-01',
    durationSeconds: 240,
    sentimentScore:  0.72,
  };
  return { ...base, ...overrides };
}

// ---------------------------------------------------------------------------
// Test setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Clear both stores before every test for isolation.
  // transcript-store exposes findAll+remove; audit store exposes findAll.
  // We reset by removing all records individually.
  for (const r of transcriptStore.findAll()) {
    transcriptStore.remove(r.recordId);
  }
  // Reset audit store — assumes retention-audit-store exposes a clear() or
  // we reconstruct its internal state. The stub has a module-level array;
  // we call retentionAuditStore.__reset() which we will add to the stub
  // (or use jest.resetModules — see note below).
  // Safe approach: if __reset exists call it; else re-require is handled by
  // jest module cache reset in jest.config isolateModules if needed.
  if (typeof retentionAuditStore.__reset === 'function') {
    retentionAuditStore.__reset();
  }
});

// ---------------------------------------------------------------------------
// AC1 — Redact PII at exactly 90 days
// ---------------------------------------------------------------------------

describe('AC1 — PII redaction at 90-day boundary', () => {

  test('T1: 90-day record has PII fields set to [REDACTED]', async () => {
    transcriptStore.save(makeRecord({ recordId: 'rec-90', createdAt: daysAgo(90) }));

    await enforceRetention();

    const record = transcriptStore.findById('rec-90');
    expect(record).not.toBeNull();
    expect(record.customerName).toBe('[REDACTED]');
    expect(record.accountNumber).toBe('[REDACTED]');
    expect(record.rawTranscript).toBe('[REDACTED]');
  });

  test('T2: 90-day record preserves all non-PII fields after redaction', async () => {
    const original = makeRecord({ recordId: 'rec-90b', createdAt: daysAgo(90) });
    transcriptStore.save(original);

    await enforceRetention();

    const record = transcriptStore.findById('rec-90b');
    expect(record.caseId).toBe('CASE-001');
    expect(record.agentId).toBe('AGENT-42');
    expect(record.callDate).toBe('2026-04-01');
    expect(record.durationSeconds).toBe(240);
    expect(record.sentimentScore).toBe(0.72);
    expect(record.recordId).toBe('rec-90b');
  });

  test('T3 (NFR-1 boundary): 89-day record is NOT modified', async () => {
    const original = makeRecord({ recordId: 'rec-89', createdAt: daysAgo(89) });
    transcriptStore.save(original);

    await enforceRetention();

    const record = transcriptStore.findById('rec-89');
    expect(record).not.toBeNull();
    expect(record.customerName).toBe('Jane Smith');
    expect(record.accountNumber).toBe('ACC-9876');
    expect(record.rawTranscript).toBe('Full call transcript text.');
  });

  test('NFR-1 boundary: 91-day record is redacted', async () => {
    transcriptStore.save(makeRecord({ recordId: 'rec-91', createdAt: daysAgo(91) }));

    await enforceRetention();

    const record = transcriptStore.findById('rec-91');
    expect(record.customerName).toBe('[REDACTED]');
    expect(record.accountNumber).toBe('[REDACTED]');
    expect(record.rawTranscript).toBe('[REDACTED]');
  });

});

// ---------------------------------------------------------------------------
// AC2 — Purge at 365 days
// ---------------------------------------------------------------------------

describe('AC2 — Record purge at 365-day boundary', () => {

  test('T4: 365-day record is deleted entirely', async () => {
    transcriptStore.save(makeRecord({ recordId: 'rec-365', createdAt: daysAgo(365) }));

    await enforceRetention();

    const record = transcriptStore.findById('rec-365');
    expect(record).toBeNull();
  });

  test('T5 (NFR-1 boundary): 364-day record is redacted but NOT deleted', async () => {
    transcriptStore.save(makeRecord({ recordId: 'rec-364', createdAt: daysAgo(364) }));

    await enforceRetention();

    const record = transcriptStore.findById('rec-364');
    expect(record).not.toBeNull();           // still exists
    expect(record.customerName).toBe('[REDACTED]');
    expect(record.accountNumber).toBe('[REDACTED]');
    expect(record.rawTranscript).toBe('[REDACTED]');
  });

  test('NFR-1 boundary: 366-day record is deleted entirely', async () => {
    transcriptStore.save(makeRecord({ recordId: 'rec-366', createdAt: daysAgo(366) }));

    await enforceRetention();

    expect(transcriptStore.findById('rec-366')).toBeNull();
  });

});

// ---------------------------------------------------------------------------
// AC3 — Audit log entries
// ---------------------------------------------------------------------------

describe('AC3 — Retention audit log', () => {

  test('T6: REDACTED action is logged for a 90-day record', async () => {
    transcriptStore.save(makeRecord({ recordId: 'rec-audit-r', createdAt: daysAgo(90) }));

    await enforceRetention();

    const entries = retentionAuditStore.findAll();
    const entry   = entries.find(e => e.recordId === 'rec-audit-r');
    expect(entry).toBeDefined();
    expect(entry.action).toBe('REDACTED');
    expect(typeof entry.timestamp).toBe('number');
    expect(entry.triggerAgeDays).toBe(90);
  });

  test('T7: PURGED action is logged for a 365-day record', async () => {
    transcriptStore.save(makeRecord({ recordId: 'rec-audit-p', createdAt: daysAgo(365) }));

    await enforceRetention();

    const entries = retentionAuditStore.findAll();
    const entry   = entries.find(e => e.recordId === 'rec-audit-p');
    expect(entry).toBeDefined();
    expect(entry.action).toBe('PURGED');
    expect(typeof entry.timestamp).toBe('number');
    expect(entry.triggerAgeDays).toBe(365);
  });

  test('T8: triggerAgeDays reflects actual record age, not the threshold', async () => {
    transcriptStore.save(makeRecord({ recordId: 'rec-audit-age', createdAt: daysAgo(120) }));

    await enforceRetention();

    const entries = retentionAuditStore.findAll();
    const entry   = entries.find(e => e.recordId === 'rec-audit-age');
    // triggerAgeDays must be the computed age (120), not the constant 90
    expect(entry.triggerAgeDays).toBe(120);
  });

  test('No audit entry written for untouched 89-day record', async () => {
    transcriptStore.save(makeRecord({ recordId: 'rec-no-audit', createdAt: daysAgo(89) }));

    await enforceRetention();

    const entries = retentionAuditStore.findAll();
    const entry   = entries.find(e => e.recordId === 'rec-no-audit');
    expect(entry).toBeUndefined();
  });

  test('A 365-day record produces exactly one audit entry (PURGED, not both)', async () => {
    transcriptStore.save(makeRecord({ recordId: 'rec-one-entry', createdAt: daysAgo(365) }));

    await enforceRetention();

    const entries = retentionAuditStore.findAll().filter(e => e.recordId === 'rec-one-entry');
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe('PURGED');
  });

  test('Multiple records each produce their own audit entry', async () => {
    transcriptStore.save(makeRecord({ recordId: 'multi-a', createdAt: daysAgo(90) }));
    transcriptStore.save(makeRecord({ recordId: 'multi-b', createdAt: daysAgo(365) }));
    transcriptStore.save(makeRecord({ recordId: 'multi-c', createdAt: daysAgo(89) }));  // untouched

    await enforceRetention();

    const entries = retentionAuditStore.findAll();
    const ids     = entries.map(e => e.recordId);
    expect(ids).toContain('multi-a');
    expect(ids).toContain('multi-b');
    expect(ids).not.toContain('multi-c');
  });

});
```

**Expected state after TASK 1:** All tests FAIL with `Cannot find module
'../../src/crm/transcript-retention'`. This is the required RED state.

---

### TASK 2 — GREEN: Implement `src/crm/transcript-retention.js`

Only after all tests are written and confirmed failing. The implementation must
make every test pass without modifying any test.

```js
'use strict';

const transcriptStore     = require('./transcript-store');
const retentionAuditStore = require('./retention-audit-store');

// ---------------------------------------------------------------------------
// C4 — Privacy Act 2020 (PIA-2026-14)
// HARD LEGAL CONSTANTS — DO NOT make configurable.
// Any change to these values requires a new PIA sign-off.
// ---------------------------------------------------------------------------
const REDACT_AFTER_DAYS = 90;
const PURGE_AFTER_DAYS  = 365;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const PII_FIELDS = ['customerName', 'accountNumber', 'rawTranscript'];
const REDACTED   = '[REDACTED]';

/**
 * Computes the age of a record in whole days (floor), based on its createdAt
 * timestamp and the current wall-clock time.
 *
 * @param {number} createdAt - Unix timestamp (ms) of record creation.
 * @returns {number} Age in whole days.
 */
function computeAgeDays(createdAt) {
  return Math.floor((Date.now() - createdAt) / MS_PER_DAY);
}

/**
 * Writes a retention audit entry for a record that was acted upon.
 *
 * @param {string} recordId
 * @param {'REDACTED'|'PURGED'} action
 * @param {number} ageDays - Actual computed age of the record in days.
 */
function writeAuditEntry(recordId, action, ageDays) {
  retentionAuditStore.append({
    recordId,
    action,
    timestamp:      Date.now(),
    triggerAgeDays: ageDays,
  });
}

/**
 * Enforces the PII retention policy across all transcript records.
 *
 * Rules (C4 — Privacy Act 2020):
 *   - Records >= PURGE_AFTER_DAYS (365): purged (deleted) entirely.
 *   - Records >= REDACT_AFTER_DAYS (90) but < PURGE_AFTER_DAYS: PII redacted.
 *   - Records < REDACT_AFTER_DAYS (90): untouched.
 *
 * An audit entry is written for every record acted upon (REDACTED or PURGED).
 * No audit entry is written for untouched records.
 *
 * Scheduling/cron wiring is out of scope — this function is exported for the
 * job runner (crm.5) to invoke.
 *
 * @returns {Promise<void>}
 */
async function enforceRetention() {
  const records = transcriptStore.findAll();

  for (const record of records) {
    const ageDays = computeAgeDays(record.createdAt);

    if (ageDays >= PURGE_AFTER_DAYS) {
      // Purge path: delete the record entirely, then log PURGED.
      transcriptStore.remove(record.recordId);
      writeAuditEntry(record.recordId, 'PURGED', ageDays);

    } else if (ageDays >= REDACT_AFTER_DAYS) {
      // Redact path: overwrite PII fields only; preserve non-PII fields.
      const redactedFields = {};
      for (const field of PII_FIELDS) {
        redactedFields[field] = REDACTED;
      }
      transcriptStore.update(record.recordId, redactedFields);
      writeAuditEntry(record.recordId, 'REDACTED', ageDays);

    }
    // else: record is < 90 days old — no action, no audit entry.
  }
}

module.exports = { enforceRetention };
```

**Expected state after TASK 2:** All tests PASS (GREEN).

---

### TASK 3 — Update `src/crm/retention-audit-store.js` stub (if required)

The existing stub is described as having `append` and `findAll`. The tests also
rely on a `__reset()` method for test isolation. If the stub does not already
expose `__reset`, it must be added. This is the **only permitted change** to an
existing file.

```js
// src/crm/retention-audit-store.js  — add __reset if not already present
'use strict';

let auditEntries = [];

function append(entry) {
  auditEntries.push({ ...entry });
}

function findAll() {
  return [...auditEntries];
}

/** Test-only helper — resets in-memory state between tests. */
function __reset() {
  auditEntries = [];
}

module.exports = { append, findAll, __reset };
```

> **Note:** If the codebase uses a database-backed audit store rather than an
> in-memory array, `__reset` should instead truncate the test table or use a
> transaction rollback. The principle — full isolation between tests — is
> identical.

---

### TASK 4 — REFACTOR (if needed, no behaviour change)

After all tests are GREEN, inspect for any readability or maintainability
improvements without altering logic:

- Confirm constants are at module top-level with clear Legal comments.
- Confirm `PII_FIELDS` list matches `transcript-store.js` exported `PII_FIELDS`
  (they should be identical — consider importing from the store to avoid drift).
- Confirm `enforceRetention` JSDoc is accurate.
- No logic changes permitted during refactor.

**Refactor option — import PII_FIELDS from the store (preferred):**

```js
// Replace local PII_FIELDS declaration with:
const { PII_FIELDS } = require('./transcript-store');
```

This ensures the authoritative list of PII fields lives in one place and
`transcript-retention.js` cannot drift out of sync with the store's own
`PII_FIELDS` export.

---

## Boundary Condition Matrix (NFR-1)

| Age (days) | Threshold hit | Expected action | Audit entry |
|-----------|---------------|-----------------|-------------|
| 89        | None          | Untouched        | None        |
| 90        | REDACT_AFTER_DAYS | Redacted    | REDACTED    |
| 91        | REDACT_AFTER_DAYS | Redacted    | REDACTED    |
| 364       | REDACT_AFTER_DAYS | Redacted    | REDACTED    |
| 365       | PURGE_AFTER_DAYS  | Purged      | PURGED      |
| 366       | PURGE_AFTER_DAYS  | Purged      | PURGED      |

All six boundaries are covered by explicit tests in TASK 1.

---

## AC ↔ Task Traceability

| AC / NFR | Tests | Task covering test | Task covering impl |
|----------|-------|--------------------|--------------------|
| AC1 — Redact at 90 days | T1, T2, T3 | TASK 1 | TASK 2 |
| AC2 — Purge at 365 days | T4, T5 | TASK 1 | TASK 2 |
| AC3 — Audit log | T6, T7, T8 | TASK 1 | TASK 2 |
| NFR-1 — Boundaries (89/90/91/364/365/366) | T3 + 5 boundary tests | TASK 1 | TASK 2 |

---

## Out of Scope (confirmed)

- Scheduling / cron wiring → crm.5
- Privacy Commissioner consent workflow
- CRM attachment redaction
- Configurable retention thresholds (C4 prohibits this)
- Azure DPA integration
- Real-time transcription changes

---

## Definition of Done Checklist

- [ ] `tests/crm/transcript-retention.test.js` created and committed before
      `src/crm/transcript-retention.js`
- [ ] All tests pass (`npm test`)
- [ ] `REDACT_AFTER_DAYS = 90` and `PURGE_AFTER_DAYS = 365` are compiled-in
      constants, not parameters
- [ ] All six boundary ages (89/90/91/364/365/366) are explicitly tested
- [ ] Audit entries written with correct shape: `{ recordId, action, timestamp,
      triggerAgeDays }`
- [ ] `triggerAgeDays` is the actual record age, not the threshold constant
- [ ] No scheduling code added (scope boundary)
- [ ] No modifications to `transcript-store.js`
- [ ] Compliance officer review requested on PR
- [ ] PR description references PIA-2026-14 and C4
```