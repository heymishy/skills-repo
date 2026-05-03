'use strict';

// features.js — route handlers for feature navigation (AC1–AC5)
// GET /features       → feature list (JSON or HTML via content-type negotiation)
// GET /features/:slug → artefact index for a feature

const {
  listFeatures,
  setAuditLogger: setFeatureListLogger
} = require('../adapters/feature-list');

const {
  listArtefacts
} = require('../adapters/artefact-list');

const { renderShell, escHtml } = require('../utils/html-shell');

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
 * GET /features/:featureSlug — return artefact index for a feature.
 * AC2: all type fields use plain-language labels.
 * AC5: missing artefacts directory returns { message: "No artefacts found" }.
 */
async function handleGetFeatureArtefacts(req, res, featureSlug) {
  const token  = req.session && req.session.accessToken;
  const userId = req.session && req.session.userId;

  if (!token) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  const { artefacts, grouped, noArtefacts } = await listArtefacts(featureSlug, token);

  // Audit log: userId, featureSlug, timestamp — no token
  _logger.info('feature_artefacts_accessed', {
    userId,
    featureSlug,
    timestamp: new Date().toISOString()
  });

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
  renderFeatureList,
  renderArtefactItem,
  escHtml
};
