'use strict';

// artefact.js — Route handler for GET /artefact/:slug/:type
// Fetches a pipeline artefact from GitHub, renders it as sanitised HTML prose.
// ADR-012: fetching delegated to artefact-fetcher adapter — no inline API calls here.

const { fetchArtefact, ArtefactNotFoundError, ArtefactFetchError } = require('../adapters/artefact-fetcher');
const { renderArtefactToHTML, extractMetadata }                    = require('../utils/markdown-renderer');
const { renderShell, escHtml: shellEscHtml }                       = require('../utils/html-shell');
const journeyStoreDefault                                          = require('../modules/journey-store');
// cat-s5 Task 2 review-fixup: without this, handleArtefactRoute never has a
// local repoRoot to pass into fetchArtefact, so Task 2's trace-based
// bare-name resolution can never fire on a real HTTP request -- see this
// story's plan.md "Task 2 review finding" section. Mirrors features.js's own
// identical `const repoRoot = getRepoRoot(req);` usage.
const { getRepoRoot }                                               = require('../adapters/repo-root');
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
  // cat-s5 Task 2 review-fixup: repoRoot is required for Task 2's
  // trace-based bare-name resolution inside fetchArtefact to engage at all.
  const repoRoot = getRepoRoot(req);

  try {
    const markdown = await _fetchArtefact(slug, artefactType, token, undefined, undefined, repoRoot);
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

      // cat-s5 AC3/AC4: distinguish an orphaned-registration 404 (registered
      // in pipeline-state.json but genuinely has no matching file on disk)
      // from a plain never-registered 404, but only after the postgres-
      // fallback attempt above has also come up empty -- the fallback stays
      // the first-tried content source either way (AC4: postgres-fallback
      // contract unchanged). ArtefactNotFoundError's own class/constructor
      // and the surrounding renderShell/writeHead/res.end calls are
      // untouched; only the body text is now conditional on the new
      // err.orphanedRegistration property.
      const notFoundBody = err.orphanedRegistration
        ? '<p>This document is registered but the file could not be found — it may have been renamed or removed.</p>'
        : '<p>artefact not found</p>';
      const page = renderShell({
        title:       'Artefact Not Found',
        bodyContent: notFoundBody,
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
