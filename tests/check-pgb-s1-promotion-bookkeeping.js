#!/usr/bin/env node
// check-pgb-s1-promotion-bookkeeping.js -- AC verification for pgb-s1
// (the production promotion guard accepts a run whose commit is behind the head of master only when every commit in
// between changes nothing but the bookkeeping paths the deploy workflow already ignores).
//
// Why: spg-s1's guard demanded run commit == master head, but bookkeeping pushes (DoD, state) do not start a deploy run
// (staging-deploy.yml paths-ignore), so after any such push no run could ever be promoted: on 2026-11-21 the operator
// approved run 44873189915 and the guard refused it although the six files that landed after it were all bookkeeping.
//
// The guard is run as a child process against a local fake GitHub API (as in check-spg-s1), so the real wiring (token
// header, API url, compare request, exit codes) is what is asserted. Run: node tests/check-pgb-s1-promotion-bookkeeping.js
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const GUARD = path.join(root, 'scripts', 'promotion-guard.js');
const WORKFLOW = path.join(root, '.github', 'workflows', 'staging-deploy.yml');

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else { console.log('  ✗ ' + label); failed++; }
}

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
function runGuard(env) {
  return new Promise(function (resolve) {
    const child = spawn(process.execPath, [GUARD], { cwd: root, env: Object.assign({}, process.env, env) });
    let out = '';
    child.stdout.on('data', function (d) { out += d; });
    child.stderr.on('data', function (d) { out += d; });
    child.on('close', function (code) { resolve({ code: code, out: out }); });
  });
}

const RUN_SHA = 'a'.repeat(40);
const HEAD_SHA = 'b'.repeat(40);
const COMPARE = '/repos/o/r/compare/' + RUN_SHA + '...' + HEAD_SHA;
const env = function (api) { return { GITHUB_API_URL: api, GITHUB_REPOSITORY: 'o/r', GITHUB_TOKEN: 'tok', GITHUB_SHA: RUN_SHA }; };
function file(name, extra) { return Object.assign({ filename: name, status: 'modified' }, extra || {}); }
function compareBody(files, over) {
  const commits = (over && over.commits) || [{ sha: 'c'.repeat(40) }];
  return Object.assign({ status: 'ahead', ahead_by: commits.length, total_commits: commits.length, commits: commits, files: files }, over || {});
}
// An API whose master head is HEAD_SHA and whose compare answer is `cmp` (null: the compare call fails with 500).
function apiFor(cmp) {
  return startApi(function (req) {
    if (/\/commits\/master$/.test(req.url)) return { status: 200, json: { sha: HEAD_SHA } };
    if (req.url === COMPARE) return cmp === null ? { status: 500, json: {} } : { status: 200, json: cmp };
    return { status: 404, json: {} };
  });
}

(async function () {
  console.log('check-pgb-s1-promotion-bookkeeping');

  // P1 (AC1): only bookkeeping paths changed since the run commit -> promoted, and the compare call is what was asked
  {
    const api = await apiFor(compareBody([file('artefacts/2026-11-21-x/dod/x-dod.md', { status: 'added' }), file('.github/pipeline-state.json'), file('workspace/state.json')]));
    const r = await runGuard(env(api.url));
    api.close();
    const cmpCall = api.calls.filter(function (c) { return c.url === COMPARE; })[0] || {};
    ok(r.code === 0 && /OK/.test(r.out) && cmpCall.auth === 'Bearer tok',
      'P1 (AC1): commits behind the head that change only bookkeeping paths are promoted; the compare request carries the bearer token');
    ok(/bookkeeping/i.test(r.out) && r.out.indexOf(RUN_SHA) !== -1 && r.out.indexOf(HEAD_SHA) !== -1,
      'P1b (AC1): the output says the difference is bookkeeping only and prints both commits');
  }

  // P2 (AC2): a code file among the changes -> refused, and the file is named
  {
    const api = await apiFor(compareBody([file('artefacts/x/story.md'), file('src/web-ui/server.js')]));
    const r = await runGuard(env(api.url));
    api.close();
    ok(r.code === 1 && /REFUSED/.test(r.out) && r.out.indexOf('src/web-ui/server.js') !== -1,
      'P2 (AC2): a code change after the run commit is refused and the file is named');
  }

  // P3 (AC2): artefacts/<dir>/playback/** is NOT ignored by the deploy workflow, so it is not bookkeeping here either
  {
    const api = await apiFor(compareBody([file('artefacts/x/playback/video/a.webm')]));
    const r = await runGuard(env(api.url));
    api.close();
    ok(r.code === 1 && r.out.indexOf('playback') !== -1, 'P3 (AC2): a playback media file is served by the app, so it counts as code and is refused');
  }

  // P4 (AC3): fail closed when the comparison cannot be read or makes no sense
  {
    const cases = [
      ['the compare call answers 500', null],
      ['the answer has no files list', { status: 'ahead', commits: [{ sha: 'c'.repeat(40) }], total_commits: 1 }],
      ['the answer is empty', {}]
    ];
    for (const c of cases) {
      const api = await apiFor(c[1]);
      const r = await runGuard(env(api.url));
      api.close();
      ok(r.code === 1 && /REFUSED/.test(r.out), 'P4 (AC3): fails closed when ' + c[0]);
    }
  }

  // P5 (AC3): the run commit must be an ancestor of the head: 'diverged' or 'behind' is refused whatever the files are
  {
    for (const st of ['diverged', 'behind', 'identical']) {
      const api = await apiFor(compareBody([file('artefacts/x/story.md')], { status: st }));
      const r = await runGuard(env(api.url));
      api.close();
      ok(r.code === 1 && /REFUSED/.test(r.out), 'P5 (AC3): comparison status "' + st + '" is refused even though the files look like bookkeeping');
    }
  }

  // P6 (AC3): a truncated answer cannot prove "only bookkeeping" -> refused
  {
    const many = []; for (let i = 0; i < 300; i++) many.push(file('artefacts/x/f' + i + '.md'));
    const api1 = await apiFor(compareBody(many));
    const r1 = await runGuard(env(api1.url));
    api1.close();
    ok(r1.code === 1 && /REFUSED/.test(r1.out), 'P6 (AC3): 300 changed files (the API\'s page limit) is treated as possibly truncated and refused');
    const api2 = await apiFor(compareBody([file('artefacts/x/story.md')], { total_commits: 400, commits: [{ sha: 'c'.repeat(40) }] }));
    const r2 = await runGuard(env(api2.url));
    api2.close();
    ok(r2.code === 1 && /REFUSED/.test(r2.out), 'P6b (AC3): a commit list shorter than total_commits is truncated and refused');
  }

  // P7 (AC2): a rename out of a code path into a bookkeeping path deletes code -> the old name counts too
  {
    const api = await apiFor(compareBody([file('artefacts/x/moved.js', { status: 'renamed', previous_filename: 'src/web-ui/server.js' })]));
    const r = await runGuard(env(api.url));
    api.close();
    ok(r.code === 1 && r.out.indexOf('src/web-ui/server.js') !== -1, 'P7 (AC2): a file renamed from a code path into a bookkeeping path is refused (the previous name is checked)');
  }

  // P8 (AC4): the run commit IS the head -> promoted as before, and no compare call is made
  {
    const api = await startApi(function (req) { return /\/commits\/master$/.test(req.url) ? { status: 200, json: { sha: RUN_SHA } } : { status: 404, json: {} }; });
    const r = await runGuard(env(api.url));
    api.close();
    ok(r.code === 0 && api.calls.every(function (c) { return !/\/compare\//.test(c.url); }), 'P8 (AC4): the head commit is still promoted without any compare request');
  }

  // P9 (AC5): the guard's idea of a bookkeeping path is the deploy workflow's own paths-ignore list
  {
    const lines = fs.readFileSync(WORKFLOW, 'utf8').split(/\r?\n/);
    const at = lines.findIndex(function (l) { return /^\s*paths-ignore:\s*$/.test(l); });
    const patterns = [];
    for (let i = at + 1; i < lines.length && /^\s+- /.test(lines[i]); i++) patterns.push(lines[i].replace(/^\s+- /, '').replace(/^'|'$/g, ''));
    const toRe = function (p) { return new RegExp('^' + p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*') + '$'); };
    const ignoredByWorkflow = function (f) { let ign = false; patterns.forEach(function (p) { if (p.charAt(0) === '!') { if (toRe(p.slice(1)).test(f)) ign = false; } else if (toRe(p).test(f)) ign = true; }); return ign; };
    let mod = null;
    try { mod = require(path.join(root, 'scripts', 'lib', 'bookkeeping-paths.js')); } catch (e) { mod = null; }
    const samples = ['artefacts/x/story.md', 'artefacts/x/playback/video/a.webm', 'artefacts/playback/foo.md', 'artefacts/a/b/playback/x.png', 'workspace/state.json', 'workspace/journeys/j/journey.json',
      '.github/pipeline-state.json', '.github/pipeline-state-archive.json', '.github/workflows/staging-deploy.yml', 'src/web-ui/server.js', 'scripts/promotion-guard.js', 'tests/check-x.js', 'package.json', 'README.md', 'fly.toml'];
    const same = !!mod && typeof mod.isBookkeepingPath === 'function' && samples.every(function (s) { return mod.isBookkeepingPath(s) === ignoredByWorkflow(s); });
    ok(patterns.length >= 4 && same, 'P9 (AC5): scripts/lib/bookkeeping-paths.js classifies ' + samples.length + ' sample paths exactly as the workflow\'s paths-ignore list does (' + patterns.length + ' patterns read from the workflow)');
  }

  // P10 (AC6): an unwired compare adapter fails closed (D37): the default throws, so a guard that was not wired cannot pass
  {
    const guard = require(GUARD);
    let wired = typeof guard.setFetchCompare === 'function';
    let verdict = null;
    if (wired) {
      guard.setFetchMasterHead(function () { return Promise.resolve({ status: 200, json: { sha: HEAD_SHA } }); });
      verdict = await guard.checkPromotion(RUN_SHA);
    }
    ok(wired && verdict && verdict.ok === false && /not wired|compare/i.test(verdict.reason), 'P10 (AC6): with the compare adapter unwired a stale commit is refused (the default stub throws)');
  }

  // P11 (AC6): the existing guard check still passes unchanged
  {
    const r = spawnSync(process.execPath, [path.join(root, 'tests', 'check-spg-s1-stale-promotion-guard.js')], { cwd: root, encoding: 'utf8' });
    ok(r.status === 0, 'P11 (AC6): check-spg-s1-stale-promotion-guard passes unchanged' + (r.status === 0 ? '' : ' (exit ' + r.status + ')'));
  }

  console.log('\n[pgb-s1] ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
