'use strict';

/**
 * incident-detection-registry.js (itar-s4)
 *
 * Existence lookup only: does a callable re-check exist for an incident's
 * original trigger. Initiative 2 (alert detection) has not shipped, so the
 * built-in registry is empty and every incident takes the manual branch.
 * This story builds no detection logic. A registry is a plain object mapping
 * trigger text to a function (incidentRecord) => boolean (true = problem gone).
 */

const DEFAULT_REGISTRY = {};

function getCheckForTrigger(trigger, registry) {
  const reg = registry || DEFAULT_REGISTRY;
  const fn = Object.prototype.hasOwnProperty.call(reg, trigger) ? reg[trigger] : null;
  return typeof fn === 'function' ? fn : null;
}

module.exports = { getCheckForTrigger, DEFAULT_REGISTRY };
