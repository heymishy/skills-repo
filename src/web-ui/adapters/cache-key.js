'use strict';

/**
 * Build a tenant-scoped prompt-cache key for a session.
 * Returns '${tenantId}-${sessionId}' when tenantId is present and non-null.
 * Falls back to sessionId alone for backward compatibility (single-tenant / pre-Phase-1 sessions).
 * Synchronous — no I/O.
 * @param {{ tenantId?: string|null, sessionId: string }} session
 * @returns {string}
 */
function buildCacheKey(session) {
  var tenantId  = session && session.tenantId;
  var sessionId = session && session.sessionId;
  if (tenantId != null && tenantId !== '') {
    return tenantId + '-' + sessionId;
  }
  return String(sessionId);
}

module.exports = { buildCacheKey };
