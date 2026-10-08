'use strict';
// check-ep1-s1-journey-create.js -- AC verification for ep1-s1 (database
// migration: create journey entity -- POST route, Postgres insert, and
// journey canvas shell -- see
// artefacts/2026-10-05-customer-journey-as-first-class/). cj-ep1-s1: not to
// be confused with the unrelated migratePodsSchema "ep1-s1" elsewhere in
// server.js, a completely different feature that reuses the same generic
// story-slug shorthand.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

function makeMockPool(existingJourneys) {
  return {
    _ops: [],
    query: async function(sql, params) {
      this._ops.push({ sql, params });
      if (/INSERT INTO customer_journeys/i.test(sql)) {
        return { rows: [{ id: 'new-journey-id' }] };
      }
      if (/SELECT.*FROM customer_journeys WHERE id/i.test(sql)) {
        const id = params && params[0];
        const tid = params && params[1];
        const found = (existingJourneys || []).find(j => j.id === id && j.tenant_id === tid);
        return { rows: found ? [found] : [] };
      }
      return { rows: [] };
    }
  };
}

// jcg-s1 -- mock res now also carries writeHead/end (the pair csrfGuard's
// own 403 path uses), alongside the existing status/json test-mock interface.
function makeMockRes() {
  return {
    status: function(c) { this._s = c; return this; },
    json: function(b) { this._b = b; },
    writeHead: function(c, headers) { this._s = c; this._headers = headers; },
    end: function(b) { this._b = b; },
    _s: 200, _b: null, _headers: null
  };
}

// jcg-s1 -- a valid session/_csrf pair, matching csrfGuard's own
// body._csrf === req.session.csrfToken check.
const REAL_CSRF = 'jcg-s1-real-token';

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  const { handlePostJourneys, handleGetJourneyCanvas } = require('../src/web-ui/routes/journeys');

  // jcg-s1 AC1 — no/mismatched CSRF token is rejected with 403, no insert
  try {
    const pool = makeMockPool([]);
    const req = { session: { tenantId: 'org-1', csrfToken: REAL_CSRF }, body: { name: 'My Journey' } }; // no _csrf field
    const res = makeMockRes();
    await handlePostJourneys(req, res, null, pool);
    assert(res._s === 403, `Expected 403, got ${res._s}`);
    const ins = pool._ops.find(op => /INSERT INTO customer_journeys/i.test(op.sql));
    assert(!ins, 'INSERT should not have been called when _csrf is missing');
    pass('jcg-s1 AC1: POST /journeys with no _csrf field returns 403 and does not insert');
  } catch (e) { fail('jcg-s1 AC1: POST /journeys with no _csrf field returns 403 and does not insert', e); }

  try {
    const pool = makeMockPool([]);
    const req = { session: { tenantId: 'org-1', csrfToken: REAL_CSRF }, body: { name: 'My Journey', _csrf: 'wrong-token' } };
    const res = makeMockRes();
    await handlePostJourneys(req, res, null, pool);
    assert(res._s === 403, `Expected 403, got ${res._s}`);
    const ins = pool._ops.find(op => /INSERT INTO customer_journeys/i.test(op.sql));
    assert(!ins, 'INSERT should not have been called when _csrf does not match the session token');
    pass('jcg-s1 AC1: POST /journeys with a mismatched _csrf field returns 403 and does not insert');
  } catch (e) { fail('jcg-s1 AC1: POST /journeys with a mismatched _csrf field returns 403 and does not insert', e); }

  // AC1 — valid submission inserts customer_journeys record, redirects
  try {
    const pool = makeMockPool([]);
    const req = { session: { tenantId: 'org-1', csrfToken: REAL_CSRF }, body: { name: 'My Journey', _csrf: REAL_CSRF } };
    const res = makeMockRes();
    await handlePostJourneys(req, res, null, pool);
    const ins = pool._ops.find(op => /INSERT INTO customer_journeys/i.test(op.sql));
    assert(ins, 'No INSERT into customer_journeys');
    assert(ins.params.includes('org-1'), 'tenant_id not in INSERT params');
    assert(ins.params.includes('My Journey'), 'name not in INSERT params');
    assert(res._s === 201, `Expected 201, got ${res._s}`);
    pass('AC1: POST /journeys inserts customer_journeys record with session tenantId and name');
  } catch (e) { fail('AC1: POST /journeys inserts customer_journeys record with session tenantId and name', e); }

  // AC2 — missing name -> 400, no insert
  try {
    const pool = makeMockPool([]);
    const req = { session: { tenantId: 'org-1', csrfToken: REAL_CSRF }, body: { name: '', _csrf: REAL_CSRF } };
    const res = makeMockRes();
    await handlePostJourneys(req, res, null, pool);
    assert(res._s === 400, `Expected 400, got ${res._s}`);
    const ins = pool._ops.find(op => /INSERT INTO customer_journeys/i.test(op.sql));
    assert(!ins, 'INSERT should not have been called for a missing name');
    pass('AC2: POST /journeys with no name returns 400 and does not insert');
  } catch (e) { fail('AC2: POST /journeys with no name returns 400 and does not insert', e); }

  // AC3 — request body tenantId is never used
  try {
    const pool = makeMockPool([]);
    const req = { session: { tenantId: 'org-A', csrfToken: REAL_CSRF }, body: { name: 'Spoofed', tenantId: 'org-B', _csrf: REAL_CSRF } };
    const res = makeMockRes();
    await handlePostJourneys(req, res, null, pool);
    const ins = pool._ops.find(op => /INSERT INTO customer_journeys/i.test(op.sql));
    assert(ins, 'No INSERT into customer_journeys');
    assert(ins.params.includes('org-A'), 'session tenantId (org-A) not used in INSERT');
    assert(!ins.params.includes('org-B'), 'request body tenantId (org-B) was used in INSERT -- tenant-spoofing guard failed');
    pass('AC3: request body tenantId is never used for the insert, only session tenantId');
  } catch (e) { fail('AC3: request body tenantId is never used for the insert, only session tenantId', e); }

  // AC4 — canvas shell renders journey name and empty state (GET, read-only -- no CSRF needed)
  try {
    const pool = makeMockPool([{ id: 'j1', tenant_id: 'org-1', name: 'My Journey', description: null }]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    assert(res._s === 200, `Expected 200, got ${res._s}`);
    assert(res._b && res._b.bodyContent.includes('My Journey'), 'journey name not in rendered content');
    assert(res._b && res._b.bodyContent.includes('No stages yet. Add your first stage.'), 'empty-state text not in rendered content');
    pass('AC4: GET /journeys/:id renders the journey name and the empty-state text');
  } catch (e) { fail('AC4: GET /journeys/:id renders the journey name and the empty-state text', e); }

  // (boot) — customer_journeys table creation wired into server.js's boot sequence
  try {
    const serverSrc = fs.readFileSync(path.join(__dirname, '../src/web-ui/server.js'), 'utf8');
    assert(/CREATE TABLE IF NOT EXISTS customer_journeys/i.test(serverSrc), 'customer_journeys table creation not found in server.js boot sequence');
    pass('(boot) customer_journeys table creation is wired into server.js, matching the credits/tenant_plan convention');
  } catch (e) { fail('(boot) customer_journeys table creation is wired into server.js, matching the credits/tenant_plan convention', e); }

  console.log(`\n[ep1-s1-journey-create] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
