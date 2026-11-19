#!/usr/bin/env node
// check-vdp-s2-delete-product-session-turns.js -- AC verification for vdp-s2
// (deleting a product clears every table that references its journeys; staging
// 2026-11-19: session_turns_journey_id_fkey blocked DELETE /products/:id).
// Fake pools model the real foreign keys (no ON DELETE clause); no database, no network.
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else { console.log('  ✗ ' + label); failed++; }
}

// Child tables whose journey_id REFERENCES journeys(journey_id) with no cascade, as in the real schema.
const FK_TABLES = ['session_turns', 'artefacts'];

function makeFkPool(state) {
  const log = [];
  function mineJourneyIds() { return state.journeys.map(function (j) { return j.id; }); }
  return {
    log: log,
    state: state,
    query: async function (sql, params) {
      const s = String(sql).replace(/\s+/g, ' ').trim();
      if (/SELECT product_id, tenant_id FROM products WHERE product_id/i.test(s)) {
        log.push('select-product');
        if (params[0] !== state.productId) return { rows: [] };
        return { rows: [{ product_id: state.productId, tenant_id: state.tenantId }] };
      }
      const child = FK_TABLES.filter(function (t) { return new RegExp('^DELETE FROM ' + t + ' WHERE journey_id', 'i').test(s); })[0];
      if (child) {
        log.push('delete-' + child);
        const mine = mineJourneyIds();
        state[child] = state[child].filter(function (r) { return mine.indexOf(r.journey_id) === -1; });
        return { rowCount: 0 };
      }
      if (/^DELETE FROM journeys WHERE product_id/i.test(s)) {
        log.push('delete-journeys');
        const mine = mineJourneyIds();
        FK_TABLES.forEach(function (t) {
          if (state[t].some(function (r) { return mine.indexOf(r.journey_id) !== -1; })) {
            throw new Error('update or delete on table "journeys" violates foreign key constraint "' + t + '_journey_id_fkey" on table "' + t + '"');
          }
        });
        state.journeys = [];
        return { rowCount: 0 };
      }
      if (/^DELETE FROM products WHERE product_id/i.test(s)) {
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
const req = function (id) { return { session: { tenantId: 't1', login: 'u' }, params: { id: id } }; };

// The scanner behind AC6: names of tables created with a foreign key to journeys in some source text.
function tablesReferencingJourneys(text) {
  const found = [];
  text.split(/CREATE TABLE(?: IF NOT EXISTS)?\s+/i).slice(1).forEach(function (seg) {
    const name = (seg.match(/^([A-Za-z_][A-Za-z0-9_]*)/) || [])[1];
    const body = seg.split(/`|CREATE INDEX/i)[0];
    if (name && /REFERENCES\s+journeys\s*\(/i.test(body) && found.indexOf(name) === -1) found.push(name);
  });
  return found;
}

function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, out); }
    else if (/\.js$/.test(e.name)) out.push(p);
  });
  return out;
}

(async function () {
  console.log('check-vdp-s2-delete-product-session-turns');

  let childList = null;
  let listError = null;
  try { childList = require('../src/web-ui/utils/journey-child-tables').JOURNEY_CHILD_TABLES; }
  catch (e) { listError = e; }

  const { handleDeleteProduct } = require('../src/web-ui/routes/products');

  console.log('T1 (AC1): a product whose journey has session turns and artefacts deletes cleanly');
  {
    const pool = makeFkPool({ productId: 'p1', tenantId: 't1', journeys: [{ id: 'j1' }],
      session_turns: [{ journey_id: 'j1' }, { journey_id: 'j1' }], artefacts: [{ journey_id: 'j1' }] });
    const res = makeRes();
    let threw = null;
    try { await handleDeleteProduct(req('p1'), res, null, pool, ph); } catch (e) { threw = e; }
    ok(threw === null && res._s === 200 && pool.state.productDeleted === true && pool.state.session_turns.length === 0
      && pool.state.artefacts.length === 0 && pool.state.journeys.length === 0,
    'answers 200 and removes session turns, artefacts, journeys and the product' + (threw ? ' (threw: ' + threw.message + ')' : ''));
  }

  console.log('T2 (AC2): every child-table delete precedes journeys, and journeys precede products');
  {
    const pool = makeFkPool({ productId: 'p2', tenantId: 't1', journeys: [{ id: 'j2' }],
      session_turns: [{ journey_id: 'j2' }], artefacts: [{ journey_id: 'j2' }] });
    try { await handleDeleteProduct(req('p2'), makeRes(), null, pool, ph); } catch (e) { /* the order is what is asserted */ }
    const j = pool.log.indexOf('delete-journeys');
    const p = pool.log.indexOf('delete-product');
    FK_TABLES.forEach(function (t) {
      const i = pool.log.indexOf('delete-' + t);
      ok(i !== -1 && j !== -1 && i < j, t + ' is deleted before journeys');
    });
    ok(j !== -1 && p !== -1 && j < p, 'journeys are deleted before the product');
  }

  console.log('T3 (AC3): another tenant\'s product answers 404 and deletes nothing');
  {
    const pool = makeFkPool({ productId: 'p3', tenantId: 'other', journeys: [{ id: 'j3' }],
      session_turns: [{ journey_id: 'j3' }], artefacts: [{ journey_id: 'j3' }] });
    const res = makeRes();
    await handleDeleteProduct(req('p3'), res, null, pool, ph);
    ok(res._s === 404 && !pool.state.productDeleted && pool.log.every(function (l) { return l.indexOf('delete-') !== 0; }),
      '404 and no delete was issued');
  }

  console.log('T4 (AC4): a product with no journeys is deleted');
  {
    const pool = makeFkPool({ productId: 'p4', tenantId: 't1', journeys: [], session_turns: [], artefacts: [] });
    const res = makeRes();
    await handleDeleteProduct(req('p4'), res, null, pool, ph);
    ok(res._s === 200 && pool.state.productDeleted === true, 'answers 200 and deletes the product');
  }

  console.log('T5 (AC5): deleteJourney clears the same shared list, in order, then the journey');
  {
    const adapterPath = require.resolve('../src/web-ui/adapters/journey-store-pg.js');
    delete require.cache[adapterPath];
    const pg = require(adapterPath);
    const calls = [];
    pg._setPoolForTesting({ query: async function (sql) { calls.push(String(sql).replace(/\s+/g, ' ').trim()); return { rowCount: 1 }; } });
    await pg.deleteJourney('journey-1');
    const order = calls.map(function (c) { return (c.match(/^DELETE FROM (\w+)/i) || [])[1]; });
    ok(childList !== null && JSON.stringify(order) === JSON.stringify(childList.concat(['journeys'])),
      'delete order is ' + JSON.stringify(childList) + ' then journeys (saw ' + JSON.stringify(order) + ')');
  }

  console.log('T6 (AC6): every table that references journeys is in the shared list');
  {
    ok(listError === null, 'src/web-ui/utils/journey-child-tables.js loads' + (listError ? ' (' + listError.message + ')' : ''));
    const files = walk(path.join(root, 'src'), []).concat(
      fs.readdirSync(path.join(root, 'scripts')).filter(function (f) { return /^migrate-schema.*\.js$/.test(f); })
        .map(function (f) { return path.join(root, 'scripts', f); }));
    const referencing = [];
    files.forEach(function (f) {
      tablesReferencingJourneys(fs.readFileSync(f, 'utf8')).forEach(function (t) { if (referencing.indexOf(t) === -1) referencing.push(t); });
    });
    ok(referencing.length >= 2, 'the scanner finds the known tables (found ' + JSON.stringify(referencing) + ')');
    const missing = referencing.filter(function (t) { return !childList || childList.indexOf(t) === -1; });
    ok(missing.length === 0, 'no table is missing from the list' + (missing.length ? ' (missing: ' + missing.join(', ') + ')' : ''));
    const fixture = 'await pool.query(`CREATE TABLE IF NOT EXISTS review_notes (\n id SERIAL PRIMARY KEY,\n journey_id VARCHAR NOT NULL REFERENCES journeys(journey_id)\n )`);';
    const flagged = tablesReferencingJourneys(fixture);
    ok(flagged.length === 1 && flagged[0] === 'review_notes' && (!childList || childList.indexOf('review_notes') === -1),
      'a new table that references journeys is reported as missing (the guard would fail)');
  }

  console.log('T7 (AC6): the shared list is frozen');
  ok(Array.isArray(childList) && Object.isFrozen(childList), 'JOURNEY_CHILD_TABLES is a frozen array');

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
