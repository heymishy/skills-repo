'use strict';
const assert = require('assert');

function makeMockPool(standards) {
  return {
    _ops: [],
    query: async function(sql, params) {
      this._ops.push({ sql, params });
      if (/SELECT.*FROM standards WHERE standard_id/i.test(sql)) {
        const sid = params && params[0];
        const row = (standards || []).find(s => s.standard_id === sid);
        return { rows: row ? [row] : [] };
      }
      if (/UPDATE standards SET visibility/i.test(sql)) { return { rows: [], rowCount: 1 }; }
      if (/INSERT INTO standard_product_optouts/i.test(sql)) { return { rows: [], rowCount: 1 }; }
      if (/DELETE FROM standard_product_optouts/i.test(sql)) { return { rows: [], rowCount: 1 }; }
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
    { standard_id: 'std-org', org_id: 'org-A', visibility: 'org' }
  ];

  // T1 — promote sets visibility=org and emits PostHog
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool = makeMockPool(standards);
    const req = { session: { tenantId: 'org-A' }, params: { id: 'std-1' } };
    const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200 };
    await standardsPromote(req, res, null, pool, ph);
    const upd = pool._ops.find(op => /UPDATE standards SET visibility/i.test(op.sql));
    assert(upd, 'No UPDATE visibility captured');
    assert(upd.params.includes('org'), "visibility='org' not in UPDATE params");
    const ev = ph._caps.find(e => e.ev === 'standard_promoted');
    assert(ev, 'standard_promoted not emitted');
    assert(ev.props.standardId === 'std-1', 'standardId not in event');
    assert(ev.props.visibility === 'org', 'visibility not in event');
    pass('PUT /standards/:id/promote sets visibility=org and emits standard_promoted event');
  } catch(e) { fail('PUT /standards/:id/promote sets visibility=org and emits standard_promoted event', e); }

  // T2 — cross-org promote returns 403
  try {
    const pool = makeMockPool([{ standard_id: 'std-foreign', org_id: 'org-OTHER', visibility: 'product' }]);
    const req = { session: { tenantId: 'org-A' }, params: { id: 'std-foreign' } };
    const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200 };
    await standardsPromote(req, res, null, pool, mockPosthog);
    assert(res._s === 403 || res._s === 404, `Expected 403/404 for cross-org promote, got ${res._s}`);
    pass('cross-org standard promotion returns 403');
  } catch(e) { fail('cross-org standard promotion returns 403', e); }

  // T3 — cannot promote with visibility=public → 400
  try {
    const pool = makeMockPool([{ standard_id: 'std-1', org_id: 'org-A', visibility: 'product' }]);
    const req = { session: { tenantId: 'org-A' }, params: { id: 'std-1' }, body: { visibility: 'public' } };
    const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200 };
    await standardsPromote(req, res, null, pool, mockPosthog);
    // If body.visibility=public is passed, should be blocked
    // OR the endpoint always sets org (not public), which is also valid
    // Either way, no UPDATE with 'public' should happen
    const pubUpd = pool._ops.find(op => /UPDATE standards SET visibility/i.test(op.sql) && op.params && op.params.includes('public'));
    assert(!pubUpd, 'UPDATE with public visibility was allowed');
    pass('cannot promote standard to public visibility — public never set via this endpoint');
  } catch(e) { fail('cannot promote standard to public visibility — public never set via this endpoint', e); }

  // T4 — opt-out creates record
  try {
    const pool = makeMockPool(standards);
    const req = { session: { tenantId: 'org-A' }, params: { id: 'std-1' }, body: { productId: 'prod-B' } };
    const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200 };
    await optoutPost(req, res, null, pool, mockPosthog);
    const ins = pool._ops.find(op => /INSERT INTO standard_product_optouts/i.test(op.sql));
    assert(ins, 'No INSERT into standard_product_optouts');
    assert(ins.params.includes('std-1'), 'standard_id not in optout INSERT');
    assert(ins.params.includes('prod-B'), 'product_id not in optout INSERT');
    pass('POST /standards/:id/optout creates optout record');
  } catch(e) { fail('POST /standards/:id/optout creates optout record', e); }

  // T5 — opt-back-in deletes record
  try {
    const pool = makeMockPool(standards);
    const req = { session: { tenantId: 'org-A' }, params: { id: 'std-1' }, body: { productId: 'prod-B' } };
    const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200 };
    await optoutDelete(req, res, null, pool, mockPosthog);
    const del = pool._ops.find(op => /DELETE FROM standard_product_optouts/i.test(op.sql));
    assert(del, 'No DELETE from standard_product_optouts');
    pass('DELETE /standards/:id/optout removes optout record');
  } catch(e) { fail('DELETE /standards/:id/optout removes optout record', e); }

  // T6 — promote emits PostHog with tenantId and standardId
  try {
    const ph = { _caps: [], capture: function(id,ev,props) { this._caps.push({ev,props}); } };
    const pool = makeMockPool([{ standard_id: 'std-ph', org_id: 'org-ph', visibility: 'product' }]);
    const req = { session: { tenantId: 'org-ph' }, params: { id: 'std-ph' } };
    const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200 };
    await standardsPromote(req, res, null, pool, ph);
    const ev = ph._caps.find(e => e.ev === 'standard_promoted');
    assert(ev, 'standard_promoted not emitted');
    assert(ev.props.tenantId === 'org-ph', 'tenantId not in event');
    assert(ev.props.standardId === 'std-ph', 'standardId not in event');
    pass('standard_promoted PostHog event includes tenantId and standardId');
  } catch(e) { fail('standard_promoted PostHog event includes tenantId and standardId', e); }

  // T-NFR1 — optout idempotent (ON CONFLICT DO NOTHING)
  try {
    const pool = makeMockPool(standards);
    const req = { session: { tenantId: 'org-A' }, params: { id: 'std-1' }, body: { productId: 'prod-C' } };
    const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200 };
    await optoutPost(req, res, null, pool, mockPosthog);
    await optoutPost(req, res, null, pool, mockPosthog);
    const insOps = pool._ops.filter(op => /INSERT INTO standard_product_optouts/i.test(op.sql));
    const sql = insOps[0] && insOps[0].sql.toLowerCase();
    assert(sql && (sql.includes('on conflict') || sql.includes('conflict')), 'INSERT lacks ON CONFLICT DO NOTHING — not idempotent');
    pass('optout INSERT uses ON CONFLICT DO NOTHING');
  } catch(e) { fail('optout INSERT uses ON CONFLICT DO NOTHING', e); }

  // T-NFR2 — standard_product_optouts migration in server.js
  try {
    const src = require('fs').readFileSync('src/web-ui/server.js', 'utf8');
    assert(src.includes('standard_product_optouts'), 'standard_product_optouts migration not in server.js');
    pass('server.js includes standard_product_optouts table migration');
  } catch(e) { fail('server.js includes standard_product_optouts table migration', e); }

  console.log(`\n[psh-s9] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
