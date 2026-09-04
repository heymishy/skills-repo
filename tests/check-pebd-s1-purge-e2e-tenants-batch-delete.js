/**
 * check-pebd-s1-purge-e2e-tenants-batch-delete.js
 *
 * pebd-s1 - purgeE2eTenants must batch its own deletes (via
 * purgeTenantsBatch, chunked at BATCH_SIZE) instead of running a fully
 * sequential per-tenant loop, so a large backlog can clear within a bounded
 * number of round-trips regardless of tenant count. purgeTenant (single-
 * tenant) must remain unchanged and independently usable.
 *
 * Run: node tests/check-pebd-s1-purge-e2e-tenants-batch-delete.js
 */

'use strict';

const path = require('path');

const SUITE = '[check-pebd-s1-purge-e2e-tenants-batch-delete]';
let failures = 0;

function pass(id, msg) {
  console.log(`${SUITE} PASS ${id}: ${msg}`);
}

function fail(id, msg) {
  failures++;
  console.error(`${SUITE} FAIL ${id}: ${msg}`);
}

function freshRequire() {
  const modPath = path.join(__dirname, '..', 'scripts', 'purge-e2e-tenants.js');
  delete require.cache[require.resolve(modPath)];
  return require(modPath);
}

/**
 * A minimal fake db that stores rows per table in-memory and supports both
 * the single-tenant (`= $1`) and batched (`= ANY($1::text[])`) query
 * shapes this script issues -- a self-contained fixture, not a modification
 * of check-alrf-s11's own fixture (which only handles the single-tenant
 * shape).
 */
function makeFakeDb(seedRows) {
  const tables = JSON.parse(JSON.stringify(seedRows));
  const queryLog = [];
  return {
    _tables: tables,
    _queryLog: queryLog,
    query: async function (sql, params) {
      queryLog.push({ sql, params });

      const anyMatch = /FROM (\w+) WHERE (\w+) = ANY\(\$1::text\[\]\)( OR (\w+) = ANY\(\$1::text\[\]\))?/.exec(sql);
      if (anyMatch && /^DELETE/.test(sql)) {
        const table = anyMatch[1];
        const col = anyMatch[2];
        const col2 = anyMatch[4];
        const ids = params[0];
        const before = (tables[table] || []).length;
        tables[table] = (tables[table] || []).filter((r) => {
          const matches = ids.includes(r[col]) || (col2 && ids.includes(r[col2]));
          return !matches;
        });
        return { rowCount: before - tables[table].length };
      }

      const journeyArtefactBatchMatch = /DELETE FROM artefacts WHERE journey_id IN \(SELECT journey_id FROM journeys WHERE tenant_id = ANY\(\$1::text\[\]\)\)/.exec(sql);
      if (journeyArtefactBatchMatch) {
        const ids = params[0];
        const journeyIds = (tables.journeys || []).filter((j) => ids.includes(j.tenant_id)).map((j) => j.journey_id);
        tables.artefacts = (tables.artefacts || []).filter((a) => !journeyIds.includes(a.journey_id));
        return { rowCount: 0 };
      }

      const singleMatch = /FROM (\w+) WHERE (\w+) = \$1( OR (\w+) = \$1)?/.exec(sql);
      if (singleMatch && /^DELETE/.test(sql)) {
        const table = singleMatch[1];
        const col = singleMatch[2];
        const col2 = singleMatch[4];
        const tenantId = params[0];
        const before = (tables[table] || []).length;
        tables[table] = (tables[table] || []).filter((r) => {
          const matches = r[col] === tenantId || (col2 && r[col2] === tenantId);
          return !matches;
        });
        return { rowCount: before - tables[table].length };
      }

      const journeyArtefactSingleMatch = /DELETE FROM artefacts WHERE journey_id IN \(SELECT journey_id FROM journeys WHERE tenant_id = \$1\)/.exec(sql);
      if (journeyArtefactSingleMatch) {
        const tenantId = params[0];
        const journeyIds = (tables.journeys || []).filter((j) => j.tenant_id === tenantId).map((j) => j.journey_id);
        tables.artefacts = (tables.artefacts || []).filter((a) => !journeyIds.includes(a.journey_id));
        return { rowCount: 0 };
      }

      if (/LIKE 'e2e-test-%'/.test(sql)) {
        const likeMatch = /FROM (\w+) WHERE (\w+) LIKE 'e2e-test-%'/.exec(sql);
        const table = likeMatch[1];
        const col = likeMatch[2];
        const rows = (tables[table] || []).filter((r) => String(r[col] || '').indexOf('e2e-test-') === 0);
        return { rows: rows.map((r) => ({ id: r[col] })) };
      }

      return { rows: [], rowCount: 0 };
    }
  };
}

async function test(id, desc, fn) {
  try {
    await fn();
    pass(id, desc);
  } catch (err) {
    fail(id, `${desc} -- ${err.message}`);
  }
}

(async () => {
  // T1 - AC1: purgeTenantsBatch issues 11 queries total for a batch of 3, not 33
  await test('T1', 'purgeTenantsBatch issues exactly 11 queries (one per table) for a 3-tenant batch, not 33', async () => {
    const { purgeTenantsBatch } = freshRequire();
    const db = makeFakeDb({});
    await purgeTenantsBatch(db, ['e2e-test-a@example.test', 'e2e-test-b@example.test', 'e2e-test-c@example.test']);
    const deleteQueries = db._queryLog.filter((q) => /^DELETE/.test(q.sql));
    if (deleteQueries.length !== 11) {
      throw new Error(`expected exactly 11 DELETE queries, got ${deleteQueries.length}`);
    }
    const nonArrayQuery = deleteQueries.find((q) => !Array.isArray(q.params[0]));
    if (nonArrayQuery) {
      throw new Error(`expected every DELETE to use one array parameter, found a non-array param: ${JSON.stringify(nonArrayQuery)}`);
    }
  });

  // T2 - AC1: purgeTenantsBatch removes rows for tenants in the batch, leaves others untouched
  await test('T2', 'purgeTenantsBatch removes rows for batched tenants, leaves a non-batched tenant untouched', async () => {
    const { purgeTenantsBatch } = freshRequire();
    const db = makeFakeDb({
      credits: [
        { tenant_id: 'e2e-test-a@example.test', amount: 10 },
        { tenant_id: 'e2e-test-b@example.test', amount: 20 },
        { tenant_id: 'e2e-test-c@example.test', amount: 30 }
      ]
    });
    await purgeTenantsBatch(db, ['e2e-test-a@example.test', 'e2e-test-b@example.test']);
    const remaining = db._tables.credits;
    if (remaining.length !== 1 || remaining[0].tenant_id !== 'e2e-test-c@example.test') {
      throw new Error(`expected only e2e-test-c to remain, got: ${JSON.stringify(remaining)}`);
    }
  });

  // T3 - AC2: purgeE2eTenants chunks a 450-tenant list into 3 batches (200, 200, 50) at BATCH_SIZE=200
  await test('T3', 'purgeE2eTenants chunks a 450-tenant found list into 3 batches (200/200/50)', async () => {
    const { purgeE2eTenants, BATCH_SIZE, setDbConnection } = freshRequire();
    if (BATCH_SIZE !== 200) {
      throw new Error(`expected BATCH_SIZE to be 200, got ${BATCH_SIZE}`);
    }
    const ids = Array.from({ length: 450 }, (_, i) => `e2e-test-${i}@example.test`);
    const db = makeFakeDb({ users: ids.map((id) => ({ email: id })) });
    setDbConnection(db);
    await purgeE2eTenants(db);
    const anyDeleteQueries = db._queryLog.filter((q) => /^DELETE FROM users WHERE email = ANY/.test(q.sql));
    if (anyDeleteQueries.length !== 3) {
      throw new Error(`expected 3 batched DELETE FROM users calls (one per chunk), got ${anyDeleteQueries.length}`);
    }
    const sizes = anyDeleteQueries.map((q) => q.params[0].length).sort((a, b) => b - a);
    if (sizes[0] !== 200 || sizes[1] !== 200 || sizes[2] !== 50) {
      throw new Error(`expected chunk sizes [200, 200, 50], got ${JSON.stringify(sizes)}`);
    }
  });

  // T4 - AC2: purgeE2eTenants's own return shape is unchanged regardless of batching internals
  await test('T4', "purgeE2eTenants's own return shape (tenantCount, tenantIds) is correct whether 1 or 450 tenants are found", async () => {
    const { purgeE2eTenants } = freshRequire();
    const ids = Array.from({ length: 450 }, (_, i) => `e2e-test-${i}@example.test`);
    const db = makeFakeDb({ users: ids.map((id) => ({ email: id })) });
    const summary = await purgeE2eTenants(db);
    if (summary.tenantCount !== 450 || summary.tenantIds.length !== 450) {
      throw new Error(`expected tenantCount/tenantIds.length of 450, got ${JSON.stringify({ tenantCount: summary.tenantCount, idsLength: summary.tenantIds.length })}`);
    }
  });

  // T5 - AC3: purgeTenant (single-tenant) is unchanged and still works
  await test('T5', 'purgeTenant (single-tenant) still exists, still exported, still works correctly', async () => {
    const { purgeTenant } = freshRequire();
    const db = makeFakeDb({
      credits: [
        { tenant_id: 'e2e-test-a@example.test', amount: 10 },
        { tenant_id: 'e2e-test-b@example.test', amount: 20 }
      ]
    });
    await purgeTenant(db, 'e2e-test-a@example.test');
    const remaining = db._tables.credits;
    if (remaining.length !== 1 || remaining[0].tenant_id !== 'e2e-test-b@example.test') {
      throw new Error(`expected only e2e-test-b to remain, got: ${JSON.stringify(remaining)}`);
    }
  });

  console.log(`${SUITE} ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`}`);
  process.exit(failures === 0 ? 0 : 1);
})();
