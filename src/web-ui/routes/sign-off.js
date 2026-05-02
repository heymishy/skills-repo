'use strict';

// sign-off.js — sign-off route handlers (ADR-009: separate from auth/read handlers)
// POST /sign-off — submit sign-off on an artefact
// GET /artefact/:slug/discovery — fetch artefact content (minimal read path for AC2)
//
// Security constraints enforced here:
//   - Server-side path traversal prevention (AC4)
//   - Rate limiting: 10 req/user/min (AC5/NFR)
//   - Committer identity = authenticated user OAuth token, never service account

const {
  buildSignOffPayload,
  commitSignOff,
  detectExistingSignOff,
  validateArtefactPath,
  SignOffConflictError
} = require('../adapters/sign-off-writer');

const { createRateLimiter } = require('../middleware/rate-limiter');

const _signOffRateLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60 * 1000 });

// Audit logger — replaced via setLogger() in tests and production bootstrap
let _logger = {
  info: (/* event, data */) => {},
  warn: (/* event, data */) => {}
};

/**
 * Replace the audit logger (used in tests and production startup).
 * @param {{ info: Function, warn: Function }} logger
 */
function setLogger(logger) {
  _logger = logger;
}

/**
 * Read the full request body as a JSON-parsed object.
 * Returns req.body if already parsed (test/middleware scenario).
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<object|null>}
 */
function _readBody(req) {
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(raw)); } catch (_) { resolve(null); }
    });
    req.on('error', () => resolve(null));
  });
}

/**
 * GET /artefact/:slug/discovery — fetch artefact file from GitHub Contents API.
 * Minimal read path to support AC2 (post-sign-off refresh).
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {string} slug - feature slug (URL segment between /artefact/ and /discovery)
 */
async function handleArtefactRead(req, res, slug) {
  const token   = req.session && req.session.accessToken;
  const owner   = process.env.GITHUB_REPO_OWNER;
  const repo    = process.env.GITHUB_REPO_NAME;
  const apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');

  if (!token) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorised' }));
    return;
  }

  const artefactPath = 'artefacts/' + slug + '/discovery.md';
  const getUrl = apiBase + '/repos/' + owner + '/' + repo + '/contents/' + artefactPath;

  try {
    const getRes = await fetch(getUrl, {
      headers: {
        Authorization: 'Bearer ' + token,
        Accept:        'application/vnd.github+json'
      }
    });

    if (!getRes.ok) {
      res.writeHead(getRes.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Artefact not found' }));
      return;
    }

    const fileData = await getRes.json();
    const content  = Buffer.from(fileData.content, 'base64').toString('utf8');

    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal error' }));
  }
}

/**
 * POST /sign-off — submit an attributed sign-off on a pipeline artefact.
 *
 * Rate-limited to 10 requests per user per minute.
 * Validates artefact path server-side before any GitHub API call.
 * Commits the sign-off using the authenticated user's OAuth token.
 *
 * Request body: { artefactPath: string }
 * Responses:
 *   200 — sign-off committed successfully
 *   400 — invalid artefact path (path traversal rejected)
 *   401 — unauthenticated
 *   409 — already signed off, or Contents API conflict
 *   429 — rate limit exceeded
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
async function handleSignOff(req, res) {
  // Apply rate limiter — middleware writes 429 and returns if exceeded
  let rateLimitPassed = false;
  _signOffRateLimiter(req, res, () => { rateLimitPassed = true; });
  if (!rateLimitPassed) return;

  const token = req.session && req.session.accessToken;
  if (!token) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorised' }));
    return;
  }

  const body = await _readBody(req);
  const artefactPath = body && body.artefactPath;

  // AC4: Server-side path traversal prevention — mandatory before any API call
  if (!artefactPath || !validateArtefactPath(artefactPath)) {
    _logger.warn('signoff_path_rejected', {
      userId:      req.session.userId,
      artefactPath: artefactPath || '',
      timestamp:   new Date().toISOString()
    });
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid artefact path' }));
    return;
  }

  const owner   = process.env.GITHUB_REPO_OWNER;
  const repo    = process.env.GITHUB_REPO_NAME;
  const apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');

  // Fetch current artefact content and SHA from GitHub
  const getUrl = apiBase + '/repos/' + owner + '/' + repo + '/contents/' + artefactPath;
  let fileData;
  try {
    const getRes = await fetch(getUrl, {
      headers: {
        Authorization: 'Bearer ' + token,
        Accept:        'application/vnd.github+json'
      }
    });
    if (!getRes.ok) {
      res.writeHead(getRes.status === 404 ? 404 : 502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Artefact not found or inaccessible' }));
      return;
    }
    fileData = await getRes.json();
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to fetch artefact' }));
    return;
  }

  const currentContent = Buffer.from(fileData.content, 'base64').toString('utf8');
  const currentSha     = fileData.sha;

  // AC6: Already signed off — prevent duplicate sign-off commits
  const existing = detectExistingSignOff(currentContent);
  if (existing) {
    _logger.info('signoff_duplicate_blocked', {
      userId:       req.session.userId,
      artefactPath,
      timestamp:    new Date().toISOString()
    });
    res.writeHead(409, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error:    'Already signed off',
      approver: existing.approver,
      date:     existing.date
    }));
    return;
  }

  // AC3: Committer identity comes from the user's GitHub identity fetched via token
  // (resolved inside commitSignOff — not from session or env var)
  const timestamp   = new Date().toISOString();
  const approverName = req.session.login || '';  // Used for commit message; commitSignOff re-fetches /user for committer

  const updatedContent = buildSignOffPayload(currentContent, { name: approverName || 'Unknown' }, timestamp);

  const signOffPayload = {
    content:      updatedContent,
    sha:          currentSha,
    approverName: approverName
  };

  try {
    await commitSignOff(artefactPath, signOffPayload, token);
  } catch (err) {
    if (err instanceof SignOffConflictError) {
      _logger.warn('signoff_conflict', {
        userId:      req.session.userId,
        artefactPath,
        timestamp:   new Date().toISOString()
      });
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Artefact was updated — please reload and try again' }));
      return;
    }
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Sign-off failed' }));
    return;
  }

  // NFR: Audit log — success
  _logger.info('signoff_submitted', {
    userId:      req.session.userId,
    artefactPath,
    timestamp:   new Date().toISOString()
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, message: 'Sign-off committed successfully' }));
}

module.exports = { handleSignOff, handleArtefactRead, setLogger };
