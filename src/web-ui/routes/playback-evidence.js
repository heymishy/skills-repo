'use strict';
// playback-evidence.js — ppc-s1. Tenant-scoped surface for self-service DoD
// evidence capture. Deliberately does NOT reuse /playback's or
// GET /features/:slug's data path (journey-store.js's getJourneyByFeatureSlug
// has no tenant filtering -- confirmed cross-tenant leak risk, decisions.md
// 2026-10-21 ARCHITECTURE entry). Every read here goes through
// journey-store.js's getJourneyByTenantProductSlug, scoped by BOTH
// tenant_id and product_id (AC1, AC6, AC7).

const { parseDodAcCoverage, parseBenefitMetricTargets } = require('../../utils/dod-parsing');
// ppc-s9 (Task 6): re-wired into handleGetPlaybackEvidence's own finalise
// step below (_finaliseInProgressCaptures), fed from a downloaded artifact
// buffer instead of a local fs.readFileSync -- same call shape Task 5's own
// commit left here unused for.
const { commitArtefact } = require('../adapters/artefact-commit-writer');
const { getRepoRoot } = require('../adapters/repo-root');
const { ensureRepoFresh } = require('../adapters/repo-freshness');
const { renderShellWithNav } = require('./products');
const { extractMarkdownSection, renderCoverageSummaryHtml, computeAcCoverageSummary } = require('./playback');
const { ArtefactNotFoundError } = require('../adapters/artefact-fetcher');
const { deriveCaptureTargetFromSpec } = require('../../utils/capture-target-derivation');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ppc-s9 (Task 5): dispatch-based capture replaces the old in-process
// getAuthenticatedPage + captureAcScreenshots/captureVideoRecording path --
// the actual Playwright work now runs in a GitHub Actions capture-worker
// (Task 4's own script), triggered via dispatchCaptureWorkflow below. The
// real req.sessionId is never put directly into the workflow_dispatch
// input -- issueNonce() exchanges it for a short-lived, single-use nonce
// first (capture-nonce-store.js).
const { issueNonce } = require('../adapters/capture-nonce-store');
const {
  dispatchCaptureWorkflow,
  checkCaptureArtifact,
  downloadCaptureArtifact
} = require('../adapters/capture-dispatch-adapter');

// ppc-s9 (Task 6): named constant, not a magic number inline -- how long
// handleGetPlaybackEvidence keeps rendering the "capture in progress"
// fragment for a dispatched-but-not-yet-found artifact before giving up and
// recording a captureAllFailed timeout entry instead.
var CAPTURE_WAIT_WINDOW_MS = 5 * 60 * 1000;

// ppc-s4: injectable, matching routes/artefact.js's own setFetcher
// convention -- tests inject a fake fetcher rather than mocking global
// fetch through the real fetchArtefact/GitHub-Contents-API call chain.
var _fetchArtefact = require('../adapters/artefact-fetcher').fetchArtefact;
function setFetcherModule(fn) { _fetchArtefact = fn; }

// ppc-s4: css-parity fallback. _resolveJourney's fast path requires a
// Postgres journeys row whose completedStages already has a
// 'definition-of-done' entry -- a signal only ever created by a real web
// chat walkthrough. A feature delivered entirely via the CLI pipeline (its
// own dodStatus: "complete" on every story in the connected repo's
// GitHub-synced .github/pipeline-state.json) has no such row and 404s.
// Reuses the same pipelineStateFetchAdapter / product-rollup.js
// fetchPipelineState the css epic and product-rollup sync already use --
// no new adapter pair, per CLAUDE.md's D37 rule.
var _productRollup = require('../modules/product-rollup');
var _pipelineStateFetchAdapter = require('../adapters/pipeline-state-fetch-adapter');
var _csrf = require('../middleware/csrf');
var { createRateLimiter } = require('../middleware/rate-limiter');

// ppc-s3 (AC2): per-user, not per-tenant. The shared default buildRateLimitKey
// (rate-limiter.js) keys on req.session.tenantId, which would let one Product
// Owner's usage block every other PO in the same tenant -- see this plan's own
// "Planning note" above. req.session.userId is the real per-person identity
// field already used elsewhere (require-admin.js, artefact.js, auth.js).
// Falls back to IP, mirroring buildRateLimitKey's own fallback precedent --
// never an unconditional 'unknown' that would 401 a real logged-in user whose
// session happens to lack userId for some other reason.
function _buildCaptureRateLimitKey(req) {
  var userId = req.session && req.session.userId;
  if (userId != null && userId !== '') return String(userId);
  return req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
}

// ppc-s3 (NFR-Accessibility): role="alert" markup, not a visual-only toast --
// matches this file's own _escapeHtml-free minimal-page convention (no user
// content is interpolated here, so no escaping is needed).
function _renderCaptureRateLimitedHtml() {
  return '<!DOCTYPE html><html><body><p role="alert">Too many capture requests -- please wait a minute before trying again.</p></body></html>';
}

// ppc-s3 (AC1): one capture action per user per 60s window (AC1's own
// "another capture action (same or different feature)" wording). This is a
// single module-level instance, not one per handler, by design: it is meant
// to be shared by every capture-triggering handler in this file so a user's
// attempts across different entry points draw from the same bucket. Wired
// into handlePostCaptureTrigger below as of this commit; a later task in
// this story wires the same instance into handlePostCaptureAll. A strict
// 1-per-window cap (not sign-off.js's 10/min shape): capture is an expensive
// synchronous Playwright run, and this story's purpose is specifically to
// block double-clicks/buggy retries, not general throttling.
var _captureRateLimiter = createRateLimiter({
  maxRequests: 1,
  windowMs: 60 * 1000,
  keyFn: _buildCaptureRateLimitKey,
  onLimited: function(req, res) {
    if (_isFormSubmission(req)) {
      res.writeHead(429, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(_renderCaptureRateLimitedHtml());
      return;
    }
    _sendJson(res, 429, { error: 'rate limit exceeded -- wait a minute before triggering another capture' });
  }
});
// ppc-s9 (Task 5): measureCaptureDuration/checkTimingThreshold and
// decisions-log-writer's appendScopeNote were ppc-s2's own synchronous
// "how long did the in-process Playwright run take" measurement -- with
// capture now dispatched asynchronously, there is no synchronous duration
// left for THIS handler to measure (see handlePostCaptureAll's own comment
// at its response below). Only buildCaptureAllList (grouping which ACs have
// a target) is still needed here.
var captureAllModule = require('../../utils/capture-all');
var { buildCaptureAllList } = captureAllModule;

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
    // actr-s2 (AC1, AC6): an auto-resolved target gets its own distinct
    // label + an Override link (query-param driven, no client JS -- matches
    // this page's own established no-JS convention) instead of the generic
    // "Target: ..." line a manually-set target still uses unchanged.
    var statusHtml;
    if (ac.isAutoResolved) {
      statusHtml = '<p>Auto-detected from <code>' + _escapeHtml(ac.autoResolvedSpecFile) + '</code>: <code>' + _escapeHtml(ac.target.url) + '</code> / <code>' + _escapeHtml(ac.target.selector) + '</code> ' +
        '— <a href="' + baseUrl + '?override=' + encodeURIComponent(ac.acId) + '">Override</a></p>';
    } else if (ac.targetSet) {
      statusHtml = '<p>Target: <code>' + _escapeHtml(ac.target.url) + '</code> / <code>' + _escapeHtml(ac.target.selector) + '</code></p>';
    } else {
      statusHtml = '<p role="status">Capture target not set</p>';
    }
    // ppc-s9 (Task 6): re-triggering a capture that's already dispatched and
    // awaiting its artifact doesn't make sense -- suppress the normal
    // capture form while ac.captureInProgress is true, same as the
    // targetSet-false branch above.
    var captureFormHtml = (ac.targetSet && !ac.captureInProgress)
      ? '<form method="POST" action="' + baseUrl + '/capture/' + encodeURIComponent(ac.acId) + '">' +
          _csrf.csrfField(csrfToken) +
          '<button type="submit">Capture evidence</button>' +
        '</form>'
      : '';
    // ppc-s9 (Task 6, AC4): plain-text-only status fragment -- no
    // spinner/client-JS/websocket, matching this file's own failureHtml/
    // statusHtml convention immediately above and below.
    var inProgressHtml = ac.captureInProgress
      ? '<p role="status">Capture in progress...</p>'
      : '';
    var screenshotHtml = ac.screenshotPath
      ? '<img src="' + baseUrl + '/screenshots/' + encodeURIComponent(ac.acId) + '" alt="Captured evidence for ' + _escapeHtml(ac.acId) + '" style="max-width:480px;display:block;margin-top:8px">'
      : '';
    var alsoCoversHtml = (ac.coCoveredAcIds && ac.coCoveredAcIds.length > 0)
      ? '<p>This video also covers: ' + ac.coCoveredAcIds.map(_escapeHtml).join(', ') + '</p>'
      : '';
    var videoHtml = ac.videoPath
      // ppc-s5 (Task 8 E2E finding, AC7): the width/height attributes below
      // still establish the intrinsic aspect ratio (needed for AC7's
      // layout-shift-on-metadata-load clause) -- max-width:100%;height:auto
      // is the missing responsive constraint, matching screenshotHtml's own
      // sibling <img> (immediately above) which already uses max-width.
      // Without it, a fixed 480px-wide video overflows any viewport
      // narrower than 480px (confirmed empirically via a real Playwright
      // E2E run: document.body.scrollWidth was genuinely 480 at a 375px
      // viewport) -- a real regression introduced when this element was
      // added, only caught once Task 8's own E2E test existed to exercise
      // a real rendered page at a narrow viewport.
      ? '<video controls preload="none" poster="' + baseUrl + '/screenshots/' + encodeURIComponent(ac.acId) + '" width="480" height="270" style="display:block;margin-top:8px;max-width:100%;height:auto" src="' + baseUrl + '/video/' + encodeURIComponent(ac.acId) + '">' +
          'Your browser does not support the video tag.' +
        '</video>' + alsoCoversHtml
      : '';
    // ppc-s2 (final-review fix, AC5): a clear, visible failure notice so a
    // just-failed AC is distinguishable from one never attempted. Placed
    // adjacent to captureFormHtml's retry button, not buried elsewhere.
    var failureHtml = ac.lastCaptureFailure
      ? '<p role="alert">Capture failed: ' + _escapeHtml(ac.lastCaptureFailure.error || 'unknown error') + ' -- use the button above to retry.</p>'
      : '';
    // actr-s2 (AC1, AC4, AC6): hidden ONLY when this AC's target is
    // auto-resolved and no override has been requested for it -- every
    // other case (not auto-resolved at all, AC4's manual-only case,
    // override requested) renders this exact unchanged form, so AC4's
    // "no behavioural regression" requirement holds by construction, not
    // by a separate code path.
    var targetForForm = (ac.target && !ac.isAutoResolved) ? ac.target : null;
    var manualFormHtml = (ac.isAutoResolved && !ac.overrideRequested) ? '' :
      '<form method="POST" action="' + baseUrl + '/targets/' + encodeURIComponent(ac.acId) + '">' +
        _csrf.csrfField(csrfToken) +
        '<label for="url-' + _escapeHtml(ac.acId) + '">Page URL</label><br>' +
        '<input id="url-' + _escapeHtml(ac.acId) + '" name="url" type="url" required value="' + (targetForForm ? _escapeHtml(targetForForm.url) : '') + '"><br>' +
        '<label for="selector-' + _escapeHtml(ac.acId) + '">CSS selector</label><br>' +
        '<input id="selector-' + _escapeHtml(ac.acId) + '" name="selector" type="text" required value="' + (targetForForm ? _escapeHtml(targetForForm.selector) : '') + '"><br>' +
        '<button type="submit">Set capture target</button>' +
      '</form>';
    return '<li style="margin-bottom:24px;border-bottom:1px solid #E4E7EB;padding-bottom:16px">' +
      '<h2 style="font-size:16px">' + _escapeHtml(ac.acId) + ' — ' + _escapeHtml(ac.description) + '</h2>' +
      statusHtml +
      manualFormHtml +
      captureFormHtml +
      inProgressHtml +
      failureHtml +
      screenshotHtml +
      videoHtml +
    '</li>';
  }).join('');
  // ppc-s6 (AC1): body-fragment only now -- the dashboard shell (renderShellWithNav,
  // handleGetPlaybackEvidence's own caller) supplies the <!DOCTYPE html>/<head>/<body>
  // wrapper, title, nav, and shared styling. This function's own title is passed
  // separately to renderShellWithNav rather than embedded here.
  return '<h1>' + _escapeHtml(journey.featureSlug) + '</h1>' +
    progressHtml +
    captureAllFormHtml +
    '<ul style="list-style:none;padding:0">' + rows + '</ul>';
}

function _notFound(res) {
  // AC7: 403/not-found with no partial content and no metadata revealing
  // the other tenant's feature exists -- 404 + a constant body, never the
  // real reason (slug mismatch vs tenant mismatch vs not-DoD-complete all
  // look identical from outside).
  _sendJson(res, 404, { error: 'not found' });
}

async function _resolveJourney(req, pool) {
  var tenantId = req.session && req.session.tenantId;
  var productId = req.params && req.params.productId;
  var featureSlug = req.params && req.params.featureSlug;
  if (!tenantId || !productId || !featureSlug) return null;

  var journey = _journeyStore.getJourneyByTenantProductSlug(tenantId, productId, featureSlug);
  if (journey && _journeyStore.isDodComplete(journey)) return journey;

  // ppc-s4: css-parity fallback -- see _resolveViaPipelineState's own doc
  // comment. Only reached on a cold miss; every subsequent request for the
  // same tenant/product/feature hits the fast path above instead.
  return await _resolveViaPipelineState(req, pool, tenantId, productId, featureSlug);
}

/**
 * actr-s2 (Task 2): finds the E2E spec file path covering a given AC in a
 * story's own test-plan.md content, by scanning its "## E2E Tests" section
 * for a "### <test name>" block whose "**Verifies:** AC_n..." line names
 * the AC, then reading that block's "**File:**" line. If that block's own
 * File: line has no real path (e.g. "Same spec file, second test" --
 * confirmed real shape, artefacts/2026-10-20-production-playback-capture/
 * test-plans/ppc-s6-test-plan.md lines 154-157), falls back to the nearest
 * PRECEDING block's real path within the same section.
 * Pure, synchronous, no I/O. Never throws -- returns null for any shape it
 * doesn't recognise (no E2E Tests section, AC not named, etc.), per AC4's
 * "manual-only AC" case and AC5's "never surface an error" requirement.
 * @param {string} testPlanContent
 * @param {string} acId
 * @returns {string|null}
 */
function _findE2eSpecFileForAc(testPlanContent, acId) {
  var sectionMatch = /^## E2E Tests\s*$/m.exec(testPlanContent || '');
  if (!sectionMatch) return null;

  var afterHeading = testPlanContent.slice(sectionMatch.index + sectionMatch[0].length);
  var nextHeadingMatch = /^## /m.exec(afterHeading);
  var sectionText = nextHeadingMatch ? afterHeading.slice(0, nextHeadingMatch.index) : afterHeading;

  var blocks = sectionText.split(/^### /m).slice(1);
  var lastRealFile = null;
  var acRe = new RegExp('\\b' + acId + '\\b');

  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    var fileMatch = /\*\*File:\*\*\s*(.+)/.exec(block);
    var realPath = null;
    if (fileMatch) {
      var pathMatch = /`?([\w-./]+\.spec\.js)`?/.exec(fileMatch[1]);
      if (pathMatch) {
        realPath = pathMatch[1];
        lastRealFile = realPath;
      }
    }
    var verifiesMatch = /\*\*Verifies:\*\*\s*(.+)/.exec(block);
    if (verifiesMatch && acRe.test(verifiesMatch[1])) {
      return realPath || lastRealFile;
    }
  }
  return null;
}

/**
 * actr-s2 (Task 3, AC4/AC5 -- REDESIGNED post-review, see decisions.md
 * 2026-10-29): attempts to auto-resolve a capture target for one AC from
 * its own story's test-plan.md + the E2E spec file it names. Returns
 * {url, selector, specFile} on success, or null for EVERY failure mode
 * below -- never throws, per AC5's "an auto-resolution failure must never
 * surface as a page error" requirement:
 *  - acRow is missing, or present but has no storySlug (Postgres single-row-branch journeys)
 *  - the test-plan.md does not exist on disk (or path traversal is attempted)
 *  - the test-plan names no E2E spec for this AC (_findE2eSpecFileForAc
 *    returns null) -- the normal, expected case for a manual-only AC
 *  - the named spec file does not exist on disk (or path traversal is attempted)
 *  - deriveCaptureTargetFromSpec resolves neither a url nor a selector
 *
 * Reads via the connected repo's LOCAL CLONE (getRepoRoot/ensureRepoFresh),
 * not the GitHub Contents API -- matching this file's own already-
 * established pattern for reading committed evidence (screenshots/videos)
 * elsewhere in handleGetPlaybackEvidence, rather than the GitHub-API pattern
 * _fetchSummaryContent/_getDodAcList use for discovery.md/benefit-metric.md/
 * dod/*.md. The original design used fetchArtefact/fetchRepoPath (GitHub
 * API) instead; this was corrected before merge after it was found to make
 * the happy path untestable by any automated E2E spec (it required a real
 * OAuth-authenticated session with a real GitHub token, which cannot be
 * materialized in an automated test run). The local-clone path is fully
 * deterministic and requires no network/auth, enabling a real Playwright
 * E2E test (Task 7) instead of a RISK-ACCEPT.
 * @param {object} req
 * @param {object} journey
 * @param {{acId: string, storySlug?: string}} acRow
 * @returns {{url: string, selector: string, specFile: string}|null}
 */
function _resolveAutoCaptureTarget(req, journey, acRow) {
  try {
    if (!acRow || !acRow.storySlug) return null;

    var repoRoot = getRepoRoot(req);
    try { ensureRepoFresh(repoRoot); } catch (_) {}

    var testPlanRelPath = 'artefacts/' + journey.featureSlug + '/test-plans/' + acRow.storySlug + '-test-plan.md';
    var testPlanPath = _resolveSafeShotPath(repoRoot, testPlanRelPath);
    if (!testPlanPath || !fs.existsSync(testPlanPath)) return null;
    var testPlanContent = fs.readFileSync(testPlanPath, 'utf8');

    var specFile = _findE2eSpecFileForAc(testPlanContent, acRow.acId);
    if (!specFile) return null;

    // specFile came from regex-parsed, tenant-repo-authored content -- never
    // trust it as a safe relative path without the same traversal guard
    // _resolveSafeShotPath already applies to every other disk read in this
    // file (screenshot/video serving).
    var specPath = _resolveSafeShotPath(repoRoot, specFile);
    if (!specPath || !fs.existsSync(specPath)) return null;
    var specContent = fs.readFileSync(specPath, 'utf8');

    var derived = deriveCaptureTargetFromSpec(specContent, acRow.acId);
    if (!derived || !derived.url || !derived.selector) return null;

    return { url: derived.url, selector: derived.selector, specFile: specFile };
  } catch (_) {
    return null;
  }
}

async function _getDodAcList(journey, req, pool) {
  var artefacts = await _journeyStore.getArtefactsForJourney(journey.journeyId);
  var dodRow = (artefacts || []).find(function(a) { return a.skill_name === 'definition-of-done'; });
  if (dodRow) return parseDodAcCoverage(dodRow.content);

  // ppc-s4 (AC6): no Postgres artefact row exists -- true for every journey
  // auto-provisioned by _resolveViaPipelineState, since no chat walkthrough
  // ever ran /definition-of-done for it. Fetch each DoD-complete story's
  // real markdown content directly from GitHub instead, aggregating across
  // every one of them (a feature may have several DoD-complete stories).
  var storySlugs = journey.pipelineStateStorySlugs;
  if (!storySlugs || storySlugs.length === 0) return [];

  var accessToken = req.session && req.session.accessToken;
  var ownerRepo = await _resolveOwnerRepo(journey.productId, journey.tenantId, pool);
  if (!ownerRepo || !accessToken) return [];

  var acs = [];
  for (var i = 0; i < storySlugs.length; i++) {
    try {
      var content = await _fetchArtefact(journey.featureSlug, 'dod/' + storySlugs[i] + '-dod', accessToken, ownerRepo);
      var storySlug = storySlugs[i];
      var storyAcs = parseDodAcCoverage(content).map(function(ac) {
        // actr-s2 (prerequisite for AC1-AC6): tags each AC row with the
        // story it came from -- an AC id (e.g. "AC1") is only unique WITHIN
        // one story, not across a whole feature, so auto-resolution
        // (Task 3) needs this to know which story's own test-plan.md to
        // fetch. The Postgres single-row branch above (dodRow) does NOT
        // get this treatment.
        return Object.assign({}, ac, { storySlug: storySlug });
      });
      acs = acs.concat(storyAcs);
    } catch (_) {
      // One story's DoD content missing/unfetchable must not blank the
      // whole list -- the other stories' ACs are still real evidence.
    }
  }
  return acs;
}

// ppc-s6 (AC2, AC4): fetches discovery.md/benefit-metric.md tenant-scoped via
// the same _fetchArtefact/_resolveOwnerRepo path ppc-s4 already uses for DoD
// content -- each fetch is independent so one missing artefact doesn't blank
// the other (AC4's own "rest of the page is unaffected" requirement).
async function _fetchSummaryContent(journey, req, pool) {
  var accessToken = req.session && req.session.accessToken;
  var ownerRepo = await _resolveOwnerRepo(journey.productId, journey.tenantId, pool);
  var result = { problemStatement: null, metricTargets: {}, missing: [] };
  if (!ownerRepo || !accessToken) { result.missing.push('discovery.md', 'benefit-metric.md'); return result; }
  try {
    var discoveryContent = await _fetchArtefact(journey.featureSlug, 'discovery', accessToken, ownerRepo);
    result.problemStatement = extractMarkdownSection(discoveryContent, 'Problem statement');
  } catch (e) {
    if (e instanceof ArtefactNotFoundError) result.missing.push('discovery.md');
  }
  try {
    var benefitContent = await _fetchArtefact(journey.featureSlug, 'benefit-metric', accessToken, ownerRepo);
    result.metricTargets = parseBenefitMetricTargets(benefitContent);
  } catch (e) {
    if (e instanceof ArtefactNotFoundError) result.missing.push('benefit-metric.md');
  }
  return result;
}

// ppc-s6 (AC2, AC6): Scope/Benefit rendered as a 2-column grid at desktop
// width with an explicit single-column override below 768px (DESIGN.md's own
// "not specified is not a valid shipped state" rule for multi-column content).
function _renderSummaryHtml(summary) {
  var scopeHtml = summary.missing.indexOf('discovery.md') !== -1
    ? '<p class="playback-ac__empty">discovery.md not found in the connected repo.</p>'
    : '<p>' + _escapeHtml(summary.problemStatement || 'No problem statement on file.') + '</p>';
  var benefitHtml = summary.missing.indexOf('benefit-metric.md') !== -1
    ? '<p class="playback-ac__empty">benefit-metric.md not found in the connected repo.</p>'
    : '<ul class="sw-list">' + Object.keys(summary.metricTargets || {}).map(function(name) {
        return '<li>' + _escapeHtml(name) + ': ' + _escapeHtml(summary.metricTargets[name]) + '</li>';
      }).join('') + '</ul>';
  return '<style>.ppc-summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}' +
    '@media (max-width: 768px){.ppc-summary-grid{grid-template-columns:1fr}}</style>' +
    '<div class="ppc-summary-grid">' +
      '<div class="sw-card playback-summary"><h2 class="sw-section-title">Scope</h2>' + scopeHtml + '</div>' +
      '<div class="sw-card playback-summary"><h2 class="sw-section-title">Benefit</h2>' + benefitHtml + '</div>' +
    '</div>';
}

// ppc-s6 (AC3): adapts ppc's own flat acs array to /playback's own
// {stories:[{acRows}]} shape so computeAcCoverageSummary/renderCoverageSummaryHtml
// are reused exactly as-is, per AC3's own wording -- no change to either function.
function _coverageSummaryHtmlForAcs(acs) {
  var structure = { stories: [{ acRows: acs.map(function(ac) {
    return { acId: ac.acId, media: { screenshotPath: ac.screenshotPath, videoPath: ac.videoPath } };
  }) }] };
  return renderCoverageSummaryHtml(computeAcCoverageSummary(structure));
}

// ppc-s7 (AC2, AC3, AC4): the same "N of M" snapshot string is needed both
// at write time (handlePostSignOff, stored verbatim on the decision) and at
// render time (handleGetPlaybackEvidence, to detect staleness against a
// stored snapshot) -- a single helper keeps both call sites byte-for-byte
// consistent rather than risking two slightly different "N of M" formats.
function _coverageSnapshotString(acs) {
  var structure = { stories: [{ acRows: acs.map(function(ac) {
    return { acId: ac.acId, media: { screenshotPath: ac.screenshotPath, videoPath: ac.videoPath } };
  }) }] };
  var summary = computeAcCoverageSummary(structure);
  return summary.captured + ' of ' + summary.total;
}

// ppc-s7 (AC1, AC3, AC4, AC6): the sign-off area -- a PO's Approve/Needs
// changes decision, tied to identity and the exact AC coverage they saw.
// `--success`/`--danger`/`--danger-soft` tokens are already defined in
// html-shell.js's shared :root block (DESIGN.md's own badge/button palette);
// this function only adds small, LOCALLY SCOPED classes for the one button
// variant (destructive) and the two badge variants that don't already exist
// as shared .sw-btn--*/.sw-badge--* classes -- mirroring ppc-s6's own
// .ppc-summary-grid precedent (a scoped <style> block in the render
// function's own output, not a change to html-shell.js's shared CSS) rather
// than expanding this story's DoR-confirmed touch points.
function _renderSignOffHtml(journey, csrfToken, currentCoverageSnapshot) {
  var baseUrl = _playbackEvidenceUrl(journey.productId, journey.featureSlug);
  var style = '<style>' +
    '.ppc-signoff-btn--destructive{background:var(--danger-soft);color:var(--danger);border-color:var(--danger)}' +
    '.ppc-signoff-badge{font-family:"JetBrains Mono",monospace;font-size:12px;padding:2px 8px;border-radius:4px;display:inline-block}' +
    '.ppc-signoff-badge--success{background:var(--success-soft);color:var(--success)}' +
    '.ppc-signoff-badge--danger{background:var(--danger-soft);color:var(--danger)}' +
    '</style>';

  if (!journey.signOff) {
    return style +
      '<div class="sw-card ppc-signoff">' +
        '<h2 class="sw-section-title">Sign-off</h2>' +
        '<p>No decision recorded yet.</p>' +
        '<form method="POST" action="' + baseUrl + '/sign-off">' +
          _csrf.csrfField(csrfToken) +
          '<label for="ppc-signoff-comment">Comment (optional)</label><br>' +
          '<textarea id="ppc-signoff-comment" name="comment" rows="3"></textarea><br>' +
          '<button type="submit" name="status" value="approved" class="sw-btn sw-btn--primary">Approve</button> ' +
          '<button type="submit" name="status" value="needs-changes" class="sw-btn ppc-signoff-btn--destructive">Needs changes</button>' +
        '</form>' +
      '</div>';
  }

  var signOff = journey.signOff;
  var badgeClass = signOff.status === 'approved' ? 'ppc-signoff-badge--success' : 'ppc-signoff-badge--danger';
  var badgeText = signOff.status === 'approved' ? 'Approved' : 'Needs changes';
  var isStale = signOff.coverageSnapshot !== currentCoverageSnapshot;
  var staleNote = isStale
    ? ' <span class="playback-ac__empty">(new evidence captured since this decision)</span>'
    : '';
  return style +
    '<div class="sw-card ppc-signoff">' +
      '<h2 class="sw-section-title">Sign-off</h2>' +
      '<p><span class="ppc-signoff-badge ' + badgeClass + '">' + _escapeHtml(badgeText) + '</span> against ' + _escapeHtml(signOff.coverageSnapshot) + ' ACs' + staleNote + '</p>' +
      '<p>By ' + _escapeHtml(signOff.by) + ' at ' + _escapeHtml(signOff.at) + '</p>' +
      (signOff.comment ? '<p>' + _escapeHtml(signOff.comment) + '</p>' : '') +
    '</div>';
}

/**
 * ppc-s9 (Task 6): checks every in-flight capture dispatch recorded against
 * this journey (journey.captureInProgress, written by handlePostCaptureTrigger
 * / handlePostCaptureAll -- Task 5 above), grouped by correlationId rather
 * than by acId -- a capture-all dispatch shares ONE correlationId across
 * several acIds, so checkCaptureArtifact is only called once per unique
 * correlationId, never once per acId.
 *
 * For each group:
 *  - found: downloads the artifact (downloadCaptureArtifact now returns
 *    {screenshots: {[acId]: Buffer}, videoBuffer} -- each AC commits its OWN
 *    screenshot buffer, keyed by its own acId; the video stays one shared
 *    buffer per group) via the EXISTING, UNCHANGED commitArtefact call shape
 *    (_captureOneAc/_captureVideoForAcIds's own pre-dispatch convention),
 *    updates captureScreenshots/captureVideos, and clears each successfully-
 *    finalised acId from captureInProgress (and from any stale
 *    captureAllFailed entry -- a just-succeeded retry must not still render
 *    the old failure notice). An acId whose own screenshot is missing from
 *    the (otherwise-found) archive is bounded by the SAME
 *    CAPTURE_WAIT_WINDOW_MS as the not-found branch below -- left in
 *    progress for retry while still within the window, moved to
 *    captureAllFailed once it elapses, never retried indefinitely.
 *  - not found, within CAPTURE_WAIT_WINDOW_MS of dispatchedAt: left
 *    untouched; the acId is returned in the in-progress set so the caller
 *    can render the new "capture in progress" fragment instead of the
 *    normal capture form.
 *  - not found, past CAPTURE_WAIT_WINDOW_MS: records a captureAllFailed
 *    entry (the EXISTING ppc-s2 field/rendering path -- not a new one) and
 *    clears captureInProgress for the group.
 *
 * Mutates `journey` in place so the caller's own acs-building code
 * (immediately after this call) sees the fresh state, and persists exactly
 * ONE setJourneyFields call for the whole request, however many groups were
 * processed.
 * @param {object} journey
 * @param {object} req
 * @param {object} pool
 * @returns {Promise<Object<string,boolean>>} map of acId -> true for every AC still in progress
 */
async function _finaliseInProgressCaptures(journey, req, pool) {
  var captureInProgress = journey.captureInProgress || {};
  var inProgressAcIds = Object.keys(captureInProgress);
  if (inProgressAcIds.length === 0) return {};

  var groups = {};
  inProgressAcIds.forEach(function(acId) {
    var entry = captureInProgress[acId];
    var correlationId = entry.correlationId;
    if (!groups[correlationId]) {
      groups[correlationId] = { correlationId: correlationId, dispatchedAt: entry.dispatchedAt, acIds: [] };
    }
    groups[correlationId].acIds.push(acId);
  });

  var nextCaptureInProgress = Object.assign({}, captureInProgress);
  var nextCaptureScreenshots = Object.assign({}, journey.captureScreenshots || {});
  var nextCaptureVideos = Object.assign({}, journey.captureVideos || {});
  var nextCaptureAllFailed = Object.assign({}, journey.captureAllFailed || {});
  var stillInProgress = {};

  // Resolved lazily, at most once per request -- same "don't re-fetch
  // redundantly" instruction as the existing handlers' own ownerRepo
  // resolution, just lazy here since handleGetPlaybackEvidence (unlike
  // handlePostCaptureTrigger/handlePostCaptureAll) has no pre-existing
  // reason to resolve it when there is nothing in progress to finalise.
  var ownerRepo = null;
  var ownerRepoFetched = false;
  var accessToken = req.session && req.session.accessToken;

  var correlationIds = Object.keys(groups);
  for (var i = 0; i < correlationIds.length; i++) {
    var group = groups[correlationIds[i]];
    var checkResult;
    try {
      checkResult = await checkCaptureArtifact(group.correlationId);
    } catch (_) {
      // A transient artifact-check failure is treated the same as "not
      // found yet" -- retried on the next page load, same as a genuinely
      // still-running workflow, until CAPTURE_WAIT_WINDOW_MS itself expires.
      checkResult = { found: false };
    }

    // Computed once per group, before the found/not-found branch, so a
    // permanently-missing per-AC screenshot (found branch, below) is bounded
    // by the SAME CAPTURE_WAIT_WINDOW_MS the not-found branch already uses --
    // without this, an AC whose own screenshot never appears in an otherwise-
    // successful group would retry forever: once checkCaptureArtifact finds
    // the group's artifact (GitHub artifacts persist well past any plausible
    // wait window), the not-found/timeout branch below is never reached
    // again for that correlationId (spec-compliance review fix).
    var elapsedMs = Date.now() - new Date(group.dispatchedAt).getTime();

    if (checkResult && checkResult.found) {
      var downloaded;
      try {
        downloaded = await downloadCaptureArtifact(checkResult.archiveDownloadUrl);
      } catch (_) {
        downloaded = {};
      }

      if ((downloaded.screenshots || downloaded.videoBuffer) && !ownerRepoFetched) {
        ownerRepo = await _resolveOwnerRepo(journey.productId, journey.tenantId, pool);
        ownerRepoFetched = true;
      }

      if (ownerRepo) {
        // A missing key in downloaded.screenshots means that one AC's own
        // capture failed upstream in the worker while the rest of the group
        // succeeded -- tracked here and excluded from the "finalise this
        // group" sweep below so a partial failure can't crash or
        // mis-finalise the rest of the group. Bounded by CAPTURE_WAIT_WINDOW_MS
        // the same way the not-found branch below is, so a permanently-
        // missing screenshot doesn't retry forever once the group's own
        // artifact is found.
        var missingScreenshotAcIds = {};
        if (downloaded.screenshots) {
          for (var s = 0; s < group.acIds.length; s++) {
            var shotAcId = group.acIds[s];
            // Each AC commits its OWN buffer, keyed by its own acId --
            // downloaded.screenshots is {[acId]: Buffer}, never one shared
            // buffer reused for every AC in the group.
            var shotBuffer = downloaded.screenshots[shotAcId];
            if (!shotBuffer) {
              missingScreenshotAcIds[shotAcId] = true;
              if (elapsedMs < CAPTURE_WAIT_WINDOW_MS) {
                console.error('_finaliseInProgressCaptures: no screenshot found for ' + shotAcId + ' in capture artifact for correlationId ' + group.correlationId + ' -- leaving it in progress for retry');
                stillInProgress[shotAcId] = true;
              } else {
                console.error('_finaliseInProgressCaptures: no screenshot found for ' + shotAcId + ' in capture artifact for correlationId ' + group.correlationId + ' after the wait window elapsed -- marking failed');
                nextCaptureAllFailed[shotAcId] = { error: 'capture workflow did not complete within the expected window', retry: true };
                delete nextCaptureInProgress[shotAcId];
              }
              continue;
            }
            var shotPath = 'artefacts/' + journey.featureSlug + '/playback/ppc-s1/screenshots/' + shotAcId + '.png';
            await commitArtefact(shotPath, shotBuffer.toString('base64'), accessToken, ownerRepo.owner, ownerRepo.repo, 'base64');
            nextCaptureScreenshots[shotAcId] = shotPath;
          }
        }
        if (downloaded.videoBuffer) {
          // ppc-s5's own "same video path for every AC in the group"
          // convention, generalised to this task's own group shape --
          // mirrors _captureVideoForAcIds's clip.name: acIds.join('+').
          var videoPath = 'artefacts/' + journey.featureSlug + '/playback/ppc-s1/video/' + group.acIds.join('+') + '.webm';
          await commitArtefact(videoPath, downloaded.videoBuffer.toString('base64'), accessToken, ownerRepo.owner, ownerRepo.repo, 'base64');
          group.acIds.forEach(function(vidAcId) { nextCaptureVideos[vidAcId] = videoPath; });
        }

        group.acIds.forEach(function(doneAcId) {
          if (missingScreenshotAcIds[doneAcId]) return;
          delete nextCaptureInProgress[doneAcId];
          delete nextCaptureAllFailed[doneAcId];
        });
      }
      // ownerRepo === null (no connected repo): leave this group's
      // captureInProgress entries as-is -- nothing was committed, so there
      // is nothing safe to finalise yet; the next page load will retry the
      // artifact-check (and, eventually, time out via the branch below if
      // the wait window elapses first).
    } else {
      if (elapsedMs < CAPTURE_WAIT_WINDOW_MS) {
        group.acIds.forEach(function(waitingAcId) { stillInProgress[waitingAcId] = true; });
      } else {
        group.acIds.forEach(function(timedOutAcId) {
          nextCaptureAllFailed[timedOutAcId] = { error: 'capture workflow did not complete within the expected window', retry: true };
          delete nextCaptureInProgress[timedOutAcId];
        });
      }
    }
  }

  journey.captureInProgress = nextCaptureInProgress;
  journey.captureScreenshots = nextCaptureScreenshots;
  journey.captureVideos = nextCaptureVideos;
  journey.captureAllFailed = nextCaptureAllFailed;

  _journeyStore.setJourneyFields(journey.journeyId, {
    captureInProgress: nextCaptureInProgress,
    captureScreenshots: nextCaptureScreenshots,
    captureVideos: nextCaptureVideos,
    captureAllFailed: nextCaptureAllFailed
  });

  return stillInProgress;
}

/**
 * AC1 (list, tenant+product scoped), AC4 ("not set" state), AC5 (inline screenshot).
 */
async function handleGetPlaybackEvidence(req, res, _next, pool) {
  var journey = await _resolveJourney(req, pool);
  if (!journey) { _notFound(res); return; }

  // ppc-s10 (AC1): refresh the local checkout before reading committed
  // capture evidence off disk -- mirrors journey.js's own _readPipelineFeatures
  // call shape exactly (rclr-s1's ensureRepoFresh never throws, but wrapped
  // here too so a refresh failure can never block the page render).
  try { ensureRepoFresh(getRepoRoot(req)); } catch (_) {}

  var acRows = await _getDodAcList(journey, req, pool);

  // ppc-s9 (Task 6): must run BEFORE building the acs render array below, so
  // a just-completed/just-failed/just-timed-out capture is reflected in the
  // SAME render rather than requiring a second page load.
  var inProgressAcIds = await _finaliseInProgressCaptures(journey, req, pool);

  var captureTargets = journey.captureTargets || [];
  var screenshots = journey.captureScreenshots || {};
  var videos = journey.captureVideos || {};

  var captureAllFailed = journey.captureAllFailed || {};
  var acs = [];
  for (var acIdx = 0; acIdx < acRows.length; acIdx++) {
    var acRow = acRows[acIdx];
    var targetState = _journeyStore.getCaptureTargetState(captureTargets, acRow.acId);
    var hasManualTarget = targetState !== _journeyStore.CAPTURE_TARGET_NOT_SET;
    // actr-s2 (AC3, NFR-Performance): only attempt auto-resolution when no
    // manual target already exists -- a manual target always wins, and
    // skipping the fetch entirely when it's not even needed keeps this
    // bounded to "one extra fetch pair per AC lacking a manual target",
    // not "one extra fetch pair per AC unconditionally".
    var autoResolved = hasManualTarget ? null : _resolveAutoCaptureTarget(req, journey, acRow);
    var activeTarget = hasManualTarget ? targetState : autoResolved;
    var targetSet = !!activeTarget;
    acs.push({
      acId: acRow.acId,
      description: acRow.description,
      targetSet: targetSet,
      target: targetSet ? activeTarget : null,
      // actr-s2 (AC1, AC3): true only when no manual target exists AND
      // auto-resolution actually succeeded -- a manual target always wins
      // (see hasManualTarget above), so this can never be true alongside a
      // manually-set target.
      isAutoResolved: !hasManualTarget && !!autoResolved,
      autoResolvedSpecFile: (!hasManualTarget && autoResolved) ? autoResolved.specFile : null,
      // actr-s2 (AC6): query-param-driven override request for this AC,
      // read here so the render function (Task 4) can decide whether to
      // show the manual form even though a target auto-resolved. The
      // override round-trip itself (AC6 persistence) is Task 6 -- this is
      // just the read side needed for the render condition below.
      overrideRequested: !!(req.query && req.query.override === acRow.acId),
      screenshotPath: screenshots[acRow.acId] || null,
      videoPath: videos[acRow.acId] || null,
      // ppc-s2 (final-review fix, AC5): distinguishes an AC that just failed
      // in the most recent capture-all run from one simply never attempted.
      lastCaptureFailure: captureAllFailed[acRow.acId] || null,
      // ppc-s9 (Task 6): an AC whose dispatched capture hasn't resolved yet
      // (found or timed-out) -- re-triggering a capture already in flight
      // doesn't make sense, so this also suppresses the normal capture form
      // in _renderPlaybackEvidenceHtml below.
      captureInProgress: !!inProgressAcIds[acRow.acId]
    });
  }
  // ppc-s5 (AC2): a video shared across multiple ACs needs each AC's own
  // section to name the others -- computed here (not in the render
  // function) since it needs the full acs list, which the render function
  // only sees one row of at a time.
  acs.forEach(function(ac) {
    if (!ac.videoPath) { ac.coCoveredAcIds = []; return; }
    ac.coCoveredAcIds = acs.filter(function(other) { return other.acId !== ac.acId && other.videoPath === ac.videoPath; }).map(function(other) { return other.acId; });
  });

  if (_wantsHtml(req)) {
    var csrfToken = await _csrf.generateCsrfToken(req);
    var progress = captureAllLock.getLockState(journey.journeyId);
    var summary = await _fetchSummaryContent(journey, req, pool);
    var summaryHtml = _renderSummaryHtml(summary);
    var coverageSummaryHtml = _coverageSummaryHtmlForAcs(acs);
    // ppc-s7 (AC3): placed immediately after the coverage line, per this
    // story's own wording ("renders near the existing coverage line").
    var signOffHtml = _renderSignOffHtml(journey, csrfToken, _coverageSnapshotString(acs));
    var bodyContent = summaryHtml + coverageSummaryHtml + signOffHtml + _renderPlaybackEvidenceHtml(journey, acs, csrfToken, progress);
    // ppc-s6 (AC1, AC5): wrap in the shared dashboard shell -- the page
    // previously returned a bare <!DOCTYPE html> fragment with no nav, no
    // product context, and no shared styling. renderShellWithNav fetches the
    // Products-nav sidebar itself; the existing plain <form> elements inside
    // bodyContent are untouched, so AC5's keyboard-operable submission still
    // works unchanged.
    var html = await renderShellWithNav(pool, req.session.tenantId, {
      title: 'Playback evidence — ' + journey.featureSlug,
      bodyContent: bodyContent,
      user: { login: req.session.login || '' },
      active: 'journey',
      activeProductId: journey.productId
    });
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
async function handleGetCaptureScreenshot(req, res, _next, pool) {
  var journey = await _resolveJourney(req, pool);
  if (!journey) { _notFound(res); return; }

  var acId = req.params && req.params.acId;
  if (!ACID_RE.test(acId || '')) { _notFound(res); return; }

  // ppc-s10 (AC2): same refresh as handleGetPlaybackEvidence -- a direct
  // <img src> request must not 404 on a stale local checkout even when the
  // HTML page itself wasn't what triggered the refresh.
  try { ensureRepoFresh(getRepoRoot(req)); } catch (_) {}

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
 * AC2 -- tenant-scoped video serving, mirroring handleGetCaptureScreenshot's
 * own existing tenant+product+ACID_RE-guarded pattern exactly. Deliberately
 * NOT a reuse of the existing untenanted /playback-media/ route.
 */
async function handleGetCaptureVideo(req, res, _next, pool) {
  var journey = await _resolveJourney(req, pool);
  if (!journey) { _notFound(res); return; }

  var acId = req.params && req.params.acId;
  if (!ACID_RE.test(acId || '')) { _notFound(res); return; }

  // ppc-s10 (AC2): same refresh as handleGetCaptureScreenshot above.
  try { ensureRepoFresh(getRepoRoot(req)); } catch (_) {}

  var videos = journey.captureVideos || {};
  var videoPath = videos[acId];
  if (!videoPath) { _notFound(res); return; }

  var repoRoot = getRepoRoot(req);
  var resolvedVideoPath = _resolveSafeShotPath(repoRoot, videoPath);
  if (!resolvedVideoPath) { _notFound(res); return; }
  if (!fs.existsSync(resolvedVideoPath)) { _notFound(res); return; }

  var videoBuffer = fs.readFileSync(resolvedVideoPath);
  res.writeHead(200, { 'Content-Type': 'video/webm' });
  res.end(videoBuffer);
}

/**
 * AC2 — one-time manual target entry per AC.
 */
async function handlePostCaptureTarget(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var journey = await _resolveJourney(req, pool);
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

// ppc-s7 (AC2, AC5): records a PO's Approve/Needs-changes decision.
// _resolveJourney already scopes by BOTH tenant_id and product_id (same
// guard every other ppc write reuses) -- this alone satisfies AC5, no new
// access-control mechanism is introduced here.
async function handlePostSignOff(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var journey = await _resolveJourney(req, pool);
  if (!journey) { _notFound(res); return; }

  var body = req.body || {};
  var status = body.status;
  if (status !== 'approved' && status !== 'needs-changes') {
    _sendJson(res, 400, { error: 'status must be "approved" or "needs-changes"' });
    return;
  }

  // CLAUDE.md canonical-field rule: identity for an audit trail is always
  // login-or-userId, never the GitHub credential field -- mirrors
  // admin-credits.js's own adminId pattern exactly (Architecture Constraints).
  var by = String((req.session && (req.session.login || req.session.userId)) || 'unknown');

  var acRows = await _getDodAcList(journey, req, pool);
  var screenshots = journey.captureScreenshots || {};
  var videos = journey.captureVideos || {};
  var coverageAcs = acRows.map(function(ac) {
    return { acId: ac.acId, screenshotPath: screenshots[ac.acId] || null, videoPath: videos[ac.acId] || null };
  });
  var coverageSnapshot = _coverageSnapshotString(coverageAcs);

  _journeyStore.setJourneyFields(journey.journeyId, {
    signOff: {
      status: status,
      by: by,
      at: new Date().toISOString(),
      comment: typeof body.comment === 'string' ? body.comment : '',
      coverageSnapshot: coverageSnapshot
    }
  });

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
 *
 * ppc-s4: takes productId/tenantId directly rather than a journey object,
 * so it can also be called from _resolveViaPipelineState below, before any
 * journey exists.
 * @param {string} productId
 * @param {string} tenantId
 * @param {object} pool
 */
async function _resolveOwnerRepo(productId, tenantId, pool) {
  if (!pool) return null;
  try {
    var result = await pool.query(
      'SELECT repo_owner, repo_name FROM products WHERE product_id = $1 AND tenant_id = $2',
      [productId, tenantId]
    );
    var row = result.rows[0];
    if (!row || !row.repo_owner || !row.repo_name) return null;
    return { owner: row.repo_owner, repo: row.repo_name };
  } catch (_) {
    return null;
  }
}

/**
 * ppc-s4 (AC1, AC3, AC6) -- walks a parsed pipeline-state.json's own
 * features[] for featureSlug, handling both the flat feature.stories[] and
 * epic-nested feature.epics[].stories[] shapes (same walk as
 * product-rollup.js's computeDodStatusRollup). Returns null when the
 * feature isn't found or has zero stories -- never a false "complete".
 * @param {object} pipelineState - parsed pipeline-state.json content
 * @param {string} featureSlug
 * @returns {{allComplete: boolean, storySlugs: string[]}|null}
 */
function _featureDodStatus(pipelineState, featureSlug) {
  var features = (pipelineState && pipelineState.features) || [];
  var feature = features.find(function(f) { return f.slug === featureSlug; });
  if (!feature) return null;

  var stories = [];
  if (Array.isArray(feature.epics) && feature.epics.length > 0) {
    feature.epics.forEach(function(epic) {
      (epic.stories || []).forEach(function(story) { stories.push(story); });
    });
  } else {
    stories = feature.stories || [];
  }
  if (stories.length === 0) return null;

  return {
    allComplete: stories.every(function(s) { return s.dodStatus === 'complete'; }),
    storySlugs: stories.map(function(s) { return s.slug || s.id; }).filter(Boolean)
  };
}

/**
 * ppc-s4 (AC1, AC2, AC5) -- the css-parity fallback: when no Postgres
 * journey exists (or isn't yet DoD-complete), check whether the feature is
 * DoD-complete per the connected repo's own GitHub-synced
 * pipeline-state.json, and if so auto-provision a bare journey scoped to
 * THIS tenantId/productId pair -- never resolved by featureSlug alone
 * (ADR-025), matching getJourneyByTenantProductSlug's own fail-closed
 * guard. Returns null on any failure (no connected repo, fetch error,
 * feature not found/not complete) -- the caller's existing 404 behaviour is
 * unchanged.
 * @param {object} req
 * @param {object} pool
 * @param {string} tenantId
 * @param {string} productId
 * @param {string} featureSlug
 * @returns {Promise<object|null>}
 */
async function _resolveViaPipelineState(req, pool, tenantId, productId, featureSlug) {
  // Defense in depth, mirroring getJourneyByTenantProductSlug's own
  // SECURITY guard (journey-store.js) -- _resolveJourney's caller already
  // checks this before reaching here, but this function must also fail
  // closed on its own, since it is directly callable/testable.
  if (!tenantId || !productId || !featureSlug) return null;

  var accessToken = req.session && req.session.accessToken;
  if (!accessToken) return null;

  var ownerRepo = await _resolveOwnerRepo(productId, tenantId, pool);
  if (!ownerRepo) return null;

  var pipelineState;
  try {
    pipelineState = await _productRollup.fetchPipelineState(_pipelineStateFetchAdapter, {
      productId: productId,
      repoOwner: ownerRepo.owner,
      repoName: ownerRepo.repo,
      accessToken: accessToken
    });
  } catch (_) {
    return null;
  }

  var dodStatus = _featureDodStatus(pipelineState, featureSlug);
  if (!dodStatus || !dodStatus.allComplete) return null;

  var journey = _journeyStore.createJourney(featureSlug);
  _journeyStore.setJourneyFields(journey.journeyId, {
    tenantId: tenantId,
    productId: productId,
    completedStages: [{ skillName: 'definition-of-done', artefactPath: null, completedAt: new Date().toISOString() }],
    pipelineStateStorySlugs: dodStatus.storySlugs
  });
  return journey;
}

/**
 * AC3 -- session-reuse capture (ADR-018: real session only, never a service
 * credential or the NODE_ENV=test bypass).
 *
 * ppc-s9 (Task 5): no longer launches Chromium in-process. Dispatches the
 * platform's GitHub Actions capture-worker workflow (Task 4) and returns
 * immediately -- the real session id is exchanged for a short-lived,
 * single-use nonce first (issueNonce), so it never appears directly in the
 * workflow_dispatch input. handleGetPlaybackEvidence (Task 6) later polls
 * for the resulting artifact and finalises the capture.
 */
async function handlePostCaptureTrigger(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  // ppc-s3 (AC1): checked before journey resolution/Playwright acquisition --
  // a rate-limited request must do zero further work, matching the CSRF
  // guard's own "reject cheap, invalid requests first" placement immediately
  // above. Order matters here specifically because CSRF runs first: a
  // forged cross-site request (no valid token, but the victim's real
  // cookies) must not be able to burn the victim's own rate-limit quota --
  // it is rejected by the CSRF guard above before ever reaching this check.
  var rateLimitOk = false;
  _captureRateLimiter(req, res, function() { rateLimitOk = true; });
  if (!rateLimitOk) return;

  var journey = await _resolveJourney(req, pool);
  if (!journey) { _notFound(res); return; }

  var acId = req.params && req.params.acId;
  if (!ACID_RE.test(acId || '')) {
    _sendJson(res, 400, { error: 'invalid acId' });
    return;
  }
  var captureTargets = journey.captureTargets || [];
  var target = _journeyStore.getCaptureTargetState(captureTargets, acId);
  if (target === _journeyStore.CAPTURE_TARGET_NOT_SET) {
    // actr-s2 (AC2): no manual target -- attempt the same auto-resolution
    // the render path already uses, before giving up. Needs this AC's own
    // storySlug, which isn't known from acId alone here -- resolve the DoD
    // AC list the same way the render path does.
    var acRows = await _getDodAcList(journey, req, pool);
    var acRow = acRows.find(function(row) { return row.acId === acId; });
    var autoResolved = acRow ? _resolveAutoCaptureTarget(req, journey, acRow) : null;
    if (!autoResolved) {
      _sendJson(res, 400, { error: 'no capture target set for this AC' });
      return;
    }
    target = { acId: acId, url: autoResolved.url, selector: autoResolved.selector };
  }

  var ownerRepo = await _resolveOwnerRepo(journey.productId, journey.tenantId, pool);
  if (!ownerRepo) {
    _sendJson(res, 400, { error: 'product has no connected repo' });
    return;
  }

  // Matches billing.js's own host-derivation convention -- never a
  // hardcoded/env-configured base URL, which would silently scope the
  // seeded auth cookie to the wrong domain outside local dev.
  var baseUrl = (req.headers && req.headers.host) ? 'https://' + req.headers.host : 'https://localhost';

  // ppc-s9 (Task 5): ownerRepo is still resolved above (and still required
  // -- a product with no connected repo must still 400 before dispatching),
  // but it is NOT passed into the dispatch itself. The workflow never
  // touches the tenant's repo directly; ownerRepo is only needed again by
  // Task 6's own finalise step (its commitArtefact call), once the artifact
  // comes back.
  try {
    var correlationId = crypto.randomBytes(16).toString('hex');
    var nonce = await issueNonce(req.sessionId);
    await dispatchCaptureWorkflow({
      nonce: nonce,
      baseUrl: baseUrl,
      featureSlug: journey.featureSlug,
      acIds: [acId],
      targets: [{ acId: acId, url: target.url, selector: target.selector }],
      correlationId: correlationId
    });

    var captureInProgress = Object.assign({}, journey.captureInProgress);
    captureInProgress[acId] = { correlationId: correlationId, dispatchedAt: new Date().toISOString() };
    _journeyStore.setJourneyFields(journey.journeyId, { captureInProgress: captureInProgress });

    if (_isFormSubmission(req)) {
      _sendRedirect(res, _playbackEvidenceUrl(journey.productId, journey.featureSlug));
      return;
    }
    _sendJson(res, 200, { ok: true, dispatched: true, correlationId: correlationId });
  } catch (dispatchErr) {
    // Matches journey.js's handlePostGateConfirm precedent for this exact
    // operation (committing an artefact to GitHub, acdg-s1/acdg-s2): an
    // uncaught failure here is otherwise invisible -- a bare 500 with no
    // actionable message, surfaced only by server.js's generic top-level
    // handler. Structured JSON instead, via this file's own _sendJson.
    _sendJson(res, 502, {
      error: 'capture-dispatch-failed',
      message: 'Could not dispatch the capture workflow. Nothing was marked captured -- try again shortly.',
      detail: dispatchErr && dispatchErr.message
    });
  }
}

/**
 * AC1, AC2, AC3, AC4, AC5, AC6 -- across every AC that already has a stored
 * target.
 *
 * ppc-s9 (Task 5): no longer loops through Playwright captures in-process.
 * ONE dispatchCaptureWorkflow call carries every AC in the group (mirroring
 * ppc-s1's own single-dispatch shape, generalised from one AC to many) --
 * not one dispatch per AC, which would multiply workflow-run startup cost
 * for no benefit.
 */
async function handlePostCaptureAll(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  // ppc-s3 (AC1): the SAME _captureRateLimiter instance used by
  // handlePostCaptureTrigger above -- a single-AC trigger and a capture-all
  // trigger for the same user share one bucket, matching AC1's own "another
  // capture action (same or different feature)" wording. Checked before the
  // lock is acquired: a rate-limited request must never touch
  // captureAllLock at all.
  var rateLimitOk = false;
  _captureRateLimiter(req, res, function() { rateLimitOk = true; });
  if (!rateLimitOk) return;

  var journey = await _resolveJourney(req, pool);
  if (!journey) { _notFound(res); return; }

  if (!captureAllLock.tryAcquireLock(journey.journeyId)) {
    _sendJson(res, 409, { error: 'capture-all already in progress for this feature' });
    return;
  }

  try {
    var acRows = await _getDodAcList(journey, req, pool);
    var listResult = buildCaptureAllList({ acs: acRows, captureTargets: journey.captureTargets || [] });
    captureAllLock.setTotal(journey.journeyId, listResult.toCapture.length);

    if (listResult.toCapture.length === 0) {
      // final-review fix (Finding 1): the "Capture all evidence" button
      // renders unconditionally whenever no run is in progress -- it has no
      // check for whether any AC currently has a capture target set. A
      // first-time user, before setting any target, hits exactly this
      // empty-list branch; without this redirect check, that form
      // submission would get raw JSON dumped into the browser instead of
      // the normal page -- the same user-facing bug this commit exists to
      // fix. Matches the success-path redirect convention below.
      if (_isFormSubmission(req)) {
        _sendRedirect(res, _playbackEvidenceUrl(journey.productId, journey.featureSlug));
        return;
      }
      _sendJson(res, 200, { captured: [], failed: [], skipped: listResult.skipped, durationMs: 0, exceedsTimingThreshold: false });
      return;
    }

    var ownerRepo = await _resolveOwnerRepo(journey.productId, journey.tenantId, pool);
    if (!ownerRepo) {
      _sendJson(res, 400, { error: 'product has no connected repo' });
      return;
    }

    var baseUrl = (req.headers && req.headers.host) ? 'https://' + req.headers.host : 'https://localhost';

    // ppc-s9 (Task 5): ONE dispatch call covers every AC in the group,
    // mirroring ppc-s5's own "same video path for every AC in the group"
    // convention -- now "same correlationId for every AC in the group".
    // captureAllLock.updateProgress (AC2's own live-progress indicator) no
    // longer has a meaningful per-AC moment to update against, since the
    // real work is no longer a loop in THIS process -- see this task's own
    // scope note (final report) re: what the lock still protects now that
    // capture is async. setTotal above is kept so getLockState keeps
    // reporting a sensible total while a capture-in-progress fragment
    // renders (Task 6).
    try {
      var correlationId = crypto.randomBytes(16).toString('hex');
      var nonce = await issueNonce(req.sessionId);
      var acIds = listResult.toCapture.map(function(item) { return item.acId; });
      var targets = listResult.toCapture.map(function(item) {
        return { acId: item.acId, url: item.target.url, selector: item.target.selector };
      });

      await dispatchCaptureWorkflow({
        nonce: nonce,
        baseUrl: baseUrl,
        featureSlug: journey.featureSlug,
        acIds: acIds,
        targets: targets,
        correlationId: correlationId
      });

      var captureInProgress = Object.assign({}, journey.captureInProgress);
      var dispatchedAt = new Date().toISOString();
      acIds.forEach(function(acId) {
        captureInProgress[acId] = { correlationId: correlationId, dispatchedAt: dispatchedAt };
      });
      _journeyStore.setJourneyFields(journey.journeyId, { captureInProgress: captureInProgress });

      // ppc-s9 (Task 5 scope note, see this task's own final report): the
      // durationMs/exceedsTimingThreshold fields below used to measure how
      // long the SYNCHRONOUS in-process Playwright loop just took
      // (captureAllModule.measureCaptureDuration + checkTimingThreshold +
      // decisionsLogWriter.appendScopeNote, all removed in this change).
      // That loop no longer runs in this handler -- the real "how long did
      // capture take" question is only answerable later, once
      // handleGetPlaybackEvidence (Task 6) detects the dispatched workflow's
      // own completion. Reporting a real async-duration metric is out of
      // this task's scope (not named in any of ppc-s9's own ACs) -- these
      // fields are kept in the response shape for backward compatibility
      // but are now always 0/false rather than computed from a real
      // synchronous measurement.
      if (_isFormSubmission(req)) {
        _sendRedirect(res, _playbackEvidenceUrl(journey.productId, journey.featureSlug));
        return;
      }
      _sendJson(res, 200, {
        dispatched: true,
        acIds: acIds,
        correlationId: correlationId,
        skipped: listResult.skipped,
        durationMs: 0,
        exceedsTimingThreshold: false
      });
    } catch (dispatchErr) {
      _sendJson(res, 502, {
        error: 'capture-dispatch-failed',
        message: 'Could not dispatch the capture workflow. Nothing was marked captured -- try again shortly.',
        detail: dispatchErr && dispatchErr.message
      });
    }
  } finally {
    captureAllLock.releaseLock(journey.journeyId);
  }
}

module.exports = {
  handleGetPlaybackEvidence,
  handlePostCaptureTarget,
  handlePostCaptureTrigger,
  handleGetCaptureScreenshot,
  handleGetCaptureVideo,
  handlePostCaptureAll,
  handlePostSignOff,
  setJourneyStoreModule,
  setFetcherModule,
  _resolveJourney,
  _resolveViaPipelineState,
  _featureDodStatus,
  _getDodAcList,
  _findE2eSpecFileForAc,
  _resolveAutoCaptureTarget,
  _notFound,
  _sendJson,
  _renderCaptureAllProgress,
  _renderSignOffHtml,
  _coverageSnapshotString
};
