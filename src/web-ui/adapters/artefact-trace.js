'use strict';

// artefact-trace.js — buildArtefactTrace adapter (ADR-028, ADR-029)
// The single canonical builder for a feature's artefact trace, derived from
// real disk structure. ADR-028: exactly one builder for this derived
// structure — other modules must call this rather than re-deriving it.
// ADR-029: the local filesystem checkout is canonical for artefact content;
// pipeline-state.json is enrichment only.

const fs = require('fs');
const path = require('path');

const walkDir = (dir, base) => {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walkDir(full, base));
    } else if (entry.isFile()) {
      const rel = path.relative(base, full).split(path.sep).join('/');
      const parts = rel.split('/');
      const type = parts.length > 1 ? parts[0] : 'feature-level';
      results.push({ path: rel, type, filename: entry.name });
    }
  });
  return results;
};

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

  // pipeline-state cross-reference (epics/stories attribution) lands in a later task.
  const artefacts = walkDir(resolvedDir, resolvedDir);
  return { status: 'found', resolvedDir, epics: [], stories: [], artefacts };
};

module.exports = { buildArtefactTrace };
