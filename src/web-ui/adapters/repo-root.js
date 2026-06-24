'use strict';
var path = require('path');

var _repoRoot = null;

function setRepoRoot(root) { _repoRoot = root; }

function slugifyTenantId(id) {
  return String(id).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
}

function getRepoRoot(req) {
  var base = process.env.WUCE_TENANT_ROOT_BASE;
  var tenantId = req && req.session && req.session.tenantId;
  if (base && tenantId) {
    return path.resolve(base, slugifyTenantId(tenantId));
  }
  return _repoRoot || process.env.CLAUDE_REPO_PATH || process.env.COPILOT_REPO_PATH || path.resolve('.');
}

module.exports = { slugifyTenantId, getRepoRoot, setRepoRoot };
