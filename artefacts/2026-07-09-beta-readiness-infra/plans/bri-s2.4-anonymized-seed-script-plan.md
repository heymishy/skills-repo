# Build an idempotent anonymized seed script for staging — Implementation Plan

> **For agent execution:** Executed via /tdd discipline per task (RED — GREEN — REFACTOR — commit), single session. No subagents available in this environment.

**Goal:** Make every test in the test plan pass (T1–T7, IT1, NFR1). Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/bri-s2.4`
**Worktree:** `.worktrees/bri-s2.4`
**Test command:** `node tests/check-bri-s2.4-anonymized-seed-script.js`

---

## File map

```
Create:
  scripts/seed-staging.js                              — the idempotent seed script (D37 injectable adapter, seed() core, CLI entrypoint)
  tests/check-bri-s2.4-anonymized-seed-script.js        — T1–T7, IT1, NFR1 (plain-node test harness, matches repo convention)

Modify:
  package.json                                          — append the new test file to scripts.test chain
```

**Design decisions (see also decisions.md if a deviation is needed):**
- `seed(adapter)` accepts the DB adapter directly as a parameter (matches DoR contract assumption: "The seed script exposes a `seed(adapter)` function callable with an injected adapter") — this makes the core logic directly unit-testable without touching module state.
- A separate D37 module-level injectable (`setDbConnection` / `requireDbConnection`, default stub throws) exists for the CLI entrypoint's production wiring, per the Coding Agent Instructions' explicit D37 constraint.
- Every INSERT uses `ON CONFLICT (<primary key>) DO NOTHING` against **deterministic** synthetic identifiers (literal UUIDs for `products.product_id`, literal tenant slugs for `credits`/`user_roles`' `tenant_id` PK) — a random ID (e.g. `gen_random_uuid()`) would defeat idempotency on a second run, so the script must never let Postgres generate the key itself.
- Every INSERT's first bound parameter is `tenant_id` (column order in the SQL text is adjusted accordingly) so tests can generically assert tenant-scoping (ADR-025 / T3) without hardcoding per-table column positions.
- Real Postgres adapter wiring in the CLI entrypoint is a **separate task/commit** from the seed logic + injectable setter (D37 rule #3 — see Task 5).

---

## Task 1: Seed core logic + D37 injectable adapter + synthetic tenant dataset (AC1 — T1/T2/T3)

**Files:**
- Create: `scripts/seed-staging.js`
- Test: `tests/check-bri-s2.4-anonymized-seed-script.js`

- [ ] **Step 1: Write the failing tests (T1, T2, T3)**

```javascript
'use strict';

/**
 * bri-s2.4 -- idempotent anonymized seed script for staging.
 * Reference: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.4-anonymized-seed-script-test-plan.md
 */

const assert = require('assert');
const path = require('path');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// In-memory mock adapter -- simulates Postgres's unique-constraint /
// ON CONFLICT DO NOTHING behaviour so T4/T5's idempotency contract is a
// real structural check, not a trivial always-pass.
// Dedup key = normalised SQL text + JSON(params). If the exact same insert
// is attempted twice: an `ON CONFLICT` statement is a silent no-op (matches
// real Postgres); a statement without `ON CONFLICT` throws a 23505-shaped
// error (matches a real unique-violation).
// ---------------------------------------------------------------------------
function createMockAdapter() {
  const inserts = [];
  const seenKeys = new Set();

  async function query(sql, params) {
    const normalised = sql.replace(/\s+/g, ' ').trim();
    const key = normalised + '::' + JSON.stringify(params);
    const hasOnConflict = /ON CONFLICT/i.test(normalised);
    const tableMatch = normalised.match(/INSERT INTO\s+(\w+)/i);
    const table = tableMatch ? tableMatch[1] : null;

    if (seenKeys.has(key)) {
      if (hasOnConflict) {
        return { rows: [], rowCount: 0 };
      }
      const err = new Error('duplicate key value violates unique constraint');
      err.code = '23505';
      throw err;
    }

    seenKeys.add(key);
    if (table) {
      inserts.push({ table, params });
    }
    return { rows: [], rowCount: 1 };
  }

  return {
    query,
    get inserts() { return inserts.slice(); }
  };
}

const { seed, SYNTHETIC_TENANTS } = require(path.join('..', 'scripts', 'seed-staging.js'));

// ---------------------------------------------------------------------------
// T1 -- at least 2 distinct synthetic tenants
// ---------------------------------------------------------------------------
async function runTests() {
  await testAsync('T1: seed produces at least 2 distinct synthetic tenants', async () => {
    const mock = createMockAdapter();
    await seed(mock);
    const tenantIds = new Set(mock.inserts.map((i) => i.params[0]));
    assert.ok(tenantIds.size >= 2, `expected >= 2 distinct tenant_ids, got ${tenantIds.size}`);
  });

  await testAsync('T2: each synthetic tenant has representative rows in products, credits, user_roles', async () => {
    const mock = createMockAdapter();
    await seed(mock);
    const requiredTables = ['products', 'credits', 'user_roles'];
    const byTenant = {};
    for (const insert of mock.inserts) {
      const tenantId = insert.params[0];
      byTenant[tenantId] = byTenant[tenantId] || new Set();
      byTenant[tenantId].add(insert.table);
    }
    const tenantIds = Object.keys(byTenant);
    assert.ok(tenantIds.length >= 2, 'expected at least 2 tenants recorded');
    for (const tenantId of tenantIds) {
      for (const table of requiredTables) {
        assert.ok(
          byTenant[tenantId].has(table),
          `tenant ${tenantId} is missing a row in ${table}`
        );
      }
    }
  });

  await testAsync('T3: every tenant-scoped row carries a non-null tenant_id matching a seeded tenant (ADR-025)', async () => {
    const mock = createMockAdapter();
    await seed(mock);
    const knownTenantIds = new Set(SYNTHETIC_TENANTS.map((t) => t.tenantId));
    assert.ok(mock.inserts.length > 0, 'expected at least one insert to be recorded');
    for (const insert of mock.inserts) {
      const tenantId = insert.params[0];
      assert.ok(tenantId, `row inserted into ${insert.table} has a null/falsy tenant_id`);
      assert.ok(
        knownTenantIds.has(tenantId),
        `row's tenant_id "${tenantId}" does not match any seeded synthetic tenant`
      );
    }
  });

  console.log(`\n[bri-s2.4] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-bri-s2.4-anonymized-seed-script.js
```

Expected output: `Cannot find module '../scripts/seed-staging.js'` (module does not exist yet)

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';

/**
 * bri-s2.4 -- idempotent anonymized seed script for staging.
 *
 * Populates a fresh (or already-seeded) Postgres database with a small,
 * fixed set of synthetic tenants and their tenant-scoped rows (products,
 * credits, user_roles) -- AC1 -- so that downstream tests (S2.6 smoke
 * test, Epic 3's journey specs, cross-tenant isolation tests) have real,
 * schema-accurate data to exercise, without ever containing real customer
 * information (AC3 / NFR-Security).
 *
 * DB connection is an injectable adapter (D37): setDbConnection() must be
 * called with a real query-capable adapter (a pg Pool, or any object
 * exposing an async query(sql, params) method) before the CLI entrypoint
 * can run without an explicit adapter argument. seed(adapter) also accepts
 * the adapter directly as a parameter so it is independently unit-testable
 * against a mock without touching module state.
 *
 * Idempotency (AC2) is structural: every INSERT uses
 * `ON CONFLICT (<primary key>) DO NOTHING` against deterministic synthetic
 * identifiers -- never a wipe-and-reseed, and never a database-generated
 * random ID that would defeat the ON CONFLICT check on a second run.
 *
 * Reference: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.4-anonymized-seed-script-test-plan.md
 */

// ---------------------------------------------------------------------------
// D37 injectable DB-connection adapter (production wiring in Task 5).
// ---------------------------------------------------------------------------
let _dbConnection = null;

function setDbConnection(adapter) {
  _dbConnection = adapter;
}

function requireDbConnection() {
  if (!_dbConnection) {
    throw new Error('Adapter not wired: dbConnection. Call setDbConnection() with a real implementation before use.');
  }
  return _dbConnection;
}

// ---------------------------------------------------------------------------
// Synthetic tenant dataset (AC1, AC3) -- fixed, small set. MVP does not
// support configurable seed volume/scale (story Out of Scope).
// ---------------------------------------------------------------------------
const SYNTHETIC_TENANTS = [
  {
    tenantId: 'tenant-demo-1',
    productId: '00000000-0000-0000-0000-000000000001',
    productName: 'Demo Product One',
    syntheticEmail: 'engineer@example-staging.test',
    role: 'admin',
    balance: 100
  },
  {
    tenantId: 'tenant-demo-2',
    productId: '00000000-0000-0000-0000-000000000002',
    productName: 'Demo Product Two',
    syntheticEmail: 'operator@example-staging.test',
    role: 'user',
    balance: 50
  }
];

const ROWS_PER_TENANT = 3; // products + credits + user_roles

// ---------------------------------------------------------------------------
// seed(adapter) -- core, directly-testable entrypoint (AC1/AC2). Every
// tenant-scoped INSERT's first bound parameter is always tenant_id, so
// callers (including tests) can generically assert tenant scoping without
// knowing each table's full column order.
// ---------------------------------------------------------------------------
async function seed(adapter) {
  const db = adapter || requireDbConnection();

  for (const tenant of SYNTHETIC_TENANTS) {
    await db.query(
      `INSERT INTO products (tenant_id, product_id, name, description, created_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (product_id) DO NOTHING`,
      [tenant.tenantId, tenant.productId, tenant.productName,
       'Synthetic staging demo product -- seeded by scripts/seed-staging.js', tenant.syntheticEmail]
    );

    await db.query(
      `INSERT INTO credits (tenant_id, balance)
       VALUES ($1, $2)
       ON CONFLICT (tenant_id) DO NOTHING`,
      [tenant.tenantId, tenant.balance]
    );

    await db.query(
      `INSERT INTO user_roles (tenant_id, role)
       VALUES ($1, $2)
       ON CONFLICT (tenant_id) DO NOTHING`,
      [tenant.tenantId, tenant.role]
    );
  }

  return {
    tenantCount: SYNTHETIC_TENANTS.length,
    rowCount: SYNTHETIC_TENANTS.length * ROWS_PER_TENANT
  };
}

module.exports = { seed, setDbConnection, requireDbConnection, SYNTHETIC_TENANTS };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-bri-s2.4-anonymized-seed-script.js
```

Expected output:
```
  ✓ T1: seed produces at least 2 distinct synthetic tenants
  ✓ T2: each synthetic tenant has representative rows in products, credits, user_roles
  ✓ T3: every tenant-scoped row carries a non-null tenant_id matching a seeded tenant (ADR-025)

[bri-s2.4] Results: 3 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-staging.js tests/check-bri-s2.4-anonymized-seed-script.js
git commit -m "feat(bri-s2.4): add seed core logic, D37 adapter, synthetic tenant dataset (T1-T3)"
```

---

## Task 2: Idempotency tests (AC2 — T4/T5)

**Files:**
- Modify: `tests/check-bri-s2.4-anonymized-seed-script.js` (add T4, T5 — no production code change expected, since Task 1's `ON CONFLICT DO NOTHING` + deterministic IDs already satisfy idempotency structurally)

- [ ] **Step 1: Write the failing tests (T4, T5)**

```javascript
  await testAsync('T4: running seed a second time produces an identical row count (idempotent)', async () => {
    const mock = createMockAdapter();
    await seed(mock);
    const firstRunCount = mock.inserts.length;
    await seed(mock);
    const secondRunCount = mock.inserts.length;
    assert.strictEqual(secondRunCount, firstRunCount, 'second run added new rows -- not idempotent');
  });

  await testAsync('T5: running seed a second time throws no unique-constraint error', async () => {
    const mock = createMockAdapter();
    await seed(mock);
    let caught = null;
    try {
      await seed(mock);
    } catch (err) {
      caught = err;
    }
    assert.strictEqual(caught, null, `expected no error on second run, got: ${caught && caught.message}`);
  });
```

(Inserted immediately after T3 in `runTests()`, before the summary `console.log`.)

- [ ] **Step 2: Run test — must fail if idempotency logic were absent**

```bash
node tests/check-bri-s2.4-anonymized-seed-script.js
```

Expected output (pre-check, confirms the tests are wired correctly by temporarily removing `ON CONFLICT` from one query — not committed): `T5 fails with a 23505-shaped error`. With Task 1's actual implementation in place, both already pass (Task 1's `ON CONFLICT DO NOTHING` clauses were written test-first against this exact contract) — this task adds the explicit regression coverage.

- [ ] **Step 3: Confirm implementation already satisfies the tests (no code change)**

No changes to `scripts/seed-staging.js` — Task 1's `ON CONFLICT (<pk>) DO NOTHING` clauses against deterministic IDs already provide structural idempotency.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-bri-s2.4-anonymized-seed-script.js
```

Expected output:
```
  ✓ T4: running seed a second time produces an identical row count (idempotent)
  ✓ T5: running seed a second time throws no unique-constraint error

[bri-s2.4] Results: 5 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add tests/check-bri-s2.4-anonymized-seed-script.js
git commit -m "test(bri-s2.4): add idempotent re-run regression guards (T4-T5)"
```

---

## Task 3: PII / synthetic-data tests (AC3 — T6/T7)

**Files:**
- Modify: `tests/check-bri-s2.4-anonymized-seed-script.js` (add T6, T7)

- [ ] **Step 1: Write the failing tests (T6, T7)**

```javascript
  await testAsync('T6: every seeded email matches the synthetic domain pattern', async () => {
    const mock = createMockAdapter();
    await seed(mock);
    const emailPattern = /\S+@\S+\.\S+/;
    const syntheticDomainPattern = /@(example-staging\.test|example\.com)$/i;
    let emailsFound = 0;
    for (const insert of mock.inserts) {
      for (const value of insert.params) {
        if (typeof value === 'string' && emailPattern.test(value)) {
          emailsFound++;
          assert.ok(
            syntheticDomainPattern.test(value),
            `seeded email "${value}" does not use a clearly synthetic domain`
          );
        }
      }
    }
    assert.ok(emailsFound > 0, 'expected at least one seeded email value to inspect');
  });

  await testAsync('T7: no seeded value matches a known-real-data denylist pattern', async () => {
    const mock = createMockAdapter();
    await seed(mock);
    const denylist = [/heymishy/i, /hamish\s*king/i, /gmail\.com/i, /anthropic\.com/i];
    for (const insert of mock.inserts) {
      for (const value of insert.params) {
        if (typeof value !== 'string') continue;
        for (const pattern of denylist) {
          assert.ok(
            !pattern.test(value),
            `seeded value "${value}" matches denylisted real-data pattern ${pattern}`
          );
        }
      }
    }
  });
```

- [ ] **Step 2: Run test — must fail if PII leaked (pre-check only; implementation already clean)**

```bash
node tests/check-bri-s2.4-anonymized-seed-script.js
```

With Task 1's dataset (`tenant-demo-1`/`tenant-demo-2`, `@example-staging.test` emails), these already pass — this task adds the explicit regression coverage per the test plan.

- [ ] **Step 3: No production code change expected**

`scripts/seed-staging.js`'s `SYNTHETIC_TENANTS` dataset already uses only synthetic identifiers.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-bri-s2.4-anonymized-seed-script.js
```

Expected output:
```
  ✓ T6: every seeded email matches the synthetic domain pattern
  ✓ T7: no seeded value matches a known-real-data denylist pattern

[bri-s2.4] Results: 7 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add tests/check-bri-s2.4-anonymized-seed-script.js
git commit -m "test(bri-s2.4): add PII/synthetic-data denylist regression guards (T6-T7)"
```

---

## Task 4: CLI entrypoint (mock mode) + IT1 + NFR1 (AC4 partial, NFR-Performance)

**Files:**
- Modify: `scripts/seed-staging.js` (add CLI entrypoint with mock-mode support only — real Postgres wiring is Task 5)
- Modify: `tests/check-bri-s2.4-anonymized-seed-script.js` (add IT1, NFR1)

- [ ] **Step 1: Write the failing tests (IT1, NFR1)**

```javascript
const { spawnSync } = require('child_process');

  test('IT1: seed script exposes a single CLI-invokable entrypoint (exit 0, summary stdout)', () => {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'seed-staging.js');
    const result = spawnSync('node', [scriptPath], {
      encoding: 'utf8',
      env: Object.assign({}, process.env, { SEED_ADAPTER_MOCK: '1' })
    });
    assert.strictEqual(result.status, 0, `expected exit code 0, got ${result.status}. stderr: ${result.stderr}`);
    assert.ok(
      /Seeded \d+ tenants, \d+ rows/.test(result.stdout),
      `expected a summary line reporting tenant/row counts, got stdout: "${result.stdout}"`
    );
  });

  await testAsync('NFR1: seed(mockAdapter) completes in under 30 seconds', async () => {
    const mock = createMockAdapter();
    const start = Date.now();
    await seed(mock);
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 30000, `expected elapsed (${elapsed}ms) to be under 30000ms`);
  });
```

(`test(...)` is a synchronous helper already defined at the top of the file; IT1 uses it since `spawnSync` is synchronous. NFR1 uses the async helper.)

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-bri-s2.4-anonymized-seed-script.js
```

Expected output: IT1 fails — `expected exit code 0, got 1` (no `require.main === module` block exists yet, so running the file directly does nothing / exits with an unhandled state)

- [ ] **Step 3: Write minimal implementation — add CLI entrypoint (mock mode only)**

Append to `scripts/seed-staging.js` (before `module.exports`):

```javascript
// ---------------------------------------------------------------------------
// Minimal built-in inert mock adapter -- used only when SEED_ADAPTER_MOCK=1
// is set, so the CLI entrypoint can be smoke-tested (IT1) without a real
// DATABASE_URL. Distinct from the richer dedup-simulating mock built in
// this story's own test file -- this one exists purely to prove the
// entrypoint is invokable end-to-end (AC4's "single invokable entrypoint"
// requirement; the "automatic" triggering itself is S2.5's scope).
// ---------------------------------------------------------------------------
function createInertMockAdapter() {
  return {
    query: async function () {
      return { rows: [], rowCount: 0 };
    }
  };
}

// ---------------------------------------------------------------------------
// CLI entrypoint (AC4 / IT1 / NFR-Audit). Real Postgres wiring for the
// non-mock path is added in a separate task/commit (D37 rule #3, see
// scripts/seed-staging.js history) -- until then, running without
// SEED_ADAPTER_MOCK=1 surfaces the D37 stub-throw error rather than
// silently no-opping.
// ---------------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    try {
      if (process.env.SEED_ADAPTER_MOCK === '1') {
        setDbConnection(createInertMockAdapter());
      }

      const summary = await seed(requireDbConnection());
      console.log(`Seeded ${summary.tenantCount} tenants, ${summary.rowCount} rows`);
      process.exit(0);
    } catch (err) {
      console.error('seed-staging failed:', err.message);
      process.exit(1);
    }
  })();
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-bri-s2.4-anonymized-seed-script.js
```

Expected output:
```
  ✓ IT1: seed script exposes a single CLI-invokable entrypoint (exit 0, summary stdout)
  ✓ NFR1: seed(mockAdapter) completes in under 30 seconds

[bri-s2.4] Results: 9 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-staging.js tests/check-bri-s2.4-anonymized-seed-script.js
git commit -m "feat(bri-s2.4): add CLI entrypoint with mock-mode invocation (IT1, NFR1)"
```

---

## Task 5: Wire the real Postgres adapter as CLI production default (D37 rule #3 — separate task)

**Files:**
- Modify: `scripts/seed-staging.js` (add the real `pg` Pool branch to the CLI entrypoint)
- Modify: `package.json` (register the new test file in `scripts.test`)

This task is deliberately separate from Task 4's handler/entrypoint work, per D37 rule #3 ("wiring the real adapter as production default is a SEPARATE task from writing the handler + injectable setter — do not bundle them into one task/commit").

- [ ] **Step 1: No new failing test** — this task wires production behaviour that cannot be exercised without a real Neon connection (out of scope for this repo's automated suite per the Test Data Strategy: "No real Neon database writes in the automated test suite"). Covered instead by AC verification script Scenario 1/2 (manual, against real staging).

- [ ] **Step 2: Wire the real adapter**

Edit the CLI entrypoint's `if` block in `scripts/seed-staging.js`:

```javascript
if (require.main === module) {
  (async () => {
    try {
      if (process.env.SEED_ADAPTER_MOCK === '1') {
        setDbConnection(createInertMockAdapter());
      } else {
        const { Pool } = require('pg');
        setDbConnection(new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        }));
      }

      const summary = await seed(requireDbConnection());
      console.log(`Seeded ${summary.tenantCount} tenants, ${summary.rowCount} rows`);
      process.exit(0);
    } catch (err) {
      console.error('seed-staging failed:', err.message);
      process.exit(1);
    }
  })();
}
```

- [ ] **Step 3: Run full existing test file — no regressions**

```bash
node tests/check-bri-s2.4-anonymized-seed-script.js
```

Expected output: `[bri-s2.4] Results: 9 passed, 0 failed` (IT1 still uses `SEED_ADAPTER_MOCK=1`, so it never reaches the new `pg` branch — no `pg` connection is attempted in the test suite)

- [ ] **Step 4: Register the test file in package.json's test chain**

Append ` && node tests/check-bri-s2.4-anonymized-seed-script.js` to the end of the existing `scripts.test` string in `package.json` (do not reformat or reorder existing entries).

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-staging.js package.json
git commit -m "feat(bri-s2.4): wire real Postgres adapter as CLI production default; register test in chain"
```

---

## Post-implementation

- Run `/verify-completion` against all 4 ACs using fresh evidence (re-run the test file, inspect actual stdout).
- The AC4 manual gap (Scenario 4 — real staging deploy confirms automatic invocation) remains a manual, cross-referenced-to-S2.5 verification step — not automatable in this repo's Node suite (documented in the test plan's Coverage gaps table).
- Open a draft PR per `/branch-complete` (Option 2) once all automated tests pass.
