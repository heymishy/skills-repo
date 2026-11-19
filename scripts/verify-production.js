#!/usr/bin/env node
'use strict';

// verify-production.js -- ppv-s1. Run by the verify-production job in
// .github/workflows/staging-deploy.yml after promote-to-prod. It polls
// GET <production>/version until the reported sha and buildRunId equal this
// run's, then checks GET <production>/health answers 200 {"status":"ok"}. If that
// does not happen before the timeout it exits non-zero and opens one issue
// labelled production-verification (unless one is already open for the sha).
//
// Read-only against production: every request is a GET to the production host,
// sent with no credentials. It never deploys, restarts, rolls back or approves
// anything. The GitHub token is used only against the GitHub API, to open the issue.
//
// Exit codes: 0 verified; 1 not verified (or the run's sha / run id were not given).

const http = require('http');
const https = require('https');
const { githubRequest } = require('./lib/github-request');

const DEFAULT_BASE_URL = 'https://skills-framework.fly.dev';
const DEFAULT_INTERVAL_MS = 10000;
const DEFAULT_TIMEOUT_MS = 300000;
const ISSUE_LABEL = 'production-verification';

// Injectable adapters (D37): the fetch default throws, so an unwired verifier cannot report success.
function unwiredFetch() {
  throw new Error('Adapter not wired: fetch. Call setFetch() with a real implementation before use.');
}
let _fetch = unwiredFetch;
let _sleep = function (ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); };
let _now = function () { return Date.now(); };
function setFetch(fn) { _fetch = fn === undefined ? unwiredFetch : fn; }
function setSleep(fn) { _sleep = fn; }
function setNow(fn) { _now = fn; }

// The real fetch: a plain GET, no credentials, 10 second timeout. Anything but GET is refused here too.
function httpGet(url, init) {
  return new Promise(function (resolve, reject) {
    if (!init || init.method !== 'GET') { reject(new Error('only GET requests are allowed')); return; }
    let target;
    try { target = new URL(url); } catch (e) { reject(e); return; }
    const transport = target.protocol === 'http:' ? http : https;
    const req = transport.request(target, { method: 'GET', headers: { 'User-Agent': 'skills-repo-verify-production' }, timeout: 10000 }, function (res) {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', function (d) { body += d; });
      res.on('end', function () { resolve({ status: res.statusCode, body: body }); });
    });
    req.on('timeout', function () { req.destroy(new Error('request timed out')); });
    req.on('error', reject);
    req.end();
  });
}

function isUnwired(e) { return /^Adapter not wired/.test(String(e && e.message)); }

async function getJson(url) {
  let res;
  try {
    res = await _fetch(url, { method: 'GET' });
  } catch (e) {
    if (isUnwired(e)) throw e;
    return { error: 'request failed: ' + e.message };
  }
  if (!res || res.status !== 200) return { error: 'answered ' + (res && res.status) };
  try { return { json: JSON.parse(res.body) }; } catch (e) { return { error: 'answer was not JSON' }; }
}

// One poll: { ok: true } or { ok: false, seen } where seen says what was observed.
async function checkOnce(baseUrl, sha, runId) {
  const v = await getJson(baseUrl + '/version');
  if (v.error) return { ok: false, seen: { request: '/version', problem: v.error } };
  const info = v.json || {};
  if (info.sha !== sha || String(info.buildRunId) !== String(runId)) {
    return { ok: false, seen: { request: '/version', sha: info.sha === undefined ? null : info.sha, buildRunId: info.buildRunId === undefined ? null : info.buildRunId } };
  }
  const h = await getJson(baseUrl + '/health');
  if (h.error) return { ok: false, seen: { request: '/health', versionMatched: true, problem: h.error } };
  if (!h.json || h.json.status !== 'ok') return { ok: false, seen: { request: '/health', versionMatched: true, status: h.json && h.json.status } };
  return { ok: true };
}

async function verifyProduction(opts) {
  const baseUrl = String(opts.baseUrl).replace(/\/+$/, '');
  const intervalMs = opts.intervalMs === undefined ? DEFAULT_INTERVAL_MS : opts.intervalMs;
  const timeoutMs = opts.timeoutMs === undefined ? DEFAULT_TIMEOUT_MS : opts.timeoutMs;
  const deadline = _now() + timeoutMs;
  let lastSeen = { problem: 'no poll completed' };
  let attempts = 0;
  for (;;) {
    attempts++;
    const r = await checkOnce(baseUrl, opts.sha, opts.runId);
    if (r.ok) return { ok: true, attempts: attempts, sha: opts.sha, runId: opts.runId };
    lastSeen = r.seen;
    if (_now() + intervalMs > deadline) break;
    await _sleep(intervalMs);
  }
  return { ok: false, attempts: attempts, sha: opts.sha, runId: opts.runId, lastSeen: lastSeen, reason: 'production did not report this build and answer /health ok within ' + Math.round(timeoutMs / 1000) + ' seconds' };
}

function issueMarker(sha) { return '<!-- production-verification:' + sha + ' -->'; }

// Opens one issue for a failed verification. Never throws: a problem here is a warning, since the job is already red.
async function reportFailure(env, result, log) {
  const repo = env.GITHUB_REPOSITORY;
  const token = env.GITHUB_TOKEN;
  if (!repo || !token) { log('::warning::verify-production: GITHUB_REPOSITORY and GITHUB_TOKEN are needed to open the issue; none was opened'); return; }
  const apiUrl = env.GITHUB_API_URL || 'https://api.github.com';
  const runUrl = (env.GITHUB_SERVER_URL || 'https://github.com') + '/' + repo + '/actions/runs/' + result.runId;
  const marker = issueMarker(result.sha);
  try {
    const list = await githubRequest('GET', apiUrl, '/repos/' + repo + '/issues?state=open&labels=' + ISSUE_LABEL + '&per_page=100', token);
    if (list.status === 200 && Array.isArray(list.json)) {
      const existing = list.json.filter(function (i) { return typeof i.body === 'string' && i.body.indexOf(marker) !== -1; })[0];
      if (existing) { log('[verify-production] an issue is already open for this commit (#' + existing.number + '); not opening another'); return; }
    } else {
      log('::warning::verify-production: could not list open issues (' + list.status + '); opening one anyway');
    }
    const title = 'Production verification failed for ' + String(result.sha).slice(0, 7);
    const body = [
      marker,
      'The verify-production job could not confirm that production is running the promoted build and answering `/health`.',
      '',
      '- Commit: `' + result.sha + '`',
      '- Workflow run: ' + runUrl + ' (build run id `' + result.runId + '`)',
      '- ' + result.reason,
      '- Last observed state:',
      '',
      '```json',
      JSON.stringify(result.lastSeen, null, 2),
      '```',
      '',
      'This job only reads production; it deployed and changed nothing. Check the promote job in the run above, then `flyctl status -a skills-framework`.'
    ].join('\n');
    let created = await githubRequest('POST', apiUrl, '/repos/' + repo + '/issues', token, { title: title, body: body, labels: [ISSUE_LABEL] });
    if (created.status === 422) {
      log('::warning::verify-production: the label ' + ISSUE_LABEL + ' was refused; opening the issue without it');
      created = await githubRequest('POST', apiUrl, '/repos/' + repo + '/issues', token, { title: title, body: body });
    }
    if (created.status === 201) log('[verify-production] opened issue #' + (created.json && created.json.number));
    else log('::warning::verify-production: opening the issue answered ' + created.status);
  } catch (e) {
    log('::warning::verify-production: could not open the issue: ' + e.message);
  }
}

async function main(env, log) {
  const sha = env.GITHUB_SHA;
  const runId = env.GITHUB_RUN_ID;
  if (!sha || !runId) { log('::error::verify-production: GITHUB_SHA and GITHUB_RUN_ID are both required'); return 1; }
  const baseUrl = (env.PRODUCTION_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
  setFetch(httpGet);
  const result = await verifyProduction({
    baseUrl: baseUrl,
    sha: sha,
    runId: runId,
    intervalMs: Number(env.VERIFY_INTERVAL_MS) || DEFAULT_INTERVAL_MS,
    timeoutMs: Number(env.VERIFY_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS
  });
  if (result.ok) {
    log('[verify-production] VERIFIED - production reports sha ' + sha + ' and build run ' + runId + ' and /health is ok (' + result.attempts + ' poll(s))');
    return 0;
  }
  log('[verify-production] FAILED - ' + result.reason);
  log('[verify-production] expected sha ' + sha + ' and build run ' + runId + '; last observed: ' + JSON.stringify(result.lastSeen));
  await reportFailure(env, result, log);
  return 1;
}

if (require.main === module) {
  main(process.env, console.log).then(function (code) { process.exit(code); }, function (e) {
    console.log('[verify-production] FAILED - ' + e.message);
    process.exit(1);
  });
}

module.exports = { verifyProduction, setFetch, setSleep, setNow, main };
