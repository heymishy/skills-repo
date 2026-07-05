'use strict';

// Named one-off script (cdg.6 exception b) — advances all psh stories to definition-of-done
// after PR #441 merged to master on 2026-07-05.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STATE_FILE = path.join(__dirname, '..', '.github', 'pipeline-state.json');

const STORY_SLUGS = ['psh-s1','psh-s2','psh-s3','psh-s4','psh-s5','psh-s6','psh-s7','psh-s8','psh-s9','psh-s10'];
const FEATURE_SLUG = '2026-07-05-product-stds-hierarchy';
const PR_URL = 'https://github.com/heymishy/skills-repo/pull/441';

// Read current state from local file (already on master with psh state)
const raw = fs.readFileSync(STATE_FILE, 'utf8');
const state = JSON.parse(raw);

const feat = state.features.find(function(f) { return f.slug === FEATURE_SLUG; });
if (!feat) {
  console.error('Feature not found: ' + FEATURE_SLUG);
  process.exit(1);
}

let updated = 0;
feat.epics.forEach(function(epic) {
  epic.stories.forEach(function(story) {
    if (STORY_SLUGS.indexOf(story.slug) !== -1) {
      story.stage = 'definition-of-done';
      story.dodStatus = 'complete';
      story.prStatus = 'merged';
      story.prUrl = PR_URL;
      updated++;
      console.log('Updated: ' + story.slug + ' → stage=definition-of-done dodStatus=complete prStatus=merged');
    }
  });
});

if (updated !== STORY_SLUGS.length) {
  console.error('Expected to update ' + STORY_SLUGS.length + ' stories but updated ' + updated);
  process.exit(1);
}

// Write atomically: write to temp then rename
const TMP_FILE = STATE_FILE + '.tmp';
const output = JSON.stringify(state, null, 2);
fs.writeFileSync(TMP_FILE, output, 'utf8');
// Verify valid JSON before rename
JSON.parse(fs.readFileSync(TMP_FILE, 'utf8'));
fs.renameSync(TMP_FILE, STATE_FILE);

console.log('\nAll ' + updated + ' psh stories advanced to definition-of-done. Pipeline state updated.');
