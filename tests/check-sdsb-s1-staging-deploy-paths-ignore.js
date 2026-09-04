/**
 * check-sdsb-s1-staging-deploy-paths-ignore.js
 *
 * sdsb-s1 - staging-deploy.yml's on.push trigger must skip bookkeeping-only
 * pushes to master (workspace/**, artefacts/**, .github/pipeline-state.json)
 * while still triggering normally for any push that also touches code.
 *
 * Run: node tests/check-sdsb-s1-staging-deploy-paths-ignore.js
 */

const fs = require('fs');
const path = require('path');

const SUITE = '[check-sdsb-s1-staging-deploy-paths-ignore]';
let failures = 0;

function pass(id, msg) {
  console.log(`${SUITE} PASS ${id}: ${msg}`);
}

function fail(id, msg) {
  failures++;
  console.error(`${SUITE} FAIL ${id}: ${msg}`);
}

const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'staging-deploy.yml');
const content = fs.readFileSync(workflowPath, 'utf8');

// T1 - AC1: on.push.paths-ignore contains exactly the three bookkeeping paths
(function t1() {
  const onPushMatch = content.match(/on:\s*\n\s*push:\s*\n([\s\S]*?)\n\s*jobs:/);
  if (!onPushMatch) {
    fail('T1', 'could not locate the on.push block before jobs:');
    return;
  }
  const pushBlock = onPushMatch[1];

  const pathsIgnoreMatch = pushBlock.match(/paths-ignore:\s*\n((?:\s*-\s*.+\n?)+)/);
  if (!pathsIgnoreMatch) {
    fail('T1', 'no paths-ignore list found under on.push');
    return;
  }

  const entries = pathsIgnoreMatch[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('-'))
    .map((line) => line.replace(/^-+\s*/, '').replace(/^['"]|['"]$/g, '').trim());

  const expected = ['workspace/**', 'artefacts/**', '.github/pipeline-state.json'];
  const sortedEntries = [...entries].sort();
  const sortedExpected = [...expected].sort();

  if (entries.length !== 3) {
    fail('T1', `expected exactly 3 paths-ignore entries, found ${entries.length}: ${JSON.stringify(entries)}`);
    return;
  }

  const matches = sortedEntries.every((e, i) => e === sortedExpected[i]);
  if (!matches) {
    fail('T1', `paths-ignore entries do not match expected set. Found: ${JSON.stringify(entries)}, expected: ${JSON.stringify(expected)}`);
    return;
  }

  pass('T1', `on.push.paths-ignore contains exactly the 3 expected bookkeeping paths: ${JSON.stringify(entries)}`);
})();

// T2 - AC1 (regression): on.push.branches is still exactly [master]
(function t2() {
  const branchesMatch = /push:\s*\n\s*branches:\s*\n\s*-\s*master/.test(content)
    || /push:\s*\n\s*branches:\s*\[\s*master\s*\]/.test(content);

  if (!branchesMatch) {
    fail('T2', 'on.push.branches is not exactly [master], or branches: no longer immediately follows push:');
    return;
  }
  pass('T2', 'on.push.branches is still exactly [master]');
})();

console.log(`${SUITE} ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
