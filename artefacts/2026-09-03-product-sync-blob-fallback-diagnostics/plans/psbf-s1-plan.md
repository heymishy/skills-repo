# Detect truncated Contents API content, fall back to Git Blobs API, and record diagnostics to logs + PostHog — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. GitHub's Contents API only reliably returns complete `content` for files under ~1MB; this repo's own connected `pipeline-state.json` is 1.34MB, so the base64 `content` field arrives truncated, and `syncProductRollup`'s own `JSON.parse(decoded)` throws with no retry and no diagnostics. Fix: detect the mismatch via GitHub's own `size` field, fall back to the Git Blobs API (using the always-present `sha` field, no size ceiling), and record diagnostics to logs + PostHog.
**Branch:** `feature/psbf-s1`
**Worktree:** `.worktrees/psbf-s1`
**Test command:** `npm test` (full suite) / `node tests/check-psbf-s1-blob-fallback.js` (this story's own file)

---

## File map

```
Create:
  tests/check-psbf-s1-blob-fallback.js  — 4 tests for AC1-AC4

Modify:
  src/web-ui/adapters/pipeline-state-fetch-adapter.js  — extracts pgft-s1's retry loop
                                    into a shared _fetchWithRetry(url, headers, errorPrefix)
                                    helper; adds realFetchBlobBySha + its D37 set/get pair.
  src/web-ui/modules/product-rollup.js  — syncProductRollup detects truncation, logs +
                                    captures to PostHog, falls back to the Blobs adapter.
  src/web-ui/server.js  — wires setPipelineStateBlobFetchAdapter(realFetchBlobBySha)
```

---

## Task 1: Extract shared retry helper, add realFetchBlobBySha (D37 adapter)

**Files:**
- Modify: `src/web-ui/adapters/pipeline-state-fetch-adapter.js`
- Test: `tests/check-psbf-s1-blob-fallback.js`

- [ ] **Step 1: Write the failing tests**

```javascript
// tests/check-psbf-s1-blob-fallback.js
'use strict';
var assert = require('assert');
var path = require('path');
var passed = 0; var failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

var ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js');
var PRODUCT_ROLLUP_PATH = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');
function freshAdapter() { delete require.cache[require.resolve(ADAPTER_PATH)]; return require(ADAPTER_PATH); }
function freshRollup() { delete require.cache[require.resolve(PRODUCT_ROLLUP_PATH)]; return require(PRODUCT_ROLLUP_PATH); }

console.log('\n[psbf-s1] D37 adapter -- realFetchBlobBySha exists, throws when unwired, wired implementation works');

(async function() {
  await (async function() {
    try {
      var mod = freshAdapter();
      if (typeof mod.realFetchBlobBySha !== 'function') throw new Error('Expected realFetchBlobBySha to be exported');
      if (typeof mod.setPipelineStateBlobFetchAdapter !== 'function') throw new Error('Expected setPipelineStateBlobFetchAdapter to be exported');
      if (typeof mod.getPipelineStateBlobFetchAdapter !== 'function') throw new Error('Expected getPipelineStateBlobFetchAdapter to be exported');
      passed++; console.log('  [PASS] pipeline-state-fetch-adapter.js exports realFetchBlobBySha and its D37 set/get pair');

      try {
        await mod.getPipelineStateBlobFetchAdapter()('acme', 'widgets', 'sha123', 'fake-token');
        assert.fail('Expected the unwired stub to throw');
      } catch (err) {
        if (!/not wired/i.test(err.message)) throw new Error('Expected "not wired" in message: ' + err.message);
      }
      passed++; console.log('  [PASS] getPipelineStateBlobFetchAdapter: default stub throws when called unwired (D37 rule 1)');
    } catch (err) { failed++; console.log('  [FAIL] D37 adapter shape --', err.message); }
  })();

  await (async function() {
    try {
      var originalFetch = global.fetch;
      var capturedUrl = null;
      global.fetch = async function(url) {
        capturedUrl = url;
        return {
          ok: true, status: 200,
          headers: { get: function() { return null; } },
          text: async function() { return JSON.stringify({ content: Buffer.from('{"features":[]}').toString('base64'), encoding: 'base64', size: 15, sha: 'sha123' }); }
        };
      };
      try {
        var mod = freshAdapter();
        var result = await mod.realFetchBlobBySha('acme', 'widgets', 'sha123', 'fake-token');
        if (capturedUrl.indexOf('/repos/acme/widgets/git/blobs/sha123') === -1) throw new Error('Expected Blobs API URL, got: ' + capturedUrl);
        if (!result || !result.content) throw new Error('Expected a parsed response with a content field');
        passed++; console.log('  [PASS] realFetchBlobBySha: fetches /repos/{owner}/{repo}/git/blobs/{sha}, returns parsed content');
      } finally {
        global.fetch = originalFetch;
      }
    } catch (err) { failed++; console.log('  [FAIL] realFetchBlobBySha happy path --', err.message); }
  })();

  console.log('\n[psbf-s1] Results so far: ' + passed + ' passed, ' + failed + ' failed');
  if (require.main === module) { process.exitCode = failed > 0 ? 1 : 0; }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-psbf-s1-blob-fallback.js
```

Expected output: `[FAIL] D37 adapter shape -- Expected realFetchBlobBySha to be exported`

- [ ] **Step 3: Write the implementation**

Replace the entire content of `src/web-ui/adapters/pipeline-state-fetch-adapter.js` with:

```javascript
'use strict';

// src/web-ui/adapters/pipeline-state-fetch-adapter.js -- pr-s2, pgft-s1, psbf-s1
//
// D37 injectable adapters for fetching a connected repo's
// .github/pipeline-state.json via GitHub's REST API, using the requesting
// user's own OAuth token (ADR-020, never a service account). Two paths:
//   - realFetchPipelineState: GitHub's Contents API. Reliable for files
//     under ~1MB; for larger files the `content` field can arrive
//     truncated even on an ok:200 response (psbf-s1's own root-cause
//     finding, confirmed live in production for this repo's own 1.34MB
//     pipeline-state.json).
//   - realFetchBlobBySha: GitHub's Git Blobs API, keyed by the blob `sha`
//     the Contents API always returns regardless of file size. No such
//     truncation ceiling (up to 100MB) -- the fallback syncProductRollup
//     uses when it detects the Contents API's own content was truncated.
// Both share the same retry-with-backoff mechanics (pgft-s1).

let _pipelineStateFetchAdapter = function() {
  throw new Error('Adapter not wired: pipelineStateFetchAdapter. Call setPipelineStateFetchAdapter() with a real implementation before use.');
};

let _pipelineStateBlobFetchAdapter = function() {
  throw new Error('Adapter not wired: pipelineStateBlobFetchAdapter. Call setPipelineStateBlobFetchAdapter() with a real implementation before use.');
};

function setPipelineStateFetchAdapter(impl) {
  _pipelineStateFetchAdapter = impl;
}

function getPipelineStateFetchAdapter() {
  return _pipelineStateFetchAdapter;
}

function setPipelineStateBlobFetchAdapter(impl) {
  _pipelineStateBlobFetchAdapter = impl;
}

function getPipelineStateBlobFetchAdapter() {
  return _pipelineStateBlobFetchAdapter;
}

/**
 * pgft-s1: fetches url with up to 3 attempts (500ms/1000ms backoff) on a
 * thrown network error or a JSON-parse failure on an otherwise-ok response.
 * A non-ok HTTP status is never retried -- fails immediately. On exhausted
 * parse failures, the thrown error includes the actual bytes received and
 * the response's own Content-Length header for diagnosis.
 * @param {string} url
 * @param {object} headers
 * @param {string} errorPrefix - included in thrown error messages
 */
async function _fetchWithRetry(url, headers, errorPrefix) {
  var maxAttempts = 3;
  var lastErr = null;

  for (var attempt = 1; attempt <= maxAttempts; attempt++) {
    var res;
    try {
      res = await fetch(url, { headers: headers });
    } catch (networkErr) {
      lastErr = networkErr;
      if (attempt < maxAttempts) { await _pgftDelay(attempt * 500); continue; }
      throw lastErr;
    }

    if (!res.ok) {
      throw new Error(errorPrefix + ': HTTP ' + res.status);
    }

    var bodyText = await res.text();
    try {
      return JSON.parse(bodyText);
    } catch (parseErr) {
      var contentLength = (res.headers && res.headers.get) ? (res.headers.get('content-length') || 'absent') : 'unavailable';
      lastErr = new Error(
        errorPrefix + ' response: ' + parseErr.message +
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

/**
 * Real GitHub implementation -- GET /repos/{owner}/{repo}/contents/.github/pipeline-state.json
 * using the caller's own OAuth token (ADR-020).
 * @param {string} owner
 * @param {string} repo
 * @param {string} accessToken
 * @returns {Promise<{content: string, encoding: string, size?: number, sha?: string}>} raw GitHub Contents API response shape
 */
async function realFetchPipelineState(owner, repo, accessToken) {
  var apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');
  var url = apiBase + '/repos/' + owner + '/' + repo + '/contents/.github/pipeline-state.json';
  return _fetchWithRetry(url, {
    Authorization: 'Bearer ' + accessToken,
    Accept: 'application/vnd.github+json'
  }, 'Failed to fetch pipeline-state.json');
}

/**
 * psbf-s1: Real GitHub implementation -- GET /repos/{owner}/{repo}/git/blobs/{sha},
 * the fallback for a blob the Contents API's own content field could not
 * fully return. No practical size ceiling for this platform's files (up to
 * 100MB per GitHub's own documented limit).
 * @param {string} owner
 * @param {string} repo
 * @param {string} sha - blob sha, from the Contents API response's own `sha` field
 * @param {string} accessToken
 * @returns {Promise<{content: string, encoding: string, size?: number, sha?: string}>} raw GitHub Git Blobs API response shape
 */
async function realFetchBlobBySha(owner, repo, sha, accessToken) {
  var apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');
  var url = apiBase + '/repos/' + owner + '/' + repo + '/git/blobs/' + sha;
  return _fetchWithRetry(url, {
    Authorization: 'Bearer ' + accessToken,
    Accept: 'application/vnd.github+json'
  }, 'Failed to fetch blob ' + sha);
}

module.exports = {
  setPipelineStateFetchAdapter,
  getPipelineStateFetchAdapter,
  realFetchPipelineState,
  setPipelineStateBlobFetchAdapter,
  getPipelineStateBlobFetchAdapter,
  realFetchBlobBySha
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-psbf-s1-blob-fallback.js
```

Expected output: both D37-shape and happy-path `[PASS]` lines.

- [ ] **Step 5: Run pgft-s1's own existing test file — must still pass unchanged**

```bash
node tests/check-pgft-s1-fetch-retry.js
```

Expected output: all 5 `[PASS]` lines, 0 failures — confirms the retry-loop extraction preserved `realFetchPipelineState`'s exact existing behaviour and error message shapes.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/pipeline-state-fetch-adapter.js tests/check-psbf-s1-blob-fallback.js
git commit -m "feat: extract shared retry helper, add realFetchBlobBySha D37 adapter"
```

---

## Task 2: syncProductRollup detects truncation, logs + captures to PostHog, falls back to Blobs API (AC1, AC2)

**Files:**
- Modify: `src/web-ui/modules/product-rollup.js`
- Test: `tests/check-psbf-s1-blob-fallback.js` (append)

- [ ] **Step 1: Write the failing tests**

Append to `tests/check-psbf-s1-blob-fallback.js`, before the final `console.log`/`process.exitCode` block:

```javascript
  console.log('\n[psbf-s1] AC1/AC2 -- truncation detected, logged + captured to PostHog, Blobs API fallback used');

  await (async function() {
    try {
      var posthogModPath = path.resolve(__dirname, '../src/web-ui/modules/posthog-server.js');
      delete require.cache[require.resolve(posthogModPath)];
      var posthogMod = require(posthogModPath);
      var captureExceptionCalls = [];
      var originalCaptureException = posthogMod.captureException;
      posthogMod.captureException = function() { captureExceptionCalls.push(Array.prototype.slice.call(arguments)); };

      var adapterMod = freshAdapter();
      var fullPipelineState = { features: [{ slug: 'full-feature-only-in-blob' }] };
      var fullContentB64 = Buffer.from(JSON.stringify(fullPipelineState)).toString('base64');
      var truncatedContentB64 = fullContentB64.slice(0, 20); // deliberately short

      adapterMod.setPipelineStateFetchAdapter(async function() {
        return { content: truncatedContentB64, encoding: 'base64', size: Buffer.from(fullContentB64, 'base64').length + 500, sha: 'blob-sha-1' };
      });
      var blobCalls = [];
      adapterMod.setPipelineStateBlobFetchAdapter(async function(owner, repo, sha, token) {
        blobCalls.push({ owner: owner, repo: repo, sha: sha, token: token });
        return { content: fullContentB64, encoding: 'base64', size: Buffer.from(fullContentB64, 'base64').length, sha: sha };
      });

      var writtenParams = null;
      var mockPool = {
        query: async function(sql, params) {
          if (/INSERT INTO product_rollups/i.test(sql)) { writtenParams = params; return { rows: [] }; }
          return { rows: [] };
        }
      };

      var rollupMod = freshRollup();
      try {
        await rollupMod.syncProductRollup(mockPool, adapterMod, { productId: 'p-trunc', repoOwner: 'acme', repoName: 'widgets', accessToken: 'fake-token' });

        if (captureExceptionCalls.length < 1) throw new Error('Expected captureException to be called at least once for the detected truncation');
        var firstCall = captureExceptionCalls[0];
        var firstProps = firstCall[2] || {};
        if (firstProps.fallbackAttempted !== false) throw new Error('Expected the first captureException call to have fallbackAttempted:false, got: ' + JSON.stringify(firstProps));
        passed++; console.log('  [PASS] syncProductRollup: truncation detected and captured to PostHog before any fallback (AC1)');

        if (blobCalls.length !== 1) throw new Error('Expected exactly 1 Blobs API call, got ' + blobCalls.length);
        if (blobCalls[0].sha !== 'blob-sha-1') throw new Error('Expected the fallback to use the Contents API response\'s own sha, got: ' + blobCalls[0].sha);
        passed++; console.log('  [PASS] syncProductRollup: Blobs API fallback called with the correct sha (AC2)');

        if (!writtenParams || writtenParams.join('|').indexOf('full-feature-only-in-blob') === -1) throw new Error('Expected the written rollup to reflect the FULL (blob-fetched) content, not the truncated original');
        passed++; console.log('  [PASS] syncProductRollup: rollup reflects the full Blobs-API content, not the truncated original (AC2)');
      } finally {
        posthogMod.captureException = originalCaptureException;
      }
    } catch (err) { failed++; console.log('  [FAIL] AC1/AC2 truncation + fallback --', err.message); }
  })();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-psbf-s1-blob-fallback.js
```

Expected output: `[FAIL] AC1/AC2 truncation + fallback -- Expected captureException to be called...` (current `syncProductRollup` has no truncation detection at all)

- [ ] **Step 3: Write the implementation**

In `src/web-ui/modules/product-rollup.js`, add near the top (with the other requires — check the file for its existing require style first; it may have none, in which case add one):

```javascript
var _posthog = require('./posthog-server');
```

Replace `syncProductRollup`'s existing body:

```javascript
async function syncProductRollup(pool, adapterModule, opts) {
  var raw = await adapterModule.getPipelineStateFetchAdapter()(opts.repoOwner, opts.repoName, opts.accessToken);
  var decodedBuf = Buffer.from(raw.content, 'base64');
  var truncated = typeof raw.size === 'number' && decodedBuf.length !== raw.size;

  var pipelineState;
  if (!truncated) {
    try {
      pipelineState = JSON.parse(decodedBuf.toString('utf8'));
    } catch (parseErr) {
      // psbf-s1 (AC1): an outright parse failure even when size matched (or
      // was absent) -- treat the same as a detected mismatch, since the
      // content is demonstrably not valid regardless of which signal caught it.
      truncated = true;
    }
  }

  if (truncated) {
    // psbf-s1 (AC1): GitHub's Contents API only reliably returns complete
    // `content` for files under ~1MB; larger files can arrive truncated on
    // an otherwise-ok response. Log + capture BEFORE attempting the
    // fallback, so the true frequency of this condition is observable
    // even when the fallback then succeeds.
    console.error('[psbf-s1] Contents API content truncated for product ' + opts.productId + ': reported size ' + raw.size + ', decoded length ' + decodedBuf.length);
    _posthog.captureException(new Error('Contents API content truncated'), opts.productId, {
      productId: opts.productId,
      repoOwner: opts.repoOwner,
      repoName: opts.repoName,
      reportedSize: raw.size,
      decodedLength: decodedBuf.length,
      fallbackAttempted: false
    });

    try {
      // psbf-s1 (AC2): fall back to the Git Blobs API, which has no such
      // truncation ceiling, using the sha the Contents API response always
      // includes regardless of file size.
      var blobRaw = await adapterModule.getPipelineStateBlobFetchAdapter()(opts.repoOwner, opts.repoName, raw.sha, opts.accessToken);
      var blobDecodedBuf = Buffer.from(blobRaw.content, 'base64');
      pipelineState = JSON.parse(blobDecodedBuf.toString('utf8'));
    } catch (fallbackErr) {
      // psbf-s1 (AC3): the fallback itself also failed -- log + capture
      // with a distinguishing property so this is immediately diagnosable
      // as "the fallback failed", not another ambiguous truncation report.
      console.error('[psbf-s1] Git Blobs API fallback failed for product ' + opts.productId + ':', fallbackErr.message);
      _posthog.captureException(fallbackErr, opts.productId, {
        productId: opts.productId,
        repoOwner: opts.repoOwner,
        repoName: opts.repoName,
        reportedSize: raw.size,
        decodedLength: decodedBuf.length,
        fallbackAttempted: true
      });
      throw fallbackErr;
    }
  }

  var rollup = computeDodStatusRollup(pipelineState);
  var healthCounts = computeHealthCounts(pipelineState);
  var testCoverage = computeTestCoverageRollup(pipelineState);
  var acCoverage = computeAcCoverageRollup(pipelineState);
  var taxonomy = computeTaxonomyRollup(pipelineState);

  await pool.query(
    `INSERT INTO product_rollups (product_id, dod_status_counts, health_counts, test_coverage, ac_coverage, taxonomy, synced_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (product_id) DO UPDATE SET dod_status_counts = $2, health_counts = $3, test_coverage = $4, ac_coverage = $5, taxonomy = $6, synced_at = NOW()`,
    [opts.productId, JSON.stringify(rollup), JSON.stringify(healthCounts), JSON.stringify(testCoverage), JSON.stringify(acCoverage), JSON.stringify(taxonomy)]
  );

  try {
    await pruneOrphanedFeatureModuleAssignments(pool, opts.productId, taxonomy);
  } catch (pruneErr) {
    console.error('[tmc-s1] orphaned feature_module_assignments prune failed:', pruneErr.message);
  }

  return rollup;
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-psbf-s1-blob-fallback.js
```

Expected output: all 3 new `[PASS]` lines for AC1/AC2.

- [ ] **Step 5: Run pre-existing product-rollup tests — check for regressions**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected output: all pre-existing tests still pass. Every existing mock in that file omits `size`, so `typeof raw.size === 'number'` is false and `truncated` stays false for all of them — zero behavioural change expected. If any fail, investigate before continuing.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/product-rollup.js tests/check-psbf-s1-blob-fallback.js
git commit -m "feat: detect truncated Contents API content, fall back to Git Blobs API, capture diagnostics (AC1, AC2)"
```

---

## Task 3: Fallback failure also captured, still reaches caller's error handling (AC3)

**Files:**
- Test: `tests/check-psbf-s1-blob-fallback.js` (append)

No further production code change — Task 2's implementation already includes the fallback-failure catch/capture/rethrow. This task adds the dedicated test.

- [ ] **Step 1: Write the test**

```javascript
  console.log('\n[psbf-s1] AC3 -- fallback failure also captured, still reaches the caller (regression guard for pst-s1)');

  await (async function() {
    try {
      var posthogModPath = path.resolve(__dirname, '../src/web-ui/modules/posthog-server.js');
      delete require.cache[require.resolve(posthogModPath)];
      var posthogMod = require(posthogModPath);
      var captureExceptionCalls = [];
      var originalCaptureException = posthogMod.captureException;
      posthogMod.captureException = function() { captureExceptionCalls.push(Array.prototype.slice.call(arguments)); };

      var adapterMod = freshAdapter();
      adapterMod.setPipelineStateFetchAdapter(async function() {
        return { content: 'dHJ1bmM=', encoding: 'base64', size: 999999, sha: 'blob-sha-2' }; // deliberately truncated
      });
      adapterMod.setPipelineStateBlobFetchAdapter(async function() {
        throw new Error('simulated Blobs API failure');
      });

      var mockPool = { query: async function() { return { rows: [] }; } };
      var rollupMod = freshRollup();

      try {
        try {
          await rollupMod.syncProductRollup(mockPool, adapterMod, { productId: 'p-fallback-fail', repoOwner: 'acme', repoName: 'widgets', accessToken: 'fake-token' });
          throw new Error('Expected syncProductRollup to throw when the fallback also fails');
        } catch (err) {
          if (!/simulated Blobs API failure/.test(err.message)) throw new Error('Expected the fallback error to propagate, got: ' + err.message);
        }
        passed++; console.log('  [PASS] syncProductRollup: throws when the Blobs API fallback also fails, error propagates to caller (AC3)');

        var fallbackCapture = captureExceptionCalls.find(function(c) { return c[2] && c[2].fallbackAttempted === true; });
        if (!fallbackCapture) throw new Error('Expected a captureException call with fallbackAttempted:true, got: ' + JSON.stringify(captureExceptionCalls));
        passed++; console.log('  [PASS] syncProductRollup: fallback failure captured with fallbackAttempted:true, distinguishable from the original truncation (AC3)');
      } finally {
        posthogMod.captureException = originalCaptureException;
      }
    } catch (err) { failed++; console.log('  [FAIL] AC3 fallback failure --', err.message); }
  })();
```

- [ ] **Step 2: Run test — must pass immediately**

```bash
node tests/check-psbf-s1-blob-fallback.js
```

Expected output: both new `[PASS]` lines for AC3.

- [ ] **Step 3: Commit**

```bash
git add tests/check-psbf-s1-blob-fallback.js
git commit -m "test: verify fallback failure is captured and still propagates to the caller (AC3)"
```

---

## Task 4: Regression guard — non-truncated common case is completely unaffected (AC4)

**Files:**
- Test: `tests/check-psbf-s1-blob-fallback.js` (append)

No production code change. This task adds the explicit regression-guard test AC4 requires.

- [ ] **Step 1: Write the test**

```javascript
  console.log('\n[psbf-s1] AC4 (regression guard) -- non-truncated content: no fallback, no new log lines, unchanged behaviour');

  await (async function() {
    try {
      var posthogModPath = path.resolve(__dirname, '../src/web-ui/modules/posthog-server.js');
      delete require.cache[require.resolve(posthogModPath)];
      var posthogMod = require(posthogModPath);
      var captureExceptionCalls = [];
      var originalCaptureException = posthogMod.captureException;
      posthogMod.captureException = function() { captureExceptionCalls.push(arguments); };

      var adapterMod = freshAdapter();
      var normalContent = Buffer.from(JSON.stringify({ features: [] })).toString('base64');
      adapterMod.setPipelineStateFetchAdapter(async function() {
        return { content: normalContent, encoding: 'base64', size: Buffer.from(normalContent, 'base64').length, sha: 'sha-normal' };
      });
      var blobCallCount = 0;
      adapterMod.setPipelineStateBlobFetchAdapter(async function() { blobCallCount++; return { content: normalContent, encoding: 'base64' }; });

      var writeCount = 0;
      var mockPool = { query: async function(sql) { if (/INSERT INTO product_rollups/i.test(sql)) writeCount++; return { rows: [] }; } };
      var rollupMod = freshRollup();

      try {
        await rollupMod.syncProductRollup(mockPool, adapterMod, { productId: 'p-normal', repoOwner: 'acme', repoName: 'widgets', accessToken: 'fake-token' });
        if (blobCallCount !== 0) throw new Error('Expected zero Blobs API calls for non-truncated content, got ' + blobCallCount);
        if (captureExceptionCalls.length !== 0) throw new Error('Expected zero PostHog captures for non-truncated content, got ' + captureExceptionCalls.length);
        if (writeCount !== 1) throw new Error('Expected exactly one rollup write, got ' + writeCount);
        passed++; console.log('  [PASS] syncProductRollup: non-truncated content triggers zero fallback calls, zero PostHog captures, unchanged write (AC4)');
      } finally {
        posthogMod.captureException = originalCaptureException;
      }
    } catch (err) { failed++; console.log('  [FAIL] AC4 regression guard --', err.message); }
  })();
```

- [ ] **Step 2: Run test — must pass immediately**

```bash
node tests/check-psbf-s1-blob-fallback.js
```

Expected output: `[PASS] syncProductRollup: non-truncated content triggers zero fallback calls...` — confirms Tasks 1-3 introduced zero behavioural change for the common case.

- [ ] **Step 3: Run full suite — final check**

```bash
npm test
```

Expected output: same baseline (600 + this story's own new file, 1 pre-existing unrelated failure), 0 new failures. This is the last task — all 4 story ACs now have passing tests.

- [ ] **Step 4: Commit**

```bash
git add tests/check-psbf-s1-blob-fallback.js
git commit -m "test: add AC4 regression guard for the non-truncated common case"
```

---

## Task 5: Wire the real Blobs adapter in server.js (D37 rule 3)

**Files:**
- Modify: `src/web-ui/server.js`

- [ ] **Step 1: Find the existing wiring line**

```bash
grep -n "setPipelineStateFetchAdapter(realFetchPipelineState)" src/web-ui/server.js
```

- [ ] **Step 2: Write the implementation**

Add a new line immediately after the existing `setPipelineStateFetchAdapter(realFetchPipelineState)` wiring call, and add `setPipelineStateBlobFetchAdapter`/`realFetchBlobBySha` to the destructured import of `./adapters/pipeline-state-fetch-adapter` at the top of the file (find the existing `const { ... realFetchPipelineState ... } = require('./adapters/pipeline-state-fetch-adapter')` line):

```javascript
setPipelineStateBlobFetchAdapter(realFetchBlobBySha);
```

- [ ] **Step 3: Run the existing D37-wiring test — confirm it still passes and extend it**

```bash
node tests/check-pr-s2-pipeline-state-fetch-adapter.js
```

Expected output: T5 (the wiring test) still passes unchanged, since it only asserts `realFetchPipelineState`'s own wiring, not the new blob adapter's. Add a new assertion to T5 (or a new sub-test in `check-psbf-s1-blob-fallback.js`) checking `server.js` also wires `setPipelineStateBlobFetchAdapter(realFetchBlobBySha)`:

```javascript
  console.log('\n[psbf-s1] D37 rule 3 -- server.js wires the real Blobs adapter implementation');
  (function() {
    try {
      var fs = require('fs');
      var SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      if (!/setPipelineStateBlobFetchAdapter\(\s*realFetchBlobBySha/.test(src)) throw new Error('Expected server.js to wire setPipelineStateBlobFetchAdapter(realFetchBlobBySha)');
      passed++; console.log('  [PASS] server.js wires setPipelineStateBlobFetchAdapter(realFetchBlobBySha) (D37 rule 3)');
    } catch (err) { failed++; console.log('  [FAIL] D37 rule 3 wiring --', err.message); }
  })();
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-psbf-s1-blob-fallback.js
node -c src/web-ui/server.js
```

Expected output: `[PASS] server.js wires setPipelineStateBlobFetchAdapter...` and clean syntax check.

- [ ] **Step 5: Run full suite — final regression check**

```bash
npm test
```

Expected output: same baseline, 0 new failures.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js tests/check-psbf-s1-blob-fallback.js
git commit -m "feat: wire the real Git Blobs adapter implementation in server.js (D37 rule 3)"
```

---

<!-- End of plan. Next: /verify-completion once all 5 tasks are committed. -->
