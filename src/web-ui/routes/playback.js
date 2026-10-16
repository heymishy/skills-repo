'use strict';
// playback.js -- fpd-s3: read-only viewer route for a DoD-validated
// feature's own playback package (walkthrough doc + screenshots from
// fpd-s1, video + captions/transcript from fpd-s2). Lists features with a
// package, and renders one feature's own scope/benefit/per-story-AC
// traceability structure. No new persisted data (Architecture Constraints).

const fs = require('fs');
const path = require('path');

// AC1, AC5: "has a package" = artefacts/[slug]/playback/walkthrough.md
// exists on disk -- the one file every package is guaranteed to have, per
// fpd-s1's own AC1 (decisions.md / dor-contract assumption).
function listPlaybackFeatures(repoRoot, state, existsSyncFn) {
  const exists = existsSyncFn || fs.existsSync;
  return (state.features || [])
    .filter((f) => exists(path.join(repoRoot, 'artefacts', f.slug, 'playback', 'walkthrough.md')))
    .map((f) => ({ slug: f.slug, name: f.name || f.slug }));
}

module.exports = { listPlaybackFeatures };
