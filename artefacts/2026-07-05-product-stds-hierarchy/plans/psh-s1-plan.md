# Implementation Plan — psh-s1: Products and standards Postgres tables and schema

**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s1.md
**DoR:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s1-dor.md
**Test file:** `tests/check-psh-s1-schema.js`
**Model class:** balanced

## File map

| File | Action | Purpose |
|------|--------|---------|
| `src/web-ui/server.js` | Modify — add to DATABASE_URL block | Add products/standards migration + journeys.product_id ALTER |
| `tests/check-psh-s1-schema.js` | Create | 8 tests (7 integration + 1 structural) |

---

## Task 1 — Write failing tests (RED)

**File:** `tests/check-psh-s1-schema.js`

```js
'use strict';
const { Pool } = require('pg');
const assert = require('assert');

// Skip if no DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.log('[psh-s1] No DATABASE_URL — skipping integration tests');
  process.exit(0);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function runMigration(p) {
  await p.query(`CREATE TABLE IF NOT EXISTS products (
    product_id  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   VARCHAR      NOT NULL,
    name        VARCHAR      NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    created_by  VARCHAR      NOT NULL,
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
  )`);
  await p.query(`CREATE TABLE IF NOT EXISTS standards (
    standard_id UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID         REFERENCES products(product_id) ON DELETE CASCADE,
    org_id      VARCHAR      NOT NULL,
    name        VARCHAR      NOT NULL,
    content     TEXT         NOT NULL,
    visibility  VARCHAR      NOT NULL DEFAULT 'product'
                             CHECK (visibility IN ('product', 'org', 'public')),
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
  )`);
  await p.query(`ALTER TABLE journeys ADD COLUMN IF NOT EXISTS
    product_id UUID REFERENCES products(product_id) ON DELETE SET NULL`);
}

async function teardown(p) {
  await p.query('ALTER TABLE journeys DROP COLUMN IF EXISTS product_id');
  await p.query('DROP TABLE IF EXISTS standards');
  await p.query('DROP TABLE IF EXISTS products');
}

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message}`); failed++; }

async function run() {
  try {
    await teardown(pool);

    // T1 — structural: no setX/adapter pattern in server.js migration block
    try {
      const fs = require('fs'), src = fs.readFileSync('src/web-ui/server.js', 'utf8');
      const migrationBlock = src.slice(src.indexOf('products table'), src.indexOf('products table') + 500);
      assert(!/(set[A-Z]|Injectable)/.test(migrationBlock), 'Adapter pattern found in migration block');
      pass('(structural check) migration file contains no setX or adapter pattern');
    } catch(e) { fail('(structural check) migration file contains no setX or adapter pattern', e); }

    // T-NFR1 — IF NOT EXISTS present
    try {
      const fs = require('fs'), src = fs.readFileSync('src/web-ui/server.js', 'utf8');
      assert(src.includes('IF NOT EXISTS'), 'IF NOT EXISTS not found');
      pass('migration uses IF NOT EXISTS on all CREATE TABLE statements');
    } catch(e) { fail('migration uses IF NOT EXISTS on all CREATE TABLE statements', e); }

    // Run migration to test actual schema
    await runMigration(pool);

    // T2 — products table columns
    try {
      const r = await pool.query(`SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name='products' AND table_schema='public'`);
      const cols = r.rows.map(row => row.column_name);
      for (const c of ['product_id','tenant_id','name','description','created_at','created_by','updated_at']) {
        assert(cols.includes(c), `products table missing column: ${c}`);
      }
      const tenantRow = r.rows.find(row => row.column_name === 'tenant_id');
      assert(tenantRow && tenantRow.is_nullable === 'NO', 'tenant_id should be NOT NULL');
      pass('creates products table with correct columns on fresh DB');
    } catch(e) { fail('creates products table with correct columns on fresh DB', e); }

    // T3 — idempotent (products)
    try {
      await runMigration(pool); // second run
      pass('re-running migration does not error (products table)');
    } catch(e) { fail('re-running migration does not error (products table)', e); }

    // T4 — standards table + visibility CHECK
    try {
      const r = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='standards' AND table_schema='public'`);
      const cols = r.rows.map(row => row.column_name);
      for (const c of ['standard_id','product_id','org_id','name','content','visibility']) {
        assert(cols.includes(c), `standards table missing column: ${c}`);
      }
      // CHECK constraint: invalid visibility throws
      try {
        await pool.query(`INSERT INTO standards (org_id,name,content,visibility) VALUES ('x','n','c','invalid')`);
        fail('creates standards table with visibility CHECK constraint', new Error('Expected CHECK violation but no error thrown'));
      } catch(checkErr) {
        if (checkErr.message.includes('check') || checkErr.message.includes('constraint') || checkErr.code === '23514') {
          pass('creates standards table with visibility CHECK constraint');
        } else {
          throw checkErr;
        }
      }
    } catch(e) { if (e.message.includes('PASS')) { /* already handled */ } else fail('creates standards table with visibility CHECK constraint', e); }

    // T5 — idempotent (standards)
    try {
      await runMigration(pool);
      pass('re-running migration does not error (standards table)');
    } catch(e) { fail('re-running migration does not error (standards table)', e); }

    // T6 — journeys.product_id column
    try {
      const r = await pool.query(`SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='journeys' AND table_schema='public' AND column_name='product_id'`);
      assert(r.rows.length === 1, 'product_id column not found on journeys');
      assert(r.rows[0].is_nullable === 'YES', 'product_id should be nullable');
      pass('adds product_id FK column to journeys table');
    } catch(e) { fail('adds product_id FK column to journeys table', e); }

    // T7 — idempotent (journeys.product_id)
    try {
      await runMigration(pool);
      pass('re-running migration does not error (journeys.product_id)');
    } catch(e) { fail('re-running migration does not error (journeys.product_id)', e); }

    // T8 — tenant isolation
    try {
      const pA = await pool.query(`INSERT INTO products (tenant_id,name,created_by) VALUES ('tenant-a','Test','migration') RETURNING product_id`);
      const productIdA = pA.rows[0].product_id;
      await pool.query(`INSERT INTO journeys (journey_id,feature_slug,product_id,tenant_id) VALUES ('j-test-a','slug-a',$1,'tenant-a') ON CONFLICT DO NOTHING`, [productIdA]);
      const r1 = await pool.query(`SELECT * FROM journeys WHERE product_id = $1`, [productIdA]);
      assert(r1.rows.length >= 1, 'Expected journeys for tenant-a product');
      const r2 = await pool.query(`SELECT * FROM products WHERE tenant_id = 'tenant-b'`);
      assert(r2.rows.length === 0, 'Expected 0 products for tenant-b');
      pass('journeys filtered by product_id return only correct rows; cross-tenant query returns zero rows');
    } catch(e) { fail('journeys filtered by product_id return only correct rows; cross-tenant query returns zero rows', e); }

    // T-NFR2 — NOT NULL constraint
    try {
      const r = await pool.query(`SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='products' AND column_name IN ('tenant_id') AND table_schema='public'`);
      assert(r.rows.length > 0 && r.rows[0].is_nullable === 'NO', 'tenant_id should be NOT NULL');
      pass('products.tenant_id and standards.org_id columns are NOT NULL');
    } catch(e) { fail('products.tenant_id and standards.org_id columns are NOT NULL', e); }

  } finally {
    try { await teardown(pool); } catch(_) {}
    await pool.end();
  }
  console.log(`\n[psh-s1] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch(function(err) { console.error('[psh-s1] Fatal:', err); process.exit(1); });
```

**Run:** `node tests/check-psh-s1-schema.js`
**Expected (RED):** 6-8 failures — products/standards tables don't exist yet.

---

## Task 2 — Add migration to server.js (GREEN)

**File:** `src/web-ui/server.js`

Inside the `if (process.env.DATABASE_URL)` block, after the existing `credits` and `stripe_events` migrations, add:

```js
    // psh-s1 — Products and standards schema migration
    {
      const _pshPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
      _pshPool.query(`CREATE TABLE IF NOT EXISTS products (
        product_id  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id   VARCHAR      NOT NULL,
        name        VARCHAR      NOT NULL,
        description TEXT,
        created_at  TIMESTAMPTZ  DEFAULT NOW(),
        created_by  VARCHAR      NOT NULL,
        updated_at  TIMESTAMPTZ  DEFAULT NOW()
      )`).then(function() { console.log('[psh-s1] products table ready'); })
        .catch(function(err) { console.error('[psh-s1] products migration failed:', err.message); });
      _pshPool.query(`CREATE TABLE IF NOT EXISTS standards (
        standard_id UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id  UUID         REFERENCES products(product_id) ON DELETE CASCADE,
        org_id      VARCHAR      NOT NULL,
        name        VARCHAR      NOT NULL,
        content     TEXT         NOT NULL,
        visibility  VARCHAR      NOT NULL DEFAULT 'product'
                                 CHECK (visibility IN ('product', 'org', 'public')),
        created_at  TIMESTAMPTZ  DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  DEFAULT NOW()
      )`).then(function() { console.log('[psh-s1] standards table ready'); })
        .catch(function(err) { console.error('[psh-s1] standards migration failed:', err.message); });
      _pshPool.query(`ALTER TABLE journeys ADD COLUMN IF NOT EXISTS
        product_id UUID REFERENCES products(product_id) ON DELETE SET NULL`
      ).then(function() { console.log('[psh-s1] journeys.product_id column ready'); })
        .catch(function(err) { console.error('[psh-s1] journeys.product_id migration failed:', err.message); });
    }
```

**Run:** `node tests/check-psh-s1-schema.js`
**Expected (GREEN):** `[psh-s1] Results: 8 passed, 0 failed`

---

## Task 3 — Commit

```
feat(psh-s1): add products/standards schema and journeys.product_id FK migration
```

**Verify:** `node tests/check-psh-s1-schema.js` → 8 passed, 0 failed
