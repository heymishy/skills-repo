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

// Derives inferredGroup assignments for unregistered artefacts from a shared filename prefix (dropping the final hyphen-segment) within the same type -- only assigned when >= 2 artefacts share the same prefix, otherwise null (never a fabricated single-member group).
const inferGroups = (unregisteredArtefacts) => {
  const derivePrefix = (filename) => {
    const stem = filename.replace(/\.md$/, '');
    const parts = stem.split('-');
    if (parts.length <= 1) return null;
    return parts.slice(0, -1).join('-');
  };

  const withPrefix = unregisteredArtefacts.map((artefact) => {
    const prefix = derivePrefix(artefact.filename);
    return { artefact, prefix, key: prefix && artefact.type + '::' + prefix };
  });

  const groupCounts = {};
  withPrefix.forEach(({ prefix, key }) => {
    if (!prefix) return;
    groupCounts[key] = (groupCounts[key] || 0) + 1;
  });

  const assignments = {};
  withPrefix.forEach(({ artefact, prefix, key }) => {
    assignments[artefact.path] = prefix && groupCounts[key] >= 2 ? prefix : null;
  });

  return assignments;
};

// traceResult: the object buildArtefactTrace produces (status: 'found', with epics/stories/artefacts already populated); classifies each artefact as 'registered'/'unregistered' and each story as 'registered'/'orphaned-registration', returning a new object of the same shape with a `divergence` field added throughout
const classifyDivergence = (traceResult) => {
  if (traceResult.status !== 'found') {
    // not-yet-synced / not-found: nothing to classify (AC3's own precedence
    // is automatically satisfied here -- there is no per-document data yet).
    return traceResult;
  }

  const unregisteredArtefacts = traceResult.artefacts.filter((a) => !a.storySlug);
  const inferredGroupAssignments = inferGroups(unregisteredArtefacts);

  const artefacts = traceResult.artefacts.map((artefact) => {
    const divergence = artefact.storySlug ? 'registered' : 'unregistered';
    const enriched = Object.assign({}, artefact, { divergence });
    if (divergence === 'unregistered') {
      enriched.inferredGroup = inferredGroupAssignments[artefact.path] || null;
    }
    return enriched;
  });

  const stories = traceResult.stories.map((story) => {
    const hasMatchingArtefact = artefacts.some((a) => a.storySlug === story.slug);
    return Object.assign({}, story, {
      divergence: hasMatchingArtefact ? 'registered' : 'orphaned-registration'
    });
  });

  return Object.assign({}, traceResult, { artefacts, stories });
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
      // Nested-shape stories (feature.epics[].stories[]) key on `slug`, not `id` --
      // that is the canonical field for this shape in pipeline-state.json.
      (epic.stories || []).forEach((story) => {
        stories.push({ slug: story.slug, name: story.name, epicSlug: epic.slug });
      });
    });
    // epicSlug is intentionally omitted (undefined) here, not set to null --
    // flat-shape stories have no epic to attribute to, unlike nested-shape
    // stories above where epicSlug is always a real string. This is a
    // deliberate contract for downstream consumers (cat-s2, cat-s4) to rely on.
    // Flat-shape stories (feature.stories[]) key on `id`, the canonical field
    // per this repo's `bin/skills advance <feature-slug> <story-id>` convention --
    // `story.slug` is kept only as a fallback for older/looser flat records.
    (feature.stories || []).forEach((story) => {
      stories.push({ slug: story.id || story.slug, name: story.name });
    });
  }

  // Longest-prefix match first: needed when one story slug is itself a
  // hyphen-extension of another (e.g. 'cat-s1' and 'cat-s1-extra'), since
  // both are then valid hyphen-delimited prefixes of the same filename
  // ('cat-s1-extra-foo.md'). Without this sort, Array.prototype.find below
  // would return whichever candidate happens to appear first in
  // pipeline-state.json's story order, not the more specific match.
  const sortedStories = stories.slice().sort((a, b) => (b.slug || '').length - (a.slug || '').length);
  artefacts.forEach((artefact) => {
    const match = sortedStories.find((story) => story.slug && (artefact.filename.indexOf(story.slug + '-') === 0 || artefact.filename === story.slug + '.md'));
    artefact.storySlug = match ? match.slug : null;
  });

  return { status: 'found', resolvedDir, epics, stories, artefacts };
};

module.exports = { buildArtefactTrace, classifyDivergence };
