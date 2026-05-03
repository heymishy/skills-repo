'use strict';

// skill-commit.js — POST /api/skills/:name/sessions/:id/commit
// Commits the artefact produced by a completed skill session to the repository.
// Path is always derived from the skill session — client-supplied paths are ignored.

let _commitFn = null;
let _sessionRegistry = null;

function setCommitFnForTest(fn) { _commitFn = fn; }
function setSessionRegistryForTest(registry) { _sessionRegistry = registry; }

function getCommitFn() {
  return _commitFn || require('../../scm-adapter').commitArtefact;
}

function getRegistry() {
  return _sessionRegistry || require('../sessions/skill-session-registry');
}

/**
 * handlePostCommit — POST /api/skills/:name/sessions/:id/commit
 * @param {object} req
 * @param {object} res
 */
async function handlePostCommit(req, res) {
  const httpSession = req.session;
  if (!httpSession || !httpSession.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  const sessionId = req.params && req.params.id;
  const skillName = req.params && req.params.name;

  const registry = getRegistry();
  const skillSession = registry.getSession(sessionId);

  if (!skillSession || skillSession.userId !== httpSession.userId) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'SESSION_FORBIDDEN' }));
    return;
  }

  if (skillSession.state !== 'complete') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'SESSION_NOT_COMPLETE' }));
    return;
  }

  const commitFn = getCommitFn();
  try {
    // Path is always derived from the skill session — body.path is deliberately ignored
    const result = await commitFn({
      path:        skillSession.artefactPath,
      content:     skillSession.content,
      accessToken: httpSession.accessToken,
      userId:      httpSession.userId,
      sessionId:   sessionId,
      skillName:   skillName
    });
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ sha: result.sha, htmlUrl: result.htmlUrl }));
  } catch (err) {
    if (err.code === 'INVALID_PATH') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.code, message: err.message }));
      return;
    }
    if (err.code === 'ARTEFACT_CONFLICT') {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error:               err.code,
        message:             err.message,
        existingArtefactUrl: err.existingArtefactUrl || null
      }));
      return;
    }
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'COMMIT_FAILED' }));
  }
}

module.exports = { handlePostCommit, setCommitFnForTest, setSessionRegistryForTest };
