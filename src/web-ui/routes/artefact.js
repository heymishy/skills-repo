'use strict';

// artefact.js — Route handler for GET /artefact/:slug/:type
// Fetches a pipeline artefact from GitHub, renders it as sanitised HTML prose.
// ADR-012: fetching delegated to artefact-fetcher adapter — no inline API calls here.

const { fetchArtefact, ArtefactNotFoundError, ArtefactFetchError } = require('../adapters/artefact-fetcher');
const { renderArtefactToHTML, extractMetadata }                    = require('../utils/markdown-renderer');

// Replaceable dependencies for testing
let _fetchArtefact = fetchArtefact;
let _logger = {
  info: (/* event, data */) => {},
  warn: (/* event, data */) => {}
};

/** Replace the fetch adapter (for testing). */
function setFetcher(fn) { _fetchArtefact = fn; }

/** Replace the audit logger (for testing and production startup). */
function setLogger(logger) { _logger = logger; }

// ── Route handler ──────────────────────────────────────────────────────────

/**
 * Handle a request for a pipeline artefact.
 * @param {object} req
 * @param {object} res
 * @param {string} slug         - feature slug, e.g. '2026-01-01-example-feature'
 * @param {string} artefactType - artefact type, e.g. 'discovery'
 */
async function handleArtefactRoute(req, res, slug, artefactType) {
  // Auth guard — unauthenticated requests redirect to sign-in
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  const token = req.session.accessToken;

  try {
    const markdown = await _fetchArtefact(slug, artefactType, token);
    const meta     = extractMetadata(markdown);
    const html     = renderArtefactToHTML(markdown, meta);

    // Audit log: user ID + slug + type + timestamp; never log the token value
    _logger.info('artefact_read', {
      userId:       req.session.userId,
      featureSlug:  slug,
      artefactType,
      timestamp:    new Date().toISOString()
    });

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<html><head><meta charset="utf-8"></head><body>${html}</body></html>`);

  } catch (err) {
    if (err.name === 'ArtefactNotFoundError') {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<html><body><p>artefact not found</p></body></html>');
    } else {
      // ArtefactFetchError or unexpected error — log technical detail, surface human message
      _logger.warn('artefact_fetch_error', { error: err.cause || err.message });
      res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<html><body><p>Unable to load artefact \u2014 please try again</p></body></html>');
    }
  }
}

module.exports = { handleArtefactRoute, setLogger, setFetcher };
