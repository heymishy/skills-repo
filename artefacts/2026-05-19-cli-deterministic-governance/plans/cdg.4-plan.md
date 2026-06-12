# Implementation Plan — cdg.4: Web UI gate-confirm CLI validation integration

**Story:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.4.md
**DoR contract:** artefacts/2026-05-19-cli-deterministic-governance/dor/cdg.4-dor-contract.md
**Date:** 2026-05-25
**Branch:** feature/cdg.4 (worktree at .worktrees/cdg.4)

---

## Design rationale

`handlePostGateConfirm` in `journey.js` already has a path traversal guard for the artefact path (lines 141–145) that returns HTTP 400 before any file operations. The validate call is placed AFTER this existing guard and AFTER the artefact disk write, but BEFORE the `_pipelineStateWriter` call. This satisfies ADR-023 (disk-write → validate → state-write order).

The `_validate` injectable adapter mirrors `_pipelineStateWriter` exactly (D37 pattern: default stub throws, `setValidate(fn)` replaces it). The validate call goes INSIDE the `if (session.skillName === 'definition-of-ready')` branch, guarded by a try/catch that returns HTTP 500 if the default stub throws (D37 enforcement visible to callers). Non-DoR stages skip the block entirely.

Two existing ougl7 tests (T7.3, T7.4) use `skillName: 'definition-of-ready'` in `handlePostGateConfirm` but do not inject `setValidate`. After this change, the throwing default stub causes those tests to fail. Both tests must be updated to inject `journey.setValidate(function() { return { exitCode: 0 }; })` in their setup — this is "forced by failing test" per the DoR out-of-scope clause.

---

## Task breakdown

### Task 1: Write failing tests (TDD red) — `tests/check-cdg4-gate-confirm-validation.js`

Create the test file with 10 tests (T1–T7, IT1, IT2, NFR-SEC-1). All tests fail at this point because `_validate` and `setValidate` do not yet exist in `journey.js`.

**Tests:**
- T1: validate stub call-order is before pipelineStateWriter stub; both called once
- T2: validate returns exitCode 3 → handler returns 422, pipelineStateWriter not called
- T3: validate returns exitCode 0 → handler returns 303 (success path), pipelineStateWriter called
- T4: session.artefactPath = '../../etc/passwd' → handler returns 400, validate not called (tests existing path guard + new behaviour)
- T5: `require('./src/web-ui/routes/journey').setValidate` is a function
- T6: fresh module load (no setValidate called) + DoR gate-confirm → handler catches throw and returns 500 with 'Adapter not wired: validate'
- T7: session.skillName = 'review' → validate stub not called, handler returns normally
- IT1: real `cli-outer-loop.validate` injected + passing DoR fixture → 303, pipelineStateWriter called
- IT2: real `cli-outer-loop.validate` injected + failing fixture → 422, pipelineStateWriter not called
- NFR-SEC-1: dorArtefactPath traversal variant (path.join(repoRoot,'../../../etc/passwd')) → 400

Commit: `test(cdg.4): add failing tests for gate-confirm validate adapter — TDD red`

---

### Task 2a: Add `_validate` adapter to `journey.js` (handler changes)

**Location:** After line ~38 (after `_pipelineStateWriter` / `setPipelineStateWriter` block)

```js
// cdg.4: injectable validate adapter — gate-confirm DoR enforcement
var _validate = function() {
  throw new Error('Adapter not wired: validate. Call setValidate() before use.');
};
function setValidate(fn) { _validate = fn; }
```

**Location:** Inside `handlePostGateConfirm`, AFTER `_journeyStore.completeStage(...)` and BEFORE the pipeline-state try block (currently lines ~159+):

```js
  // cdg.4: validate DoR artefact before state write (ADR-023: disk → validate → state)
  if (session.skillName === 'definition-of-ready') {
    var validateResult;
    try {
      validateResult = _validate(absPath, 'definition-of-ready', repoRoot);
    } catch (validErr) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: validErr.message }));
      return;
    }
    if (validateResult.exitCode !== 0) {
      res.writeHead(422, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'validation-failed', exitCode: validateResult.exitCode, detail: validateResult.stderr || '' }));
      return;
    }
  }
```

**Location:** Exports block (alongside `setPipelineStateWriter`):
```js
  setValidate: setValidate,
```

Also update the `require('./routes/journey')` destructuring in `server.js` to include `setValidate`.

Commit: `feat(cdg.4): add _validate injectable adapter to journey.js gate-confirm (AC1-AC7)`

---

### Task 2b: Update ougl7 tests (regression-fix required by Task 2a)

File: `tests/check-ougl7-dor-and-journey-complete.js`

In T7.3 and T7.4 setup blocks, add after `journey.setRepoRoot(tmpdir)`:
```js
    journey.setValidate(function() { return { exitCode: 0 }; });
```

This is the minimal change to keep routing tests green after the new validation guard.

Commit: bundled with feat(cdg.4) as a single commit (regression fix)

---

### Task 3: Wire production validate in `server.js` (D37 mandatory separate task)

**Location:** After the `setPipelineStateWriter` wiring block (~line 148):

```js
// cdg.4: wire validate adapter (D37 mandatory — separate from handler task)
{
  const { setValidate } = require('./routes/journey');
  if (process.env.NODE_ENV === 'test') {
    setValidate(function() { return { exitCode: 0 }; }); // no-op in test mode
  } else {
    setValidate(require('../enforcement/cli-outer-loop').validate);
  }
}
```

Commit: `feat(cdg.4): wire production validate adapter in server.js (D37 AC5)`

---

### Task 4: Add test to npm test chain — `package.json`

Append to the existing test chain:
```
&& node tests/check-cdg4-gate-confirm-validation.js
```

Commit: `chore(cdg.4): add check-cdg4-gate-confirm-validation.js to npm test chain (AC8)`

---

## Key constraints

- ADR-023: validate MUST be called after disk write, BEFORE `_pipelineStateWriter`
- D37: default stub throws; server.js wiring is a SEPARATE commit from handler changes
- ADR-H7.1: NO subprocess spawning — `_validate` is injected as a function reference
- Path traversal guard: existing guard at lines 141–145 covers AC4; validate is never reached for traversal paths
- No frontend changes (HTML/CSS/client JS)
- `cli-outer-loop.js` is read-only — do NOT modify
