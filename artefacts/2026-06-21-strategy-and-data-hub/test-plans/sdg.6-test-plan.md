# Test Plan — sdg.6: Callout marker detection and metrics recording

**Story:** artefacts/2026-06-04-strategy-data-grounding/definition.md (Story sdg.6)
**Feature:** 2026-06-21-strategy-and-data-hub
**Review:** artefacts/2026-06-21-strategy-and-data-hub/review.md — PASS (2026-06-21)
**Date:** 2026-06-26
**Test runner:** `node tests/check-sdg6-metrics-recording.js`

---

## Test Data Strategy

**Strategy:** Synthetic — tests call the metrics module directly with crafted artefact text strings containing known callout marker counts. Metrics file I/O uses temp directories; `workspace/strategy-metrics.json` is not written during tests. Artefact section counts are computed from the same synthetic text.

**Data owner:** Self-contained. Temp dirs cleaned up after each test group.

**PCI/sensitivity:** None — metrics contain only file names, counts, and rates; no operator PII.

---

## AC Coverage Table

| AC | Test(s) | Type | Gap |
|----|---------|------|-----|
| AC1 — `workspace/strategy-metrics.json` created with `{"metrics":[]}` if absent | T1 | Unit | None |
| AC2 — Artefact scanned for literal `[Grounded in: <filename>]` pattern | T2, T3 | Unit | None |
| AC3 — Metrics entry recorded with correct JSON structure | T4, T5 | Unit | None |
| AC4 — Metrics visible in session completion summary message | T6 | Unit | None |
| AC5 — Sessions without reference files tracked with `hasReferenceFiles: false` | T7 | Unit | None |
| AC6 — Per-artefact metrics; each artefact gets its own entry | T8, T9 | Unit | None |
| NFR-APPEND — Metrics file is append-only (prior entries never mutated) | T10 | Unit | None |
| NFR-LITERAL — Pattern matching is literal string, not regex/fuzzy | T2 | Unit | None |

---

## Unit Tests

Test file: `tests/check-sdg6-metrics-recording.js`

All tests must **FAIL** before implementation (metrics module does not exist).

**T1 — `metrics-file-created-with-empty-array-if-absent`** (AC1)
- Setup: use a temp dir without a `strategy-metrics.json`
- Action: call `initMetricsFile(tmpDir)` (or equivalent initialiser)
- Expected: file created at `<tmpDir>/strategy-metrics.json`; content is `{"metrics":[]}` or equivalent parsed form; function does not throw if called twice (idempotent)
- Currently: FAIL — module does not exist

**T2 — `detect-callout-markers-counts-literal-occurrences`** (AC2, NFR-LITERAL)
- Action: call `detectCalloutMarkers('Some text [Grounded in: strategy.md] and [Grounded in: data.md] and [grounded in: other.md].')`
- Expected: returns `{ count: 2, filenames: ['strategy.md', 'data.md'] }` — only literal uppercase-G `[Grounded in: ...]` matches; lowercase variation does not match (case-sensitive per NFR)
- Currently: FAIL

**T3 — `detect-callout-markers-returns-zero-when-none-present`** (AC2)
- Action: call `detectCalloutMarkers('Clean artefact text with no markers.')`
- Expected: returns `{ count: 0, filenames: [] }`
- Currently: FAIL

**T4 — `record-metrics-appends-entry-with-correct-structure`** (AC3)
- Setup: temp metrics file with `{"metrics":[]}`
- Action: call `recordMetrics(tmpDir, { featureSlug: 'test-feat', stage: 'ideate', hasReferenceFiles: true, referenceFileCount: 2, referenceFileNames: ['strategy.md', 'data.md'], calloutCount: 4, totalSections: 8 })`
- Expected: `strategy-metrics.json` now contains one entry with: `date` (ISO 8601), `featureSlug: 'test-feat'`, `stage: 'ideate'`, `hasReferenceFiles: true`, `referenceFileCount: 2`, `referenceFileNames: ['strategy.md', 'data.md']`, `calloutCount: 4`, `totalSections: 8`, `calloutRate: 0.5`
- Currently: FAIL

**T5 — `callout-rate-computed-correctly`** (AC3)
- Action: call `recordMetrics` with `calloutCount: 3, totalSections: 5`
- Expected: `calloutRate` in the written entry is `0.6` (3/5); rounded to 2 decimal places
- Currently: FAIL

**T6 — `session-completion-summary-includes-metrics-line`** (AC4)
- Action: call `buildCompletionSummary({ calloutCount: 3, totalSections: 8, hasReferenceFiles: true })`
- Expected: returns a string containing `Strategy content was cited in 3/8 sections` (or similar wording matching `cited in N/Y sections`)
- Currently: FAIL

**T7 — `no-reference-files-session-tracked-with-has-reference-files-false`** (AC5)
- Action: call `recordMetrics(tmpDir, { featureSlug: 'test-feat', stage: 'discovery', hasReferenceFiles: false, referenceFileCount: 0, referenceFileNames: [], calloutCount: 0, totalSections: 6 })`
- Expected: entry written with `hasReferenceFiles: false`, `calloutCount: 0`, `calloutRate: 0`; no error thrown
- Currently: FAIL

**T8 — `each-artefact-gets-independent-entry`** (AC6)
- Setup: temp metrics file with `{"metrics":[]}`
- Action: call `recordMetrics` twice — once for stage `'ideate'` (calloutCount=2) and once for stage `'discovery'` (calloutCount=5)
- Expected: `strategy-metrics.json` contains exactly 2 entries; entries have `stage: 'ideate'` and `stage: 'discovery'` respectively; callout counts are not summed
- Currently: FAIL

**T9 — `session-completion-summary-no-reference-files-message`** (AC4, AC5)
- Action: call `buildCompletionSummary({ hasReferenceFiles: false })`
- Expected: returns string matching `No strategy grounding used in this session` (or equivalent)
- Currently: FAIL

**T10 — `metrics-append-does-not-mutate-prior-entries`** (NFR-APPEND)
- Setup: temp metrics file with one pre-existing entry `{ featureSlug: 'prior', calloutCount: 7 }`
- Action: call `recordMetrics` to add a second entry
- Expected: file contains 2 entries; first entry still has `calloutCount: 7` (unmodified); second entry is the newly written one
- Currently: FAIL

---

## Integration Tests

No separate integration test file needed. The metrics recording flow is self-contained — the unit tests cover the full write/read cycle via temp dirs.

An end-to-end confirmation is expected at DoD time: run a real /ideate session with a reference file uploaded; verify `workspace/strategy-metrics.json` is created and contains one entry with `stage: 'ideate'` and `calloutCount >= 0`. This serves as the M1 (Strategy content utility) measurement signal.

---

## Gap Table

| Gap | AC | Accepted? | Mitigation |
|-----|-----|-----------|------------|
| Total section count heuristic (how to count artefact sections) | AC3 | ✅ Accepted | Count `##` headings in the saved markdown as sections; document the counting rule in the module. Tests use known section counts. |
| Real DoD session to confirm metrics file created | AC1 | ✅ Accepted | Confirmed at DoD time via manual walk-through; M1 measurement signal recorded. |

---

## Test count summary

| Type | Count |
|------|-------|
| Unit (must fail before impl) | 10 |
| **Total** | **10** |
| Integration | 0 (covered by DoD manual confirmation for M1) |
