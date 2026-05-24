## Test Plan: Write test output format standards document

**Story reference:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-04-test-output-format.md`
**Epic reference:** `artefacts/2026-05-24-governance-platform-architecture/epics/gpa-epic-01-governance-foundation.md`
**Test plan author:** Copilot
**Date:** 2026-05-25

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | test-output-format.md contains: format spec, verbatim regex, conforming example, non-conforming example, silent-skip consequence | 4 tests (T1–T4) | — | — | — | — | 🟢 |
| AC2 | npm test passes — no regression | 1 test (T5) | — | — | — | — | 🟢 |
| AC3 | Document references trw.1 prefix fix, explains why format matters | 1 test (T6) | — | — | — | — | 🟢 |
| AC4 | Document contains at least one labelled conforming example and one labelled non-conforming example with explanation | 1 test (T7) | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — file system reads against committed artefact and source file; no external data needed.
**PCI/sensitivity in scope:** No.
**Availability:** Available after implementation — tests are written to fail before file exists.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | `standards/governance/test-output-format.md` content | Filesystem read | None | File does not exist pre-implementation — T1 fails until created |
| AC1(b) | Exact regex string from `assurance-gate.yml` | Filesystem read | None | Regex read from source at test time to ensure accuracy |
| AC2 | npm test suite result | npm test run | None | Verified at CI run / commit time |
| AC3 | trw.1 reference string in document | Filesystem read | None | Fails until document includes trw.1 mention |
| AC4 | Labelled example blocks in document | Filesystem read | None | Fails until both examples are written |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### T1 — test-output-format.md exists at correct path

- **Verifies:** AC1 (file existence precondition)
- **Precondition:** `standards/governance/` directory may not exist
- **Action:** `fs.existsSync(path.join(ROOT, 'standards', 'governance', 'test-output-format.md'))`
- **Expected result:** `true`
- **Edge case:** No

### T2 — document contains required format spec and verbatim regex

- **Verifies:** AC1(a)(b)
- **Precondition:** File exists (T1 passes)
- **Action:** Read `test-output-format.md`; assert (a) the string `[suite-name] Results: N passed` is present (the canonical format spec), and (b) the exact canonical regex string from assurance-gate.yml is present verbatim. The canonical regex to assert is: `\[([a-z][a-z0-9]*)(?:-[^\]]+)?\]\s+(?:results?:?\s*|\d+\s+run,\s*)?(\d+)\s+passed,\s*(\d+)\s+failed` — read dynamically from `assurance-gate.yml` at test time to guarantee accuracy (NFR: Accuracy).
- **Expected result:** Both format spec string and verbatim regex present
- **Edge case:** No — exact string match

### T3 — document states the silent-skip consequence

- **Verifies:** AC1(d)
- **Precondition:** File exists (T1 passes)
- **Action:** Read file; assert it contains the word `skipped` or `silently` or `silent skip` (any of the three) in the context of mismatched format
- **Expected result:** At least one of those strings present
- **Edge case:** No

### T4 — document contains at least one conforming example and one non-conforming example

- **Verifies:** AC1(c) and AC4
- **Precondition:** File exists (T1 passes)
- **Action:** Read file; assert both of the following are present:
  - A labelled conforming example: string `conforming` or `✓` or `Conforming` appearing in the document
  - A labelled non-conforming example: string `non-conforming` or `Non-conforming` or `incorrect` appearing in the document
- **Expected result:** Both labels present
- **Edge case:** No

### T5 — no regression: npm test passes after SC-04 merged

- **Verifies:** AC2
- **Precondition:** SC-04 committed; no other changes break npm test
- **Action:** In the check script: verify T1 passes (file exists and is readable) with no thrown exception; combined with CI npm test run.
- **Expected result:** 0 failures
- **Note:** Full npm test regression verified at CI run time. This file's own pass/fail count contributes to that gate.

### T6 — document references trw.1 and explains why format matters

- **Verifies:** AC3
- **Precondition:** File exists (T1 passes)
- **Action:** Read file; assert it contains the string `trw.1` (or `trw1`) AND contains a sentence or phrase explaining that incorrect format causes the gate to skip the result (i.e. the *why* for format compliance — not just "trw.1 happened")
- **Expected result:** Both `trw.1`/`trw1` reference and explanation of consequence present
- **Edge case:** No

### T7 — conforming example shows correct bracket+prefix+Results format

- **Verifies:** AC4 (labelled conforming example quality)
- **Precondition:** File exists and T4 passes
- **Action:** Read file; assert it contains a string matching the pattern `\[` + at least one word char + `\]` + ` Results:` (confirming the example actually shows the bracket-prefix format, not just mentions it)
- **Expected result:** A conforming example line in bracket format present
- **Edge case:** No

---

## Integration Tests

None required. SC-04 is documentation-only.

---

## NFR Tests

### NFR-T1 — quoted regex matches assurance-gate.yml source verbatim

- **NFR addressed:** Accuracy — "The regex quoted in the document must be verbatim from the current assurance-gate.yml source at commit time."
- **Measurement method:** Extract the canonical regex from `.github/workflows/assurance-gate.yml` line matching `testResultsByFile` / `Results:` parsing block; compare to the regex appearing in `test-output-format.md`
- **Pass threshold:** Exact string match (no diff)
- **Tool:** Node.js `fs.readFileSync` + string comparison

---

## Test file

**File to create:** `tests/check-gpa-sc04-test-output-format.js`
**Test output prefix:** `[gpa-sc04]` — must use this prefix so assurance-gate.yml parses it correctly.
**Runner:** Node.js built-ins only (`fs`, `path`). No external npm dependencies.

### Skeleton

```js
// tests/check-gpa-sc04-test-output-format.js
// Tests FAIL until standards/governance/test-output-format.md exists.
'use strict';
const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const DOC  = path.join(ROOT, 'standards', 'governance', 'test-output-format.md');
const GATE = path.join(ROOT, '.github', 'workflows', 'assurance-gate.yml');
let passed = 0, failed = 0;
function assert(condition, label) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else           { console.log(`  ✗ ${label}`); failed++; }
}
// T1 … T7 + NFR-T1 here
console.log(`\n[gpa-sc04] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
```

---

## Out of Scope for This Test Plan

- Verifying the human-readable quality of descriptions (reviewer judgement at DoD).
- Testing enforcement logic in assurance-gate.yml — this story is documentation-only.
- Verifying that every existing check script conforms to the format (out-of-scope per story — SC-07 covers the extracted module).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| T3 checks for any of three strings ("skipped"/"silently"/"silent skip") | Exact phrasing not prescribed in AC1(d) | AC1(d) says "clear statement" — string probe is a sufficient proxy |
| NFR-T1 regex extraction is fragile if assurance-gate.yml reformats the parsing block | YAML inline JS can be reformatted across PRs | Test reads GATE file and searches for the known regex literal — any reformat that changes the regex itself is an intentional AC3 change |
