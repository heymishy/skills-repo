'use strict';

// journeys.js — ep1-s1: customer journey entity creation (POST /journeys) and
// canvas shell (GET /journeys/:id). Plural filename deliberately distinct
// from the existing routes/journey.js (singular), which is the platform's
// own unrelated outer-loop session-tracking route file -- see ADR-027 and
// artefacts/2026-10-05-customer-journey-as-first-class/design.md.

var { renderShellWithNav } = require('./products');
var { escHtml } = require('../utils/html-shell');

/**
 * POST /journeys — create a new journey, tenant-scoped.
 * Dual response mode: res.status/res.json (test mock) or res.writeHead/res.end (real HTTP).
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 */
async function handlePostJourneys(req, res, _next, pool) {
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
 * GET /journeys/:id — the journey canvas shell (name + empty stage-list state).
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 */
async function handleGetJourneyCanvas(req, res, _next, pool) {
  var tenantId = req.session && req.session.tenantId;
  var journeyId = req.params && req.params.id;

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

  // AC4: canvas shell shows the journey name and the "no stages yet" empty state.
  // Stage listing/rendering beyond this empty state is ep1-s2's own scope.
  var bodyContent =
    '<div class="sw-journey-canvas">' +
      '<h1>' + escHtml(journey.name) + '</h1>' +
      '<div class="sw-journey-stages sw-journey-stages--empty">' +
        '<p>No stages yet. Add your first stage.</p>' +
      '</div>' +
    '</div>';

  if (res.status) {
    res.status(200).json({ id: journey.id, name: journey.name, bodyContent: bodyContent }); // test mock path
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

module.exports = { handlePostJourneys, handleGetJourneyCanvas };
