'use strict';

/**
 * bri-s2.4 -- idempotent anonymized seed script for staging.
 *
 * Static/mocked regression guards for scripts/seed-staging.js. No real
 * Neon/Postgres connection is made anywhere in this file -- the DB
 * connection is an injectable adapter (D37), and this file's own
 * in-memory mock adapter simulates Postgres's unique-constraint /
 * ON CONFLICT DO NOTHING behaviour so the idempotency contract (AC2) is a
 * real structural check, not a trivial always-pass.
 *
 * Reference: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.4-anonymized-seed-script-test-plan.md
 */

const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');

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

const { seed, SYNTHETIC_TENANTS } = require(path.join(__dirname, '..', 'scripts', 'seed-staging.js'));

async function runTests() {
  // -------------------------------------------------------------------------
  // T1 -- at least 2 distinct synthetic tenants
  // -------------------------------------------------------------------------
  await testAsync('T1: seed produces at least 2 distinct synthetic tenants', async () => {
    const mock = createMockAdapter();
    await seed(mock);
    const tenantIds = new Set(mock.inserts.map((i) => i.params[0]));
    assert.ok(tenantIds.size >= 2, `expected >= 2 distinct tenant_ids, got ${tenantIds.size}`);
  });

  // -------------------------------------------------------------------------
  // T2 -- representative rows in products, credits, user_roles per tenant
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // T3 -- ADR-025 tenant-scoping: every row has a non-null tenant_id
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // T4/T5 -- idempotent re-run (AC2)
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // T6/T7 -- zero real PII (AC3)
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // IT1 -- single CLI-invokable entrypoint (AC4 partial)
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // NFR1 -- performance budget against the mocked adapter
  // -------------------------------------------------------------------------
  await testAsync('NFR1: seed(mockAdapter) completes in under 30 seconds', async () => {
    const mock = createMockAdapter();
    const start = Date.now();
    await seed(mock);
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 30000, `expected elapsed (${elapsed}ms) to be under 30000ms`);
  });

  console.log(`\n[bri-s2.4] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests();
