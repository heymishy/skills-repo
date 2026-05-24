## Test Plan: Write trace contract standards document

**Story reference:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-01-trace-contract.md`
**Epic reference:** `artefacts/2026-05-24-governance-platform-architecture/epics/gpa-epic-01-governance-foundation.md`
**Test plan author:** Copilot
**Date:** 2026-05-25

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | trace-contract.md exists and contains all 15 principles (P01-P15) each with 4 required fields | 4 tests (T1–T4) | — | — | — | — | 🟢 |
| AC2 | CONTRIBUTING.md references trace-contract.md | 1 test (T5) | — | — | — | — | 🟢 |
| AC3 | npm test passes — no regression | 1 test (T6) | — | — | — | — | 🟢 |
| AC4 | P02 path traversal entry present with required validation pattern and source obligation | 1 test (T7) | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — file system reads against committed artefact; no external data needed.
**PCI/sensitivity in scope:** No.
**Availability:** Available after implementation — tests are written to fail before file exists.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | `standards/governance/trace-contract.md` content | Filesystem read | None | File does not exist pre-implementation — T1 fails until created |
| AC2 | `CONTRIBUTING.md` content | Filesystem read | None | File exists; T5 fails until trace-contract reference added |
| AC3 | Full npm test suite output | npm test run | None | Passes on clean checkout; re-verified post-implementation |
| AC4 | P02 entry content in trace-contract.md | Filesystem read | None | Fails until file written with correct P02 entry |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### T1 — trace-contract.md exists at correct path

- **Verifies:** AC1 (file existence precondition)
- **Precondition:** `standards/governance/` directory may not exist
- **Action:** `fs.existsSync(path.join(ROOT, 'standards', 'governance', 'trace-contract.md'))`
- **Expected result:** `true`
- **Edge case:** No — file either exists or it does not

### T2 — trace-contract.md contains all 15 principle identifiers (P01–P15)

- **Verifies:** AC1(a) — all 15 principles present
- **Precondition:** File exists (T1 passes)
- **Action:** Read file content; assert each of `P01`, `P02`, `P03`, `P04`, `P05`, `P06`, `P07`, `P08`, `P09`, `P10`, `P11`, `P12`, `P13`, `P14`, `P15` appears at least once
- **Expected result:** All 15 identifiers present in file content
- **Edge case:** No — assertion is complete match against fixed set

### T3 — each principle entry contains the four required fields

- **Verifies:** AC1(b)(c)(d) — module, governed field/behaviour, and cross-reference present per principle
- **Precondition:** File exists (T1 passes)
- **Action:** For a representative sample of at least 3 principles (P01, P02, P08 — the three highest-risk per discovery), assert file content contains: a module path reference (string matching `src/` or `scripts/` or `.github/`), a field or behaviour description, and a cross-reference string (matching `copilot-instructions.md` or `ADR-0` or `src/` path)
- **Expected result:** All three representative entries contain non-empty module reference, field/behaviour text, and cross-reference
- **Edge case:** No

### T4 — each principle entry is human-readable (NFR: plain markdown, no code required)

- **Verifies:** NFR — Documentation quality
- **Precondition:** File exists (T1 passes)
- **Action:** Read file content; assert it is valid markdown — specifically that no entry requires inline code blocks to interpret the principle statement (i.e. principle *statement* is in prose, not a raw code dump). Proxy check: assert the file does not consist exclusively of code fences (≥ 50% of non-blank lines are plain text).
- **Expected result:** File has substantial plain-text prose lines
- **Edge case:** No

### T5 — CONTRIBUTING.md references trace-contract.md

- **Verifies:** AC2
- **Precondition:** `CONTRIBUTING.md` exists at repo root (pre-existing file)
- **Action:** Read `CONTRIBUTING.md`; assert it contains the string `standards/governance/trace-contract.md`
- **Expected result:** Reference present
- **Edge case:** No

### T6 — no regression: npm test exit 0 after SC-01 merged

- **Verifies:** AC3
- **Precondition:** SC-01 implementation committed to master
- **Action:** Run `npm test` (or in test file: assert no existing test file references a path that SC-01 would break)
- **Expected result:** Exit 0
- **Edge case:** No
- **Note:** This test verifies the absence of regression. In the check script it is implemented as: assert `fs.existsSync` on trace-contract.md does not throw, and all other assertions in this file pass without error. The full `npm test` regression is verified at commit time — not a separate assert in this file.

### T7 — P02 path traversal entry contains required validation pattern and source

- **Verifies:** AC4
- **Precondition:** File exists and contains P02 (T1, T2 pass)
- **Action:** Read file; find the P02 section; assert it contains:
  - the string `path.resolve(inputPath).startsWith(repoRoot + path.sep)` (exact validation pattern per copilot-instructions.md)
  - a reference to `copilot-instructions.md` as the source obligation
- **Expected result:** Both strings present in the P02 section
- **Edge case:** No

---

## Integration Tests

None required. SC-01 is documentation-only; no module interactions to verify.

---

## NFR Tests

### NFR-T1 — all module path references resolve to real files

- **NFR addressed:** Accuracy — "All module path references must resolve to real files at commit time."
- **Measurement method:** Parse file content for strings matching `src/[a-z]` or `scripts/[a-z]` or `.github/[a-z]`; for each match, assert `fs.existsSync(path.join(ROOT, match))` is `true`
- **Pass threshold:** 0 broken module path references
- **Tool:** Node.js built-ins

---

## Test file

**File to create:** `tests/check-gpa-sc01-trace-contract.js`
**Test output prefix:** `[gpa-sc01]` — must use this prefix so assurance-gate.yml parses it correctly.
**Runner:** Node.js built-ins only (`fs`, `path`). No external npm dependencies.

### Skeleton

```js
// tests/check-gpa-sc01-trace-contract.js
// Tests FAIL until standards/governance/trace-contract.md exists and CONTRIBUTING.md is updated.
'use strict';
const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const TRACE_CONTRACT = path.join(ROOT, 'standards', 'governance', 'trace-contract.md');
const CONTRIBUTING   = path.join(ROOT, 'CONTRIBUTING.md');
let passed = 0, failed = 0;
function assert(condition, label) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else           { console.log(`  ✗ ${label}`); failed++; }
}
// T1 … T7 + NFR-T1 here
console.log(`\n[gpa-sc01] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
```

---

## Out of Scope for This Test Plan

- Verifying the correctness of the principle descriptions themselves (semantic review — human responsibility at DoR).
- Checking all 15 principles have identical four-field depth (T3 samples 3 representative entries as a proxy).
- Testing enforcement module behaviour — SC-01 is documentation-only.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| T3 samples only 3 of 15 principles for four-field depth | Full enumeration would be brittle if principle format varies slightly | Sample chosen as highest-risk (P01, P02, P08); DoD human review covers remainder |
| T6 regression relies on full npm test at commit time, not a discrete assertion | Not practical to run full suite inside a single check file | CI npm test run covers this — noted in test file comment |
