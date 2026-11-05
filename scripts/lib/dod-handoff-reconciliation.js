'use strict';

function extractPrNumber(prUrl) {
  if (!prUrl) return null;
  const m = /\/pull\/(\d+)/.exec(prUrl);
  return m ? Number(m[1]) : null;
}

function crossReferenceStories(ghMergedPrs, stories) {
  const byNumber = new Map(ghMergedPrs.map(pr => [pr.number, pr]));
  return stories.map(story => {
    const prNumber = extractPrNumber(story.prUrl);
    const liveMatch = prNumber !== null ? (byNumber.get(prNumber) || null) : null;
    return { storySlug: story.slug, prUrl: story.prUrl || null, liveMatch };
  });
}

function findReconciliationGaps(crossReferenceResults, stories) {
  const bySlug = new Map(stories.map(s => [s.slug, s]));
  const gaps = [];
  for (const result of crossReferenceResults) {
    if (!result.liveMatch) continue;
    const story = bySlug.get(result.storySlug);
    if (!story) continue;
    if (story.prStatus !== 'merged') {
      gaps.push({
        storySlug: result.storySlug,
        severity: 'merged-no-dod',
        source: 'live-reconciliation',
        message: `Story "${result.storySlug}" has prUrl matching a real merged PR (#${result.liveMatch.number}, merged ${result.liveMatch.mergedAt}) but pipeline-state.json's own prStatus reads "${story.prStatus}" -- reconciliation gap per ADR-030.`,
      });
    }
  }
  return gaps;
}

function flattenStories(pipelineState) {
  const stories = [];
  for (const feature of (pipelineState && pipelineState.features) || []) {
    for (const story of feature.stories || []) {
      stories.push(story);
    }
    for (const epic of feature.epics || []) {
      for (const story of epic.stories || []) {
        stories.push(story);
      }
    }
  }
  return stories;
}

function findPipelineStateOnlyGaps(stories) {
  return stories
    .filter(s => s.prStatus === 'merged' && s.dodStatus !== 'complete')
    .map(s => ({
      storySlug: s.slug,
      severity: 'merged-no-dod',
      source: 'pipeline-state-only',
      message: `Story "${s.slug}" has prStatus "merged" but dodStatus is "${s.dodStatus || 'not set'}" -- merged but Definition of Done not complete.`,
    }));
}

function defaultExecGhPrList() {
  const { execSync } = require('child_process');
  const output = execSync('gh pr list --state merged --json number,mergedAt --limit 1000', { encoding: 'utf8', timeout: 15000 });
  return JSON.parse(output);
}

function runReconciliationCheck({ pipelineState, execGhPrList = defaultExecGhPrList } = {}) {
  const stories = flattenStories(pipelineState);
  const pipelineStateOnlyGaps = findPipelineStateOnlyGaps(stories);

  let ghMergedPrs;
  try {
    ghMergedPrs = execGhPrList();
  } catch (err) {
    return {
      gaps: pipelineStateOnlyGaps,
      warning: 'Could not reach gh CLI this session (' + err.message + ') -- falling back to pipeline-state.json-only checking. Live reconciliation did not run.',
      liveCheckFailed: true,
    };
  }

  const crossReferenceResults = crossReferenceStories(ghMergedPrs, stories);
  const liveMismatchGaps = findReconciliationGaps(crossReferenceResults, stories);

  const bySlug = new Map();
  for (const gap of [...pipelineStateOnlyGaps, ...liveMismatchGaps]) {
    bySlug.set(gap.storySlug, gap);
  }

  return { gaps: Array.from(bySlug.values()), warning: null, liveCheckFailed: false };
}

module.exports = {
  extractPrNumber,
  crossReferenceStories,
  findReconciliationGaps,
  flattenStories,
  findPipelineStateOnlyGaps,
  runReconciliationCheck,
};
