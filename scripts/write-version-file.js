'use strict';

/**
 * write-version-file.js -- generates version.json at the repo root before a
 * deploy, so the running app can stamp its own build identity (commit SHA,
 * originating PR number, deploy timestamp) in its footer and at GET /version.
 *
 * Written 2026-07-26 after a real staging incident: an operator merged and
 * deployed a fix, tested staging, and saw unchanged behaviour with no way to
 * tell whether the deploy had actually landed or was still in flight/failed.
 * The workflow's overall status was red (a pre-existing, unrelated
 * smoke-test failure), which made "did my fix actually deploy?" impossible
 * to answer from the UI alone.
 *
 * PR number is parsed from the latest commit message's trailing "(#123)"
 * (GitHub's default squash-merge commit format) rather than an extra API
 * call -- this repo's convention, confirmed via git log, is squash-merge.
 * Falls back to null if the pattern isn't found (e.g. a direct bookkeeping
 * commit to master, which carries no PR number).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function _run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

/**
 * Pure, git-free parsing of a PR number from a commit subject -- kept
 * separate from buildVersionInfo() so it's testable with fabricated subject
 * strings, never a real git subprocess call against a specific historical
 * SHA (which may not exist in a shallow clone -- see AC1/AC2 test notes).
 * @param {string} subject
 * @returns {number|null}
 */
function parsePrNumberFromSubject(subject) {
  const prMatch = String(subject || '').match(/\(#(\d+)\)\s*$/);
  return prMatch ? Number(prMatch[1]) : null;
}

/**
 * Always reads HEAD's own subject, never an arbitrary historical SHA's --
 * actions/checkout@v4 sets HEAD to GITHUB_SHA regardless of clone depth, so
 * this works under CI's default shallow (fetch-depth 1) clone, where older
 * commit objects (e.g. a prior PR's merge commit) are not present locally.
 */
function buildVersionInfo() {
  const sha = process.env.GITHUB_SHA || _run('git rev-parse HEAD');
  const shortSha = sha.slice(0, 7);
  const subject = _run('git log -1 --pretty=%s');
  const prNumber = parsePrNumberFromSubject(subject);

  return {
    sha,
    shortSha,
    prNumber,
    commitSubject: subject,
    deployedAt: new Date().toISOString()
  };
}

function main() {
  const info = buildVersionInfo();
  const outPath = path.resolve(__dirname, '..', 'version.json');
  fs.writeFileSync(outPath, JSON.stringify(info, null, 2) + '\n', 'utf8');
  console.log('Wrote ' + outPath + ':', info);
}

module.exports = { buildVersionInfo, parsePrNumberFromSubject };

if (require.main === module) {
  main();
}
