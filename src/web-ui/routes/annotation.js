'use strict';

// annotation.js — POST /api/artefacts/:path/annotations route handler (wuce.8)
// Security constraints enforced:
//   - Authentication required (401 if no session)
//   - Server-side content sanitisation (AC4)
//   - Server-side length validation — 400 if >2000 chars (AC5)
//   - Committer identity = authenticated user token (ADR-012)
//   - Audit log on every annotation submission

const { sanitiseAnnotationContent, validateAnnotationLength } = require('../utils/annotation-utils');
const annotationWriterModule                                           = require('../adapters/annotation-writer');
const { AnnotationConflictError }                                      = annotationWriterModule;

// Audit logger — replaced via setLogger() in tests
let _logger = {
  info: (/* event, data */) => {},
  warn: (/* event, data */) => {}
};

function setLogger(logger) {
  _logger = logger;
}

/**
 * Read and JSON-parse the full request body.
 * Returns req.body if already parsed (test scenario).
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
 * POST /api/artefacts/:path/annotations
 *
 * Body: { sectionHeading: string, annotationText: string, artefactPath: string }
 *
 * 401 — no session
 * 400 — annotation >2000 chars or missing required fields
 * 200 — annotation committed
 * 409 — conflict after retry
 */
async function handlePostAnnotation(req, res) {
  const token = req.session && req.session.accessToken;
  if (!token) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorised' }));
    return;
  }

  const body = await _readBody(req);
  if (!body) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid request body' }));
    return;
  }

  const { sectionHeading, annotationText, artefactPath } = body;
  if (!sectionHeading || typeof sectionHeading !== 'string') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'sectionHeading is required' }));
    return;
  }
  if (typeof annotationText !== 'string') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'annotationText is required' }));
    return;
  }

  // AC5: server-side length validation — reject BEFORE sanitisation
  if (!validateAnnotationLength(annotationText)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Annotation exceeds 2000 character limit' }));
    return;
  }

  // AC4: server-side sanitisation — strip HTML/script before committing
  const sanitised = sanitiseAnnotationContent(annotationText);

  try {
    const result = await annotationWriterModule.commitAnnotation(artefactPath, sectionHeading, sanitised, token);

    // Audit log (NFR1) — log userId, artefactPath, sectionHeading, timestamp; NOT full text (privacy)
    const userId = req.session && req.session.user && req.session.user.login;
    _logger.info('annotation_submitted', {
      userId,
      artefactPath,
      sectionHeading,
      timestamp: new Date().toISOString()
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, commit: result }));
  } catch (err) {
    if (err instanceof AnnotationConflictError) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Conflict: the artefact was updated since you loaded it. Please reload and retry.',
        code: 'ANNOTATION_CONFLICT'
      }));
      return;
    }
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal error' }));
  }
}

module.exports = { handlePostAnnotation, setLogger };
