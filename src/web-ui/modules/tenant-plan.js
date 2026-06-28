'use strict';
var fs   = require('fs');
var path = require('path');

// Injectable cap reader — lets tests control cap without touching env vars or disk.
// When null, the module reads MAX_JOURNEYS_PER_TENANT and tenant-caps.json directly.
var _capReader = null;
function setCapReader(fn) { _capReader = fn; }

/**
 * Resolve the journey cap for a given tenantId.
 * Priority: injected capReader > per-tenant tenant-caps.json entry > MAX_JOURNEYS_PER_TENANT env var.
 * Returns null (unlimited) when no cap is configured.
 * @param {string} tenantId
 * @param {string} [repoRoot]
 * @returns {number|null}
 */
function getJourneyCap(tenantId, repoRoot) {
  if (_capReader) return _capReader(tenantId);

  // Per-tenant override file
  if (repoRoot) {
    try {
      var capFile = path.join(repoRoot, 'tenant-caps.json');
      var caps = JSON.parse(fs.readFileSync(capFile, 'utf8'));
      if (caps[tenantId] != null) return Number(caps[tenantId]);
    } catch (_) {}
  }

  // Global env var
  var globalCap = parseInt(process.env.MAX_JOURNEYS_PER_TENANT, 10);
  if (!isNaN(globalCap) && globalCap >= 0) return globalCap;

  return null; // unlimited
}

/**
 * Check whether a tenant is allowed to create another journey.
 * @param {string} tenantId
 * @param {number} currentCount — number of journeys the tenant already owns
 * @param {string} [repoRoot]
 * @returns {{ allowed: boolean, cap: number|null, count: number }}
 */
function checkJourneyCap(tenantId, currentCount, repoRoot) {
  var cap = getJourneyCap(tenantId, repoRoot);
  if (cap === null) return { allowed: true,              cap: null, count: currentCount };
  return            { allowed: currentCount < cap,       cap: cap,  count: currentCount };
}

module.exports = { checkJourneyCap, setCapReader };
