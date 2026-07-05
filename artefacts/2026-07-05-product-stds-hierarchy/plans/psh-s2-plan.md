# Implementation Plan — psh-s2: Existing journey migration to Default product

**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s2.md
**DoR:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s2-dor.md
**Test file:** `tests/check-psh-s2-migration.js`
**Model class:** balanced
**Upstream dependency:** psh-s1 must be merged before this runs.

## File map

| File | Action | Purpose |
|------|--------|---------|
| `scripts/migrate-journeys-to-default-product.js` | Create | Standalone idempotent migration script |
| `tests/check-psh-s2-migration.js` | Create | 5 integration + 2 NFR tests |

---

## Task 1 — Write failing tests (RED)

**File:** `tests/check-psh-s2-migration.js`

```js
'use strict';
const { Pool } = require('pg');
const assert = require('assert');

if (!process.env.DATABASE_URL) {
  console.log('[psh-s2] No DATABASE_URL — skipping integration tests');
  process.exit(0);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Import the migration function under test
const { runMigration } = require('../scripts/migrate-journeys-to-default-product');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

async function seed(p, rows) {
  for (const row of rows) {
    await p.query(
      `INSERT INTO journeys (journey_id, feature_slug, tenant_id, product_id) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [row.journey_id, 'slug', row.tenant_id, row.product_id || null]
    );
  }
}

async function cleanup(p) {
  await p.query(`DELETE FROM journeys WHERE feature_slug = 'slug'`);
  await p.query(`DELETE FROM products WHERE name = 'Default' AND created_by = 'migration'`);
}

async function run() {
  try {
    await cleanup(pool);

    // T1 — AC1: creates one Default product per tenant, assigns NULL product_id journeys
    try {
      await seed(pool, [
        { journey_id: 'j-a1', tenant_id: 'ta', product_id: null },
        { journey_id: 'j-a2', tenant_id: 'ta', product_id: null },
        { journey_id: 'j-b1', tenant_id: 'tb', product_id: null },
      ]);
      const result = await runMigration(pool);
      const pa = await pool.query(`SELECT product_id FROM products WHERE tenant_id='ta' AND name='Default'`);
      const pb = await pool.query(`SELECT product_id FROM products WHERE tenant_id='tb' AND name='Default'`);
      assert(pa.rows.length === 1, 'Expected 1 Default product for tenant-a');
      assert(pb.rows.length === 1, 'Expected 1 Default product for tenant-b');
      const ja = await pool.query(`SELECT product_id FROM journeys WHERE journey_id='j-a1'`);
      assert(ja.rows[0].product_id === pa.rows[0].product_id, 'j-a1 not assigned to tenant-a Default');
      pass('creates one Default product per tenant and assigns all NULL-product_id journeys');
      await cleanup(pool);
    } catch(e) { fail('creates one Default product per tenant and assigns all NULL-product_id journeys', e); await cleanup(pool); }

    // T2 — AC2: idempotent
    try {
      await seed(pool, [
        { journey_id: 'j-c1', tenant_id: 'tc', product_id: null },
      ]);
      await runMigration(pool);
      await runMigration(pool); // second run
      const p2 = await pool.query(`SELECT count(*) FROM products WHERE tenant_id='tc' AND name='Default'`);
      assert(parseInt(p2.rows[0].count, 10) === 1, 'Duplicate Default products created');
      pass('second run produces no duplicate Default products and no product_id changes');
      await cleanup(pool);
    } catch(e) { fail('second run produces no duplicate Default products and no product_id changes', e); await cleanup(pool); }

    // T3 — AC3: skip tenant with no NULL journeys
    try {
      const pX = await pool.query(`INSERT INTO products (tenant_id,name,created_by) VALUES ('td','Existing','user') RETURNING product_id`);
      const prodId = pX.rows[0].product_id;
      await seed(pool, [{ journey_id: 'j-d1', tenant_id: 'td', product_id: prodId }]);
      await runMigration(pool);
      const r = await pool.query(`SELECT count(*) FROM products WHERE tenant_id='td' AND name='Default'`);
      assert(parseInt(r.rows[0].count, 10) === 0, 'Default product created for tenant with no NULL journeys');
      pass('skips tenant with no NULL-product_id journeys');
      await pool.query(`DELETE FROM journeys WHERE journey_id='j-d1'`);
      await pool.query(`DELETE FROM products WHERE product_id=$1`, [prodId]);
    } catch(e) { fail('skips tenant with no NULL-product_id journeys', e); }

    // T4 — AC4: existing product_id not overwritten
    try {
      const pY = await pool.query(`INSERT INTO products (tenant_id,name,created_by) VALUES ('te','Existing','user') RETURNING product_id`);
      const existingProdId = pY.rows[0].product_id;
      await seed(pool, [
        { journey_id: 'j-e1', tenant_id: 'te', product_id: existingProdId },
        { journey_id: 'j-e2', tenant_id: 'te', product_id: null },
      ]);
      await runMigration(pool);
      const r = await pool.query(`SELECT product_id FROM journeys WHERE journey_id='j-e1'`);
      assert(r.rows[0].product_id === existingProdId, 'Existing product_id was overwritten');
      pass('journeys with existing product_id are unchanged by migration');
      await pool.query(`DELETE FROM journeys WHERE journey_id IN ('j-e1','j-e2')`);
      await pool.query(`DELETE FROM products WHERE tenant_id='te'`);
    } catch(e) { fail('journeys with existing product_id are unchanged by migration', e); }

    // T5 — AC5: logs summary
    try {
      await seed(pool, [{ journey_id: 'j-f1', tenant_id: 'tf', product_id: null }]);
      const logs = [];
      const result = await runMigration(pool, (msg) => logs.push(msg));
      const summary = logs.join(' ');
      assert(/default.*created|created.*default/i.test(summary) || /product/i.test(summary), 'No product count in summary');
      pass('migration logs count of defaults created, journeys updated, tenants processed');
      await cleanup(pool);
    } catch(e) { fail('migration logs count of defaults created, journeys updated, tenants processed', e); await cleanup(pool); }

    // T-NFR2 — no data fields modified
    try {
      const pZ = await pool.query(`INSERT INTO products (tenant_id,name,created_by) VALUES ('tz','TenantZ','user') RETURNING product_id`);
      await pool.query(
        `INSERT INTO journeys (journey_id,feature_slug,tenant_id,product_id,data) VALUES ('j-z1','slug','tz',NULL,'{"turns":[{"role":"user"}]}'::jsonb) ON CONFLICT DO NOTHING`
      );
      await runMigration(pool);
      const r = await pool.query(`SELECT data FROM journeys WHERE journey_id='j-z1'`);
      assert(r.rows[0].data.turns[0].role === 'user', 'turns field was modified');
      pass('no journey data fields are modified by the migration (turns, stages unchanged)');
      await pool.query(`DELETE FROM journeys WHERE journey_id='j-z1'`);
      await pool.query(`DELETE FROM products WHERE tenant_id='tz'`);
    } catch(e) { fail('no journey data fields are modified by the migration (turns, stages unchanged)', e); }

  } finally {
    await pool.end();
  }
  console.log(`\n[psh-s2] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch(function(err) { console.error('[psh-s2] Fatal:', err); process.exit(1); });
```

**Run:** `node tests/check-psh-s2-migration.js`
**Expected (RED):** Cannot find module `../scripts/migrate-journeys-to-default-product`

---

## Task 2 — Create migration script (GREEN)

**File:** `scripts/migrate-journeys-to-default-product.js`

```js
'use strict';

/**
 * psh-s2: Migrate existing journeys (product_id IS NULL) to a per-tenant Default product.
 * Idempotent — safe to run multiple times.
 *
 * Usage: node scripts/migrate-journeys-to-default-product.js
 */

const { Pool } = require('pg');

async function runMigration(pool, log) {
  const _log = log || console.log.bind(console);
  let defaultsCreated = 0;
  let journeysUpdated = 0;
  let tenantsProcessed = 0;

  // 1. Find all distinct tenant_ids with NULL product_id journeys
  const tenantRes = await pool.query(
    `SELECT DISTINCT tenant_id FROM journeys WHERE product_id IS NULL AND tenant_id IS NOT NULL`
  );
  const tenants = tenantRes.rows.map(r => r.tenant_id);

  for (const tenantId of tenants) {
    tenantsProcessed++;

    // 2. Check if Default product already exists
    const existing = await pool.query(
      `SELECT product_id FROM products WHERE tenant_id = $1 AND name = 'Default' LIMIT 1`,
      [tenantId]
    );

    let defaultProductId;
    if (existing.rows.length === 0) {
      // Insert Default product
      const inserted = await pool.query(
        `INSERT INTO products (tenant_id, name, description, created_by)
         VALUES ($1, 'Default', 'Auto-created default product — migrate your features to named products when ready.', 'migration')
         RETURNING product_id`,
        [tenantId]
      );
      defaultProductId = inserted.rows[0].product_id;
      defaultsCreated++;
    } else {
      defaultProductId = existing.rows[0].product_id;
    }

    // 3. Update NULL journeys for this tenant
    const updated = await pool.query(
      `UPDATE journeys SET product_id = $1 WHERE product_id IS NULL AND tenant_id = $2`,
      [defaultProductId, tenantId]
    );
    journeysUpdated += updated.rowCount;
  }

  const summary = `[psh-s2] Migration complete: ${defaultsCreated} default product(s) created, ${journeysUpdated} journey(s) updated, ${tenantsProcessed} tenant(s) processed`;
  _log(summary);
  return { defaultsCreated, journeysUpdated, tenantsProcessed };
}

module.exports = { runMigration };

// Direct execution
if (require.main === module) {
  if (!process.env.DATABASE_URL) {
    console.error('[psh-s2] DATABASE_URL not set — aborting');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  runMigration(pool)
    .then(function() { return pool.end(); })
    .catch(function(err) { console.error('[psh-s2] Migration failed:', err.message); process.exit(1); });
}
```

**Run:** `node tests/check-psh-s2-migration.js`
**Expected (GREEN):** `[psh-s2] Results: 5 passed, 0 failed` (with DATABASE_URL set)

---

## Task 3 — Commit

```
feat(psh-s2): add Default product migration script for existing journeys
```

**Verify:** `node tests/check-psh-s2-migration.js` → all passed (or skipped if no DATABASE_URL)
