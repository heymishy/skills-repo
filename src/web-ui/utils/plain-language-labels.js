'use strict';

// plain-language-labels.js — internal artefact type → plain-language display label
// AC2: internal identifiers must never appear as browser-rendered text.

const { resolveLabel, isKnownSubdir } = require('./artefact-labels');

// cat-s2: subdirectory-name entries (stories, test-plans, plans, dod,
// decisions, reference, research, coverage) were removed from this map and
// are now resolved via the canonical table in utils/artefact-labels.js (see
// isKnownSubdir()/resolveLabel() below) -- closing the 5-table divergence
// risk (ADR-028). 'dor' is the one exception kept here: it is a genuine
// bare-TYPE identifier in its own right (labelArtefactType('dor') is real,
// tested production behaviour), not just a subdirectory name, so it stays --
// the same coincidental-overlap pattern already documented on TYPE_LABELS
// in artefact-labels.js, where 'dor' also appears in both key domains and
// happens to resolve to the same value by convention, not shared source.
// The remaining entries below are bare-TYPE identifiers used only by
// labelArtefactType, which has no filename parameter and is a different
// concern from subdirectory resolution.
const LABEL_MAP = {
  'discovery':      'Discovery',
  'benefit-metric': 'Benefit Metric',
  'story':          'Stories',
  'test-plan':      'Test Plan',
  'dor':            'Ready Check',
  'plan':           'Plan'
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
 * cat-s2: subdirectory-shaped segments (e.g. "test-plans", "reference") are
 * checked against the canonical table (utils/artefact-labels.js) before
 * falling back to this file's own LABEL_MAP and labelArtefactType -- see the
 * comment above LABEL_MAP for why 'dor' still appears in both places.
 * @param {string} pathOrDirName  e.g. "dor", "test-plans", "discovery.md"
 * @returns {string}
 */
function labelFromPath(pathOrDirName) {
  const base = pathOrDirName.replace(/\.md$/, '').toLowerCase();
  // Canonical subdirectory table takes priority for subdirectory-shaped names
  if (isKnownSubdir(base)) return resolveLabel(base, pathOrDirName);
  // Match on exact key first
  if (LABEL_MAP[base]) return LABEL_MAP[base];
  // Derive from directory prefix patterns in path segments
  const parts = base.split('/');
  for (const part of parts.reverse()) {
    if (isKnownSubdir(part)) return resolveLabel(part, pathOrDirName);
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
