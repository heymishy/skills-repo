# Test Plan — sdg.1: Reference upload modal UI

**Story:** artefacts/2026-06-04-strategy-data-grounding/definition.md (Story sdg.1)
**Feature:** 2026-06-21-strategy-and-data-hub
**Review:** artefacts/2026-06-21-strategy-and-data-hub/review.md — PASS (2026-06-21)
**Date:** 2026-06-26
**Test runner (unit):** `node tests/check-sdg1-reference-upload.js`
**Test runner (E2E):** `npx playwright test tests/e2e/reference-upload.spec.js`

---

## Test Data Strategy

**Unit tests:** Synthetic — tests call the validation module directly with crafted inputs (valid/invalid filenames, sizes, encodings). File system operations are tested via temp directories; no real artefact directories are written to during unit tests.

**E2E tests:** Playwright against the locally-running dev server. A fixed test feature slug (`test-sdg1-upload-e2e`) is used so reference files land in `artefacts/test-sdg1-upload-e2e/reference/` and can be cleaned up after the test run.

**Data owner:** Self-contained — no external data sources. Temp dirs and E2E fixtures are created and cleaned up within each test.

**PCI/sensitivity:** None — no personal or sensitive data.

---

## AC Coverage Table

| AC | Test(s) | Type | Gap |
|----|---------|------|-----|
| AC1 — Upload gate appears after new-product selection | T9 | E2E | None |
| AC2 — Modal displays file input (`accept=".md"`) and instructions | T10, T11 | E2E | None |
| AC3 — File validation: extension, size, encoding; invalid rejected with message | T2, T3, T4, T12 | Unit + E2E | None |
| AC4 — Files written to `artefacts/[slug]/reference/[filename]` | T5, T13 | Unit + E2E | None |
| AC5 — Skip closes modal and journey continues without error | T14 | E2E | None |
| AC6 — Reference files recorded in `session.referenceFiles` | T6, T15 | Unit + E2E | None |
| NFR-ACCESS — File input has ARIA label; error messages are accessible | T11 | E2E | None |
| NFR-SEC — Path traversal in filename rejected with HTTP 400 | T7 | Unit | None |
| NFR-MULTI — Invalid file does not block valid files in same batch | T8 | Unit | None |

---

## Unit Tests

Test file: `tests/check-sdg1-reference-upload.js`

All tests must **FAIL** before implementation (no upload handler or validation module exists yet).

**T1 — `upload-handler-module-exists`** (infrastructure)
- Precondition: none
- Action: require `src/web-ui/routes/upload.js` (or the handler extracted from `routes/skills.js`)
- Expected: module loads without error
- Currently: FAIL — file does not exist

**T2 — `validation-rejects-non-md-extension`** (AC3)
- Action: call `validateReferenceFile({ name: 'strategy.xlsx', size: 1000, content: Buffer.from('hello') })` from the validation module
- Expected: returns `{ valid: false, error: '"strategy.xlsx" is not a valid markdown file' }` (or similar message containing the filename and "not a valid markdown file")
- Currently: FAIL — module does not exist

**T3 — `validation-rejects-file-exceeding-1mb`** (AC3)
- Action: call `validateReferenceFile({ name: 'big.md', size: 1_048_577, content: Buffer.alloc(1_048_577) })`
- Expected: returns `{ valid: false, error: ... }` with message indicating size limit
- Currently: FAIL

**T4 — `validation-rejects-non-utf8-content`** (AC3)
- Action: call `validateReferenceFile({ name: 'binary.md', size: 10, content: Buffer.from([0x80, 0x81, 0x82]) })`
- Expected: returns `{ valid: false, error: ... }` with message indicating encoding rejection
- Currently: FAIL

**T5 — `valid-file-written-to-reference-directory`** (AC4)
- Action: create a temp dir, call the file-write helper with `{ featureSlug: 'test-feature', filename: 'strategy.md', content: '# Strategy\n\nContent.' }`, verify file exists at `<tmpDir>/artefacts/test-feature/reference/strategy.md` with correct content
- Expected: file created, content matches
- Currently: FAIL — write helper does not exist

**T6 — `session-reference-files-populated-after-upload`** (AC6)
- Action: simulate a successful upload call; check that `session.referenceFiles` is set to an array containing `{ path: 'artefacts/test-feature/reference/strategy.md', uploadedAt: <ISO string>, sizeBytes: <number> }`
- Expected: array present, first entry has all three fields
- Currently: FAIL

**T7 — `path-traversal-filename-rejected-with-400`** (NFR-SEC)
- Action: POST to `/api/reference-upload` (or equivalent route) with a filename of `../../etc/passwd.md`; assert HTTP 400 response
- Expected: HTTP 400, no file written to disk
- Note: CLAUDE.md requires `path.resolve(inputPath).startsWith(repoRoot + path.sep)` guard on all route handlers that write user-supplied paths to disk
- Currently: FAIL — route does not exist

**T8 — `invalid-file-does-not-block-valid-files`** (NFR-MULTI)
- Action: call the validation/write handler with a batch of two files: `[{ name: 'good.md', size: 500, content: Buffer.from('# Good') }, { name: 'bad.xlsx', size: 500, content: Buffer.from('not md') }]`
- Expected: `good.md` is written successfully; `bad.xlsx` returns validation error; no thrown exception
- Currently: FAIL

---

## E2E Tests (Playwright)

Test file: `tests/e2e/reference-upload.spec.js`

All E2E tests require the dev server running with auth fixture (see `tests/e2e/fixtures/auth.js`). All must **FAIL** before implementation.

**T9 — `new-product-selection-shows-strategy-grounding-gate`** (AC1)
- Action: navigate to journey start gate; select "new product"
- Expected: a follow-up gate appears asking about strategy grounding ("Would you like to ground this work in strategy or data?" or similar); page contains visible "Yes" and "Skip" options
- Currently: FAIL — journey flow has no strategy grounding gate

**T10 — `strategy-grounding-modal-shows-file-input-with-md-accept`** (AC2)
- Action: navigate past AC1 gate, select "yes" to strategy grounding
- Expected: modal visible; `input[type="file"]` present with `accept=".md"` attribute; instructions text visible matching `/upload.*markdown.*strategy|markdown.*files.*containing/i`
- Currently: FAIL

**T11 — `file-input-has-aria-label-and-error-messages-are-accessible`** (AC2, NFR-ACCESS)
- Action: open reference upload modal
- Expected: `input[type="file"]` has `aria-label` attribute (not empty); error message container has `role="alert"` or `aria-live="polite"` attribute
- Currently: FAIL

**T12 — `invalid-file-upload-shows-per-file-error-message`** (AC3)
- Action: open modal; attach a file named `strategy.xlsx` (or a `.md` file with `size > 1MB`); click "Upload"
- Expected: error message appears matching `/"strategy.xlsx" is not a valid markdown file|not a valid markdown/i`; modal remains open
- Currently: FAIL

**T13 — `valid-file-upload-writes-file-and-closes-modal`** (AC4)
- Action: open modal; attach a valid `.md` file (< 1 MB, UTF-8 content); click "Upload"
- Expected: modal closes; GET `artefacts/test-sdg1-upload-e2e/reference/<filename>` returns 200 (file exists on disk) OR the server confirms the write via the session API
- Currently: FAIL

**T14 — `skip-closes-modal-and-journey-proceeds`** (AC5)
- Action: open modal; click "Skip" (without attaching any file)
- Expected: modal closes; journey navigates to the next stage (e.g., `/ideate` gate or equivalent); no error message displayed
- Currently: FAIL

**T15 — `session-reference-files-available-after-upload`** (AC6)
- Action: complete a valid upload (T13 setup); call `GET /api/session` (or equivalent) to read session state
- Expected: response contains `referenceFiles` array with at least one entry containing `{ path, uploadedAt, sizeBytes }` fields
- Currently: FAIL

---

## NFR Tests

NFR-SEC is covered by T7 (path traversal unit test). NFR-ACCESS is covered by T11 (Playwright). NFR-MULTI is covered by T8 (unit).

The path traversal guard (T7) is the highest-risk NFR for this story — the upload filename is user-supplied and will be used in a disk write path. This guard is mandatory per CLAUDE.md and must be verified with an automated test that also asserts no file is written when the guard fires.

---

## Gap Table

| Gap | AC | Accepted? | Mitigation |
|-----|-----|-----------|------------|
| Modal layout pixel-level rendering | AC2 | ✅ Accepted by design | T11 (ARIA/structural) covers accessibility; pixel rendering requires manual smoke test |
| Re-upload over existing file collision behaviour | AC4 out-of-scope | N/A — explicitly out of scope | No test needed |
| Manual smoke: 1–5 files of various sizes | AC3, AC4 | ✅ Accepted | Manual verification step: upload 3 files including edge cases; confirm in reference directory |

---

## Integration Tests

No additional integration test file needed — T5 and T13 together cover the write-to-disk path from unit and E2E perspectives. The story has no cross-service handoffs beyond local file I/O and session state.

---

## Test count summary

| Type | Count |
|------|-------|
| Unit (must fail before impl) | 8 |
| E2E / Playwright (must fail before impl) | 7 |
| **Total** | **15** |
| Integration | 0 (covered by T5 + T13) |
