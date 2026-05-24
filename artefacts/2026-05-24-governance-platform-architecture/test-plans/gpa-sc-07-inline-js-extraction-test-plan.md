## Test Plan: Extract inline workflow JS to tested modules (SC-07)

**Story reference:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-07-inline-js-extraction.md`
**Epic reference:** `artefacts/2026-05-24-governance-platform-architecture/epics/gpa-epic-02-ci-enforcement-compliance.md`
**Test plan author:** Copilot
**Date:** 2026-05-25

---

## Background

`ci-audit-comment.js` already exists and exports `loadPipelineStories`, `classifyArtefact`, `parseACs`, `computeIssueAcCheck`, and `buildAuditComment`. The assurance-gate.yml `require()`s this module and calls `buildAuditComment`. The one remaining inline function is `sourceIntegrity(sourcePath, manifestHash)` at line 257 of assurance-gate.yml — it reads a source file and compares its SHA-256 against the manifest hash. SC-07 extracts this to `ci-audit-comment.js` and adds a new test file `tests/check-gpa-sc07-inline-js-extraction.js` that exercises the full extraction.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `buildAuditComment` exported; assurance-gate.yml has zero standalone audit comment construction logic left inline | 2 tests (T1, T7) | — | — | — | — | 🟢 |
| AC2 | `sourceIntegrity` exported from ci-audit-comment.js; inline replaced in assurance-gate.yml | 2 tests (T2, T6) | — | — | — | — | 🟢 |
| AC3 | Tests cover: buildAuditComment with fixture, sourceIntegrity with valid path, pipelineStories flat, pipelineStories epic-nested | 4 tests (T3, T4, T5, T7) | — | — | — | — | 🟢 |
| AC4 | 0 test failures — npm test exits 0 | 1 test (T8) | — | — | — | — | 🟢 |
| AC5 | CI audit comment content equivalent before/after extraction | — | 1 test (IT1) | — | — | Content-equivalence: no behavioural change to sourceIntegrity | 🟡 |

---

## Coverage gaps

| AC | Gap | Gap type | Risk | Mitigation |
|----|-----|----------|------|-----------|
| AC5 | Full end-to-end CI comment equivalence requires a live GitHub Actions run with a real PR | Environment | MEDIUM | IT1 exercises the full `buildAuditComment` call with realistic data and asserts comment structure contains required sections. Live CI smoke check at DoD. |

---

## Test Data Strategy

**Source:** Synthetic — fixture objects constructed inline in the test.
**PCI/sensitivity in scope:** No.
**Availability:** Self-contained — no filesystem dependency for AC1–AC4 tests. T3 (`sourceIntegrity` with valid path) uses a file known to exist in the repo (e.g. `README.md` or `package.json`).
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | require ci-audit-comment.js | Module import | None | |
| AC2 | require ci-audit-comment.js; grep assurance-gate.yml | Module import + file read | None | T6 reads assurance-gate.yml and asserts no `function sourceIntegrity` defined inline |
| AC3 | Minimal buildAuditComment fixture; known file path for sourceIntegrity; state objects for pipelineStories | Synthetic | None | |
| AC4 | npm test output (exit code) | Process spawn | None | |
| AC5 | Realistic buildAuditComment call with feature slug + story fixture | Synthetic | None | Same data shape as CI would provide |

### PCI / sensitivity constraints

None.

### Gaps

AC5 full CI validation is a live-run smoke check at DoD; not feasible to automate in unit/integration tests.

---

## Unit Tests

### T1 — `buildAuditComment` is exported from ci-audit-comment.js

- **Verifies:** AC1 (precondition — module contract)
- **Precondition:** `scripts/ci-audit-comment.js` must export `buildAuditComment`
- **Action:** `const mod = require('../scripts/ci-audit-comment.js')` and assert `typeof mod.buildAuditComment === 'function'`
- **Expected result:** Module loads; `buildAuditComment` is a function
- **Edge case:** No

### T2 — `sourceIntegrity` is exported from ci-audit-comment.js

- **Verifies:** AC2 (the new extraction this story delivers — RED test initially)
- **Precondition:** `scripts/ci-audit-comment.js` does NOT yet export `sourceIntegrity`
- **Action:** `const mod = require('../scripts/ci-audit-comment.js')` and assert `typeof mod.sourceIntegrity === 'function'`
- **Expected result:** Module exports `sourceIntegrity` as a function
- **Edge case:** No

### T3 — `sourceIntegrity` with valid existing file path returns hash-comparison result (not error)

- **Verifies:** AC2 (no GH Actions context required), AC3(b)
- **Precondition:** `scripts/ci-audit-comment.js` exports `sourceIntegrity`
- **Action:** Call `mod.sourceIntegrity('README.md', null)` (null manifestHash → returns '—') and assert return is `'—'`; also call `mod.sourceIntegrity('README.md', 'deadbeef1234')` and assert return is `'❌ DRIFT'` (hash won't match)
- **Expected result:** Returns `'—'` for null hash; returns `'❌ DRIFT'` for non-matching hash — no exception, no GH Actions context required
- **Edge case:** Missing file → assert returns `'⚠ not found'`

### T4 — `loadPipelineStories` with flat `stories[]`

- **Verifies:** AC3(c) — pipelineStories flat layout
- **Precondition:** `scripts/ci-audit-comment.js` exports `loadPipelineStories`
- **Action:** Call with `{ features: [{ slug: 'test-feat', stories: [{ id: 's1' }, { id: 's2' }] }] }` and slug `'test-feat'`
- **Expected result:** Returns array of length 2 containing both story objects
- **Edge case:** No

### T5 — `loadPipelineStories` with `epics[].stories[]` (the asd.1 blind-spot case)

- **Verifies:** AC3(d) — pipelineStories epic-nested layout; documents the pre-extraction bug
- **Precondition:** `scripts/ci-audit-comment.js` exports `loadPipelineStories`
- **Action:** Call with `{ features: [{ slug: 'test-feat', epics: [{ stories: [{ slug: 'ep1-s1' }] }, { stories: [{ slug: 'ep2-s1' }] }] }] }` (no top-level `stories` field) and slug `'test-feat'`
- **Expected result:** Returns array of length 2 — both epic-nested story objects found
- **Edge case:** Feature with both flat stories and epic stories → all returned, no deduplication issue

### T6 — assurance-gate.yml does not contain inline `function sourceIntegrity` definition

- **Verifies:** AC2 — inline replaced after extraction
- **Precondition:** SC-07 implementation complete
- **Action:** Read `.github/workflows/assurance-gate.yml` as a string; assert `content.includes('function sourceIntegrity(')` is `false`
- **Expected result:** The inline function definition no longer exists in the YAML file
- **Edge case:** No

### T7 — `buildAuditComment` with minimal fixture returns expected comment sections

- **Verifies:** AC1 (structural coverage), AC3(a)
- **Precondition:** `scripts/ci-audit-comment.js` exports `buildAuditComment`
- **Action:** Call `buildAuditComment({ verdict: 'pass', slug: 'test-feature', traceHash: 'abc123', shortSha: 'def456', headSha: 'def456abcdef', repoUrl: 'https://github.com/test/repo', runUrl: 'https://github.com/test/repo/actions/runs/1', artifactName: 'test-artifact' })` and assert the result is a string containing the key structural markers
- **Expected result:**
  - Result is a non-empty string
  - Contains `'Governed Delivery Audit Record'`
  - Contains `'Verification result: PASS'`
  - Contains `'test-feature'`
- **Edge case:** Empty `pipelineStories` → no AC section in output; no throw

### T8 — npm test exits 0 (regression)

- **Verifies:** AC4
- **Precondition:** SC-07 implementation complete
- **Action:** Spawn `node tests/check-gpa-sc07-inline-js-extraction.js` and assert exit code 0; also record that `npm test` passes
- **Expected result:** Exit code 0; `[gpa-sc07] Results: N passed, 0 failed`
- **Edge case:** No

---

## Integration Tests

### IT1 — buildAuditComment with realistic story fixture produces equivalent comment structure

- **Verifies:** AC5 (content equivalence proxy)
- **Precondition:** `scripts/ci-audit-comment.js` exports `buildAuditComment` and `sourceIntegrity`
- **Action:** Call `buildAuditComment` with a realistic full fixture (checks array, artefactFiles with sourcePaths of known files in repo, pipelineStories with one story having ACs) and assert:
  - Comment body contains `'### ✅ Acceptance Criteria'` section
  - Comment body contains the story slug provided in the fixture
  - `sourceIntegrity` called within the fixture mapping produces `'—'` (null hash) without error
- **Expected result:** Full comment body is a non-empty string with all expected structural sections; no throw; no GH Actions env variable required
- **Edge case:** No

---

## Test output format

```
[gpa-sc07] Results: N passed, 0 failed
```

---

## NFR coverage

| NFR | Test | Verification |
|-----|------|-------------|
| Importability: module `require()`-able without GH Actions context | T2, T3 — both called with no env vars set | All unit tests run in a plain `node` process |
| No external npm dependencies | Implementation constraint | `cat package.json` — no new entries |
| Functional equivalence | IT1 | Comment structure assertions; live CI smoke at DoD |
