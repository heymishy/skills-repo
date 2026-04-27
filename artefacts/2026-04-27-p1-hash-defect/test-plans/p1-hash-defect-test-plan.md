# Test Plan: p1-hash-defect — Fix hash self-comparison in cli-adapter advance()

**Story:** `artefacts/2026-04-27-p1-hash-defect/stories/p1-hash-defect.md`
**Feature slug:** `2026-04-27-p1-hash-defect`
**Date written:** 2026-04-27
**Review status:** Short-track exemption — no separate review step required for bounded bug fixes.
**Test data strategy:** Synthetic — all test data is generated inline in test setup. No real file system or skill content involved (resolveSkill is mocked).

---

## AC Coverage Table

| AC | Description | Test type | Test IDs | Status |
|----|-------------|-----------|----------|--------|
| AC1 | `verifyHash` receives `actual` from `resolveSkill.contentHash`, not from `expectedHash` | Unit | T1a–T1e | Will fail until fix applied |
| AC2 | When `contentHash ≠ expectedHash`, `advance` returns `HASH_MISMATCH` and does not call `advanceState` | Unit | T2a–T2c | Will fail until fix applied |
| AC3 | When `resolveSkill` returns `null`, `advance` returns `SKILL_NOT_FOUND` and does not call `advanceState` | Unit | T3a–T3c | Will fail until fix applied |
| AC4 | When `contentHash === expectedHash`, `advance` succeeds and calls `advanceState` | Unit | T4a–T4c | Will fail until fix applied |
| AC5 | Regression: existing transition-declaration enforcement preserved when no `skillId`/`sidecarRoot` | Unit (regression) | T5a–T5b | Will fail until fix applied |

---

## Test Data Strategy

**Strategy:** Synthetic — inline mock objects only.

All `govPackage` dependencies (`resolveSkill`, `verifyHash`, `advanceState`) are provided as mock functions injected via the `govPackage` parameter. No file system access, no real SKILL.md files, no network calls. Hash values are fixed 64-character hex strings (`'a'.repeat(64)`, `'b'.repeat(64)`, `'c'.repeat(64)`).

**PCI / sensitivity:** Not applicable — no real content involved.

---

## Unit Tests

### T1 — AC1: verifyHash actual param originates from resolveSkill

**File:** `tests/check-p1-hash-defect.js`
**Precondition:** `src/enforcement/cli-adapter.js` loads without error; `advance` is exported.
**Action:** Call `advance()` with a mock `govPackage` where `resolveSkill` returns `contentHash: 'c'.repeat(64)` (distinct from `expectedHash: 'a'.repeat(64)`); mock `verifyHash` captures what `actual` and `expected` were passed to it; mock returns `null` (no mismatch) so the call completes.
**Expected results:**
- T1a: `resolveSkill` was called.
- T1b: `verifyHash` was called.
- T1c: `verifyHash` received `actual === 'c'.repeat(64)` (from `resolveSkill`).
- T1d: `verifyHash` received `actual !== 'a'.repeat(64)` (not the self-comparison value).
- T1e: `verifyHash` received `expected === 'a'.repeat(64)` (the caller-supplied expected hash).
**Edge case:** The test deliberately uses three distinct hash values to prove the source of `actual` unambiguously.

### T2 — AC2: resolveSkill contentHash differs → HASH_MISMATCH, no state advance

**Precondition:** Same as T1.
**Action:** Call `advance()` with `resolveSkill` returning `contentHash: 'b'.repeat(64)` while `expectedHash` is `'a'.repeat(64)`. Mock `verifyHash` performs the real comparison (`expected !== actual → HASH_MISMATCH`). `advanceState` records whether it was called.
**Expected results:**
- T2a: `advance()` returns a non-null result.
- T2b: `result.error === 'HASH_MISMATCH'`.
- T2c: `advanceState` was NOT called.

### T3 — AC3: resolveSkill returns null → SKILL_NOT_FOUND, no state advance

**Precondition:** Same as T1.
**Action:** Call `advance()` with `resolveSkill` returning `null`.
**Expected results:**
- T3a: `advance()` returns a non-null result.
- T3b: `result.error === 'SKILL_NOT_FOUND'`.
- T3c: `advanceState` was NOT called.

### T4 — AC4: contentHash matches expectedHash → success, advanceState called

**Precondition:** Same as T1.
**Action:** Call `advance()` with `resolveSkill` returning `contentHash: 'a'.repeat(64)` and `expectedHash: 'a'.repeat(64)`. Mock `verifyHash` performs the real comparison (match → `null`). `advanceState` records whether it was called.
**Expected results:**
- T4a: `advance()` does not throw.
- T4b: `result.error` is `undefined`.
- T4c: `advanceState` was called.

### T5 — AC5: regression — no skillId/sidecarRoot preserves existing transition enforcement

**Precondition:** Same as T1.
**Action (T5a):** Call `advance()` without `skillId`/`sidecarRoot` to a non-permitted state.
**Expected:** `result.error === 'TRANSITION_NOT_PERMITTED'`.
**Action (T5b):** Call `advance()` without `skillId`/`sidecarRoot` to a permitted state.
**Expected:** `result.error` is undefined (success).

---

## NFR Tests

**NFR — No new npm dependencies:** Verified structurally — `check-p1-hash-defect.js` uses only Node.js built-ins (`fs`, `path`, `os`). No `require` of any npm package is present. The fix to `cli-adapter.js` must likewise add no npm dependencies.

---

## Gap Table

| Gap | AC | Gap type | Handling |
|-----|----|---------| ---------|
| Real file-system hash computation | AC1 | Integration not tested | The unit tests mock `resolveSkill`. The integration path (real file read + SHA-256) is tested by the existing `check-p4-enf-package.js` suite which covers `resolveSkill` directly. No gap in coverage at this story's scope. |

---

## Implementation guidance for coding agent

The fix is confined to `src/enforcement/cli-adapter.js`, `advance()` function.

**Before (lines 98–115, current defect):**
```js
function advance(opts) {
  const { current, next, declaration, govPackage, skillId, expectedHash } = opts || {};
  // ...
  if (govPackage && skillId) {
    const hashResult = govPackage.verifyHash({
      skillId:  skillId,
      expected: expectedHash,
      actual:   expectedHash,    // ← BUG: actual must not equal expected
    });
```

**After:**
```js
function advance(opts) {
  const { current, next, declaration, govPackage, skillId, expectedHash, sidecarRoot } = opts || {};
  // ...
  if (govPackage && skillId && sidecarRoot) {
    const resolved = govPackage.resolveSkill({ skillId, sidecarRoot });
    if (!resolved) {
      return { error: 'SKILL_NOT_FOUND', skillId };
    }
    const hashResult = govPackage.verifyHash({
      skillId:  skillId,
      expected: expectedHash,
      actual:   resolved.contentHash,    // ← FIX: actual hash from file
    });
    if (hashResult) {
      const exp = hashResult.expected || expectedHash || '';
      const act = hashResult.actual   || '';
      return {
        error:   'HASH_MISMATCH',
        message: 'Hash mismatch for skill ' + skillId + ': expected ' + exp + ', got ' + act,
      };
    }
  }
```

**No other files need to change.** `governance-package.js` is correct. `verifyHash` already returns the right thing.
