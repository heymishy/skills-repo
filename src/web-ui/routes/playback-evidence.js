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
const { getRepoRoot } = require('../adapters/repo-root');
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

// ppc-s2: reads concurrency-lock progress state so the HTML page can render
// an accessible, live-updating indicator for an in-flight capture-all run.
var captureAllLock = require('../modules/capture-all-lock');

// Path traversal guard (OWASP A01 / CLAUDE.md "Path traversal guard for
// disk writes") -- acId is request-controlled (req.params.acId) and flows
// into a disk path (src/utils/capture-screenshots.js builds
// artefacts/<slug>/playback/<story>/screenshots/<acId>.png, written by
// Playwright and read back below via fs.readFileSync) and into the
// GitHub-committed artefactPath. parseDodAcCoverage only ever produces
// AC<n> ids, so anything else is already invalid input -- this allowlist
// is required IN ADDITION TO the resolved-path containment check below,
// not instead of it.
var ACID_RE = /^AC\d+$/;

function _sendJson(res, status, body) {
  if (res.status) { res.status(status).json(body); }
  else { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); }
}

// Matches products.js's own _escapeHtml convention -- this codebase has no
// single shared/exported helper for this, every route file defines its own.
function _escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// AC1/AC3/AC4/AC5 and the AC verification script describe a real browser
// page ("open the new playback-review page", "click 'Set capture
// target'") -- standard content negotiation on the GET route, so existing
// JSON-API callers (every test from Tasks 7-9) are completely unaffected
// (they never set an Accept header).
function _wantsHtml(req) {
  return !!(req.headers && req.headers.accept && req.headers.accept.indexOf('text/html') !== -1);
}

// A real <form method="POST"> always sends this content-type; JSON API
// callers (every existing Task 8/9 test) never set it, so this is a
// zero-regression-risk way to tell the two apart. Assumption: every form
// _renderPlaybackEvidenceHtml renders uses the default
// application/x-www-form-urlencoded encoding (no enctype override). If a
// future AC adds a multipart form (e.g. file upload) to this page, that
// submission would silently fall through to the JSON-response branch below
// -- the exact raw-JSON-in-browser bug this check exists to prevent -- with
// no test to catch it. Revisit this check (or add multipart to it) before
// ever adding such a form.
function _isFormSubmission(req) {
  var ct = (req.headers && req.headers['content-type']) || '';
  return ct.indexOf('application/x-www-form-urlencoded') !== -1;
}

/**
 * Shared path-traversal containment check (CLAUDE.md's path-traversal-guard
 * rule, "in addition to, not instead of" the ACID_RE allowlist) -- used by
 * both handleGetCaptureScreenshot's serve-back and handlePostCaptureTrigger's
 * read-back-after-capture, so a future change to this logic can't silently
 * diverge between the two call sites.
 * @param {string} repoRoot
 * @param {string} relPath
 * @returns {string|null} the resolved absolute path, or null if it escapes repoRoot
 */
function _resolveSafeShotPath(repoRoot, relPath) {
  var resolvedShotPath = path.resolve(repoRoot, relPath);
  var resolvedRepoRoot = path.resolve(repoRoot);
  if (!resolvedShotPath.startsWith(resolvedRepoRoot + path.sep)) return null;
  return resolvedShotPath;
}

function _sendRedirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

function _playbackEvidenceUrl(productId, featureSlug) {
  return '/products/' + encodeURIComponent(productId) + '/playback-evidence/' + encodeURIComponent(featureSlug);
}

/**
 * ppc-s2 (NFR-Accessibility) -- pure function, directly unit-testable
 * against a progress-state fixture with no store/adapter access. "polite"
 * (not "assertive") -- a running capture-all loop is a low-urgency status
 * update, not an interrupting alert.
 * @param {{current:number, total:number}} progress
 * @returns {string}
 */
function _renderCaptureAllProgress(progress) {
  var current = (progress && progress.current) || 0;
  var total = (progress && progress.total) || 0;
  return '<p role="status" aria-live="polite">Capturing AC ' + current + ' of ' + total + '</p>';
}

/**
 * Renders the real browser page the story's own ACs and verification
 * script describe. Plain inline-styled HTML, real <form>/<input>/<button>
 * elements (NFR-Accessibility: keyboard-operable without any client JS),
 * matching client-login.js's own minimal standalone-page
 * convention -- not integrated into the full dashboard shell (_htmlShell),
 * which this walking-skeleton story has no need for.
 */
function _renderPlaybackEvidenceHtml(journey, acs, csrfToken, captureAllProgress) {
  var baseUrl = _playbackEvidenceUrl(journey.productId, journey.featureSlug);
  var progressHtml = captureAllProgress ? _renderCaptureAllProgress(captureAllProgress) : '';
  var captureAllFormHtml = captureAllProgress
    ? ''
    : '<form method="POST" action="' + baseUrl + '/capture-all">' +
        _csrf.csrfField(csrfToken) +
        '<button type="submit">Capture all evidence</button>' +
      '</form>';
  var rows = acs.map(function(ac) {
    var statusHtml = ac.targetSet
      ? '<p>Target: <code>' + _escapeHtml(ac.target.url) + '</code> / <code>' + _escapeHtml(ac.target.selector) + '</code></p>'
      : '<p role="status">Capture target not set</p>';
    var captureFormHtml = ac.targetSet
      ? '<form method="POST" action="' + baseUrl + '/capture/' + encodeURIComponent(ac.acId) + '">' +
          _csrf.csrfField(csrfToken) +
          '<button type="submit">Capture evidence</button>' +
        '</form>'
      : '';
    var screenshotHtml = ac.screenshotPath
      ? '<img src="' + baseUrl + '/screenshots/' + encodeURIComponent(ac.acId) + '" alt="Captured evidence for ' + _escapeHtml(ac.acId) + '" style="max-width:480px;display:block;margin-top:8px">'
      : '';
    return '<li style="margin-bottom:24px;border-bottom:1px solid #ddd;padding-bottom:16px">' +
      '<h2 style="font-size:16px">' + _escapeHtml(ac.acId) + ' — ' + _escapeHtml(ac.description) + '</h2>' +
      statusHtml +
      '<form method="POST" action="' + baseUrl + '/targets/' + encodeURIComponent(ac.acId) + '">' +
        _csrf.csrfField(csrfToken) +
        '<label for="url-' + _escapeHtml(ac.acId) + '">Page URL</label><br>' +
        '<input id="url-' + _escapeHtml(ac.acId) + '" name="url" type="url" required value="' + (ac.target ? _escapeHtml(ac.target.url) : '') + '"><br>' +
        '<label for="selector-' + _escapeHtml(ac.acId) + '">CSS selector</label><br>' +
        '<input id="selector-' + _escapeHtml(ac.acId) + '" name="selector" type="text" required value="' + (ac.target ? _escapeHtml(ac.target.selector) : '') + '"><br>' +
        '<button type="submit">Set capture target</button>' +
      '</form>' +
      captureFormHtml +
      screenshotHtml +
    '</li>';
  }).join('');
  return '<!DOCTYPE html><html><head><title>Playback evidence — ' + _escapeHtml(journey.featureSlug) + '</title></head><body>' +
    '<h1>' + _escapeHtml(journey.featureSlug) + '</h1>' +
    progressHtml +
    captureAllFormHtml +
    '<ul style="list-style:none;padding:0">' + rows + '</ul>' +
  '</body></html>';
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

  if (_wantsHtml(req)) {
    var csrfToken = await _csrf.generateCsrfToken(req);
    var progress = captureAllLock.getLockState(journey.journeyId);
    var html = _renderPlaybackEvidenceHtml(journey, acs, csrfToken, progress);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  _sendJson(res, 200, { featureSlug: journey.featureSlug, acs: acs });
}

/**
 * AC5 -- tenant-scoped screenshot serving. Deliberately NOT a reuse of the
 * existing /playback-media/ route (confirmed to have no tenant check at
 * all, same class of gap as getJourneyByFeatureSlug). Reads from local
 * disk, same as handlePostCaptureTrigger's own read-back immediately after
 * capture -- this story's own already-established pattern, not a new one.
 */
async function handleGetCaptureScreenshot(req, res) {
  var journey = await _resolveJourney(req);
  if (!journey) { _notFound(res); return; }

  var acId = req.params && req.params.acId;
  if (!ACID_RE.test(acId || '')) { _notFound(res); return; }

  var screenshots = journey.captureScreenshots || {};
  var shotPath = screenshots[acId];
  if (!shotPath) { _notFound(res); return; }

  var repoRoot = getRepoRoot(req);
  var resolvedShotPath = _resolveSafeShotPath(repoRoot, shotPath);
  if (!resolvedShotPath) { _notFound(res); return; }
  if (!fs.existsSync(resolvedShotPath)) { _notFound(res); return; }

  var imageBuffer = fs.readFileSync(resolvedShotPath);
  res.writeHead(200, { 'Content-Type': 'image/png' });
  res.end(imageBuffer);
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
  if (!ACID_RE.test(acId)) {
    _sendJson(res, 400, { error: 'invalid acId' });
    return;
  }

  _journeyStore.setCaptureTarget(journey.journeyId, acId, url, selector);

  if (_isFormSubmission(req)) {
    _sendRedirect(res, _playbackEvidenceUrl(journey.productId, journey.featureSlug));
    return;
  }
  _sendJson(res, 200, { ok: true });
}

/**
 * ppc-s1: scoped to BOTH tenantId AND productId -- deliberately NOT
 * ownerRepoForFeature(slug, credential) (export-data-source.js), which
 * resolves by feature_slug alone (decisions.md 2026-10-21 ARCHITECTURE).
 * A query failure or missing pool is treated as "no connected repo" (null),
 * matching this codebase's own optional-Postgres-feature convention
 * (journey.js's equivalent _dasOwnerRepo resolution).
 */
async function _resolveOwnerRepo(journey, pool) {
  if (!pool) return null;
  try {
    var result = await pool.query(
      'SELECT repo_owner, repo_name FROM products WHERE product_id = $1 AND tenant_id = $2',
      [journey.productId, journey.tenantId]
    );
    var row = result.rows[0];
    if (!row || !row.repo_owner || !row.repo_name) return null;
    return { owner: row.repo_owner, repo: row.repo_name };
  } catch (_) {
    return null;
  }
}

/**
 * ppc-s2: single-AC capture mechanics, extracted from handlePostCaptureTrigger
 * so handlePostCaptureAll (ppc-s2) can reuse the identical mechanism per AC
 * in a loop, instead of a second, parallel capture path (DoR constraint).
 * Takes an already-authenticated `page` (acquired once by the caller) rather
 * than acquiring its own -- handlePostCaptureAll acquires one authenticated
 * page for an entire capture-all run, not once per AC.
 * @param {object} journey
 * @param {string} acId
 * @param {{url:string, selector:string}} target
 * @param {{owner:string, repo:string}} ownerRepo
 * @param {object} req
 * @param {object} page
 * @returns {Promise<string>} the committed screenshot's repo-relative path
 */
async function _captureOneAc(journey, acId, target, ownerRepo, req, page) {
  await page.goto(target.url);
  var shots = await captureAcScreenshots({
    page: page,
    featureSlug: journey.featureSlug,
    storySlug: 'ppc-s1',
    acList: [{ acId: acId, selector: target.selector }]
  });
  var shot = shots[0];

  var repoRoot = getRepoRoot(req);
  // Defense in depth, in addition to (not instead of) the ACID_RE allowlist
  // at each call site -- CLAUDE.md's path traversal guard rule requires both.
  // Never log the raw resolved path on failure.
  var resolvedShotPath = _resolveSafeShotPath(repoRoot, shot.path);
  if (!resolvedShotPath) {
    var invalidPathErr = new Error('invalid capture path');
    invalidPathErr.invalidPath = true;
    throw invalidPathErr;
  }
  var content = fs.readFileSync(resolvedShotPath);

  await commitArtefact(shot.path, content.toString('base64'), req.session.accessToken, ownerRepo.owner, ownerRepo.repo, 'base64');

  var screenshots = journey.captureScreenshots || {};
  screenshots[acId] = shot.path;
  _journeyStore.setJourneyFields(journey.journeyId, { captureScreenshots: screenshots });

  return shot.path;
}

/**
 * AC3 -- session-reuse capture (ADR-018: real session only, never a service
 * credential or the NODE_ENV=test bypass).
 */
async function handlePostCaptureTrigger(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var journey = await _resolveJourney(req);
  if (!journey) { _notFound(res); return; }

  var acId = req.params && req.params.acId;
  if (!ACID_RE.test(acId || '')) {
    _sendJson(res, 400, { error: 'invalid acId' });
    return;
  }
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

  // Matches billing.js's own host-derivation convention -- never a
  // hardcoded/env-configured base URL, which would silently scope the
  // seeded auth cookie to the wrong domain outside local dev.
  var baseUrl = (req.headers && req.headers.host) ? 'https://' + req.headers.host : 'https://localhost';
  var authed = await getAuthenticatedPage(req.sessionId, baseUrl);
  try {
    var shotPath = await _captureOneAc(journey, acId, target, ownerRepo, req, authed.page);
    if (_isFormSubmission(req)) {
      _sendRedirect(res, _playbackEvidenceUrl(journey.productId, journey.featureSlug));
      return;
    }
    _sendJson(res, 200, { ok: true, screenshotPath: shotPath });
  } catch (captureErr) {
    if (captureErr && captureErr.invalidPath) {
      _sendJson(res, 400, { error: 'invalid capture path' });
      return;
    }
    // Matches journey.js's handlePostGateConfirm precedent for this exact
    // operation (committing an artefact to GitHub, acdg-s1/acdg-s2): an
    // uncaught failure here is otherwise invisible -- a bare 500 with no
    // actionable message, surfaced only by server.js's generic top-level
    // handler. Structured JSON instead, via this file's own _sendJson.
    _sendJson(res, 502, {
      error: 'capture-failed',
      message: 'Could not complete the capture (navigation, screenshot, or commit to the connected repository failed). Nothing was marked captured -- fix the underlying issue (re-authenticate, check repo access, or wait for a rate limit to clear) and try again.',
      detail: captureErr && captureErr.message
    });
  } finally {
    if (authed.browser && authed.browser.close) { await authed.browser.close(); }
  }
}

module.exports = {
  handleGetPlaybackEvidence,
  handlePostCaptureTarget,
  handlePostCaptureTrigger,
  handleGetCaptureScreenshot,
  setJourneyStoreModule,
  _resolveJourney,
  _notFound,
  _sendJson,
  _captureOneAc,
  _renderCaptureAllProgress
};
