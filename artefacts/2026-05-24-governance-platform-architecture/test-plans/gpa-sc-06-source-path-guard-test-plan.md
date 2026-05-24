## Test Plan: Source path traversal guard for `sourceIntegrity` (SC-06)

**Story reference:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-06-source-path-guard.md`
**Epic reference:** `artefacts/2026-05-24-governance-platform-architecture/epics/gpa-epic-02-ci-enforcement-compliance.md`
**Test plan author:** Copilot
**Date:** 2026-05-25

---

## Background

**Critical upstream dependency:** SC-06 CANNOT be dispatched until SC-07 is DoD-complete. SC-06 adds a path traversal guard inside `sourceIntegrity`, which must first exist as an exported function in `scripts/ci-audit-comment.js` (that extraction is SC-07's deliverable). The SC-06 test file imports `sourceIntegrity` from the same module.

`sourceIntegrity(sourcePath, manifestHash)` reads a file from `sourcePath` and hashes it. If `sourcePath` is a path-traversal payload (e.g. `../../../etc/passwd`), this is an OWASP A01 violation. SC-06 adds the mandatory guard from copilot-instructions.md: `path.resolve(inputPath).startsWith(repoRoot + path.sep)`. On traversal: return `{ traversal: true, sanitisedPath: '[REDACTED]' }` and do NOT read the file or log the raw path.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Path traversal input → returns `{ traversal: true, sanitisedPath: '[REDACTED]' }` | 2 tests (T1, T2) | — | — | — | — | 🟢 |
| AC2 | Valid path inside repo → returns hash comparison result (no regression) | 2 tests (T4, T5) | — | — | — | — | 🟢 |
| AC3 | Traversal case is explicitly exercised in the test suite | 3 tests (T1, T2, T3) | — | — | — | — | 🟢 |
| AC4 | `readFileSync` only reached when path passes `startsWith(repoRoot)` check | 1 test (T3) | — | — | — | — | 🟢 |
| AC5 | False-positive rate: zero legitimate paths incorrectly blocked over 10 test runs | 1 test (T4) | — | — | Post-deploy | Metric signal | LOW |

---

## Coverage gaps

| AC | Gap | Gap type | Risk | Mitigation |
|----|-----|----------|------|-----------|
| AC4 | Direct verification that `fs.readFileSync` is NOT called requires mocking or source-level inspection | Environment | LOW | T3 verifies by reading the source file and asserting the guard precedes `readFileSync`. IT1 verifies indirectly: traversal path returns without file content. |
| AC5 | Automated measurement of false-positive rate over 10 CI runs | Metric signal | LOW | Post-deploy: record pass/fail signal in pipeline-state.json at DoD after 10 observed assurance-gate runs. |

---

## Test Data Strategy

**Source:** Synthetic — adversarial path strings constructed inline; real repo files for the happy-path case.
**PCI/sensitivity in scope:** No.
**Availability:** All tests run in plain `node` process. No filesystem writes.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Traversal path strings: `../../etc/passwd`, `../../../etc/passwd`, absolute path outside repo | Synthetic | None | |
| AC2 | Valid relative path to a file known to exist in repo (e.g. `README.md`) | Known repo file | None | |
| AC3 | Same traversal paths as AC1 | Synthetic | None | |
| AC4 | Source code of ci-audit-comment.js | File read | None | Read and assert guard precedes readFileSync |
| AC5 | Repeated calls with valid paths | Synthetic loop | None | |

### PCI / sensitivity constraints

None. No real secrets, credentials, or sensitive paths are used as test data.

### Adversarial path test vectors

The following must all be rejected by the guard:

| Vector | Description |
|--------|-------------|
| `../../etc/passwd` | Unix relative traversal |
| `../../../etc/passwd` | Deep Unix relative traversal |
| `..\..\..\Windows\System32\config\SAM` | Windows relative traversal |
| `/etc/passwd` | Absolute path outside repo root |
| `C:\Windows\System32\config\SAM` | Windows absolute outside repo |
| `artefacts/../../../etc/passwd` | Mixed valid-prefix + traversal |

All must return `{ traversal: true, sanitisedPath: '[REDACTED]' }`.

---

## Unit Tests

### T1 — Traversal path returns guard object with no file read

- **Verifies:** AC1, AC3 (primary traversal test)
- **Precondition:** `scripts/ci-audit-comment.js` exports `sourceIntegrity`; SC-06 guard implemented
- **Action:** Call `sourceIntegrity('../../etc/passwd', 'someHash')` with repo root as cwd; assert return value
- **Expected result:**
  - Return value is an object: `{ traversal: true, sanitisedPath: '[REDACTED]' }`
  - Return value does NOT contain the original `sourcePath` value in any field
  - Return value does NOT contain file content or a hash comparison result
- **Edge case:** No

### T2 — Multiple traversal vectors all return guard object

- **Verifies:** AC1 (comprehensive coverage of adversarial vectors)
- **Precondition:** SC-06 guard implemented
- **Action:** For each vector in the adversarial path list above, call `sourceIntegrity(vector, null)` and assert the return is `{ traversal: true, sanitisedPath: '[REDACTED]' }`
- **Expected result:** All 6 vectors return `{ traversal: true, sanitisedPath: '[REDACTED]' }`; no exception thrown; no file read attempted
- **Edge case:** `null` hash → guard fires before null-hash short-circuit

### T3 — Source code guard: `readFileSync` is only reached after `startsWith(repoRoot)` check

- **Verifies:** AC4 — guard placement in source
- **Precondition:** `scripts/ci-audit-comment.js` implemented
- **Action:** Read `scripts/ci-audit-comment.js` as string; find the `sourceIntegrity` function body; assert that the index of `startsWith` appears BEFORE the index of `readFileSync` within that function
- **Expected result:**
  - `content.indexOf('startsWith') < content.indexOf('readFileSync')` within the function scope
  - The guard check appears as a standalone assertion before any file read
- **Edge case:** No

### T4 — Valid path inside repo returns hash comparison (no regression to pre-SC-06 behaviour)

- **Verifies:** AC2 — happy path not broken by guard
- **Precondition:** SC-06 guard implemented; `README.md` exists in repo root
- **Action:**
  1. Call `sourceIntegrity('README.md', null)` → assert returns `'—'` (null hash short-circuit)
  2. Call `sourceIntegrity('package.json', 'deadbeefdeadbeef')` → assert returns `'❌ DRIFT'` (hash won't match)
- **Expected result:**
  - Both calls return the expected string value without throwing
  - Neither call returns a traversal guard object
- **Edge case:** No

### T5 — Valid deep path inside repo not rejected by guard

- **Verifies:** AC2 — relative subdirectory paths work
- **Precondition:** SC-06 guard implemented; `scripts/ci-audit-comment.js` exists
- **Action:** Call `sourceIntegrity('scripts/ci-audit-comment.js', null)` → assert returns `'—'`
- **Expected result:** Returns `'—'`; guard does not reject a subdirectory path that resolves inside the repo root
- **Edge case:** No

### T6 — Raw adversarial path not present in return value or thrown message

- **Verifies:** AC1 additional — security property (raw path not leaked)
- **Precondition:** SC-06 guard implemented
- **Action:** Call `sourceIntegrity('../../etc/passwd', 'abc')` and assert the return value serialized to JSON does NOT contain `'etc/passwd'`; wrap in try/catch and assert any thrown message also does not contain the raw path
- **Expected result:** `JSON.stringify(result)` does not contain `'etc/passwd'` or `'passwd'`
- **Edge case:** No

---

## Integration Tests

### IT1 — Guard integrates with assurance-gate.yml artefact enrichment loop (no traversal file read in CI)

- **Verifies:** AC1 in context of the calling code
- **Precondition:** SC-07 complete (sourceIntegrity extracted); SC-06 guard implemented
- **Action:** Call the artefact enrichment loop pattern that assurance-gate.yml uses — mapping a list of `{ sourcePath, sha256 }` objects including one with a traversal path — and assert the result for the traversal entry has `integrityStatus` matching the guard pattern `'[REDACTED]'` or equivalent
- **Expected result:** Enriched array entry for traversal path contains no file-derived content; legitimate paths still receive `'✅'`, `'❌ DRIFT'`, or `'⚠ not found'`
- **Edge case:** No

---

## Test output format

```
[gpa-sc06] Results: N passed, 0 failed
```

---

## NFR coverage

| NFR | Test | Verification |
|-----|------|-------------|
| OWASP A01 path traversal guard (copilot-instructions.md mandatory pattern) | T1–T3, T6, IT1 | Guard object returned; source code assertion confirms guard placement |
| Raw input path not leaked in return value (copilot-instructions.md: HTTP 400 pattern adapted to return object) | T6 | JSON.stringify assertion |
| Valid paths not blocked (no false positives) | T4, T5 | Happy-path assertions |
| No filesystem write on traversal input | T1, T2 — implicit: no file created | Verified by absence of side effects; test runs in isolated cwd |
| guard is `path.resolve().startsWith(repoRoot + path.sep)` pattern | T3 | Source code order assertion |
