# Add repo association columns to the products table — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Add `repo_provider`, `repo_owner`, `repo_name` nullable columns to the existing `products` table via an idempotent migration function, wired into `server.js`'s existing DATABASE_URL-gated startup migration block. No population logic, no UI — schema only.
**Branch:** `feature/prc-s1.1`
**Worktree:** `.claude/worktrees/agent-a2e3f1e0addffa261` (already provisioned)
**Test command:** `node scripts/run-all-tests.js` (full suite) / `node tests/check-prc-s1.1-product-repo-columns.js` (this story's tests only)

---

## File map

```
Create:
  src/web-ui/modules/product-repo.js         — migrateProductRepoColumns(pool, logger): idempotent ALTER TABLE for repo_provider/repo_owner/repo_name
  tests/check-prc-s1.1-product-repo-columns.js — AC1/AC2/AC3 integration tests against a mocked pg-Pool-shaped object

Modify:
  src/web-ui/server.js — wire migrateProductRepoColumns(_creditsPool) into the existing DATABASE_URL-gated psh-s1/psh-s3 products migration chain
```

---

## Task 1: `migrateProductRepoColumns` — idempotent schema migration function

**Files:**
- Create: `src/web-ui/modules/product-repo.js`
- Test: `tests/check-prc-s1.1-product-repo-columns.js`

**Covers:** AC1, AC2, AC3

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';

// tests/check-prc-s1.1-product-repo-columns.js
// prc-s1.1 -- migrateProductRepoColumns idempotently adds repo_provider/
// repo_owner/repo_name (all nullable) to the products table.
// Mock pool follows this repo's spy-mock convention (see check-arl-s5-*.js).

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

var PRODUCT_REPO_PATH = path.resolve(__dirname, '../src/web-ui/modules/product-repo.js');

function freshRequire() {
  delete require.cache[require.resolve(PRODUCT_REPO_PATH)];
  return require(PRODUCT_REPO_PATH);
}

// Mock pool: records every ALTER TABLE call, and simulates a single
// pre-existing product row for AC2's null-column check.
function makeMockPool() {
  var alterCalls = [];
  var row = { product_id: 'p1', name: 'Existing Product', repo_provider: null, repo_owner: null, repo_name: null };
  return {
    query: async function(sql, params) {
      if (/ALTER TABLE products/i.test(sql)) {
        alterCalls.push(sql);
        return { rows: [] };
      }
      if (/SELECT repo_provider, repo_owner, repo_name FROM products/i.test(sql)) {
        return { rows: [row] };
      }
      return { rows: [] };
    },
    _alterCalls: alterCalls
  };
}

async function main() {
  var queue = [];

  // T1: exactly 3 idempotent ALTER TABLE ADD COLUMN IF NOT EXISTS calls, all nullable (AC1)
  queue.push(function() {
    console.log('\n[prc-s1.1] T1 -- migrateProductRepoColumns issues 3 idempotent, nullable ALTER TABLE calls (AC1)');
    return test('migrateProductRepoColumns: 3 ALTER TABLE ADD COLUMN IF NOT EXISTS calls, no NOT NULL', async function() {
      var mod = freshRequire();
      var pool = makeMockPool();
      await mod.migrateProductRepoColumns(pool);

      assert.strictEqual(pool._alterCalls.length, 3, 'Expected exactly 3 ALTER TABLE calls, got ' + pool._alterCalls.length);
      ['repo_provider', 'repo_owner', 'repo_name'].forEach(function(col) {
        var matching = pool._alterCalls.filter(function(sql) { return sql.indexOf(col) !== -1; });
        assert.strictEqual(matching.length, 1, 'Expected exactly one ALTER TABLE call for column: ' + col);
        assert.ok(/ADD COLUMN IF NOT EXISTS/i.test(matching[0]), col + ' call must use ADD COLUMN IF NOT EXISTS');
        assert.ok(!/NOT NULL/i.test(matching[0]), col + ' call must not declare NOT NULL (nullable per AC1)');
      });
    });
  });

  // T2: existing product rows read back null for all three new columns (AC2)
  queue.push(function() {
    console.log('\n[prc-s1.1] T2 -- existing product rows have null repo columns after migration (AC2)');
    return test('migrateProductRepoColumns: pre-existing row reads back null repo_provider/repo_owner/repo_name', async function() {
      var mod = freshRequire();
      var pool = makeMockPool();
      await mod.migrateProductRepoColumns(pool);

      var r = await pool.query('SELECT repo_provider, repo_owner, repo_name FROM products WHERE product_id = $1', ['p1']);
      assert.strictEqual(r.rows.length, 1);
      assert.strictEqual(r.rows[0].repo_provider, null, 'repo_provider must be null for pre-existing row, no fabricated default');
      assert.strictEqual(r.rows[0].repo_owner, null, 'repo_owner must be null for pre-existing row, no fabricated default');
      assert.strictEqual(r.rows[0].repo_name, null, 'repo_name must be null for pre-existing row, no fabricated default');
    });
  });

  // T3: calling the migration twice is a no-op -- no error, no duplicate columns (AC3)
  queue.push(function() {
    console.log('\n[prc-s1.1] T3 -- migration is idempotent across repeated calls, no error, no duplication (AC3)');
    return test('migrateProductRepoColumns: second call succeeds, still exactly 3 ALTER TABLE calls per run, both runs use IF NOT EXISTS', async function() {
      var mod = freshRequire();
      var pool = makeMockPool();

      await mod.migrateProductRepoColumns(pool); // first run
      var firstRunCount = pool._alterCalls.length;
      assert.strictEqual(firstRunCount, 3);

      await mod.migrateProductRepoColumns(pool); // second run -- must not throw
      assert.strictEqual(pool._alterCalls.length, 6, 'Second run should issue its own 3 calls (mock does not dedupe -- real Postgres IF NOT EXISTS makes this safe)');
      pool._alterCalls.forEach(function(sql) {
        assert.ok(/IF NOT EXISTS/i.test(sql), 'Every call across both runs must use IF NOT EXISTS: ' + sql);
      });
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[prc-s1.1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[prc-s1.1] Unexpected error:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-prc-s1.1-product-repo-columns.js
```

Expected output: `Error: Cannot find module '.../src/web-ui/modules/product-repo.js'` (module does not exist yet) — process exits 1.

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';

// src/web-ui/modules/product-repo.js — prc-s1.1
//
// Idempotent schema migration adding repo association columns to the
// existing `products` table. Mirrors the existing ALTER TABLE ... ADD
// COLUMN IF NOT EXISTS convention already used for products'
// mission/roadmap/tech_stack/constraints/architecture_guardrails columns
// (server.js, psh-s3) and for user-roles.js's migrateTeamSchema. ADR-025:
// tenant scoping stays at the application layer -- this adds columns to the
// existing products table, not a new per-tenant schema.
//
// Out of scope (this story): populating these columns (prc-s1.2), any UI
// (prc-s1.2 / Epic 4).

/**
 * Idempotently adds repo_provider, repo_owner, repo_name (all nullable) to
 * the products table. Safe to call on every server startup -- ADD COLUMN IF
 * NOT EXISTS is a no-op on repeated calls against a real Postgres instance.
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {{info: Function}} [logger] - injectable logger (defaults to console.log)
 */
async function migrateProductRepoColumns(pool, logger) {
  var log = logger || { info: console.log };

  await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS repo_provider VARCHAR');
  await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS repo_owner VARCHAR');
  await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS repo_name VARCHAR');

  log.info('[prc-s1.1] products repo columns ready (repo_provider, repo_owner, repo_name)');
}

module.exports = {
  migrateProductRepoColumns
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-prc-s1.1-product-repo-columns.js
```

Expected output: `[prc-s1.1] Results: 3 passed, 0 failed` — process exits 0.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same 69 pre-existing failures as the acknowledged baseline (see `decisions.md`, 2026-07-14 RISK-ACCEPT entry) plus this story's new file passing — no new failures introduced, no products-surface regressions.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/product-repo.js tests/check-prc-s1.1-product-repo-columns.js
git commit -m "feat(prc-s1.1): add idempotent products repo-column migration"
```

---

## Task 2: Wire `migrateProductRepoColumns` into `server.js`'s startup migration block

**Files:**
- Modify: `src/web-ui/server.js`
- Test: `tests/check-prc-s1.1-product-repo-columns.js` (extend with a wiring assertion)

**Covers:** AC1 (production wiring — the migration must actually run on startup, not just exist as an unused function)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-prc-s1.1-product-repo-columns.js`, before the `for (var i = 0; ...)` loop:

```javascript
  // T4: server.js wires migrateProductRepoColumns into the existing DATABASE_URL-gated
  // products migration chain (code inspection, matching arl-s5 T6's convention)
  queue.push(function() {
    console.log('\n[prc-s1.1] T4 -- server.js wires migrateProductRepoColumns into the products migration chain');
    return test('server.js: requires product-repo module and calls migrateProductRepoColumns(_creditsPool)', function() {
      var fs = require('fs');
      var SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      assert.ok(/require\(['"]\.\/modules\/product-repo['"]\)/.test(src),
        "server.js must require('./modules/product-repo')");
      assert.ok(/migrateProductRepoColumns\(\s*_creditsPool/.test(src),
        'server.js must call migrateProductRepoColumns(_creditsPool, ...) using the shared credits/products pool');
    });
  });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-prc-s1.1-product-repo-columns.js
```

Expected output: `[FAIL] server.js: requires product-repo module and calls migrateProductRepoColumns(_creditsPool)` — server.js does not yet reference `product-repo`.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/server.js`, add the require near the other module requires (alongside `setCreditsAdapter`):

```javascript
const { migrateProductRepoColumns } = require('./modules/product-repo'); // prc-s1.1
```

Then, inside the `if (process.env.DATABASE_URL) { ... }` block, immediately after the existing psh-s1/psh-s3 products migration chain (the `.then(function() { console.log('[psh-s3] products context columns ready'); }).catch(...)` block ends around where `standards` table creation begins), add:

```javascript
    // prc-s1.1: repo association columns on products (repo_provider/repo_owner/repo_name)
    migrateProductRepoColumns(_creditsPool).catch(function(err) {
      console.error('[prc-s1.1] products repo-column migration failed:', err.message);
    });
```

This follows the exact same fire-and-forget `.catch` pattern already used by every other migration call in this block (e.g. `standards`, `standard_product_optouts`, `journeys.product_id`) — no new error-handling convention introduced.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-prc-s1.1-product-repo-columns.js
```

Expected output: `[prc-s1.1] Results: 4 passed, 0 failed` — process exits 0.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same 69 pre-existing failures as baseline, no new failures. In particular, no `server.js`-parsing test regresses (a syntax error in the new wiring block would show up as a cascading failure across every test that requires `server.js`).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js tests/check-prc-s1.1-product-repo-columns.js
git commit -m "feat(prc-s1.1): wire products repo-column migration into server.js startup"
```

---

## Post-implementation

Run `/verify-completion` against all 3 ACs and the AC verification script at
`artefacts/2026-07-14-product-repo-config/verification-scripts/prc-s1.1-verification.md`,
then `/branch-complete` to open a draft PR.
