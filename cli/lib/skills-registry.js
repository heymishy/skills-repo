'use strict';

const fs = require('fs');
const path = require('path');

// See CLAUDE.md's "Pipeline overview" section for the source grouping this
// mirrors: outer-loop = steps 1-6.5 (discovery through decisions — the
// "structured outer loop... discovery through definition-of-ready" plus the
// decisions gate that follows it); inner-loop = step 7 (7a-7e, "Inner coding
// loop") plus the skills CLAUDE.md names as "available throughout the inner
// loop"; ancillary = everything else named in that section (onboarding,
// cross-cutting architecture support, pipeline-evolution support, programme
// track, and the post-merge feedback-loop skills that close the delivery
// cycle rather than execute a single story).
//
// Nothing below branches on a category's *name* — a category is opaque
// metadata used only for listing and diagram cross-reference. That is what
// lets a brand new category value be added here with zero change to
// copySkillsFromRegistry (rb-s2 AC3 — see
// tests/check-rb-s2-full-skill-set-and-registry.js
// addingNewCategoryRequiresOnlyRegistryEntry_representativeInstance).
const SKILL_CATEGORIES = {
  discovery: 'outer-loop',
  'benefit-metric': 'outer-loop',
  design: 'outer-loop',
  definition: 'outer-loop',
  review: 'outer-loop',
  'test-plan': 'outer-loop',
  'definition-of-ready': 'outer-loop',
  decisions: 'outer-loop',

  'branch-setup': 'inner-loop',
  'implementation-plan': 'inner-loop',
  'subagent-execution': 'inner-loop',
  'verify-completion': 'inner-loop',
  'branch-complete': 'inner-loop',
  tdd: 'inner-loop',
  'systematic-debugging': 'inner-loop',
  'implementation-review': 'inner-loop',

  bootstrap: 'ancillary',
  checkpoint: 'ancillary',
  clarify: 'ancillary',
  'coverage-map': 'ancillary',
  'definition-of-done': 'ancillary',
  'ea-registry': 'ancillary',
  estimate: 'ancillary',
  ideate: 'ancillary',
  improve: 'ancillary',
  'improvement-agent': 'ancillary',
  'issue-dispatch': 'ancillary',
  'loop-design': 'ancillary',
  'metric-review': 'ancillary',
  'model-sweep': 'ancillary',
  'modernisation-decompose': 'ancillary',
  'org-mapping': 'ancillary',
  orient: 'ancillary',
  'persona-routing': 'ancillary',
  prioritise: 'ancillary',
  programme: 'ancillary',
  'record-signal': 'ancillary',
  'reference-corpus-update': 'ancillary',
  release: 'ancillary',
  'reverse-engineer': 'ancillary',
  'scale-pipeline': 'ancillary',
  spike: 'ancillary',
  start: 'ancillary',
  'token-optimization': 'ancillary',
  trace: 'ancillary',
  workflow: 'ancillary'
};

const DEFAULT_CATEGORY = 'ancillary';

/** Lists immediate subdirectory names of skillsDir (each subdirectory is one skill). */
function listSkillDirs(skillsDir) {
  if (!fs.existsSync(skillsDir)) return [];
  return fs.readdirSync(skillsDir)
    .filter(name => fs.statSync(path.join(skillsDir, name)).isDirectory())
    .sort();
}

/**
 * Builds a registry manifest: every skill directory under skillsDir, each
 * assigned a category from categoryMap (default: the real production
 * SKILL_CATEGORIES map above). A skill with no entry in categoryMap defaults
 * to DEFAULT_CATEGORY rather than throwing, so an unmapped addition to
 * skills/ never breaks init.
 */
function buildRegistry(skillsDir, categoryMap) {
  categoryMap = categoryMap || SKILL_CATEGORIES;
  const names = listSkillDirs(skillsDir);
  const skills = names.map(name => ({
    name,
    category: Object.prototype.hasOwnProperty.call(categoryMap, name) ? categoryMap[name] : DEFAULT_CATEGORY
  }));
  return { version: '1', generatedAt: new Date().toISOString(), skills };
}

/** Recursively copies a directory. Skips existing files unless force is true. */
function copyDirRecursive(src, dest, force) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirRecursive(srcPath, destPath, force);
    } else {
      if (!force && fs.existsSync(destPath)) continue;
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Copies every skill directory listed in registry.skills from skillsDir to
 * destDir. Deliberately does not read or branch on entry.category anywhere —
 * category is manifest metadata, not a copy-eligibility switch. This is what
 * lets a brand new category value work with zero change to this function
 * (rb-s2 AC3).
 */
function copySkillsFromRegistry(skillsDir, destDir, registry, force) {
  const copied = [];
  for (const entry of registry.skills) {
    const src = path.join(skillsDir, entry.name);
    if (!fs.existsSync(src)) continue;
    copyDirRecursive(src, path.join(destDir, entry.name), force);
    copied.push(entry.name);
  }
  return copied;
}

/** Writes the registry manifest as pretty-printed JSON, always overwriting (registry reflects the current run). */
function writeRegistryFile(registry, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, JSON.stringify(registry, null, 2) + '\n', 'utf8');
}

const PIPELINE_OVERVIEW_HEADING = '## Pipeline overview';

/**
 * Extracts the "## Pipeline overview" section of an instruction file (the
 * numbered step table plus its named support-skill callouts), stopping at
 * the next "## " heading. Returns '' if the heading is not present.
 */
function extractPipelineOverviewSection(instructionText) {
  const startIdx = instructionText.indexOf(PIPELINE_OVERVIEW_HEADING);
  if (startIdx === -1) return '';
  const rest = instructionText.slice(startIdx + PIPELINE_OVERVIEW_HEADING.length);
  const nextHeadingMatch = rest.match(/\n## /);
  return nextHeadingMatch ? rest.slice(0, nextHeadingMatch.index) : rest;
}

/**
 * Extracts every `/skill-slug`-shaped token referenced in the pipeline
 * overview section of an instruction file, returning the set of skill slugs
 * the diagram actually names.
 */
function parseDiagramSteps(instructionText) {
  const section = extractPipelineOverviewSection(instructionText);
  const steps = new Set();
  const re = /\/([a-z][a-z0-9-]*)/g;
  let match;
  while ((match = re.exec(section)) !== null) {
    steps.add(match[1]);
  }
  return steps;
}

/**
 * Returns registry entries categorised outer-loop/inner-loop that do not
 * correspond to a step named in the diagram — should be empty for a
 * correctly-built registry (rb-s2 AC4). Ancillary entries are never checked:
 * AC4 only binds outer-loop and inner-loop categories to named diagram steps.
 */
function findOrphanedEntries(registry, diagramSteps) {
  return registry.skills.filter(entry =>
    (entry.category === 'outer-loop' || entry.category === 'inner-loop') &&
    !diagramSteps.has(entry.name));
}

module.exports = {
  SKILL_CATEGORIES,
  DEFAULT_CATEGORY,
  listSkillDirs,
  buildRegistry,
  copyDirRecursive,
  copySkillsFromRegistry,
  writeRegistryFile,
  extractPipelineOverviewSection,
  parseDiagramSteps,
  findOrphanedEntries
};
