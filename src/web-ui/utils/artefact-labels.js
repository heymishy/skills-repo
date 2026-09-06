'use strict';

// artefact-labels.js — static plain-language label mapping for artefact type identifiers.
// Used by handleGetFeatureArtefacts() HTML render path to convert raw type strings
// (e.g. "dor", "benefit-metric") to human-readable labels.
// ADR-012: static synchronous mapping — no I/O.

const TYPE_LABELS = {
  'dor':            'Ready Check',
  'benefit-metric': 'Benefit Metric',
  'test-plan':      'Test Plan',
  'discovery':      'Discovery'
};

/**
 * Return a human-readable label for an artefact type identifier.
 * Unknown types return a non-empty fallback string (never throws).
 * @param {string} type  e.g. "dor", "benefit-metric"
 * @returns {string}     e.g. "Ready Check"
 */
function getLabel(type) {
  if (typeof type === 'string' && TYPE_LABELS[type]) {
    return TYPE_LABELS[type];
  }
  // Fallback: capitalise the first character, return as-is if non-empty, else 'Artefact'
  if (typeof type === 'string' && type.length > 0) {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
  return 'Artefact';
}

// ---------------------------------------------------------------------------
// cat-s2: canonical subdirectory -> display label table (ADR-028). Replaces
// the separately-maintained SUBDIR_TYPE_MAP (artefact-list.js), LABEL_MAP
// (plain-language-labels.js), ARTEFACT_SUBDIRS (artefact-fetcher.js), and the
// inline SUBDIR_KEY inside features.js's _deriveMatrixColumn (that one is
// reused, not replaced -- see resolveColumnKey in Task 2).
//
// This table is keyed by filesystem SUBDIRECTORY name and is a distinct
// domain from TYPE_LABELS above, which is keyed by artefact TYPE identifier
// -- they are not the same key space, even though some values coincide by
// convention rather than shared source (e.g. 'dor' exists in both and both
// resolve to 'Ready Check'; TYPE_LABELS' singular 'test-plan' and this
// table's plural 'test-plans' both resolve to 'Test Plan'). Kept private —
// only resolveLabel() is exported; go through it rather than reading this
// table directly.
// ---------------------------------------------------------------------------
const SUBDIR_LABELS = {
  'stories':               'Stories',
  'epics':                 'Epics',
  'test-plans':            'Test Plan',
  'verification-scripts':  'Verification Script',
  'dor':                   'Ready Check',
  'plans':                 'Plan',
  'dod':                   'Definition of Done',
  'trace':                 'Trace',
  'coverage':              'Coverage',
  'reference':             'Reference',
  'research':              'Research',
  'review':                'Review',
  'decisions':             'Decisions',
  'spikes':                'Spike'
};

/**
 * Resolve a display label for a document, given its subdirectory and filename.
 * Every one of the 14 recognised subdirectories resolves to a defined,
 * non-generic label -- never falls through to the raw filename.
 * Distinct from getLabel(type) above: getLabel keys off an artefact TYPE
 * identifier (e.g. "dor", "test-plan"), while resolveLabel keys off a
 * filesystem SUBDIRECTORY name (e.g. "dor", "test-plans") -- a different key
 * domain that happens to overlap in some values. Update both tables when a
 * shared concept (e.g. "dor"/"Ready Check") changes in either place.
 * @param {string} subdir    e.g. "stories", "spikes"
 * @param {string} filename  e.g. "cat-s1-core-trace-builder.md"
 * @returns {string}
 */
function resolveLabel(subdir, filename) {
  var key = (subdir || '').toLowerCase();
  if (SUBDIR_LABELS[key]) return SUBDIR_LABELS[key];
  return key
    ? key.replace(/-/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); })
    : 'Artefact';
}

module.exports = { getLabel, resolveLabel };
