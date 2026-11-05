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

module.exports = { extractPrNumber, crossReferenceStories };
