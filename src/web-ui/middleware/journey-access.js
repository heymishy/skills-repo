'use strict';

const POLICY = { TENANT: 'TENANT', OWNER: 'OWNER' };

function isSameTenant(journey, session) {
  if (journey.tenantId == null || session.tenantId == null) return true;
  return journey.tenantId === session.tenantId;
}

// jatg-s1: the policy param was accepted but never read -- whether
// isSameTenant() returned true or false, both branches above threw
// FORBIDDEN, so every POLICY.TENANT route behaved as owner-only
// regardless of tenant match. Fixed with an explicit, positively-verified
// tenant-match grant -- deliberately NOT reusing isSameTenant() here.
// isSameTenant()'s "either side missing tenantId -> true" passthrough
// was built for unrelated Phase-0 legacy compatibility. A full audit of
// every real POLICY.TENANT caller's own test suite (p0.2 and its
// subprocess-callers p1.1/p1.2, s3.4, kcrs-s1, and this story's own
// wsm2 bug report) found their test fixtures never set session.tenantId
// at all -- not because they deliberately wanted the passthrough
// semantics, but because they simply predate/omit tenant modeling on
// the session side. Reusing isSameTenant() here would silently grant
// cross-tenant access disguised as a coincidental fixture gap. See
// jatg-s1's own decisions.md for the full investigation.
function requireJourneyAccess(journey, session, policy) {
  if (journey == null) throw { code: 'NOT_FOUND' };
  if (!session || !session.accessToken) throw { code: 'UNAUTHENTICATED' };
  if (journey.ownerId == null) return;
  if (session.login === journey.ownerId) return;
  if (policy === POLICY.TENANT &&
      journey.tenantId != null &&
      session.tenantId != null &&
      journey.tenantId === session.tenantId) {
    return;
  }
  throw { code: 'FORBIDDEN' };
}

function asHttpResponse(err, policy) {
  if (err.code === 'UNAUTHENTICATED') return 401;
  if (err.code === 'NOT_FOUND') return 404;
  if (err.code === 'FORBIDDEN') {
    return policy === POLICY.OWNER ? 403 : 404;
  }
  return 500;
}

// story-2-relationship-grants-enforcement (artefacts/2026-07-30-agency-client-organisations)
// AC4/AC5: extends this module's existing FORBIDDEN-vs-NOT_FOUND guard
// pattern to the new relationship-scoped shared-access-grant shape. A
// Client-org requester with no grant for a resource (never shared, shared
// only via a different relationship, or revoked) must see the exact same
// outcome as a genuinely non-existent resource -- never a 403 that would
// confirm the resource's existence to an unauthorised viewer.
//
// The grant itself is checked live by modules/agency-client-grants.js's
// checkGrantAccess (the story's own dedicated grant-check adapter) BEFORE
// this guard is called -- this function only converts "no grant" into the
// same structured error shape requireJourneyAccess already uses, so callers
// use the existing asHttpResponse(err, POLICY.TENANT) to get 404, exactly
// like every other TENANT-policy guard in this module.
function requireGrantAccess(grant) {
  if (grant == null) throw { code: 'NOT_FOUND' };
}

module.exports = { POLICY, isSameTenant, requireJourneyAccess, requireGrantAccess, asHttpResponse };
