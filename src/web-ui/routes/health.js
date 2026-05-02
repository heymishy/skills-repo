'use strict';

// health.js — GET /health route handler
// Returns {"status":"ok"} with HTTP 200. No authentication required.
// Used by container orchestration health probes (liveness/readiness checks).

/**
 * Handle GET /health requests.
 * Returns HTTP 200 with body {"status":"ok"}.
 * Must not require an authenticated session.
 * @param {object} req
 * @param {object} res
 */
function healthCheckHandler(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok' }));
}

module.exports = { healthCheckHandler };
