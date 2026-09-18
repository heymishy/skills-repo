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
// dsa-s1 Task 4: server-side sign-off detection + comments sidebar for the
// artefact viewer's two-column restyle.
const { detectExistingSignOff }                                     = require('../adapters/sign-off-writer');
const { listCommentsForResource }                                   = require('../modules/artefact-comments');
const _csrf                                                         = require('../middleware/csrf');

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

// dsa-s1 Task 4: shared two-column body-content builder (doc + Sign-off/Comments
// sidebar), used by both render paths in handleArtefactRoute below -- the
// primary GitHub-sourced success path and the Postgres-fallback success path.
// Kept as one helper (rather than duplicating the markup block twice) so both
// paths stay in lockstep by construction.
async function _buildArtefactBodyContent(req, pool, slug, artefactType, markdown, html) {
  const signOffStatus = detectExistingSignOff(markdown);
  const comments = await listCommentsForResource(pool, 'artefact', slug + '/' + artefactType);
  const csrfToken = await _csrf.generateCsrfToken(req);

  const signOffCardHtml = signOffStatus
    ? '<div class="sw-signoff-card">' +
        '<h3>Sign-off</h3>' +
        '<p><strong>' + shellEscHtml(signOffStatus.approver) + '</strong></p>' +
        '<p style="color:var(--muted);font-size:13px">' + shellEscHtml(signOffStatus.date) + '</p>' +
      '</div>'
    : '<div class="sw-signoff-card">' +
        '<h3>Sign-off</h3>' +
        '<button type="button" id="sign-off-btn" data-artefact-path="' + shellEscHtml('artefacts/' + slug + '/' + artefactType + '.md') + '" data-csrf-token="' + shellEscHtml(csrfToken) + '" class="sw-btn sw-btn--primary">Sign Off</button>' +
        '<div id="sign-off-error" style="color:var(--danger);font-size:13px;margin-top:8px"></div>' +
      '</div>';

  const commentsListHtml = comments.length === 0
    ? '<p id="comments-empty-state" style="color:var(--muted)">No comments yet</p>'
    : '<ul id="comments-list" style="list-style:none;padding:0">' +
        comments.map(function(c) {
          // dsa-s1 Task 4 review-fixup: listCommentsForResource returns raw pg
          // rows (snake_case columns), not camelCase -- see every other caller
          // in this codebase (server.js ~2722-2747, products.js ~4294-4296),
          // which all explicitly map row.user_id/row.created_at. Using
          // c.userId/c.createdAt here would silently render `undefined`.
          return '<li style="padding:8px 0;border-bottom:1px solid var(--line-2)">' +
            '<strong>' + shellEscHtml(c.user_id) + '</strong> ' +
            '<span style="color:var(--muted);font-size:12px">' + shellEscHtml(String(c.created_at)) + '</span>' +
            '<p>' + shellEscHtml(c.body) + '</p>' +
          '</li>';
        }).join('') +
      '</ul>';

  const commentsCardHtml =
    '<div class="sw-comments-card" data-resource-type="artefact" data-resource-id="' + shellEscHtml(slug + '/' + artefactType) + '" data-csrf-token="' + shellEscHtml(csrfToken) + '">' +
      '<h3>Comments</h3>' +
      '<div id="comments-list-container">' + commentsListHtml + '</div>' +
      '<textarea id="comment-input" placeholder="Add a comment..." style="width:100%;margin-top:12px"></textarea>' +
      '<button type="button" id="comment-submit-btn" class="sw-btn sw-btn--secondary">Post Comment</button>' +
      '<div id="comment-error" style="color:var(--danger);font-size:13px;margin-top:8px"></div>' +
    '</div>';

  return (
    '<div class="sw-artefact-layout" style="display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:24px">' +
      '<div class="sw-doc" style="font-family:var(--serif)">' + html + '</div>' +
      '<div class="sw-artefact-sidebar" style="display:flex;flex-direction:column;gap:16px">' +
        signOffCardHtml +
        commentsCardHtml +
      '</div>' +
    '</div>' +
    '<script src="/public/artefact-sidebar.js"></script>'
  );
}

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

    const bodyContent = await _buildArtefactBodyContent(req, pool, slug, artefactType, markdown, html);
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

        // dsa-s1 Task 4 review-fixup: _buildArtefactBodyContent/renderShellWithNav
        // can reject here (e.g. listCommentsForResource/generateCsrfToken), and
        // this block sits inside the outer catch with no further handler below
        // it -- an unwrapped rejection here would skip this function's own
        // styled error page and fall through to server.js's generic 500,
        // unlike the primary success path (which has the same failure mode
        // covered by the outer try/catch). Wrap for parity with that path and
        // with the 503 branch a few lines below.
        try {
          const bodyContent = await _buildArtefactBodyContent(req, pool, slug, artefactType, fallbackContent, html);
          const page = await renderShellWithNav(pool, req.session.tenantId, {
            title:       `${shellEscHtml(artefactType)} — ${shellEscHtml(slug)}`,
            bodyContent,
            user:        { login: req.session.login || '' }
          });
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(page);
          return;
        } catch (renderErr) {
          _logger.warn('artefact_fetch_error', { error: renderErr.cause || renderErr.message });
          const page = renderShell({
            title:       'Error',
            bodyContent: '<p>Unable to load artefact — please try again</p>',
            user:        { login: (req.session && req.session.login) || '' }
          });
          res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(page);
          return;
        }
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

module.exports = { handleArtefactRoute, setLogger, setFetcher, setJourneyStore, _buildArtefactBodyContent };
