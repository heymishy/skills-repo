'use strict';

// features.js — route handlers for feature navigation (AC1–AC5)
// GET /features       → feature list (JSON or HTML via content-type negotiation)
// GET /features/:slug → artefact index for a feature (wuce.20: HTML + JSON)

const {
  listFeatures,
  setAuditLogger: setFeatureListLogger
} = require('../adapters/feature-list');

const {
  listArtefacts: _listArtefactsDefault
} = require('../adapters/artefact-list');

const { renderShell, escHtml } = require('../utils/html-shell');
const shellEscHtml = escHtml; // internal alias used by artefact-index handlers
const { getLabel } = require('../utils/artefact-labels');

// listArtefacts dependency — replaceable in tests via setListArtefacts()
let _listArtefacts = _listArtefactsDefault;

function setListArtefacts(fn) { _listArtefacts = fn; }

// Audit logger — replaced via setAuditLogger() in tests
let _logger = {
  info: (/* event, data */) => {}
};

function setAuditLogger(logger) {
  _logger = logger;
  setFeatureListLogger(logger);
}

/**
 * Render a feature list as HTML for browser display.
 * All stage labels are plain-language.
 * @param {Array<{ slug, stage, lastUpdated, artefactIndexUrl }>} features
 * @returns {string} HTML string
 */
function renderFeatureList(features) {
  if (!features || features.length === 0) {
    return '<ul class="feature-list"><li class="feature-list__empty">No features found</li></ul>';
  }
  const items = features.map((f) => {
    const stage       = f.stage       || '';
    const lastUpdated = f.lastUpdated || '';
    const indexUrl    = f.artefactIndexUrl || `/features/${f.slug}`;
    return `<li class="feature-list__item">` +
      `<span class="feature-list__slug">${escHtml(f.slug)}</span>` +
      `<span class="feature-list__stage">${escHtml(stage)}</span>` +
      `<span class="feature-list__updated">${escHtml(lastUpdated)}</span>` +
      `<a class="feature-list__link" href="${escHtml(indexUrl)}">View artefacts</a>` +
      `</li>`;
  }).join('');
  return `<ul class="feature-list">${items}</ul>`;
}

/**
 * Render an artefact index item as HTML.
 * type field is expected to already be a plain-language label (AC2).
 * @param {{ type: string, name: string, viewUrl: string }} artefact
 * @returns {string}
 */
function renderArtefactItem(artefact) {
  const type    = artefact.type    || 'Artefact';
  const name    = artefact.name    || '';
  const viewUrl = artefact.viewUrl || '#';
  return `<li class="artefact-list__item">` +
    `<span class="artefact-list__type">${escHtml(type)}</span>` +
    `<a class="artefact-list__link" href="${escHtml(viewUrl)}">${escHtml(name)}</a>` +
    `</li>`;
}

/**
 * GET /features — return feature list for configured repositories.
 * Content-type negotiation: Accept: text/html → HTML shell; otherwise → JSON.
 * Requires authentication — unauthenticated requests redirect to /auth/github.
 */
async function handleGetFeatures(req, res) {
  const token  = req.session && req.session.accessToken;
  const userId = req.session && req.session.userId;
  const login  = req.session && req.session.login;

  if (!token) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }

  const features = await listFeatures(token);
  const accept   = (req.headers && req.headers['accept']) || '';

  // Audit log: userId, route, featureCount, timestamp — no token (NFR1)
  _logger.info('feature_list_accessed', {
    userId,
    route:        '/features',
    featureCount: features.length,
    timestamp:    new Date().toISOString()
  });

  if (accept.includes('text/html')) {
    // HTML path: wrap feature list in renderShell
    let bodyContent;
    if (features.length === 0) {
      // AC3: zero features — empty-state message, no empty <ul>
      bodyContent = '<p class="no-features">No features found</p>';
    } else {
      bodyContent = renderFeatureList(features);
    }
    const html = renderShell({ title: 'Features', bodyContent, user: { login } });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // JSON path: backward-compatible, shape unchanged
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(features));
}

/**
 * Build HTML for a list of artefacts for the artefact index page (wuce.20).
 * Calls renderArtefactItem() for each item and inserts the creation date.
 * Returns empty-state message if artefacts array is empty.
 * @param {Array} artefacts  e.g. [{ type, createdAt, path }, ...]
 * @param {string} featureSlug
 * @returns {string} HTML string
 */
function renderArtefactIndexHtml(artefacts, featureSlug) {
  if (!artefacts || artefacts.length === 0) {
    return '<p class="artefact-list__empty">No artefacts found for this feature</p>';
  }
  const items = artefacts.map((a) => {
    const label   = getLabel(a.type || '');
    const viewUrl = `/artefact/${featureSlug}/${a.type || ''}`;
    const base    = renderArtefactItem({ type: label, name: a.path || '', viewUrl });
    // Insert creation date before closing </li>
    const date    = shellEscHtml(a.createdAt || '');
    return base.slice(0, -5) + `<time class="artefact-list__date">${date}</time></li>`;
  }).join('');
  return `<ul class="artefact-list">${items}</ul>`;
}

/**
 * GET /features/:featureSlug — return artefact index for a feature.
 * wuce.20: content-type negotiation:
 *   Accept: text/html → renderShell wrapping artefact list HTML
 *   Accept: application/json or absent → JSON unchanged (backward-compatible)
 * authGuard: unauthenticated → 302 /auth/github
 */
async function handleGetFeatureArtefacts(req, res, featureSlug) {
  const token  = req.session && req.session.accessToken;
  const userId = req.session && req.session.userId;

  if (!token) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }

  const acceptsHtml = (req.headers && typeof req.headers.accept === 'string')
    ? req.headers.accept.includes('text/html')
    : false;

  const { artefacts, grouped, noArtefacts } = await _listArtefacts(featureSlug, token);

  // Audit log: userId, route, featureSlug, timestamp — no token
  _logger.info('feature_artefacts_accessed', {
    userId,
    route: '/features/:slug',
    featureSlug,
    timestamp: new Date().toISOString()
  });

  if (acceptsHtml) {
    const listHtml = noArtefacts
      ? '<p class="artefact-list__empty">No artefacts found for this feature</p>'
      : renderArtefactIndexHtml(artefacts, featureSlug);
    const bodyContent = `<h1>${shellEscHtml(featureSlug)}</h1>\n${listHtml}`;
    const html = renderShell({
      title:       `Artefacts — ${shellEscHtml(featureSlug)}`,
      bodyContent,
      user:        { login: req.session.login || '' }
    });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (noArtefacts) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'No artefacts found' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ featureSlug, artefacts, grouped }));
}

module.exports = {
  handleGetFeatures,
  handleGetFeatureArtefacts,
  setAuditLogger,
  setListArtefacts,
  renderFeatureList,
  renderArtefactItem,
  renderArtefactIndexHtml,
  escHtml
};
