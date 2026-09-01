'use strict';
// check-ep1-s2-key-dirs-epics-dor.js — ep1-s2
//
// Confirms the pre-existing _KEY_DIRS disk-scan in buildSystemPrompt()
// (src/web-ui/routes/skills.js) now also injects epics/*.md and dor/*.md
// into HANDOFF CONTEXT, closing this story's one confirmed gap plus one
// adjacent related gap. Covers AC2 from
// artefacts/new-feature-af17f555/test-plans/ep1-s2-test-plan.md's Revised
// Test Plan (2026-09-02) section.

var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');

var passed = 0;
var failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log('PASS:', name);
    passed++;
  } catch (e) {
    console.error('FAIL:', name, '—', e.message);
    failed++;
    process.exitCode = 1;
  }
}

var skills = require('../src/web-ui/routes/skills');
var _scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s2-'));

function writeArtefact(slug, relPath, content) {
  var abs = path.join(_scratchRoot, 'artefacts', slug, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
}

check('epics/*.md is injected into the FEATURE ARTEFACTS block', () => {
  var slug = 'ep1s2-epics-fixture';
  writeArtefact(slug, 'epics/my-epic.md', '# My Epic\n\nContent.');
  var prompt = skills.buildSystemPrompt('discovery', null, _scratchRoot, [], { activeFeatureSlug: slug });
  assert.ok(prompt.indexOf('epics/my-epic.md') !== -1, 'expected epics file path in prompt');
  assert.ok(prompt.indexOf('My Epic') !== -1, 'expected epics file content in prompt');
});

check('dor/*.md is injected into the FEATURE ARTEFACTS block', () => {
  var slug = 'ep1s2-dor-fixture';
  writeArtefact(slug, 'dor/some-story-dor.md', '# DoR\n\nSigned off.');
  var prompt = skills.buildSystemPrompt('discovery', null, _scratchRoot, [], { activeFeatureSlug: slug });
  assert.ok(prompt.indexOf('dor/some-story-dor.md') !== -1, 'expected dor file path in prompt');
  assert.ok(prompt.indexOf('Signed off') !== -1, 'expected dor file content in prompt');
});

check('regression: stories/, review/, test-plans/, verification-scripts/ still injected', () => {
  var slug = 'ep1s2-regression-fixture';
  writeArtefact(slug, 'stories/s1.md', 'Story content');
  writeArtefact(slug, 'review/s1-review-1.md', 'Review content');
  writeArtefact(slug, 'test-plans/s1-test-plan.md', 'Test plan content');
  writeArtefact(slug, 'verification-scripts/s1-verification.md', 'Verification content');
  var prompt = skills.buildSystemPrompt('discovery', null, _scratchRoot, [], { activeFeatureSlug: slug });
  ['stories/s1.md', 'review/s1-review-1.md', 'test-plans/s1-test-plan.md', 'verification-scripts/s1-verification.md'].forEach(function(p) {
    assert.ok(prompt.indexOf(p) !== -1, 'expected ' + p + ' still injected');
  });
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
