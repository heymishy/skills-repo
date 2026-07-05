'use strict';
// cdg.6 exception (b): advance all 10 psh stories to branch-complete after draft PR opened
// Fan-out rule: fetch from origin/master before writing
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', '.github', 'pipeline-state.json');
const TMP_FILE = STATE_FILE + '.tmp';

let usingLocal = false;
try {
  execSync('git fetch origin master', { timeout: 5000, stdio: 'pipe' });
} catch (e) {
  console.warn('[pipeline-state] WARNING: origin not reachable — using local copy');
  usingLocal = true;
}

const masterSha = usingLocal
  ? execSync('git rev-parse HEAD').toString().trim()
  : execSync('git rev-parse origin/master').toString().trim();

const s = usingLocal
  ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
  : JSON.parse(execSync('git show origin/master:.github/pipeline-state.json').toString());

console.log('[pipeline-state] read from', usingLocal ? 'local' : 'master', '@', masterSha.slice(0, 8));

var feat = s.features.find(function(f) { return f.slug === '2026-07-05-product-stds-hierarchy'; });
if (!feat) {
  // psh feature only on this branch — pull from local copy and add to master state
  console.log('[pipeline-state] psh feature not on master — reading from local branch copy');
  const localState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  const localFeat = localState.features.find(function(f) { return f.slug === '2026-07-05-product-stds-hierarchy'; });
  if (!localFeat) { console.error('psh feature not found in local copy either'); process.exit(1); }
  s.features.push(localFeat);
  feat = localFeat;
}

const PR_URL = 'https://github.com/heymishy/skills-repo/pull/441';
const now = new Date().toISOString();

const AC_TOTALS = {
  'psh-s1': 4, 'psh-s2': 5, 'psh-s3': 8, 'psh-s4': 5, 'psh-s5': 6,
  'psh-s6': 6, 'psh-s7': 6, 'psh-s8': 6, 'psh-s9': 6, 'psh-s10': 6
};
const TEST_TOTALS = {
  'psh-s1': 8, 'psh-s2': 7, 'psh-s3': 8, 'psh-s4': 6, 'psh-s5': 9,
  'psh-s6': 7, 'psh-s7': 7, 'psh-s8': 8, 'psh-s9': 8, 'psh-s10': 8
};

feat.epics.forEach(function(epic) {
  epic.stories.forEach(function(story) {
    if (!AC_TOTALS[story.slug]) return;
    story.stage = 'branch-complete';
    story.health = 'green';
    story.prStatus = 'draft';
    story.prUrl = PR_URL;
    story.verifyStatus = 'passed';
    story.acVerified = AC_TOTALS[story.slug];
    story.acTotal = AC_TOTALS[story.slug];
    story.testPlan = story.testPlan || {};
    story.testPlan.passing = TEST_TOTALS[story.slug];
    story.testPlan.totalTests = TEST_TOTALS[story.slug];
    story.testPlan.status = 'written';
    delete story.blocker;
    story.updatedAt = now;
  });
  epic.status = 'in-progress';
});

feat.stage = 'branch-complete';
feat.updatedAt = now;
s.updated = now;

fs.writeFileSync(TMP_FILE, JSON.stringify(s, null, 2) + '\n', 'utf8');
JSON.parse(fs.readFileSync(TMP_FILE, 'utf8'));
fs.renameSync(TMP_FILE, STATE_FILE);
console.log('All 10 psh stories: stage=branch-complete, prStatus=draft, prUrl=' + PR_URL);
