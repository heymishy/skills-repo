'use strict';

// plain-language-labels.js — internal artefact type → plain-language display label
// AC2: internal identifiers must never appear as browser-rendered text.

const LABEL_MAP = {
  'discovery':      'Discovery',
  'benefit-metric': 'Benefit Metric',
  'story':          'Stories',
  'stories':        'Stories',
  'test-plan':      'Test Plan',
  'test-plans':     'Test Plan',
  'dor':            'Ready Check',
  'plan':           'Plan',
  'plans':          'Plan',
  'dod':            'Definition of Done',
  'decisions':      'Decisions',
  'reference':      'Reference',
  'research':       'Research',
  'coverage':       'Coverage'
};

/**
 * Map an internal artefact type identifier to a plain-language display label.
 * Unknown types return a title-cased fallback — never the raw identifier.
 * @param {string} internalType
 * @returns {string}
 */
function labelArtefactType(internalType) {
  if (!internalType) return 'Artefact';
  const mapped = LABEL_MAP[internalType.toLowerCase()];
  if (mapped) return mapped;
  // Fallback: title-case with hyphens replaced by spaces (never expose raw ID)
  return internalType
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase()) + ' (Artefact)';
}

/**
 * Derive the artefact type from a file path segment or directory name.
 * Used when scanning directory listings to classify artefacts.
 * @param {string} pathOrDirName  e.g. "dor", "test-plans", "discovery.md"
 * @returns {string}
 */
function labelFromPath(pathOrDirName) {
  const base = pathOrDirName.replace(/\.md$/, '').toLowerCase();
  // Match on exact key first
  if (LABEL_MAP[base]) return LABEL_MAP[base];
  // Derive from directory prefix patterns in path segments
  const parts = base.split('/');
  for (const part of parts.reverse()) {
    if (LABEL_MAP[part]) return LABEL_MAP[part];
  }
  return labelArtefactType(base);
}

/**
 * Group artefacts by their plain-language stage label.
 * @param {Array<{ type: string, name: string, viewUrl: string }>} artefacts
 * @returns {Object<string, Array>}
 */
function groupArtefactsByStage(artefacts) {
  const groups = {};
  for (const artefact of artefacts) {
    const label = artefact.type || 'Artefact';
    if (!groups[label]) groups[label] = [];
    groups[label].push(artefact);
  }
  return groups;
}

module.exports = { labelArtefactType, labelFromPath, groupArtefactsByStage };
