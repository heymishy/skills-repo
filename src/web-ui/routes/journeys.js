'use strict';

// journeys.js — ep1-s1: customer journey entity creation (POST /journeys) and
// canvas shell (GET /journeys/:id). Plural filename deliberately distinct
// from the existing routes/journey.js (singular), which is the platform's
// own unrelated outer-loop session-tracking route file -- see ADR-027 and
// artefacts/2026-10-05-customer-journey-as-first-class/design.md.

var { renderShellWithNav } = require('./products');
var { escHtml } = require('../utils/html-shell');
var _csrf = require('../middleware/csrf'); // jcg-s1 -- CSRF guard, matching every other mutating form handler in this app
var _repoRootAdapter = require('../adapters/repo-root'); // ep2-s1 -- reuses the existing local-disk repo-root pattern, already used by products.js

// ep1-s3 -- allowlist of customer_journey_stages columns the side panel may
// PATCH. Never interpolate a client-supplied field name into SQL without
// checking it against this list first.
var STAGE_PATCH_FIELDS = ['description', 'customer_actions', 'touchpoints', 'channel', 'emotion', 'pain_points', 'opportunities', 'moment_of_truth'];
var STAGE_CHANNEL_VALUES = ['web', 'mobile', 'in-person', 'phone', 'email', 'other'];
var STAGE_EMOTION_VALUES = ['positive', 'neutral', 'negative', 'mixed'];

/**
 * POST /journeys — create a new journey, tenant-scoped.
 * Dual response mode: res.status/res.json (test mock) or res.writeHead/res.end (real HTTP).
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 */
async function handlePostJourneys(req, res, _next, pool) {
  // jcg-s1 -- CSRF guard first, matching handlePostProductModule/handlePostGuardrailsForm.
  // csrfGuard reads and caches the body itself; req.body is set by it, no separate read needed.
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var tenantId = req.session && req.session.tenantId;
  var name = (req.body && req.body.name || '').trim();
  var description = (req.body && req.body.description) || null;
  var productId = (req.body && req.body.productId) || null;

  // AC2: no name -> 400, no insert.
  if (!name) {
    if (res.status) { res.status(400).json({ error: 'name is required' }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'name is required' })); }
    return;
  }

  // AC3: req.body's own tenantId (if any) is never used -- only req.session.tenantId.
  var r = await pool.query(
    `INSERT INTO customer_journeys (tenant_id, name, description, product_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [tenantId, name, description, productId]
  );
  var journeyId = r.rows[0].id;

  // AC1: redirect to the canvas shell.
  if (res.status) { res.status(201).json({ id: journeyId }); } // test mock path
  else { res.writeHead(302, { 'Location': '/journeys/' + journeyId }); res.end(); }
}

/**
 * POST /journeys/:id/stages — append a new named stage to a journey, tenant-scoped.
 * Dual response mode: res.status/res.json (test mock) or res.writeHead/res.end (real HTTP).
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 */
async function handlePostJourneyStage(req, res, _next, pool) {
  // ep1-s2 -- CSRF guard first, mandatory from first implementation per jcg-s1's own precedent.
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var tenantId = req.session && req.session.tenantId;
  var journeyId = req.params && req.params.id;
  var name = (req.body && req.body.name || '').trim();

  // Ownership check BEFORE any insert -- 404, not 403, for a cross-tenant
  // journey id, matching handlePostProductModule's own FORBIDDEN-vs-NOT_FOUND policy.
  var jr = await pool.query(
    `SELECT id FROM customer_journeys WHERE id = $1 AND tenant_id = $2`,
    [journeyId, tenantId]
  );
  if (!jr.rows[0]) {
    if (res.status) { res.status(404).json({ error: 'journey not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Journey not found'); }
    return;
  }

  // AC3: no name -> 400, no insert.
  if (!name) {
    if (res.status) { res.status(400).json({ error: 'name is required' }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'name is required' })); }
    return;
  }

  // position is always computed server-side -- never accepted from the request.
  var pr = await pool.query(
    `SELECT COALESCE(MAX(position), -1) AS max_position FROM customer_journey_stages WHERE journey_id = $1`,
    [journeyId]
  );
  var position = (pr.rows[0] ? Number(pr.rows[0].max_position) : -1) + 1;

  var r = await pool.query(
    `INSERT INTO customer_journey_stages (journey_id, tenant_id, name, position)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [journeyId, tenantId, name, position]
  );
  var stageId = r.rows[0].id;

  if (res.status) { res.status(201).json({ id: stageId, name: name, position: position }); }
  else { res.writeHead(201, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ id: stageId, name: name, position: position })); }
}

/**
 * PATCH /journeys/:id/stages/:stageId — autosave one optional stage attribute.
 * Dual response mode: res.status/res.json (test mock) or res.writeHead/res.end (real HTTP).
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 */
async function handlePatchJourneyStage(req, res, _next, pool) {
  // ep1-s3 -- CSRF guard first, mandatory from first implementation per jcg-s1/ep1-s2's own precedent.
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var tenantId = req.session && req.session.tenantId;
  var journeyId = req.params && req.params.id;
  var stageId = req.params && req.params.stageId;
  var field = req.body && req.body.field;
  var value = req.body ? req.body.value : undefined;

  function notFound(msg) {
    if (res.status) { res.status(404).json({ error: msg }); }
    else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end(msg); }
  }
  function badRequest(msg) {
    if (res.status) { res.status(400).json({ error: msg }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: msg })); }
  }

  // Journey ownership check BEFORE any update -- 404, not 403, for a
  // cross-tenant journey id, matching handlePostJourneyStage's own policy.
  var jr = await pool.query(
    `SELECT id FROM customer_journeys WHERE id = $1 AND tenant_id = $2`,
    [journeyId, tenantId]
  );
  if (!jr.rows[0]) { notFound('journey not found'); return; }

  // Stage ownership check -- the stage must belong to THIS journey, not just
  // any journey the tenant owns.
  var sr = await pool.query(
    `SELECT id FROM customer_journey_stages WHERE id = $1 AND journey_id = $2`,
    [stageId, journeyId]
  );
  if (!sr.rows[0]) { notFound('stage not found'); return; }

  // field validated against a fixed allowlist -- never interpolate an
  // unchecked client-supplied column name into SQL.
  if (STAGE_PATCH_FIELDS.indexOf(field) === -1) { badRequest('invalid field'); return; }
  if (field === 'channel' && STAGE_CHANNEL_VALUES.indexOf(value) === -1) { badRequest('invalid channel value'); return; }
  if (field === 'emotion' && STAGE_EMOTION_VALUES.indexOf(value) === -1) { badRequest('invalid emotion value'); return; }
  if (field === 'moment_of_truth') { value = !!value; }

  // field is one of the fixed STAGE_PATCH_FIELDS checked above -- safe to
  // use as the column name here.
  await pool.query(
    'UPDATE customer_journey_stages SET ' + field + ' = $1, updated_at = NOW() WHERE id = $2 AND journey_id = $3 AND tenant_id = $4',
    [value, stageId, journeyId, tenantId]
  );

  if (res.status) { res.status(200).json({ id: stageId, field: field, value: value }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ id: stageId, field: field, value: value })); }
}

/**
 * PATCH /journeys/:id/stages-order — reorder all stages in one transaction.
 * Dual response mode: res.status/res.json (test mock) or res.writeHead/res.end (real HTTP).
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 */
async function handlePatchJourneyStagesOrder(req, res, _next, pool) {
  // ep1-s4 -- CSRF guard first, mandatory from first implementation per
  // jcg-s1/ep1-s2/ep1-s3's own precedent.
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var tenantId = req.session && req.session.tenantId;
  var journeyId = req.params && req.params.id;
  var stageIds = (req.body && req.body.stageIds) || [];

  function notFound(msg) {
    if (res.status) { res.status(404).json({ error: msg }); }
    else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end(msg); }
  }
  function badRequest(msg) {
    if (res.status) { res.status(400).json({ error: msg }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: msg })); }
  }

  // Journey ownership check BEFORE anything else -- 404, not 403, for a
  // cross-tenant journey id, matching every other handler in this file.
  var jr = await pool.query(
    `SELECT id FROM customer_journeys WHERE id = $1 AND tenant_id = $2`,
    [journeyId, tenantId]
  );
  if (!jr.rows[0]) { notFound('journey not found'); return; }

  // ep1-s4 -- the submitted stageIds array MUST be an EXACT set match
  // against the journey's real stages (no missing id, no extra id, no id
  // from a different journey/tenant). Checked BEFORE opening any
  // transaction -- a rejected request never calls pool.connect() at all.
  var sr = await pool.query(
    `SELECT id FROM customer_journey_stages WHERE journey_id = $1`,
    [journeyId]
  );
  var realIds = sr.rows.map(function(r) { return r.id; });
  var sameSize = realIds.length === stageIds.length;
  var sameSet = sameSize && realIds.every(function(id) { return stageIds.indexOf(id) !== -1; });
  if (!sameSet) { badRequest('stageIds must match the journey\'s existing stages exactly'); return; }

  // Single-transaction position rebalance -- matches the story's own
  // Architecture Constraints (ADR-025 tenant scoping + explicit single-
  // transaction requirement). Reuses tenant-admin-bootstrap.js's
  // bootstrapTenantAdminIfNeeded pattern verbatim (see decisions.md D6):
  // pool.connect() -> BEGIN -> N UPDATEs -> COMMIT, ROLLBACK on error,
  // release() in finally. pg.Pool.query() alone gives no cross-statement
  // atomicity guarantee, so a per-row pool.query() loop would NOT satisfy
  // this requirement.
  var client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (var i = 0; i < stageIds.length; i++) {
      await client.query(
        'UPDATE customer_journey_stages SET position = $1, updated_at = NOW() WHERE id = $2 AND journey_id = $3 AND tenant_id = $4',
        [i, stageIds[i], journeyId, tenantId]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* best-effort */ }
    throw err;
  } finally {
    client.release();
  }

  if (res.status) { res.status(200).json({ id: journeyId, stageIds: stageIds }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ id: journeyId, stageIds: stageIds })); }
}

/**
 * GET /journeys/:id — the journey canvas shell (name + stage list + "+ Add stage").
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 */
async function handleGetJourneyCanvas(req, res, _next, pool) {
  var tenantId = req.session && req.session.tenantId;
  var journeyId = req.params && req.params.id;

  // ep2-s1 -- read pipeline-state.json fresh on every canvas load (ADR-029:
  // local filesystem is canonical, never cached/duplicated in Postgres).
  // Deliberately NOT reusing products.js's own silent { features: [] }
  // fallback -- AC3 requires a visible, distinct error state, not an
  // empty list indistinguishable from "this file genuinely has zero
  // features" (see decisions.md D10 / the test-plan's own grounding notes).
  // Read BEFORE the first `await` below -- this must happen in the same
  // synchronous execution burst as the call, not after a microtask-queue
  // resume, so that a caller mocking fs.readFileSync only around THIS
  // call reliably observes it.
  var features = [];
  var featuresLoadError = false;
  try {
    var repoRoot = _repoRootAdapter.getRepoRoot(req);
    var pipelineStatePath = require('path').join(repoRoot, '.github', 'pipeline-state.json');
    var pipelineState = JSON.parse(require('fs').readFileSync(pipelineStatePath, 'utf8'));
    features = pipelineState.features || [];
  } catch (_) {
    featuresLoadError = true;
  }

  var r = await pool.query(
    `SELECT id, name, description FROM customer_journeys WHERE id = $1 AND tenant_id = $2`,
    [journeyId, tenantId]
  );
  var journey = r.rows[0];

  if (!journey) {
    if (res.status) { res.status(404).json({ error: 'journey not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Journey not found'); }
    return;
  }

  var sr = await pool.query(
    `SELECT id, name, position, description, customer_actions, touchpoints, channel, emotion, pain_points, opportunities, moment_of_truth
     FROM customer_journey_stages WHERE journey_id = $1 ORDER BY position ASC`,
    [journeyId]
  );
  var stages = sr.rows || [];

  // ep1-s3 -- 20x20/1.5px-stroke icon per DESIGN.md's own icon spec, not a
  // unicode glyph (DESIGN.md rule 5 explicitly disallows those in new work).
  var MOMENT_OF_TRUTH_ICON =
    '<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M5 17V3"/><path d="M5 3h9l-3 3.5L14 10H5"/>' +
    '</svg>';

  // ep1-s4 -- 12x12/20x20-viewBox/1.5px-stroke icons per DESIGN.md's own
  // icon spec, not unicode glyphs (rule 5 explicitly disallows those in
  // new work) -- matches MOMENT_OF_TRUTH_ICON's own precedent above.
  var ARROW_UP_ICON =
    '<svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M10 16V4M4 9l6-6 6 6"/>' +
    '</svg>';
  var ARROW_DOWN_ICON =
    '<svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M10 4v12M4 11l6 6 6-6"/>' +
    '</svg>';

  // AC4: each saved stage renders with its name, an "Edit stage" affordance
  // that opens the side panel (ep1-s3's own scope), and -- when applicable --
  // a visible moment-of-truth indicator.
  var stagesHtml = stages.length
    ? stages.map(function(s, idx) {
        var isFirst = idx === 0;
        var isLast = idx === stages.length - 1;
        // ep1-s4 -- up/down keyboard-accessible reorder alternative, only
        // rendered when there is more than one stage to reorder against.
        var reorderControls = stages.length > 1
          ? '<span class="sw-stage-reorder-controls">' +
              '<button type="button" class="sw-stage-move" data-stage-id="' + escHtml(s.id) + '" data-direction="up"' + (isFirst ? ' disabled' : '') + ' aria-label="Move stage up">' + ARROW_UP_ICON + '</button>' +
              '<button type="button" class="sw-stage-move" data-stage-id="' + escHtml(s.id) + '" data-direction="down"' + (isLast ? ' disabled' : '') + ' aria-label="Move stage down">' + ARROW_DOWN_ICON + '</button>' +
            '</span>'
          : '';
        return (
          '<div class="sw-stage-card" data-stage-id="' + escHtml(s.id) + '" draggable="true">' +
            '<span class="sw-stage-name">' + escHtml(s.name) + '</span>' +
            (s.moment_of_truth
              ? '<span class="sw-stage-moment-badge">' + MOMENT_OF_TRUTH_ICON + ' Moment of truth</span>'
              : '') +
            reorderControls +
            '<a href="#" class="sw-stage-edit" data-stage-id="' + escHtml(s.id) + '">Edit stage</a>' +
            '<button type="button" class="sw-stage-map-feature" data-stage-id="' + escHtml(s.id) + '">Map feature</button>' +
          '</div>'
        );
      }).join('')
    : '<p class="sw-journey-stages-empty">No stages yet. Add your first stage.</p>';

  var csrfToken = await _csrf.generateCsrfToken(req);

  // ep2-s1 -- feature picker modal. Three mutually exclusive body states,
  // never conflated: a read/parse failure (AC3), a genuinely empty
  // pipeline-state.json (AC1 boundary), and the populated list (AC1/AC2).
  var featureItemsHtml = features.map(function(f) {
    var slug = escHtml(f.slug || '');
    var name = escHtml(f.name || f.slug || '');
    return '<li class="sw-feature-picker-item" data-slug="' + slug.toLowerCase() + '" data-name="' + name.toLowerCase() + '" role="option">' +
      '<span class="sw-feature-picker-name">' + name + '</span>' +
      '<span class="sw-feature-picker-slug">' + slug + '</span>' +
    '</li>';
  }).join('');

  var featurePickerBodyHtml;
  if (featuresLoadError) {
    featurePickerBodyHtml = '<p id="sw-feature-picker-error" class="sw-feature-picker-message" role="status">Features could not be loaded. Check that pipeline-state.json exists.</p>';
  } else if (features.length === 0) {
    featurePickerBodyHtml = '<p id="sw-feature-picker-none" class="sw-feature-picker-message" role="status">No features found in pipeline-state.json.</p>';
  } else {
    featurePickerBodyHtml =
      '<label class="sw-feature-picker-search-label" for="sw-feature-picker-search">Search features' +
        '<input id="sw-feature-picker-search" type="text" placeholder="Filter by name or slug…" aria-label="Search features" oninput="swFilterFeaturePicker()">' +
      '</label>' +
      '<ul id="sw-feature-picker-list" role="listbox" aria-label="Pipeline features" class="sw-feature-picker-list">' +
        featureItemsHtml +
      '</ul>' +
      '<p id="sw-feature-picker-empty" class="sw-feature-picker-empty" role="status" style="display:none">No features match your search.</p>';
  }

  var featurePickerModalHtml =
    '<div id="sw-feature-picker-modal" class="sw-feature-picker-modal" role="dialog" aria-modal="true" aria-labelledby="sw-feature-picker-title" aria-hidden="true">' +
      '<div class="sw-feature-picker-header">' +
        '<h2 id="sw-feature-picker-title">Map feature</h2>' +
        '<button type="button" id="sw-feature-picker-close" aria-label="Close feature picker">✕</button>' +
      '</div>' +
      featurePickerBodyHtml +
    '</div>' +
    '<style>' +
      '.sw-feature-picker-modal{display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
        'width:420px;max-width:90vw;max-height:70vh;overflow-y:auto;background:var(--surface);' +
        'border:1px solid var(--line);border-radius:8px;padding:20px;z-index:110;' +
        'box-shadow:0 8px 32px rgba(0,0,0,0.24)}' +
      '.sw-feature-picker-modal--open{display:block}' +
      '.sw-feature-picker-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}' +
      '.sw-feature-picker-search-label{display:block;font-size:13px;color:var(--ink-2);margin-bottom:10px}' +
      '.sw-feature-picker-search-label input{display:block;width:100%;margin-top:6px;background:var(--bg);' +
        'color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:8px;font-size:13px}' +
      '.sw-feature-picker-list{list-style:none;margin:0;padding:0;border:1px solid var(--line);border-radius:6px;max-height:300px;overflow-y:auto}' +
      '.sw-feature-picker-item{display:flex;flex-direction:column;gap:2px;padding:8px 10px;border-bottom:1px solid var(--line)}' +
      '.sw-feature-picker-item:last-child{border-bottom:none}' +
      '.sw-feature-picker-item--hidden{display:none}' +
      '.sw-feature-picker-name{font-size:13px;color:var(--ink)}' +
      '.sw-feature-picker-slug{font-size:11px;color:var(--ink-2)}' +
      '.sw-feature-picker-message{font-size:13px;color:var(--ink-2)}' +
      '.sw-feature-picker-empty{font-size:12px;color:var(--muted)}' +
      '.sw-stage-map-feature{margin-left:8px}' +
    '</style>';

  // Full stage data embedded for the side panel to populate from, keyed by
  // id, client-side -- avoids a second round-trip when the panel opens.
  var stageDataJson = JSON.stringify(stages);

  // ep1-s3 -- side panel markup. No existing DESIGN.md layout pattern matches
  // a click-to-open side panel exactly; this reuses html-shell.js's own
  // off-canvas-drawer precedent for the <768px behaviour and
  // products.js's ep4s1-pods-modal for the dialog/focus-restore structure,
  // extended with a genuine Tab-cycling focus trap (AC5) that neither
  // existing precedent implements.
  var panelHtml =
    '<div id="sw-stage-panel" class="sw-stage-panel" role="dialog" aria-modal="true" aria-labelledby="sw-stage-panel-title" aria-hidden="true">' +
      '<div class="sw-stage-panel-header">' +
        '<h2 id="sw-stage-panel-title">Edit stage</h2>' +
        '<button type="button" id="sw-stage-panel-close" aria-label="Close stage panel">✕</button>' +
      '</div>' +
      '<label class="sw-stage-panel-field">Description' +
        '<textarea id="sw-stage-field-description" data-field="description"></textarea>' +
      '</label>' +
      '<label class="sw-stage-panel-field">Customer actions' +
        '<textarea id="sw-stage-field-customer_actions" data-field="customer_actions"></textarea>' +
      '</label>' +
      '<label class="sw-stage-panel-field">Touchpoints' +
        '<textarea id="sw-stage-field-touchpoints" data-field="touchpoints"></textarea>' +
      '</label>' +
      '<label class="sw-stage-panel-field">Channel' +
        '<select id="sw-stage-field-channel" data-field="channel">' +
          '<option value="">—</option>' +
          STAGE_CHANNEL_VALUES.map(function(v) { return '<option value="' + v + '">' + v + '</option>'; }).join('') +
        '</select>' +
      '</label>' +
      '<label class="sw-stage-panel-field">Emotion' +
        '<select id="sw-stage-field-emotion" data-field="emotion">' +
          '<option value="">—</option>' +
          STAGE_EMOTION_VALUES.map(function(v) { return '<option value="' + v + '">' + v + '</option>'; }).join('') +
        '</select>' +
      '</label>' +
      '<label class="sw-stage-panel-field">Pain points' +
        '<textarea id="sw-stage-field-pain_points" data-field="pain_points"></textarea>' +
      '</label>' +
      '<label class="sw-stage-panel-field">Opportunities' +
        '<textarea id="sw-stage-field-opportunities" data-field="opportunities"></textarea>' +
      '</label>' +
      '<label class="sw-stage-panel-field sw-stage-panel-field--checkbox">' +
        '<input type="checkbox" id="sw-stage-field-moment_of_truth" data-field="moment_of_truth"> Moment of truth' +
      '</label>' +
      '<span id="sw-stage-panel-saved" class="sw-stage-panel-saved" aria-live="polite"></span>' +
    '</div>' +
    '<style>' +
      '.sw-stage-panel{display:none;position:fixed;top:0;right:0;bottom:0;width:360px;max-width:100vw;' +
        'background:var(--surface);border-left:1px solid var(--line);padding:20px;overflow-y:auto;z-index:100;' +
        'box-shadow:-4px 0 24px rgba(0,0,0,0.18)}' +
      '.sw-stage-panel--open{display:block}' +
      '.sw-stage-panel-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}' +
      '.sw-stage-panel-field{display:block;font-size:13px;color:var(--ink-2);margin-bottom:14px}' +
      '.sw-stage-panel-field textarea,.sw-stage-panel-field select{display:block;width:100%;margin-top:6px;' +
        'background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:8px;font-size:13px}' +
      '.sw-stage-panel-field textarea:focus,.sw-stage-panel-field select:focus{border-color:var(--accent);outline:none}' +
      '.sw-stage-panel-field--checkbox{display:flex;align-items:center;gap:8px}' +
      '.sw-stage-panel-saved{display:none;font-size:12px;color:var(--success)}' +
      '.sw-stage-panel-saved--visible{display:inline}' +
      '.sw-stage-moment-badge{display:inline-flex;align-items:center;gap:4px;margin-left:8px;font-size:11px;color:var(--warn)}' +
      '.sw-stage-card{cursor:grab}' +
      '.sw-stage-reorder-controls{display:inline-flex;gap:2px;margin-left:8px;vertical-align:middle}' +
      '.sw-stage-move{background:none;border:1px solid var(--line);border-radius:4px;padding:2px;color:var(--ink-2);cursor:pointer;display:inline-flex}' +
      '.sw-stage-move:disabled{opacity:0.35;cursor:default}' +
      '.sw-stage-reorder-error{display:none;font-size:12px;color:var(--danger);margin-top:8px}' +
      '.sw-stage-reorder-error--visible{display:block}' +
      '@media (max-width:768px){.sw-stage-panel{width:100vw}}' +
    '</style>';

  // AC1: "+ Add stage" inserts an unsaved, focused inline-name stage card --
  // pure client-side DOM behaviour, no server round-trip until save (RISK-ACCEPT,
  // see decisions.md -- not E2E-covered, manual verification only).
  var bodyContent =
    '<div class="sw-journey-canvas">' +
      '<h1>' + escHtml(journey.name) + '</h1>' +
      '<div class="sw-journey-stages" id="sw-journey-stages">' +
        stagesHtml +
      '</div>' +
      '<span id="sw-stage-reorder-error" class="sw-stage-reorder-error" aria-live="polite"></span>' +
      '<button type="button" id="sw-add-stage-btn">+ Add stage</button>' +
    '</div>' +
    panelHtml +
    featurePickerModalHtml +
    '<script>(function(){' +
      'var journeyId=' + JSON.stringify(journey.id) + ';' +
      'var csrfToken=' + JSON.stringify(csrfToken) + ';' +
      'var stageData={};' +
      (stageDataJson) + '.forEach(function(s){stageData[s.id]=s;});' +
      'var list=document.getElementById("sw-journey-stages");' +
      'var addBtn=document.getElementById("sw-add-stage-btn");' +
      'var panel=document.getElementById("sw-stage-panel");' +
      'var panelClose=document.getElementById("sw-stage-panel-close");' +
      'var panelSaved=document.getElementById("sw-stage-panel-saved");' +
      'var panelTriggerEl=null,panelStageId=null;' +
      'var panelFields=["description","customer_actions","touchpoints","channel","emotion","pain_points","opportunities","moment_of_truth"];' +
      'function submitJson(url,method,payload){' +
        'return fetch(url,{method:method,headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})' +
          '.then(function(r){' +
            'if(!r.ok){return r.json().then(function(j){throw new Error((j&&j.error)||("Request failed ("+r.status+")"));});}' +
            'return r.json();' +
          '});' +
      '}' +
      'if(addBtn&&list){' +
        'addBtn.addEventListener("click",function(){' +
          'var emptyMsg=list.querySelector(".sw-journey-stages-empty");' +
          'if(emptyMsg)emptyMsg.remove();' +
          'var card=document.createElement("div");' +
          'card.className="sw-stage-card sw-stage-card--new";' +
          'var input=document.createElement("input");' +
          'input.type="text";' +
          'input.className="sw-stage-name-input";' +
          'input.placeholder="Stage name";' +
          'card.appendChild(input);' +
          'list.appendChild(card);' +
          'input.focus();' +
          'function save(){' +
            'var name=input.value.trim();' +
            'submitJson("/journeys/"+journeyId+"/stages","POST",{name:name,_csrf:csrfToken})' +
              '.then(function(){window.location.reload();})' +
              '.catch(function(e){' +
                'input.classList.add("sw-stage-name-input--error");' +
                'input.setAttribute("aria-invalid","true");' +
                'input.title=e.message;' +
              '});' +
          '}' +
          'input.addEventListener("keydown",function(ev){if(ev.key==="Enter"){ev.preventDefault();save();}});' +
          'input.addEventListener("blur",save);' +
        '});' +
      '}' +
      // AC1 (interaction) -- clicking a stage card's "Edit stage" affordance
      // opens the panel, populated from the embedded stage data, with focus
      // moved inside it.
      'function getFocusable(){' +
        'return Array.prototype.slice.call(panel.querySelectorAll("textarea,select,input,button")).filter(function(el){return !el.disabled;});' +
      '}' +
      'function openPanel(stageId){' +
        'var s=stageData[stageId];if(!s)return;' +
        'panelStageId=stageId;' +
        'panelTriggerEl=document.activeElement;' +
        'panelFields.forEach(function(f){' +
          'var el=document.getElementById("sw-stage-field-"+f);' +
          'if(!el)return;' +
          'if(f==="moment_of_truth"){el.checked=!!s[f];}else{el.value=s[f]||"";}' +
        '});' +
        'panel.classList.add("sw-stage-panel--open");' +
        'panel.setAttribute("aria-hidden","false");' +
        // pfi-s1 -- focus the first EDITABLE field explicitly, not
        // getFocusable()[0] -- the close button is first in DOM order
        // (it is in the panel header, before the field labels), so
        // getFocusable()[0] would land focus there instead of on
        // something the user can actually edit. The Tab-trap logic
        // below is unaffected -- it still uses true DOM order (close
        // first, moment_of_truth last) and is correct as-is.
        'var firstField=document.getElementById("sw-stage-field-description");' +
        'if(firstField)firstField.focus();' +
      '}' +
      'function closePanel(){' +
        'panel.classList.remove("sw-stage-panel--open");' +
        'panel.setAttribute("aria-hidden","true");' +
        'panelStageId=null;' +
        // AC4 -- focus returns to the stage card/link that opened the panel.
        'if(panelTriggerEl&&typeof panelTriggerEl.focus==="function")panelTriggerEl.focus();' +
      '}' +
      'if(list){' +
        'list.addEventListener("click",function(ev){' +
          'var link=ev.target.closest&&ev.target.closest(".sw-stage-edit");' +
          'if(!link)return;' +
          'ev.preventDefault();' +
          'openPanel(link.getAttribute("data-stage-id"));' +
        '});' +
      '}' +
      // ep1-s4 -- drag-and-drop + keyboard reorder, sharing one submit
      // path (submitOrder). Native HTML5 drag-and-drop is kanban-view.js's
      // own existing convention in this codebase, reused here, not
      // reinvented (dataTransfer.setData/getData shape matches it).
      'var reorderError=document.getElementById("sw-stage-reorder-error");' +
      'function getStageIds(){' +
        'return Array.prototype.slice.call(list.querySelectorAll(".sw-stage-card")).map(function(c){return c.getAttribute("data-stage-id");});' +
      '}' +
      'function reorderDom(orderIds){' +
        'orderIds.forEach(function(id){' +
          'var card=list.querySelector(\'.sw-stage-card[data-stage-id="\'+id+\'"]\');' +
          'if(card)list.appendChild(card);' +
        '});' +
      '}' +
      'function submitOrder(newOrderIds){' +
        'var snapshot=getStageIds();' +
        'reorderDom(newOrderIds);' +
        'submitJson("/journeys/"+journeyId+"/stages-order","PATCH",{stageIds:newOrderIds,_csrf:csrfToken})' +
          '.catch(function(){' +
            'reorderDom(snapshot);' +
            'if(reorderError){' +
              'reorderError.textContent="Stage order not saved — please try again";' +
              'reorderError.classList.add("sw-stage-reorder-error--visible");' +
              'setTimeout(function(){reorderError.classList.remove("sw-stage-reorder-error--visible");},3000);' +
            '}' +
          '});' +
      '}' +
      'if(list){' +
        'list.addEventListener("dragstart",function(ev){' +
          'var card=ev.target.closest&&ev.target.closest(".sw-stage-card");' +
          'if(!card)return;' +
          'ev.dataTransfer.setData("text/plain",card.getAttribute("data-stage-id"));' +
          'ev.dataTransfer.effectAllowed="move";' +
        '});' +
        'list.addEventListener("dragover",function(ev){' +
          'if(!ev.target.closest||!ev.target.closest(".sw-stage-card"))return;' +
          'ev.preventDefault();' +
        '});' +
        'list.addEventListener("drop",function(ev){' +
          'ev.preventDefault();' +
          'var draggedId=ev.dataTransfer.getData("text/plain");' +
          'if(!draggedId)return;' +
          'var targetCard=ev.target.closest&&ev.target.closest(".sw-stage-card");' +
          'var ids=getStageIds();' +
          'var fromIdx=ids.indexOf(draggedId);' +
          'if(fromIdx===-1)return;' +
          'ids.splice(fromIdx,1);' +
          'var toIdx=targetCard?ids.indexOf(targetCard.getAttribute("data-stage-id")):ids.length;' +
          'if(toIdx===-1)toIdx=ids.length;' +
          'ids.splice(toIdx,0,draggedId);' +
          'submitOrder(ids);' +
        '});' +
        'list.addEventListener("click",function(ev){' +
          'var btn=ev.target.closest&&ev.target.closest(".sw-stage-move");' +
          'if(!btn||btn.disabled)return;' +
          'var id=btn.getAttribute("data-stage-id");' +
          'var direction=btn.getAttribute("data-direction");' +
          'var ids=getStageIds();' +
          'var idx=ids.indexOf(id);' +
          'if(idx===-1)return;' +
          'var swapIdx=direction==="up"?idx-1:idx+1;' +
          'if(swapIdx<0||swapIdx>=ids.length)return;' +
          'var tmp=ids[idx];ids[idx]=ids[swapIdx];ids[swapIdx]=tmp;' +
          'submitOrder(ids);' +
        '});' +
      '}' +
      'if(panelClose)panelClose.addEventListener("click",closePanel);' +
      // AC5 -- a genuine keyboard focus trap: Tab past the last focusable
      // element wraps to the first, Shift+Tab before the first wraps to the
      // last. (products.js's own ep4s1-pods-modal explicitly does NOT do
      // this -- this story's own AC5 requires the real thing.)
      'document.addEventListener("keydown",function(evt){' +
        'if(!panel.classList.contains("sw-stage-panel--open"))return;' +
        'if(evt.key==="Escape"){closePanel();return;}' +
        'if(evt.key!=="Tab")return;' +
        'var focusables=getFocusable();' +
        'if(!focusables.length)return;' +
        'var first=focusables[0],last=focusables[focusables.length-1];' +
        'if(evt.shiftKey&&document.activeElement===first){evt.preventDefault();last.focus();}' +
        'else if(!evt.shiftKey&&document.activeElement===last){evt.preventDefault();first.focus();}' +
      '});' +
      // AC2 -- autosave on blur (per-field PATCH), with a brief in-place
      // success indicator -- no page reload, so the panel stays open across
      // edits to multiple fields.
      'panelFields.forEach(function(f){' +
        'var el=document.getElementById("sw-stage-field-"+f);' +
        'if(!el)return;' +
        'function save(){' +
          'if(!panelStageId)return;' +
          'var value=f==="moment_of_truth"?el.checked:el.value;' +
          'submitJson("/journeys/"+journeyId+"/stages/"+panelStageId,"PATCH",{field:f,value:value,_csrf:csrfToken})' +
            '.then(function(){' +
              'stageData[panelStageId][f]=value;' +
              'panelSaved.textContent="Saved";' +
              'panelSaved.classList.add("sw-stage-panel-saved--visible");' +
              'setTimeout(function(){panelSaved.classList.remove("sw-stage-panel-saved--visible");},1500);' +
              // AC3 -- toggling moment_of_truth updates THAT stage card's own
              // visible indicator in place, without a page reload.
              'if(f==="moment_of_truth"){' +
                'var card=list.querySelector(\'.sw-stage-card[data-stage-id="\'+panelStageId+\'"]\');' +
                'if(card){' +
                  'var badge=card.querySelector(".sw-stage-moment-badge");' +
                  'if(value&&!badge){' +
                    'var span=document.createElement("span");' +
                    'span.className="sw-stage-moment-badge";' +
                    'span.innerHTML=' + JSON.stringify(MOMENT_OF_TRUTH_ICON) + '+" Moment of truth";' +
                    'card.insertBefore(span,card.querySelector(".sw-stage-edit"));' +
                  '}else if(!value&&badge){badge.remove();}' +
                '}' +
              '}' +
            '})' +
            '.catch(function(e){' +
              'panelSaved.textContent="Error: "+e.message;' +
              'panelSaved.classList.add("sw-stage-panel-saved--visible");' +
            '});' +
        '}' +
        'el.addEventListener("blur",save);' +
        'if(f==="moment_of_truth")el.addEventListener("change",save);' +
      '});' +
    '})()<\/script>' +
    // ep2-s1 AC2 -- client-side filtering behaviour for the feature picker's
    // search input (markup already added by Task 1). Deliberately a
    // separate <script> block/IIFE from the stage-panel/reorder script
    // above -- Task 3 (open/close modal handling) extends THIS block, not
    // that one.
    '<script>(function(){' +
      'var fpModal=document.getElementById("sw-feature-picker-modal");' +
      'var fpSearch=document.getElementById("sw-feature-picker-search");' +
      'window.swFilterFeaturePicker=function(){' +
        'if(!fpSearch)return;' +
        'var q=(fpSearch.value||"").trim().toLowerCase();' +
        'var items=Array.prototype.slice.call(document.querySelectorAll(".sw-feature-picker-item"));' +
        'var anyVisible=false;' +
        'items.forEach(function(li){' +
          'var match=!q||li.getAttribute("data-slug").indexOf(q)!==-1||li.getAttribute("data-name").indexOf(q)!==-1;' +
          'li.classList.toggle("sw-feature-picker-item--hidden",!match);' +
          'if(match)anyVisible=true;' +
        '});' +
        'var emptyEl=document.getElementById("sw-feature-picker-empty");' +
        'if(emptyEl)emptyEl.style.display=(items.length&&!anyVisible)?"block":"none";' +
      '};' +
    '})()<\/script>';

  if (res.status) {
    res.status(200).json({ id: journey.id, name: journey.name, bodyContent: bodyContent, stages: stages }); // test mock path
  } else {
    var html = await renderShellWithNav(pool, tenantId, {
      title: journey.name,
      bodyContent: bodyContent,
      active: 'journeys',
      user: req.session
    });
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }
}

/**
 * GET /customer-journeys — list all journeys for the tenant (ep4-s1).
 * Deliberately NOT /journeys -- that plain path is already owned by the
 * unrelated, live platform feature handleJourneys (routes/journey.js,
 * singular file, bee.2's skill-session first-run screen). See
 * decisions.md D8.
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 */
async function handleGetCustomerJourneysList(req, res, _next, pool) {
  var tenantId = req.session && req.session.tenantId;

  // ADR-025 -- tenant scoping on the list query itself (AC5).
  var jr = await pool.query(
    `SELECT cj.id, cj.name, cj.description, cj.product_id, p.name AS product_name
     FROM customer_journeys cj
     LEFT JOIN products p ON cj.product_id = p.product_id
     WHERE cj.tenant_id = $1
     ORDER BY cj.created_at DESC`,
    [tenantId]
  );
  var journeys = jr.rows || [];

  // Stage counts via a second, simpler query rather than one mega-join --
  // matches this codebase's own existing style (see handlePostJourneyStage's
  // own separate MAX(position) query).
  var stageCounts = {};
  if (journeys.length) {
    var ids = journeys.map(function(j) { return j.id; });
    var sr = await pool.query(
      `SELECT journey_id, COUNT(*) AS stage_count FROM customer_journey_stages WHERE journey_id = ANY($1) GROUP BY journey_id`,
      [ids]
    );
    sr.rows.forEach(function(r) { stageCounts[r.journey_id] = Number(r.stage_count); });
  }

  // Product picker data for the "New journey" modal -- same query already
  // used elsewhere in products.js for tenant-scoped product lists.
  var pr = await pool.query(`SELECT product_id, name FROM products WHERE tenant_id = $1`, [tenantId]);
  var products = pr.rows || [];

  function truncate(text, max) {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  var journeysHtml = journeys.length
    ? journeys.map(function(j) {
        var stageCount = stageCounts[j.id] || 0;
        return (
          '<div class="sw-journey-list-card" data-journey-id="' + escHtml(j.id) + '">' +
            '<a href="/journeys/' + escHtml(j.id) + '" class="sw-journey-list-name">' + escHtml(j.name) + '</a>' +
            (j.description
              ? '<p class="sw-journey-list-desc">' + escHtml(truncate(j.description, 140)) + '</p>'
              : '') +
            '<span class="sw-journey-list-product">' + escHtml(j.product_name || 'No product') + '</span>' +
            '<span class="sw-journey-list-stage-count">' + stageCount + ' stage' + (stageCount === 1 ? '' : 's') + '</span>' +
          '</div>'
        );
      }).join('')
    : '<p class="sw-journey-list-empty">No journeys yet. Create your first journey.</p>';

  var csrfToken = await _csrf.generateCsrfToken(req);
  var productsJson = JSON.stringify(products);

  // ep4-s1 -- "New journey" modal, reusing products.js's own ep4s1-pods-modal
  // dialog/focus-restore pattern (role="dialog" aria-modal="true",
  // initial-focus-on-open, Escape-to-close, captured trigger element).
  var modalHtml =
    '<div id="sw-new-journey-modal" class="sw-new-journey-modal" role="dialog" aria-modal="true" aria-labelledby="sw-new-journey-modal-title" aria-hidden="true">' +
      '<div class="sw-new-journey-modal-header">' +
        '<h2 id="sw-new-journey-modal-title">New journey</h2>' +
        '<button type="button" id="sw-new-journey-modal-close" aria-label="Close">✕</button>' +
      '</div>' +
      '<label class="sw-new-journey-field">Name' +
        '<input type="text" id="sw-new-journey-name" required>' +
      '</label>' +
      '<label class="sw-new-journey-field">Description' +
        '<textarea id="sw-new-journey-description"></textarea>' +
      '</label>' +
      '<label class="sw-new-journey-field">Product' +
        '<select id="sw-new-journey-product">' +
          '<option value="">No product</option>' +
          products.map(function(p) { return '<option value="' + escHtml(p.product_id) + '">' + escHtml(p.name) + '</option>'; }).join('') +
        '</select>' +
      '</label>' +
      '<span id="sw-new-journey-error" class="sw-new-journey-error" aria-live="polite"></span>' +
      '<button type="button" id="sw-new-journey-submit">Create journey</button>' +
    '</div>' +
    '<style>' +
      '.sw-new-journey-modal{display:none;position:fixed;top:10%;left:50%;transform:translateX(-50%);width:400px;max-width:90vw;' +
        'background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:20px;z-index:100;' +
        'box-shadow:0 8px 32px rgba(0,0,0,0.24)}' +
      '.sw-new-journey-modal--open{display:block}' +
      '.sw-new-journey-modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}' +
      '.sw-new-journey-field{display:block;font-size:13px;color:var(--ink-2);margin-bottom:14px}' +
      '.sw-new-journey-field input,.sw-new-journey-field textarea,.sw-new-journey-field select{display:block;width:100%;margin-top:6px;' +
        'background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:8px;font-size:13px}' +
      '.sw-new-journey-error{display:block;font-size:12px;color:var(--danger);margin-bottom:8px}' +
      '.sw-journey-list-card{border:1px solid var(--line);border-radius:8px;padding:12px;margin-bottom:10px}' +
      '.sw-journey-list-name{font-size:15px;font-weight:600;color:var(--ink)}' +
      '.sw-journey-list-desc{font-size:13px;color:var(--ink-2);margin:4px 0}' +
      '.sw-journey-list-product,.sw-journey-list-stage-count{font-size:12px;color:var(--ink-2);margin-right:12px}' +
    '</style>';

  var bodyContent =
    '<div class="sw-journey-list">' +
      '<h1>Journeys</h1>' +
      '<button type="button" id="sw-new-journey-btn">New journey</button>' +
      '<div class="sw-journey-list-items">' + journeysHtml + '</div>' +
    '</div>' +
    modalHtml +
    '<script>(function(){' +
      'var csrfToken=' + JSON.stringify(csrfToken) + ';' +
      'var modal=document.getElementById("sw-new-journey-modal");' +
      'var openBtn=document.getElementById("sw-new-journey-btn");' +
      'var closeBtn=document.getElementById("sw-new-journey-modal-close");' +
      'var submitBtn=document.getElementById("sw-new-journey-submit");' +
      'var errorEl=document.getElementById("sw-new-journey-error");' +
      'var triggerEl=null;' +
      'function openModal(){' +
        'triggerEl=document.activeElement;' +
        'modal.classList.add("sw-new-journey-modal--open");' +
        'modal.setAttribute("aria-hidden","false");' +
        'document.getElementById("sw-new-journey-name").focus();' +
      '}' +
      'function closeModal(){' +
        'modal.classList.remove("sw-new-journey-modal--open");' +
        'modal.setAttribute("aria-hidden","true");' +
        'if(triggerEl&&typeof triggerEl.focus==="function")triggerEl.focus();' +
      '}' +
      'if(openBtn)openBtn.addEventListener("click",openModal);' +
      'if(closeBtn)closeBtn.addEventListener("click",closeModal);' +
      'document.addEventListener("keydown",function(evt){' +
        'if(modal.classList.contains("sw-new-journey-modal--open")&&evt.key==="Escape")closeModal();' +
      '});' +
      'if(submitBtn){' +
        'submitBtn.addEventListener("click",function(){' +
          'var name=document.getElementById("sw-new-journey-name").value.trim();' +
          'var description=document.getElementById("sw-new-journey-description").value.trim();' +
          'var productId=document.getElementById("sw-new-journey-product").value||null;' +
          'if(!name){errorEl.textContent="Name is required";return;}' +
          // ep4-s1 -- POST /journeys (ep1-s1, unchanged) responds with a real
          // 302 redirect on success, which fetch() auto-follows -- the
          // success-path response body is the canvas page's HTML, not JSON.
          // r.redirected/r.url must be checked BEFORE any .json() call, or a
          // successful creation looks like a parse-error failure.
          'fetch("/journeys",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:name,description:description,productId:productId,_csrf:csrfToken})})' +
            '.then(function(r){' +
              'if(r.redirected){window.location.href=r.url;return;}' +
              'return r.json().then(function(j){throw new Error((j&&j.error)||"Request failed");});' +
            '})' +
            '.catch(function(e){errorEl.textContent=e.message;});' +
        '});' +
      '}' +
    '})()<\/script>';

  if (res.status) {
    res.status(200).json({ bodyContent: bodyContent, journeys: journeys }); // test mock path
  } else {
    var html = await renderShellWithNav(pool, tenantId, {
      title: 'Journeys',
      bodyContent: bodyContent,
      active: 'journeys',
      user: req.session
    });
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }
}

module.exports = { handlePostJourneys, handleGetJourneyCanvas, handlePostJourneyStage, handlePatchJourneyStage, handlePatchJourneyStagesOrder, handleGetCustomerJourneysList };
