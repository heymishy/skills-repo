# dismissed-signals-store's _persist() must create its parent directory before writing — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in `artefacts/2026-10-06-dismiss-store-workspace-dir-fix/test-plans/dswf-s1-test-plan.md` pass. Add `fs.mkdirSync(path.dirname(filePath), { recursive: true })` to `_persist()` before the existing `fs.writeFileSync` call — the exact pattern already used in `server.js:2750`/`modules/reference-validator.js:54`.
**Branch:** `feature/dswf-s1`
**Worktree:** `.worktrees/dswf-s1`
**Test command:** `npm test`; single file via `node tests/check-sptu-s4-signals-dismiss.js`

---

## File map

```
Modify:
  src/web-ui/modules/dismissed-signals-store.js — add `const path = require('path');` and one `fs.mkdirSync(...)` line inside _persist()
  tests/check-sptu-s4-signals-dismiss.js — 2 new tests (AC1, AC2)
```

---

## Task 1: Write failing tests, then implement the fix (single task — trivial scope)

**Files:**
- Modify: `tests/check-sptu-s4-signals-dismiss.js`
- Modify: `src/web-ui/modules/dismissed-signals-store.js`

- [ ] **Step 1: Write the failing tests**

Add to `tests/check-sptu-s4-signals-dismiss.js`, after the existing `makeInMemoryDismissStore` helper's sibling fs-adapter tests:

```javascript
  await test('dismiss() succeeds and persists when the target file\'s directory does not exist yet (AC1)', function() {
    const nestedDir = path.join(os.tmpdir(), 'dswf-s1-test-' + Date.now() + '-' + Math.random().toString(36).slice(2), 'nested');
    const nestedPath = path.join(nestedDir, 'dismissed-signals.json');
    assert.ok(!fs.existsSync(nestedDir), 'precondition: nested directory must not exist yet');
    const adapter = store.createFsDismissedSignalsStoreAdapter(nestedPath);
    adapter.dismiss('some-key');
    assert.ok(fs.existsSync(nestedPath), 'expected the file to have been written despite the missing parent directory');
    const secondAdapter = store.createFsDismissedSignalsStoreAdapter(nestedPath);
    assert.strictEqual(secondAdapter.isDismissed('some-key'), true, 'expected the write to have actually persisted the key');
    fs.rmSync(path.dirname(nestedDir), { recursive: true, force: true });
  });

  await test('dismiss() behaves identically when the target directory already exists (AC2)', function() {
    const tmpPath = makeTempFilePath();
    const adapter = store.createFsDismissedSignalsStoreAdapter(tmpPath);
    adapter.dismiss('another-key');
    assert.ok(fs.existsSync(tmpPath));
    assert.strictEqual(adapter.isDismissed('another-key'), true);
    fs.unlinkSync(tmpPath);
  });
```

Add `const os = require('os');` and `const path = require('path');` to the top of the file if not already present (check first — `os` is already required via `makeTempFilePath`'s own use; `path` is already required too, per the existing `makeTempFilePath` implementation).

- [ ] **Step 2: Run — must fail**

```bash
node tests/check-sptu-s4-signals-dismiss.js
```

Expected: the new "AC1" test fails with an `ENOENT` error (or an assertion failure on `fs.existsSync(nestedPath)` being false) — the current `_persist()` has no directory-creation logic. The "AC2" test should already pass (it exercises the existing, already-working common case).

- [ ] **Step 3: Implement the fix**

In `src/web-ui/modules/dismissed-signals-store.js`, add near the top (after the existing `const crypto = require('crypto');` line):

```javascript
const path = require('path');
```

In `_persist()`, change:

```javascript
  function _persist() {
    fs.writeFileSync(filePath, JSON.stringify(Array.from(_cache)), 'utf8');
  }
```

to:

```javascript
  function _persist() {
    // dswf-s1: workspace/ is not in the Dockerfile's production COPY
    // allowlist, so this file's own parent directory may not exist in any
    // real deployed environment (confirmed via a real production ENOENT,
    // 2026-10-05) -- create it defensively, matching the same
    // mkdirSync({recursive:true})-before-write pattern already used in
    // server.js and modules/reference-validator.js.
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(Array.from(_cache)), 'utf8');
  }
```

- [ ] **Step 4: Run — must pass**

```bash
node tests/check-sptu-s4-signals-dismiss.js
```

Expected: `[sptu-s4-signals-dismiss] Results: 16 passed, 0 failed` (14 pre-existing + 2 new).

- [ ] **Step 5: Run full suite — confirm AC3 (no regressions)**

```bash
npm test
```

Expected: all tests passing except the one already-RISK-ACCEPTed, unrelated `tests/check-p3.5-validate-trace.js` failure logged in `decisions.md` at `/branch-setup` (2026-10-06).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/dismissed-signals-store.js tests/check-sptu-s4-signals-dismiss.js
git commit -m "fix: create the parent directory before persisting dismissed-signals.json"
```

---

## Task 2: Open a draft PR

- [ ] **Step 1:**

```bash
git push -u origin feature/dswf-s1
gh pr create --draft --title "dismissed-signals-store's _persist() must create its parent directory before writing" --body-file <PR body, see branch-complete skill>
```
