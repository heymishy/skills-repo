'use strict';

var _posthog = require('../modules/posthog-server');

function _escapeHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/**
 * bri-s3.4: read + parse the request body, short-circuiting when req.body is
 * already populated (existing unit tests construct req objects with body
 * pre-set, Express-mock style). Neither standardsPost nor standardsPut had
 * ANY body-parsing step -- req.body.name/req.body.content were always
 * undefined for a real raw-http POST/PUT with no upstream middleware, a
 * pre-existing gap this story's E2E spec surfaced while driving the real
 * standard-creation/edit flow (same pattern as routes/products.js's
 * _readBody, added by bri-s3.2 for the same reason).
 * @param {object} req
 * @returns {Promise<object>}
 */
function _readBody(req) {
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise(function(resolve) {
    var raw = '';
    req.on('data', function(c) { raw += c; });
    req.on('end', function() {
      var ct = (req.headers && req.headers['content-type']) || '';
      if (ct.indexOf('application/json') !== -1) {
        try { resolve(JSON.parse(raw)); } catch (_) { resolve({}); }
      } else {
        var params = new URLSearchParams(raw);
        var obj = {};
        params.forEach(function(v, k) { obj[k] = v; });
        resolve(obj);
      }
    });
    req.on('error', function() { resolve({}); });
  });
}

async function standardsPost(req, res, _next, pool, posthog) {
  var _pool = pool;
  var _ph = posthog || _posthog;
  var tenantId = req.session && req.session.tenantId;
  var productId = req.params && req.params.id;
  req.body = await _readBody(req);
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

  // bri-s3.4: this handler previously never verified the target productId
  // belongs to the caller's own tenant -- tenant A could attach a standard to
  // tenant B's product by ID. 404 (not 403), consistent with the
  // FORBIDDEN-vs-NOT_FOUND policy used elsewhere in this codebase.
  var _ownerRow = (await _pool.query(
    'SELECT tenant_id FROM products WHERE product_id = $1',
    [productId]
  )).rows[0];
  if (!_ownerRow || _ownerRow.tenant_id !== tenantId) {
    res.status(404).json({ error: 'not found' });
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
  var tenantId = req.session && req.session.tenantId;
  // bri-s3.4: this query previously had no tenant filter at all -- listing
  // standards for a product_id whose standards were seeded/created under a
  // different tenant's org_id (or a product owned by another tenant) leaked
  // those rows to any authenticated caller. org_id is this table's tenant
  // boundary (see standardsPromote's existing org_id check below).
  var rows = (await _pool.query(
    'SELECT standard_id, name, visibility, created_at FROM standards WHERE product_id = $1 AND org_id = $2 ORDER BY created_at DESC',
    [productId, tenantId]
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
  var tenantId = req.session && req.session.tenantId;
  var standardId = req.params && req.params.id;
  req.body = await _readBody(req);
  var name = (req.body && req.body.name) || '';
  var content = (req.body && req.body.content) || '';

  // bri-s3.4: this handler previously updated any standard by ID with no
  // ownership check at all -- any authenticated user of any tenant could
  // edit another tenant's standard. 404 (not 403) on a missing/mismatched
  // standard, consistent with the FORBIDDEN-vs-NOT_FOUND policy used
  // elsewhere in this codebase.
  var _ownerRow = (await _pool.query(
    'SELECT org_id FROM standards WHERE standard_id = $1',
    [standardId]
  )).rows[0];
  if (!_ownerRow || _ownerRow.org_id !== tenantId) {
    res.status(404).json({ error: 'not found' });
    return;
  }

  await _pool.query(
    'UPDATE standards SET name = $1, content = $2, updated_at = NOW() WHERE standard_id = $3',
    [name, content, standardId]
  );
  res.status(200).json({ standard_id: standardId });
}

async function standardsPromote(req, res, _next, pool, posthog) {
  var _pool = pool;
  var _ph = posthog || _posthog;
  var tenantId = req.session && req.session.tenantId;
  var standardId = req.params && req.params.id;

  var row = (await _pool.query(
    'SELECT standard_id, org_id, visibility FROM standards WHERE standard_id = $1',
    [standardId]
  )).rows[0];
  if (!row) { res.status(404).json({ error: 'not found' }); return; }
  if (row.org_id !== tenantId) { res.status(403).json({ error: 'forbidden' }); return; }

  await _pool.query(
    'UPDATE standards SET visibility = $1, updated_at = NOW() WHERE standard_id = $2',
    ['org', standardId]
  );

  _ph.capture(tenantId, 'standard_promoted', {
    standardId: standardId,
    tenantId: tenantId,
    visibility: 'org'
  });

  res.status(200).json({ standard_id: standardId, visibility: 'org' });
}

async function optoutPost(req, res, _next, pool, posthog) {
  var _pool = pool;
  var standardId = req.params && req.params.id;
  var productId = (req.body && req.body.productId) || (req.params && req.params.productId);
  await _pool.query(
    'INSERT INTO standard_product_optouts (standard_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [standardId, productId]
  );
  res.status(201).json({ standard_id: standardId, product_id: productId, opted_out: true });
}

async function optoutDelete(req, res, _next, pool, posthog) {
  var _pool = pool;
  var standardId = req.params && req.params.id;
  var productId = (req.body && req.body.productId) || (req.params && req.params.productId);
  await _pool.query(
    'DELETE FROM standard_product_optouts WHERE standard_id = $1 AND product_id = $2',
    [standardId, productId]
  );
  res.status(200).json({ standard_id: standardId, product_id: productId, opted_out: false });
}

module.exports = { standardsPost, standardsList, standardsPut, standardsPromote, optoutPost, optoutDelete };
