'use strict';

/**
 * b3-staging-test-data-cleanup — Integration tests for
 * scripts/cleanup-e2e-staging-data.js
 *
 * No real Neon/Postgres/Stripe connection is made anywhere in this file —
 * both the DB and Stripe adapters are D37-injectable, and this file's own
 * in-memory mock adapters simulate just enough of Postgres/Stripe's
 * behaviour to exercise the script's real eligibility/deletion logic.
 *
 * Reference: artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/b3-staging-test-data-cleanup-test-plan.md
 * Story:     artefacts/2026-07-23-e2e-core-journey-coverage/stories/b3-staging-test-data-cleanup.md
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

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

const {
  run,
  isTaggedForE2E,
  findEligibleUsers,
  findEligibleProducts,
  findEligibleStripeCustomers,
  findEligibleJourneys,
  findEligibleCreditsRows,
  findEligibleTenantPlanRows,
  findEligibleUserRolesRows,
  TAG_PREFIX
} = require(path.join(__dirname, '..', 'scripts', 'cleanup-e2e-staging-data.js'));

// ---------------------------------------------------------------------------
// Mock Postgres adapter — in-memory tables + minimal SQL pattern matching,
// enough to exercise the script's real SELECT/DELETE statements.
// ---------------------------------------------------------------------------
function createMockDb(seed) {
  const tables = {
    users: (seed.users || []).map(function(u) { return Object.assign({}, u); }),
    products: (seed.products || []).map(function(p) { return Object.assign({}, p); }),
    journeys: (seed.journeys || []).map(function(j) { return Object.assign({}, j); }),
    artefacts: (seed.artefacts || []).map(function(a) { return Object.assign({}, a); }),
    credits: (seed.credits || []).map(function(c) { return Object.assign({}, c); }),
    tenant_plan: (seed.tenant_plan || []).map(function(t) { return Object.assign({}, t); }),
    user_roles: (seed.user_roles || []).map(function(u) { return Object.assign({}, u); })
  };
  const deletions = [];

  async function query(sql, params) {
    const s = sql.replace(/\s+/g, ' ').trim();

    if (/^SELECT id, email, created_at FROM users WHERE created_at < \$1$/i.test(s)) {
      const cutoff = new Date(params[0]);
      return { rows: tables.users.filter(function(u) { return new Date(u.created_at) < cutoff; }) };
    }
    if (/^SELECT product_id, tenant_id, name, created_at FROM products WHERE created_at < \$1$/i.test(s)) {
      const cutoff = new Date(params[0]);
      return { rows: tables.products.filter(function(p) { return new Date(p.created_at) < cutoff; }) };
    }
    // b3x-s1 — journeys, direct by tenant_id (not just via a matched product's cascade)
    if (/^SELECT journey_id, tenant_id, created_at FROM journeys WHERE created_at < \$1$/i.test(s)) {
      const cutoff = new Date(params[0]);
      return { rows: tables.journeys.filter(function(j) { return new Date(j.created_at) < cutoff; }) };
    }
    // b3x-s1 — credits/tenant_plan/user_roles: no created_at, no age filter in the SQL itself
    if (/^SELECT tenant_id, updated_at FROM credits$/i.test(s)) {
      return { rows: tables.credits.slice() };
    }
    if (/^SELECT tenant_id, updated_at FROM tenant_plan$/i.test(s)) {
      return { rows: tables.tenant_plan.slice() };
    }
    if (/^SELECT tenant_id, role FROM user_roles$/i.test(s)) {
      return { rows: tables.user_roles.slice() };
    }
    if (/^DELETE FROM users WHERE id = \$1$/i.test(s)) {
      deletions.push({ table: 'users', id: params[0] });
      tables.users = tables.users.filter(function(u) { return u.id !== params[0]; });
      return { rowCount: 1 };
    }
    if (/^DELETE FROM products WHERE product_id = \$1$/i.test(s)) {
      deletions.push({ table: 'products', id: params[0] });
      tables.products = tables.products.filter(function(p) { return p.product_id !== params[0]; });
      return { rowCount: 1 };
    }
    if (/^DELETE FROM journeys WHERE product_id = \$1$/i.test(s)) {
      deletions.push({ table: 'journeys', productId: params[0] });
      tables.journeys = tables.journeys.filter(function(j) { return j.product_id !== params[0]; });
      return { rowCount: 0 };
    }
    // b3x-s1 — the new direct-by-journey_id deletion path (artefacts before journeys)
    if (/^DELETE FROM artefacts WHERE journey_id = \$1$/i.test(s)) {
      deletions.push({ table: 'artefacts', journeyId: params[0] });
      tables.artefacts = tables.artefacts.filter(function(a) { return a.journey_id !== params[0]; });
      return { rowCount: 0 };
    }
    if (/^DELETE FROM journeys WHERE journey_id = \$1$/i.test(s)) {
      deletions.push({ table: 'journeys', journeyId: params[0] });
      tables.journeys = tables.journeys.filter(function(j) { return j.journey_id !== params[0]; });
      return { rowCount: 0 };
    }
    if (/^DELETE FROM credits WHERE tenant_id = \$1$/i.test(s)) {
      deletions.push({ table: 'credits', tenantId: params[0] });
      tables.credits = tables.credits.filter(function(c) { return c.tenant_id !== params[0]; });
      return { rowCount: 0 };
    }
    if (/^DELETE FROM tenant_plan WHERE tenant_id = \$1$/i.test(s)) {
      deletions.push({ table: 'tenant_plan', tenantId: params[0] });
      tables.tenant_plan = tables.tenant_plan.filter(function(t) { return t.tenant_id !== params[0]; });
      return { rowCount: 0 };
    }
    if (/^DELETE FROM user_roles WHERE tenant_id = \$1$/i.test(s)) {
      deletions.push({ table: 'user_roles', tenantId: params[0] });
      tables.user_roles = tables.user_roles.filter(function(u) { return u.tenant_id !== params[0]; });
      return { rowCount: 0 };
    }
    throw new Error('Unhandled mock query: ' + s);
  }

  return {
    query: query,
    get deletions() { return deletions.slice(); },
    get remaining() { return JSON.parse(JSON.stringify(tables)); }
  };
}

// ---------------------------------------------------------------------------
// Mock Stripe adapter — single-page customers.list + customers.del.
// ---------------------------------------------------------------------------
function createMockStripe(customers) {
  let list = customers.map(function(c) { return Object.assign({}, c); });
  const deletedIds = [];
  return {
    customers: {
      list: async function() { return { data: list, has_more: false }; },
      del: async function(id) {
        deletedIds.push(id);
        list = list.filter(function(c) { return c.id !== id; });
        return { id: id, deleted: true };
      }
    },
    get deletedIds() { return deletedIds.slice(); },
    get remaining() { return list.slice(); }
  };
}

function daysAgoIso(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function daysAgoUnixSeconds(days) {
  return Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
}

async function runTests() {
  // -------------------------------------------------------------------------
  // AC2 unit checks on the strict allowlist matcher itself
  // -------------------------------------------------------------------------
  test('AC2: isTaggedForE2E matches the exact prefix', () => {
    assert.strictEqual(isTaggedForE2E('e2e-test-abc123'), true);
    assert.strictEqual(isTaggedForE2E(TAG_PREFIX + 'anything'), true);
  });

  test('AC2: isTaggedForE2E rejects a value that merely contains the prefix (not anchored at start)', () => {
    assert.strictEqual(isTaggedForE2E('faketest-e2e-test-lookalike'), false);
    assert.strictEqual(isTaggedForE2E('my-e2e-test-thing'), false);
  });

  test('AC2: isTaggedForE2E rejects case-mismatched, non-string, and empty values', () => {
    assert.strictEqual(isTaggedForE2E('E2E-TEST-abc'), false);
    assert.strictEqual(isTaggedForE2E(''), false);
    assert.strictEqual(isTaggedForE2E(null), false);
    assert.strictEqual(isTaggedForE2E(undefined), false);
    assert.strictEqual(isTaggedForE2E(12345), false);
  });

  // -------------------------------------------------------------------------
  // AC1 — old tagged records removed; recent tagged + all non-tagged kept
  // -------------------------------------------------------------------------
  await testAsync('AC1: run() removes old e2e-test--tagged users/products/Stripe customers, keeps recent-tagged and all non-tagged', async () => {
    const seedDb = {
      users: [
        { id: 'u-old-tagged', email: 'e2e-test-old@wuce-staging.test', created_at: daysAgoIso(10) },
        { id: 'u-recent-tagged', email: 'e2e-test-recent@wuce-staging.test', created_at: daysAgoIso(1) },
        { id: 'u-real', email: 'hamish@example.com', created_at: daysAgoIso(10) }
      ],
      products: [
        { product_id: 'p-old-tagged', tenant_id: 'e2e-test-old@wuce-staging.test', name: 'e2e-test-old-product', created_at: daysAgoIso(10) },
        { product_id: 'p-recent-tagged', tenant_id: 'e2e-test-recent@wuce-staging.test', name: 'e2e-test-recent-product', created_at: daysAgoIso(1) },
        { product_id: 'p-real', tenant_id: 'hamish@example.com', name: 'Real Product', created_at: daysAgoIso(10) }
      ]
    };
    const db = createMockDb(seedDb);
    const stripe = createMockStripe([
      { id: 'cus-old-tagged', email: 'e2e-test-old@wuce-staging.test', created: daysAgoUnixSeconds(10) },
      { id: 'cus-recent-tagged', email: 'e2e-test-recent@wuce-staging.test', created: daysAgoUnixSeconds(1) },
      { id: 'cus-real', email: 'hamish@example.com', created: daysAgoUnixSeconds(10) }
    ]);

    const summary = await run({ db, stripe, dryRun: false, retentionDays: 7 });

    assert.strictEqual(summary.deleted.users.length, 1, 'expected exactly 1 user deleted');
    assert.strictEqual(summary.deleted.users[0].id, 'u-old-tagged');
    assert.strictEqual(summary.deleted.products.length, 1, 'expected exactly 1 product deleted');
    assert.strictEqual(summary.deleted.products[0].id, 'p-old-tagged');
    assert.strictEqual(summary.deleted.stripeCustomers.length, 1, 'expected exactly 1 Stripe customer deleted');
    assert.strictEqual(summary.deleted.stripeCustomers[0].id, 'cus-old-tagged');

    const remainingUserIds = db.remaining.users.map(function(u) { return u.id; });
    assert.deepStrictEqual(remainingUserIds.sort(), ['u-real', 'u-recent-tagged'].sort());

    const remainingProductIds = db.remaining.products.map(function(p) { return p.product_id; });
    assert.deepStrictEqual(remainingProductIds.sort(), ['p-real', 'p-recent-tagged'].sort());

    const remainingCustomerIds = stripe.remaining.map(function(c) { return c.id; });
    assert.deepStrictEqual(remainingCustomerIds.sort(), ['cus-real', 'cus-recent-tagged'].sort());
  });

  await testAsync('AC1: deleting an old tagged product also removes its journeys rows (no orphans)', async () => {
    const seedDb = {
      products: [
        { product_id: 'p-old-tagged', tenant_id: 'e2e-test-old@wuce-staging.test', name: 'e2e-test-old-product', created_at: daysAgoIso(10) }
      ],
      journeys: [{ journey_id: 'j1', product_id: 'p-old-tagged' }]
    };
    const db = createMockDb(seedDb);
    await run({ db, skipStripe: true, dryRun: false, retentionDays: 7 });

    assert.strictEqual(db.remaining.journeys.length, 0, 'expected orphaned journeys row to be cleaned up');
  });

  // -------------------------------------------------------------------------
  // AC2 — a non-tagged record resembling test data is never deleted
  // -------------------------------------------------------------------------
  await testAsync('AC2: an old, untagged record that superficially resembles test data is never deleted', async () => {
    const seedDb = {
      users: [
        // Old, contains "test" and even contains the e2e-test- substring, but
        // does NOT start with it -- must survive.
        { id: 'u-lookalike', email: 'faketest-e2e-test-lookalike@wuce-staging.test', created_at: daysAgoIso(30) },
        { id: 'u-manual', email: 'hamish-manual-testing@example.com', created_at: daysAgoIso(30) }
      ],
      products: [
        { product_id: 'p-lookalike', tenant_id: 'hamish-manual-testing@example.com', name: 'my-e2e-test-lookalike-product', created_at: daysAgoIso(30) }
      ]
    };
    const db = createMockDb(seedDb);
    const stripe = createMockStripe([
      { id: 'cus-lookalike', email: 'faketest-e2e-test-lookalike@wuce-staging.test', created: daysAgoUnixSeconds(30) }
    ]);

    const summary = await run({ db, stripe, dryRun: false, retentionDays: 7 });

    assert.strictEqual(summary.deleted.users.length, 0, 'no user should have been deleted');
    assert.strictEqual(summary.deleted.products.length, 0, 'no product should have been deleted');
    assert.strictEqual(summary.deleted.stripeCustomers.length, 0, 'no Stripe customer should have been deleted');
    assert.strictEqual(db.remaining.users.length, 2);
    assert.strictEqual(db.remaining.products.length, 1);
    assert.strictEqual(stripe.remaining.length, 1);
  });

  // -------------------------------------------------------------------------
  // Dry-run default safety
  // -------------------------------------------------------------------------
  await testAsync('Dry-run is the default: run() with no dryRun option deletes nothing but reports what is eligible', async () => {
    const seedDb = {
      users: [{ id: 'u-old-tagged', email: 'e2e-test-old@wuce-staging.test', created_at: daysAgoIso(10) }]
    };
    const db = createMockDb(seedDb);
    const summary = await run({ db, skipStripe: true, retentionDays: 7 });

    assert.strictEqual(summary.dryRun, true);
    assert.strictEqual(summary.eligible.users.length, 1, 'expected the old tagged user to be reported as eligible');
    assert.strictEqual(summary.deleted.users.length, 0, 'dry-run must not actually delete anything');
    assert.strictEqual(db.remaining.users.length, 1, 'record must still exist after a dry-run');
    assert.strictEqual(db.deletions.length, 0, 'no DELETE statement should have been issued during a dry-run');
  });

  // -------------------------------------------------------------------------
  // NFR-Security — least-privilege / explicit-wiring posture (D37)
  // -------------------------------------------------------------------------
  await testAsync('NFR-Security: run() throws rather than silently no-opping when no DB adapter is wired', async () => {
    let caught = null;
    try {
      await run({ skipStripe: true });
    } catch (err) {
      caught = err;
    }
    assert.ok(caught, 'expected run() to throw when no DB adapter is wired');
    assert.ok(/Adapter not wired: dbConnection/.test(caught.message), `expected a D37-style adapter-not-wired message, got: ${caught.message}`);
  });

  await testAsync('NFR-Security: run() throws rather than silently no-opping when Stripe cleanup is requested but no Stripe adapter is wired', async () => {
    const db = createMockDb({});
    let caught = null;
    try {
      await run({ db }); // skipStripe not set -- Stripe cleanup implicitly requested
    } catch (err) {
      caught = err;
    }
    assert.ok(caught, 'expected run() to throw when Stripe cleanup is requested with no adapter wired');
    assert.ok(/Adapter not wired: stripeClient/.test(caught.message), `expected a D37-style adapter-not-wired message, got: ${caught.message}`);
  });

  // -------------------------------------------------------------------------
  // NFR-Audit — one log entry per deleted record (record type, id, createdAt)
  // -------------------------------------------------------------------------
  await testAsync('NFR-Audit: every deleted record is logged with record type, id, and creation timestamp', async () => {
    const seedDb = {
      users: [{ id: 'u-old-tagged', email: 'e2e-test-old@wuce-staging.test', created_at: daysAgoIso(10) }],
      products: [{ product_id: 'p-old-tagged', tenant_id: 'e2e-test-old@wuce-staging.test', name: 'e2e-test-old-product', created_at: daysAgoIso(10) }]
    };
    const db = createMockDb(seedDb);
    const stripe = createMockStripe([{ id: 'cus-old-tagged', email: 'e2e-test-old@wuce-staging.test', created: daysAgoUnixSeconds(10) }]);

    const originalLog = console.log;
    const logLines = [];
    console.log = function(line) { logLines.push(line); };
    let summary;
    try {
      summary = await run({ db, stripe, dryRun: false, retentionDays: 7 });
    } finally {
      console.log = originalLog;
    }

    const allDeleted = [].concat(summary.deleted.users, summary.deleted.products, summary.deleted.stripeCustomers);
    assert.strictEqual(allDeleted.length, 3, 'expected 3 deleted records total across users/products/stripeCustomers');
    for (const record of allDeleted) {
      assert.ok(record.recordType, 'deleted record missing recordType');
      assert.ok(record.id, 'deleted record missing id');
      assert.ok(record.createdAt, 'deleted record missing createdAt');
    }
    const deletionLogLines = logLines.filter(function(l) { return /Deleted (user|product|stripeCustomer) id=/.test(l); });
    assert.strictEqual(deletionLogLines.length, 3, `expected 3 audit log lines, got ${deletionLogLines.length}: ${JSON.stringify(logLines)}`);
  });

  // -------------------------------------------------------------------------
  // AC3 — decisions.md's RISK entry reflects the implemented mechanism
  // -------------------------------------------------------------------------
  test('AC3: decisions.md "Staging test-data accumulation" RISK entry confirms the mechanism is implemented and running', () => {
    const decisionsPath = path.join(__dirname, '..', 'artefacts', '2026-07-23-e2e-core-journey-coverage', 'decisions.md');
    const content = fs.readFileSync(decisionsPath, 'utf8');

    const startMarker = '## RISK — Staging test-data accumulation';
    const startIdx = content.indexOf(startMarker);
    assert.ok(startIdx !== -1, 'expected to find the "Staging test-data accumulation" RISK entry heading');
    const nextHeadingIdx = content.indexOf('\n## ', startIdx + startMarker.length);
    const section = nextHeadingIdx === -1 ? content.slice(startIdx) : content.slice(startIdx, nextHeadingIdx);

    assert.ok(
      /implement/i.test(section) && /(running|closed|resolved)/i.test(section),
      'expected the section to confirm the mechanism is implemented and running/closed'
    );
    assert.ok(
      !/tracked, not yet resolved/i.test(section),
      'the "Staging test-data accumulation" entry must no longer read as an open/tracked-not-yet-resolved decision'
    );
    assert.ok(
      section.indexOf('scripts/cleanup-e2e-staging-data.js') !== -1,
      'expected the entry to name the actual script file that implements the mechanism'
    );
  });

  // -------------------------------------------------------------------------
  // b3x-s1 — AC1: new @example.test suffix pattern matches
  // -------------------------------------------------------------------------
  test('AC1 (b3x-s1): isTaggedForE2E matches the @example.test suffix alongside the existing prefix', () => {
    assert.strictEqual(isTaggedForE2E('bri-s3-2-1784957724823-344530@example.test'), true);
  });

  // -------------------------------------------------------------------------
  // b3x-s1 — AC3: tenant-less journey (+ its artefacts) deleted
  // -------------------------------------------------------------------------
  await testAsync('AC3 (b3x-s1): run() deletes an old tagged tenant-less journey and its artefacts', async () => {
    const seedDb = {
      journeys: [
        { journey_id: 'j-old-tagged', tenant_id: 'e2e-test-old@wuce-staging.test', created_at: daysAgoIso(10) }
      ],
      artefacts: [
        { artefact_id: 'a1', journey_id: 'j-old-tagged' }
      ]
    };
    const db = createMockDb(seedDb);
    await run({ db, skipStripe: true, dryRun: false, retentionDays: 7 });

    assert.strictEqual(db.remaining.journeys.length, 0, 'expected the tenant-less journey to be deleted');
    assert.strictEqual(db.remaining.artefacts.length, 0, 'expected the journey\'s artefacts row to be deleted');

    const artefactDeleteIdx = db.deletions.findIndex(function(d) { return d.table === 'artefacts'; });
    const journeyDeleteIdx = db.deletions.findIndex(function(d) { return d.table === 'journeys' && d.journeyId === 'j-old-tagged'; });
    assert.ok(artefactDeleteIdx !== -1 && journeyDeleteIdx !== -1, 'expected both an artefacts and a journeys delete to be recorded');
    assert.ok(artefactDeleteIdx < journeyDeleteIdx, 'expected artefacts to be deleted before the journey (FK ordering)');
  });

  // -------------------------------------------------------------------------
  // b3x-s1 — AC4: credits/tenant_plan/user_roles rows deleted
  // -------------------------------------------------------------------------
  await testAsync('AC4 (b3x-s1): run() deletes old tagged credits/tenant_plan/user_roles rows', async () => {
    const seedDb = {
      credits: [{ tenant_id: 'e2e-test-old@wuce-staging.test', updated_at: daysAgoIso(10) }],
      tenant_plan: [{ tenant_id: 'e2e-test-old@wuce-staging.test', updated_at: daysAgoIso(10) }],
      user_roles: [{ tenant_id: 'e2e-test-old@wuce-staging.test', role: 'owner' }]
    };
    const db = createMockDb(seedDb);
    await run({ db, skipStripe: true, dryRun: false, retentionDays: 7 });

    assert.strictEqual(db.remaining.credits.length, 0, 'expected the tagged credits row to be deleted');
    assert.strictEqual(db.remaining.tenant_plan.length, 0, 'expected the tagged tenant_plan row to be deleted');
    assert.strictEqual(db.remaining.user_roles.length, 0, 'expected the tagged user_roles row to be deleted');
  });

  // -------------------------------------------------------------------------
  // b3x-s1 — AC5: real (non-tagged) rows never touched, any new table
  // -------------------------------------------------------------------------
  await testAsync('AC5 (b3x-s1): run() never deletes real, non-tagged rows in any newly-covered table', async () => {
    const seedDb = {
      journeys: [
        { journey_id: 'j-old-tagged', tenant_id: 'e2e-test-old@wuce-staging.test', created_at: daysAgoIso(10) },
        { journey_id: 'j-real', tenant_id: 'hamish@example.com', created_at: daysAgoIso(10) }
      ],
      credits: [
        { tenant_id: 'e2e-test-old@wuce-staging.test', updated_at: daysAgoIso(10) },
        { tenant_id: 'hamish@example.com', updated_at: daysAgoIso(10) }
      ],
      tenant_plan: [
        { tenant_id: 'e2e-test-old@wuce-staging.test', updated_at: daysAgoIso(10) },
        { tenant_id: 'hamish@example.com', updated_at: daysAgoIso(10) }
      ],
      user_roles: [
        { tenant_id: 'e2e-test-old@wuce-staging.test', role: 'owner' },
        { tenant_id: 'hamish@example.com', role: 'owner' }
      ]
    };
    const db = createMockDb(seedDb);
    await run({ db, skipStripe: true, dryRun: false, retentionDays: 7 });

    const remainingJourneyTenants = db.remaining.journeys.map(function(j) { return j.tenant_id; });
    assert.deepStrictEqual(remainingJourneyTenants, ['hamish@example.com']);
    const remainingCreditsTenants = db.remaining.credits.map(function(c) { return c.tenant_id; });
    assert.deepStrictEqual(remainingCreditsTenants, ['hamish@example.com']);
    const remainingTenantPlanTenants = db.remaining.tenant_plan.map(function(t) { return t.tenant_id; });
    assert.deepStrictEqual(remainingTenantPlanTenants, ['hamish@example.com']);
    const remainingUserRolesTenants = db.remaining.user_roles.map(function(u) { return u.tenant_id; });
    assert.deepStrictEqual(remainingUserRolesTenants, ['hamish@example.com']);
  });

  // -------------------------------------------------------------------------
  // b3x-s1 — AC6: dry-run reports new tables, makes zero new-table writes
  // -------------------------------------------------------------------------
  await testAsync('AC6 (b3x-s1): dry-run reports eligible rows in new tables but writes nothing to them', async () => {
    const seedDb = {
      journeys: [
        { journey_id: 'j-old-tagged', tenant_id: 'e2e-test-old@wuce-staging.test', created_at: daysAgoIso(10) }
      ],
      artefacts: [
        { artefact_id: 'a1', journey_id: 'j-old-tagged' }
      ],
      credits: [{ tenant_id: 'e2e-test-old@wuce-staging.test', updated_at: daysAgoIso(10) }],
      tenant_plan: [{ tenant_id: 'e2e-test-old@wuce-staging.test', updated_at: daysAgoIso(10) }],
      user_roles: [{ tenant_id: 'e2e-test-old@wuce-staging.test', role: 'owner' }]
    };
    const db = createMockDb(seedDb);
    const summary = await run({ db, skipStripe: true, retentionDays: 7 });

    assert.strictEqual(summary.dryRun, true);
    assert.strictEqual(summary.eligible.journeys.length, 1, 'expected the tagged journey reported as eligible');
    assert.strictEqual(summary.eligible.creditsRows.length, 1, 'expected the tagged credits row reported as eligible');
    assert.strictEqual(summary.eligible.tenantPlanRows.length, 1, 'expected the tagged tenant_plan row reported as eligible');
    assert.strictEqual(summary.eligible.userRolesRows.length, 1, 'expected the tagged user_roles row reported as eligible');

    assert.strictEqual(db.remaining.journeys.length, 1, 'dry-run must not delete the journey');
    assert.strictEqual(db.remaining.artefacts.length, 1, 'dry-run must not delete the artefacts row');
    assert.strictEqual(db.remaining.credits.length, 1, 'dry-run must not delete the credits row');
    assert.strictEqual(db.remaining.tenant_plan.length, 1, 'dry-run must not delete the tenant_plan row');
    assert.strictEqual(db.remaining.user_roles.length, 1, 'dry-run must not delete the user_roles row');

    const newTableDeletes = db.deletions.filter(function(d) {
      return ['journeys', 'artefacts', 'credits', 'tenant_plan', 'user_roles'].indexOf(d.table) !== -1;
    });
    assert.strictEqual(newTableDeletes.length, 0, 'dry-run must issue zero DELETE statements against any newly-covered table');
  });

  console.log(`\n[check-b3-cleanup-script] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests();
