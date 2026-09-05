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

const { getRepoRoot } = require('../adapters/repo-root');

const { getFeatureStoryStructure, groupArtefactsByStory } = require('../adapters/feature-story-structure');

const { escHtml } = require('../utils/html-shell');
// pncg-s1: renderShell's direct import was removed here -- handleGetFeatureArtefacts
// (its only caller in this file) now goes through renderShellWithNav below,
// which wraps renderShell itself. Shared Products-nav sidebar wrapper -- see
// products.js's own renderShellWithNav docblock. products.js does not
// require features.js, so this creates no circular dependency.
const { renderShellWithNav } = require('./products');
const { generateCsrfToken, csrfField } = require('../middleware/csrf');
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

function _readIdeasFile() {
  try {
    return JSON.parse(fs.readFileSync(IDEAS_PATH, 'utf8'));
  } catch (_) {
    return { ideas: [] };
  }
}

function _writeIdeasFile(data) {
  fs.writeFileSync(IDEAS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// idp-s1 — injectable ideas store (D37). Unlike the usual D37 pattern, the
// DEFAULT here is the existing, already-working file-based implementation
// (not a throw-stub) -- see artefacts/2026-07-29-ideas-postgres-persistence/
// decisions.md for why: this default is a legitimate, already-correct
// fallback for any environment without DATABASE_URL, not a stub masking a
// real problem. setIdeasStore() overrides it with the real Postgres-backed
// implementation once DATABASE_URL is set (server.js).
let _ideasStore = {
  listIdeas: async function () { return _readIdeasFile(); },
  createIdea: async function (fields) {
    const data = _readIdeasFile();
    const idea = {
      id:        'idea-' + Date.now(),
      title:     fields.title,
      notes:     fields.notes || '',
      createdAt: new Date().toISOString(),
    };
    data.ideas.push(idea);
    _writeIdeasFile(data);
    return idea;
  },
  deleteIdea: async function (id) {
    const data   = _readIdeasFile();
    const before = data.ideas.length;
    data.ideas   = data.ideas.filter(function (i) { return i.id !== id; });
    if (data.ideas.length === before) return { deleted: false };
    _writeIdeasFile(data);
    return { deleted: true };
  },
};

function setIdeasStore(store) { _ideasStore = store; }

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
    `<span class="artefact-list__type">${escHtml(type)}: </span>` +
    `<a class="artefact-list__link" href="${escHtml(viewUrl)}">${escHtml(name)}</a>` +
    `</li>`;
}

/**
 * frsr-s1 (AC2/AC3) — resolve which session (if any) produced each of a
 * feature's completed stages, keyed by the stage's artefactPath (the same
 * repo-relative path _listArtefacts returns as a.path, since both trace
 * back to the same real artefact file on disk). Called once per
 * /features/:slug render, not once per artefact row (NFR-Performance).
 * fdn-s1: takes the already-fetched journey object (not a featureSlug),
 * so the caller's own single getJourneyByFeatureSlug lookup (also needed
 * for displayName) isn't duplicated -- see NFR-Performance test.
 * dsh-s4 (AC1): also carries the journey's own journeyId in each entry, so
 * renderArtefactIndexHtml can build the "Resume conversation" link's href
 * as /journey/:journeyId/stage/:stageName (dsh-s3's rebuilt route) instead
 * of the old /skills/:skillName/sessions/:sessionId/chat, which 404s once
 * a session is gone from both memory and Redis.
 * @param {object|null} journey
 * @returns {Object<string, {skillName: string, sessionId: string, journeyId: string}>}
 */
function _resolveResumeLinksForFeature(journey) {
  const lookup = {};
  if (!journey) return lookup;
  (journey.completedStages || []).forEach((stage) => {
    if (stage.sessionId && stage.artefactPath) {
      lookup[stage.artefactPath] = { skillName: stage.skillName, sessionId: stage.sessionId, journeyId: journey.journeyId };
    }
  });
  return lookup;
}

// pdt-s4 (AC1, AC1a): resolves the breadcrumb context for a story detail
// page. Two paths:
//  - Direct: journeyForPage.productId already resolved (the common case,
//    AC1) -- one minimal query to turn the ID into a display name.
//  - Reverse lookup: journeyForPage has no productId (an epic-nested story
//    slug, e.g. dic.5, is never itself a journeyStore feature slug -- AC1a)
//    -- scan this tenant's already-synced taxonomy for a matching nested
//    story item, giving Product + Phase/Epic together in one query.
//    Explicitly tenant-scoped (bri-s3.4's own precedent in products.js) --
//    never leak a match from another tenant's product.
// fal-s1: shared resolver for both the breadcrumb (pdt-s4) and the
// artefact-fetch path. journeyForPage.productId already resolving is the
// fast path (a genuine top-level feature, the common case) -- no taxonomy
// scan runs in that case, matching pdt-s4's own established NFR-Performance
// behaviour. Otherwise runs the tenant-scoped reverse lookup across this
// tenant's synced taxonomy once, returning the matched item's real
// featureSlug alongside the breadcrumb's product/epic context. resolvedSlug
// falls back to the raw featureSlug unchanged when nothing resolves, so
// callers needing "the real slug to look artefacts up under" always get a
// usable value.
async function _resolveFeatureContext(featureSlug, journeyForPage, pool, tenantId) {
  if (journeyForPage && journeyForPage.productId) {
    const direct = (await pool.query(
      'SELECT name FROM products WHERE product_id = $1 AND tenant_id = $2',
      [journeyForPage.productId, tenantId]
    )).rows[0];
    const breadcrumb = direct ? { productId: journeyForPage.productId, productName: direct.name, epicName: null } : null;
    return { breadcrumb: breadcrumb, resolvedSlug: featureSlug };
  }

  const rows = (await pool.query(
    'SELECT p.product_id, p.name, pr.taxonomy FROM product_rollups pr JOIN products p ON p.product_id = pr.product_id WHERE p.tenant_id = $1',
    [tenantId]
  )).rows;
  for (let i = 0; i < rows.length; i++) {
    const taxonomy = (typeof rows[i].taxonomy === 'string') ? JSON.parse(rows[i].taxonomy) : rows[i].taxonomy;
    const groups = (taxonomy && taxonomy.groups) || [];
    for (let g = 0; g < groups.length; g++) {
      const items = groups[g].items || [];
      for (let it = 0; it < items.length; it++) {
        if (items[it].slug === featureSlug) {
          return {
            breadcrumb: { productId: rows[i].product_id, productName: rows[i].name, epicName: groups[g].epicName },
            resolvedSlug: items[it].featureSlug || featureSlug
          };
        }
      }
    }
  }
  return { breadcrumb: null, resolvedSlug: featureSlug };
}

// pdt-s4 (AC1, AC1a, AC2, AC3): renders the breadcrumb nav -- Product
// (linked) › [Phase/Epic (plain text, no dedicated page)] › story title.
// Degrades to a bare "Back to product list" link (reusing the existing
// /dashboard href from _renderProductView's own breadcrumb) when neither
// resolves -- never a silent failure or a broken/blank breadcrumb (AC1a).
function _renderStoryBreadcrumb(context, displayTitle) {
  if (!context || !context.productId) {
    return '<nav aria-label="Breadcrumb" style="font-size:13px;color:var(--muted);margin-bottom:12px">' +
      '<a href="/dashboard" style="color:var(--muted);text-decoration:none">Back to product list</a>' +
    '</nav>';
  }
  const epicSegment = context.epicName
    ? ' &rsaquo; <span>' + shellEscHtml(context.epicName) + '</span>'
    : '';
  return '<nav aria-label="Breadcrumb" style="font-size:13px;color:var(--muted);margin-bottom:12px">' +
    '<a href="/products/' + shellEscHtml(context.productId) + '" style="color:var(--muted);text-decoration:none">' + shellEscHtml(context.productName) + '</a>' +
    epicSegment +
    ' &rsaquo; <span style="color:var(--ink)">' + shellEscHtml(displayTitle) + '</span>' +
  '</nav>';
}

/**
 * Build HTML for a list of artefacts for the artefact index page (wuce.20).
 * Calls renderArtefactItem() for each item and inserts the creation date.
 * Returns empty-state message if artefacts array is empty.
 * @param {Array} artefacts  e.g. [{ type, createdAt, path }, ...]
 * @param {string} featureSlug
 * @param {Object<string, {skillName: string, sessionId: string, journeyId: string}>} [resumeLookup]
 *   frsr-s1 (AC3) — from _resolveResumeLinksForFeature; when an artefact's
 *   path has a resolvable session, a second "Resume conversation" link is
 *   added alongside the existing "View" link. dsh-s4: the link now points
 *   at dsh-s3's durable /journey/:journeyId/stage/:stageName route rather
 *   than the raw /skills/.../sessions/.../chat route, using journeyId
 *   (also carried in each lookup entry) and the stage's skillName as the
 *   stageName the destination route expects.
 * @returns {string} HTML string
 */
function renderArtefactIndexHtml(artefacts, featureSlug, resumeLookup) {
  if (!artefacts || artefacts.length === 0) {
    return '<p class="artefact-list__empty">No artefacts found for this feature</p>';
  }
  return _renderArtefactListByType(artefacts, featureSlug, resumeLookup);
}

/**
 * fapg-s1: extracted from renderArtefactIndexHtml so both the unchanged
 * single-story rendering and the new multi-story grouped rendering
 * (renderGroupedArtefactIndexHtml) share one implementation of "render this
 * flat artefact list, grouped by plain-language type label" -- no markup
 * duplicated between them. Does not handle the empty-list case itself
 * (callers decide what an empty list means in their own context).
 * @param {Array} artefacts
 * @param {string} featureSlug
 * @param {Object<string, {skillName: string, sessionId: string, journeyId: string}>} [resumeLookup]
 * @returns {string} HTML string
 */
function _renderArtefactListByType(artefacts, featureSlug, resumeLookup) {
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
        ? ` <a class="artefact-list__resume-link" href="/journey/${encodeURIComponent(resumable.journeyId)}/stage/${encodeURIComponent(resumable.skillName)}">Resume conversation</a>`
        : '';
      return base.slice(0, -5) + `<time class="artefact-list__date">${date}</time>${resumeLink}</li>`;
    }).join('');
    return `<div class="sw-card"><h2 class="sw-section-title">${shellEscHtml(label)}</h2><ul class="artefact-list">${items}</ul></div>`;
  }).join('');
}

/**
 * fapg-s1: renders the multi-story (>=2 real stories) case -- feature-level
 * artefacts once, at the top (via the same _renderArtefactListByType a
 * single-story feature already uses), followed by an epic/story accordion
 * using native <details>/<summary> (keyboard- and screen-reader-operable
 * by default, no custom JS state). Each story's own artefacts are rendered
 * via the same shared helper, so a story's own resume-conversation links
 * (naturally rare for standard-track features -- see _resolveResumeLinksForFeature's
 * own doc comment) render identically to how they already do today.
 * @param {{featureLevel: Array, epics: Array<{epicName: string, epicSlug: string, stories: Array<{slug: string, artefacts: Array}>}>, flatStories: Array<{slug: string, artefacts: Array}>}} grouped
 * @param {string} featureSlug
 * @param {Object<string, {skillName: string, sessionId: string, journeyId: string}>} [resumeLookup]
 * @returns {string} HTML string
 */
/**
 * fpux.1: renders one story's own disclosure row inside the grouped
 * epic/story accordion, using the .sw-story-row shared class (html-shell.js)
 * instead of the old inline style="..." attributes -- fixes the visual seam
 * against the feature-level .sw-card list above it.
 * Hoisted out of renderGroupedArtefactIndexHtml (was a closure) so it is
 * independently unit-testable and exported below.
 * @param {{slug: string, artefacts: Array}} story
 * @param {string} featureSlug
 * @param {Object<string, {skillName: string, sessionId: string, journeyId: string}>} [resumeLookup]
 * @returns {string} HTML string, or '' if the story has no artefacts
 */
function renderStory(story, featureSlug, resumeLookup) {
  if (story.artefacts.length === 0) return '';
  return '<details class="sw-story-row">' +
    '<summary>' + shellEscHtml(story.slug) + '</summary>' +
    '<div style="margin-top:8px">' + _renderArtefactListByType(story.artefacts, featureSlug, resumeLookup) + '</div>' +
  '</details>';
}

function renderGroupedArtefactIndexHtml(grouped, featureSlug, resumeLookup) {
  const featureLevelHtml = grouped.featureLevel.length > 0
    ? _renderArtefactListByType(grouped.featureLevel, featureSlug, resumeLookup)
    : '';

  const epicsHtml = grouped.epics.map((epic) => {
    const storiesHtml = epic.stories.map((story) => renderStory(story, featureSlug, resumeLookup)).join('');
    if (!storiesHtml) return '';
    return '<details class="sw-epic-group" open>' +
      '<summary>' + shellEscHtml(epic.epicName || epic.epicSlug || '') + '</summary>' +
      storiesHtml +
    '</details>';
  }).join('');

  const flatStoriesHtml = grouped.flatStories.length > 0
    ? '<details class="sw-epic-group" open>' +
        '<summary>Stories</summary>' +
        grouped.flatStories.map((story) => renderStory(story, featureSlug, resumeLookup)).join('') +
      '</details>'
    : '';

  return featureLevelHtml + epicsHtml + flatStoriesHtml;
}

/**
 * GET /features/:featureSlug — return artefact index for a feature.
 * wuce.20: content-type negotiation:
 *   Accept: text/html → renderShell wrapping artefact list HTML
 *   Accept: application/json or absent → JSON unchanged (backward-compatible)
 * authGuard: unauthenticated html → 302 /auth/github; API → 401 NOT_AUTHENTICATED
 */
async function handleGetFeatureArtefacts(req, res, featureSlug, pool) {
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

  const repoRoot = getRepoRoot(req);
  // frsr-s1 (NFR-Performance): one lookup per page render, not per artefact
  // row. fdn-s1: the same single lookup also supplies displayName, so it
  // isn't fetched a second time. alrf-s4: also feeds the Postgres artefact-
  // content fallback below, so this stays a single lookup for that too.
  // fal-s1: journeyForPage (raw slug) still drives the fast-path check and
  // displayTitle -- an epic-nested story's own slug is never itself a
  // journeyStore feature, so this intentionally stays null/unresolved for
  // that case, preserving the existing "shows the raw story ID" breadcrumb
  // behaviour (a separate, out-of-scope enhancement to change).
  const journeyForPage = _journeyStore.getJourneyByFeatureSlug(featureSlug);
  // fal-s1: resolve the real feature slug once -- reused for both the
  // artefact fetch below and the breadcrumb render further down, so the
  // taxonomy-scan query never runs twice for one request. Only run for the
  // HTML branch: the JSON API response never renders a breadcrumb, and some
  // existing callers (alrf-s4's own AC5/AC6 tests) invoke this handler with
  // no pool at all for a JSON request -- confirmed via direct code reading
  // that pool was previously only ever touched inside the acceptsHtml
  // branch (via the old _resolveBreadcrumbContext), so keeping the taxonomy
  // scan HTML-only preserves that exactly, no new risk for the JSON path.
  let breadcrumbContext = null;
  let resolvedSlug = featureSlug;
  if (acceptsHtml) {
    const resolved = await _resolveFeatureContext(featureSlug, journeyForPage, pool, req.session.tenantId);
    breadcrumbContext = resolved.breadcrumb;
    resolvedSlug = resolved.resolvedSlug;
  }
  // fal-s1: when the raw slug didn't resolve directly but the taxonomy scan
  // found the real parent feature, re-fetch under that real slug so the
  // Postgres artefact fallback and "Resume conversation" links use the
  // story's real journey, not the (correctly) unresolved raw-slug lookup.
  const artefactJourney = (resolvedSlug !== featureSlug) ? _journeyStore.getJourneyByFeatureSlug(resolvedSlug) : journeyForPage;
  let pgArtefactRows = [];
  if (artefactJourney && artefactJourney.journeyId) {
    try {
      pgArtefactRows = await _journeyStore.getArtefactsForJourney(artefactJourney.journeyId);
    } catch (_) { pgArtefactRows = []; }
  }
  const { artefacts, grouped, noArtefacts } = await _listArtefacts(resolvedSlug, token, repoRoot, pgArtefactRows);

  // Audit log: userId, route, featureSlug, timestamp — no token
  // fal-s1: logs the resolved real feature slug, so the audit trail
  // reflects which artefacts were actually looked up.
  _logger.info('feature_artefacts_accessed', {
    userId,
    route: '/features/:slug',
    featureSlug: resolvedSlug,
    timestamp: new Date().toISOString()
  });

  if (acceptsHtml) {
    const resumeLookup = noArtefacts ? {} : _resolveResumeLinksForFeature(artefactJourney);
    // fal-s1: artefact view links (/artefact/:slug/:type) must point at the
    // real feature directory slug -- the raw slug 404s for an epic-nested
    // story, same class of bug this story fixes for the list lookup itself.
    // fapg-s1: a feature with >=2 real stories (read from the local
    // repoRoot/.github/pipeline-state.json, not a Postgres query -- see
    // getFeatureStoryStructure's own doc comment) gets the grouped
    // epic/story rendering; a feature with 0-1 stories (the common case)
    // renders exactly as it always has, via the unchanged renderArtefactIndexHtml.
    let listHtml;
    if (noArtefacts) {
      listHtml = '<p class="artefact-list__empty">No artefacts found for this feature</p>';
    } else {
      const storyStructure = getFeatureStoryStructure(repoRoot, resolvedSlug);
      const totalStoryCount = storyStructure
        ? storyStructure.epics.reduce((sum, e) => sum + e.storySlugs.length, 0) + storyStructure.flatStorySlugs.length
        : 0;
      listHtml = (storyStructure && totalStoryCount > 1)
        ? renderGroupedArtefactIndexHtml(groupArtefactsByStory(artefacts, storyStructure), resolvedSlug, resumeLookup)
        : renderArtefactIndexHtml(artefacts, resolvedSlug, resumeLookup);
    }
    const displayTitle = (journeyForPage && journeyForPage.displayName) || featureSlug;
    const breadcrumbHtml = _renderStoryBreadcrumb(breadcrumbContext, displayTitle);
    // alrf-s10 — operator-requested: a real "Delete this feature" action, for
    // cleaning up stale/corrupted staging data (e.g. a feature whose
    // artefacts were mis-recorded under another feature's slug before
    // alrf-s8's fix). Only rendered when a real journey was resolved for
    // this slug -- nothing to delete otherwise. Hard delete, wuce-side data
    // only; confirm() before the destructive fetch, same pattern as
    // products.js's module-delete button.
    // dfr-s1: redirect back to the feature's own product page after a
    // successful delete, not the generic /journey list -- falls back to
    // /journey only when productId is genuinely unresolvable (AC3), never
    // to /products/undefined.
    const deletePostRedirect = (journeyForPage && journeyForPage.productId)
      ? '/products/' + journeyForPage.productId
      : '/journey';
    const deleteSectionHtml = (journeyForPage && journeyForPage.journeyId) ? [
      '<div style="margin:12px 0">',
        '<button type="button" id="alrf-s10-delete-feature-btn" style="padding:6px 14px;background:var(--red-soft);color:var(--red);border:1px solid var(--red);border-radius:6px;font-size:13px;font-weight:500;cursor:pointer">Delete this feature</button>',
        '<span id="alrf-s10-delete-error" style="color:var(--red);font-size:13px;margin-left:8px;display:none"></span>',
      '</div>',
      '<script>(function(){',
        'var btn=document.getElementById("alrf-s10-delete-feature-btn");',
        'var errEl=document.getElementById("alrf-s10-delete-error");',
        'if(!btn)return;',
        'btn.addEventListener("click",function(){',
          'if(!confirm(' + JSON.stringify('Delete "' + displayTitle + '"? This permanently removes its artefacts and journey record. This cannot be undone.') + '))return;',
          'fetch(' + JSON.stringify('/api/journey/' + journeyForPage.journeyId) + ',{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({_csrf:' + JSON.stringify(await generateCsrfToken(req)) + '})})',
            '.then(function(r){if(!r.ok){return r.json().then(function(j){throw new Error((j&&j.error)||("Request failed ("+r.status+")"));});}return r.json();})',
            '.then(function(){window.location.href=' + JSON.stringify(deletePostRedirect) + ';})',
            '.catch(function(e){if(errEl){errEl.textContent=e.message;errEl.style.display="inline";}});',
        '});',
      '})()<\/script>'
    ].join('') : '';
    const bodyContent = `${breadcrumbHtml}\n<h1>${shellEscHtml(displayTitle)}</h1>\n${deleteSectionHtml}\n${listHtml}`;
    const html = await renderShellWithNav(pool, req.session.tenantId, {
      title:       `Artefacts — ${shellEscHtml(displayTitle)}`,
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
async function handleGetIdeas(req, res) {
  const data = await _ideasStore.listIdeas();
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
  const idea = await _ideasStore.createIdea({
    title,
    notes: (parsed.notes || '').toString().slice(0, 500).trim(),
  });
  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(idea));
}

/**
 * DELETE /api/ideas/:id — remove an idea by id.
 */
async function handleDeleteIdea(req, res, ideaId) {
  const result = await _ideasStore.deleteIdea(ideaId);
  if (!result.deleted) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
    return;
  }
  res.writeHead(204);
  res.end();
}

module.exports = {
  handleGetFeatureArtefacts,
  handleGetIdeas,
  handlePostIdea,
  handleDeleteIdea,
  setIdeasStore,
  setAuditLogger,
  setListArtefacts,
  setJourneyStoreModule,
  renderFeatureList,
  renderArtefactItem,
  renderArtefactIndexHtml,
  renderGroupedArtefactIndexHtml,
  renderStory,
  escHtml
};
