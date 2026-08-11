# Extend the artefact-fetcher adapter to read arbitrary repo files and folders — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Extend `src/web-ui/adapters/artefact-fetcher.js` with a new `fetchRepoPath` function that can read any file or folder from a connected repo (not just the fixed `artefacts/<slug>/<type>.md` path `fetchArtefact` supports), following the D37 injectable-adapter pattern.
**Branch:** `feature/wugs-s1`
**Worktree:** `.worktrees/wugs-s1`
**Test command:** `node tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js` (per-file); `npm test` (full suite)

---

## File map

```
Create:
  tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js — unit + integration tests, AC1-AC6

Modify:
  src/web-ui/adapters/artefact-fetcher.js — add fetchRepoPath/setFetchRepoPath/getFetchRepoPath
  src/web-ui/server.js                    — wire the real implementation (NODE_ENV !== 'test' guard)
```

---

## Task 1: Injectable adapter scaffold — stub throws when unwired (AC5)

**Files:**
- Modify: `src/web-ui/adapters/artefact-fetcher.js`
- Test: `tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js`

- [x] **Step 1: Write the failing test**

```javascript
'use strict';
const assert = require('assert');
let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS:', name); passed++; }
  catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; }
}

// Fresh require each time to reset the module's internal adapter state
function freshModule() {
  delete require.cache[require.resolve('../src/web-ui/adapters/artefact-fetcher')];
  return require('../src/web-ui/adapters/artefact-fetcher');
}

check('AC5: fetchRepoPath_unwired_throwsExplicitError', () => {
  const mod = freshModule();
  assert.throws(
    () => mod.fetchRepoPath('owner', 'repo', 'some/path', 'tok'),
    /Adapter not wired: fetchRepoPath/,
    'expected the unwired stub to throw immediately (synchronous), not return a rejected promise silently'
  );
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js
```

Expected output: `FAIL: AC5: fetchRepoPath_unwired_throwsExplicitError — mod.fetchRepoPath is not a function`

- [x] **Step 3: Write minimal implementation**

Add to `src/web-ui/adapters/artefact-fetcher.js`, after the existing `fetchArtefact` function and before `module.exports`:

```javascript
// ── wugs-s1: arbitrary repo-path fetch adapter (D37 injectable) ────────────

let _fetchRepoPath = function() {
  throw new Error('Adapter not wired: fetchRepoPath. Call setFetchRepoPath() with a real implementation before use.');
};

function fetchRepoPath(owner, repo, path, token) {
  return _fetchRepoPath(owner, repo, path, token);
}

function setFetchRepoPath(impl) {
  _fetchRepoPath = impl;
}

function getFetchRepoPath() {
  return _fetchRepoPath;
}
```

Update the `module.exports` line at the bottom of the file:

```javascript
module.exports = {
  fetchArtefact, ArtefactNotFoundError, ArtefactFetchError,
  fetchRepoPath, setFetchRepoPath, getFetchRepoPath
};
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js
```

Expected output: `PASS: AC5: fetchRepoPath_unwired_throwsExplicitError` followed by `1 passed, 0 failed`

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same 33 pre-existing failures as baseline (see `decisions.md` RISK-ACCEPT, 2026-08-11) — zero *new* failures introduced.

- [x] **Step 6: Commit**

```bash
git add src/web-ui/adapters/artefact-fetcher.js tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js
git commit -m "feat(wugs-s1): add fetchRepoPath injectable adapter scaffold, stub throws when unwired"
```

**Status: DONE** (implemented, spec-reviewed ✅, quality-reviewed ✅ after a JSDoc/test-header/delegation fixup round — see commits `e370192f`, `6924b5ad`, `96eff813`)

---

## Task 2: Single-file fetch (AC1)

**Files:**
- Modify: `src/web-ui/adapters/artefact-fetcher.js`
- Test: `tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js`

- [x] **Step 1: Write the failing test**

Add to the test file, before the summary block:

```javascript
check('AC1: realFetchRepoPath_singleFile_returnsDecodedContent', async () => {
  const mod = freshModule();
  const originalFetch = global.fetch;
  global.fetch = async (url, opts) => {
    assert.ok(url.includes('/repos/acme/widget/contents/.github/architecture-guardrails.md'));
    assert.strictEqual(opts.headers['Authorization'], 'Bearer tok123');
    return {
      status: 200,
      ok: true,
      json: async () => ({
        content: Buffer.from('# Guardrails\n\nSome content.').toString('base64'),
        type: 'file'
      })
    };
  };
  try {
    const result = await mod.realFetchRepoPath('acme', 'widget', '.github/architecture-guardrails.md', 'tok123');
    assert.strictEqual(result, '# Guardrails\n\nSome content.');
  } finally {
    global.fetch = originalFetch;
  }
});
```

Note: this test calls `realFetchRepoPath` (the real implementation) directly, not the injectable `fetchRepoPath` wrapper — matching this repo's own convention of testing `realX` functions directly and testing the injectable wrapper's wiring separately (see `check-rapp-s1-credits-guard-e2e-bypass.js`'s established pattern for `setCreditsAdapter`).

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js
```

Expected output: `FAIL: AC1: realFetchRepoPath_singleFile_returnsDecodedContent — mod.realFetchRepoPath is not a function`

- [x] **Step 3: Write minimal implementation**

Add to `src/web-ui/adapters/artefact-fetcher.js`, before the `_fetchRepoPath` stub declaration from Task 1:

```javascript
/**
 * Fetch an arbitrary file or folder from a repo via GitHub Contents API.
 * Unlike fetchArtefact(), this accepts any path, not just the fixed
 * artefacts/<slug>/<type>.md convention, and branches on response shape:
 * a single file returns a decoded string; a directory returns an array
 * of entries (wugs-s1 AC1/AC2).
 * @returns {Promise<string|Array>} decoded file content, or a directory entry array
 * @throws {ArtefactNotFoundError} on 404
 * @throws {ArtefactFetchError}    on other errors
 */
async function realFetchRepoPath(owner, repo, path, token) {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept':        'application/vnd.github.v3+json'
      }
    });
  } catch (err) {
    throw new ArtefactFetchError('Network error fetching repo path', err.message);
  }

  if (response.status === 404) {
    throw new ArtefactNotFoundError(`${owner}/${repo}`, path);
  }

  if (!response.ok) {
    let errorMessage = 'Unknown error';
    try {
      const body = await response.json();
      errorMessage = body.message || errorMessage;
    } catch (_) { /* ignore parse failure */ }
    throw new ArtefactFetchError(`GitHub API error: ${response.status}`, errorMessage);
  }

  const data = await response.json();

  if (Array.isArray(data)) {
    return data.map(entry => ({ name: entry.name, path: entry.path, type: entry.type }));
  }

  return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
}
```

Update `module.exports` to also export `realFetchRepoPath`:

```javascript
module.exports = {
  fetchArtefact, ArtefactNotFoundError, ArtefactFetchError,
  fetchRepoPath, setFetchRepoPath, getFetchRepoPath, realFetchRepoPath
};
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js
```

Expected output: `PASS: AC1: realFetchRepoPath_singleFile_returnsDecodedContent` plus Task 1's test still passing — `2 passed, 0 failed`

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same 33 pre-existing failures, zero new.

- [x] **Step 6: Commit**

```bash
git add src/web-ui/adapters/artefact-fetcher.js tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js
git commit -m "feat(wugs-s1): implement realFetchRepoPath single-file fetch"
```

**Status: DONE** (implemented — deliberately writing the FULL function body including folder/error branches, per plan design — spec-reviewed ✅, quality-reviewed ✅ after extracting a shared `fetchGithubContentsResponse` helper to resolve a DRY finding — see commits `6018c175`, `c89c6739`, `8146fea7`. The test harness's `check()` helper was made async during this task, to correctly await async test bodies.)

---

## Task 3: Folder listing (AC2)

**Files:**
- Test: `tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js`
- (Implementation already covers this — `realFetchRepoPath`'s `Array.isArray(data)` branch, written in Task 2. This task adds the dedicated test proving that branch.)

- [x] **Step 1: Write the failing test**

```javascript
check('AC2: realFetchRepoPath_folder_returnsEntryArray', async () => {
  const mod = freshModule();
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    assert.ok(url.includes('/repos/acme/widget/contents/standards'));
    return {
      status: 200,
      ok: true,
      json: async () => ([
        { name: 'data', path: 'standards/data', type: 'dir', sha: 'abc' },
        { name: 'devops', path: 'standards/devops', type: 'dir', sha: 'def' }
      ])
    };
  };
  try {
    const result = await mod.realFetchRepoPath('acme', 'widget', 'standards', 'tok123');
    assert.ok(Array.isArray(result), 'expected an array for a folder path');
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].name, 'data');
    assert.strictEqual(result[0].type, 'dir');
  } finally {
    global.fetch = originalFetch;
  }
});
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js
```

Expected output (before this task, if Task 2's implementation somehow didn't handle arrays — but it does, so this should actually PASS immediately since Task 2's implementation already handles this branch, which is acceptable per TDD discipline as documented in the story's own test plan): note in the commit message that this AC's implementation was already correct from Task 2's design.

- [x] **Step 3: No new implementation needed**

Confirm `realFetchRepoPath`'s `Array.isArray(data)` branch (Task 2) already satisfies this AC.

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js
```

Expected output: `PASS: AC2: realFetchRepoPath_folder_returnsEntryArray` — `3 passed, 0 failed`

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same 33 pre-existing failures, zero new.

- [x] **Step 6: Commit**

```bash
git add tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js
git commit -m "test(wugs-s1): add AC2 folder-listing coverage (implementation already correct from Task 2)"
```

**Status: DONE** — committed as `4084f3bb`. AC2 test passed on first run (implementation already correct from Task 2), 33/33 pre-existing baseline failures confirmed unchanged. Pending two-stage review.

---

## Task 4: 404 → ArtefactNotFoundError (AC3)

**Files:**
- Test: `tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js`

- [ ] **Step 1: Write the failing test**

```javascript
check('AC3: realFetchRepoPath_missingPath_throwsArtefactNotFoundError', async () => {
  const mod = freshModule();
  const originalFetch = global.fetch;
  global.fetch = async () => ({ status: 404, ok: false, json: async () => ({ message: 'Not Found' }) });
  try {
    await assert.rejects(
      () => mod.realFetchRepoPath('acme', 'widget', 'nonexistent.md', 'tok123'),
      mod.ArtefactNotFoundError
    );
  } finally {
    global.fetch = originalFetch;
  }
});
```

- [ ] **Step 2: Run test — must fail (or pass immediately, per Task 3's TDD note)**

```bash
node tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js
```

Expected: passes immediately since Task 2's implementation already handles this branch — note the same TDD caveat as Task 3.

- [ ] **Step 3: No new implementation needed**

Confirm `realFetchRepoPath`'s `response.status === 404` branch (Task 2) satisfies this AC.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js
```

Expected output: `4 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js
git commit -m "test(wugs-s1): add AC3 404-handling coverage"
```

---

## Task 5: Non-404 error → ArtefactFetchError (AC4)

**Files:**
- Test: `tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js`

- [ ] **Step 1: Write the failing test**

```javascript
check('AC4: realFetchRepoPath_apiError_throwsArtefactFetchError', async () => {
  const mod = freshModule();
  const originalFetch = global.fetch;
  global.fetch = async () => ({ status: 500, ok: false, json: async () => ({ message: 'Internal error' }) });
  try {
    await assert.rejects(
      () => mod.realFetchRepoPath('acme', 'widget', 'some/path.md', 'tok123'),
      mod.ArtefactFetchError
    );
  } finally {
    global.fetch = originalFetch;
  }
});
```

- [ ] **Step 2: Run test**

```bash
node tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js
```

Expected: passes immediately (Task 2's implementation already handles this branch, same TDD caveat).

- [ ] **Step 3: No new implementation needed**

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js
```

Expected output: `5 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js
git commit -m "test(wugs-s1): add AC4 non-404 error-handling coverage"
```

---

## Task 6: Wire the real implementation in server.js (AC6, D37 requirement 4)

**Files:**
- Modify: `src/web-ui/server.js`
- Test: `tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js`

- [ ] **Step 1: Write the failing test**

```javascript
check('AC6: realWiring_twoDifferentPaths_returnTwoDifferentCorrectContents', async () => {
  const mod = freshModule();
  const originalFetch = global.fetch;
  const responses = {
    'path-one.md': 'Content One',
    'path-two.md': 'Content Two'
  };
  global.fetch = async (url) => {
    const matchedPath = Object.keys(responses).find(p => url.includes(p));
    return {
      status: 200,
      ok: true,
      json: async () => ({ content: Buffer.from(responses[matchedPath]).toString('base64') })
    };
  };
  try {
    mod.setFetchRepoPath(mod.realFetchRepoPath);
    const resultOne = await mod.fetchRepoPath('acme', 'widget', 'path-one.md', 'tok');
    const resultTwo = await mod.fetchRepoPath('acme', 'widget', 'path-two.md', 'tok');
    assert.strictEqual(resultOne, 'Content One');
    assert.strictEqual(resultTwo, 'Content Two');
    assert.notStrictEqual(resultOne, resultTwo, 'the two calls must return genuinely different, individually-correct content — not the same value twice (D37 requirement 4)');
  } finally {
    global.fetch = originalFetch;
  }
});
```

- [ ] **Step 2: Run test — must fail initially only if `setFetchRepoPath`/`realFetchRepoPath` wiring itself were broken; given Task 1/2 already built both correctly, this should pass, proving the injectable wrapper and real implementation compose correctly end-to-end**

```bash
node tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js
```

Expected: passes — `6 passed, 0 failed`. This test exercises the SAME wiring mechanism `server.js` uses (`setFetchRepoPath(realFetchRepoPath)`), just invoked directly rather than via a running server process — the closest an automated test can get to proving `server.js`'s own wiring line is correct without spinning up the full HTTP server.

- [ ] **Step 3: Wire the real implementation in server.js**

In `src/web-ui/server.js`, add the import near the existing `artefact-fetcher` import (around line 1478, or alongside the other adapter imports near the top of the file — follow whichever the existing file's import grouping convention is):

```javascript
const { setFetchRepoPath, realFetchRepoPath } = require('./adapters/artefact-fetcher');
```

Add the wiring block immediately after the existing `pipeline-state-fetch-adapter` wiring block (after line 180):

```javascript
// wugs-s1 / D37 mandatory separate wiring task -- wire the real GitHub
// Contents API adapter for fetching arbitrary repo files/folders (guardrails
// and standards content). Never wired in NODE_ENV=test (tests call
// setFetchRepoPath() themselves with a mock); the throwing stub stays active
// there, matching the pattern already used by the adapters above.
if (process.env.NODE_ENV !== 'test') {
  setFetchRepoPath(realFetchRepoPath);
  console.log('[wugs-s1] repo-path fetch adapter wired');
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js
```

Expected output: `6 passed, 0 failed` (unchanged from Step 2 — this step is about `server.js`'s own wiring line existing, verified structurally by starting the server once, see Step 4b).

- [ ] **Step 4b: Manual/structural confirmation server.js loads without error**

```bash
node -e "process.env.NODE_ENV='production'; require('./src/web-ui/server.js')" &
sleep 2
# Confirm the console log line appears:
# [wugs-s1] repo-path fetch adapter wired
# Then kill the process (Ctrl+C or kill the backgrounded PID)
```

Expected output: `[wugs-s1] repo-path fetch adapter wired` printed to console, no crash.

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same 33 pre-existing failures, zero new. Total for this story: 7 tests, all passing.

- [ ] **Step 6: REQUIRED manual sandbox-repo check (per test plan's Test Gaps note — not optional)**

Before opening the PR, perform one real, manual GitHub API call against a disposable sandbox repo confirming the folder-listing response shape (an array, not `{content: ...}`) matches what Task 2/3's mocks assumed. Record the outcome in the PR description. This is the mitigation for this story's one documented test gap (mock-shape verification, CLAUDE.md).

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/server.js tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js
git commit -m "feat(wugs-s1): wire real fetchRepoPath adapter in server.js"
```

---

## Final steps (after all 6 tasks)

1. Run `npm test` one more time — confirm 0 new failures vs. the 33-failure baseline.
2. Run `npm run lint` and `npm run typecheck` — confirm both pass.
3. Open a draft PR (never mark ready for review) — this is `/branch-complete`'s job, not this plan's.

---

## Recovery note (2026-08-12)

This file was accidentally deleted by an implementer subagent during Task 3's pre-commit cleanup (`rm -rf` on an untracked directory without reading its contents first — a real process gap). Recreated verbatim from the coordinating session's own conversation record, with Task 1-3 checkboxes and status notes updated to reflect actual completion state at time of recovery. No task content was altered from the original.
