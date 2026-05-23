# Test Plan: Chain-hash trace emission on gate-confirm

**Story reference:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.5.md
**Epic reference:** artefacts/2026-05-19-cli-deterministic-governance/epics/cdg-phase2-advance-and-trace.md
**Test plan author:** GitHub Copilot (Claude Sonnet 4.6) — operator-directed /test-plan
**Date:** 2026-05-24

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Successful gate-confirm appends trace entry with required fields | T1 | IT1 | — | — | — | 🟢 |
| AC2 | Chain hash equals SHA-256(entry-without-hash + prev-hash) for N>1 entries | T2 | IT1 | — | — | — | 🟢 |
| AC3 | First entry uses empty-string as prior hash | T3 | — | — | — | — | 🟢 |
| AC4 | Failed gate-confirm (validation failure) does not write trace | T4 | — | — | — | — | 🟢 |
| AC5 | setWriteTrace is injectable from journey.js exports | T5 | — | — | — | — | 🟢 |
| AC6 | Default stub throws "Adapter not wired: writeTrace" | T6 | — | — | — | — | 🟢 |
| AC7 | workspace/traces/ appears in .gitignore | T7 | — | — | — | — | 🟢 |
| AC8 | npm test includes check-cdg5-trace-emission.js, all pass | — | — | — | — | — | 🟢 |

---

## Coverage gaps

None — all 8 ACs are automatable. No CSS-layout-dependent, DOM-behaviour, or external-dependency gaps.

---

## Test Data Strategy

**Source:** Synthetic — tests inject stubs for `validate`, `pipelineStateWriter`, and `writeTrace` adapters. For chain hash tests, trace files are written to `workspace/test-tmp-cdg5/` and cleaned up in teardown.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Mock req/res, stubs for validate (exit 0) and pipelineStateWriter (succeeds), stub writeTrace that captures arguments | Synthetic | None | Capture call args to verify entry fields |
| AC2 | A temp `workspace/test-tmp-cdg5/<slug>.trace.jsonl` with one existing entry | Synthetic — written in test setup | None | Use unique slug per test |
| AC3 | Temp trace file that does not exist yet (first entry) | Synthetic — file absent in test setup | None | |
| AC4 | Stub validate returning `{ exitCode: 3 }`, stub pipelineStateWriter (must not be called), stub writeTrace (must not be called) | Synthetic | None | |
| AC5 | n/a — tests the export shape of journey.js | n/a | None | |
| AC6 | Default state — journey.js loaded without setWriteTrace() | n/a | None | |
| AC7 | `.gitignore` file in repo root | Existing file | None | Read .gitignore, assert contains workspace/traces/ |
| IT1 | Real governance-package.writeTrace, temp trace file at `workspace/test-tmp-cdg5/<slug>.trace.jsonl` | Real module + synthetic temp path | None | Clean up after test |

### PCI / sensitivity constraints

None.

### Gaps

None — all data is synthetic or reads existing repo files.

---

## Unit Tests

All unit tests invoke `handlePostGateConfirm` directly via stub injection. Stubs for `setValidate`, `setPipelineStateWriter`, and `setWriteTrace` are set before each test. Module cache cleared between tests that need a fresh default stub.

### T1 — appends trace entry with required fields on successful gate-confirm

- **Verifies:** AC1
- **Precondition:** `setValidate` stub returns `{ exitCode: 0 }`. `setPipelineStateWriter` stub returns successfully. `setWriteTrace` stub records the call argument. Mock session has `featureSlug: 'test-cdg5-t1'`, `storyId: 'test-story-cdg5'`, `stage: 'definition-of-ready'`, `dorArtefactPath: path.join(repoRoot, 'artefacts/test.md')`.
- **Action:** Invoke `handlePostGateConfirm(mockReq, mockRes)`.
- **Expected result:** `setWriteTrace` stub called exactly once. The argument contains: `timestamp` (ISO 8601 string), `featureSlug: 'test-cdg5-t1'`, `storyId: 'test-story-cdg5'`, `stage: 'definition-of-ready'`, `exitCode: 0`, `chainHash` (a non-empty hex string). `operatorEmail` is present (may be empty string if git config is unset in test environment).
- **Edge case:** No — happy path.

### T2 — chain hash equals SHA-256(entry-without-hash + prev-hash) for N>1 entries

- **Verifies:** AC2
- **Precondition:** A temp trace file at `workspace/test-tmp-cdg5/chain-test.trace.jsonl` is pre-written with one entry: `{ "timestamp": "2026-05-24T00:00:00.000Z", "featureSlug": "chain-test", "storyId": "s1", "stage": "definition-of-ready", "exitCode": 0, "chainHash": "<pre-computed-hash>" }`. `setWriteTrace` injected with the real `governance-package.writeTrace` pointing at the temp file (or a stub that computes the chain hash using the same algorithm).
- **Action:** Call `writeTrace({ featureSlug: 'chain-test', storyId: 's2', stage: 'definition-of-ready', exitCode: 0, timestamp: '2026-05-24T00:01:00.000Z', operatorEmail: 'test@example.com' })` with the temp file path.
- **Expected result:** The new entry appended to the temp file has `chainHash` equal to `crypto.createHash('sha256').update(JSON.stringify(entryWithoutChainHash) + prevHash).digest('hex')`. The test re-computes this in the assertion body.
- **Edge case:** Yes — hash validation requires re-computing the expected hash in the test; the expected value is not a hardcoded string but computed from the same algorithm.

### T3 — first entry uses empty string as prior hash

- **Verifies:** AC3
- **Precondition:** Temp trace file `workspace/test-tmp-cdg5/first-entry-test.trace.jsonl` does NOT exist.
- **Action:** Call `writeTrace({ featureSlug: 'first-entry-test', storyId: 's1', stage: 'definition-of-ready', exitCode: 0, timestamp: '2026-05-24T00:00:00.000Z', operatorEmail: '' })` with the temp file path.
- **Expected result:** The trace file is created. It contains exactly one line. The entry's `chainHash` equals `crypto.createHash('sha256').update(JSON.stringify(entryWithoutChainHash) + '').digest('hex')` where the prior hash is the empty string.
- **Edge case:** Yes — empty-string prior hash is a defined boundary condition; the test recomputes the expected hash with `prevHash = ''`.

### T4 — no trace entry written when validate exits non-zero

- **Verifies:** AC4
- **Precondition:** `setValidate` stub returns `{ exitCode: 3, stderr: 'H3: AC section missing' }`. `setWriteTrace` stub records if called (it must not be). `setPipelineStateWriter` stub records if called (it must not be either).
- **Action:** Invoke `handlePostGateConfirm(mockReq, mockRes)`.
- **Expected result:** `setWriteTrace` stub is never called. `setPipelineStateWriter` stub is never called. Response is 422.
- **Edge case:** No.

### T5 — setWriteTrace export exists and wires the adapter

- **Verifies:** AC5
- **Precondition:** `journey.js` imported. Module exports inspected.
- **Action:** Call `require('../src/web-ui/routes/journey').setWriteTrace`. Then call `setWriteTrace(myStub)`. Record whether the handler invocation uses `myStub`.
- **Expected result:** `setWriteTrace` is exported as a function. After calling `setWriteTrace(myStub)`, the handler calls `myStub` (not the default stub). This mirrors the existing `setValidate` pattern (AC5 of cdg.4).
- **Edge case:** No.

### T6 — default stub throws "Adapter not wired: writeTrace"

- **Verifies:** AC6, D37
- **Precondition:** `journey.js` imported with module cache cleared. `setValidate` stub returns exit 0. `setPipelineStateWriter` stub succeeds. `setWriteTrace()` has NOT been called — default stub is in place. Session is valid.
- **Action:** Invoke `handlePostGateConfirm(mockReq, mockRes)`.
- **Expected result:** Handler throws (or returns 500) with error message containing "Adapter not wired: writeTrace". The message names the required setup call (`setWriteTrace`). This happens AFTER the state write (since trace is the last step in the flow post cdg.4).
- **Edge case:** Yes — module isolation: require cache must be cleared. This test verifies the post-state-write step only (validate and pipelineStateWriter stubs succeed first).

### T7 — workspace/traces/ entry appears in .gitignore

- **Verifies:** AC7
- **Precondition:** `.gitignore` exists at repo root.
- **Action:** Read `path.join(repoRoot, '.gitignore')` and check for `workspace/traces/` (or `workspace/traces`) as a pattern.
- **Expected result:** `.gitignore` contains an entry matching `workspace/traces/` or `workspace/traces`. The entry is present as a distinct line (not commented out).
- **Edge case:** No — this is a static file check.

---

## Integration Tests

### IT1 — real governance-package.writeTrace writes and chain-hashes two entries end-to-end

- **Verifies:** AC1, AC2
- **Components involved:** `handlePostGateConfirm` → `setValidate` (real `cli-outer-loop.validate` OR stub returning exit 0 — real validate requires a fixture DoR artefact) → `setPipelineStateWriter` stub → `setWriteTrace` wired to real `governance-package.writeTrace` with temp trace file path
- **Precondition:** Temp trace file `workspace/test-tmp-cdg5/it1-test.trace.jsonl` absent. `setWriteTrace` injected with a wrapper around real `governance-package.writeTrace` that uses the temp path. `setValidate` stub returns `{ exitCode: 0 }`. `setPipelineStateWriter` stub succeeds.
- **Action:** Invoke `handlePostGateConfirm` twice with `featureSlug: 'it1-test'` and different `storyId` values.
- **Expected result:** `workspace/test-tmp-cdg5/it1-test.trace.jsonl` has exactly 2 lines. Each line is valid JSON. Line 2's `chainHash` equals `SHA-256(JSON.stringify(line2WithoutHash) + line1.chainHash)`. Line 1's `chainHash` equals `SHA-256(JSON.stringify(line1WithoutHash) + '')`. Teardown deletes the temp file.

---

## NFR Tests

### NFR-INT-1 — second trace write appends (does not overwrite): line count increases by 1

- **NFR addressed:** Integrity — append-only file write constraint (cdg.5.md NFR section)
- **Measurement method:** Count lines in trace file before and after a second `writeTrace` call. Verify `after === before + 1`.
- **Pass threshold:** `lineCountAfter === lineCountBefore + 1`. If `lineCountAfter === 1` after two writes, the file was overwritten — this is a defect.
- **Tool:** Node.js `fs.readFileSync` + split on newlines. Covered as part of IT1 (two invocations; line count verified).

### NFR-ISO-1 — test isolation: unique slugs and teardown

- **NFR addressed:** Test isolation (cdg.5.md NFR section)
- **Measurement method:** Each test that writes a trace file uses a unique `featureSlug` (e.g. `chain-test`, `first-entry-test`, `it1-test`). After each test, the trace file at `workspace/test-tmp-cdg5/<slug>.trace.jsonl` is deleted in `afterEach` teardown. Verify: running the test suite twice produces the same result (no cross-test contamination).
- **Pass threshold:** Second `npm test` run produces identical pass/fail counts. No `ENOENT` errors from stale fixture files.
- **Tool:** Documented test setup/teardown pattern in `tests/check-cdg5-trace-emission.js` file header. Manual verification by running `npm test` twice in sequence.

---

## Out of Scope for This Test Plan

- `skills verify-trace` (trace chain verification CLI) — not in cdg.5 scope.
- Rotation or archiving of trace files — not in cdg.5 scope.
- Non-DoR gate trace entries — only `definition-of-ready` stage is in scope.
- `operatorEmail` sourced from anything other than `git config user.email` — HSM identity is Phase 3.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| `operatorEmail` field in T1 may be empty string in CI | `git config user.email` returns empty in some CI environments where git identity is not configured | The test asserts `entry.operatorEmail !== undefined` (field present), not a specific value. AC1 specifies the field must be present; the value itself is environment-dependent. |
| Chain hash algorithm alignment between test and implementation | T2 and T3 re-compute the expected hash using the same algorithm as the implementation — if the implementation uses a different field serialisation order for JSON.stringify, hashes will diverge | The test must use `JSON.stringify(entryWithoutHash)` in exactly the same way as the implementation. Add a comment in the test noting the expected field order. If hashes diverge post-implementation, examine serialisation order. |
