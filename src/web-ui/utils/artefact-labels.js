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
 * @param {string} filename  e.g. "cat-s1-core-trace-builder.md" -- currently
 *   unused by this function's own logic (every subdir resolves to one fixed
 *   label regardless of filename); kept in the signature for symmetry with
 *   resolveColumnKey(subdir, filename), which DOES need it (dor/ disambiguates
 *   dor-contract.md from plain dor.md), and so a future subdir needing
 *   filename-level disambiguation for its label doesn't require a breaking
 *   signature change at every call site.
 * @returns {string}
 */
function resolveLabel(subdir, filename) {
  var key = (subdir || '').toLowerCase();
  if (SUBDIR_LABELS[key]) return SUBDIR_LABELS[key];
  return key
    ? key.replace(/-/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); })
    : 'Artefact';
}

/**
 * Return whether a subdirectory name is one of the 14 recognised artefact
 * subdirectories in SUBDIR_LABELS. Cat-s2 Task 4: added as an intention-
 * revealing membership check rather than re-exporting the raw SUBDIR_LABELS
 * map (kept private -- see the comment above it) -- callers that need to know
 * "is this a known subdir before I trust a fallback label" now go through
 * this function instead of reading the table's shape directly.
 * @param {string} subdir  e.g. "stories", "dor"
 * @returns {boolean}
 */
function isKnownSubdir(subdir) {
  var key = (subdir || '').toLowerCase();
  return Object.prototype.hasOwnProperty.call(SUBDIR_LABELS, key);
}

/**
 * Return the list of all 14 recognised subdirectory names (no label values).
 * Cat-s2 Task 4: added so a consumer that needs the *set* of known
 * subdirectory names (e.g. artefact-fetcher.js's ARTEFACT_SUBDIRS, which
 * filters this down to its own historical 11-name scope) can derive it from
 * the single canonical source without re-exporting the raw SUBDIR_LABELS map
 * itself -- narrower than exposing the map's label values, consistent with
 * isKnownSubdir() above.
 * @returns {string[]}
 */
function listKnownSubdirs() {
  return Object.keys(SUBDIR_LABELS);
}

/**
 * Resolve a matrix/table column key for a document, given its subdirectory
 * and filename. Only the dor/ case is delegated to features.js's
 * disambiguation logic; every other subdirectory returns its own lowercased
 * name as the key. For dor/, delegates to features.js's own
 * _deriveMatrixColumn (already shipped by fadm-s1) to disambiguate
 * dor-contract.md from plain dor.md -- this logic is reused, never
 * reimplemented (AC2's explicit requirement; ADR-028).
 *
 * NOTE on the require() placement: features.js already does a top-level
 * `require('../utils/artefact-labels')` for getLabel (used at lines 394 and
 * 514 there). A top-level `require('../routes/features')` here would create
 * a genuine require cycle -- whichever of the two files finishes loading
 * second would receive an incomplete module.exports ({}) from the other,
 * since neither file assigns module.exports until after its top-of-file
 * requires run. That would silently break getLabel() in features.js (if
 * artefact-labels.js loads first) or _deriveMatrixColumn here (if
 * features.js loads first), depending purely on load order. Requiring
 * features.js lazily, inside the function body, sidesteps this: by the time
 * resolveColumnKey() is actually invoked at runtime, both modules have
 * already finished their initial load, so the require() call just returns
 * the fully-populated module from cache.
 * @param {string} subdir
 * @param {string} filename
 * @returns {string}
 */
function resolveColumnKey(subdir, filename) {
  var key = (subdir || '').toLowerCase();
  if (key === 'dor') {
    var _deriveMatrixColumn = require('../routes/features')._deriveMatrixColumn;
    return _deriveMatrixColumn(subdir + '/' + filename);
  }
  return key || 'artefact';
}

module.exports = { getLabel, resolveLabel, resolveColumnKey, isKnownSubdir, listKnownSubdirs };
