'use strict';

// public.js — GET / handler for the public landing page (lab-s1.2)
// Serves the Skills Platform landing page to unauthenticated visitors.
// Authenticated users (req.session.accessToken) are redirected to /dashboard.
// PostHog server-side event is fired fire-and-forget on each unauthenticated visit.

var fs   = require('fs');
var path = require('path');

// HTML loaded once at module init — path uses __dirname, never request data (path traversal safe).
var _LANDING_HTML = fs.readFileSync(
  path.join(__dirname, '..', 'templates', 'landing.html'),
  'utf8'
);

// Lazy getter for PostHog module — allows monkeypatching in tests without
// requiring the adapter at module load time.
function _getPosthog() {
  return require('../modules/posthog-server');
}

/**
 * Handle GET / — public landing page.
 *
 * AC3: Authenticated users (req.session.accessToken set) are redirected to /dashboard.
 * AC1: Unauthenticated visitors receive HTTP 200 with the landing page HTML.
 * AC4: A `landing_page_viewed` PostHog event is fired server-side (fire-and-forget).
 * AC6: The HTML response never contains session tokens or user identity data.
 *
 * Uses the raw http writeHead/end pattern — no Express dependency.
 *
 * @param {object} req
 * @param {object} res
 */
async function handleRoot(req, res) {
  // AC3: redirect authenticated users away from the landing page.
  // Only req.session.accessToken signals an authenticated session (canonical field).
  if (req.session && req.session.accessToken) {
    res.setHeader('Location', '/dashboard');
    res.writeHead(302);
    res.end();
    return;
  }

  // AC4: fire PostHog event — fire-and-forget (do NOT await).
  // Wrapped in try/catch so PostHog errors never affect the response.
  try {
    _getPosthog().capture('anonymous', 'landing_page_viewed');
  } catch (_) {}

  // AC1/AC6: serve static landing page HTML (no session data injected).
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.writeHead(200);
  res.end(_LANDING_HTML);
}

module.exports = { handleRoot };
