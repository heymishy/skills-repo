'use strict';

// feature-story-structure.js — fapg-s1
//
// Reads a feature's real story structure directly from the connected
// repo's own local checkout (repoRoot/.github/pipeline-state.json),
// matching ADR-023 "disk is canonical" and listLocalArtefacts's own
// established local-first convention -- not a Postgres taxonomy query.
// This is deliberately narrower than fal-s1's own tenant-scoped taxonomy
// scan: that resolver answers "which feature does this raw story slug
// belong to" (needed rarely, kept fully unchanged, NFR-Performance intact);
// this answers "what is this ALREADY-RESOLVED feature's own full story
// list" (needed on every multi-story render), which is cheaper to read
// straight off disk than to query for.

const fs   = require('fs');
const path = require('path');

/**
 * Extracts a story's own slug regardless of shape -- fal-s1's own
 * established handling for the schema-documented "Format A" (bare-string)
 * vs object-shaped story reference duality.
 * @param {string|object} story
 * @returns {string|undefined}
 */
function _storySlug(story) {
  return typeof story === 'string' ? story : (story && (story.slug || story.id));
}

/**
 * Reads repoRoot/.github/pipeline-state.json and returns the named
 * feature's own story structure, or null if the file or feature is
 * absent -- callers fall back to today's flat rendering in that case,
 * not an error (aada-s1's own "volumeless container" scenario applies
 * here too, for repos with no local checkout).
 * @param {string} repoRoot
 * @param {string} featureSlug
 * @returns {{epics: Array<{epicName: string, epicSlug: string, storySlugs: string[]}>, flatStorySlugs: string[]}|null}
 */
function getFeatureStoryStructure(repoRoot, featureSlug) {
  const statePath = path.join(repoRoot, '.github', 'pipeline-state.json');
  if (!fs.existsSync(statePath)) return null;

  let state;
  try {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch (_) {
    return null;
  }

  const feature = (state.features || []).find((f) => f.slug === featureSlug);
  if (!feature) return null;

  const epics = Array.isArray(feature.epics)
    ? feature.epics.map((epic) => ({
        epicName: epic.name,
        epicSlug: epic.slug,
        storySlugs: (epic.stories || []).map(_storySlug).filter(Boolean)
      }))
    : [];

  const flatStorySlugs = Array.isArray(feature.stories)
    ? feature.stories.map(_storySlug).filter(Boolean)
    : [];

  return { epics, flatStorySlugs };
}

/**
 * Classifies a flat artefact list (from _listArtefacts) by which story
 * each file belongs to, using the real story-slug list from
 * getFeatureStoryStructure -- filename-guessing alone is unreliable in
 * this repo, since story slugs are not consistently shaped (p3.3, p3.1a,
 * fal-s1, s3.1-drag-to-advance), so the authoritative slug list is
 * required to disambiguate correctly. Candidate slugs are checked
 * longest-first so e.g. a p3.1a-*.md file is never mis-attributed to a
 * shorter p3.1 group.
 * @param {Array<{path: string}>} artefacts
 * @param {{epics: Array<{epicName: string, epicSlug: string, storySlugs: string[]}>, flatStorySlugs: string[]}} storyStructure
 * @returns {{featureLevel: Array, epics: Array<{epicName: string, epicSlug: string, stories: Array<{slug: string, artefacts: Array}>}>, flatStories: Array<{slug: string, artefacts: Array}>}}
 */
function groupArtefactsByStory(artefacts, storyStructure) {
  const allSlugs = []
    .concat(storyStructure.epics.reduce((acc, e) => acc.concat(e.storySlugs), []))
    .concat(storyStructure.flatStorySlugs)
    .sort((a, b) => b.length - a.length);

  const byStorySlug = {};
  allSlugs.forEach((slug) => { byStorySlug[slug] = []; });
  const featureLevel = [];

  (artefacts || []).forEach((artefact) => {
    const basename = (artefact.path || '').split('/').pop() || '';
    const matchedSlug = allSlugs.find((slug) => basename.indexOf(slug + '-') === 0);
    if (matchedSlug) {
      byStorySlug[matchedSlug].push(artefact);
    } else {
      featureLevel.push(artefact);
    }
  });

  const epics = storyStructure.epics.map((epic) => ({
    epicName: epic.epicName,
    epicSlug: epic.epicSlug,
    stories: epic.storySlugs.map((slug) => ({ slug, artefacts: byStorySlug[slug] || [] }))
  }));

  const flatStories = storyStructure.flatStorySlugs.map((slug) => ({ slug, artefacts: byStorySlug[slug] || [] }));

  return { featureLevel, epics, flatStories };
}

module.exports = { getFeatureStoryStructure, groupArtefactsByStory };
