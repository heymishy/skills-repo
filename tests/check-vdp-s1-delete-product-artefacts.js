#!/usr/bin/env node
// check-vdp-s1-delete-product-artefacts.js -- AC verification for vdp-s1
// (deleting a product removes its journeys' artefacts first; incident
// cb7c5cc2: artefacts_journey_id_fkey blocked DELETE /products/:id on staging).
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else { console.log('  ✗ ' + label); failed++; }
}

// A pool that models artefacts.journey_id REFERENCES journeys(journey_id) with no cascade:
// deleting a journey while an artefact still references it throws the error staging raised.
function makeFkPool(state) {
  const log = [];
  return {
    log: log,
    state: state,
    query: async function (sql, params) {
      if (/SELECT product_id, tenant_id FROM products WHERE product_id/i.test(sql)) {
        log.push('select-product');
        if (params[0] !== state.productId) return { rows: [] };
        return { rows: [{ product_id: state.productId, tenant_id: state.tenantId }] };
      }
      if (/DELETE FROM artefacts/i.test(sql)) {
        log.push('delete-artefacts');
        const mine = state.journeys.map(function (j) { return j.id; });
        state.artefacts = state.artefacts.filter(function (a) { return mine.indexOf(a.journey_id) === -1; });
        return { rowCount: 0 };
      }
      if (/DELETE FROM journeys WHERE product_id/i.test(sql)) {
        log.push('delete-journeys');
        const mine = state.journeys.map(function (j) { return j.id; });
        if (state.artefacts.some(function (a) { return mine.indexOf(a.journey_id) !== -1; })) {
          throw new Error('update or delete on table "journeys" violates foreign key constraint "artefacts_journey_id_fkey" on table "artefacts"');
        }
        state.journeys = [];
        return { rowCount: 0 };
      }
      if (/DELETE FROM products WHERE product_id/i.test(sql)) {
        log.push('delete-product');
        state.productDeleted = true;
        return { rowCount: 1 };
      }
      return { rows: [] };
    }
  };
}

function makeRes() {
  return { _s: null, _b: null, status: function (c) { this._s = c; return this; }, json: function (b) { this._b = b; } };
}

const ph = { capture: function () {} };

(async function () {
  const { handleDeleteProduct } = require('../src/web-ui/routes/products');
  console.log('check-vdp-s1-delete-product-artefacts');

  // T1 (AC1): a product whose journey has artefacts deletes cleanly
  {
    const pool = makeFkPool({ productId: 'p1', tenantId: 't1', journeys: [{ id: 'j1' }], artefacts: [{ journey_id: 'j1' }, { journey_id: 'j1' }] });
    const res = makeRes();
    let threw = null;
    try { await handleDeleteProduct({ session: { tenantId: 't1', login: 'u' }, params: { id: 'p1' } }, res, null, pool, ph); }
    catch (e) { threw = e; }
    ok(threw === null && res._s === 200 && pool.state.productDeleted === true && pool.state.artefacts.length === 0 && pool.state.journeys.length === 0,
      'T1 (AC1): product with journey artefacts is deleted with its artefacts and journeys, answering 200' + (threw ? ' (threw: ' + threw.message + ')' : ''));
  }

  // T2 (AC2): artefacts are deleted before journeys
  {
    const pool = makeFkPool({ productId: 'p2', tenantId: 't1', journeys: [{ id: 'j2' }], artefacts: [{ journey_id: 'j2' }] });
    try { await handleDeleteProduct({ session: { tenantId: 't1', login: 'u' }, params: { id: 'p2' } }, makeRes(), null, pool, ph); } catch (e) { /* order is asserted below */ }
    const a = pool.log.indexOf('delete-artefacts');
    const j = pool.log.indexOf('delete-journeys');
    ok(a !== -1 && j !== -1 && a < j, 'T2 (AC2): the artefacts delete is issued before the journeys delete');
  }

  // T3 (AC3): another tenant's product answers 404 and deletes nothing
  {
    const pool = makeFkPool({ productId: 'p3', tenantId: 'other', journeys: [{ id: 'j3' }], artefacts: [{ journey_id: 'j3' }] });
    const res = makeRes();
    await handleDeleteProduct({ session: { tenantId: 't1', login: 'u' }, params: { id: 'p3' } }, res, null, pool, ph);
    ok(res._s === 404 && !pool.state.productDeleted && pool.state.artefacts.length === 1 && pool.log.indexOf('delete-artefacts') === -1,
      'T3 (AC3): another tenant\'s product answers 404 and nothing is deleted');
  }

  // T4 (AC4): a product with no journeys still deletes
  {
    const pool = makeFkPool({ productId: 'p4', tenantId: 't1', journeys: [], artefacts: [] });
    const res = makeRes();
    await handleDeleteProduct({ session: { tenantId: 't1', login: 'u' }, params: { id: 'p4' } }, res, null, pool, ph);
    ok(res._s === 200 && pool.state.productDeleted === true, 'T4 (AC4): a product with no journeys is deleted, answering 200');
  }

  // T5 (AC5): the review checklist records the pattern and still validates
  {
    const root = path.resolve(__dirname, '..');
    const checklist = require('../scripts/review-checklist');
    const items = checklist.parseChecklist(fs.readFileSync(path.join(root, 'REVIEW.md'), 'utf8')).items;
    const diff = [
      '+++ b/src/web-ui/routes/products.js',
      '@@ -1,0 +10,1 @@',
      "+  await _pool.query('DELETE FROM journeys WHERE product_id = $1', [productId]);"
    ].join('\n');
    const triggered = checklist.triggeredItems(items, checklist.parseDiff(diff));
    const listed = triggered.some(function (t) { return /artefacts/i.test(t.item.check) && /foreign key|dependent/i.test(t.item.check); });
    const run = spawnSync(process.execPath, [path.join(root, 'scripts', 'review-checklist.js'), '--check'], { cwd: root, encoding: 'utf8' });
    ok(listed && run.status === 0, 'T5 (AC5): an added DELETE FROM journeys line lists the new item, and --check exits 0');
  }

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed === 0 ? 0 : 1);
})();
