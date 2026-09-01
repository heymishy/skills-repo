#!/usr/bin/env node
/**
 * check-defs-s1-definition-artefact-splitter.js -- AC verification for
 * defs-s1 (split the Web UI's consolidated definition artefact into
 * individual epic/story files matching templates/epic.md and
 * templates/story.md, at the same artefacts/[feature]/epics/[slug].md and
 * artefacts/[feature]/stories/[slug].md paths a CLI-driven /definition
 * session already uses).
 *
 * Real-world fixture: artefacts/new-feature-af17f555/definition.md -- this
 * session's own backfilled production content, already reconstructed
 * byte-accurately from the journey's raw saved source, so it's a genuine
 * regression fixture, not a synthetic approximation.
 *
 * Run: node tests/check-defs-s1-definition-artefact-splitter.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { splitDefinitionArtefact } = require('../src/web-ui/utils/definition-artefact-splitter');

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

const AF17F555_PATH = path.resolve(__dirname, '../artefacts/new-feature-af17f555/definition.md');
const af17f555Md = fs.readFileSync(AF17F555_PATH, 'utf8');

console.log('\n  AC1 -- real af17f555 fixture: all 6 stories and 1 epic extracted');
test('splitDefinitionArtefact: af17f555 produces 1 epic and 6 stories in document order', function() {
  const result = splitDefinitionArtefact(af17f555Md, 'new-feature-af17f555');
  assert.strictEqual(result.epics.length, 1);
  assert.strictEqual(result.stories.length, 6);
  assert.deepStrictEqual(result.stories.map(function(s) { return s.slug; }), ['ep1-s1', 'ep1-s2', 'ep1-s3', 'ep1-s4', 'ep1-s5', 'ep1-s6']);
});

console.log('\n  AC2 -- field values extracted correctly regardless of source field order');
test('splitDefinitionArtefact: Dependencies/NFR/Architecture Constraints correctly extracted even though af17f555 orders them Out-of-scope -> Dependencies -> NFR -> Architecture Constraints -> Complexity (not the reverse order this splitter itself was first written assuming)', function() {
  const result = splitDefinitionArtefact(af17f555Md, 'new-feature-af17f555');
  const ep1s3 = result.stories.find(function(s) { return s.slug === 'ep1-s3'; });
  assert.ok(ep1s3.content.includes('ep1-s2'), 'ep1-s3 Dependencies must show "ep1-s2", not a fallback');
  assert.ok(!ep1s3.content.includes('## Dependencies\n\nNone\n'), 'must not have fallen back to the "None" default for a story with a real dependency');
  assert.ok(ep1s3.content.includes('journey-disk.js schema supports cliAdoptionTimestamp'), 'Architecture Constraints must show the real text, not the NONE_IDENTIFIED fallback');
  assert.ok(ep1s3.content.includes('Backfill automatic and silent'), 'NFR must show the real text, not the "None identified" fallback');
});

console.log('\n  AC3 -- Out of Scope captures the full bullet list, not a truncated/wrong span');
test('splitDefinitionArtefact: ep1-s1 Out of Scope has all 4 original bullets', function() {
  const result = splitDefinitionArtefact(af17f555Md, 'new-feature-af17f555');
  const ep1s1 = result.stories.find(function(s) { return s.slug === 'ep1-s1'; });
  ['Two-way conflict resolution between surfaces', 'Real-time sync or background polling', 'Archive/release workflow automation', 'Search or filtering by feature properties'].forEach(function(bullet) {
    assert.ok(ep1s1.content.includes(bullet), 'missing bullet: ' + bullet);
  });
});

console.log('\n  AC4 -- Acceptance Criteria block contains the real Given/When/Then text');
test('splitDefinitionArtefact: ep1-s1 AC block contains Given/When/Then content, not a fallback placeholder', function() {
  const result = splitDefinitionArtefact(af17f555Md, 'new-feature-af17f555');
  const ep1s1 = result.stories.find(function(s) { return s.slug === 'ep1-s1'; });
  assert.ok(ep1s1.content.includes('**Given** a connected repo'), 'AC block missing the real Given clause');
  assert.ok(ep1s1.content.includes('**When** I open the web UI skill picker'), 'AC block missing the real When clause');
  assert.ok(ep1s1.content.includes('**Then** I see all non-terminal features'), 'AC block missing the real Then clause');
  assert.ok(!ep1s1.content.includes('[Not specified by the definition session]\n\n## Acceptance Criteria'), 'AC block must not have fallen back to the placeholder');
});

console.log('\n  AC5 -- deterministic reference links are correct regardless of model output');
test('splitDefinitionArtefact: every story references the correct epic/discovery/benefit-metric paths', function() {
  const result = splitDefinitionArtefact(af17f555Md, 'new-feature-af17f555');
  result.stories.forEach(function(s) {
    assert.ok(s.content.includes('**Epic reference:** artefacts/new-feature-af17f555/epics/cross-channel-feature-continuity.md'));
    assert.ok(s.content.includes('**Discovery reference:** artefacts/new-feature-af17f555/discovery.md'));
    assert.ok(s.content.includes('**Benefit-metric reference:** artefacts/new-feature-af17f555/benefit-metric.md'));
  });
});

console.log('\n  AC6 -- epic file lists every story with the correct path');
test('splitDefinitionArtefact: epic content lists all 6 stories with correct story paths', function() {
  const result = splitDefinitionArtefact(af17f555Md, 'new-feature-af17f555');
  const epic = result.epics[0];
  for (let i = 1; i <= 6; i++) {
    assert.ok(epic.content.includes('artefacts/new-feature-af17f555/stories/ep1-s' + i + '.md'), 'epic file missing link to ep1-s' + i);
  }
});

console.log('\n  AC7 -- unrecognised format returns empty result, never throws (matches extractStoryIdsFromDefinitionArtefact\'s own contract)');
test('splitDefinitionArtefact: plain prose with no Epic markers returns { epics: [], stories: [] }', function() {
  const result = splitDefinitionArtefact('Just some plain prose with no story markers of any recognised shape.', 'some-feature');
  assert.deepStrictEqual(result, { epics: [], stories: [] });
});

console.log('\n  AC8 -- missing optional fields fall back to template placeholder text, never blank/undefined');
test('splitDefinitionArtefact: a minimal story with only Persona and Complexity still produces a complete, non-broken file', function() {
  const minimal = [
    'Slicing strategy: walking-skeleton',
    '',
    '## Epic 1 — Minimal Epic',
    '',
    '### ep1-s1 — Minimal Story',
    '',
    '**Persona:** Someone',
    '',
    '**Given** x, **When** y, **Then** z.',
    '',
    '**Complexity:** 1'
  ].join('\n');
  const result = splitDefinitionArtefact(minimal, 'minimal-feature');
  assert.strictEqual(result.stories.length, 1);
  const s = result.stories[0];
  assert.ok(s.content.includes('None identified — checked against .github/architecture-guardrails.md'));
  assert.ok(!s.content.includes('undefined'));
  assert.ok(!s.content.includes('null'));
});

console.log('\n  AC9 -- CRLF line endings do not break extraction (this repo\'s own git config converts LF -> CRLF on checkout)');
test('splitDefinitionArtefact: CRLF-normalised af17f555 fixture produces identical results to the raw (already-CRLF) file', function() {
  const crlfMd = af17f555Md.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
  const result = splitDefinitionArtefact(crlfMd, 'new-feature-af17f555');
  assert.strictEqual(result.stories.length, 6, 'CRLF version must still extract all 6 stories');
  assert.ok(result.stories[0].content.includes('ADR-023 (disk canonical)'), 'CRLF version must still extract real field content, not fall back to defaults');
});

console.log('\n[defs-s1-definition-artefact-splitter] Results: ' + passed + ' passed, ' + failed + ' failed\n');
process.exit(failed > 0 ? 1 : 0);
