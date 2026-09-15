'use strict';

// routes/pods.js — ep1-s1: Pod Manager HTTP handlers. Matches routes/
// products.js's handler shape: (req, res, pool[, presetBody]) -- the
// optional 4th param lets tests pass a body directly instead of a real
// request stream, mirroring _readBody's own existing req.body fast-path.
//
// AC1 only in this task -- AC2's duplicate-name guard is added in Task 3,
// AC3's invalid-role guard is added in Task 4, each with its own failing
// test first.
const { createPod, listPods } = require('../modules/pod-store');

function _json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function _readBody(req) {
  if (req.body !== undefined) return req.body;
  if (typeof req.on !== 'function') return {};
  return new Promise(function(resolve) {
    var raw = '';
    req.on('data', function(c) { raw += c; });
    req.on('end', function() {
      try { resolve(JSON.parse(raw)); } catch (_) { resolve({}); }
    });
    req.on('error', function() { resolve({}); });
  });
}

/**
 * POST /api/pods/create — AC1 happy path only (see Tasks 3/4 for AC2/AC3).
 */
async function handlePostPodsCreate(req, res, pool, presetBody) {
  const body = presetBody !== undefined ? presetBody : await _readBody(req);
  const tenantId = req.session && req.session.tenantId;
  const name = (body.name || '').trim();
  const members = Array.isArray(body.members) ? body.members : [];

  if (!name) {
    return _json(res, 400, { error: 'Pod name is required' });
  }

  const createdBy = (req.session && (req.session.userId || req.session.login)) || null;
  const result = await createPod(pool, { tenantId, name, createdBy, members });
  return _json(res, 200, { podId: result.podId, name: result.name, memberCount: result.memberCount });
}

/**
 * GET /api/pods — list every pod for the caller's tenant (tenant-isolation
 * integration test, Task 5).
 */
async function handleGetPods(req, res, pool) {
  const tenantId = req.session && req.session.tenantId;
  const pods = await listPods(pool, tenantId);
  return _json(res, 200, { pods });
}

module.exports = { handlePostPodsCreate, handleGetPods };
