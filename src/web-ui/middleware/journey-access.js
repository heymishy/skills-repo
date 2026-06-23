'use strict';

const POLICY = { TENANT: 'TENANT', OWNER: 'OWNER' };

function isSameTenant(journey, session) {
  if (journey.tenantId == null || session.tenantId == null) return true;
  return journey.tenantId === session.tenantId;
}

function requireJourneyAccess(journey, session, policy) {
  if (journey == null) throw { code: 'NOT_FOUND' };
  if (!session || !session.accessToken) throw { code: 'UNAUTHENTICATED' };
  if (journey.ownerId == null) return;
  if (session.login === journey.ownerId) return;
  if (!isSameTenant(journey, session)) throw { code: 'FORBIDDEN' };
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

module.exports = { POLICY, isSameTenant, requireJourneyAccess, asHttpResponse };
