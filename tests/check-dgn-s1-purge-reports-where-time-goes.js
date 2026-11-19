#!/usr/bin/env node
// check-dgn-s1-purge-reports-where-time-goes.js -- AC verification for dgn-s1
// (the staging purge reports which delete is slow or failing, and where it was when it timed out).
// Fake database objects only: no staging access, no network. The CLI case runs the script as a
// child process against an unreachable local port, so the wiring is checked by what it prints.
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const scriptPath = path.join(root, 'scripts', 'purge-e2e-tenants.js');

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else { console.log('  ✗ ' + label); failed++; }
}

function freshRequire() {
  delete require.cache[require.resolve(scriptPath)];
  return require(scriptPath);
}

const PURGE_TABLES = ['artefacts', 'journeys', 'products', 'credits', 'credit_audit_log', 'tenant_plan',
  'user_roles', 'team_memberships', 'impersonation_audit_log', 'github_first_login', 'users'];
const FIND_TABLES = ['credits', 'journeys', 'team_memberships', 'users'];
const FK_ERROR = 'update or delete on table "journeys" violates foreign key constraint "session_turns_journey_id_fkey" on table "session_turns"';

// A fake database: find queries (SELECT DISTINCT) return `tenantCount` ids from the first query only;
// deletes return rowCount 1; `failJourneys` makes the journeys delete throw the staging error text.
function makeDb(tenantCount, failJourneys) {
  const log = [];
  const ids = [];
  for (let i = 0; i < tenantCount; i++) ids.push('e2e-test-' + i);
  let firstFind = true;
  return {
    log: log,
    query: async function (sql, params) {
      log.push(JSON.stringify([sql, params === undefined ? null : params]));
      if (/^SELECT DISTINCT/.test(sql)) {
        if (firstFind) { firstFind = false; return { rows: ids.map(function (id) { return { id: id }; }) }; }
        return { rows: [] };
      }
      if (failJourneys && /^DELETE FROM journeys WHERE tenant_id = ANY/.test(sql)) throw new Error(FK_ERROR);
      return { rowCount: 1 };
    }
  };
}

(async function () {
  console.log('check-dgn-s1-purge-reports-where-time-goes');
  let mod = freshRequire();

  console.log('T1 (AC1): one event per query, with table, elapsed ms, row count and chunk');
  {
    const events = [];
    await mod.purgeE2eTenants(makeDb(450, false), { report: function (e) { events.push(e); } });
    const done = events.filter(function (e) { return e.status === 'done'; });
    const find = done.filter(function (e) { return e.phase === 'find'; });
    const purge = done.filter(function (e) { return e.phase === 'purge'; });
    ok(find.length === 4 && JSON.stringify(find.map(function (e) { return e.table; })) === JSON.stringify(FIND_TABLES),
      '4 find events, for ' + FIND_TABLES.join(', ') + ' (saw ' + find.length + ')');
    ok(purge.length === 33, '33 purge events: 11 deletes in each of 3 chunks of 200, 200 and 50 (saw ' + purge.length + ')');
    ok(JSON.stringify(purge.slice(0, 11).map(function (e) { return e.table; })) === JSON.stringify(PURGE_TABLES),
      'the first chunk reports the 11 tables in the order they run');
    ok(purge.every(function (e) { return typeof e.ms === 'number' && e.ms >= 0 && typeof e.rowCount === 'number'; }),
      'every purge event has numeric ms and rowCount');
    ok([1, 2, 3].every(function (c) { return purge.filter(function (e) { return e.chunk === c && e.chunks === 3; }).length === 11; }),
      'events carry chunk 1, 2 and 3 of 3, 11 each');
    ok(events.filter(function (e) { return e.status === 'start'; }).length === 37, 'a start event precedes each of the 37 queries');
  }

  console.log('T2 (AC2): a failing delete is reported, the purge continues, nothing throws');
  {
    const events = [];
    let threw = null; let result = null;
    try { result = await mod.purgeE2eTenants(makeDb(3, true), { report: function (e) { events.push(e); } }); } catch (e) { threw = e; }
    const done = events.filter(function (e) { return e.status === 'done' && e.phase === 'purge'; });
    const j = done.filter(function (e) { return e.table === 'journeys'; })[0];
    ok(threw === null && result && result.tenantCount === 3, 'no error is thrown and 3 tenants are counted');
    ok(j && j.error === FK_ERROR, 'the journeys delete reports the foreign key error message');
    const after = done.map(function (e) { return e.table; });
    ok(after.length === 11 && after.slice(after.indexOf('journeys') + 1).join(',') === PURGE_TABLES.slice(2).join(','),
      'the nine tables after journeys still ran');
  }

  console.log('T3 (AC3): the summary aggregates per table and prints the first error once');
  {
    const r = mod.createPurgeReport();
    await mod.purgeE2eTenants(makeDb(450, true), { report: r.report });
    const text = r.summarize();
    ok(/purge journeys: calls=3 ms=\d+ rows=0 errors=3/.test(text), 'journeys: 3 calls, 0 rows, 3 errors');
    ok(/purge products: calls=3 ms=\d+ rows=3 errors=0/.test(text), 'products: 3 calls, 3 rows, 0 errors');
    ok(/find credits: calls=1 ms=\d+ rows=\d+ errors=0/.test(text), 'the find step is summarised per table');
    ok(text.split('session_turns_journey_id_fkey').length - 1 === 1, 'the first error message appears once, not once per chunk');
    ok(/tenants through completed chunks: 450/.test(text), 'the summary states 450 tenants went through completed chunks');
  }

  console.log('T4 (AC4): the failure message names the chunk, table and tenants through completed chunks');
  {
    const base = mod.formatPurgeFailureMessage(new Error('timed out'), [1, 2, 3]);
    ok(base === 'purge-e2e-tenants failed (non-blocking), found 3 tenant(s) but did not finish purging them: timed out',
      'the two-argument message is unchanged');
    const msg = mod.formatPurgeFailureMessage(new Error('timed out'), new Array(8414), { phase: 'purge', table: 'journeys', chunk: 3, chunks: 43, tenantsDone: 400 });
    ok(/found 8414 tenant\(s\)/.test(msg) && /chunk 3 of 43/.test(msg) && /journeys/.test(msg) && /400 tenant\(s\) through completed chunks/.test(msg),
      'the message adds chunk 3 of 43, table journeys and 400 tenants through completed chunks');
    const r = mod.createPurgeReport();
    r.report({ status: 'start', phase: 'purge', table: 'artefacts', chunk: 1, chunks: 43, chunkSize: 200 });
    ok(r.progress.table === 'artefacts' && r.progress.chunk === 1 && r.progress.chunks === 43, 'progress follows the query that has started');
  }

  console.log('T5 (AC5): the same queries, in the same order, with and without a report hook');
  {
    mod = freshRequire();
    const a = makeDb(450, false); const ra = await mod.purgeE2eTenants(a);
    const b = makeDb(450, false); const events = []; const rb = await mod.purgeE2eTenants(b, { report: function (e) { events.push(e); } });
    const c = makeDb(450, false); const rc = await mod.purgeE2eTenants(c, { report: function () { throw new Error('hook failure'); } });
    ok(a.log.length === 37 && JSON.stringify(a.log) === JSON.stringify(b.log), 'no hook and a recording hook issue identical queries and parameters (37 each)');
    ok(JSON.stringify(a.log) === JSON.stringify(c.log) && rc.tenantCount === 450, 'a hook that throws changes neither the queries nor the result');
    ok(ra.tenantCount === 450 && rb.tenantCount === 450 && JSON.stringify(ra.tenantIds) === JSON.stringify(rb.tenantIds), 'the result is identical');
    ok(!a.log.some(function (l) { return /session_turns/.test(l); }), 'no session_turns query is issued (no behaviour change)');
  }

  console.log('T6 (AC3, wiring): the CLI prints the summary, and still exits 0, against an unreachable database');
  {
    const run = spawnSync(process.execPath, [scriptPath], {
      cwd: root, encoding: 'utf8', timeout: 60000,
      env: Object.assign({}, process.env, { DATABASE_URL: 'postgres://u:p@127.0.0.1:1/none', PURGE_E2E_TENANTS_TIMEOUT_MS: '30000' })
    });
    const out = (run.stdout || '') + (run.stderr || '');
    ok(run.status === 0, 'exit code 0 (saw ' + run.status + ')');
    ok(/\[purge\] summary/.test(out) && /find credits: calls=1/.test(out), 'the output contains the summary block with the find timings');
  }

  console.log('T7 (AC6): the three existing purge tests pass unchanged');
  ['check-pebd-s1-purge-e2e-tenants-batch-delete.js', 'check-alrf-s11-purge-e2e-tenants.js', 'check-stcs-s1-purge-e2e-tenants-cold-start-and-schedule.js'].forEach(function (f) {
    const run = spawnSync(process.execPath, [path.join(root, 'tests', f)], { cwd: root, encoding: 'utf8', timeout: 120000 });
    ok(run.status === 0, f + ' exits 0 (saw ' + run.status + ')');
  });

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
