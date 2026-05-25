// gate-map.js — frozen registry of gated pipeline stages to gate names.
// Used by gate-advance to resolve which validate gate to run for a given stage.
'use strict';

module.exports = Object.freeze({
  'discovery-approved':    { gate: 'discovery-approved' },
  'benefit-metric-active': { gate: 'benefit-metric-active' },
  'definition-complete':   { gate: 'definition-complete' },
  'test-plan-complete':    { gate: 'test-plan-complete' },
  'dor-signed-off':        { gate: 'dor-signed-off' },
  'branch-complete':       { gate: 'branch-complete' },
  'definition-of-done':    { gate: 'definition-of-done' },
});
