'use strict';

// landing.js — GET / public landing page route handler
// Serves the skills platform landing page to unauthenticated visitors.
// Redirects authenticated users (req.session.accessToken set) to /journeys.
// No Express — uses raw writeHead/end pattern.
// No external npm dependencies — HTML served from a static file.

const fs   = require('fs');
const path = require('path');

// HTML loaded once at module init from a static file.
// Path assembled from __dirname + literal segment — never from request data.
const _LANDING_HTML = fs.readFileSync(
  path.join(__dirname, '..', 'public', 'landing.html'),
  'utf8'
);

/**
 * Handle GET / — public landing page.
 *
 * Session check uses req.session.accessToken (canonical field).
 * The old-style token field is NOT checked — only accessToken is authoritative.
 *
 * @param {object} req
 * @param {object} res
 */
function handleLanding(req, res) {
  // AC2: redirect authenticated users to the journey dashboard.
  // Only req.session.accessToken signals an authenticated session.
  if (req.session && req.session.accessToken) {
    res.setHeader('Location', '/journeys');
    res.writeHead(302);
    res.end();
    return;
  }

  // AC1/AC3/AC4: serve the public landing page
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.writeHead(200);
  res.end(_LANDING_HTML);
}

module.exports = { handleLanding };
