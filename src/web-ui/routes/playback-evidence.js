'use strict';
// playback-evidence.js — ppc-s1. Tenant-scoped surface for self-service DoD
// evidence capture. Deliberately does NOT reuse /playback's or
// GET /features/:slug's data path (journey-store.js's getJourneyByFeatureSlug
// has no tenant filtering -- confirmed cross-tenant leak risk, decisions.md
// 2026-10-21 ARCHITECTURE entry). Every read here goes through
// journey-store.js's getJourneyByTenantProductSlug, scoped by BOTH
// tenant_id and product_id (AC1, AC6, AC7).

const { parseDodAcCoverage } = require('../../utils/dod-parsing');

// Matches journey.js's/features.js's own setJourneyStoreModule DI
// convention -- tests inject a fresh/mock store explicitly via
// setJourneyStoreModule(), rather than busting journey-store's own
// require.cache entry (journey-store.js already exports _clearForTesting()
// for in-place reset of the one required instance).
var _journeyStore = require('../modules/journey-store');
function setJourneyStoreModule(mod) { _journeyStore = mod; }

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
  var journey = _journeyStore.getJourneyByTenantProductSlug(tenantId, productId, featureSlug);
  if (!journey || !_journeyStore.isDodComplete(journey)) return null;
  return journey;
}

async function _getDodAcList(journey) {
  var artefacts = await _journeyStore.getArtefactsForJourney(journey.journeyId);
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

  var acRows = await _getDodAcList(journey);
  var captureTargets = journey.captureTargets || [];
  var screenshots = journey.captureScreenshots || {};

  var acs = acRows.map(function(ac) {
    var targetState = _journeyStore.getCaptureTargetState(captureTargets, ac.acId);
    var targetSet = targetState !== _journeyStore.CAPTURE_TARGET_NOT_SET;
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
  setJourneyStoreModule,
  _resolveJourney,
  _notFound,
  _sendJson
};
