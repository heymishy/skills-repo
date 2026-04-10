#!/usr/bin/env node
/**
 * check-viz-behaviour.js
 *
 * Behavioural test suite for pipeline-viz logic extracted into viz-functions.js.
 * 25 scenarios covering: normalizeData, evaluateGate, storyNextSkill,
 * featureActionMeta, channelLabel, computeFleetSummary, buildExportJSON,
 * and buildExportCSV.
 *
 * Zero external dependencies. Run:  node .github/scripts/check-viz-behaviour.js
 */
'use strict';

const path  = require('path');
const {
  normalizeData,
  evaluateGate,
  storyNextSkill,
  featureActionMeta,
  channelLabel,
  computeFleetSummary,
  buildExportJSON,
  buildExportCSV,
  hasHighFindings,
  isReleaseReady,
  stageRank,
  hasReachedStage,
  loopType,
  stageLabel,
  formatAge,
  DEFAULT_GOVERNANCE_GATES,
} = require(path.join(__dirname, 'viz-functions.js'));

let passed = 0;
let failed = 0;
const failures = [];

function assert(label, condition) {
  if (condition) {
    passed++;
    console.log('  \u2713 ' + label);
  } else {
    failed++;
    failures.push(label);
    console.log('  \u2717 ' + label);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FIXTURES
// ─────────────────────────────────────────────────────────────────────────────

function makeFeature(overrides) {
  return Object.assign({
    slug: 'test-feature',
    name: 'Test Feature',
    stage: 'review',
    health: 'green',
    epics: [],
  }, overrides);
}

function makeStory(overrides) {
  return Object.assign({
    slug: 'test-story',
    name: 'Test Story',
    reviewStatus: 'passed',
    dorStatus: null,
    prStatus: null,
    dodStatus: null,
    testPlan: null,
    highFindings: 0,
  }, overrides);
}

function makeEpic(stories) {
  return { slug: 'test-epic', stories: stories || [] };
}

// ─────────────────────────────────────────────────────────────────────────────
// normalizeData — 4 scenarios
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n[viz-behaviour] normalizeData');

// 1. Valid minimal state → feature array present, no undefined slugs
(function() {
  const raw = {
    features: [
      { id: 'feat-a', name: 'Feature A', stage: 'discovery',
        epics: [{ id: 'epic-1', stories: [{ id: 'story-1', tasks: [] }] }] }
    ],
  };
  let threw = false;
  let result;
  try { result = normalizeData(raw); } catch(e) { threw = true; }
  assert('normalizeData: valid minimal state does not throw', !threw);
  assert('normalizeData: feature slug derived from id', result && result.features[0].slug === 'feat-a');
}());

// 2. Missing epics field → does not throw, defaults to []
(function() {
  const raw = { features: [{ id: 'feat-b', name: 'Feature B', stage: 'discovery' }] };
  let threw = false;
  try { normalizeData(raw); } catch(e) { threw = true; }
  assert('normalizeData: missing epics field does not throw', !threw);
}());

// 3. Feature with no updatedAt → featureActionMeta handles gracefully (age = 0)
(function() {
  const feature = makeFeature({ stage: 'subagent-execution' });
  let threw = false;
  let meta;
  try { meta = featureActionMeta(feature); } catch(e) { threw = true; }
  assert('normalizeData: missing updatedAt handled by featureActionMeta (no throw)', !threw);
  assert('normalizeData: missing updatedAt does not produce NaN nextAction', meta && typeof meta.nextAction === 'string');
}());

// 4. Empty features array → returns object with empty array, no throw
(function() {
  const raw = { features: [] };
  let threw = false;
  let result;
  try { result = normalizeData(raw); } catch(e) { threw = true; }
  assert('normalizeData: empty features array does not throw', !threw);
  assert('normalizeData: empty features array returns empty array', result && Array.isArray(result.features) && result.features.length === 0);
}());

// ─────────────────────────────────────────────────────────────────────────────
// evaluateGate — 5 scenarios
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n[viz-behaviour] evaluateGate');

// 5. ADR-005 gate exists in DEFAULT_GOVERNANCE_GATES → evaluates without throw
(function() {
  const feature = makeFeature({ stage: 'review' });
  const adrGate = DEFAULT_GOVERNANCE_GATES.find(function(g) { return g.id === 'ADR-005'; });
  assert('evaluateGate: ADR-005 exists in DEFAULT_GOVERNANCE_GATES', !!adrGate);
  let threw = false;
  let result;
  try { result = evaluateGate(feature, 'ADR-005', { gates: DEFAULT_GOVERNANCE_GATES }); } catch(e) { threw = true; }
  assert('evaluateGate: ADR-005 evaluates without throw', !threw);
  assert('evaluateGate: ADR-005 returns an object with state field', result && typeof result.state === 'string');
}());

// 6. All stories dorStatus signed-off → DoR gate returns pass
(function() {
  const stories = [makeStory({ dorStatus: 'signed-off' }), makeStory({ slug: 's2', dorStatus: 'signed-off' })];
  const feature = makeFeature({ epics: [makeEpic(stories)] });
  const result = evaluateGate(feature, 'definition-of-ready');
  assert('evaluateGate: all stories dorStatus signed-off → DoR gate state=pass', result.state === 'pass');
}());

// 7. No dorStatus on stories → DoR gate is not pass
(function() {
  const stories = [makeStory({ dorStatus: null })];
  const feature = makeFeature({ epics: [makeEpic(stories)] });
  const result = evaluateGate(feature, 'definition-of-ready');
  assert('evaluateGate: dorStatus absent → DoR gate is not pass', result.state !== 'pass');
}());

// 8. All stories reviewStatus passed → review gate returns pass
(function() {
  const stories = [makeStory({ reviewStatus: 'passed', highFindings: 0 })];
  const feature = makeFeature({ epics: [makeEpic(stories)] });
  const result = evaluateGate(feature, 'review');
  assert('evaluateGate: all reviewStatus passed → review gate state=pass', result.state === 'pass');
}());

// 9. Stage-proxy: verify-completion stage with no verifyStatus → gate evaluates (not throw)
(function() {
  const feature = makeFeature({ stage: 'verify-completion' });
  let threw = false;
  let result;
  try { result = evaluateGate(feature, 'verify-completion'); } catch(e) { threw = true; }
  assert('evaluateGate: verify-completion with no verifyStatus does not throw', !threw);
  assert('evaluateGate: verify-completion with no verifyStatus returns warn|na (not pass)', result && result.state !== 'pass');
}());

// ─────────────────────────────────────────────────────────────────────────────
// storyNextSkill — 5 scenarios
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n[viz-behaviour] storyNextSkill');

// 10. dorStatus signed-off → /branch-setup → /implementation-plan
(function() {
  const s = makeStory({ stage: 'definition-of-ready', dorStatus: 'signed-off' });
  const result = storyNextSkill(s);
  assert('storyNextSkill: dorStatus signed-off → /branch-setup → /implementation-plan', result === '/branch-setup \u2192 /implementation-plan');
}());

// 11. prStatus merged → /definition-of-done
(function() {
  const s = makeStory({ prStatus: 'merged' });
  const result = storyNextSkill(s);
  assert('storyNextSkill: prStatus merged → /definition-of-done path', result && result.includes('/definition-of-done'));
}());

// 12. reviewStatus passed, no testPlan → /test-plan
(function() {
  const s = makeStory({ reviewStatus: 'passed', testPlan: null, dorStatus: null });
  const result = storyNextSkill(s);
  assert("storyNextSkill: reviewStatus passed + no testPlan → '/test-plan'", result === '/test-plan');
}());

// 13. reviewStatus passed, has testPlan → /definition-of-ready
(function() {
  const s = makeStory({ reviewStatus: 'passed', testPlan: { status: 'written' }, dorStatus: null });
  const result = storyNextSkill(s);
  assert("storyNextSkill: reviewStatus passed + testPlan → '/definition-of-ready'", result === '/definition-of-ready');
}());

// 14. Unknown stage → returns a string, does not throw
(function() {
  const s = makeStory({ stage: 'unknown-future-stage', reviewStatus: null, dorStatus: null });
  let threw = false;
  let result;
  try { result = storyNextSkill(s); } catch(e) { threw = true; }
  assert('storyNextSkill: unknown stage does not throw', !threw);
  assert('storyNextSkill: unknown stage returns a string', typeof result === 'string');
}());

// ─────────────────────────────────────────────────────────────────────────────
// featureActionMeta — 4 scenarios
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n[viz-behaviour] featureActionMeta');

// 15. health=red → state=blocked, channel=blocker
(function() {
  const feature = makeFeature({ health: 'red', stage: 'definition' });
  const meta = featureActionMeta(feature);
  assert('featureActionMeta: health=red → state=blocked', meta.state === 'blocked');
  assert('featureActionMeta: health=red → channel=blocker', meta.channel === 'blocker');
}());

// 16. stage=released → state=done, channel=null
(function() {
  const feature = makeFeature({ stage: 'released', health: 'green' });
  const meta = featureActionMeta(feature);
  assert('featureActionMeta: stage=released → state=done', meta.state === 'done');
  assert('featureActionMeta: stage=released → channel=null', meta.channel === null);
}());

// 17. stage=subagent-execution → state=processing, channel=agent
(function() {
  const feature = makeFeature({ stage: 'subagent-execution', health: 'green' });
  const meta = featureActionMeta(feature);
  assert('featureActionMeta: stage=subagent-execution → state=processing', meta.state === 'processing');
  assert('featureActionMeta: stage=subagent-execution → channel=agent', meta.channel === 'agent');
}());

// 18. stage=definition-of-ready → channel=approval
(function() {
  const feature = makeFeature({ stage: 'definition-of-ready', health: 'green' });
  const meta = featureActionMeta(feature);
  assert('featureActionMeta: stage=definition-of-ready → channel=approval', meta.channel === 'approval');
}());

// ─────────────────────────────────────────────────────────────────────────────
// channelLabel — 2 scenarios
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n[viz-behaviour] channelLabel');

// 19. channelLabel('approval') → contains 'Sign-off'
(function() {
  const label = channelLabel('approval');
  assert("channelLabel: 'approval' contains 'Sign-off'", typeof label === 'string' && label.includes('Sign-off'));
}());

// 20. channelLabel('unknown') → returns a string, does not throw
(function() {
  let threw = false;
  let result;
  try { result = channelLabel('unknown'); } catch(e) { threw = true; }
  assert('channelLabel: unknown value does not throw', !threw);
  assert('channelLabel: unknown value returns a string', typeof result === 'string');
}());

// ─────────────────────────────────────────────────────────────────────────────
// computeFleetSummary — 3 scenarios
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n[viz-behaviour] computeFleetSummary');

// 21. Empty repos array → total=0, drifted=0, no throw
(function() {
  let threw = false;
  let result;
  try { result = computeFleetSummary({ repos: [], platformVersion: '1.0.0' }); } catch(e) { threw = true; }
  assert('computeFleetSummary: empty repos does not throw', !threw);
  assert('computeFleetSummary: empty repos total=0', result && result.total === 0);
  assert('computeFleetSummary: empty repos drifted=0', result && result.drifted === 0);
}());

// 22. Three repos, one drifted:true → drifted=1
(function() {
  const fleet = {
    platformVersion: '2.0.0',
    repos: [
      { name: 'repo-a', platformVersion: '2.0.0' },
      { name: 'repo-b', platformVersion: '2.0.0' },
      { name: 'repo-c', drifted: true, platformVersion: '1.9.0' },
    ],
  };
  const result = computeFleetSummary(fleet);
  assert('computeFleetSummary: three repos one drifted → total=3', result.total === 3);
  assert('computeFleetSummary: three repos one drifted → drifted=1', result.drifted === 1);
}());

// 23. Missing lastSyncedAt → handled gracefully (no throw, lastSyncedAt null)
(function() {
  let threw = false;
  let result;
  try { result = computeFleetSummary({ repos: [{ name: 'repo-x' }] }); } catch(e) { threw = true; }
  assert('computeFleetSummary: missing lastSyncedAt does not throw', !threw);
  assert('computeFleetSummary: missing lastSyncedAt returns null lastSyncedAt', result && result.lastSyncedAt === null);
}());

// ─────────────────────────────────────────────────────────────────────────────
// buildExportJSON + buildExportCSV — 2 scenarios
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n[viz-behaviour] buildExportJSON / buildExportCSV');

function makeSampleState() {
  return {
    features: [
      makeFeature({
        slug: 'feat-x',
        name: 'Feature X',
        epics: [
          makeEpic([
            makeStory({ slug: 's-1', name: 'Story 1', stage: 'review' }),
          ]),
        ],
      }),
    ],
  };
}

// 24. buildExportJSON → parseable JSON string
(function() {
  const state = makeSampleState();
  const fleet = { repos: [], platformVersion: '1.0.0' };
  let threw = false;
  let jsonStr;
  try { jsonStr = buildExportJSON(state, fleet); } catch(e) { threw = true; }
  assert('buildExportJSON: does not throw', !threw);
  let parsed;
  try { parsed = JSON.parse(jsonStr); } catch(e) { parsed = null; }
  assert('buildExportJSON: returns parseable JSON', parsed !== null);
}());

// 25. buildExportCSV → string with header row + at least one story row
(function() {
  const state = makeSampleState();
  let threw = false;
  let csv;
  try { csv = buildExportCSV(state); } catch(e) { threw = true; }
  assert('buildExportCSV: does not throw', !threw);
  const lines = (csv || '').split('\n').filter(function(l) { return l.trim().length > 0; });
  assert('buildExportCSV: returns header + at least one data row', lines.length >= 2);
  assert('buildExportCSV: first row contains story_slug header', lines[0].includes('story_slug'));
}());

// ─────────────────────────────────────────────────────────────────────────────
// RESULTS
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n[viz-behaviour] Results: ' + passed + ' passed, ' + failed + ' failed');

if (failures.length > 0) {
  console.log('[viz-behaviour] Failures:');
  failures.forEach(function(f) { console.log('  - ' + f); });
  process.exit(1);
}
