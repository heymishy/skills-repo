#!/usr/bin/env node
'use strict';

// promotion-guard.js -- spg-s1. The promote-to-prod job in
// .github/workflows/staging-deploy.yml checks out and builds its own run's
// commit, so approving an old waiting run would deploy that old commit over
// newer production code. This guard is the first step of that job: it fails
// unless the run's commit is the current head of master, or (pgb-s1) is behind it only by commits that change
// nothing but bookkeeping paths (the paths the deploy workflow ignores, so no deploy run exists for them). It fails closed --
// if the head cannot be read, the promotion does not go ahead. It never
// deploys, rebuilds at the head, or approves anything.
//
// Exit codes: 0 the commit is the head; 1 refused (stale, or head unreadable).

const { githubRequest } = require('./lib/github-request');
const { isBookkeepingPath } = require('./lib/bookkeeping-paths');

// The compare API lists at most 300 files and 250 commits; a full page may be a truncated one.
const MAX_COMPARE_FILES = 300;

// Injectable adapter (D37): the default throws, so an unwired guard cannot pass.
let _fetchMasterHead = function () {
  throw new Error('Adapter not wired: fetchMasterHead. Call setFetchMasterHead() with a real implementation before use.');
};
function setFetchMasterHead(fn) { _fetchMasterHead = fn; }

// Injectable adapter (D37): GET the comparison of the run commit with the head of master. The default throws.
let _fetchCompare = function () {
  throw new Error('Adapter not wired: fetchCompare. Call setFetchCompare() with a real implementation before use.');
};
function setFetchCompare(fn) { _fetchCompare = fn; }

// pgb-s1: is the head of master ahead of the run commit by bookkeeping-only commits? Fails closed on any doubt.
async function onlyBookkeepingBehind(runSha, headSha) {
  let res;
  try {
    res = await _fetchCompare(runSha, headSha);
  } catch (e) {
    return { ok: false, reason: 'could not compare the commits: ' + e.message };
  }
  if (!res || res.status !== 200 || !res.json) {
    return { ok: false, reason: 'could not compare the commits: the API answered ' + (res && res.status) };
  }
  const c = res.json;
  if (c.status !== 'ahead') {
    return { ok: false, reason: 'the head of master is not ahead of this run\'s commit (comparison status: ' + c.status + ')' };
  }
  if (!Array.isArray(c.files) || !Array.isArray(c.commits) || typeof c.total_commits !== 'number') {
    return { ok: false, reason: 'the comparison answer was incomplete (no files or commits list)' };
  }
  if (c.commits.length < c.total_commits) {
    return { ok: false, reason: 'the comparison lists ' + c.commits.length + ' of ' + c.total_commits + ' commits, so it cannot show that all of them are bookkeeping' };
  }
  if (c.files.length >= MAX_COMPARE_FILES) {
    return { ok: false, reason: 'the comparison lists ' + c.files.length + ' files, the API\'s page limit, so it may be truncated' };
  }
  const notBookkeeping = [];
  c.files.forEach(function (f) {
    if (!f || typeof f.filename !== 'string') { notBookkeeping.push('(a file with no name)'); return; }
    // A rename is two paths: moving a code file into a bookkeeping folder deletes code.
    [f.filename, f.previous_filename].filter(Boolean).forEach(function (name) {
      if (!isBookkeepingPath(name)) notBookkeeping.push(name);
    });
  });
  if (notBookkeeping.length > 0) {
    return { ok: false, reason: 'commits after this run include changes that are not bookkeeping: ' + notBookkeeping.slice(0, 5).join(', ') + (notBookkeeping.length > 5 ? ' and ' + (notBookkeeping.length - 5) + ' more' : '') };
  }
  return { ok: true, reason: 'the head of master is ' + c.total_commits + ' commit(s) ahead of this run\'s commit and they change only bookkeeping paths (' + c.files.length + ' file(s)), so the code is the code this run built and tested' };
}

async function checkPromotion(runSha) {
  if (!runSha) return { ok: false, runSha: runSha, headSha: null, reason: 'no run commit was given (GITHUB_SHA is empty)' };
  let res;
  try {
    res = await _fetchMasterHead();
  } catch (e) {
    return { ok: false, runSha: runSha, headSha: null, reason: 'could not read the head of master: ' + e.message };
  }
  if (!res || res.status !== 200) {
    return { ok: false, runSha: runSha, headSha: null, reason: 'could not read the head of master: the API answered ' + (res && res.status) };
  }
  const head = res.json && res.json.sha;
  if (typeof head !== 'string' || !/^[0-9a-f]{40}$/i.test(head)) {
    return { ok: false, runSha: runSha, headSha: null, reason: 'could not read the head of master: the answer had no commit sha' };
  }
  if (head.toLowerCase() !== String(runSha).toLowerCase()) {
    const behind = await onlyBookkeepingBehind(runSha, head);
    if (behind.ok) return { ok: true, runSha: runSha, headSha: head, reason: behind.reason };
    return { ok: false, runSha: runSha, headSha: head, reason: 'this run\'s commit is not the head of master, so it will not be promoted (' + behind.reason + ')' };
  }
  return { ok: true, runSha: runSha, headSha: head, reason: 'this run\'s commit is the head of master' };
}

async function main(env) {
  const apiUrl = env.GITHUB_API_URL || 'https://api.github.com';
  const repo = env.GITHUB_REPOSITORY;
  const token = env.GITHUB_TOKEN;
  if (repo && token) {
    setFetchMasterHead(function () { return githubRequest('GET', apiUrl, '/repos/' + repo + '/commits/master', token); });
    setFetchCompare(function (base, head) { return githubRequest('GET', apiUrl, '/repos/' + repo + '/compare/' + base + '...' + head, token); });
  }
  const result = await checkPromotion(env.GITHUB_SHA);
  console.log('[promotion-guard] run commit:  ' + result.runSha);
  console.log('[promotion-guard] master head: ' + (result.headSha || 'unknown'));
  console.log('[promotion-guard] ' + (result.ok ? 'OK' : 'REFUSED') + ' - ' + result.reason);
  return result.ok ? 0 : 1;
}

if (require.main === module) {
  main(process.env).then(function (code) { process.exit(code); }, function (e) {
    console.log('[promotion-guard] REFUSED - ' + e.message);
    process.exit(1);
  });
}

module.exports = { checkPromotion, setFetchMasterHead, setFetchCompare, onlyBookkeepingBehind, main };
