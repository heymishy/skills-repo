'use strict';

// product-repo.js — prc-s1.2
//
// POST /products/:id/repo — connects (or re-connects) an existing GitHub
// repo the tenant admin already owns to a product, using the admin's own
// GitHub OAuth token (ADR-020, req.session.accessToken — the canonical
// field name, CLAUDE.md). Populates prc-s1.1's repo_provider/repo_owner/
// repo_name columns. Never persists the token itself (NFR: Security).
//
// Non-GitHub-authenticated sessions (Google/email, no accessToken) are
// directed to the existing GET /settings/link-account/github/start flow
// (AC3) -- no new account-linking mechanism is built here.

var _posthog = require('../modules/posthog-server');
var _repoAdapterModule = require('../adapters/repo-adapter');
var _repoRootAdapter = require('../adapters/repo-root'); // das-s3 -- tenant-scoped local disk root for resolving each stage's artefactPath
var _artefactBackfill = require('../adapters/artefact-backfill'); // das-s3

/**
 * Read + parse the request body. Mirrors routes/products.js's own
 * _readBody: short-circuits when req.body is already populated (unit tests
 * construct req objects with body pre-set), otherwise parses JSON or
 * form-urlencoded from the raw request stream.
 * @param {object} req
 * @returns {Promise<object>}
 */
function _readBody(req) {
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise(function(resolve) {
    var raw = '';
    req.on('data', function(c) { raw += c; });
    req.on('end', function() {
      var ct = (req.headers && req.headers['content-type']) || '';
      if (ct.indexOf('application/json') !== -1) {
        try { resolve(JSON.parse(raw)); } catch (_) { resolve({}); }
      } else {
        var params = new URLSearchParams(raw);
        var obj = {};
        params.forEach(function(v, k) { obj[k] = v; });
        resolve(obj);
      }
    });
    req.on('error', function() { resolve({}); });
  });
}

function _sendJson(res, status, body) {
  if (res.status) {
    res.status(status).json(body);
  } else {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  }
}

/**
 * Shared helper for connecting/updating a repo association. Used by both
 * handlePostConnectRepo (prc-s1.2) and handlePutProductEdit (prc-s4.1) to
 * ensure the edit flow and first-time configuration use identical code
 * (AC3 compliance). Verifies access via the repoAdapter, then updates the
 * product row. Returns an object with { success: boolean, error: string | null }.
 * @param {object} pool - database pool
 * @param {string} productId - product_id to update
 * @param {string} tenantId - tenant_id ownership check
 * @param {string} owner - GitHub owner
 * @param {string} repo - GitHub repo name
 * @param {string} accessToken - GitHub OAuth token
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
async function _applyRepoChange(pool, productId, tenantId, owner, repo, accessToken) {
  // Tenant-ownership check -- matches the FORBIDDEN-vs-NOT_FOUND policy
  // already used throughout routes/products.js (handleGetProductView,
  // handleDeleteProduct, etc.): a product not owned by the caller's tenant
  // returns 404, not 403.
  var prodRow = (await pool.query(
    'SELECT product_id, tenant_id FROM products WHERE product_id = $1',
    [productId]
  )).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    return { success: false, error: 'not found', statusCode: 404 };
  }

  // Delegate to the D37 adapter, never call fetch() directly here.
  // getRepoAdapter() is re-resolved on every call so rewiring (tests,
  // startup) always takes effect.
  var checkAccess = _repoAdapterModule.getRepoAdapter();
  var result = await checkAccess(owner, repo, accessToken);

  if (!result || !result.hasAccess) {
    // Rejected, zero writes. Deliberately vague between "doesn't exist" and
    // "no access" (matches GitHub's own 404-for-both semantics and avoids
    // leaking private-repo existence to a caller without access).
    return { success: false, error: 'You do not have access to that repository, or it does not exist.', statusCode: 403 };
  }

  // A single UPDATE always wins (re-linking updates the existing row's
  // columns; there is no separate "already connected" path to short-circuit
  // or branch on). This UPDATE is the same code path used by
  // handlePostConnectRepo, handlePutProductEdit, and (das-s3)
  // handlePostProductRepoCreate, ensuring AC3 compliance.
  await pool.query(
    'UPDATE products SET repo_provider = $1, repo_owner = $2, repo_name = $3 WHERE product_id = $4',
    ['github', owner, repo, productId]
  );

  // das-s3 (AC1, AC2, AC3, AC4): backfill already-completed stages, still
  // present on local disk, to the repo that was just connected -- this is
  // the ONE consolidation point for this feature, added once here so all
  // three entry points that call _applyRepoChange get it automatically
  // (story Architecture Constraints). Best-effort and additive-only: a
  // failure here must never undo the repo connection that already
  // succeeded above, so it is wrapped in its own try/catch and always
  // reported honestly via the `backfill` field rather than thrown.
  var backfill = { attempted: 0, succeeded: 0, skipped: [] };
  try {
    // ADR-025 (multi-tenancy): tenant_id-scoped, consistent with every other
    // query in this epic.
    var journeysResult = await pool.query(
      'SELECT feature_slug, data FROM journeys WHERE product_id = $1 AND tenant_id = $2',
      [productId, tenantId]
    );
    var journeyRows = (journeysResult && journeysResult.rows) || [];
    if (journeyRows.length > 0) {
      var repoRoot = _repoRootAdapter.getRepoRoot({ session: { tenantId: tenantId } });
      for (var i = 0; i < journeyRows.length; i++) {
        var row = journeyRows[i];
        var journeyData = (row && row.data) || {};
        if (!journeyData.featureSlug) journeyData.featureSlug = row.feature_slug;
        var stageResult = await _artefactBackfill.backfillCompletedStagesToRepo(
          journeyData, owner, repo, accessToken, repoRoot
        );
        backfill.attempted += stageResult.attempted;
        backfill.succeeded += stageResult.succeeded;
        backfill.skipped = backfill.skipped.concat(stageResult.skipped);
      }
    }
  } catch (_backfillErr) {
    console.error('[das-s3] backfill-on-repo-connect failed:', _backfillErr && _backfillErr.message);
  }

  return { success: true, error: null, statusCode: 200, backfill: backfill };
}

/**
 * POST /products/:id/repo — connect (or re-connect) a GitHub repo to a
 * product. AC1 (connect + confirm), AC2 (reject, zero writes), AC3
 * (redirect to account-linking, zero writes), AC4 (re-link updates, not
 * duplicates), AC5 (uses the D37 repo-adapter — never a direct fetch call
 * here, see adapters/repo-adapter.js for the throwing-stub/wiring rules).
 */
async function handlePostConnectRepo(req, res, _next, pool, posthog) {
  req.body = await _readBody(req);
  var _pool = pool;
  var _ph = posthog || _posthog;
  var tenantId = req.session && req.session.tenantId;
  var productId = req.params && req.params.id;
  var accessToken = req.session && req.session.accessToken; // canonical field name (CLAUDE.md)
  var owner = (req.body && req.body.owner) || '';
  var repo = (req.body && req.body.repo) || '';

  // AC3 — no GitHub token in session: direct to the existing account-linking
  // flow, never a new mechanism. Checked before any DB call so a non-GitHub
  // session can never cause a write.
  if (!accessToken) {
    _sendJson(res, 200, {
      error: 'Link your GitHub account first to connect a repo.',
      linkUrl: '/settings/link-account/github/start'
    });
    return;
  }

  // Use shared helper (prc-s4.1 AC3 compliance: same code path as edit flow)
  var result = await _applyRepoChange(_pool, productId, tenantId, owner, repo, accessToken);

  if (!result.success) {
    _sendJson(res, result.statusCode, { error: result.error });
    return;
  }

  _ph.capture(tenantId, 'product_repo_connected', {
    productId: productId,
    tenantId: tenantId,
    owner: owner,
    repo: repo,
    connectedBy: req.session && req.session.login
  });

  _sendJson(res, 200, { connected: true, owner: owner, repo: repo, backfill: result.backfill });
}

module.exports = {
  handlePostConnectRepo,
  _applyRepoChange  // exported for prc-s4.1 tests (AC3 shared-code-path verification)
};
