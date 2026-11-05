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

module.exports = { extractPrNumber, crossReferenceStories, findReconciliationGaps };
