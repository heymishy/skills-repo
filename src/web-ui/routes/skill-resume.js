'use strict';
const { getDurableSession } = require('../../session-store');

/**
 * handleGetSessionResume — GET /api/skills/:name/sessions/:id/resume
 *
 * Returns the durable session state for the given session ID.
 * Reads from the application-layer durable store (session-store.js),
 * NOT from COPILOT_HOME. This is the 16-M1 fix anchor.
 */
async function handleGetSessionResume(req, res) {
  const session = req.session;
  if (!session || !session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  const sessionId = req.params && req.params.id;
  const userId = session.userId;

  if (!sessionId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Session ID required' }));
    return;
  }

  try {
    const durableSession = await getDurableSession(sessionId, userId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: durableSession }));
  } catch (err) {
    if (err.code === 'SESSION_EXPIRED') {
      res.writeHead(410, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Session expired — please start a new session' }));
    } else if (err.code === 'SESSION_FORBIDDEN') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden' }));
    } else if (err.code === 'SESSION_NOT_FOUND') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Session not found' }));
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
}

module.exports = { handleGetSessionResume };
