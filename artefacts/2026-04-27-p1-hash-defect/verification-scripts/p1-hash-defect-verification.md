# AC Verification Script: Fix hash self-comparison in cli-adapter advance()

**Story reference:** `artefacts/2026-04-27-p1-hash-defect/stories/p1-hash-defect.md`
**Technical test plan:** `artefacts/2026-04-27-p1-hash-defect/test-plans/p1-hash-defect-test-plan.md`
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal and change into the repo root: `cd "c:\Users\Hamis\code\skills repo"` (or the relevant worktree path).
2. Ensure you are on the feature branch for this fix (not master).
3. Run `node tests/check-p1-hash-defect.js` — if you are on the feature branch with the fix applied, this should output all passes. If you are on master (pre-fix), some tests should fail.

**Reset between scenarios:** Each scenario is self-contained — no reset needed.

---

## Scenarios

### Scenario 1 — AC1: The advance function calls resolveSkill, not self-compares

**What this checks:** After the fix, `advance()` calls `govPackage.resolveSkill` to obtain the actual file content hash. Before the fix, it never called `resolveSkill` — it compared `expectedHash` against itself, making hash verification a no-op.

**How to verify (automated):**
Run `node tests/check-p1-hash-defect.js` and look for the AC1 block.

**Expected on feature branch (fix applied):**
```
[p1-hash-defect] AC1 — verifyHash actual param comes from resolveSkill, not expectedHash
  ✓ AC1a: resolveSkill was called by advance()
  ✓ AC1b: verifyHash was called
  ✓ AC1c: verifyHash received actual from resolveSkill contentHash ...
  ✓ AC1d: verifyHash actual is NOT the same as expectedHash ...
  ✓ AC1e: verifyHash expected param equals the caller-supplied expectedHash
```

**Expected on master (pre-fix — defect visible):**
- AC1a fails (`resolveSkill was called` → ✗)
- AC1c fails (`actual` shows `aaaaaaaa` not `cccccccc` — self-comparison confirmed)
- AC1d fails (`actual IS the same as expectedHash` — the defect)

**Pass/Fail:** _____ **Notes:** _______________

---

### Scenario 2 — AC2: A real hash mismatch is caught and state does not advance

**What this checks:** When the skill file has been tampered (real hash differs from pinned hash), `advance()` returns `HASH_MISMATCH` and the workflow state does NOT move forward.

**How to verify (automated):**
Run `node tests/check-p1-hash-defect.js` and look for the AC2 block.

**Expected on feature branch (fix applied):**
```
[p1-hash-defect] AC2 — resolveSkill returns different hash → HASH_MISMATCH, advanceState not called
  ✓ AC2a: advance returns a result
  ✓ AC2b: result.error is HASH_MISMATCH (got: HASH_MISMATCH)
  ✓ AC2c: advanceState was NOT called after hash mismatch
```

**Expected on master (pre-fix):**
- AC2b fails (`result.error` is `undefined` — the error was never triggered)
- AC2c fails (`advanceState WAS called` — state silently advanced despite mismatch)

**Pass/Fail:** _____ **Notes:** _______________

---

### Scenario 3 — AC3: A missing skill file returns SKILL_NOT_FOUND

**What this checks:** When the skill ID is provided but the skill file does not exist in the sidecar, `advance()` returns `SKILL_NOT_FOUND` rather than silently advancing state.

**How to verify (automated):**
Run `node tests/check-p1-hash-defect.js` and look for the AC3 block.

**Expected on feature branch:**
```
[p1-hash-defect] AC3 — resolveSkill returns null → SKILL_NOT_FOUND, no advance
  ✓ AC3a: advance returns a result
  ✓ AC3b: result.error is SKILL_NOT_FOUND (got: SKILL_NOT_FOUND)
  ✓ AC3c: advanceState was NOT called when skill not found
```

**Expected on master (pre-fix):**
- AC3b fails (`result.error` is `undefined` — missing skill silently bypassed)
- AC3c fails (`advanceState WAS called`)

**Pass/Fail:** _____ **Notes:** _______________

---

### Scenario 4 — AC4: Matching hashes allow state to advance normally

**What this checks:** When the resolved file hash equals the pinned expected hash, `advance()` succeeds and moves workflow state forward. This is the normal happy path.

**How to verify (automated):**
Run `node tests/check-p1-hash-defect.js` and look for the AC4 block.

**Expected on feature branch AND on master (this is passing behavior both before and after):**
```
[p1-hash-defect] AC4 — contentHash matches expectedHash → success, advanceState called
  ✓ AC4a: advance does not throw on matching hash (threw: false)
  ✓ AC4b: result has no error on matching hash (got: undefined)
  ✓ AC4c: advanceState was called after successful hash match
```

**Pass/Fail:** _____ **Notes:** _______________

---

### Scenario 5 — AC5 regression: Transition rules still enforced when no hash check

**What this checks:** The fix does not break existing transition-rule enforcement. When `skillId`/`sidecarRoot` are not provided, transitions to non-permitted states are still rejected.

**How to verify (automated):**
Run `node tests/check-p1-hash-defect.js` and look for the AC5 block.

**Expected (both before and after fix):**
```
[p1-hash-defect] AC5 regression — advance without skillId still enforces transition rules
  ✓ AC5a: non-permitted transition without skillId still returns TRANSITION_NOT_PERMITTED
  ✓ AC5b: permitted transition without skillId succeeds
```

**Pass/Fail:** _____ **Notes:** _______________

---

### Scenario 6 — Code review: self-comparison no longer present in source

**What this checks:** A human reviewer confirms the defect line is no longer in the source.

**Steps:**
1. Open `src/enforcement/cli-adapter.js` in the editor.
2. Search for `actual:   expectedHash` or `actual: expectedHash`.
3. The search should return zero results.
4. Find the `govPackage.verifyHash` call inside `advance()`.
5. Confirm `actual:` now reads `resolved.contentHash` (or the variable holding the content hash returned by `resolveSkill`).

**Expected:**
- `actual: expectedHash` — NOT present anywhere in the file.
- `actual: resolved.contentHash` (or equivalent) — present in the `verifyHash` call inside `advance()`.

**Pass/Fail:** _____ **Notes:** _______________

---

## Summary

| Scenario | AC | Pass/Fail |
|----------|----|-----------|
| 1 | AC1 — resolveSkill called, actual not self-comparison | |
| 2 | AC2 — hash mismatch caught, state not advanced | |
| 3 | AC3 — missing skill returns SKILL_NOT_FOUND | |
| 4 | AC4 — matching hash allows advance | |
| 5 | AC5 — regression, transition rules intact | |
| 6 | Code review — self-comparison line absent from source | |

**Overall result:** PASS / FAIL
**Verified by:** _________________________ **Date:** _____________
