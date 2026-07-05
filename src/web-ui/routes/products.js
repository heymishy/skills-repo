'use strict';

var _posthog = require('../modules/posthog-server');
var _productDraft = require('../adapters/product-draft');
var _htmlShell = require('../utils/html-shell');

function _escapeHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _renderProductDashboard(products, login) {
  var cardsHtml = products.length === 0
    ? '<div style="padding:48px 0;text-align:center;color:var(--muted)">' +
        '<p style="font-size:18px;margin:0 0 16px">No products yet</p>' +
        '<a href="/products/new" style="display:inline-block;padding:10px 20px;background:var(--accent);color:var(--accent-ink);border-radius:6px;text-decoration:none;font-weight:500">Create your first product →</a>' +
      '</div>'
    : products.map(function(p) {
        return '<a href="/products/' + _escapeHtml(p.product_id) + '" style="display:block;padding:20px;background:var(--surface);border:1px solid var(--line);border-radius:8px;text-decoration:none;color:var(--ink);margin-bottom:12px">' +
          '<div style="display:flex;justify-content:space-between;align-items:baseline">' +
            '<span style="font-size:16px;font-weight:600">' + _escapeHtml(p.name) + '</span>' +
            '<span style="font-size:12px;color:var(--muted)">' + _escapeHtml(String(p.featureCount)) + ' feature' + (p.featureCount === 1 ? '' : 's') + '</span>' +
          '</div>' +
          (p.lastUpdated ? '<div style="font-size:12px;color:var(--muted);margin-top:4px">Last updated ' + _escapeHtml(new Date(p.lastUpdated).toLocaleDateString()) + '</div>' : '') +
        '</a>';
      }).join('');
  var body = '<div style="max-width:720px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">' +
      '<h1 style="margin:0;font-size:24px">Products</h1>' +
      (products.length > 0 ? '<a href="/products/new" style="padding:8px 16px;background:var(--accent);color:var(--accent-ink);border-radius:6px;text-decoration:none;font-size:14px;font-weight:500">New product</a>' : '') +
    '</div>' +
    cardsHtml +
    '<div style="margin-top:32px;padding-top:24px;border-top:1px solid var(--line)">' +
      '<a href="/org/kanban" style="font-size:14px;color:var(--muted);text-decoration:none">View org kanban →</a>' +
    '</div>' +
  '</div>';
  return _htmlShell.renderShell({ title: 'Products', bodyContent: body, user: { login: login }, active: 'dashboard' });
}

function _renderProductNew(login, error) {
  var errorHtml = error ? '<div style="padding:12px;background:#fee;border:1px solid #fcc;border-radius:6px;color:#c33;margin-bottom:16px;font-size:14px">' + _escapeHtml(error) + '</div>' : '';
  var body = '<div style="max-width:560px">' +
    '<h1 style="margin:0 0 24px;font-size:24px">Create a product</h1>' +
    errorHtml +
    '<form id="psh-product-form" style="display:flex;flex-direction:column;gap:16px">' +
      '<label style="display:flex;flex-direction:column;gap:6px;font-size:14px">Product name <span style="color:var(--muted)">(required)</span>' +
        '<input id="psh-name" name="name" type="text" required autocomplete="off" style="padding:8px 10px;border:1px solid var(--line);border-radius:6px;font-size:15px;background:var(--surface);color:var(--ink)">' +
      '</label>' +
      '<label style="display:flex;flex-direction:column;gap:6px;font-size:14px">Short description <span style="color:var(--muted)">(optional — helps the AI generate better context files)</span>' +
        '<textarea id="psh-description" name="description" rows="3" style="padding:8px 10px;border:1px solid var(--line);border-radius:6px;font-size:14px;background:var(--surface);color:var(--ink);resize:vertical"></textarea>' +
      '</label>' +
      '<button id="psh-draft-btn" type="button" onclick="pshGenerateDraft()" style="align-self:flex-start;padding:10px 20px;background:var(--accent);color:var(--accent-ink);border:none;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer">Generate context files →</button>' +
    '</form>' +
    '<div id="psh-drafts" style="display:none;margin-top:32px">' +
      '<h2 style="font-size:18px;margin:0 0 16px">Review and edit your context files</h2>' +
      '<form id="psh-confirm-form" method="POST" action="/products/confirm" style="display:flex;flex-direction:column;gap:20px">' +
        '<input type="hidden" id="psh-confirm-name" name="name">' +
        '<input type="hidden" id="psh-confirm-description" name="description">' +
        ['mission','roadmap','techStack','constraints','architectureGuardrails'].map(function(field) {
          var label = { mission:'Mission', roadmap:'Roadmap', techStack:'Tech stack', constraints:'Constraints', architectureGuardrails:'Architecture guardrails' }[field];
          return '<label style="display:flex;flex-direction:column;gap:6px;font-size:14px">' + label +
            '<textarea id="psh-draft-' + field + '" name="' + field + '" rows="5" style="padding:8px 10px;border:1px solid var(--line);border-radius:6px;font-size:13px;font-family:monospace;background:var(--surface);color:var(--ink);resize:vertical"></textarea>' +
          '</label>';
        }).join('') +
        '<div style="display:flex;gap:12px">' +
          '<button type="submit" style="padding:10px 24px;background:var(--accent);color:var(--accent-ink);border:none;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer">Confirm and create product</button>' +
          '<button type="button" onclick="document.getElementById(\'psh-drafts\').style.display=\'none\'" style="padding:10px 16px;background:none;border:1px solid var(--line);border-radius:6px;font-size:14px;cursor:pointer;color:var(--muted)">Edit name</button>' +
        '</div>' +
      '</form>' +
    '</div>' +
    '<script>' +
    'async function pshGenerateDraft(){' +
      'var btn=document.getElementById(\'psh-draft-btn\');' +
      'var name=document.getElementById(\'psh-name\').value.trim();' +
      'var desc=document.getElementById(\'psh-description\').value.trim();' +
      'if(!name){alert(\'Product name is required\');return;}' +
      'btn.disabled=true;btn.textContent=\'Generating…\';' +
      'try{' +
        'var r=await fetch(\'/products/new\',{method:\'POST\',headers:{\'Content-Type\':\'application/json\'},body:JSON.stringify({name:name,description:desc})});' +
        'var j=await r.json();' +
        'var d=j.draft||{};' +
        'document.getElementById(\'psh-confirm-name\').value=name;' +
        'document.getElementById(\'psh-confirm-description\').value=desc;' +
        'document.getElementById(\'psh-draft-mission\').value=d.mission||\'Mission: \'+name;' +
        'document.getElementById(\'psh-draft-roadmap\').value=d.roadmap||\'\';' +
        'document.getElementById(\'psh-draft-techStack\').value=d.techStack||\'\';' +
        'document.getElementById(\'psh-draft-constraints\').value=d.constraints||\'\';' +
        'document.getElementById(\'psh-draft-architectureGuardrails\').value=d.architectureGuardrails||\'\';' +
        'document.getElementById(\'psh-drafts\').style.display=\'block\';' +
        'document.getElementById(\'psh-drafts\').scrollIntoView({behavior:\'smooth\'});' +
      '}catch(e){alert(\'Failed to generate draft: \'+e.message);}' +
      'finally{btn.disabled=false;btn.textContent=\'Generate context files →\';}' +
    '}' +
    '<\/script>' +
  '</div>';
  return _htmlShell.renderShell({ title: 'New product', bodyContent: body, user: { login: login }, active: 'dashboard', crumbs: ['Products', 'New'] });
}

function _renderProductView(productName, productId, features, login) {
  var featuresHtml = features.length === 0
    ? '<p style="color:var(--muted);font-size:14px">No features yet.</p>'
    : '<ul style="list-style:none;padding:0;margin:0">' +
        features.map(function(f) {
          return '<li style="padding:14px 0;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center">' +
            '<div>' +
              '<div style="font-size:14px;font-weight:500">' + _escapeHtml(f.featureSlug || f.journey_id) + '</div>' +
              '<div style="font-size:12px;color:var(--muted);margin-top:2px">' + _escapeHtml(f.stage || '') + '</div>' +
            '</div>' +
            '<span style="font-size:12px;color:' + (f.health === 'red' ? '#ef4444' : f.health === 'amber' ? '#f59e0b' : '#22c55e') + '">' +
              (f.health === 'red' ? '⚠ Blocked' : f.health === 'amber' ? '⚠ Warning' : '✓ Healthy') +
            '</span>' +
          '</li>';
        }).join('') +
      '</ul>';
  var body = '<div style="max-width:720px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">' +
      '<div>' +
        '<div style="font-size:12px;color:var(--muted);margin-bottom:4px"><a href="/dashboard" style="color:var(--muted);text-decoration:none">Products</a> ›</div>' +
        '<h1 style="margin:0;font-size:24px">' + _escapeHtml(productName) + '</h1>' +
      '</div>' +
      '<div style="display:flex;gap:10px">' +
        '<a href="/products/' + _escapeHtml(productId) + '/kanban" style="padding:8px 14px;border:1px solid var(--line);border-radius:6px;text-decoration:none;font-size:13px;color:var(--ink)">Kanban</a>' +
        '<form method="POST" action="/products/' + _escapeHtml(productId) + '/features" style="margin:0">' +
          '<button type="submit" style="padding:8px 16px;background:var(--accent);color:var(--accent-ink);border:none;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer">New feature</button>' +
        '</form>' +
      '</div>' +
    '</div>' +
    featuresHtml +
  '</div>';
  return _htmlShell.renderShell({ title: productName, bodyContent: body, user: { login: login }, active: 'dashboard' });
}

function _isTeamPlan(session) {
  return session && session.plan === 'team';
}

async function handlePostProductNew(req, res, _next, pool, posthog) {
  var draft = await _productDraft.generateProductDraft({
    name: (req.body && req.body.name) || '',
    description: (req.body && req.body.description) || ''
  });
  var body = JSON.stringify({ draft: draft });
  if (res.json) {
    res.json({ draft: draft }); // test mock path
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(body);
  }
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
    if (res.status) { res.status(400).json({ error: 'invalid product name' }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'invalid product name' })); }
    return;
  }

  // Solo plan: max 1 product
  if (!_isTeamPlan(req.session) && _pool) {
    var existing = await _pool.query('SELECT product_id FROM products WHERE tenant_id = $1', [tenantId]);
    if (existing.rows.length >= 1) {
      if (res.status) { res.status(403).json({ reason: 'plan_limit', upgradeRequired: true }); }
      else { res.writeHead(403, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ reason: 'plan_limit', upgradeRequired: true })); }
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

  // Redirect to the product view after creation
  if (res.status) {
    res.status(201).json({ product_id: productId }); // test mock path
  } else {
    res.writeHead(302, { 'Location': '/products/' + productId });
    res.end();
  }
}

async function handleGetDashboard(req, res, _next, pool) {
  var _pool = pool;
  var tenantId = req.session && req.session.tenantId;
  var login = req.session && req.session.login;
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
  if (res.json) {
    res.json({ products: cards, showCta: cards.length === 0 });
  } else {
    var html = _renderProductDashboard(cards, login);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
}

function handleGetProductNew(req, res) {
  var login = req.session && req.session.login;
  var html = _renderProductNew(login, null);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

async function handleGetProductView(req, res, _next, pool) {
  var _pool = pool;
  var productId = req.params && req.params.id;
  var login = req.session && req.session.login;
  var prodRow = (await _pool.query(
    'SELECT name FROM products WHERE product_id = $1',
    [productId]
  )).rows[0];
  var productName = prodRow ? prodRow.name : productId;
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
  if (res.json) {
    res.json({ features: features });
  } else {
    var html = _renderProductView(productName, productId, features, login);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
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

  if (res.json) { res.json({ columns: columns }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ columns: columns })); }
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

  if (res.json) { res.json({ groups: groups }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ groups: groups })); }
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
    res.redirect('/journeys/' + journeyId + '/discovery'); // test mock path
  } else {
    res.writeHead(302, { 'Location': '/journeys/' + journeyId + '/discovery' });
    res.end();
  }
}

module.exports = {
  handlePostProductNew,
  handlePostProductConfirm,
  handleGetDashboard,
  handleGetProductNew,
  handleGetProductView,
  handlePostProductFeature,
  handleGetProductKanban,
  handleGetOrgKanban
};
