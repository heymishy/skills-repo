#!/usr/bin/env node
/**
 * check-revs-s1-review-artefact-splitter.js -- AC verification for revs-s1
 * (split the Web UI's consolidated review artefact into individual per-story
 * review files matching templates/review-report.md, at the same
 * artefacts/[feature]/review/[story-slug]-review-[N].md path convention a
 * CLI-driven /review session already uses).
 *
 * Run: node tests/check-revs-s1-review-artefact-splitter.js
 */
'use strict';

const assert = require('assert');
const { splitReviewArtefact } = require('../src/web-ui/utils/review-artefact-splitter');

let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log('  ✓ ' + name);
    passed++;
  } catch (err) {
    console.log('  ✗ ' + name + ' -- ' + (err && err.message || err));
    failed++;
  }
}

const TWO_STORY_REVIEW = [
  '# Review Report',
  '',
  '## Story: ep1-s1',
  '',
  '### HIGH findings',
  'None.',
  '',
  '### MEDIUM findings',
  'None.',
  '',
  '### LOW findings',
  '- AC count below minimum (1 AC, convention minimum 3) — mitigated by design/test-plan coverage.',
  '',
  '**Verdict:** PASS',
  '',
  '## Story: ep1-s2',
  '',
  '### HIGH findings',
  '- Missing out-of-scope section entirely.',
  '  Fix: add at least one explicit exclusion.',
  '',
  '### MEDIUM findings',
  'None.',
  '',
  '### LOW findings',
  'None.',
  '',
  '**Verdict:** FAIL',
  '',
  '## Overall Verdict',
  '',
  '**Verdict:** FAIL',
  '1 HIGH, 0 MEDIUM, 1 LOW across 2 stories.'
].join('\n');

console.log('\n  AC1 -- two-story review artefact splits into two per-story results in document order');
test('splitReviewArtefact: two "## Story:" sections produce two results', function() {
  const results = splitReviewArtefact(TWO_STORY_REVIEW, function() { return 1; });
  assert.strictEqual(results.length, 2);
  assert.strictEqual(results[0].storySlug, 'ep1-s1');
  assert.strictEqual(results[1].storySlug, 'ep1-s2');
});

console.log('\n  AC2 -- each story\'s own findings are correctly isolated, not bled from the other story');
test('splitReviewArtefact: ep1-s1 shows its own LOW finding and PASS verdict, not ep1-s2\'s HIGH finding', function() {
  const results = splitReviewArtefact(TWO_STORY_REVIEW, function() { return 1; });
  const s1 = results.find(function(r) { return r.storySlug === 'ep1-s1'; });
  assert.ok(s1.content.includes('AC count below minimum'), 's1 missing its own LOW finding');
  assert.ok(!s1.content.includes('Missing out-of-scope section'), 's1 must not include s2\'s HIGH finding');
  assert.ok(s1.content.includes('**Outcome:** PASS'));
});

console.log('\n  AC3 -- HIGH findings and FAIL verdict correctly captured for the failing story');
test('splitReviewArtefact: ep1-s2 shows its HIGH finding and FAIL verdict', function() {
  const results = splitReviewArtefact(TWO_STORY_REVIEW, function() { return 1; });
  const s2 = results.find(function(r) { return r.storySlug === 'ep1-s2'; });
  assert.ok(s2.content.includes('Missing out-of-scope section entirely'));
  assert.ok(s2.content.includes('**Outcome:** FAIL'));
});

console.log('\n  AC4 -- run number is supplied by the caller (disk-based), not hardcoded');
test('splitReviewArtefact: run number in the filename-facing header matches the supplied callback', function() {
  const results = splitReviewArtefact(TWO_STORY_REVIEW, function(slug) { return slug === 'ep1-s1' ? 3 : 1; });
  const s1 = results.find(function(r) { return r.storySlug === 'ep1-s1'; });
  assert.strictEqual(s1.runNumber, 3);
  assert.ok(s1.content.includes('Run 3'));
});

console.log('\n  AC5 -- an artefact with no "## Story:" markers (the pre-upgrade flat format) returns [], never throws');
test('splitReviewArtefact: legacy flat review.md format (severity-grouped, no per-story markers) returns []', function() {
  const legacyFlat = '# Review Report\n\n## Findings\n\n### HIGH\nNone.\n\n## Verdict\n\nPASS';
  let results;
  assert.doesNotThrow(function() { results = splitReviewArtefact(legacyFlat, function() { return 1; }); });
  assert.deepStrictEqual(results, []);
});

console.log('\n  AC6 -- CRLF line endings do not break extraction');
test('splitReviewArtefact: CRLF version produces identical results to the LF version', function() {
  const crlf = TWO_STORY_REVIEW.replace(/\n/g, '\r\n');
  const results = splitReviewArtefact(crlf, function() { return 1; });
  assert.strictEqual(results.length, 2);
  assert.ok(results[0].content.includes('AC count below minimum'));
});

console.log('\n  wuai-s1 AC4 -- a self-corrected block (ambiguous FAIL line, then a clean PASS line) resolves to PASS, not null');
test('splitReviewArtefact: self-corrected verdict uses the last unambiguous line', function() {
  const selfCorrected = [
    '# Review Report',
    '',
    '## Story: ep1-s2',
    '',
    '### HIGH findings',
    '',
    'None.',
    '',
    '### MEDIUM findings',
    '',
    'None.',
    '',
    '### LOW findings',
    '',
    'None.',
    '',
    '**Verdict:** FAIL (re-scoring: PASS threshold met on all criteria after all)',
    '',
    '**Verdict:** PASS'
  ].join('\n');
  const results = splitReviewArtefact(selfCorrected, function() { return 1; });
  const s2 = results.find(function(r) { return r.storySlug === 'ep1-s2'; });
  assert.ok(s2, 'ep1-s2 must produce a split result, not be skipped as unparseable');
  assert.ok(s2.content.includes('**Outcome:** PASS'));
});

console.log('\n  wuai-s1 AC5 -- a single verdict line still resolves exactly as before');
test('splitReviewArtefact: single verdict line is unchanged', function() {
  const results = splitReviewArtefact(TWO_STORY_REVIEW, function() { return 1; });
  const s1 = results.find(function(r) { return r.storySlug === 'ep1-s1'; });
  assert.ok(s1.content.includes('**Outcome:** PASS'));
});

console.log('\n  wuai-s1 AC6 -- every verdict line ambiguous still returns null and still warns (asf-s1 fail-safe preserved)');
test('splitReviewArtefact: all-ambiguous verdict lines are skipped, not guessed', function() {
  const allAmbiguous = [
    '# Review Report',
    '',
    '## Story: ep9-s1',
    '',
    '### HIGH findings',
    '',
    'None.',
    '',
    '### MEDIUM findings',
    '',
    'None.',
    '',
    '### LOW findings',
    '',
    'None.',
    '',
    '**Verdict:** FAIL (but note PASS was close on some criteria)',
    '',
    '**Verdict:** PASS (though FAIL was flagged earlier for one criterion)'
  ].join('\n');
  const origWarn = console.warn;
  let warned = false;
  console.warn = function(msg) {
    if (String(msg).indexOf('review_split_verdict_unparseable') !== -1) warned = true;
  };
  let results;
  try {
    results = splitReviewArtefact(allAmbiguous, function() { return 1; });
  } finally {
    console.warn = origWarn;
  }
  assert.strictEqual(results.length, 0, 'no split result when every verdict line is genuinely ambiguous');
  assert.ok(warned, 'the unparseable-verdict warning must still fire');
});

console.log('\n[revs-s1-review-artefact-splitter] Results: ' + passed + ' passed, ' + failed + ' failed\n');
process.exit(failed > 0 ? 1 : 0);
