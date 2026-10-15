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
var _personaScanner = require('../adapters/persona-scanner'); // jcx-s4 -- pure file-read scan of discovery.md's own "Who It Affects" sections
var _fieldSuggestionAi = require('../adapters/field-suggestion-ai'); // jae-s4 -- D37 injectable LLM-fallback suggestion adapter

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

  // jae-s1 AC2 -- seeds a hardcoded default stage outline unless the
  // operator explicitly opted out (checkbox unchecked -> seedDefaultStages:
  // false). Reuses handlePostJourneyStage's own exact single-stage INSERT
  // shape (name + position only, every other column stays null) -- called
  // 5 times here rather than via a second HTTP round-trip, matching this
  // file's own existing convention of calling shared query logic directly.
  if (req.body && req.body.seedDefaultStages !== false) {
    var defaultStageNames = ['Evaluate', 'Discover', 'Purchase', 'Onboard', 'Retain'];
    for (var i = 0; i < defaultStageNames.length; i++) {
      await pool.query(
        `INSERT INTO customer_journey_stages (journey_id, tenant_id, name, position)
         VALUES ($1, $2, $3, $4)`,
        [journeyId, tenantId, defaultStageNames[i], i]
      );
    }
  }

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
 * POST /journeys/:id/stages/:stageId/feature-mappings — upsert a
 * feature-to-stage mapping (feature_customer_journey_stage_mappings),
 * tenant-scoped.
 * Dual response mode: res.status/res.json (test mock) or res.writeHead/res.end (real HTTP).
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 */
async function handlePostFeatureMapping(req, res, _next, pool) {
  // ep2-s2 -- CSRF guard first, mandatory from first implementation per
  // jcg-s1/ep1-s2/ep1-s3/ep1-s4's own precedent.
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var tenantId = req.session && req.session.tenantId;
  var journeyId = req.params && req.params.id;
  var stageId = req.params && req.params.stageId;
  var featureSlug = (req.body && req.body.featureSlug || '').trim();
  var metricKeys = Array.isArray(req.body && req.body.metricKeys) ? req.body.metricKeys : [];

  function notFound(msg) {
    if (res.status) { res.status(404).json({ error: msg }); }
    else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end(msg); }
  }
  function badRequest(msg) {
    if (res.status) { res.status(400).json({ error: msg }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: msg })); }
  }

  if (!featureSlug) { badRequest('featureSlug is required'); return; }

  // ep2-s2 -- stage ownership check BEFORE any transaction opens -- 404, not
  // 403, for a cross-tenant journey/stage id, matching every other mutating
  // handler in this file (see decisions.md D13).
  var sr = await pool.query(
    `SELECT cjs.id FROM customer_journey_stages cjs
     JOIN customer_journeys cj ON cjs.journey_id = cj.id
     WHERE cjs.id = $1 AND cjs.journey_id = $2 AND cj.tenant_id = $3`,
    [stageId, journeyId, tenantId]
  );
  if (!sr.rows[0]) { notFound('stage not found'); return; }

  // ep2-s2 -- feature_customer_journey_stage_mappings has NO unique
  // constraint on (journey_stage_id, feature_slug) -- true SQL UPSERT via
  // INSERT ... ON CONFLICT is not available. Application-level
  // check-then-write inside a single transaction, matching
  // handlePatchJourneyStagesOrder's own established pattern exactly.
  var client = await pool.connect();
  var mappingId;
  try {
    await client.query('BEGIN');
    var existing = await client.query(
      `SELECT id FROM feature_customer_journey_stage_mappings
       WHERE journey_stage_id = $1 AND feature_slug = $2 AND tenant_id = $3
       FOR UPDATE`,
      [stageId, featureSlug, tenantId]
    );
    if (existing.rows[0]) {
      mappingId = existing.rows[0].id;
      await client.query(
        `UPDATE feature_customer_journey_stage_mappings SET metric_keys = $1 WHERE id = $2`,
        [JSON.stringify(metricKeys), mappingId]
      );
    } else {
      var ins = await client.query(
        `INSERT INTO feature_customer_journey_stage_mappings
         (journey_stage_id, journey_id, tenant_id, feature_slug, metric_keys)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [stageId, journeyId, tenantId, featureSlug, JSON.stringify(metricKeys)]
      );
      mappingId = ins.rows[0].id;
    }
    await client.query('COMMIT');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* best-effort */ }
    throw err;
  } finally {
    client.release();
  }

  if (res.status) { res.status(200).json({ id: mappingId, featureSlug: featureSlug, metricKeys: metricKeys }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ id: mappingId, featureSlug: featureSlug, metricKeys: metricKeys })); }
}

/**
 * DELETE /journeys/:id/stages/:stageId/feature-mappings/:mappingId —
 * remove one feature-to-stage mapping by its own id. Scoped narrowly to
 * the Delivery view's "Remove" affordance on a feature-not-found warning
 * row (decisions.md D16) -- the general case of editing/removing a VALID
 * mapping remains deferred.
 * Dual response mode: res.status/res.json (test mock) or res.writeHead/res.end (real HTTP).
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 */
async function handleDeleteFeatureMapping(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var tenantId = req.session && req.session.tenantId;
  var journeyId = req.params && req.params.id;
  var stageId = req.params && req.params.stageId;
  var mappingId = req.params && req.params.mappingId;

  function notFound(msg) {
    if (res.status) { res.status(404).json({ error: msg }); }
    else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end(msg); }
  }

  // ep2-s3 -- same ownership-check-before-mutation / 404-not-403 cross-tenant
  // policy as handlePostFeatureMapping (decisions.md D13).
  var sr = await pool.query(
    `SELECT cjs.id FROM customer_journey_stages cjs
     JOIN customer_journeys cj ON cjs.journey_id = cj.id
     WHERE cjs.id = $1 AND cjs.journey_id = $2 AND cj.tenant_id = $3`,
    [stageId, journeyId, tenantId]
  );
  if (!sr.rows[0]) { notFound('stage not found'); return; }

  // Single-statement delete, no transaction needed -- matches this file's
  // own convention of only wrapping multi-row writes in BEGIN/COMMIT (D6).
  await pool.query(
    `DELETE FROM feature_customer_journey_stage_mappings WHERE id = $1 AND journey_stage_id = $2`,
    [mappingId, stageId]
  );

  if (res.status) { res.status(200).json({ id: mappingId }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ id: mappingId })); }
}

/**
 * PATCH /journeys/:id/stages/:stageId/position — persist a drawflow node's
 * dragged screen position (ic-s2 AC1/AC3/AC5). Dual response mode:
 * res.status/res.json (test mock) or res.writeHead/res.end (real HTTP).
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 */
async function handlePatchJourneyStagePosition(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var tenantId = req.session && req.session.tenantId;
  var journeyId = req.params && req.params.id;
  var stageId = req.params && req.params.stageId;
  var x = req.body && req.body.x;
  var y = req.body && req.body.y;

  function notFound(msg) {
    if (res.status) { res.status(404).json({ error: msg }); }
    else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end(msg); }
  }
  function badRequest(msg) {
    if (res.status) { res.status(400).json({ error: msg }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: msg })); }
  }

  if (typeof x !== 'number' || typeof y !== 'number' || !isFinite(x) || !isFinite(y)) {
    badRequest('x and y must be finite numbers');
    return;
  }

  // ic-s2 -- same ownership-check-before-mutation / 404-not-403 cross-tenant
  // policy as handleDeleteFeatureMapping (decisions.md D13).
  var sr = await pool.query(
    `SELECT cjs.id FROM customer_journey_stages cjs
     JOIN customer_journeys cj ON cjs.journey_id = cj.id
     WHERE cjs.id = $1 AND cjs.journey_id = $2 AND cj.tenant_id = $3`,
    [stageId, journeyId, tenantId]
  );
  if (!sr.rows[0]) { notFound('stage not found'); return; }

  // Single-statement update, no transaction needed -- matches this file's
  // own convention of only wrapping multi-row writes in BEGIN/COMMIT (D6).
  await pool.query(
    `UPDATE customer_journey_stages SET position_x = $1, position_y = $2, updated_at = NOW() WHERE id = $3`,
    [x, y, stageId]
  );

  if (res.status) { res.status(200).json({ id: stageId, position_x: x, position_y: y }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ id: stageId, position_x: x, position_y: y })); }
}

var _discoverySeeder = require('../adapters/discovery-seeder');

/**
 * POST /journeys/:id/stages/:stageId/placeholder-features — add a
 * placeholder feature to a stage (jcx-s1 AC1). feature_slug holds the
 * operator-provided NAME (free text), not a resolvable slug, until jcx-s2's
 * own conversion step runs -- see this story's own Architecture Constraints.
 * Dual response mode: res.status/res.json (test mock) or res.writeHead/res.end (real HTTP).
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 */
async function handlePostPlaceholderFeature(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var tenantId = req.session && req.session.tenantId;
  var journeyId = req.params && req.params.id;
  var stageId = req.params && req.params.stageId;
  var name = (req.body && req.body.name || '').trim();

  function notFound(msg) {
    if (res.status) { res.status(404).json({ error: msg }); }
    else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end(msg); }
  }
  function badRequest(msg) {
    if (res.status) { res.status(400).json({ error: msg }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: msg })); }
  }

  if (!name) { badRequest('name is required'); return; }

  // jcx-s1 -- same ownership-check-before-mutation / 404-not-403 cross-tenant
  // policy as handlePostFeatureMapping/handleDeleteFeatureMapping (decisions.md D13).
  var sr = await pool.query(
    `SELECT cjs.id FROM customer_journey_stages cjs
     JOIN customer_journeys cj ON cjs.journey_id = cj.id
     WHERE cjs.id = $1 AND cjs.journey_id = $2 AND cj.tenant_id = $3`,
    [stageId, journeyId, tenantId]
  );
  if (!sr.rows[0]) { notFound('stage not found'); return; }

  var ins = await pool.query(
    `INSERT INTO feature_customer_journey_stage_mappings
     (journey_stage_id, journey_id, tenant_id, feature_slug, mapping_state)
     VALUES ($1, $2, $3, $4, 'placeholder')
     RETURNING id`,
    [stageId, journeyId, tenantId, name]
  );
  var mappingId = ins.rows[0].id;

  if (res.status) { res.status(200).json({ id: mappingId, name: name, mappingState: 'placeholder' }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ id: mappingId, name: name, mappingState: 'placeholder' })); }
}

/**
 * POST /journeys/:id/stages/:stageId/placeholder-features/:mappingId/trigger
 * — trigger a placeholder feature, seeding a new /discovery session (jcx-s1
 * AC2). _opts is test-only (repoRoot override); production always uses the
 * real repo root.
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 * @param {object} [_opts]
 */
async function handleTriggerPlaceholderFeature(req, res, _next, pool, _opts) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var tenantId = req.session && req.session.tenantId;
  var journeyId = req.params && req.params.id;
  var stageId = req.params && req.params.stageId;
  var mappingId = req.params && req.params.mappingId;
  var repoRoot = (_opts && _opts.repoRoot) || _repoRootAdapter.getRepoRoot(req);

  function notFound(msg) {
    if (res.status) { res.status(404).json({ error: msg }); }
    else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end(msg); }
  }
  function badRequest(msg) {
    if (res.status) { res.status(400).json({ error: msg }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: msg })); }
  }

  var sr = await pool.query(
    `SELECT cjs.id, cjs.name, cjs.description, cjs.emotion, cjs.pain_points, cjs.opportunities, cjs.touchpoints
     FROM customer_journey_stages cjs
     JOIN customer_journeys cj ON cjs.journey_id = cj.id
     WHERE cjs.id = $1 AND cjs.journey_id = $2 AND cj.tenant_id = $3`,
    [stageId, journeyId, tenantId]
  );
  var stage = sr.rows[0];
  if (!stage) { notFound('stage not found'); return; }

  var mr = await pool.query(
    `SELECT feature_slug FROM feature_customer_journey_stage_mappings WHERE id = $1 AND journey_stage_id = $2 AND tenant_id = $3`,
    [mappingId, stageId, tenantId]
  );
  var mapping = mr.rows[0];
  if (!mapping) { notFound('mapping not found'); return; }

  var result = _discoverySeeder.seedDiscoveryFromStage(stage, mapping.feature_slug, repoRoot);
  if (result.error) { badRequest(result.error); return; }

  // jcx-s2 -- persist the provenance link this story's own conversion-check
  // depends on. Best-effort: if this UPDATE fails, the trigger itself still
  // succeeded (the discovery.md is already on disk) -- log and continue
  // rather than erroring the whole request over a bookkeeping write.
  try {
    await pool.query(
      `UPDATE feature_customer_journey_stage_mappings SET triggered_feature_slug = $1 WHERE id = $2 AND tenant_id = $3`,
      [result.featureSlug, mappingId, tenantId]
    );
  } catch (e) { console.error('jcx-s2: failed to persist triggered_feature_slug:', e.message); }

  if (res.status) { res.status(200).json({ featureSlug: result.featureSlug }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ featureSlug: result.featureSlug })); }
}

/**
 * jcx-s2 -- for every placeholder mapping in this journey that was
 * triggered (triggered_feature_slug set), check whether its own seeded
 * discovery.md has since been approved; if so, convert it to linked. A
 * pure reconciliation pass, not a push-based event -- called from
 * handleGetJourneyCanvas on every page load (AC2's own "when the operator
 * views the stage"). Tenant-scoped at the SELECT itself (D13/ADR-025) --
 * never a separate per-row ownership check, since the query's own WHERE
 * clause already excludes every other tenant's rows.
 * @param {object} pool
 * @param {string} journeyId
 * @param {string} tenantId
 * @param {string} repoRoot
 */
async function checkPlaceholderConversions(pool, journeyId, tenantId, repoRoot) {
  var mr = await pool.query(
    `SELECT id, triggered_feature_slug FROM feature_customer_journey_stage_mappings WHERE mapping_state = 'placeholder' AND triggered_feature_slug IS NOT NULL AND journey_id = $1 AND tenant_id = $2`,
    [journeyId, tenantId]
  );
  for (var i = 0; i < (mr.rows || []).length; i++) {
    var row = mr.rows[i];
    if (_discoverySeeder.isDiscoveryApproved(row.triggered_feature_slug, repoRoot)) {
      await pool.query(
        `UPDATE feature_customer_journey_stage_mappings SET mapping_state = 'linked', feature_slug = $1 WHERE id = $2 AND tenant_id = $3`,
        [row.triggered_feature_slug, row.id, tenantId]
      );
    }
  }
}

/**
 * jcx-s4 -- resolves product_id -> feature_slugs via the SAME query
 * pattern already established in products.js's own getProductsNavSummary
 * (confirmed by reading that function directly), then delegates to the
 * pure-file-read scanner. AC2: a product with zero associated
 * feature_slugs (or none with a readable "Who It Affects") returns an
 * empty array, not an error.
 * @param {object} pool
 * @param {string} productId
 * @param {string} repoRoot
 * @returns {Promise<Array<{featureSlug: string, personaText: string}>>}
 */
async function getPersonaSuggestions(pool, productId, repoRoot) {
  if (!productId) return [];
  var fr = await pool.query(
    `SELECT DISTINCT feature_slug FROM journeys WHERE product_id = $1 AND feature_slug IS NOT NULL`,
    [productId]
  );
  var featureSlugs = fr.rows.map(function(r) { return r.feature_slug; });
  return _personaScanner.scanForPersonas(featureSlugs, repoRoot);
}

/**
 * jae-s3 -- mirrors getPersonaSuggestions exactly (ADR-026, same query
 * shape, same product_id -> feature_slug resolution, same "no match is
 * not an error" behaviour), delegating to the Problem-Statement scanner
 * instead of the Who-It-Affects one.
 * @param {object} pool
 * @param {string} productId
 * @param {string} repoRoot
 * @returns {Promise<Array<{featureSlug: string, problemText: string}>>}
 */
async function getFieldSuggestions(pool, productId, repoRoot) {
  if (!productId) return [];
  var fr = await pool.query(
    `SELECT DISTINCT feature_slug FROM journeys WHERE product_id = $1 AND feature_slug IS NOT NULL`,
    [productId]
  );
  var featureSlugs = fr.rows.map(function(r) { return r.feature_slug; });
  return _personaScanner.scanForFieldSuggestions(featureSlugs, repoRoot);
}

var AI_SUGGESTION_FIELDS = ['customer_actions', 'pain_points'];

/**
 * GET /journeys/:id/stages/:stageId/ai-suggestion?field=<field> — jae-s4:
 * on-demand LLM-generated fallback suggestion, called lazily by the client
 * only when the stage-edit panel opens AND jae-s3's own deterministic scan
 * (getFieldSuggestions) already returned nothing for this field. Never
 * called from handleGetJourneyCanvas's own render path (AC1a) -- a real
 * network round-trip here must not add latency to every canvas page load.
 * Dual response mode: res.status/res.json (test mock) or res.writeHead/res.end (real HTTP).
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 */
async function handleGetAiFieldSuggestion(req, res, _next, pool) {
  var tenantId = req.session && req.session.tenantId;
  var journeyId = req.params && req.params.id;
  var stageId = req.params && req.params.stageId;
  var field = req.query && req.query.field;

  function notFound(msg) {
    if (res.status) { res.status(404).json({ error: msg }); }
    else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end(msg); }
  }
  function badRequest(msg) {
    if (res.status) { res.status(400).json({ error: msg }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: msg })); }
  }

  if (AI_SUGGESTION_FIELDS.indexOf(field) === -1) { badRequest('invalid field'); return; }

  var jr = await pool.query(
    `SELECT id, name, product_id FROM customer_journeys WHERE id = $1 AND tenant_id = $2`,
    [journeyId, tenantId]
  );
  if (!jr.rows[0]) { notFound('journey not found'); return; }
  var journey = jr.rows[0];

  var sr = await pool.query(
    `SELECT id, name FROM customer_journey_stages WHERE id = $1 AND journey_id = $2`,
    [stageId, journeyId]
  );
  if (!sr.rows[0]) { notFound('stage not found'); return; }
  var stage = sr.rows[0];

  var featureSlug = null;
  if (journey.product_id) {
    var fr = await pool.query(
      `SELECT feature_slug FROM journeys WHERE product_id = $1 AND feature_slug IS NOT NULL LIMIT 1`,
      [journey.product_id]
    );
    featureSlug = fr.rows[0] ? fr.rows[0].feature_slug : null;
  }

  var stageContext = { stageName: stage.name, journeyName: journey.name, featureSlug: featureSlug || undefined };
  // AC5: the real adapter already catches its own errors internally and
  // resolves to null, but this route-level guard holds the same
  // degrade-silently invariant regardless of which adapter implementation
  // is wired (including a test double with no internal catch of its own).
  var suggestion;
  try {
    suggestion = await _fieldSuggestionAi.generateAiFieldSuggestion(stageContext, field);
  } catch (_) {
    suggestion = null;
  }

  if (res.status) { res.status(200).json({ suggestion: suggestion }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ suggestion: suggestion })); }
}

/**
 * PATCH /journeys/:id/persona — save the journey's own persona fields.
 * Dual response mode: res.status/res.json (test mock) or res.writeHead/res.end (real HTTP).
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 */
async function handlePatchJourneyPersona(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var tenantId = req.session && req.session.tenantId;
  var journeyId = req.params && req.params.id;
  var personaName = req.body && req.body.persona_name;
  var personaRole = req.body && req.body.persona_role;
  var personaGoal = req.body && req.body.persona_goal;

  function notFound(msg) {
    if (res.status) { res.status(404).json({ error: msg }); }
    else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end(msg); }
  }

  // jcx-s4 -- same ownership-check-before-mutation / 404-not-403 cross-tenant
  // policy as every other mutating route in this file (decisions.md D13).
  var jr = await pool.query(`SELECT id FROM customer_journeys WHERE id = $1 AND tenant_id = $2`, [journeyId, tenantId]);
  if (!jr.rows[0]) { notFound('journey not found'); return; }

  await pool.query(
    `UPDATE customer_journeys SET persona_name = $1, persona_role = $2, persona_goal = $3 WHERE id = $4`,
    [personaName || null, personaRole || null, personaGoal || null, journeyId]
  );

  if (res.status) { res.status(200).json({ persona_name: personaName, persona_role: personaRole, persona_goal: personaGoal }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ persona_name: personaName, persona_role: personaRole, persona_goal: personaGoal })); }
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

  // ep2-s3 -- slug-keyed lookup for joining mappings against the features
  // list already read above. Features with no matching mapping are simply
  // never looked up; mappings with no matching feature fall through to the
  // "Feature not found" branch in buildDeliveryAnnotations below (AC2).
  var featuresBySlug = {};
  features.forEach(function(f) { featuresBySlug[f.slug] = f; });

  // ep2-s2 -- embed each feature's own optional metricKeys (string[]) for the
  // metric-key sub-view, keyed by the feature's REAL (not lowercased) slug.
  // Nothing currently writes this field (decisions.md D12) -- every feature
  // today falls through to the explicit "No metrics recorded" fallback,
  // forward-compatible once a future story defines the write path.
  var featureMetricKeysJson = JSON.stringify(features.reduce(function(acc, f) {
    acc[f.slug] = Array.isArray(f.metricKeys) ? f.metricKeys : [];
    return acc;
  }, {}));

  var r = await pool.query(
    `SELECT id, name, description, product_id, persona_name, persona_role, persona_goal FROM customer_journeys WHERE id = $1 AND tenant_id = $2`,
    [journeyId, tenantId]
  );
  var journey = r.rows[0];

  if (!journey) {
    if (res.status) { res.status(404).json({ error: 'journey not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Journey not found'); }
    return;
  }

  // jcx-s4 -- AC4: a journey with a persona already saved never re-offers
  // the original discovery-sourced suggestions -- the scan only runs when
  // nothing is saved yet.
  var personaSuggestions = journey.persona_name
    ? []
    : await getPersonaSuggestions(pool, journey.product_id, repoRoot);

  // jae-s3 -- scoped to the journey's own product, same as personaSuggestions
  // above; per-field suppression (AC4, empty-field-only) happens client-side
  // in openPanel, since the SAME suggestion list applies to every stage in
  // this journey, but whether a given stage's own field is already filled
  // in is per-stage, not known until the panel opens for that stage.
  var fieldSuggestions = await getFieldSuggestions(pool, journey.product_id, repoRoot);

  var sr = await pool.query(
    `SELECT id, name, position, description, customer_actions, touchpoints, channel, emotion, pain_points, opportunities, moment_of_truth, position_x, position_y
     FROM customer_journey_stages WHERE journey_id = $1 ORDER BY position ASC`,
    [journeyId]
  );
  var stages = sr.rows || [];

  // jcx-s2 -- reconcile placeholder -> linked conversions before rendering,
  // so a mapping converted via its own approved discovery shows as linked
  // on THIS page load, not only after a second reload (AC2). repoRoot was
  // already computed above for the pipeline-state.json read -- reused here,
  // not recomputed.
  await checkPlaceholderConversions(pool, journeyId, tenantId, repoRoot);

  // ep2-s3 -- read every feature-to-stage mapping for this journey in one
  // query, grouped client-side (in this function) by stage id. No separate
  // tenant_id filter needed here -- the journey's own tenant ownership was
  // already verified above (the customer_journeys SELECT that 404s before
  // this point runs).
  var mr = await pool.query(
    `SELECT id, journey_stage_id, feature_slug, metric_keys, mapping_state FROM feature_customer_journey_stage_mappings WHERE journey_id = $1`,
    [journeyId]
  );
  var mappingsByStage = {};
  (mr.rows || []).forEach(function(m) {
    if (!mappingsByStage[m.journey_stage_id]) mappingsByStage[m.journey_stage_id] = [];
    mappingsByStage[m.journey_stage_id].push(m);
  });

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

  // ep2-s3 -- 14x14/20x20-viewBox/1.5px-stroke icon per DESIGN.md's own
  // icon spec, not a unicode glyph (rule 5 explicitly disallows those in
  // new work) -- matches MOMENT_OF_TRUTH_ICON/ARROW_UP_ICON/ARROW_DOWN_ICON's
  // own precedent above.
  var WARNING_ICON =
    '<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M10 2L1 17h18L10 2z"/><path d="M10 8v4"/><path d="M10 15h.01"/>' +
    '</svg>';

  // ep3-s2 -- 14x14/20x20-viewBox/1.5px-stroke icons per DESIGN.md's own
  // icon spec, not unicode glyphs -- matches MOMENT_OF_TRUTH_ICON/
  // ARROW_UP_ICON/ARROW_DOWN_ICON/WARNING_ICON's own precedent above.
  var CHECK_ICON =
    '<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M4 10l4 4 8-8"/>' +
    '</svg>';
  var CLOSE_ICON =
    '<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M5 5l10 10M15 5L5 15"/>' +
    '</svg>';

  // ep2-s3 -- builds one stage's Delivery-view annotation markup. Three
  // cases, never conflated: no mappings at all (AC1 boundary), a mapping
  // whose feature no longer resolves (AC2), and a normal mapping with
  // its selected metric keys/values (AC1/AC4). metricValues is read the
  // same optional-field way metricKeys already is (decisions.md D15) --
  // nothing populates it yet, so every value correctly falls through to
  // "No value recorded" today.
  function buildDeliveryAnnotations(stageId) {
    var mappings = mappingsByStage[stageId] || [];
    if (mappings.length === 0) {
      return '<p class="sw-stage-annotations-empty">No features mapped</p>';
    }
    return mappings.map(function(m) {
      // jcx-s1 AC5 -- a placeholder mapping renders with its own distinct
      // class/label, checked BEFORE the feature-resolution lookup below so
      // it never falls into (and never shares markup with) the existing
      // feature-not-found warning row (`/review` finding 1-M1).
      if (m.mapping_state === 'placeholder') {
        return '<div class="sw-feature-mapping-row sw-mapping--placeholder">' +
          '<span class="sw-placeholder-label">Placeholder: ' + escHtml(m.feature_slug) + '</span>' +
          '<button type="button" class="sw-placeholder-trigger" data-mapping-id="' + escHtml(m.id) + '" data-stage-id="' + escHtml(stageId) + '">Trigger</button>' +
        '</div>';
      }
      var feature = featuresBySlug[m.feature_slug];
      if (!feature) {
        return '<div class="sw-feature-mapping-row sw-feature-mapping-row--missing">' +
          '<span class="sw-feature-mapping-warning">' + WARNING_ICON + ' Feature not found (' + escHtml(m.feature_slug) + ')</span>' +
          '<button type="button" class="sw-feature-mapping-remove" data-mapping-id="' + escHtml(m.id) + '" data-stage-id="' + escHtml(stageId) + '">Remove</button>' +
        '</div>';
      }
      var metricKeys = Array.isArray(m.metric_keys) ? m.metric_keys : [];
      var metricsHtml;
      if (metricKeys.length === 0) {
        metricsHtml = '<p class="sw-feature-mapping-metrics-empty">No metrics selected</p>';
      } else {
        var values = (feature.metricValues && typeof feature.metricValues === 'object') ? feature.metricValues : {};
        metricsHtml = '<ul class="sw-feature-mapping-metric-values">' +
          metricKeys.map(function(k) {
            var hasValue = Object.prototype.hasOwnProperty.call(values, k);
            var rendered = hasValue ? escHtml(String(values[k])) : 'No value recorded';
            return '<li>' + escHtml(k) + ': ' + rendered + '</li>';
          }).join('') +
        '</ul>';
      }
      return '<div class="sw-feature-mapping-row">' +
        '<span class="sw-feature-mapping-name">' + escHtml(feature.name || feature.slug) + ' (' + escHtml(feature.slug) + ')</span>' +
        metricsHtml +
      '</div>';
    }).join('');
  }

  // jcx-s6 -- replaces ep3-s1's own buildCustomerExperienceAnnotations
  // (which rendered one stage's CX data as a plain stacked box, per-stage,
  // inside the shared #sw-journey-stages list). Per the post-release CX
  // visual-gap spike (spikes/post-release-cx-visual-gap-outcome.md), the
  // original spike's own swimlane/timeline finding was never actually
  // built -- this is that build. Renders the WHOLE grid at once (stage
  // columns + 5 swimlane rows: emotion, customer actions, touchpoints,
  // pain points, opportunities), not per-stage, so it replaces the old
  // function entirely rather than being called per-stage inside the list.
  // AC1, AC2, AC4, AC5, AC6, AC7.
  //
  // jae-s5 -- the column-template/data-row/track/pinned-label/accessible-
  // list mechanics below are now shared with the new Delivery grid via
  // buildSwimlaneGridShell (ADR-028: one canonical builder, two callers,
  // not two independent derivations of the same grid mechanics). This
  // function's own rendered output is byte-identical to before this
  // refactor -- confirmed by tests/check-jcx-s6-swimlane-grid.js passing
  // unchanged.
  function buildCustomerExperienceSwimlaneGrid(stagesForGrid) {
    function buildHeaderCell(s) {
      var nameHtml = (s.name && s.name.trim())
        ? '<span class="sw-stage-name">' + escHtml(s.name) + '</span>'
        : '<span class="sw-stage-name sw-stage-name--empty">—</span>';
      return '<div class="sw-cx-grid-cell sw-cx-grid-cell--header" data-stage-id="' + escHtml(s.id) + '" tabindex="0">' +
        nameHtml +
        (s.moment_of_truth ? '<span class="sw-stage-moment-badge">' + MOMENT_OF_TRUTH_ICON + ' Moment of truth</span>' : '') +
        // jcx-s6 -- .sw-stage-edit is already document-delegated (confirmed
        // by reading its own click handler), added specifically because it
        // already needed to work from inside drawflow canvas nodes -- a
        // context exactly as structurally distant from #sw-journey-stages
        // as this grid is. Reused here with zero new JS. "Map feature"/
        // "Add placeholder" are deliberately NOT included -- genuinely
        // delivery-chrome (AC6), still reachable from the Delivery tab.
        // jcx-s7 AC3 -- the cell itself is now also a single-click/keyboard
        // target for opening the same panel (tabindex above; click/keydown
        // delegation below) -- this link stays as a clear, visible label
        // for what the larger target does, not the only way to reach it.
        '<a href="#" class="sw-stage-edit" data-stage-id="' + escHtml(s.id) + '">Edit</a>' +
      '</div>';
    }

    function buildTextCellsRow(field) {
      return stagesForGrid.map(function(s) {
        // jcx-s7 AC4 -- empty values get a muted, visually-dulled em-dash
        // treatment (sw-cx-grid-cell--empty), distinct from a real value --
        // .trim() matters: a whitespace-only value must still count as
        // empty, matching this codebase's own existing emptiness convention.
        return (s[field] && s[field].trim())
          ? '<div class="sw-cx-grid-cell" data-stage-id="' + escHtml(s.id) + '">' + escHtml(s[field]) + '</div>'
          : '<div class="sw-cx-grid-cell sw-cx-grid-cell--empty" data-stage-id="' + escHtml(s.id) + '">—</div>';
      }).join('');
    }

    // The curve is ONE element (not N per-stage cells like the other rows),
    // so it must explicitly span every column -- CSS grid auto-placement
    // would otherwise drop it into just the first column, leaving its own
    // width:100% stretch only the narrowest possible space.
    var rows = [
      { rowClass: 'emotion', label: 'Emotion', cellsHtml: '<div style="grid-column:1 / -1">' + buildEmotionCurve(stagesForGrid) + '</div>' },
      { rowClass: 'actions', label: 'Customer actions', cellsHtml: buildTextCellsRow('customer_actions') },
      { rowClass: 'touchpoints', label: 'Touchpoints', cellsHtml: buildTextCellsRow('touchpoints') },
      { rowClass: 'pain-points', label: 'Pain points', cellsHtml: buildTextCellsRow('pain_points') },
      { rowClass: 'opportunities', label: 'Opportunities', cellsHtml: buildTextCellsRow('opportunities') }
    ];

    // jcx-s6 AC5 -- ONE grid-wide accessible linear structure covering
    // every field, in document order -- supersedes jcx-s3's own
    // emotion-only a11y list (removed from buildEmotionCurve above).
    function buildA11yEntry(s) {
      return escHtml(s.name) + ': ' +
        'Emotion: ' + (s.emotion ? escHtml(s.emotion) : 'No emotion data yet') + '. ' +
        'Customer actions: ' + (s.customer_actions ? escHtml(s.customer_actions) : 'Not set') + '. ' +
        'Touchpoints: ' + (s.touchpoints ? escHtml(s.touchpoints) : 'Not set') + '. ' +
        'Pain points: ' + (s.pain_points ? escHtml(s.pain_points) : 'Not set') + '. ' +
        'Opportunities: ' + (s.opportunities ? escHtml(s.opportunities) : 'Not set');
    }

    // No outer wrapping div here -- the caller's own
    // .sw-stage-annotations--customer-experience.sw-cx-swimlane-grid div
    // IS the grid container, matching the persona-card/emotion-curve-container
    // convention of applying an extra class directly to that one shared
    // wrapper rather than nesting a second div inside it.
    return buildSwimlaneGridShell(stagesForGrid, {
      buildHeaderCell: buildHeaderCell,
      rows: rows,
      a11yListClass: 'sw-cx-a11y-list',
      buildA11yEntry: buildA11yEntry
    });
  }

  // jae-s5 -- ADR-028 canonical builder. The ONLY place that computes the
  // shared column template, builds a data row (pinned label + scrollable
  // track + grid cells), and assembles the visually-hidden accessible
  // list. buildCustomerExperienceSwimlaneGrid (above) and
  // buildDeliverySwimlaneGrid (below) both call this -- neither re-derives
  // these mechanics independently. opts: { buildHeaderCell(s) -> html,
  // rows: [{rowClass, label, cellsHtml}], a11yListClass: string,
  // buildA11yEntry(s) -> html (used as one <li> per stage) }.
  function buildSwimlaneGridShell(stagesForGrid, opts) {
    // jcx-s6 AC1/AC2/AC7 -- one shared column template drives every row
    // (header + all data rows), so stage columns stay vertically aligned
    // whether or not the track is scrolled. minmax(200px,1fr): columns
    // grow via 1fr to fill the track when it fits (AC3's ≥80%-fill case);
    // columns floor at 200px and the track overflows/scrolls once
    // stageCount*200px exceeds the track's own width (AC7).
    var gridTemplateColumns = 'repeat(' + stagesForGrid.length + ', minmax(200px, 1fr))';

    function buildDataRow(rowClass, label, cellsHtml) {
      return '<div class="sw-cx-grid-row sw-cx-grid-row--' + rowClass + '">' +
        '<div class="sw-cx-row-label">' + escHtml(label) + '</div>' +
        '<div class="sw-cx-grid-row-track" tabindex="0">' +
          '<div class="sw-cx-grid-row-cells" style="grid-template-columns:' + gridTemplateColumns + '">' + cellsHtml + '</div>' +
        '</div>' +
      '</div>';
    }

    var headerCellsHtml = stagesForGrid.map(opts.buildHeaderCell).join('');
    var rowsHtml = opts.rows.map(function(row) {
      return buildDataRow(row.rowClass, row.label, row.cellsHtml);
    }).join('');
    var a11yListHtml = '<ul class="' + opts.a11yListClass + ' sw-visually-hidden">' +
      stagesForGrid.map(function(s) { return '<li>' + opts.buildA11yEntry(s) + '</li>'; }).join('') +
    '</ul>';

    return '<div class="sw-cx-grid-row sw-cx-grid-row--header">' +
        '<div class="sw-cx-row-label"></div>' +
        '<div class="sw-cx-grid-row-track" tabindex="0">' +
          '<div class="sw-cx-grid-row-cells" style="grid-template-columns:' + gridTemplateColumns + '">' + headerCellsHtml + '</div>' +
        '</div>' +
      '</div>' +
      rowsHtml +
      a11yListHtml;
  }

  // jcx-s3 -- Y-position per emotion value: SVG y increases downward, so
  // SMALLER y = visually HIGHER. positive highest, negative lowest,
  // neutral/mixed in the middle -- matches AC1's own "conventional
  // emotion-curve shape" wording.
  var EMOTION_CURVE_Y = { positive: 20, neutral: 60, mixed: 60, negative: 100 };
  var EMOTION_CURVE_COLOR = { positive: 'var(--success)', negative: 'var(--danger)', mixed: 'var(--warn)', neutral: 'var(--ink-2)' };
  var EMOTION_CURVE_HEIGHT = 140;

  // jcx-s4 -- persona card (saved state) + editor (unset state, or opened
  // via "Edit persona"). AC1-AC5. Suggestions are RAW TEXT only -- never
  // auto-split into the 3 fields (per /review finding 1-M1); clicking a
  // suggestion fills a read-only reference area the operator reads while
  // typing the 3 fields themselves (wired in the client script below).
  function buildPersonaCard(journeyRow, suggestions) {
    var hasSavedPersona = !!journeyRow.persona_name;

    var cardHtml = hasSavedPersona
      ? '<div class="sw-persona-card">' +
          '<p class="sw-persona-card-row"><strong>Name:</strong> ' + escHtml(journeyRow.persona_name) + '</p>' +
          '<p class="sw-persona-card-row"><strong>Role:</strong> ' + (journeyRow.persona_role ? escHtml(journeyRow.persona_role) : 'Not set') + '</p>' +
          '<p class="sw-persona-card-row"><strong>Goal:</strong> ' + (journeyRow.persona_goal ? escHtml(journeyRow.persona_goal) : 'Not set') + '</p>' +
          '<button type="button" class="sw-persona-edit-btn">Edit persona</button>' +
        '</div>'
      : '';

    // AC2 -- an empty suggestions array (no features, or none with a
    // readable "Who It Affects") falls through to a plain blank form,
    // never an error or broken empty state.
    var suggestionsHtml = suggestions.length > 0
      ? '<div class="sw-persona-suggestions">' +
          '<p>Suggested starting points, from this product\'s own features:</p>' +
          '<ul>' +
            suggestions.map(function(s) {
              return '<li><button type="button" class="sw-persona-suggestion-btn" data-text="' + escHtml(s.personaText) + '">' +
                escHtml(s.featureSlug) + ': ' + escHtml(s.personaText) +
              '</button></li>';
            }).join('') +
          '</ul>' +
        '</div>'
      : '';

    var editorHtml =
      '<form class="sw-persona-editor-form' + (hasSavedPersona ? '' : ' sw-persona-editor-form--open') + '">' +
        suggestionsHtml +
        '<textarea class="sw-persona-reference-text" readonly aria-label="Selected suggestion reference text"></textarea>' +
        '<label for="sw-persona-name-input">Name</label>' +
        '<input type="text" id="sw-persona-name-input" class="sw-persona-name-input" value="' + escHtml(journeyRow.persona_name || '') + '">' +
        '<label for="sw-persona-role-input">Role</label>' +
        '<input type="text" id="sw-persona-role-input" class="sw-persona-role-input" value="' + escHtml(journeyRow.persona_role || '') + '">' +
        '<label for="sw-persona-goal-input">Goal</label>' +
        '<input type="text" id="sw-persona-goal-input" class="sw-persona-goal-input" value="' + escHtml(journeyRow.persona_goal || '') + '">' +
        '<button type="submit" class="sw-persona-save-btn">Save persona</button>' +
        (hasSavedPersona ? '<button type="button" class="sw-persona-cancel-btn">Cancel</button>' : '') +
      '</form>';

    return '<div class="sw-persona-card-container">' + cardHtml + editorHtml + '</div>';
  }

  // jcx-s3/jcx-s6 -- a connected emotion curve spanning ALL stages, rendered
  // ONCE as the grid's own Emotion row (not per-stage). AC1-AC3.
  //
  // jcx-s6 -- the curve's own a11y list (jcx-s3's original AC5 mechanism)
  // is now superseded by buildCustomerExperienceSwimlaneGrid's single
  // grid-wide accessible list covering every field, not emotion alone --
  // removed here to avoid two competing lists. jcx-s6 AC3 -- each point now
  // carries its own stage name directly on the chart (not only in a
  // separately-scrolled list), and the SVG's own width="100%" (viewBox
  // kept at a fixed internal coordinate system, preserveAspectRatio="none")
  // lets it stretch to fill whatever width its own grid row track provides
  // -- the same track whose CSS grid-template-columns (set by the caller)
  // already handles the ≥80%-fill case (few stages: columns grow via 1fr
  // to fill the track) and the many-stage overflow/scroll case (AC7: columns
  // floor at their own minmax minimum, track overflows, scrolls).
  function buildEmotionCurve(stagesForCurve) {
    var anyEmotionSet = stagesForCurve.some(function(s) { return !!s.emotion; });
    if (!anyEmotionSet) {
      // AC3 -- the common case (confirmed via /clarify: existing emotion
      // data is mostly empty today), not a rare edge case.
      return '<div class="sw-emotion-curve-empty" role="status">' +
        '<p>No emotion data yet. Set each stage\'s emotion in the side panel to see the journey\'s emotional arc.</p>' +
      '</div>';
    }

    // Fixed internal coordinate system (0..1000 on X) -- the SVG's own
    // width="100%" + preserveAspectRatio="none" stretches this to whatever
    // real pixel width its row track provides, so point X positions are
    // always a simple fraction of 1000, not a real pixel computation.
    var viewBoxWidth = 1000;
    var stepX = stagesForCurve.length > 1 ? viewBoxWidth / stagesForCurve.length : viewBoxWidth / 2;

    var points = stagesForCurve.map(function(s, idx) {
      return {
        x: stepX * (idx + 0.5),
        y: s.emotion ? EMOTION_CURVE_Y[s.emotion] : EMOTION_CURVE_Y.neutral,
        emotion: s.emotion,
        name: s.name
      };
    });

    // AC2 -- the connecting line passes through EVERY stage's own x
    // position (including unset ones, at a neutral fallback y) so the two
    // set stages on either side of a gap still connect correctly around
    // it, per the AC's own wording -- never silently skipped.
    var polylinePoints = points.map(function(p) { return p.x + ',' + p.y; }).join(' ');

    var pointsHtml = points.map(function(p) {
      // jcx-s6 AC3 -- stage name directly on the chart, above the
      // emotion/"No data yet" label, not only in a separately-scrolled list.
      var nameLabel = '<text x="' + p.x + '" y="' + (p.y + 22) + '" text-anchor="middle" font-size="11" font-weight="600" fill="var(--ink)">' + escHtml(p.name) + '</text>';
      if (!p.emotion) {
        return '<g class="sw-emotion-curve-point sw-emotion-curve-point--unset">' +
          '<circle cx="' + p.x + '" cy="' + p.y + '" r="6" fill="none" stroke="var(--ink-2)" stroke-width="1.5" stroke-dasharray="2,2"/>' +
          nameLabel +
          '<text x="' + p.x + '" y="' + (p.y + 36) + '" text-anchor="middle" font-size="11" fill="var(--ink-2)">No data yet</text>' +
        '</g>';
      }
      return '<g class="sw-emotion-curve-point sw-emotion-curve-point--' + escHtml(p.emotion) + '">' +
        '<circle cx="' + p.x + '" cy="' + p.y + '" r="6" fill="' + EMOTION_CURVE_COLOR[p.emotion] + '"/>' +
        nameLabel +
        '<text x="' + p.x + '" y="' + (p.y + 36) + '" text-anchor="middle" font-size="11" fill="var(--ink)">' + escHtml(p.emotion) + '</text>' +
      '</g>';
    }).join('');

    return '<div class="sw-emotion-curve">' +
      '<svg width="100%" height="' + EMOTION_CURVE_HEIGHT + '" viewBox="0 0 ' + viewBoxWidth + ' ' + EMOTION_CURVE_HEIGHT + '" preserveAspectRatio="none" aria-hidden="true">' +
        '<polyline points="' + polylinePoints + '" fill="none" stroke="var(--line)" stroke-width="2"/>' +
        pointsHtml +
      '</svg>' +
    '</div>';
  }

  // ep3-s2 -- health state is a pure function of the already-fetched
  // mappingsByStage data (ep2-s3) -- no new query. Zero mappings => none
  // (❌); >=1 mapping, none with metric_keys.length>0 => partial (⚠️);
  // >=1 mapping with at least one having metric_keys.length>0 => covered
  // (✅).
  function computeStageHealth(stageId) {
    var mappings = mappingsByStage[stageId] || [];
    if (mappings.length === 0) return 'none';
    var hasMetrics = mappings.some(function(m) {
      return Array.isArray(m.metric_keys) && m.metric_keys.length > 0;
    });
    return hasMetrics ? 'covered' : 'partial';
  }

  var HEALTH_META = {
    covered: { icon: CHECK_ICON, label: 'Covered', className: 'sw-stage-health--covered' },
    partial: { icon: WARNING_ICON, label: 'Needs metrics', className: 'sw-stage-health--partial' },
    none: { icon: CLOSE_ICON, label: 'No coverage', className: 'sw-stage-health--none' }
  };

  // ep3-s2 -- icon + accessible label together, never colour/icon alone
  // (MC-A11Y-02, AC5).
  function buildHealthIndicator(stageId) {
    var health = computeStageHealth(stageId);
    var meta = HEALTH_META[health];
    return '<span class="sw-stage-health ' + meta.className + '" role="img" aria-label="Health: ' + meta.label + '">' +
      meta.icon + ' ' + meta.label +
    '</span>';
  }

  // jae-s5 -- replaces the per-stage .sw-stage-card/.sw-stage-annotations
  // --delivery card-stack loop (#sw-journey-stages, removed below) with a
  // swimlane grid, reusing buildSwimlaneGridShell (ADR-028) -- the same
  // shared mechanics the CX grid uses. 2 data rows: Coverage status
  // (computed, via buildHealthIndicator) and Mapped features
  // (buildDeliveryAnnotations's own existing per-stage output, plus the
  // existing Map feature/Add placeholder/placeholder-add-form markup,
  // moved in unchanged -- decisions.md 2026-10-15). Reorder controls
  // render in the header cell (unlike the CX grid's header cell, which
  // deliberately omits them -- see jcx-s6's own comment above) since this
  // is the only view with a reorder surface.
  function buildDeliverySwimlaneGrid(stagesForGrid) {
    function buildHeaderCell(s) {
      var nameHtml = (s.name && s.name.trim())
        ? '<span class="sw-stage-name">' + escHtml(s.name) + '</span>'
        : '<span class="sw-stage-name sw-stage-name--empty">—</span>';
      var isFirst = stagesForGrid[0] === s;
      var isLast = stagesForGrid[stagesForGrid.length - 1] === s;
      var reorderControls = stagesForGrid.length > 1
        ? '<span class="sw-stage-reorder-controls">' +
            '<button type="button" class="sw-stage-move" data-stage-id="' + escHtml(s.id) + '" data-direction="up"' + (isFirst ? ' disabled' : '') + ' aria-label="Move stage up">' + ARROW_UP_ICON + '</button>' +
            '<button type="button" class="sw-stage-move" data-stage-id="' + escHtml(s.id) + '" data-direction="down"' + (isLast ? ' disabled' : '') + ' aria-label="Move stage down">' + ARROW_DOWN_ICON + '</button>' +
          '</span>'
        : '';
      return '<div class="sw-cx-grid-cell sw-cx-grid-cell--header" data-stage-id="' + escHtml(s.id) + '" tabindex="0">' +
        nameHtml +
        (s.moment_of_truth ? '<span class="sw-stage-moment-badge">' + MOMENT_OF_TRUTH_ICON + ' Moment of truth</span>' : '') +
        reorderControls +
        '<a href="#" class="sw-stage-edit" data-stage-id="' + escHtml(s.id) + '">Edit</a>' +
      '</div>';
    }

    var coverageCellsHtml = stagesForGrid.map(function(s) {
      return '<div class="sw-cx-grid-cell" data-stage-id="' + escHtml(s.id) + '">' + buildHealthIndicator(s.id) + '</div>';
    }).join('');

    // buildDeliveryAnnotations's own existing 4-case output (no mappings /
    // placeholder / missing-feature / normal-mapping-with-metrics) is moved
    // in unchanged, followed by the existing Map feature/Add placeholder
    // buttons and the inline placeholder-add-form -- all 4 pieces of
    // markup byte-identical to today's card-stack version (decisions.md
    // 2026-10-15). The "No features mapped" case already carries its own
    // muted styling (.sw-stage-annotations-empty, existing CSS rule) --
    // no new empty-cell class needed here.
    var mappedFeaturesCellsHtml = stagesForGrid.map(function(s) {
      return '<div class="sw-cx-grid-cell" data-stage-id="' + escHtml(s.id) + '">' +
        buildDeliveryAnnotations(s.id) +
        '<button type="button" class="sw-stage-map-feature" data-stage-id="' + escHtml(s.id) + '">Map feature</button>' +
        '<button type="button" class="sw-stage-add-placeholder" data-stage-id="' + escHtml(s.id) + '">Add placeholder</button>' +
        '<form class="sw-placeholder-add-form" data-stage-id="' + escHtml(s.id) + '">' +
          '<label for="sw-placeholder-name-' + escHtml(s.id) + '">Placeholder name</label>' +
          '<input type="text" id="sw-placeholder-name-' + escHtml(s.id) + '" class="sw-placeholder-name-input" required>' +
          '<button type="submit" class="sw-placeholder-add-submit">Create</button>' +
          '<button type="button" class="sw-placeholder-add-cancel">Cancel</button>' +
        '</form>' +
      '</div>';
    }).join('');

    var rows = [
      { rowClass: 'coverage-status', label: 'Coverage status', cellsHtml: coverageCellsHtml },
      { rowClass: 'mapped-features', label: 'Mapped features', cellsHtml: mappedFeaturesCellsHtml }
    ];

    function buildA11yEntry(s) {
      var health = HEALTH_META[computeStageHealth(s.id)].label;
      var mappings = mappingsByStage[s.id] || [];
      var mappedSummary = mappings.length === 0 ? 'No features mapped' : mappings.length + ' feature mapping(s)';
      return escHtml(s.name) + '. Coverage status: ' + escHtml(health) + '. Mapped features: ' + escHtml(mappedSummary);
    }

    return buildSwimlaneGridShell(stagesForGrid, {
      buildHeaderCell: buildHeaderCell,
      rows: rows,
      a11yListClass: 'sw-delivery-a11y-list',
      buildA11yEntry: buildA11yEntry
    });
  }

  // ep3-s2 AC4 -- X counts only 'covered' stages; Y is the total stage
  // count regardless of health state.
  var coveredStageCount = stages.filter(function(s) { return computeStageHealth(s.id) === 'covered'; }).length;
  var summaryBarHtml = '<p class="sw-journey-health-summary">' + coveredStageCount + ' of ' + stages.length + ' stages have metric coverage</p>';

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

  // ep2-s2 -- metric-key sub-view. Hidden by default; shown by the script
  // block below when a feature is clicked. Built client-side from the
  // embedded featureMetricKeys map (mirrors ep1-s3's own stageData
  // embedding precedent -- embed once server-side, populate via JS at
  // interaction time, no second round trip).
  var featureMappingViewHtml =
    '<div id="sw-feature-mapping-view" class="sw-feature-mapping-view" style="display:none">' +
      '<h3 id="sw-feature-mapping-name"></h3>' +
      '<p id="sw-feature-mapping-slug" class="sw-feature-picker-slug"></p>' +
      '<div id="sw-feature-mapping-metrics"></div>' +
      '<button type="button" id="sw-feature-mapping-back">Back</button>' +
      '<button type="button" id="sw-feature-mapping-save">Save mapping</button>' +
      '<span id="sw-feature-mapping-error" class="sw-feature-picker-message" role="status"></span>' +
    '</div>';

  var featurePickerModalHtml =
    '<div id="sw-feature-picker-modal" class="sw-feature-picker-modal" role="dialog" aria-modal="true" aria-labelledby="sw-feature-picker-title" aria-hidden="true">' +
      '<div class="sw-feature-picker-header">' +
        '<h2 id="sw-feature-picker-title">Map feature</h2>' +
        '<button type="button" id="sw-feature-picker-close" aria-label="Close feature picker">✕</button>' +
      '</div>' +
      featurePickerBodyHtml +
      featureMappingViewHtml +
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
      '.sw-stage-add-placeholder{margin-left:8px}' +
      // jcx-s1 AC5 -- never shares styling with .sw-feature-mapping-warning
      // (which uses var(--danger)); a placeholder is an intentional,
      // neutral-state slot, not an error.
      '.sw-placeholder-label{color:var(--ink-2);font-style:italic}' +
      '.sw-placeholder-trigger{margin-left:8px}' +
      '.sw-placeholder-add-form{display:none;margin-top:8px;gap:6px;align-items:center}' +
      '.sw-placeholder-add-form--open{display:flex}' +
      '.sw-placeholder-trigger-success{color:var(--success);margin-left:8px}' +
      '.sw-feature-mapping-view{margin-top:4px}' +
      '.sw-feature-mapping-metric-label{display:block;font-size:13px;color:var(--ink);margin:6px 0}' +
      '#sw-feature-mapping-save{margin-left:8px}' +
    '</style>';

  // Full stage data embedded for the side panel to populate from, keyed by
  // id, client-side -- avoids a second round-trip when the panel opens.
  var stageDataJson = JSON.stringify(stages);

  // jae-s3 -- same suggestion list applies to every stage in this journey
  // (scoped by product, not by stage); embedded once, consumed by openPanel.
  var fieldSuggestionsJson = JSON.stringify(fieldSuggestions);

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
      // jae-s3 -- suggestion buttons are injected/cleared by openPanel
      // itself (per-stage: whether this field is currently empty is
      // per-stage, even though the suggestion list is per-journey).
      '<div id="sw-field-suggestions-customer_actions" class="sw-field-suggestions" data-field="customer_actions"></div>' +
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
      '<div id="sw-field-suggestions-pain_points" class="sw-field-suggestions" data-field="pain_points"></div>' +
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
      // jcx-s7 AC1 -- the base/default color is now muted (var(--ink-2)),
      // not success-green: a re-read of the actual .catch handler below
      // found it reused THIS SAME success-colored element/class for its
      // own error text, so a failed save could visually read as a
      // successful one. --error now overrides to var(--danger) explicitly.
      '.sw-stage-panel-saved{display:none;font-size:12px;color:var(--ink-2)}' +
      '.sw-stage-panel-saved--visible{display:inline}' +
      '.sw-stage-panel-saved--error{color:var(--danger)}' +
      '.sw-stage-moment-badge{display:inline-flex;align-items:center;gap:4px;margin-left:8px;font-size:11px;color:var(--warn)}' +
      '.sw-stage-card{cursor:grab}' +
      '.sw-stage-reorder-controls{display:inline-flex;gap:2px;margin-left:8px;vertical-align:middle}' +
      '.sw-stage-move{background:none;border:1px solid var(--line);border-radius:4px;padding:2px;color:var(--ink-2);cursor:pointer;display:inline-flex}' +
      '.sw-stage-move:disabled{opacity:0.35;cursor:default}' +
      '.sw-stage-reorder-error{display:none;font-size:12px;color:var(--danger);margin-top:8px}' +
      '.sw-stage-reorder-error--visible{display:block}' +
      '@media (max-width:768px){.sw-stage-panel{width:100vw}}' +
      '.sw-stage-annotations{display:none;margin:4px 0 12px 0;padding:8px 10px;' +
        'border:1px solid var(--line);border-radius:6px;background:var(--bg);font-size:12px}' +
      '.sw-journey-canvas--view-delivery .sw-stage-annotations--delivery{display:block}' +
      '#sw-drawflow-canvas{display:none;height:600px;width:100%}' +
      '.sw-journey-canvas--view-canvas #sw-drawflow-canvas{display:block}' +
      // ic-s4 AC1a -- visible, non-default focus style for keyboard-focused
      // canvas nodes. Selecting our own "sw-drawflow-node" class (not
      // drawflow's own "drawflow-node") matches this file's existing
      // sw- prefixed selector convention.
      '.sw-drawflow-node:focus{outline:3px solid var(--accent);outline-offset:2px}' +
      // ic-s1 AC4 regression (found via live browser render check): the
      // "No stages yet" message lives inside #sw-journey-stages, which the
      // rule immediately above hides on the canvas view -- a 0-stage
      // journey showed a blank canvas instead of that message. The jsdom
      // AC4 test only asserted the text's PRESENCE in the HTML, not
      // whether the CSS toggle rules left it visible, so it passed despite
      // the regression. #sw-drawflow-canvas-empty mirrors the exact same
      // hidden-by-default/shown-in-canvas-view pattern as #sw-drawflow-canvas
      // itself, as a sibling (not nested inside #sw-drawflow-canvas, so
      // drawflow\'s own start() never overwrites it -- it is only ever
      // rendered when there are 0 stages, i.e. drawflow is never
      // initialised at all in that case).
      '#sw-drawflow-canvas-empty{display:none}' +
      '.sw-journey-canvas--view-canvas #sw-drawflow-canvas-empty{display:block}' +
      '.sw-feature-mapping-row{margin-bottom:8px}' +
      '.sw-feature-mapping-row:last-child{margin-bottom:0}' +
      '.sw-feature-mapping-warning{color:var(--danger)}' +
      '.sw-feature-mapping-remove{margin-left:8px}' +
      '.sw-feature-mapping-metric-values{margin:4px 0 0 0;padding-left:16px}' +
      '.sw-stage-annotations-empty,.sw-feature-mapping-metrics-empty{color:var(--ink-2)}' +
      '.sw-canvas-view-toggle{display:flex;gap:6px;margin-bottom:12px}' +
      '.sw-canvas-view-toggle-btn{background:none;border:1px solid var(--line);border-radius:6px;' +
        'padding:6px 12px;font-size:13px;color:var(--ink-2);cursor:pointer}' +
      '.sw-canvas-view-toggle-btn--active{background:var(--accent);color:var(--on-accent,#fff);border-color:var(--accent)}' +
      '.sw-journey-canvas--view-customer-experience .sw-stage-annotations--customer-experience{display:block}' +
      '.sw-persona-card{padding:12px;border:1px solid var(--line);border-radius:8px;margin-bottom:8px}' +
      '.sw-persona-card-row{margin:4px 0}' +
      '.sw-persona-editor-form{display:none;flex-direction:column;gap:6px;max-width:400px}' +
      '.sw-persona-editor-form--open{display:flex}' +
      '.sw-persona-suggestions ul{list-style:none;margin:4px 0;padding:0}' +
      '.sw-persona-suggestion-btn{display:block;width:100%;text-align:left;padding:6px;margin-bottom:4px;' +
        'border:1px solid var(--line);border-radius:6px;background:var(--surface);cursor:pointer;font-size:12px}' +
      '.sw-persona-reference-text{display:none;width:100%;min-height:50px;font-size:12px;color:var(--ink-2)}' +
      '.sw-persona-reference-text--visible{display:block}' +
      // jae-s3 -- reuses sw-persona-suggestion-btn's own exact styling
      // convention (ADR-026), just a different container class since
      // these sit directly under a field's own textarea, not inside a
      // <ul> list.
      '.sw-field-suggestions{margin:-8px 0 14px 0}' +
      '.sw-field-suggestion-btn{display:block;width:100%;text-align:left;padding:6px;margin-bottom:4px;' +
        'border:1px solid var(--line);border-radius:6px;background:var(--surface);cursor:pointer;font-size:12px}' +
      // jae-s4 AC1 -- the AI-generated fallback suggestion is visually
      // distinguished by its own border style AND its own "AI suggestion:"
      // text prefix (set in openPanel above) -- label text, not colour
      // alone, per MC-A11Y-02.
      '.sw-field-suggestion-btn--ai{border-style:dashed}' +
      '.sw-emotion-curve{width:100%}' +
      '.sw-emotion-curve-empty{padding:24px;text-align:center;color:var(--ink-2)}' +
      '.sw-visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}' +
      // jcx-s6 -- swimlane grid (AC1/AC2/AC3/AC6/AC7). sw-cx-row-label is
      // the pinned, non-scrolling label column; sw-cx-grid-row-track is
      // the ONLY element that scrolls horizontally (overflow-x:auto,
      // tabindex=0 for keyboard reachability per AC7) -- its inner
      // sw-cx-grid-row-cells div carries the real CSS grid-template-columns
      // (set inline per-row by the server, repeat(N, minmax(200px,1fr)):
      // columns grow via 1fr to fill the track when it fits -- AC3's
      // ≥80%-fill case -- and floor at 200px, overflowing/scrolling once
      // stageCount*200px exceeds the track's own width -- AC7).
      // jcx-hotfix3 -- NOT '.sw-cx-swimlane-grid{display:block}' here: that
      // rule has the SAME specificity as the base '.sw-stage-annotations
      // {display:none}' rule (both single-class selectors) and, coming
      // later in the stylesheet, would unconditionally win -- making the
      // grid visible in EVERY view (confirmed live: the Delivery tab showed
      // both the grid AND the old delivery stage list simultaneously).
      // Visibility is entirely handled by the existing, correctly-scoped
      // '.sw-journey-canvas--view-customer-experience .sw-stage-annotations
      // --customer-experience{display:block}' rule below -- the grid
      // container already carries both classes, so no extra rule is needed
      // or safe to add here.
      // jcx-s7 AC5 -- 10px/12px were off the repo's own 8px spacing scale
      // (neither a multiple of 8, nor matching each other); normalized to
      // 8px both here and on sw-cx-grid-row-cells' own column-gap below.
      '.sw-cx-grid-row{display:flex;align-items:stretch;border-bottom:1px solid var(--line);padding:8px 0}' +
      '.sw-cx-grid-row:last-of-type{border-bottom:none}' +
      '.sw-cx-row-label{flex:0 0 150px;width:150px;font-size:11px;font-weight:700;text-transform:uppercase;' +
        'letter-spacing:0.03em;color:var(--ink-2);padding:6px 10px}' +
      '.sw-cx-grid-row-track{flex:1 1 auto;overflow-x:auto}' +
      '.sw-cx-grid-row-cells{display:grid;column-gap:8px;align-items:start}' +
      '.sw-cx-grid-cell{font-size:13px;color:var(--ink);padding:6px 10px}' +
      // jcx-s7 AC4 -- muted/dulled treatment for an empty cell or an
      // empty/default stage name, distinct from a real value.
      '.sw-cx-grid-cell--empty{color:var(--ink-2)}' +
      '.sw-stage-name--empty{color:var(--ink-2)}' +
      // jcx-s7 AC3 -- the header cell is now a single-click/keyboard
      // target for opening the edit panel (not only the nested link);
      // cursor + focus-visible style signal that without relying on a
      // double-click convention (see spike's own correction note).
      '.sw-cx-grid-cell--header{font-size:14px;font-weight:700;cursor:pointer}' +
      '.sw-cx-grid-cell--header:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
      '.sw-cx-grid-cell--header .sw-stage-edit{display:block;margin-top:4px;font-size:12px;font-weight:400}' +
      '.sw-cx-grid-row--header{background:var(--surface);border-radius:6px 6px 0 0}' +
      '.sw-stage-health{display:inline-flex;align-items:center;gap:4px;margin-left:8px;font-size:11px}' +
      '.sw-stage-health--covered{color:var(--success)}' +
      '.sw-stage-health--partial{color:var(--warn)}' +
      '.sw-stage-health--none{color:var(--danger)}' +
      // cnsf-s1 -- override drawflow's own vendor-default node/port/
      // connector colours (background:#0ff, selected:red, input port
      // #ff0, connector stroke #4682b4 -- confirmed via direct read of
      // node_modules/drawflow/dist/drawflow.min.css) with the app's own
      // design tokens. #sw-drawflow-canvas is an ID selector, which always
      // outranks any number of class selectors regardless of source
      // order -- no change to the existing <style>-before-<link> ordering,
      // no !important. Node width/padding/position are untouched
      // (out of scope) -- only colour/border/stroke values are set.
      '#sw-drawflow-canvas .drawflow-node{background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:8px}' +
      '#sw-drawflow-canvas .drawflow-node.selected{background:var(--accent-soft);border-color:var(--accent)}' +
      '#sw-drawflow-canvas .drawflow-node .input,#sw-drawflow-canvas .drawflow-node .output{background:var(--surface);border:2px solid var(--line)}' +
      '#sw-drawflow-canvas .connection .main-path{stroke:var(--line);stroke-width:2px}' +
      '.sw-journey-health-summary{font-size:13px;color:var(--ink-2);margin-bottom:8px}' +
    '</style>' +
    // ic-s1 -- the drawflow stylesheet must actually be requested, or node
    // layout/connection-line rendering is unstyled. Mirrors csd-s1's own
    // <link>-before-<script> ordering for the mermaid vendor asset.
    '<link rel="stylesheet" href="/vendor/drawflow.min.css">';

  // AC1: "+ Add stage" inserts an unsaved, focused inline-name stage card --
  // pure client-side DOM behaviour, no server round-trip until save (RISK-ACCEPT,
  // see decisions.md -- not E2E-covered, manual verification only).
  // ep2-s3 -- 3-way Canvas/Customer experience/Delivery view toggle,
  // client-side CSS-class swap only, no server round-trip (AC3,
  // design.md lines 125-131). "Customise" is out of scope for this story.
  var viewToggleHtml =
    '<div class="sw-canvas-view-toggle" role="group" aria-label="Canvas view">' +
      '<button type="button" class="sw-canvas-view-toggle-btn sw-canvas-view-toggle-btn--active" data-view="canvas" aria-pressed="true">Canvas</button>' +
      '<button type="button" class="sw-canvas-view-toggle-btn" data-view="customer-experience" aria-pressed="false">Customer experience</button>' +
      '<button type="button" class="sw-canvas-view-toggle-btn" data-view="delivery" aria-pressed="false">Delivery</button>' +
    '</div>';

  // ic-s1 -- drawflow canvas nodes, built from the SAME per-stage data as
  // the legacy list below. Auto-connects stages in sequence order; manual
  // connection-drawing is never exposed to the operator for journeys
  // (epic-level scope decision, decisions.md).
  //
  // addNode(name, inputs, outputs, posx, posy, class, data, html) does NOT
  // use its first "name" argument as a connectable id -- it returns its OWN
  // auto-incrementing numeric id (1, 2, 3...), and that returned id, not the
  // stage's own string id, is what addConnection(id_output, id_input, ...)
  // requires (confirmed against the real library: node_modules/drawflow/
  // README.md's own addConnection example uses numeric ids "15,16", and a
  // live browser check against the actual loaded window.Drawflow instance
  // threw "Cannot read properties of undefined (reading 'data')" from
  // inside drawflow.min.js the moment addConnection was called with a
  // stage's string id instead). Each node's own generated script assigns
  // its real numeric id into a lookup object keyed by stage id, which the
  // connections script then reads back.
  var drawflowNodesScript = 'var __icS1NodeIds={};var __icS2NodeIdToStageId={};' + stages.map(function(s, idx) {
    var nodeHtml =
      '<div class="sw-stage-name">' + escHtml(s.name) + '</div>' +
      buildHealthIndicator(s.id) +
      (s.moment_of_truth
        ? '<span class="sw-stage-moment-badge">' + MOMENT_OF_TRUTH_ICON + ' Moment of truth</span>'
        : '') +
      '<a href="#" class="sw-stage-edit" data-stage-id="' + escHtml(s.id) + '">Edit stage</a>' +
      '<button type="button" class="sw-stage-map-feature" data-stage-id="' + escHtml(s.id) + '">Map feature</button>' +
      '<button type="button" class="sw-stage-add-placeholder" data-stage-id="' + escHtml(s.id) + '">Add placeholder</button>';
    // ic-s2 AC1/AC2 -- a stage with a stored position (set by a prior drag)
    // uses it; a stage with NULL position (never dragged) falls back to
    // ic-s1's own unchanged auto-layout formula.
    var hasStoredPosition = typeof s.position_x === 'number' && typeof s.position_y === 'number';
    var posX = hasStoredPosition ? s.position_x : (idx * 220);
    var posY = hasStoredPosition ? s.position_y : 120;
    return '__icS1NodeIds[' + JSON.stringify(s.id) + ']=editor.addNode(' + JSON.stringify(s.id) + ', 1, 1, ' + posX + ', ' + posY + ', ' +
      JSON.stringify('sw-drawflow-node') + ', {}, ' + JSON.stringify(nodeHtml) + ');' +
      '__icS2NodeIdToStageId[__icS1NodeIds[' + JSON.stringify(s.id) + ']]=' + JSON.stringify(s.id) + ';' +
      // ic-s4 AC1a -- drawflow's own node divs are plain, non-focusable
      // <div>s (confirmed against node_modules/drawflow/dist/drawflow.min.js's
      // own addNode source -- it never sets tabindex). WCAG 2.1 AA keyboard
      // operability requires this explicitly; getElementById uses the exact
      // same "node-"+id convention addNode's own return value is keyed by.
      'document.getElementById("node-"+__icS1NodeIds[' + JSON.stringify(s.id) + ']).setAttribute("tabindex","0");';
  }).join('');
  var drawflowConnectionsScript = stages.slice(0, -1).map(function(s, idx) {
    return 'editor.addConnection(__icS1NodeIds[' + JSON.stringify(stages[idx].id) + '], __icS1NodeIds[' + JSON.stringify(stages[idx + 1].id) + '], "output_1", "input_1");';
  }).join('');

  var bodyContent =
    '<div class="sw-journey-canvas sw-journey-canvas--view-canvas">' +
      '<h1>' + escHtml(journey.name) + '</h1>' +
      viewToggleHtml +
      summaryBarHtml +
      '<div class="sw-stage-annotations sw-stage-annotations--customer-experience sw-persona-card-outer">' +
        buildPersonaCard(journey, personaSuggestions) +
      '</div>' +
      '<div class="sw-stage-annotations sw-stage-annotations--customer-experience sw-cx-swimlane-grid">' +
        (stages.length
          ? buildCustomerExperienceSwimlaneGrid(stages)
          : '<p class="sw-journey-stages-empty">No stages yet. Add your first stage.</p>') +
      '</div>' +
      '<div class="sw-stage-annotations sw-stage-annotations--delivery sw-delivery-swimlane-grid">' +
        (stages.length
          ? buildDeliverySwimlaneGrid(stages)
          : '<p class="sw-journey-stages-empty">No stages yet. Add your first stage.</p>') +
      '</div>' +
      '<span id="sw-stage-reorder-error" class="sw-stage-reorder-error" aria-live="polite"></span>' +
      '<button type="button" id="sw-add-stage-btn">+ Add stage</button>' +
      (stages.length === 0
        ? '<p class="sw-journey-stages-empty" id="sw-drawflow-canvas-empty">No stages yet. Add your first stage.</p>'
        : '<div id="sw-drawflow-canvas"></div>') +
    '</div>' +
    panelHtml +
    featurePickerModalHtml +
    // ic-s1 AC5/AC6 -- the drawflow library itself was never actually
    // requested anywhere (the route handler existed from Task 1, but no
    // page ever loaded it) -- window.Drawflow was always undefined and the
    // AC6 load-guard's fallback branch fired unconditionally. Found via a
    // live browser render check, not caught by any of the 10 jsdom tests,
    // since they only assert the init script's own text contains the guard
    // and the addNode/addConnection calls, never execute it against a real
    // DOM with the library actually (not) loaded. Must load before the
    // inline init script immediately below, which is why it is placed here,
    // directly preceding it in document order (synchronous <script src>
    // blocks parsing until it executes, matching csd-s1's own mermaid
    // <script src> placement convention one block up in this same file).
    '<script src="/vendor/drawflow.min.js"></script>' +
    '<script>(function(){' +
      'var journeyId=' + JSON.stringify(journey.id) + ';' +
      'var csrfToken=' + JSON.stringify(csrfToken) + ';' +
      'var stageData={};' +
      (stageDataJson) + '.forEach(function(s){stageData[s.id]=s;});' +
      'var fieldSuggestions=' + (fieldSuggestionsJson) + ';' +
      // ic-s1 AC6 -- load-guard: fail loudly (console.error + a visible
      // fallback message in the canvas container), never silently, if the
      // drawflow asset failed to load -- matches csd-s1's own
      // window.mermaid check precedent in skills.js.
      // ic-s1 AC4 (live browser render check fix) -- #sw-drawflow-canvas
      // only exists in the DOM when stages.length>0 (see bodyContent above:
      // a 0-stage journey renders #sw-drawflow-canvas-empty instead); guard
      // the whole init block on the element actually existing, or
      // `new window.Drawflow(null)` runs for every 0-stage journey load.
      'var __icS1CanvasEl=document.getElementById(\"sw-drawflow-canvas\");' +
      'if(__icS1CanvasEl){' +
        'if(typeof window.Drawflow===\"function\"){' +
          'var editor=new window.Drawflow(__icS1CanvasEl);' +
          'editor.reroute=true;' +
          'editor.start();' +
          drawflowNodesScript +
          drawflowConnectionsScript +
          // ic-s2 AC1/AC3/AC5/AC6 -- persist a node's final position after
          // a drag. getNodeFromId confirmed against node_modules/drawflow/
          // README.md to return {pos_x, pos_y, ...}. Reuses the EXISTING
          // #sw-stage-reorder-error element verbatim for the failure toast
          // (it is a sibling of #sw-journey-stages in bodyContent, not a
          // descendant, so ic-s1's own canvas-view CSS rule that hides
          // #sw-journey-stages does not hide it -- confirmed by reading
          // bodyContent's own structure directly, not assumed).
          'editor.on("nodeMoved", function(nodeId){' +
            'var node=editor.getNodeFromId(nodeId);' +
            'var stageId=__icS2NodeIdToStageId[nodeId];' +
            'if(!stageId||!node)return;' +
            'submitJson("/journeys/"+journeyId+"/stages/"+stageId+"/position","PATCH",{x:node.pos_x,y:node.pos_y,_csrf:csrfToken})' +
              '.catch(function(){' +
                'var reorderError=document.getElementById("sw-stage-reorder-error");' +
                'if(reorderError){' +
                  'reorderError.textContent="Stage position not saved — please try again";' +
                  'reorderError.classList.add("sw-stage-reorder-error--visible");' +
                  'setTimeout(function(){reorderError.classList.remove("sw-stage-reorder-error--visible");},3000);' +
                '}' +
              '});' +
          '});' +
          // ic-s4 AC1b/AC4/AC5 -- snap-to-grid keyboard movement (decisions.md
          // ASSUMPTION entry: fixed-step arrow keys, not continuous drag).
          // Mutates the SAME live internal position record a mouse-drag
          // mutates (confirmed against drawflow's own source:
          // editor.drawflow.drawflow[editor.module].data[nodeId] is the live
          // record; editor.getNodeFromId deep-clones it, so it cannot be used
          // to write), then dispatches the EXISTING "nodeMoved" event above --
          // reusing ic-s2's own persistence route verbatim, not a second
          // parallel path (DoR constraint).
          'document.addEventListener("keydown", function(ke){' +
            'var active=document.activeElement;' +
            'if(!active||!active.classList||!active.classList.contains("sw-drawflow-node"))return;' +
            // jcx-s7 AC3 -- Enter/Space on a focused drawflow node also
            // opens the edit panel (same single-click convention extended
            // to keyboard) -- checked before the arrow-key movement branch
            // below so it does not fall through to "else return".
            'if(ke.key==="Enter"||ke.key===" "){' +
              'var nodeEditLink=active.querySelector(".sw-stage-edit");' +
              'if(nodeEditLink){ke.preventDefault();openPanel(nodeEditLink.getAttribute("data-stage-id"));}' +
              'return;' +
            '}' +
            'var STEP=20,dx=0,dy=0;' +
            'if(ke.key==="ArrowLeft")dx=-STEP;' +
            'else if(ke.key==="ArrowRight")dx=STEP;' +
            'else if(ke.key==="ArrowUp")dy=-STEP;' +
            'else if(ke.key==="ArrowDown")dy=STEP;' +
            'else return;' +
            'ke.preventDefault();' +
            'var nodeId=active.id.slice(5);' +
            'var nodeData=editor.drawflow.drawflow[editor.module].data[nodeId];' +
            'if(!nodeData)return;' +
            'nodeData.pos_x+=dx;nodeData.pos_y+=dy;' +
            'active.style.left=nodeData.pos_x+"px";' +
            'active.style.top=nodeData.pos_y+"px";' +
            'if(typeof editor.updateConnectionNodes==="function")editor.updateConnectionNodes("node-"+nodeId);' +
            'editor.dispatch("nodeMoved", nodeId);' +
          '});' +
        '}else{' +
          'console.error(\"drawflow failed to load -- canvas view unavailable\");' +
          '__icS1CanvasEl.textContent=\"Canvas failed to load. Please refresh the page.\";' +
        '}' +
      '}' +
      'var list=document.querySelector(".sw-stage-annotations--delivery.sw-delivery-swimlane-grid");' +
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
          // jcx-hotfix4 -- #sw-journey-stages (list) is hidden (display:none)
          // in BOTH the Canvas view (ep2-s3) and the Customer-experience
          // view (jcx-s6), visible only in Delivery. Appending the new,
          // unsaved card there made it (and the input.focus() call below)
          // silently invisible/unfocusable from the two views a user
          // actually works from by default -- confirmed live via
          // javascript_tool. addBtn itself is NOT inside that hidden
          // container and is visible in all 3 views, so insert the new
          // card as its sibling instead. Existing, already-saved stage
          // cards are unaffected -- this only changes where the transient,
          // unsaved new-stage input renders before its first save.
          'addBtn.insertAdjacentElement("beforebegin",card);' +
          'input.focus();' +
          'function save(){' +
            'var name=input.value.trim();' +
            'submitJson("/journeys/"+journeyId+"/stages","POST",{name:name,_csrf:csrfToken})' +
              // jcx-s7 AC2 -- window.location.reload() here violated this
              // repo's own documented web-ui-patterns.md rule ("Client-side
              // DOM patch vs. full page reload after a POST action"): the
              // canvas has live, in-progress client state (the open edit
              // panel, any typed-but-unsaved field text) that a reload
              // discarded, and it always bounced the user back to the
              // default Canvas view regardless of which view they were on.
              // Patch this one card in place instead, from the response's
              // own {id, name, position} -- no reload, view unchanged.
              '.then(function(resp){' +
                'card.classList.remove("sw-stage-card--new");' +
                'card.setAttribute("data-stage-id",resp.id);' +
                'card.innerHTML="";' +
                'var nameSpan=document.createElement("span");' +
                'nameSpan.className="sw-stage-name";' +
                'nameSpan.textContent=resp.name;' +
                'var editLink=document.createElement("a");' +
                'editLink.href="#";' +
                'editLink.className="sw-stage-edit";' +
                'editLink.setAttribute("data-stage-id",resp.id);' +
                'editLink.textContent="Edit stage";' +
                'card.appendChild(nameSpan);' +
                'card.appendChild(editLink);' +
                'stageData[resp.id]={id:resp.id,name:resp.name,position:resp.position};' +
                // jae-s2 AC1 -- collapse the 2-step "name, then separately
                // find Edit stage" flow into one guided action: open the
                // panel for this exact new stage right away.
                'openPanel(resp.id);' +
              '})' +
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
        // jae-s2 AC5 -- reset the save-indicator's own stale text/classes
        // on EVERY open, before anything else. jcx-s7 made its 3 states
        // fully persistent (no auto-hide timer) -- without this reset, a
        // "Saved" or "Failed to save" message from a DIFFERENT, previously
        // edited stage would still be showing when this one opens.
        'panelSaved.textContent="";' +
        'panelSaved.classList.remove("sw-stage-panel-saved--error");' +
        'panelSaved.classList.remove("sw-stage-panel-saved--visible");' +
        'panelStageId=stageId;' +
        'panelTriggerEl=document.activeElement;' +
        'panelFields.forEach(function(f){' +
          'var el=document.getElementById("sw-stage-field-"+f);' +
          'if(!el)return;' +
          'if(f==="moment_of_truth"){el.checked=!!s[f];}else{el.value=s[f]||"";}' +
        '});' +
        // jae-s3 AC1/AC3/AC4 -- a suggestion is offered for a field ONLY
        // when (a) a suggestion exists for this journey's own product and
        // (b) the field is currently empty for THIS stage -- never offered
        // as an option to overwrite real content, and never shown at all
        // when there is nothing to suggest.
        '["customer_actions","pain_points"].forEach(function(f){' +
          'var container=document.getElementById("sw-field-suggestions-"+f);' +
          'if(!container)return;' +
          'container.innerHTML="";' +
          'if(s[f]||!fieldSuggestions.length)return;' +
          'fieldSuggestions.forEach(function(sugg){' +
            'var btn=document.createElement("button");' +
            'btn.type="button";' +
            'btn.className="sw-field-suggestion-btn";' +
            'btn.setAttribute("data-field",f);' +
            'btn.setAttribute("data-text",sugg.problemText);' +
            'btn.textContent=sugg.featureSlug+": "+sugg.problemText;' +
            'container.appendChild(btn);' +
          '});' +
        '});' +
        // jae-s4 AC1/AC1a/AC2/AC5 -- the LLM-generated fallback suggestion
        // is fetched lazily, per field, ONLY when the panel opens (never
        // during the canvas GET render -- AC1a) and ONLY for a field the
        // deterministic scan just above left with no suggestion rendered
        // (AC2 -- the deterministic suggestion always takes priority).
        // Any fetch failure or an empty/null suggestion silently renders
        // nothing (AC5) -- no error surfaced to the operator.
        '["customer_actions","pain_points"].forEach(function(f){' +
          'if(s[f])return;' +
          'var container=document.getElementById("sw-field-suggestions-"+f);' +
          'if(!container||container.children.length)return;' +
          'var requestedStageId=stageId;' +
          'fetch("/journeys/"+journeyId+"/stages/"+stageId+"/ai-suggestion?field="+f,{credentials:"same-origin"})' +
            '.then(function(r){return r.ok?r.json():null;})' +
            '.then(function(data){' +
              'if(panelStageId!==requestedStageId)return;' +
              'if(!data||!data.suggestion)return;' +
              'if(document.getElementById("sw-stage-field-"+f).value)return;' +
              'var btn=document.createElement("button");' +
              'btn.type="button";' +
              'btn.className="sw-field-suggestion-btn sw-field-suggestion-btn--ai";' +
              'btn.setAttribute("data-field",f);' +
              'btn.setAttribute("data-text",data.suggestion);' +
              'btn.textContent="AI suggestion: "+data.suggestion;' +
              'container.appendChild(btn);' +
            '})' +
            '.catch(function(){});' +
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
      // ic-s1 AC2 (live browser render check fix): .sw-stage-edit now also
      // exists inside drawflow canvas nodes (a SIBLING of #sw-journey-stages,
      // not a descendant), so delegating this listener on `list` alone --
      // as the original code did, and as still-correctly scoped below for
      // .sw-stage-move/.sw-feature-mapping-remove, which genuinely only
      // ever exist in the legacy list -- silently dropped every click on a
      // canvas node's own Edit-stage link. Delegating on `document` instead
      // (matching the existing .sw-stage-map-feature convention a few
      // blocks down, which already queries the whole document) fixes both
      // renderings with one listener.
      'document.addEventListener("click",function(ev){' +
        'var link=ev.target.closest&&ev.target.closest(".sw-stage-edit");' +
        'if(!link)return;' +
        'ev.preventDefault();' +
        'openPanel(link.getAttribute("data-stage-id"));' +
      '});' +
      // jcx-s7 AC3 -- a single click (or Enter/Space when keyboard-focused)
      // anywhere on the swimlane grid's own header cell also opens the
      // panel, not only the small nested .sw-stage-edit link -- matches
      // Touchpoint Dashboard's own "click the cell" convention (NOT
      // double-click, see spike's own correction note: double-click is
      // the wrong pattern to borrow from Smaply here). Clicks on the
      // nested link itself are left to the listener above (it already
      // calls openPanel, and ev.target.closest(".sw-stage-edit") below
      // makes this one a no-op for that exact click -- avoids a double-open).
      'document.addEventListener("click",function(ev){' +
        'var cell=ev.target.closest&&ev.target.closest(".sw-cx-grid-cell--header");' +
        'if(!cell)return;' +
        'if(ev.target.closest(".sw-stage-edit"))return;' +
        'openPanel(cell.getAttribute("data-stage-id"));' +
      '});' +
      'document.addEventListener("keydown",function(ev){' +
        'if(ev.key!=="Enter"&&ev.key!==" ")return;' +
        'var cell=document.activeElement&&document.activeElement.closest&&document.activeElement.closest(".sw-cx-grid-cell--header");' +
        'if(!cell)return;' +
        'ev.preventDefault();' +
        'openPanel(cell.getAttribute("data-stage-id"));' +
      '});' +
      // jcx-s7 AC3 -- same single-click convention extended to a drawflow
      // canvas node: the node itself has no own data-stage-id attribute,
      // so fall back to reading it off the node's own nested .sw-stage-edit
      // link (already present, ic-s1's own precedent). Map feature/Add
      // placeholder clicks are explicitly excluded -- they keep their own
      // distinct behaviour, this must not intercept them.
      'document.addEventListener("click",function(ev){' +
        'var node=ev.target.closest&&ev.target.closest(".sw-drawflow-node");' +
        'if(!node)return;' +
        'if(ev.target.closest(".sw-stage-edit,.sw-stage-map-feature,.sw-stage-add-placeholder"))return;' +
        'var nodeEditLink=node.querySelector(".sw-stage-edit");' +
        'if(!nodeEditLink)return;' +
        'openPanel(nodeEditLink.getAttribute("data-stage-id"));' +
      '});' +
      // jae-s5 -- the old reorderDom/getStageIds/submitOrder (DOM-order-
      // is-source-of-truth, list.appendChild(card) as the move primitive)
      // assumed one .sw-stage-card element per stage. That no longer
      // holds: a stage's content now spans 3 separate row containers
      // (header, coverage-status, mapped-features), with no single
      // per-stage element to move. Corrected per decisions.md (2026-10-15):
      // on success, reload (the server rebuilds the whole grid from the
      // newly-ordered stages); on failure, the SAME existing error banner,
      // no reload. Drag-and-drop is out of scope for this grid (AC5 never
      // required it) -- only the up/down buttons remain.
      'var reorderError=document.getElementById("sw-stage-reorder-error");' +
      'if(list){' +
        'list.addEventListener("click",function(ev){' +
          'var btn=ev.target.closest&&ev.target.closest(".sw-stage-move");' +
          'if(!btn||btn.disabled)return;' +
          'var id=btn.getAttribute("data-stage-id");' +
          'var direction=btn.getAttribute("data-direction");' +
          'var ids=Array.prototype.slice.call(list.querySelectorAll(".sw-cx-grid-cell--header")).map(function(c){return c.getAttribute("data-stage-id");});' +
          'var idx=ids.indexOf(id);' +
          'if(idx===-1)return;' +
          'var swapIdx=direction==="up"?idx-1:idx+1;' +
          'if(swapIdx<0||swapIdx>=ids.length)return;' +
          'var tmp=ids[idx];ids[idx]=ids[swapIdx];ids[swapIdx]=tmp;' +
          'submitJson("/journeys/"+journeyId+"/stages-order","PATCH",{stageIds:ids,_csrf:csrfToken})' +
            '.then(function(){window.location.reload();})' +
            '.catch(function(){' +
              'if(reorderError){' +
                'reorderError.textContent="Stage order not saved — please try again";' +
                'reorderError.classList.add("sw-stage-reorder-error--visible");' +
                'setTimeout(function(){reorderError.classList.remove("sw-stage-reorder-error--visible");},3000);' +
              '}' +
            '});' +
        '});' +
      '}' +
      'if(panelClose)panelClose.addEventListener("click",closePanel);' +
      // ep2-s3 AC3 -- view toggle: a pure className string swap + a
      // classList/aria-pressed update on the toggle buttons themselves.
      // No fetch, no server round-trip.
      'var canvasRoot=document.querySelector(".sw-journey-canvas");' +
      'var viewToggleBtns=Array.prototype.slice.call(document.querySelectorAll(".sw-canvas-view-toggle-btn"));' +
      'viewToggleBtns.forEach(function(btn){' +
        'btn.addEventListener("click",function(){' +
          'var view=btn.getAttribute("data-view");' +
          // Removes whichever sw-journey-canvas--view-* class is currently
          // present (exactly one is ever applied at a time) before
          // appending the newly selected view's class.
          'canvasRoot.className=canvasRoot.className.replace(/sw-journey-canvas--view-\\S+/,"").trim()+" sw-journey-canvas--view-"+view;' +
          'viewToggleBtns.forEach(function(b){' +
            'var active=b===btn;' +
            'b.classList.toggle("sw-canvas-view-toggle-btn--active",active);' +
            'b.setAttribute("aria-pressed",active?"true":"false");' +
          '});' +
        '});' +
      '});' +
      // ep2-s3 AC2/D16 -- Remove button on a feature-not-found warning row:
      // a delegated click handler on `list` (reuses submitJson, same
      // convention as every other mutating action in this script block).
      'if(list){' +
        'list.addEventListener("click",function(ev){' +
          'var btn=ev.target.closest&&ev.target.closest(".sw-feature-mapping-remove");' +
          'if(!btn)return;' +
          'var mappingId=btn.getAttribute("data-mapping-id");' +
          'var stageId=btn.getAttribute("data-stage-id");' +
          'submitJson("/journeys/"+journeyId+"/stages/"+stageId+"/feature-mappings/"+mappingId,"DELETE",{_csrf:csrfToken})' +
            '.then(function(){' +
              'var row=btn.closest(".sw-feature-mapping-row");' +
              'if(row)row.remove();' +
              'window.location.reload();' +
            '})' +
            '.catch(function(){' +
              // Reuses the EXISTING reorderError banner (declared above,
              // already used by submitOrder's own catch handler) rather
              // than introducing a new UX convention/DOM element.
              'if(reorderError){' +
                'reorderError.textContent="Could not remove mapping — please try again";' +
                'reorderError.classList.add("sw-stage-reorder-error--visible");' +
                'setTimeout(function(){reorderError.classList.remove("sw-stage-reorder-error--visible");},3000);' +
              '}' +
            '});' +
        '});' +
      '}' +
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
          // jcx-s7 AC1 -- a re-read of this handler's own .catch (below)
          // found it reused the SAME success-colored element/class for its
          // error text -- a failed save could visually read as successful.
          // Fixed via a dedicated --error class (CSS, var(--danger)), a
          // real "Saving..." in-flight state, and -- rather than adding a
          // save-sequence token to guard a stale setTimeout (review finding
          // 1-M1) -- removing the auto-hide timeout entirely: every state
          // is now genuinely persistent (matches the AC's own "persistent"
          // framing and the spike's Notion/Linear/Figma/GitLab research),
          // which removes the race condition's root cause rather than
          // guarding around it.
          'panelSaved.textContent="Saving…";' +
          'panelSaved.classList.remove("sw-stage-panel-saved--error");' +
          'panelSaved.classList.add("sw-stage-panel-saved--visible");' +
          'submitJson("/journeys/"+journeyId+"/stages/"+panelStageId,"PATCH",{field:f,value:value,_csrf:csrfToken})' +
            '.then(function(){' +
              'stageData[panelStageId][f]=value;' +
              'panelSaved.textContent="Saved";' +
              'panelSaved.classList.remove("sw-stage-panel-saved--error");' +
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
              'panelSaved.textContent="Failed to save — Retry: "+e.message;' +
              'panelSaved.classList.add("sw-stage-panel-saved--error");' +
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
      'var journeyId=' + JSON.stringify(journey.id) + ';' +
      'var csrfToken=' + JSON.stringify(csrfToken) + ';' +
      'var fpModal=document.getElementById("sw-feature-picker-modal");' +
      'var fpClose=document.getElementById("sw-feature-picker-close");' +
      'var fpSearch=document.getElementById("sw-feature-picker-search");' +
      'var fpTriggerEl=null;' +
      'var fpStageId=null;' +
      'var featureMetricKeys=' + featureMetricKeysJson + ';' +
      'var fmView=document.getElementById("sw-feature-mapping-view");' +
      'var fmNameEl=document.getElementById("sw-feature-mapping-name");' +
      'var fmSlugEl=document.getElementById("sw-feature-mapping-slug");' +
      'var fmMetricsEl=document.getElementById("sw-feature-mapping-metrics");' +
      'var fmBack=document.getElementById("sw-feature-mapping-back");' +
      'var fmSelectedSlug=null;' +
      // Shared list/search-label visibility toggle -- used by both
      // fmShowList (list view) and fmShowFeature (sub-view), so the two
      // views are never accidentally shown at once.
      'function fmSetListVisible(visible){' +
        'var listEl=document.getElementById("sw-feature-picker-list");' +
        'var searchLabel=document.querySelector(".sw-feature-picker-search-label");' +
        'if(listEl)listEl.style.display=visible?"":"none";' +
        'if(searchLabel)searchLabel.style.display=visible?"":"none";' +
      '}' +
      'function fmShowList(){' +
        'fmView.style.display="none";' +
        'fmSetListVisible(true);' +
      '}' +
      'function fmShowFeature(slug,name){' +
        'fmSelectedSlug=slug;' +
        'fmNameEl.textContent=name;' +
        'fmSlugEl.textContent=slug;' +
        'var keys=featureMetricKeys[slug]||[];' +
        'fmMetricsEl.innerHTML="";' +
        'if(keys.length===0){' +
          'var p=document.createElement("p");' +
          'p.className="sw-feature-picker-message";' +
          'p.textContent="No metrics recorded";' +
          'fmMetricsEl.appendChild(p);' +
        '}else{' +
          'keys.forEach(function(k){' +
            'var label=document.createElement("label");' +
            'label.className="sw-feature-mapping-metric-label";' +
            'var cb=document.createElement("input");' +
            'cb.type="checkbox";' +
            'cb.value=k;' +
            'cb.className="sw-feature-mapping-metric-checkbox";' +
            'label.appendChild(cb);' +
            'label.appendChild(document.createTextNode(" "+k));' +
            'fmMetricsEl.appendChild(label);' +
          '});' +
        '}' +
        'fmSetListVisible(false);' +
        'fmView.style.display="block";' +
      '}' +
      'if(fmBack)fmBack.addEventListener("click",fmShowList);' +
      'Array.prototype.slice.call(document.querySelectorAll(".sw-feature-picker-item")).forEach(function(li){' +
        'li.addEventListener("click",function(){' +
          // The REAL slug/name must come from these spans' textContent, not
          // this <li>'s own data-slug/data-name attributes -- ep2-s1's
          // swFilterFeaturePicker deliberately lowercases those attributes
          // for case-insensitive filtering, which would corrupt the
          // featureMetricKeys lookup (and the displayed name) for any
          // feature whose real slug/name has uppercase characters.
          'var realSlug=li.querySelector(".sw-feature-picker-slug").textContent;' +
          'var realName=li.querySelector(".sw-feature-picker-name").textContent;' +
          'fmShowFeature(realSlug,realName);' +
        '});' +
      '});' +
      'var fmSave=document.getElementById("sw-feature-mapping-save");' +
      'var fmError=document.getElementById("sw-feature-mapping-error");' +
      'if(fmSave){' +
        'fmSave.addEventListener("click",function(){' +
          'if(!fmSelectedSlug||!fpStageId)return;' +
          'var checked=Array.prototype.slice.call(document.querySelectorAll(".sw-feature-mapping-metric-checkbox:checked")).map(function(cb){return cb.value;});' +
          'fetch("/journeys/"+journeyId+"/stages/"+fpStageId+"/feature-mappings",{' +
            'method:"POST",' +
            'headers:{"Content-Type":"application/json"},' +
            'body:JSON.stringify({featureSlug:fmSelectedSlug,metricKeys:checked,_csrf:csrfToken})' +
          '}).then(function(r){' +
            'if(!r.ok){return r.json().then(function(j){throw new Error((j&&j.error)||"Request failed");});}' +
            'fpCloseFn();' +
            'window.location.reload();' +
          '}).catch(function(e){' +
            'if(fmError)fmError.textContent=e.message;' +
          '});' +
        '});' +
      '}' +
      'function fpOpen(trigger){' +
        'fpTriggerEl=trigger||document.activeElement;' +
        'fpStageId=trigger&&trigger.getAttribute?trigger.getAttribute("data-stage-id"):null;' +
        'fpModal.classList.add("sw-feature-picker-modal--open");' +
        'fpModal.setAttribute("aria-hidden","false");' +
        'if(fpSearch)fpSearch.focus();' +
      '}' +
      'function fpCloseFn(){' +
        'fpModal.classList.remove("sw-feature-picker-modal--open");' +
        'fpModal.setAttribute("aria-hidden","true");' +
        'if(fpTriggerEl&&typeof fpTriggerEl.focus==="function")fpTriggerEl.focus();' +
        'fmShowList();' +
      '}' +
      'if(fpClose)fpClose.addEventListener("click",fpCloseFn);' +
      'document.addEventListener("keydown",function(evt){' +
        'if(fpModal.classList.contains("sw-feature-picker-modal--open")&&evt.key==="Escape")fpCloseFn();' +
      '});' +
      'Array.prototype.slice.call(document.querySelectorAll(".sw-stage-map-feature")).forEach(function(btn){' +
        'btn.addEventListener("click",function(){fpOpen(btn);});' +
      '});' +
      // jcx-s1 AC1 -- "Add placeholder" reveals the inline form that lives
      // in that SAME stage's own Delivery annotations container (not a
      // modal -- plain DOM visibility toggle, so Tab order and focus
      // behave exactly like any other in-flow form; no custom focus trap
      // needed for WCAG 2.1 AA here, unlike the side panel's own modal).
      // This whole block lives in the feature-picker's OWN <script> IIFE
      // (a separate closure from the stage-panel/reorder script above --
      // see this file's own comment at the IIFE boundary), so it cannot
      // reach that other block's `list`/`reorderError`/`submitJson` locals;
      // everything here is looked up or defined fresh, matching fmSave's
      // own raw-fetch convention a few lines above.
      'var jcxList=document.querySelector(".sw-stage-annotations--delivery.sw-delivery-swimlane-grid");' +
      'var jcxReorderError=document.getElementById("sw-stage-reorder-error");' +
      'function jcxShowError(msg){' +
        'if(!jcxReorderError)return;' +
        'jcxReorderError.textContent=msg;' +
        'jcxReorderError.classList.add("sw-stage-reorder-error--visible");' +
        'setTimeout(function(){jcxReorderError.classList.remove("sw-stage-reorder-error--visible");},3000);' +
      '}' +
      'function jcxSubmitJson(url,payload){' +
        'return fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})' +
          '.then(function(r){' +
            'if(!r.ok){return r.json().then(function(j){throw new Error((j&&j.error)||("Request failed ("+r.status+")"));});}' +
            'return r.json();' +
          '});' +
      '}' +
      'Array.prototype.slice.call(document.querySelectorAll(".sw-stage-add-placeholder")).forEach(function(btn){' +
        'btn.addEventListener("click",function(){' +
          'var stageId=btn.getAttribute("data-stage-id");' +
          'var form=document.querySelector(\'.sw-placeholder-add-form[data-stage-id="\'+stageId+\'"]\');' +
          'if(!form)return;' +
          'form.classList.add("sw-placeholder-add-form--open");' +
          'var input=form.querySelector(".sw-placeholder-name-input");' +
          'if(input)input.focus();' +
        '});' +
      '});' +
      'if(jcxList){' +
        'jcxList.addEventListener("click",function(ev){' +
          'var cancelBtn=ev.target.closest&&ev.target.closest(".sw-placeholder-add-cancel");' +
          'if(cancelBtn){' +
            'var cform=cancelBtn.closest(".sw-placeholder-add-form");' +
            'if(cform)cform.classList.remove("sw-placeholder-add-form--open");' +
            'return;' +
          '}' +
          'var triggerBtn=ev.target.closest&&ev.target.closest(".sw-placeholder-trigger");' +
          'if(triggerBtn){' +
            'var tMappingId=triggerBtn.getAttribute("data-mapping-id");' +
            'var tStageId=triggerBtn.getAttribute("data-stage-id");' +
            'triggerBtn.disabled=true;' +
            'jcxSubmitJson("/journeys/"+journeyId+"/stages/"+tStageId+"/placeholder-features/"+tMappingId+"/trigger",{_csrf:csrfToken})' +
              '.then(function(data){' +
                'var row=triggerBtn.closest(".sw-mapping--placeholder");' +
                'var success=document.createElement("span");' +
                'success.className="sw-placeholder-trigger-success";' +
                'success.textContent="Discovery started: "+(data&&data.featureSlug||"");' +
                'if(row)row.appendChild(success);' +
              '})' +
              '.catch(function(){' +
                'triggerBtn.disabled=false;' +
                'jcxShowError("Could not trigger placeholder — please try again");' +
              '});' +
          '}' +
        '});' +
        'jcxList.addEventListener("submit",function(ev){' +
          'var form=ev.target.closest&&ev.target.closest(".sw-placeholder-add-form");' +
          'if(!form)return;' +
          'ev.preventDefault();' +
          'var pStageId=form.getAttribute("data-stage-id");' +
          'var input=form.querySelector(".sw-placeholder-name-input");' +
          'var name=input?input.value.trim():"";' +
          'if(!name)return;' +
          'jcxSubmitJson("/journeys/"+journeyId+"/stages/"+pStageId+"/placeholder-features",{name:name,_csrf:csrfToken})' +
            '.then(function(){window.location.reload();})' +
            '.catch(function(){jcxShowError("Could not add placeholder — please try again");});' +
        '});' +
      '}' +
      // jcx-s4 -- the persona card lives OUTSIDE #sw-journey-stages (a
      // sibling, alongside the emotion curve), so it cannot reuse jcxList's
      // own delegated listeners above -- delegating on document instead.
      'document.addEventListener("click",function(ev){' +
        'var editBtn=ev.target.closest&&ev.target.closest(".sw-persona-edit-btn");' +
        'if(editBtn){' +
          'var form=document.querySelector(".sw-persona-editor-form");' +
          'if(form)form.classList.add("sw-persona-editor-form--open");' +
          'return;' +
        '}' +
        'var cancelBtn=ev.target.closest&&ev.target.closest(".sw-persona-cancel-btn");' +
        'if(cancelBtn){' +
          'var cform=cancelBtn.closest(".sw-persona-editor-form");' +
          'if(cform)cform.classList.remove("sw-persona-editor-form--open");' +
          'return;' +
        '}' +
        'var suggestionBtn=ev.target.closest&&ev.target.closest(".sw-persona-suggestion-btn");' +
        'if(suggestionBtn){' +
          'var sform=suggestionBtn.closest(".sw-persona-editor-form");' +
          'var refText=sform&&sform.querySelector(".sw-persona-reference-text");' +
          'if(refText){' +
            'refText.value=suggestionBtn.getAttribute("data-text")||"";' +
            'refText.classList.add("sw-persona-reference-text--visible");' +
          '}' +
        '}' +
      '});' +
      // jae-s3 AC2 -- clicking a field suggestion fills that FIELD directly
      // (not a separate reference box) -- the operator still has to blur
      // the field (or otherwise trigger the existing autosave) for it to
      // actually save, exactly as every other field edit already works.
      'document.addEventListener("click",function(ev){' +
        'var fieldSuggestionBtn=ev.target.closest&&ev.target.closest(".sw-field-suggestion-btn");' +
        'if(!fieldSuggestionBtn)return;' +
        'var targetField=document.getElementById("sw-stage-field-"+fieldSuggestionBtn.getAttribute("data-field"));' +
        'if(targetField)targetField.value=fieldSuggestionBtn.getAttribute("data-text")||"";' +
      '});' +
      'document.addEventListener("submit",function(ev){' +
        'var form=ev.target.closest&&ev.target.closest(".sw-persona-editor-form");' +
        'if(!form)return;' +
        'ev.preventDefault();' +
        'var name=form.querySelector(".sw-persona-name-input").value.trim();' +
        'var role=form.querySelector(".sw-persona-role-input").value.trim();' +
        'var goal=form.querySelector(".sw-persona-goal-input").value.trim();' +
        'jcxSubmitJson("/journeys/"+journeyId+"/persona",{persona_name:name,persona_role:role,persona_goal:goal,_csrf:csrfToken})' +
          '.then(function(){window.location.reload();})' +
          '.catch(function(){jcxShowError("Could not save persona — please try again");});' +
      '});' +
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
      // jae-s1 AC1 -- checked by default; the operator unchecks it for a
      // genuinely blank journey (AC3).
      '<label class="sw-new-journey-field sw-new-journey-field--checkbox">' +
        '<input type="checkbox" id="sw-new-journey-seed-default" checked> Start with a default stage outline' +
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
      // jae-s1 -- override the generic full-width rule above for the
      // checkbox variant; a checkbox is not a full-width bordered field.
      '.sw-new-journey-field--checkbox{display:flex;align-items:center;gap:8px}' +
      '.sw-new-journey-field--checkbox input{display:inline;width:auto;margin-top:0;padding:0;border:none;background:none}' +
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
          'var seedDefaultStages=document.getElementById("sw-new-journey-seed-default").checked;' +
          'if(!name){errorEl.textContent="Name is required";return;}' +
          // ep4-s1 -- POST /journeys (ep1-s1, unchanged) responds with a real
          // 302 redirect on success, which fetch() auto-follows -- the
          // success-path response body is the canvas page's HTML, not JSON.
          // r.redirected/r.url must be checked BEFORE any .json() call, or a
          // successful creation looks like a parse-error failure.
          'fetch("/journeys",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:name,description:description,productId:productId,seedDefaultStages:seedDefaultStages,_csrf:csrfToken})})' +
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

module.exports = { handlePostJourneys, handleGetJourneyCanvas, handlePostJourneyStage, handlePatchJourneyStage, handlePatchJourneyStagesOrder, handleGetCustomerJourneysList, handlePostFeatureMapping, handleDeleteFeatureMapping, handlePatchJourneyStagePosition, handlePostPlaceholderFeature, handleTriggerPlaceholderFeature, checkPlaceholderConversions, getPersonaSuggestions, handlePatchJourneyPersona, getFieldSuggestions, handleGetAiFieldSuggestion };
