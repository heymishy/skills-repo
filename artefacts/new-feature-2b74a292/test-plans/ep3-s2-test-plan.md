# Test Plan: Auto-Generate decisions.md Entry on Regression (ep3-s2)

**Story reference:** artefacts/new-feature-2b74a292/stories/ep3-s2.md
**Epic reference:** artefacts/new-feature-2b74a292/epics/reversibility-audit-trail.md
**Domain:** software-engineering
**Date:** 2026-09-16

---

## User Story
As an **Audit / compliance (implicit; entry is auto-generated)**,
I want **every regression to be automatically documented with who, why, and when**,
So that **there's a durable, auditable record without relying on someone remembering to write it manually**.

---

## Acceptance Criteria

**AC1:** Given Susan requests a regression (ep3-s1), When the regression is processed, Then a new entry is appended to artefacts/[feature]/decisions.md.

**AC2:** Given the entry has been appended, When it is inspected, Then it contains date, session-phase: regression, decision, reason, actor, and stageReverted fields, all populated from the actual regression request (not placeholders).

**AC3:** Given the regression has just completed, When decisions.md is read from disk, Then the new entry is present within 2 seconds of the regression completing — no delayed/batched write.

---

## Test Data Strategy

**Strategy selected:** Synthetic — test data generated in test setup, no real data involved.

**Test data approach:**
- Fixture feature: Feature A1 with `featureId = 'feat-a1-uuid'`, `tenantId = 'tenant-test-123'`, current stage: "dor"
- Fixture regression request: `{ targetStage: 'definition', reason: 'Definition needs revision', userId: 'user-susan' }`
- Fixture decisions.md: empty or containing only prior entries
- No production data required; all test data is synthetic and disposable post-test
- Filesystem: test instance with writable `artefacts/` directory

**Sensitivity assessment:** Not applicable — no PCI, PHI, or sensitive data involved.

---

## AC Coverage & Test Approach

| AC | Test type | Coverage | Gap? |
|----|-----------|----------|------|
| AC1 | Unit + integration | Entry appended to decisions.md on regression | No |
| AC2 | Unit + integration | All required fields present and populated correctly | No |
| AC3 | Integration + performance | Disk write completes within 2s | No |

**Gap table:** None — all ACs have corresponding tests.

---

## Unit Tests

### AC1: Entry Appended to decisions.md

**Test name:** `regression.dod.entry-appended-to-decisions`

**What it tests:** AC1 — when regression is processed, a new entry is appended to decisions.md.

**Setup:**
- Fixture feature A1 with `featureId = 'feat-a1-uuid'`, `tenantId = 'tenant-test-123'`
- Fixture decisions.md exists with 1 prior entry
- Regression request prepared: `{ targetStage: 'definition', reason: 'Definition needs revision', userId: 'user-susan', timestamp: [ISO8601] }`

**Action:**
- Call regression handler with the prepared request
- Wait for completion (up to 2s)
- Read decisions.md from disk
- Count total entries

**Expected result:**
- decisions.md now contains 2 entries (prior entry + new regression entry)
- Entry count increased by exactly 1
- Prior entry is unmodified

---

### AC2a: Entry Has All Required Fields

**Test name:** `regression.dod.entry-fields-complete`

**What it tests:** AC2 (part 1) — new entry contains all required fields (date, session-phase, decision, reason, actor, stageReverted), all populated from the request.

**Setup:**
- Fixture as in AC1
- Regression request: `{ targetStage: 'definition', reason: 'Definition needs revision', userId: 'user-susan', timestamp: '2026-09-16T14:23:00Z' }`

**Action:**
- Call regression handler
- Read decisions.md
- Parse the new (last) entry
- Inspect each field

**Expected result:**
- `date: 2026-09-16`
- `session-phase: regression`
- `decision: Regress to definition` (or similar; the key is that `decision` field exists and is non-placeholder)
- `reason: Definition needs revision` (exact match from request)
- `actor: Susan (engineer)` (user identity + role)
- `stageReverted: definition` (exact match from targetStage)
- No placeholder values like "[TBD]", "[FILL IN]", or null

---

### AC2b: Entry Fields Are Not Placeholders

**Test name:** `regression.dod.entry-fields-not-placeholder`

**What it tests:** AC2 (part 2) — all fields contain real values, not template placeholders or default stubs.

**Setup:**
- Fixture as in AC1
- Regression request prepared

**Action:**
- Call regression handler
- Read decisions.md
- Parse new entry
- Check each field against a placeholder pattern list

**Expected result:**
- No field matches patterns: `[TBD]`, `[FILL IN]`, `TBD`, `TBD`, `null`, `undefined`, `""` (empty string)
- `date` is a valid ISO8601 date
- `reason` is the exact reason from the request (length > 5 characters, per story NFRs)
- `actor` contains a real username

---

### AC3: Disk Write Completes Within 2s

**Test name:** `regression.dod.disk-write-latency-under-2s`

**Setup:** Feature A1 at DoR stage; regression request prepared.

**Action:** 
- Note start time
- Call regression handler
- Note completion time (when handler returns and decisions.md has been written)
- Calculate elapsed time

**Expected result:** ≤2s

---

## Integration Tests

### Full Regression → decisions.md Entry Flow

**Test name:** `regression.integration.regression-and-dod-entry-end-to-end`

**What it tests:** Complete flow — regression is processed, decisions.md entry is written, and both the regression state change and the entry are consistent.

**Setup:**
- Feature A1 at DoR stage
- Fixture decisions.md exists
- Regression request: `{ targetStage: 'definition', reason: 'Definition needs revision', userId: 'user-susan' }`

**Action:**
1. Call regression handler
2. Wait for completion (up to 2s)
3. Query feature.stage
4. Read decisions.md
5. Parse new entry
6. Cross-check: entry's `stageReverted` matches the feature's new stage

**Expected result:**
- feature.stage = "definition" (regressed)
- decisions.md has a new entry with stageReverted: "definition"
- Entry's `reason`, `actor`, `date` are all correct
- No errors in logs

---

### Regression Entry Does Not Overwrite Prior Entry

**Test name:** `regression.integration.prior-entry-preserved`

**What it tests:** Entry is appended; prior entries are not modified or deleted.

**Setup:**
- Fixture decisions.md with 2 prior entries (e.g. from discovery approval and DoR approval)
- Regression request prepared

**Action:**
1. Read decisions.md before regression
2. Store prior entries (count + content hash)
3. Call regression handler
4. Read decisions.md after regression
5. Re-parse prior entries
6. Compare content hash

**Expected result:**
- Prior entries remain unchanged (same content, same count, same order)
- New entry appears at the end
- Total entry count increased by 1

---

### Tenant Isolation on decisions.md Write

**Test name:** `regression.integration.tenant-isolation-dod-write`

**What it tests:** ADR-025 — regression entry for Tenant A does not leak into Tenant B's decisions.md.

**Setup:**
- Tenant A: Feature A1 at DoR stage, decisions.md with 1 entry
- Tenant B: Feature A1 (same slug, different tenant) at DoR stage, decisions.md with 1 entry
- Regression request for Tenant A only

**Action:**
1. Call regression handler for Tenant A's Feature A1
2. Wait for completion
3. Read Tenant A's decisions.md
4. Read Tenant B's decisions.md
5. Count entries in each

**Expected result:**
- Tenant A's decisions.md has 2 entries (prior + new regression)
- Tenant B's decisions.md still has 1 entry (unchanged)
- Regression entry appears only in Tenant A's file

---

## E2E Tests (Browser)

### AC1 + AC2: Regression Triggers Entry Write (E2E)

**Test name:** `regression.e2e.regression-triggers-dod-entry`

**Setup:**
- Auth bypass fixture (NODE_ENV=test) with Susan's session
- Feature A1 loaded in browser at DoR stage
- decisions.md pre-populated with 1 entry (visible in a read panel if available)

**Action:**
1. Open regression modal (per ep3-s1 E2E)
2. Select "definition" from dropdown
3. Type reason: "Definition missing architecture details"
4. Click "Submit"
5. Wait up to 2s for modal to close
6. (Operator-only) Read decisions.md from disk to verify new entry

**Expected result:**
- Modal closes after submission
- Feature page updates to show stage = "definition"
- (Operator verification) decisions.md contains a new entry with all required fields

---

### AC3: Entry Present Within 2s (E2E)

**Test name:** `regression.e2e.dod-entry-within-2s`

**Setup:**
- Auth bypass fixture, Feature A1 at DoR stage, decisions.md with 1 prior entry
- Start timer (client-side JavaScript or test runner)

**Action:**
1. Trigger regression (submit modal)
2. Wait for completion
3. (Operator) read decisions.md immediately
4. Check timestamp of write

**Expected result:**
- Operator can confirm new entry is present
- Total elapsed time from submit to confirmation is ≤2s

---

## NFR Tests

### NFR-Perf-1: Disk Write Within 2 Seconds

**Test name:** `regression.nfr.dod-write-latency-under-2s`

**Setup:** Feature A1 at DoR stage; regression request ready to submit.

**Action:** Submit regression request; measure elapsed time from submission to completion (when handler returns and decisions.md has been flushed to disk).

**Expected result:** ≤2s

---

### NFR-Completeness: All Required Fields Present

**Test name:** `regression.nfr.dod-entry-required-fields-present`

**Setup:** Feature A1; regression processed; decisions.md written.

**Action:** Parse the new entry; inspect for presence of: date, session-phase, decision, reason, actor, stageReverted.

**Expected result:** All 6 fields are present and non-empty.

---

## Test Summary

- **Unit tests:** 3 (AC1 entry appended, AC2a fields complete, AC2b no placeholders, AC3 latency ≤2s)
- **Integration tests:** 3 (full flow end-to-end, prior entries preserved, tenant isolation)
- **E2E tests:** 2 (entry written on regression, entry within 2s)
- **NFR tests:** 2 (latency, field completeness)
- **Total:** 10 tests
- **All ACs covered:** Yes
- **Test data gaps:** None
- **Gaps in AC coverage:** None

---

# AC Verification Script: Auto-Generate decisions.md Entry on Regression (ep3-s2)

**Setup:** Susan has regressed Feature A1 from DoR back to definition (per ep3-s1 completion). The regression is complete, the feature's stage is now "definition", and all downstream stages are marked incomplete. You now want to verify that decisions.md has been updated automatically.

---

### Scenario AC1: New Entry Appended to decisions.md

**Expected outcome:** A new entry appears in decisions.md after the regression completes.

1. Navigate to the feature's artefacts folder: `artefacts/new-feature-2b74a292/` (or equivalent feature slug).
2. Open `decisions.md` in a text editor.
3. **Verify:** The file contains at least 2 entries — the original entries from discovery/approval, plus a new entry at the bottom.
4. **Verify:** The new entry is the last (most recent) entry in the file, not inserted in the middle.

---

### Scenario AC2: Entry Contains All Required Fields

**Expected outcome:** The new entry has all required fields populated with real values from the regression request.

1. From Scenario AC1, locate the newest (bottom-most) entry in decisions.md.
2. **Verify:** The entry contains these fields:
   - `date: [YYYY-MM-DD]` — today's date
   - `session-phase: regression` — exactly this value
   - `decision: Regress to definition` (or similar clear decision statement) — NOT "[TBD]" or blank
   - `reason: [the exact reason Susan entered]` — e.g. "Definition is missing architecture details for multi-tenancy"
   - `actor: Susan (engineer)` — the authenticated user's name and role
   - `stageReverted: definition` — the target stage of the regression
3. **Verify:** No field is empty, null, or a placeholder like "[FILL IN]".

---

### Scenario AC3: Entry Written to Disk Within 2 Seconds

**Expected outcome:** The entry is present in decisions.md immediately after the regression completes, with no delay.

1. Note the time when Susan clicks "Submit" on the regression modal.
2. Wait for the modal to close (should be within 1s per ep3-s1 NFR).
3. **Immediately** (within 2 seconds total) open decisions.md and confirm the new entry is present.
4. **Verify:** The timestamp in the entry (if visible) is close to the submit time (within the 2s window).

---