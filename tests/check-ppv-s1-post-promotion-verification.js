#!/usr/bin/env node
// check-ppv-s1-post-promotion-verification.js -- AC verification for ppv-s1
// (after a production promotion, a read-only job confirms production runs the promoted build and answers
// /health, and opens one issue if not).
// The script is run as a child process against a fake production server and a fake GitHub API, so the real
// wiring (GET-only requests, no token sent to production, issue creation, de-duplication) is what is asserted.
// Polling logic is also driven in-process with an injected fetch and a fake clock; no network is used.
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const WORKFLOW = path.join(root, '.github', 'workflows', 'staging-deploy.yml');
const VERIFY = path.join(root, 'scripts', 'verify-production.js');

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else { console.log('  ✗ ' + label); failed++; }
}

const SHA = 'a'.repeat(40);
const OTHER_SHA = 'c'.repeat(40);
const RUN_ID = '4242424242';

// A fake production server. versionFor(n) / healthFor(n) return { status, json } for the n-th request of each kind.
function startProd(versionFor, healthFor) {
  return new Promise(function (resolve) {
    const seen = [];
    let nv = 0; let nh = 0;
    const server = http.createServer(function (req, res) {
      seen.push({ method: req.method, url: req.url, auth: req.headers.authorization });
      let out = { status: 404, json: {} };
      if (req.url === '/version') out = versionFor(nv++);
      else if (req.url === '/health') out = healthFor(nh++);
      res.writeHead(out.status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(out.json === undefined ? {} : out.json));
    });
    server.listen(0, '127.0.0.1', function () {
      resolve({ url: 'http://127.0.0.1:' + server.address().port, seen: seen, close: function () { server.close(); } });
    });
  });
}

// A fake GitHub API that records every call including the request body.
function startApi(handler) {
  return new Promise(function (resolve) {
    const calls = [];
    const server = http.createServer(function (req, res) {
      let raw = '';
      req.on('data', function (d) { raw += d; });
      req.on('end', function () {
        let body = null;
        try { body = raw ? JSON.parse(raw) : null; } catch (e) { body = raw; }
        const call = { method: req.method, url: req.url, auth: req.headers.authorization, body: body };
        calls.push(call);
        const out = handler(call) || { status: 404, json: {} };
        res.writeHead(out.status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(out.json === undefined ? {} : out.json));
      });
    });
    server.listen(0, '127.0.0.1', function () {
      resolve({ url: 'http://127.0.0.1:' + server.address().port, calls: calls, close: function () { server.close(); } });
    });
  });
}

function runVerify(env) {
  return new Promise(function (resolve) {
    if (!fs.existsSync(VERIFY)) { resolve({ code: 127, out: 'missing ' + VERIFY }); return; }
    const child = spawn(process.execPath, [VERIFY], { cwd: root, env: Object.assign({}, process.env, env) });
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

// Fast polling for the child-process cases.
const FAST = { VERIFY_INTERVAL_MS: '20', VERIFY_TIMEOUT_MS: '400' };
function baseEnv(prodUrl, extra) {
  return Object.assign({
    PRODUCTION_URL: prodUrl, GITHUB_SHA: SHA, GITHUB_RUN_ID: RUN_ID,
    GITHUB_SERVER_URL: 'https://github.example', GITHUB_REPOSITORY: 'o/r'
  }, FAST, extra || {});
}
const goodVersion = { status: 200, json: { sha: SHA, buildRunId: RUN_ID } };
const goodHealth = { status: 200, json: { status: 'ok' } };

(async function () {
  console.log('check-ppv-s1-post-promotion-verification');

  // T1 (AC1): matching version and healthy -> exit 0, verified sha and run id printed
  {
    const prod = await startProd(function () { return goodVersion; }, function () { return goodHealth; });
    const r = await runVerify(baseEnv(prod.url));
    prod.close();
    ok(r.code === 0 && r.out.indexOf(SHA) !== -1 && r.out.indexOf(RUN_ID) !== -1,
      'T1 (AC1): matching sha and build run with a healthy /health exits 0 and prints the verified sha and run id');
  }

  // T2 (AC2): another sha or run until the timeout -> non-zero, the last seen state is printed
  {
    const prod = await startProd(function () { return { status: 200, json: { sha: OTHER_SHA, buildRunId: '999' } }; }, function () { return goodHealth; });
    const r = await runVerify(baseEnv(prod.url));
    const sawHealth = prod.seen.some(function (s) { return s.url === '/health'; });
    prod.close();
    ok(r.code === 1 && r.out.indexOf(OTHER_SHA) !== -1 && prod.seen.length > 1 && !sawHealth,
      'T2 (AC2): a version that never matches fails after polling, prints what it last saw, and never calls /health');
    const prod2 = await startProd(function () { return { status: 200, json: { sha: SHA, buildRunId: '999' } }; }, function () { return goodHealth; });
    const r2 = await runVerify(baseEnv(prod2.url));
    prod2.close();
    ok(r2.code === 1, 'T2 (AC2): the right sha with another build run id still fails');
  }

  // T3 (AC3): version matches but /health does not answer 200 ok -> non-zero
  {
    const prod = await startProd(function () { return goodVersion; }, function () { return { status: 503, json: { status: 'down' } }; });
    const r = await runVerify(baseEnv(prod.url));
    prod.close();
    const prod2 = await startProd(function () { return goodVersion; }, function () { return { status: 200, json: { status: 'degraded' } }; });
    const r2 = await runVerify(baseEnv(prod2.url));
    prod2.close();
    ok(r.code === 1 && r2.code === 1,
      'T3 (AC3): a matching version with /health answering 503, or 200 without status ok, fails');
  }

  // T4 (AC4): a transient error while polling, then success -> still exit 0 (in-process, fake clock)
  {
    const mod = fs.existsSync(VERIFY) ? require(VERIFY) : null;
    let result = null;
    if (mod) {
      let t = 0; let calls = 0;
      mod.setNow(function () { return t; });
      mod.setSleep(async function (ms) { t += ms; });
      mod.setFetch(async function (url) {
        calls++;
        if (calls === 1) throw new Error('ECONNRESET');
        if (calls === 2) return { status: 502, body: '' };
        if (/\/version$/.test(url)) return { status: 200, body: JSON.stringify({ sha: SHA, buildRunId: RUN_ID }) };
        return { status: 200, body: JSON.stringify({ status: 'ok' }) };
      });
      result = await mod.verifyProduction({ baseUrl: 'https://prod.example', sha: SHA, runId: RUN_ID, intervalMs: 10000, timeoutMs: 300000 });
    }
    ok(result && result.ok === true, 'T4 (AC4): a thrown error and a 502 are retried and a later success still passes');
  }

  // T5 (AC5): every request is a GET to the production host, and no token is sent; the unwired default throws
  {
    const prod = await startProd(function () { return goodVersion; }, function () { return goodHealth; });
    const api = await startApi(function () { return { status: 200, json: [] }; });
    await runVerify(baseEnv(prod.url, { GITHUB_API_URL: api.url, GITHUB_TOKEN: 'secret-token' }));
    const onlyGet = prod.seen.length > 0 && prod.seen.every(function (s) { return s.method === 'GET' && (s.url === '/version' || s.url === '/health'); });
    const noToken = prod.seen.every(function (s) { return !s.auth; });
    prod.close();
    api.close();
    const mod = fs.existsSync(VERIFY) ? require(VERIFY) : null;
    let unwired = '';
    if (mod) {
      mod.setFetch(undefined);
      try { await mod.verifyProduction({ baseUrl: 'https://prod.example', sha: SHA, runId: RUN_ID, intervalMs: 1, timeoutMs: 1 }); } catch (e) { unwired = String(e.message); }
    }
    ok(onlyGet && noToken && /Adapter not wired/.test(unwired),
      'T5 (AC5): production only ever sees GET /version and GET /health with no credentials, and an unwired fetch fails with "Adapter not wired"');
  }

  // T6 (AC6): a failed verification opens one production-verification issue naming the sha, the run URL and the last state
  {
    const prod = await startProd(function () { return { status: 200, json: { sha: OTHER_SHA, buildRunId: '999' } }; }, function () { return goodHealth; });
    const api = await startApi(function (c) {
      if (c.method === 'GET') return { status: 200, json: [] };
      return { status: 201, json: { number: 77, html_url: 'https://github.example/o/r/issues/77' } };
    });
    const r = await runVerify(baseEnv(prod.url, { GITHUB_API_URL: api.url, GITHUB_TOKEN: 'tok' }));
    prod.close();
    api.close();
    const posts = api.calls.filter(function (c) { return c.method === 'POST'; });
    const post = posts[0] || {};
    const text = post.body ? (String(post.body.title) + '\n' + String(post.body.body)) : '';
    ok(r.code === 1 && posts.length === 1 && /\/repos\/o\/r\/issues$/.test(post.url || '') && post.auth === 'Bearer tok' &&
      post.body && Array.isArray(post.body.labels) && post.body.labels.indexOf('production-verification') !== -1 &&
      text.indexOf(SHA) !== -1 && text.indexOf('https://github.example/o/r/actions/runs/' + RUN_ID) !== -1 && text.indexOf(OTHER_SHA) !== -1,
      'T6 (AC6): a failure creates exactly one labelled issue naming the sha, the run URL and the last observed sha');
  }

  // T7 (AC6): an open issue for the same sha is not duplicated; a different sha still gets its own
  {
    const prod = await startProd(function () { return { status: 200, json: { sha: OTHER_SHA, buildRunId: '999' } }; }, function () { return goodHealth; });
    const marker = '<!-- production-verification:' + SHA + ' -->';
    const api = await startApi(function (c) {
      if (c.method === 'GET') return { status: 200, json: [{ number: 5, title: 'Production verification failed', body: 'earlier failure\n' + marker }] };
      return { status: 201, json: { number: 78, html_url: 'x' } };
    });
    const r = await runVerify(baseEnv(prod.url, { GITHUB_API_URL: api.url, GITHUB_TOKEN: 'tok' }));
    const posts = api.calls.filter(function (c) { return c.method === 'POST'; });
    api.close();
    const api2 = await startApi(function (c) {
      if (c.method === 'GET') return { status: 200, json: [{ number: 5, title: 'Production verification failed', body: 'earlier failure\n<!-- production-verification:' + 'd'.repeat(40) + ' -->' }] };
      return { status: 201, json: { number: 79, html_url: 'x' } };
    });
    const r2 = await runVerify(baseEnv(prod.url, { GITHUB_API_URL: api2.url, GITHUB_TOKEN: 'tok' }));
    const posts2 = api2.calls.filter(function (c) { return c.method === 'POST'; });
    api2.close();
    prod.close();
    ok(r.code === 1 && posts.length === 0 && r2.code === 1 && posts2.length === 1,
      'T7 (AC6): the same sha with an open issue opens no second issue (still exits 1); a different sha does open one');
  }

  // T8 (AC7): the workflow job, and the promote job untouched
  {
    const text = fs.readFileSync(WORKFLOW, 'utf8');
    const jobs = splitJobs(text);
    const v = jobs['verify-production'] || '';
    const promote = jobs['promote-to-prod'] || '';
    const hasIssuesWrite = function (block) { return /^\s*issues:\s*write\s*$/m.test(block); };
    const otherIssuesWrite = Object.keys(jobs).filter(function (k) { return k !== 'verify-production' && hasIssuesWrite(jobs[k]); });
    const promoteIf = promote.split('\n').filter(function (l) { return /^\s*(-\s*)?if:/.test(l); });
    const verifyIf = v.split('\n').filter(function (l) { return /^\s*(-\s*)?if:/.test(l); });
    const calls = /node scripts\/verify-production\.js/.test(v);
    ok(v.length > 0 && /needs:\s*promote-to-prod\b/.test(v) && !/^\s*environment:/m.test(v) && hasIssuesWrite(v) && otherIssuesWrite.length === 0 &&
      calls && /GITHUB_TOKEN:\s*\$\{\{\s*secrets\.GITHUB_TOKEN\s*\}\}/.test(v) && !/flyctl|FLY_API_TOKEN/.test(v) &&
      verifyIf.length === 0 && promoteIf.length === 0,
      'T8 (AC7): verify-production needs promote-to-prod, has no environment, holds the only issues: write, runs the script with the token, never touches flyctl; promote-to-prod has no if:');
    const gate = spawnSync(process.execPath, [path.join(root, 'tests', 'check-bri-s2.6-smoke-test-promote-gate.js')], { encoding: 'utf8' });
    const noProd = spawnSync(process.execPath, [path.join(root, 'scripts', 'check-no-prod-deploy-on-push.js')], { encoding: 'utf8' });
    ok(gate.status === 0 && noProd.status === 0, 'T8 (AC7): the promote gate check (bri-s2.6) and the no-prod-deploy-on-push check still pass');
  }

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
