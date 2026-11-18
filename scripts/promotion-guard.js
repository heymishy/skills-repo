#!/usr/bin/env node
'use strict';

// promotion-guard.js -- spg-s1. The promote-to-prod job in
// .github/workflows/staging-deploy.yml checks out and builds its own run's
// commit, so approving an old waiting run would deploy that old commit over
// newer production code. This guard is the first step of that job: it fails
// unless the run's commit is the current head of master. It fails closed --
// if the head cannot be read, the promotion does not go ahead. It never
// deploys, rebuilds at the head, or approves anything.
//
// Exit codes: 0 the commit is the head; 1 refused (stale, or head unreadable).

const { githubRequest } = require('./lib/github-request');

// Injectable adapter (D37): the default throws, so an unwired guard cannot pass.
let _fetchMasterHead = function () {
  throw new Error('Adapter not wired: fetchMasterHead. Call setFetchMasterHead() with a real implementation before use.');
};
function setFetchMasterHead(fn) { _fetchMasterHead = fn; }

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
    return { ok: false, runSha: runSha, headSha: head, reason: 'this run\'s commit is not the head of master, so it will not be promoted' };
  }
  return { ok: true, runSha: runSha, headSha: head, reason: 'this run\'s commit is the head of master' };
}

async function main(env) {
  const apiUrl = env.GITHUB_API_URL || 'https://api.github.com';
  const repo = env.GITHUB_REPOSITORY;
  const token = env.GITHUB_TOKEN;
  if (repo && token) {
    setFetchMasterHead(function () { return githubRequest('GET', apiUrl, '/repos/' + repo + '/commits/master', token); });
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

module.exports = { checkPromotion, setFetchMasterHead, main };
