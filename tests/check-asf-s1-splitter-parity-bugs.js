#!/usr/bin/env node
/**
 * check-asf-s1-splitter-parity-bugs.js -- AC verification for asf-s1 (fix
 * web-UI-to-CLI artefact splitter parity bugs, definition + review).
 *
 * Story:     artefacts/2026-09-15-artefact-splitter-fidelity/stories/asf-s1-fix-splitter-parity-bugs.md
 * Test plan: artefacts/2026-09-15-artefact-splitter-fidelity/test-plans/asf-s1-test-plan.md
 *
 * Regression fixture for the definition-artefact-splitter half:
 * artefacts/new-feature-2b74a292/definition.md -- the real, unmodified
 * production content whose split output was found (in a prior session) to
 * have a broken User Story section (missing "I want", "So that" duplicated
 * from Benefit Linkage) and a duplicated, orphaned Given/When/Then block.
 *
 * Regression fixture for the review-artefact-splitter half:
 * artefacts/new-feature-2b74a292/review.md -- the real, unmodified content
 * whose split output was found to falsely default every story to PASS.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { splitDefinitionArtefact } = require('../src/web-ui/utils/definition-artefact-splitter');
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

const DEF_FIXTURE_PATH = path.resolve(__dirname, '../artefacts/new-feature-2b74a292/definition.md');
const defMd = fs.readFileSync(DEF_FIXTURE_PATH, 'utf8');
const REVIEW_FIXTURE_PATH = path.resolve(__dirname, '../artefacts/new-feature-2b74a292/review.md');
const reviewMd = fs.readFileSync(REVIEW_FIXTURE_PATH, 'utf8');

console.log('\n  AC1 -- real "So that X, I need Y." sentence produces a genuine three-line User Story');
test('splitDefinitionArtefact: ep1-s1 has As a / I want / So that as three distinct lines, sourced from the real sentence', function() {
  const result = splitDefinitionArtefact(defMd, 'new-feature-2b74a292');
  const ep1s1 = result.stories.find(function(s) { return s.slug === 'ep1-s1'; });
  assert.ok(ep1s1, 'ep1-s1 must be found');
  assert.ok(/As a \*\*Organisation administrator\*\*,\nI want \*\*.+\*\*,\nSo that \*\*.+\*\*\.\n/.test(ep1s1.content), 'expected three distinct As a / I want / So that lines');
  assert.ok(ep1s1.content.includes('I want **to create a pod'), 'I want must contain the real need clause');
  assert.ok(ep1s1.content.includes('So that **I can establish a reusable team definition**'), 'So that must contain the real goal clause, not the Benefit Linkage text');
});

console.log('\n  AC1 -- I want is present for every story in the fixture, not just one');
test('splitDefinitionArtefact: all 13 stories in the fixture have a real I want line', function() {
  const result = splitDefinitionArtefact(defMd, 'new-feature-2b74a292');
  assert.strictEqual(result.stories.length, 13);
  result.stories.forEach(function(s) {
    assert.ok(/^I want \*\*/m.test(s.content), s.slug + ' is missing the I want line');
  });
});

console.log('\n  AC1 -- So that is never a verbatim duplicate of the Benefit Linkage section');
test('splitDefinitionArtefact: ep1-s1 So-that clause differs from its own Benefit Linkage section', function() {
  const result = splitDefinitionArtefact(defMd, 'new-feature-2b74a292');
  const ep1s1 = result.stories.find(function(s) { return s.slug === 'ep1-s1'; });
  const soThatLine = ep1s1.content.match(/^So that \*\*(.+)\*\*\.$/m)[1];
  const benefitSection = ep1s1.content.match(/## Benefit Linkage\n+([\s\S]+?)\n+## Architecture Constraints/)[1];
  assert.notStrictEqual(soThatLine, benefitSection, 'So-that must not equal the Benefit Linkage section verbatim');
});

console.log('\n  AC2 -- Architecture Constraints no longer swallows the adjacent AC block');
test('splitDefinitionArtefact: ep1-s1 Architecture Constraints section contains no Given/When/Then text', function() {
  const result = splitDefinitionArtefact(defMd, 'new-feature-2b74a292');
  const ep1s1 = result.stories.find(function(s) { return s.slug === 'ep1-s1'; });
  const acsSection = ep1s1.content.match(/## Architecture Constraints\n+([\s\S]+?)\n+## Dependencies/)[1];
  assert.ok(!/\bGiven\b/i.test(acsSection), 'Architecture Constraints must not contain the AC block');
  assert.ok(acsSection.includes('ADR-025'), 'Architecture Constraints must still contain its own real content');
});

console.log('\n  AC2 -- the AC block appears exactly once, under Acceptance Criteria, across every story');
test('splitDefinitionArtefact: no story in the fixture has a duplicated Given/When/Then block', function() {
  const result = splitDefinitionArtefact(defMd, 'new-feature-2b74a292');
  result.stories.forEach(function(s) {
    const givenCount = (s.content.match(/\bGiven\b/gi) || []).length;
    assert.strictEqual(givenCount, 1, s.slug + ' expected exactly 1 "Given" occurrence, found ' + givenCount);
  });
});

console.log('\n  AC3 -- a missing So-that/I-need sentence falls back to an explicit placeholder, never Benefit Linkage text');
test('splitDefinitionArtefact: a story with no So-that sentence gets a placeholder, not duplicated benefit text', function() {
  const minimal = [
    'Slicing strategy: walking-skeleton',
    '',
    '## Epic 1 — Minimal Epic',
    '',
    '### ep1-s1 — Minimal Story',
    '',
    '**Persona:** Someone',
    '**Benefit linkage:** Some named metric — some mechanism sentence.',
    '',
    '**Given** x, **When** y, **Then** z.',
    '',
    '**Complexity:** 1'
  ].join('\n');
  const result = splitDefinitionArtefact(minimal, 'minimal-feature');
  const s = result.stories[0];
  assert.ok(s.content.includes('[user need not specified by the definition session]'), 'I want must use the explicit placeholder');
  assert.ok(s.content.includes('[observable outcome not specified by the definition session]'), 'So that must use the explicit placeholder');
  assert.ok(!s.content.includes('I want **Some named metric'), 'I want must never contain the Benefit Linkage text');
});

console.log('\n  AC4 -- heading-prefixed, decorated Verdict line resolves to the correct outcome');
test('splitReviewArtefact: real review.md fixture resolves every story to FAIL, matching "### Verdict: **FAIL** (Category C)"', function() {
  const results = splitReviewArtefact(reviewMd, function() { return 1; });
  assert.strictEqual(results.length, 13, 'all 13 stories in the fixture must produce a split result');
  results.forEach(function(r) {
    assert.ok(r.content.includes('**Outcome:** FAIL'), r.storySlug + ' must resolve to FAIL');
  });
});

console.log('\n  AC5 -- an unparseable verdict is skipped, never defaulted to PASS');
test('splitReviewArtefact: a story block with no recognisable Verdict line produces no split file for that story', function() {
  const noVerdict = [
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
    'None.',
    '',
    '(no verdict line at all)',
    '',
    '## Story: ep1-s2',
    '',
    '**Verdict:** PASS'
  ].join('\n');
  const results = splitReviewArtefact(noVerdict, function() { return 1; });
  assert.strictEqual(results.length, 1, 'only ep1-s2 (which has a real verdict) should produce a result');
  assert.strictEqual(results[0].storySlug, 'ep1-s2');
});

console.log('\n  AC5 -- an ambiguous verdict (both PASS and FAIL present) is also skipped, not guessed');
test('splitReviewArtefact: a Verdict line containing both PASS and FAIL is treated as unparseable', function() {
  const ambiguous = [
    '# Review Report',
    '',
    '## Story: ep1-s1',
    '',
    '**Verdict:** PASS or FAIL depending on interpretation'
  ].join('\n');
  const results = splitReviewArtefact(ambiguous, function() { return 1; });
  assert.strictEqual(results.length, 0);
});

console.log('\n  AC6 -- findings sections state a format-mismatch note, not a false "None.", when the instructed heading structure is absent');
test('splitReviewArtefact: real review.md fixture (Category-based, no ### HIGH findings heading) gets the honest note, not "None."', function() {
  const results = splitReviewArtefact(reviewMd, function() { return 1; });
  const s1 = results.find(function(r) { return r.storySlug === 'ep1-s1'; });
  assert.ok(s1.content.includes('Could not reliably extract per-severity findings'), 'expected the format-mismatch note');
  assert.ok(!s1.content.includes('## HIGH findings — must resolve before /test-plan\n\nNone.'), 'must not silently claim "None." when the heading was never found');
});

console.log('\n[asf-s1-splitter-parity-bugs] Results: ' + passed + ' passed, ' + failed + ' failed\n');
process.exit(failed > 0 ? 1 : 0);
