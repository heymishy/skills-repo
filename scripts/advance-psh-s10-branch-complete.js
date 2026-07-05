'use strict';
// cdg.6 exception (b): named one-off script to advance psh-s10 to branch-complete
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', '.github', 'pipeline-state.json');
const TMP_FILE = STATE_FILE + '.tmp';

const ps = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
const feat = ps.features.find(function(f) { return f.slug === '2026-07-05-product-stds-hierarchy'; });
if (!feat) { console.error('Feature not found'); process.exit(1); }

var found = false;
for (var ei = 0; ei < feat.epics.length; ei++) {
  for (var si = 0; si < feat.epics[ei].stories.length; si++) {
    var story = feat.epics[ei].stories[si];
    if (story.slug === 'psh-s10') {
      story.stage = 'branch-complete';
      story.health = 'green';
      story.testPlan.passing = 8;
      story.updatedAt = new Date().toISOString();
      story.tasks.forEach(function(t) { t.tddState = 'committed'; });
      found = true;
      break;
    }
  }
  if (found) break;
}
if (!found) { console.error('psh-s10 not found'); process.exit(1); }

feat.stage = 'branch-complete';
feat.updatedAt = new Date().toISOString();
ps.updated = new Date().toISOString();

fs.writeFileSync(TMP_FILE, JSON.stringify(ps, null, 2) + '\n', 'utf8');
JSON.parse(fs.readFileSync(TMP_FILE, 'utf8'));
fs.renameSync(TMP_FILE, STATE_FILE);
console.log('psh-s10 advanced to branch-complete, all tasks committed, testPlan.passing=8');
