'use strict';

// rate-limiter.js — per-user rate limiting middleware (ADR-009)
// Enforces max sign-off requests per user per sliding window.
// In-memory store — sufficient for single-instance web-ui server.

/**
 * Create a per-user rate limiter middleware.
 *
 * @param {{ maxRequests?: number, windowMs?: number }} options
 *   maxRequests: maximum requests allowed per window (default: 10)
 *   windowMs: sliding window size in milliseconds (default: 60000 = 1 minute)
 * @returns {Function} middleware(req, res, next)
 */
function createRateLimiter({ maxRequests = 10, windowMs = 60 * 1000 } = {}) {
  // Map<userId, number[]> — userId → array of request timestamps within current window
  const _counts = new Map();

  return function rateLimiterMiddleware(req, res, next) {
    const userId = req.session && (req.session.userId || req.session.login);

    if (!userId) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorised — no session' }));
      return;
    }

    const now    = Date.now();
    const cutoff = now - windowMs;

    // Prune expired timestamps; add current request
    const timestamps = (_counts.get(userId) || []).filter(t => t > cutoff);
    timestamps.push(now);
    _counts.set(userId, timestamps);

    if (timestamps.length > maxRequests) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Too Many Requests — rate limit exceeded' }));
      return;
    }

    next();
  };
}

module.exports = { createRateLimiter };
