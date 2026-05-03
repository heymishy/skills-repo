'use strict';

const { extractArtefactFromEvents } = require('../../artefact-extractor');
const { sanitiseArtefactContent }   = require('../../artefact-sanitiser');

/**
 * In-memory session state store.
 * Maps sessionId → { userId, skillName, status, currentQuestion, events }
 *
 * Exported so tests can seed entries directly.
 */
const sessionStore = new Map();

/**
 * handleGetSessionState — GET /api/skills/:name/sessions/:id/state
 *
 * Returns the current state of a skill execution session.
 * Response body: { status, currentQuestion, partialArtefact, complete }
 * Raw JSONL events are never included in the response.
 */
function handleGetSessionState(req, res) {
  const session = req.session;

  // 401 — not authenticated
  if (!session || !session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  const sessionId = req.params && req.params.id;
  const entry     = sessionStore.get(sessionId);

  // 404 — unknown session
  if (!entry) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Session not found' }));
    return;
  }

  // 403 — session belongs to a different user
  if (entry.userId !== session.userId) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'SESSION_FORBIDDEN' }));
    return;
  }

  const { content, complete } = extractArtefactFromEvents(entry.events || []);
  const partialArtefact = content != null ? sanitiseArtefactContent(content) : null;

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status:          entry.status          || 'running',
    currentQuestion: entry.currentQuestion || null,
    partialArtefact,
    complete
  }));
}

module.exports = { handleGetSessionState, sessionStore };
