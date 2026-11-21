'use strict';

// bookkeeping-paths.js -- pgb-s1. Which repository paths are pipeline bookkeeping (state, artefacts, workspace notes)
// and not code. This is the same list as `paths-ignore` in .github/workflows/staging-deploy.yml: a push that changes
// only these paths starts no deploy run, so a run's commit can legitimately be behind the head of master by such
// pushes. tests/check-pgb-s1-promotion-bookkeeping.js (P9) fails if this function and that list ever disagree.
//
//   paths-ignore:
//     - 'workspace/**'
//     - 'artefacts/**'
//     - '!artefacts/*/playback/**'     (playback media is served by the app, so it is code, not bookkeeping)
//     - '.github/pipeline-state.json'

const PLAYBACK = /^artefacts\/[^/]+\/playback\//;

function isBookkeepingPath(p) {
  if (typeof p !== 'string' || p === '' || p.charAt(0) === '/' || p.split('/').indexOf('..') !== -1) return false;
  if (p === '.github/pipeline-state.json') return true;
  if (p.indexOf('workspace/') === 0) return true;
  if (p.indexOf('artefacts/') === 0) return !PLAYBACK.test(p);
  return false;
}

module.exports = { isBookkeepingPath };
