'use strict';

// routes/pods.js — ep1-s1: Pod Manager HTTP handlers. Matches routes/
// products.js's handler shape: (req, res, pool[, presetBody]) -- the
// optional 4th param lets tests pass a body directly instead of a real
// request stream, mirroring _readBody's own existing req.body fast-path.
//
// AC1 + AC2 so far -- AC3's invalid-role guard is added in Task 4, each
// with its own failing test first.
const { createPod, listPods, findPodByName, isValidRole, VALID_ROLES } = require('../modules/pod-store');

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
 * POST /api/pods/create — AC1 happy path + AC2 duplicate-name rejection
 * (see Task 4 for AC3's invalid-role guard).
 */
async function handlePostPodsCreate(req, res, pool, presetBody) {
  const body = presetBody !== undefined ? presetBody : await _readBody(req);
  const tenantId = req.session && req.session.tenantId;
  const name = (body.name || '').trim();
  const members = Array.isArray(body.members) ? body.members : [];

  if (!name) {
    return _json(res, 400, { error: 'Pod name is required' });
  }

  // AC2: duplicate name rejection -- check BEFORE any write.
  const existing = await findPodByName(pool, tenantId, name);
  if (existing) {
    return _json(res, 400, { error: "A pod named '" + name + "' already exists" });
  }

  // AC3: invalid role rejection -- check BEFORE any write.
  for (const m of members) {
    if (!isValidRole(m.roleId)) {
      return _json(res, 400, { error: "Invalid role: '" + m.roleId + "'. Valid roles are: " + VALID_ROLES.join(', ') });
    }
  }

  const createdBy = (req.session && (req.session.userId || req.session.login)) || null;
  let result;
  try {
    result = await createPod(pool, { tenantId, name, createdBy, members });
  } catch (err) {
    if (err && err.code === 'POD_NAME_TAKEN') {
      return _json(res, 400, { error: "A pod named '" + name + "' already exists" });
    }
    throw err;
  }
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
