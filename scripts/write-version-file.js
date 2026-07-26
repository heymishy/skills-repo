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

function buildVersionInfo() {
  const sha = process.env.GITHUB_SHA || _run('git rev-parse HEAD');
  const shortSha = sha.slice(0, 7);
  const subject = process.env.GITHUB_SHA
    ? _run('git log -1 --pretty=%s ' + sha)
    : _run('git log -1 --pretty=%s');
  const prMatch = subject.match(/\(#(\d+)\)\s*$/);
  const prNumber = prMatch ? Number(prMatch[1]) : null;

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

module.exports = { buildVersionInfo };

if (require.main === module) {
  main();
}
