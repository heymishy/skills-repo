'use strict';
// dfp-s1 -- runs the users and products scenarios against the in-memory test database and against real Postgres, and
// compares the results. The Postgres leg runs when DIFF_DATABASE_URL is set (CI sets it; see
// .github/workflows/fake-db-differential.yml). Without it the run prints that the leg was skipped and exits 0, unless
// DIFF_REQUIRE_PG=1, in which case it exits non-zero. The schema is created in its own schema, fake_diff, and nothing
// else is touched.
//
//   node tests/differential/run.js

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const { createFakeTestDb } = require(path.join(root, 'src', 'web-ui', 'adapters', 'fake-test-db.js'));
const { SCENARIOS } = require('./scenarios.js');
const { SCHEMA } = require('./schema.js');

const SCHEMA_NAME = 'fake_diff';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FAKE_ID = /^fake-product-\d+$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

// Whitespace is collapsed on both sides so the copy can be laid out differently from its source.
function collapse(s) { return String(s).replace(/\s+/g, ' ').trim(); }

// A generated id may differ in value by design (the fake's stand-in or a uuid); a timestamp may differ by its
// instant. Everything else must match exactly. An undefined value (a column the fake leaves unset) is null.
function normaliseValue(v) {
  if (v === undefined) return null;
  if (v instanceof Date) return '<ts>';
  if (typeof v === 'string') {
    if (UUID.test(v) || FAKE_ID.test(v)) return '<id>';
    if (ISO.test(v)) return '<ts>';
  }
  return v;
}

function normaliseRows(rows) {
  return (rows || []).map(function (row) {
    const out = {};
    Object.keys(row).sort().forEach(function (k) { out[k] = normaliseValue(row[k]); });
    return out;
  });
}

// Returns the list of differences; an empty list means the two results agree.
function compareResults(a, b) {
  if (a.error || b.error) {
    if (a.error === b.error) return [];
    return ['error: fake ' + JSON.stringify(a.error || 'rows') + ' vs postgres ' + JSON.stringify(b.error || 'rows')];
  }
  const ra = normaliseRows(a.rows);
  const rb = normaliseRows(b.rows);
  if (ra.length !== rb.length) return ['row count: fake ' + ra.length + ' vs postgres ' + rb.length];
  const problems = [];
  const colsA = ra.length ? Object.keys(ra[0]).join(',') : '';
  const colsB = rb.length ? Object.keys(rb[0]).join(',') : '';
  if (colsA !== colsB) problems.push('columns: fake [' + colsA + '] vs postgres [' + colsB + ']');
  ra.forEach(function (row, i) {
    const x = JSON.stringify(row);
    const y = JSON.stringify(rb[i]);
    if (x !== y) problems.push('value in row ' + (i + 1) + ': fake ' + x + ' vs postgres ' + y);
  });
  return problems;
}

// Every statement in the schema copy must appear, whitespace collapsed, in the source it is copied from.
function driftCheck(schema, readFile) {
  const problems = [];
  schema.forEach(function (s) {
    const text = readFile(s.source);
    if (collapse(text).indexOf(collapse(s.statement)) === -1) {
      problems.push(s.source + ': statement is no longer in the source: ' + collapse(s.statement).slice(0, 90));
    }
  });
  return problems;
}

async function runSteps(run, steps) {
  const ctx = {};
  const results = [];
  for (const step of steps) {
    const params = typeof step.params === 'function' ? step.params(ctx) : step.params;
    let out;
    try {
      const r = await run(step.sql, params);
      out = { rows: r.rows || [] };
      if (step.capture) step.capture(out.rows, ctx);
    } catch (e) {
      out = { error: e.code || e.message };
    }
    results.push({ name: step.name, result: out });
  }
  return results;
}

async function runPostgres(url) {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: url, options: '-c search_path=' + SCHEMA_NAME });
  try {
    await pool.query('DROP SCHEMA IF EXISTS ' + SCHEMA_NAME + ' CASCADE');
    await pool.query('CREATE SCHEMA ' + SCHEMA_NAME);
    for (const s of SCHEMA) await pool.query(s.statement);
    return await runSteps(function (sql, params) { return pool.query(sql, params); }, SCENARIOS);
  } finally {
    await pool.end();
  }
}

async function runFake() {
  const db = createFakeTestDb();
  return runSteps(function (sql, params) { return db.query(sql, params); }, SCENARIOS);
}

// Returns the process exit code.
async function main(opts) {
  const env = opts.env || {};
  const log = opts.log || console.log;
  const readFile = function (rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); };

  const drift = driftCheck(SCHEMA, readFile);
  if (drift.length) {
    drift.forEach(function (p) { log('[dfp-s1] drift: ' + p); });
    return 1;
  }

  const url = env.DIFF_DATABASE_URL;
  if (!url) {
    if (env.DIFF_REQUIRE_PG === '1') {
      log('[dfp-s1] DIFF_DATABASE_URL is not set and DIFF_REQUIRE_PG=1, so the real-Postgres leg cannot run.');
      return 1;
    }
    log('[dfp-s1] skipped: DIFF_DATABASE_URL is not set, so the real-Postgres leg did not run (CI sets it).');
    return 0;
  }

  const fake = await runFake();
  const pg = await runPostgres(url);
  let divergences = 0;
  fake.forEach(function (f, i) {
    const problems = compareResults(f.result, pg[i].result);
    if (problems.length) {
      divergences += problems.length;
      log('[dfp-s1] DIVERGES: ' + f.name);
      problems.forEach(function (p) { log('    ' + p); });
    } else {
      log('[dfp-s1] agrees: ' + f.name);
    }
  });
  log('[dfp-s1] ' + SCENARIOS.length + ' steps, ' + divergences + ' difference(s)');
  return divergences ? 1 : 0;
}

if (require.main === module) {
  main({ env: process.env, log: console.log }).then(function (code) { process.exitCode = code; },
    function (e) { console.error('[dfp-s1] ' + (e && e.stack || e)); process.exitCode = 1; });
}

module.exports = { main, normaliseValue, normaliseRows, compareResults, driftCheck };
