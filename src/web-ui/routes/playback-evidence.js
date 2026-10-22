'use strict';
// playback-evidence.js — ppc-s1. Tenant-scoped surface for self-service DoD
// evidence capture. Deliberately does NOT reuse /playback's or
// GET /features/:slug's data path (journey-store.js's getJourneyByFeatureSlug
// has no tenant filtering -- confirmed cross-tenant leak risk, decisions.md
// 2026-10-21 ARCHITECTURE entry). Every read here goes through
// journey-store.js's getJourneyByTenantProductSlug, scoped by BOTH
// tenant_id and product_id (AC1, AC6, AC7).

const { parseDodAcCoverage } = require('../../utils/dod-parsing');
const { getAuthenticatedPage } = require('../adapters/session-page-adapter');
const { captureAcScreenshots } = require('../../utils/capture-screenshots');
const { commitArtefact } = require('../adapters/artefact-commit-writer');
const path = require('path');
const fs = require('fs');
var _csrf = require('../middleware/csrf');

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

/**
 * AC2 — one-time manual target entry per AC.
 */
async function handlePostCaptureTarget(req, res) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var journey = await _resolveJourney(req);
  if (!journey) { _notFound(res); return; }

  var acId = req.params && req.params.acId;
  var body = req.body || {};
  var url = body.url;
  var selector = body.selector;
  if (!acId || !url || !selector) {
    _sendJson(res, 400, { error: 'acId, url, and selector are required' });
    return;
  }

  _journeyStore.setCaptureTarget(journey.journeyId, acId, url, selector);
  _sendJson(res, 200, { ok: true });
}

/**
 * Resolve the GitHub owner/repo for this journey's own product, scoped to
 * BOTH tenantId AND productId (same cross-tenant-leak concern as
 * _resolveJourney above). Deliberately does NOT reuse
 * ownerRepoForFeature(slug, credential) from
 * ../adapters/export-data-source.js -- that helper resolves by
 * feature_slug ALONE (no tenant filter), which has the exact cross-tenant
 * collision risk this story exists to eliminate. See decisions.md
 * 2026-10-21 ARCHITECTURE entry.
 */
async function _resolveOwnerRepo(journey, pool) {
  if (!pool) return null;
  var result = await pool.query(
    'SELECT repo_owner, repo_name FROM products WHERE product_id = $1 AND tenant_id = $2',
    [journey.productId, journey.tenantId]
  );
  var row = result.rows[0];
  if (!row || !row.repo_owner || !row.repo_name) return null;
  return { owner: row.repo_owner, repo: row.repo_name };
}

/**
 * AC3 — session-reuse capture: seeds the Playwright context cookie with the
 * requesting user's own req.sessionId (never a service credential or the
 * NODE_ENV=test auth-bypass fixture, per ADR-018), navigates to the stored
 * target, captures the screenshot, and commits it via the user's own
 * accessToken (never a service account).
 */
async function handlePostCaptureTrigger(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var journey = await _resolveJourney(req);
  if (!journey) { _notFound(res); return; }

  var acId = req.params && req.params.acId;
  var captureTargets = journey.captureTargets || [];
  var target = _journeyStore.getCaptureTargetState(captureTargets, acId);
  if (target === _journeyStore.CAPTURE_TARGET_NOT_SET) {
    _sendJson(res, 400, { error: 'no capture target set for this AC' });
    return;
  }

  var ownerRepo = await _resolveOwnerRepo(journey, pool);
  if (!ownerRepo) {
    _sendJson(res, 400, { error: 'product has no connected repo' });
    return;
  }

  var baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
  var authed = await getAuthenticatedPage(req.sessionId, baseUrl);
  try {
    await authed.page.goto(target.url);
    var shots = await captureAcScreenshots({
      page: authed.page,
      featureSlug: journey.featureSlug,
      storySlug: 'ppc-s1',
      acList: [{ acId: acId, selector: target.selector }]
    });
    var shot = shots[0];

    var repoRoot = req._repoRootOverride || path.resolve(__dirname, '../../..');
    var absShotPath = path.join(repoRoot, shot.path);
    var content = fs.readFileSync(absShotPath);

    await commitArtefact(shot.path, content.toString('base64'), req.session.accessToken, ownerRepo.owner, ownerRepo.repo, 'base64');

    var screenshots = journey.captureScreenshots || {};
    screenshots[acId] = shot.path;
    _journeyStore.setJourneyFields(journey.journeyId, { captureScreenshots: screenshots });

    _sendJson(res, 200, { ok: true, screenshotPath: shot.path });
  } finally {
    if (authed.browser && authed.browser.close) { await authed.browser.close(); }
  }
}

module.exports = {
  handleGetPlaybackEvidence,
  handlePostCaptureTarget,
  handlePostCaptureTrigger,
  setJourneyStoreModule,
  _resolveJourney,
  _notFound,
  _sendJson
};
