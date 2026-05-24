# Implementation Plan — cdg.5: Chain-hash trace emission on gate-confirm

**Story:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.5.md
**DoR artefact:** artefacts/2026-05-19-cli-deterministic-governance/dor/cdg.5-dor.md
**Date:** 2026-05-24
**Approach:** TDD — RED (failing tests) → GREEN (implement) → verify

---

## Baseline

- Branch: `feature/cdg.5`
- Worktree: `.worktrees/cdg.5`
- HEAD at branch-setup: `cb93bfc`
- Baseline `npm test` result: EXIT 0, 10 passed, 0 failed

---

## Files to modify

| File | Action | AC(s) |
|------|--------|-------|
| `tests/check-cdg5-trace-emission.js` | Create — 10 TDD tests | AC8 (RED first) |
| `package.json` | Modify — append test to chain | AC8 |
| `src/enforcement/governance-package.js` | Modify — extend `writeTrace` for gate-confirm chain-hash | AC1–AC3 |
| `src/web-ui/routes/journey.js` | Modify — add `setWriteTrace` adapter + trace write in `handlePostGateConfirm` | AC1, AC4–AC6 |
| `src/web-ui/server.js` | Modify — production wiring (D37 mandatory separate task) | AC5 |
| `.gitignore` | Modify — add `workspace/traces/` | AC7 |

---

## Architecture constraints

- **ADR-001:** CommonJS only — `'use strict'; require()`. No `import` or ESM syntax.
- **ADR-023 (Disk canonicity):** Trace write occurs AFTER successful `_pipelineStateWriter()` call. If state write throws, trace write is not reached. The `_pipelineStateWriter` try/catch block is modified to use a `stateWriteSucceeded` flag.
- **D37 (Injectable adapter rule):** Default `_writeTrace` stub MUST throw. Production wiring is a SEPARATE task from handler integration.
- **Append-only:** Trace writer MUST use `fs.appendFileSync` — never `fs.writeFileSync` on the JSONL trace file.
- **Chain hash algorithm:** `SHA-256(JSON.stringify(entryWithoutChainHash) + prevChainHash)` where `prevChainHash` is the `chainHash` field of the last line in the JSONL file (empty string `""` for first entry).
- **`operatorEmail`:** Obtained via `require('child_process').execSync('git config user.email', { encoding: 'utf8' }).trim()` — empty string on failure.
- **Backward compatibility:** Existing `governance-package.writeTrace` T8 test calls `writeTrace({ skillId, skillHash, inputHash, outputRef, transitionTaken, surfaceType, timestamp, outputPath })`. This must continue to work unchanged. Gate-confirm mode is detected by presence of `entry.featureSlug`.

---

## Task 1 — TDD Red: Create failing test file + add to npm chain

**Entry condition:** Baseline passes (`npm test` exits 0).
**Exit condition:** `npm test` fails on `check-cdg5-trace-emission.js` — all 10 tests throw (functions don't exist yet).

### Files touched
- `tests/check-cdg5-trace-emission.js` — new file, 10 tests
- `package.json` — append `&& node tests/check-cdg5-trace-emission.js`

### Tests to write (TDD-red state — all fail until Task 2–5 complete)

**T1 — appends trace entry with required fields on successful gate-confirm** (AC1)
- Inject stubs: `setValidate` → `{ exitCode: 0 }`, `setPipelineStateWriter` → no-op, `setWriteTrace` → capture argument
- Call `handlePostGateConfirm(mockReq, mockRes)`
- Assert: captured arg contains `timestamp` (ISO string), `featureSlug`, `storyId`, `stage: 'definition-of-ready'`, `exitCode: 0`, `chainHash` (non-empty hex string), `operatorEmail` (string — may be empty in CI)

**T2 — chain hash correct for N>1 entries** (AC2)
- Write one prior entry to temp JSONL at `workspace/test-tmp-cdg5/chain-test.trace.jsonl` with known `chainHash`
- Call `governance-package.writeTrace({ featureSlug: 'chain-test', ..., timestamp, operatorEmail: 'test@example.com' }, { tracePath: tmpPath })`
- Recompute expected hash in test: `crypto.createHash('sha256').update(JSON.stringify(entryWithoutHash) + prevChainHash).digest('hex')`
- Assert: new entry's `chainHash` equals recomputed expected hash

**T3 — first entry uses empty-string prior hash** (AC3)
- Temp JSONL absent
- Call `writeTrace({ featureSlug: 'first-entry-test', ... }, { tracePath: tmpPath })`
- Assert: `chainHash` equals `SHA-256(JSON.stringify(entryWithoutHash) + '')`

**T4 — no trace entry written when validate exits non-zero** (AC4)
- Inject: `setValidate` → `{ exitCode: 3 }`, `setWriteTrace` → throws if called
- Call `handlePostGateConfirm(mockReq, mockRes)`
- Assert: response status 422, `setWriteTrace` stub never called

**T5 — setWriteTrace export exists and wires the adapter** (AC5)
- `require('./src/web-ui/routes/journey').setWriteTrace` is a function
- After calling `setWriteTrace(myStub)`, handler uses `myStub`

**T6 — default stub throws "Adapter not wired: writeTrace"** (AC6, D37)
- Clear module cache; load journey.js fresh; do NOT call `setWriteTrace`
- Inject: `setValidate` → exit 0, `setPipelineStateWriter` → no-op
- Call `handlePostGateConfirm(mockReq, mockRes)`
- Assert: error propagates with message containing `'Adapter not wired: writeTrace'`

**T7 — workspace/traces/ appears in .gitignore** (AC7)
- Read `.gitignore` from repo root
- Assert: file contains line matching `workspace/traces/` (not commented out)

**IT1 — real governance-package.writeTrace writes + chain-hashes two entries end-to-end** (AC1, AC2, NFR-INT-1)
- Wire `setWriteTrace` with wrapper: `(entry) => govPkg.writeTrace(entry, { tracePath: tmpPath })`
- Call `handlePostGateConfirm` twice (different `storyId` values)
- Assert: temp JSONL has exactly 2 lines; each is valid JSON
- Assert: line 1 `chainHash` = `SHA-256(JSON.stringify(line1WithoutHash) + '')`
- Assert: line 2 `chainHash` = `SHA-256(JSON.stringify(line2WithoutHash) + line1.chainHash)`
- Teardown: delete temp file

**NFR-INT-1 — second trace write appends (line count increases by 1)** (covered within IT1)
- Verify `after === before + 1` — if `after === 1` after 2 writes, JSONL was overwritten (defect)

**NFR-ISO-1 — test isolation: unique slugs, teardown in afterEach**
- Each test that writes a trace file uses a unique `featureSlug`
- Temp files at `workspace/test-tmp-cdg5/<slug>.trace.jsonl` deleted after each test
- Assert: running `npm test` twice produces identical results

### Commit message
```
test(cdg.5): TDD red — 10 failing tests for chain-hash trace emission
```

---

## Task 2 — Extend governance-package.writeTrace for gate-confirm chain hash

**Entry condition:** Task 1 complete (test file exists, tests fail).
**Exit condition:** T2, T3, IT1, NFR-INT-1 pass. Existing T8 (Phase 4 skill trace) still passes.

### File touched
`src/enforcement/governance-package.js`

### Changes

Modify `writeTrace` to detect gate-confirm mode via presence of `entry.featureSlug`:

```js
function writeTrace(entry, options) {
  // Gate-confirm trace mode (cdg.5) — chain hash + appendFileSync
  if (entry && typeof entry.featureSlug === 'string') {
    return _writeGateConfirmTrace(entry, options);
  }
  // Legacy Phase 4 skill trace mode (original behaviour — T8 compatibility)
  var skillId = entry.skillId, skillHash = entry.skillHash, ...;
  var legacyEntry = { skillId: skillId || null, skillHash, inputHash, outputRef, transitionTaken, surfaceType, timestamp };
  if (entry.outputPath) { fs.writeFileSync(entry.outputPath, JSON.stringify(legacyEntry, null, 2), 'utf8'); }
  return legacyEntry;
}
```

Add internal helper `_writeGateConfirmTrace(entry, options)`:
1. Resolve `tracePath`: `(options && options.tracePath) || path.join(path.resolve(__dirname, '../..'), 'workspace', 'traces', entry.featureSlug + '.trace.jsonl')`
2. `fs.mkdirSync(path.dirname(tracePath), { recursive: true })`
3. Read `prevChainHash`: if file exists, read last non-empty line, parse JSON, extract `.chainHash` (default `''`)
4. Build `entryWithoutHash`: `{ timestamp, featureSlug, storyId, stage, operatorEmail, exitCode }`
5. `chainHash = crypto.createHash('sha256').update(JSON.stringify(entryWithoutHash) + prevChainHash).digest('hex')`
6. `finalEntry = Object.assign({}, entryWithoutHash, { chainHash })`
7. `fs.appendFileSync(tracePath, JSON.stringify(finalEntry) + '\n', 'utf8')`
8. Return `finalEntry`

### Commit message
```
feat(cdg.5): extend governance-package.writeTrace for gate-confirm chain-hash (AC2, AC3)
```

---

## Task 3 — Add setWriteTrace adapter to journey.js (handler integration)

**Entry condition:** Task 2 complete.
**Exit condition:** T1, T4, T5, T6 pass.

### File touched
`src/web-ui/routes/journey.js`

### Changes

**3a — Add `_writeTrace` stub + `setWriteTrace` after `setValidate` block (lines ~41-44):**

```js
// cdg.5: injectable writeTrace adapter — gate-confirm chain-hash trace emission (D37)
var _writeTrace = function() {
  throw new Error('Adapter not wired: writeTrace. Call setWriteTrace() before use.');
};
function setWriteTrace(fn) { _writeTrace = fn; }
```

**3b — Modify `_pipelineStateWriter` try/catch in `handlePostGateConfirm` to track success, then add trace write after (lines ~185-215 area):**

Replace the existing `_pipelineStateWriter` try/catch:
```js
  // owle.6: notify pipeline-state writer (after disk write + completeStage)
  try {
    ...
    _pipelineStateWriter(journey.featureSlug, storyId, stateUpdate);
  } catch (psErr) {
    console.error(JSON.stringify({ event: 'pipeline_state_write_failed', error: psErr.message }));
  }
```

With a version that uses a `stateWriteSucceeded` flag + trace write after:
```js
  // owle.6: notify pipeline-state writer (after disk write + completeStage)
  var stateWriteSucceeded = false;
  try {
    ...
    _pipelineStateWriter(journey.featureSlug, storyId, stateUpdate);
    stateWriteSucceeded = true;
  } catch (psErr) {
    console.error(JSON.stringify({ event: 'pipeline_state_write_failed', error: psErr.message }));
  }

  // cdg.5: chain-hash trace emission — only after successful state write (ADR-023)
  // If _writeTrace throws, exception propagates (state is already written and final)
  if (session.skillName === 'definition-of-ready' && stateWriteSucceeded) {
    var operatorEmail = '';
    try { operatorEmail = require('child_process').execSync('git config user.email', { encoding: 'utf8' }).trim(); } catch (_) {}
    _writeTrace({
      timestamp: new Date().toISOString(),
      featureSlug: journey.featureSlug,
      storyId: storyId,
      stage: session.skillName,
      operatorEmail: operatorEmail,
      exitCode: 0
    });
  }
```

**3c — Add `setWriteTrace` to module.exports (after `setValidate`):**
```js
  setValidate,
  setWriteTrace,
```

### Commit message
```
feat(cdg.5): add setWriteTrace injectable adapter + trace write in gate-confirm (AC1, AC4-AC6)
```

---

## Task 4 — Wire production adapter in server.js (D37 mandatory separate task)

**Entry condition:** Task 3 complete.
**Exit condition:** server.js starts without error; E2E tests unaffected. Production wiring verified by code review.

### File touched
`src/web-ui/server.js`

### Changes

Add after the `setValidate` wiring block (after line ~158):

```js
// cdg.5: Wire writeTrace adapter — gate-confirm chain-hash trace emission (D37 mandatory)
{
  const { setWriteTrace } = require('./routes/journey');
  if (process.env.NODE_ENV === 'test') {
    setWriteTrace(function() {}); // no-op in test mode
  } else {
    setWriteTrace(require('../enforcement/governance-package').writeTrace);
  }
}
```

Also add `setWriteTrace` to the destructuring import on line 29:
```js
const { ..., setValidate, setWriteTrace, handleGetWizard, ... } = require('./routes/journey');
```

### Commit message
```
feat(cdg.5): wire production writeTrace in server.js (D37 AC5)
```

---

## Task 5 — Add workspace/traces/ to .gitignore

**Entry condition:** Any point — independent of other tasks.
**Exit condition:** T7 passes. `git status` does not show `workspace/traces/` as untracked.

### File touched
`.gitignore`

### Change

Add line after `workspace/capture-log.md` (or at end of workspace section):
```
workspace/traces/
```

### Commit message
```
chore(cdg.5): add workspace/traces/ to .gitignore (AC7)
```

---

## Task 6 — Run npm test + verify all 10 pass

**Entry condition:** Tasks 1–5 complete.
**Exit condition:** `npm test` exits 0, all 10 new tests in `check-cdg5-trace-emission.js` pass. All prior tests (10+) still pass.

### Steps
1. `cd .worktrees/cdg.5 && npm test`
2. Confirm zero failures
3. Clean up any `workspace/test-tmp-cdg5/` test artifacts if present

---

## Commit sequence

| # | Task | Commit message |
|---|------|----------------|
| 1 | RED tests + npm chain | `test(cdg.5): TDD red — 10 failing tests for chain-hash trace emission` |
| 2 | governance-package.writeTrace | `feat(cdg.5): extend governance-package.writeTrace for gate-confirm chain-hash (AC2, AC3)` |
| 3 | journey.js adapter + handler | `feat(cdg.5): add setWriteTrace adapter + trace write in gate-confirm (AC1, AC4-AC6)` |
| 4 | server.js wiring | `feat(cdg.5): wire production writeTrace in server.js (D37 AC5)` |
| 5 | .gitignore | `chore(cdg.5): add workspace/traces/ to .gitignore (AC7)` |
| 6 | Plan + pipeline-state update | `chore: implementation-plan cdg.5 — 5 tasks, TDD approach` |

---

## Post-plan: open draft PR

After all tasks pass `npm test`, run `/branch-complete` to open draft PR targeting master from `feature/cdg.5`.

---

## Risk register

| Risk | Mitigation |
|------|-----------|
| Existing T8 test breaks if `writeTrace` signature changes | Detect mode via `entry.featureSlug` — old path unchanged |
| `stateWriteSucceeded` flag logic incorrect | Write T6 test to verify trace fires only after state write success |
| Windows CRLF line endings corrupt JSONL parsing | Use `split('\n')` with `.trim()` filter — tolerates `\r\n` |
| `git config user.email` fails in CI (no git config) | Wrapped in try/catch; empty string is valid `operatorEmail` |
| `workspace/test-tmp-cdg5/` left behind in CI | NFR-ISO-1 teardown deletes temp files; directory cleanup in test afterAll |
