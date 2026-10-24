'use strict';

// internal-sync.js — css-s1: new internal, machine-to-machine web-UI
// endpoint used by the CLI's own gate-advance command to resolve/update a
// journey by pipeline-state.json feature slug. Never a public-facing or
// per-user-authenticated route (ADR-020 does not apply to this direction --
// see decisions.md 2026-08-07 ARCH entry) -- gated by a single shared
// service-level credential only, mirroring auth-stub.js's own constant-time
// secret-header check.

var crypto = require('crypto');
var _journeyStore = require('../modules/journey-store');
var exportDataSource = require('../adapters/export-data-source');

/**
 * Constant-time compare, same shape as auth-stub.js's own _secretMatches --
 * but NOT an exact mirror: this file has no separate "stub enabled" gate
 * (auth-stub.js checks _stubEnabled() before ever reaching this function),
 * so the `!expected` guard below is load-bearing here, not cosmetic. Without
 * it, an unset INTERNAL_SYNC_SECRET and a missing request header both
 * produce empty buffers, the length check would pass, and
 * timingSafeEqual('', '') returns true -- silently authorizing every
 * request to a misconfigured endpoint.
 */
function _secretMatches(candidate) {
  var expected = process.env.INTERNAL_SYNC_SECRET || '';
  var candidateBuf = Buffer.from(String(candidate || ''));
  var expectedBuf = Buffer.from(expected);
  if (!expected || candidateBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(candidateBuf, expectedBuf);
}

/** Mirrors sign-off.js's own _readBody. */
function _readBody(req) {
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise(function(resolve) {
    var raw = '';
    req.on('data', function(chunk) { raw += chunk; });
    req.on('end', function() {
      try { resolve(JSON.parse(raw)); } catch (_) { resolve(null); }
    });
    req.on('error', function() { resolve(null); });
  });
}

function _rejectUnauthorised(res) {
  res.writeHead(403, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Forbidden' }));
}

/**
 * POST /internal/journey-sync/resolve — css-s1 AC1/AC2/AC3/AC5.
 * Body: { featureSlug }
 * Response: { found: false } | { found: true, journey: { journeyId, featureSlug, repoOwner, repoName } }
 */
async function handleJourneySyncResolve(req, res) {
  var supplied = req.headers && req.headers['x-internal-sync-secret'];
  if (!_secretMatches(supplied)) { _rejectUnauthorised(res); return; }

  var body = await _readBody(req);
  var featureSlug = body && body.featureSlug;
  if (!featureSlug) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'featureSlug is required' }));
    return;
  }

  var journey = _journeyStore.getJourneyByFeatureSlug(featureSlug);
  if (!journey) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ found: false }));
    return;
  }

  var repoOwner = null;
  var repoName = null;
  if (journey.productId && journey.tenantId) {
    var pool = exportDataSource.getDbPool();
    if (pool) {
      var result = await pool.query(
        'SELECT repo_owner, repo_name FROM products WHERE product_id = $1 AND tenant_id = $2',
        [journey.productId, journey.tenantId]
      );
      var row = result.rows[0];
      if (row) { repoOwner = row.repo_owner; repoName = row.repo_name; }
    }
  }

  // css-s4: the journey's own highest-known STAGE_SEQUENCE stage, included
  // so the caller can perform real conflict detection on css-s1's own sync
  // direction (consumed by a later task -- not implemented here).
  var currentStage = _journeyStore.getLatestKnownStage(journey);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    found: true,
    journey: {
      journeyId: journey.journeyId,
      featureSlug: journey.featureSlug,
      repoOwner: repoOwner,
      repoName: repoName,
      currentStage: currentStage
    }
  }));
}

/**
 * POST /internal/journey-sync/update — css-s1 AC1/AC5.
 * Body: { journeyId, featureSlug, stage }
 * Response: { updated: true } | { updated: false, reason: string }
 */
async function handleJourneySyncUpdate(req, res) {
  var supplied = req.headers && req.headers['x-internal-sync-secret'];
  if (!_secretMatches(supplied)) { _rejectUnauthorised(res); return; }

  var body = await _readBody(req);
  var journeyId = body && body.journeyId;
  var featureSlug = body && body.featureSlug;
  var stage = body && body.stage;
  if (!journeyId || !featureSlug || !stage) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'journeyId, featureSlug and stage are required' }));
    return;
  }

  var journey = _journeyStore.getJourney(journeyId);
  if (!journey || journey.featureSlug !== featureSlug) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ updated: false, reason: 'not-found' }));
    return;
  }

  var alreadyComplete = (journey.completedStages || []).some(function(cs) { return cs.skillName === stage; });
  if (!alreadyComplete) {
    _journeyStore.completeStage(journey.journeyId, stage, null);
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ updated: true }));
}

module.exports = {
  handleJourneySyncResolve: handleJourneySyncResolve,
  handleJourneySyncUpdate: handleJourneySyncUpdate
};
