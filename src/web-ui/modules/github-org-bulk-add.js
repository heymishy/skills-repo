'use strict';

// github-org-bulk-add.js — tir-s5
// Bulk-adds every member of the admin's own connected GitHub org as a
// teammate in one action. Reuses tir-s3's addOrUpdateTeammate
// (team-management.js) as the single write path and p1.1's setFetchOrgs
// adapter (routes/auth.js, accessed via its getFetchOrgs() accessor) as the
// single GitHub org-membership read path -- no new D37 adapter is
// introduced (H-ADAPTER: DoR confirms this reuses both existing mechanisms
// rather than adding a third).
//
// Security (NFR): the org whose membership is read is never taken from a
// request parameter. There is no "org name" argument anywhere in this
// module's public function -- the fetchOrgs adapter is always called with
// only the admin's own session accessToken, so there is no parameter an
// admin could spoof to point bulk-add at a different org. The written rows
// always use adminTenantId, which the caller (routes/github-org-bulk-add.js)
// always sources from req.session.tenantId, never from request input
// (mirrors tir-3's ADR-025 convention exactly).

var teamManagement = require('./team-management');
var identityLinks = require('./identity-links');

var _defaultLogger = {
  info: function(msg, data) { console.log(msg, data || ''); }
};

var DEFAULT_ROLE = 'engineer';

/**
 * Thrown when the GitHub org-membership fetch fails -- most commonly because
 * the admin's OAuth token lacks the required org-membership read scope
 * (AC4). Always a clear, actionable message naming the missing permission;
 * never a silent no-op and never left to surface as an unhandled crash.
 * @param {string} message
 */
function OrgAccessError(message) {
  Error.call(this, message);
  this.name = 'OrgAccessError';
  this.message = message;
  this.status = 403;
  if (Error.captureStackTrace) Error.captureStackTrace(this, OrgAccessError);
}
OrgAccessError.prototype = Object.create(Error.prototype);
OrgAccessError.prototype.constructor = OrgAccessError;

/**
 * Page through fetchOrgs exactly as routes/auth.js's own resolveTenant does
 * (same adapter, same pagination shape: Array<{login}> | {orgs, nextPage}) --
 * reused verbatim rather than reimplemented, per the DoR contract. Any
 * failure (including a token missing org-read scope) is translated into a
 * clear OrgAccessError (AC4) rather than propagating a raw/opaque error.
 * @param {Function} fetchOrgs - the currently-wired setFetchOrgs adapter (routes/auth.js getFetchOrgs())
 * @param {string} accessToken
 * @returns {Promise<Array<{login: string}>>}
 */
async function _fetchAllOrgMembers(fetchOrgs, accessToken) {
  var all = [];
  var page = 1;
  try {
    while (true) {
      var result = await fetchOrgs(accessToken, page);
      var members = Array.isArray(result) ? result : result.orgs;
      var nextPage = Array.isArray(result) ? null : result.nextPage;
      all = all.concat(members || []);
      if (!nextPage) break;
      page = nextPage;
    }
  } catch (e) {
    throw new OrgAccessError(
      'Unable to read GitHub organisation membership -- your connected GitHub token is missing the ' +
      'required org-membership read permission (read:org scope). Reconnect your GitHub account with ' +
      'organisation access and try again.'
    );
  }
  return all;
}

/**
 * Bulk-add every member of the admin's own connected GitHub org as a
 * teammate of adminTenantId, at the fixed default role "engineer" (AC1).
 * Already-present members (resolved via tir-s2's resolvePersonForIdentity,
 * not by raw identity-string comparison) are skipped entirely --
 * addOrUpdateTeammate is never called for them, so a manually-set role is
 * never overwritten (AC3). This is a deliberate, verified design choice, not
 * an assumption: addOrUpdateTeammate's own UPSERT unconditionally sets
 * role = the passed-in value on every call, including for rows that already
 * exist, so calling it unconditionally for every org member would fail AC3.
 *
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {string} adminTenantId - always req.session.tenantId at the route layer (NFR: never request-supplied)
 * @param {Function} fetchOrgs - the currently-wired setFetchOrgs adapter (routes/auth.js getFetchOrgs())
 * @param {string} accessToken - always req.session.accessToken at the route layer
 * @param {string} [adminId] - the calling admin's own session identifier, for the audit log
 * @param {{info: Function}} [logger]
 * @returns {Promise<{addedCount: number, skippedCount: number, totalOrgMembers: number}>}
 */
async function bulkAddFromGithubOrg(pool, adminTenantId, fetchOrgs, accessToken, adminId, logger) {
  var log = logger || _defaultLogger;

  var orgMembers = await _fetchAllOrgMembers(fetchOrgs, accessToken);

  var addedCount = 0;
  var skippedCount = 0;

  for (var i = 0; i < orgMembers.length; i++) {
    var identityKey = orgMembers[i] && orgMembers[i].login;
    if (!identityKey) continue;

    var personId = await identityLinks.resolvePersonForIdentity(pool, identityKey);
    if (personId != null) {
      var existingRole = await teamManagement.getRoleForPersonInTenant(pool, adminTenantId, personId);
      if (existingRole != null) {
        skippedCount++;
        continue; // AC3: already a member of this tenant -- role is never touched
      }
    }

    try {
      await teamManagement.addOrUpdateTeammate(pool, adminTenantId, identityKey, DEFAULT_ROLE, adminId, log);
      addedCount++;
    } catch (err) {
      if (err instanceof teamManagement.UnknownIdentityError) {
        // Org member has never logged into this platform -- addOrUpdateTeammate
        // deliberately rejects rather than creating a placeholder person row
        // (tir-s3 AC5). Bulk-add skips them rather than failing the whole
        // action for the members who ARE resolvable.
        skippedCount++;
        continue;
      }
      throw err;
    }
  }

  // Audit (NFR): admin id, org name, count of members added, timestamp. In
  // this system's model tenantId already IS the GitHub org login (see
  // routes/auth.js's resolveTenant), so orgName is populated from it.
  log.info('bulk_add_completed', {
    adminId: adminId,
    orgName: adminTenantId,
    tenantId: adminTenantId,
    addedCount: addedCount,
    skippedCount: skippedCount,
    totalOrgMembers: orgMembers.length,
    timestamp: new Date().toISOString()
  });

  return { addedCount: addedCount, skippedCount: skippedCount, totalOrgMembers: orgMembers.length };
}

module.exports = {
  bulkAddFromGithubOrg,
  OrgAccessError,
  DEFAULT_ROLE
};
