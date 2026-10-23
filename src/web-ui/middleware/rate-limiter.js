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
 * Create a rate limiter middleware.
 *
 * @param {{ maxRequests?: number, windowMs?: number, keyFn?: Function, onLimited?: Function }} options
 *   maxRequests: maximum requests allowed per window (default: 10)
 *   windowMs: sliding window size in milliseconds (default: 60000 = 1 minute)
 *   keyFn: (req) => string — how to derive the counter key (default: buildRateLimitKey,
 *     i.e. per-tenant). ppc-s3: pass a custom keyFn to scope per-user instead.
 *   onLimited: (req, res) => void — called instead of the default raw-JSON 429 write
 *     when the limit is exceeded, so a caller can render a different response shape
 *     (e.g. an accessible HTML page for a real browser form submission). Default
 *     behaviour (no onLimited) is unchanged from before this option existed.
 * @returns {Function} middleware(req, res, next)
 */
function createRateLimiter({ maxRequests = 10, windowMs = 60 * 1000, keyFn = buildRateLimitKey, onLimited } = {}) {
  const _counts = new Map();

  return function rateLimiterMiddleware(req, res, next) {
    const key = keyFn(req);

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
      if (typeof onLimited === 'function') { onLimited(req, res); return; }
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Too Many Requests — rate limit exceeded' }));
      return;
    }

    next();
  };
}

module.exports = { createRateLimiter, buildRateLimitKey };
