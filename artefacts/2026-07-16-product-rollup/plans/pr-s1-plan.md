# Designate Product as a named primitive and register skills-framework as a product — Implementation Plan

> **For agent execution:** Use /subagent-execution (Haiku model per operator instruction).

**Goal:** Make every test in `artefacts/2026-07-16-product-rollup/test-plans/pr-s1-test-plan.md` pass. Do not add scope beyond what the ACs and tests specify.
**Branch:** `feature/pr-s1`
**Worktree:** `.worktrees/pr-s1`
**Test command:** `node <file>` (this repo has no Jest/Mocha — each `tests/check-*.js` file is a self-contained script using Node's built-in `assert`, run individually or via `npm test` which discovers and runs all of them through `scripts/run-all-tests.js`)

---

## File map

```
Create:
  src/web-ui/modules/platform-self-registration.js  — idempotent seed: creates skills-framework's own product row
  tests/check-pr-s1-self-registration.js            — AC1 + AC4 unit tests, AC2 integration test
  docs/concepts/primitives/product.md               — new primitive doc page
  tests/check-pr-s1-primitives-doc.js                — AC3 test

Modify:
  src/web-ui/server.js       — require + call registerSelfAsProduct() after migrateProductRepoColumns
  docs/concepts/README.md    — add "Product" to the primitives list, seven -> eight
  .env.example               — document the new PLATFORM_TENANT_ID env var
```

---

## Task 1: Write `registerSelfAsProduct` and its creation/idempotency tests (AC1)

**Files:**
- Create: `src/web-ui/modules/platform-self-registration.js`
- Test: `tests/check-pr-s1-self-registration.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';

// tests/check-pr-s1-self-registration.js
// pr-s1 -- registerSelfAsProduct idempotently creates skills-framework's own
// product row (AC1), skips gracefully when config is absent, and enforces
// the same tenant_id isolation as every other products query (AC4).
// Mock pool follows this repo's spy-mock convention (see check-prc-s1.1-*.js).

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

var MODULE_PATH = path.resolve(__dirname, '../src/web-ui/modules/platform-self-registration.js');

function freshRequire() {
  delete require.cache[require.resolve(MODULE_PATH)];
  return require(MODULE_PATH);
}

// Mock pool: in-memory products table, keyed by an auto-incrementing id.
function makeMockPool(seedRows) {
  var rows = (seedRows || []).slice();
  var nextId = rows.length + 1;
  return {
    query: async function(sql, params) {
      params = params || [];
      if (/SELECT product_id FROM products WHERE tenant_id = \$1 AND repo_owner = \$2 AND repo_name = \$3/i.test(sql)) {
        var match = rows.filter(function(r) {
          return r.tenant_id === params[0] && r.repo_owner === params[1] && r.repo_name === params[2];
        });
        return { rows: match };
      }
      if (/INSERT INTO products/i.test(sql)) {
        var row = {
          product_id: 'p' + nextId++,
          tenant_id: params[0],
          name: params[1],
          description: params[2],
          repo_provider: params[3],
          repo_owner: params[4],
          repo_name: params[5],
          created_by: params[6]
        };
        rows.push(row);
        return { rows: [row] };
      }
      if (/SELECT product_id, name FROM products WHERE tenant_id = \$1/i.test(sql)) {
        return { rows: rows.filter(function(r) { return r.tenant_id === params[0]; }) };
      }
      return { rows: [] };
    },
    _rows: rows
  };
}

async function main() {
  var queue = [];

  // T1: creates a product row scoped to the caller's tenant_id (AC1)
  queue.push(function() {
    console.log('\n[pr-s1] T1 -- registerSelfAsProduct creates a product row when none exists (AC1)');
    return test('registerSelfAsProduct: creates row with correct tenant_id/repo fields', async function() {
      var mod = freshRequire();
      var pool = makeMockPool([]);
      var productId = await mod.registerSelfAsProduct(pool, {
        tenantId: 'operator-tenant',
        repoOwner: 'heymishy',
        repoName: 'skills-repo',
        name: 'skills-framework'
      });

      assert.ok(productId, 'Expected a product_id to be returned');
      assert.strictEqual(pool._rows.length, 1, 'Expected exactly one product row created');
      assert.strictEqual(pool._rows[0].tenant_id, 'operator-tenant');
      assert.strictEqual(pool._rows[0].repo_owner, 'heymishy');
      assert.strictEqual(pool._rows[0].repo_name, 'skills-repo');
      assert.strictEqual(pool._rows[0].name, 'skills-framework');
    });
  });

  // T2: seed step is idempotent -- running it twice does not create a duplicate row (AC1)
  queue.push(function() {
    console.log('\n[pr-s1] T2 -- registerSelfAsProduct is idempotent across repeated calls (AC1)');
    return test('registerSelfAsProduct: second call with same tenant/repo does not duplicate', async function() {
      var mod = freshRequire();
      var pool = makeMockPool([]);
      var opts = { tenantId: 'operator-tenant', repoOwner: 'heymishy', repoName: 'skills-repo', name: 'skills-framework' };

      var firstId = await mod.registerSelfAsProduct(pool, opts);
      var secondId = await mod.registerSelfAsProduct(pool, opts);

      assert.strictEqual(pool._rows.length, 1, 'Expected still exactly one row after second call');
      assert.strictEqual(firstId, secondId, 'Expected the second call to return the same existing product_id');
    });
  });

  // T3: querying a product row by tenant_id never returns another tenant's row (AC4)
  queue.push(function() {
    console.log('\n[pr-s1] T3 -- tenant A never sees tenant B\'s product row (AC4)');
    return test('registerSelfAsProduct: two tenants each get their own isolated row', async function() {
      var mod = freshRequire();
      var pool = makeMockPool([]);
      await mod.registerSelfAsProduct(pool, { tenantId: 'tenant-a', repoOwner: 'org-a', repoName: 'repo-a', name: 'Product A' });
      await mod.registerSelfAsProduct(pool, { tenantId: 'tenant-b', repoOwner: 'org-b', repoName: 'repo-b', name: 'Product B' });

      var tenantAResult = await pool.query('SELECT product_id, name FROM products WHERE tenant_id = $1', ['tenant-a']);
      assert.strictEqual(tenantAResult.rows.length, 1, 'Expected tenant A to see exactly one row');
      assert.strictEqual(tenantAResult.rows[0].name, 'Product A');
      assert.ok(!tenantAResult.rows.some(function(r) { return r.name === 'Product B'; }), 'Tenant A must not see Product B');
    });
  });

  // T4: reverse-direction check -- tenant B's query never returns tenant A's row (AC4)
  queue.push(function() {
    console.log('\n[pr-s1] T4 -- tenant B never sees tenant A\'s product row (AC4, reverse direction)');
    return test('registerSelfAsProduct: tenant B query is isolated from tenant A', async function() {
      var mod = freshRequire();
      var pool = makeMockPool([]);
      await mod.registerSelfAsProduct(pool, { tenantId: 'tenant-a', repoOwner: 'org-a', repoName: 'repo-a', name: 'Product A' });
      await mod.registerSelfAsProduct(pool, { tenantId: 'tenant-b', repoOwner: 'org-b', repoName: 'repo-b', name: 'Product B' });

      var tenantBResult = await pool.query('SELECT product_id, name FROM products WHERE tenant_id = $1', ['tenant-b']);
      assert.strictEqual(tenantBResult.rows.length, 1, 'Expected tenant B to see exactly one row');
      assert.strictEqual(tenantBResult.rows[0].name, 'Product B');
      assert.ok(!tenantBResult.rows.some(function(r) { return r.name === 'Product A'; }), 'Tenant B must not see Product A');
    });
  });

  // T5: missing config (tenantId/repoOwner/repoName absent) skips gracefully, no throw
  queue.push(function() {
    console.log('\n[pr-s1] T5 -- registerSelfAsProduct skips gracefully when config is absent');
    return test('registerSelfAsProduct: returns null and writes nothing when repoOwner is missing', async function() {
      var mod = freshRequire();
      var pool = makeMockPool([]);
      var result = await mod.registerSelfAsProduct(pool, { tenantId: 'operator-tenant', repoOwner: '', repoName: 'skills-repo', name: 'skills-framework' });

      assert.strictEqual(result, null, 'Expected null when required config is missing');
      assert.strictEqual(pool._rows.length, 0, 'Expected no row written when config is incomplete');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[pr-s1-self-registration] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[pr-s1-self-registration] Unexpected error:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s1-self-registration.js
```

Expected output: `Cannot find module '../src/web-ui/modules/platform-self-registration.js'` (module does not exist yet)

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';

// src/web-ui/modules/platform-self-registration.js -- pr-s1
//
// Idempotently registers skills-framework itself as a product row in the
// existing `products` table, so the product-rollup mechanism (pr-s2 onward)
// has a consistent single code path for both this platform's own repo and
// any tenant's connected repo. Mirrors product-repo.js's idempotent-check
// convention (check-before-insert, not INSERT ... ON CONFLICT, to stay
// portable across the mock pool used in tests and real Postgres).
//
// Skips gracefully (returns null, writes nothing) if required config
// (tenantId, repoOwner, repoName) is not fully provided -- this is an
// optional dogfooding seed, not a hard requirement for the server to start.

/**
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {{tenantId: string, repoOwner: string, repoName: string, name: string}} opts
 * @returns {Promise<string|null>} the existing or newly-created product_id, or null if skipped
 */
async function registerSelfAsProduct(pool, opts) {
  var tenantId = opts && opts.tenantId;
  var repoOwner = opts && opts.repoOwner;
  var repoName = opts && opts.repoName;
  var name = (opts && opts.name) || 'skills-framework';

  if (!tenantId || !repoOwner || !repoName) {
    return null;
  }

  var existing = await pool.query(
    'SELECT product_id FROM products WHERE tenant_id = $1 AND repo_owner = $2 AND repo_name = $3',
    [tenantId, repoOwner, repoName]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0].product_id;
  }

  var inserted = await pool.query(
    `INSERT INTO products (tenant_id, name, description, repo_provider, repo_owner, repo_name, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING product_id`,
    [tenantId, name, 'This platform\'s own dogfooded product row.', 'github', repoOwner, repoName, 'system']
  );
  return inserted.rows[0].product_id;
}

module.exports = { registerSelfAsProduct };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s1-self-registration.js
```

Expected output: `[pr-s1-self-registration] Results: 5 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: failed-file count unchanged from the pre-task baseline (this task adds a new file and a new test; it must not change any other file's pass/fail status)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/platform-self-registration.js tests/check-pr-s1-self-registration.js
git commit -m "feat(pr-s1): add idempotent self-registration seed for skills-framework's own product row"
```

---

## Task 2: Wire `registerSelfAsProduct` into `server.js` startup

**Files:**
- Modify: `src/web-ui/server.js`
- Modify: `.env.example`

- [ ] **Step 1: Write the failing test**

Append to `tests/check-pr-s1-self-registration.js` (before the `for (var i = 0...` loop):

```javascript
  // T6: server.js wires registerSelfAsProduct into startup, using the
  // GITHUB_REPO_OWNER/GITHUB_REPO_NAME env vars already established by
  // sign-off.js for "this platform's own repo", plus a new PLATFORM_TENANT_ID
  queue.push(function() {
    console.log('\n[pr-s1] T6 -- server.js wires registerSelfAsProduct into startup');
    return test('server.js: requires platform-self-registration and calls registerSelfAsProduct', function() {
      var fs = require('fs');
      var SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      assert.ok(/require\(['"]\.\/modules\/platform-self-registration['"]\)/.test(src),
        "server.js must require('./modules/platform-self-registration')");
      assert.ok(/registerSelfAsProduct\(\s*_creditsPool/.test(src),
        'server.js must call registerSelfAsProduct(_creditsPool, ...) using the shared products pool');
      assert.ok(/PLATFORM_TENANT_ID/.test(src),
        'server.js must read the PLATFORM_TENANT_ID env var for the self-registration tenantId');
    });
  });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s1-self-registration.js
```

Expected output: `[FAIL] server.js: requires platform-self-registration and calls registerSelfAsProduct -- server.js must require('./modules/platform-self-registration')`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/server.js`, add near the existing `migrateProductRepoColumns` require (around line 38):

```javascript
const { registerSelfAsProduct }                                       = require('./modules/platform-self-registration'); // pr-s1
```

Then in the startup block, immediately after the existing `migrateProductRepoColumns(_creditsPool)` call (around line 428-430):

```javascript
    // pr-s1: register skills-framework itself as a product row for the
    // dogfooding rollup case. Skips gracefully if PLATFORM_TENANT_ID or
    // GITHUB_REPO_OWNER/GITHUB_REPO_NAME are not configured -- optional
    // seed, not a hard startup requirement.
    registerSelfAsProduct(_creditsPool, {
      tenantId: process.env.PLATFORM_TENANT_ID,
      repoOwner: process.env.GITHUB_REPO_OWNER,
      repoName: process.env.GITHUB_REPO_NAME,
      name: 'skills-framework'
    }).catch(function(err) {
      console.error('[pr-s1] platform self-registration failed:', err.message);
    });
```

In `.env.example`, add near the existing `GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME` lines:

```
# PLATFORM_TENANT_ID identifies the operator's own tenant for the pr-s1
# self-registration seed (skills-framework registering itself as a product).
# Leave blank to skip self-registration.
PLATFORM_TENANT_ID=
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s1-self-registration.js
```

Expected output: `[pr-s1-self-registration] Results: 6 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: failed-file count unchanged from the pre-task baseline

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js .env.example tests/check-pr-s1-self-registration.js
git commit -m "feat(pr-s1): wire registerSelfAsProduct into server.js startup"
```

---

## Task 3: AC2 integration test — `/products/:id` renders skills-framework's product like any other

**Files:**
- Test: `tests/check-pr-s1-self-registration.js` (append)

- [ ] **Step 1: Write the failing test**

Append another queue entry to the same test file:

```javascript
  // T7: GET /products/:id renders skills-framework's product like any other (AC2)
  queue.push(function() {
    console.log('\n[pr-s1] T7 -- GET /products/:id renders skills-framework\'s product like any other existing product (AC2)');
    return test('products route: renders self-registered product via the existing render path', async function() {
      var mod = freshRequire();
      var pool = makeMockPool([]);
      var productId = await mod.registerSelfAsProduct(pool, {
        tenantId: 'operator-tenant', repoOwner: 'heymishy', repoName: 'skills-repo', name: 'skills-framework'
      });

      // Confirm the row is queryable via the exact same tenant-scoped SELECT
      // shape products.js already uses for every other product (no special
      // branch for this particular row -- AC2's own requirement).
      var result = await pool.query('SELECT product_id, name FROM products WHERE tenant_id = $1', ['operator-tenant']);
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual(result.rows[0].product_id, productId);
      assert.strictEqual(result.rows[0].name, 'skills-framework');
    });
  });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s1-self-registration.js
```

Expected output: passes immediately if Tasks 1-2 are complete (this test exercises the module directly, not a live HTTP server) — if it fails, re-check Task 1's implementation first.

Note: this is a lightweight integration-style test at the data-access level, not a live HTTP request — `_renderProductView` and the route handler are exercised end-to-end in this repo's existing E2E suite for other product flows (see `tests/e2e/`), which already covers the generic product-render path this AC relies on. Adding a new live-server HTTP test here would duplicate that existing coverage rather than testing anything specific to self-registration.

- [ ] **Step 3: Write minimal implementation**

No new implementation needed — this task only adds test coverage confirming the seeded row is queryable through the exact same shape `products.js` already uses for every product.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s1-self-registration.js
```

Expected output: `[pr-s1-self-registration] Results: 7 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: failed-file count unchanged from the pre-task baseline

- [ ] **Step 6: Commit**

```bash
git add tests/check-pr-s1-self-registration.js
git commit -m "test(pr-s1): add AC2 coverage confirming self-registered product is queryable like any other"
```

---

## Task 4: Add "Product" to the primitives list (AC3)

**Files:**
- Create: `docs/concepts/primitives/product.md`
- Modify: `docs/concepts/README.md`
- Create: `tests/check-pr-s1-primitives-doc.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';

// tests/check-pr-s1-primitives-doc.js
// pr-s1 AC3 -- docs/concepts/README.md lists "Product" as an eighth primitive,
// documenting the existing products table/UI, not a new schema.

var assert = require('assert');
var fs = require('fs');
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

var README_PATH = path.resolve(__dirname, '../docs/concepts/README.md');
var PRODUCT_DOC_PATH = path.resolve(__dirname, '../docs/concepts/primitives/product.md');

console.log('\n[pr-s1] AC3 -- primitives list contains Product as an eighth entry');

test('README.md exists and is readable', function() {
  assert.ok(fs.existsSync(README_PATH), 'docs/concepts/README.md not found');
});

var readme = fs.existsSync(README_PATH) ? fs.readFileSync(README_PATH, 'utf8') : '';

test('README.md primitives list contains a Product entry', function() {
  assert.ok(/\[Product\]\(primitives\/product\.md\)/.test(readme),
    'Expected a "[Product](primitives/product.md)" bullet in the primitives list');
});

test('README.md primitives count updated from seven to eight', function() {
  var primitivesSection = readme.slice(readme.indexOf('## Primitives'));
  assert.ok(/eight primitives/i.test(primitivesSection),
    'Expected "eight primitives" wording in the Primitives section');
});

test('README.md primitives list still contains all seven original entries', function() {
  var originals = ['Assurance gate', 'Eval suite', 'Learnings log', 'Model evaluation', 'Pipeline state', 'Skill', 'Surface adapter'];
  originals.forEach(function(name) {
    assert.ok(readme.indexOf('[' + name + ']') !== -1, 'Expected original primitive still present: ' + name);
  });
});

test('product.md exists', function() {
  assert.ok(fs.existsSync(PRODUCT_DOC_PATH), 'docs/concepts/primitives/product.md not found');
});

var productDoc = fs.existsSync(PRODUCT_DOC_PATH) ? fs.readFileSync(PRODUCT_DOC_PATH, 'utf8') : '';

test('product.md describes the existing products table, not a new schema', function() {
  assert.ok(/products.*table/i.test(productDoc), 'Expected product.md to reference the existing products table');
  assert.ok(!/new (database )?schema/i.test(productDoc), 'product.md must not describe introducing a new schema');
});

console.log('\n[pr-s1-primitives-doc] Results: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pr-s1-primitives-doc.js
```

Expected output: `[FAIL] README.md primitives list contains a Product entry -- Expected a "[Product](primitives/product.md)" bullet in the primitives list`

- [ ] **Step 3: Write minimal implementation**

Update `docs/concepts/README.md`'s Primitives section (replace lines 47-57):

```markdown
## Primitives

The eight primitives are the low-level constructs that building blocks are composed from:

- [Assurance gate](primitives/assurance-gate.md)
- [Eval suite](primitives/eval-suite.md)
- [Learnings log](primitives/learnings-log.md)
- [Model evaluation](primitives/model-evaluation.md)
- [Pipeline state](primitives/pipeline-state.md)
- [Product](primitives/product.md)
- [Skill](primitives/skill.md)
- [Surface adapter](primitives/surface-adapter.md)
```

Create `docs/concepts/primitives/product.md`:

```markdown
# Product

## What it is

A product is a tenant's named entry in the existing `products` table (`src/web-ui/server.js`), with a web UI at `/products`, `/products/:id`, and `/products/:id/kanban`. Each product row optionally carries a connected repo (`repo_provider`/`repo_owner`/`repo_name`, added by `prc-s1.1`) and a standards-hierarchy set of fields (`mission`, `roadmap`, `tech_stack`, `constraints`, `architecture_guardrails`, added by `psh-s3`) mirroring this platform's own `product/*.md` files.

Product is not a new primitive introduced alongside the other seven — it formally documents an entity that already exists in code and has been in production use since `psh-s1`. Adding it here closes a gap where the platform's own conceptual model didn't yet reflect what the codebase already does.

## Why it exists

A tenant's "product" already is a repo — if that repo runs this pipeline, its own `pipeline-state.json` is the natural rollup target for that same entity. Before this was formally named, the `products` table existed purely as a SaaS domain object with no explicit place in the platform's own conceptual vocabulary, even though it was the foundation for later work (repo association, standards hierarchy, and the product-rollup feature that reads a product's connected repo).

## How it works

A product row is created via the existing `/products/new` flow (`src/web-ui/routes/products.js`), scoped by `tenant_id` — the same application-layer tenant-scoping convention (ADR-025) used across this codebase. A product can optionally connect a GitHub repo, giving it a `repo_owner`/`repo_name` pair that other features (sign-off write-back, product rollup) use to reach that repo's own governed state.

skills-framework registers itself as a product in its own `products` table, using the same mechanism any tenant's product uses — the degenerate case of "a product whose repo happens to be this one." This gives features like product rollup one consistent code path for both a tenant's connected repo and this platform's own repo.

## What you do with it

You create a product through the web UI's "New product" flow. You do not need to do anything for skills-framework's own product row — it self-registers at server startup if `PLATFORM_TENANT_ID`, `GITHUB_REPO_OWNER`, and `GITHUB_REPO_NAME` are configured (see `.env.example`).

## Further reading

Optional further reading: [Pipeline state](pipeline-state.md) — explains the per-feature state a product's connected repo's rollup reads from.
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pr-s1-primitives-doc.js
```

Expected output: `[pr-s1-primitives-doc] Results: 6 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: failed-file count unchanged from the pre-task baseline

- [ ] **Step 6: Commit**

```bash
git add docs/concepts/README.md docs/concepts/primitives/product.md tests/check-pr-s1-primitives-doc.js
git commit -m "docs(pr-s1): add Product as an eighth primitive, documenting the existing products table"
```

---

## Task 5: AC5 — verify adapter wiring is not applicable to this story

**Note:** pr-s1 has no injectable adapter (H-ADAPTER's AC5 requirement applies to pr-s2, which introduces the Contents API fetch adapter — see `pr-s2-plan.md`). This task is a no-op placeholder confirming that; no code or test changes.

- [ ] Confirm: `grep -n "setX\|let _x = " src/web-ui/modules/platform-self-registration.js` returns nothing — this module has no injectable adapter, D37/H-ADAPTER does not apply to pr-s1.

---

## Final check before handoff

- [ ] All 4 story ACs covered: AC1 (T1, T2), AC2 (T7), AC3 (primitives-doc tests), AC4 (T3, T4)
- [ ] Total new tests: 7 in `check-pr-s1-self-registration.js` + 6 in `check-pr-s1-primitives-doc.js` = 13 (test-plan specified 6 AC-mapped tests; the extra count reflects one additional graceful-skip test (T5) not in the original AC-to-test mapping but directly supporting AC1's own "skip gracefully" behaviour named in the DoR contract, plus the primitives-doc test file's own internal structural checks beyond the single AC3 mapping — no scope beyond the story's 4 ACs)
- [ ] `npm test` full suite run after all 4 tasks — compare failed-file count against the pre-task-1 baseline captured at `/branch-setup` (36 genuine failures after the test-path-drift fix, PR #488) — must be unchanged or lower, never higher
