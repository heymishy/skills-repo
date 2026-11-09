# Incident record mechanism — Implementation Plan

> **For agent execution:** Executed directly via `/tdd` in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/itar-s1-incident-record-mechanism`
**Worktree:** `.worktrees/itar-s1`
**Test command:** `node scripts/run-all-tests.js` (auto-discovers `tests/check-*.js`)

---

## File map

```
Create:
  scripts/lib/incident-store.js        — createIncidentRecord + appendIncidentRecord + MAX_TAG_FIELD_LENGTH + IncidentTagFieldTooLongError
  tests/check-itar-s1-incident-store.js — unit + integration tests for all 4 ACs + the audit NFR
```

No existing files are modified. `workspace/incidents.json` is created at runtime by the integration tests against a temp fixture path, and will exist as a real git-tracked file once the store is exercised against the real path (not committed empty by this plan — AC2 creates it on first real write).

---

## Task 1: Incident record creation (AC1, AC3)

**Files:**
- Create: `scripts/lib/incident-store.js`
- Test: `tests/check-itar-s1-incident-store.js`

- [x] **Step 1: Write the failing tests** — `createIncidentRecord_generatesUniqueId_whenCalled`, `createIncidentRecord_setsStatusOpenAndEmptyPriorLinks_byDefault`, `createIncidentRecord_capturesTriggerFreeText_verbatim`, `createIncidentRecord_rejectsTagsOverBoundedLength_whenSummaryExceedsLimit`, `normalizeIncidentTags_trimsWhitespaceAndLowercases_beforeStorage` (test plan Unit Tests section, verbatim).
- [x] **Step 2: Run — must fail** (`scripts/lib/incident-store.js` does not exist yet): `MODULE_NOT_FOUND`.
- [x] **Step 3: Write minimal implementation** — `createIncidentRecord(input)`: generates `id` via `crypto.randomUUID()`, normalizes `tags` (trim + lowercase each), enforces `MAX_TAG_FIELD_LENGTH` (exported constant) on the joined tags string, throws `IncidentTagFieldTooLongError` (named error class) if exceeded, defaults `status: 'open'`, `priorIncidentLinks: []`, sets `createdAt`/`updatedAt` to the same ISO timestamp.
- [x] **Step 4: Run — must pass.**
- [x] **Step 5: Run full suite — no regressions.**
- [x] **Step 6: Commit** — `feat(itar-s1): add createIncidentRecord with normalization and bounded-length validation`

## Task 2: Append-only persistence (AC2)

**Files:**
- Modify: `scripts/lib/incident-store.js` (add `appendIncidentRecord`)
- Test: `tests/check-itar-s1-incident-store.js` (add integration tests)

- [x] **Step 1: Write the failing tests** — `appendIncidentRecord_addsToFile_withoutTruncatingExistingRecords`, `appendIncidentRecord_createsFile_whenIncidentsJsonDoesNotExistYet`, both against a temp fixture path (never the real `workspace/incidents.json`).
- [x] **Step 2: Run — must fail.**
- [x] **Step 3: Write minimal implementation** — `appendIncidentRecord(record, filePath)`: reads existing array via `fs.readFileSync`/`JSON.parse` if the file exists, else starts with `[]`; pushes the new record; writes back via `fs.writeFileSync`.
- [x] **Step 4: Run — must pass.**
- [x] **Step 5: Run full suite — no regressions.**
- [x] **Step 6: Commit** — `feat(itar-s1): add append-only incidents.json persistence`

## Task 3: Real-fixture migration proof (AC4)

**Files:**
- Test: `tests/check-itar-s1-incident-store.js` (add integration test)

- [x] **Step 1: Write the failing test** — `migrateProductionErrorInvestigation_createsRealRecord_fromCaptureLogFinding`, using the real transcribed fixture from `workspace/capture-log.md`'s 2026-10-07 `productionErrorInvestigation` entry.
- [x] **Step 2: Run — must fail** (fails naturally alongside Task 1/2 until those land; written last here since it composes both).
- [x] **Step 3: No new implementation needed** — this AC is proven by composing `createIncidentRecord` + `appendIncidentRecord` against real content, not new code.
- [x] **Step 4: Run — must pass.**
- [x] **Step 5: Run full suite — no regressions.**
- [x] **Step 6: Commit** — `test(itar-s1): migrate real productionErrorInvestigation finding as AC4 proof`

## Task 4: Audit NFR (createdAt/updatedAt)

**Files:**
- Test: `tests/check-itar-s1-incident-store.js` (add NFR test)

- [x] **Step 1: Write the failing test** — `NFR_AUDIT_1_createdAtAndUpdatedAt_setAndEqualAtCreation`.
- [x] **Step 2: Run — must fail** (trivially passes once Task 1 lands; written as its own named test per the test plan's NFR section, not folded into Task 1's tests).
- [x] **Step 3: No new implementation needed** — already satisfied by Task 1.
- [x] **Step 4: Run — must pass.**
- [x] **Step 5: Run full suite — no regressions.**
- [x] **Step 6: Commit** — folded into Task 1's commit (same behaviour, named separately only for AC-to-test traceability in the test plan).
