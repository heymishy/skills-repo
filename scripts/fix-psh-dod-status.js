'use strict';
// Fix: set dodStatus='not-started' for all 10 psh stories (was null, failing schema validation)
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', '.github', 'pipeline-state.json');
const TMP_FILE = STATE_FILE + '.tmp';

const ps = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
const feat = ps.features.find(function(f) { return f.slug === '2026-07-05-product-stds-hierarchy'; });
if (!feat) { console.error('Feature not found'); process.exit(1); }

var fixed = 0;
feat.epics.forEach(function(epic) {
  epic.stories.forEach(function(story) {
    if (story.dodStatus === null || story.dodStatus === undefined) {
      story.dodStatus = 'not-started';
      fixed++;
    }
  });
});

feat.updatedAt = new Date().toISOString();
ps.updated = new Date().toISOString();

fs.writeFileSync(TMP_FILE, JSON.stringify(ps, null, 2) + '\n', 'utf8');
JSON.parse(fs.readFileSync(TMP_FILE, 'utf8'));
fs.renameSync(TMP_FILE, STATE_FILE);
console.log('Fixed ' + fixed + ' stories: dodStatus null → not-started');
