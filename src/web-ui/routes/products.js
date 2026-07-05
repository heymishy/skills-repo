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

async function handleGetDashboard(req, res, _next, pool) {
  var _pool = pool;
  var tenantId = req.session && req.session.tenantId;
  var products = (await _pool.query(
    'SELECT product_id, name, created_at FROM products WHERE tenant_id = $1 ORDER BY created_at DESC',
    [tenantId]
  )).rows;
  var cards = await Promise.all(products.map(async function(p) {
    var journeyRows = (await _pool.query(
      'SELECT journey_id, updated_at FROM journeys WHERE product_id = $1',
      [p.product_id]
    )).rows;
    var lastUpdated = journeyRows.reduce(function(mx, j) {
      return (!mx || j.updated_at > mx) ? j.updated_at : mx;
    }, null);
    return {
      product_id: p.product_id,
      name: _escapeHtml(p.name),
      featureCount: journeyRows.length,
      lastUpdated: lastUpdated
    };
  }));
  res.json({ products: cards, showCta: cards.length === 0 });
}

async function handleGetProductView(req, res, _next, pool) {
  var _pool = pool;
  var productId = req.params && req.params.id;
  var rows = (await _pool.query(
    'SELECT journey_id, stage, health, feature_slug, updated_at FROM journeys WHERE product_id = $1',
    [productId]
  )).rows;
  var features = rows.map(function(j) {
    return {
      journey_id: j.journey_id,
      stage: j.stage,
      health: j.health,
      featureSlug: j.feature_slug
    };
  });
  res.json({ features: features });
}

var STAGE_COLUMNS = ['discovery','benefit-metric','definition','review','test-plan','definition-of-ready','implementation','definition-of-done'];

function _healthLabel(health) {
  if (health === 'red')   return 'Blocked';
  if (health === 'amber') return 'Warning';
  return 'Healthy';
}

async function handleGetProductKanban(req, res, _next, pool, posthog) {
  var _pool = pool;
  var _ph = posthog || _posthog;
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;

  var rows = (await _pool.query(
    'SELECT journey_id, stage, health, feature_slug FROM journeys WHERE product_id = $1',
    [productId]
  )).rows;

  var columns = STAGE_COLUMNS.map(function(stage) {
    var features = rows
      .filter(function(j) { return j.stage === stage; })
      .map(function(j) {
        return {
          journey_id: j.journey_id,
          name: _escapeHtml(j.feature_slug || j.journey_id),
          health: j.health,
          healthLabel: _healthLabel(j.health),
          healthIcon: j.health === 'red' ? '⚠' : (j.health === 'amber' ? '⚠' : '✓')
        };
      });
    return {
      stage: stage,
      features: features,
      emptyLabel: features.length === 0 ? 'No features at this stage' : null
    };
  });

  _ph.capture(tenantId || (req.session && req.session.login), 'kanban_viewed', {
    view: 'product',
    productId: productId,
    tenantId: tenantId,
    featureCount: rows.length
  });

  res.json({ columns: columns });
}

async function handleGetOrgKanban(req, res, _next, pool, posthog) {
  var _pool = pool;
  var _ph = posthog || _posthog;
  var tenantId = req.session && req.session.tenantId;
  var productFilter = req.query && req.query.product;

  var prodRows = (await _pool.query(
    'SELECT product_id, name FROM products WHERE tenant_id = $1',
    [tenantId]
  )).rows;

  var filteredProds = productFilter
    ? prodRows.filter(function(p) { return p.product_id === productFilter; })
    : prodRows;

  var allJourneyCount = 0;
  var groups = [];
  for (var i = 0; i < filteredProds.length; i++) {
    var p = filteredProds[i];
    var jRows = (await _pool.query(
      'SELECT journey_id, product_id, stage, health, feature_slug FROM journeys WHERE product_id = $1 AND tenant_id = $2',
      [p.product_id, tenantId]
    )).rows;
    allJourneyCount += jRows.length;
    var features = jRows.map(function(j) {
      return {
        journey_id: j.journey_id,
        name: _escapeHtml(j.feature_slug || j.journey_id),
        stage: j.stage,
        health: j.health,
        healthLabel: _healthLabel(j.health),
        stageLink: '/journeys/' + j.journey_id + '/' + j.stage
      };
    });
    groups.push({
      product_id: p.product_id,
      productName: _escapeHtml(p.name),
      features: features
    });
  }

  _ph.capture(tenantId || (req.session && req.session.login), 'kanban_viewed', {
    view: 'org',
    tenantId: tenantId,
    productCount: groups.length,
    featureCount: allJourneyCount
  });

  res.json({ groups: groups });
}

async function handlePostProductFeature(req, res, _next, pool, posthog) {
  var _pool = pool;
  var _ph = posthog || _posthog;
  var tenantId = req.session && req.session.tenantId;
  var productId = req.params && req.params.id;
  var journeyId = require('crypto').randomUUID();
  await _pool.query(
    `INSERT INTO journeys (journey_id, feature_slug, tenant_id, product_id, data) VALUES ($1, $2, $3, $4, '{}'::jsonb) ON CONFLICT DO NOTHING`,
    [journeyId, 'new-feature-' + journeyId.slice(0, 8), tenantId, productId]
  );
  _ph.capture(tenantId, 'journey_created', {
    journeyId: journeyId,
    productId: productId,
    tenantId: tenantId
  });
  if (res.redirect) {
    res.redirect('/journeys/' + journeyId + '/discovery');
  } else {
    res.status(201).json({ journey_id: journeyId });
  }
}

module.exports = {
  handlePostProductNew,
  handlePostProductConfirm,
  handleGetDashboard,
  handleGetProductView,
  handlePostProductFeature,
  handleGetProductKanban,
  handleGetOrgKanban
};
