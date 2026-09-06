'use strict';

// artefact-trace.js — buildArtefactTrace adapter (ADR-028, ADR-029)
// The single canonical builder for a feature's artefact trace, derived from
// real disk structure. ADR-028: exactly one builder for this derived
// structure — other modules must call this rather than re-deriving it.
// ADR-029: the local filesystem checkout is canonical for artefact content;
// pipeline-state.json is enrichment only.

const fs = require('fs');
const path = require('path');

const buildArtefactTrace = (repoRoot, featureSlug) => {
  if (!fs.existsSync(repoRoot)) {
    return { status: 'not-yet-synced' };
  }

  const primaryDir = path.join(repoRoot, 'artefacts', featureSlug);
  const archivedDir = path.join(repoRoot, 'artefacts', 'archived', featureSlug);

  let resolvedDir = null;
  // One fallback branch only (ADR-028) -- do not duplicate this logic in
  // features.js, artefact-list.js, or artefact-fetcher.js; those modules
  // should call buildArtefactTrace instead (cat-s4/cat-s5 wire this).
  if (fs.existsSync(primaryDir)) {
    resolvedDir = primaryDir;
  } else if (fs.existsSync(archivedDir)) {
    resolvedDir = archivedDir;
  }

  if (!resolvedDir) {
    return { status: 'not-found' };
  }

  // Directory walk and pipeline-state cross-reference land in later tasks.
  return { status: 'found', resolvedDir, epics: [], stories: [], artefacts: [] };
};

module.exports = { buildArtefactTrace };
