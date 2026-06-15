'use strict';
/**
 * skills.js — Route handlers for skill launcher endpoints (wuce.13)
 *
 * Routes:
 *   GET  /api/skills
 *   POST /api/skills/:name/sessions
 *   POST /api/skills/:name/sessions/:id/answers
 *
 * Auth: session.accessToken required (NOT_AUTHENTICATED → 401).
 * Licence: Copilot licence checked via validateLicence (NO_COPILOT_LICENCE → 403).
 * Security: path traversal blocked on skill names; answers sanitised before use.
 *
 * Handler naming convention mirrors the rest of web-ui/routes/:
 *   handleGetSkills, handlePostSession, handlePostAnswer
 */

const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');

const sessionStore = require('../../session-store');

const { listAvailableSkills, validateSkillName } = require('../../adapters/skill-discovery');
const { extractQuestions, extractSections } = require('../../skill-content-adapter');
const { sanitiseAnswer }    = require('../../answer-sanitiser');
const { validateLicence }   = require('../../adapters/copilot-licence');
const sessionManager        = require('../../modules/session-manager');
const { validateArtefactPath } = require('../../artefact-path-validator');
const { commitArtefact }       = require('../../scm-adapter');
const _journeyStore            = require('../modules/journey-store'); // ougl.4

const MAX_ANSWER_LENGTH = 1000;

// AC5 — exact message returned to client when licence is absent
const NO_LICENCE_MSG = 'No active Copilot licence found for this account. Please visit https://github.com/features/copilot to activate.';

// In-memory store for active sessions (answer accumulator).
// Key: sessionId (UUID), value: { skillName, sessionPath, questions, answers }
// Scoped to process lifetime; orphaned sessions cleaned up by session-manager on restart.
const _sessionStore = new Map();

// wsm.1 — injectable disk session writer. Default stub throws so misconfiguration is visible.
// Wire in server.js startup via setSessionStore(require('./adapters/session-store')).
var _diskSessionWriter = {
  write: function() {
    throw new Error('Adapter not wired: sessionStore. Call setSessionStore() before use.');
  },
  read: function() { return null; },
  list: function() { return []; },
  loadSessions: function() {}
};
/**
 * Replace the disk session writer adapter (for testing and production wiring).
 * @param {{ write: function, read: function, list: function, loadSessions: function }} store
 */
function setSessionStore(store) { _diskSessionWriter = store; }

// Audit logger — replaced via setLogger() in tests and production bootstrap.
// Never log answer content (ADR-009).
let _logger = {
  info:  function(evt, data) { process.stdout.write('[skills-route] ' + evt + (data ? ' ' + JSON.stringify(data) : '') + '\n'); },
  warn:  function(msg)       { process.stderr.write('[skills-route] WARN ' + msg + '\n'); },
  error: function(msg)       { process.stderr.write('[skills-route] ERROR ' + msg + '\n'); }
};

function setLogger(logger) { _logger = logger; }

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Resolve the repository root used by listAvailableSkills. */
function _getRepoPath() {
  return process.env.COPILOT_REPO_PATH || path.resolve(__dirname, '../../..');
}

/**
 * Return questions for a named skill by reading its SKILL.md.
 * Returns [] when the skill or file cannot be found.
 */
function _getQuestionsForSkill(skillName) {
  var repoPath = _getRepoPath();
  var skills   = listAvailableSkills(repoPath);
  var skill    = skills.find(function(s) { return s.name === skillName; });
  if (!skill || !skill.path) { return []; }
  var relSkillPath = path.isAbsolute(skill.path) ? skill.path : path.join(repoPath, skill.path);
  var skillMdPath  = path.join(relSkillPath, 'SKILL.md');
  var content = fs.existsSync(skillMdPath)
    ? fs.readFileSync(skillMdPath, 'utf8')
    : '';
  return extractQuestions(content);
}

/**
 * Check whether a skill name is on the discovered allowlist.
 * Rejects names containing path-traversal characters.
 * @param {string} name
 * @returns {boolean}
 */
function _isAllowedSkillName(name) {
  if (!name || /[./\\%]/.test(name)) { return false; }
  var repoPath = _getRepoPath();
  var skills   = listAvailableSkills(repoPath);
  return validateSkillName(name, skills);
}

/**
 * Read the request body as a parsed JSON object.
 * Returns req.body when already present (test / middleware scenario).
 * @param {object} req
 * @returns {Promise<object|null>}
 */
function _readBody(req) {
  if (req.body !== undefined) { return Promise.resolve(req.body); }
  return new Promise(function(resolve) {
    var raw = '';
    req.on('data', function(chunk) { raw += chunk; });
    req.on('end', function() {
      try { resolve(JSON.parse(raw)); } catch (_) { resolve(null); }
    });
    req.on('error', function() { resolve(null); });
  });
}

/**
 * Send a JSON response.
 * @param {object} res
 * @param {number} status
 * @param {object} body
 */
function _json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

// ---------------------------------------------------------------------------
// Reusable auth / licence guards (return true if request should continue)
// ---------------------------------------------------------------------------

/**
 * Validate authentication. Returns false and writes 401 when not authenticated.
 */
function _checkAuth(req, res) {
  if (!req.session || !req.session.accessToken) {
    _json(res, 401, { error: 'NOT_AUTHENTICATED' });
    return false;
  }
  return true;
}

/**
 * Validate Copilot licence. Returns false and writes 403 when licence absent.
 * @returns {Promise<boolean>}
 */
async function _checkLicence(req, res) {
  var result = await validateLicence(req.session.accessToken);
  if (!result.valid) {
    _json(res, 403, { error: 'NO_COPILOT_LICENCE', message: NO_LICENCE_MSG });
    return false;
  }
  return true;
}

/**
 * Validate skill name: path-traversal characters → 400 INVALID_SKILL_NAME.
 * Unknown skill → 400 SKILL_NOT_FOUND.
 * Returns false and writes the error response when invalid.
 */
function _checkSkillName(name, res) {
  if (!name || /[./\\%]/.test(name)) {
    _json(res, 400, { error: 'INVALID_SKILL_NAME' });
    return false;
  }
  if (!_isAllowedSkillName(name)) {
    _json(res, 400, { error: 'SKILL_NOT_FOUND' });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Route handlers (exported — wired into server.js routing block)
// ---------------------------------------------------------------------------

/**
 * GET /api/skills
 * Returns the list of available skills: [{ name, path }].
 * Requires: authenticated + valid Copilot licence.
 */
async function handleGetSkills(req, res) {
  if (!_checkAuth(req, res)) { return; }
  try {
    if (!await _checkLicence(req, res)) { return; }
    var repoPath = _getRepoPath();
    var skills   = listAvailableSkills(repoPath);
    _logger.info('skill_list_requested', { count: skills.length });
    _json(res, 200, { skills: skills });
  } catch (err) {
    _logger.error('handleGetSkills: ' + err.message);
    _json(res, 500, { error: 'Internal error' });
  }
}

/**
 * POST /api/skills/:name/sessions
 * Starts a skill session. Returns 201 with sessionId + first question.
 * Requires: authenticated + valid licence + skill name in allowlist.
 * @param {object} req - expects req.params.name
 */
async function handlePostSession(req, res) {
  if (!_checkAuth(req, res)) { return; }
  try {
    if (!await _checkLicence(req, res)) { return; }
    var name = req.params && req.params.name;
    if (!_checkSkillName(name, res)) { return; }

    var userId      = (req.session && req.session.userId) || 'anonymous';
    var sessionPath = sessionManager.createSession(userId);
    var sessionId   = path.basename(sessionPath);
    var questions   = _getQuestionsForSkill(name);

    _sessionStore.set(sessionId, {
      skillName:   name,
      sessionPath: sessionPath,
      questions:   questions,
      answers:     [],
      userId:      userId
    });

    // Do NOT include raw SKILL.md content or CLI flags in the response (AC / T3.4).
    _logger.info('session_started', { skillName: name, sessionId: sessionId });
    _json(res, 201, {
      sessionId:      sessionId,
      question:       questions.length > 0 ? questions[0] : null,
      totalQuestions: questions.length
    });
  } catch (err) {
    _logger.error('handlePostSession: ' + err.message);
    _json(res, 500, { error: 'Internal error' });
  }
}

/**
 * POST /api/skills/:name/sessions/:id/answers
 * Submits an answer for the current question. Returns next question or complete flag.
 * Answer is sanitised BEFORE storage; raw content is never forwarded or logged (T4.6).
 * @param {object} req - expects req.params.name, req.params.id, req.body.answer
 */
async function handlePostAnswer(req, res) {
  if (!_checkAuth(req, res)) { return; }
  try {
    if (!await _checkLicence(req, res)) { return; }
    var name = req.params && req.params.name;
    if (!_checkSkillName(name, res)) { return; }

    var sessionId = req.params && req.params.id;
    var body      = await _readBody(req);
    var raw       = (body && body.answer != null) ? String(body.answer) : '';

    if (raw.length > MAX_ANSWER_LENGTH) {
      _json(res, 400, { error: 'ANSWER_TOO_LONG', maxLength: MAX_ANSWER_LENGTH });
      return;
    }

    // Sanitise BEFORE any use — raw content is never forwarded or logged.
    var clean = sanitiseAnswer(raw);

    var state = _sessionStore.get(sessionId);
    if (!state) {
      _json(res, 404, { error: 'SESSION_NOT_FOUND' });
      return;
    }

    state.answers.push(clean);

    var nextIndex    = state.answers.length;
    var nextQuestion = nextIndex < state.questions.length ? state.questions[nextIndex] : null;
    var complete     = nextQuestion === null;

    // Log event only — never log the answer content itself (audit requirement T4.6).
    _logger.info('answer_recorded', { sessionId: sessionId, answerIndex: nextIndex - 1 });

    _json(res, 200, { nextQuestion: nextQuestion, complete: complete });
  } catch (err) {
    _logger.error('handlePostAnswer: ' + err.message);
    _json(res, 500, { error: 'Internal error' });
  }
}

/**
 * GET /api/skills/:name/sessions/:id/state
 * Returns current session state: status, currentQuestion, partialArtefact.
 * Requires: authenticated + session ownership.
 */
async function handleGetSessionState(req, res) {
  if (!_checkAuth(req, res)) { return; }
  try {
    var id      = req.params && req.params.id;
    var session = _sessionStore.get(id);
    if (!session) {
      _json(res, 404, { error: 'SESSION_NOT_FOUND' });
      return;
    }
    var reqUserId = req.session && req.session.userId;
    if (session.userId !== reqUserId) {
      _json(res, 403, { error: 'SESSION_FORBIDDEN' });
      return;
    }
    var answerCount      = session.answers ? session.answers.length : 0;
    var currentQuestion  = session.questions && session.questions[answerCount] || null;
    var status           = answerCount >= (session.questions ? session.questions.length : 0) ? 'complete' : 'active';
    _json(res, 200, {
      status:           status,
      currentQuestion:  currentQuestion,
      partialArtefact:  session.partialArtefact || null
    });
  } catch (err) {
    _logger.error('handleGetSessionState: ' + err.message);
    _json(res, 500, { error: 'Internal error' });
  }
}

/**
 * POST /api/skills/:name/sessions/:id/commit
 * Commits the completed session artefact to the repository.
 * Returns 201 { sha, htmlUrl } on success.
 * Returns 400 SESSION_NOT_COMPLETE if session not yet complete.
 * Returns 403 if session belongs to different user.
 * Returns 401 if not authenticated.
 * Returns 409 ARTEFACT_CONFLICT with message from AC4.
 */
async function handleCommitArtefact(req, res) {
  if (!_checkAuth(req, res)) { return; }
  try {
    var id      = req.params && req.params.id;
    var session = _sessionStore.get(id);
    if (!session) {
      _json(res, 404, { error: 'SESSION_NOT_FOUND' });
      return;
    }
    var reqUserId = req.session && req.session.userId;
    if (session.userId !== reqUserId) {
      _json(res, 403, { error: 'SESSION_FORBIDDEN' });
      return;
    }
    // Check session is complete (all questions answered)
    var isComplete = session.questions && session.answers &&
      session.answers.length >= session.questions.length;
    if (!isComplete) {
      _json(res, 400, { error: 'SESSION_NOT_COMPLETE' });
      return;
    }
    // Derive artefact path from session (not from client body — server-derived)
    var skillName    = session.skillName;
    var today        = new Date().toISOString().slice(0, 10);
    var artefactPath = 'artefacts/' + today + '-' + skillName + '/session-' + id + '-output.md';
    // Build content from answers
    var content = '# ' + skillName + ' session output\n\n' +
      session.answers.map(function(a, i) {
        return '## Q' + (i + 1) + '\n\n' + (a.answer || a) + '\n';
      }).join('\n');
    var commitMessage = 'artefact: commit /' + skillName + ' session output [' + id + ']';
    var token    = req.session.accessToken;
    var identity = { name: reqUserId || 'anonymous', email: (reqUserId || 'anonymous') + '@users.noreply.github.com' };

    try {
      var result = await commitArtefact(artefactPath, content, commitMessage, token, identity);
      _logger.info('artefact_committed', { sessionId: id, artefactPath: artefactPath });
      _json(res, 201, { sha: result.sha, htmlUrl: result.htmlUrl });
    } catch (commitErr) {
      if (commitErr.status === 409) {
        _json(res, 409, {
          error:               'ARTEFACT_CONFLICT',
          message:             'Artefact has already been committed. To overwrite, load the current version first.',
          existingArtefactUrl: commitErr.htmlUrl || null
        });
        return;
      }
      throw commitErr;
    }
  } catch (err) {
    _logger.error('handleCommitArtefact: ' + err.message);
    _json(res, 500, { error: 'Internal error' });
  }
}

/**
 * GET /api/skills/:name/sessions/:id/resume
 * Returns durable session state for resuming a session.
 * Returns 410 Gone when session is expired (SESSION_EXPIRED).
 * Returns 403 when session belongs to different user.
 * Returns 404 when session not found.
 */
async function handleResumeSession(req, res) {
  if (!_checkAuth(req, res)) { return; }
  try {
    var id      = req.params && req.params.id;
    var userId  = req.session && req.session.userId;
    var session;
    try {
      session = await sessionStore.getDurableSession(id, userId);
    } catch (err) {
      if (err.code === 'SESSION_NOT_FOUND') {
        _json(res, 404, { error: 'SESSION_NOT_FOUND' });
        return;
      }
      if (err.code === 'SESSION_FORBIDDEN') {
        _json(res, 403, { error: 'SESSION_FORBIDDEN' });
        return;
      }
      if (err.code === 'SESSION_EXPIRED') {
        _json(res, 410, { error: 'SESSION_EXPIRED', message: 'Session expired' });
        return;
      }
      throw err;
    }
    _json(res, 200, {
      sessionId:       session.sessionId,
      skillName:       session.skillName,
      questionIndex:   session.questionIndex,
      answers:         session.answers,
      partialArtefact: session.partialArtefact,
      complete:        session.complete
    });
  } catch (err) {
    _logger.error('handleResumeSession: ' + err.message);
    _json(res, 500, { error: 'Internal error' });
  }
}

// ---------------------------------------------------------------------------
// HTML route handlers — wuce.23 skill launcher landing
// ---------------------------------------------------------------------------

const { renderShell, escHtml }   = require('../utils/html-shell');
const { renderCommitPreview, renderCommitResult, renderAlreadyCommitted } = require('../views/commit-view');
const { renderChat: _renderChatView } = require('../views/chat-view');
const skillsAdapter              = require('../adapters/skills');
const { getActiveModel }         = require('../../modules/skill-turn-executor');

/**
 * Minimal markdown-to-HTML converter for model response rendering (wuce.26).
 * Handles headings, bold, italic, inline code, fenced code blocks, lists, and HRs.
 * All text content is HTML-escaped before conversion to prevent XSS from model output.
 * No external dependencies.
 * @param {string} md
 * @returns {string} safe HTML
 */
function simpleMarkdownToHtml(md) {
  var lines = String(md).split('\n');
  var out = [];
  var inCode = false;
  var inList = false;
  var listTag = 'ul';

  function inlineMarkdown(text) {
    var s = escHtml(text);
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    return s;
  }
  function closeList() {
    if (inList) { out.push('</' + listTag + '>'); inList = false; }
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (/^```/.test(line.trim())) {
      if (inCode) { out.push('</code></pre>'); inCode = false; }
      else { closeList(); out.push('<pre><code>'); inCode = true; }
      continue;
    }
    if (inCode) { out.push(escHtml(line)); continue; }
    if (inList && !/^[-*+\d]\s/.test(line) && line.trim() !== '') { closeList(); }
    if (/^---+\s*$/.test(line.trim())) { closeList(); out.push('<hr>'); continue; }
    var hm = line.match(/^(#{1,3})\s+(.+)/);
    if (hm) { closeList(); var lvl = hm[1].length; out.push('<h' + lvl + '>' + inlineMarkdown(hm[2]) + '</h' + lvl + '>'); continue; }
    var ulm = line.match(/^[-*+]\s+(.*)/);
    if (ulm) { if (!inList) { out.push('<ul>'); inList = true; listTag = 'ul'; } out.push('<li>' + inlineMarkdown(ulm[1]) + '</li>'); continue; }
    var olm = line.match(/^\d+\.\s+(.*)/);
    if (olm) { if (!inList) { out.push('<ol>'); inList = true; listTag = 'ol'; } out.push('<li>' + inlineMarkdown(olm[1]) + '</li>'); continue; }
    if (line.trim() === '') { out.push(''); continue; }
    out.push('<p>' + inlineMarkdown(line) + '</p>');
  }
  if (inList) out.push('</' + listTag + '>');
  if (inCode) out.push('</code></pre>');
  return out.join('\n');
}

// ---------------------------------------------------------------------------
// Assumption card helpers — iwu.3 (ADR-018 marker format)
// ---------------------------------------------------------------------------

/**
 * Parse a single ---ASSUMPTION-JSON: {...}--- marker from text.
 * Returns the parsed payload object, or null if no valid marker is found.
 * @param {string} text
 * @returns {{ id: string, text: string, type: string, risk: string, knowness: string }|null}
 */
function parseAssumptionMarker(text) {
  var MARKER_RE = /---ASSUMPTION-JSON:\s*(\{[\s\S]*?\})\s*---/;
  var match = String(text).match(MARKER_RE);
  if (!match) { return null; }
  try {
    return JSON.parse(match[1]);
  } catch (_) {
    return null;
  }
}

/**
 * Build an assumption card HTML fragment.
 * All payload fields are XSS-escaped. Card includes data-card-id and data-state attributes.
 * @param {{ id?: string, text?: string, type?: string, risk?: string, knowness?: string }} payload
 * @param {string} cardId — 8-char hex cardId derived from sha256(sessionId + emittedText)
 * @returns {string} HTML
 */
function buildAssumptionCardHtml(payload, cardId) {
  var safeCardId  = escHtml(String(cardId  || ''));
  var safeText    = escHtml(String(payload && payload.text     || ''));
  var safeType    = escHtml(String(payload && payload.type     || ''));
  var safeRisk    = escHtml(String(payload && payload.risk     || ''));
  var safeKnowness = escHtml(String(payload && payload.knowness || ''));
  return [
    '<div class="assumption-card" data-card-id="' + safeCardId + '" data-state="default">',
    '  <div class="assumption-card-text">' + safeText + '</div>',
    '  <div class="assumption-card-meta">',
    '    <span class="assumption-type">Type: ' + safeType + '</span>',
    '    <span class="assumption-risk">Risk: ' + safeRisk + '</span>',
    '    <span class="assumption-knowness">Knowness: ' + safeKnowness + '</span>',
    '  </div>',
    '  <div class="assumption-card-actions">',
    '    <button class="btn-confirm" type="button" aria-label="Confirm assumption">Confirm</button>',
    '    <button class="btn-flag"    type="button" aria-label="Flag assumption">Flag</button>',
    '  </div>',
    '</div>'
  ].join('\n');
}

/**
 * inc2.1: Parse a single ---CONDITION-JSON: {...}--- marker from text.
 * Validates type against allowlist; normalises source to 'model' if absent/invalid.
 * Returns parsed payload or null on any parse/validation failure.
 * @param {string} text
 * @returns {{ id: string, text: string, type: string, source: string }|null}
 */
function parseConditionMarker(text) {
  var MARKER_RE = /---CONDITION-JSON:\s*(\{[\s\S]*?\})\s*---/;
  var match = String(text).match(MARKER_RE);
  if (!match) { return null; }
  var TYPE_ALLOW   = ['constraint', 'dependency', 'outcome'];
  var SOURCE_ALLOW = ['operator', 'model'];
  try {
    var parsed = JSON.parse(match[1]);
    if (TYPE_ALLOW.indexOf(String(parsed.type || '')) === -1) { return null; }
    if (SOURCE_ALLOW.indexOf(String(parsed.source || '')) === -1) { parsed.source = 'model'; }
    return parsed;
  } catch (_) {
    return null;
  }
}

function parseCanvasBlock(text) {
  var MARKER_RE = /---CANVAS-JSON:\s*(\{[\s\S]*?\})\s*---/;
  var match = String(text).match(MARKER_RE);
  if (!match) { return null; }
  var TYPE_ALLOW = ['cluster-tree', 'table', 'text'];
  try {
    var parsed = JSON.parse(match[1]);
    if (TYPE_ALLOW.indexOf(String(parsed.type || '')) === -1) { return null; }
    return parsed;
  } catch (_) {
    return null;
  }
}

/**
 * Derive an 8-character hex cardId from sessionId + emittedText (SHA-256, first 8 hex chars).
 * @param {string} sessionId
 * @param {string} markerText — the full marker text (used for uniqueness per card)
 * @returns {string}
 */
function _deriveCardId(sessionId, markerText) {
  return crypto.createHash('sha256')
    .update(String(sessionId) + String(markerText))
    .digest('hex')
    .slice(0, 8);
}

// Injectable adapters for testing — default to production adapter functions.
let _listSkills    = skillsAdapter.listSkills;
let _createSession = skillsAdapter.createSession;

// Audit logger for HTML skill routes — injectable via setSkillsAuditLogger().
let _htmlAuditLogger = function(data) {
  process.stdout.write('[skills-html] audit ' + JSON.stringify(data) + '\n');
};

/**
 * Replace the listSkills adapter (for testing).
 * @param {function(string): Promise<Array<{name:string,description:string}>>} fn
 */
function setListSkills(fn) { _listSkills = fn; }

/**
 * Replace the createSession adapter (for testing).
 * @param {function(string, string): Promise<{id:string}>} fn
 */
function setCreateSession(fn) { _createSession = fn; }

/**
 * Replace the HTML audit logger (for testing).
 * @param {function(object): void} fn
 */
function setSkillsAuditLogger(fn) { _htmlAuditLogger = fn; }

/**
 * Render the skills list HTML using renderShell.
 * @param {Array<{name:string,description:string}>} skills
 * @param {object} user
 * @returns {string}
 */
function _renderSkillsList(skills, user) {
  const items = skills.map(function(skill) {
    const safeName = escHtml(skill.name || '');
    const safeDesc = escHtml(skill.description || '');
    return [
      '<div class="sw-card" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">',
      '  <div>',
      '    <div style="font-weight:600;font-size:15px;margin-bottom:4px">' + safeName + '</div>',
      '    <div style="font-size:13px;color:var(--muted)">' + safeDesc + '</div>',
      '  </div>',
      '  <form method="POST" action="/api/skills/' + safeName + '/sessions" style="flex-shrink:0">',
      '    <button type="submit" class="sw-btn sw-btn--primary">Start</button>',
      '  </form>',
      '</div>'
    ].join('\n');
  }).join('\n');

  const body = skills.length === 0
    ? '<div class="sw-empty"><div class="sw-empty-icon">❖</div><h1>No skills available</h1><p>No SKILL.md files were found in the repository.</p></div>'
    : '<p class="sw-section-title">Available skills</p><div style="display:flex;flex-direction:column;gap:12px">' + items + '</div>';

  return renderShell({ title: 'Run a Skill', bodyContent: body, user: user, active: 'skills' });
}

/**
 * GET /skills
 * HTML skill launcher landing page.
 * Unauthenticated → 302 /auth/github.
 * AC1, AC2, AC5, AC6 (wuce.23)
 */
async function handleGetSkillsHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  try {
    const token  = req.session.accessToken;
    const user   = { login: req.session.login || '' };
    const skills = await _listSkills(token);

    _htmlAuditLogger({
      userId:    req.session.userId,
      route:     '/skills',
      timestamp: new Date().toISOString()
    });

    const html = _renderSkillsList(skills, user);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    _logger.error('handleGetSkillsHtml: ' + err.message);
    const html = renderShell({
      title:       'Error',
      bodyContent: '<p>An error occurred loading skills.</p>',
      user:        { login: (req.session && req.session.login) || '' },
      active:      'skills'
    });
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
}

/**
 * POST /api/skills/:name/sessions (HTML form submission)
 * Creates a session via the skills adapter and redirects 303 to the session URL.
 * Unauthenticated → 302 /auth/github.
 * Adapter error → HTML error page via renderShell.
 * AC3, AC4, AC5 (wuce.23)
 */
async function handlePostSkillSessionHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  const skillName = (req.params && req.params.name) || '';
  try {
    const token   = req.session.accessToken;
    const session = await _createSession(skillName, token);
    const id      = session && session.id;
    res.writeHead(303, { Location: '/skills/' + encodeURIComponent(skillName) + '/sessions/' + encodeURIComponent(id) + '/chat' });
    res.end();
  } catch (err) {
    _logger.error('handlePostSkillSessionHtml: ' + err.message);
    const html = renderShell({
      title:       'Error',
      bodyContent: '<p>Could not start skill session: ' + escHtml(err.message) + '</p>',
      user:        { login: (req.session && req.session.login) || '' },
      active:      'skills'
    });
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
}

// ---------------------------------------------------------------------------
// HTML route handlers — wuce.24 guided question form
// ---------------------------------------------------------------------------

// wuce.24 injectable adapters
let _getNextQuestion    = skillsAdapter.getNextQuestion;
let _submitAnswer       = skillsAdapter.submitAnswer;

// Audit logger for question route — injectable via setQuestionAuditLogger().
let _questionAuditLogger = function(data) {
  process.stdout.write('[skills-html] question-audit ' + JSON.stringify(data) + '\n');
};

/**
 * Replace the getNextQuestion adapter (for testing).
 * @param {function(string, string, string): Promise<object|null>} fn
 */
function setGetNextQuestion(fn) { _getNextQuestion = fn; }

/**
 * Replace the submitAnswer adapter (for testing).
 * @param {function(string, string, string, string): Promise<{nextUrl:string}>} fn
 */
function setSubmitAnswer(fn) { _submitAnswer = fn; }

/**
 * Replace the question audit logger (for testing).
 * @param {function(object): void} fn
 */
function setQuestionAuditLogger(fn) { _questionAuditLogger = fn; }

/**
 * Read the raw body string from a request.
 * @param {object} req
 * @returns {Promise<string>}
 */
function _readRawBody(req) {
  return new Promise(function(resolve) {
    var raw = '';
    req.on('data', function(chunk) { raw += String(chunk); });
    req.on('end', function() { resolve(raw); });
    req.on('error', function() { resolve(''); });
  });
}

/**
 * Parse a URL-encoded form body string into a plain object.
 * @param {string} raw
 * @returns {object}
 */
function _parseFormBody(raw) {
  const params = {};
  if (!raw) { return params; }
  raw.split('&').forEach(function(pair) {
    var eq = pair.indexOf('=');
    if (eq === -1) { return; }
    var k = pair.slice(0, eq);
    var v = pair.slice(eq + 1);
    try {
      params[decodeURIComponent(k.replace(/\+/g, ' '))] = decodeURIComponent(v.replace(/\+/g, ' '));
    } catch (_) {
      params[k] = v;
    }
  });
  return params;
}

/**
 * GET /skills/:name/sessions/:id/next
 * Renders the question form for the current step of a skill session.
 * Unauthenticated → 302 /auth/github.
 * Unknown session (adapter throws 404) → 404 HTML error page via renderShell.
 * AC1–AC7 (wuce.24)
 */
async function handleGetQuestionHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  const skillName = (req.params && req.params.name) || '';
  const sessionId = (req.params && req.params.id)   || '';
  const token     = req.session.accessToken;
  const user      = { login: req.session.login || '' };

  let result;
  try {
    result = await _getNextQuestion(skillName, sessionId, token);
  } catch (err) {
    const status = err.status || 500;
    const html = renderShell({
      title:       status === 404 ? 'Session not found' : 'Error',
      bodyContent: '<p>' + escHtml(err.message || 'An error occurred') + '</p>',
      user,
      active: 'skills'
    });
    res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Terminal state — no more questions
  if (!result) {
    res.writeHead(303, { Location: '/skills/' + encodeURIComponent(skillName) + '/sessions/' + encodeURIComponent(sessionId) + '/commit-preview' });
    res.end();
    return;
  }

  _questionAuditLogger({
    userId:    req.session.userId,
    route:     '/skills/:name/sessions/:id/next',
    skillName: skillName,
    sessionId: sessionId,
    timestamp: new Date().toISOString()
  });

  const questionText = result.question || '';
  const qi           = result.questionIndex || 1;
  const tq           = result.totalQuestions || 1;
  const priorQA      = result.priorQA || [];

  // Render prior Q&A as a conversation transcript above the current question
  const lastModelResponse = priorQA.length > 0 ? priorQA[priorQA.length - 1].modelResponse : null;

  const modelResponseHtml = (lastModelResponse != null)
    ? '<section class="model-response" style="background:#f0f6ff;border-left:4px solid #005fcc;border-radius:0 4px 4px 0;padding:0.75rem 1rem;margin-bottom:1.25rem">' +
      '<p style="margin:0 0 0.5rem;font-size:0.85rem;color:#005fcc"><strong>Copilot insight on your last answer:</strong></p>' +
      '<div style="font-size:0.95rem">' + simpleMarkdownToHtml(lastModelResponse) + '</div>' +
      '</section>\n'
    : '';

  const priorHtml = priorQA.length > 0
    ? '<section class="prior-qa">' +
      priorQA.map(function(pair, i) {
        return '<div class="qa-pair">' +
          '<p class="qa-question"><strong>Q' + (i + 1) + ':</strong> ' + escHtml(pair.question) + '</p>' +
          '<p class="qa-answer"><strong>Your answer:</strong> ' + escHtml(pair.answer) + '</p>' +
          '</div>';
      }).join('\n') +
      '</section><hr>\n'
    : '';

  const bodyContent = [
    '<p class="question-progress">Question ' + qi + ' of ' + tq + '</p>',
    '<form method="POST" action="/api/skills/' + escHtml(skillName) + '/sessions/' + escHtml(sessionId) + '/answer">',
    '<label for="answer"><strong>' + escHtml(questionText) + '</strong></label>',
    '<textarea name="answer" id="answer" rows="4" style="width:100%;margin-top:0.5em"></textarea>',
    '<button type="submit">Submit answer</button>',
    '</form>',
    modelResponseHtml ? '<hr>' + modelResponseHtml : '',
    priorHtml
  ].join('\n');

  const html = renderShell({ title: 'Question ' + qi + ' of ' + tq, bodyContent: bodyContent, user: user, active: 'skills' });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/**
 * POST /api/skills/:name/sessions/:id/answer
 * Submits an answer and redirects 303 to the URL returned by the adapter.
 * Unauthenticated → 302 /auth/github.
 * Unknown session (adapter throws) → HTML error page via renderShell.
 * AC3, AC4, AC5 (wuce.24)
 */
async function handlePostAnswerHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  const skillName = (req.params && req.params.name) || '';
  const sessionId = (req.params && req.params.id)   || '';
  const token     = req.session.accessToken;
  const user      = { login: req.session.login || '' };

  var rawBody = '';
  try { rawBody = await _readRawBody(req); } catch (_) { rawBody = ''; }
  const formBody = _parseFormBody(rawBody);
  const answer   = formBody.answer || '';

  let result;
  try {
    result = await _submitAnswer(skillName, sessionId, answer, token);
  } catch (err) {
    const status = err.status || 500;
    const html = renderShell({
      title:       'Error',
      bodyContent: '<p>' + escHtml(err.message || 'An error occurred') + '</p>',
      user,
      active: 'skills'
    });
    res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  res.writeHead(303, { Location: result.nextUrl });
  res.end();
}

// ---------------------------------------------------------------------------
// HTML route handlers — wuce.25 session commit result
// ---------------------------------------------------------------------------

// wuce.25 injectable adapters
let _getCommitPreview = skillsAdapter.getCommitPreview;
let _commitSession    = skillsAdapter.commitSession;
let _getCommitResult  = skillsAdapter.getCommitResult;

// wuce.26 — injectable skill-turn executor (calls Copilot API per answer)
let _skillTurnExecutor = skillsAdapter.skillTurnExecutor;

/**
 * Replace the skillTurnExecutor adapter (for testing).
 * @param {function(string, Array, string, string): Promise<string>} fn
 */
function setSkillTurnExecutorAdapter(fn) { _skillTurnExecutor = fn; }

// mfc.3 — injectable streaming skill-turn executor
let _skillTurnExecutorStream = function defaultSkillTurnExecutorStream() {
  return Promise.reject(new Error('Adapter not wired: skillTurnExecutorStream. Call setSkillTurnExecutorStreamAdapter() with a real implementation before use.'));
};

/**
 * Replace the skillTurnExecutorStream adapter (for testing).
 * @param {function(string, Array, string, string, function): Promise<string>} fn
 */
function setSkillTurnExecutorStreamAdapter(fn) { _skillTurnExecutorStream = fn; }

// mfc.1 — _nextQuestionExecutor and _sectionDraftExecutor retained as no-ops for backward compat (AC9).
// They are not invoked in the model-first session flow.
let _nextQuestionExecutor = function noOpNextQuestionExecutor() { return Promise.resolve(null); };

/**
 * Backward-compat no-op setter (AC9 — mfc.1).
 * The model-first flow does not call _nextQuestionExecutor.
 * @param {function} fn
 */
function setNextQuestionExecutorAdapter(fn) { void fn; /* no-op: model-first flow */ }

// mfc.1 — _sectionDraftExecutor no-op
let _sectionDraftExecutor = function noOpSectionDraftExecutor() { return Promise.resolve(null); };

/**
 * Backward-compat no-op setter (AC9 — mfc.1).
 * @param {function} fn
 */
function setSectionDraftExecutorAdapter(fn) { _sectionDraftExecutor = fn; }

// Audit logger for commit route — injectable via setCommitAuditLogger().
let _commitAuditLogger = function(data) {
  process.stdout.write('[skills-html] commit-audit ' + JSON.stringify(data) + '\n');
};

/**
 * Replace the getCommitPreview adapter (for testing).
 * @param {function(string, string, string): Promise<object>} fn
 */
function setGetCommitPreview(fn) { _getCommitPreview = fn; }

/**
 * Replace the commitSession adapter (for testing).
 * @param {function(string, string, string): Promise<object>} fn
 */
function setCommitSession(fn) { _commitSession = fn; }

/**
 * Replace the getCommitResult adapter (for testing).
 * @param {function(string, string, string): Promise<object>} fn
 */
function setGetCommitResult(fn) { _getCommitResult = fn; }

/**
 * Replace the commit audit logger (for testing).
 * @param {function(object): void} fn
 */
function setCommitAuditLogger(fn) { _commitAuditLogger = fn; }

/**
 * GET /skills/:name/sessions/:id/commit-preview
 * Renders the artefact preview page with a commit form.
 * Unauthenticated → 302 /auth/github.
 * Unknown session (adapter throws) → HTML error page.
 * AC1, AC2, AC3 (wuce.25)
 */
async function handleGetCommitPreviewHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  const skillName = (req.params && req.params.name) || '';
  const sessionId = (req.params && req.params.id)   || '';
  const token     = req.session.accessToken;
  const user      = { login: req.session.login || '' };

  let preview;
  try {
    preview = await _getCommitPreview(skillName, sessionId, token);
  } catch (err) {
    const status = err.status || 500;
    const html = renderShell({
      title:       'Error',
      bodyContent: '<p>' + escHtml(err.message || 'An error occurred') + '</p>',
      user
    });
    res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  const bodyContent = renderCommitPreview({
    artefactPath:      preview.artefactPath    || '',
    artefactContent:   preview.artefactContent || '',
    commitFormAction:  '/api/skills/' + encodeURIComponent(skillName) + '/sessions/' + encodeURIComponent(sessionId) + '/commit',
    branchName:        preview.branchName      || 'main',
    defaultMessage:    preview.defaultMessage  || ('feat: ' + (preview.artefactPath || 'artefact')),
    reviewers:         preview.reviewers       || []
  });

  const html = renderShell({ title: 'Commit preview', bodyContent, user, active: 'skills' });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/**
 * POST /api/skills/:name/sessions/:id/commit
 * Commits the session artefact. Redirects 303 to the result page on success.
 * Double-commit (409) → 409 HTML page via renderShell.
 * Unauthenticated → 302 /auth/github.
 * Unknown session → HTML error page.
 * AC4, AC5, AC6, AC7 (wuce.25)
 */
async function handlePostCommitHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  const skillName = (req.params && req.params.name) || '';
  const sessionId = (req.params && req.params.id)   || '';
  const token     = req.session.accessToken;
  const user      = { login: req.session.login || '' };

  let result;
  try {
    result = await _commitSession(skillName, sessionId, token, user.login);
  } catch (err) {
    const status = err.status || 500;
    const is409 = (status === 409);
    const bodyContent = is409
      ? renderAlreadyCommitted({ artefactUrl: null })
      : '<p>' + escHtml(err.message || 'An error occurred') + '</p>';
    const html = renderShell({
      title:       is409 ? 'Already committed' : 'Error',
      bodyContent,
      user,
      active: 'skills'
    });
    res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  _commitAuditLogger({
    userId:       req.session.userId,
    route:        '/api/skills/' + skillName + '/sessions/' + sessionId + '/commit',
    skillName:    skillName,
    sessionId:    sessionId,
    artefactPath: result.artefactPath,
    timestamp:    new Date().toISOString()
  });

  res.writeHead(303, { Location: '/skills/' + encodeURIComponent(skillName) + '/sessions/' + encodeURIComponent(sessionId) + '/result' });
  res.end();
}

/**
 * GET /skills/:name/sessions/:id/result
 * Renders the commit result page with success message, artefact path, and links.
 * Unauthenticated → 302 /auth/github.
 * Unknown session (adapter throws) → HTML error page.
 * AC6 (wuce.25)
 */
async function handleGetResultHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  const skillName = (req.params && req.params.name) || '';
  const sessionId = (req.params && req.params.id)   || '';
  const token     = req.session.accessToken;
  const user      = { login: req.session.login || '' };

  let result;
  try {
    result = await _getCommitResult(skillName, sessionId, token);
  } catch (err) {
    const status = err.status || 500;
    const html = renderShell({
      title:       'Error',
      bodyContent: '<p>' + escHtml(err.message || 'An error occurred') + '</p>',
      user
    });
    res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  const bodyContent = renderCommitResult({
    artefactPath: result.artefactPath || '',
    featureSlug:  result.featureSlug  || '',
    artefactType: result.artefactType || '',
    prUrl:        result.prUrl        || null,
    nextSkillName: result.nextSkillName || null,
    nextSkillLabel: result.nextSkillLabel || null
  });

  const html = renderShell({ title: 'Commit complete', bodyContent, user, active: 'skills' });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

// ---------------------------------------------------------------------------
// HTML-flow session helpers — model-first chat architecture (mfc.1)
// ---------------------------------------------------------------------------

/**
 * Build the system prompt for a skill session.
 * Loads copilot-instructions.md + SKILL.md + product context + reference materials
 * + web UI protocol section (instructs model to output ---ARTEFACT-START--- markers).
 *
 * @param {string}  skillName   — skill directory name under .github/skills/
 * @param {string}  sessionPath — absolute session path (used to locate reference/ folder)
 * @param {string}  [repoRoot]  — override repo root (defaults to _getRepoPath(); pass process.cwd() in tests)
 * @returns {string}
 */
function buildSystemPrompt(skillName, sessionPath, repoRoot, priorArtefacts, sessionContext, _outContextFiles) {
  var root = repoRoot || _getRepoPath();
  var ctx = sessionContext || {};
  var parts = [];
  var _cf = _outContextFiles || null;

  // 1. copilot-instructions.md
  var ciPath = path.join(root, '.github', 'copilot-instructions.md');
  if (fs.existsSync(ciPath)) {
    parts.push(fs.readFileSync(ciPath, 'utf8'));
    if (_cf) _cf.push({ path: '.github/copilot-instructions.md', status: 'ok' });
  }

  // 2. SKILL.md
  var skillMdPath = path.join(root, '.github', 'skills', skillName, 'SKILL.md');
  if (fs.existsSync(skillMdPath)) {
    parts.push('--- SKILL: ' + skillName + ' ---\n\n' + fs.readFileSync(skillMdPath, 'utf8'));
    if (_cf) _cf.push({ path: '.github/skills/' + skillName + '/SKILL.md', status: 'ok' });
  } else {
    if (_cf) _cf.push({ path: '.github/skills/' + skillName + '/SKILL.md', status: 'warn' });
  }

  // 3. Product context files
  var PRODUCT_FILES = [
    { name: 'mission.md',      label: 'PRODUCT MISSION' },
    { name: 'tech-stack.md',   label: 'TECH STACK' },
    { name: 'constraints.md',  label: 'CONSTRAINTS' },
    { name: 'roadmap.md',      label: 'PRODUCT ROADMAP' }
  ];
  PRODUCT_FILES.forEach(function(pf) {
    var pfPath = path.join(root, 'product', pf.name);
    if (fs.existsSync(pfPath)) {
      parts.push('--- ' + pf.label + ' ---\n\n' + fs.readFileSync(pfPath, 'utf8'));
      if (_cf) _cf.push({ path: 'product/' + pf.name, status: 'ok' });
    }
  });

  // 4. Reference materials from artefacts/[feature-slug]/reference/ (if present)
  if (sessionPath) {
    var artefactsRoot = path.join(root, 'artefacts');
    var sessionDir = path.dirname(sessionPath);
    var featureDir = path.dirname(sessionDir);
    if (featureDir.startsWith(artefactsRoot)) {
      var refDir = path.join(featureDir, 'reference');
      if (fs.existsSync(refDir)) {
        fs.readdirSync(refDir).filter(function(f) { return f.endsWith('.md'); }).forEach(function(rf) {
          parts.push('--- REFERENCE: ' + rf + ' ---\n\n' + fs.readFileSync(path.join(refDir, rf), 'utf8'));
        });
      }
    }
  }

  // 4.5. Handoff context — prior artefacts from earlier stages
  if (priorArtefacts && priorArtefacts.length > 0) {
    var handoffParts = ['--- HANDOFF CONTEXT ---'];
    priorArtefacts.forEach(function(pa) {
      handoffParts.push('--- PRIOR ARTEFACT: ' + pa.path + ' ---');
      handoffParts.push(pa.content);
      handoffParts.push('--- END PRIOR ARTEFACT ---');
    });
    handoffParts.push('--- END HANDOFF CONTEXT ---');
    parts.push(handoffParts.join('\n'));
  }

  // 5. Pipeline context files (wucp.1)
  var PIPELINE_CONTEXT_FILES = [
    { rel: 'pipeline-state.json',              label: 'pipeline-state.json' },
    { rel: 'workspace/state.json',             label: 'workspace/state.json' },
    { rel: 'context.yml',                      label: 'context.yml' }
  ];
  PIPELINE_CONTEXT_FILES.forEach(function(pf) {
    try {
      var pfPath = path.join(root, pf.rel);
      if (fs.existsSync(pfPath)) {
        parts.push('--- ' + pf.label + ' ---\n\n' + fs.readFileSync(pfPath, 'utf8'));
      }
    } catch (_) {}
  });

  // 5a. workspace/learnings.md — first 50 lines only
  try {
    var learningsPath = path.join(root, 'workspace', 'learnings.md');
    if (fs.existsSync(learningsPath)) {
      var allLines = fs.readFileSync(learningsPath, 'utf8').split('\n');
      var firstFifty = allLines.slice(0, 50).join('\n');
      parts.push('--- workspace/learnings.md ---\n\n' + firstFifty);
    }
  } catch (_) {}

  // 5b. fleet-state.json — conditional
  try {
    var fleetPath = path.join(root, 'fleet-state.json');
    if (fs.existsSync(fleetPath)) {
      parts.push('--- fleet-state.json ---\n\n' + fs.readFileSync(fleetPath, 'utf8'));
    }
  } catch (_) {}

  // 5c. artefact-coverage-exemptions.json — conditional
  try {
    var exemptPath = path.join(root, 'artefact-coverage-exemptions.json');
    if (fs.existsSync(exemptPath)) {
      parts.push('--- artefact-coverage-exemptions.json ---\n\n' + fs.readFileSync(exemptPath, 'utf8'));
    }
  } catch (_) {}

  // 5d. Artefact listing for activeFeatureSlug — filenames only
  if (ctx.activeFeatureSlug) {
    try {
      var featureArtefactsDir = path.join(root, 'artefacts', ctx.activeFeatureSlug);
      if (fs.existsSync(featureArtefactsDir)) {
        var fileList = fs.readdirSync(featureArtefactsDir);
        parts.push('--- Artefact listing: artefacts/' + ctx.activeFeatureSlug + '/ ---\n\n' + fileList.join('\n'));
      }
    } catch (_) {}
  }

  // 6. Web UI protocol — instructs the model how to operate and when/how to output the artefact
  parts.push([
    '--- WEB UI PROTOCOL ---',
    '',
    'You are running as a web UI assistant for a structured skill session.',
    'Read the SKILL.md instructions above and follow them to run the session.',
    '',
    'OPENING TURN: When the session begins, greet the operator with one short welcoming sentence and ask exactly ONE opening question. Do not list multiple questions. Do not number questions. Do not use headers or bullet lists in your opening.',
    '',
    'ONE QUESTION AT A TIME: Ask one question at a time. Wait for the answer before asking the next.',
    '',
    'RICH INPUT HANDLING: When the operator provides a detailed first answer, follow this exact process:',
    '1. Scan every prior user message for coverage of each standard discovery topic: problem/opportunity, audience/users/roles, current pain points, consequences of inaction, existing alternatives, and desired outcome.',
    '2. Mark a topic as COVERED if the user mentioned it at all — even briefly, even partially. A brief mention counts. "audience is X, Y, Z" = audience covered. "pain is ABC" = pain covered.',
    '3. Summarise the covered points back in 2–3 sentences.',
    '4. Identify the FIRST topic that is genuinely ABSENT from all prior messages — not thin, absent — and ask ONE question about it.',
    '5. NEVER re-ask about a COVERED topic. If the user named roles, do not ask "who would benefit?". If they described pain, do not ask them to describe pain again. Treat any mention as sufficient and move on.',
    '',
    'ARTEFACT GENERATION: When you have gathered all required information, produce the complete artefact immediately in that same response. Do NOT send a holding message such as "I\'ll now compile this", "One moment", "Let me prepare that", or any similar phrase without also including the full artefact in the same response. There is no second turn — the artefact must appear in the response where you decide you have enough information. If you are ready to write it, write it now.',
    '',
    'Output the complete artefact using these exact markers:',
    '',
    '---ARTEFACT-START---',
    '[full artefact content here, in markdown]',
    '---ARTEFACT-END---',
    '---SLUG---',
    'YYYY-MM-DD-descriptive-feature-slug',
    '',
    'The slug must be a lowercase, hyphenated date-prefixed identifier describing the artefact.',
    'Do not output these markers until you are ready to produce the final artefact.'
  ].join('\n'));

  // 6a. Skill-specific protocol additions
  if (skillName === 'ideate') {
    parts.push([
      '--- ASSUMPTION CARD PROTOCOL (ideate) ---',
      '',
      'CRITICAL — emit assumption card markers throughout the session, not only in Lens B.',
      '',
      'Whenever you name, confirm, or surface an assumption — in any lens, at any point — emit an inline machine-readable marker immediately after the assumption text in your response. Use EXACTLY this format on its own line (no extra spaces, no line breaks inside the JSON):',
      '',
      '---ASSUMPTION-JSON: {"id":"<kebab-slug>","text":"<assumption as a plain declarative sentence>","type":"<desirability|viability|feasibility|ethical>","risk":"<high|medium|low>","knowness":"<known-unknown|unknown-unknown>"}---',
      '',
      'Emit one marker per named assumption — never batch. Apply to:',
      '- Risks you surface in Lens D (Q9 and throughout)',
      '- Planning assumptions you identify in Lens A (especially in the opportunity map)',
      '- Any assumption the user explicitly names or confirms',
      '- Any assumption you name in a summary, table, or prioritisation',
      '',
      'Example — when you write "Data quality risk: exports from HRIS/finance/PM tools are inconsistent", immediately follow with:',
      '---ASSUMPTION-JSON: {"id":"data-quality-import","text":"Source data exports from HRIS, finance, and PM tools will be consistent enough to import without extensive manual cleaning.","type":"feasibility","risk":"high","knowness":"known-unknown"}---',
      '',
      'Do not skip this — the right panel of the web UI is populated by these markers in real time.'
    ].join('\n'));
  }

  return parts.join('\n\n');
}

/**
 * Create a session in _sessionStore for the model-first HTML chat flow (mfc.1).
 * Stores systemPrompt (built from SKILL.md + product context + protocol) and
 * an empty turns array. The old questions/answers/sections fields are removed.
 *
 * @param {string} sessionId
 * @param {string} sessionPath  — absolute path returned by sessionManager.createSession
 * @param {string} skillName
 */
function registerHtmlSession(sessionId, sessionPath, skillName) {
  var contextFiles = [];
  var systemPrompt = buildSystemPrompt(skillName, sessionPath, undefined, undefined, undefined, contextFiles);
  _sessionStore.set(sessionId, {
    skillName:              skillName,
    sessionPath:            sessionPath,
    systemPrompt:           systemPrompt,
    contextFiles:           contextFiles,
    turns:                  [],
    artefactContent:        null,
    artefactPath:           null,
    done:                   false,
    journeyId:              null,
    // iwu.6 — assumption cards enabled by default for all sessions
    assumptionCardsEnabled: true
  });
}

/**
 * Link an existing HTML session to a journey.
 * @param {string} sessionId
 * @param {string} journeyId
 */
function linkSessionToJourney(sessionId, journeyId) {
  var session = _sessionStore.get(sessionId);
  if (!session) return;
  session.journeyId = journeyId;
}

/**
 * Expose a session entry for test inspection.
 * @param {string} sessionId
 * @returns {object|undefined}
 */
function _getHtmlSession(sessionId) {
  return _sessionStore.get(sessionId);
}

/**
 * Directly set a session entry (test helper — bypasses buildSystemPrompt file I/O).
 * @param {string} sessionId
 * @param {object} data
 */
function _setHtmlSession(sessionId, data) {
  _sessionStore.set(sessionId, data);
}

/**
 * List all entries in the session store — used by pmf.3 orientation wizard Step 3.
 * @returns {Array<{sessionId: string, session: object}>}
 */
function _listHtmlSessions() {
  var result = [];
  _sessionStore.forEach(function(session, id) {
    result.push({ sessionId: id, session: session });
  });
  return result;
}

/**
 * Process one user turn in the model-first chat flow.
 * Appends user turn, calls _skillTurnExecutor once, parses artefact signal, appends assistant turn.
 *
 * @param {string} skillName
 * @param {string} sessionId
 * @param {string} rawAnswer
 * @param {string} [token]
 * @returns {Promise<{done:boolean, response:string, artefactContent?:string}|null>}
 */
async function htmlSubmitTurn(skillName, sessionId, rawAnswer, token) {
  var session = _sessionStore.get(sessionId);
  if (!session) { return null; }

  var userContent = sanitiseAnswer(rawAnswer);
  // Snapshot history BEFORE appending the new user turn (so executor receives it as history)
  var historySnapshot = session.turns.slice();
  session.turns.push({ role: 'user', content: userContent });

  var response = '';
  try {
    response = await _skillTurnExecutor(
      session.systemPrompt,
      historySnapshot,
      userContent,
      token || ''
    );
  } catch (err) {
    _logger.warn('htmlSubmitTurn executor error: ' + (err && err.message ? err.message : 'unknown'));
    response = '';
  }

  var artefactMatch = response.match(/---ARTEFACT-START---\s*([\s\S]+?)\s*---ARTEFACT-END---/);
  var slugMatch     = response.match(/---SLUG---\s*\n?([\w-]+)/);

  if (artefactMatch) {
    session.artefactContent = artefactMatch[1].trim();
    var slug = slugMatch ? slugMatch[1].trim() : new Date().toISOString().slice(0, 10) + '-' + skillName;
    session.artefactPath = 'artefacts/' + slug + '/' + session.skillName + '.md';
    session.done = true;
  }

  session.turns.push({ role: 'assistant', content: response });

  // wsm.1: persist session to disk after mutation (non-fatal — write failure must not break the turn)
  try {
    _diskSessionWriter.write(sessionId, session);
  } catch (writeErr) {
    console.error(JSON.stringify({
      event: 'session_write_error',
      sessionId: sessionId,
      error: writeErr && writeErr.message ? writeErr.message : String(writeErr)
    }));
  }

  if (session.done) {
    return { done: true, response: response, artefactContent: session.artefactContent };
  }
  return { done: false, response: response };
}

/**
 * Build the #context-manifest section HTML for the /ideate session shell.
 * @param {Array<{path:string,status:string}|string>} files
 * @returns {string}
 */
function buildContextManifestHtml(files) {
  var items = (files || []).map(function(f) {
    var p = (typeof f === 'string') ? f : f.path;
    var status = (typeof f === 'string') ? 'ok' : (f.status || 'ok');
    var basename = path.basename(p);
    var safeBasename = escHtml(basename);
    if (status === 'warn') {
      return '<span class="chip-warn" aria-label="' + safeBasename + ' \u2014 missing">' +
        safeBasename + ' <span aria-hidden="true" style="font-size:11px">\u26a0</span>' +
        ' <span style="font-size:10px">missing</span></span>';
    }
    return '<span class="chip-ok" aria-label="' + safeBasename + ' \u2014 loaded">' +
      safeBasename + ' <span aria-hidden="true" style="font-size:11px">\u2713</span>' +
      ' <span style="font-size:10px">loaded</span></span>';
  });
  var inner = items.length > 0
    ? items.join('\n  ')
    : '<span id="context-manifest-empty" style="font-size:12px;color:var(--muted)">no context loaded</span>';
  return '<div id="context-manifest" role="region" aria-label="Loaded context files"' +
    ' style="padding:6px 16px;border-bottom:1px solid var(--line);display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:var(--bg)">' +
    '\n  ' + inner + '\n</div>';
}

/**
 * Render the single-page chat UI HTML.
 * @param {string} skillName
 * @param {string} sessionId
 * @param {object} session
 * @returns {string}
 */
function _renderChatPage(skillName, sessionId, session) {
  var encodedSkill = encodeURIComponent(skillName);
  var encodedId    = encodeURIComponent(sessionId);
  var turnUrl      = '/api/skills/' + encodedSkill + '/sessions/' + encodedId + '/turn';

  // Build priorQA pairs from the turns array (mfc.1 structure).
  // Each pair: one assistant turn followed by one user turn.
  var turns = session.turns || [];
  var priorQA = [];
  var currentQuestion = '';

  for (var i = 0; i < turns.length; i++) {
    var t = turns[i];
    if (t.role === 'assistant') {
      var nextTurn = turns[i + 1];
      if (nextTurn && nextTurn.role === 'user') {
        priorQA.push({ question: t.content, answer: nextTurn.content, modelResponse: '' });
        i++; // skip the user turn we just consumed
      } else {
        // Last assistant turn not yet answered — this is the current question
        currentQuestion = t.content;
      }
    } else if (t.role === 'user') {
      // User turn without a preceding assistant turn — render answer with empty question
      priorQA.push({ question: '', answer: t.content, modelResponse: '' });
    }
  }

  // Build draft sections from artefactContent if session is done
  var draftSections = [];
  if (session.done && session.artefactContent) {
    draftSections = [{ title: 'Artefact', body: session.artefactContent, state: 'drafted' }];
  }

  var commitUrl = '/skills/' + encodedSkill + '/sessions/' + encodedId + '/commit-preview';

  // Inline script — DOM-update chat (no page reload).
  // Messages are appended directly; draft panel updates live when artefact arrives.
  var script = [
    '<script>',
    '(function(){',
    '  var form    = document.getElementById("chat-form");',
    '  var thread  = document.getElementById("chat-messages");',
    '  if(!form || !thread) return;',
    '  var TURN_URL   = "' + escHtml(turnUrl) + '";',
    '  var STREAM_URL = TURN_URL + "-stream";',
    '  var COMMIT_URL = "' + escHtml(commitUrl) + '";',
    '  var submitBtn  = form.querySelector("button[type=\'submit\']");',
    '',
    '  function scrollToBottom() {',
    '    thread.scrollTop = thread.scrollHeight;',
    '  }',
    '  // Scroll to bottom on initial load so latest message is visible.',
    '  scrollToBottom();',
    '',
    '  function escHtmlClient(s) {',
    '    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");',
    '  }',
    '  function lightMd(text) {',
    '    var s = escHtmlClient(text);',
    '    s = s.replace(/\\*\\*(.+?)\\*\\*/g,"<strong>$1</strong>");',
    '    s = s.replace(/(^|[^*])\\*([^*]+?)\\*/g,"$1<em>$2</em>");',
    '    s = s.replace(/`([^`]+)`/g,"<code>$1</code>");',
    '    return s.replace(/\\n/g,"<br>");',
    '  }',
    '',
    '  function appendBubble(role, html) {',
    '    var d = document.createElement("div");',
    '    if(role === "user") {',
    '      d.className = "sw-chat-msg msg--user";',
    '      d.innerHTML = \'<div class="sw-avatar">M</div><div class="sw-chat-body"><div class="sw-chat-from">You</div><div class="sw-chat-text">\' + html + \'</div></div>\';',
    '    } else {',
    '      d.className = "sw-chat-msg sw-chat-msg--assistant msg--assistant";',
    '      d.innerHTML = \'<div class="sw-avatar sw-avatar--assistant">\u2736</div><div class="sw-chat-body"><div class="sw-chat-from">Skill</div><div class="sw-chat-text">\' + html + \'</div></div>\';',
    '    }',
    '    thread.appendChild(d);',
    '    scrollToBottom();',
    '    return d;',
    '  }',
    '',
    '  function stripArtefactBlock(text) {',
    '    var s = text.replace(/---ARTEFACT-START---[\\s\\S]*?---ARTEFACT-END---/g, "");',
    '    s = s.replace(/---SLUG---[\\s\\S]*?\\n---\\n?/g, "");',
    '    s = s.replace(/\\n{3,}/g, "\\n\\n").trim();',
    '    return s;',
    '  }',
    '',
    '  function updateDraftPanel(artefactContent) {',
    '    var panel = document.getElementById("draft-content");',
    '    if(!panel) return;',
    '    panel.innerHTML = \'<div style="font-size:12px;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.4px;font-weight:500">Draft</div>\'',
    '      + \'<div class="sw-draft-section"><div class="sw-draft-head"><h2>Artefact</h2></div>\'',
    '      + \'<div class="sw-draft-body" style="white-space:pre-wrap;font-family:var(--mono);font-size:13px">\' + escHtmlClient(artefactContent) + \'</div></div>\';',
    '  }',
    '',
    '  function showCommitLink() {',
    '    var foot = form.closest(".sw-chat-pane") && form.closest(".sw-chat-pane").querySelector(".sw-chat-foot");',
    '    if(!foot) return;',
    '    var link = document.createElement("div");',
    '    link.style.cssText = "padding:10px 12px 2px";',
    '    link.innerHTML = \'<a href="\' + COMMIT_URL + \'" style="display:inline-block;font-size:14px;font-weight:600;color:#fff;background:var(--ink);padding:8px 18px;border-radius:6px;text-decoration:none">Review &amp; save artefact \u2192</a>\';',
    '    foot.appendChild(link);',
    '  }',
    '',
    '  function sendTurn(answer) {',
    '    if(submitBtn) submitBtn.disabled = true;',
    '    var thinkingDiv = appendBubble("assistant", \'<span class="sw-thinking"><span class="sw-dot"></span><span class="sw-dot"></span><span class="sw-dot"></span></span>\');',
    '    var streamText   = "";',
    '    var streamDiv   = null;',
    '    var partialDraft = "";',
    '    fetch(STREAM_URL, {',
    '      method: "POST",',
    '      headers: {"Content-Type": "application/json"},',
    '      body: JSON.stringify({answer: answer})',
    '    }).then(function(r) {',
    '      if(!r.ok || !r.body) throw new Error("Stream failed");',
    '      streamDiv = appendBubble("assistant", "");',
    '      var textNode = streamDiv.querySelector(".sw-chat-text");',
    '      var reader   = r.body.getReader();',
    '      var decoder  = new TextDecoder();',
    '      var buf      = "";',
    '      function pump() {',
    '        return reader.read().then(function(result) {',
    '          if(result.done) return;',
    '          buf += decoder.decode(result.value, {stream: true});',
    '          var lines = buf.split("\\n");',
    '          buf = lines.pop();',
    '          lines.forEach(function(line) {',
    '            if(!line.startsWith("data: ")) return;',
    '            var payload = line.slice(6).trim();',
    '            try {',
    '              var evt = JSON.parse(payload);',
    '              if(evt.chunk) {',
    '                if(thinkingDiv) { thinkingDiv.remove(); thinkingDiv = null; }',
    '                streamText += evt.chunk;',
    '                if(textNode) textNode.innerHTML = lightMd(stripArtefactBlock(streamText));',
    '                scrollToBottom();',
    '              }',
    '              if(evt.draftChunk) {',
    '                partialDraft += evt.draftChunk;',
    '                updateDraftPanel(partialDraft);',
    '              }',
    '              if(evt.assumptionCard) {',
    '                appendAssumptionCard(evt.assumptionCard);',
    '              }',
    '              if(evt.conditionItem) {',
    '                appendConditionItem(evt.conditionItem);',
    '              }',
    '              if(evt.done !== undefined) {',
    '                if(evt.artefactContent) { partialDraft = ""; updateDraftPanel(evt.artefactContent); }',
    '                if(evt.done) {',
    '                  showCommitLink();',
    '                } else if(streamText && streamText.indexOf("?") === -1) {',
    '                  setTimeout(function(){ sendTurn("continue"); }, 800);',
    '                } else {',
    '                  if(submitBtn) submitBtn.disabled = false;',
    '                }',
    '              }',
    '              if(evt.lensComplete) {',
    '                handleLensComplete();',
    '              }',
    '              if(evt.error) {',
    '                if(textNode) textNode.innerHTML = \'<em style="color:var(--error,red)">\' + evt.error + \'</em>\';',
    '                if(submitBtn) submitBtn.disabled = false;',
    '              }',
    '            } catch(_) {}',
    '          });',
    '          return pump();',
    '        });',
    '      }',
    '      return pump();',
    '    }).catch(function(){',
    '      if(thinkingDiv) thinkingDiv.remove();',
    '      appendBubble("assistant", \'<em style="color:var(--error,red)">Error — please try again.</em>\');',
    '      if(submitBtn) submitBtn.disabled = false;',
    '    });',
    '  }',
    '',
    '  // iwu.4 — assumption card confirm/flag',
    '  var SKILL_NAME_ENC = "' + encodeURIComponent(skillName) + '";',
    '  var SESSION_ID_ENC = "' + encodeURIComponent(sessionId) + '";',
    '  function assumptionConfirmUrl(cardId) {',
    '    return "/api/skills/" + SKILL_NAME_ENC + "/sessions/" + SESSION_ID_ENC + "/assumption/" + encodeURIComponent(cardId) + "/confirm";',
    '  }',
    '  function attachCardHandlers(cardEl) {',
    '    var confirmBtn = cardEl.querySelector(".btn-confirm");',
    '    var flagBtn    = cardEl.querySelector(".btn-flag");',
    '    function doAction(action) {',
    '      var cardId = cardEl.getAttribute("data-card-id");',
    '      fetch(assumptionConfirmUrl(cardId), {',
    '        method: "POST",',
    '        headers: {"Content-Type": "application/json"},',
    '        body: JSON.stringify({action: action})',
    '      }).then(function(r) {',
    '        if(!r.ok) throw new Error("Request failed: " + r.status);',
    '        return r.json();',
    '      }).then(function(data) {',
    '        cardEl.setAttribute("data-state", data.state);',
    '        if(confirmBtn) {',
    '          confirmBtn.setAttribute("aria-label", data.state === "confirmed" ? "Confirmed" : "Confirm assumption");',
    '          confirmBtn.className = data.state === "confirmed" ? "btn-confirm btn-confirmed-state" : "btn-confirm";',
    '        }',
    '        if(flagBtn) {',
    '          flagBtn.setAttribute("aria-label", data.state === "flagged" ? "Flagged" : "Flag assumption");',
    '          flagBtn.className = data.state === "flagged" ? "btn-flag btn-flagged-state" : "btn-flag";',
    '        }',
    '        updateAssumptionBadges();',
    '        var existingErr = cardEl.querySelector(".card-error");',
    '        if(existingErr) existingErr.remove();',
    '      }).catch(function(err) {',
    '        var existingErr = cardEl.querySelector(".card-error");',
    '        if(existingErr) existingErr.remove();',
    '        var errDiv = document.createElement("div");',
    '        errDiv.className = "card-error";',
    '        errDiv.style.cssText = "font-size:12px;color:var(--error,red);margin-top:4px";',
    '        errDiv.textContent = "Could not update — please try again.";',
    '        cardEl.appendChild(errDiv);',
    '      });',
    '    }',
    '    if(confirmBtn) confirmBtn.addEventListener("click", function(){ doAction("confirm"); });',
    '    if(flagBtn)    flagBtn.addEventListener("click",    function(){ doAction("flag"); });',
    '  }',
    '  function updateAssumptionBadges() {',
    '    var cards = document.querySelectorAll("#assumption-cards .assumption-card");',
    '    var unconf = 0; var conf = 0;',
    '    for(var i=0;i<cards.length;i++) {',
    '      var st = cards[i].getAttribute("data-state");',
    '      if(st === "confirmed") conf++; else unconf++;',
    '    }',
    '    var bU = document.getElementById("ac-badge-unconf");',
    '    var bC = document.getElementById("ac-badge-conf");',
    '    if(bU) { bU.textContent = unconf + " unconfirmed"; bU.style.display = unconf > 0 ? "" : "none"; }',
    '    if(bC) { bC.textContent = conf + " confirmed";    bC.style.display = conf > 0 ? "" : "none"; }',
    '  }',
    '  function appendAssumptionCard(card) {',
    '    var container = document.getElementById("assumption-cards");',
    '    if(!container) return;',
    '    var placeholder = container.querySelector("p");',
    '    if(placeholder) placeholder.remove();',
    '    var cardEl = document.createElement("div");',
    '    cardEl.className = "assumption-card";',
    '    cardEl.setAttribute("data-card-id", card.cardId || "");',
    '    cardEl.setAttribute("data-state", "default");',
    '    var typeKey = (card.type || "").toLowerCase().replace(/[^a-z]/g,"");',
    '    var typeClass = ["desirability","viability","feasibility","ethical"].indexOf(typeKey) >= 0 ? typeKey : "ethical";',
    '    var riskKey   = (card.risk || "").toLowerCase().replace(/[^a-z]/g,"");',
    '    var riskClass = riskKey === "high" ? "high" : riskKey === "medium" ? "medium" : "low";',
    '    cardEl.innerHTML =',
    '      \'<div class="assumption-card-meta">\' +',
    '        \'<span class="ac-type-tag ac-type-\' + typeClass + \'">\' + escHtmlClient(card.type || "unknown") + \'</span>\' +',
    '        \'<span class="ac-risk-dot ac-risk-\' + riskClass + \'" title="Risk: \' + escHtmlClient(card.risk || "") + \'"></span>\' +',
    '      \'</div>\' +',
    '      \'<div class="assumption-card-text">\' + escHtmlClient(card.text || "") + \'</div>\' +',
    '      \'<div class="assumption-card-actions">\' +',
    '        \'<button class="btn-confirm" type="button" aria-label="Confirm assumption">Confirm</button> \' +',
    '        \'<button class="btn-flag"    type="button" aria-label="Flag assumption">Flag</button>\' +',
    '      \'</div>\';',
    '    attachCardHandlers(cardEl);',
    '    container.appendChild(cardEl);',
    '    updateAssumptionBadges();',
    '  }',
    '  // inc2.1 — condition item append',
    '  function appendConditionItem(item) {',
    '    var container = document.getElementById("condition-items");',
    '    if(!container) return;',
    '    var placeholder = container.querySelector("p");',
    '    if(placeholder) placeholder.remove();',
    '    var typeKey = (item.type || "").toLowerCase().replace(/[^a-z]/g,"");',
    '    var typeClass = ["constraint","dependency","outcome"].indexOf(typeKey) >= 0 ? typeKey : "constraint";',
    '    var cardEl = document.createElement("div");',
    '    cardEl.className = "condition-card";',
    '    cardEl.innerHTML =',
    '      \'<div class="condition-card-meta">\' +',
    '        \'<span class="ci-type-tag ci-type-\' + typeClass + \'">\' + escHtmlClient(item.type || "constraint") + \'</span>\' +',
    '        \'<span class="ci-source">\' + escHtmlClient(item.source || "model") + \'</span>\' +',
    '      \'</div>\' +',
    '      \'<div class="condition-card-text">\' + escHtmlClient(item.text || "") + \'</div>\';',
    '    container.appendChild(cardEl);',
    '  }',
    '  // iwu.5 — nudge bar on lensComplete',
    '  function countUnconfirmedCards() {',
    '    var cards = document.querySelectorAll("#assumption-cards .assumption-card");',
    '    var count = 0;',
    '    for(var i=0;i<cards.length;i++) {',
    '      if(cards[i].getAttribute("data-state") !== "confirmed") count++;',
    '    }',
    '    return count;',
    '  }',
    '  function showNudgeBar(n) {',
    '    var bar = document.getElementById("nudge-bar");',
    '    if(!bar) {',
    '      bar = document.createElement("div");',
    '      bar.id = "nudge-bar";',
    '      bar.setAttribute("role", "alert");',
    '      bar.style.cssText = "padding:8px 16px;background:#FFFBEB;border-top:2px solid #F59E0B;font-size:13px;color:#92400E;display:flex;align-items:center;justify-content:space-between;flex-shrink:0";',
    '      var msg = document.createElement("span");',
    '      msg.id = "nudge-bar-msg";',
    '      var reviewBtn = document.createElement("button");',
    '      reviewBtn.type = "button";',
    '      reviewBtn.id = "nudge-bar-review";',
    '      reviewBtn.textContent = "Review now";',
    '      reviewBtn.style.cssText = "margin-left:12px;font-size:12px;padding:2px 9px;border-radius:4px;border:1px solid #F59E0B;background:transparent;color:#92400E;cursor:pointer;font-weight:500";',
    '      reviewBtn.addEventListener("click", function() {',
    '        var first = document.querySelector(\'#assumption-cards .assumption-card[data-state]:not([data-state="confirmed"])\');',
    '        if(first) {',
    '          first.scrollIntoView({behavior:"smooth",block:"nearest"});',
    '          var chatInput = form ? form.querySelector("textarea[name=answer]") : null;',
    '          if(document.activeElement !== chatInput) { first.focus(); }',
    '        }',
    '        dismissNudgeBar();',
    '      });',
    '      bar.appendChild(msg);',
    '      bar.appendChild(reviewBtn);',
    '      var container = document.getElementById("assumption-cards");',
    '      if(container) container.insertAdjacentElement("beforebegin", bar);',
    '    }',
    '    var msgEl = document.getElementById("nudge-bar-msg");',
    '    if(msgEl) msgEl.textContent = n + " assumption card(s) unreviewed.";',
    '    bar.style.display = "";',
    '  }',
    '  function dismissNudgeBar() {',
    '    var bar = document.getElementById("nudge-bar");',
    '    if(bar) bar.style.display = "none";',
    '  }',
    '  function handleLensComplete() {',
    '    var n = countUnconfirmedCards();',
    '    if(n > 0) { showNudgeBar(n); }',
    '    var lbl = document.getElementById("ac-draft-label");',
    '    if(lbl) { lbl.textContent = "lens complete"; lbl.style.background="#DCFCE7"; lbl.style.color="#166534"; lbl.style.borderColor="#6EE7B7"; }',
    '  }',
    '  function checkAutoDismissNudgeBar() {',
    '    var n = countUnconfirmedCards();',
    '    if(n === 0) { dismissNudgeBar(); }',
    '  }',
    '  document.addEventListener("click", function(e) {',
    '    if(e.target && e.target.classList && e.target.classList.contains("btn-confirm")) {',
    '      setTimeout(checkAutoDismissNudgeBar, 100);',
    '    }',
    '  });',
    '',
    '  form.addEventListener("submit", function(e){',
    '    e.preventDefault();',
    '    var ta = form.querySelector("textarea[name=answer]");',
    '    var answer = ta ? ta.value.trim() : "";',
    '    if(!answer) return;',
    '    appendBubble("user", lightMd(answer));',
    '    if(ta) ta.value = "";',
    '    sendTurn(answer);',
    '  });',
    '})();',
    '</script>'
  ].join('\n');

  var bodyContent = _renderChatView({
    skillName:         skillName,
    skillLabel:        skillName,
    featureSlug:       session.featureSlug || '',
    sessionId:         sessionId,
    questionIndex:     priorQA.length + 1,
    totalQuestions:    Math.max(priorQA.length + (currentQuestion ? 1 : 0), 1),
    currentQuestion:   currentQuestion,
    priorQA:           priorQA,
    draftSections:     draftSections,
    pendingConfirmation: false,
    userInitial:       'M',
    modelLabel:        getActiveModel(),
    contextManifestHtml: buildContextManifestHtml(session.contextFiles || [])
  }) + script;

  // ougl.4 — journey-aware gate-confirm button
  if (session.done && session.journeyId) {
    var safeJourneyId = escHtml(session.journeyId);
    var journeyPanel;
    if (skillName === 'definition-of-ready') {
      journeyPanel = '<div class="sw-journey-gate" style="padding:16px;margin-top:12px">' +
        '<a href="/journey/' + safeJourneyId + '/complete" ' +
        'style="display:inline-block;font-size:14px;font-weight:600;color:#fff;background:var(--ink);padding:8px 18px;border-radius:6px;text-decoration:none">' +
        'View journey complete &#x2192;</a></div>';
    } else {
      var nextStage = _journeyStore.getNextStage(skillName) || 'next stage';
      journeyPanel = '<div class="sw-journey-gate" style="padding:16px;margin-top:12px">' +
        '<form method="POST" action="/api/journey/' + safeJourneyId + '/gate-confirm">' +
        '<button type="submit" class="sw-btn sw-btn--primary">' +
        'Save and continue to ' + escHtml(nextStage) + ' &#x2192;</button>' +
        '</form></div>';
    }
    bodyContent = bodyContent + journeyPanel;
  }

  return renderShell({ title: 'Skill session — ' + escHtml(skillName), bodyContent: bodyContent, user: { login: '' }, active: 'skills' });
}

/**
 * GET /skills/:name/sessions/:id/chat
 * Renders the single-page chat UI. Fires the initial model turn if turns is empty.
 * @param {object} req
 * @param {object} res
 */
async function handleGetChatHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  var skillName = (req.params && req.params.name) || '';
  var sessionId = (req.params && req.params.id) || '';
  var session = _sessionStore.get(sessionId);
  if (!session) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Not Found', bodyContent: '<p>Session not found.</p>', user: { login: '' } }));
    return;
  }
  // Fire initial turn when there is no prior conversation
  if (session.turns.length === 0) {
    var initResponse = '';
    try {
      initResponse = await _skillTurnExecutor(
        session.systemPrompt,
        [],
        'Begin the session. Greet the operator with one short welcoming sentence and ask your single opening question only. Do not list multiple questions.',
        req.session.accessToken
      );
    } catch (err) {
      _logger.warn('handleGetChatHtml initial turn error: ' + (err && err.message ? err.message : 'unknown'));
      initResponse = '';
    }
    session.turns.push({ role: 'assistant', content: initResponse });
  }
  var html = _renderChatPage(skillName, sessionId, session);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/**
 * POST /api/skills/:name/sessions/:id/turn
 * Accepts a user answer, calls htmlSubmitTurn, returns JSON {done, response, artefactContent?}.
 * @param {object} req
 * @param {object} res
 */
async function handlePostTurnHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    _json(res, 401, { error: 'Not authenticated' });
    return;
  }
  var skillName = (req.params && req.params.name) || '';
  var sessionId = (req.params && req.params.id) || '';
  var session = _sessionStore.get(sessionId);

  // wsm.2: journey ownership + concurrent turn protection
  var _linkedJourney = null;
  if (session && session.journeyId) {
    var _jStore = require('../modules/journey-store');
    _linkedJourney = _jStore.getJourney(session.journeyId);
    if (_linkedJourney) {
      // Ownership check — server-side session login only (T3, T8 — body.ownerId is ignored)
      if (_linkedJourney.ownerId && _linkedJourney.ownerId !== (req.session && req.session.login)) {
        _json(res, 403, { error: 'FORBIDDEN' });
        return;
      }
      // Concurrent turn guard (T6)
      if (_linkedJourney.turnInProgress) {
        _json(res, 409, { error: 'Turn already in progress' });
        return;
      }
      _linkedJourney.turnInProgress = true;
    }
  }

  var body = await _readBody(req);
  var answer = (body && typeof body.answer === 'string') ? body.answer : '';
  var result;
  try {
    result = await htmlSubmitTurn(skillName, sessionId, answer, req.session.accessToken);
  } finally {
    if (_linkedJourney) {
      _linkedJourney.turnInProgress = false;
      _linkedJourney.lastActivityAt = Date.now();
    }
  }
  if (!result) {
    _json(res, 404, { error: 'Session not found' });
    return;
  }
  _json(res, 200, result);
}

/**
 * POST /api/skills/:name/sessions/:id/turn-stream
 * Streaming variant: sends SSE chunks as the model generates text.
 * Each SSE event is `data: {"chunk":"..."}\n\n`.
 * Final event: `data: {"done":bool, "artefactContent":"..."}\n\n`.
 * iwu.3: also emits `data: {"assumptionCard":{...}}\n\n` for each ADR-018 marker found.
 */
async function handlePostTurnStreamHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'text/plain' });
    res.end('Not authenticated');
    return;
  }
  var sessionId = (req.params && req.params.id) || '';
  var body = await _readBody(req);
  var rawAnswer = (body && typeof body.answer === 'string') ? body.answer : '';

  var session = _sessionStore.get(sessionId);
  if (!session) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Session not found');
    return;
  }

  res.writeHead(200, {
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection':    'keep-alive'
  });

  // SSE keepalive — send a comment every 15s so browsers/proxies don't drop the connection
  // during long model responses where no chunks are emitted for extended periods.
  var _keepaliveInterval = setInterval(function() {
    try { res.write(':\n\n'); } catch (_) {}
  }, 15000);

  var userContent     = sanitiseAnswer(rawAnswer);
  var historySnapshot = session.turns.slice();
  session.turns.push({ role: 'user', content: userContent });

  // iwu.3: assumption marker buffer — accumulates text to detect cross-chunk markers
  var _assumptionBuf = '';
  var _ASSMP_START   = '---ASSUMPTION-JSON:';
  var _ASSMP_END     = '---';
  var _ASSMP_STRIP_RE = /---ASSUMPTION-JSON:[\s\S]*?---/g;
  // inc2.1: condition marker buffer
  var _conditionBuf  = '';
  var _COND_START    = '---CONDITION-JSON:';
  var _COND_END      = '---';
  var _COND_STRIP_RE = /---CONDITION-JSON:[\s\S]*?---/g;
  // Display buffer — strips markers from chat bubble display, handles cross-chunk markers
  // by holding back text from the marker start until the closing --- arrives.
  var _displayBuf = '';
  var _DISPLAY_STRIP_RE   = /---(?:ASSUMPTION|CONDITION)-JSON:[\s\S]*?---/g;
  var _DISPLAY_PARTIAL_RE = /---(?:ASSUMPTION|CONDITION)-JSON:/;

  var fullText = '';
  try {
    var _artefactAccum  = '';
    var _inArtefactMode = false;
    var _DRAFT_START = '---ARTEFACT-START---';
    var _DRAFT_END   = '---ARTEFACT-END---';
    fullText = await _skillTurnExecutorStream(
      session.systemPrompt,
      historySnapshot,
      userContent,
      req.session.accessToken,
      function onChunk(chunk) {
        // Display buffer: accumulate, strip complete markers, hold back partial markers.
        // This handles markers that span multiple streaming chunks.
        _displayBuf += chunk;
        var _dispClean = _displayBuf.replace(_DISPLAY_STRIP_RE, '');
        // Find the earliest position to hold back from. Three cases:
        //   1. Complete prefix already in buffer (e.g. '---ASSUMPTION-JSON: {' open, no closing --- yet)
        //   2. '---' at tail of clean text, with suffix being a prefix of a marker body
        //      (e.g. buffer ends with '---ASSUMP' or just '---')
        //   3. Trailing '-' or '--' that could be the start of '---'
        var _partialIdx = (function _findPartialStart(s) {
          var full = s.search(_DISPLAY_PARTIAL_RE);
          if (full !== -1) return full;
          var lt = s.lastIndexOf('---');
          if (lt !== -1) {
            var after = s.slice(lt + 3);
            if ('ASSUMPTION-JSON:'.indexOf(after) === 0 || 'CONDITION-JSON:'.indexOf(after) === 0) {
              return lt;
            }
          }
          var dm = s.match(/-{1,2}$/);
          if (dm) { return dm.index; }
          return -1;
        }(_dispClean));
        var _safeDisplay;
        if (_partialIdx === -1) {
          _safeDisplay = _dispClean;
          _displayBuf  = '';
        } else {
          _safeDisplay = _dispClean.slice(0, _partialIdx);
          _displayBuf  = _dispClean.slice(_partialIdx);
        }
        if (_safeDisplay) {
          res.write('data: ' + JSON.stringify({ chunk: _safeDisplay }) + '\n\n');
        }

        // iwu.3: scan for assumption markers in the accumulated buffer
        _assumptionBuf += chunk;
        var _scanBuf = _assumptionBuf;
        var _cleanBuf = '';
        var _startIdx;
        while ((_startIdx = _scanBuf.indexOf(_ASSMP_START)) !== -1) {
          // Possible marker found — look for closing ---
          var _afterStart = _scanBuf.indexOf(_ASSMP_END, _startIdx + _ASSMP_START.length);
          if (_afterStart === -1) { break; } // incomplete marker — wait for more chunks
          // Extract full marker including both ---
          var _markerFull = _scanBuf.slice(_startIdx, _afterStart + _ASSMP_END.length);
          _cleanBuf += _scanBuf.slice(0, _startIdx);
          _scanBuf = _scanBuf.slice(_afterStart + _ASSMP_END.length);
          // Parse and emit if feature flag is enabled
          if (session.assumptionCardsEnabled !== false) {
            var _jsonStr = _markerFull.slice(_ASSMP_START.length).trim();
            if (_jsonStr.endsWith(_ASSMP_END)) {
              _jsonStr = _jsonStr.slice(0, -_ASSMP_END.length).trim();
            }
            try {
              var _payload = JSON.parse(_jsonStr);
              var _cardId  = _deriveCardId(sessionId, _markerFull);
              if (!session.assumptionCards) { session.assumptionCards = {}; }
              session.assumptionCards[_cardId] = Object.assign({}, _payload, { cardId: _cardId, state: 'default' });
              res.write('data: ' + JSON.stringify({
                assumptionCard: {
                  id:       _payload.id       || '',
                  text:     _payload.text     || '',
                  type:     _payload.type     || '',
                  risk:     _payload.risk     || '',
                  knowness: _payload.knowness || '',
                  cardId:   _cardId
                }
              }) + '\n\n');
            } catch (_parseErr) {
              // Malformed JSON inside marker — strip silently, no SSE event
            }
          }
        }
        _assumptionBuf = _cleanBuf + _scanBuf;

        // inc2.1: scan for condition markers — same buffer pattern as assumption markers
        _conditionBuf += chunk;
        var _cScanBuf = _conditionBuf;
        var _cCleanBuf = '';
        var _cStartIdx;
        while ((_cStartIdx = _cScanBuf.indexOf(_COND_START)) !== -1) {
          var _cAfterEnd = _cScanBuf.indexOf(_COND_END, _cStartIdx + _COND_START.length);
          if (_cAfterEnd === -1) { break; }
          var _cMarkerFull = _cScanBuf.slice(_cStartIdx, _cAfterEnd + _COND_END.length);
          _cCleanBuf += _cScanBuf.slice(0, _cStartIdx);
          _cScanBuf = _cScanBuf.slice(_cAfterEnd + _COND_END.length);
          var _cParsed = parseConditionMarker(_cMarkerFull);
          if (_cParsed) {
            if (!session.conditionItems) { session.conditionItems = {}; }
            session.conditionItems[_cParsed.id] = _cParsed;
            res.write('data: ' + JSON.stringify({ conditionItem: {
              id:     _cParsed.id     || '',
              text:   _cParsed.text   || '',
              type:   _cParsed.type   || '',
              source: _cParsed.source || 'model'
            } }) + '\n\n');
          }
        }
        _conditionBuf = _cCleanBuf + _cScanBuf;

        _artefactAccum += chunk;
        if (!_inArtefactMode) {
          var startIdx = _artefactAccum.indexOf(_DRAFT_START);
          if (startIdx !== -1) {
            _inArtefactMode = true;
            var afterStart = _artefactAccum.slice(startIdx + _DRAFT_START.length).replace(/^\r?\n/, '');
            var endIdx = afterStart.indexOf(_DRAFT_END);
            var draftText = endIdx !== -1 ? afterStart.slice(0, endIdx) : afterStart;
            var cleanDraftText = draftText.replace(_COND_STRIP_RE, '');
            if (cleanDraftText) {
              res.write('data: ' + JSON.stringify({ draftChunk: cleanDraftText }) + '\n\n');
            }
          }
        } else {
          var endIdx2 = chunk.indexOf(_DRAFT_END);
          var draftChunk2 = endIdx2 !== -1 ? chunk.slice(0, endIdx2) : chunk;
          var cleanDraftChunk2 = draftChunk2.replace(_COND_STRIP_RE, '');
          if (cleanDraftChunk2) {
            res.write('data: ' + JSON.stringify({ draftChunk: cleanDraftChunk2 }) + '\n\n');
          }
        }
      }
    );
  // Flush any remaining display buffer content (e.g. text after last marker was held back)
  if (_displayBuf) {
    var _finalDisplay = _displayBuf.replace(_DISPLAY_STRIP_RE, '');
    if (_finalDisplay && !_DISPLAY_PARTIAL_RE.test(_finalDisplay)) {
      res.write('data: ' + JSON.stringify({ chunk: _finalDisplay }) + '\n\n');
    }
    _displayBuf = '';
  }
  } catch (err) {
    clearInterval(_keepaliveInterval);
    _logger.warn('handlePostTurnStreamHtml executor error: ' + (err && err.message ? err.message : 'unknown'));
    res.write('data: ' + JSON.stringify({ error: 'Model error — please try again.' }) + '\n\n');
    res.end();
    return;
  }
  clearInterval(_keepaliveInterval);

  var artefactMatch = fullText.match(/---ARTEFACT-START---\s*([\s\S]+?)\s*---ARTEFACT-END---/);
  var slugMatch     = fullText.match(/---SLUG---\s*\n?([\w-]+)/);
  var done = !!artefactMatch;

  if (artefactMatch) {
    session.artefactContent = artefactMatch[1].trim();
    var skillName = (req.params && req.params.name) || '';
    var slug = slugMatch ? slugMatch[1].trim() : new Date().toISOString().slice(0, 10) + '-' + skillName;
    session.artefactPath = 'artefacts/' + slug + '/' + (session.skillName || skillName) + '.md';
    session.done = true;
  }

  session.turns.push({ role: 'assistant', content: fullText });

  res.write('data: ' + JSON.stringify({
    done: done,
    artefactContent: artefactMatch ? session.artefactContent : undefined
  }) + '\n\n');

  // iwu.5: emit lensComplete event when artefact is produced
  if (done) {
    res.write('data: ' + JSON.stringify({ lensComplete: true }) + '\n\n');
  }

  res.end();
}

/**
 * Return the next question for an HTML-flow session, or null when all answered.
 * @param {string} skillName
 * @param {string} sessionId
 * @returns {{question:string, questionIndex:number, totalQuestions:number}|null}
 */
function htmlGetNextQuestion(skillName, sessionId) {
  var session = _sessionStore.get(sessionId);
  if (!session) { return null; }
  var idx = session.answers.length;
  if (idx >= session.questions.length) { return null; }
  var priorQA = session.questions.slice(0, idx).map(function(q, i) {
    return {
      question:      q.text || String(q),
      answer:        session.answers[i] || '',
      modelResponse: (session.modelResponses && session.modelResponses[i] !== undefined)
        ? session.modelResponses[i]
        : null
    };
  });
  // dsq.1: serve dynamic question if available (generated after prior answer), fall back to static
  var staticText  = session.questions[idx].text || String(session.questions[idx]);
  var dynamicText = (session.dynamicQuestions && idx > 0 && session.dynamicQuestions[idx - 1] &&
    typeof session.dynamicQuestions[idx - 1] === 'string' &&
    session.dynamicQuestions[idx - 1].trim().length > 0)
    ? session.dynamicQuestions[idx - 1]
    : null;
  var questionText = dynamicText || staticText;
  return {
    question:       questionText,
    questionIndex:  idx + 1,
    totalQuestions: session.questions.length,
    priorQA:        priorQA
  };
}

/**
 * Record a sanitised answer for an HTML-flow session.
 * Calls the skill-turn executor to generate a model response for the answer.
 * Returns the next URL (either the next question or commit-preview).
 * @param {string} skillName
 * @param {string} sessionId
 * @param {string} rawAnswer
 * @param {string} [token]  — GitHub access token (required for executor call)
 * @returns {Promise<{nextUrl:string}|null>}  null when session not found
 */
async function htmlRecordAnswer(skillName, sessionId, rawAnswer, token) {
  var session = _sessionStore.get(sessionId);
  if (!session) { return null; }

  // dsq.2: if a section draft is pending confirmation, handle the confirm/edit before normal processing
  if (session.pendingConfirmation) {
    if (!session.sectionDrafts) { session.sectionDrafts = []; }
    var trimmedConfirmAnswer = rawAnswer.trim();
    if (trimmedConfirmAnswer.startsWith('edit:')) {
      session.sectionDrafts[session.currentSectionIndex] = trimmedConfirmAnswer.slice('edit:'.length);
    } else {
      // 'confirm' or any other answer → accept the pending draft
      session.sectionDrafts[session.currentSectionIndex] = session.pendingSectionDraft;
    }
    session.pendingConfirmation = false;
    session.pendingSectionDraft = null;
    var donePending = session.answers.length >= session.questions.length;
    var nextUrlConfirm = donePending
      ? '/skills/' + encodeURIComponent(skillName) + '/sessions/' + encodeURIComponent(sessionId) + '/commit-preview'
      : '/skills/' + encodeURIComponent(skillName) + '/sessions/' + encodeURIComponent(sessionId) + '/next';
    return { nextUrl: nextUrlConfirm };
  }

  var answerIndex = session.answers.length;
  session.answers.push(sanitiseAnswer(rawAnswer));

  // Build priorQA for context (all answers before the current one)
  var priorQA = session.questions.slice(0, answerIndex).map(function(q, i) {
    return {
      question:      q.text || String(q),
      answer:        session.answers[i] || '',
      modelResponse: (session.modelResponses && session.modelResponses[i] !== undefined)
        ? session.modelResponses[i]
        : null
    };
  });

  // Build role-framed system prompt: prepend coaching instructions so the model
  // knows to comment on answers rather than execute the full skill.
  var EXECUTOR_ROLE_FRAMING =
    'You are an expert analyst running a structured pipeline skill session.\n' +
    'After each answer, respond with 2–3 sentences that:\n' +
    '- Make a specific observation about what the operator\'s answer reveals (not a generic acknowledgment)\n' +
    '- Surface any tension, assumption, or gap implied by the answer in the context of the skill instructions below\n' +
    '- Give a concrete prompt or consideration that will sharpen the operator\'s thinking for the next question\n\n' +
    'Be direct and incisive. Never start with \'Acknowledged\', \'Great\', or any filler. Do not describe yourself or your role.\n\n' +
    '--- SKILL INSTRUCTIONS ---\n\n';

  var NEXT_Q_ROLE_FRAMING =
    'You are a skilled interviewer running a structured discovery session.\n' +
    'Based on the conversation so far and the skill instructions, generate a single follow-up question.\n' +
    'The question must:\n' +
    '- Build directly on what the operator has shared\n' +
    '- Probe a gap, assumption, or constraint not yet addressed\n' +
    '- Be concise and specific to their context\n\n' +
    'Output ONLY the question text. No preamble, no explanation, no numbering.\n\n' +
    '--- SKILL INSTRUCTIONS ---\n\n';

  // Include the question that was just answered so the model has full context.
  var _currentQ = session.questions[answerIndex];
  var _currentQText = _currentQ ? (_currentQ.text || String(_currentQ)) : '';
  var _answerWithContext = _currentQText
    ? 'Q: ' + _currentQText + '\n\nA: ' + session.answers[answerIndex]
    : session.answers[answerIndex];

  // Call the skill-turn executor; on any error, record null (AC2)
  var modelResponse = null;
  try {
    modelResponse = await _skillTurnExecutor(
      EXECUTOR_ROLE_FRAMING + (session.skillContent || ''),
      priorQA,
      _answerWithContext,
      token || ''
    );
  } catch (_err) {
    // Log error message only — never log the token
    _logger.warn('skillTurnExecutor error (AC2 null path): ' + (_err && _err.message ? _err.message : 'unknown'));
    modelResponse = null;
  }
  if (!session.modelResponses) { session.modelResponses = []; }
  session.modelResponses[answerIndex] = modelResponse;

  // dsq.1 — call next-question executor to generate a dynamic follow-up question.
  // Stored at dynamicQuestions[answerIndex] so htmlGetNextQuestion can serve it at idx answerIndex+1.
  var NEXT_Q_INSTRUCTION = 'Given the skill instructions and the conversation so far, what is the single best next question to ask the operator?';
  var dynamicNextQ = null;
  try {
    var nqHistory = session.questions.slice(0, answerIndex).map(function(q, i) {
      return {
        question:      q.text || String(q),
        answer:        session.answers[i] || '',
        modelResponse: session.modelResponses[i] !== undefined ? session.modelResponses[i] : null
      };
    });
    nqHistory.push({ question: _currentQText, answer: session.answers[answerIndex], modelResponse: null });
    dynamicNextQ = await _nextQuestionExecutor(
      NEXT_Q_ROLE_FRAMING + (session.skillContent || ''),
      nqHistory,
      NEXT_Q_INSTRUCTION,
      token || ''
    );
  } catch (_nqErr) {
    _logger.warn('nextQuestionExecutor error (fallback to static): ' + (_nqErr && _nqErr.message ? _nqErr.message : 'unknown'));
    dynamicNextQ = null;
  }
  if (!session.dynamicQuestions) { session.dynamicQuestions = []; }
  if (dynamicNextQ && typeof dynamicNextQ === 'string' && dynamicNextQ.trim().length > 0) {
    session.dynamicQuestions[answerIndex] = dynamicNextQ;
  }

  // dsq.2: detect section boundary — if the answered question is the last in a named section,
  // call _sectionDraftExecutor to synthesise a draft and put the session in pending confirmation.
  if (session.sections && session.sections.length > 0) {
    var answeredQ = session.questions[answerIndex];
    for (var _si = 0; _si < session.sections.length; _si++) {
      var _sec = session.sections[_si];
      if (!_sec.heading) { continue; } // AC7: skip flat/unnamed sections
      var _secQs = _sec.questions;
      if (!_secQs || _secQs.length === 0) { continue; }
      var _lastSecQ = _secQs[_secQs.length - 1];
      // Match by object identity (T3.1 shares same objects) or by id (defensive fallback)
      if (_lastSecQ === answeredQ || (_lastSecQ && answeredQ && _lastSecQ.id && _lastSecQ.id === answeredQ.id)) {
        // Collect all Q&A pairs for this section
        var _secQaPairs = _secQs.map(function(q) {
          var globalIdx = session.questions.indexOf(q);
          if (globalIdx === -1) {
            for (var x = 0; x < session.questions.length; x++) {
              if (session.questions[x] && q && session.questions[x].id === q.id) { globalIdx = x; break; }
            }
          }
          return { question: q.text || String(q), answer: session.answers[globalIdx] || '' };
        });
        var _secInstruction = 'Synthesise the operator\'s answers into a concise draft of the ' + _sec.heading + ' section for the artefact.';
        var _draftText = null;
        try {
          _draftText = await _sectionDraftExecutor(_sec.heading, _secQaPairs, _secInstruction, token || '');
        } catch (_draftErr) {
          // AC5: silent fallback — log only, do not propagate
          _logger.warn('sectionDraftExecutor error (fallback): ' + (_draftErr && _draftErr.message ? _draftErr.message : 'unknown'));
          _draftText = null;
        }
        if (_draftText && typeof _draftText === 'string' && _draftText.trim().length > 0) {
          session.pendingConfirmation = true;
          session.pendingSectionDraft = _draftText;
          session.currentSectionIndex = _si;
          var doneDraft = session.answers.length >= session.questions.length;
          var nextUrlDraft = doneDraft
            ? '/skills/' + encodeURIComponent(skillName) + '/sessions/' + encodeURIComponent(sessionId) + '/commit-preview'
            : '/skills/' + encodeURIComponent(skillName) + '/sessions/' + encodeURIComponent(sessionId) + '/next';
          return { nextUrl: nextUrlDraft, pendingDraft: true, draftText: _draftText };
        }
        break; // Only one section boundary can be crossed per answer
      }
    }
  }

  var done = session.answers.length >= session.questions.length;
  var nextUrl = done
    ? '/skills/' + encodeURIComponent(skillName) + '/sessions/' + encodeURIComponent(sessionId) + '/complete'
    : '/skills/' + encodeURIComponent(skillName) + '/sessions/' + encodeURIComponent(sessionId) + '/next';
  return { nextUrl: nextUrl };
}

/**
 * Render the "Draft complete" interstitial page.
 * In the model-first flow, session.done is set when the model outputs the artefact signal.
 * @param {string} skillName
 * @param {string} sessionId
 * @returns {string} HTML
 */
function htmlGetCompletePage(skillName, sessionId) {
  var session = _sessionStore.get(sessionId);
  var isDone = session ? session.done : false;
  var commitPreviewUrl = '/skills/' + encodeURIComponent(skillName) + '/sessions/' + encodeURIComponent(sessionId) + '/commit-preview';
  var bodyContent =
    '<h2>Draft complete</h2>' +
    '<p>Skill: <strong>' + escHtml(skillName) + '</strong></p>' +
    (isDone ? '<p>Artefact is ready.</p>' : '<p>Session in progress.</p>') +
    '<p><a href="' + escHtml(commitPreviewUrl) + '">Commit artefact</a></p>' +
    '<p style="margin-top:1rem"><a href="/skills/clarify">Run /clarify first</a></p>';
  return renderShell({ title: 'Draft complete', bodyContent: bodyContent, user: { login: '' } });
}

/**
 * Return the model-produced artefact content and path for an HTML-flow session.
 * mfc.1 — reads session.artefactContent / session.artefactPath set by htmlSubmitTurn.
 * @param {string} skillName
 * @param {string} sessionId
 * @returns {{artefactContent:string, artefactPath:string}}
 */
function htmlGetPreview(skillName, sessionId) {
  var session = _sessionStore.get(sessionId);
  if (!session) { return { artefactContent: '', artefactPath: '' }; }
  return {
    artefactContent: session.artefactContent || '',
    artefactPath:    session.artefactPath    || ''
  };
}

/**
 * Commit the artefact for an HTML-flow session to GitHub.
 * @param {string} skillName
 * @param {string} sessionId
 * @param {string} token  — GitHub access token
 * @param {{login:string, email:string}} identity
 * @returns {Promise<{artefactPath:string}>}
 */
async function htmlCommitSession(skillName, sessionId, token, identity) {
  var preview = htmlGetPreview(skillName, sessionId);
  var commitMsg = 'feat: add ' + skillName + ' session artefact';
  await commitArtefact(preview.artefactPath, preview.artefactContent, commitMsg, token, identity);
  return { artefactPath: preview.artefactPath };
}

/**
 * POST /api/skills/:name/sessions/:id/assumption/:cardId/confirm
 * Confirms or flags an assumption card in the session.
 * Returns 200 { cardId, state } on success.
 * Returns 400 if cardId format is invalid (path traversal guard) or action is invalid.
 * Returns 401 if not authenticated.
 * Returns 404 if session not found, or cardId not in session.assumptionCards.
 * SECURITY: error response bodies must not contain session state fields.
 */
async function handlePostAssumptionConfirm(req, res) {
  if (!req.session || !req.session.accessToken) {
    _json(res, 401, { error: 'Not authenticated' });
    return;
  }

  var cardId    = (req.params && req.params.cardId) || '';
  var sessionId = (req.params && req.params.id)     || '';

  // cardId path traversal / format guard (MANDATORY — OWASP)
  if (!/^[0-9a-f]{8}$/.test(cardId)) {
    _json(res, 400, { error: 'INVALID_CARD_ID' });
    return;
  }

  var session = _sessionStore.get(sessionId);
  if (!session) {
    _json(res, 404, { error: 'SESSION_NOT_FOUND' });
    return;
  }

  var cards = session.assumptionCards;
  if (!cards || !cards[cardId]) {
    _json(res, 404, { error: 'CARD_NOT_FOUND' });
    return;
  }

  var body   = await _readBody(req);
  var action = body && body.action;
  if (action !== 'confirm' && action !== 'flag') {
    _json(res, 400, { error: 'INVALID_ACTION' });
    return;
  }

  cards[cardId].state = action === 'confirm' ? 'confirmed' : 'flagged';

  _json(res, 200, { cardId: cardId, state: cards[cardId].state });
}

module.exports = {
  handleGetSkills, handlePostSession, handlePostAnswer, handleGetSessionState,
  handleCommitArtefact, handleResumeSession, setLogger, NO_LICENCE_MSG,
  // wuce.23 HTML handlers
  handleGetSkillsHtml, handlePostSkillSessionHtml,
  setListSkills, setCreateSession, setSkillsAuditLogger,
  // wuce.24 HTML handlers (kept for backward compat routing)
  handleGetQuestionHtml, handlePostAnswerHtml,
  setGetNextQuestion, setSubmitAnswer, setQuestionAuditLogger,
  // wuce.25 HTML handlers
  handleGetCommitPreviewHtml, handlePostCommitHtml, handleGetResultHtml,
  setGetCommitPreview, setCommitSession, setGetCommitResult, setCommitAuditLogger,
  // HTML-flow session helpers
  registerHtmlSession, htmlGetNextQuestion, htmlGetPreview, htmlCommitSession,
  // mfc.1 — chat architecture handlers
  handleGetChatHtml, handlePostTurnHtml,
  htmlSubmitTurn, buildSystemPrompt,
  // wuce.26 — test helpers + skill-turn executor adapter setter
  _getHtmlSession, _setHtmlSession, _listHtmlSessions, setSkillTurnExecutorAdapter,
  // wsm.1 — disk session writer injectable
  setSessionStore,
  // ougl.2 — journey session link
  linkSessionToJourney,
  // mfc.3 — streaming turn handler + adapter setter
  handlePostTurnStreamHtml, setSkillTurnExecutorStreamAdapter,
  // dsq.1/dsq.2 — backward-compat no-op setters (AC9 — mfc.1)
  setNextQuestionExecutorAdapter,
  setSectionDraftExecutorAdapter,
  // dsq.3 — complete page
  htmlGetCompletePage,
  // iwu.1 — context manifest builder (exported for testing)
  buildContextManifestHtml,
  // iwu.3 — assumption card helpers
  parseAssumptionMarker,
  buildAssumptionCardHtml,
  // inc2.1 — condition marker parser
  parseConditionMarker,
  // inc4 — canvas output panel
  parseCanvasBlock,
  // iwu.4 — confirm/flag endpoint
  handlePostAssumptionConfirm
};
