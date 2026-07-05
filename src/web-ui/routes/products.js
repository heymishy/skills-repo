'use strict';

var _posthog = require('../modules/posthog-server');
var _productDraft = require('../adapters/product-draft');

function _escapeHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _isTeamPlan(session) {
  return session && session.plan === 'team';
}

async function handlePostProductNew(req, res, _next, pool, posthog) {
  var _ph = posthog || _posthog;
  var name = (req.body && req.body.name) || '';
  var description = (req.body && req.body.description) || '';
  var draft = await _productDraft.generateProductDraft({ name: name, description: description });
  res.json({ draft: draft });
}

async function handlePostProductConfirm(req, res, _next, pool, posthog) {
  var _pool = pool;
  var _ph = posthog || _posthog;
  var tenantId = req.session && req.session.tenantId;
  var name = (req.body && req.body.name) || '';
  var description = (req.body && req.body.description) || '';
  var mission = (req.body && req.body.mission) || '';
  var techStack = (req.body && req.body.techStack) || '';
  var constraints = (req.body && req.body.constraints) || '';
  var roadmap = (req.body && req.body.roadmap) || '';
  var architectureGuardrails = (req.body && req.body.architectureGuardrails) || '';

  // Path traversal guard on name
  if (name.indexOf('..') !== -1 || name.indexOf('/') !== -1 || name.indexOf('\\') !== -1) {
    res.status(400).json({ error: 'invalid product name' });
    return;
  }

  // Solo plan: max 1 product
  if (!_isTeamPlan(req.session) && _pool) {
    var existing = await _pool.query('SELECT product_id FROM products WHERE tenant_id = $1', [tenantId]);
    if (existing.rows.length >= 1) {
      res.status(403).json({ reason: 'plan_limit', upgradeRequired: true });
      return;
    }
  }

  var r = await _pool.query(
    `INSERT INTO products (tenant_id, name, description, mission, tech_stack, constraints, roadmap, architecture_guardrails, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING product_id`,
    [tenantId, name, description, mission, techStack, constraints, roadmap, architectureGuardrails, tenantId]
  );
  var productId = r.rows[0].product_id;

  _ph.capture(tenantId, 'product_created', {
    productId: productId,
    tenantId: tenantId,
    plan: req.session && req.session.plan
  });

  res.status(201).json({ product_id: productId });
}

module.exports = { handlePostProductNew, handlePostProductConfirm };
