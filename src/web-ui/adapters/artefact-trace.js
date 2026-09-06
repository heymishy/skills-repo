'use strict';
var fs = require('fs');
var path = require('path');

function pathExists(p) {
  try { fs.accessSync(p); return true; }
  catch (_) { return false; }
}

function buildArtefactTrace(repoRoot, featureSlug) {
  if (!pathExists(repoRoot)) {
    return { status: 'not-yet-synced' };
  }

  var primaryDir = path.join(repoRoot, 'artefacts', featureSlug);
  var archivedDir = path.join(repoRoot, 'artefacts', 'archived', featureSlug);

  var resolvedDir = null;
  if (pathExists(primaryDir)) {
    resolvedDir = primaryDir;
  } else if (pathExists(archivedDir)) {
    resolvedDir = archivedDir;
  }

  if (!resolvedDir) {
    return { status: 'not-found' };
  }

  // Directory walk and pipeline-state cross-reference land in later tasks.
  return { status: 'found', resolvedDir: resolvedDir, epics: [], stories: [], artefacts: [] };
}

module.exports = { buildArtefactTrace: buildArtefactTrace, pathExists: pathExists };
