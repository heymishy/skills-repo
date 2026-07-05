'use strict';
// Usage: node scripts/advance-story-subagent-execution.js <story-slug>
// Fetches from origin/master, sets story stage=subagent-execution, tasks tddState=not-started
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const slug = process.argv[2];
if (!slug) { console.error('Usage: node scripts/advance-story-subagent-execution.js <story-slug>'); process.exit(1); }

const STATE_FILE = path.join(__dirname, '..', '.github', 'pipeline-state.json');
const TMP_FILE = STATE_FILE + '.tmp';

let usingLocal = false;
try {
  execSync('git fetch origin master', { timeout: 5000, stdio: 'pipe' });
} catch(e) {
  console.warn('[pipeline-state] WARNING: origin not reachable — using local copy');
  usingLocal = true;
}

let s;
const masterSha = usingLocal
  ? execSync('git rev-parse HEAD').toString().trim()
  : execSync('git rev-parse origin/master').toString().trim();

if (usingLocal) {
  s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
} else {
  s = JSON.parse(execSync('git show origin/master:.github/pipeline-state.json').toString());
}
console.log('[pipeline-state] read from', usingLocal ? 'local' : 'master', '@', masterSha.slice(0, 8));

const feat = s.features.find(function(f) { return f.slug === '2026-07-05-product-stds-hierarchy'; });
if (!feat) { console.error('Feature not found'); process.exit(1); }

feat.stage = 'subagent-execution';
feat.updatedAt = new Date().toISOString();

var found = false;
for (var ei = 0; ei < feat.epics.length; ei++) {
  var epic = feat.epics[ei];
  for (var si = 0; si < epic.stories.length; si++) {
    var story = epic.stories[si];
    if (story.slug === slug) {
      story.stage = 'subagent-execution';
      story.health = 'green';
      story.updatedAt = new Date().toISOString();
      // Set all tasks to not-started
      if (story.tasks) {
        story.tasks.forEach(function(t) { t.tddState = 'not-started'; });
      }
      found = true;
      break;
    }
  }
  if (found) break;
}

if (!found) { console.error('Story not found:', slug); process.exit(1); }

fs.writeFileSync(TMP_FILE, JSON.stringify(s, null, 2) + '\n', 'utf8');
JSON.parse(fs.readFileSync(TMP_FILE, 'utf8')); // verify valid JSON
fs.renameSync(TMP_FILE, STATE_FILE);
console.log(slug, 'advanced to subagent-execution');
