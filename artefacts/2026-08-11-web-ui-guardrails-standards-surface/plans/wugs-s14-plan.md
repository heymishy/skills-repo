# Add a fetch timeout to the shared GitHub Contents API adapter — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in the test plan pass — add an `AbortController`-based timeout (10000ms default, overridable) to `fetchGithubContentsResponse` in `src/web-ui/adapters/artefact-fetcher.js`, the single shared helper both `fetchArtefact` and `realFetchRepoPath` call through.
**Branch:** `feature/wugs-s14`
**Worktree:** `.worktrees/wugs-s14`
**Test command:** `node tests/check-wugs-s14-fetch-timeout.js` (per task) / `npm test` (full suite, final step)

---

## File map

```
Create:
  tests/check-wugs-s14-fetch-timeout.js   — AC1-AC4

Modify:
  src/web-ui/adapters/artefact-fetcher.js — fetchGithubContentsResponse, fetchArtefact, realFetchRepoPath
```

**Design note — real current code, confirmed against merged master before writing this plan:**
- `fetchGithubContentsResponse(url, token, notFoundArgs, networkErrorMessage)` (`artefact-fetcher.js:47-74`) is the single shared `fetch()` call site. It currently takes no timeout parameter and has no `AbortController`.
- `fetchArtefact` (`artefact-fetcher.js:96`) and `realFetchRepoPath` (`artefact-fetcher.js:120`) both call `fetchGithubContentsResponse` positionally — neither currently passes a 5th argument.
- `ArtefactFetchError` (`artefact-fetcher.js:21-27`) already exists — reuse it for the timeout error (`name: 'ArtefactFetchError'`, a message clearly stating a timeout occurred), do not invent a new error class.
- The existing `try { response = await fetch(url, {...}) } catch (err) { throw new ArtefactFetchError(networkErrorMessage, err.message); }` block is where the abort signal wiring goes — an aborted fetch rejects into this same `catch`, so the timeout error needs to be distinguished from a genuine network error inside that catch block (check `err.name === 'AbortError'` and throw a timeout-specific message instead of the generic `networkErrorMessage` in that case).
- Add a 5th parameter, `timeoutMs`, defaulting to `10000`, to `fetchGithubContentsResponse`. Thread it through as an optional 4th parameter on both `fetchArtefact` and `realFetchRepoPath` (default `undefined` → falls through to `fetchGithubContentsResponse`'s own default), so production callers get 10s with no code change, and tests can override it to a short value.
- `AbortController` pattern: `const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs); try { response = await fetch(url, { headers: {...}, signal: controller.signal }); } catch (err) { if (err.name === 'AbortError') throw new ArtefactFetchError(\`Timeout: ${networkErrorMessage} (exceeded ${timeoutMs}ms)\`, 'timeout'); throw new ArtefactFetchError(networkErrorMessage, err.message); } finally { clearTimeout(timer); }` — the `finally` block is what guarantees AC3 (no dangling timer on either path, success or timeout).
- Do not touch `fetchRepoPath`/`setFetchRepoPath`/`getFetchRepoPath` (the D37 injectable adapter pair) — out of scope per the DoR.

---

## Task 1: Timeout mechanism in the shared helper (AC1-AC4)

**Files:**
- Create: `tests/check-wugs-s14-fetch-timeout.js`
- Modify: `src/web-ui/adapters/artefact-fetcher.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/check-wugs-s14-fetch-timeout.js` covering, per the test plan:
1. `fetchGithubContentsResponse_requestHangs_abortsAndThrowsClearTimeoutError` (AC1) — mock `global.fetch` returns a Promise that never resolves; call with a short `timeoutMs` override (e.g. 50ms); assert an `ArtefactFetchError` is thrown with a message clearly stating a timeout occurred.
2. `fetchGithubContentsResponse_normalFastResponse_behaviourUnchanged` (AC2) — mock `global.fetch` resolves immediately with a valid Contents API response; assert the return value is unchanged from pre-story behaviour.
3. `fetchGithubContentsResponse_normalResponse_timeoutTimerCleared` (AC3, success side) — spy on `global.clearTimeout`; call with a fast-resolving mock; assert `clearTimeout` was called.
4. `fetchGithubContentsResponse_timeoutFires_noDoubleErrorOrLateResolution` (AC3, timeout side) — mock `global.fetch` never resolves; short timeout; call the function, let it throw, then advance past where the original fetch "would have" resolved (e.g. `await new Promise(r => setTimeout(r, timeoutMs + 100))`); assert no unhandled rejection and no second error (use `process.on('unhandledRejection', ...)` guard for the duration of this test, or structure the mock's returned promise so it simply never settles at all — never resolving is sufficient to prove no second settle occurs).
5. `bothCallers_fetchArtefactAndRealFetchRepoPath_inheritTimeoutIdentically` (AC4) — mock `global.fetch` never resolves; call `fetchArtefact(...)` and separately `realFetchRepoPath(...)`, both with a short timeout override passed as their new 4th argument; assert both throw the same `ArtefactFetchError` timeout shape.

Follow this file's own existing test convention (see `tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js` for the mock `global.fetch` shape already used against this exact module) — mock `global.fetch` directly (assign/restore around each test), do not introduce a new mocking library.

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wugs-s14-fetch-timeout.js
```

Expected: AC1/AC3/AC4 fail (no timeout mechanism exists yet — a hanging mock fetch will hang the test itself or exceed a reasonable wait). AC2 may already pass (normal-path behaviour is unchanged pre-implementation) — that's fine, it's a lock-in-shaped assertion for the case that must NOT regress.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/adapters/artefact-fetcher.js`, modify `fetchGithubContentsResponse` to accept a 5th `timeoutMs = 10000` parameter and wrap the fetch call with an `AbortController` + `setTimeout`/`clearTimeout` per the Design note above. Thread an optional `timeoutMs` 4th parameter through `fetchArtefact` and `realFetchRepoPath`, passed straight through to their own `fetchGithubContentsResponse` calls.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wugs-s14-fetch-timeout.js
```

Expected: `5 passed, 0 failed`

- [ ] **Step 5: Run sibling regressions**

```bash
node tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js
node tests/check-wugs-s2-product-level-guardrails-view.js
```

- [ ] **Step 6: Full suite regression**

```bash
npm test
```

Expected: matches the documented pre-existing baseline (no new failures beyond the known set).

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/adapters/artefact-fetcher.js tests/check-wugs-s14-fetch-timeout.js
git commit -m "feat(wugs-s14): AbortController timeout on the shared GitHub Contents API adapter (AC1-AC4)"
```

---

## Final story-level check (before /verify-completion)

After Task 1: `node tests/check-wugs-s14-fetch-timeout.js` → `5 passed, 0 failed`, both sibling regression files unchanged, `npm test` at the documented baseline. This story closes `/trace`'s 2026-08-14 MEDIUM finding #1 and the corresponding `nfr-profile.md` Gaps-table entry ("a reasonable fetch timeout (e.g. 10s)").
