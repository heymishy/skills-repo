'use strict';

// journeys.js — ep1-s1: customer journey entity creation (POST /journeys) and
// canvas shell (GET /journeys/:id). Plural filename deliberately distinct
// from the existing routes/journey.js (singular), which is the platform's
// own unrelated outer-loop session-tracking route file -- see ADR-027 and
// artefacts/2026-10-05-customer-journey-as-first-class/design.md.

var { renderShellWithNav } = require('./products');
var { escHtml } = require('../utils/html-shell');
var _csrf = require('../middleware/csrf'); // jcg-s1 -- CSRF guard, matching every other mutating form handler in this app

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
 * GET /journeys/:id — the journey canvas shell (name + stage list + "+ Add stage").
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

  var sr = await pool.query(
    `SELECT id, name, position FROM customer_journey_stages WHERE journey_id = $1 ORDER BY position ASC`,
    [journeyId]
  );
  var stages = sr.rows || [];

  // AC4: each saved stage renders with its name and an "Edit stage" affordance
  // (not wired to anything yet -- stage-detail editing is ep1-s3's own scope).
  var stagesHtml = stages.length
    ? stages.map(function(s) {
        return (
          '<div class="sw-stage-card" data-stage-id="' + escHtml(s.id) + '">' +
            '<span class="sw-stage-name">' + escHtml(s.name) + '</span>' +
            '<a href="#" class="sw-stage-edit">Edit stage</a>' +
          '</div>'
        );
      }).join('')
    : '<p class="sw-journey-stages-empty">No stages yet. Add your first stage.</p>';

  var csrfToken = await _csrf.generateCsrfToken(req);

  // AC1: "+ Add stage" inserts an unsaved, focused inline-name stage card --
  // pure client-side DOM behaviour, no server round-trip until save (RISK-ACCEPT,
  // see decisions.md -- not E2E-covered, manual verification only).
  var bodyContent =
    '<div class="sw-journey-canvas">' +
      '<h1>' + escHtml(journey.name) + '</h1>' +
      '<div class="sw-journey-stages" id="sw-journey-stages">' +
        stagesHtml +
      '</div>' +
      '<button type="button" id="sw-add-stage-btn">+ Add stage</button>' +
    '</div>' +
    '<script>(function(){' +
      'var journeyId=' + JSON.stringify(journey.id) + ';' +
      'var csrfToken=' + JSON.stringify(csrfToken) + ';' +
      'var list=document.getElementById("sw-journey-stages");' +
      'var addBtn=document.getElementById("sw-add-stage-btn");' +
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

module.exports = { handlePostJourneys, handleGetJourneyCanvas, handlePostJourneyStage };
