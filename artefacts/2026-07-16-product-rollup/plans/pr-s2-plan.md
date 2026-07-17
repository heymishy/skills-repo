# Sync a product's connected repo and show aggregate DoD status — Implementation Plan

> **For agent execution:** Use /subagent-execution (Haiku model per operator instruction).

**Goal:** Make every test in `artefacts/2026-07-16-product-rollup/test-plans/pr-s2-test-plan.md` pass. Do not add scope beyond what the ACs and tests specify.
**Branch:** `feature/pr-s2`
**Worktree:** `.worktrees/pr-s2`
**Test command:** `node <file>` (plain Node scripts using the built-in `assert` module)

---

## File map

```
Create:
  src/web-ui/adapters/pipeline-state-fetch-adapter.js  — D37 injectable adapter: Contents API fetch of pipeline-state.json
  src/web-ui/modules/product-rollup.js                 — DoD-status aggregation + sync orchestration + cache read/write
  tests/check-pr-s2-pipeline-state-fetch-adapter.js     — AC5 tests (adapter wiring, stub-throws)
  tests/check-pr-s2-product-rollup.js                   — AC1, AC3, AC4 tests
  tests/check-pr-s2-products-route.js                   — AC2 test

Modify:
  src/web-ui/server.js       — new product_rollups cache table migration; wire the real Contents API adapter
  src/web-ui/routes/products.js — "Sync now" trigger action; render cached DoD status
```

---

## Task 1: Injectable adapter for the Contents API fetch (AC5 — stub half)

**Files:**
- Create: `src/web-ui/adapters/pipeline-state-fetch-adapter.js`
- Test: `tests/check-pr-s2-pipeline-state-fetch-adapter.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';

// tests/check-pr-s2-pipeline-state-fetch-adapter.js
// pr-s2 AC5 -- the Contents API fetch adapter follows this repo's D37
// injectable-adapter convention (see repo-adapter.js): throw-on-unwired
// stub default, real implementation wired separately in server.js.

var assert = require('assert');
var path = require('path');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

var MODULE_PATH = path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js');

function freshRequire() {
  delete require.cache[require.resolve(MODULE_PATH)];
  return require(MODULE_PATH);
}

async function main() {
  var queue = [];

  // T1: unwired adapter default throws, does not return null/empty (D37 rule 1)
  queue.push(function() {
    console.log('\n[pr-s2] T1 -- unwired adapter throws rather than returning a silent empty value (AC5)');
    return test('getPipelineStateFetchAdapter: default stub throws when called unwired', async function() {
      var mod = freshRequire();
      try {
        await mod.getPipelineStateFetchAdapter()('owner', 'repo', 'fake-token');
        assert.fail('Expected the unwired stub to throw');
      } catch (err) {
        assert.ok(/not wired/i.test(err.message), 'Error message must name the adapter as not wired: ' + err.message);
      }
    });
  });

  // T2: setPipelineStateFetchAdapter replaces the implementation
  queue.push(function() {
    console.log('\n[pr-s2] T2 -- setPipelineStateFetchAdapter replaces the default stub');
    return test('setPipelineStateFetchAdapter: wired implementation is used on next call', async function() {
      var mod = freshRequire();
      var called = false;
      mod.setPipelineStateFetchAdapter(async function(owner, repo, token) {
        called = true;
        return { content: '{}', encoding: 'base64' };
      });
      await mod.getPipelineStateFetchAdapter()('owner', 'repo', 'fake-token');
      assert.ok(called, 'Expected the wired implementation to be invoked');
    });
  });

  // T3: realFetchPipelineState calls GitHub's Contents API with the correct URL and auth header
  queue.push(function() {
    console.log('\n[pr-s2] T3 -- realFetchPipelineState calls the Contents API with the correct URL and Authorization header (AC1)');
    return test('realFetchPipelineState: fetches /repos/{owner}/{repo}/contents/.github/pipeline-state.json with Bearer token', async function() {
      var originalFetch = global.fetch;
      var capturedUrl = null;
      var capturedHeaders = null;
      global.fetch = async function(url, opts) {
        capturedUrl = url;
        capturedHeaders = opts.headers;
        return {
          ok: true,
          status: 200,
          json: async function() { return { content: Buffer.from('{"features":[]}').toString('base64'), encoding: 'base64' }; }
        };
      };
      try {
        var mod = freshRequire();
        await mod.realFetchPipelineState('acme', 'widgets', 'fake-token-123');
        assert.ok(capturedUrl.indexOf('/repos/acme/widgets/contents/.github/pipeline-state.json') !== -1,
          'Expected Contents API URL for the correct owner/repo/path, got: ' + capturedUrl);
        assert.strictEqual(capturedHeaders.Authorization, 'Bearer fake-token-123', 'Expected Authorization: Bearer <token> header');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  // T4: realFetchPipelineState surfaces a distinguishable error on non-200 responses (AC3)
  queue.push(function() {
    console.log('\n[pr-s2] T4 -- realFetchPipelineState surfaces a distinguishable error on 404/403 (AC3)');
    return test('realFetchPipelineState: throws with the HTTP status on a non-ok response', async function() {
      var originalFetch = global.fetch;
      global.fetch = async function() {
        return { ok: false, status: 404, json: async function() { return { message: 'Not Found' }; } };
      };
      try {
        var mod = freshRequire();
        try {
          await mod.realFetchPipelineState('acme', 'missing-repo', 'fake-token');
          assert.fail('Expected realFetchPipelineState to throw on a 404');
        } catch (err) {
          assert.ok(/404/.test(err.message), 'Expected the error to mention the HTTP status: ' + err.message);
        }
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[pr-s2-pipeline-state-fetch-adapter] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) { console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[pr-s2-pipeline-state-fetch-adapter] Unexpected error:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-pipeline-state-fetch-adapter.js
```

Expected: `Cannot find module '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'`

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';

// src/web-ui/adapters/pipeline-state-fetch-adapter.js -- pr-s2
//
// D37 injectable adapter fetching a connected repo's .github/pipeline-state.json
// via GitHub's Contents API, using the requesting user's own OAuth token
// (ADR-020, never a service account). Mirrors repo-adapter.js's exact
// pattern (throw-on-unwired stub default, set/get pair, a separate "real"
// implementation function wired in server.js as its own D37 task).

let _pipelineStateFetchAdapter = function() {
  throw new Error('Adapter not wired: pipelineStateFetchAdapter. Call setPipelineStateFetchAdapter() with a real implementation before use.');
};

/**
 * Replace the pipeline-state fetch adapter (used in tests and production startup).
 * @param {(owner: string, repo: string, accessToken: string) => Promise<{content: string, encoding: string}>} impl
 */
function setPipelineStateFetchAdapter(impl) {
  _pipelineStateFetchAdapter = impl;
}

/**
 * Retrieve the currently wired adapter function. Callers invoke
 * getPipelineStateFetchAdapter()(owner, repo, accessToken) rather than
 * holding a captured reference, so rewiring always takes effect for the
 * next call.
 * @returns {Function}
 */
function getPipelineStateFetchAdapter() {
  return _pipelineStateFetchAdapter;
}

/**
 * Real GitHub implementation -- GET /repos/{owner}/{repo}/contents/.github/pipeline-state.json
 * using the caller's own OAuth token (ADR-020). Throws with the HTTP status
 * on any non-ok response (404 not found, 403 forbidden, etc.) so the caller
 * can surface a visible failure rather than silently treating it as empty
 * data (AC3).
 * @param {string} owner
 * @param {string} repo
 * @param {string} accessToken
 * @returns {Promise<{content: string, encoding: string}>} raw GitHub Contents API response shape
 */
async function realFetchPipelineState(owner, repo, accessToken) {
  var apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');
  var url = apiBase + '/repos/' + owner + '/' + repo + '/contents/.github/pipeline-state.json';

  var res = await fetch(url, {
    headers: {
      Authorization: 'Bearer ' + accessToken,
      Accept: 'application/vnd.github+json'
    }
  });

  if (!res.ok) {
    throw new Error('Failed to fetch pipeline-state.json: HTTP ' + res.status);
  }

  return res.json();
}

module.exports = {
  setPipelineStateFetchAdapter,
  getPipelineStateFetchAdapter,
  realFetchPipelineState
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-pipeline-state-fetch-adapter.js
```

Expected output: `[pr-s2-pipeline-state-fetch-adapter] Results: 4 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected: failed-file count unchanged from the pre-task baseline (this repo has known pre-existing failures — do not try to fix unrelated ones, just confirm you haven't added new ones).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/pipeline-state-fetch-adapter.js tests/check-pr-s2-pipeline-state-fetch-adapter.js
git commit -m "feat(pr-s2): add D37 injectable adapter for the pipeline-state.json Contents API fetch"
```

---

## Task 2: DoD-status aggregation (AC4)

**Files:**
- Create: `src/web-ui/modules/product-rollup.js` (this task adds only the aggregation function; Task 3 adds sync orchestration to the same file)
- Test: `tests/check-pr-s2-product-rollup.js` (this task adds only the aggregation tests; Task 3 appends more)

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';

// tests/check-pr-s2-product-rollup.js
// pr-s2 -- DoD-status aggregation (AC4) and full sync orchestration (AC1, AC3).

var assert = require('assert');
var path = require('path');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

var MODULE_PATH = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');

function freshRequire() {
  delete require.cache[require.resolve(MODULE_PATH)];
  return require(MODULE_PATH);
}

async function main() {
  var queue = [];

  // T1: counts epic-nested stories correctly (AC4)
  queue.push(function() {
    console.log('\n[pr-s2] T1 -- DoD aggregation counts epic-nested stories correctly (AC4)');
    return test('computeDodStatusRollup: counts stories nested under epics[].stories[]', function() {
      var mod = freshRequire();
      var pipelineState = {
        features: [
          {
            slug: 'feature-a',
            epics: [
              { slug: 'epic-1', stories: [
                { slug: 's1', dodStatus: 'complete' },
                { slug: 's2', dodStatus: 'in-progress' }
              ]}
            ]
          },
          { slug: 'feature-b', stories: [ { slug: 's3', dodStatus: 'complete' } ] }
        ]
      };
      var result = mod.computeDodStatusRollup(pipelineState);
      assert.strictEqual(result.complete, 2, 'Expected 2 complete stories, got ' + result.complete);
      assert.strictEqual(result['in-progress'], 1, "Expected 1 in-progress story, got " + result['in-progress']);
    });
  });

  // T2: does not double-count when a feature has both epics[].stories[] and a stale empty top-level stories[]
  queue.push(function() {
    console.log('\n[pr-s2] T2 -- DoD aggregation does not double-count the ambiguous epic-nested-plus-stale-flat shape (AC4)');
    return test('computeDodStatusRollup: a feature with both epics[].stories[] and an empty top-level stories[] is counted once', function() {
      var mod = freshRequire();
      var pipelineState = {
        features: [
          {
            slug: 'feature-a',
            stories: [], // stale/empty top-level field, as this platform's own repo actually has
            epics: [
              { slug: 'epic-1', stories: [
                { slug: 's1', dodStatus: 'complete' },
                { slug: 's2', dodStatus: 'complete' }
              ]}
            ]
          }
        ]
      };
      var result = mod.computeDodStatusRollup(pipelineState);
      assert.strictEqual(result.complete, 2, 'Expected exactly 2 complete (not 4 from double-counting), got ' + result.complete);
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[pr-s2-product-rollup] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) { console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[pr-s2-product-rollup] Unexpected error:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected: `Cannot find module '../src/web-ui/modules/product-rollup.js'`

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';

// src/web-ui/modules/product-rollup.js -- pr-s2
//
// DoD-status aggregation over a connected repo's pipeline-state.json, plus
// (added in Task 3 below) sync orchestration writing the computed rollup to
// a Postgres cache table scoped by product_id.
//
// Handles both epics[].stories[] (epic-nested) and flat feature.stories[]
// structures. A feature may have BOTH a populated epics[].stories[] and a
// stale/empty top-level stories: [] field -- this platform's own real
// pipeline-state.json is shaped exactly this way. Only the epic-nested
// stories are counted for such a feature; the empty top-level array
// contributes nothing (AC4).

/**
 * @param {object} pipelineState - parsed pipeline-state.json content
 * @returns {Object<string, number>} count of stories at each dodStatus value
 */
function computeDodStatusRollup(pipelineState) {
  var counts = {};
  var features = (pipelineState && pipelineState.features) || [];

  features.forEach(function(feature) {
    var stories = [];
    if (Array.isArray(feature.epics) && feature.epics.length > 0) {
      feature.epics.forEach(function(epic) {
        (epic.stories || []).forEach(function(story) { stories.push(story); });
      });
    } else {
      stories = feature.stories || [];
    }

    stories.forEach(function(story) {
      var status = story.dodStatus || 'unknown';
      counts[status] = (counts[status] || 0) + 1;
    });
  });

  return counts;
}

module.exports = {
  computeDodStatusRollup
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected output: `[pr-s2-product-rollup] Results: 2 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/product-rollup.js tests/check-pr-s2-product-rollup.js
git commit -m "feat(pr-s2): add DoD-status aggregation handling epic-nested and flat feature structures"
```

---

## Task 3: Sync orchestration + Postgres cache (AC1, AC3)

**Files:**
- Modify: `src/web-ui/modules/product-rollup.js` (add `syncProductRollup`)
- Modify (append to): `tests/check-pr-s2-product-rollup.js`

- [ ] **Step 1: Write the failing tests**

Append to `tests/check-pr-s2-product-rollup.js`, inserting these `queue.push(...)` blocks immediately before the line `for (var i = 0; i < queue.length; i++) {`:

```javascript
  // T3: syncProductRollup fetches, computes, and writes the rollup to the cache table (AC1)
  queue.push(function() {
    console.log('\n[pr-s2] T3 -- syncProductRollup fetches via the adapter, computes the rollup, and writes it to the cache table (AC1)');
    return test('syncProductRollup: writes computed DoD counts to a cache row scoped by product_id', async function() {
      var mod = freshRequire();
      var adapterMod = require(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'));
      delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'))];
      var freshAdapterMod = require(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'));

      var fixturePipelineState = { features: [ { slug: 'f1', stories: [ { dodStatus: 'complete' }, { dodStatus: 'complete' } ] } ] };
      freshAdapterMod.setPipelineStateFetchAdapter(async function() {
        return { content: Buffer.from(JSON.stringify(fixturePipelineState)).toString('base64'), encoding: 'base64' };
      });

      var writes = [];
      var mockPool = {
        query: async function(sql, params) {
          if (/INSERT INTO product_rollups/i.test(sql)) {
            writes.push({ sql: sql, params: params });
            return { rows: [] };
          }
          return { rows: [] };
        }
      };

      await mod.syncProductRollup(mockPool, freshAdapterMod, { productId: 'p1', repoOwner: 'acme', repoName: 'widgets', accessToken: 'fake-token' });

      assert.strictEqual(writes.length, 1, 'Expected exactly one write to product_rollups');
      assert.ok(writes[0].params.indexOf('p1') !== -1, 'Expected the write to be scoped by product_id p1');
      var writtenJson = writes[0].params.find(function(p) { return typeof p === 'string' && p.indexOf('complete') !== -1; });
      assert.ok(writtenJson, 'Expected the written rollup data to include the computed DoD counts');
    });
  });

  // T4: syncProductRollup surfaces a visible error and writes nothing on fetch failure (AC3)
  queue.push(function() {
    console.log('\n[pr-s2] T4 -- syncProductRollup surfaces a visible error and does not write on fetch failure (AC3)');
    return test('syncProductRollup: throws distinguishably and writes nothing when the adapter fetch fails', async function() {
      var mod = freshRequire();
      delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'))];
      var freshAdapterMod = require(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'));
      freshAdapterMod.setPipelineStateFetchAdapter(async function() {
        throw new Error('Failed to fetch pipeline-state.json: HTTP 404');
      });

      var writeAttempted = false;
      var mockPool = {
        query: async function(sql) {
          if (/INSERT INTO product_rollups/i.test(sql)) { writeAttempted = true; }
          return { rows: [] };
        }
      };

      try {
        await mod.syncProductRollup(mockPool, freshAdapterMod, { productId: 'p1', repoOwner: 'acme', repoName: 'missing', accessToken: 'fake-token' });
        assert.fail('Expected syncProductRollup to throw on fetch failure');
      } catch (err) {
        assert.ok(/404/.test(err.message), 'Expected the error to surface the underlying HTTP status: ' + err.message);
      }
      assert.strictEqual(writeAttempted, false, 'Expected no cache write attempt when the fetch fails');
    });
  });

```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected: `TypeError: mod.syncProductRollup is not a function`

- [ ] **Step 3: Write the implementation**

Add to `src/web-ui/modules/product-rollup.js` (after `computeDodStatusRollup`, before `module.exports`):

```javascript

/**
 * Fetches a product's connected repo's pipeline-state.json via the wired
 * adapter, computes the DoD-status rollup, and writes it to the
 * product_rollups cache table scoped by product_id. Throws (does not write)
 * if the fetch fails, so a failed sync never silently shows stale or empty
 * data as if it were current (AC3).
 *
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {{getPipelineStateFetchAdapter: Function}} adapterModule
 * @param {{productId: string, repoOwner: string, repoName: string, accessToken: string}} opts
 */
async function syncProductRollup(pool, adapterModule, opts) {
  var raw = await adapterModule.getPipelineStateFetchAdapter()(opts.repoOwner, opts.repoName, opts.accessToken);
  var decoded = Buffer.from(raw.content, 'base64').toString('utf8');
  var pipelineState = JSON.parse(decoded);
  var rollup = computeDodStatusRollup(pipelineState);

  await pool.query(
    `INSERT INTO product_rollups (product_id, dod_status_counts, synced_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (product_id) DO UPDATE SET dod_status_counts = $2, synced_at = NOW()`,
    [opts.productId, JSON.stringify(rollup)]
  );

  return rollup;
}
```

Update `module.exports` at the bottom of the file to:

```javascript
module.exports = {
  computeDodStatusRollup,
  syncProductRollup
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-product-rollup.js
```

Expected output: `[pr-s2-product-rollup] Results: 4 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/product-rollup.js tests/check-pr-s2-product-rollup.js
git commit -m "feat(pr-s2): add sync orchestration writing the computed rollup to a new cache table"
```

---

## Task 4: server.js wiring — cache table migration + adapter wiring (AC5 completion)

**Files:**
- Modify: `src/web-ui/server.js`
- Modify (append to): `tests/check-pr-s2-pipeline-state-fetch-adapter.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/check-pr-s2-pipeline-state-fetch-adapter.js`, inserting this block immediately before `for (var i = 0; i < queue.length; i++) {`:

```javascript
  // T5: server.js creates the product_rollups table and wires the real adapter (AC1, AC5)
  queue.push(function() {
    console.log('\n[pr-s2] T5 -- server.js creates the product_rollups table and wires the real Contents API adapter (AC1, AC5)');
    return test('server.js: requires pipeline-state-fetch-adapter, creates product_rollups table, wires real implementation', function() {
      var fs = require('fs');
      var SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      assert.ok(/require\(['"]\.\/adapters\/pipeline-state-fetch-adapter['"]\)/.test(src),
        "server.js must require('./adapters/pipeline-state-fetch-adapter')");
      assert.ok(/CREATE TABLE IF NOT EXISTS product_rollups/i.test(src),
        'server.js must create the product_rollups table');
      assert.ok(/setPipelineStateFetchAdapter\(\s*realFetchPipelineState/.test(src),
        "server.js must wire setPipelineStateFetchAdapter(realFetchPipelineState), matching the existing NODE_ENV !== 'test' wiring convention");
    });
  });

  // T6: the wired adapter produces correct, differentiated output for two different repos (AC5 -- D37 rule 4)
  queue.push(function() {
    console.log('\n[pr-s2] T6 -- wired adapter produces correct, differentiated output for two different repos, not just proof a setter was called (AC5)');
    return test('realFetchPipelineState: two different mocked repos return their own distinct, correct content', async function() {
      var originalFetch = global.fetch;
      var repoAContent = Buffer.from('{"features":[{"slug":"repo-a-feature"}]}').toString('base64');
      var repoBContent = Buffer.from('{"features":[{"slug":"repo-b-feature"}]}').toString('base64');
      global.fetch = async function(url) {
        var isRepoA = url.indexOf('/repos/org-a/repo-a/') !== -1;
        return {
          ok: true, status: 200,
          json: async function() { return { content: isRepoA ? repoAContent : repoBContent, encoding: 'base64' }; }
        };
      };
      try {
        var mod = freshRequire();
        var resultA = await mod.realFetchPipelineState('org-a', 'repo-a', 'token');
        var resultB = await mod.realFetchPipelineState('org-b', 'repo-b', 'token');
        var decodedA = Buffer.from(resultA.content, 'base64').toString('utf8');
        var decodedB = Buffer.from(resultB.content, 'base64').toString('utf8');
        assert.ok(decodedA.indexOf('repo-a-feature') !== -1, 'Expected repo A result to contain repo A\'s own fixture content');
        assert.ok(decodedB.indexOf('repo-b-feature') !== -1, 'Expected repo B result to contain repo B\'s own fixture content');
        assert.notStrictEqual(decodedA, decodedB, 'Expected the two repos to produce different, individually-correct results -- not the same output regardless of input');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-pipeline-state-fetch-adapter.js
```

Expected: T5 fails (`server.js must require('./adapters/pipeline-state-fetch-adapter')`); T6 passes already (it tests the adapter module directly, not server.js — this is expected, since T6 was really validated already by Task 1's own implementation; it's re-asserted here as the explicit AC5 D37-rule-4 evidence alongside T5's wiring check).

- [ ] **Step 3: Write the implementation**

In `src/web-ui/server.js`, find the existing require line for `repo-adapter` (around line 40) and add a new require line immediately after it:

```javascript
const { setPipelineStateFetchAdapter, realFetchPipelineState }        = require('./adapters/pipeline-state-fetch-adapter'); // pr-s2
```

Find the existing `prc-s1.2 / D37` wiring block (around line 103-111):
```javascript
if (process.env.NODE_ENV !== 'test') {
  setRepoAdapter(realCheckRepoAccess);
  console.log('[products] repo adapter wired');
}
```
Add a new block immediately after it, following the exact same convention:

```javascript

// pr-s2 / D37 mandatory separate wiring task -- wire the real GitHub
// Contents API adapter for fetching a connected repo's pipeline-state.json.
// Never wired in NODE_ENV=test (tests call setPipelineStateFetchAdapter()
// themselves with a mock); the throwing stub stays active there, matching
// the pattern already used by the prc-s1.2/prc-s2.1 adapters above.
if (process.env.NODE_ENV !== 'test') {
  setPipelineStateFetchAdapter(realFetchPipelineState);
  console.log('[pr-s2] pipeline-state fetch adapter wired');
}
```

Find the existing `standard_product_optouts` table creation block (search for `CREATE TABLE IF NOT EXISTS standard_product_optouts`) and add a new table creation immediately after that block, following the same `_creditsPool.query(...)` convention already used for `standards`/`standard_product_optouts`:

```javascript

// pr-s2: cache table for the computed product rollup (DoD-status counts
// today; Epic 2 stories add more columns for health/test-coverage/AC-
// coverage/taxonomy). One row per product_id -- ON CONFLICT (product_id)
// DO UPDATE keeps a sync idempotent and always reflects the latest fetch.
_creditsPool.query(`CREATE TABLE IF NOT EXISTS product_rollups (
  product_id UUID PRIMARY KEY REFERENCES products(product_id) ON DELETE CASCADE,
  dod_status_counts JSONB NOT NULL DEFAULT '{}',
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`).then(function() {
  console.log('[pr-s2] product_rollups table ready');
}).catch(function(err) {
  console.error('[pr-s2] product_rollups migration failed:', err.message);
});
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-pipeline-state-fetch-adapter.js
```

Expected output: `[pr-s2-pipeline-state-fetch-adapter] Results: 6 passed, 0 failed`

- [ ] **Step 5: Sanity-check server.js still parses**

```bash
node -c src/web-ui/server.js
```

Expected: no output (success) — if you see "SyntaxError", fix before continuing.

- [ ] **Step 6: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/server.js tests/check-pr-s2-pipeline-state-fetch-adapter.js
git commit -m "feat(pr-s2): wire the real Contents API adapter and create the product_rollups cache table"
```

---

## Task 5: products.js route integration (AC2)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Create: `tests/check-pr-s2-products-route.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';

// tests/check-pr-s2-products-route.js
// pr-s2 AC2 -- GET /products/:id renders the cached DoD status once a sync
// has completed, instead of only the pre-existing featureCount.

var assert = require('assert');
var path = require('path');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    fn();
    passed++; console.log('  [PASS]', name);
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err.message);
  }
}

console.log('\n[pr-s2] AC2 -- products.js route can render cached DoD status');

var PRODUCTS_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var src = require('fs').readFileSync(PRODUCTS_PATH, 'utf8');

test('products.js references product_rollups (reads the cache table for rendering)', function() {
  assert.ok(/product_rollups/i.test(src), 'Expected products.js to reference the product_rollups cache table');
});

test('products.js references dod_status_counts (renders the cached DoD counts, not just featureCount)', function() {
  assert.ok(/dod_status_counts/i.test(src), 'Expected products.js to read/render dod_status_counts from the cache row');
});

console.log('\n[pr-s2-products-route] Results: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s2-products-route.js
```

Expected: both assertions fail (products.js doesn't reference `product_rollups` or `dod_status_counts` yet).

- [ ] **Step 3: Write the implementation**

In `src/web-ui/routes/products.js`, find the existing product-detail query (search for `SELECT product_id, name FROM products WHERE tenant_id` — the query used when rendering a single product's page) and add a second query immediately after it to fetch the cached rollup row:

```javascript
  var rollupRow = (await _pool.query(
    'SELECT dod_status_counts, synced_at FROM product_rollups WHERE product_id = $1',
    [productId]
  )).rows[0] || null;
```

Then in `_renderProductView` (or the calling code that builds its arguments), pass `rollupRow` through and render it: where the page currently shows `featureCount`, add a rendered block showing the DoD-status counts if `rollupRow` is present:

```javascript
  var dodStatusHtml = rollupRow
    ? '<div style="margin-top:12px;font-size:13px;color:var(--muted)">' +
        Object.entries(JSON.parse(rollupRow.dod_status_counts || '{}')).map(function(entry) {
          return _escapeHtml(entry[0]) + ': ' + _escapeHtml(String(entry[1]));
        }).join(' &middot; ') +
      '</div>'
    : '';
```

Include `dodStatusHtml` in the product view's rendered body (near where `featureCount` or the features list is rendered).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s2-products-route.js
```

Expected output: `[pr-s2-products-route] Results: 2 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-pr-s2-products-route.js
git commit -m "feat(pr-s2): render cached DoD status on the product page"
```

---

## Final check before handoff

- [ ] All 5 story ACs covered: AC1 (Task 1 T3, Task 3 T3), AC2 (Task 5), AC3 (Task 1 T4, Task 3 T4), AC4 (Task 2 T1-T2), AC5 (Task 1 T1-T2, Task 4 T5-T6)
- [ ] Total new tests: 4 (adapter) + 4 (rollup: 2 aggregation + 2 sync) + 2 (server.js wiring, added to adapter test file) + 2 (products route) = 12
- [ ] `npm test` full suite run after all 5 tasks — compare failed-file count against the pre-task-1 baseline captured at `/branch-setup` — must be unchanged or lower, never higher
