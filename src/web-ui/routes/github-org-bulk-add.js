'use strict';

// github-org-bulk-add.js — tir-s5
// POST /api/team/bulk-add-github-org — admin-only bulk-add action. Mounted
// behind requireAdmin in server.js (matches team-management.js's own
// convention exactly -- requireAdmin applied at mount time, not inside the
// handler).
//
// Security (NFR): this handler reads no fields from the request body at all
// -- the org is always the one implicit in the admin's own session
// accessToken (via the fetchOrgs adapter), and the tenant every added row is
// written to is always req.session.tenantId (ADR-025 convention, same as
// tir-s3's /api/team/members). There is no request-supplied org name for an
// admin to spoof.

var githubOrgBulkAdd = require('../modules/github-org-bulk-add');

// Audit logger — replaced via setLogger() in tests and production bootstrap.
// Mirrors routes/team-management.js's own _logger / setLogger convention.
let _logger = {
  info: (/* event, data */) => {}
};

/**
 * Replace the audit logger (used in tests and production startup).
 * @param {{ info: Function }} logger
 */
function setLogger(logger) {
  _logger = logger;
}

/**
 * Build the bulk-add handler, closed over a single pool instance and the
 * currently-wired org-fetch adapter accessor (mirrors
 * createTeamManagementHandlers(pool)'s factory convention). No new D37
 * adapter (H-ADAPTER: reuses routes/auth.js's existing setFetchOrgs adapter
 * via its getFetchOrgs() accessor, passed in here rather than required
 * directly, so this module has no compile-time dependency on routes/auth.js).
 * @param {object} pool
 * @param {Function} getFetchOrgs - routes/auth.js's getFetchOrgs (returns the currently-wired adapter fn)
 * @returns {{handleBulkAddFromGithubOrg: Function}}
 */
function createGithubOrgBulkAddHandlers(pool, getFetchOrgs) {
  /**
   * POST /api/team/bulk-add-github-org — bulk-add every member of the
   * admin's own connected GitHub org as a teammate (AC1, AC3). ADR-025:
   * tenantId is ALWAYS req.session.tenantId; accessToken is ALWAYS
   * req.session.accessToken (canonical field name — CLAUDE.md, never
   * req.session.token). No request body field is read.
   */
  async function handleBulkAddFromGithubOrg(req, res) {
    var adminTenantId = req.session && req.session.tenantId;
    var adminId = req.session && req.session.userId;
    var accessToken = req.session && req.session.accessToken;

    try {
      var fetchOrgs = getFetchOrgs();
      var result = await githubOrgBulkAdd.bulkAddFromGithubOrg(pool, adminTenantId, fetchOrgs, accessToken, adminId, _logger);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      if (err instanceof githubOrgBulkAdd.OrgAccessError) {
        res.writeHead(err.status || 403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
      throw err;
    }
  }

  return { handleBulkAddFromGithubOrg: handleBulkAddFromGithubOrg };
}

module.exports = { createGithubOrgBulkAddHandlers: createGithubOrgBulkAddHandlers, setLogger: setLogger };
