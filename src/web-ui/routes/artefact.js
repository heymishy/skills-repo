'use strict';

// artefact.js — Route handler for GET /artefact/:slug/:type
// Fetches a pipeline artefact from GitHub, renders it as sanitised HTML prose.
// ADR-012: fetching delegated to artefact-fetcher adapter — no inline API calls here.

const { fetchArtefact, ArtefactNotFoundError, ArtefactFetchError } = require('../adapters/artefact-fetcher');
const { renderArtefactToHTML, extractMetadata }                    = require('../utils/markdown-renderer');
const { renderShell, escHtml: shellEscHtml }                       = require('../utils/html-shell');
const journeyStoreDefault                                          = require('../modules/journey-store');
// pncg-s1: shared Products-nav sidebar wrapper -- see products.js's own
// renderShellWithNav docblock. products.js does not require artefact.js, so
// this creates no circular dependency. Only the 2 success-rendering
// renderShell calls below are swapped -- the 404/error branches keep plain
// renderShell, matching journey.js's own not-found-page precedent.
const { renderShellWithNav }                                       = require('./products');

// Replaceable dependencies for testing
let _fetchArtefact = fetchArtefact;
let _journeyStore = journeyStoreDefault;
let _logger = {
  info: (/* event, data */) => {},
  warn: (/* event, data */) => {}
};

/** Replace the fetch adapter (for testing). */
function setFetcher(fn) { _fetchArtefact = fn; }

/**
 * Replace the journey store (for testing). avpf-s1: used to resolve the
 * Postgres-durable fallback content when GitHub's Contents API 404s -- see
 * das-s1 (a stage can be marked complete with no GitHub commit when no repo
 * is connected) and alrf-s4 (Postgres, not GitHub, is this web UI's primary
 * durable store for artefact content).
 */
function setJourneyStore(store) { _journeyStore = store; }

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
async function handleArtefactRoute(req, res, slug, artefactType, pool) {
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

    const bodyContent = `<div class="sw-doc">${html}</div>`;
    const page = await renderShellWithNav(pool, req.session.tenantId, {
      title:       `${shellEscHtml(artefactType)} — ${shellEscHtml(slug)}`,
      bodyContent,
      user:        { login: req.session.login || '' }
    });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page);

  } catch (err) {
    if (err.name === 'ArtefactNotFoundError') {
      // avpf-s1: GitHub has no commit for this stage -- das-s1's own AC4
      // treats that as a valid, expected no-op when no repo is connected,
      // not an error. Postgres is this web UI's primary durable store for
      // artefact content (alrf-s4) and may still have it. Best-effort: any
      // failure here (no journey, no DB, cross-tenant) falls through to the
      // existing 404 page unchanged.
      let fallbackContent = null;
      try {
        const journey = _journeyStore.getJourneyByFeatureSlug(slug);
        const tenantId = req.session.tenantId;
        // ADR-025 / mtrr-s1: never serve another tenant's artefact content.
        if (journey && !(journey.tenantId && journey.tenantId !== tenantId)) {
          const pgArtefacts = await _journeyStore.getArtefactsForJourney(journey.journeyId);
          const match = (pgArtefacts || []).find((a) => a.skill_name === artefactType);
          if (match && match.content) fallbackContent = match.content;
        }
      } catch (_fallbackErr) {
        fallbackContent = null;
      }

      if (fallbackContent) {
        const meta = extractMetadata(fallbackContent);
        const html = renderArtefactToHTML(fallbackContent, meta);

        _logger.info('artefact_read', {
          userId:       req.session.userId,
          featureSlug:  slug,
          artefactType,
          source:       'postgres-fallback',
          timestamp:    new Date().toISOString()
        });

        const bodyContent = `<div class="sw-doc">${html}</div>`;
        const page = await renderShellWithNav(pool, req.session.tenantId, {
          title:       `${shellEscHtml(artefactType)} — ${shellEscHtml(slug)}`,
          bodyContent,
          user:        { login: req.session.login || '' }
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(page);
        return;
      }

      const page = renderShell({
        title:       'Artefact Not Found',
        bodyContent: '<p>artefact not found</p>',
        user:        { login: (req.session && req.session.login) || '' }
      });
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(page);
    } else {
      // ArtefactFetchError or unexpected error — log technical detail, surface human message
      _logger.warn('artefact_fetch_error', { error: err.cause || err.message });
      const page = renderShell({
        title:       'Error',
        bodyContent: '<p>Unable to load artefact — please try again</p>',
        user:        { login: (req.session && req.session.login) || '' }
      });
      res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(page);
    }
  }
}

module.exports = { handleArtefactRoute, setLogger, setFetcher, setJourneyStore };
