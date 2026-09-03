# Retry the GitHub Contents API fetch on transient/parse failure, with diagnostic error detail on exhaustion — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Add a bounded retry (3 total attempts, 500ms/1000ms backoff) around the GitHub Contents API fetch in `realFetchPipelineState`, and richer diagnostic detail (bytes received vs Content-Length) when a JSON-parse failure still occurs after retries are exhausted. Non-ok HTTP responses (404/403/rate-limit) are never retried — immediate failure, unchanged.
**Branch:** `feature/pgft-s1`
**Worktree:** `.worktrees/pgft-s1`
**Test command:** `npm test` (full suite) / `node tests/check-pgft-s1-fetch-retry.js` (this story's own file)

---

## File map

```
Create:
  tests/check-pgft-s1-fetch-retry.js  — 4 unit tests for AC1-AC3 + 1 regression guard for AC4

Modify:
  src/web-ui/adapters/pipeline-state-fetch-adapter.js  — realFetchPipelineState becomes a
                                    bounded retry loop; switches res.json() to
                                    res.text() + JSON.parse() for richer diagnostics.
  tests/check-pr-s2-pipeline-state-fetch-adapter.js  — T3 and T6 mocks (the only two that
                                    return ok:true) need a .text() method added alongside
                                    their existing .json() method, matching real fetch()
                                    Response objects. T1/T2/T4/T5 untouched.
```

---

## Task 1: Retry on network error or JSON-parse failure, up to 3 total attempts (AC1)

**Files:**
- Modify: `src/web-ui/adapters/pipeline-state-fetch-adapter.js`
- Test: `tests/check-pgft-s1-fetch-retry.js`

- [ ] **Step 1: Write the failing tests**

```javascript
// tests/check-pgft-s1-fetch-retry.js
'use strict';
var assert = require('assert');
var path = require('path');
var passed = 0; var failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

console.log('\n[pgft-s1] AC1 -- retries on network error or JSON-parse failure, up to 3 total attempts');

var MODULE_PATH = path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js');
function freshRequire() {
  delete require.cache[require.resolve(MODULE_PATH)];
  return require(MODULE_PATH);
}

(async function() {
  // AC1a: retries on a thrown network error, succeeds on the second attempt
  (function() {
    return (async function() {
      var originalFetch = global.fetch;
      var callCount = 0;
      global.fetch = async function() {
        callCount++;
        if (callCount === 1) { throw new TypeError('fetch failed'); }
        return {
          ok: true, status: 200,
          headers: { get: function() { return null; } },
          text: async function() { return JSON.stringify({ content: Buffer.from('{"features":[]}').toString('base64'), encoding: 'base64' }); }
        };
      };
      try {
        var mod = freshRequire();
        var result = await mod.realFetchPipelineState('acme', 'widgets', 'fake-token');
        assert.ok(result && result.content, 'Expected a successful result after recovering from a network error');
        assert.strictEqual(callCount, 2, 'Expected exactly 2 fetch calls (1 failure + 1 success), got ' + callCount);
        passed++; console.log('  [PASS] realFetchPipelineState: recovers from a thrown network error on retry (AC1)');
      } catch (err) { failed++; console.log('  [FAIL] AC1 network-error retry --', err.message); }
      finally { global.fetch = originalFetch; }
    })();
  })();

  await Promise.resolve(); // sequence point -- IIFEs above are fire-and-forget by design in this minimal harness; see Step 4 note

  console.log('\n[pgft-s1] Results so far: ' + passed + ' passed, ' + failed + ' failed');
  process.exitCode = failed > 0 ? 1 : 0;
})();
```

**Note on harness shape:** the snippet above is illustrative of the first sub-test only. Because each sub-test needs to swap `global.fetch` and freshly `require()` the module, write each as its own awaited `async function` (matching the pattern already established in `tests/check-pr-s2-pipeline-state-fetch-adapter.js`'s own `queue.push(function() { ... })` structure) rather than literal fire-and-forget IIFEs. Follow that file's exact `test()`/`queue`/`main()` structure for consistency — this plan shows the test *logic*, not a literal copy-paste scaffold.

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pgft-s1-fetch-retry.js
```

Expected output: `[FAIL] AC1 network-error retry -- fetch failed` (current implementation has no retry loop, the thrown error propagates immediately on the first attempt)

- [ ] **Step 3: Write the implementation**

Replace `realFetchPipelineState` (currently `src/web-ui/adapters/pipeline-state-fetch-adapter.js` lines 45-61) with:

```javascript
async function realFetchPipelineState(owner, repo, accessToken) {
  var apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');
  var url = apiBase + '/repos/' + owner + '/' + repo + '/contents/.github/pipeline-state.json';
  var maxAttempts = 3;
  var lastErr = null;

  for (var attempt = 1; attempt <= maxAttempts; attempt++) {
    var res;
    try {
      res = await fetch(url, {
        headers: {
          Authorization: 'Bearer ' + accessToken,
          Accept: 'application/vnd.github+json'
        }
      });
    } catch (networkErr) {
      // pgft-s1 (AC1): a transient network-layer failure (e.g. connection
      // reset mid-transfer) -- retry rather than fail the whole sync outright.
      lastErr = networkErr;
      if (attempt < maxAttempts) { await _pgftDelay(attempt * 500); continue; }
      throw lastErr;
    }

    if (!res.ok) {
      // pgft-s1 (AC3): a non-ok HTTP status (404/403/rate-limit) is not a
      // transient condition -- fail immediately, matching pre-existing
      // behaviour exactly, never retried.
      throw new Error('Failed to fetch pipeline-state.json: HTTP ' + res.status);
    }

    var bodyText = await res.text();
    try {
      return JSON.parse(bodyText);
    } catch (parseErr) {
      // pgft-s1 (AC1/AC2): a syntactically truncated response body on an
      // otherwise-ok response -- the most likely explanation is a dropped
      // or truncated transfer for a large file. Retry, and if retries are
      // exhausted, surface real diagnostic detail (AC2) instead of the bare
      // "Unexpected end of JSON input" this used to throw.
      var contentLength = (res.headers && res.headers.get) ? (res.headers.get('content-length') || 'absent') : 'unavailable';
      lastErr = new Error(
        'Failed to parse pipeline-state.json response: ' + parseErr.message +
        ' (received ' + bodyText.length + ' bytes; Content-Length header: ' + contentLength + ')'
      );
      if (attempt < maxAttempts) { await _pgftDelay(attempt * 500); continue; }
      throw lastErr;
    }
  }
  throw lastErr;
}

function _pgftDelay(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pgft-s1-fetch-retry.js
```

Expected output: `[PASS] realFetchPipelineState: recovers from a thrown network error on retry (AC1)`

- [ ] **Step 5: Run full suite — check for the expected pre-existing mock-shape regression**

```bash
npm test
```

Expected output: `tests/check-pr-s2-pipeline-state-fetch-adapter.js`'s T3 and T6 sub-tests now fail (their mocks return `.json()`-only fake responses; the new code calls `.text()` instead, which is `undefined` on those mocks and throws `TypeError: res.text is not a function`) — this is the known, expected coupling named in the File map; fixed in Task 4. T1, T2, T4, T5 in that file must still pass unmodified. No other file should newly fail.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/pipeline-state-fetch-adapter.js tests/check-pgft-s1-fetch-retry.js
git commit -m "fix: retry GitHub Contents API fetch on network error or JSON-parse failure (AC1)"
```

---

## Task 2: Diagnostic detail (bytes received, Content-Length) when retries are exhausted (AC2)

**Files:**
- Test: `tests/check-pgft-s1-fetch-retry.js` (append)

No further production code change needed — Task 1's implementation already includes the diagnostic message construction. This task adds the dedicated test asserting it.

- [ ] **Step 1: Write the test**

Append a new sub-test (following the same `queue.push`/`test()` structure as Task 1's sub-tests):

```javascript
// AC2: diagnostic detail present when all 3 attempts fail on a parse error
(async function() {
  var originalFetch = global.fetch;
  var callCount = 0;
  global.fetch = async function() {
    callCount++;
    return {
      ok: true, status: 200,
      headers: { get: function(name) { return name === 'content-length' ? '1800000' : null; } },
      text: async function() { return '{"features":['; } // 14 bytes, truncated
    };
  };
  try {
    var mod = freshRequire();
    try {
      await mod.realFetchPipelineState('acme', 'widgets', 'fake-token');
      assert.fail('Expected realFetchPipelineState to throw after exhausting all retries');
    } catch (err) {
      assert.ok(/14/.test(err.message), 'Expected the error message to include the actual received byte count (14): ' + err.message);
      assert.ok(/1800000/.test(err.message), 'Expected the error message to include the Content-Length header value (1800000): ' + err.message);
      assert.strictEqual(callCount, 3, 'Expected exactly 3 fetch calls (all attempts exhausted), got ' + callCount);
      passed++; console.log('  [PASS] realFetchPipelineState: diagnostic detail (bytes received, Content-Length) in the final error (AC2)');
    }
  } catch (err) { failed++; console.log('  [FAIL] AC2 diagnostic detail --', err.message); }
  finally { global.fetch = originalFetch; }
})();
```

- [ ] **Step 2: Run test — must pass immediately (Task 1's implementation already covers this)**

```bash
node tests/check-pgft-s1-fetch-retry.js
```

Expected output: `[PASS] realFetchPipelineState: diagnostic detail (bytes received, Content-Length) in the final error (AC2)`. If red, Task 1's implementation has a defect — fix it before continuing.

- [ ] **Step 3: Commit**

```bash
git add tests/check-pgft-s1-fetch-retry.js
git commit -m "test: verify diagnostic detail in the exhausted-retries error message (AC2)"
```

---

## Task 3: Non-ok HTTP response never retried, fails immediately unchanged (AC3)

**Files:**
- Test: `tests/check-pgft-s1-fetch-retry.js` (append)

No further production code change needed — Task 1's implementation already puts the non-ok check ahead of any retry logic. This task adds the dedicated regression test.

- [ ] **Step 1: Write the test**

```javascript
// AC3: a non-ok HTTP response is never retried
(async function() {
  var originalFetch = global.fetch;
  var callCount = 0;
  global.fetch = async function() {
    callCount++;
    return { ok: false, status: 404 };
  };
  try {
    var mod = freshRequire();
    try {
      await mod.realFetchPipelineState('acme', 'missing-repo', 'fake-token');
      assert.fail('Expected realFetchPipelineState to throw on a 404');
    } catch (err) {
      assert.ok(/404/.test(err.message), 'Expected the error to mention the HTTP status: ' + err.message);
      assert.strictEqual(callCount, 1, 'Expected exactly 1 fetch call (no retry on a non-ok status), got ' + callCount);
      passed++; console.log('  [PASS] realFetchPipelineState: non-ok HTTP response fails immediately, never retried (AC3)');
    }
  } catch (err) { failed++; console.log('  [FAIL] AC3 non-ok not retried --', err.message); }
  finally { global.fetch = originalFetch; }
})();
```

- [ ] **Step 2: Run test — must pass immediately**

```bash
node tests/check-pgft-s1-fetch-retry.js
```

Expected output: `[PASS] realFetchPipelineState: non-ok HTTP response fails immediately, never retried (AC3)`

- [ ] **Step 3: Commit**

```bash
git add tests/check-pgft-s1-fetch-retry.js
git commit -m "test: verify non-ok HTTP responses are never retried (AC3)"
```

---

## Task 4: Fix the now-outdated T3/T6 mock shape in the pre-existing adapter test file

**Files:**
- Modify: `tests/check-pr-s2-pipeline-state-fetch-adapter.js`

- [ ] **Step 1: Confirm the expected failure from Task 1's Step 5**

```bash
node tests/check-pr-s2-pipeline-state-fetch-adapter.js
```

Expected output: T3 and T6 fail with `TypeError: res.text is not a function` (or similar) — their mocks only implement `.json()`.

- [ ] **Step 2: Fix the mocks**

In T3 (around the existing `global.fetch = async function(url, opts) { ... return { ok: true, status: 200, json: async function() { ... } }; }` block), add a matching `.text()`:

```javascript
      global.fetch = async function(url, opts) {
        capturedUrl = url;
        capturedHeaders = opts.headers;
        return {
          ok: true,
          status: 200,
          headers: { get: function() { return null; } },
          text: async function() { return JSON.stringify({ content: Buffer.from('{"features":[]}').toString('base64'), encoding: 'base64' }); }
        };
      };
```

(Remove the old `json: async function() { ... }` property — the implementation no longer calls `.json()`.)

In T6 (the two-repo differentiation test), apply the same change to both branches of its `global.fetch` mock — replace each `json: async function() { return {...}; }` with a matching `headers`/`text` pair returning the JSON-stringified equivalent.

- [ ] **Step 3: Run test — must pass**

```bash
node tests/check-pr-s2-pipeline-state-fetch-adapter.js
```

Expected output: all 6 sub-tests (T1-T6) pass. T4 (the 404 test) requires no change and must still pass unmodified — confirms the non-ok branch never reaches `.text()`.

- [ ] **Step 4: Run full suite — final regression check**

```bash
npm test
```

Expected output: same baseline as this story's own branch-setup baseline (598 files + this story's own new test file, 1 pre-existing unrelated failure in `tests/check-p3.5-validate-trace.js`), 0 new failures.

- [ ] **Step 5: Commit**

```bash
git add tests/check-pr-s2-pipeline-state-fetch-adapter.js
git commit -m "test: fix T3/T6 mock-fidelity gap for the new text()-based response reading"
```

---

## Task 5: Regression guard — background-failure logging (pst-s1) still catches an exhausted-retries failure (AC4)

**Files:**
- Test: `tests/check-pgft-s1-fetch-retry.js` (append)

No production code change — `handlePostProductSync`'s own `.catch(...)` (built by `pst-s1`) is untouched by this story. This task adds the explicit regression-guard test AC4 requires.

- [ ] **Step 1: Write the test**

```javascript
console.log('\n[pgft-s1] AC4 (regression guard) -- pst-s1 background-failure logging still catches an exhausted-retries failure');

(async function() {
  var PRODUCTS_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
  var adapterModPath = path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js');
  delete require.cache[require.resolve(adapterModPath)];
  var adapterMod = require(adapterModPath);
  adapterMod.setPipelineStateFetchAdapter(async function() {
    throw new Error('Failed to parse pipeline-state.json response: Unexpected end of JSON input (received 14 bytes; Content-Length header: 1800000)');
  });

  delete require.cache[require.resolve(PRODUCTS_PATH)];
  var productsRouteFresh = require(PRODUCTS_PATH);

  var mockPool = {
    query: async function(sql) {
      if (/SELECT product_id, tenant_id FROM products/i.test(sql)) return { rows: [{ product_id: 'p-pgft', tenant_id: 't1' }] };
      if (/SELECT repo_owner, repo_name FROM products/i.test(sql)) return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
      return { rows: [] };
    }
  };
  var req = { params: { id: 'p-pgft' }, session: { tenantId: 't1', accessToken: 'fake-token' } };
  var res = { status: function() { return { json: function() {} }; } };

  var errorLogs = [];
  var originalConsoleError = console.error;
  console.error = function() { errorLogs.push(Array.prototype.slice.call(arguments)); };
  try {
    await productsRouteFresh.handlePostProductSync(req, res, null, mockPool, null);
    await new Promise(function(r) { setTimeout(r, 20); });
  } finally {
    console.error = originalConsoleError;
  }

  var loggedIt = errorLogs.some(function(args) {
    return args.some(function(a) { return typeof a === 'string' && /Unexpected end of JSON input|p-pgft/.test(a); });
  });
  if (loggedIt) { passed++; console.log('  [PASS] pst-s1 background-failure logging still catches an exhausted-retries failure (AC4)'); }
  else { failed++; console.log('  [FAIL] AC4 regression guard -- expected console.error to be called, got:', JSON.stringify(errorLogs)); }
})();
```

- [ ] **Step 2: Run test — must pass immediately (no implementation change needed)**

```bash
node tests/check-pgft-s1-fetch-retry.js
```

Expected output: `[PASS] pst-s1 background-failure logging still catches an exhausted-retries failure (AC4)` — confirms this story's changes one layer below `handlePostProductSync` did not regress `pst-s1`'s own logging mechanism.

- [ ] **Step 3: Run full suite — final check**

```bash
npm test
```

Expected output: same baseline, 0 new failures. This is the last task — all 4 story ACs now have passing tests.

- [ ] **Step 4: Commit**

```bash
git add tests/check-pgft-s1-fetch-retry.js
git commit -m "test: add AC4 regression guard for pst-s1's background-failure logging"
```

---

<!-- End of plan. Next: /verify-completion once all 5 tasks are committed. -->
