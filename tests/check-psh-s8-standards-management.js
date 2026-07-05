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

// T1 — Unit: path traversal → 400
(async function() {
  try {
    const { standardsPost } = require('../src/web-ui/routes/standards');
    const pool = makeMockPool([]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'prod-1' }, body: { name: '../../../etc/evil', content: 'bad' } };
    const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200, _b:null };
    await standardsPost(req, res, null, pool, mockPosthog);
    assert(res._s === 400, `Expected 400 for traversal name, got ${res._s}`);
    pass('standard creation with traversal path name returns 400');
  } catch(e) { fail('standard creation with traversal path name returns 400', e); }
})();

setTimeout(function() {
  (async function() {
    const { standardsPost, standardsList, standardsPut } = require('../src/web-ui/routes/standards');

    // T2 — Integration: POST creates standard with correct fields
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
      assert(params.includes('org-1'), 'org_id not in INSERT (should come from session)');
      assert(params.includes('product'), "visibility='product' not in INSERT");
      assert(res._s === 201, `Expected 201, got ${res._s}`);
      pass('POST /products/:id/standards inserts with product_id, org_id from session, visibility=product');
    } catch(e) { fail('POST /products/:id/standards inserts with product_id, org_id from session, visibility=product', e); }

    // T3 — Integration: PostHog standard_created
    try {
      const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
      const pool = makeMockPool([]);
      const req = { session: { tenantId: 'org-1' }, params: { id: 'prod-1' }, body: { name: 'S1', content: 'c1' } };
      const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200 };
      await standardsPost(req, res, null, pool, ph);
      const ev = ph._caps.find(e => e.ev === 'standard_created');
      assert(ev, 'standard_created not emitted');
      assert(ev.props.productId === 'prod-1', 'productId not in event');
      assert(ev.props.tenantId === 'org-1', 'tenantId not in event');
      assert(ev.props.visibility === 'product', 'visibility not in event');
      pass('creating a standard emits standard_created PostHog event with required properties');
    } catch(e) { fail('creating a standard emits standard_created PostHog event with required properties', e); }

    // T4 — Integration: list returns standards ordered newest first
    try {
      const now = new Date();
      const standards = [
        { standard_id: 's1', product_id: 'prod-1', name: 'S1', visibility: 'product', created_at: new Date(+now - 60000) },
        { standard_id: 's2', product_id: 'prod-1', name: 'S2', visibility: 'product', created_at: new Date(+now - 30000) },
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

    // T5 — Integration: PUT updates name/content/updated_at
    try {
      const pool = makeMockPool([]);
      const req = { session: { tenantId: 'org-1' }, params: { id: 'std-1' }, body: { name: 'New Name', content: 'New content' } };
      const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
      await standardsPut(req, res, null, pool);
      const upd = pool._ops.find(op => /UPDATE standards SET/i.test(op.sql));
      assert(upd, 'No UPDATE captured');
      const sql = upd.sql.toLowerCase();
      assert(sql.includes('name') && sql.includes('content'), 'name or content not in UPDATE');
      assert(sql.includes('updated_at'), 'updated_at not refreshed');
      assert(res._s === 200 || res._b, 'Expected 200 response');
      pass('PUT /standards/:id updates name, content, and updated_at');
    } catch(e) { fail('PUT /standards/:id updates name, content, and updated_at', e); }

    // T6 — org_id from session, not body
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

    // T-NFR1 — HTML escape in list response
    try {
      const standards = [{ standard_id: 'xss', product_id: 'p', name: '<script>xss</script>', visibility: 'product', created_at: new Date() }];
      const pool = makeMockPool(standards);
      const req = { session: { tenantId: 'org' }, params: { id: 'p' } };
      const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
      await standardsList(req, res, null, pool);
      const s = res._b && res._b.standards && res._b.standards[0];
      assert(s, 'Standard not found');
      const name = s.name || '';
      assert(!name.includes('<script>'), 'Unescaped <script> in standard name');
      pass('standard names HTML-escaped in list response');
    } catch(e) { fail('standard names HTML-escaped in list response', e); }

    // T-NFR2 — performance < 1s for 50 standards
    try {
      const s50 = Array.from({length:50}, (_,i) => ({ standard_id:'s'+i, product_id:'pb', name:'S'+i, visibility:'product', created_at:new Date() }));
      const pool = makeMockPool(s50);
      const req = { session: { tenantId: 'tb' }, params: { id: 'pb' } };
      const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
      const t0 = Date.now();
      await standardsList(req, res, null, pool);
      const elapsed = Date.now() - t0;
      assert(elapsed < 1000, `Handler took ${elapsed}ms`);
      pass('standards list loads in under 1 second for 50 standards');
    } catch(e) { fail('standards list loads in under 1 second for 50 standards', e); }

    console.log(`\n[psh-s8] Results: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  })();
}, 300);
