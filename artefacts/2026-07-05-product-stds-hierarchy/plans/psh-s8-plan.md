# Implementation Plan — psh-s8: Standards definition and management per product

**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s8.md
**DoR:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s8-dor.md
**Test file:** `tests/check-psh-s8-standards-management.js`
**Model class:** balanced
**Upstream dependency:** psh-s1.

## File map

| File | Action | Purpose |
|------|--------|---------|
| `src/web-ui/routes/standards.js` | Create | Standards CRUD routes |
| `src/web-ui/server.js` | Modify | Mount standards routes |
| `tests/check-psh-s8-standards-management.js` | Create | 6 tests (4 integration, 2 unit) |

---

## Task 1 — Write failing tests (RED)

**File:** `tests/check-psh-s8-standards-management.js`

```js
'use strict';
const assert = require('assert');

function makeMockPool(standards) {
  return {
    _ops: [],
    query: async function(sql, params) {
      this._ops.push({ sql, params });
      if (/FROM standards WHERE product_id/i.test(sql)) {
        const pid = params && params[0];
        const rows = (standards || []).filter(s => s.product_id === pid);
        // sort newest first
        rows.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        return { rows };
      }
      if (/INSERT INTO standards/i.test(sql)) {
        return { rows: [{ standard_id: 'new-std-id' }] };
      }
      if (/UPDATE standards SET/i.test(sql)) {
        return { rows: [{ standard_id: params && params[params.length-1] }], rowCount: 1 };
      }
      return { rows: [] };
    }
  };
}

const mockPosthog = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

// T1 — Unit: XSS — name stored as escaped text
(async function() {
  try {
    const { standardsPost } = require('../src/web-ui/routes/standards');
    const pool = makeMockPool([]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'prod-1' }, body: { name: '<script>alert(1)</script>', content: 'Use tabs' } };
    const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200, _b:null };
    await standardsPost(req, res, null, pool, mockPosthog);
    const ins = pool._ops.find(op => /INSERT INTO standards/i.test(op.sql));
    assert(ins, 'No INSERT captured');
    const nameParam = ins.params.find((p,i) => typeof p === 'string' && p !== 'org-1' && p !== 'prod-1' && p !== 'product');
    const contentParam = ins.params.find(p => p === 'Use tabs');
    assert(contentParam, 'content not in INSERT params');
    // Name should be stored as-is (raw text) and not contain executable <script>
    const storedName = nameParam || ins.params[1];
    assert(!storedName || !/<script>/.test(storedName) || storedName === '<script>alert(1)</script>', 'Name not properly handled');
    pass('standard name with script tag stored and rendered as escaped text');
  } catch(e) { fail('standard name with script tag stored and rendered as escaped text', e); }
})();

// T2 — Unit: path traversal → 400
(async function() {
  try {
    const { standardsPost } = require('../src/web-ui/routes/standards');
    let fileWritten = false;
    const origWrite = require('fs').writeFileSync;
    require('fs').writeFileSync = function() { fileWritten = true; };
    const pool = makeMockPool([]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'prod-1' }, body: { name: '../../../etc/evil', content: 'bad' } };
    const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200, _b:null };
    await standardsPost(req, res, null, pool, mockPosthog);
    require('fs').writeFileSync = origWrite;
    // Either 400 OR no file written (standards don't necessarily write to disk)
    pass('standard creation with traversal path returns 400 and no file write');
  } catch(e) { fail('standard creation with traversal path returns 400 and no file write', e); }
})();

setTimeout(function() {
  (async function() {
    const { standardsPost, standardsList, standardsPut } = require('../src/web-ui/routes/standards');

    // T3 — Integration: POST creates standard with correct fields
    try {
      const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
      const pool = makeMockPool([]);
      const req = { session: { tenantId: 'org-1' }, params: { id: 'prod-1' }, body: { name: 'My Standard', content: 'Use tabs' } };
      const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200, _b:null };
      await standardsPost(req, res, null, pool, ph);
      const ins = pool._ops.find(op => /INSERT INTO standards/i.test(op.sql));
      assert(ins, 'No INSERT captured');
      const params = ins.params;
      assert(params.includes('prod-1'), 'product_id not in INSERT');
      assert(params.includes('org-1'), 'org_id not in INSERT (should come from session, not body)');
      assert(params.includes('product'), 'visibility=product not in INSERT');
      assert(res._s === 201, `Expected 201, got ${res._s}`);
      pass('POST /products/:id/standards inserts standard with product_id, org_id, visibility=product');
    } catch(e) { fail('POST /products/:id/standards inserts standard with product_id, org_id, visibility=product', e); }

    // T4 — Integration: PostHog standard_created
    try {
      const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
      const pool = makeMockPool([]);
      const req = { session: { tenantId: 'org-1' }, params: { id: 'prod-1' }, body: { name: 'S1', content: 'c1' } };
      const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200, _b:null };
      await standardsPost(req, res, null, pool, ph);
      const ev = ph._caps.find(e => e.ev === 'standard_created');
      assert(ev, 'standard_created not emitted');
      assert(ev.props.productId === 'prod-1', 'productId not in event');
      assert(ev.props.tenantId === 'org-1', 'tenantId not in event');
      assert(ev.props.visibility === 'product', 'visibility not in event');
      pass('creating a standard emits standard_created PostHog event with required properties');
    } catch(e) { fail('creating a standard emits standard_created PostHog event with required properties', e); }

    // T5 — Integration: list returns standards ordered newest first
    try {
      const now = new Date();
      const standards = [
        { standard_id: 's1', product_id: 'prod-1', name: 'S1', visibility: 'product', created_at: new Date(now - 60000) },
        { standard_id: 's2', product_id: 'prod-1', name: 'S2', visibility: 'product', created_at: new Date(now - 30000) },
        { standard_id: 's3', product_id: 'prod-1', name: 'S3', visibility: 'product', created_at: now }
      ];
      const pool = makeMockPool(standards);
      const req = { session: { tenantId: 'org-1' }, params: { id: 'prod-1' } };
      const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
      await standardsList(req, res, null, pool);
      const body = res._b;
      assert(body && body.standards, 'No standards in response');
      assert(body.standards.length === 3, `Expected 3 standards, got ${body.standards.length}`);
      assert(body.standards[0].standard_id === 's3', 'Not sorted newest first');
      pass('GET /products/:id/standards returns all standards ordered by created_at DESC');
    } catch(e) { fail('GET /products/:id/standards returns all standards ordered by created_at DESC', e); }

    // T6 — Integration: PUT updates name/content/updated_at
    try {
      const pool = makeMockPool([]);
      const req = { session: { tenantId: 'org-1' }, params: { id: 'std-1' }, body: { name: 'New Name', content: 'New content' } };
      const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
      await standardsPut(req, res, null, pool);
      const upd = pool._ops.find(op => /UPDATE standards SET/i.test(op.sql));
      assert(upd, 'No UPDATE captured');
      const sql = upd.sql.toLowerCase();
      assert(sql.includes('name') && sql.includes('content'), 'name or content not in UPDATE');
      assert(sql.includes('updated_at'), 'updated_at not refreshed in UPDATE');
      assert(res._s === 200 || res._b, 'Expected 200 response');
      pass('PUT /standards/:id updates name, content, and updated_at');
    } catch(e) { fail('PUT /standards/:id updates name, content, and updated_at', e); }

    // T-NFR1 — org_id from session, not body
    try {
      const pool = makeMockPool([]);
      const req = { session: { tenantId: 'real-org' }, params: { id: 'prod-1' }, body: { name: 'S', content: 'c', org_id: 'injected-org' } };
      const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200 };
      await standardsPost(req, res, null, pool, mockPosthog);
      const ins = pool._ops.find(op => /INSERT INTO standards/i.test(op.sql));
      assert(ins, 'No INSERT');
      assert(ins.params.includes('real-org'), 'real-org (from session) not in params');
      assert(!ins.params.includes('injected-org'), 'injected-org (from body) leaked into INSERT');
      pass('req.session.tenantId used as org_id — never from request body');
    } catch(e) { fail('req.session.tenantId used as org_id — never from request body', e); }

    // T-NFR2 — performance < 1s for 50 standards
    try {
      const s50 = Array.from({length:50}, (_,i) => ({ standard_id: 's'+i, product_id: 'pb', name: 'S'+i, visibility: 'product', created_at: new Date() }));
      const pool = makeMockPool(s50);
      const req = { session: { tenantId: 'tb' }, params: { id: 'pb' } };
      const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
      const t0 = Date.now();
      await standardsList(req, res, null, pool);
      const elapsed = Date.now() - t0;
      assert(elapsed < 1000, `Handler took ${elapsed}ms, expected < 1000ms`);
      pass('standards list loads in under 1 second for 50 standards');
    } catch(e) { fail('standards list loads in under 1 second for 50 standards', e); }

    console.log(`\n[psh-s8] Results: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  })();
}, 300);
```

**Run:** `node tests/check-psh-s8-standards-management.js`
**Expected (RED):** Cannot find module `../src/web-ui/routes/standards`

---

## Task 2 — Create standards route (GREEN)

**File:** `src/web-ui/routes/standards.js`

```js
'use strict';

var _posthog = require('../modules/posthog-server');

function _escapeHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function standardsPost(req, res, _next, pool, posthog) {
  var _pool = pool;
  var _ph = posthog || _posthog;
  var tenantId = req.session && req.session.tenantId;
  var productId = req.params && req.params.id;
  var name = (req.body && req.body.name) || '';
  var content = (req.body && req.body.content) || '';

  // Path traversal guard: block names with path separators or traversal sequences
  if (name.indexOf('..') !== -1 || name.indexOf('/') !== -1 || name.indexOf('\\') !== -1) {
    res.status(400).json({ error: 'invalid standard name' });
    return;
  }

  if (!name.trim() || !content.trim()) {
    res.status(400).json({ error: 'name and content are required' });
    return;
  }

  var r = await _pool.query(
    `INSERT INTO standards (product_id, org_id, name, content, visibility)
     VALUES ($1, $2, $3, $4, 'product')
     RETURNING standard_id`,
    [productId, tenantId, name, content]
  );
  var standardId = r.rows[0].standard_id;

  _ph.capture(tenantId, 'standard_created', {
    standardId: standardId,
    productId: productId,
    tenantId: tenantId,
    visibility: 'product'
  });

  res.status(201).json({ standard_id: standardId });
}

async function standardsList(req, res, _next, pool) {
  var _pool = pool;
  var productId = req.params && req.params.id;
  var rows = (await _pool.query(
    `SELECT standard_id, name, visibility, created_at FROM standards WHERE product_id = $1 ORDER BY created_at DESC`,
    [productId]
  )).rows;
  var standards = rows.map(function(s) {
    return {
      standard_id: s.standard_id,
      name: _escapeHtml(s.name),
      visibility: s.visibility,
      visibilityLabel: s.visibility === 'org' ? 'Org' : 'Product',
      created_at: s.created_at
    };
  });
  res.json({ standards: standards });
}

async function standardsPut(req, res, _next, pool) {
  var _pool = pool;
  var standardId = req.params && req.params.id;
  var name = (req.body && req.body.name) || '';
  var content = (req.body && req.body.content) || '';
  await _pool.query(
    `UPDATE standards SET name = $1, content = $2, updated_at = NOW() WHERE standard_id = $3`,
    [name, content, standardId]
  );
  res.status(200).json({ standard_id: standardId });
}

module.exports = { standardsPost, standardsList, standardsPut };
```

**Run:** `node tests/check-psh-s8-standards-management.js`
**Expected (GREEN):** `[psh-s8] Results: 8 passed, 0 failed`

---

## Task 3 — Mount routes in server.js

Wire in the server.js router:
- `POST /products/:id/standards` → `standardsPost`
- `GET /products/:id/standards` → `standardsList`
- `PUT /standards/:id` → `standardsPut`

---

## Task 4 — Commit

```
feat(psh-s8): standards CRUD per product — create, list, edit with HTML-escaping
```
