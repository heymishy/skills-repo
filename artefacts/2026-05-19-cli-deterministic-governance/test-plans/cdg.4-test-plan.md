# Test Plan: Web UI gate-confirm CLI validation integration

**Story reference:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.4.md
**Epic reference:** artefacts/2026-05-19-cli-deterministic-governance/epics/cdg-phase2-advance-and-trace.md
**Test plan author:** GitHub Copilot (Claude Sonnet 4.6) — operator-directed /test-plan
**Date:** 2026-05-24

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | validate called before pipelineStateWriter on DoR gate-confirm | T1 | — | — | — | — | 🟢 |
| AC2 | Validation failure → 422, no state write | T2 | IT2 | — | — | — | 🟢 |
| AC3 | Validation pass → 200, state written | T3 | IT1 | — | — | — | 🟢 |
| AC4 | Path traversal dorArtefactPath → 400, validate not called | T4 | — | — | — | — | 🟢 |
| AC5 | setValidate injectable from journey.js exports | T5 | — | — | — | — | 🟢 |
| AC6 | Default stub throws "Adapter not wired: validate" | T6 | — | — | — | — | 🟢 |
| AC7 | Non-DoR stage gate-confirm does not call validate | T7 | — | — | — | — | 🟢 |
| AC8 | npm test includes check-cdg4-gate-confirm-validation.js, all pass | — | — | — | — | — | 🟢 |

---

## Coverage gaps

None — all 8 ACs are automatable via direct handler invocation with stub injection. No CSS-layout-dependent, DOM-behaviour, or external-dependency gaps.

---

## Test Data Strategy

**Source:** Synthetic — stub injection for validate and pipelineStateWriter adapters; fixture DoR artefact file on disk for integration tests.
**PCI/sensitivity in scope:** No
**Availability:** Available now — stubs are constructed in-test; fixture artefact can be created from an existing passing DoR artefact in the repo.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Mock req/res, stub validate (returns `{ exitCode: 0 }`), stub pipelineStateWriter, session with `dorArtefactPath` set | Synthetic | None | Handler invoked directly; call-order recorded by stubs |
| AC2 | Stub validate returning `{ exitCode: 3, stderr: 'H3: AC section missing' }`, stub pipelineStateWriter that records if called | Synthetic | None | pipelineStateWriter must NOT be called |
| AC3 | Stub validate returning `{ exitCode: 0 }`, stub pipelineStateWriter that records if called | Synthetic | None | pipelineStateWriter MUST be called |
| AC4 | Session with `dorArtefactPath` set to `../../etc/passwd` (or equivalent traversal path) | Synthetic | None | Resolved path must not start with repoRoot |
| AC5 | n/a — tests the export shape of journey.js | n/a | None | |
| AC6 | Default state — journey.js loaded without setValidate() | n/a | None | |
| AC7 | Mock req/res with `stage: 'review'` (or another non-DoR stage), stub validate that records if called | Synthetic | None | validate MUST NOT be called |
| IT1 | Real DoR artefact fixture that passes cli-outer-loop.validate() (e.g. a copy of an existing signed-off DoR file) | Fixture file (copy of existing DoR artefact) | None | Use a temp copy at a path under repoRoot; inject real validate |
| IT2 | Real artefact fixture that fails cli-outer-loop.validate() (e.g. a file missing the AC section) | Synthetic — write a minimal invalid artefact | None | |

### PCI / sensitivity constraints

None.

### Gaps

None — all data is synthetic or derived from existing test fixtures.

---

## Unit Tests

All unit tests invoke `handlePostGateConfirm` directly by importing `journey.js` and injecting stubs via `setValidate()` and `setPipelineStateWriter()`. Requests and responses are simulated with minimal mock objects that record calls and capture return values.

### T1 — calls _validate before _pipelineStateWriter on DoR gate-confirm

- **Verifies:** AC1
- **Precondition:** `journey.js` imported. `setValidate` injected with a stub that records call order and returns `{ exitCode: 0 }`. `setPipelineStateWriter` injected with a stub that records call order. Mock session contains `dorArtefactPath: path.join(repoRoot, 'artefacts/test/dor/test.md')` and `stage: 'definition-of-ready'`.
- **Action:** Invoke `handlePostGateConfirm(mockReq, mockRes)`.
- **Expected result:** Validate stub's recorded call index is lower than pipelineStateWriter stub's recorded call index. Both stubs are called exactly once.
- **Edge case:** No.

### T2 — returns 422 and does not call pipelineStateWriter when validate exits non-zero

- **Verifies:** AC2
- **Precondition:** Stubs injected. `setValidate` stub returns `{ exitCode: 3, stderr: 'H3: AC section missing or malformed' }`. `setPipelineStateWriter` stub records if called (it must not be).
- **Action:** Invoke `handlePostGateConfirm(mockReq, mockRes)`.
- **Expected result:** `mockRes.status` called with `422`. Response body contains `exitCode: 3` and `stderr` (or equivalent failing check detail). `setPipelineStateWriter` stub is never called.
- **Edge case:** Yes — verify pipelineStateWriter not called even though feature/story exist.

### T3 — returns 200 and calls pipelineStateWriter when validate exits 0

- **Verifies:** AC3
- **Precondition:** Stubs injected. `setValidate` stub returns `{ exitCode: 0 }`. `setPipelineStateWriter` stub records if called and returns successfully.
- **Action:** Invoke `handlePostGateConfirm(mockReq, mockRes)`.
- **Expected result:** `mockRes.status` called with `200` (or `res.json` called with success). `setPipelineStateWriter` stub called exactly once.
- **Edge case:** No.

### T4 — returns 400 and does not call validate when dorArtefactPath is a traversal

- **Verifies:** AC4, Security NFR
- **Precondition:** Stubs injected. Mock session contains `dorArtefactPath: '../../etc/passwd'`. `repoRoot` is the workspace root. Path `path.resolve('../../etc/passwd')` does NOT start with `repoRoot + path.sep`.
- **Action:** Invoke `handlePostGateConfirm(mockReq, mockRes)`.
- **Expected result:** `mockRes.status` called with `400`. `setValidate` stub is never called. `setPipelineStateWriter` stub is never called.
- **Edge case:** Yes — security boundary test. Also test with `path.join(repoRoot, '../../../etc/passwd')` as a second variant.

### T5 — setValidate export exists and replaces the default stub

- **Verifies:** AC5
- **Precondition:** `journey.js` imported fresh (or module cache cleared).
- **Action:** Call `require('../src/web-ui/routes/journey').setValidate`. Then call `setValidate(myStub)`. Record whether the next handler invocation calls `myStub`.
- **Expected result:** `setValidate` is exported as a function. After calling `setValidate(myStub)`, the handler uses `myStub` (not the default stub). The default stub is no longer reachable after wiring.
- **Edge case:** No.

### T6 — default validate stub throws "Adapter not wired: validate"

- **Verifies:** AC6, D37
- **Precondition:** `journey.js` imported with module cache cleared (to ensure `setValidate()` has never been called). Session contains a valid `dorArtefactPath` that passes path traversal check (a path under repoRoot).
- **Action:** Invoke `handlePostGateConfirm(mockReq, mockRes)` without having called `setValidate()`.
- **Expected result:** The handler throws (or returns 500) with an error message containing "Adapter not wired: validate" and naming the required setup call (`setValidate`).
- **Edge case:** Yes — module isolation: must clear require cache between tests that inject stubs.

### T7 — non-DoR stage gate-confirm does not call validate

- **Verifies:** AC7
- **Precondition:** `setValidate` stub injected that records if called. Mock session contains `stage: 'review'` (a non-DoR stage).
- **Action:** Invoke `handlePostGateConfirm(mockReq, mockRes)`.
- **Expected result:** `setValidate` stub is never called. Handler returns its existing response for the review stage (200 or as per existing behaviour). All pre-existing gate-confirm tests for non-DoR stages continue to pass (checked via `npm test` — no regressions).
- **Edge case:** No.

---

## Integration Tests

Integration tests inject the real `cli-outer-loop.validate` function (not a stub) and use real DoR artefact files on disk.

### IT1 — validate called with real validate function on passing DoR artefact fixture

- **Verifies:** AC3 (integration depth)
- **Components involved:** `handlePostGateConfirm` → real `cli-outer-loop.validate()` → fixture DoR artefact file on disk → `setPipelineStateWriter` stub (to avoid writing real state)
- **Precondition:** A real DoR artefact file is written to `workspace/test-tmp-cdg4/passing-dor.md` (copy of an existing signed-off DoR artefact from `artefacts/`). `setValidate` injected with real `cli-outer-loop.validate`. `setPipelineStateWriter` injected with a stub. Session `dorArtefactPath` points to the fixture file (path starts with repoRoot).
- **Action:** Invoke `handlePostGateConfirm(mockReq, mockRes)`.
- **Expected result:** Response is 200. The real `validate()` ran against the fixture and returned exit code 0 (the artefact passes). `setPipelineStateWriter` stub called once.

### IT2 — validate called with real validate function on failing DoR artefact fixture

- **Verifies:** AC2 (integration depth)
- **Components involved:** Same as IT1 but with a failing fixture.
- **Precondition:** A minimal artefact file is written to `workspace/test-tmp-cdg4/failing-dor.md` containing only "# Empty" (no AC section, no story slug, fails H3). `setValidate` injected with real `cli-outer-loop.validate`. `setPipelineStateWriter` injected with a stub.
- **Action:** Invoke `handlePostGateConfirm(mockReq, mockRes)`.
- **Expected result:** Response is 422. The real `validate()` returned non-zero. `setPipelineStateWriter` stub is never called. Response body contains exit code and failing check name.

---

## NFR Tests

### NFR-SEC-1 — path traversal guard asserts resolved path starts with repoRoot

- **NFR addressed:** Security — path traversal guard (Architecture Constraints and NFR section of cdg.4.md)
- **Measurement method:** T4 (unit test above) covers this assertion. This entry is for explicit NFR traceability: verify that `path.resolve(dorArtefactPath)` is checked against `repoRoot + path.sep` before any file operation. A test that passes a traversal path and asserts 400 with validate NOT called is the observable NFR verification.
- **Pass threshold:** 400 response, zero calls to validate stub, zero calls to pipelineStateWriter stub.
- **Tool:** Node.js assert — see T4 above. No separate test body needed; T4 is the NFR-SEC-1 test.

Performance NFR: None — confirmed. No SLA; gate-confirm is an infrequent human action.

---

## Out of Scope for This Test Plan

- Trace emission after gate-confirm — cdg.5 scope.
- Frontend error display changes — not in scope for cdg.4.
- Non-DoR gate type validation (review, test-plan gates) — deferred.
- Session management layer or journey GET handler — out of cdg.4 scope.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Module cache isolation for T6 (default stub test) | Node.js caches `require()` — if a prior test calls `setValidate(stub)`, T6 may not see the default stub | Use `delete require.cache[require.resolve(...)]` before T6 to reset module state. Document this in test file header. |
| `dorArtefactPath` source in session | The handler reads `dorArtefactPath` from session; the exact session key must be confirmed by reading the current journey.js implementation before coding | Low risk — the session key will be visible in the implementation once coding starts. Integration tests use the correct key. |
