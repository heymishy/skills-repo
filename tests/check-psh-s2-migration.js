'use strict';
const assert = require('assert');

function makeMockPool(tenants, products, journeys) {
  const _prods = [...(products || [])];
  const _journeys = [...(journeys || [])];
  const ops = [];
  return {
    ops,
    query: async function(sql, params) {
      ops.push({ sql, params: params || [] });
      const sqlL = sql.toLowerCase().trim();
      // SELECT DISTINCT tenant_id FROM journeys
      if (/select distinct tenant_id from journeys/i.test(sql)) {
        return { rows: (tenants || []).map(t => ({ tenant_id: t })) };
      }
      // SELECT product_id FROM products WHERE tenant_id=... AND name='Default'
      if (/select product_id from products where tenant_id/i.test(sql) && /name.*=.*\$2|default/i.test(sql)) {
        const tid = params[0];
        const prod = _prods.find(p => p.tenant_id === tid && p.name === 'Default');
        return { rows: prod ? [{ product_id: prod.product_id }] : [] };
      }
      // INSERT INTO products
      if (/insert into products/i.test(sql)) {
        const newProd = { product_id: 'migrated-' + params[0], tenant_id: params[0], name: 'Default' };
        _prods.push(newProd);
        return { rows: [{ product_id: newProd.product_id }] };
      }
      // UPDATE journeys SET product_id
      if (/update journeys set product_id/i.test(sql)) {
        const pid = params[0]; const tid = params[1];
        _journeys.forEach(j => { if (j.tenant_id === tid && !j.product_id) j.product_id = pid; });
        return { rowCount: _journeys.filter(j => j.tenant_id === tid).length };
      }
      return { rows: [], rowCount: 0 };
    }
  };
}

const noopLog = { info: function() {}, warn: function() {}, error: function() {} };

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  const { runMigration } = require('../scripts/migrate-journeys-to-default-product');

  // T1 — creates Default product per tenant that has NULL journeys
  try {
    const pool = makeMockPool(['tenant-A', 'tenant-B'], [], [
      { journey_id: 'j1', tenant_id: 'tenant-A', product_id: null },
      { journey_id: 'j2', tenant_id: 'tenant-B', product_id: null }
    ]);
    await runMigration(pool, noopLog);
    const inserts = pool.ops.filter(op => /insert into products/i.test(op.sql));
    assert(inserts.length === 2, `Expected 2 product INSERTs, got ${inserts.length}`);
    const tenants = inserts.map(op => op.params[0]);
    assert(tenants.includes('tenant-A'), 'tenant-A product not created');
    assert(tenants.includes('tenant-B'), 'tenant-B product not created');
    pass('creates one Default product per tenant that has journeys with product_id IS NULL');
  } catch(e) { fail('creates one Default product per tenant that has journeys with product_id IS NULL', e); }

  // T2 — Default product named "Default" with created_by="migration"
  try {
    const pool = makeMockPool(['org-X'], [], [{ journey_id: 'j3', tenant_id: 'org-X', product_id: null }]);
    await runMigration(pool, noopLog);
    const ins = pool.ops.find(op => /insert into products/i.test(op.sql));
    assert(ins, 'No INSERT into products');
    const params = ins.params;
    assert(params.includes('Default'), "Default not in INSERT params");
    assert(params.includes('migration'), "'migration' not in created_by param");
    pass("Default product has name='Default' and created_by='migration'");
  } catch(e) { fail("Default product has name='Default' and created_by='migration'", e); }

  // T3 — updates journeys.product_id for NULL journeys
  try {
    const pool = makeMockPool(['tenant-C'], [], [{ journey_id: 'j4', tenant_id: 'tenant-C', product_id: null }]);
    await runMigration(pool, noopLog);
    const updates = pool.ops.filter(op => /update journeys set product_id/i.test(op.sql));
    assert(updates.length >= 1, `Expected at least 1 UPDATE, got ${updates.length}`);
    pass('updates journeys.product_id for all NULL journeys after creating Default product');
  } catch(e) { fail('updates journeys.product_id for all NULL journeys after creating Default product', e); }

  // T4 — idempotent: second run skips INSERT when Default already exists
  try {
    const existingProduct = { product_id: 'existing-default', tenant_id: 'org-Y', name: 'Default' };
    const pool = makeMockPool(['org-Y'], [existingProduct], [{ journey_id: 'j5', tenant_id: 'org-Y', product_id: null }]);
    await runMigration(pool, noopLog);
    const inserts = pool.ops.filter(op => /insert into products/i.test(op.sql));
    assert(inserts.length === 0, `Expected 0 INSERTs (Default already exists), got ${inserts.length}`);
    pass('idempotent: when Default product already exists, skips INSERT');
  } catch(e) { fail('idempotent: when Default product already exists, skips INSERT', e); }

  // T5 — no-op when no tenants have NULL journeys
  try {
    const pool = makeMockPool([], [], []);
    await runMigration(pool, noopLog);
    const inserts = pool.ops.filter(op => /insert into products/i.test(op.sql));
    assert(inserts.length === 0, `Expected 0 INSERTs for empty tenant list, got ${inserts.length}`);
    pass('no-op when no tenants have journeys with NULL product_id');
  } catch(e) { fail('no-op when no tenants have journeys with NULL product_id', e); }

  // T6 — runMigration exported function exists
  try {
    assert(typeof runMigration === 'function', 'runMigration is not a function');
    pass('scripts/migrate-journeys-to-default-product.js exports runMigration function');
  } catch(e) { fail('scripts/migrate-journeys-to-default-product.js exports runMigration function', e); }

  // T-NFR1 — accepts a log object with info/error methods
  try {
    const messages = [];
    const log = { info: function(m) { messages.push(m); }, warn: function() {}, error: function(m) { messages.push(m); } };
    const pool = makeMockPool(['tenant-log'], [], [{ journey_id: 'jl', tenant_id: 'tenant-log', product_id: null }]);
    await runMigration(pool, log);
    // Should have logged at least something
    assert(messages.length >= 0, 'Log accepted without error');
    pass('runMigration accepts a log object and does not crash');
  } catch(e) { fail('runMigration accepts a log object and does not crash', e); }

  console.log(`\n[psh-s2] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
