'use strict';

// admin-credits-diagnostics.js -- sfx-s1. bri-s3.3 AC1 has failed intermittently against staging (alice's
// GET /admin/credits was not 200, or the connection aborted after a 200). That page renders every tenant on the shared
// staging database with one plan lookup per tenant, so how long it took and how many tenants it rendered are the evidence
// that says whether it is load. This builds the one log line the spec prints for each call; it asserts nothing.

const ROW_MARKER = 'tpac-credits-balance';

/** Number of tenant rows in the rendered page, or null when there is no body to count. */
function countTenantRows(body) {
  if (typeof body !== 'string') return null;
  return body.split(ROW_MARKER).length - 1;
}

/**
 * @param {{who: string, status?: number, elapsedMs: number, body?: string, error?: Error}} call
 * @returns {string}
 */
function summariseAdminCreditsCall(call) {
  const c = call || {};
  const rows = countTenantRows(c.body);
  const rowsText = rows === null ? 'tenant rows unknown' : rows + ' tenant row(s)';
  const prefix = '[bri-s3.3] ' + c.who + ' GET /admin/credits';
  if (c.error) {
    const status = typeof c.status === 'number' ? 'status ' + c.status : 'status unknown';
    return prefix + ' failed after ' + c.elapsedMs + ' ms (' + status + '): ' + (c.error && c.error.message ? c.error.message : String(c.error)) + '; ' + rowsText;
  }
  return prefix + ': status ' + c.status + ' in ' + c.elapsedMs + ' ms, ' + rowsText;
}

module.exports = { summariseAdminCreditsCall, countTenantRows };
