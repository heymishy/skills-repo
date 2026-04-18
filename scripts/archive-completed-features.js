#!/usr/bin/env node
// archive-completed-features.js
// Moves DoD-complete features from pipeline-state.json to pipeline-state-archive.json.
// For in-flight features with mixed story states, moves completed stories to
// a completedStories array in the archive while keeping in-flight stories active.
//
// Usage:
//   node scripts/archive-completed-features.js           # run against repo root
//   node scripts/archive-completed-features.js [rootDir] # run against custom root
//
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ARCHIVE_REL_PATH = '.github/pipeline-state-archive.json';

function isStoryCompleted(story) {
  if (typeof story === 'string') return false;
  return story.dodStatus === 'complete';
}

function isFeatureFullyCompleted(feature) {
  return feature.stage === 'definition-of-done' && feature.health === 'green';
}

function archive(rootDir) {
  rootDir = rootDir || path.join(__dirname, '..');
  const ghDir      = path.join(rootDir, '.github');
  const statePath  = path.join(ghDir, 'pipeline-state.json');
  const archPath   = path.join(ghDir, 'pipeline-state-archive.json');

  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

  // Load existing archive or create empty
  let arch;
  if (fs.existsSync(archPath)) {
    arch = JSON.parse(fs.readFileSync(archPath, 'utf8'));
  } else {
    arch = { version: state.version || '1', archivedAt: new Date().toISOString(), features: [] };
  }

  const archSlugs = new Set((arch.features || []).map(f => f.slug));
  const previousArchCount = arch.features.length;
  const remainingFeatures = [];

  for (const feature of state.features) {
    // Skip if already fully archived
    if (archSlugs.has(feature.slug)) {
      // Check if it also has a completedStories entry — skip partial re-archive too
      const existingArch = arch.features.find(f => f.slug === feature.slug);
      if (existingArch && !existingArch.completedStories) {
        // Fully archived already — don't add back to active
        continue;
      }
      if (existingArch && existingArch.completedStories) {
        // Partial archive already exists — keep active portion as-is
        remainingFeatures.push(feature);
        continue;
      }
    }

    if (isFeatureFullyCompleted(feature)) {
      // Fully completed — move entire feature to archive
      arch.features.push(JSON.parse(JSON.stringify(feature)));
      archSlugs.add(feature.slug);
      // Don't add to remainingFeatures
    } else {
      // Check for partial archive: in-flight feature with some completed stories
      const stories = feature.stories || [];
      const completedStories = stories.filter(s => isStoryCompleted(s));
      const inflightStories  = stories.filter(s => !isStoryCompleted(s));

      if (completedStories.length > 0 && inflightStories.length > 0) {
        // Partial archive — move completed stories
        if (!archSlugs.has(feature.slug)) {
          const archEntry = {
            slug: feature.slug,
            name: feature.name,
            completedStories: JSON.parse(JSON.stringify(completedStories))
          };
          arch.features.push(archEntry);
          archSlugs.add(feature.slug);
        }
        // Keep feature in active with only in-flight stories
        const activeCopy = JSON.parse(JSON.stringify(feature));
        activeCopy.stories = JSON.parse(JSON.stringify(inflightStories));
        remainingFeatures.push(activeCopy);
      } else {
        // No completed stories to archive — keep as-is
        remainingFeatures.push(feature);
      }
    }
  }

  // Update active state
  state.features = remainingFeatures;
  state.archive  = ARCHIVE_REL_PATH;

  // Only update timestamp if something actually changed
  const didArchive = arch.features.length > previousArchCount;
  if (didArchive) {
    state.updated = new Date().toISOString();
  }

  // Validate both are valid JSON before writing (serialize first, then write)
  const activeJson  = JSON.stringify(state, null, 2);
  const archiveJson = JSON.stringify(arch, null, 2);
  JSON.parse(activeJson);   // validate
  JSON.parse(archiveJson);  // validate

  fs.writeFileSync(statePath, activeJson);
  fs.writeFileSync(archPath, archiveJson);

  return { activePath: statePath, archivePath: archPath, archived: arch.features.length };
}

function mergeState(activeData, archiveData) {
  if (!archiveData || !archiveData.features) {
    return activeData;
  }
  const merged = JSON.parse(JSON.stringify(activeData));
  const activeSlugs = new Set((merged.features || []).map(f => f.slug));

  for (const archFeature of archiveData.features) {
    if (archFeature.completedStories && activeSlugs.has(archFeature.slug)) {
      // Partial archive — merge completed stories back into the active feature
      const activeFeature = merged.features.find(f => f.slug === archFeature.slug);
      if (activeFeature) {
        activeFeature.stories = [
          ...(archFeature.completedStories || []),
          ...(activeFeature.stories || [])
        ];
      }
    } else if (!activeSlugs.has(archFeature.slug)) {
      // Fully archived feature — add to merged list
      merged.features.unshift(archFeature);
    }
  }

  return merged;
}

// CLI mode
if (require.main === module) {
  const rootDir = process.argv[2] || path.join(__dirname, '..');
  const result = archive(rootDir);
  console.log(`Archived ${result.archived} feature(s).`);
  console.log(`Active:  ${result.activePath}`);
  console.log(`Archive: ${result.archivePath}`);
}

module.exports = { archive, mergeState };
