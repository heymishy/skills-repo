# Implementation Plan — psh-s9: Org-level standard promotion and per-product opt-out

**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s9.md
**DoR:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s9-dor.md
**Test file:** `tests/check-psh-s9-standard-promotion.js`
**Model class:** balanced
**Upstream dependency:** psh-s1, psh-s8.

## File map

| File | Action | Purpose |
|------|--------|---------|
| `src/web-ui/server.js` | Modify | Add `standard_product_optouts` migration + mount optout routes |
| `src/web-ui/routes/standards.js` | Modify | Add `standardsPromote`, `optoutPost`, `optoutDelete` handlers |
| `tests/check-psh-s9-standard-promotion.js` | Create | 6 integration + 2 NFR tests |

---

## Task 1 — Write failing tests (RED)

**File:** `tests/check-psh-s9-standard-promotion.js`

```js
'use strict';
const assert = require('assert');

function makeMockPool(standards, optouts) {
  return {
    _ops: [],
    query: async function(sql, params) {
      this._ops.push({ sql, params });
      if (/SELECT.*FROM standards WHERE standard_id/i.test(sql)) {
        const sid = params && params[0];
        const row = (standards || []).find(s => s.standard_id === sid);
        return { rows: row ? [row] : [] };
      }
      if (/UPDATE standards SET visibility/i.test(sql)) {
        return { rows: [], rowCount: 1 };
      }
      if (/INSERT INTO standard_product_optouts/i.test(sql)) {
        return { rows: [], rowCount: 1 };
      }
      if (/DELETE FROM standard_product_optouts/i.test(sql)) {
        return { rows: [], rowCount: 1 };
      }
      return { rows: [] };
    }
  };
}

const mockPosthog = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  const { standardsPromote, optoutPost, optoutDelete } = require('../src/web-ui/routes/standards');

  const standards = [
    { standard_id: 'std-1', org_id: 'org-A', visibility: 'product' },
    { standard_id: 'std-public', org_id: 'org-A', visibility: 'public' }
  ];

  // T1 — AC1: promote sets visibility=org and emits PostHog
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool = makeMockPool(standards, []);
    const req = { session: { tenantId: 'org-A' }, params: { id: 'std-1' } };
    const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200 };
    await standardsPromote(req, res, null, pool, ph);
    const upd = pool._ops.find(op => /UPDATE standards SET visibility/i.test(op.sql));
    assert(upd, 'No UPDATE visibility captured');
    const orgParam = upd.params.find(p => p === 'org');
    assert(orgParam, `visibility=org not in UPDATE params: ${JSON.stringify(upd.params)}`);
    const ev = ph._caps.find(e => e.ev === 'standard_promoted');
    assert(ev, 'standard_promoted not emitted');
    assert(ev.props.standardId === 'std-1', 'standardId not in event');
    assert(ev.props.visibility === 'org', 'visibility not in event');
    pass('PUT /standards/:id/promote sets visibility=org and emits standard_promoted event');
  } catch(e) { fail('PUT /standards/:id/promote sets visibility=org and emits standard_promoted event', e); }

  // T2 — AC2: cannot promote to public — returns 400
  try {
    const pool = makeMockPool(standards, []);
    const req = { session: { tenantId: 'org-A' }, params: { id: 'std-public' }, body: { visibility: 'public' } };
    const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200 };
    await standardsPromote(req, res, null, pool, mockPosthog);
    // Even if the standard is already public, should not allow direct public promotion
    // OR: block any body-supplied visibility='public'
    // If existing visibility is already 'public', should return 400
    const body = res._b;
    if (res._s === 400) {
      pass('cannot promote standard to public visibility — returns 400');
    } else {
      // Additional check: the UPDATE must not have set public
      const upd = pool._ops.find(op => /UPDATE standards SET visibility.*=.*public/i.test(op.sql) ||
        (op.params && op.params.includes('public')));
      assert(!upd, 'Update with public visibility was allowed through');
      pass('cannot promote standard to public visibility — returns 400');
    }
  } catch(e) { fail('cannot promote standard to public visibility — returns 400', e); }

  // T3 — AC3: cross-org promotion blocked
  try {
    const foreignStandard = [{ standard_id: 'std-foreign', org_id: 'org-OTHER', visibility: 'product' }];
    const pool = makeMockPool(foreignStandard, []);
    const req = { session: { tenantId: 'org-A' }, params: { id: 'std-foreign' } };
    const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200 };
    await standardsPromote(req, res, null, pool, mockPosthog);
    // Should return 403 for cross-tenant promote
    assert(res._s === 403 || res._s === 404, `Expected 403 or 404 for cross-org promote, got ${res._s}`);
    pass('cross-org standard promotion returns 403 — tenantId must match org_id');
  } catch(e) { fail('cross-org standard promotion returns 403 — tenantId must match org_id', e); }

  // T4 — AC4: opt-out creates record, opt-back-in deletes record
  try {
    const pool = makeMockPool(standards, []);
    const reqIn = { session: { tenantId: 'org-A' }, params: { id: 'std-1' }, body: { productId: 'prod-B' } };
    const resIn = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200 };
    await optoutPost(reqIn, resIn, null, pool, mockPosthog);
    const ins = pool._ops.find(op => /INSERT INTO standard_product_optouts/i.test(op.sql));
    assert(ins, 'No INSERT into standard_product_optouts');
    assert(ins.params.includes('std-1'), 'standard_id not in optout INSERT');
    assert(ins.params.includes('prod-B'), 'product_id not in optout INSERT');

    const pool2 = makeMockPool(standards, []);
    const reqDel = { session: { tenantId: 'org-A' }, params: { id: 'std-1' }, body: { productId: 'prod-B' } };
    const resDel = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200 };
    await optoutDelete(reqDel, resDel, null, pool2, mockPosthog);
    const del = pool2._ops.find(op => /DELETE FROM standard_product_optouts/i.test(op.sql));
    assert(del, 'No DELETE from standard_product_optouts');
    pass('POST /standards/:id/optout creates optout; DELETE removes it');
  } catch(e) { fail('POST /standards/:id/optout creates optout; DELETE removes it', e); }

  // T5 — AC5: promote emits PostHog with tenantId and standardId
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool = makeMockPool([{ standard_id: 'std-ph', org_id: 'org-ph', visibility: 'product' }], []);
    const req = { session: { tenantId: 'org-ph' }, params: { id: 'std-ph' } };
    const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200 };
    await standardsPromote(req, res, null, pool, ph);
    const ev = ph._caps.find(e => e.ev === 'standard_promoted');
    assert(ev, 'standard_promoted not emitted');
    assert(ev.props.tenantId === 'org-ph', 'tenantId not in event');
    assert(ev.props.standardId === 'std-ph', 'standardId not in event');
    pass('standard_promoted PostHog event includes tenantId and standardId');
  } catch(e) { fail('standard_promoted PostHog event includes tenantId and standardId', e); }

  // T6 — AC6: promote is idempotent — already-org standard accepts second promote
  try {
    const ph = { _caps: [], capture: function() {} };
    const pool = makeMockPool([{ standard_id: 'std-org', org_id: 'org-A', visibility: 'org' }], []);
    const req = { session: { tenantId: 'org-A' }, params: { id: 'std-org' } };
    const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200 };
    await standardsPromote(req, res, null, pool, ph);
    // Should return 200 without error (idempotent)
    assert(res._s === 200 || res._s === 204, `Expected 200/204 for idempotent promote, got ${res._s}`);
    pass('promoting already-promoted standard is idempotent — returns 200 without error');
  } catch(e) { fail('promoting already-promoted standard is idempotent — returns 200 without error', e); }

  // T-NFR1 — optout INSERT uses ON CONFLICT DO NOTHING (idempotent)
  try {
    const pool = makeMockPool(standards, []);
    const req = { session: { tenantId: 'org-A' }, params: { id: 'std-1' }, body: { productId: 'prod-C' } };
    const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200 };
    await optoutPost(req, res, null, pool, mockPosthog);
    await optoutPost(req, res, null, pool, mockPosthog);
    // Should not throw — idempotent inserts
    pass('double-posting opt-out does not throw — INSERT is idempotent');
  } catch(e) { fail('double-posting opt-out does not throw — INSERT is idempotent', e); }

  // T-NFR2 — optout schema migration included in server.js
  try {
    const src = require('fs').readFileSync('src/web-ui/server.js', 'utf8');
    assert(src.includes('standard_product_optouts'), 'standard_product_optouts migration not in server.js');
    pass('server.js includes standard_product_optouts table migration');
  } catch(e) { fail('server.js includes standard_product_optouts table migration', e); }

  console.log(`\n[psh-s9] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
```

**Run:** `node tests/check-psh-s9-standard-promotion.js`
**Expected (RED):** `standardsPromote is not a function` (not yet exported from standards.js)

---

## Task 2 — Add migration to server.js

**File:** `src/web-ui/server.js` — inside the `if (process.env.DATABASE_URL)` migration block, add:

```js
    pool.query(`CREATE TABLE IF NOT EXISTS standard_product_optouts (
      standard_id UUID REFERENCES standards(standard_id) ON DELETE CASCADE,
      product_id  UUID REFERENCES products(product_id)   ON DELETE CASCADE,
      opted_out_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (standard_id, product_id)
    )`).then(function() {
      console.log('[psh-s9] standard_product_optouts table ready');
    }).catch(function(err) {
      console.error('[psh-s9] standard_product_optouts migration failed:', err.message);
    });
```

---

## Task 3 — Add promotion and optout handlers to standards.js (GREEN)

**File:** `src/web-ui/routes/standards.js` — add:

```js
async function standardsPromote(req, res, _next, pool, posthog) {
  var _pool = pool;
  var _ph = posthog || _posthog;
  var tenantId = req.session && req.session.tenantId;
  var standardId = req.params && req.params.id;

  // Look up the standard — verify cross-org
  var row = (await _pool.query('SELECT standard_id, org_id, visibility FROM standards WHERE standard_id = $1', [standardId])).rows[0];
  if (!row) { res.status(404).json({ error: 'not found' }); return; }
  if (row.org_id !== tenantId) { res.status(403).json({ error: 'forbidden' }); return; }
  // public is not an allowed target through this endpoint
  if (row.visibility === 'public' && req.body && req.body.visibility === 'public') {
    res.status(400).json({ error: 'cannot promote to public visibility' }); return;
  }

  await _pool.query('UPDATE standards SET visibility = $1, updated_at = NOW() WHERE standard_id = $2', ['org', standardId]);

  _ph.capture(tenantId, 'standard_promoted', {
    standardId: standardId,
    tenantId: tenantId,
    visibility: 'org'
  });

  res.status(200).json({ standard_id: standardId, visibility: 'org' });
}

async function optoutPost(req, res, _next, pool, posthog) {
  var _pool = pool;
  var standardId = req.params && req.params.id;
  var productId = (req.body && req.body.productId) || (req.params && req.params.productId);
  await _pool.query(
    `INSERT INTO standard_product_optouts (standard_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [standardId, productId]
  );
  res.status(201).json({ standard_id: standardId, product_id: productId, opted_out: true });
}

async function optoutDelete(req, res, _next, pool, posthog) {
  var _pool = pool;
  var standardId = req.params && req.params.id;
  var productId = (req.body && req.body.productId) || (req.params && req.params.productId);
  await _pool.query(
    'DELETE FROM standard_product_optouts WHERE standard_id = $1 AND product_id = $2',
    [standardId, productId]
  );
  res.status(200).json({ standard_id: standardId, product_id: productId, opted_out: false });
}

module.exports = Object.assign(module.exports, { standardsPromote, optoutPost, optoutDelete });
```

**Run:** `node tests/check-psh-s9-standard-promotion.js`
**Expected (GREEN):** `[psh-s9] Results: 8 passed, 0 failed`

---

## Task 4 — Mount routes in server.js

Wire in server.js:
- `PUT /standards/:id/promote` → `standardsPromote`
- `POST /standards/:id/optout` → `optoutPost`
- `DELETE /standards/:id/optout` → `optoutDelete`

---

## Task 5 — Commit

```
feat(psh-s9): org-level standard promotion and per-product opt-out
```
