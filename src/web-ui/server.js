'use strict';

// server.js — Node.js HTTP server entry point for web-ui
// Uses built-in http module — zero external npm dependencies.
// Session middleware, auth routes, and authGuard mounted here.

const http = require('http');
const { URL } = require('url');

const { sessionMiddleware }                                          = require('./middleware/session');
const { handleAuthGithub, handleAuthCallback, handleLogout, authGuard } = require('./routes/auth');
const { handleArtefactRoute }                                        = require('./routes/artefact');

const PORT = process.env.PORT || 3000;

/** Parse query parameters from a URL into a plain object. */
function parseQuery(searchParams) {
  const result = {};
  for (const [key, val] of searchParams.entries()) {
    result[key] = val;
  }
  return result;
}

/**
 * Route and handle an incoming request.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
async function router(req, res) {
  const parsed   = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsed.pathname;

  req.query = parseQuery(parsed.searchParams);

  // Attach session before routing
  sessionMiddleware(req, res);

  if (pathname === '/auth/github' && req.method === 'GET') {
    await handleAuthGithub(req, res);

  } else if (pathname === '/auth/github/callback' && req.method === 'GET') {
    await handleAuthCallback(req, res);

  } else if (pathname === '/auth/logout' && req.method === 'GET') {
    await handleLogout(req, res);

  } else if (pathname === '/dashboard') {
    authGuard(req, res, () => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html><body><h1>Dashboard</h1></body></html>');
    });

  } else if (pathname.match(/^\/artefact\/[^/]+\/[^/]+$/) && req.method === 'GET') {
    const parts        = pathname.split('/').filter(Boolean);
    const slug         = parts[1];
    const artefactType = parts[2];
    await handleArtefactRoute(req, res, slug, artefactType);

  } else if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));

  } else {
    // Sign-in page (unauthenticated root)
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<html><body><h1>Sign in with GitHub</h1><a href="/auth/github">Sign in with GitHub</a></body></html>');
  }
}

/** Create and return the HTTP server instance. */
function createApp() {
  return http.createServer((req, res) => {
    router(req, res).catch((err) => {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    });
  });
}

if (require.main === module) {
  const server = createApp();
  server.listen(PORT, () => {
    console.log(`Web UI server listening on port ${PORT}`);
  });
}

module.exports = { createApp, router };
