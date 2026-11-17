'use strict';
// lpw-s1 T1 (AC1) -- the fake test database answers the customer_journeys / customer_journey_stages
// query shapes that routes/journeys.js issues. Plain Node script. Run: node tests/check-lpw-s1-fake-db-journeys.js
// Story: artefacts/2026-11-17-local-playwright-suite-trust/stories/lpw-s1-make-the-local-playwright-suite-trustworthy.md
// Test plan: artefacts/2026-11-17-local-playwright-suite-trust/test-plans/lpw-s1-test-plan.md

const assert = require('assert');
const path = require('path');
const { createFakeTestDb } = require(path.resolve(__dirname, '..', 'src', 'web-ui', 'adapters', 'fake-test-db'));

const T1 = 'tenant-1';
const T2 = 'tenant-2';
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

async function newJourney(db, tenant, name) {
  const r = await db.query(
    `INSERT INTO customer_journeys (tenant_id, name, description, product_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [tenant, name || 'j', null, null]
  );
  return r.rows[0].id;
}
async function addStage(db, journeyId, tenant, name, position) {
  await db.query(
    `INSERT INTO customer_journey_stages (journey_id, tenant_id, name, position)
     VALUES ($1, $2, $3, $4)`,
    [journeyId, tenant, name, position]
  );
}
async function stageIds(db, journeyId) {
  const r = await db.query('SELECT id FROM customer_journey_stages WHERE journey_id = $1', [journeyId]);
  return r.rows.map(function (x) { return x.id; });
}

test('T1a inserting a journey returns an id, and it can be read back by id and tenant', async function () {
  const db = createFakeTestDb();
  const id = await newJourney(db, T1, 'First');
  assert.ok(id, 'insert returned no id (the handler reads r.rows[0].id)');
  const mine = await db.query('SELECT id FROM customer_journeys WHERE id = $1 AND tenant_id = $2', [id, T1]);
  assert.strictEqual(mine.rows.length, 1);
  const other = await db.query('SELECT id FROM customer_journeys WHERE id = $1 AND tenant_id = $2', [id, T2]);
  assert.strictEqual(other.rows.length, 0, 'a second tenant must not see the first tenant\'s journey');
});

test('T1b stages append with the next position, and the canvas query returns them in position order', async function () {
  const db = createFakeTestDb();
  const j = await newJourney(db, T1);
  const empty = await db.query('SELECT COALESCE(MAX(position), -1) AS max_position FROM customer_journey_stages WHERE journey_id = $1', [j]);
  assert.strictEqual(Number(empty.rows[0].max_position), -1);
  await addStage(db, j, T1, 'Evaluate', 0);
  await addStage(db, j, T1, 'Discover', 1);
  await addStage(db, j, T1, 'Purchase', 2);
  const max = await db.query('SELECT COALESCE(MAX(position), -1) AS max_position FROM customer_journey_stages WHERE journey_id = $1', [j]);
  assert.strictEqual(Number(max.rows[0].max_position), 2);
  const canvas = await db.query(
    `SELECT id, name, position, description, customer_actions, touchpoints, channel, emotion, pain_points, opportunities, moment_of_truth, position_x, position_y
     FROM customer_journey_stages WHERE journey_id = $1 ORDER BY position ASC`,
    [j]
  );
  assert.deepStrictEqual(canvas.rows.map(function (r) { return r.name; }), ['Evaluate', 'Discover', 'Purchase']);
});

test('T1c reordering rewrites positions inside a client transaction and the new order is returned', async function () {
  const db = createFakeTestDb();
  const j = await newJourney(db, T1);
  await addStage(db, j, T1, 'A', 0);
  await addStage(db, j, T1, 'B', 1);
  await addStage(db, j, T1, 'C', 2);
  const ids = await stageIds(db, j);
  const reversed = ids.slice().reverse();
  const client = await db.connect();
  await client.query('BEGIN');
  for (let i = 0; i < reversed.length; i++) {
    await client.query('UPDATE customer_journey_stages SET position = $1, updated_at = NOW() WHERE id = $2 AND journey_id = $3 AND tenant_id = $4', [i, reversed[i], j, T1]);
  }
  await client.query('COMMIT');
  client.release();
  const after = await db.query('SELECT id, name, position FROM customer_journey_stages WHERE journey_id = $1 ORDER BY position ASC', [j]);
  assert.deepStrictEqual(after.rows.map(function (r) { return r.name; }), ['C', 'B', 'A']);
});

test('T1d a stage can be renamed, positioned on the canvas, and owner-checked through the join', async function () {
  const db = createFakeTestDb();
  const j = await newJourney(db, T1);
  await addStage(db, j, T1, 'Old', 0);
  const [s] = await stageIds(db, j);
  await db.query('UPDATE customer_journey_stages SET name = $1, updated_at = NOW() WHERE id = $2 AND journey_id = $3 AND tenant_id = $4', ['New', s, j, T1]);
  await db.query('UPDATE customer_journey_stages SET position_x = $1, position_y = $2, updated_at = NOW() WHERE id = $3', [120, 40, s]);
  const own = await db.query(
    `SELECT cjs.id FROM customer_journey_stages cjs
     JOIN customer_journeys cj ON cjs.journey_id = cj.id
     WHERE cjs.id = $1 AND cjs.journey_id = $2 AND cj.tenant_id = $3`,
    [s, j, T1]
  );
  assert.strictEqual(own.rows.length, 1);
  const cross = await db.query(
    `SELECT cjs.id FROM customer_journey_stages cjs
     JOIN customer_journeys cj ON cjs.journey_id = cj.id
     WHERE cjs.id = $1 AND cjs.journey_id = $2 AND cj.tenant_id = $3`,
    [s, j, T2]
  );
  assert.strictEqual(cross.rows.length, 0, 'cross-tenant stage must not match');
  const canvas = await db.query('SELECT id, name, position, position_x, position_y FROM customer_journey_stages WHERE journey_id = $1 ORDER BY position ASC', [j]);
  assert.strictEqual(canvas.rows[0].name, 'New');
  assert.strictEqual(Number(canvas.rows[0].position_x), 120);
  assert.strictEqual(Number(canvas.rows[0].position_y), 40);
});

test('T1e the persona update and the journey list with stage counts work', async function () {
  const db = createFakeTestDb();
  const j = await newJourney(db, T1, 'Listed');
  await addStage(db, j, T1, 'A', 0);
  await addStage(db, j, T1, 'B', 1);
  await db.query('UPDATE customer_journeys SET persona_name = $1, persona_role = $2, persona_goal = $3 WHERE id = $4', ['Sam', 'Buyer', 'Buy', j]);
  const detail = await db.query('SELECT id, name, description, product_id, persona_name, persona_role, persona_goal FROM customer_journeys WHERE id = $1 AND tenant_id = $2', [j, T1]);
  assert.strictEqual(detail.rows[0].persona_name, 'Sam');
  const list = await db.query(
    `SELECT cj.id, cj.name, cj.description, cj.product_id, p.name AS product_name
     FROM customer_journeys cj
     LEFT JOIN products p ON cj.product_id = p.product_id
     WHERE cj.tenant_id = $1
     ORDER BY cj.created_at DESC`,
    [T1]
  );
  assert.strictEqual(list.rows.length, 1);
  assert.strictEqual(list.rows[0].name, 'Listed');
  const counts = await db.query('SELECT journey_id, COUNT(*) AS stage_count FROM customer_journey_stages WHERE journey_id = ANY($1) GROUP BY journey_id', [[j]]);
  assert.strictEqual(Number(counts.rows[0].stage_count), 2);
  const otherTenantList = await db.query(
    `SELECT cj.id, cj.name, cj.description, cj.product_id, p.name AS product_name
     FROM customer_journeys cj
     LEFT JOIN products p ON cj.product_id = p.product_id
     WHERE cj.tenant_id = $1
     ORDER BY cj.created_at DESC`,
    [T2]
  );
  assert.strictEqual(otherTenantList.rows.length, 0);
});

test('T1f the first journey of a product is found by product id, oldest first', async function () {
  const db = createFakeTestDb();
  const none = await db.query('SELECT id FROM customer_journeys WHERE product_id = $1 ORDER BY created_at ASC LIMIT 1', ['p1']);
  assert.strictEqual(none.rows.length, 0);
  const first = (await db.query('INSERT INTO customer_journeys (tenant_id, name, description, product_id) VALUES ($1, $2, $3, $4) RETURNING id', [T1, 'one', null, 'p1'])).rows[0].id;
  await db.query('INSERT INTO customer_journeys (tenant_id, name, description, product_id) VALUES ($1, $2, $3, $4) RETURNING id', [T1, 'two', null, 'p1']);
  const found = await db.query('SELECT id FROM customer_journeys WHERE product_id = $1 ORDER BY created_at ASC LIMIT 1', ['p1']);
  assert.strictEqual(found.rows.length, 1);
  assert.strictEqual(found.rows[0].id, first);
});

(async function () {
  let passed = 0; let failed = 0;
  for (const t of tests) {
    try { await t.fn(); console.log('[lpw-s1] PASS: ' + t.name); passed++; }
    catch (e) { console.error('[lpw-s1] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
  }
  console.log('\n[lpw-s1] ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
