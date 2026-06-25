# Test Plan — sdg.2: Reference file persistence in journey state

**Story:** artefacts/2026-06-04-strategy-data-grounding/definition.md (Story sdg.2)
**Feature:** 2026-06-21-strategy-and-data-hub
**Review:** artefacts/2026-06-21-strategy-and-data-hub/review.md — PASS (2026-06-21)
**Date:** 2026-06-26
**Test runner (unit):** `node tests/check-sdg2-journey-persistence.js`
**Test runner (E2E):** `npx playwright test tests/e2e/reference-upload-persistence.spec.js`

---

## Test Data Strategy

**Unit tests:** Synthetic — tests call the journey state module directly with crafted inputs. Journey state objects are constructed in-memory; no real session store is written during unit tests.

**E2E tests:** Playwright against the locally-running dev server. Uses the same `test-sdg1-upload-e2e` fixture feature from sdg.1, with the server restarted (or session cleared) between test groups to exercise the resume-from-interruption path.

**Data owner:** Self-contained. No external data sources. In-memory fixtures and Playwright session storage cleared after each test.

**PCI/sensitivity:** None.

---

## AC Coverage Table

| AC | Test(s) | Type | Gap |
|----|---------|------|-----|
| AC1 — Journey state records `referenceFiles` array after upload | T1, T2 | Unit | None |
| AC2 — `buildSystemPrompt()` receives `context.referenceFiles` parameter | T3, T4 | Unit | None |
| AC3 — Journey resume preserves referenceFiles after session interruption | T5, T9 | Unit + E2E | None |
| AC4 — Re-upload updates journey state (new list replaces old) | T6, T10 | Unit + E2E | None |
| AC5 — Multiple files tracked independently with distinct entries | T7 | Unit | None |
| NFR-ATOMIC — File write and journey state update succeed or fail together | T8 | Unit | None |
| NFR-SHAPE — referenceFiles entries use consistent object shape across code paths | T2, T7 | Unit | None |

---

## Unit Tests

Test file: `tests/check-sdg2-journey-persistence.js`

All tests must **FAIL** before implementation (journey state persistence module does not exist yet).

**T1 — `journey-state-records-reference-files-after-upload`** (AC1)
- Action: call the journey state update function with a completed upload result: `updateJourneyReferenceFiles(journeyState, [{ path: 'artefacts/test-feat/reference/strategy.md', sizeBytes: 1200 }])`
- Expected: `journeyState.referenceFiles` is an array of length 1; entry has `path`, `uploadedAt` (ISO 8601 string), and `sizeBytes` fields
- Currently: FAIL — function does not exist

**T2 — `reference-files-entry-has-required-shape`** (AC1, NFR-SHAPE)
- Action: call `updateJourneyReferenceFiles` with a single file; inspect resulting entry
- Expected: entry shape exactly `{ path: string, uploadedAt: string, sizeBytes: number }` — no extra fields, no missing fields; `uploadedAt` parses as a valid Date
- Currently: FAIL

**T3 — `build-system-prompt-receives-reference-files-parameter`** (AC2)
- Action: call `buildSystemPrompt('ideate', repoPath, webUiConfig, { priorArtefacts: [], referenceFiles: [{ path: 'artefacts/test-feat/reference/strategy.md', uploadedAt: '2026-06-26T00:00:00Z', sizeBytes: 500 }] })`
- Expected: function accepts the call without error; does not throw on `referenceFiles` parameter presence
- Currently: FAIL — `buildSystemPrompt` does not accept `referenceFiles` parameter

**T4 — `build-system-prompt-without-reference-files-does-not-throw`** (AC2 regression)
- Action: call `buildSystemPrompt('ideate', repoPath, webUiConfig, { priorArtefacts: [] })` (no `referenceFiles` key)
- Expected: function completes normally; returns a non-empty string; does not throw
- Note: regression guard — ensures the added parameter is optional (existing callers without `referenceFiles` must not break)
- Currently: PASS or FAIL depending on whether `buildSystemPrompt` exists — confirm at implementation time

**T5 — `journey-state-preserves-reference-files-on-serialise-deserialise`** (AC3)
- Action: build a journeyState with `referenceFiles` set; serialise to JSON (as a session store would); deserialise back; check referenceFiles intact
- Expected: `JSON.parse(JSON.stringify(journeyState)).referenceFiles` deep-equals the original array
- Currently: FAIL — no journey state module exists

**T6 — `re-upload-replaces-previous-reference-files-list`** (AC4)
- Action: call `updateJourneyReferenceFiles(journeyState, [fileA])`; then call `updateJourneyReferenceFiles(journeyState, [fileB])`
- Expected: `journeyState.referenceFiles` contains only fileB (not both); length is 1
- Currently: FAIL

**T7 — `multiple-files-tracked-as-independent-entries`** (AC5, NFR-SHAPE)
- Action: call `updateJourneyReferenceFiles(journeyState, [fileA, fileB, fileC])` with three distinct files
- Expected: `journeyState.referenceFiles.length === 3`; each entry has a distinct `path`; no aggregation or deduplication
- Currently: FAIL

**T8 — `atomic-failure-does-not-leave-orphaned-state`** (NFR-ATOMIC)
- Action: simulate a write failure mid-way (mock `fs.writeFileSync` to throw after the first call); call the upload-and-persist handler; check journey state
- Expected: if the file write fails, `journeyState.referenceFiles` is NOT updated (still empty or prior value); no orphaned partial state
- Currently: FAIL

---

## E2E Tests (Playwright)

Test file: `tests/e2e/reference-upload-persistence.spec.js`

**T9 — `journey-resume-preserves-reference-files`** (AC3)
- Action: complete a file upload (T13 from sdg.1 E2E); reload the page (simulating session interruption / browser close + reopen at same journey URL); check that the reference files are still listed in the UI or confirmed via session API
- Expected: UI shows previously uploaded file(s) OR GET `/api/session` returns `referenceFiles` array unchanged; journey continues from the last gate without requiring re-upload
- Currently: FAIL — no persistence layer exists

**T10 — `re-upload-updates-session-reference-files`** (AC4)
- Action: upload `strategy-v1.md`; navigate backward to the upload gate; upload `strategy-v2.md`; check session state
- Expected: `session.referenceFiles` contains only `strategy-v2.md`'s entry; `strategy-v1.md` is no longer in the referenceFiles array (though the file itself is still on disk — immutable per out-of-scope)
- Currently: FAIL

---

## NFR Tests

NFR-ATOMIC is covered by T8. NFR-SHAPE is covered by T2 and T7.

The atomicity requirement (T8) is the most critical NFR here — if the file write succeeds but the journey state update fails (or vice versa), the journey will show no reference files even though files exist on disk, causing silent data loss for the operator. The mock-fs failure test in T8 verifies the rollback path.

---

## Gap Table

| Gap | AC | Accepted? | Mitigation |
|-----|-----|-----------|------------|
| Session interruption via hard kill (process restart) | AC3 | ✅ Accepted — page reload is sufficient for MVP | T9 covers page reload; true persistence across process restarts depends on session store config |
| Prior files remain on disk after re-upload (AC4 clause) | AC4 | ✅ Accepted | No test needed for disk immutability — the write in sdg.1 never deletes prior files; this is an out-of-scope invariant |

---

## Integration Tests

No separate integration test file. T9 and T10 (E2E) serve as the integration layer — they exercise the full chain from upload handler (sdg.1) through journey state update (sdg.2) as a user would.

---

## Test count summary

| Type | Count |
|------|-------|
| Unit (must fail before impl) | 7 |
| Unit (regression guard — confirm at impl time) | 1 |
| E2E / Playwright (must fail before impl) | 2 |
| **Total** | **10** |
| Integration | 0 (covered by T9 + T10) |
