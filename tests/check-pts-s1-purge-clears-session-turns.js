#!/usr/bin/env node
// check-pts-s1-purge-clears-session-turns.js -- AC verification for pts-s1
// (the e2e purge and cleanup scripts clear a journey's session history before the journey; staging log,
// Staging Deploy run 44592470706: journeys delete failed on session_turns_journey_id_fkey in 35 of 35 chunks).
// Fake databases enforce both foreign keys with no cascade. No staging access, no network.
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
function fresh(rel) {
  const p = path.join(root, rel);
  delete require.cache[require.resolve(p)];
  return require(p);
}

const FK_ERROR = 'update or delete on table "journeys" violates foreign key constraint "session_turns_journey_id_fkey" on table "session_turns"';
const CHILDREN = ['session_turns', 'artefacts'];

// State: { journeys: [{ journey_id, tenant_id, product_id }], session_turns: [{ journey_id }], artefacts: [{ journey_id }],
//          journeysRows: [...] for a SELECT } . Deleting journeys while a child row still points at one throws FK_ERROR.
function makeFkDb(state, options) {
  const opts = options || {};
  const log = [];
  function targets(sql, p) {
    let m = sql.match(/WHERE tenant_id = (ANY\(\$1::text\[\]\)|\$1)/);
    if (m) { const ids = Array.isArray(p[0]) ? p[0] : [p[0]]; return state.journeys.filter(function (j) { return ids.indexOf(j.tenant_id) !== -1; }); }
    m = sql.match(/WHERE product_id = \$1/);
    if (m) return state.journeys.filter(function (j) { return j.product_id === p[0]; });
    m = sql.match(/WHERE journey_id = (ANY\(\$1\)|\$1)/);
    if (m) { const ids = Array.isArray(p[0]) ? p[0] : [p[0]]; return state.journeys.filter(function (j) { return ids.indexOf(j.journey_id) !== -1; }); }
    return [];
  }
  return {
    log: log,
    query: async function (sql, params) {
      const s = String(sql).replace(/\s+/g, ' ').trim();
      log.push(s);
      const p = params || [];
      if (/^SELECT journey_id, tenant_id, owner_id/.test(s)) return { rows: state.selectRows || [] };
      if (/^SELECT DISTINCT/.test(s)) return { rows: (state.found || []).map(function (id) { return { id: id }; }) };
      let m = s.match(/^DELETE FROM (session_turns|artefacts) WHERE journey_id /);
      if (m) {
        if (opts.failChild === m[1]) throw new Error('simulated failure of the ' + m[1] + ' delete');
        const ids = targets(s, p).map(function (j) { return j.journey_id; });
        const before = state[m[1]].length;
        state[m[1]] = state[m[1]].filter(function (r) { return ids.indexOf(r.journey_id) === -1; });
        return { rowCount: before - state[m[1]].length };
      }
      if (/^DELETE FROM journeys WHERE /.test(s)) {
        const hit = targets(s, p);
        const ids = hit.map(function (j) { return j.journey_id; });
        CHILDREN.forEach(function (t) {
          if (state[t].some(function (r) { return ids.indexOf(r.journey_id) !== -1; })) throw new Error(FK_ERROR);
        });
        state.journeys = state.journeys.filter(function (j) { return ids.indexOf(j.journey_id) === -1; });
        return { rowCount: hit.length };
      }
      if (/^DELETE FROM products WHERE product_id/.test(s)) { state.productDeleted = true; return { rowCount: 1 }; }
      return { rowCount: 0 };
    }
  };
}

function seed() {
  return {
    journeys: [{ journey_id: 'ja', tenant_id: 'e2e-test-a', product_id: 'p1' }, { journey_id: 'jb', tenant_id: 'e2e-test-b', product_id: null }],
    session_turns: [{ journey_id: 'ja' }, { journey_id: 'ja' }],
    artefacts: [{ journey_id: 'ja' }, { journey_id: 'jb' }]
  };
}

// The statements of one purgeTenantsBatch chunk as they are on master (the ten that must not change are literal here).
const BATCH_SQL = [
  'DELETE FROM session_turns WHERE journey_id IN (SELECT journey_id FROM journeys WHERE tenant_id = ANY($1::text[]))',
  'DELETE FROM artefacts WHERE journey_id IN (SELECT journey_id FROM journeys WHERE tenant_id = ANY($1::text[]))',
  'DELETE FROM journeys WHERE tenant_id = ANY($1::text[])',
  'DELETE FROM products WHERE tenant_id = ANY($1::text[])',
  'DELETE FROM credits WHERE tenant_id = ANY($1::text[])',
  'DELETE FROM credit_audit_log WHERE tenant_id = ANY($1::text[])',
  'DELETE FROM tenant_plan WHERE tenant_id = ANY($1::text[])',
  'DELETE FROM user_roles WHERE tenant_id = ANY($1::text[])',
  'DELETE FROM team_memberships WHERE tenant_id = ANY($1::text[])',
  'DELETE FROM impersonation_audit_log WHERE admin_tenant_id = ANY($1::text[]) OR target_tenant_id = ANY($1::text[])',
  'DELETE FROM github_first_login WHERE github_user_id = ANY($1::text[])',
  'DELETE FROM users WHERE email = ANY($1::text[])'
];

// Scanner behind AC6: does a source text that deletes from journeys also handle every child table?
function siteIsHandled(text) {
  if (/JOURNEY_CHILD_TABLES/.test(text)) return true;
  return CHILDREN.every(function (t) { return new RegExp('DELETE FROM ' + t + '\\b').test(text); });
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
  console.log('check-pts-s1-purge-clears-session-turns');
  const purge = fresh('scripts/purge-e2e-tenants.js');

  console.log('T1 (AC1): a chunk whose journey has session turns is deleted, with no error');
  {
    const st = seed(); const db = makeFkDb(st); const events = [];
    let threw = null;
    try { await purge.purgeTenantsBatch(db, ['e2e-test-a', 'e2e-test-b'], function (e) { events.push(e); }, { chunk: 1, chunks: 1 }); } catch (e) { threw = e; }
    ok(threw === null && st.journeys.length === 0 && st.session_turns.length === 0 && st.artefacts.length === 0,
      'session turns, artefacts and journeys are all removed' + (threw ? ' (threw: ' + threw.message + ')' : ''));
    ok(events.filter(function (e) { return e.status === 'done' && e.error; }).length === 0, 'no statement reported an error (the journeys delete no longer hits the foreign key)');
  }

  console.log('T2 (AC2): purgeTenant clears the same tables in the same order');
  {
    const st = seed(); const db = makeFkDb(st);
    await purge.purgeTenant(db, 'e2e-test-a');
    const order = db.log.map(function (s) { return (s.match(/^DELETE FROM (\w+)/) || [])[1]; });
    ok(st.journeys.every(function (j) { return j.tenant_id !== 'e2e-test-a'; }) && st.session_turns.length === 0, 'the tenant\'s journey and its session turns are gone');
    ok(order.slice(0, 3).join(',') === 'session_turns,artefacts,journeys', 'the first three statements are session_turns, artefacts, journeys (saw ' + order.slice(0, 3).join(',') + ')');
  }

  console.log('T3 (AC3): statement order, and the other ten statements are byte-identical to master');
  {
    const st = seed(); const db = makeFkDb(st);
    await purge.purgeTenantsBatch(db, ['e2e-test-a']);
    ok(JSON.stringify(db.log) === JSON.stringify(BATCH_SQL), 'the 12 statements are exactly: session_turns, artefacts, journeys, then the nine others, as master has them' +
      (JSON.stringify(db.log) === JSON.stringify(BATCH_SQL) ? '' : ' (saw ' + JSON.stringify(db.log.map(function (s) { return s.slice(0, 40); })) + ')'));
  }

  console.log('T4 (AC4): clean-e2e-staging-data.js clears session turns, artefacts, then journeys when confirmed');
  {
    const clean = fresh('scripts/clean-e2e-staging-data.js');
    const st = seed(); st.selectRows = [{ journey_id: 'ja' }, { journey_id: 'jb' }];
    const db = makeFkDb(st);
    const dry = await clean.run(db, { confirm: false });
    ok(db.log.every(function (s) { return !/^DELETE/.test(s); }) && dry.deleted === false, 'without confirm no DELETE is issued');
    let r = { deleted: false }; let threw = null;
    try { r = await clean.run(db, { confirm: true }); } catch (e) { threw = e; }
    const dels = db.log.filter(function (s) { return /^DELETE/.test(s); }).map(function (s) { return s.match(/^DELETE FROM (\w+)/)[1]; });
    ok(threw === null && r.deleted === true && dels.join(',') === 'session_turns,artefacts,journeys' && st.journeys.length === 0 && st.session_turns.length === 0,
      'confirm deletes session_turns, artefacts, journeys (saw ' + dels.join(',') + ')' + (threw ? ' (threw: ' + threw.message + ')' : ''));
  }

  console.log('T5 (AC5): cleanup-e2e-staging-data.js deleteJourneyRow clears children first');
  {
    const cleanup = fresh('scripts/cleanup-e2e-staging-data.js');
    const st = seed(); const db = makeFkDb(st);
    let threw = null;
    try { await cleanup.deleteJourneyRow(db, { journey_id: 'ja' }); } catch (e) { threw = e; }
    const order = db.log.map(function (s) { return s.match(/^DELETE FROM (\w+)/)[1]; });
    ok(threw === null && order.join(',') === 'session_turns,artefacts,journeys' && st.journeys.every(function (j) { return j.journey_id !== 'ja'; }),
      'session_turns, artefacts, journeys, and the journey is gone' + (threw ? ' (threw: ' + threw.message + ')' : ''));
  }

  console.log('T6 (AC5): deleteProduct clears the children of the product\'s journeys before journeys, then the product');
  {
    const cleanup = fresh('scripts/cleanup-e2e-staging-data.js');
    const st = seed(); const db = makeFkDb(st);
    let threw = null;
    try { await cleanup.deleteProduct(db, { product_id: 'p1' }); } catch (e) { threw = e; }
    const order = db.log.map(function (s) { return s.match(/^DELETE FROM (\w+)/)[1]; });
    ok(threw === null && order.join(',') === 'session_turns,artefacts,journeys,products' && st.productDeleted === true && st.session_turns.length === 0,
      'session_turns, artefacts, journeys, products' + (threw ? ' (threw: ' + threw.message + ')' : ' (saw ' + order.join(',') + ')'));
  }

  console.log('T7 (AC6): every file that deletes from journeys handles every child table');
  {
    const files = walk(path.join(root, 'src'), []).concat(walk(path.join(root, 'scripts'), []));
    const ALLOW = { 'scripts/smoke-test-pg.js': 'deletes only the one journey row it just inserted, which has no child rows' };
    const sites = files.filter(function (f) { return /DELETE FROM journeys/.test(fs.readFileSync(f, 'utf8')); })
      .map(function (f) { return path.relative(root, f).replace(/\\/g, '/'); });
    const unhandled = sites.filter(function (rel) { return !ALLOW[rel] && !siteIsHandled(fs.readFileSync(path.join(root, rel), 'utf8')); });
    ok(sites.length >= 6, 'the scan finds the known sites (found ' + sites.length + ': ' + sites.join(', ') + ')');
    ok(unhandled.length === 0, 'no site is missing a child table' + (unhandled.length ? ' (missing: ' + unhandled.join(', ') + ')' : ''));
  }

  console.log('T8 (AC6): the scanner reports a file that deletes journeys without the child tables');
  {
    ok(siteIsHandled("await db.query('DELETE FROM session_turns WHERE x');\nawait db.query('DELETE FROM artefacts WHERE x');\nawait db.query('DELETE FROM journeys WHERE x');") === true, 'a file with both child deletes is accepted');
    ok(siteIsHandled("await db.query('DELETE FROM artefacts WHERE x');\nawait db.query('DELETE FROM journeys WHERE x');") === false, 'a file that deletes artefacts but not session_turns is reported');
    ok(siteIsHandled("for (const t of JOURNEY_CHILD_TABLES) {}\nawait db.query('DELETE FROM journeys WHERE x');") === true, 'a file that uses the shared list is accepted');
  }

  console.log('T9 (AC7): a failing child delete is non-fatal and reported; 12 tables per chunk');
  {
    const st = seed(); st.found = ['e2e-test-a', 'e2e-test-b'];
    const events = [];
    const db = makeFkDb(st, { failChild: 'session_turns' });
    let threw = null; let res = null;
    try { res = await purge.purgeE2eTenants(db, { report: function (e) { events.push(e); } }); } catch (e) { threw = e; }
    const done = events.filter(function (e) { return e.status === 'done' && e.phase === 'purge'; });
    ok(threw === null && res && res.tenantCount === 2, 'no error is thrown');
    ok(done.length === 12, '12 purge statements are reported for the one chunk (saw ' + done.length + ')');
    ok(done.filter(function (e) { return e.table === 'session_turns' && /simulated failure/.test(e.error || ''); }).length === 1, 'the failing session_turns delete is reported with its message');
  }

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
