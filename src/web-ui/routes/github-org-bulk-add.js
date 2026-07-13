'use strict';

// github-org-bulk-add.js — tir-s5 (fetch mechanism fixed by tir-s8)
// POST /api/team/bulk-add-github-org — admin-only bulk-add action. Mounted
// behind requireAdmin in server.js (matches team-management.js's own
// convention exactly -- requireAdmin applied at mount time, not inside the
// handler).
//
// tir-s8: the org-membership read now goes through routes/auth.js's
// getOrgMembers (D37: setFetchOrgMembers) instead of the old getFetchOrgs
// accessor -- getOrgMembers is org-name-parameterized (GET
// /orgs/{org}/members), unlike the old fetchOrgs adapter (GET /user/orgs,
// which lists orgs a token belongs to, not members of a specific org).
//
// Security (NFR) / ADR-025: this handler reads no fields from the request
// body at all -- the org whose members are fetched is always
// req.session.tenantId (passed as getOrgMembers' orgName argument), and the
// tenant every added row is written to is always that same
// req.session.tenantId (same convention as tir-s3's /api/team/members).
// There is no request-supplied org name for an admin to spoof.

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
 * getOrgMembers adapter wrapper (mirrors createTeamManagementHandlers(pool)'s
 * factory convention). tir-s8: getOrgMembers is routes/auth.js's exported
 * wrapper function itself (not an accessor-of-an-accessor) -- it always
 * delegates to whatever's currently wired via setFetchOrgMembers, so a
 * single reference taken at server startup stays correct across rewiring.
 * Passed in here rather than required directly, so this module has no
 * compile-time dependency on routes/auth.js.
 * @param {object} pool
 * @param {Function} getOrgMembers - routes/auth.js's getOrgMembers(orgName, accessToken, page) (D37: setFetchOrgMembers)
 * @returns {{handleBulkAddFromGithubOrg: Function}}
 */
function createGithubOrgBulkAddHandlers(pool, getOrgMembers) {
  /**
   * POST /api/team/bulk-add-github-org — bulk-add every member of the
   * admin's own connected GitHub org as a teammate (AC1, AC3). ADR-025:
   * tenantId is ALWAYS req.session.tenantId (also passed as getOrgMembers'
   * orgName argument); accessToken is ALWAYS req.session.accessToken
   * (canonical field name — CLAUDE.md, never req.session.token). No request
   * body field is read.
   */
  async function handleBulkAddFromGithubOrg(req, res) {
    var adminTenantId = req.session && req.session.tenantId;
    var adminId = req.session && req.session.userId;
    var accessToken = req.session && req.session.accessToken;

    try {
      var result = await githubOrgBulkAdd.bulkAddFromGithubOrg(pool, adminTenantId, getOrgMembers, accessToken, adminId, _logger);
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
