/**
 * check-ptvs-s1-promote-to-prod-version-stamp.js
 *
 * ptvs-s1 - promote-to-prod's own job must write the real version stamp
 * (write-version-file.js) and learnings count (write-learnings-count-file.js)
 * before its own Deploy to production step, mirroring deploy-staging's own
 * already-working pattern exactly. deploy-staging's own steps must remain
 * byte-identical -- this story only adds equivalent steps to promote-to-prod.
 *
 * Run: node tests/check-ptvs-s1-promote-to-prod-version-stamp.js
 */

const fs = require('fs');
const path = require('path');

const SUITE = '[check-ptvs-s1-promote-to-prod-version-stamp]';
let failures = 0;

function pass(id, msg) {
  console.log(`${SUITE} PASS ${id}: ${msg}`);
}

function fail(id, msg) {
  failures++;
  console.error(`${SUITE} FAIL ${id}: ${msg}`);
}

const content = fs.readFileSync(
  path.join(__dirname, '..', '.github', 'workflows', 'staging-deploy.yml'),
  'utf8'
);

const promoteStart = content.indexOf('  promote-to-prod:');
if (promoteStart === -1) {
  fail('SETUP', 'could not locate "promote-to-prod:" job in staging-deploy.yml -- test cannot proceed');
  console.log(`${SUITE} ${failures} FAILURE(S)`);
  process.exit(1);
}
const promoteBlock = content.slice(promoteStart);
const deployStagingBlock = content.slice(content.indexOf('  deploy-staging:'), content.indexOf('  smoke-test:'));

// T1 - AC1: promote-to-prod has a Set up Node.js step
(function t1() {
  if (/name:\s*Set up Node\.js\s*\n\s*uses:\s*actions\/setup-node@v4/.test(promoteBlock)) {
    pass('T1', 'promote-to-prod has a Set up Node.js step');
  } else {
    fail('T1', 'promote-to-prod is missing a Set up Node.js step');
  }
})();

// T2 - AC2: promote-to-prod writes the version stamp with GITHUB_SHA, before Deploy to production
(function t2() {
  const versionStampRe = /name:\s*Write version stamp\s*\n\s*run:\s*node scripts\/write-version-file\.js\s*\n\s*env:\s*\n\s*GITHUB_SHA:\s*\$\{\{\s*github\.sha\s*\}\}/;
  const match = versionStampRe.exec(promoteBlock);
  const deployIdx = promoteBlock.indexOf('name: Deploy to production');
  if (match && deployIdx !== -1 && match.index < deployIdx) {
    pass('T2', 'promote-to-prod writes the version stamp (with GITHUB_SHA) before Deploy to production');
  } else {
    fail('T2', 'promote-to-prod is missing the version-stamp step before Deploy to production, or the shape/order is wrong');
  }
})();

// T3 - AC3: promote-to-prod writes the learnings count, before Deploy to production
(function t3() {
  const learningsRe = /name:\s*Write learnings count\s*\n\s*run:\s*node scripts\/write-learnings-count-file\.js/;
  const match = learningsRe.exec(promoteBlock);
  const deployIdx = promoteBlock.indexOf('name: Deploy to production');
  if (match && deployIdx !== -1 && match.index < deployIdx) {
    pass('T3', 'promote-to-prod writes the learnings count before Deploy to production');
  } else {
    fail('T3', 'promote-to-prod is missing the learnings-count step before Deploy to production, or the shape/order is wrong');
  }
})();

// T4 - AC4 regression: deploy-staging's own version-stamp steps are unchanged
(function t4() {
  const hasVersionStamp = /name:\s*Write version stamp\s*\n\s*run:\s*node scripts\/write-version-file\.js\s*\n\s*env:\s*\n\s*GITHUB_SHA:\s*\$\{\{\s*github\.sha\s*\}\}/.test(deployStagingBlock);
  const hasLearningsCount = /name:\s*Write learnings count\s*\n\s*run:\s*node scripts\/write-learnings-count-file\.js/.test(deployStagingBlock);
  if (hasVersionStamp && hasLearningsCount) {
    pass('T4', "deploy-staging's own version-stamp/learnings-count steps are unchanged");
  } else {
    fail('T4', `deploy-staging's own steps appear disturbed -- versionStamp present: ${hasVersionStamp}, learningsCount present: ${hasLearningsCount}`);
  }
})();

console.log(`${SUITE} ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
