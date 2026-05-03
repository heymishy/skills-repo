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

module.exports = { getLabel };
