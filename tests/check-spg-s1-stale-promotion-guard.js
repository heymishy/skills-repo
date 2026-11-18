#!/usr/bin/env node
// check-spg-s1-stale-promotion-guard.js -- AC verification for spg-s1
// (a production promotion refuses any commit that is not the head of master,
// and superseded waiting promotions are cancelled).
// The two scripts are run as child processes against a local fake GitHub API,
// so the real wiring (token header, API url, exit codes) is what is asserted.
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const WORKFLOW = path.join(root, '.github', 'workflows', 'staging-deploy.yml');
const GUARD = path.join(root, 'scripts', 'promotion-guard.js');
const CANCEL = path.join(root, 'scripts', 'cancel-superseded-promotions.js');
const STAGING_PATH = '.github/workflows/staging-deploy.yml';

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else { console.log('  ✗ ' + label); failed++; }
}

// A fake GitHub API. handler(req, body) returns { status, json } and may record calls.
function startApi(handler) {
  return new Promise(function (resolve) {
    const calls = [];
    const server = http.createServer(function (req, res) {
      calls.push({ method: req.method, url: req.url, auth: req.headers.authorization });
      const out = handler(req) || { status: 404, json: {} };
      res.writeHead(out.status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(out.json === undefined ? {} : out.json));
    });
    server.listen(0, '127.0.0.1', function () {
      resolve({ url: 'http://127.0.0.1:' + server.address().port, calls: calls, close: function () { server.close(); } });
    });
  });
}

function runScript(script, env) {
  return new Promise(function (resolve) {
    if (!fs.existsSync(script)) { resolve({ code: 127, out: 'missing ' + script }); return; }
    const child = spawn(process.execPath, [script], { cwd: root, env: Object.assign({}, process.env, env) });
    let out = '';
    child.stdout.on('data', function (d) { out += d; });
    child.stderr.on('data', function (d) { out += d; });
    child.on('close', function (code) { resolve({ code: code, out: out }); });
  });
}

function splitJobs(content) {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex(function (l) { return /^jobs:\s*$/.test(l); });
  const jobs = {};
  let current = null;
  for (let i = start + 1; i < lines.length; i++) {
    const m = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(lines[i]);
    if (m) { current = m[1]; jobs[current] = []; continue; }
    if (current) jobs[current].push(lines[i]);
  }
  Object.keys(jobs).forEach(function (k) { jobs[k] = jobs[k].join('\n'); });
  return jobs;
}

const RUN_SHA = 'a'.repeat(40);
const HEAD_SHA = 'b'.repeat(40);
const guardEnv = function (api, extra) {
  return Object.assign({ GITHUB_API_URL: api, GITHUB_REPOSITORY: 'o/r', GITHUB_TOKEN: 'tok', GITHUB_SHA: RUN_SHA }, extra || {});
};

(async function () {
  console.log('check-spg-s1-stale-promotion-guard');

  // T1 (AC1): the run commit differs from the master head -> non-zero, both commits printed
  {
    const api = await startApi(function () { return { status: 200, json: { sha: HEAD_SHA } }; });
    const r = await runScript(GUARD, guardEnv(api.url));
    api.close();
    ok(r.code === 1 && r.out.indexOf(RUN_SHA) !== -1 && r.out.indexOf(HEAD_SHA) !== -1,
      'T1 (AC1): a commit that is not the master head fails the guard and both commits are printed');
  }

  // T2 (AC2): equal -> exit 0, and the token is sent as a bearer header to the commits endpoint
  {
    const api = await startApi(function () { return { status: 200, json: { sha: RUN_SHA } }; });
    const r = await runScript(GUARD, guardEnv(api.url));
    api.close();
    const call = api.calls[0] || {};
    ok(r.code === 0 && call.auth === 'Bearer tok' && /\/repos\/o\/r\/commits\/master$/.test(call.url || ''),
      'T2 (AC2): the head commit passes, reading /repos/o/r/commits/master with the bearer token');
  }

  // T3 (AC3): request error -> fail closed; and the unwired default throws
  {
    const dead = await startApi(function () { return null; });
    const url = dead.url;
    dead.close();
    const r = await runScript(GUARD, guardEnv(url));
    const guard = fs.existsSync(GUARD) ? require(GUARD) : null;
    let unwired = '';
    if (guard) { try { await guard.checkPromotion(RUN_SHA, { fetchMasterHead: undefined }); } catch (e) { unwired = String(e.message); } }
    let res = null;
    if (guard) { res = await guard.checkPromotion(RUN_SHA); }
    ok(r.code === 1 && res && res.ok === false && /Adapter not wired/.test(res.reason || unwired),
      'T3 (AC3): an unreachable API fails closed, and the unwired default fails with "Adapter not wired"');
  }

  // T4 (AC3): non-200 answer -> fail closed
  {
    const api = await startApi(function () { return { status: 500, json: { message: 'boom' } }; });
    const r = await runScript(GUARD, guardEnv(api.url, { GITHUB_SHA: HEAD_SHA }));
    api.close();
    ok(r.code === 1, 'T4 (AC3): a non-200 answer fails closed even when the shas would match');
  }

  // T5 (AC3): 200 with no commit -> fail closed
  {
    const api = await startApi(function () { return { status: 200, json: { message: 'no sha here' } }; });
    const r = await runScript(GUARD, guardEnv(api.url, { GITHUB_SHA: HEAD_SHA }));
    api.close();
    ok(r.code === 1, 'T5 (AC3): an answer with no commit sha fails closed');
  }

  // T6 (AC4): guard step order in promote-to-prod, needs and environment kept, no if:
  {
    const text = fs.readFileSync(WORKFLOW, 'utf8');
    const promote = splitJobs(text)['promote-to-prod'] || '';
    const guardAt = promote.indexOf('promotion-guard.js');
    const checkoutAt = promote.indexOf('actions/checkout');
    const flyAt = promote.search(/flyctl/);
    const ifLines = promote.split('\n').filter(function (l) { return /^\s*(-\s*)?if:/.test(l); });
    ok(checkoutAt !== -1 && guardAt > checkoutAt && flyAt > guardAt &&
      /-\s*smoke-test\b/.test(promote) && /-\s*post-deploy-e2e-confirm\b/.test(promote) &&
      /environment:\s*production/.test(promote) && ifLines.length === 0,
      'T6 (AC4): the guard step follows checkout and precedes every flyctl step; needs and environment are kept; no if: lines');
  }

  // T7 (AC5): cancels exactly the waiting, older Staging Deploy runs (across two pages)
  {
    const older = [];
    for (let i = 0; i < 100; i++) older.push({ id: 1000 + i, run_number: 5 + (i % 5), status: 'waiting', path: STAGING_PATH });
    const page2 = [
      { id: 2001, run_number: 9, status: 'waiting', path: STAGING_PATH },
      { id: 2002, run_number: 11, status: 'waiting', path: STAGING_PATH },   // the current run
      { id: 2003, run_number: 12, status: 'waiting', path: STAGING_PATH },   // newer
      { id: 2004, run_number: 8, status: 'queued', path: STAGING_PATH },     // not waiting
      { id: 2005, run_number: 8, status: 'in_progress', path: STAGING_PATH },
      { id: 2006, run_number: 7, status: 'waiting', path: '.github/workflows/other.yml' } // other workflow
    ];
    const api = await startApi(function (req) {
      const m = /\/runs\?.*page=(\d+)/.exec(req.url);
      if (req.method === 'GET' && m) return { status: 200, json: { workflow_runs: m[1] === '1' ? older : (m[1] === '2' ? page2 : []) } };
      if (req.method === 'POST' && /\/actions\/runs\/\d+\/cancel$/.test(req.url)) return { status: 202, json: {} };
      return { status: 404, json: {} };
    });
    const r = await runScript(CANCEL, { GITHUB_API_URL: api.url, GITHUB_REPOSITORY: 'o/r', GITHUB_TOKEN: 'tok', GITHUB_RUN_NUMBER: '11' });
    api.close();
    const cancelled = api.calls.filter(function (c) { return c.method === 'POST'; }).map(function (c) { return Number(/runs\/(\d+)\/cancel/.exec(c.url)[1]); }).sort(function (a, b) { return a - b; });
    const expected = older.map(function (x) { return x.id; }).concat([2001]).sort(function (a, b) { return a - b; });
    ok(r.code === 0 && JSON.stringify(cancelled) === JSON.stringify(expected) && api.calls.every(function (c) { return c.auth === 'Bearer tok'; }),
      'T7 (AC5): cancels exactly the 101 waiting, older Staging Deploy runs; leaves current, newer, queued, in-progress and other-workflow runs alone');
  }

  // T8 (AC5): a failing cancel is logged and does not fail the script; the next run is still tried
  {
    const runs = [
      { id: 3001, run_number: 3, status: 'waiting', path: STAGING_PATH },
      { id: 3002, run_number: 4, status: 'waiting', path: STAGING_PATH }
    ];
    const api = await startApi(function (req) {
      if (req.method === 'GET') return { status: 200, json: { workflow_runs: /page=1/.test(req.url) ? runs : [] } };
      if (/runs\/3001\/cancel$/.test(req.url)) return { status: 500, json: {} };
      return { status: 202, json: {} };
    });
    const r = await runScript(CANCEL, { GITHUB_API_URL: api.url, GITHUB_REPOSITORY: 'o/r', GITHUB_TOKEN: 'tok', GITHUB_RUN_NUMBER: '10' });
    api.close();
    const tried = api.calls.filter(function (c) { return c.method === 'POST'; }).length;
    ok(r.code === 0 && tried === 2 && /3001/.test(r.out), 'T8 (AC5): a failing cancel is logged (naming the run), the script exits 0 and still tries the next run');
  }

  // T9 (AC6): the cancel job runs after deploy-staging, holds actions: write alone, scripts get the token
  {
    const text = fs.readFileSync(WORKFLOW, 'utf8');
    const jobs = splitJobs(text);
    const cancel = jobs['cancel-superseded'] || '';
    const holders = Object.keys(jobs).filter(function (k) { return /actions:\s*write/.test(jobs[k]); });
    ok(/needs:\s*deploy-staging\b/.test(cancel) && holders.length === 1 && holders[0] === 'cancel-superseded' &&
      /cancel-superseded-promotions\.js/.test(cancel) && /GITHUB_TOKEN:\s*\$\{\{\s*secrets\.GITHUB_TOKEN\s*\}\}/.test(cancel) &&
      /GITHUB_TOKEN:\s*\$\{\{\s*secrets\.GITHUB_TOKEN\s*\}\}/.test(jobs['promote-to-prod'] || ''),
      'T9 (AC6): cancel-superseded needs deploy-staging, is the only job with actions: write, and both scripts are given the workflow token');
  }

  // T10 (baseline): the existing promote-gate check still passes
  {
    const r = spawnSync(process.execPath, [path.join(root, 'tests', 'check-bri-s2.6-smoke-test-promote-gate.js')], { cwd: root, encoding: 'utf8' });
    ok(r.status === 0, 'T10 (baseline): tests/check-bri-s2.6-smoke-test-promote-gate.js still passes');
  }

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed === 0 ? 0 : 1);
})();
