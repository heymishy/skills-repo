'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..');

// T1: buildAuditComment is exported from ci-audit-comment.js
{
  const mod = require('../scripts/ci-audit-comment.js');
  assert.strictEqual(typeof mod.buildAuditComment, 'function', 'T1: buildAuditComment must be exported');
  console.log('✓ T1: buildAuditComment exported');
}

// T2: sourceIntegrity is exported from ci-audit-comment.js (RED until extraction done)
{
  const mod = require('../scripts/ci-audit-comment.js');
  assert.strictEqual(typeof mod.sourceIntegrity, 'function', 'T2: sourceIntegrity must be exported from ci-audit-comment.js');
  console.log('✓ T2: sourceIntegrity exported');
}

// T3: sourceIntegrity returns a string value when called with a real file path
// (The function returns status strings: '✅', '❌ DRIFT', '⚠ not found', or '—')
{
  const mod = require('../scripts/ci-audit-comment.js');
  const result = mod.sourceIntegrity(path.join(repoRoot, 'package.json'), 'any-hash');
  assert.ok(typeof result === 'string', 'T3: sourceIntegrity must return a string');
  console.log('✓ T3: sourceIntegrity returns string');
}

// T4: loadPipelineStories handles flat stories array
{
  const mod = require('../scripts/ci-audit-comment.js');
  const fakeState = { features: [{ slug: 'test-feat', stories: [{ id: 's1', artefact: 'artefacts/test-feat/stories/s1.md' }] }] };
  const stories = mod.loadPipelineStories(fakeState, 'test-feat');
  assert.ok(Array.isArray(stories), 'T4: loadPipelineStories must return array');
  assert.strictEqual(stories.length, 1, 'T4: flat stories - should find 1 story');
  console.log('✓ T4: loadPipelineStories handles flat stories');
}

// T5: loadPipelineStories handles epic-nested stories
{
  const mod = require('../scripts/ci-audit-comment.js');
  const fakeState = { features: [{ slug: 'test-feat', epics: [{ slug: 'ep1', stories: [{ id: 's1', artefact: 'artefacts/test-feat/stories/s1.md' }, { id: 's2', artefact: 'artefacts/test-feat/stories/s2.md' }] }] }] };
  const stories = mod.loadPipelineStories(fakeState, 'test-feat');
  assert.ok(Array.isArray(stories), 'T5: loadPipelineStories must return array');
  assert.strictEqual(stories.length, 2, 'T5: epic-nested stories - should find 2 stories');
  console.log('✓ T5: loadPipelineStories handles epic-nested stories');
}

// T6: assurance-gate.yml does NOT contain inline function sourceIntegrity definition (RED until extraction done)
{
  const gateContent = fs.readFileSync(path.join(repoRoot, '.github/workflows/assurance-gate.yml'), 'utf8');
  assert.ok(!gateContent.includes('function sourceIntegrity('), 'T6: assurance-gate.yml must not contain inline function sourceIntegrity definition');
  console.log('✓ T6: no inline sourceIntegrity in assurance-gate.yml');
}

// T7: buildAuditComment can be called with a fixture and returns structured output
{
  const mod = require('../scripts/ci-audit-comment.js');
  const fakeState = {
    features: [{
      slug: 'test-feat',
      stories: [{
        id: 's1',
        artefact: 'artefacts/test-feat/stories/s1.md',
        dorStatus: 'signed-off'
      }]
    }]
  };
  const result = mod.buildAuditComment({
    featureSlug: 'test-feat',
    prNumber: 42,
    pipelineState: fakeState,
    suiteResults: []
  });
  assert.ok(typeof result === 'string' || typeof result === 'object', 'T7: buildAuditComment must return string or object');
  console.log('✓ T7: buildAuditComment callable with fixture');
}

// T8: no syntax errors in ci-audit-comment.js (covered by require above — if we got here, it loaded OK)
{
  console.log('✓ T8: ci-audit-comment.js loads without syntax errors');
}

console.log('\n[gpa-sc07] Results: 8 passed, 0 failed');
