'use strict';

// features.js — route handlers for feature navigation (AC1–AC5)
// GET /features            → feature list (JSON or HTML via content-type negotiation)
// GET /features?view=board → Kanban board (HTML only)
// GET /features/:slug      → artefact index for a feature (wuce.20: HTML + JSON)
// GET  /api/ideas          → ideas backlog (JSON)
// POST /api/ideas          → create idea (JSON body: { title, notes? })
// DELETE /api/ideas/:id    → remove idea

const fs   = require('fs');
const path = require('path');

const {
  setAuditLogger: setFeatureListLogger
} = require('../adapters/feature-list');

const {
  listArtefacts: _listArtefactsDefault
} = require('../adapters/artefact-list');

const { renderShell, escHtml } = require('../utils/html-shell');
const shellEscHtml = escHtml; // internal alias used by artefact-index handlers
const { getLabel } = require('../utils/artefact-labels');

// frsr-s1 — journey store, for resolving which session (if any) produced
// each completed stage's artefact, so the artefact-index page can offer a
// "Resume conversation" link alongside the existing "View" link. Real
// require by default (same pattern as routes/journey.js's _journeyStore);
// overridable in tests via setJourneyStoreModule().
let _journeyStore = require('../modules/journey-store');
function setJourneyStoreModule(mod) { _journeyStore = mod; }

const IDEAS_PATH = path.join(__dirname, '..', '..', '..', 'workspace', 'ideas.json');

function _readIdeas() {
  try {
    return JSON.parse(fs.readFileSync(IDEAS_PATH, 'utf8'));
  } catch (_) {
    return { ideas: [] };
  }
}

function _writeIdeas(data) {
  fs.writeFileSync(IDEAS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

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
 * frsr-s1 (AC2/AC3) — resolve which session (if any) produced each of a
 * feature's completed stages, keyed by the stage's artefactPath (the same
 * repo-relative path _listArtefacts returns as a.path, since both trace
 * back to the same real artefact file on disk). Called once per
 * /features/:slug render, not once per artefact row (NFR-Performance).
 * @param {string} featureSlug
 * @returns {Object<string, {skillName: string, sessionId: string}>}
 */
function _resolveResumeLinksForFeature(featureSlug) {
  const lookup = {};
  const journey = _journeyStore.getJourneyByFeatureSlug(featureSlug);
  if (!journey) return lookup;
  (journey.completedStages || []).forEach((stage) => {
    if (stage.sessionId && stage.artefactPath) {
      lookup[stage.artefactPath] = { skillName: stage.skillName, sessionId: stage.sessionId };
    }
  });
  return lookup;
}

/**
 * Build HTML for a list of artefacts for the artefact index page (wuce.20).
 * Calls renderArtefactItem() for each item and inserts the creation date.
 * Returns empty-state message if artefacts array is empty.
 * @param {Array} artefacts  e.g. [{ type, createdAt, path }, ...]
 * @param {string} featureSlug
 * @param {Object<string, {skillName: string, sessionId: string}>} [resumeLookup]
 *   frsr-s1 (AC3) — from _resolveResumeLinksForFeature; when an artefact's
 *   path has a resolvable session, a second "Resume conversation" link is
 *   added alongside the existing "View" link.
 * @returns {string} HTML string
 */
function renderArtefactIndexHtml(artefacts, featureSlug, resumeLookup) {
  if (!artefacts || artefacts.length === 0) {
    return '<p class="artefact-list__empty">No artefacts found for this feature</p>';
  }
  resumeLookup = resumeLookup || {};

  // Group artefacts by plain-language label
  const groups = {};
  const groupOrder = [];
  artefacts.forEach((a) => {
    const label = getLabel(a.type || '');
    if (!groups[label]) { groups[label] = []; groupOrder.push(label); }
    groups[label].push(a);
  });

  return groupOrder.map((label) => {
    const items = groups[label].map((a) => {
      const fileSlug = (a.path || '').split('/').pop().replace(/\.md$/, '') || (a.type || '');
      const viewUrl  = `/artefact/${featureSlug}/${fileSlug}`;
      const base     = renderArtefactItem({ type: label, name: a.path || '', viewUrl });
      const date     = shellEscHtml(a.createdAt || '');
      const resumable = resumeLookup[a.path || ''];
      const resumeLink = resumable
        ? ` <a class="artefact-list__resume-link" href="/skills/${encodeURIComponent(resumable.skillName)}/sessions/${encodeURIComponent(resumable.sessionId)}/chat">Resume conversation</a>`
        : '';
      return base.slice(0, -5) + `<time class="artefact-list__date">${date}</time>${resumeLink}</li>`;
    }).join('');
    return `<div class="sw-card"><h2 class="sw-section-title">${shellEscHtml(label)}</h2><ul class="artefact-list">${items}</ul></div>`;
  }).join('');
}

/**
 * GET /features/:featureSlug — return artefact index for a feature.
 * wuce.20: content-type negotiation:
 *   Accept: text/html → renderShell wrapping artefact list HTML
 *   Accept: application/json or absent → JSON unchanged (backward-compatible)
 * authGuard: unauthenticated html → 302 /auth/github; API → 401 NOT_AUTHENTICATED
 */
async function handleGetFeatureArtefacts(req, res, featureSlug) {
  const token  = req.session && req.session.accessToken;
  const userId = req.session && req.session.userId;

  if (!token) {
    const artefactAccept = (req.headers && req.headers['accept']) || '';
    if (artefactAccept.includes('text/html')) {
      res.writeHead(302, { Location: '/auth/github' });
      res.end();
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'NOT_AUTHENTICATED' }));
    }
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
    // frsr-s1 (NFR-Performance): one lookup per page render, not per artefact row.
    const resumeLookup = noArtefacts ? {} : _resolveResumeLinksForFeature(featureSlug);
    const listHtml = noArtefacts
      ? '<p class="artefact-list__empty">No artefacts found for this feature</p>'
      : renderArtefactIndexHtml(artefacts, featureSlug, resumeLookup);
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

/**
 * GET /api/ideas — return the ideas backlog as JSON.
 */
function handleGetIdeas(req, res) {
  const data = _readIdeas();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * POST /api/ideas — create a new idea.
 * Body: { title: string, notes?: string }
 */
async function handlePostIdea(req, res) {
  let body = '';
  await new Promise(function(resolve) {
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', resolve);
  });
  let parsed;
  try { parsed = JSON.parse(body); } catch (_) { parsed = {}; }
  const title = (parsed.title || '').toString().slice(0, 120).trim();
  if (!title) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'title is required' }));
    return;
  }
  const data = _readIdeas();
  const idea = {
    id:        'idea-' + Date.now(),
    title,
    notes:     (parsed.notes || '').toString().slice(0, 500).trim(),
    createdAt: new Date().toISOString()
  };
  data.ideas.push(idea);
  _writeIdeas(data);
  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(idea));
}

/**
 * DELETE /api/ideas/:id — remove an idea by id.
 */
function handleDeleteIdea(req, res, ideaId) {
  const data  = _readIdeas();
  const before = data.ideas.length;
  data.ideas   = data.ideas.filter(function(i) { return i.id !== ideaId; });
  if (data.ideas.length === before) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
    return;
  }
  _writeIdeas(data);
  res.writeHead(204);
  res.end();
}

module.exports = {
  handleGetFeatureArtefacts,
  handleGetIdeas,
  handlePostIdea,
  handleDeleteIdea,
  setAuditLogger,
  setListArtefacts,
  setJourneyStoreModule,
  renderFeatureList,
  renderArtefactItem,
  renderArtefactIndexHtml,
  escHtml
};
