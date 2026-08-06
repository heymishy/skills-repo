'use strict';

// export-data-source.js — rb-s4 AC4/AC5, mtrr-s1 tenant-scoped resolution
//
// Real data-access implementation for the export endpoint
// (routes/export.js). Reuses fetchArtefact() -- the exact function
// handleArtefactRoute calls -- and the same GitHub Contents API path
// pipeline-state-fetch-adapter.js already uses for pipeline-state.json, so
// AC4 ("no divergent or stale copy" vs the in-app viewer) is structurally
// true rather than merely asserted by convention.
//
// D37 (CLAUDE.md): the throw-on-unwired stub and set/get pair live in
// routes/export.js (mirroring artefact.js's setFetcher location); this
// module only exports the "real" implementation, wired in server.js —
// same split already used by repo-adapter.js / pipeline-state-fetch-adapter.js.
//
// mtrr-s1: the old single-repo, env-var-sourced helper (shared across every
// tenant) is replaced by ownerRepoForFeature(slug, credential) -- a
// tenant-scoped products-table lookup (ADR-025). This is an
// internal helper, not a swappable adapter in its own right (DoR H-ADAPTER:
// N/A) -- it needs a DB pool, wired via setDbPool() below, mirroring the
// non-throwing "pool handed in by server.js at startup" pattern
// routes/auth.js already uses for setOrganisationsPool (no D37 stub-throw
// pair, since a missing pool here is a startup configuration gap, not a
// per-call adapter substitution point). realExportDataSource(slug,
// credential)'s own signature is unchanged so routes/export.js's D37
// adapter contract (_exportDataSource(slug, credential)) needs no changes.

const { fetchArtefact, ArtefactNotFoundError } = require('./artefact-fetcher');
const { realFetchPipelineState } = require('./pipeline-state-fetch-adapter');

let _dbPool = null;

/**
 * Wire the Postgres pool used by ownerRepoForFeature's tenant-scoped
 * products/journeys lookup (called once by server.js at startup, mirroring
 * routes/auth.js's setOrganisationsPool -- see module header).
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 */
function setDbPool(pool) { _dbPool = pool; }

/** Retrieve the currently wired pool (re-resolved per call so rewiring in tests always takes effect). */
function getDbPool() { return _dbPool; }

class ExportNotDorApprovedError extends Error {
  constructor(slug) {
    super(`Feature ${slug} is not DoR-approved`);
    this.name = 'ExportNotDorApprovedError';
  }
}

class ExportAccessDeniedError extends Error {
  constructor(slug) {
    super(`Credential does not have access to feature ${slug}`);
    this.name = 'ExportAccessDeniedError';
  }
}

class ExportNotFoundError extends Error {
  constructor(slug) {
    super(`Feature ${slug} not found`);
    this.name = 'ExportNotFoundError';
  }
}

/** Collects both flat feature.stories[] and epic-nested feature.epics[].stories[] (Phase 3+ schema allows either shape). */
function collectStories(feature) {
  const flat = Array.isArray(feature.stories) ? feature.stories : [];
  const epicNested = Array.isArray(feature.epics)
    ? feature.epics.reduce((acc, epic) => acc.concat(Array.isArray(epic.stories) ? epic.stories : []), [])
    : [];
  return flat.concat(epicNested).filter(s => typeof s === 'object' && s !== null);
}

/** Returns the first story with dorStatus 'signed-off' and a recorded dorArtefact path, or null. */
function findDorApprovedStory(feature) {
  return collectStories(feature).find(s => s.dorStatus === 'signed-off' && s.dorArtefact) || null;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Converts a repo-root-relative dorArtefact path (artefacts/{slug}/dor/{story}-dor.md) into fetchArtefact's artefactType param (dor/{story}-dor). */
function toArtefactType(dorArtefactPath, slug) {
  return dorArtefactPath
    .replace(/^artefacts\//, '')
    .replace(new RegExp('^' + escapeRegExp(slug) + '/'), '')
    .replace(/\.md$/, '');
}

/**
 * mtrr-s1: resolve which product owns `slug`, then that product's own
 * connected repo (owner/repo), scoped by tenant_id (ADR-025 application-layer
 * multi-tenancy) -- replaces the old single-repo helper's single,
 * deployment-wide env-var-sourced value. `credential` is accepted (matching the DoR-mandated
 * signature) and flows through unchanged to the existing GitHub Contents API
 * calls below -- GitHub's own repo-level access control remains the one,
 * unchanged authorization boundary for this path (rb-s4's existing
 * 403-vs-404 split), so this lookup does not introduce a second, parallel
 * isolation mechanism; it only fixes which owner/repo that existing
 * boundary is checked against.
 *
 * Every miss (no linked journey row for the slug, a null product_id/tenant_id
 * on that row, no matching product row, a tenant_id mismatch between the
 * journey and its resolved product, or a product with no repo connected yet)
 * is surfaced as ExportNotFoundError(slug) -- matching rb-s4's existing
 * not-found convention, which never includes owner/repo/tenant identifiers
 * in its message (AC3).
 * @param {string} slug
 * @param {string} credential
 * @returns {Promise<{ owner: string, repo: string }>}
 */
async function ownerRepoForFeature(slug, credential) { // eslint-disable-line no-unused-vars -- credential kept in signature per DoR mandate; flows through unchanged to the GitHub fetch below
  if (!_dbPool) {
    throw new Error('ownerRepoForFeature: database pool not wired. Call setDbPool() with a real Pool before use.');
  }

  const journeyResult = await _dbPool.query(
    'SELECT product_id, tenant_id FROM journeys WHERE feature_slug = $1',
    [slug]
  );
  const journeyRow = journeyResult.rows[0];
  if (!journeyRow || !journeyRow.product_id || !journeyRow.tenant_id) {
    throw new ExportNotFoundError(slug);
  }

  const productResult = await _dbPool.query(
    'SELECT repo_owner, repo_name FROM products WHERE product_id = $1 AND tenant_id = $2',
    [journeyRow.product_id, journeyRow.tenant_id]
  );
  const productRow = productResult.rows[0];
  if (!productRow || !productRow.repo_owner || !productRow.repo_name) {
    throw new ExportNotFoundError(slug);
  }

  return { owner: productRow.repo_owner, repo: productRow.repo_name };
}

/**
 * Real export data source: fetches pipeline-state.json + the DoR-approved
 * story's artefact for `slug`, using the caller's own credential (never a
 * service account, per product/constraints.md #12).
 * @param {string} slug
 * @param {string} credential
 * @returns {Promise<{ artefactContent: string, pipelineStateEntry: object }>}
 */
async function realExportDataSource(slug, credential) {
  const { owner, repo } = await ownerRepoForFeature(slug, credential);

  let raw;
  try {
    raw = await realFetchPipelineState(owner, repo, credential);
  } catch (err) {
    if (/404/.test(err.message)) throw new ExportNotFoundError(slug);
    if (/403/.test(err.message) || /401/.test(err.message)) throw new ExportAccessDeniedError(slug);
    throw err;
  }

  const decoded = Buffer.from(raw.content.replace(/\n/g, ''), 'base64').toString('utf8');
  const pipelineState = JSON.parse(decoded);
  const feature = (pipelineState.features || []).find(f => f.slug === slug);

  if (!feature) throw new ExportNotFoundError(slug);

  const story = findDorApprovedStory(feature);
  if (!story) throw new ExportNotDorApprovedError(slug);

  const artefactType = toArtefactType(story.dorArtefact, slug);

  let artefactContent;
  try {
    artefactContent = await fetchArtefact(slug, artefactType, credential, { owner, repo });
  } catch (err) {
    if (err instanceof ArtefactNotFoundError || err.name === 'ArtefactNotFoundError') {
      throw new ExportNotFoundError(slug);
    }
    throw err;
  }

  return { artefactContent, pipelineStateEntry: feature };
}

module.exports = {
  realExportDataSource,
  ownerRepoForFeature,
  setDbPool,
  getDbPool,
  findDorApprovedStory,
  ExportNotDorApprovedError,
  ExportAccessDeniedError,
  ExportNotFoundError
};
