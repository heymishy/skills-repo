'use strict';

// rate-limiter.js — per-tenant rate limiting middleware (ADR-009, p4.1)
// Enforces max requests per tenant (or IP when tenantId absent) per sliding window.
// In-memory store — sufficient for single-instance web-ui server (p4.1 W1 RISK-ACCEPT).

/**
 * Build the rate-limit counter key for a request.
 * Returns tenantId when present; falls back to IP for backward compatibility.
 * @param {object} req
 * @returns {string}
 */
function buildRateLimitKey(req) {
  var tenantId = req.session && req.session.tenantId;
  if (tenantId != null && tenantId !== '') return String(tenantId);
  return req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
}

/**
 * Create a per-tenant rate limiter middleware.
 *
 * @param {{ maxRequests?: number, windowMs?: number }} options
 *   maxRequests: maximum requests allowed per window (default: 10)
 *   windowMs: sliding window size in milliseconds (default: 60000 = 1 minute)
 * @returns {Function} middleware(req, res, next)
 */
function createRateLimiter({ maxRequests = 10, windowMs = 60 * 1000 } = {}) {
  const _counts = new Map();

  return function rateLimiterMiddleware(req, res, next) {
    const key = buildRateLimitKey(req);

    if (!key || key === 'unknown') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorised — no session' }));
      return;
    }

    const now    = Date.now();
    const cutoff = now - windowMs;

    const timestamps = (_counts.get(key) || []).filter(t => t > cutoff);
    timestamps.push(now);
    _counts.set(key, timestamps);

    if (timestamps.length > maxRequests) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Too Many Requests — rate limit exceeded' }));
      return;
    }

    next();
  };
}

module.exports = { createRateLimiter, buildRateLimitKey };
