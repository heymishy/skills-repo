'use strict';
// playback-evidence.js — ppc-s1. Tenant-scoped surface for self-service DoD
// evidence capture. Deliberately does NOT reuse /playback's or
// GET /features/:slug's data path (journey-store.js's getJourneyByFeatureSlug
// has no tenant filtering -- confirmed cross-tenant leak risk, decisions.md
// 2026-10-21 ARCHITECTURE entry). Every read here goes through
// journey-store.js's getJourneyByTenantProductSlug, scoped by BOTH
// tenant_id and product_id (AC1, AC6, AC7).

const { parseDodAcCoverage } = require('../../utils/dod-parsing');

// Lazy require (not a module-level const) -- deliberate. Tests bust
// journey-store's require.cache entry per-run (see
// tests/check-ppc-s1-playback-evidence-route.js's getStore() helper) to get
// an isolated in-memory store per test. A module-level `const journeyStore =
// require(...)` binds to whichever instance existed at THIS file's first
// load and never sees a later cache-bust, since require() only re-executes
// a module when its own cache entry is missing -- it does not re-resolve an
// already-captured reference. Calling require() fresh on every handler
// invocation always reads whatever is in the cache right now.
function _store() { return require('../modules/journey-store'); }

function _sendJson(res, status, body) {
  if (res.status) { res.status(status).json(body); }
  else { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); }
}

function _notFound(res) {
  // AC7: 403/not-found with no partial content and no metadata revealing
  // the other tenant's feature exists -- 404 + a constant body, never the
  // real reason (slug mismatch vs tenant mismatch vs not-DoD-complete all
  // look identical from outside).
  _sendJson(res, 404, { error: 'not found' });
}

async function _resolveJourney(req) {
  var tenantId = req.session && req.session.tenantId;
  var productId = req.params && req.params.productId;
  var featureSlug = req.params && req.params.featureSlug;
  if (!tenantId || !productId || !featureSlug) return null;
  var journeyStore = _store();
  var journey = journeyStore.getJourneyByTenantProductSlug(tenantId, productId, featureSlug);
  if (!journey || !journeyStore.isDodComplete(journey)) return null;
  return journey;
}

async function _getDodAcList(journey) {
  var journeyStore = _store();
  var artefacts = await journeyStore.getArtefactsForJourney(journey.journeyId);
  var dodRow = (artefacts || []).find(function(a) { return a.skill_name === 'definition-of-done'; });
  if (!dodRow) return [];
  return parseDodAcCoverage(dodRow.content);
}

/**
 * AC1 (list, tenant+product scoped), AC4 ("not set" state), AC5 (inline screenshot).
 */
async function handleGetPlaybackEvidence(req, res) {
  var journey = await _resolveJourney(req);
  if (!journey) { _notFound(res); return; }

  var journeyStore = _store();
  var acRows = await _getDodAcList(journey);
  var captureTargets = journey.captureTargets || [];
  var screenshots = journey.captureScreenshots || {};

  var acs = acRows.map(function(ac) {
    var targetState = journeyStore.getCaptureTargetState(captureTargets, ac.acId);
    var targetSet = targetState !== journeyStore.CAPTURE_TARGET_NOT_SET;
    return {
      acId: ac.acId,
      description: ac.description,
      targetSet: targetSet,
      target: targetSet ? targetState : null,
      screenshotPath: screenshots[ac.acId] || null
    };
  });

  _sendJson(res, 200, { featureSlug: journey.featureSlug, acs: acs });
}

module.exports = {
  handleGetPlaybackEvidence,
  _resolveJourney,
  _notFound,
  _sendJson
};
