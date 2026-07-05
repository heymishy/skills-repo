'use strict';
const assert = require('assert');

function makeMockPool(existingProducts) {
  return {
    _ops: [],
    query: async function(sql, params) {
      this._ops.push({ sql, params });
      if (/SELECT.*FROM products WHERE tenant_id/i.test(sql)) {
        const tid = params && params[0];
        return { rows: (existingProducts || []).filter(p => p.tenant_id === tid) };
      }
      if (/INSERT INTO products/i.test(sql)) {
        return { rows: [{ product_id: 'new-product-id' }] };
      }
      return { rows: [] };
    }
  };
}

const mockPosthog = { _caps: [], capture: function(id,ev,p) { this._caps.push({ev,p}); } };

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

// T1 — D37 stub throws before wiring
try {
  delete require.cache[require.resolve('../src/web-ui/adapters/product-draft')];
  const { generateProductDraft } = require('../src/web-ui/adapters/product-draft');
  let threw = false;
  try { generateProductDraft({}); } catch(e) {
    threw = (e.message === 'Adapter not wired: generateProductDraft. Call setGenerateProductDraft() before use.');
  }
  assert(threw, 'D37 stub did not throw with exact required message');
  pass('generateProductDraft throws adapter-not-wired error before setGenerateProductDraft called');
} catch(e) { fail('generateProductDraft throws adapter-not-wired error before setGenerateProductDraft called', e); }

setTimeout(function() {
  (async function() {
    const { setGenerateProductDraft, generateProductDraft } = require('../src/web-ui/adapters/product-draft');
    const { handlePostProductNew, handlePostProductConfirm } = require('../src/web-ui/routes/products');

    // T2 — handlePostProductNew calls draft adapter and returns 5 sections
    try {
      setGenerateProductDraft(async function(fields) {
        return {
          name: fields.name,
          description: 'Draft description',
          mission: 'Draft mission',
          techStack: 'Draft tech stack',
          constraints: 'Draft constraints',
          roadmap: 'Draft roadmap',
          architectureGuardrails: 'Draft guardrails'
        };
      });
      const req = { session: { tenantId: 'org-1', plan: 'team' }, body: { name: 'My Product', description: 'A product' } };
      const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; }, _s:200 };
      await handlePostProductNew(req, res, null, null, mockPosthog);
      assert(res._b, 'No response body');
      assert(res._b.draft, 'No draft in response');
      assert(res._b.draft.description || res._b.draft.mission, 'Draft sections missing');
      pass('POST /products/new calls draft adapter and returns draft sections');
    } catch(e) { fail('POST /products/new calls draft adapter and returns draft sections', e); }

    // T3 — handlePostProductConfirm inserts product and emits PostHog
    try {
      const ph = { _caps: [], capture: function(id,ev,p) { this._caps.push({ev,p}); } };
      const pool = makeMockPool([]);
      const req = { session: { tenantId: 'org-2', plan: 'team' }, body: { name: 'Confirmed Product', description: 'desc', mission: 'm', techStack: 't', constraints: 'c', roadmap: 'r', architectureGuardrails: 'ag' } };
      const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200, _b:null };
      await handlePostProductConfirm(req, res, null, pool, ph);
      const ins = pool._ops.find(op => /INSERT INTO products/i.test(op.sql));
      assert(ins, 'No INSERT into products');
      assert(ins.params.includes('org-2'), 'tenant_id not in INSERT');
      const ev = ph._caps.find(e => e.ev === 'product_created');
      assert(ev, 'product_created not emitted');
      assert(ev.p.productId === 'new-product-id', 'productId not in event');
      assert(res._s === 201, `Expected 201, got ${res._s}`);
      pass('POST /products/confirm inserts product and emits product_created event');
    } catch(e) { fail('POST /products/confirm inserts product and emits product_created event', e); }

    // T4 — solo plan: second product → 403
    try {
      const ph = { capture: function() {} };
      const pool = makeMockPool([{ product_id: 'existing', tenant_id: 'solo-tenant' }]);
      const req = { session: { tenantId: 'solo-tenant', plan: 'solo' }, body: { name: 'Second Product', description: 'desc' } };
      const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200, _b:null };
      await handlePostProductConfirm(req, res, null, pool, ph);
      assert(res._s === 403, `Expected 403 for solo plan second product, got ${res._s}`);
      assert(res._b && res._b.reason === 'plan_limit', 'reason:plan_limit not in body');
      assert(res._b.upgradeRequired === true, 'upgradeRequired:true not in body');
      pass('solo plan: second product creation returns 403 with reason:plan_limit');
    } catch(e) { fail('solo plan: second product creation returns 403 with reason:plan_limit', e); }

    // T5 — path traversal in name → 400
    try {
      const ph = { capture: function() {} };
      const pool = makeMockPool([]);
      const req = { session: { tenantId: 'org-3', plan: 'team' }, body: { name: '../../../etc/passwd', description: 'x' } };
      const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200, _b:null };
      await handlePostProductConfirm(req, res, null, pool, ph);
      assert(res._s === 400, `Expected 400 for traversal name, got ${res._s}`);
      pass('product name with path traversal returns 400');
    } catch(e) { fail('product name with path traversal returns 400', e); }

    // T6 — server.js wires setGenerateProductDraft
    try {
      const src = require('fs').readFileSync('src/web-ui/server.js', 'utf8');
      assert(src.includes('setGenerateProductDraft'), 'setGenerateProductDraft not found in server.js');
      pass('server.js wires setGenerateProductDraft D37 adapter');
    } catch(e) { fail('server.js wires setGenerateProductDraft D37 adapter', e); }

    // T-NFR1 — team plan: no product count check blocking creation
    try {
      const ph = { capture: function() {} };
      const pool = makeMockPool([{ product_id: 'p1', tenant_id: 'team-t' }, { product_id: 'p2', tenant_id: 'team-t' }]);
      const req = { session: { tenantId: 'team-t', plan: 'team' }, body: { name: 'Third Product', description: 'y' } };
      const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200, _b:null };
      await handlePostProductConfirm(req, res, null, pool, ph);
      assert(res._s !== 403, `Team plan should not be limited, got ${res._s}`);
      pass('team plan: no product count limit enforced');
    } catch(e) { fail('team plan: no product count limit enforced', e); }

    // T-NFR2 — cross-tenant: tenantId from session, never from body
    try {
      const ph = { capture: function() {} };
      const pool = makeMockPool([]);
      const req = { session: { tenantId: 'real-org' }, body: { name: 'P', description: 'd', tenantId: 'injected-org' } };
      const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200 };
      await handlePostProductConfirm(req, res, null, pool, ph);
      const ins = pool._ops.find(op => /INSERT INTO products/i.test(op.sql));
      if (ins) {
        assert(ins.params.includes('real-org'), 'real-org not in INSERT params');
        assert(!ins.params.includes('injected-org'), 'injected-org leaked into INSERT');
      }
      pass('tenantId comes from session, never from request body');
    } catch(e) { fail('tenantId comes from session, never from request body', e); }

    console.log(`\n[psh-s3] Results: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  })();
}, 300);
