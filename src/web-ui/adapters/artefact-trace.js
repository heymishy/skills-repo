'use strict';

// artefact-trace.js — buildArtefactTrace adapter (ADR-028, ADR-029)
// The single canonical builder for a feature's artefact trace, derived from
// real disk structure. ADR-028: exactly one builder for this derived
// structure — other modules must call this rather than re-deriving it.
// ADR-029: the local filesystem checkout is canonical for artefact content;
// pipeline-state.json is enrichment only.

const fs = require('fs');
const path = require('path');

// dir: current directory being walked (changes per recursive call); base: the fixed root all paths are reported relative to
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
      // 'feature-level' = a file directly in the feature root, not inside a subdirectory (dor/, stories/, etc.)
      const type = parts.length > 1 ? parts[0] : 'feature-level';
      results.push({ path: rel, type, filename: entry.name });
    }
  });
  return results;
};

const readPipelineStateForSlug = (repoRoot, featureSlug) => {
  const statePath = path.join(repoRoot, '.github', 'pipeline-state.json');
  if (!fs.existsSync(statePath)) return null;
  let state;
  try {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch (_) {
    return null;
  }
  const feature = (state.features || []).find((f) => f.slug === featureSlug);
  return feature || null;
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

  const artefacts = walkDir(resolvedDir, resolvedDir);

  const feature = readPipelineStateForSlug(repoRoot, featureSlug);
  let epics = [];
  let stories = [];
  if (feature) {
    (feature.epics || []).forEach((epic) => {
      epics.push({ slug: epic.slug, name: epic.name });
      (epic.stories || []).forEach((story) => {
        stories.push({ slug: story.slug, name: story.name, epicSlug: epic.slug });
      });
    });
    (feature.stories || []).forEach((story) => {
      stories.push({ slug: story.id || story.slug, name: story.name });
    });
  }

  // Longest-prefix match first, so 'cat-s10-foo.md' matches story 'cat-s10'
  // rather than the shorter 'cat-s1' also being a valid (wrong) prefix match.
  const sortedStories = stories.slice().sort((a, b) => (b.slug || '').length - (a.slug || '').length);
  artefacts.forEach((artefact) => {
    const match = sortedStories.find((story) => story.slug && artefact.filename.indexOf(story.slug + '-') === 0);
    artefact.storySlug = match ? match.slug : null;
  });

  return { status: 'found', resolvedDir, epics, stories, artefacts };
};

module.exports = { buildArtefactTrace };
