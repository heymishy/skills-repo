'use strict';

var _posthog = require('../modules/posthog-server');

function _escapeHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function standardsPost(req, res, _next, pool, posthog) {
  var _pool = pool;
  var _ph = posthog || _posthog;
  var tenantId = req.session && req.session.tenantId;
  var productId = req.params && req.params.id;
  var name = (req.body && req.body.name) || '';
  var content = (req.body && req.body.content) || '';

  if (name.indexOf('..') !== -1 || name.indexOf('/') !== -1 || name.indexOf('\\') !== -1) {
    res.status(400).json({ error: 'invalid standard name' });
    return;
  }

  if (!name.trim() || !content.trim()) {
    res.status(400).json({ error: 'name and content are required' });
    return;
  }

  var r = await _pool.query(
    'INSERT INTO standards (product_id, org_id, name, content, visibility) VALUES ($1, $2, $3, $4, $5) RETURNING standard_id',
    [productId, tenantId, name, content, 'product']
  );
  var standardId = r.rows[0].standard_id;

  _ph.capture(tenantId, 'standard_created', {
    standardId: standardId,
    productId: productId,
    tenantId: tenantId,
    visibility: 'product'
  });

  res.status(201).json({ standard_id: standardId });
}

async function standardsList(req, res, _next, pool) {
  var _pool = pool;
  var productId = req.params && req.params.id;
  var rows = (await _pool.query(
    'SELECT standard_id, name, visibility, created_at FROM standards WHERE product_id = $1 ORDER BY created_at DESC',
    [productId]
  )).rows;
  var standards = rows.map(function(s) {
    return {
      standard_id: s.standard_id,
      name: _escapeHtml(s.name),
      visibility: s.visibility,
      visibilityLabel: s.visibility === 'org' ? 'Org' : 'Product',
      created_at: s.created_at
    };
  });
  res.json({ standards: standards });
}

async function standardsPut(req, res, _next, pool) {
  var _pool = pool;
  var standardId = req.params && req.params.id;
  var name = (req.body && req.body.name) || '';
  var content = (req.body && req.body.content) || '';
  await _pool.query(
    'UPDATE standards SET name = $1, content = $2, updated_at = NOW() WHERE standard_id = $3',
    [name, content, standardId]
  );
  res.status(200).json({ standard_id: standardId });
}

module.exports = { standardsPost, standardsList, standardsPut };
