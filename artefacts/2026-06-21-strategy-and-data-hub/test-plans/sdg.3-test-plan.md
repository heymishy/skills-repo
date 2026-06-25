# Test Plan — sdg.3: Reference file content reading and validation

**Story:** artefacts/2026-06-04-strategy-data-grounding/definition.md (Story sdg.3)
**Feature:** 2026-06-21-strategy-and-data-hub
**Review:** artefacts/2026-06-21-strategy-and-data-hub/review.md — PASS (2026-06-21)
**Date:** 2026-06-26
**Test runner:** `node tests/check-sdg3-file-content-reading.js`

---

## Test Data Strategy

**Strategy:** Synthetic — tests create temp files with known content (valid UTF-8, oversized, binary/invalid-encoding). All file I/O uses temp directories; no production artefact directories are read or written. Tests assert return values and logged warning messages from the reading/validation module.

**Data owner:** Self-contained. Temp dirs cleaned up after each test group.

**PCI/sensitivity:** None.

---

## AC Coverage Table

| AC | Test(s) | Type | Gap |
|----|---------|------|-----|
| AC1 — Files read from disk with `fs.readFileSync`, stored as `{fileName, content, charCount}` | T1, T2 | Unit | None |
| AC2 — Existence, encoding, and size checks; failures skip with warning | T3, T4, T5 | Unit | None |
| AC3 — Oversized file NOT truncated; warning logged; session continues | T6 | Unit | None |
| AC4 — Token budget check logged as `[INFO]` with component breakdown | T7 | Unit | None |
| AC5 — Multiple files validated independently; one failure does not stop others | T8 | Unit | None |
| AC6 — Invalid UTF-8 content → warning logged, file not included in results | T9 | Unit | None |
| NFR-STDLIB — Only `fs.readFileSync` used (no third-party file libs) | T1 | Unit | None |

---

## Unit Tests

Test file: `tests/check-sdg3-file-content-reading.js`

All tests must **FAIL** before implementation (content reading module does not exist).

**T1 — `read-valid-file-returns-filename-content-charcount`** (AC1, NFR-STDLIB)
- Setup: write `strategy.md` to a temp dir with known content (e.g., `# Strategy\n\nContent here.`)
- Action: call `readReferenceFile(path)` from the content reading module
- Expected: returns `{ fileName: 'strategy.md', content: '# Strategy\n\nContent here.', charCount: 28 }` (exact charCount matches content length)
- Currently: FAIL — module does not exist

**T2 — `read-module-uses-fs-read-file-sync`** (AC1, NFR-STDLIB)
- Action: inspect the source of the content reading module (read the file, assert it calls `fs.readFileSync` and does NOT import any third-party file libraries)
- Pattern: file source contains `readFileSync` and does NOT match `/require\(['"](?!fs|path|crypto|os|url)[^'"]+['"]\)/`
- Expected: pattern satisfied
- Currently: FAIL — module does not exist

**T3 — `missing-file-skipped-with-warning`** (AC2)
- Action: call `readReferenceFile('/nonexistent/path/strategy.md')`
- Expected: does not throw; returns `null`; a warning is logged matching `/\[WARN\].*not found|does not exist/i`
- Currently: FAIL

**T4 — `invalid-utf8-file-skipped-with-warning`** (AC2, AC6)
- Setup: write a temp file with raw binary bytes `[0x80, 0x81, 0x82]`
- Action: call `readReferenceFile(path)` on that file
- Expected: returns `null`; warning logged matching `/\[WARN\].*not valid UTF-8|invalid.*encoding/i`; warning includes the file path
- Currently: FAIL

**T5 — `oversized-file-check-triggers-warning-not-throw`** (AC2)
- Setup: write a temp file with 10,001 UTF-8 characters
- Action: call `readReferenceFile(path)`
- Expected: returns `null` OR returns content with a flag; warning logged matching `/\[WARN\].*exceeds.*10.000/i` including the file path
- Currently: FAIL

**T6 — `oversized-file-is-not-truncated`** (AC3)
- Setup: write a temp file with 10,001 characters
- Action: call `readReferenceFile(path)`; if content is returned (non-null), inspect it
- Expected: if content is returned, it is NOT truncated (char count = 10,001, not 10,000); the module skips the file entirely rather than silently truncating it
- Currently: FAIL

**T7 — `token-budget-log-contains-component-breakdown`** (AC4)
- Action: call `logTokenBudget({ skillTokens: 4000, referenceTokens: 500, priorTokens: 200 })`
- Expected: a log line is produced matching `/\[INFO\].*System prompt tokens.*SKILL=4000.*reference=500.*prior=200.*4700\/12000/i` (or equivalent format with all four values present)
- Currently: FAIL — logTokenBudget function does not exist

**T8 — `multiple-files-validated-independently`** (AC5)
- Setup: create three temp files: `a.md` (valid, small), `b.md` (oversized), `c.md` (valid, small)
- Action: call `readReferenceFiles([pathA, pathB, pathC])`
- Expected: result array contains entries for `a.md` and `c.md`; `b.md` is absent (skipped); function does not throw; two warnings logged (one for `b.md`)
- Currently: FAIL

**T9 — `invalid-utf8-warning-includes-file-path`** (AC6)
- Setup: write a temp file with binary content
- Action: call `readReferenceFile(path)`; capture log output
- Expected: warning message contains the file path (not just a generic error)
- Currently: FAIL

---

## Gap Table

| Gap | AC | Accepted? | Mitigation |
|-----|-----|-----------|------------|
| Encoding detection of non-UTF-8 multi-byte sequences (e.g., Latin-1, Shift-JIS) | AC2, AC6 | ✅ Accepted | Node.js `fs.readFileSync(path, 'utf8')` throws on invalid UTF-8 bytes — catch block covers all non-UTF-8 encodings without explicit detection |
| Token counting accuracy (estimate vs actual tiktoken) | AC4 | ✅ Accepted | Heuristic (4 chars = 1 token) is sufficient for a soft budget; exact count requires model-specific tokenizer; not in scope |

---

## Test count summary

| Type | Count |
|------|-------|
| Unit (must fail before impl) | 9 |
| **Total** | **9** |
| E2E | 0 (covered by sdg.1+sdg.2 E2E chain) |
