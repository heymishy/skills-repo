'use strict';
const assert = require('assert');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log('  ✗ ' + name + ': ' + err.message);
  }
}

// AC1: cross-reference correctly matches a story's prUrl against gh pr list output
test('crossReferenceStories matches a story prUrl against a real merged PR', () => {
  const { crossReferenceStories } = require('../scripts/lib/dod-handoff-reconciliation');
  const ghMergedPrs = [{ number: 999, mergedAt: '2026-10-01T00:00:00Z' }];
  const stories = [{ slug: 'abc-s1', prUrl: 'https://github.com/org/repo/pull/999', prStatus: 'merged' }];
  const result = crossReferenceStories(ghMergedPrs, stories);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].storySlug, 'abc-s1');
  assert.deepStrictEqual(result[0].liveMatch, { number: 999, mergedAt: '2026-10-01T00:00:00Z' });
});

// AC1 (no match case): a story whose prUrl does not correspond to any merged PR
test('crossReferenceStories returns liveMatch null when no merged PR matches', () => {
  const { crossReferenceStories } = require('../scripts/lib/dod-handoff-reconciliation');
  const ghMergedPrs = [{ number: 999, mergedAt: '2026-10-01T00:00:00Z' }];
  const stories = [{ slug: 'abc-s2', prUrl: 'https://github.com/org/repo/pull/111', prStatus: 'draft' }];
  const result = crossReferenceStories(ghMergedPrs, stories);
  assert.strictEqual(result[0].liveMatch, null);
});

// Direct coverage of extractPrNumber's own branches (previously only exercised indirectly)
test('extractPrNumber extracts the numeric PR number from a well-formed GitHub PR URL', () => {
  const { extractPrNumber } = require('../scripts/lib/dod-handoff-reconciliation');
  assert.strictEqual(extractPrNumber('https://github.com/org/repo/pull/999'), 999);
});

test('extractPrNumber returns null for a missing, null, or non-matching prUrl', () => {
  const { extractPrNumber } = require('../scripts/lib/dod-handoff-reconciliation');
  assert.strictEqual(extractPrNumber(undefined), null);
  assert.strictEqual(extractPrNumber(null), null);
  assert.strictEqual(extractPrNumber(''), null);
  assert.strictEqual(extractPrNumber('https://github.com/org/repo/issues/999'), null);
});

// The single most common real production input: a story with no prUrl yet (not merged)
test('crossReferenceStories returns liveMatch null for a story with no prUrl at all', () => {
  const { crossReferenceStories } = require('../scripts/lib/dod-handoff-reconciliation');
  const ghMergedPrs = [{ number: 999, mergedAt: '2026-10-01T00:00:00Z' }];
  const stories = [{ slug: 'not-yet-merged-s1', prStatus: 'test-plan' }];
  const result = crossReferenceStories(ghMergedPrs, stories);
  assert.strictEqual(result[0].storySlug, 'not-yet-merged-s1');
  assert.strictEqual(result[0].prUrl, null);
  assert.strictEqual(result[0].liveMatch, null);
});

// AC2: flags a reconciliation gap when prUrl matches a merged PR but prStatus disagrees
test('findReconciliationGaps flags a gap when live-merged story has a non-merged prStatus', () => {
  const { crossReferenceStories, findReconciliationGaps } = require('../scripts/lib/dod-handoff-reconciliation');
  const ghMergedPrs = [{ number: 999, mergedAt: '2026-10-01T00:00:00Z' }];
  const stories = [{ slug: 'abc-s1', prUrl: 'https://github.com/org/repo/pull/999', prStatus: 'draft' }];
  const crossRef = crossReferenceStories(ghMergedPrs, stories);
  const gaps = findReconciliationGaps(crossRef, stories);
  assert.strictEqual(gaps.length, 1);
  assert.strictEqual(gaps[0].storySlug, 'abc-s1');
  assert.strictEqual(gaps[0].severity, 'merged-no-dod');
  assert.strictEqual(gaps[0].source, 'live-reconciliation');
});

// AC2 (negative/control case): no finding when prUrl and prStatus agree
test('findReconciliationGaps produces no finding when prStatus already says merged', () => {
  const { crossReferenceStories, findReconciliationGaps } = require('../scripts/lib/dod-handoff-reconciliation');
  const ghMergedPrs = [{ number: 999, mergedAt: '2026-10-01T00:00:00Z' }];
  const stories = [{ slug: 'abc-s1', prUrl: 'https://github.com/org/repo/pull/999', prStatus: 'merged' }];
  const crossRef = crossReferenceStories(ghMergedPrs, stories);
  const gaps = findReconciliationGaps(crossRef, stories);
  assert.strictEqual(gaps.length, 0);
});

// Edge case: a crossReferenceResults entry whose storySlug has no matching story entry
test('findReconciliationGaps skips a cross-reference result with no matching story entry', () => {
  const { findReconciliationGaps } = require('../scripts/lib/dod-handoff-reconciliation');
  const crossRef = [{ storySlug: 'ghost-s1', prUrl: 'https://github.com/org/repo/pull/999', liveMatch: { number: 999, mergedAt: '2026-10-01T00:00:00Z' } }];
  const stories = []; // no story matching 'ghost-s1'
  assert.doesNotThrow(() => findReconciliationGaps(crossRef, stories));
  const gaps = findReconciliationGaps(crossRef, stories);
  assert.strictEqual(gaps.length, 0);
});

// Mixed array: a story with no live match must never be flagged, regardless of its own prStatus
test('findReconciliationGaps never flags a story with no live match, even with a non-merged prStatus', () => {
  const { crossReferenceStories, findReconciliationGaps } = require('../scripts/lib/dod-handoff-reconciliation');
  const ghMergedPrs = [{ number: 999, mergedAt: '2026-10-01T00:00:00Z' }];
  const stories = [
    { slug: 'matched-s1', prUrl: 'https://github.com/org/repo/pull/999', prStatus: 'draft' },
    { slug: 'unmatched-s2', prUrl: 'https://github.com/org/repo/pull/111', prStatus: 'draft' },
  ];
  const crossRef = crossReferenceStories(ghMergedPrs, stories);
  const gaps = findReconciliationGaps(crossRef, stories);
  assert.strictEqual(gaps.length, 1);
  assert.strictEqual(gaps[0].storySlug, 'matched-s1');
});

// AC4: degrades gracefully and falls back to pipeline-state-only checking when gh is unavailable
test('runReconciliationCheck falls back to pipeline-state-only gaps when gh call throws', () => {
  const { runReconciliationCheck } = require('../scripts/lib/dod-handoff-reconciliation');
  const pipelineState = {
    features: [{
      slug: 'test-feat',
      stories: [{ slug: 'merged-no-dod-s1', prUrl: 'https://github.com/org/repo/pull/1', prStatus: 'merged', dodStatus: 'none' }],
    }],
  };
  const throwingExec = () => { throw new Error('gh: command not found'); };
  const result = runReconciliationCheck({ pipelineState, execGhPrList: throwingExec });
  assert.strictEqual(result.liveCheckFailed, true);
  assert.ok(typeof result.warning === 'string' && result.warning.length > 0, 'a warning message must be present');
  assert.ok(result.warning.indexOf('gh') !== -1, 'warning should mention gh CLI unavailability');
  // The fallback must still perform the pipeline-state-only check, not give up entirely.
  assert.strictEqual(result.gaps.length, 1);
  assert.strictEqual(result.gaps[0].storySlug, 'merged-no-dod-s1');
  assert.strictEqual(result.gaps[0].source, 'pipeline-state-only');
});

// AC4 (no-crash case): runReconciliationCheck does not throw even when gh fails
test('runReconciliationCheck does not throw when gh call throws', () => {
  const { runReconciliationCheck } = require('../scripts/lib/dod-handoff-reconciliation');
  const pipelineState = { features: [] };
  const throwingExec = () => { throw new Error('network unreachable'); };
  assert.doesNotThrow(() => runReconciliationCheck({ pipelineState, execGhPrList: throwingExec }));
});

// AC3's "existing pipeline-state.json fields agreeing with it" path, exercised directly:
// a story flagged by the plain prStatus=merged + dodStatus!=complete check, independent of gh,
// AND correctly flattened out of the epic-nested shape (feature.epics[].stories[]).
test('runReconciliationCheck surfaces pipeline-state-only gaps even when the live gh call succeeds', () => {
  const { runReconciliationCheck } = require('../scripts/lib/dod-handoff-reconciliation');
  const pipelineState = {
    features: [{
      slug: 'test-feat',
      epics: [{
        name: 'test-epic',
        stories: [{ slug: 'epic-nested-s1', prUrl: 'https://github.com/org/repo/pull/2', prStatus: 'merged', dodStatus: 'none' }],
      }],
    }],
  };
  const emptyExec = () => [];
  const result = runReconciliationCheck({ pipelineState, execGhPrList: emptyExec });
  assert.strictEqual(result.liveCheckFailed, false);
  assert.strictEqual(result.gaps.length, 1);
  assert.strictEqual(result.gaps[0].storySlug, 'epic-nested-s1');
});

// Both gap sources must appear together when both fire in the same run
test('runReconciliationCheck merges gaps from both sources when both fire in the same run', () => {
  const { runReconciliationCheck } = require('../scripts/lib/dod-handoff-reconciliation');
  const pipelineState = {
    features: [{
      slug: 'test-feat',
      stories: [
        { slug: 'pipeline-state-only-s1', prUrl: 'https://github.com/org/repo/pull/1', prStatus: 'merged', dodStatus: 'none' },
        { slug: 'live-mismatch-s2', prUrl: 'https://github.com/org/repo/pull/2', prStatus: 'draft' },
      ],
    }],
  };
  const mockExec = () => [{ number: 2, mergedAt: '2026-10-05T00:00:00Z' }];
  const result = runReconciliationCheck({ pipelineState, execGhPrList: mockExec });
  assert.strictEqual(result.gaps.length, 2);
  const foundSlugs = new Set(result.gaps.map(g => g.storySlug));
  assert.ok(foundSlugs.has('pipeline-state-only-s1'), 'the pipeline-state-only gap must be present');
  assert.ok(foundSlugs.has('live-mismatch-s2'), 'the live-reconciliation gap must be present');
  const pipelineStateGap = result.gaps.find(g => g.storySlug === 'pipeline-state-only-s1');
  const liveGap = result.gaps.find(g => g.storySlug === 'live-mismatch-s2');
  assert.strictEqual(pipelineStateGap.source, 'pipeline-state-only');
  assert.strictEqual(liveGap.source, 'live-reconciliation');
});

// flattenStories' own dual-shape case, tested directly rather than only indirectly
test('flattenStories flattens both flat stories[] and epic-nested epics[].stories[] on the same feature', () => {
  const { flattenStories } = require('../scripts/lib/dod-handoff-reconciliation');
  const pipelineState = {
    features: [{
      slug: 'dual-shape-feat',
      stories: [{ slug: 'flat-s1' }],
      epics: [{ name: 'epic-a', stories: [{ slug: 'epic-nested-s1' }] }],
    }],
  };
  const result = flattenStories(pipelineState);
  const slugs = result.map(s => s.slug);
  assert.ok(slugs.includes('flat-s1'), 'flat stories[] entry must be present');
  assert.ok(slugs.includes('epic-nested-s1'), 'epic-nested epics[].stories[] entry must be present');
  assert.strictEqual(result.length, 2);
});

// AC3: the reconciliation callout appears before the status table, not after
test('workflow SKILL.md wires the reconciliation check in before the status table', () => {
  const fs = require('fs');
  const path = require('path');
  const content = fs.readFileSync(path.join(__dirname, '..', 'skills/workflow/SKILL.md'), 'utf8');
  assert.ok(content.includes('dod-handoff-reconciliation'), 'must reference scripts/lib/dod-handoff-reconciliation.js');
  assert.ok(content.includes('runReconciliationCheck'), 'must reference runReconciliationCheck specifically');
  const sessionStartIdx = content.indexOf('## Session start behaviour');
  const reconciliationIdx = content.indexOf('runReconciliationCheck');
  const tableHeaderIdx = content.indexOf('| Feature | Stage | Status | Next action |');
  assert.ok(sessionStartIdx !== -1 && reconciliationIdx !== -1 && tableHeaderIdx !== -1, 'all three markers must be present');
  assert.ok(sessionStartIdx < reconciliationIdx, 'the reconciliation wiring must be inside the Session start behaviour section');
  assert.ok(reconciliationIdx < tableHeaderIdx, 'the reconciliation callout must be instructed BEFORE the status table, not after');
});

// AC4's warning must also be instructed to surface in the session-start output
test('workflow SKILL.md instructs surfacing the gh-unavailable warning, not silently swallowing it', () => {
  const fs = require('fs');
  const path = require('path');
  const content = fs.readFileSync(path.join(__dirname, '..', 'skills/workflow/SKILL.md'), 'utf8');
  assert.ok(content.includes('.warning'), 'must reference the result object\'s warning field');
});

console.log('\n── Summary ──');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(({ name, err }) => {
    console.log(`  ✗ ${name}`);
    console.log(`      ${err.message}`);
  });
}
if (failed > 0) {
  process.exit(1);
}
